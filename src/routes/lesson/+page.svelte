<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import AppHeader from "$lib/components/AppHeader.svelte";
	import { appStore } from "$stores/app";
	import { preferencesStore, type Language } from "$stores/preferences";
	import { lessonStore, type Sentence } from "$stores/lesson";
	import { examStore } from "$stores/exam";
	import { isUnlocked, isWeekUnlocked } from "$services/lesson-access";
	import {
		setCallbacks,
		initLesson,
		processNextStep,
		manualNext,
		goToNextDay,
		jumpToSentence,
		changeDay,
		changeLanguage,
		handleVoiceInput as controllerHandleVoice,
		startExam,
		answerExamChoice,
		startReviewMode,
		startConversation,
		incrementSession,
		skipAndRemoveReviewItem,
		continueAfterGrammar,
		continueAfterWarmUp,
		type TeachStepData,
		type CompletionCardData,
		type GrammarMomentData,
		type WarmUpData,
		type ExamQuestionData,
		type ExamResultsData,
		type VoiceResultData,
		type ConvOption,
	} from "$services/lesson-controller";
	import {
		getLessonIndex,
		getGlossaryMeaning,
		hasLesson,
		type LessonMeta,
	} from "$services/lesson-loader";
	import { stopAllAudio, playAudioPromise, setLessonActive } from "$services/tts";
	import { tipFor } from "$services/pronunciation";
	import {
		recordMiss,
		rankMisses,
		MAX_SHOWN,
		type PronunciationMiss,
	} from "$services/pronunciation-log";
	import { trackEvent, pauseLessonAnalytics } from "$services/analytics";
	import { unlockAudioContext, playTone } from "$services/audio-context";
	import {
		initSpeechRecognition,
		setVoiceInputHandler,
		toggleMic,
		stopListening,
		getLastVoiceAlternatives,
		isSpeechSupported,
	} from "$services/speech";
	import SentencePractice from "$components/SentencePractice.svelte";
	import ConversationTurn from "$components/ConversationTurn.svelte";
	import { openerForDay } from "$services/conversation-openers";
	import { type Outcome } from "$services/practice-drills";
	import {
		recordPracticeResult,
		type ReadinessModule,
	} from "$services/readiness";
	import {
		getLanguage,
		setLanguage,
		getVoiceSpeed,
		setVoiceSpeed,
		saveWord,
		removeWord,
		getVocabulary,
		getBookmarks,
		addBookmark,
		removeBookmark,
	} from "$services/data-layer";
	import {
		bookmarkForReview,
		removeFromReview,
	} from "$services/spaced-repetition";
	import { loadGlossary } from "$services/lesson-loader";
	import { getTranslation, getTranslationLang } from "$utils/i18n";
	import { makeWordHighlighter } from "$utils/word-timing";
	import { initSyncListeners } from "$services/sync-queue";

	// ============ STATE ============
	let showOverlay = $state(true);
	/** When the start overlay went up, for the time-to-begin signal. */
	let overlayShownAt = Date.now();
	let isReady = $state(false);
	let chatMessages: ChatMessage[] = $state([]);
	let answerLineHtml = $state(
		'<span class="placeholder-text">Listen, then say your reply...</span>',
	);
	let currentTeachStep: TeachStepData | null = $state(null);
	let spokenWordIndex = $state(-1); // karaoke: German word currently being read
	let showHint = $state(false);
	let completionData: CompletionCardData | null = $state(null);
	let grammarMoment: GrammarMomentData | null = $state(null);
	let warmUp: WarmUpData | null = $state(null);

	let examQuestionData: ExamQuestionData | null = $state(null);
	let examResultsData: ExamResultsData | null = $state(null);
	let examProgressCurrent = $state(0);
	let examProgressTotal = $state(0);
	let systemMessages: string[] = $state([]);
	let voiceResult: VoiceResultData | null = $state(null);
	// Review-first flow: due SR items become a warm-up before the day's lesson.
	// Capped low on purpose — a big review wall before new material is the #1
	// "open app, feel guilt, close app" churn loop. The backlog lives in the
	// dedicated Review flow instead.
	const WARMUP_CAP = 3;
	let warmupThenLesson = $state(false);
	// Tap-based exam questions: index the user picked (-1 = not yet answered)
	let choiceAnswered = $state(-1);
	// Conversation mode: reply choices for the user's current turn
	let convOptions = $state<ConvOption[] | null>(null);

	function examTypeLabel(t: string, fa: boolean): string {
		if (t === "listen") return fa ? "🎧 گوش کن و تکرار کن" : "🎧 Listen & Repeat";
		if (t === "meaning") return fa ? "🔊 یعنی چه؟" : "🔊 What does it mean?";
		if (t === "gap") return fa ? "✍️ جای خالی را پر کن" : "✍️ Fill the blank";
		return fa ? "🗣️ به آلمانی بگو" : "🗣️ Say in German";
	}

	function examTypeColor(t: string): string {
		if (t === "listen") return "#f0b429";
		if (t === "meaning") return "#a569bd";
		if (t === "gap") return "#58d68d";
		return "#5dade2";
	}

	function handleChoiceTap(i: number) {
		if (choiceAnswered !== -1) return;
		choiceAnswered = i;
		answerExamChoice(i);
	}

	interface ChatMessage {
		id: number;
		type: "received" | "sent" | "system";
		text: string;
	}
	let msgCounter = 0;

	// Derived
	const app = $derived($appStore);
	const prefs = $derived($preferencesStore);
	const lesson = $derived($lessonStore);
	const exam = $derived($examStore);
	let isSpeaking = $state(false);

	const scenarioTitle = $derived(() => {
		if (!lesson.currentLesson) return "Loading...";
		const l = lesson.currentLesson;
		if (prefs.language === "fa" && l.titleFa) {
			const parts = l.titleFa.split(": ");
			return parts.length > 1 ? parts[1] : l.titleFa;
		}
		const parts = l.title.split(": ");
		return parts.length > 1 ? parts[1] : l.title;
	});

	const scenarioDescription = $derived(() => {
		if (!lesson.currentLesson) return null;
		const l = lesson.currentLesson;
		if (prefs.language === "fa" && l.descriptionFa) return l.descriptionFa;
		return l.description ?? null;
	});

	const lessonDifficulty = $derived(
		() => lesson.currentLesson?.difficulty ?? null,
	);
	const lessonGrammarFocus = $derived(() => {
		if (!lesson.currentLesson) return null;
		const l = lesson.currentLesson;
		if (prefs.language === "fa" && l.grammarFocusFa)
			return l.grammarFocusFa;
		return l.grammarFocus ?? null;
	});

	let lessonIndex = $state<LessonMeta[]>([]);

	// Group lessons into weeks for select
	const weekGroups = $derived(() => {
		const weeks: Record<number, LessonMeta[]> = {};
		for (const meta of lessonIndex) {
			const weekNum = Math.ceil(meta.day / 7);
			if (!weeks[weekNum]) weeks[weekNum] = [];
			weeks[weekNum].push(meta);
		}
		return weeks;
	});

	// ============ INTERACTIVE WORDS ============
	function createInteractiveWords(
		text: string,
	): Array<{ word: string; meaning: string | null }> {
		return text.split(" ").map((word) => {
			const cleanKey = word.toLowerCase().replace(/[.,!?]/g, "");
			const meaning = getGlossaryMeaning(cleanKey, 'en');
			return { word, meaning };
		});
	}

	let wordTooltip: {
		word: string;
		meaning: string;
		x: number;
		y: number;
	} | null = $state(null);
	let tooltipTimer: ReturnType<typeof setTimeout> | null = null;
	let savedWords = $state<Set<string>>(new Set());
	let bookmarkedSentences = $state<Set<string>>(new Set());
	const currentSentenceKey = $derived(
		`${app.currentDay}:${lesson.currentLesson?.sentences[app.currentSentenceIndex]?.id}`,
	);

	function handleWordClick(
		word: string,
		meaning: string | null,
		event: MouseEvent,
	) {
		stopAllAudio();
		if ($appStore.isListening) stopListening();

		// Play word
		const clean = word.replace(/[.,!?]/g, "");
		playAudioPromise(clean, 1, "de-DE");

		// Show tooltip
		if (meaning) {
			if (tooltipTimer) clearTimeout(tooltipTimer);
			const target = event.currentTarget as HTMLElement;
			const rect = target.getBoundingClientRect();
			wordTooltip = {
				word,
				meaning,
				x: rect.left + rect.width / 2,
				y: rect.top,
			};
			tooltipTimer = setTimeout(() => {
				wordTooltip = null;
			}, 5000);
		}
	}

	async function handleBookmarkWord() {
		if (!wordTooltip) return;
		const cleanWord = wordTooltip.word.toLowerCase().replace(/[.,!?]/g, "");
		const glossary = await loadGlossary();
		const entry = glossary[cleanWord];
		if (!entry) return;

		if (savedWords.has(cleanWord)) {
			await removeWord(cleanWord);
			savedWords = new Set(
				[...savedWords].filter((w) => w !== cleanWord),
			);
		} else {
			await saveWord(cleanWord, entry.en, entry.fa);
			savedWords = new Set([...savedWords, cleanWord]);
		}
	}

	async function handleBookmarkSentence() {
		const day = app.currentDay;
		const sentence =
			lesson.currentLesson?.sentences[app.currentSentenceIndex];
		if (!sentence) return;
		const key = `${day}:${sentence.id}`;

		if (bookmarkedSentences.has(key)) {
			removeBookmark(day, sentence.id);
			await removeFromReview(day, sentence.id);
			bookmarkedSentences = new Set(
				[...bookmarkedSentences].filter((k) => k !== key),
			);
		} else {
			addBookmark(day, sentence.id);
			await bookmarkForReview(day, sentence.id);
			bookmarkedSentences = new Set([...bookmarkedSentences, key]);
		}
	}

	async function handleRemoveFromReview() {
		await skipAndRemoveReviewItem();
		bookmarkedSentences = getBookmarks();
	}

	// ============ SCRIPT PANEL ============
	let scriptItems: Array<{
		german: string;
		translation: string;
		done: boolean;
		active: boolean;
	}> = $state([]);
	let showScript = $state(false);
	let showScenarioInfo = $state(false);

	function updateScript() {
		if (!lesson.currentLesson) return;
		const isLessonDone = !!(
			app.completedLessons && app.completedLessons[app.currentDay]
		);

		scriptItems = lesson.currentLesson.sentences.map((step, i) => {
			const german =
				step.role === "received" ? step.audioText! : step.targetText!;
			const translation = getTranslation(step, prefs.language);
			return {
				german,
				translation,
				done: isLessonDone || i < app.currentSentenceIndex,
				active: i === app.currentSentenceIndex,
			};
		});
	}

	// ============ CALLBACKS ============
	function setupCallbacks() {
		setCallbacks({
			onTeachStep(data) {
				currentTeachStep = data;
				spokenWordIndex = -1; // reset karaoke highlight for the new sentence
				showHint = false;
				completionData = null;
				grammarMoment = null;
				examQuestionData = null;
				examResultsData = null;
				voiceResult = null;
				isSpeaking = true; // audio is about to play
				updateScript();
			},
			onSpokenWord(index) {
				spokenWordIndex = index;
			},
			onWarmUp(data) {
				warmUp = data;
				if (data) {
					currentTeachStep = null;
					isSpeaking = false;
				}
			},
			onGrammarMoment(data) {
				grammarMoment = data;
				if (data) {
					currentTeachStep = null;
					isSpeaking = false;
					updateScript();
				}
			},
			onCompletionCard(data) {
				currentTeachStep = null;
				completionData = data;
				updateScript();
			},
			async onAnswerPrompt(message) {
				answerLineHtml = message;
				isSpeaking = false; // audio just finished
			},
			onMessageBubble(step) {
				currentTeachStep = null;
				voiceResult = null;
				const text =
					step.role === "received"
						? step.audioText!
						: step.targetText!;
				chatMessages = [
					...chatMessages,
					{ id: msgCounter++, type: step.role, text },
				];
				trimMessages();
			},
			onScriptHighlight(index) {
				scriptItems = scriptItems.map((item, i) => ({
					...item,
					active: i === index,
				}));
				setTimeout(() => {
					const active = scriptContainerEl?.children[index] as
						| HTMLElement
						| undefined;
					active?.scrollIntoView({
						block: "nearest",
						behavior: "smooth",
					});
				}, 50);
			},
			onScriptMarkDone(index) {
				if (scriptItems[index]) {
					scriptItems = scriptItems.map((item, i) =>
						i === index ? { ...item, done: true } : item,
					);
				}
			},
			onExamQuestion(data) {
				currentTeachStep = null;
				completionData = null;
				grammarMoment = null;
				examResultsData = null;
				voiceResult = null;
				choiceAnswered = -1;
				examQuestionData = data;
			},
			onExamFinished(data) {
				currentTeachStep = null;
				completionData = null;
				grammarMoment = null;
				examQuestionData = null;
				voiceResult = null;
				examResultsData = data;
				// Warm-up finished → show the result briefly, then flow into
				// today's lesson automatically.
				if (warmupThenLesson && data.wasReview) {
					warmupThenLesson = false;
					setTimeout(() => {
						examResultsData = null;
						systemMessages = [];
						processNextStep();
					}, 2500);
				}
			},
			onExamProgress(current, total) {
				examProgressCurrent = current;
				examProgressTotal = total;
			},
			onSystemMessage(text) {
				systemMessages = [...systemMessages, text];
			},
			onClearChat() {
				chatMessages = [];
				currentTeachStep = null;
				completionData = null;
				grammarMoment = null;
				examQuestionData = null;
				examResultsData = null;
				voiceResult = null;
				convOptions = null;
				// A new lesson starts a new list. Carrying yesterday's misses
				// into today would make the card a running tally, which is a
				// different and much more discouraging thing.
				lessonMisses = [];
				systemMessages = [];
				answerLineHtml = "";
				updateScript();
			},
			onVoiceResult(result) {
				voiceResult = result;
				if (!result.isCorrect) {
					lessonMisses = recordMiss(lessonMisses, {
						notes: result.soundNotes ?? [],
						missedWords: result.missedWords ?? [],
						matchPercentage: result.matchPercentage,
					});
				}
			},
			onConversationOptions(options) {
				convOptions = options;
			},
		});
	}

	// ============ EVENT HANDLERS ============
	function handleStart() {
		// secondsOnOverlay separates "read it and committed" from "sat there
		// deciding" — a long pause before Start is a different signal from a
		// quick one, and both differ from never pressing it at all.
		void trackEvent("lesson_begun", {
			day: app.currentDay,
			metadata: {
				sentenceCount: lesson.currentLesson?.sentences?.length ?? 0,
				secondsOnOverlay: overlayShownAt
					? Math.round((Date.now() - overlayShownAt) / 1000)
					: null,
			},
		});
		showOverlay = false;
		unlockAudioContext();
		if (isReady) {
			processNextStep();
		}
	}

	async function handleStartWithWarmup() {
		void trackEvent("lesson_begun", { day: app.currentDay, metadata: { entry: "warmup" } });
		showOverlay = false;
		unlockAudioContext();
		if (!isReady) return;
		warmupThenLesson = true;
		await startReviewMode(WARMUP_CAP);
		// Queue emptied since page load → nothing to warm up, go straight in.
		if (!exam.isExamMode) {
			warmupThenLesson = false;
			processNextStep();
		}
	}

	function handleMicClick() {
		if (isSpeaking) {
			stopAllAudio();
			return;
		}
		toggleMic();
	}

	// ── Practice mode ──────────────────────────────────────────────────
	// The retrieval ladder for one sentence, opened from its Practice button.
	// The lesson keeps running underneath; closing returns to exactly where
	// the learner was.
	let practiceSentence = $state<{ german: string; meaning: string; index: number } | null>(
		null,
	);
	let practiceEl = $state<SentencePractice | null>(null);

	// ── The free-response turn ──
	// Offered after the completion card, so the lesson is already credited.
	// Dark unless /proxy/converse says it has a key — the client cannot read
	// env, and flashing a card we cannot serve is worse than never showing it.
	/**
	 * Words that did not come out right, gathered across the whole lesson
	 * and shown once at the end. Feedback mid-sentence is momentary — by
	 * sentence nine you have forgotten sentence two — and the pattern only
	 * becomes visible in a list.
	 */
	let lessonMisses = $state<PronunciationMiss[]>([]);

	let converseAvailable = $state(false);
	let freeTurnEl = $state<ConversationTurn | null>(null);
	let freeTurnDone = $state(false);
	let freeTurnOffered = false;

	/** Shown only after a completed lesson, and only when configured. */
	const showFreeTurn = $derived(
		!!completionData &&
			converseAvailable &&
			!freeTurnDone &&
			!exam.isExamMode &&
			!exam.isConversation,
	);

	// Log the offer exactly once per lesson, so the funnel has a denominator
	// — how many people were shown this versus how many spoke.
	$effect(() => {
		if (showFreeTurn && !freeTurnOffered) {
			freeTurnOffered = true;
			void trackEvent("free_turn_offered", { day: app.currentDay });
		}
	});
	let micSupported = $state(false);

	function openPractice(german: string, meaning: string, index: number) {
		if (!german?.trim()) return;
		stopAllAudio();
		if (app.isListening) stopListening();
		// On mobile the script is a drawer over the content — leaving it open
		// would cover the panel it just launched.
		showScript = false;
		pauseLessonAnalytics();
		practiceSentence = { german, meaning, index };
		if (!exam.isExamMode && !exam.isConversation) void trackEvent('sentence_practice_opened', { day: app.currentDay, metadata: { index, mode: 'lesson' } });
	}

	function closePractice() {
		stopAllAudio();
		if (app.isListening) stopListening();
		practiceSentence = null;
		if (!exam.isExamMode && !exam.isConversation && currentTeachStep) pauseLessonAnalytics(false);
	}

	/**
	 * Which exam module each practice rung exercises. Building word order and
	 * choosing an article are written-accuracy skills; producing the sentence
	 * aloud from the translation is Sprechen. Nothing maps to Hören — the
	 * learner is reading, not listening — and inventing a mapping there would
	 * be the sort of made-up number this whole change is meant to remove.
	 */
	const RUNG_MODULE: Record<string, ReadinessModule> = {
		gap: "schreiben",
		speak: "sprechen",
	};

	/** Practice reports a rung result. Readiness is the only thing that
	 *  consumes it now — the per-word mastery meter is gone. */
	function handlePracticeResult(
		german: string,
		outcome: Outcome,
		guessable: boolean,
		kind: string,
	) {
		// A revealed answer is not evidence either way — it says the learner
		// asked rather than tried.
		const m = RUNG_MODULE[kind];
		if (outcome === 'revealed' && practiceSentence && !exam.isExamMode && !exam.isConversation) {
			void trackEvent('answer_revealed', { day: app.currentDay, metadata: { index: practiceSentence.index, mode: 'lesson' } });
		}
		if (m && outcome !== "revealed") {
			recordPracticeResult(m, outcome === "correct" ? 1 : 0, 1);
		}
	}

	function handleDaySelectChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value;
		if (val.startsWith("exam") || val.startsWith("talk")) {
			// Exams/conversations start immediately — dismiss the start
			// overlay if it's still up (picked straight from the dropdown).
			showOverlay = false;
			unlockAudioContext();
			if (val.startsWith("exam")) {
				startExam(parseInt(val.replace("exam", "")));
			} else {
				startConversation(parseInt(val.replace("talk", "")));
			}
		} else {
			changeDay(parseInt(val));
		}
	}

	function handleLanguageSelectChange(e: Event) {
		const val = (e.target as HTMLSelectElement).value as Language;
		preferencesStore.update((s) => ({ ...s, language: val }));
		setLanguage(val);
		changeLanguage(val);
	}

	function handleSpeedSelectChange(e: Event) {
		const val = parseFloat((e.target as HTMLSelectElement).value);
		preferencesStore.update((s) => ({ ...s, voiceSpeed: val }));
		setVoiceSpeed(val);
	}

	function handleBlindModeChange(e: Event) {
		const checked = (e.target as HTMLInputElement).checked;
		if (!checked && prefs.blindMode && currentTeachStep && !exam.isExamMode && !exam.isConversation) {
			void trackEvent('answer_revealed', { day: app.currentDay, metadata: { index: app.currentSentenceIndex, mode: 'lesson' } });
		}
		preferencesStore.update((s) => ({ ...s, blindMode: checked }));
	}

	function handleHintToggle() {
		showHint = !showHint;
		if (showHint && !exam.isExamMode && !exam.isConversation) void trackEvent('hint_opened', { day: app.currentDay, metadata: { index: app.currentSentenceIndex, mode: 'lesson' } });
	}

	function handleSpeakerClick() {
		if (!currentTeachStep) return;
		if (isSpeaking) {
			incrementSession();
			stopAllAudio();
			isSpeaking = false;
			spokenWordIndex = -1;
			return;
		}
		if ($appStore.isListening) stopListening();
		stopAllAudio();
		isSpeaking = true;
		if (!exam.isExamMode && !exam.isConversation) void trackEvent('audio_replayed', { day: app.currentDay, metadata: { index: app.currentSentenceIndex, mode: 'lesson' } });
		const highlight = makeWordHighlighter(
			currentTeachStep.germanText,
			(i) => (spokenWordIndex = i),
		);
		playAudioPromise(
			currentTeachStep.germanText,
			1,
			"de-DE",
			highlight,
			currentTeachStep.role === "received" ? "b" : "a",
		).then(() => {
			isSpeaking = false;
			spokenWordIndex = -1;
		});
	}

	function handleScriptItemClick(index: number) {
		jumpToSentence(index);
		showScript = false; // close mobile drawer after selecting a sentence
	}

	function handleMessageBubbleClick(text: string) {
		stopAllAudio();
		if ($appStore.isListening) stopListening();
		playAudioPromise(text, 1, "de-DE");
	}

	function trimMessages() {
		if (chatMessages.length > 80) {
			chatMessages = chatMessages.slice(-80);
		}
	}

	// ============ LIFECYCLE ============
	let chatHistoryEl: HTMLDivElement | undefined = $state(undefined);
	let scriptContainerEl: HTMLElement | undefined = $state(undefined);

	$effect(() => {
		// Auto-scroll when messages change
		if (
			chatHistoryEl &&
			(chatMessages.length > 0 ||
				currentTeachStep ||
				completionData ||
				examQuestionData)
		) {
			setTimeout(() => {
				chatHistoryEl!.scrollTop = chatHistoryEl!.scrollHeight;
			}, 50);
		}
	});

	onMount(async () => {
		// German speaking pace follows the open lesson while this page is up.
		setLessonActive(true);
		setupCallbacks();
		initSyncListeners();
		micSupported = initSpeechRecognition() && isSpeechSupported();
		getLessonIndex().then((idx) => {
			lessonIndex = idx;
		});
		// One owner for speech recognition. When practice is open it gets the
		// transcript instead of the controller, so nothing has to be swapped
		// out and restored around the panel.
		setVoiceInputHandler((transcript: string) => {
			if (practiceSentence) {
				practiceEl?.handleVoice(transcript, getLastVoiceAlternatives());
				return;
			}
			if (showFreeTurn) {
				freeTurnEl?.handleVoice(transcript);
				return;
			}
			controllerHandleVoice(transcript);
		});

		// Fire-and-forget on purpose. This has no business delaying the
		// lesson, and a lesson that will not load because an availability
		// probe hung is a mistake this codebase has already made three times.
		fetch("/proxy/converse")
			.then((r) => r.json())
			.then((d) => (converseAvailable = !!d?.available))
			.catch(() => {});

		const requestedDay = new URLSearchParams(window.location.search).get("day");
		await initLesson(requestedDay === null ? undefined : Number(requestedDay));
		isReady = true;

		// Load saved vocabulary words
		getVocabulary().then((words) => {
			savedWords = new Set(words.map((w) => w.word));
		});

		// Load bookmarked sentences
		bookmarkedSentences = getBookmarks();

		// Check for ?mode=review query param (coming from /review "Start Quiz")
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.get("mode") === "review") {
			showOverlay = false;
			unlockAudioContext();
			startReviewMode();
			window.history.replaceState({}, "", "/lesson");
			return;
		}

		// (No due-count fetch: the start overlay no longer offers a warm-up.)

		// If no overlay needed (already clicked), start
		if (!showOverlay) {
			processNextStep();
		}
	});

	onDestroy(() => {
		setLessonActive(false);
		if (typeof window !== "undefined") {
			stopAllAudio();
			stopListening();
		}
	});
