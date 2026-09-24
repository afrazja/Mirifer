/**
 * Lesson Controller — imperative state machine that orchestrates the lesson flow.
 * Ported from app.js processNextStep(), handleVoiceInput(), manualNext(), etc.
 *
 * This controller manages:
 * - Lesson initialization and state loading
 * - Step-by-step lesson progression with audio sequences
 * - Voice input evaluation
 * - Exam and review mode orchestration
 * - Session abort pattern (sessionID) for safe async cancellation
 */

import { get } from 'svelte/store';
import { appStore, type AppState, type CompletedLesson } from '$stores/app';
import { preferencesStore, type PreferencesState, type Language } from '$stores/preferences';
import { lessonStore, type Lesson, type Sentence } from '$stores/lesson';
import { examStore, type ExamQuestion, type WrongAnswer } from '$stores/exam';
import {
	loadLesson,
	loadLessons,
	loadGlossary,
	getLesson,
	getLessonIndex,
	hasLesson,
	resolveResumePoint,
	getTotalLessons
} from '$services/lesson-loader';
import { isUnlocked, unlockedBy, isWeekUnlocked } from '$services/lesson-access';
import { getLanguage, getVoiceSpeed, getCompletedLessons, getProgress, saveProgress, saveCompletedLessons } from '$services/data-layer';
import { recordSRAttempt, getDueReviewItems, removeFromReview } from '$services/spaced-repetition';
import {
	computeReadiness,
	recordPracticeResult,
	type ReadinessModule
} from '$services/readiness';
import { removeBookmark } from '$services/data-layer';
import { trackEvent, openLessonAttempt, setAnalyticsStep, completeLessonAttempt, trackObstacle, pauseLessonAnalytics } from '$services/analytics';
import { makeWordHighlighter } from '$utils/word-timing';
import { playAudioPromise, stopAllAudio } from '$services/tts';
import { playTone } from '$services/audio-context';
import { lessonMinutes, countLessonContent } from '$services/lesson-duration';
import { matchVoiceInput, bestVoiceMatch, getWordMatchStatus } from '$utils/text-matching';
import { diagnose, type SoundNote } from './pronunciation';
import { getLastVoiceAlternatives } from '$services/speech';
import { getTranslation, getTranslationLang } from '$utils/i18n';
import { wait } from '$utils/wait';
import { saveExamResult } from '$services/data-layer';
import { logError } from '$utils/error';

// ============ EVENT CALLBACKS ============
// The controller emits events via callbacks that the Svelte page listens to.

export interface LessonCallbacks {
	onTeachStep: (step: TeachStepData) => void;
	/** Pre-dialogue warm-up: today's words and collocations. null clears it. */
	onWarmUp?: (data: WarmUpData | null) => void;
	/** End-of-lesson grammar moment; null clears it. */
	onGrammarMoment?: (data: GrammarMomentData | null) => void;
	onCompletionCard: (data: CompletionCardData) => void;
	onAnswerPrompt: (message: string) => void;
	onMessageBubble: (step: Sentence) => void;
	onScriptHighlight: (index: number) => void;
	onScriptMarkDone: (index: number) => void;
	onExamQuestion: (data: ExamQuestionData) => void;
	onExamFinished: (data: ExamResultsData) => void;
	onExamProgress: (current: number, total: number) => void;
	onSystemMessage: (text: string) => void;
	onClearChat: () => void;
	onVoiceResult: (result: VoiceResultData) => void;
	/** Index of the German word currently being spoken (-1 = none). */
	onSpokenWord?: (index: number) => void;
	/** Conversation mode: reply choices for the user's turn (null = hide). */
	onConversationOptions?: (options: ConvOption[] | null) => void;
}

export interface ConvOption {
	german: string;
	translation: string;
}

export interface TeachStepData {
	germanText: string;
	translationText: string;
	englishTranslation: string;
	language: Language;
	isBlindMode: boolean;
	role: 'received' | 'sent';
	hint?: string;
	hintFa?: string;
	difficulty?: string;
}

/**
 * The building blocks for today, shown before the conversation starts.
 *
 * Pre-teach then encounter in context: every item here appears in the
 * dialogue that follows, so this lowers the load of the conversation rather
 * than adding to it. Collocations are deliberately whole — a learner who
 * decomposes "Freut mich" into freuen + mich will never say it naturally.
 */
export interface WarmUpData {
	language: Language;
	words: Array<{ de: string; gloss: string }>;
	collocations: Array<{ de: string; gloss: string }>;
}

export interface GrammarMomentData {
	language: Language;
	title: string;
	explanation: string;
	examples: Array<{ de: string; gloss?: string }>;
	/** Basics category to deep-link into, when the note names one. */
	basicsKey?: string;
}

export interface CompletionCardData {
	language: Language;
	nextDay: number | null;
	nextLessonTitle: string | null;
	wasAlreadyCompleted: boolean;
	/** Goethe readiness (0–100) before/after this completion; null when the
	 *  computation failed — the card simply omits the readiness row then. */
	readinessBefore: number | null;
	readinessAfter: number | null;
}

export interface ExamQuestionData {
	type: 'listen' | 'speak' | 'meaning' | 'gap';
	prompt: string;
	target: string;
	translation?: string;
	questionNumber: number;
	totalQuestions: number;
	language: Language;
	/** Tap-to-answer questions ('meaning' / 'gap'). */
	options?: string[];
	correctIndex?: number;
}

export interface ExamResultsData {
	score: number;
	total: number;
	percentage: number;
	wasReview: boolean;
	language: Language;
	wrongAnswers: WrongAnswer[];
	examWeek: number;
}

export interface VoiceResultData {
	isCorrect: boolean;
	transcript: string;
	matchPercentage: number;
	matchedWordIndices?: boolean[];
	/**
	 * Sounds the learner got wrong, when the error is one we can name.
	 * Usually empty — most mispronunciation is repaired by the recognizer
	 * before it reaches us, and guessing would send the learner after a
	 * sound that was fine.
	 */
	soundNotes?: SoundNote[];
	/**
	 * Target words that did not come back at all, in their written form.
	 * Weaker evidence than soundNotes — we know something went wrong and not
	 * what — but the learner knows which word they were reaching for even
	 * when we cannot say why it failed.
	 */
	missedWords?: string[];
}

// ============ CONTROLLER ============

let callbacks: LessonCallbacks | null = null;

/** Guards the end-of-lesson grammar moment so it shows once per lesson visit. */
let grammarMomentShown = false;

/** Same, for the warm-up at the start of the lesson. */
let warmUpShown = false;

/**
 * When the current lesson was opened. The duration estimate on the dashboard
 * is a promise about effort, and the only way to know whether it is honest is
 * to measure the real thing — logged on completion, compared to the estimate.
 */
let lessonStartedAt = 0;

export function setCallbacks(cb: LessonCallbacks) {
	callbacks = cb;
}

