<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import AppHeader from "$lib/components/AppHeader.svelte";
	import { getLanguage, setLanguage, getVoiceSpeed, setVoiceSpeed, markBasicsCompleted } from "$services/data-layer";
	import { stopAllAudio, playAudioPromise } from "$services/tts";
	import { initSpeechRecognition, setVoiceInputHandler, setMicStateChangeHandler, toggleMic, stopListening, destroySpeechRecognition } from '$services/speech';
	import { matchVoiceInput } from '$utils/text-matching';
	import { unlockAudioContext, playTone } from '$services/audio-context';
	import { buildTopicChecks, collectWords, collectForms } from '$services/basics-checks';
	import {
		recordPracticeResult,
		type ReadinessModule,
	} from '$services/readiness';
	import { appStore } from '$stores/app';
	import type { Language } from "$stores/preferences";
	import type { BasicWord, ConjugationTense, DeclensionTable } from "$lib/types/basics";
	import type { PageData } from "./$types";

	/**
	 * Which exam module each check kind exercises. Article, meaning and
	 * conjugation are recognition of written German; rebuilding a sentence is
	 * written structure.
	 */
	const CHECK_MODULE: Record<string, ReadinessModule> = {
		article: "lesen",
		meaning: "lesen",
		conjugation: "lesen",
	};

	// The server load's `let x = null` pattern defeats PageData inference;
	// widen explicitly to what +page.server.ts actually returns.
	type CategoryData = PageData & {
		category?: Record<string, any> | null;
		words?: BasicWord[] | null;
		sections?: Array<Record<string, any>> | null;
	};
	let { data }: { data: CategoryData } = $props();

	let currentLang = $state("en" as Language);
	let voiceSpeed: number = $state(1.0);

	// Quiz mode state
	let quizMode = $state(false);
	let quizIndex = $state(0);
	let quizRevealed = $state(false);
	let quizDeck = $state<BasicWord[]>([]);
	let quizDone = $state(false);
	let quizGotIt = $state(0);

	// Voice state
	let speechSupported = $state(false);
	let voiceTranscript = $state('');
	let voiceResult: { isMatch: boolean; matchPercentage: number } | null = $state(null);
	let cardPhase = $state<'prompt' | 'recording' | 'result'>('prompt');
	let wrongFlash = $state(false);

	const app = $derived($appStore);

	const category = $derived(data.category);
	const words = $derived(data.words ?? []);
	const sections = $derived(data.sections ?? []);

	const catTitle = $derived(category ? (currentLang === "fa" ? category.title_fa : category.title_en) : "Loading...");
	const catDesc = $derived(category ? (currentLang === "fa" ? category.description_fa : category.description_en) : "");
	const catIcon = $derived(category?.icon || "📚");
	const backText = $derived(currentLang === "fa" ? "بازگشت" : "Back");

	// Rule text and the Persian-speaker pitfall. Vocabulary categories
	// (colors, numbers, days, months) legitimately have none — the word list
	// is the content — so both blocks simply do not render when empty.
	const catExplanation = $derived(
		category
			? (currentLang === "fa"
					? category.explanation_fa
					: category.explanation_en) || ""
			: "",
	);
	const catPitfall = $derived(
		category
			? (currentLang === "fa" ? category.pitfall_fa : category.pitfall_en) ||
					""
			: "",
	);
	const pitfallLabel = $derived(
		currentLang === "fa" ? "تلهٔ فارسی‌زبان‌ها" : "Watch out",
	);

	function sectionExplanation(section: Record<string, any>): string {
		return (
			(currentLang === "fa"
				? section.explanation_fa
				: section.explanation_en) || ""
		);
	}

	// ── Stepped reading: one screen at a time, then retrieval ──────────
	// A single long scroll is a reference document. Chunking it and ending
	// on questions turns it into study: read a rule, immediately use it.
	let stepIndex = $state(0);
	let checkIndex = $state(0);
	let checkPicked = $state<number | null>(null);
	let checkScore = $state(0);

	const checks = $derived(
		buildTopicChecks(
			collectWords(words, sections),
			collectForms(sections),
			currentLang,
			5,
		),
	);

	/** The screens: the rule (if any), then one per section, then checks. */
	const steps = $derived.by(() => {
		const out: Array<{ kind: "rule" | "section" | "checks"; section?: any }> = [];
		if (catExplanation || catPitfall) out.push({ kind: "rule" });
		if (category?.type === "multi" && sections.length) {
			for (const s of sections) out.push({ kind: "section", section: s });
		} else {
			out.push({ kind: "section" }); // flat word grid
		}
		if (checks.length) out.push({ kind: "checks" });
		return out;
	});

	const currentStep = $derived(steps[Math.min(stepIndex, steps.length - 1)]);
	const atEnd = $derived(stepIndex >= steps.length - 1);
	const currentCheck = $derived(checks[checkIndex]);


	const isFa = $derived(currentLang === "fa");
	const checkKicker = $derived(isFa ? "تمرین کوتاه" : "Quick check");
	const nextText = $derived(isFa ? "بعدی" : "Next");
	const finishText = $derived(isFa ? "پایان" : "Finish");
	const doneTitle = $derived(isFa ? "این مبحث تمام شد" : "Topic complete");
	const againText = $derived(isFa ? "دوباره" : "Try again");
	const allTopicsText = $derived(isFa ? "همهٔ مباحث" : "All topics");

	function goNext() {
		if (stepIndex < steps.length - 1) {
			stepIndex += 1;
			scrollTo({ top: 0, behavior: "smooth" });
		}
	}

	function goBack() {
		if (stepIndex > 0) {
			stepIndex -= 1;
			scrollTo({ top: 0, behavior: "smooth" });
		}
	}

	function answerCheck(i: number) {
		if (checkPicked !== null) return;
		checkPicked = i;
		const right = i === currentCheck.correctIndex;
		if (right) checkScore += 1;
		recordCheck(currentCheck.kind, right);
		playTone(right ? "success" : "error");
	}

	/** Feed the readiness signal. Every answered check is one graded point. */
	function recordCheck(kind: string, correct: boolean) {
		const m = CHECK_MODULE[kind];
		if (m) recordPracticeResult(m, correct ? 1 : 0, 1);
	}

	function nextCheck() {
		checkPicked = null;
		if (checkIndex < checks.length - 1) {
			checkIndex += 1;
		} else {
			// Finished the topic — remember it so /basics can show progress.
			if (category?.key) markBasicsCompleted(category.key);
			checkIndex = checks.length; // falls through to the done panel
		}
	}

	function restartChecks() {
		checkIndex = 0;
		checkPicked = null;
		checkScore = 0;
	}

	function getWordTranslation(word: BasicWord): string {
		return currentLang === 'fa' ? word.fa : word.en;
	}

	function getExampleTranslation(word: BasicWord): string {
		return currentLang === 'fa' ? ((word.example_fa ?? word.exampleFa) || '') : ((word.example_en ?? word.exampleEn) || '');
	}

	function getFormMeaning(form: { en: string; fa: string }): string {
		return currentLang === 'fa' ? form.fa : form.en;
	}

	function playWord(text: string) {
		stopAllAudio();
		playAudioPromise(text, 1, 'de-DE');
	}

	function playExample(text: string) {
		if (!text) return;
		stopAllAudio();
		playAudioPromise(text, 1, 'de-DE');
	}

	function handleWordClick(german: string) {
		playWord(german);
	}

	function handleExampleClick(e: Event, example: string) {
		e.stopPropagation();
		playExample(example);
	}

	function handleWordKeydown(e: KeyboardEvent, german: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			playWord(german);
		}
	}

	function handleExampleKeydown(e: KeyboardEvent, example: string) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			e.stopPropagation();
			playExample(example);
		}
	}

	function handleConjugationRowClick(pronoun: string, verb: string) {
		playWord(`${pronoun} ${verb}`);
	}

	function handleSpeedChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		voiceSpeed = parseFloat(target.value);
		setVoiceSpeed(voiceSpeed);
	}

	// ── Quiz functions ──
	function collectAllWords(): BasicWord[] {
		const all: BasicWord[] = [];
		// Flat words (grid/table categories)
		if (words.length > 0) {
			all.push(...words);
		}
		// Section-based words (multi categories)
		for (const sec of sections) {
			if (sec.words) {
				all.push(...sec.words);
			}
			// Conjugation verbs: add infinitive as a word
			if (sec.type === 'conjugation' && sec.infinitive) {
				all.push({
					german: sec.infinitive.german,
					en: sec.infinitive.en,
					fa: sec.infinitive.fa
				});
			}
		}
		return all;
	}

	function shuffleArray<T>(arr: T[]): T[] {
		const a = [...arr];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	function startQuiz() {
		const all = collectAllWords();
		if (all.length === 0) return;
		quizDeck = shuffleArray(all);
		quizIndex = 0;
		quizRevealed = false;
		quizDone = false;
		quizGotIt = 0;
		cardPhase = 'prompt';
		voiceResult = null;
		voiceTranscript = '';
		quizMode = true;
	}

	function revealQuiz() {
		quizRevealed = true;
		// Play the word audio
		stopAllAudio();
		playAudioPromise(quizDeck[quizIndex].german, 1, 'de-DE');
	}

	function quizAnswer(gotIt: boolean) {
		if (gotIt) quizGotIt++;
		voiceTranscript = '';
		voiceResult = null;
		cardPhase = 'prompt';
		wrongFlash = false;
		if (quizIndex < quizDeck.length - 1) {
			quizIndex++;
			quizRevealed = false;
		} else {
			quizDone = true;
		}
	}

	function exitQuiz() {
		stopListening();
		quizMode = false;
	}

	// ── Voice functions ──
	function handleQuizMicClick() {
		unlockAudioContext();
		if (cardPhase === 'prompt') {
			cardPhase = 'recording';
		}
		toggleMic();
	}

	function handleQuizVoiceResult(transcript: string) {
		voiceTranscript = transcript;
		const card = quizDeck[quizIndex];
		const result = matchVoiceInput(transcript, card.german);
		voiceResult = result;
		cardPhase = 'result';

		if (result.isMatch) {
			quizGotIt++;
			playTone('success');
			stopAllAudio();
			playAudioPromise(card.german, 1, 'de-DE');
			setTimeout(() => quizAnswer(false), 1800); // already counted above
		} else {
			playTone('error');
			wrongFlash = true;
			setTimeout(() => { wrongFlash = false; }, 1000);
			setTimeout(() => {
				stopAllAudio();
				playAudioPromise(card.german, 1, 'de-DE');
			}, 400);
		}
	}

	function showQuizAnswer() {
		cardPhase = 'result';
		voiceTranscript = '';
		voiceResult = null;
		const card = quizDeck[quizIndex];
		stopAllAudio();
		playAudioPromise(card.german, 1, 'de-DE');
	}

	function retryQuizCard() {
		voiceTranscript = '';
		voiceResult = null;
		cardPhase = 'prompt';
		wrongFlash = false;
	}

	const hasQuizWords = $derived(words.length > 0 || sections.some((s: { words?: unknown[]; type?: string; infinitive?: unknown }) => (s.words && s.words.length > 0) || (s.type === 'conjugation' && s.infinitive)));

	onMount(async () => {
		const savedLang = await getLanguage();
		if (savedLang === 'fa' || savedLang === 'en') {
			currentLang = savedLang;
		} else {
			const browserLang = navigator.language || 'en';
			currentLang = browserLang.startsWith('fa') ? 'fa' : 'en';
		}

		const savedSpeed = await getVoiceSpeed();
		if (savedSpeed !== null && !isNaN(savedSpeed)) {
			voiceSpeed = savedSpeed;
		}

		speechSupported = initSpeechRecognition();
		setVoiceInputHandler(handleQuizVoiceResult);
		setMicStateChangeHandler(() => {});
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') stopAllAudio();
		stopListening();
		destroySpeechRecognition();
	});
</script>

<svelte:head>
	<title>{catTitle} - Mirifer</title>
	<!-- Reciprocal with /fa/basics/[category]; Google drops one-directional
	     hreflang, which would void the Persian annotation as well. -->
	<link rel="canonical" href={`https://www.mirifer.com/basics/${category?.key ?? ''}`} />
	<link rel="alternate" hreflang="en" href={`https://www.mirifer.com/basics/${category?.key ?? ''}`} />
	<link rel="alternate" hreflang="fa" href={`https://www.mirifer.com/fa/basics/${category?.key ?? ''}`} />
</svelte:head>

<main class="category-container">
	{#snippet categoryHeaderActions()}
		{#if hasQuizWords}
			<button class="practice-btn" onclick={startQuiz}>Practice</button>
		{/if}
	{/snippet}

	{#snippet categorySecondaryControls()}
		<div class="controls">
			<select aria-label="Select voice speed" value={voiceSpeed.toString()} onchange={handleSpeedChange}>
				<option value="1">{'🔊 1x'}</option>
				<option value="0.75">{'🔉 0.75x'}</option>
				<option value="0.5">{'🐢 0.5x'}</option>
				<option value="0.25">{'🐌 0.25x'}</option>
			</select>
		</div>
	{/snippet}

	{#if !quizMode}
		<div class="category-header-shell">
			<AppHeader
				title={catTitle}
				subtitle={catDesc}
				icon={catIcon}
				backHref="/basics"
				backLabel={backText}
				actions={categoryHeaderActions}
				secondary={categorySecondaryControls}
				secondaryLabel={currentLang === "fa" ? "کنترل‌های مبحث" : "Topic controls"}
				direction={currentLang === "fa" ? "rtl" : "ltr"}
			/>
		</div>

		<span id="main-content" tabindex="-1" class="sr-only"></span>
	{/if}

	{#if quizMode}
		<!-- ══════ FLASHCARD QUIZ MODE ══════ -->
		<div class="quiz-area">
			<div class="quiz-header-shell">
				<AppHeader
					title={quizDone ? "Done!" : `${quizIndex + 1} / ${quizDeck.length}`}
					icon={catIcon}
					onBack={exitQuiz}
					backLabel={backText}
					direction={currentLang === "fa" ? "rtl" : "ltr"}
				/>
			</div>

			{#if quizDone}
				<div class="quiz-done">
					<span class="quiz-done-icon">🎉</span>
					<h2>Practice Complete!</h2>
					<p>You reviewed {quizDeck.length} words.</p>
					<div class="quiz-done-stats">
						<span class="quiz-stat got-it">✓ {quizGotIt} got it</span>
						<span class="quiz-stat still-learning">○ {quizDeck.length - quizGotIt} still learning</span>
					</div>
					<div class="quiz-done-actions">
						<button class="quiz-action-btn primary" onclick={startQuiz}>Practice Again</button>
						<button class="quiz-action-btn secondary" onclick={exitQuiz}>Back to {catTitle}</button>
					</div>
				</div>
			{:else}
				<div class="quiz-card" class:result={cardPhase === 'result'} class:wrong-flash={wrongFlash}>
					{#if cardPhase === 'result'}
						<span class="quiz-word">{quizDeck[quizIndex].german}</span>
						<span class="quiz-divider"></span>
						<span class="quiz-meaning">{getWordTranslation(quizDeck[quizIndex])}</span>

						{#if voiceResult}
							<div class="voice-feedback" class:correct={voiceResult.isMatch} class:wrong={!voiceResult.isMatch}>
								<span class="vf-icon">{voiceResult.isMatch ? '✅' : '❌'}</span>
								<span class="vf-label">{voiceResult.isMatch ? 'Correct!' : 'Not quite'}</span>
								{#if voiceTranscript}
									<span class="vf-transcript">You said: "{voiceTranscript}"</span>
								{/if}
							</div>
						{:else}
							<div class="voice-feedback skipped">
								<span class="vf-icon">👁️</span>
								<span class="vf-label">Answer revealed</span>
							</div>
						{/if}
					{:else}
						<span class="quiz-meaning-prompt">{getWordTranslation(quizDeck[quizIndex])}</span>
						<span class="quiz-hint">
							{cardPhase === 'recording' ? 'Listening...' : 'Say the German word'}
						</span>
					{/if}
				</div>

				<div class="quiz-buttons">
					{#if cardPhase === 'result'}
						{#if voiceResult?.isMatch}
							<button class="quiz-btn got-it" onclick={() => quizAnswer(false)}>
								Continue →
							</button>
						{:else if voiceResult}
							<button class="quiz-btn retry-btn" onclick={retryQuizCard}>
								Retry 🎙️
							</button>
							<button class="quiz-btn still-learning" onclick={() => quizAnswer(false)}>
								Next →
							</button>
						{:else}
							<button class="quiz-btn still-learning" onclick={() => quizAnswer(false)}>
								Still learning
							</button>
							<button class="quiz-btn got-it" onclick={() => quizAnswer(true)}>
								I knew it
							</button>
						{/if}
					{:else}
						{#if speechSupported}
							<button
								class="quiz-mic-btn"
								class:pulse={app.isListening}
								onclick={handleQuizMicClick}
							>
								🎙️
							</button>
						{/if}
						<button class="quiz-skip-btn" onclick={showQuizAnswer}>
							Show Answer
						</button>
					{/if}
				</div>

				<div class="quiz-progress-bar">
					<div class="quiz-progress-fill" style="width: {(quizIndex / quizDeck.length) * 100}%"></div>
				</div>
			{/if}
		</div>
	{:else}
	<div id="content-container">
		{#if category}
			{#if steps.length > 1 || checks.length === 0}
				<div class="step-rail">
					<div class="rail-dots" aria-hidden="true">
						{#each steps as _, i}
							<span
								class="rail-dot"
								class:passed={i < stepIndex}
								class:here={i === stepIndex}
							></span>
						{/each}
					</div>
					<span class="rail-count">{stepIndex + 1} / {steps.length}</span>
				</div>
			{/if}

			<!-- One screen at a time. The rule leads: a reference table only
			     helps someone who already knows the rule. -->
			{#if currentStep?.kind === 'rule'}
				{#if catExplanation}
					<div class="rule-block" dir={currentLang === "fa" ? "rtl" : "ltr"}>
						<p class="rule-text">{catExplanation}</p>
					</div>
				{/if}
				{#if catPitfall}
					<div class="pitfall-block" dir={currentLang === "fa" ? "rtl" : "ltr"}>
						<span class="pitfall-label">⚠️ {pitfallLabel}</span>
						<p class="pitfall-text">{catPitfall}</p>
					</div>
				{/if}

			{:else if currentStep?.kind === 'section' && currentStep.section}
				{@const section = currentStep.section}
					<div class="section-block">
						<h3 class="section-heading">{currentLang === "fa" ? section.heading_fa : section.heading_en}</h3>
						{#if sectionExplanation(section)}
							<p
								class="section-explanation"
								dir={currentLang === "fa" ? "rtl" : "ltr"}
							>
								{sectionExplanation(section)}
							</p>
						{/if}

						{#if section.type === 'conjugation' && section.infinitive && section.tenses}
							<!-- Verb Banner -->
							<!-- svelte-ignore a11y_interactive_supports_focus -->
							<div
								class="verb-infinitive-banner"
								role="button"
								aria-label="{section.infinitive.german} - {getFormMeaning(section.infinitive)}"
								onclick={() => playWord(section.infinitive!.german)}
								onkeydown={(e) => handleWordKeydown(e, section.infinitive!.german)}
								tabindex="0"
							>
								<div>
									<span class="verb-main">{section.infinitive.german}</span>
									<span class="verb-meaning">&mdash; {getFormMeaning(section.infinitive)}</span>
								</div>
								<span class="verb-play" aria-hidden="true">🔊</span>
							</div>

							<!-- Conjugation Tables -->
							{#each section.tenses as tense}
								<div class="conjugation-section">
									<h3>{tense.name[currentLang] || tense.name.en}</h3>
									<table class="conjugation-table">
										<thead>
											<tr>
												<th>{currentLang === 'fa' ? '\u0636\u0645\u06CC\u0631' : 'Pronoun'}</th>
												<th>{currentLang === 'fa' ? '\u0641\u0639\u0644' : 'Verb'}</th>
												<th>{currentLang === 'fa' ? '\u0645\u0639\u0646\u06CC' : 'Meaning'}</th>
												<th class="example-cell">{currentLang === 'fa' ? '\u0645\u062B\u0627\u0644' : 'Example'}</th>
												<th></th>
											</tr>
										</thead>
										<tbody>
											{#each tense.forms as form}
												<!-- svelte-ignore a11y_interactive_supports_focus -->
												<tr
													role="button"
													aria-label="{form.pronoun} {form.verb} - {getFormMeaning(form)}"
													onclick={() => handleConjugationRowClick(form.pronoun, form.verb)}
													onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleConjugationRowClick(form.pronoun, form.verb); } }}
													tabindex="0"
												>
													<td class="pronoun-cell">{form.pronoun}</td>
													<td class="verb-cell">{form.verb}</td>
													<td class="meaning-cell">{getFormMeaning(form)}</td>
													<!-- svelte-ignore a11y_interactive_supports_focus -->
													<td
														class="example-cell"
														role="button"
														aria-label="Example: {form.example || ''}"
														onclick={(e) => handleExampleClick(e, form.example || '')}
														onkeydown={(e) => handleExampleKeydown(e, form.example || '')}
														tabindex="0"
													>
														<div>{form.example || ''}</div>
														{#if (currentLang === 'fa' ? form.exampleFa : form.exampleEn)}
															<div class="example-cell-translation">
																{currentLang === 'fa' ? (form.exampleFa || '') : (form.exampleEn || '')}
															</div>
														{/if}
													</td>
													<td class="play-cell" aria-hidden="true">🔊</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/each}

						{:else if section.type === 'declension' && section.declension}
							<!-- Declension Table -->
							<div class="declension-section">
								<div class="declension-scroll">
									<table class="declension-table">
										<thead>
											<tr>
												<th class="corner-cell"></th>
												{#each section.declension.columns as col}
													<th>{currentLang === 'fa' ? col.fa : col.en}</th>
												{/each}
											</tr>
										</thead>
										<tbody>
											{#each section.declension.rows as row}
												<tr>
													<td class="case-label">{currentLang === 'fa' ? row.label.fa : row.label.en}</td>
													{#each row.forms as form}
														<!-- svelte-ignore a11y_interactive_supports_focus -->
														<td
															class="case-form"
															role="button"
															aria-label="Play {form}"
															onclick={() => playWord(form)}
															onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playWord(form); } }}
															tabindex="0"
														>{form}</td>
													{/each}
												</tr>
												{#if row.example}
													<tr class="example-row">
														<td colspan={section.declension.columns.length + 1}>
															<!-- svelte-ignore a11y_interactive_supports_focus -->
															<span
																class="dec-example"
																role="button"
																aria-label="Play example: {row.example}"
																onclick={() => playExample(row.example || '')}
																onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); playExample(row.example || ''); } }}
																tabindex="0"
															>
																{row.example} <span class="dec-speaker" aria-hidden="true">🔊</span>
															</span>
															{#if (currentLang === 'fa' ? row.example_fa : row.example_en)}
																<span class="dec-example-trans">
																	{currentLang === 'fa' ? (row.example_fa || '') : (row.example_en || '')}
																</span>
															{/if}
														</td>
													</tr>
												{/if}
											{/each}
										</tbody>
									</table>
								</div>
							</div>

						{:else if section.type === 'table' && section.words}
							<!-- Pronoun Table -->
							<div class="pronoun-grid">
								{#each section.words as word}
									<!-- svelte-ignore a11y_interactive_supports_focus -->
									<div
										class="pronoun-row"
										role="button"
										aria-label="{word.german} - {getWordTranslation(word)}"
										onclick={() => handleWordClick(word.german)}
										onkeydown={(e) => handleWordKeydown(e, word.german)}
										tabindex="0"
									>
										<div class="pronoun-german">{word.german}</div>
										<div class="pronoun-meaning">{getWordTranslation(word)}</div>
										<!-- svelte-ignore a11y_interactive_supports_focus -->
										<div
											class="pronoun-example"
											role="button"
											aria-label="Example: {word.example}"
											onclick={(e) => handleExampleClick(e, word.example || '')}
											onkeydown={(e) => handleExampleKeydown(e, word.example || '')}
											tabindex="0"
										>
											{word.example} <span aria-hidden="true">🔊</span>
											{#if getExampleTranslation(word)}
												<div class="example-translation">{getExampleTranslation(word)}</div>
											{/if}
										</div>
									</div>
								{/each}
							</div>

						{:else if section.words}
							<!-- Word Grid -->
							<div class="word-grid">
								{#each section.words as word}
									<!-- svelte-ignore a11y_interactive_supports_focus -->
									<div
										class="word-card"
										role="button"
										aria-label="{word.german} - {getWordTranslation(word)}"
										onclick={() => handleWordClick(word.german)}
										onkeydown={(e) => handleWordKeydown(e, word.german)}
										tabindex="0"
									>
										<div class="word-german">{word.german}</div>
										<div class="word-translation">{getWordTranslation(word)}</div>
										{#if word.example}
											<!-- svelte-ignore a11y_interactive_supports_focus -->
											<div
												class="word-example"
												role="button"
												aria-label="Example: {word.example}"
												onclick={(e) => handleExampleClick(e, word.example || '')}
												onkeydown={(e) => handleExampleKeydown(e, word.example || '')}
												tabindex="0"
											>
												{word.example} <span class="example-speaker" aria-hidden="true">🔊</span>
												{#if getExampleTranslation(word)}
													<div class="example-translation">{getExampleTranslation(word)}</div>
												{/if}
											</div>
										{/if}
										<div class="play-icon" aria-hidden="true">🔊</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>

			{:else if currentStep?.kind === 'section' && words.length > 0}
				<!-- Simple Word Grid -->
				<div class="word-grid">
					{#each words as word}
						<!-- svelte-ignore a11y_interactive_supports_focus -->
						<div
							class="word-card"
							role="button"
							aria-label="{word.german} - {getWordTranslation(word)}"
							onclick={() => handleWordClick(word.german)}
							onkeydown={(e) => handleWordKeydown(e, word.german)}
							tabindex="0"
						>
							<div class="word-german">{word.german}</div>
							<div class="word-translation">{getWordTranslation(word)}</div>
							{#if word.example}
								<!-- svelte-ignore a11y_interactive_supports_focus -->
								<div
									class="word-example"
									role="button"
									aria-label="Example: {word.example}"
									onclick={(e) => handleExampleClick(e, word.example || '')}
									onkeydown={(e) => handleExampleKeydown(e, word.example || '')}
									tabindex="0"
								>
									{word.example} <span class="example-speaker" aria-hidden="true">🔊</span>
									{#if getExampleTranslation(word)}
										<div class="example-translation">{getExampleTranslation(word)}</div>
									{/if}
								</div>
							{/if}
							<div class="play-icon" aria-hidden="true">🔊</div>
						</div>
					{/each}
				</div>

			{:else if currentStep?.kind === 'checks'}
				<!-- Retrieval. Reading a rule is not knowing it; this is the
				     first moment the learner has to produce anything. -->
				{#if currentCheck}
					<div class="check-card">
						<div class="check-head">
							<span class="check-kicker">{checkKicker}</span>
							<span class="check-count">{checkIndex + 1} / {checks.length}</span>
						</div>
						<p class="check-prompt" dir={currentLang === "fa" ? "rtl" : "ltr"}>
							{currentCheck.prompt}
						</p>
						<p
							class="check-subject"
							lang={currentCheck.subjectLang === 'de' ? 'de' : undefined}
							dir={currentCheck.subjectLang === 'de'
								? 'ltr'
								: currentLang === 'fa'
									? 'rtl'
									: 'ltr'}
						>
							{currentCheck.subject}
						</p>

						<div class="check-options">
							{#each currentCheck.options as option, i}
								<button
									class="check-option"
									class:right={checkPicked !== null && i === currentCheck.correctIndex}
									class:wrong={checkPicked === i && i !== currentCheck.correctIndex}
									disabled={checkPicked !== null}
									lang={currentCheck.kind === 'meaning' ? undefined : 'de'}
									onclick={() => answerCheck(i)}
								>
									{option}
									<!-- A mark as well as a colour: which answer was
									     right must not depend on telling two hues apart. -->
									{#if checkPicked !== null && i === currentCheck.correctIndex}
										<span class="opt-mark" aria-hidden="true">✓</span>
									{:else if checkPicked === i}
										<span class="opt-mark" aria-hidden="true">✗</span>
									{/if}
								</button>
							{/each}
						</div>

						{#if checkPicked !== null}
							<button class="check-next" onclick={nextCheck}>
								{checkIndex < checks.length - 1 ? nextText : finishText}
							</button>
						{/if}
					</div>
				{:else}
					<div class="check-card done-card">
						<span class="done-mark" aria-hidden="true">✓</span>
						<h3 class="done-title">{doneTitle}</h3>
						<p class="done-score">{checkScore} / {checks.length}</p>
						<div class="done-actions">
							<button class="check-next" onclick={restartChecks}>{againText}</button>
							<a class="done-link" href="/basics">{allTopicsText}</a>
						</div>
					</div>
				{/if}
			{/if}

			{#if steps.length > 1}
				<div class="step-nav">
					<button class="step-btn" onclick={goBack} disabled={stepIndex === 0}>
						{currentLang === "fa" ? "→ قبلی" : "← Previous"}
					</button>
					{#if !atEnd}
						<button class="step-btn primary" onclick={goNext}>
							{currentLang === "fa" ? "بعدی ←" : "Next →"}
						</button>
					{:else}
						<a class="step-btn primary" href="/basics" onclick={() => { if (checks.length === 0 && category?.key) markBasicsCompleted(category.key); }}>{checks.length === 0 ? finishText : allTopicsText}</a>
					{/if}
				</div>
			{/if}
		{:else}
			<p style="color: #888; text-align: center; padding: 40px;">Category not found.</p>
		{/if}
	</div>
	{/if}
</main>

<style>
	:global(body) {
		background: var(--paper);
	}

	.category-container {
		max-width: 900px;
		margin: 0 auto;
		padding: 30px 20px;
	}

	.category-header-shell {
		margin-bottom: 30px;
	}

	.controls {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}

	.controls select {
		/* 44px minimum touch target. */
		min-height: 44px;
		padding: 8px 16px;
		border-radius: 20px;
		border: 1px solid var(--control-border);
		background: var(--control);
		color: var(--ink);
		font-size: 0.9rem;
		cursor: pointer;
	}

	.controls select option {
		background: var(--paper-raised);
		color: var(--ink);
	}

	.section-block {
		margin-bottom: 30px;
	}

	/* ── Stepped flow: rail, nav, checks ── */
	.step-rail {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 18px;
	}

	.rail-dots {
		display: flex;
		gap: 6px;
		flex: 1;
	}

	.rail-dot {
		flex: 1;
		height: 5px;
		border-radius: 3px;
		background: var(--control-border);
		transition: background 0.2s ease;
	}

	.rail-dot.passed {
		background: var(--leaf);
	}

	.rail-dot.here {
		background: var(--accent);
	}

	.rail-count {
		color: var(--ink-soft);
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.step-nav {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		margin-top: 28px;
		padding-top: 20px;
		border-top: 1px solid var(--line);
	}

	.step-btn {
		min-height: 44px;
		padding: 12px 22px;
		border-radius: 12px;
		border: 2px solid var(--control-edge);
		background: var(--control);
		color: var(--ink);
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		box-shadow: 0 3px 0 var(--control-edge);
		transition:
			transform 0.06s ease,
			box-shadow 0.06s ease;
	}

	.step-btn.primary {
		background: var(--leaf);
		border-color: var(--leaf-edge);
		box-shadow: 0 3px 0 var(--leaf-edge);
		color: var(--on-accent);
	}

	.step-btn:not(:disabled):active {
		transform: translateY(3px);
		box-shadow: 0 0 0 var(--control-edge);
	}

	.step-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
		box-shadow: none;
	}

	.check-card {
		background: var(--paper-raised);
		border: 2px solid var(--leaf-edge);
		border-radius: 16px;
		padding: 24px 20px;
		text-align: center;
	}

	.check-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 14px;
	}

	.check-kicker {
		color: var(--leaf);
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.check-count {
		color: var(--ink-soft);
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
	}

	.check-prompt {
		color: var(--ink-soft);
		font-size: 0.95rem;
		margin: 0 0 8px;
	}

	.check-subject {
		color: var(--ink);
		font-family: var(--font-display);
		font-size: 1.8rem;
		margin: 0 0 22px;
	}

	.check-options {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 10px;
	}

	.check-option {
		min-height: 48px;
		min-width: 96px;
		padding: 12px 20px;
		border-radius: 12px;
		border: 2px solid var(--control-edge);
		background: var(--control);
		color: var(--ink);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		box-shadow: 0 3px 0 var(--control-edge);
		transition:
			transform 0.06s ease,
			box-shadow 0.06s ease;
	}

	.check-option:not(:disabled):active {
		transform: translateY(3px);
		box-shadow: 0 0 0 var(--control-edge);
	}

	/* After an answer the right option is always marked, so a wrong pick
	   teaches instead of only scoring. */
	.check-option.right {
		background: var(--leaf);
		border-color: var(--leaf-edge);
		box-shadow: 0 3px 0 var(--leaf-edge);
		color: var(--on-accent);
	}

	/* --accent is deep green in this palette, so a wrong answer needs the
	   dedicated --miss token or it comes out the same colour as a right one. */
	.check-option.wrong {
		background: var(--miss);
		border-color: var(--miss-edge);
		box-shadow: 0 3px 0 var(--miss-edge);
		color: var(--on-accent);
	}

	.opt-mark {
		margin-inline-start: 8px;
		font-weight: 700;
	}

	/* ── Word-order check ── */










	.check-next:disabled {
		opacity: 0.45;
		cursor: not-allowed;
		box-shadow: none;
	}



	.check-option:disabled {
		cursor: default;
	}

	.check-next {
		min-height: 44px;
		margin-top: 20px;
		padding: 12px 30px;
		border-radius: 12px;
		border: 2px solid var(--leaf-edge);
		background: var(--leaf);
		color: var(--on-accent);
		font-size: 0.95rem;
		font-weight: 700;
		cursor: pointer;
		box-shadow: 0 3px 0 var(--leaf-edge);
	}

	.check-next:active {
		transform: translateY(3px);
		box-shadow: 0 0 0 var(--leaf-edge);
	}

	.done-mark {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: var(--leaf);
		color: var(--on-accent);
		font-size: 1.8rem;
	}

	.done-title {
		color: var(--ink);
		font-family: var(--font-display);
		margin: 14px 0 4px;
	}

	.done-score {
		color: var(--ink-soft);
		font-size: 1.1rem;
		font-variant-numeric: tabular-nums;
		margin: 0;
	}

	.done-actions {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
	}

	.done-link {
		color: var(--leaf);
		font-size: 0.95rem;
		font-weight: 600;
		min-height: 44px;
		display: inline-flex;
		align-items: center;
	}

	.section-heading {
		color: var(--leaf);
		font-family: var(--font-display);
		font-size: 1.2rem;
		margin-bottom: 15px;
		padding-bottom: 8px;
		border-bottom: 1px solid var(--line);
	}

	/* ── Rule + pitfall (grammar categories only) ── */
	.rule-block {
		background: var(--paper-raised);
		border: 1px solid var(--line);
		border-inline-start: 4px solid var(--leaf);
		border-radius: 12px;
		padding: 16px 18px;
		margin-bottom: 14px;
		box-shadow: var(--paper-shadow);
	}

	.rule-text {
		color: var(--ink);
		font-size: 1.02rem;
		line-height: 1.85;
		margin: 0;
		white-space: pre-line;
	}

	.pitfall-block {
		background: var(--accent-wash);
		border: 1px solid var(--accent);
		border-radius: 12px;
		padding: 14px 18px;
		margin-bottom: 22px;
	}

	.pitfall-label {
		display: block;
		font-weight: 800;
		font-size: 0.85rem;
		color: var(--accent-deep);
		margin-bottom: 5px;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.pitfall-text {
		color: var(--ink);
		font-size: 0.97rem;
		line-height: 1.8;
		margin: 0;
		white-space: pre-line;
	}

	.section-explanation {
		color: var(--ink-soft);
		font-size: 0.95rem;
		line-height: 1.8;
		margin: -6px 0 14px;
		white-space: pre-line;
	}

	/* Word Grid */
	.word-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 15px;
		margin-top: 20px;
	}

	.word-card {
		background: var(--paper-raised);
		border-radius: 16px;
		padding: 20px;
		text-align: center;
		cursor: pointer;
		transition: all 0.3s ease;
		border: 1px solid var(--line);
		box-shadow: var(--paper-shadow);
		min-height: 140px;
		display: flex;
		flex-direction: column;
	}

	.word-card:hover {
		transform: translateY(-5px);
		background: var(--leaf-wash);
		border-color: var(--leaf);
		box-shadow: 0 10px 30px rgba(88, 214, 141, 0.15);
	}

	.word-card:active {
		transform: scale(0.95);
	}

	.word-german {
		font-size: clamp(1rem, 4vw, 1.6rem);
		font-weight: 700;
		margin-bottom: 10px;
		color: var(--leaf);
		word-wrap: break-word;
		overflow-wrap: break-word;
		hyphens: auto;
		line-height: 1.2;
	}

	.word-translation {
		font-size: 1rem;
		color: var(--ink-soft);
		margin-bottom: 8px;
	}

	.word-example {
		font-size: 0.85rem;
		color: var(--ink-soft);
		font-style: italic;
		margin-top: 10px;
		padding-top: 10px;
		border-top: 1px solid var(--line);
		cursor: pointer;
		transition: color 0.3s;
	}

	.word-example:hover {
		color: var(--leaf);
	}

	.example-speaker {
		opacity: 0.6;
		transition: opacity 0.3s;
	}

	.word-example:hover .example-speaker {
		opacity: 1;
	}

	.example-translation {
		font-size: 0.78rem;
		color: #3498db;
		font-style: normal;
		margin-top: 4px;
	}

	.play-icon {
		font-size: 1.3rem;
		opacity: 0.3;
		margin-top: auto;
		padding-top: 10px;
		transition: opacity 0.3s;
	}

	.word-card:hover .play-icon {
		opacity: 1;
	}

	/* Pronoun Table */
	.pronoun-grid {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: 20px;
	}

	.pronoun-row {
		display: grid;
		grid-template-columns: 100px 1fr 2fr;
		gap: 15px;
		padding: 18px 20px;
		border-radius: 12px;
		background: var(--paper-raised);
		border: 1px solid var(--line);
		cursor: pointer;
		transition: all 0.3s ease;
		align-items: center;
	}

	.pronoun-row:hover {
		background: var(--leaf-wash);
		transform: translateX(5px);
	}

	.pronoun-german {
		font-weight: 700;
		color: var(--leaf);
		font-size: 1.4rem;
	}

	.pronoun-meaning {
		color: #3498db;
		font-size: 1.1rem;
	}

	.pronoun-example {
		color: var(--ink-soft);
		font-size: 0.95rem;
	}

	/* Conjugation */
	.verb-infinitive-banner {
		background: var(--leaf-wash);
		border: 1px solid var(--leaf);
		border-radius: 16px;
		padding: 20px 25px;
		margin-bottom: 25px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.verb-infinitive-banner:hover {
		background: var(--leaf-wash);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(88, 214, 141, 0.15);
	}

	.verb-main {
		font-size: 1.8rem;
		font-weight: 700;
		color: var(--leaf);
	}

	.verb-meaning {
		font-size: 1.1rem;
		color: var(--ink-soft);
		margin-left: 15px;
	}

	.verb-play {
		font-size: 1.5rem;
		opacity: 0.6;
		transition: opacity 0.3s;
	}

	.verb-infinitive-banner:hover .verb-play {
		opacity: 1;
	}

	.conjugation-section {
		margin-bottom: 30px;
	}

	.conjugation-section h3 {
		font-size: 1.2rem;
		color: var(--leaf);
		font-family: var(--font-display);
		margin-bottom: 15px;
		padding-bottom: 8px;
		border-bottom: 2px solid var(--leaf);
	}

	.conjugation-table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		border-radius: 12px;
		overflow: hidden;
		background: var(--paper-raised);
		border: 1px solid var(--line);
	}

	.conjugation-table th {
		padding: 14px 18px;
		text-align: left;
		font-weight: 600;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--ink-soft);
		background: var(--paper-sunken);
		border-bottom: 1px solid var(--line);
	}

	.conjugation-table td {
		padding: 14px 18px;
		border-bottom: 1px solid var(--line);
		transition: all 0.2s ease;
	}

	.conjugation-table tr {
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.conjugation-table tbody tr:hover {
		background: var(--leaf-wash);
	}

	.conjugation-table tbody tr:hover td {
		color: var(--ink);
	}

	.conjugation-table tbody tr:last-child td {
		border-bottom: none;
	}

	.pronoun-cell {
		color: var(--ink-soft);
		font-size: 0.95rem;
		width: 100px;
	}

	.verb-cell {
		color: var(--leaf);
		font-weight: 700;
		font-size: 1.1rem;
	}

	.meaning-cell {
		color: #3498db;
		font-size: 0.95rem;
	}

	.example-cell {
		color: var(--ink-soft);
		font-size: 0.85rem;
		font-style: italic;
	}

	.example-cell-translation {
		font-size: 0.75rem;
		color: #3498db;
		font-style: normal;
		margin-top: 2px;
	}

	.play-cell {
		width: 40px;
		text-align: center;
		font-size: 1.1rem;
		opacity: 0.4;
		transition: opacity 0.3s;
	}

	.conjugation-table tbody tr:hover .play-cell {
		opacity: 1;
	}

	/* Declension Table */
	.declension-section {
		margin-bottom: 25px;
	}

	.declension-scroll {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		border-radius: 12px;
	}

	.declension-table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
		border-radius: 12px;
		overflow: hidden;
		background: var(--paper-raised);
		border: 1px solid var(--line);
		min-width: 400px;
	}

	.declension-table thead th {
		padding: 14px 18px;
		text-align: center;
		font-weight: 600;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--ink-soft);
		background: var(--paper-sunken);
		border-bottom: 1px solid var(--line);
	}

	.declension-table .corner-cell {
		width: 120px;
	}

	.declension-table td {
		padding: 14px 18px;
		border-bottom: 1px solid var(--line);
		text-align: center;
		transition: all 0.2s ease;
	}

	.declension-table .case-label {
		text-align: left;
		color: var(--leaf);
		font-weight: 700;
		font-size: 0.95rem;
		white-space: nowrap;
	}

	.declension-table .case-form {
		color: var(--ink);
		font-weight: 600;
		font-size: 1.1rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.declension-table .case-form:hover {
		background: var(--leaf-wash);
		color: var(--leaf);
	}

	.declension-table .example-row td {
		padding: 6px 18px 14px;
		border-bottom: 1px solid var(--line);
		background: var(--paper-sunken);
	}

	.dec-example {
		font-size: 0.85rem;
		color: var(--ink-soft);
		font-style: italic;
		cursor: pointer;
		transition: color 0.2s;
	}

	.dec-example:hover {
		color: var(--leaf);
	}

	.dec-speaker {
		opacity: 0.5;
		transition: opacity 0.2s;
	}

	.dec-example:hover .dec-speaker {
		opacity: 1;
	}

	.dec-example-trans {
		display: block;
		font-size: 0.78rem;
		color: #3498db;
		margin-top: 3px;
	}

	.declension-table tbody tr:last-child td {
		border-bottom: none;
	}

	@media (max-width: 600px) {
		.word-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.pronoun-row {
			grid-template-columns: 80px 1fr;
		}

		.pronoun-example {
			grid-column: span 2;
		}

		.conjugation-table th,
		.conjugation-table td {
			padding: 10px 12px;
			font-size: 0.85rem;
		}

		.verb-cell {
			font-size: 0.95rem;
		}

		.example-cell {
			display: none;
		}

		.verb-main {
			font-size: 1.4rem;
		}

		.declension-table {
			min-width: 340px;
		}

		.declension-table thead th,
		.declension-table td {
			padding: 10px 12px;
			font-size: 0.85rem;
		}

		.declension-table .case-form {
			font-size: 0.95rem;
		}

		.declension-table .corner-cell {
			width: 90px;
		}
	}

	/* ══════ Practice Button ══════ */
	.practice-btn {
		/* 44px minimum touch target. */
		min-height: 44px;
		padding: 8px 18px;
		background: var(--accent-deep);
		border: none;
		border-radius: 20px;
		color: var(--on-accent);
		font-size: 0.85rem;
		font-weight: 700;
		cursor: pointer;
		white-space: nowrap;
		transition: opacity 0.2s;
	}

	.practice-btn:hover { opacity: 0.85; }

	/* ══════ Quiz Mode ══════ */
	.quiz-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 70vh;
		padding: 16px 0;
	}

	.quiz-header-shell {
		width: 100%;
		margin-bottom: 32px;
	}

	.quiz-card {
		width: 100%;
		max-width: 420px;
		min-height: 280px;
		background: var(--paper-raised);
		border: 1px solid var(--line);
		box-shadow: var(--paper-shadow);
		border-radius: 20px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		padding: 40px 24px;
		transition: all 0.3s ease;
		color: inherit;
	}

	.quiz-card.result {
		border-color: var(--accent);
		background: var(--accent-wash);
	}

	.quiz-card.wrong-flash {
		animation: flash-red 1s ease forwards;
		transition: none;
		border-color: #e74c3c;
		box-shadow: 0 0 24px rgba(231, 76, 60, 0.35);
	}

	@keyframes flash-red {
		0% { border-color: #e74c3c; box-shadow: 0 0 24px rgba(231, 76, 60, 0.4); background: rgba(231, 76, 60, 0.08); }
		60% { border-color: #e74c3c; box-shadow: 0 0 16px rgba(231, 76, 60, 0.2); background: rgba(231, 76, 60, 0.04); }
		100% { border-color: var(--line); box-shadow: none; background: var(--paper-raised); }
	}

	.quiz-word {
		font-size: 2rem;
		font-weight: 700;
		font-family: var(--font-display);
		color: var(--ink);
		text-align: center;
	}

	.quiz-meaning-prompt {
		font-size: 2rem;
		font-weight: 700;
		font-family: var(--font-display);
		color: var(--accent-deep);
		text-align: center;
		line-height: 1.3;
	}

	.quiz-hint {
		font-size: 0.85rem;
		color: var(--ink-faint);
	}

	.quiz-divider {
		width: 60px;
		height: 2px;
		background: var(--accent-wash);
		border-radius: 1px;
	}

	.quiz-meaning {
		font-size: 1.2rem;
		color: var(--ink-soft);
		text-align: center;
	}

	/* Voice feedback */
	.voice-feedback {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		margin-top: 8px;
		padding: 12px 20px;
		border-radius: 12px;
		font-size: 0.9rem;
	}

	.voice-feedback.correct {
		background: var(--leaf-wash);
		border: 1px solid var(--leaf);
	}

	.voice-feedback.wrong {
		background: rgba(231, 76, 60, 0.08);
		border: 1px solid rgba(231, 76, 60, 0.35);
	}

	.voice-feedback.skipped {
		background: var(--paper-sunken);
		border: 1px solid var(--line);
	}

	.vf-icon {
		font-size: 1.4rem;
	}

	.vf-label {
		font-weight: 700;
		color: var(--ink);
	}

	.vf-transcript {
		font-size: 0.8rem;
		color: var(--ink-soft);
		font-style: italic;
	}

	.quiz-buttons {
		display: flex;
		gap: 16px;
		width: 100%;
		max-width: 420px;
		margin-top: 24px;
		align-items: center;
		justify-content: center;
	}

	.quiz-btn {
		flex: 1;
		padding: 14px 20px;
		border: none;
		border-radius: 14px;
		font-size: 0.95rem;
		font-weight: 700;
		cursor: pointer;
		transition: opacity 0.2s;
	}

	.quiz-btn:active { opacity: 0.8; }

	.quiz-btn.still-learning {
		background: rgba(231, 76, 60, 0.08);
		color: #e74c3c;
		border: 1px solid rgba(231, 76, 60, 0.35);
	}

	.quiz-btn.retry-btn {
		background: rgba(243, 156, 18, 0.15);
		color: #f39c12;
		border: 1px solid rgba(243, 156, 18, 0.4);
	}

	.quiz-btn.got-it {
		background: var(--leaf-wash);
		color: var(--leaf);
		border: 1px solid var(--leaf);
	}

	/* Mic button */
	.quiz-mic-btn {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		border: 2px solid var(--leaf);
		background: var(--leaf-wash);
		font-size: 1.6rem;
		cursor: pointer;
		transition: all 0.2s;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.quiz-mic-btn:hover {
		background: var(--leaf-wash);
		border-color: var(--leaf);
	}

	.quiz-mic-btn.pulse {
		border-color: var(--accent);
		background: var(--accent-wash);
		animation: mic-pulse 1.2s ease-in-out infinite;
	}

	@keyframes mic-pulse {
		0%, 100% { box-shadow: 0 0 0 0 rgba(46, 204, 113, 0.3); }
		50% { box-shadow: 0 0 0 12px rgba(46, 204, 113, 0); }
	}

	.quiz-skip-btn {
		background: none;
		border: none;
		color: var(--ink-soft);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		padding: 8px 16px;
		transition: color 0.2s;
	}

	.quiz-skip-btn:hover {
		color: var(--ink);
	}

	.quiz-progress-bar {
		width: 100%;
		max-width: 420px;
		height: 4px;
		background: var(--paper-sunken);
		border-radius: 2px;
		margin-top: 32px;
		overflow: hidden;
	}

	.quiz-progress-fill {
		height: 4px;
		background: var(--accent-deep);
		border-radius: 2px;
		transition: width 0.3s ease;
	}

	/* ── Quiz Done ── */
	.quiz-done {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		text-align: center;
		padding: 40px 20px;
	}

	.quiz-done-icon { font-size: 3rem; }

	.quiz-done h2 {
		font-size: 1.5rem;
		font-weight: 700;
		font-family: var(--font-display);
		color: var(--ink);
	}

	.quiz-done p {
		color: var(--ink-soft);
		font-size: 0.95rem;
	}

	.quiz-done-stats {
		display: flex;
		gap: 20px;
		margin: 8px 0;
	}

	.quiz-stat {
		font-size: 0.9rem;
		font-weight: 700;
	}

	.quiz-stat.got-it { color: var(--leaf); }
	.quiz-stat.still-learning { color: #e74c3c; }

	.quiz-done-actions {
		display: flex;
		gap: 12px;
		margin-top: 12px;
	}

	.quiz-action-btn {
		padding: 12px 28px;
		border: none;
		border-radius: 14px;
		font-size: 0.95rem;
		font-weight: 700;
		cursor: pointer;
	}

	.quiz-action-btn.primary {
		background: var(--accent-deep);
		color: var(--on-accent);
	}

	.quiz-action-btn.secondary {
		background: var(--paper-sunken);
		color: var(--ink);
	}
</style>
