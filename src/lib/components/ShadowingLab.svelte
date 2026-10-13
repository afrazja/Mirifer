<script lang="ts">
	/**
	 * "Shadowing", Module lab (docs/english-shadowing-lab-spec.md, owner-approved v2).
	 * Eight sentences, audio only. Each plays at most twice (a play counts only when the audio
	 * really starts, and is saved then); then the learner says or types exactly what they heard,
	 * and the words are checked in code. Recordings are never stored.
	 */
	import { onDestroy, onMount } from 'svelte';
	import { playAudioPromise, playAudioUrl, stopAllAudio, ttsUrl } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { SILENT_BELOW, measureLevel, type MicLevel } from '$utils/mic-level';
	import {
		ANSWER_MAX_SECONDS, ANSWER_MIN_SECONDS, MAX_PLAYS, PATTERN_LINE, SENTENCES, VOICE,
		caught, checkAnswer, emptyShadowRecord, hardest, patternOf, referenceWords, type ShadowRecord
	} from '$lib/practice/shadowing-lab';

	let { isFa = false, initial = null, first = false, onSave, onDone, onLater }: {
		isFa?: boolean;
		initial?: ShadowRecord | null;
		first?: boolean;
		onSave?: (record: ShadowRecord) => void;
		onDone: () => void;
		/** "Finish later": progress is kept. */
		onLater: () => void;
	} = $props();

	const INTRO = {
		en: 'You’ll hear eight sentences, with no text. You can play each one twice. Listen, then say exactly what you heard, or type it if you like. Every word counts, even small ones like “the” and “a”.',
		fa: 'هشت جمله می‌شنوی، بدون متن. هر کدام را دو بار می‌توانی پخش کنی. گوش بده، بعد دقیقاً همان را که شنیدی بگو، یا اگر خواستی تایپ کن. هر کلمه حساب می‌شود، حتی کلمه‌های کوچکی مثل «the» و «a».'
	};

	type Status = 'idle' | 'playing' | 'playFailed' | 'recording' | 'listening' | 'failed' | 'silent' | 'interrupted' | 'denied';
	// svelte-ignore state_referenced_locally
	let record = $state<ShadowRecord>(initial ?? emptyShadowRecord());
	let stage = $state<'start' | 'sentence' | 'result'>('start');
	let heard = $state<string | null>(null);
	/** The learner's own recording, kept in memory only, so they can check it was recorded clearly. */
	let myUrl = $state<string | null>(null), myUrlFor = $state(-1), myPlayer: HTMLAudioElement | null = null;
	let status = $state<Status>('idle'), typing = $state(false), typed = $state(''), announce = $state(''), elapsed = $state(0), replaying = $state(false);
	let recorder: MediaRecorder | null = null, stream: MediaStream | null = null, chunks: Blob[] = [], level: MicLevel | null = null;
	let startedAt = 0, timer: ReturnType<typeof setInterval> | undefined, interrupted = false, lastBlob: Blob | null = null, lastSeconds = 0;
	let heading: HTMLElement | undefined = $state(), scoreLine: HTMLElement | undefined = $state();
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const fa = (n: number) => n.toLocaleString('fa-IR');
	const index = $derived(Math.min(record.index, SENTENCES.length - 1));
	const sentence = $derived(SENTENCES[index]);
	const plays = $derived(record.plays[index] ?? 0);
	const left = $derived(MAX_PLAYS - plays);
	const answer = $derived(record.answers[index]);
	const words = $derived(referenceWords(sentence));

	onMount(() => {
		// A reload keeps the plays and returns to the sentence (or its check); nothing plays by itself.
		if (record.done || record.index >= SENTENCES.length) stage = 'result';
		else if (record.plays.some(p => p > 0) || record.answers.some(Boolean)) stage = 'sentence';
		else if (first) void playAudioPromise(INTRO.en.replace(/[’“”]/g, m => (m === '’' ? "'" : '"')), COACH_RATE, 'en-US', undefined, COACH_VOICE);
		document.addEventListener('visibilitychange', onHidden);
		return () => document.removeEventListener('visibilitychange', onHidden);
	});
	onDestroy(() => { myPlayer?.pause(); if (myUrl) URL.revokeObjectURL(myUrl); clearInterval(timer); level?.stop(); if (recorder && recorder.state !== 'inactive') recorder.stop(); stream?.getTracks().forEach(t => t.stop()); });

	function persist() { onSave?.($state.snapshot(record)); }
	function go(next: typeof stage) { stage = next; queueMicrotask(() => heading?.focus()); }
	function onHidden() { if (document.hidden && recorder && recorder.state !== 'inactive') { interrupted = true; recorder.stop(); } }
	const audioOf = (text: string) => ttsUrl(text, 'en-US', 1, VOICE);

	function start() { stopAllAudio(); go('sentence'); }

	/** A play counts the moment audio starts (saved then); a failed or blocked play costs nothing. */
	async function listen() {
		if (left <= 0 || status === 'playing') return;
		stopAllAudio();
		status = 'playing'; announce = '';
		let started = false;
		const at = index;
		const { url, playback } = audioOf(sentence.text);
		const ok = await playAudioUrl(url, 15_000, playback, () => {
			if (started) return;
			started = true;
			const used = [...record.plays]; used[at] = Math.min(MAX_PLAYS, used[at] + 1);
			record = { ...record, plays: used }; persist();
		});
		if (!started || !ok) { status = started ? 'idle' : 'playFailed'; return; }
		status = 'idle';
		// Announced only after the audio ends, so a screen reader never talks over the sentence.
		announce = left > 0 ? T(`${left} play left`, `${fa(left)} بار پخش مانده`) : T('No more plays', 'دیگر پخشی نمانده');
	}
	/** After answering: unlimited, never counted. */
	async function listenAgain(text: string) {
		stopAllAudio(); replaying = true;
		const { url, playback } = audioOf(text);
		await playAudioUrl(url, 15_000, playback);
		replaying = false;
	}

	// Speaking
	async function record1() {
		if (status === 'recording') { recorder?.stop(); return; }
		stopAllAudio();
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { status = 'denied'; return; }
		try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { status = 'denied'; return; }
		const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
		recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64_000 });
		chunks = []; interrupted = false;
		recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
		recorder.onstop = finishRecording;
		const track = stream.getAudioTracks()[0];
		if (track) track.onmute = track.onended = () => { if (recorder && recorder.state !== 'inactive') { interrupted = true; recorder.stop(); } };
		level = measureLevel(stream);
		recorder.start();
		startedAt = performance.now(); elapsed = 0; status = 'recording';
		timer = setInterval(() => {
			elapsed = Math.min(ANSWER_MAX_SECONDS, (performance.now() - startedAt) / 1000);
			if (elapsed >= ANSWER_MAX_SECONDS && recorder?.state === 'recording') recorder.stop();
		}, 200);
	}
	function finishRecording() {
		clearInterval(timer);
		stream?.getTracks().forEach(t => t.stop()); stream = null;
		const peak = level?.peak() ?? 1; level?.stop(); level = null;
		const seconds = (performance.now() - startedAt) / 1000;
		// These are failed attempts: they don't use the answer.
		if (interrupted) { status = 'interrupted'; return; }
		if (seconds < ANSWER_MIN_SECONDS) { status = 'idle'; return; }
		if (peak < SILENT_BELOW) { status = 'silent'; return; }
		lastBlob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' }); lastSeconds = Math.round(seconds);
		void send();
	}
	async function send() {
		if (!lastBlob) return;
		status = 'listening';
		const body = new FormData();
		body.set('audio', lastBlob, 'speech'); body.set('seconds', String(lastSeconds));
		let text: string | null = null;
		try {
			const response = await fetch('/api/english/shadowing', { method: 'POST', body });
			const data = response.ok ? await response.json() : null;
			text = typeof data?.transcript === 'string' ? data.transcript.trim() : null;
		} catch { text = null; }
		if (text === null) { status = 'failed'; return; }
		if (myUrl) URL.revokeObjectURL(myUrl);
		myUrl = URL.createObjectURL(lastBlob); myUrlFor = index;
		lastBlob = null;
		heard = text; status = 'idle';
	}

	// Typing
	const persianTyped = $derived(/[؀-ۿ]/.test(typed));
	function checkTyped() { const text = typed.trim(); if (!text || persianTyped) return; typed = ''; save(text, true); }

	function save(text: string, wasTyped: boolean) {
		const result = checkAnswer(text, sentence, wasTyped);
		const answers = [...record.answers];
		answers[index] = { text, typed: wasTyped, ...result };
		record = { ...record, answers }; persist();
		status = 'idle'; typing = false;
		queueMicrotask(() => scoreLine?.focus());
		// Fetch the next sentence's audio while the check is showing.
		const next = SENTENCES[index + 1];
		if (next) void fetch(audioOf(next.text).url).catch(() => {});
	}
	function hearMine() {
		if (!myUrl) return;
		stopAllAudio(); myPlayer?.pause();
		myPlayer = new Audio(myUrl);
		void myPlayer.play().catch(() => {});
	}
	/** Before anything is revealed: the learner confirms what speech-to-text heard, or types instead. */
	function confirmHeard() { const text = heard; heard = null; if (text) save(text, false); }
	function notWhatISaid() { heard = null; typing = true; status = 'idle'; }
	function nextSentence() {
		stopAllAudio();
		const nextIndex = record.index + 1;
		record = { ...record, index: nextIndex, done: nextIndex >= SENTENCES.length }; persist();
		status = 'idle'; typing = false; announce = '';
		go(nextIndex >= SENTENCES.length ? 'result' : 'sentence');
	}
	function again() { stopAllAudio(); record = emptyShadowRecord(); persist(); go('sentence'); }
	function finish() { stopAllAudio(); onDone(); }
	function later() { stopAllAudio(); if (recorder && recorder.state !== 'inactive') { interrupted = true; recorder.stop(); } onLater(); }

	const remaining = $derived(Math.max(0, ANSWER_MAX_SECONDS - elapsed));
	const percent = $derived(caught(record));
	const pattern = $derived(stage === 'result' ? patternOf(record) : null);
	const worst = $derived(stage === 'result' ? hardest(record) : null);