/**
 * Dismiss the warm-up and open the conversation. Called by the lesson page
 * when the learner has been through today's building blocks.
 */
export async function continueAfterWarmUp(): Promise<void> {
	callbacks?.onWarmUp?.(null);
	await processNextStep();
}

/**
 * Dismiss the grammar moment and fall through to the completion card.
 * Called by the lesson page when the learner taps continue.
 */
export async function continueAfterGrammar(): Promise<void> {
	callbacks?.onGrammarMoment?.(null);
	const app = get(appStore);
	const prefs = get(preferencesStore);
	const lesson = get(lessonStore).currentLesson;
	if (!lesson) return;
	await handleLessonCompletion(lesson, app, prefs);
}

/** Get the current session ID for abort checking */
function getSessionID(): number {
	return get(appStore).sessionID;
}

/** Increment session ID to abort running async sequences */
export function incrementSession(): void {
	// Any mode switch ends a running conversation.
	deactivateConversation();
	appStore.update((s) => ({ ...s, sessionID: s.sessionID + 1 }));
}

/** Check if a day is unlocked (Day 1 always open, Day N requires Day N-1 completed) */
export function isDayUnlocked(day: number): boolean {
	const d = parseInt(String(day));
	if (d === 1) return true;
	const completed = get(appStore).completedLessons;
	return !!(completed && completed[d - 1]);
}

// ============ INITIALIZATION ============

export async function initLesson(requestedDay?: number): Promise<void> {
	deactivateConversation(); // stale state from a previous page visit
	grammarMomentShown = false;
	warmUpShown = false;
	try {
		// Load saved language preference
		const savedLang = await getLanguage();
		if (savedLang === 'fa' || savedLang === 'en') {
			preferencesStore.update((s) => ({ ...s, language: savedLang as Language }));
		}

		// Load voice speed
		const savedSpeed = await getVoiceSpeed();
		if (savedSpeed !== null) {
			preferencesStore.update((s) => ({ ...s, voiceSpeed: savedSpeed }));
		}

		// Load index, saved progress, and completed lessons in parallel.
		// getLessonIndex() must run before hasLesson() — it populates the index cache.
		const [, savedProgress, completedLessons] = await Promise.all([
			getLessonIndex(),
			getProgress(),
			getCompletedLessons()
		]);

		// Determine current day and sentence index. Mid-lesson progress resumes
		// exactly; otherwise the lowest not-yet-completed day wins (see
		// resolveResumePoint for the rationale).
		const resume = resolveResumePoint(savedProgress, completedLessons, requestedDay);
		const currentDay = resume.day;
		let currentSentenceIndex = resume.sentenceIndex;
		const xp = savedProgress?.xp || 0;

		if (resume.allDone) {
			// Every lesson completed — show the completion card for the last day.
			const lesson = getLesson(currentDay);
			currentSentenceIndex = lesson ? lesson.sentences.length : 0;
		}

		appStore.update((s) => ({
			...s,
			currentDay,
			currentSentenceIndex,
			xp,
			completedLessons: completedLessons || {}
		}));

		// Load current lesson and glossary
		lessonStore.update((s) => ({ ...s, isLoading: true }));
		const [lesson, glossary] = await Promise.all([loadLesson(currentDay), loadGlossary()]);

		lessonStore.update((s) => ({
			...s,
			currentLesson: lesson,
			glossary: glossary || {},
			isLoading: false
		}));

		// Analytics: a lesson session opened (fire-and-forget).
		lessonStartedAt = Date.now();
		openLessonAttempt(currentDay, currentSentenceIndex, false, lesson?.sentences);
		if (!lesson) trackObstacle('lesson_load_failed', { mode: 'lesson' });
	} catch (e) {
		trackObstacle('lesson_load_failed');
		logError('lesson-controller:initLesson', e);
		lessonStore.update((s) => ({ ...s, isLoading: false }));
		callbacks?.onSystemMessage(
			'Failed to load lesson data. Please check your connection and refresh.'
		);
	}
}

// ============ LESSON FLOW ============

export async function processNextStep(skipAudio = false): Promise<void> {
	const mySessionID = getSessionID();
	const app = get(appStore);
	const prefs = get(preferencesStore);
	const lessonState = get(lessonStore);
	const lesson = lessonState.currentLesson;

	if (!lesson) return;

	// Warm-up: today's words and collocations, before the conversation opens.
	// Only at the very start, only once, and only when the lesson actually
	// carries them — A2 upward has no words, and un-migrated content has
	// neither, in which case the lesson simply begins as it always did.
	if (
		!warmUpShown &&
		app.currentSentenceIndex === 0 &&
		callbacks?.onWarmUp &&
		((lesson.words?.length ?? 0) > 0 || (lesson.collocations?.length ?? 0) > 0)
	) {
		warmUpShown = true;
		stopAllAudio();
		const isFa = prefs.language === 'fa';
		const gloss = (c: { en: string; fa: string }) => (isFa ? c.fa : c.en) || c.en || c.fa;
		callbacks.onWarmUp({
			language: prefs.language,
			words: (lesson.words ?? []).map((w) => ({ de: w.de, gloss: gloss(w) })),
			collocations: (lesson.collocations ?? []).map((c) => ({ de: c.de, gloss: gloss(c) }))
		});
		return; // continueAfterWarmUp() starts the dialogue
	}

	// Lesson complete?
	if (app.currentSentenceIndex >= lesson.sentences.length) {
		pauseLessonAnalytics();
		// Grammar moment first (once per visit): the learner has just used the
		// pattern, so this consolidates rather than front-loads. Only when the
		// lesson has a note and the page can render it.
		if (lesson.grammarNote && !grammarMomentShown && callbacks?.onGrammarMoment) {
			grammarMomentShown = true;
			stopAllAudio();
			const n = lesson.grammarNote;
			const isFa = prefs.language === 'fa';
			callbacks.onGrammarMoment({
				language: prefs.language,
				title: (isFa && n.titleFa) || n.title,
				explanation: (isFa && n.explanationFa) || n.explanation,
				examples: (n.examples || []).map((ex) => ({
					de: ex.de,
					gloss: (isFa ? ex.fa : ex.en) || ex.en || ex.fa
				})),
				basicsKey: n.basicsKey
			});
			return; // continueAfterGrammar() resumes into the completion card
		}
		await handleLessonCompletion(lesson, app, prefs);
		return;
	}

	const currentStep = lesson.sentences[app.currentSentenceIndex];
	const germanText = currentStep.role === 'received' ? currentStep.audioText! : currentStep.targetText!;
	const translationText = getTranslation(currentStep, prefs.language);

	// Fired where the sentence is presented rather than where the index
	// advances, so it records what the learner SAW. The two differ on
	// resume: reopening a half-finished lesson advances nothing, and someone
	// who comes back to sentence four and leaves again should still count as
	// having reached four.
	setAnalyticsStep(app.currentSentenceIndex);
	void trackEvent('lesson_progress', {
		day: app.currentDay,
		metadata: { index: app.currentSentenceIndex, total: lesson.sentences.length, mode: 'lesson' }
	});

	// Highlight script
	callbacks?.onScriptHighlight(app.currentSentenceIndex);

	// Show teach bubble
	callbacks?.onTeachStep({
		germanText,
		translationText,
		englishTranslation: currentStep.translation,
		language: prefs.language,
		isBlindMode: prefs.blindMode,
		role: currentStep.role,
		hint: currentStep.hint,
		hintFa: currentStep.hintFa,
		difficulty: currentStep.difficulty
	});

	if (!skipAudio) {
		// Audio sequence: translation → pause → German
		await playAudioPromise(translationText, 1, getTranslationLang(prefs.language));
		if (getSessionID() !== mySessionID) return;
		await wait(300);
		if (getSessionID() !== mySessionID) return;

		const highlight = makeWordHighlighter(germanText, (i) => callbacks?.onSpokenWord?.(i));
		await playAudioPromise(
			germanText,
			1,
			'de-DE',
			highlight,
			currentStep.role === 'received' ? 'b' : 'a'
		);
		callbacks?.onSpokenWord?.(-1); // clear highlight when audio finishes
		if (getSessionID() !== mySessionID) return;
	}

	// Prompt user
	const promptMsg =
		prefs.language === 'fa'
			? 'برای تمرین 🎙️ را بزنید یا بعدی.'
			: 'Tap 🎙️ to practice or Next to skip.';
	callbacks?.onAnswerPrompt(promptMsg);
}

