import { describe, it, expect, vi, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import { appStore } from '$stores/app';
import { preferencesStore } from '$stores/preferences';
import { lessonStore } from '$stores/lesson';
import { examStore } from '$stores/exam';

// ─── Mock all external dependencies ──────────────────────────────────────────

vi.mock('$services/lesson-loader', () => ({
	loadLesson: vi.fn().mockResolvedValue(null),
	loadLessons: vi.fn().mockResolvedValue(undefined),
	loadGlossary: vi.fn().mockResolvedValue({}),
	getLesson: vi.fn().mockReturnValue(null),
	getLessonIndex: vi.fn().mockResolvedValue([]),
	resolveResumePoint: vi.fn().mockReturnValue({ day: 1, sentenceIndex: 0, allDone: false }),
	getAllLoadedLessons: vi.fn().mockReturnValue({}),
	hasLesson: vi.fn().mockReturnValue(false),
	getTotalLessons: vi.fn().mockReturnValue(100)
}));

vi.mock('$services/data-layer', () => ({
	getLanguage: vi.fn().mockResolvedValue(null),
	getVoiceSpeed: vi.fn().mockResolvedValue(null),
	getProgress: vi.fn().mockResolvedValue(null),
	getCompletedLessons: vi.fn().mockResolvedValue({}),
	loadSRData: vi.fn().mockResolvedValue({}),
	saveProgress: vi.fn().mockResolvedValue(undefined),
	saveCompletedLessons: vi.fn().mockResolvedValue(undefined),
	saveExamResult: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('$services/spaced-repetition', () => ({
	recordSRAttempt: vi.fn().mockResolvedValue(undefined),
	getDueReviewItems: vi.fn().mockResolvedValue([])
}));

vi.mock('$services/tts', () => ({
	playAudioPromise: vi.fn().mockResolvedValue(undefined),
	stopAllAudio: vi.fn()
}));

vi.mock('$services/audio-context', () => ({
	playTone: vi.fn()
}));

vi.mock('$utils/wait', () => ({
	wait: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('$services/analytics', async (original) => ({ ...await original<typeof import('$services/analytics')>(), trackEvent: vi.fn().mockResolvedValue(undefined) }));

vi.mock('$utils/i18n', () => ({
	getTranslation: vi.fn().mockReturnValue('translation text'),
	getTranslationLang: vi.fn().mockReturnValue('en-US')
}));

// ─── Import the module under test after mocks are declared ───────────────────

import {
	isDayUnlocked,
	incrementSession,
	setCallbacks,
	handleVoiceInput,
	manualNext,
	processNextStep,
	continueAfterGrammar,
	initLesson,
	type LessonCallbacks
} from './lesson-controller';
import { playTone } from '$services/audio-context';
import { recordSRAttempt } from '$services/spaced-repetition';
import { saveProgress } from '$services/data-layer';
import { trackEvent } from '$services/analytics';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Reset all Svelte stores to their initial values before each test. */
function resetStores() {
	appStore.set({
		currentDay: 1,
		currentSentenceIndex: 0,
		sessionID: 0,
		completedLessons: {},
		isListening: false,
		xp: 0
	});
	preferencesStore.set({ language: 'en', voiceSpeed: 1.0, blindMode: false, targetLanguage: 'de' });
	lessonStore.set({ currentLesson: null, glossary: {}, isLoading: false });
	examStore.set({
		isExamMode: false,
		isReviewMode: false,
		isConversation: false,
		examWeek: 0,
		examQuestions: [],
		currentExamIndex: 0,
		examScore: 0,
		examRetry: false,
		examWrongAnswers: []
	});
}

/** A no-op callbacks object; individual tests can override specific handlers. */
function makeCallbacks(overrides: Partial<LessonCallbacks> = {}): LessonCallbacks {
	return {
		onTeachStep: vi.fn(),
		onGrammarMoment: vi.fn(),
		onCompletionCard: vi.fn(),
		onAnswerPrompt: vi.fn(),
		onMessageBubble: vi.fn(),
		onScriptHighlight: vi.fn(),
		onScriptMarkDone: vi.fn(),
		onExamQuestion: vi.fn(),
		onExamFinished: vi.fn(),
		onExamProgress: vi.fn(),
		onSystemMessage: vi.fn(),
		onClearChat: vi.fn(),
		onVoiceResult: vi.fn(),
		...overrides
	};
}

/** A minimal lesson with one 'sent' sentence and one 'received' sentence. */
const sampleLesson = {
	title: 'Test Lesson',
	sentences: [
		{
			id: 1,
			role: 'sent' as const,
			targetText: 'Guten Morgen',
			audioText: undefined,
			translation: 'Good morning',
			translationFa: 'صبح بخیر'
		},
		{
			id: 2,
			role: 'received' as const,
			audioText: 'Hallo!',
			targetText: undefined,
			translation: 'Hello!',
			translationFa: 'سلام!'
		}
	]
};

/** Lesson carrying an end-of-lesson grammar note. */
const lessonWithGrammar = {
	...sampleLesson,
	grammarNote: {
		title: 'Verb in position 2',
		titleFa: 'فعل در جایگاه دوم',
		explanation: 'In a German statement the conjugated verb is always the second element.',
		explanationFa: 'در جملهٔ خبری آلمانی، فعل صرف‌شده همیشه عنصر دوم است.',
		examples: [
			{ de: 'Heute lerne ich Deutsch.', en: 'Today I learn German.', fa: 'امروز آلمانی یاد می‌گیرم.' }
		],
		basicsKey: 'pronounsAndSein'
	}
};

// ─── Grammar moment ───────────────────────────────────────────────────────────

describe('grammar moment', () => {
	beforeEach(async () => {
		resetStores();
		vi.clearAllMocks();
		// Clear the once-per-visit guard between tests.
		await initLesson();
		resetStores();
	});

	it('fires before the completion card when the lesson has a note', async () => {
		const onGrammarMoment = vi.fn();
		const onCompletionCard = vi.fn();
		setCallbacks(makeCallbacks({ onGrammarMoment, onCompletionCard }));
		lessonStore.set({ currentLesson: lessonWithGrammar, glossary: {}, isLoading: false });
		appStore.update((s) => ({ ...s, currentSentenceIndex: lessonWithGrammar.sentences.length }));

		await processNextStep();

		expect(onGrammarMoment).toHaveBeenCalledTimes(1);
		expect(onCompletionCard).not.toHaveBeenCalled();
		const data = onGrammarMoment.mock.calls[0][0];
		expect(data.title).toBe('Verb in position 2');
		expect(data.examples[0].de).toBe('Heute lerne ich Deutsch.');
		expect(data.basicsKey).toBe('pronounsAndSein');
	});

	it('uses Persian title/explanation when the interface is fa', async () => {
		const onGrammarMoment = vi.fn();
		setCallbacks(makeCallbacks({ onGrammarMoment }));
		preferencesStore.update((s) => ({ ...s, language: 'fa' as const }));
		lessonStore.set({ currentLesson: lessonWithGrammar, glossary: {}, isLoading: false });
		appStore.update((s) => ({ ...s, currentSentenceIndex: lessonWithGrammar.sentences.length }));

		await processNextStep();

		const data = onGrammarMoment.mock.calls[0][0];
		expect(data.title).toBe('فعل در جایگاه دوم');
		expect(data.examples[0].gloss).toBe('امروز آلمانی یاد می‌گیرم.');
	});

	it('continueAfterGrammar clears the card and completes the lesson', async () => {
		const onGrammarMoment = vi.fn();
		const onCompletionCard = vi.fn();
		setCallbacks(makeCallbacks({ onGrammarMoment, onCompletionCard }));
		lessonStore.set({ currentLesson: lessonWithGrammar, glossary: {}, isLoading: false });
		appStore.update((s) => ({ ...s, currentSentenceIndex: lessonWithGrammar.sentences.length }));

		await processNextStep();
		await continueAfterGrammar();

		expect(onGrammarMoment).toHaveBeenLastCalledWith(null);
		expect(onCompletionCard).toHaveBeenCalledTimes(1);
	});

	it('shows only once — a second pass goes straight to completion', async () => {
		const onGrammarMoment = vi.fn();
		const onCompletionCard = vi.fn();
		setCallbacks(makeCallbacks({ onGrammarMoment, onCompletionCard }));
		lessonStore.set({ currentLesson: lessonWithGrammar, glossary: {}, isLoading: false });
		appStore.update((s) => ({ ...s, currentSentenceIndex: lessonWithGrammar.sentences.length }));

		await processNextStep();
		onGrammarMoment.mockClear();
		await processNextStep();

		expect(onGrammarMoment).not.toHaveBeenCalled();
		expect(onCompletionCard).toHaveBeenCalledTimes(1);
	});

	it('lessons without a note go straight to the completion card', async () => {
		const onGrammarMoment = vi.fn();
		const onCompletionCard = vi.fn();
		setCallbacks(makeCallbacks({ onGrammarMoment, onCompletionCard }));
		lessonStore.set({ currentLesson: sampleLesson, glossary: {}, isLoading: false });
		appStore.update((s) => ({ ...s, currentSentenceIndex: sampleLesson.sentences.length }));

		await processNextStep();

		expect(onGrammarMoment).not.toHaveBeenCalled();
		expect(onCompletionCard).toHaveBeenCalledTimes(1);
	});
});

// ─── isDayUnlocked ────────────────────────────────────────────────────────────

describe('isDayUnlocked', () => {
	beforeEach(resetStores);

	it('day 1 is always unlocked', () => {
		expect(isDayUnlocked(1)).toBe(true);
	});

	it('day 2 is locked when day 1 has not been completed', () => {
		appStore.update((s) => ({ ...s, completedLessons: {} }));
		expect(isDayUnlocked(2)).toBe(false);
	});

	it('day 2 is unlocked when day 1 has been completed', () => {
		appStore.update((s) => ({
			...s,
			completedLessons: { 1: { completedAt: 123, sentenceCount: 5 } }
		}));
		expect(isDayUnlocked(2)).toBe(true);
	});

	it('day 5 is locked when day 4 has not been completed', () => {
		appStore.update((s) => ({
			...s,
			completedLessons: { 1: { completedAt: 1, sentenceCount: 1 }, 2: { completedAt: 2, sentenceCount: 1 }, 3: { completedAt: 3, sentenceCount: 1 } }
		}));
		expect(isDayUnlocked(5)).toBe(false);
	});

	it('day 5 is unlocked when day 4 has been completed', () => {
		appStore.update((s) => ({
			...s,
			completedLessons: {
				1: { completedAt: 1, sentenceCount: 1 },
				2: { completedAt: 2, sentenceCount: 1 },
				3: { completedAt: 3, sentenceCount: 1 },
				4: { completedAt: 4, sentenceCount: 1 }
			}
		}));
		expect(isDayUnlocked(5)).toBe(true);
	});

	it('handles string day numbers (from Object.keys) correctly', () => {
		// Object.keys returns strings; isDayUnlocked casts via parseInt(String(day))
		appStore.update((s) => ({
			...s,
			completedLessons: { 1: { completedAt: 1, sentenceCount: 1 } }
		}));
		// @ts-expect-error — testing string coercion
		expect(isDayUnlocked('1')).toBe(true);
	});
});

// ─── incrementSession ─────────────────────────────────────────────────────────

describe('incrementSession', () => {
	beforeEach(resetStores);

	it('increments the sessionID in appStore by 1', () => {
		expect(get(appStore).sessionID).toBe(0);
		incrementSession();
		expect(get(appStore).sessionID).toBe(1);
	});

	it('increments correctly across multiple calls', () => {
		incrementSession();
		incrementSession();
		incrementSession();
		expect(get(appStore).sessionID).toBe(3);
	});
});

// ─── handleVoiceInput — lesson mode ──────────────────────────────────────────

describe('handleVoiceInput (lesson mode)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetStores();
		// Prime the lesson store with the sample lesson
		lessonStore.update((s) => ({ ...s, currentLesson: sampleLesson }));
		appStore.update((s) => ({ ...s, currentDay: 1, currentSentenceIndex: 0 }));
	});

	it('calls onVoiceResult with isCorrect=true for a matching transcript', async () => {
		const onVoiceResult = vi.fn();
		setCallbacks(makeCallbacks({ onVoiceResult }));

		await handleVoiceInput('Guten Morgen');

		expect(onVoiceResult).toHaveBeenCalledWith(
			expect.objectContaining({ isCorrect: true, transcript: 'Guten Morgen' })
		);
	});

	it('calls onVoiceResult with isCorrect=false for a non-matching transcript', async () => {
		const onVoiceResult = vi.fn();
		setCallbacks(makeCallbacks({ onVoiceResult }));

		await handleVoiceInput('completely wrong');

		expect(onVoiceResult).toHaveBeenCalledWith(expect.objectContaining({ isCorrect: false }));
	});

	it('plays a success tone on a correct answer', async () => {
		setCallbacks(makeCallbacks());
		await handleVoiceInput('Guten Morgen');
		expect(playTone).toHaveBeenCalledWith('success');
	});

	it('plays an error tone on an incorrect answer', async () => {
		setCallbacks(makeCallbacks());
		await handleVoiceInput('falsche Antwort');
		expect(playTone).toHaveBeenCalledWith('error');
	});

	it('records an SR success on a correct answer', async () => {
		setCallbacks(makeCallbacks());
		await handleVoiceInput('Guten Morgen');
		expect(recordSRAttempt).toHaveBeenCalledWith(1, 1, true);
	});

	it('records an SR failure on an incorrect answer', async () => {
		setCallbacks(makeCallbacks());
		await handleVoiceInput('wrong answer');
		expect(recordSRAttempt).toHaveBeenCalledWith(1, 1, false);
	});

	it('advances currentSentenceIndex after a correct answer', async () => {
		setCallbacks(makeCallbacks());
		await handleVoiceInput('Guten Morgen');
		expect(get(appStore).currentSentenceIndex).toBe(1);
	});

	it('does not advance currentSentenceIndex on an incorrect answer', async () => {
		setCallbacks(makeCallbacks());
		await handleVoiceInput('totally wrong');
		expect(get(appStore).currentSentenceIndex).toBe(0);
	});

	it('saves progress after a correct answer', async () => {
		setCallbacks(makeCallbacks());
		await handleVoiceInput('Guten Morgen');
		expect(saveProgress).toHaveBeenCalledWith(1, 1, expect.any(Number));
	});

	it('calls onMessageBubble with the current step on correct answer', async () => {
		const onMessageBubble = vi.fn();
		setCallbacks(makeCallbacks({ onMessageBubble }));

		await handleVoiceInput('Guten Morgen');

		expect(onMessageBubble).toHaveBeenCalledWith(sampleLesson.sentences[0]);
	});

	it('includes matchedWordIndices in onVoiceResult', async () => {
		const onVoiceResult = vi.fn();
		setCallbacks(makeCallbacks({ onVoiceResult }));

		await handleVoiceInput('Guten Morgen');

		const call = onVoiceResult.mock.calls[0][0];
		expect(Array.isArray(call.matchedWordIndices)).toBe(true);
	});

	it('uses audioText for "received" role sentences', async () => {
		// Move to sentence index 1 (role: received, audioText: 'Hallo!')
		appStore.update((s) => ({ ...s, currentSentenceIndex: 1 }));
		const onVoiceResult = vi.fn();
		setCallbacks(makeCallbacks({ onVoiceResult }));

		await handleVoiceInput('Hallo');

		expect(onVoiceResult).toHaveBeenCalledWith(expect.objectContaining({ isCorrect: true }));
	});

	it('returns early when there is no current lesson', async () => {
		lessonStore.update((s) => ({ ...s, currentLesson: null }));
		setCallbacks(makeCallbacks());

		// Should not throw
		await handleVoiceInput('Guten Morgen');
		expect(recordSRAttempt).not.toHaveBeenCalled();
	});
});

// ─── handleVoiceInput — exam mode ────────────────────────────────────────────

describe('handleVoiceInput (exam mode)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetStores();
		lessonStore.update((s) => ({ ...s, currentLesson: sampleLesson }));
		appStore.update((s) => ({ ...s, currentDay: 1, currentSentenceIndex: 0 }));
		examStore.set({
			isExamMode: true,
			isReviewMode: false,
			isConversation: false,
			examWeek: 1,
			examQuestions: [
				{
					type: 'speak',
					day: 1,
					sentenceId: 1,
					audioText: 'Guten Morgen',
					targetText: 'Guten Morgen',
					translation: 'Good morning'
				}
			],
			currentExamIndex: 0,
			examScore: 0,
			examRetry: false,
			examWrongAnswers: []
		});
	});

	it('records one exam completion after the final answer, with only aggregate metadata', async () => {
		vi.useFakeTimers();
		try {
			const onExamFinished = vi.fn(); setCallbacks(makeCallbacks({ onExamFinished }));
			await handleVoiceInput('Guten Morgen'); await vi.advanceTimersByTimeAsync(1000);
			const completions = vi.mocked(trackEvent).mock.calls.filter(([name]) => name === 'exam_completed');
			expect(completions).toEqual([['exam_completed', { metadata: { mode:'exam',score:1,total:1,percentage:100,week:1 } }]]);
			expect(onExamFinished).toHaveBeenCalledTimes(1);
		} finally { vi.useRealTimers(); }
	});
	it('evaluates the transcript against the exam question target, not the lesson sentence', async () => {
		const onVoiceResult = vi.fn();
		setCallbacks(makeCallbacks({ onVoiceResult }));

		await handleVoiceInput('Guten Morgen');

		expect(onVoiceResult).toHaveBeenCalledWith(expect.objectContaining({ isCorrect: true }));
	});

	it('plays a success tone on a correct exam answer', async () => {
		setCallbacks(makeCallbacks());
		await handleVoiceInput('Guten Morgen');
		expect(playTone).toHaveBeenCalledWith('success');
	});

	it('plays an error tone on an incorrect exam answer', async () => {
		setCallbacks(makeCallbacks());
		await handleVoiceInput('falsch');
		expect(playTone).toHaveBeenCalledWith('error');
	});

	it('increments exam score on correct answer', async () => {
		setCallbacks(makeCallbacks());
		await handleVoiceInput('Guten Morgen');
		expect(get(examStore).examScore).toBe(1);
	});

	it('records an SR success for the exam question on correct answer', async () => {
		setCallbacks(makeCallbacks());
		await handleVoiceInput('Guten Morgen');
		expect(recordSRAttempt).toHaveBeenCalledWith(1, 1, true);
	});

	it('sets examRetry=true on first incorrect attempt', async () => {
		setCallbacks(makeCallbacks());
		await handleVoiceInput('falsch');
		expect(get(examStore).examRetry).toBe(true);
	});

	it('records wrong answer and SR failure on second incorrect attempt', async () => {
		examStore.update((s) => ({ ...s, examRetry: true }));
		setCallbacks(makeCallbacks());

		await handleVoiceInput('falsch');

		expect(recordSRAttempt).toHaveBeenCalledWith(1, 1, false);
		expect(get(examStore).examWrongAnswers).toHaveLength(1);
	});
});

// ─── manualNext ───────────────────────────────────────────────────────────────

describe('manualNext', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetStores();
		lessonStore.update((s) => ({ ...s, currentLesson: sampleLesson }));
		appStore.update((s) => ({ ...s, currentDay: 1, currentSentenceIndex: 0 }));
	});

	it('advances currentSentenceIndex by 1', async () => {
		setCallbacks(makeCallbacks());
		await manualNext();
		expect(get(appStore).currentSentenceIndex).toBe(1);
	});

	it('calls onMessageBubble with the skipped sentence', async () => {
		const onMessageBubble = vi.fn();
		setCallbacks(makeCallbacks({ onMessageBubble }));

		await manualNext();

		expect(onMessageBubble).toHaveBeenCalledWith(sampleLesson.sentences[0]);
	});

	it('calls onScriptMarkDone with the current sentence index', async () => {
		const onScriptMarkDone = vi.fn();
		setCallbacks(makeCallbacks({ onScriptMarkDone }));

		await manualNext();

		expect(onScriptMarkDone).toHaveBeenCalledWith(0);
	});

	it('saves progress to the new index', async () => {
		setCallbacks(makeCallbacks());
		await manualNext();
		expect(saveProgress).toHaveBeenCalledWith(1, 1, expect.any(Number));
	});

	it('returns early when there is no lesson', async () => {
		lessonStore.update((s) => ({ ...s, currentLesson: null }));
		setCallbacks(makeCallbacks());

		// Should not throw or update the index
		await manualNext();
		expect(get(appStore).currentSentenceIndex).toBe(0);
	});
});

describe('manualNext double tap', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetStores();
		lessonStore.update((s) => ({ ...s, currentLesson: sampleLesson }));
		appStore.update((s) => ({ ...s, currentDay: 1, currentSentenceIndex: 0 }));
	});

	it('ignores a second tap straight after the first', async () => {
		const onMessageBubble = vi.fn();
		setCallbacks(makeCallbacks({ onMessageBubble }));

		await manualNext();
		await manualNext();

		expect(onMessageBubble).toHaveBeenCalledTimes(1);
		expect(get(appStore).currentSentenceIndex).toBe(1);
	});
});
