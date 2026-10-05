<script lang="ts">
	/**
	 * Mira's greeting at the start of Today, one focused screen at a time.
	 *
	 * Day 1:  welcome (hear Mira) -> say your first sentence (mic, or skip) -> done.
	 * Later:  Mira's line with one question (mic, or skip) -> her reply -> done.
	 * Same day again: one line -> done.
	 *
	 * The day's exchange is kept in this browser, so a reload doesn't run it
	 * twice. `readOnly` shows what happened, for looking back from a module.
	 */
	import { onDestroy, onMount } from 'svelte';
	import { playAudioPromise, stopAllAudio, ttsIsPlaying } from '$services/tts';
	import {
		COACH_RATE, COACH_VOICE, DAY_ONE_LINES, firstSentence, greetingMode, isFirstSentenceAttempt, loadGreeting, localDate, daysSince,
		saveGreeting, scriptedOpening, scriptedReply, type GreetingMode, type GreetingRecord
	} from '$lib/practice/coach';
	import type { EnglishProfile } from '$lib/practice/english-profile';
	import type { EnglishProgress } from '$lib/practice/english-progress';
	import type { DisplayText } from '$lib/practice/hotel';

	let { isFa = false, name, profile, progress, question, readOnly = false, onDone }: {
		isFa?: boolean; name: string; profile: EnglishProfile; progress: EnglishProgress;
		/** Today's theme-linked question (from the day pack). */
		question: string;
		readOnly?: boolean;
		/** The learner has finished the greeting: show today's plan. */
		onDone?: () => void;
	} = $props();

	type Recognition = {
		lang: string; continuous: boolean; interimResults: boolean;
		onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
		onerror: ((event: { error: string }) => void) | null; onend: (() => void) | null;
		start(): void; stop(): void; abort(): void;
	};
	/** hello: Mira's line. speak: say something (or skip). result: what was heard / Mira's reply. */
	type Step = 'hello' | 'speak' | 'result';

	let ready = $state(false);
	let mode = $state<GreetingMode>('first');
	let step = $state<Step>('hello');
	let record = $state<GreetingRecord | null>(null);
	let opening = $state<DisplayText>({ en: '', fa: '' });
	let reply = $state<DisplayText | null>(null);
	let answer = $state(''), typed = $state(false), skipped = $state(false), tooShort = $state(false);
	let showFa = $state(false), typing = $state(false), draft = $state('');
	let listening = $state(false), micProblem = $state<'blocked' | 'unsupported' | 'none' | null>(null);
	let thinking = $state(false);
	let feedback = { improved: null as string | null, noteEn: null as string | null, noteFa: null as string | null };
	let recognition: Recognition | null = null;
	let stopTimer: ReturnType<typeof setTimeout> | undefined;
	let heading: HTMLElement | undefined = $state();
	const playing = $derived($ttsIsPlaying);
	const text = (value: DisplayText) => (isFa && showFa ? value.fa : value.en);
	const lineLang = $derived(isFa && showFa ? 'fa' : 'en');
	const lineDir = $derived(isFa && showFa ? 'rtl' : 'ltr');
	// svelte-ignore state_referenced_locally
	const target = firstSentence(name, profile.reason);

	onMount(() => {
		const now = new Date();
		mode = greetingMode(progress, now);
		showFa = profile.comfort === 'hard';
		const saved = loadGreeting(localDate(now));
		if (saved && saved.mode === mode) {
			record = saved; opening = saved.opening; reply = saved.reply; answer = saved.answer ?? ''; typed = saved.typed;
			feedback = { improved: saved.improved, noteEn: saved.noteEn, noteFa: saved.noteFa };
			skipped = saved.done && !saved.answer;
			step = saved.done ? 'result' : mode === 'returning' ? 'speak' : 'hello';
		} else {
			opening = mode === 'first' ? DAY_ONE_LINES.welcome(name) : scriptedOpening(mode, name, daysSince(progress.lastCompletedAt, now), question);
			step = mode === 'returning' ? 'speak' : 'hello';
			if (mode === 'returning' && !readOnly) void openWithAi();
		}
		ready = true;
	});
	onDestroy(() => { clearTimeout(stopTimer); recognition?.abort(); stopAllAudio(); });

	function save(done: boolean) {
		record = { date: localDate(new Date()), mode, opening, answer: answer || null, typed, reply, done, ...feedback };
		saveGreeting(record);
	}
	function go(next: Step) { stopAllAudio(); step = next; queueMicrotask(() => heading?.focus()); }
	function finish() { stopAllAudio(); if (!record?.done) save(true); onDone?.(); }

	const timeZone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; } };
	/** Asks Mira's AI route; null on any problem or after `wait` ms, so the scripted line stays. */
	async function askMira(body: Record<string, unknown>, wait: number): Promise<Record<string, unknown> | null> {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), wait);
		try {
			const response = await fetch('/api/english/greeting', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, timeZone: timeZone() }), signal: controller.signal });
			return response.ok ? await response.json() : null;
		} catch { return null; }
		finally { clearTimeout(timer); }
	}
	const asLine = (value: Record<string, unknown> | null): DisplayText | null =>
		value && typeof value.line === 'string' ? { en: value.line, fa: typeof value.lineFa === 'string' ? value.lineFa : value.line } : null;

	async function openWithAi() {
		thinking = true;
		const line = asLine(await askMira({ kind: 'open' }, 6_000));
		thinking = false;
		if (answer || skipped) return;
		if (line) opening = line;
		save(false); // keeps today's opening, so a reload doesn't ask again
	}

	async function hear(line: string) {
		if (playing) { stopAllAudio(); return; }
		try { await playAudioPromise(line, COACH_RATE, 'en-US', undefined, COACH_VOICE); } catch { /* the text is on screen */ }
	}

	/** Takes what the learner said or typed. */
	function take(value: string, wasTyped: boolean) {
		const said = value.trim().slice(0, 300);
		if (!said) return;
		if (mode === 'first' && !isFirstSentenceAttempt(said)) { tooShort = true; return; }
		tooShort = false; typed = wasTyped; answer = said;
		if (mode === 'first') { save(true); go('result'); }
		else void replyWithAi(said);
	}
	async function replyWithAi(said: string) {
		go('result'); thinking = true;
		const result = await askMira({ kind: 'reply', opening: opening.en, answer: said }, 4_000);
		thinking = false;
		reply = asLine(result) ?? scriptedReply(name, true);
		const improved = typeof result?.improved === 'string' ? result.improved : null;
		feedback = { improved, noteEn: improved && typeof result?.noteEn === 'string' ? result.noteEn : null, noteFa: improved && typeof result?.noteFa === 'string' ? result.noteFa : null };
		save(true);
	}
	function skip() {
		skipped = true;
		if (mode === 'returning') { reply = scriptedReply(name, false); save(true); go('result'); }
		else { save(true); finish(); }
	}

	function listen() {
		if (listening) { recognition?.stop(); return; }
		const browser = window as Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
		const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
		if (!Constructor) { micProblem = 'unsupported'; typing = true; return; }
		stopAllAudio();
		const current = new Constructor();
		let words = '', failed = false;
		current.lang = 'en-US'; current.continuous = true; current.interimResults = true;
		current.onresult = event => {
			words = Array.from(event.results).map(item => item[0]?.transcript ?? '').join(' ').trim();
			clearTimeout(stopTimer); stopTimer = setTimeout(() => current.stop(), 1_800);
		};
		current.onerror = event => {
			failed = true;
			micProblem = event.error === 'not-allowed' || event.error === 'service-not-allowed' ? 'blocked' : 'none';
			if (micProblem === 'blocked') typing = true;
		};
		current.onend = () => {
			clearTimeout(stopTimer); listening = false; recognition = null;
			if (!failed && words) { micProblem = null; take(words, false); }
			else if (!failed) micProblem = 'none';
		};
		recognition = current; micProblem = null; tooShort = false;
		try { current.start(); listening = true; stopTimer = setTimeout(() => current.stop(), 10_000); }
		catch { micProblem = 'blocked'; typing = true; }
	}
	function sendTyped() { take(draft, true); draft = ''; }