async function handleLessonCompletion(
	lesson: Lesson,
	app: AppState,
	prefs: PreferencesState
): Promise<void> {
	const wasAlreadyCompleted = !!(app.completedLessons && app.completedLessons[app.currentDay]);

	if (!wasAlreadyCompleted) {
		const doneMsg = prefs.language === 'fa' ? '\u0622\u0641\u0631\u06CC\u0646! \u062F\u0631\u0633 \u062A\u0645\u0648\u0645 \u0634\u062F.' : 'Great job! You finished the lesson.';
		playAudioPromise(doneMsg, 1.0, getTranslationLang(prefs.language));
	}

	// Readiness before this completion — for the delta on the card. Computed
	// against the pre-save map so the cloud write can't race the read.
	let readinessBefore: number | null = null;
	try {
		readinessBefore = (await computeReadiness(app.completedLessons || {})).overall;
	} catch {
		// Card just omits the readiness row.
	}

	// Mark as completed
	const updatedCompleted = { ...app.completedLessons };
	updatedCompleted[app.currentDay] = {
		completedAt: Date.now(),
		sentenceCount: lesson.sentences.length
	};

	app.xp += 50; // Bonus for finishing a lesson
	appStore.update((s) => ({ ...s, completedLessons: updatedCompleted, xp: app.xp }));
	await saveProgress(app.currentDay, app.currentSentenceIndex, app.xp);
	await saveCompletedLessons(updatedCompleted);

	completeLessonAttempt(app.currentDay, lesson.sentences.length, wasAlreadyCompleted);

	// Analytics: only count the first time a lesson is completed.
	if (!wasAlreadyCompleted) {
		// actualSeconds next to estimateMinutes is the whole point: after a
		// week of real completions the per-item costs in lesson-duration can
		// be corrected from data instead of argued about.
		const actualSeconds = lessonStartedAt ? Math.round((Date.now() - lessonStartedAt) / 1000) : null;
		void trackEvent('lesson_completed', {
			day: app.currentDay,
			metadata: {
				sentenceCount: lesson.sentences.length,
				estimateMinutes: lessonMinutes(lesson),
				actualSeconds,
				content: countLessonContent(lesson)
			}
		});
	}

	// Determine next day
	const nextDay = app.currentDay + 1;
	const hasNextLesson = hasLesson(nextDay);
	let nextLessonTitle: string | null = null;
	if (hasNextLesson) {
		const nextLessonData = getLesson(nextDay) || (await loadLesson(nextDay));
		if (nextLessonData) {
			nextLessonTitle =
				prefs.language === 'fa' && nextLessonData.titleFa
					? nextLessonData.titleFa
					: nextLessonData.title;
		}
	}

	// Readiness after — same SR data, updated completion map.
	let readinessAfter: number | null = null;
	try {
		readinessAfter = (await computeReadiness(updatedCompleted)).overall;
	} catch {
		readinessBefore = null; // show both or neither
	}

	callbacks?.onCompletionCard({
		language: prefs.language,
		nextDay: hasNextLesson ? nextDay : null,
		nextLessonTitle,
		wasAlreadyCompleted,
		readinessBefore,
		readinessAfter
	});
}

// ============ USER ACTIONS ============

export async function manualNext(): Promise<void> {
	const app = get(appStore);
	const lessonState = get(lessonStore);
	const lesson = lessonState.currentLesson;
	if (!lesson) return;

	const currentStep = lesson.sentences[app.currentSentenceIndex];
	if (!currentStep) return;

	// Stop everything
	stopAllAudio();

	void trackEvent('step_skipped', { day: app.currentDay, metadata: { index: app.currentSentenceIndex, mode: 'lesson' } });

	// Add message bubble for skipped step
	callbacks?.onMessageBubble(currentStep);

	// Mark done and advance
	callbacks?.onScriptMarkDone(app.currentSentenceIndex);
	const nextIndex = app.currentSentenceIndex + 1;
	app.xp += 5; // Half points for manually skipping
	appStore.update((s) => ({ ...s, currentSentenceIndex: nextIndex, xp: app.xp }));
	await saveProgress(app.currentDay, nextIndex, app.xp);
	processNextStep();
}

/**
 * Advance from the completion card to tomorrow's lesson.
 *
 * Deliberately NOT behind the isUnlocked guard that changeDay carries, and
 * it does not need to be: this is only reachable from the completion card,
 * whose nextDay is currentDay + 1, and handleLessonCompletion has already
 * written currentDay into completedLessons by the time the card renders. The
 * frontier has moved before this can be pressed.
 *
 * Adding the guard here would be the riskier choice, not the safer one — if
 * that ordering ever slipped it would block the single button the whole
 * progression depends on.
 */
export async function goToNextDay(nextDay: number): Promise<void> {
	incrementSession();
	stopAllAudio();
	grammarMomentShown = false; // each day gets its own grammar moment
	warmUpShown = false; // …and its own warm-up

	appStore.update((s) => ({
		...s,
		currentDay: nextDay,
		currentSentenceIndex: 0
	}));

	const exam = get(examStore);
	if (exam.isExamMode) {
		examStore.update((s) => ({ ...s, isExamMode: false, isReviewMode: false }));
	}

	await saveProgress(nextDay, 0, get(appStore).xp);
	const lesson = await loadLesson(nextDay);
	openLessonAttempt(nextDay, 0, true, lesson?.sentences);
	void trackEvent('lesson_begun', { day: nextDay, metadata: { entry: 'next_day' } });
	if (!lesson) trackObstacle('lesson_load_failed', { mode: 'lesson' });
	lessonStore.update((s) => ({ ...s, currentLesson: lesson, isLoading: false }));

	callbacks?.onClearChat();
	processNextStep();
}

