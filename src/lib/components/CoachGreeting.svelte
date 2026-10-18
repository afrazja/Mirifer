<script lang="ts">
	/**
	 * Mira's greeting at the start of Today, one focused screen at a time, and she
	 * speaks on her own (no play buttons; the text is on screen too):
	 *
	 *   hello (her line, once, with the name) -> mic check (say one sentence, or
	 *   skip) -> "your mic works" -> today's plan.
	 *
	 * A day with a check-in (Day 2 on): her hello links back to the story so far,
	 * then she asks one casual question that the learner answers freely (that is
	 * the mic check), she replies to what they said (AI, with a scripted line if
	 * it is slow or unavailable), then today's plan.
	 *
	 * The day's greeting is kept in this browser, so a reload doesn't run it
	 * twice. `readOnly` shows what happened, for looking back from a module.
	 */
	import { onDestroy, onMount } from 'svelte';
	import { playAudioPromise, stopAllAudio } from '$services/tts';
	import {
		COACH_RATE, COACH_VOICE, MIRA_LINES, checkInHello, daysSince, greetingMode, isMicAttempt, loadGreeting, localDate, micSentence, opening as helloLine,
		saveGreeting, type GreetingMode, type GreetingRecord
	} from '$lib/practice/coach';
	import type { EnglishProfile } from '$lib/practice/english-profile';
	import type { EnglishProgress } from '$lib/practice/english-progress';
	import type { DisplayText } from '$lib/practice/hotel';
	import type { DayCheckIn } from '$lib/practice/day';

	let { isFa = false, name, profile, progress, dayId = 'day-1', checkIn, readOnly = false, onDone }: {
		isFa?: boolean; name: string; profile: EnglishProfile; progress: EnglishProgress;
		/** Today's day, so a greeting kept from another day isn't shown again. */
		dayId?: string;
		/** The day's check-in (Day 2 on); without it, the first-session welcome or a plain hello. */
		checkIn?: DayCheckIn;
		/** Not used here (the check-in carries its own question); kept so callers stay simple. */
		question?: string;
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
	/** hello: Mira's line. mic: say the sentence, or answer her question (or skip). result: what she heard, and her reply. */
	type Step = 'hello' | 'mic' | 'result';
	/** How long to wait for Mira's AI reply before her scripted one. */
	const REPLY_WAIT_MS = 8_000;

	let ready = $state(false);
	let mode = $state<GreetingMode>('first');
	let step = $state<Step>('hello');
	let opening = $state<DisplayText>({ en: '', fa: '' });
	let answer = $state(''), typed = $state(false), tooShort = $state(false), nudged = $state(false);
	let typing = $state(false), draft = $state('');
	let listening = $state(false), micProblem = $state<'blocked' | 'unsupported' | 'none' | null>(null);
	/** Check-in days: Mira's reply to the answer (null while she is "typing"), and one small fix for the recap. */
	let reply = $state<DisplayText | null>(null);
	let feedback = { improved: null as string | null, noteEn: null as string | null, noteFa: null as string | null };
	let recognition: Recognition | null = null;
	let stopTimer: ReturnType<typeof setTimeout> | undefined;
	let replying: AbortController | null = null;
	let heading: HTMLElement | undefined = $state();
	/** Mira's lines show in the interface language only; her voice is always English. */
	const persian = (value: DisplayText) => isFa && !!value.fa && value.fa !== value.en;
	const text = (value: DisplayText) => (persian(value) ? value.fa : value.en);
	const langOf = (value: DisplayText) => (persian(value) ? 'fa' : 'en');
	const dirOf = (value: DisplayText) => (persian(value) ? 'rtl' : 'ltr');
	const target = $derived(micSentence(mode === 'first', profile.reason));
	const done = $derived(typed ? MIRA_LINES.typed : MIRA_LINES.heard);
	/** The focused heading names the step, so a screen reader hears where it is. */
	const stepName = $derived<DisplayText>(
		step === 'hello' ? { en: 'Mira: hello', fa: 'میرا: سلام' }
			: step === 'mic' ? (checkIn ? { en: 'Mira: a question for you', fa: 'میرا: یک سؤال از تو' } : { en: 'Mira: mic check', fa: 'میرا: امتحان میکروفون' })
			: checkIn ? { en: 'Mira: her reply', fa: 'میرا: جواب میرا' } : { en: 'Mira: your mic', fa: 'میرا: نتیجه' }
	);

	onMount(() => {
		const now = new Date();
		mode = greetingMode(progress, now);
		const saved = loadGreeting(localDate(now), dayId);
		if (saved && saved.mode === mode) {
			opening = saved.opening; answer = saved.answer ?? ''; typed = saved.typed;
			reply = saved.reply; feedback = { improved: saved.improved, noteEn: saved.noteEn, noteFa: saved.noteFa };
			step = saved.done || (checkIn && saved.reply) ? 'result' : 'hello';
		} else {
			const days = daysSince(progress.lastCompletedAt, now);
			opening = checkIn ? checkInHello(mode, name, days, checkIn.story) : helloLine(mode, name, days);
		}
		ready = true;
		// Mira speaks on her own. Phones may block sound that no tap started; her words are on screen anyway.
		if (!readOnly && step === 'hello') say(opening.en);
	});
	onDestroy(() => { clearTimeout(stopTimer); recognition?.abort(); replying?.abort(); stopAllAudio(); });

	function say(line: string) { stopAllAudio(); void playAudioPromise(line, COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {}); }
	function save(finished: boolean) {
		const record: GreetingRecord = {
			date: localDate(new Date()), day: dayId, mode, opening, answer: answer || null, typed,
			reply: checkIn ? reply : answer ? done : null, done: finished, ...feedback
		};
		saveGreeting(record);
	}
	function go(next: Step) { stopAllAudio(); step = next; queueMicrotask(() => heading?.focus()); }
	/** Next on Mira's hello: the tap lets her speak the mic check, or ask her question. */
	function toMic() { go('mic'); say(checkIn ? checkIn.question.en : `${MIRA_LINES.ask.en} ${target}`); }
	function finish() { replying?.abort(); replying = null; stopAllAudio(); save(true); onDone?.(); }
	function skip() { answer = ''; reply = null; finish(); }

	/** Takes what the learner said or typed. */
	function take(value: string, wasTyped: boolean) {
		const said = value.trim().slice(0, 300);
		if (!said) return;
		// Too short: Mira asks once for a little more (a full sentence is the practice); after that any answer is fine.
		if (!isMicAttempt(said) && !(checkIn && nudged)) { tooShort = true; nudged = true; return; }
		tooShort = false; typed = wasTyped; answer = said;
		if (!checkIn) { save(false); go('result'); say(done.en); return; }
		reply = null; go('result'); void replyTo(said);
	}

	/** Mira's reply to the learner's answer: the AI's, or her scripted line if it fails or takes too long. */
	async function replyTo(said: string) {
		if (!checkIn) return;
		const controller = new AbortController(); replying = controller;
		const timer = setTimeout(() => controller.abort(), REPLY_WAIT_MS);
		let line: DisplayText = checkIn.reply;
		try {
			const response = await fetch('/api/english/greeting', {
				method: 'POST', headers: { 'content-type': 'application/json' }, signal: controller.signal,
				body: JSON.stringify({ kind: 'reply', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', opening: checkIn.question.en, answer: said, day: dayId })
			});
			if (response.ok) {
				const data = await response.json() as { line?: string; lineFa?: string | null; improved?: string | null; noteEn?: string | null; noteFa?: string | null };
				if (typeof data.line === 'string' && data.line.trim()) {
					line = { en: data.line.trim(), fa: data.lineFa?.trim() || '' };
					feedback = { improved: data.improved ?? null, noteEn: data.noteEn ?? null, noteFa: data.noteFa ?? null };
				}
			}
		} catch { /* her scripted line */ }
		clearTimeout(timer);
		// Gone on (Next or Skip) while waiting: nothing to show.
		if (replying !== controller) return;
		replying = null; reply = line; save(false); say(line.en);
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
		// A free answer can take longer than one given sentence.
		try { current.start(); listening = true; stopTimer = setTimeout(() => current.stop(), checkIn ? 20_000 : 10_000); }
		catch { micProblem = 'blocked'; typing = true; }
	}
	function sendTyped() { take(draft, true); draft = ''; }
</script>

{#snippet mira(line: DisplayText)}
	<p class="line" lang={langOf(line)} dir={dirOf(line)}>{text(line)}</p>
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
	{#if tooShort}<p class="note" role="status">{text(checkIn ? MIRA_LINES.more : MIRA_LINES.short)}</p>
	{:else if micProblem === 'blocked'}<p class="note" role="status">{isFa ? 'میکروفون بسته است. در تنظیمات سایت اجازه بده، یا بنویس.' : 'Your microphone is blocked. Allow it in site settings, or type instead.'}</p>
	{:else if micProblem === 'unsupported'}<p class="note" role="status">{isFa ? 'این مرورگر نمی‌تواند گوش بدهد. بنویس.' : 'This browser can’t listen. Type instead.'}</p>
	{:else if micProblem === 'none'}<p class="note" role="status">{isFa ? 'صدایی نشنیدم. دوباره امتحان کن.' : 'I didn’t hear anything. Try again.'}</p>{/if}
{/snippet}

{#if readOnly}
	<section class="log" aria-label={isFa ? 'خوشامد میرا' : 'Mira’s greeting'}>
		{#if ready}
			<p class="who"><span class="avatar small" aria-hidden="true">M</span> Mira</p>
			<p class="line small-line" lang={langOf(opening)} dir={dirOf(opening)}>{text(opening)}</p>
			{#if checkIn}<p class="line small-line" lang={langOf(checkIn.question)} dir={dirOf(checkIn.question)}>{text(checkIn.question)}</p>{/if}
			{#if answer}<p class="you" lang="en" dir="ltr">“{answer}”</p>{/if}
			{#if checkIn && reply}<p class="line small-line" lang={langOf(reply)} dir={dirOf(reply)}>{text(reply)}</p>{/if}
		{/if}
	</section>
{:else}
	<section class="screen" aria-labelledby="coach-step">
		<div class="top">
			<span class="avatar" aria-hidden="true">M</span>
			<p class="name">{isFa ? 'میرا' : 'Mira'} <small>{isFa ? 'مربی انگلیسی تو' : 'your English coach'}</small></p>
		</div>

		<div class="middle">
			<h2 id="coach-step" class="sr-only" tabindex="-1" bind:this={heading}>{isFa ? stepName.fa : stepName.en}</h2>
			{#if !ready}
				<div class="dots" role="status" aria-label={isFa ? 'یک لحظه' : 'One moment'}><span></span><span></span><span></span></div>
			{:else if step === 'hello'}
				{@render mira(opening)}
			{:else if step === 'mic' && checkIn}
				{@render mira(checkIn.question)}
				<p class="ask">{text(MIRA_LINES.answerHint)}</p>
				<div class="speak">{@render speakArea()}</div>
			{:else if step === 'mic'}
				<p class="ask">{text(MIRA_LINES.ask)}</p>
				<p class="target" lang="en" dir="ltr">“{target}”</p>
				<div class="speak">{@render speakArea()}</div>
			{:else}
				{#if answer}<p class="heard"><span>{typed ? (isFa ? 'نوشتی' : 'You wrote') : (isFa ? 'شنیدم' : 'I heard')}</span> <bdi lang="en">“{answer}”</bdi></p>{/if}
				{#if !checkIn}{@render mira(done)}
				{:else if reply}{@render mira(reply)}
				{:else if answer}<div class="dots" role="status" aria-label={isFa ? 'میرا دارد جواب می‌دهد' : 'Mira is replying'}><span></span><span></span><span></span></div>
				{:else}{@render mira(MIRA_LINES.skipped)}{/if}
			{/if}
		</div>

		<div class="bottom">
			{#if ready && step === 'hello'}
				<button class="primary" type="button" onclick={toMic}>{isFa ? 'بعدی' : 'Next'} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button>
			{:else if ready && step === 'mic'}
				{#if !typing && (micProblem === null || micProblem === 'none')}<button class="text" type="button" onclick={() => { stopAllAudio(); typing = true; }}>{isFa ? 'به‌جای گفتن، بنویس' : 'Type instead'}</button>{/if}
				<button class="text" type="button" onclick={skip}>{isFa ? 'فعلاً نه' : 'Skip'}</button>
			{:else if ready && step === 'result'}
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
	.middle { display: grid; align-content: center; justify-items: center; gap: 22px; text-align: center; }
	.line { margin: 0; font-family: var(--font-display); font-size: clamp(1.45rem, 6vw, 1.9rem); line-height: 1.35; color: var(--ink); }
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