</script>

{#snippet mira(line: DisplayText, hearable = true)}
	<div class="mira-line">
		<p class="line" lang={lineLang} dir={lineDir}>{text(line)}</p>
		{#if hearable}
			<button class="hear" type="button" onclick={() => hear(line.en)} aria-label={playing ? (isFa ? 'توقف صدا' : 'Stop') : (isFa ? 'شنیدن صدای میرا' : 'Hear Mira')}>
				<span aria-hidden="true">{playing ? '■' : '▶'}</span>
			</button>
		{/if}
	</div>
{/snippet}

{#snippet speakArea()}
	{#if !typing}
		<button class="mic" class:on={listening} type="button" onclick={listen} aria-pressed={listening} aria-label={listening ? (isFa ? 'توقف' : 'Stop') : (isFa ? 'بزن و صحبت کن' : 'Tap and speak')}>
			<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0M12 17v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
		</button>
		<p class="mic-label" aria-hidden="true">{listening ? (isFa ? 'گوش می‌دهم…' : 'Listening…') : (isFa ? 'بزن و صحبت کن' : 'Tap and speak')}</p>
	{:else}
		<form class="type" onsubmit={event => { event.preventDefault(); sendTyped(); }}>
			<label class="sr-only" for="coach-input">{isFa ? 'به انگلیسی بنویس' : 'Type in English'}</label>
			<input id="coach-input" bind:value={draft} maxlength="300" lang="en" dir="ltr" autocomplete="off" placeholder={isFa ? 'به انگلیسی بنویس' : 'Type in English'} />
			<button class="send" type="submit" disabled={!draft.trim()}>{isFa ? 'بفرست' : 'Send'}</button>
		</form>
	{/if}
	{#if tooShort}<p class="note" role="status">{text(DAY_ONE_LINES.short)}</p>
	{:else if micProblem === 'blocked'}<p class="note" role="status">{isFa ? 'میکروفون بسته است. در تنظیمات سایت اجازه بده، یا بنویس.' : 'Your microphone is blocked. Allow it in site settings, or type instead.'}</p>
	{:else if micProblem === 'unsupported'}<p class="note" role="status">{isFa ? 'این مرورگر نمی‌تواند گوش بدهد. بنویس.' : 'This browser can’t listen. Type instead.'}</p>
	{:else if micProblem === 'none'}<p class="note" role="status">{isFa ? 'صدایی نشنیدم. دوباره امتحان کن.' : 'I didn’t hear anything. Try again.'}</p>{/if}
{/snippet}

{#if readOnly}
	<section class="log" aria-label={isFa ? 'خوشامد میرا' : 'Mira’s greeting'}>
		{#if ready}
			<p class="who"><span class="avatar small" aria-hidden="true">M</span> Mira</p>
			<p class="line small-line" lang={lineLang} dir={lineDir}>{text(opening)}</p>
			{#if answer}<p class="you" lang="en" dir="ltr">“{answer}”</p>{/if}
			{#if reply}<p class="line small-line" lang={lineLang} dir={lineDir}>{text(reply)}</p>{/if}
		{/if}
	</section>
{:else}
	<section class="screen" aria-labelledby="coach-step">
		<div class="top">
			<span class="avatar" aria-hidden="true">M</span>
			<p class="name">Mira <small>{isFa ? 'مربی انگلیسی تو' : 'your English coach'}</small></p>
			{#if isFa}<button class="toggle" type="button" aria-pressed={showFa} onclick={() => (showFa = !showFa)}>{showFa ? 'انگلیسی' : 'ترجمه'}</button>{/if}
		</div>

		<div class="middle" aria-live="polite">
			<h2 id="coach-step" class="sr-only" tabindex="-1" bind:this={heading}>{isFa ? 'میرا' : 'Mira'}</h2>
			{#if !ready || (thinking && (step === 'speak' ? !answer : !reply))}
				<div class="dots" role="status" aria-label={isFa ? 'میرا در حال نوشتن است' : 'Mira is typing'}><span></span><span></span><span></span></div>
			{:else if step === 'hello'}
				{@render mira(opening)}
			{:else if step === 'speak'}
				{#if mode === 'first'}
					<p class="ask">{text(DAY_ONE_LINES.ask)}</p>
					<p class="target" lang="en" dir="ltr">“{target}”</p>
				{:else}
					{@render mira(opening)}
				{/if}
				<div class="speak">{@render speakArea()}</div>
			{:else if mode === 'first'}
				{#if answer}<p class="heard"><span>{typed ? (isFa ? 'نوشتی' : 'You wrote') : (isFa ? 'شنیدم' : 'I heard')}</span> <bdi lang="en">“{answer}”</bdi></p>{/if}
				{@render mira(typed ? DAY_ONE_LINES.typed : DAY_ONE_LINES.heard, false)}
			{:else if mode === 'returning'}
				{#if answer}<p class="heard"><bdi lang="en">“{answer}”</bdi></p>{/if}
				{#if reply}{@render mira(reply)}{/if}
			{:else}
				{@render mira(opening)}
			{/if}
		</div>

		<div class="bottom">
			{#if ready && step === 'hello'}
				<button class="primary" type="button" onclick={() => (mode === 'first' ? go('speak') : finish())}>{isFa ? 'بعدی' : 'Next'} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button>
			{:else if ready && step === 'speak'}
				{#if !typing && (micProblem === null || micProblem === 'none')}<button class="text" type="button" onclick={() => (typing = true)}>{isFa ? 'به‌جایش بنویس' : 'Type instead'}</button>{/if}
				<button class="text" type="button" onclick={skip}>{isFa ? 'رد شو' : 'Skip'}</button>
			{:else if ready && step === 'result' && !thinking}
				<button class="primary" type="button" onclick={finish}>{isFa ? 'بعدی' : 'Next'} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button>
			{/if}
		</div>
	</section>
{/if}

<style>
	.screen { display: grid; grid-template-rows: auto 1fr auto; min-height: calc(100dvh - 150px); gap: 16px; padding-top: 16px; }
	.top { display: flex; align-items: center; gap: 10px; }
	.avatar { display: grid; place-items: center; inline-size: 44px; block-size: 44px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; font-size: 1.2rem; flex: none; }
	.avatar.small { inline-size: 28px; block-size: 28px; font-size: .9rem; display: inline-grid; }
	.name { margin: 0; display: grid; font-weight: 700; line-height: 1.2; }
	.name small { color: var(--ink-soft); font-weight: 400; font-size: .82rem; }
	.toggle { margin-inline-start: auto; min-height: 40px; padding: 6px 14px; border: 1px solid var(--control-border); border-radius: 999px; background: var(--control); color: var(--ink); font: inherit; font-size: .85rem; cursor: pointer; }
	.middle { display: grid; align-content: center; justify-items: center; gap: 22px; text-align: center; }
	.mira-line { display: grid; justify-items: center; gap: 16px; }
	.line { margin: 0; font-family: var(--font-display); font-size: clamp(1.45rem, 6vw, 1.9rem); line-height: 1.35; color: var(--ink); }
	.hear { display: grid; place-items: center; inline-size: 52px; block-size: 52px; border: 1.5px solid var(--accent); border-radius: 50%; background: var(--paper-raised); color: var(--accent-deep); font-size: 1.1rem; cursor: pointer; }
	.ask { margin: 0; color: var(--ink-soft); font-size: 1.05rem; }
	.target { margin: 0; font-family: var(--font-display); font-size: clamp(1.4rem, 6vw, 1.8rem); line-height: 1.35; color: var(--accent-deep); }
	.speak { display: grid; justify-items: center; gap: 10px; margin-top: 8px; inline-size: 100%; }
	.mic { display: grid; place-items: center; inline-size: 84px; block-size: 84px; border: 0; border-radius: 50%; background: var(--accent); color: var(--on-accent); box-shadow: 0 6px 18px rgb(0 0 0 / .15); cursor: pointer; }
	.mic.on { background: var(--attention); animation: pulse 1.4s infinite; }
	@keyframes pulse { 50% { box-shadow: 0 0 0 12px rgb(156 63 38 / .15); } }
	.mic-label { margin: 0; color: var(--ink-soft); font-size: .92rem; }
	.type { display: flex; gap: 8px; inline-size: 100%; max-inline-size: 420px; }
	.type input { flex: 1; min-width: 0; min-height: 52px; padding: 10px 14px; border: 1px solid var(--control-border); border-radius: 14px; background: var(--control); color: var(--ink); font: inherit; }
	.send { min-height: 52px; padding: 10px 18px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-weight: 600; cursor: pointer; }
	.heard { margin: 0; color: var(--ink-soft); font-size: 1.05rem; }
	.heard span { display: block; font-size: .85rem; margin-bottom: 4px; }
	.note { margin: 0; color: var(--ink-soft); font-size: .92rem; max-inline-size: 360px; }
	.bottom { display: grid; justify-items: center; gap: 4px; padding-bottom: calc(8px + env(safe-area-inset-bottom)); }
	.primary { display: flex; align-items: center; justify-content: center; gap: 12px; inline-size: 100%; max-inline-size: 520px; min-height: 54px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	.text { min-height: 44px; padding: 8px 16px; background: none; border: 0; color: var(--ink-soft); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.dots { display: inline-flex; gap: 6px; }
	.dots span { inline-size: 10px; block-size: 10px; border-radius: 50%; background: var(--ink-soft); animation: blink 1.2s infinite ease-in-out; }
	.dots span:nth-child(2) { animation-delay: .2s; }
	.dots span:nth-child(3) { animation-delay: .4s; }
	@keyframes blink { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }
	.log { display: grid; gap: 10px; padding: 16px; margin: 8px 0 18px; border: 1px solid var(--line); border-radius: 16px; background: var(--paper-raised); }
	.who { margin: 0; display: flex; align-items: center; gap: 8px; font-weight: 700; }
	.small-line { font-size: 1.1rem; }
	.you { margin: 0; color: var(--accent-deep); }
	button:disabled { opacity: .55; cursor: default; }
	button:focus-visible, input:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	h2:focus { outline: none; }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	@media (prefers-reduced-motion: reduce) { .dots span, .mic.on { animation: none; } }
</style>