export async function jumpToSentence(index: number): Promise<void> {
	incrementSession();
	stopAllAudio();

	appStore.update((s) => ({ ...s, currentSentenceIndex: index }));
	callbacks?.onClearChat();
	processNextStep();
}

export async function changeDay(day: number): Promise<void> {
	const app = get(appStore);
	if (day === app.currentDay && !get(examStore).isExamMode) return;

	// A disabled <option> is presentation, not enforcement: the picker can be
	// bypassed with devtools, and other call sites reach this function
	// without going through it at all. The rule belongs where the day
	// actually changes.
	if (!isUnlocked(day, app.completedLessons)) {
		const needed = unlockedBy(day, app.completedLessons);
		const isFa = get(preferencesStore).language === 'fa';
		callbacks?.onSystemMessage(
			isFa
				? `این روز هنوز باز نشده است — اول روز ${needed} را تمام کن.`
				: `Day ${day} is not open yet — finish day ${needed} first.`
		);
		return;
	}

	incrementSession();
	stopAllAudio();
	grammarMomentShown = false; // each day gets its own grammar moment
	warmUpShown = false; // …and its own warm-up

	examStore.update((s) => ({ ...s, isExamMode: false, isReviewMode: false }));

	// Check if this day is completed
	const completedLessons = app.completedLessons;
	// loadLesson, NOT getLesson: getLesson reads localStorage first and never
	// touches the network, so switching to a day the learner had cached served
	// the pre-migration copy forever. loadLesson is network-first with the
	// cache as its offline fallback, which is the behaviour this wants.
	const selectedLesson = await loadLesson(day);
	openLessonAttempt(day, 0, true, selectedLesson?.sentences);
	void trackEvent('lesson_begun', { day, metadata: { entry: 'day_picker' } });
	if (!selectedLesson) trackObstacle('lesson_load_failed', { mode: 'lesson' });

	appStore.update((s) => ({
		...s,
		currentDay: day,
		currentSentenceIndex: 0
	}));

	await saveProgress(day, 0, get(appStore).xp);
	lessonStore.update((s) => ({ ...s, currentLesson: selectedLesson, isLoading: false }));

	callbacks?.onClearChat();
	processNextStep();
}

export async function changeLanguage(lang: Language): Promise<void> {
	incrementSession();
	stopAllAudio();

	preferencesStore.update((s) => ({ ...s, language: lang }));
	callbacks?.onClearChat();
	processNextStep();
}

// ============ VOICE INPUT ============

export async function handleVoiceInput(transcript: string): Promise<void> {
	// Conversation mode has its own multi-target matching.
	if (convState?.active) {
		await handleConversationVoice(transcript);
		return;
	}

	const app = get(appStore);
	const prefs = get(preferencesStore);
	const exam = get(examStore);

	let targetGerman: string;
	const lessonState = get(lessonStore);
	const lesson = lessonState.currentLesson;
	const currentStep = !exam.isExamMode && lesson ? lesson.sentences[app.currentSentenceIndex] : null;

	if (exam.isExamMode) {
		const examQ = exam.examQuestions[exam.currentExamIndex];
		// Tap-based questions ignore voice input entirely.
		if (examQ?.options) return;
		targetGerman = examQ ? examQ.targetText : '';
	} else {
		if (!currentStep) return;
		targetGerman = currentStep.role === 'received' ? currentStep.audioText! : currentStep.targetText!;
	}

	// Evaluate the primary transcript AND the recognizer's alternative
	// hypotheses — the 2nd/3rd guess is often what the learner actually said.
	const candidates = [transcript, ...getLastVoiceAlternatives()];
	const best = bestVoiceMatch(candidates, targetGerman, 0.8);
	const result = best.result;

	// Diagnose against the recognizer's OWN first choice, before best-of
	// overwrites it below. Best-of deliberately picks the most flattering of
	// five hypotheses, which is right for "did they know the sentence" and
	// exactly wrong for "did they say it properly".
	const soundNotes = diagnose(targetGerman, transcript);

	transcript = best.transcript || transcript;

	// Strict: matching every word is not the same as saying the sentence.
	// "Ich mochte einen Kaffee" is real German and the wrong answer.
	const isCorrect = result.isMatch && soundNotes.length === 0;
	void trackEvent(transcript.trim() ? 'answer_submitted' : 'answer_timed_out', { day: app.currentDay, metadata: {
		index: exam.isExamMode ? exam.currentExamIndex : app.currentSentenceIndex,
		mode: exam.isExamMode ? (exam.isReviewMode ? 'review' : 'exam') : 'lesson', correct: isCorrect
	} });

	// Keyed by the written word rather than an index into the normalized
	// list, so nothing can drift out of alignment when a token normalizes
	// away.
	const missedWords = isCorrect
		? []
		: [...getWordMatchStatus(transcript, targetGerman.split(/\s+/))]
				.filter(([, matched]) => !matched)
				.map(([word]) => word);

	callbacks?.onVoiceResult({
		isCorrect,
		transcript,
		matchPercentage: result.matchPercentage,
		matchedWordIndices: result.targetWords.map((tw) =>
			result.userWords.some(
				(uw) => uw === tw || uw.includes(tw) || tw.includes(uw)
			)
		),
		soundNotes,
		missedWords
	});

	if (isCorrect) {
		playTone('success');

		if (exam.isExamMode) {
			await handleExamCorrect(transcript);
		} else {
			await handleLessonCorrect(currentStep!, transcript);
		}
	} else {
		playTone('error');

		if (exam.isExamMode) {
			await handleExamIncorrect(targetGerman, transcript);
		} else {
			await handleLessonIncorrect(currentStep!, targetGerman, transcript);
		}
	}
}

async function handleLessonCorrect(step: Sentence, transcript: string): Promise<void> {
	const app = get(appStore);
	const prefs = get(preferencesStore);

	// Record SR success
	await recordSRAttempt(app.currentDay, step.id, true);

	// Show message bubble
	callbacks?.onMessageBubble(step);

	// Feedback
	await playAudioPromise('Good.', 1.2, 'en-US');

	// Advance
	callbacks?.onScriptMarkDone(app.currentSentenceIndex);
	const nextIndex = app.currentSentenceIndex + 1;
	app.xp += 10; // Reward for perfect voice match
	appStore.update((s) => ({ ...s, currentSentenceIndex: nextIndex, xp: app.xp }));
	await saveProgress(app.currentDay, nextIndex, app.xp);
	processNextStep();
}