</script>

<!-- Escape leaves practice. A drill you cannot back out of with the keyboard
     is a trap for anyone not using a mouse. -->
<svelte:window
	onkeydown={(e) => {
		if (e.key === "Escape" && practiceSentence) closePractice();
	}}
/>

<svelte:head>
	<title>Mirifer - Learn German</title>
</svelte:head>

<!-- Audio Unlock Overlay -->
{#if showOverlay}
	<!-- dir follows the language. Everything inside was English, so in
	     Persian it rendered LTR text in an RTL page and the punctuation
	     drifted: "?Ready to Learn", "sentences 10". Translating is the fix
	     — Persian text in an RTL container is simply correct — and the dir
	     keeps anything added later honest. -->
	<div class="start-overlay" dir={prefs.language === "fa" ? "rtl" : "ltr"}>
		<h1>
			{prefs.language === "fa" ? "آمادهٔ یادگیری؟" : "Ready to Learn?"}
		</h1>
		{#if lesson.currentLesson}
			<div class="overlay-preview">
				<h2 class="overlay-title">{scenarioTitle()}</h2>
				{#if scenarioDescription()}
					<p class="overlay-desc">{scenarioDescription()}</p>
				{/if}
				<div class="overlay-tags">
					{#if lessonGrammarFocus()}
						<span class="overlay-badge grammar-tag"
							>{lessonGrammarFocus()}</span
						>
					{/if}
					<span class="overlay-badge">
						{lesson.currentLesson.sentences.length}
						{prefs.language === "fa" ? "جمله" : "sentences"}
					</span>
				</div>
			</div>
		{:else}
			<p>
				{prefs.language === "fa"
					? "در حال بارگذاری اطلاعات درس…"
					: "Loading lesson details…"}
			</p>
		{/if}
		<!-- Review warm-up removed from the start overlay: it pushed the real
		     Start button below the fold. Reviews stay available on their own
		     in /review; handleStartWithWarmup() is kept for when we bring an
		     opt-in version back. -->
		<button class="start-btn" onclick={handleStart} disabled={!isReady}>
			{isReady
				? prefs.language === "fa"
					? "▶ شروع درس"
					: "▶ Start Lesson"
				: prefs.language === "fa"
					? "⏳ در حال بارگذاری..."
					: "⏳ Loading..."}
		</button>
	</div>
{/if}

{#snippet lessonSecondaryControls()}
	<div class="lesson-toolbar-content">
		<div class="lesson-toolbar-primary">
			<div class="day-selection-control">
				<label for="day-select">
					<span aria-hidden="true">📅</span>
					{prefs.language === "fa" ? "روز:" : "Day:"}
				</label>
			<select
				id="day-select"
				aria-label={prefs.language === "fa" ? "انتخاب روز" : "Select day"}
				onchange={handleDaySelectChange}
				value={app.currentDay.toString()}
			>
				{#each Object.entries(weekGroups()) as [weekNum, days]}
					<optgroup
						label={prefs.language === "fa"
							? `هفته ${weekNum}`
							: `Week ${weekNum}`}
					>
						{#each days as meta}
							{@const isCompleted = !!(
								app.completedLessons &&
								app.completedLessons[meta.day]
							)}
							{@const locked = !isUnlocked(meta.day, app.completedLessons)}
							<option
								value={meta.day.toString()}
								selected={meta.day === app.currentDay}
								disabled={locked}
							>
								{locked ? "🔒 " : isCompleted ? "✅ " : ""}{prefs.language ===
									"fa" && meta.titleFa
									? `${meta.day}: ${meta.titleFa}`
									: meta.title}
							</option>
						{/each}
						{#if days.length === 7}
							{@const weekOpen = isWeekUnlocked(
								Number(weekNum),
								app.completedLessons,
								hasLesson,
							)}
							<option value="exam{weekNum}" disabled={!weekOpen}>
								{weekOpen ? "" : "🔒 "}{prefs.language === "fa"
									? `آزمون هفته ${weekNum}`
									: `Week ${weekNum} Exam`}
							</option>
							<option value="talk{weekNum}" disabled={!weekOpen}>
								{weekOpen ? "💬 " : "🔒 "}{prefs.language === "fa"
									? `گفتگوی هفته ${weekNum}`
									: `Week ${weekNum} Talk`}
							</option>
						{/if}
					</optgroup>
				{/each}
			</select>
		</div>
		</div>

		<div class="lesson-toolbar-options">
			<div class="blind-mode-control">
				<input
					type="checkbox"
					id="blind-mode-toggle"
					checked={prefs.blindMode}
					onchange={handleBlindModeChange}
				/>
				<label for="blind-mode-toggle">
					🙈 <span>{prefs.language === "fa" ? "حالت پنهان" : "Blind Mode"}</span>
				</label>
			</div>

			<div class="language-control">
				<select
					id="language-select"
					aria-label={prefs.language === "fa" ? "انتخاب زبان" : "Select language"}
					value={prefs.language}
					onchange={handleLanguageSelectChange}
				>
					<option value="fa">فارسی</option>
					<option value="en">English</option>
				</select>
			</div>

			<div class="speed-control">
				<select
					id="speed-select"
					aria-label={prefs.language === "fa"
						? "سرعت صدای آلمانی"
						: "German voice speed"}
					title={prefs.language === "fa"
						? "سرعت صدای آلمانی"
						: "German voice speed"}
					value={prefs.voiceSpeed.toString()}
					onchange={handleSpeedSelectChange}
				>
					<option value="1">{"🔊 🇩🇪 1x"}</option>
					<option value="0.75">{"🔉 🇩🇪 0.75x"}</option>
				</select>
			</div>

		</div>
	</div>
{/snippet}

<div class="container" class:hidden={showOverlay}>
	<AppHeader
		title={prefs.language === "fa" ? "درس‌های روزانه" : "Daily Lessons"}
		icon="📖"
		backHref="/home"
		backLabel={prefs.language === "fa" ? "خانه" : "Home"}
		secondary={lessonSecondaryControls}
		secondaryLabel={prefs.language === "fa" ? "کنترل‌های درس" : "Lesson controls"}
		sticky
		variant="brand"
		direction={prefs.language === "fa" ? "rtl" : "ltr"}
	/>

	<!-- Main Learning Area -->
	<main
		id="main-content"
		tabindex="-1"
		class="learning-area"
		class:practicing={!!practiceSentence}
	>
		{#if practiceSentence}
			<!-- Practice takes over the content area, never the whole page:
			     the lesson is still there underneath and Back returns to it. -->
			<div class="practice-host">
				<SentencePractice
					bind:this={practiceEl}
					sentence={practiceSentence}
					lang={prefs.language}
					micAvailable={micSupported}
					isListening={app.isListening}
					onToggleMic={toggleMic}
					onExit={closePractice}
					onResult={handlePracticeResult}
				/>
			</div>
		{/if}

		<!-- Mobile script toggle bar — top of content area on mobile -->
		<button
			class="script-toggle-btn"
			onclick={() => (showScript = !showScript)}
			aria-label="Toggle lesson script"
		>
			📋 {prefs.language === "fa" ? "متن درس" : "Script"}
			{#if lesson.currentLesson}
				<span class="script-toggle-count">
					{Math.min(
						app.currentSentenceIndex + 1,
						lesson.currentLesson.sentences.length,
					)} / {lesson.currentLesson.sentences.length}
				</span>
			{/if}
			<span class="script-toggle-arrow" class:open={showScript}>▼</span>
		</button>

		<div class="chat-wrapper">
			<!-- Lesson Progress Bar -->
			{#if lesson.currentLesson && !exam.isExamMode}
				{@const total = lesson.currentLesson.sentences.length}
				{@const current = Math.min(app.currentSentenceIndex, total)}
				<div class="lesson-progress">
					<div
						class="lesson-progress-fill"
						style="width: {total > 0
							? Math.round((current / total) * 100)
							: 0}%"
					></div>
				</div>
			{/if}

			<!-- Content row: chat + sidebar side-by-side (desktop only) -->
			<div class="chat-body">
				<div class="chat-main">
					<!-- Current Sentence Area (one sentence at a time, centered) -->
					<div
						class="chat-history"
						bind:this={chatHistoryEl}
						role="log"
						aria-live="polite"
						aria-label="Current sentence"
					>
						{#each systemMessages as msg}
							<div class="message system">
								<div class="text">{msg}</div>
							</div>
						{/each}

						<!-- Exam Progress Bar -->
						{#if exam.isExamMode}
							<div class="exam-progress-bar">
								<div
									class="exam-progress-fill"
									style="width: {examProgressTotal > 0
										? Math.round(
												(examProgressCurrent /
													examProgressTotal) *
													100,
											)
										: 0}%"
								></div>
							</div>
						{/if}

						<!-- Chat bubbles (conversation mode dialogue history) -->
						{#each chatMessages as msg (msg.id)}
							{#if msg.type === "system"}
								<div class="message system">{msg.text}</div>
							{:else}
								<!-- German, so LTR regardless of interface language.
								     The system branch above is narration in the
								     learner's own language and must not get this. -->
								<div
									class="message {msg.type}"
									lang="de"
									dir="ltr"
									role="button"
									tabindex="0"
									onclick={() =>
										handleMessageBubbleClick(msg.text)}
									onkeydown={(e) =>
										e.key === "Enter" &&
										handleMessageBubbleClick(msg.text)}
								>
									{msg.text}
								</div>
							{/if}
						{/each}

						<!-- Exam Question -->
						{#if examQuestionData}
							<div
								class="message received"
								style="border-left: 4px solid {examTypeColor(
									examQuestionData.type,
								)}"
							>
								<div class="avatar">🎓</div>
								<div class="content">
									<div
										class="sub-text"
										style="font-size:0.75em; color:{examTypeColor(
											examQuestionData.type,
										)}; font-weight:bold; margin-bottom:4px;"
									>
										{examTypeLabel(
											examQuestionData.type,
											examQuestionData.language === "fa",
										)}
									</div>
									<div
										class="text"
										style={examQuestionData.language ===
											"fa" &&
										(examQuestionData.type === "speak" ||
											examQuestionData.type === "listen")
											? "direction:rtl;"
											: ""}
									>
										{examQuestionData.prompt}
									</div>
									{#if examQuestionData.options}
										<div class="choice-options">
											{#each examQuestionData.options as opt, i}
												<button
													class="choice-btn"
													class:correct={choiceAnswered !==
														-1 &&
														i ===
															examQuestionData.correctIndex}
													class:wrong={choiceAnswered ===
														i &&
														i !==
															examQuestionData.correctIndex}
													disabled={choiceAnswered !==
														-1}
													style={examQuestionData.type ===
														"meaning" &&
													examQuestionData.language ===
														"fa"
														? "direction:rtl; text-align:right;"
														: ""}
													onclick={() =>
														handleChoiceTap(i)}
												>
													{opt}
												</button>
											{/each}
										</div>
									{/if}
									<div
										class="sub-text"
										style="font-size:0.8em; color:var(--ink-soft);"
									>
										{examQuestionData.language === "fa"
											? `سوال ${examQuestionData.questionNumber} از ${examQuestionData.totalQuestions}`
											: `Question ${examQuestionData.questionNumber}/${examQuestionData.totalQuestions}`}
									</div>
									{#if exam.isReviewMode}
										<button
											class="btn-remove-review"
											onclick={handleRemoveFromReview}
										>
											{examQuestionData.language === "fa"
												? "🗑️ حذف از مرور"
												: "🗑️ Remove"}
										</button>
									{/if}
								</div>
							</div>
						{/if}

						<!-- Conversation: your turn — pick a reply and say it -->
						{#if convOptions}
							<div class="conv-panel">
								<div class="conv-title">
									{prefs.language === "fa"
										? "🎙️ نوبت توست — یکی را انتخاب کن و بگو:"
										: "🎙️ Your turn — say one of these:"}
								</div>
								{#each convOptions as opt}
									<div class="conv-option">
										<div class="conv-german">
											<span lang="de">{opt.german}</span>
										</div>
										<div
											class="conv-translation"
											style="direction:{prefs.language ===
											'fa'
												? 'rtl'
												: 'ltr'};"
										>
											{opt.translation}
										</div>
									</div>
								{/each}
							</div>
						{/if}

						<!-- Correct Feedback Banner -->
						{#if voiceResult?.isCorrect}
							<div class="correct-banner">
								{prefs.language === "fa"
									? "✅ آفرین!"
									: "✅ Correct!"}
							</div>
						{/if}

						<!-- Sound coaching. Only appears when the error is one we
						     can actually name — see pronunciation.ts. -->
						{#each voiceResult?.soundNotes ?? [] as note (note.contrast.id)}
							<div class="sound-note">
								<div class="sound-note-head">
									<span class="sound-note-label" lang="de" dir="ltr"
										>{note.contrast.label}</span
									>
									<span class="sound-note-diff" lang="de" dir="ltr">
										<span class="said">{note.heard}</span>
										<span aria-hidden="true">→</span>
										<span class="want">{note.target}</span>
									</span>
									<button
										class="sound-note-play"
										onclick={() =>
											playAudioPromise(note.target, 0.7, "de-DE")}
										aria-label={prefs.language === "fa"
											? "شنیدن تلفظ درست"
											: "Hear it pronounced"}>🔊</button
									>
								</div>
								<p
									class="sound-note-tip"
									dir={prefs.language === "fa" ? "rtl" : "ltr"}
								>
									{tipFor(note.contrast, prefs.language)}
								</p>
							</div>
						{/each}

						<!-- Teach Bubble -->
						{#if currentTeachStep}
							{@const words = createInteractiveWords(
								currentTeachStep.germanText,
							)}
							<div class="message instruction">
								{#if currentTeachStep.difficulty}
									<span
										class="difficulty-badge difficulty-{currentTeachStep.difficulty}"
										>{currentTeachStep.difficulty}</span
									>
								{/if}
								<div
									class="translation-line"
									style="direction:{currentTeachStep.language ===
									'fa'
										? 'rtl'
										: 'ltr'};"
								>
									{currentTeachStep.translationText}
								</div>
								<!-- dir="ltr" is load-bearing, not decoration. A German
								     sentence inside an RTL page hands its trailing "?" or
								     "." to the paragraph direction, and the mark jumps to
								     the left end: "?bist" instead of "bist?". -->
								<div class="german-line" lang="de" dir="ltr">
									<span class="teach-text">
										{#if prefs.blindMode}
											<span
												style="color:var(--ink-faint); font-weight:normal;"
											>
												{currentTeachStep.language ===
												"fa"
													? "🙈 [مخفی] - گوش کن!"
													: "🙈 [Hidden] - Listen!"}
											</span>
										{:else}
											{#each words as w, i}
												<!-- svelte-ignore a11y_interactive_supports_focus -->
												<span
													class="interactive-word"
													class:reading={i ===
														spokenWordIndex}
													class:success={voiceResult &&
														voiceResult
															.matchedWordIndices?.[
															i
														] === true}
													class:error={voiceResult &&
														voiceResult.isCorrect ===
															false &&
														voiceResult
															.matchedWordIndices?.[
															i
														] === false}
													role="button"
													tabindex="0"
													aria-label="{w.word}{w.meaning
														? `, meaning: ${w.meaning}`
														: ''}"
													data-meaning={w.meaning ||
														undefined}
													onclick={(e) =>
														handleWordClick(
															w.word,
															w.meaning,
															e,
														)}
													onkeydown={(e) => {
														if (
															e.key === "Enter" ||
															e.key === " "
														) {
															e.preventDefault();
															handleWordClick(
																w.word,
																w.meaning,
																e as any,
															);
														}
													}}>{w.word}</span
												>{" "}
											{/each}
										{/if}
									</span>
								</div>
								<div class="teach-actions">
									<!-- One button, two jobs. While audio is playing it
									     STOPS it, so the name has to say so — the
									     waveform alone told a screen reader nothing,
									     and the label still said "Replay". -->
									<button
										class="btn-replay"
										class:speaking={isSpeaking}
										onclick={handleSpeakerClick}
										aria-label={isSpeaking
											? currentTeachStep.language === "fa"
												? "توقف صدا"
												: "Stop audio"
											: currentTeachStep.language === "fa"
												? "پخش دوباره"
												: "Replay audio"}
									>
										{#if isSpeaking}
											<span class="audio-wave" aria-hidden="true">
												<span></span><span></span><span
												></span><span></span><span
												></span>
											</span>
											<span class="sr-only">
												{currentTeachStep.language === "fa"
													? "توقف"
													: "Stop"}
											</span>
										{:else}
											{currentTeachStep.language === "fa"
												? "🔊 دوباره"
												: "🔊 Replay"}
										{/if}
									</button>
									<!-- The mic belongs where the sentence is, beside the
									     button that reads it aloud.

									     On EVERY step, not just the learner's own. It was
									     gated to 'sent' on the theory that there is nothing
									     to say back to the other speaker — but repeating
									     what you just heard is shadowing, and
									     evaluateVoiceInput already scores a received line
									     against its audioText. The gate blocked a technique
									     the controller supported, and it moved the mic
									     between the card and the page footer depending on
									     whose line it was, which is worse than either
									     position alone. -->
									{#if micSupported}
										<button
											class="btn-record"
											class:recording={app.isListening}
											onclick={handleMicClick}
											aria-label={app.isListening
												? "Stop recording"
												: "Record your answer"}
										>
											{app.isListening
												? currentTeachStep.language === "fa"
													? "🛑 تمام"
													: "🛑 Stop"
												: currentTeachStep.language === "fa"
													? "🎤 بگو"
													: "🎤 Say it"}
										</button>
									{/if}
									{#if currentTeachStep.role === "sent" && (currentTeachStep.hint || currentTeachStep.hintFa)}
										<button
											class="btn-hint"
											onclick={handleHintToggle}
											aria-label="Toggle hint"
										>
											💡 {currentTeachStep.language ===
											"fa"
												? "راهنما"
												: "Hint"}
										</button>
									{/if}
									<button
										class="btn-inline-next"
										onclick={() => manualNext()}
									>
										{currentTeachStep.language === "fa"
											? "بعدی ←"
											: "Next ➡"}
									</button>
									{#if !exam.isExamMode && !exam.isReviewMode}
										<button
											class="btn-bookmark"
											class:bookmarked={bookmarkedSentences.has(
												currentSentenceKey,
											)}
											onclick={handleBookmarkSentence}
											aria-label={bookmarkedSentences.has(
												currentSentenceKey,
											)
												? "Remove bookmark"
												: "Bookmark sentence"}
										>
											{#if bookmarkedSentences.has(currentSentenceKey)}
												★
											{:else}
												☆
											{/if}
										</button>
									{/if}
								</div>
								{#if showHint && currentTeachStep.role === "sent"}
									<div
										class="hint-text"
										dir={currentTeachStep.language === "fa"
											? "rtl"
											: "ltr"}
									>
										{currentTeachStep.language === "fa" &&
										currentTeachStep.hintFa
											? currentTeachStep.hintFa
											: (currentTeachStep.hint ?? "")}
									</div>
								{/if}
							</div>
						{/if}

						<!-- Warm-up: today's building blocks, before the conversation.
						     Pre-teach then encounter in context — every item here
						     turns up in the dialogue that follows. -->
						{#if warmUp}
							<div class="message system warm-up">
								<div class="text">
									<div class="wu-head">
										<span class="wu-badge"
											>🧱 {warmUp.language === "fa"
												? "بلوک‌های امروز"
												: "Today's building blocks"}</span
										>
									</div>

									{#if warmUp.words.length}
										<p class="wu-label">
											{warmUp.language === "fa" ? "واژه‌ها" : "Words"}
										</p>
										<div class="wu-grid">
											{#each warmUp.words as w}
												<button
													class="wu-chip"
													onclick={() => playAudioPromise(w.de, 1, "de-DE")}
												>
													<span class="wu-de" lang="de">{w.de}</span>
													<span class="wu-gloss">{w.gloss}</span>
												</button>
											{/each}
										</div>
									{/if}

									{#if warmUp.collocations.length}
										<p class="wu-label">
											{warmUp.language === "fa"
												? "ترکیب‌های ثابت"
												: "Phrases to learn whole"}
										</p>
										<div class="wu-grid">
											{#each warmUp.collocations as c}
												<button
													class="wu-chip phrase"
													onclick={() => playAudioPromise(c.de, 1, "de-DE")}
												>
													<span class="wu-de" lang="de">{c.de}</span>
													<span class="wu-gloss">{c.gloss}</span>
												</button>
											{/each}
										</div>
									{/if}

									<p class="wu-hint">
										{warmUp.language === "fa"
											? "روی هر کدام بزن تا بشنوی — همه‌شان در گفتگوی امروز می‌آیند."
											: "Tap any of them to hear it — they all turn up in today's conversation."}
									</p>

									<button class="gm-continue" onclick={() => continueAfterWarmUp()}>
										{warmUp.language === "fa"
											? "شروع گفتگو ←"
											: "Start the conversation →"}
									</button>
								</div>
							</div>
						{/if}

						<!-- Grammar Moment (after the last sentence, before completion) -->
						{#if grammarMoment}
							<div class="message system grammar-moment">
								<div class="text">
									<div class="gm-head">
										<span class="gm-badge"
											>📘 {grammarMoment.language === "fa"
												? "نکتهٔ گرامری"
												: "Grammar moment"}</span
										>
									</div>
									<h3 class="gm-title">{grammarMoment.title}</h3>
									<p
										class="gm-explanation"
										dir={grammarMoment.language === "fa" ? "rtl" : "ltr"}
									>
										{grammarMoment.explanation}
									</p>
									{#if grammarMoment.examples.length}
										<ul class="gm-examples">
											{#each grammarMoment.examples as ex (ex.de)}
												<li>
													<button
														class="gm-play"
														onclick={() =>
															playAudioPromise(ex.de, 1, "de-DE")}
														aria-label="Play example"
													>
														🔊
													</button>
													<span class="gm-de">{ex.de}</span>
													{#if ex.gloss}
														<span
															class="gm-gloss"
															dir={grammarMoment.language === "fa"
																? "rtl"
																: "ltr"}>{ex.gloss}</span
														>
													{/if}
												</li>
											{/each}
										</ul>
									{/if}
									<div class="gm-actions">
										{#if grammarMoment.basicsKey}
											<a
												class="gm-basics"
												href="/basics/{grammarMoment.basicsKey}"
											>
												{grammarMoment.language === "fa"
													? "بیشتر در مبانی ←"
													: "More in Basics →"}
											</a>
										{/if}
										<button
											class="gm-continue"
											onclick={() => continueAfterGrammar()}
										>
											{grammarMoment.language === "fa"
												? "فهمیدم ←"
												: "Got it →"}
										</button>
									</div>
								</div>
							</div>
						{/if}

						<!-- Completion Card -->
						{#if completionData}
							<div class="message system completion-card">
								<div class="text" style="text-align:center;">
									<div
										style="font-size:2.5em; margin-bottom:10px;"
									>
										🎉
									</div>
									<h2 style="margin:0 0 5px; color:var(--leaf);">
										{completionData.language === "fa"
											? "\u0622\u0641\u0631\u06CC\u0646!"
											: "Well Done!"}
									</h2>
									<p style="color:var(--ink-soft); margin:0 0 8px;">
										{completionData.language === "fa"
											? `\u0631\u0648\u0632 ${app.currentDay} \u0631\u0627 \u062A\u0645\u0627\u0645 \u06A9\u0631\u062F\u06CC\u062F!`
											: `Day ${app.currentDay} complete!`}
									</p>
									<div class="completion-stats">
										{#if lesson.currentLesson}
											<span class="comp-stat"
												>{lesson.currentLesson.sentences
													.length}
												{completionData.language ===
												"fa"
													? "جمله"
													: "sentences"}</span
											>
										{/if}
										{#if app.completedLessons}

											<span class="comp-stat"
												>📚 {Object.keys(
													app.completedLessons,
												).length}
												{completionData.language ===
												"fa"
													? "روز کامل شده"
													: "days done"}</span
											>
										{/if}
									</div>
									{#if completionData.readinessBefore !== null && completionData.readinessAfter !== null}
										{@const delta =
											completionData.readinessAfter -
											completionData.readinessBefore}
										<div class="comp-readiness">
											🎓
											{completionData.language === "fa"
												? "آمادگی گوته"
												: "Goethe readiness"}:
											{#if delta > 0}
												<span class="cr-was"
													>{completionData.readinessBefore}</span
												>
												<span class="cr-now"
													>{completionData.readinessAfter}/100</span
												>
												<span class="cr-delta">+{delta}</span>
											{:else}
												<span class="cr-now"
													>{completionData.readinessAfter}/100</span
												>
											{/if}
										</div>
									{/if}
									{#if completionData.nextDay}
										<!-- Names the unlock rather than just the
										     next day. Finishing this lesson is what
										     produced the next one, and saying so is
										     the whole reward — there are no streaks
										     or gems doing that job here. -->
										<p class="unlock-line">
											{completionData.language === "fa"
												? `🔓 روز ${completionData.nextDay} باز شد`
												: `🔓 Day ${completionData.nextDay} unlocked`}
										</p>
										<button
											class="next-day-btn"
											onclick={() =>
												goToNextDay(
													completionData!.nextDay!,
												)}
										>
											{completionData.language === "fa"
												? "\u062F\u0631\u0633 \u0628\u0639\u062F\u06CC"
												: "Next Lesson"} &rarr;
											<span
												style="font-weight:400; font-size:0.9em;"
												>{completionData.nextLessonTitle ||
													""}</span
											>
										</button>
									{:else}
										<p
											style="color:var(--ink-faint); margin-top:10px;"
										>
											{completionData.language === "fa"
												? "همه درس‌ها را تمام کردید! 🏆"
												: "All lessons completed! 🏆"}
										</p>
									{/if}
									<!-- Words to work on. Not a score — the lesson is already
									     complete and credited above this. Diagnosed sounds come
									     first because they come with something to do. -->
									{#if lessonMisses.length}
										<div class="comp-misses">
											<h4>
												{completionData.language === "fa"
													? "تلفظ این کلمه‌ها را تمرین کن"
													: "Words to practise"}
											</h4>
											{#each rankMisses(lessonMisses).slice(0, MAX_SHOWN) as m (m.word)}
												<div class="cm-row">
													<button
														class="cm-word"
														lang="de"
														dir="ltr"
														onclick={() => playAudioPromise(m.word, 1, "de-DE")}
														aria-label={`Hear ${m.word}`}
													>
														🔊 {m.word}
													</button>
													{#if m.contrast}
														{@const c = m.contrast}
														<span class="cm-sound" dir="ltr">{c.label}</span>
														<span class="cm-tip">
															{tipFor(c, completionData.language)}
														</span>
													{:else if m.times > 1}
														<span class="cm-tip">
															{completionData.language === "fa"
																? `${m.times} بار`
																: `missed ${m.times}×`}
														</span>
													{/if}
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						{/if}

						<!-- The one turn where the learner says their own words.
						     After the completion card on purpose: the lesson is
						     already credited, so skipping this costs nothing. -->
						{#if showFreeTurn}
							{@const op = openerForDay(app.currentDay)}
							<ConversationTurn
								bind:this={freeTurnEl}
								scenario={scenarioDescription() ||
									scenarioTitle() ||
									'An everyday conversation in German.'}
								vocab={(lesson.currentLesson?.sentences ?? [])
									.map((s) => s.targetText || s.audioText || '')
									.filter(Boolean)}
								opener={op.de}
								openerTranslation={prefs.language === 'fa' ? op.fa : op.en}
								lang={prefs.language}
								micAvailable={micSupported}
								isListening={app.isListening}
								onToggleMic={handleMicClick}
								onBegin={() =>
									trackEvent('free_turn_begun', { day: app.currentDay })}
								onFinish={(turns) => {
									freeTurnDone = true;
									if (app.isListening) stopListening();
									void trackEvent('free_turn_completed', {
										day: app.currentDay,
										metadata: { turns },
									});
								}}
							/>
						{/if}

						<!-- Exam Results -->
						{#if examResultsData}
							<div
								class="message system"
								style="background:{examResultsData.percentage >=
								80
									? 'var(--leaf-wash)'
									: 'var(--accent-wash)'}; padding:20px; border-radius:15px;"
							>
								<div class="text" style="text-align:center">
									<h2 style="margin:0">
										{#if examResultsData.percentage >= 80}
											{examResultsData.wasReview
												? examResultsData.language ===
													"fa"
													? "🎉 مرور عالی بود!"
													: "🎉 Great Review!"
												: examResultsData.language ===
													  "fa"
													? "🎉 آفرین!"
													: "🎉 Well Done!"}
										{:else}
											{examResultsData.wasReview
												? examResultsData.language ===
													"fa"
													? "🔄 ادامه بده!"
													: "🔄 Keep Going!"
												: examResultsData.language ===
													  "fa"
													? "📚 بیشتر تمرین کن"
													: "📚 Keep Practicing"}
										{/if}
									</h2>
									<div style="font-size:2em; margin:10px 0;">
										{examResultsData.score} / {examResultsData.total}
									</div>
									<p>{examResultsData.percentage}%</p>
									{#if !examResultsData.wasReview && examResultsData.percentage >= 80}
										<div class="exam-badge">
											🏅
											{examResultsData.language === "fa"
												? `آزمون هفته ${examResultsData.examWeek} را قبول شدی!`
												: `Week ${examResultsData.examWeek} Exam passed!`}
										</div>
									{/if}

									{#if examResultsData.wrongAnswers.length > 0}
										<div
											style="text-align:left; margin-top:15px; padding-top:15px; border-top:1px solid var(--line);"
										>
											<b
												>{examResultsData.language ===
												"fa"
													? "\u0645\u0631\u0648\u0631 \u0627\u0634\u062A\u0628\u0627\u0647\u0627\u062A:"
													: "Review mistakes:"}</b
											>
											{#each examResultsData.wrongAnswers as w}
												<div
													style="padding:6px 0; border-bottom:1px solid var(--line);"
												>
													<div
														style="color:var(--ink); font-weight:bold;"
													>
														{w.question.targetText}
													</div>
													<div
														style="color:var(--ink-soft); font-size:0.85em;"
													>
														{w.question.translation}
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						{/if}
					</div>

					<!-- Interaction Area -->
					<div class="chat-interaction-area">
						<div
							class="message-composer"
							aria-live="polite"
							aria-label="Your reply"
						>
							<span lang="de" dir="ltr">{@html answerLineHtml}</span>
						</div>
						<!-- Hidden whenever a teach card is up, since the card carries
						     its own. Two mics doing one job is the duplication the
						     Practice button was removed for, and a mic that changes
						     position between sentences is worse still. Remains the only
						     mic in exam and conversation mode, which have no card. -->
						{#if !(currentTeachStep && micSupported)}
							<button
								class="btn-send"
							class:pulse={app.isListening}
							style="background: {app.isListening
								? '#f44336'
								: 'var(--accent)'};"
							onclick={handleMicClick}
							aria-label={app.isListening
								? "Stop recording"
								: "Microphone - tap to record"}
						>
							{app.isListening ? "🛑" : "🎙️"}
						</button>
						{/if}
					</div>
				</div>
				<!-- end chat-main -->

				<!-- Script Panel -->
				<aside
					class="script-view"
					class:open={showScript}
					id="script-view"
				>
					<div class="script-header">
						<h3>
							{prefs.language === "fa"
								? "\u0645\u062A\u0646 \u062F\u0631\u0633"
								: "Lesson Script"}
						</h3>
						<div class="script-header-right">
							{#if lesson.currentLesson && !exam.isExamMode && !exam.isConversation}
								<span class="script-count"
									>{Math.min(
										app.currentSentenceIndex + 1,
										scriptItems.length,
									)}/{scriptItems.length}</span
								>
							{/if}
							<button
								class="script-close-btn"
								onclick={() => (showScript = false)}
								aria-label="Close script">✕</button
							>
						</div>
					</div>
					<div class="script-container" bind:this={scriptContainerEl}>
						{#if exam.isExamMode || exam.isConversation}
							<!-- The lesson script doesn't apply to exams or
							     Week Talks — the previous lesson's script
							     showing here was just confusing. -->
							<div class="script-empty">
								<p>
									{exam.isConversation
										? prefs.language === "fa"
											? "💬 گفتگو در جریان است — از چت دنبال کن."
											: "💬 Conversation in progress — follow the chat."
										: prefs.language === "fa"
											? "📝 آزمون در جریان است — متن درس پنهان است."
											: "📝 Exam in progress — the script stays hidden."}
								</p>
							</div>
						{:else if scriptItems.length === 0}
							<div class="script-empty">
								<p>
									{prefs.language === "fa"
										? "وقتی شروع کنی، متن درس اینجا نمایش داده می‌شود."
										: "Lesson script will appear here once you start."}
								</p>
							</div>
						{/if}
						{#each exam.isExamMode || exam.isConversation ? [] : scriptItems as item, i}
							<div class="script-row">
								<!-- svelte-ignore a11y_interactive_supports_focus -->
								<div
									class="script-item"
									class:done={item.done}
									class:active={item.active}
									role="button"
									tabindex="0"
									aria-label="Sentence {i + 1}: {item.german}"
									onclick={() => handleScriptItemClick(i)}
									onkeydown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											handleScriptItemClick(i);
										}
									}}
								>
									<div class="script-num">
										{item.active ? "▶" : i + 1}
									</div>
									<div class="script-text">
										<div class="german" lang="de" dir="ltr">{item.german}</div>
										<div
											class="translation"
											style="direction: {prefs.language ===
											'fa'
												? 'rtl'
												: 'ltr'};"
										>
											{item.translation}
										</div>
									</div>
								</div>

								<div class="script-foot">
									<button
										class="practice-link"
										onclick={() =>
											openPractice(
												item.german,
												item.translation,
												i,
											)}
									>
										{prefs.language === "fa"
											? "تمرین ←"
											: "Practice →"}
									</button>
								</div>
							</div>
						{/each}
					</div>
				</aside>

				<!-- Mobile: tap outside to close -->
				{#if showScript}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="script-backdrop"
						onclick={() => (showScript = false)}
					></div>
				{/if}
			</div>
			<!-- end chat-body -->
		</div>
		<!-- end chat-wrapper -->
	</main>
</div>

<!-- Word Tooltip -->
{#if wordTooltip}
	<div
		class="word-tooltip"
		style="left: {wordTooltip.x}px; top: {wordTooltip.y - 10}px;"
	>
		<span class="tooltip-meaning">{wordTooltip.meaning}</span>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<span
			class="tooltip-bookmark"
			class:saved={savedWords.has(
				wordTooltip.word.toLowerCase().replace(/[.,!?]/g, ""),
			)}
			onclick={(e) => {
				e.stopPropagation();
				handleBookmarkWord();
			}}
			role="button"
			tabindex="-1"
		>
			{savedWords.has(
				wordTooltip.word.toLowerCase().replace(/[.,!?]/g, ""),
			)
				? "★"
				: "☆"}
		</span>
	</div>
{/if}

<style>
	:global(body) {
		background: var(--paper);
	}

	.start-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100vh;
		height: 100dvh;
		/* Follows the theme. This was hard-coded rgba(15,15,26,.97) — the
		   DARK page colour, in both themes — while every piece of text on it
		   uses --ink / --ink-soft / --accent-deep, which do flip. In dark
		   that lined up by luck; in light it put near-black text on a
		   near-black sheet and the heading measured 1.13:1.

		   Fixing the scrim rather than recolouring the five children kills
		   the whole class: anything added here later inherits a surface its
		   tokens were actually designed for. */
		background: color-mix(in srgb, var(--paper) 97%, transparent);
		z-index: 10000;
		display: flex;
		justify-content: center;
		align-items: center;
		flex-direction: column;
		color: var(--ink);
	}

	.start-overlay h1 {
		font-size: 2rem;
		margin-bottom: 10px;
		font-family: var(--font-display);
		color: var(--ink);
	}

	.start-overlay p {
		margin: 20px 0;
		font-size: 1.2em;
	}

	.start-btn {
		padding: 15px 40px;
		font-size: 1.5em;
		background: var(--accent);
		color: var(--on-accent);
		border: none;
		border-radius: 50px;
		cursor: pointer;
		transition: all 0.3s;
	}

	.start-btn:hover {
		background: var(--accent);
		filter: brightness(1.06);
		transform: translateY(-2px);
	}

	.start-btn:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	/* ── Overlay Preview ── */
	.overlay-preview {
		text-align: center;
		max-width: 380px;
		margin-bottom: 8px;
	}

	.overlay-title {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--ink);
		font-family: var(--font-display);
		margin: 0 0 6px;
	}

	.overlay-desc {
		font-size: 0.9rem;
		color: var(--ink-soft);
		margin: 0 0 10px;
		line-height: 1.4;
	}

	.overlay-tags {
		display: flex;
		gap: 8px;
		justify-content: center;
		flex-wrap: wrap;
	}

	.overlay-badge {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 3px 10px;
		border-radius: 12px;
		background: var(--paper-sunken);
		color: var(--ink-soft);
	}

	.overlay-badge.difficulty-A1 {
		background: var(--leaf-wash);
		color: var(--leaf);
	}
	.overlay-badge.difficulty-A2 {
		background: rgba(49, 89, 122, 0.12);
		color: #5dade2;
	}
	.overlay-badge.difficulty-B1 {
		background: rgba(123, 75, 148, 0.12);
		color: #a569bd;
	}
	.overlay-badge.difficulty-B1plus {
		background: rgba(123, 75, 148, 0.12);
		color: #a569bd;
	}
	.overlay-badge.grammar-tag {
		background: var(--accent-wash);
		color: var(--accent-deep);
	}

	/* ── Completion Stats ── */
	.completion-stats {
		display: flex;
		gap: 16px;
		justify-content: center;
		margin: 10px 0;
	}

	.comp-stat {
		font-size: 0.85rem;
		color: var(--ink-soft);
		font-weight: 600;
	}

	/* ── Grammar moment (end-of-lesson consolidation card) ── */
	.grammar-moment .text {
		text-align: start;
		max-width: 560px;
	}

	.gm-head {
		margin-bottom: 8px;
	}

	.gm-badge {
		background: var(--info-wash);
		color: var(--info);
		border-radius: 999px;
		padding: 3px 12px;
		font-size: 0.78rem;
		font-weight: 800;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.gm-title {
		font-family: var(--font-display);
		font-size: 1.15rem;
		color: var(--ink);
		margin: 0 0 6px;
	}

	.gm-explanation {
		color: var(--ink-soft);
		line-height: 1.7;
		margin: 0 0 10px;
	}

	.gm-examples {
		list-style: none;
		padding: 0;
		margin: 0 0 12px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.gm-examples li {
		display: flex;
		align-items: baseline;
		gap: 8px;
		flex-wrap: wrap;
		background: var(--paper-sunken);
		border-radius: 8px;
		padding: 7px 11px;
	}

	.gm-play {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
		padding: 0;
		line-height: 1;
	}

	.gm-de {
		font-weight: 700;
		color: var(--ink);
	}

	.gm-gloss {
		color: var(--ink-faint);
		font-size: 0.88rem;
	}

	.gm-actions {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		flex-wrap: wrap;
	}

	.gm-basics {
		color: var(--accent-deep);
		font-weight: 600;
		font-size: 0.9rem;
		text-decoration: none;
		border-bottom: 1px dotted var(--accent);
	}

	/* ── Warm-up card ── */
	.warm-up .wu-head {
		margin-bottom: 10px;
	}

	.wu-badge {
		display: inline-block;
		padding: 4px 12px;
		border-radius: 999px;
		background: var(--info-wash);
		color: var(--info);
		font-size: 0.75rem;
		font-weight: 700;
	}

	.wu-label {
		margin: 12px 0 6px;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--ink-faint);
	}

	.wu-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.wu-chip {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 2px;
		min-height: 44px;
		padding: 8px 14px;
		border: 2px solid var(--control-edge);
		border-radius: 12px;
		background: var(--control);
		cursor: pointer;
		text-align: start;
		box-shadow: 0 3px 0 var(--control-edge);
	}

	.wu-chip:active {
		transform: translateY(3px);
		box-shadow: none;
	}

	/* Collocations look like one object, because that is the whole point —
	   they are learned as a unit, not as two words that happen to be adjacent. */
	.wu-chip.phrase {
		background: var(--leaf-wash);
		border-color: var(--leaf);
	}

	.wu-de {
		font-family: var(--font-display);
		font-size: 1rem;
		font-weight: 700;
		color: var(--ink);
	}

	.wu-gloss {
		font-size: 0.78rem;
		color: var(--ink-soft);
	}

	.wu-hint {
		margin: 12px 0 0;
		font-size: 0.82rem;
		color: var(--ink-faint);
	}

	.gm-continue {
		background: var(--accent);
		color: var(--on-accent);
		border: none;
		border-radius: 10px;
		padding: 10px 20px;
		font-size: 0.98rem;
		font-weight: 700;
		cursor: pointer;
		margin-inline-start: auto;
	}

	/* Readiness delta on the completion card — the daily payoff moment. */
	.comp-readiness {
		display: inline-flex;
		align-items: baseline;
		gap: 7px;
		background: var(--leaf-wash);
		border-radius: 999px;
		padding: 6px 16px;
		margin: 10px 0 4px;
		font-size: 0.92rem;
		font-weight: 600;
		color: var(--ink-soft);
	}

	.cr-was {
		text-decoration: line-through;
		color: var(--ink-faint);
	}

	.cr-now {
		color: var(--leaf);
		font-weight: 800;
		font-size: 1.05rem;
	}

	.cr-delta {
		background: var(--leaf);
		color: var(--on-accent);
		border-radius: 999px;
		padding: 1px 9px;
		font-size: 0.8rem;
		font-weight: 800;
	}

	/* ── Script Empty ── */
	.script-empty {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 120px;
		text-align: center;
		padding: 24px;
	}

	.script-empty p {
		color: var(--ink-soft);
		font-size: 0.88rem;
		line-height: 1.5;
	}

	.hidden {
		display: none;
	}

	.container {
		display: flex;
		flex-direction: column;
		height: 100vh;
		height: 100dvh;
		overflow: hidden;
	}

	.lesson-toolbar-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		width: 100%;
		min-width: 0;
	}

	.lesson-toolbar-primary {
		flex: 1 1 320px;
		min-width: 240px;
	}

	.lesson-toolbar-options {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 8px;
		flex-wrap: wrap;
	}

	.day-selection-control,
	.blind-mode-control,
	.language-control,
	.speed-control {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.lesson-toolbar-content select {
		min-height: 44px;
		color: var(--ink);
		background: var(--control);
		border: 1px solid var(--control-border);
		border-radius: 10px;
		padding: 7px 10px;
		font-family: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.lesson-toolbar-content select:hover,
	.lesson-toolbar-content select:focus-visible {
		border-color: var(--accent);
		outline: none;
	}

	.lesson-toolbar-content select option {
		background: var(--paper-raised);
		color: var(--ink);
	}

	/* Cap widths so the header stays on one row */
	.language-control select {
		min-width: 104px;
		max-width: 120px;
	}
	.speed-control select {
		max-width: 132px;
		min-width: 116px;
	}
	.day-selection-control select {
		width: min(100%, 360px);
		max-width: 360px;
	}

	.blind-mode-control {
		min-height: 44px;
		padding: 7px 10px;
		background: var(--paper-raised);
		border: 1px solid var(--line);
		border-radius: 10px;
		white-space: nowrap;
	}

	.blind-mode-control input {
		width: 16px;
		height: 16px;
		margin: 0;
		accent-color: var(--leaf);
	}

	.lesson-toolbar-content label {
		font-weight: 600;
		cursor: pointer;
		font-size: 0.84rem;
		/* Stated, never inherited: the header band behind these is brand green
		   with white text, so inheriting painted the Blind Mode label white on
		   its white pill — 1.00:1, invisible in light mode and only survivable
		   in dark because --paper-raised is near-black there. */
		color: var(--ink);
	}

	/* The one label that really is on the band rather than in a pill. */
	.day-selection-control label {
		color: var(--on-brand);
	}

	.progress-info {
		font-size: 0.85rem;
		opacity: 0.8;
	}

	/* Learning Area */
	.learning-area {
		flex: 1;
		min-height: 0;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.chat-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	/* Row that holds chat content + sidebar (desktop) */
	.chat-body {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-height: 0;
	}

	.chat-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-height: 0;
	}

	.chat-header {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		background: var(--paper-raised);
		color: var(--ink);
	}

	/* Scenario dropdown bar */
	.scenario-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 14px;
		background: var(--paper-raised);
		color: var(--ink);
		cursor: pointer;
		user-select: none;
		border-bottom: 1px solid var(--line);
		gap: 8px;
	}

	.scenario-bar:hover {
		background: var(--paper-sunken);
	}

	.scenario-bar-title {
		font-size: 0.9rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 7px;
		flex: 1;
		min-width: 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.scenario-bar-chevron {
		font-size: 1.1rem;
		transition: transform 0.25s;
		flex-shrink: 0;
		opacity: 0.8;
	}

	.scenario-bar-chevron.open {
		transform: rotate(180deg);
	}

	.scenario-dropdown {
		background: var(--paper-sunken);
		padding: 10px 14px;
		border-bottom: 1px solid var(--line);
		animation: dropIn 0.18s ease-out;
	}

	@keyframes dropIn {
		from {
			opacity: 0;
			transform: translateY(-6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.scenario-drop-desc {
		margin: 0 0 6px;
		font-size: 0.82rem;
		color: var(--ink-soft);
		line-height: 1.5;
	}

	.scenario-drop-grammar {
		margin: 0;
		font-size: 0.78rem;
		color: var(--leaf);
	}

	.avatar-circle {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--paper-sunken);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.3rem;
	}

	.status {
		font-size: 0.75rem;
		opacity: 0.7;
	}

	/* Current Sentence Area — one at a time, vertically centered */
	.chat-history {
		flex: 1;
		overflow-y: auto;
		padding: 24px 20px;
		/* Warm field with the faint cross pattern from the app screenshot,
		   so white message cards read as cards sitting on something. */
		background-color: var(--field);
		background-image:
			linear-gradient(var(--field-dot) 1.5px, transparent 1.5px),
			linear-gradient(90deg, var(--field-dot) 1.5px, transparent 1.5px);
		background-size: 44px 44px;
		background-position: center;
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		gap: 16px;
	}

	/* Pushes messages toward the bottom when the chat is sparse */
	.chat-spacer {
		flex: 1;
	}

	.date-divider {
		text-align: center;
		color: var(--ink-soft);
		font-size: 0.8rem;
		padding: 8px;
		margin: 10px 0;
	}

	.message {
		max-width: 85%;
		padding: 14px 18px;
		/* Softly rounded white cards lifted off the field, as in the
		   screenshot — not tight chat bubbles. */
		border-radius: 16px;
		margin-bottom: 8px;
		font-size: 0.95rem;
		line-height: 1.5;
		word-wrap: break-word;
		align-self: flex-start;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
	}

	.message.received {
		background: var(--paper-raised);
		border: 1px solid var(--line);
		color: var(--ink);
	}

	.message.sent {
		background: var(--leaf-wash);
		border: 1px solid var(--leaf);
		color: var(--ink);
		align-self: flex-end;
	}

	.message.system {
		background: var(--accent-wash);
		color: var(--accent-deep); /* dark warm brown — readable on the cream background */
		font-weight: 600;
		max-width: 95%;
		width: 95%;
		align-self: center;
		text-align: center;
		border-radius: 10px;
		padding: 15px;
		margin: 4px 0;
	}

	.message.instruction {
		background: var(--paper-raised);
		border: 1px solid var(--line);
		max-width: 540px;
		width: 100%;
		align-self: center;
		border-radius: 16px;
		padding: 24px 28px;
		margin: 0;
		box-shadow: var(--paper-shadow);
		position: relative;
	}

	.translation-line {
		font-size: 1.2em;
		color: var(--ink);
		margin-bottom: 5px;
	}

	.german-line {
		font-weight: bold;
		font-size: 1.1em;
		color: var(--ink-soft);
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.speaker-icon {
		cursor: pointer;
		font-size: 1.2em;
	}

	.teach-text {
		flex: 1;
	}

	.interactive-word {
		cursor: pointer;
		padding: 2px 3px;
		border-radius: 4px;
		transition:
			background 0.2s,
			color 0.2s;
		display: inline; /* inline keeps natural word spacing */
		font-weight: 600; /* solid base; the read word goes heavier + darker */
	}

	.interactive-word:hover {
		background: var(--leaf-wash);
		color: var(--leaf);
	}

	.interactive-word.success {
		background: var(--leaf-wash);
		color: var(--leaf);
	}

	.interactive-word.error {
		background: rgba(231, 76, 60, 0.12);
		color: #e74c3c;
	}

	/* Karaoke — the word currently being read goes heavier and darker. */
	.interactive-word.reading {
		font-weight: 900;
		color: var(--ink);
	}

	/* Reads as the primary action on the learner's own lines, because it
	   is — Replay and Hint are optional, saying it is the lesson. Turns
	   --miss while live so "recording" is not carried by the label alone. */
	.btn-record {
		min-height: 44px;
		padding: 6px 16px;
		border: 2px solid var(--leaf-edge);
		border-radius: 20px;
		background: var(--leaf);
		color: var(--on-accent);
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		box-shadow: 0 3px 0 var(--leaf-edge);
	}

	.btn-record:active {
		transform: translateY(3px);
		box-shadow: none;
	}

	.btn-record.recording {
		background: var(--miss);
		border-color: var(--miss-edge);
		box-shadow: 0 3px 0 var(--miss-edge);
		animation: pulse 1.4s ease-in-out infinite;
	}

	.btn-inline-next {
		padding: 6px 16px;
		border-radius: 20px;
		border: none;
		background: var(--accent);
		color: var(--on-accent);
		cursor: pointer;
		font-weight: bold;
		font-size: 0.95em;
		transition: all 0.3s ease;
		white-space: nowrap;
	}

	.btn-inline-next:hover {
		transform: translateY(-1px);
		box-shadow: 0 3px 10px rgba(46, 204, 113, 0.3);
	}

	/* Completion Card */
	.completion-card {
		background: var(--paper-raised) !important;
		border: 1px solid var(--line) !important;
		box-shadow: var(--paper-shadow);
		border-radius: 15px !important;
		padding: 25px !important;
	}

	/* The unlock, stated just above the button that acts on it. */
	.unlock-line {
		margin: 14px 0 6px;
		font-family: var(--font-mono);
		font-size: var(--type-label);
		letter-spacing: var(--tracking-label);
		text-transform: uppercase;
		color: var(--leaf-deep);
	}

	.next-day-btn {
		padding: 12px 30px;
		border-radius: 30px;
		border: none;
		background: var(--accent);
		color: var(--on-accent);
		cursor: pointer;
		font-size: 1.05rem;
		font-weight: 600;
		margin-top: 15px;
		transition: all 0.3s ease;
	}

	.next-day-btn:hover {
		transform: translateY(-2px);
		box-shadow: 0 5px 20px rgba(46, 204, 113, 0.35);
	}

	/* Exam Progress */
	.exam-progress-bar {
		width: calc(100% - 20px);
		background: var(--line);
		border-radius: 10px;
		height: 8px;
		margin: 5px 10px;
	}

	.exam-progress-fill {
		background: var(--leaf);
		height: 100%;
		border-radius: 10px;
		transition: width 0.3s;
	}

	/* Interaction Area */
	.chat-interaction-area {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 15px;
		background: var(--paper-sunken);
		border-top: 1px solid var(--line);
	}

	.message-composer {
		flex: 1;
		padding: 10px 16px;
		/* Pill input on the white bar, matching the screenshot. */
		background: var(--paper-raised);
		border: 1px solid var(--line);
		color: var(--ink);
		border-radius: 999px;
		min-height: 44px;
		display: flex;
		align-items: center;
	}

	:global(.message-composer .placeholder-text) {
		color: var(--ink-soft);
		font-size: 0.9rem;
	}

	.btn-send {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: none;
		color: white;
		font-size: 24px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s;
		flex-shrink: 0;
	}

	.btn-send.pulse {
		animation: pulse 1s infinite;
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
	}

	/* Lesson Progress Bar */
	.lesson-progress {
		position: relative;
		height: 4px;
		background: var(--line);
		overflow: visible;
		display: flex;
		align-items: center;
	}

	.lesson-progress-fill {
		height: 100%;
		background: var(--leaf);
		transition: width 0.4s ease;
		border-radius: 0 2px 2px 0;
	}

	.lesson-progress-text {
		position: absolute;
		right: 10px;
		font-size: 0.7rem;
		color: var(--ink-soft);
		font-weight: 600;
		white-space: nowrap;
	}

	/* Correct Feedback Banner */
	.correct-banner {
		text-align: center;
		padding: 8px 16px;
		background: var(--leaf-wash);
		color: var(--leaf);
		font-weight: 700;
		font-size: 1rem;
		border-radius: 20px;
		margin: 4px auto;
		width: fit-content;
		animation: popIn 0.2s ease-out;
	}

	/* ── Words to practise, on the completion card ──
	   Sits under a card that already says the lesson is finished, so this
	   is a list of things to work on and not a mark. No red, no count of
	   what went wrong out of what. */
	.comp-misses {
		margin: 14px 0 0;
		padding: 12px 14px;
		border: 1px solid var(--control-border);
		border-inline-start: 3px solid var(--gold);
		border-radius: 10px;
		background: var(--paper-sunken);
		text-align: start;
	}

	.comp-misses h4 {
		margin: 0 0 8px;
		color: var(--ink);
		font-family: var(--font-display);
		font-size: 0.95rem;
	}

	.cm-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		padding: 6px 0;
		border-top: 1px solid var(--line);
	}

	.cm-row:first-of-type {
		border-top: 0;
	}

	/* The word itself is the button — tapping it plays the German, which is
	   the one action anyone wants from a list like this. */
	.cm-word {
		min-height: 44px;
		padding: 4px 12px;
		border: 1px solid var(--control-border);
		border-radius: 999px;
		background: var(--control);
		color: var(--ink);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	.cm-word:hover {
		background: var(--control-hover);
		border-color: var(--accent);
	}

	.cm-sound {
		padding: 2px 8px;
		border-radius: 999px;
		background: var(--gold);
		color: #3b2c00;
		font-size: 0.8rem;
		font-weight: 800;
	}

	.cm-tip {
		flex: 1 1 200px;
		color: var(--ink-soft);
		font-size: 0.85rem;
		line-height: 1.45;
	}

	/* ── Sound coaching ──
	   Gold, not --miss. The ✗ has already been delivered; this is the way out
	   of it, and painting help in the failure colour makes a strict check
	   read as punishment rather than teaching. */
	.sound-note {
		max-width: 85%;
		margin: 6px auto;
		padding: 10px 14px;
		border: 1px solid var(--control-border);
		border-inline-start: 3px solid var(--gold);
		border-radius: 10px;
		background: var(--paper-raised);
		animation: popIn 0.2s ease-out;
	}

	.sound-note-head {
		display: flex;
		align-items: center;
		gap: 10px;
		flex-wrap: wrap;
	}

	.sound-note-label {
		padding: 2px 8px;
		border-radius: 999px;
		background: var(--gold);
		color: #3b2c00;
		font-weight: 800;
		font-size: 0.88rem;
	}

	.sound-note-diff {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.95rem;
	}

	.sound-note-diff .said {
		color: var(--miss);
		text-decoration: line-through;
	}

	/* See SentencePractice: --leaf is under 4.5:1 on the sunken card in light
	   mode, and "correct" is the wrong meaning here anyway. */
	.sound-note-diff .want {
		color: var(--accent);
		font-weight: 700;
	}

	.sound-note-play {
		margin-inline-start: auto;
		min-width: 44px;
		min-height: 44px;
		border: 1px solid var(--control-border);
		border-radius: 999px;
		background: var(--control);
		cursor: pointer;
		font-size: 1rem;
	}

	.sound-note-play:hover {
		background: var(--control-hover);
		border-color: var(--accent);
	}

	.sound-note-tip {
		margin: 8px 0 0;
		color: var(--ink);
		font-size: 0.9rem;
		line-height: 1.5;
	}

	/* Teach Actions Row */
	.teach-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 8px;
		flex-wrap: wrap;
	}

	.btn-replay {
		padding: 6px 16px;
		border-radius: 20px;
		border: 2px solid var(--accent);
		background: transparent;
		color: var(--accent);
		cursor: pointer;
		font-weight: bold;
		font-size: 0.95em;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.btn-replay:hover {
		background: var(--accent);
		color: var(--on-accent);
	}

	.btn-replay.speaking {
		border-color: var(--accent);
	}

	.audio-wave {
		display: inline-flex;
		align-items: center;
		gap: 2px;
		height: 16px;
	}

	.audio-wave span {
		display: block;
		width: 3px;
		height: 100%;
		background: var(--accent);
		border-radius: 2px;
		transform-origin: center;
		animation: wave-bar 0.7s ease-in-out infinite;
	}

	.audio-wave span:nth-child(1) {
		animation-delay: 0s;
	}
	.audio-wave span:nth-child(2) {
		animation-delay: 0.14s;
	}
	.audio-wave span:nth-child(3) {
		animation-delay: 0.28s;
	}
	.audio-wave span:nth-child(4) {
		animation-delay: 0.14s;
	}
	.audio-wave span:nth-child(5) {
		animation-delay: 0s;
	}

	@keyframes wave-bar {
		0%,
		100% {
			transform: scaleY(0.25);
		}
		50% {
			transform: scaleY(1);
		}
	}

	/* ── Practice mode ── */
	/* Practice owns the content area while it is open. Hiding the siblings
	   rather than unmounting them keeps the lesson's scroll and state, so
	   Back really does return to where the learner was. */
	.learning-area.practicing > :global(*:not(.practice-host)) {
		display: none;
	}

	.practice-host {
		padding: 16px;
		max-width: 640px;
		margin: 0 auto;
		width: 100%;
	}

	.script-row {
		border-bottom: 1px solid var(--line);
	}

	.script-foot {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 12px 8px;
	}

	/* Pushed right by an auto margin rather than space-between, so the button
	   keeps its place on the sentences that have no mastery meter yet. */
	.script-foot .practice-link {
		margin-inline-start: auto;
	}

	.practice-link {
		min-height: 44px;
		padding: 6px 12px;
		border: none;
		background: none;
		color: var(--leaf);
		font-size: 0.8rem;
		font-weight: 700;
		cursor: pointer;
	}

	.practice-link:hover {
		text-decoration: underline;
	}

	/* Hint button */
	.btn-hint {
		padding: 6px 16px;
		border-radius: 20px;
		border: 2px solid var(--accent-deep);
		background: transparent;
		color: var(--accent-deep);
		font-size: 0.85rem;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.btn-hint:hover {
		background: var(--accent-deep);
		color: var(--on-accent);
	}

	/* Bookmark button - Star */
	/* A flex item at the end of the action row, not an absolute overlay.
	   It was pinned to `right: 18px` against the card, which is fine while
	   the buttons flow from the left — and in Persian they flow from the
	   right, straight underneath the star. Logical properties alone would
	   move the collision rather than remove it, since a wide enough row
	   reaches the far edge in either direction. */
	.btn-bookmark {
		margin-inline-start: auto;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		/* 44px: it was ~37px once padding is counted, which is under the
		   minimum target and the smallest control on the card. */
		min-width: 44px;
		min-height: 44px;
		font-size: 1.8rem;
		background: transparent;
		border: none;
		color: var(--ink-faint);
		cursor: pointer;
		padding: 4px;
		transition:
			transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275),
			color 0.2s;
		line-height: 1;
	}

	.btn-bookmark:hover {
		transform: scale(1.15);
		color: var(--accent-deep);
	}

	.btn-bookmark.bookmarked {
		color: var(--accent-deep);
	}

	.btn-bookmark.bookmarked:hover {
		transform: scale(1.15);
	}

	/* Remove from review button */
	.choice-options {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin: 10px 0;
	}

	.choice-btn {
		padding: 10px 14px;
		border: 2px solid var(--line);
		border-radius: 10px;
		background: var(--paper-raised);
		cursor: pointer;
		text-align: left;
		font-size: 0.95em;
		font-family: inherit;
		transition: all 0.2s ease;
	}

	.choice-btn:hover:not(:disabled) {
		border-color: var(--accent);
		background: var(--accent-wash);
	}

	.choice-btn:disabled {
		cursor: default;
	}

	.choice-btn.correct {
		border-color: var(--leaf);
		background: var(--leaf-wash);
		font-weight: bold;
	}

	.choice-btn.wrong {
		border-color: #e74c3c;
		background: rgba(231, 76, 60, 0.08);
	}

	.exam-badge {
		display: inline-block;
		padding: 8px 18px;
		margin-top: 8px;
		background: var(--accent-wash);
		border: 1px solid var(--accent-deep);
		border-radius: 20px;
		font-weight: bold;
	}

	/* ── Conversation mode (Week Talk) ── */
	.conv-panel {
		align-self: flex-end;
		max-width: 75%;
		background: var(--paper-raised);
		border: 2px dashed var(--accent);
		border-radius: 15px;
		padding: 14px 16px;
		margin: 8px 0;
	}

	.conv-title {
		font-size: 0.85em;
		font-weight: bold;
		color: var(--accent-deep);
		margin-bottom: 10px;
	}

	.conv-option {
		padding: 8px 12px;
		border: 1px solid var(--line);
		border-radius: 10px;
		background: var(--paper-sunken);
	}

	.conv-option + .conv-option {
		margin-top: 8px;
	}

	.conv-german {
		font-weight: bold;
		color: var(--ink);
	}

	.conv-translation {
		font-size: 0.85em;
		color: var(--ink-soft);
		margin-top: 2px;
	}

	.btn-remove-review {
		padding: 5px 14px;
		border-radius: 20px;
		border: 2px solid #e74c3c;
		background: transparent;
		color: #e74c3c;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-top: 8px;
	}

	.btn-remove-review:hover {
		background: #e74c3c;
		color: white;
	}

	.hint-text {
		margin-top: 8px;
		padding: 8px 12px;
		background: var(--accent-wash);
		border-left: 3px solid var(--accent);
		border-radius: 6px;
		font-size: 0.85rem;
		color: var(--accent-deep);
		line-height: 1.5;
	}

	/* Scenario description */
	.scenario-description {
		background: var(--accent-wash);
		border-left: 3px solid var(--accent);
		border-radius: 8px;
		padding: 10px 14px;
		margin: 0 0 8px;
		font-size: 0.85rem;
		color: var(--ink);
		line-height: 1.5;
		max-width: 540px;
		width: 100%;
		align-self: center;
		box-sizing: border-box;
	}

	/* Lesson meta tags (difficulty + grammar focus) */
	.lesson-meta-tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-top: 4px;
	}

	.difficulty-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 10px;
		font-size: 0.7rem;
		font-weight: bold;
		letter-spacing: 0.5px;
		color: white;
	}

	/* CEFR level colours */
	.difficulty-A1 {
		background: var(--leaf);
	}
	.difficulty-A1plus {
		background: rgba(88, 214, 141, 0.22);
	}
	.difficulty-A2 {
		background: #5dade2;
	}
	.difficulty-A2plus {
		background: rgba(93, 173, 226, 0.22);
	}
	.difficulty-B1 {
		background: #a569bd;
	}
	.difficulty-B1plus {
		background: rgba(165, 105, 189, 0.22);
	}

	.grammar-tag {
		display: inline-block;
		padding: 2px 10px;
		border-radius: 10px;
		font-size: 0.7rem;
		background: var(--accent-wash);
		color: var(--accent-deep);
		max-width: 220px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Script Panel */
	.script-view {
		height: 28vh;
		background: var(--paper-raised);
		color: var(--ink);
		display: flex;
		flex-direction: column;
		border-top: 1px solid var(--line);
	}

	.script-header {
		padding: 10px 15px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--paper-sunken);
		border-bottom: 1px solid var(--line);
		flex-shrink: 0;
	}

	.script-header h3 {
		margin: 0;
		font-size: 0.88rem;
		color: var(--ink);
		font-family: var(--font-display);
		font-weight: 700;
		letter-spacing: 0.03em;
	}

	.script-count {
		font-size: 0.75rem;
		color: var(--ink-soft);
		font-weight: 600;
	}

	.script-container {
		flex: 1;
		overflow-y: auto;
		padding: 8px 12px;
	}

	.script-item {
		padding: 8px 10px;
		border-radius: 8px;
		margin-bottom: 4px;
		cursor: pointer;
		transition:
			background 0.2s,
			border-color 0.2s;
		border-left: 3px solid transparent;
		display: flex;
		gap: 8px;
		align-items: flex-start;
	}

	.script-item:hover {
		background: var(--paper-sunken);
	}

	.script-item.active {
		background: var(--accent-wash);
		border-left-color: var(--accent);
		border-left-width: 4px;
		box-shadow: 0 0 0 1px rgba(46, 204, 113, 0.3);
	}

	.script-item.done {
		opacity: 0.72;
	}

	.script-num {
		font-size: 0.65rem;
		font-weight: 700;
		color: var(--ink-faint);
		min-width: 18px;
		height: 18px;
		background: var(--paper-sunken);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.script-item.active .script-num {
		background: var(--accent);
		color: var(--on-accent);
		font-size: 0.7rem;
	}

	.script-item.done .script-num {
		background: var(--leaf-wash);
		color: var(--leaf);
	}

	.script-text {
		flex: 1;
		min-width: 0;
	}

	.script-item .german {
		font-weight: 700;
		color: var(--ink);
		font-size: 0.9rem;
		line-height: 1.35;
	}

	.script-item .translation {
		color: var(--ink-soft);
		font-size: 0.78rem;
		margin-top: 2px;
		line-height: 1.3;
	}

	.script-item.active .german {
		color: var(--accent-deep);
	}

	.script-item.active .translation {
		color: var(--accent-deep);
	}

	/* Word Tooltip */
	.word-tooltip {
		position: fixed;
		transform: translateX(-50%) translateY(-100%);
		background: rgba(0, 0, 0, 0.9);
		color: #fff;
		padding: 6px 12px;
		border-radius: 8px;
		font-size: 0.85em;
		white-space: nowrap;
		z-index: 200;
		pointer-events: auto;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		animation: popIn 0.2s ease-out;
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.tooltip-bookmark {
		color: #888;
		font-size: 1.1rem;
		cursor: pointer;
		padding: 0 2px;
		line-height: 1;
		transition:
			transform 0.2s,
			color 0.2s;
		user-select: none;
	}

	.tooltip-bookmark:hover {
		transform: scale(1.3);
	}

	.tooltip-bookmark.saved {
		color: #ffd700;
		text-shadow: 0 0 4px rgba(255, 215, 0, 0.5);
	}

	@keyframes popIn {
		from {
			opacity: 0;
			transform: translateX(-50%) translateY(-100%) scale(0.8);
		}
		to {
			opacity: 1;
			transform: translateX(-50%) translateY(-100%) scale(1);
		}
	}

	/* ── Script header right side (count + close btn) ── */
	.script-header-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.script-close-btn {
		display: none; /* shown only on mobile via media query */
		background: none;
		border: none;
		color: var(--ink-soft);
		font-size: 1rem;
		cursor: pointer;
		padding: 2px 6px;
		line-height: 1;
	}

	/* ── Mobile script toggle bar ─────────────────────────── */
	.script-toggle-btn {
		display: none; /* hidden on desktop */
	}

	.script-backdrop {
		display: none;
	}

	/* ── Desktop: right sidebar layout ───────────────── */
	@media (min-width: 768px) {
		/* Chat header stays full-width; sidebar only sits beside chat content */
		.chat-body {
			flex-direction: row;
		}

		.chat-main {
			flex: 1;
			min-width: 0;
		}

		/* The script panel stays on the visual RIGHT in both directions.
		   flex-direction: row mirrors under dir="rtl", which put the panel
		   on the left in Persian — correct mirroring, wrong for this panel.
		   Its contents are German, which is LTR whatever the interface is,
		   and a learner switching language should not have to relearn where
		   their sentence list lives. order: -1 makes it first in RTL flow,
		   which is the rightmost position. */
		:global(html[dir="rtl"]) .script-view {
			order: -1;
		}

		.script-view {
			width: 300px;
			flex-shrink: 0;
			height: auto;
			overflow: hidden;
			border-top: none;
			border-left: 1px solid var(--line);
		}
	}

	/* ── Mobile: top-down dropdown drawer ──────────────────────── */
	@media (max-width: 767px) {
		/* Hide the static sidebar panel; become a slide-down drawer */
		.script-view {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			height: 65vh;
			z-index: 400;
			transform: translateY(-105%);
			transition: transform 0.32s cubic-bezier(0.4, 0, 0.2, 1);
			border-top: none;
			border-radius: 0 0 18px 18px;
			box-shadow: 0 4px 24px rgba(0, 0, 0, 0.18);
		}

		.script-view.open {
			transform: translateY(0);
		}

		/* Drag handle at bottom of drawer (now slides down) */
		.script-header::before {
			content: none;
		}

		.script-header {
			flex-direction: column;
			align-items: stretch;
		}

		.script-header > * {
			display: flex;
			align-items: center;
		}

		.script-header h3,
		.script-header-right {
			display: flex;
		}

		/* Show close × button inside drawer on mobile */
		.script-close-btn {
			display: flex;
		}

		/* Script toggle as full-width bar at the top of content */
		.script-toggle-btn {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			width: 100%;
			/* Dark strip directly under the green band, as in the screenshot. */
			background: var(--strip);
			color: var(--on-strip);
			border: none;
			border-bottom: none;
			border-radius: 0;
			padding: 9px 16px;
			font-size: 0.85rem;
			font-weight: 600;
			cursor: pointer;
			flex-shrink: 0;
			box-shadow: none;
		}

		.script-toggle-count {
			background: rgba(255, 255, 255, 0.14);
			color: var(--leaf);
			border-radius: 10px;
			padding: 1px 6px;
			font-size: 0.75rem;
			font-weight: 700;
		}

		.script-toggle-arrow {
			font-size: 0.7rem;
			color: var(--leaf);
			transition: transform 0.3s;
		}

		.script-toggle-arrow.open {
			transform: rotate(180deg);
		}

		/* Backdrop behind open drawer */
		.script-backdrop {
			display: block;
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.35);
			z-index: 399;
		}
	}

	@media (max-width: 980px) {
		.lesson-toolbar-content {
			align-items: stretch;
			flex-wrap: wrap;
		}

		.lesson-toolbar-primary {
			flex-basis: 100%;
		}

		.day-selection-control select {
			width: 100%;
			max-width: none;
		}

		.lesson-toolbar-options {
			width: 100%;
			justify-content: flex-start;
		}
	}

	/* Responsive */
	@media (max-width: 600px) {
		.lesson-toolbar-content {
			flex-direction: column;
			gap: 8px;
		}

		.lesson-toolbar-primary {
			min-width: 0;
			width: 100%;
		}

		.day-selection-control {
			display: grid;
			grid-template-columns: auto minmax(0, 1fr);
			width: 100%;
		}

		.lesson-toolbar-options {
			display: grid;
			grid-template-columns: 56px 82px minmax(112px, 1fr) 92px;
			gap: 6px;
		}

		.language-control,
		.speed-control,
		.language-control select,
		.speed-control select,
		.blind-mode-control {
			justify-content: center;
			padding-inline: 6px;
		}

		.blind-mode-control label span {
			display: none;
		}

		.progress-info {
			display: none;
		}

		/* script-view is a fixed drawer on mobile — no height override needed */
	}

	@media (max-width: 360px) {
		.lesson-toolbar-options {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
