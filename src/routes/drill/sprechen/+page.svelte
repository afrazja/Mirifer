<script lang="ts">
	/**
	 * Sprechen Teil 1 drill — the first five minutes of the real Goethe A1
	 * speaking exam: introduce yourself, then prove you can handle spelled
	 * words and phone numbers.
	 *
	 * Three stations:
	 *   1. Vorstellung — 7 sentence frames spoken with the user's own content;
	 *      graded by matching the frame words in the transcript (mic).
	 *   2. Buchstabieren — hear a word spelled letter by letter, pick it.
	 *   3. Telefonnummer — hear a number digit by digit, pick it.
	 *
	 * Results feed recordDrillResult('sprechen', …) → readiness bars.
	 * Speaking items skipped (or no mic) are excluded, like the placement test.
	 */
	import { onDestroy, onMount } from 'svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import { playAudioPromise, stopAllAudio, ttsIsPlaying } from '$services/tts';
	import {
		initSpeechRecognition,
		setVoiceInputHandler,
		setMicStateChangeHandler,
		toggleMic,
		getLastVoiceAlternatives,
		destroySpeechRecognition,
		type MicState
	} from '$services/speech';
	import { bestVoiceMatch } from '$utils/text-matching';
	import { recordDrillResult } from '$services/readiness';
	import { isAuthenticated as checkAuth } from '$services/auth';

	type Item =
		| {
				kind: 'speak';
				frame: string; // graded words — what must appear in the transcript
				display: string; // what we show, with the ___ slot
				en: string;
				fa: string;
				example: string; // full example sentence for "hear one"
		  }
		| {
				kind: 'listen';
				station: 'spell' | 'number';
				audio: string; // letter/digit sequence for TTS
				question: string;
				questionFa: string;
				options: string[];
				correct: number;
		  };

	const ITEMS: Item[] = [
		// ── Station 1: Vorstellung ──
		{
			kind: 'speak',
			frame: 'Ich heiße',
			display: 'Ich heiße ___.',
			en: 'My name is …',
			fa: 'اسم من … است',
			example: 'Ich heiße Sara Ahmadi.'
		},
		{
			kind: 'speak',
			frame: 'Ich bin Jahre alt',
			display: 'Ich bin ___ Jahre alt.',
			en: 'I am … years old',
			fa: 'من … سال دارم',
			example: 'Ich bin fünfundzwanzig Jahre alt.'
		},
		{
			kind: 'speak',
			frame: 'Ich komme aus',
			display: 'Ich komme aus ___.',
			en: 'I come from …',
			fa: 'من اهل … هستم',
			example: 'Ich komme aus dem Iran.'
		},
		{
			kind: 'speak',
			frame: 'Ich wohne in',
			display: 'Ich wohne in ___.',
			en: 'I live in …',
			fa: 'من در … زندگی می‌کنم',
			example: 'Ich wohne in Teheran.'
		},
		{
			kind: 'speak',
			frame: 'Ich spreche Persisch und ein bisschen Deutsch',
			display: 'Ich spreche Persisch und ein bisschen Deutsch.',
			en: 'I speak Persian and a little German',
			fa: 'من فارسی و کمی آلمانی صحبت می‌کنم',
			example: 'Ich spreche Persisch und ein bisschen Deutsch.'
		},
		{
			kind: 'speak',
			frame: 'Ich bin von Beruf',
			display: 'Ich bin ___ von Beruf.',
			en: 'I am a … by profession',
			fa: 'شغل من … است',
			example: 'Ich bin Ingenieur von Beruf.'
		},
		{
			kind: 'speak',
			frame: 'Mein Hobby ist',
			display: 'Mein Hobby ist ___.',
			en: 'My hobby is …',
			fa: 'سرگرمی من … است',
			example: 'Mein Hobby ist Fußball.'
		},
		// ── Station 2: Buchstabieren ──
		{
			kind: 'listen',
			station: 'spell',
			audio: 'B. E. R. L. I. N.',
			question: 'Which word was spelled?',
			questionFa: 'کدام کلمه هجی شد؟',
			options: ['Bern', 'Berlin', 'Bremen'],
			correct: 1
		},
		{
			kind: 'listen',
			station: 'spell',
			audio: 'M. A. R. I. A.',
			question: 'Which name was spelled?',
			questionFa: 'کدام اسم هجی شد؟',
			options: ['Marie', 'Maria', 'Mario'],
			correct: 1
		},
		// ── Station 3: Telefonnummer ──
		{
			kind: 'listen',
			station: 'number',
			audio: 'null, eins, sieben, drei, neun, neun, zwei, vier',
			question: 'Which phone number did you hear?',
			questionFa: 'کدام شماره تلفن را شنیدی؟',
			options: ['0173 9924', '0137 9924', '0173 9942'],
			correct: 0
		},
		{
			kind: 'listen',
			station: 'number',
			audio: 'null, drei, null, fünf, fünf, sechs, acht',
			question: 'Which phone number did you hear?',
			questionFa: 'کدام شماره تلفن را شنیدی؟',
			options: ['030 5586', '030 5568', '003 5568'],
			correct: 1
		}
	];

	type Phase = 'intro' | 'drill' | 'results';
	let phase = $state<Phase>('intro');
	let idx = $state(0);
	let answered = $state(false);
	let lastCorrect = $state(false);
	let micState = $state<MicState>('idle');
	let micAvailable = $state(true);
	let speakFailed = $state(false);
	let authed = $state(false);

	let earned = $state(0);
	let possible = $state(0);
	let speakSkipped = $state(0);

	const item = $derived(ITEMS[idx]);
	const total = ITEMS.length;

	const stationLabel = $derived(
		item.kind === 'speak'
			? { de: 'Vorstellung', fa: 'معرفی خود' }
			: item.station === 'spell'
				? { de: 'Buchstabieren', fa: 'هجی کردن' }
				: { de: 'Telefonnummer', fa: 'شماره تلفن' }
	);

	onMount(async () => {
		authed = await checkAuth();
	});

	function playItemAudio() {
		const it = item;
		if (it.kind === 'listen') {
			void playAudioPromise(it.audio, 1, 'de-DE');
		}
	}

	function start() {
		micAvailable = initSpeechRecognition();
		setMicStateChangeHandler((s) => (micState = s));
		setVoiceInputHandler((transcript) => {
			const it = item;
			if (it.kind !== 'speak' || answered) return;
			const alts = getLastVoiceAlternatives();
			const { result } = bestVoiceMatch(alts.length ? alts : [transcript], it.frame, 0.7);
			if (result.isMatch) {
				speakFailed = false;
				grade(true);
			} else {
				speakFailed = true;
			}
		});
		phase = 'drill';
	}

	function grade(correct: boolean) {
		if (answered) return;
		answered = true;
		lastCorrect = correct;
		earned += correct ? 1 : 0;
		possible += 1;
	}

	function skipSpeak() {
		answered = true;
		lastCorrect = false;
		speakSkipped += 1;
	}

	function next() {
		stopAllAudio();
		answered = false;
		speakFailed = false;
		if (idx < total - 1) {
			idx += 1;
			playItemAudio();
		} else {
			if (possible > 0) recordDrillResult('sprechen', earned, possible);
			phase = 'results';
		}
	}

	const scorePct = $derived(possible > 0 ? Math.round((earned / possible) * 100) : null);

	onDestroy(() => {
		stopAllAudio();
		destroySpeechRecognition();
	});