async function handleLessonIncorrect(step: Sentence, targetGerman: string, transcript: string): Promise<void> {
	const app = get(appStore);
	const prefs = get(preferencesStore);

	// Record SR failure
	await recordSRAttempt(app.currentDay, step.id, false);

	// Show what was heard
	const heardMsg = `Heard: "${transcript}"`;
	callbacks?.onAnswerPrompt(`<span style="color:red">${heardMsg}</span>`);

	// Replay target
	playAudioPromise(targetGerman, 1, 'de-DE');
}

// ============ EXAM SYSTEM ============

export async function startExam(week: number): Promise<void> {
	// Same reason changeDay carries this: a disabled <option> is presentation,
	// and these are exported functions any call site can reach. A week opens
	// once its lessons are finished, not when the learner arrives at it —
	// testing material they have not met is the opposite of the point.
	if (!isWeekUnlocked(week, get(appStore).completedLessons, hasLesson)) {
		const isFa = get(preferencesStore).language === 'fa';
		callbacks?.onSystemMessage(
			isFa
				? `این بخش هنوز باز نشده — اول درس‌های هفته ${week} را تمام کن.`
				: `Not open yet — finish the week ${week} lessons first.`
		);
		return;
	}

	pauseLessonAnalytics();
	const prefs = get(preferencesStore);
	incrementSession();
	stopAllAudio();

	const startDay = (week - 1) * 7 + 1;
	const endDay = week * 7;

	// Load all lessons for this week
	const daysToLoad: number[] = [];
	for (let d = startDay; d <= endDay; d++) {
		if (hasLesson(d)) daysToLoad.push(d);
	}
	await loadLessons(daysToLoad);

	// Collect the week's sentences once; question builders draw from this.
	const weekSentences: Array<{ day: number; s: Sentence; german: string; loc: string }> = [];
	for (let d = startDay; d <= endDay; d++) {
		const lesson = getLesson(d);
		if (!lesson) continue;
		for (const s of lesson.sentences) {
			const german = (s.role === 'received' ? s.audioText : s.targetText) || '';
			if (!german) continue;
			const loc = prefs.language === 'fa' ? (s.translationFa || s.translation) : s.translation;
			weekSentences.push({ day: d, s, german, loc });
		}
	}

	const shuffleArr = <T,>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);
	const base = ({ day, s, german, loc }: (typeof weekSentences)[number]) => ({
		day,
		sentenceId: s.id,
		audioText: german,
		targetText: german,
		translation: loc,
		translationFa: s.translationFa
	});

	// Speak / listen pools (mic-based, as before)
	const speakPool: ExamQuestion[] = weekSentences
		.filter((w) => w.s.role === 'sent')
		.map((w) => ({ type: 'speak', ...base(w) }));
	const listenPool: ExamQuestion[] = weekSentences
		.filter((w) => w.s.role === 'received')
		.map((w) => ({ type: 'listen', ...base(w) }));

	// Meaning pool (tap-based): hear/read German → pick the right translation.
	const meaningPool: ExamQuestion[] = weekSentences
		.map((w): ExamQuestion | null => {
			const distractors = shuffleArr(
				[...new Set(weekSentences.map((o) => o.loc))].filter((t) => t !== w.loc)
			).slice(0, 2);
			if (distractors.length < 2) return null;
			const options = shuffleArr([w.loc, ...distractors]);
			return {
				type: 'meaning' as const,
				...base(w),
				promptText: w.german,
				options,
				correctIndex: options.indexOf(w.loc)
			};
		})
		.filter((q): q is ExamQuestion => q !== null);

	// Gap pool (tap-based): the sentence with one word blanked → pick the word.
	const stripPunct = (word: string) => word.replace(/[.,!?;:„“”"']/g, '');
	const gapWords = (text: string) =>
		text.split(/\s+/).map(stripPunct).filter((word) => word.length >= 4);
	const allGapWords = [...new Set(weekSentences.flatMap((w) => gapWords(w.german)))];
	const gapPool: ExamQuestion[] = weekSentences
		.filter((w) => w.s.role === 'sent')
		.map((w): ExamQuestion | null => {
			const candidates = gapWords(w.german);
			if (!candidates.length) return null;
			const word = candidates[Math.floor(Math.random() * candidates.length)];
			const distractors = shuffleArr(
				allGapWords.filter((g) => g.toLowerCase() !== word.toLowerCase())
			).slice(0, 2);
			if (distractors.length < 2) return null;
			const options = shuffleArr([word, ...distractors]);
			return {
				type: 'gap' as const,
				...base(w),
				promptText: w.german.replace(word, '___'),
				options,
				correctIndex: options.indexOf(word)
			};
		})
		.filter((q): q is ExamQuestion => q !== null);

	// Mix: ~8 speak, 4 listen, 4 meaning, 4 gap — backfill with speak, cap 20.
	const picked = [
		...shuffleArr(speakPool).slice(0, 8),
		...shuffleArr(listenPool).slice(0, 4),
		...shuffleArr(meaningPool).slice(0, 4),
		...shuffleArr(gapPool).slice(0, 4)
	];
	const usedIds = new Set(picked.map((q) => `${q.type}-${q.day}-${q.sentenceId}`));
	for (const q of shuffleArr(speakPool)) {
		if (picked.length >= 20) break;
		const id = `${q.type}-${q.day}-${q.sentenceId}`;
		if (!usedIds.has(id)) {
			usedIds.add(id);
			picked.push(q);
		}
	}
	const shuffled = shuffleArr(picked).slice(0, 20);

	examStore.set({
		isExamMode: true,
		isReviewMode: false,
		isConversation: false,
		examWeek: week,
		examQuestions: shuffled,
		currentExamIndex: 0,
		examScore: 0,
		examRetry: false,
		examWrongAnswers: []
	});

	callbacks?.onClearChat();

	const isFa = prefs.language === 'fa';
	const title = isFa ? `\u0622\u0632\u0645\u0648\u0646 \u0647\u0641\u062A\u0647 ${week} \u0634\u0631\u0648\u0639 \u0634\u062F!` : `Week ${week} Exam Started!`;
	callbacks?.onSystemMessage(title);

	processNextExamQuestion();
}

export async function startReviewMode(maxItems = 15): Promise<void> {
	deactivateConversation();
	const prefs = get(preferencesStore);
	const isFa = prefs.language === 'fa';

	const dueItems = (await getDueReviewItems()).slice(0, maxItems);

	console.log('[Review] Due items:', dueItems.length, dueItems.map(i => `day${i.day}:s${i.sentenceId}`));

	if (dueItems.length === 0) {
		const noMsg = isFa ? '\u0647\u06CC\u0686 \u0645\u0648\u0631\u062F\u06CC \u0628\u0631\u0627\u06CC \u0645\u0631\u0648\u0631 \u0646\u06CC\u0633\u062A!' : 'No items due for review!';
		callbacks?.onSystemMessage(noMsg);
		return;
	}

	// Load needed lessons
	const uniqueDays = [...new Set(dueItems.map((item) => item.day))];
	await loadLessons(uniqueDays);

	const questions: ExamQuestion[] = [];
	for (const item of dueItems) {
		const lesson = getLesson(item.day);
		if (!lesson?.sentences) {
			console.warn('[Review] No lesson/sentences for day', item.day);
			continue;
		}

		const sentence = lesson.sentences.find((s) => s.id === item.sentenceId);
		if (!sentence) {
			console.warn('[Review] Sentence not found: day', item.day, 'sentenceId', item.sentenceId, 'available IDs:', lesson.sentences.map(s => s.id));
			continue;
		}

		if (sentence.role === 'sent') {
			questions.push({
				type: 'speak',
				day: item.day,
				sentenceId: item.sentenceId,
				audioText: sentence.targetText || '',
				targetText: sentence.targetText || '',
				translation: prefs.language === 'fa' ? (sentence.translationFa || sentence.translation) : sentence.translation,
				translationFa: sentence.translationFa
			});
		} else {
			questions.push({
				type: 'listen',
				day: item.day,
				sentenceId: item.sentenceId,
				audioText: sentence.audioText || '',
				targetText: sentence.audioText || '',
				translation: prefs.language === 'fa' ? (sentence.translationFa || sentence.translation) : sentence.translation,
				translationFa: sentence.translationFa
			});
		}
	}


	console.log('[Review] Built', questions.length, 'questions from', dueItems.length, 'due items');

	if (questions.length === 0) {
		const noMsg = isFa ? '\u0647\u06CC\u0686 \u0645\u0648\u0631\u062F\u06CC \u0628\u0631\u0627\u06CC \u0645\u0631\u0648\u0631 \u0646\u06CC\u0633\u062A!' : 'No items due for review!';
		callbacks?.onSystemMessage(noMsg);
		return;
	}

	pauseLessonAnalytics();
	examStore.set({
		isExamMode: true,
		isReviewMode: true,
		isConversation: false,
		examWeek: 0,
		examQuestions: questions,
		currentExamIndex: 0,
		examScore: 0,
		examRetry: false,
		examWrongAnswers: []
	});

	callbacks?.onClearChat();
	const title = isFa ? '🔄 مرور فاصله‌دار' : '🔄 Spaced Review';
	void trackEvent('review_started', { metadata: { mode: 'review', count: questions.length } });
	callbacks?.onSystemMessage(title);

	processNextExamQuestion();
}

function processNextExamQuestion(): void {
	pauseLessonAnalytics();
	const exam = get(examStore);
	const prefs = get(preferencesStore);

	examStore.update((s) => ({ ...s, examRetry: false }));

	if (exam.currentExamIndex >= exam.examQuestions.length) {
		finishExam();
		return;
	}

	callbacks?.onExamProgress(exam.currentExamIndex, exam.examQuestions.length);

	const q = exam.examQuestions[exam.currentExamIndex];
	callbacks?.onExamQuestion({
		type: q.type,
		prompt: q.promptText ?? (q.type === 'listen' ? q.translation : (prefs.language === 'fa' ? (q.translationFa || q.translation) : q.translation)),
		target: q.targetText,
		translation: q.translation,
		questionNumber: exam.currentExamIndex + 1,
		totalQuestions: exam.examQuestions.length,
		language: prefs.language,
		options: q.options,
		correctIndex: q.correctIndex
	});

	// Listening-based questions actually play the German out loud.
	// ('gap' stays silent — the audio would give the missing word away.)
	if (q.type === 'listen' || q.type === 'meaning') {
		playAudioPromise(q.audioText, 1, 'de-DE', undefined, 'b');
	}

	// Show the initial prompt for the user to answer
	const isFa = prefs.language === 'fa';
	const promptMsg = q.options
		? isFa
			? '👆 پاسخ درست را انتخاب کن'
			: '👆 Tap the correct answer'
		: `🎙️ ${isFa ? 'آلمانی بگو...' : 'Speak in German...'}`;
	callbacks?.onAnswerPrompt(promptMsg);
}

/**
 * Answer a tap-based exam question ('meaning' / 'gap'). Single attempt:
 * a wrong tap records the miss and moves on (no voice-style retry).
 */
export async function answerExamChoice(index: number): Promise<void> {
	const exam = get(examStore);
	if (!exam.isExamMode) return;
	const q = exam.examQuestions[exam.currentExamIndex];
	if (!q?.options || typeof q.correctIndex !== 'number') return;

	if (index === q.correctIndex) {
		playTone('success');
		await handleExamCorrect(q.options[index]);
		return;
	}

	playTone('error');
	if (q.day && q.sentenceId) {
		await recordSRAttempt(q.day, q.sentenceId, false);
	}
	recordExamPractice(q, false);
	examStore.update((s) => ({
		...s,
		examWrongAnswers: [...s.examWrongAnswers, { question: q, heard: q.options![index] }]
	}));

	const isFa = get(preferencesStore).language === 'fa';
	const nextMsg = isFa ? 'سوال بعدی...' : 'Moving to next...';
	callbacks?.onAnswerPrompt(`<span style="color:red">${nextMsg}</span>`);

	setTimeout(() => {
		examStore.update((s) => ({ ...s, currentExamIndex: s.currentExamIndex + 1 }));
		processNextExamQuestion();
	}, 1500);
}

/**
 * Which Goethe module a review question exercises. Reviews are the best
 * practice signal the app has: the German is hidden, the item is days old,
 * and the four question types map straight onto the four exam modules.
 */
const EXAM_MODULE: Record<ExamQuestion['type'], ReadinessModule> = {
	listen: 'hoeren',
	speak: 'sprechen',
	meaning: 'lesen',
	gap: 'schreiben'
};

/** Record one graded review answer. Called once per question, on its
 *  terminal outcome — a retry is the same question, not a second data point. */
function recordExamPractice(q: ExamQuestion | undefined, correct: boolean): void {
	const m = q && EXAM_MODULE[q.type];
	if (m) recordPracticeResult(m, correct ? 1 : 0, 1);
}

async function handleExamCorrect(transcript: string): Promise<void> {
	const exam = get(examStore);
	const prefs = get(preferencesStore);
	const q = exam.examQuestions[exam.currentExamIndex];

	// Track SR success
	if (q.day && q.sentenceId) {
		await recordSRAttempt(q.day, q.sentenceId, true);
	}
	recordExamPractice(q, true);

	examStore.update((s) => ({ ...s, examScore: s.examScore + 1 }));

	const correctMsg = prefs.language === 'fa' ? '\u062F\u0631\u0633\u062A\u0647!' : 'Correct!';
	callbacks?.onAnswerPrompt(`<span style="color:green">${correctMsg}</span>`);

	setTimeout(() => {
		examStore.update((s) => ({ ...s, currentExamIndex: s.currentExamIndex + 1 }));
		processNextExamQuestion();
	}, 1000);
}

async function handleExamIncorrect(targetGerman: string, transcript: string): Promise<void> {
	const exam = get(examStore);
	const prefs = get(preferencesStore);
	const q = exam.examQuestions[exam.currentExamIndex];
	const isFa = prefs.language === 'fa';

	if (!exam.examRetry) {
		// First attempt failed — allow retry
		examStore.update((s) => ({ ...s, examRetry: true }));
		const retryMsg = isFa ? '\u06CC\u06A9\u0628\u0627\u0631 \u062F\u06CC\u06AF\u0647 \u062A\u0644\u0627\u0634 \u06A9\u0646...' : 'Try once more...';
		callbacks?.onAnswerPrompt(`<span style="color:orange">${retryMsg}</span>`);
		playAudioPromise(targetGerman, 1, 'de-DE');
	} else {
		// Second attempt failed — move on
		examStore.update((s) => ({ ...s, examRetry: false }));

		// Track SR failure
		if (q.day && q.sentenceId) {
			await recordSRAttempt(q.day, q.sentenceId, false);
		}
		recordExamPractice(q, false);

		// Record wrong answer
		const wrongAnswer: WrongAnswer = {
			question: q,
			heard: transcript
		};
		examStore.update((s) => ({
			...s,
			examWrongAnswers: [...s.examWrongAnswers, wrongAnswer]
		}));

		const nextMsg = isFa ? '\u0633\u0648\u0627\u0644 \u0628\u0639\u062F\u06CC...' : 'Moving to next...';
		callbacks?.onAnswerPrompt(`<span style="color:red">${nextMsg}</span>`);

		setTimeout(() => {
			examStore.update((s) => ({ ...s, currentExamIndex: s.currentExamIndex + 1 }));
			processNextExamQuestion();
		}, 1500);
	}
}

async function finishExam(): Promise<void> {
	const exam = get(examStore);
	if (!exam.isExamMode) return;
	const prefs = get(preferencesStore);
	const wasReview = exam.isReviewMode;
	// Close synchronously: duplicate transition timers must not record a second completion.
	examStore.update((s) => ({ ...s, isExamMode: false, isReviewMode: false }));
	const totalQ = exam.examQuestions.length;
	const percentage = totalQ > 0 ? Math.round((exam.examScore / totalQ) * 100) : 0;
	if (totalQ > 0) void trackEvent('exam_completed', { metadata: { mode: wasReview ? 'review' : 'exam', score: exam.examScore, total: totalQ, percentage, week: exam.examWeek } });

	callbacks?.onExamProgress(totalQ, totalQ);

	// Save exam results
	const weekKey = `week_${exam.examWeek}`;
	await saveExamResult(weekKey, {
		score: exam.examScore,
		total: totalQ,
		percentage,
		date: Date.now(),
		wrongAnswers: exam.examWrongAnswers.map((w) => ({
			prompt: w.question.translation,
			target: w.question.targetText,
			heard: w.heard
		}))
	});

	callbacks?.onExamFinished({
		score: exam.examScore,
		total: totalQ,
		percentage,
		wasReview,
		language: prefs.language,
		wrongAnswers: exam.examWrongAnswers,
		examWeek: exam.examWeek
	});
}

// ============ CONVERSATION MODE (Week Talk) ============
// A scripted-but-branching conversation built from the week's dialogues:
// the partner speaks a line, the user chooses one of two valid replies and
// says it out loud — whichever they say, the thread follows their choice.

interface ConvPair {
	day: number;
	sentenceId: number; // id of the user's (sent) line, for SR tracking
	question: { german: string; translation: string };
	answer: { german: string; translation: string };
}

interface ConvRuntimeOption extends ConvOption {
	pairIndex: number;
	day: number;
	sentenceId: number;
}

let convState: {
	active: boolean;
	week: number;
	pairs: ConvPair[];
	pointer: number;
	exchanges: number;
	maxExchanges: number;
	options: ConvRuntimeOption[];
	failCount: number;
} | null = null;

function deactivateConversation(): void {
	if (!convState) return;
	convState = null;
	examStore.update((s) => ({ ...s, isConversation: false }));
	callbacks?.onConversationOptions?.(null);
}

export async function startConversation(week: number): Promise<void> {
	// Same reason changeDay carries this: a disabled <option> is presentation,
	// and these are exported functions any call site can reach. A week opens
	// once its lessons are finished, not when the learner arrives at it —
	// testing material they have not met is the opposite of the point.
	if (!isWeekUnlocked(week, get(appStore).completedLessons, hasLesson)) {
		const isFa = get(preferencesStore).language === 'fa';
		callbacks?.onSystemMessage(
			isFa
				? `این بخش هنوز باز نشده — اول درس‌های هفته ${week} را تمام کن.`
				: `Not open yet — finish the week ${week} lessons first.`
		);
		return;
	}

	pauseLessonAnalytics();
	const prefs = get(preferencesStore);
	const isFa = prefs.language === 'fa';
	incrementSession();
	stopAllAudio();
	deactivateConversation();
	examStore.update((s) => ({
		...s,
		isExamMode: false,
		isReviewMode: false,
		isConversation: true
	}));

	const startDay = (week - 1) * 7 + 1;
	const endDay = week * 7;
	const daysToLoad: number[] = [];
	for (let d = startDay; d <= endDay; d++) {
		if (hasLesson(d)) daysToLoad.push(d);
	}
	await loadLessons(daysToLoad);

	// Adjacent received→sent pairs keep each exchange coherent.
	const pairs: ConvPair[] = [];
	for (const d of daysToLoad) {
		const lesson = getLesson(d);
		if (!lesson) continue;
		for (let i = 0; i < lesson.sentences.length - 1; i++) {
			const q = lesson.sentences[i];
			const a = lesson.sentences[i + 1];
			if (q.role !== 'received' || a.role !== 'sent') continue;
			if (!q.audioText || !a.targetText) continue;
			pairs.push({
				day: d,
				sentenceId: a.id,
				question: {
					german: q.audioText,
					translation: isFa ? q.translationFa || q.translation : q.translation
				},
				answer: {
					german: a.targetText,
					translation: isFa ? a.translationFa || a.translation : a.translation
				}
			});
		}
	}

	if (pairs.length < 2) {
		callbacks?.onSystemMessage(
			isFa
				? 'برای گفتگو، دیالوگ کافی در این هفته نیست.'
				: 'Not enough dialogue material in this week for a conversation.'
		);
		return;
	}

	convState = {
		active: true,
		week,
		pairs,
		pointer: 0,
		exchanges: 0,
		maxExchanges: Math.min(8, pairs.length),
		options: [],
		failCount: 0
	};

	callbacks?.onClearChat();
	callbacks?.onSystemMessage(isFa ? `💬 گفتگوی هفته ${week}` : `💬 Week ${week} Conversation`);
	void trackEvent('conversation_started', { day: get(appStore).currentDay, metadata: { week } });
	await presentConvTurn();
}

async function presentConvTurn(): Promise<void> {
	const st = convState;
	if (!st?.active) return;
	if (st.exchanges >= st.maxExchanges || st.pointer >= st.pairs.length) {
		finishConversation();
		return;
	}

	const prefs = get(preferencesStore);
	const isFa = prefs.language === 'fa';
	const pair = st.pairs[st.pointer];

	// Partner line: bubble + audio (conversation-partner voice)
	callbacks?.onMessageBubble({
		id: -1,
		role: 'received',
		audioText: pair.question.german,
		translation: pair.question.translation
	});
	await playAudioPromise(pair.question.german, 1, 'de-DE', undefined, 'b');
	if (!convState?.active) return; // mode ended while audio played

	// Two valid replies: this pair's answer + one from another exchange.
	const altIndices = st.pairs
		.map((_, i) => i)
		.filter((i) => i !== st.pointer && st.pairs[i].answer.german !== pair.answer.german);
	const correctOpt: ConvRuntimeOption = {
		german: pair.answer.german,
		translation: pair.answer.translation,
		pairIndex: st.pointer,
		day: pair.day,
		sentenceId: pair.sentenceId
	};
	let options = [correctOpt];
	if (altIndices.length > 0) {
		const altIdx = altIndices[Math.floor(Math.random() * altIndices.length)];
		const alt = st.pairs[altIdx];
		options.push({
			german: alt.answer.german,
			translation: alt.answer.translation,
			pairIndex: altIdx,
			day: alt.day,
			sentenceId: alt.sentenceId
		});
		options = options.sort(() => Math.random() - 0.5);
	}
	st.options = options;
	st.failCount = 0;

	callbacks?.onConversationOptions?.(
		options.map((o) => ({ german: o.german, translation: o.translation }))
	);
	callbacks?.onAnswerPrompt(
		isFa ? '🎙️ یکی از پاسخ‌ها را بگو' : '🎙️ Say one of the replies out loud'
	);
}

async function handleConversationVoice(transcript: string): Promise<void> {
	const st = convState;
	if (!st?.active || st.options.length === 0) return;
	const prefs = get(preferencesStore);
	const isFa = prefs.language === 'fa';

	// Match every offered reply against the transcript AND the recognizer's
	// alternative hypotheses; the best (option, transcript) pair wins.
	const candidates = [transcript, ...getLastVoiceAlternatives()];
	let best = st.options[0];
	let bestResult = bestVoiceMatch(candidates, best.german, 0.8).result;
	for (const opt of st.options.slice(1)) {
		const r = bestVoiceMatch(candidates, opt.german, 0.8).result;
		if (r.matchPercentage > bestResult.matchPercentage) {
			best = opt;
			bestResult = r;
		}
	}

	callbacks?.onVoiceResult({
		isCorrect: bestResult.isMatch,
		transcript,
		matchPercentage: bestResult.matchPercentage,
		matchedWordIndices: bestResult.targetWords.map((tw) =>
			bestResult.userWords.some((uw) => uw === tw || uw.includes(tw) || tw.includes(uw))
		)
	});

	if (bestResult.isMatch) {
		playTone('success');
		await recordSRAttempt(best.day, best.sentenceId, true);
		callbacks?.onConversationOptions?.(null);
		callbacks?.onMessageBubble({
			id: -1,
			role: 'sent',
			targetText: best.german,
			translation: best.translation
		});
		st.exchanges++;
		st.pointer = best.pairIndex + 1; // follow the thread the user chose
		callbacks?.onAnswerPrompt('');
		await wait(700);
		await presentConvTurn();
		return;
	}

	playTone('error');
	st.failCount++;
	if (st.failCount < 2) {
		const retryMsg = isFa ? 'یکبار دیگه تلاش کن...' : 'Try once more...';
		callbacks?.onAnswerPrompt(
			`<span style="color:orange">${retryMsg}</span> <span style="color:#888">"${transcript}"</span>`
		);
		return;
	}

	// Two misses → reveal the natural reply and carry on.
	const intended = st.options.find((o) => o.pairIndex === st.pointer) ?? st.options[0];
	await recordSRAttempt(intended.day, intended.sentenceId, false);
	callbacks?.onConversationOptions?.(null);
	callbacks?.onMessageBubble({
		id: -1,
		role: 'sent',
		targetText: intended.german,
		translation: intended.translation
	});
	st.exchanges++;
	st.pointer = intended.pairIndex + 1;
	callbacks?.onAnswerPrompt('');
	await wait(700);
	await presentConvTurn();
}

function finishConversation(): void {
	const st = convState;
	if (!st) return;
	convState = null;
	examStore.update((s) => ({ ...s, isConversation: false }));
	const prefs = get(preferencesStore);
	const isFa = prefs.language === 'fa';

	callbacks?.onConversationOptions?.(null);

	// Small XP reward for completing the weekly conversation.
	const app = get(appStore);
	const newXp = app.xp + 30;
	appStore.update((s) => ({ ...s, xp: newXp }));
	void saveProgress(app.currentDay, app.currentSentenceIndex, newXp);
	void trackEvent('conversation_completed', {
		day: app.currentDay,
		metadata: { week: st.week, exchanges: st.exchanges }
	});

	callbacks?.onSystemMessage(
		isFa
			? `🎉 گفتگو تمام شد! ${st.exchanges} تبادل · +۳۰ امتیاز`
			: `🎉 Conversation complete! ${st.exchanges} exchanges · +30 XP`
	);
	callbacks?.onAnswerPrompt('');
}

// ============ DUE COUNT ============

export async function getDueCount(): Promise<number> {
	return (await getDueReviewItems()).length;
}

/**
 * Remove the current review item from the SR queue and skip to the next question.
 * Only works during review mode.
 */
export async function skipAndRemoveReviewItem(): Promise<void> {
	const examState = get(examStore);
	if (!examState.isReviewMode) return;

	const q = examState.examQuestions[examState.currentExamIndex];
	if (!q) return;

	// Delete from SR and bookmarks
	await removeFromReview(q.day, q.sentenceId);
	removeBookmark(q.day, q.sentenceId);

	// Remove this question from the array (currentExamIndex stays the same — next item slides in)
	const updatedQuestions = examState.examQuestions.filter((_, i) => i !== examState.currentExamIndex);
	examStore.update((s) => ({ ...s, examQuestions: updatedQuestions }));

	if (updatedQuestions.length === 0 || examState.currentExamIndex >= updatedQuestions.length) {
		finishExam();
	} else {
		processNextExamQuestion();
	}
}

/**
 * Defer the current review item to the end of the queue.
 * Only works during review mode.
 */
export function skipAndDeferReviewItem(): void {
	const examState = get(examStore);
	if (!examState.isReviewMode) return;

	const q = examState.examQuestions[examState.currentExamIndex];
	if (!q) return;

	// Remove current question and push to the end
	const updatedQuestions = [...examState.examQuestions];
	updatedQuestions.splice(examState.currentExamIndex, 1);
	updatedQuestions.push(q);

	examStore.update((s) => ({ ...s, examQuestions: updatedQuestions, examRetry: false }));

	processNextExamQuestion();
}