</script>

{#snippet bottom(label: string, action: () => void, disabled = false)}
	<div class="bar"><button class="primary" type="button" onclick={action} {disabled}>{label}</button></div>
{/snippet}

<section class="sh">
	<h2 class="sr-only" tabindex="-1" bind:this={heading}>{stage === 'sentence' ? T(`Sentence ${index + 1} of ${SENTENCES.length}`, `جملهٔ ${fa(index + 1)} از ${fa(SENTENCES.length)}`) : T('Shadowing', 'تکرار همزمان')}</h2>
	<p class="sr-only" role="status" aria-live="polite">{announce}</p>

	{#if stage === 'start'}
		<div class="brief"><span class="avatar" aria-hidden="true">M</span><p>{isFa ? INTRO.fa : INTRO.en}</p></div>
		{@render bottom(T('Start', 'شروع'), start)}

	{:else if stage === 'sentence'}
		<p class="label" aria-hidden="true">{T(`Sentence ${index + 1} of ${SENTENCES.length}`, `جملهٔ ${fa(index + 1)} از ${fa(SENTENCES.length)}`)}</p>

		{#if !answer}
			<button class="listen" type="button" onclick={listen} disabled={left <= 0 || status === 'playing' || status === 'recording' || status === 'listening'}
				aria-label={left > 0 ? T(`Listen, ${left} ${left === 1 ? 'play' : 'plays'} left`, `گوش بده، ${fa(left)} بار پخش مانده`) : T('No more plays', 'دیگر پخشی نمانده')}>
				<span class="icon" aria-hidden="true">{status === 'playing' ? '♪' : '▶'}</span>
				<span>{status === 'playing' ? T('Playing…', 'در حال پخش…') : left > 0 ? T('Listen', 'گوش بده') : T('No more plays', 'دیگر پخشی نمانده')}</span>
				{#if left > 0 && status !== 'playing'}<small>{T(`${left} ${left === 1 ? 'play' : 'plays'} left`, `${fa(left)} بار پخش مانده`)}</small>{/if}
			</button>
			{#if status === 'playFailed'}<p class="note">{T('Couldn’t play. This didn’t use a play.', 'پخش نشد. این یکی حساب نشد.')}</p>{/if}
			{#if status === 'failed'}<p class="note">{T('I couldn’t hear that clearly. Check your connection and try again. It didn’t use your answer.', 'نتوانستم واضح بشنوم. اینترنت را بررسی کن و دوباره امتحان کن؛ جوابت حساب نشد.')}</p>{/if}
			{#if status === 'silent'}<p class="note">{T('I couldn’t hear anything. Check your microphone, then try again.', 'چیزی نشنیدم. میکروفونت را بررسی کن و دوباره امتحان کن.')}</p>{/if}
			{#if status === 'interrupted'}<p class="note">{T('The recording stopped. Try again when you’re ready.', 'ضبط متوقف شد. هر وقت آماده بودی دوباره امتحان کن.')}</p>{/if}
			{#if status === 'denied'}<p class="note">{T('The microphone is blocked. Allow it in your browser’s site settings, or type your answer.', 'میکروفون بسته است. در تنظیمات سایت اجازه‌اش را بده، یا جوابت را تایپ کن.')}</p>{/if}
			{#if status === 'listening'}<p class="hint" role="status">{T('Checking what you said…', 'دارم بررسی می‌کنم چه گفتی…')}</p>{/if}

			{#if heard !== null}
				<p class="mine">{T('I heard:', 'شنیدم:')} <bdi lang="en" dir="ltr">“{heard}”</bdi></p>
				{#if myUrl}<button class="link" type="button" onclick={hearMine}>▶ {T('Hear my recording', 'صدای ضبط‌شده‌ام را بشنو')}</button>{/if}
				<button class="link quiet" type="button" onclick={notWhatISaid}>{T('That’s not what I said: type it instead', 'این را نگفتم: به‌جایش تایپ کن')}</button>
				{@render bottom(T('Check it', 'بررسی کن'), confirmHeard)}
			{:else if plays > 0}
				{#if typing}
					<form class="typed" onsubmit={event => { event.preventDefault(); checkTyped(); }}>
						<label class="sr-only" for="sh-typed">{T('Type what you heard', 'آنچه شنیدی را تایپ کن')}</label>
						<textarea id="sh-typed" rows="3" lang="en" dir="ltr" autocapitalize="off" autocomplete="off" spellcheck="false" enterkeyhint="done" maxlength="300"
							disabled={status === 'playing'} bind:value={typed} onkeydown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); checkTyped(); } }}></textarea>
						{#if persianTyped}<p class="note">{T('Switch to an English keyboard.', 'صفحه‌کلید را انگلیسی کن.')}</p>{/if}
						{#if status === 'playing'}<p class="hint">{T('You can type when it finishes.', 'وقتی تمام شد می‌توانی تایپ کنی.')}</p>{/if}
					</form>
					<button class="link quiet" type="button" onclick={() => (typing = false)}>{T('Say it instead', 'به‌جایش بگو')}</button>
					{@render bottom(T('Check', 'بررسی'), checkTyped, !typed.trim() || persianTyped || status === 'playing')}
				{:else}
					{#if status !== 'recording' && status !== 'listening'}<button class="link quiet" type="button" onclick={() => (typing = true)}>{T('Type it instead', 'به‌جایش تایپ کن')}</button>{/if}
					{#if status === 'failed'}<button class="link quiet" type="button" onclick={send}>{T('Send it again', 'دوباره بفرست')}</button>{/if}
					<div class="bar"><button class="primary" class:rec={status === 'recording'} type="button" onclick={record1} disabled={status === 'playing' || status === 'listening'}>
						{#if status === 'recording'}<span class="dot" aria-hidden="true"></span>{T('Stop', 'پایان')}{#if remaining <= 5}<span aria-hidden="true">&nbsp;{Math.ceil(remaining)}</span>{/if}
						{:else}<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0M12 17v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>{T('Say it', 'بگو')}{/if}
					</button></div>
				{/if}
			{/if}
			<button class="link quiet later" type="button" onclick={later}>{T('Finish later', 'بعداً تمام می‌کنم')}</button>

		{:else}
			<p class="score" tabindex="-1" bind:this={scoreLine}>{T(`You got ${answer.got} of ${answer.total} words.`, `${fa(answer.got)} از ${fa(answer.total)} کلمه را گرفتی.`)}</p>
			<div class="pair">
				<p class="boxlabel">{answer.typed ? T('You wrote', 'نوشتی') : T('You said', 'گفتی')}</p>
				<p class="yours" lang="en" dir="ltr">{answer.text}</p>
				{#if !answer.typed}<small class="hint">{T('Speech-to-text isn’t perfect.', 'تبدیل گفتار به متن کامل نیست.')}</small>
					<!-- Kept in memory only: after a reload the recording is gone. -->
					{#if myUrl && myUrlFor === index}<button class="link" type="button" onclick={hearMine}>▶ {T('Hear my recording', 'صدای ضبط‌شده‌ام را بشنو')}</button>{/if}{/if}
				<p class="boxlabel">{T('Correct', 'درست')}</p>
				<p class="sentence" lang="en" dir="ltr">{#each words as word, i}{#if answer.matched[i]}{word}{:else}<mark>{word}<span class="sr-only"> (missed)</span></mark>{/if}{i < words.length - 1 ? ' ' : ''}{/each}</p>
			</div>
			<button class="link" type="button" onclick={() => listenAgain(sentence.text)} disabled={replaying}>▶ {T('Listen again', 'دوباره گوش بده')}</button>
			<p class="tip">{isFa ? sentence.tip.fa : sentence.tip.en}</p>
			{@render bottom(index + 1 < SENTENCES.length ? T('Next sentence', 'جملهٔ بعدی') : T('See your result', 'دیدن نتیجه'), nextSentence)}
		{/if}

	{:else if stage === 'result'}
		<p class="label">{T('Your result', 'نتیجهٔ تو')}</p>
		<p class="big">{T(`You caught ${percent}% of the words.`, `${fa(percent)}٪ کلمه‌ها را گرفتی.`)}</p>
		{#if pattern}<p class="tip">{isFa ? PATTERN_LINE[pattern].fa : PATTERN_LINE[pattern].en}</p>{/if}
		{#if worst !== null}
			<p class="hint">{T('Your hardest sentence:', 'سخت‌ترین جمله‌ات:')}</p>
			<p class="sentence" lang="en" dir="ltr">{SENTENCES[worst].text}</p>
			<button class="link" type="button" onclick={() => listenAgain(SENTENCES[worst!].text)} disabled={replaying}>▶ {T('Hear it once more', 'یک بار دیگر بشنو')}</button>
		{/if}
		<button class="link quiet" type="button" onclick={again}>{T('Try the same sentences again', 'همین جمله‌ها را دوباره امتحان کن')}</button>
		{@render bottom(T('Done', 'تمام'), finish)}
	{/if}
</section>

<style>
	.sh { display: grid; gap: 14px; padding-bottom: 104px; }
	.brief { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.brief p { margin: 0; line-height: 1.55; }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.label { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .label { letter-spacing: normal; }
	.listen { display: grid; justify-items: center; gap: 6px; inline-size: 100%; padding: 28px 16px; border: 2px solid var(--accent); border-radius: 20px; background: var(--paper-raised); color: var(--accent-deep); font: inherit; font-size: 1.15rem; font-weight: 700; cursor: pointer; }
	.listen:disabled { border-color: var(--line); color: var(--ink-soft); cursor: default; }
	.listen .icon { font-size: 2.2rem; line-height: 1; }
	.listen small { font-weight: 600; color: var(--ink-soft); }
	.typed textarea { inline-size: 100%; padding: 12px 14px; border: 1.5px solid var(--line); border-radius: 12px; background: var(--paper-raised); color: var(--ink); font: inherit; line-height: 1.5; resize: none; }
	.typed { display: grid; gap: 6px; }
	.score { margin: 0; font-size: 1.15rem; font-weight: 700; color: var(--accent-deep); }
	.score:focus { outline: none; }
	.sentence { margin: 0; padding: 14px 16px; border-radius: 14px; background: var(--paper-raised); border: 1px solid var(--accent); line-height: 1.8; text-align: left; font-size: 1.05rem; }
	mark { background: color-mix(in srgb, var(--attention) 20%, transparent); color: inherit; text-decoration: underline wavy var(--attention); text-underline-offset: 4px; border-radius: 3px; padding: 0 2px; }
	.pair { display: grid; gap: 6px; }
	.boxlabel { margin: 4px 0 0; font-size: .75rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-soft); }
	:global([dir='rtl']) .boxlabel { letter-spacing: normal; }
	.yours { margin: 0; padding: 12px 16px; border-radius: 14px; background: var(--paper-sunken); line-height: 1.7; text-align: left; font-size: 1.05rem; }
	.tip { margin: 0; line-height: 1.55; }
	.mine { margin: 0; color: var(--ink-soft); line-height: 1.5; }
	.big { margin: 0; font-family: var(--font-display); font-size: clamp(1.5rem, 6.4vw, 1.9rem); color: var(--accent-deep); }
	.note { margin: 0; line-height: 1.5; }
	.hint { margin: 0; color: var(--ink-soft); line-height: 1.5; }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.link.quiet { color: var(--ink-soft); }
	.link:disabled { opacity: .5; cursor: default; }
	.later { margin-top: 8px; }
	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 20; padding: 12px 20px calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 35%); }
	.primary { display: flex; align-items: center; justify-content: center; gap: 10px; inline-size: 100%; max-inline-size: 680px; margin-inline: auto; min-height: 54px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	.primary:disabled { opacity: .5; cursor: default; }
	.primary.rec { background: var(--attention); }
	.dot { inline-size: 12px; block-size: 12px; border-radius: 50%; background: currentColor; animation: pulse 1.2s infinite ease-in-out; }
	@keyframes pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	h2:focus { outline: none; }
	button:focus-visible, textarea:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	@media (prefers-reduced-motion: reduce) { .dot { animation: none; } }
</style>