</script>

<svelte:head>
	<title>Sprechen Teil 1 Drill – Goethe A1 | Mirifer</title>
	<meta
		name="description"
		content="Practice the first part of the Goethe A1 speaking exam: introduce yourself, understand spelled words and phone numbers. Free voice drill."
	/>
</svelte:head>

<main class="drill-page">
	<AppHeader backHref={authed ? '/home' : '/'} backLabel={authed ? 'Home' : 'Mirifer'}>
		{#snippet actions()}
			{#if phase === 'drill'}<span class="dr-progress">{idx + 1} / {total}</span>{/if}
		{/snippet}
	</AppHeader>

	<span id="main-content" tabindex="-1" class="sr-only"></span>

	{#if phase === 'intro'}
		<section class="card intro">
			<div class="badge">🎙 Goethe A1 · Sprechen Teil 1</div>
			<h1>Introduce yourself — exam style</h1>
			<p class="sub">
				The speaking exam always starts the same way: you introduce yourself,
				spell your name, and give a phone number. Drill exactly that —
				7 spoken sentences and 4 listening checks.
			</p>
			<p class="sub fa" dir="rtl">
				آزمون Sprechen همیشه همین‌طور شروع می‌شود: خودت را معرفی می‌کنی، اسمت
				را هجی می‌کنی و یک شماره تلفن می‌گویی. دقیقاً همین را تمرین کن.
			</p>
			<button class="btn-primary big" onclick={start}>▶ Start the drill</button>
			<p class="fine">Speak with your own name, age, and city — the drill checks the sentence frame.</p>
		</section>
	{:else if phase === 'drill'}
		<section class="card">
			<p class="station">{stationLabel.de} · {stationLabel.fa}</p>

			{#if item.kind === 'speak'}
				<p class="frame" lang="de">{item.display}</p>
				<p class="hint">{item.en}</p>
				<p class="hint fa" dir="rtl">{item.fa}</p>
				<button
					class="btn-ghost"
					onclick={() =>
						$ttsIsPlaying
							? stopAllAudio()
							: playAudioPromise(item.kind === 'speak' ? item.example : '', 1, 'de-DE')}
				>
					{$ttsIsPlaying ? '⏹ Stop' : '🔊 Hear an example'}
				</button>
				{#if !answered}
					{#if micAvailable}
						<button
							class="btn-mic"
							class:listening={micState === 'listening'}
							onclick={toggleMic}
						>
							{#if micState === 'listening'}🎙 Listening… tap when done
							{:else if micState === 'processing'}⏳ Checking…
							{:else}🎙 Say it with YOUR details{/if}
						</button>
						{#if speakFailed}
							<p class="retry">
								Say the whole sentence — e.g. „{item.example}" — then it counts.
							</p>
						{/if}
					{/if}
					<button class="skip" onclick={skipSpeak}>
						{micAvailable ? 'Skip this one' : '✓ I said it out loud'}
					</button>
				{/if}
			{:else}
				<!-- Stays live while playing: this item's audio starts on its
				     own, so the learner needs a way to stop it (WCAG 1.4.2). -->
				<button
					class="btn-ghost"
					onclick={() => ($ttsIsPlaying ? stopAllAudio() : playItemAudio())}
				>
					{$ttsIsPlaying ? '⏹ Stop' : '🔊 Play again'}
				</button>
				<p class="frame">{item.question}</p>
				<p class="hint fa" dir="rtl">{item.questionFa}</p>
				{#if !answered}
					<div class="choice-col">
						{#each item.options as opt, i (opt)}
							<button
								class="btn-choice"
								onclick={() => grade(item.kind === 'listen' && i === item.correct)}
								>{String.fromCharCode(97 + i)}) {opt}</button
							>
						{/each}
					</div>
				{/if}
			{/if}

			{#if answered}
				<div class="feedback" class:ok={lastCorrect}>
					{#if lastCorrect}
						<span>✓ Sehr gut!</span>
					{:else if item.kind === 'listen'}
						<span>✗ Answer: {item.options[item.correct]}</span>
					{:else}
						<span>Skipped</span>
					{/if}
					<button class="btn-primary" onclick={next}>
						{idx < total - 1 ? 'Next →' : 'Finish 🎙'}
					</button>
				</div>
			{/if}
		</section>
	{:else}
		<section class="card results">
			<div class="badge">🎙 Sprechen Teil 1</div>
			{#if scorePct !== null}
				<h1>{scorePct}%</h1>
				<p class="sub">
					{scorePct >= 70
						? 'Strong start — this is exactly how the exam opens, and you can do it.'
						: 'Good practice — run the drill again tomorrow; this part of the exam is pure routine.'}
				</p>
			{:else}
				<h1>All skipped</h1>
				<p class="sub">Run it again with the mic on — this station is the easiest exam points you'll ever earn.</p>
			{/if}
			{#if speakSkipped > 0 && scorePct !== null}
				<p class="fine">{speakSkipped} speaking item{speakSkipped === 1 ? '' : 's'} skipped — not counted.</p>
			{/if}
			<p class="sub fa" dir="rtl">
				نتیجه در نوار «صحبت» داشبورد ثبت شد. این بخش آزمون کاملاً قابل تمرین
				است — هر روز یک بار تکرارش کن.
			</p>
			{#if authed}
				<a class="btn-primary big" href="/home">Back to your readiness →</a>
			{:else}
				<a class="btn-primary big" href="/login?mode=signup">Create a free account — track your readiness</a>
			{/if}
		</section>
	{/if}
</main>

<style>
	.drill-page {
		min-height: 100vh;
		background: var(--paper);
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 16px;
	}






	.dr-progress {
		color: var(--ink-faint);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}


	.card {
		width: 100%;
		max-width: 620px;
		background: var(--paper-raised);
		border: 1px solid var(--line);
		border-radius: 16px;
		box-shadow: var(--paper-shadow);
		padding: 26px 24px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}


	.intro,
	.results {
		text-align: center;
		margin-top: 5vh;
	}


	.badge {
		align-self: center;
		background: var(--info-wash);
		color: var(--info);
		border-radius: 999px;
		padding: 4px 14px;
		font-size: 0.85rem;
		font-weight: 700;
	}


	h1 {
		font-family: var(--font-display);
		font-size: 1.7rem;
		color: var(--ink);
	}


	.results h1 {
		font-size: 2.4rem;
		color: var(--leaf);
	}


	.sub {
		color: var(--ink-soft);
		line-height: 1.6;
	}


	.fine {
		color: var(--ink-faint);
		font-size: 0.85rem;
	}


	.station {
		align-self: flex-start;
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: var(--info-wash);
		color: var(--info);
		border-radius: 999px;
		padding: 3px 12px;
	}


	.frame {
		font-size: 1.35rem;
		font-weight: 700;
		color: var(--ink);
	}


	.hint {
		color: var(--ink-soft);
		font-size: 0.92rem;
	}


	.choice-col {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}


	.btn-choice {
		background: var(--paper-raised);
		border: 1.5px solid var(--line);
		border-radius: 10px;
		padding: 12px 16px;
		font-size: 1rem;
		font-weight: 600;
		color: var(--ink);
		cursor: pointer;
		text-align: left;
		font-variant-numeric: tabular-nums;
	}


	.btn-choice:hover {
		border-color: var(--accent);
		background: var(--accent-wash);
	}


	.btn-primary {
		background: var(--accent);
		color: var(--on-accent);
		border: none;
		border-radius: 10px;
		padding: 12px 20px;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		text-decoration: none;
		display: inline-block;
		text-align: center;
	}


	.btn-primary.big {
		font-size: 1.08rem;
		padding: 14px 26px;
	}


	.btn-ghost {
		align-self: flex-start;
		background: var(--paper-raised);
		border: 1.5px solid var(--line);
		border-radius: 10px;
		padding: 9px 16px;
		font-weight: 600;
		color: var(--ink);
		cursor: pointer;
	}


	.btn-ghost:disabled {
		opacity: 0.6;
	}


	.btn-mic {
		background: var(--leaf);
		color: var(--on-accent);
		border: none;
		border-radius: 10px;
		padding: 12px 18px;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
	}


	.btn-mic.listening {
		animation: pulse 1.2s ease-in-out infinite;
	}


	@keyframes pulse {
		0%,
		100% {
			box-shadow: 0 0 0 0 rgba(88, 214, 141, 0.35);
		}
		50% {
			box-shadow: 0 0 0 10px rgba(88, 214, 141, 0);
		}
	}


	.retry {
		color: var(--accent-deep);
		font-size: 0.9rem;
	}


	.skip {
		background: none;
		border: none;
		color: var(--ink-faint);
		text-decoration: underline;
		cursor: pointer;
		font-size: 0.9rem;
		align-self: center;
	}


	.feedback {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		background: var(--accent-wash);
		border-radius: 12px;
		padding: 12px 16px;
		font-weight: 700;
		color: var(--accent-deep);
		flex-wrap: wrap;
	}


	.feedback.ok {
		background: var(--leaf-wash);
		color: var(--leaf);
	}</style>
