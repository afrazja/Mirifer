<script lang="ts">
	/**
	 * "60-second free talk", the boss level (docs/english-free-talk-spec.md).
	 * Ready → surprise topic and 3-2-1 → sixty seconds of talk → words and long pauses, against
	 * the learner's earlier runs. Numbers only, no AI judging. The recording is never stored.
	 */
	import { onDestroy, onMount } from 'svelte';
	import { playAudioPromise, stopAllAudio } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { SILENT_BELOW, measureLevel, type MicLevel } from '$utils/mic-level';
	import {
		COUNTDOWN, FULL_RUN_SECONDS, KEEP_RUNS, MIN_VOICED_SECONDS, NUDGE_AFTER, TALK_SECONDS, TOPICS,
		bestWords, countWords, emptyFreeTalk, fullRuns, pausesText, pickTopic, resultLine, usualWords, type FreeTalkRecord, type Run
	} from '$lib/practice/free-talk';

	let { isFa = false, initial = null, first = false, onSave, onDone }: {
		isFa?: boolean;
		initial?: FreeTalkRecord | null;
		/** A fresh visit: Mira says her line as the page opens. */
		first?: boolean;
		onSave?: (record: FreeTalkRecord) => void;
		onDone: () => void;
	} = $props();

	const INTRO = {
		en: 'Final challenge! When you tap Start, you’ll see a surprise topic. Talk about it for one minute and just keep going. Mistakes are fine. Recording starts by itself.',
		fa: 'چالش آخر! وقتی «شروع» را بزنی، یک موضوع غافلگیرکننده می‌بینی. یک دقیقه درباره‌اش حرف بزن و فقط ادامه بده. اشتباه اشکالی ندارد. ضبط خودش شروع می‌شود.'
	};

	type Stage = 'ready' | 'countdown' | 'talk' | 'processing' | 'result' | 'quiet' | 'interrupted' | 'denied' | 'failed';
	// svelte-ignore state_referenced_locally
	let record = $state<FreeTalkRecord>(initial ?? emptyFreeTalk());
	let stage = $state<Stage>('ready');
	let topic = $state(0), count = $state(COUNTDOWN), elapsed = $state(0), nudge = $state(false), showHeard = $state(false);
	let latest = $state<Run | null>(null), previous = $state<Run | null>(null), bestBefore = $state(0), announce = $state(''), nudgeUntil = 0;
	let recorder: MediaRecorder | null = null, stream: MediaStream | null = null, chunks: Blob[] = [], blob: Blob | null = null;
	let level: MicLevel | null = null, pauses = 0, startedAt = 0, timer: ReturnType<typeof setInterval> | undefined, interrupted = false;
	let heading: HTMLElement | undefined = $state(), stopButton: HTMLButtonElement | undefined = $state();
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const fa = (n: number) => n.toLocaleString('fa-IR');
	const best = $derived(bestWords(record.runs));
	const usual = $derived(usualWords(record.runs));

	onMount(() => {
		if (first) void playAudioPromise(INTRO.en.replace(/’/g, "'"), COACH_RATE, 'en-US', undefined, COACH_VOICE);
		document.addEventListener('visibilitychange', onHidden);
		return () => document.removeEventListener('visibilitychange', onHidden);
	});
	onDestroy(() => { clearInterval(timer); level?.stop(); if (recorder && recorder.state !== 'inactive') recorder.stop(); stream?.getTracks().forEach(t => t.stop()); });

	function persist() { onSave?.($state.snapshot(record)); }
	function go(next: Stage) { stage = next; queueMicrotask(() => heading?.focus()); }
	function onHidden() {
		if (!document.hidden) return;
		if (stage === 'countdown') { clearInterval(timer); level?.stop(); level = null; stream?.getTracks().forEach(t => t.stop()); stream = null; go('ready'); return; }
		if (recorder && recorder.state !== 'inactive') { interrupted = true; recorder.stop(); }
	}

	/** The Start tap asks for the microphone; then the topic and 3-2-1; then recording starts by itself. */
	async function start() {
		stopAllAudio();
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { go('denied'); return; }
		// Permission first, so the topic is never visible behind the permission prompt.
		try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { go('denied'); return; }
		// The level meter is made inside this tap (iPhones), and waits until recording starts.
		level?.stop(); level = measureLevel(stream); level.setPaused(true);
		topic = pickTopic(record.lastTopic);
		record = { ...record, lastTopic: topic }; persist();
		count = COUNTDOWN; go('countdown');
		announce = T(`Your topic: ${TOPICS[topic].en}. Recording starts in 3 seconds.`, `موضوع تو: ${TOPICS[topic].fa}. ضبط تا ۳ ثانیهٔ دیگر شروع می‌شود.`);
		timer = setInterval(() => {
			count -= 1;
			if (count <= 0) { clearInterval(timer); startRecording(); }
		}, 1000);
	}
	function startRecording() {
		if (!stream) return;
		const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
		recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64_000 });
		chunks = []; blob = null; interrupted = false; nudge = false;
		recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
		recorder.onstop = finish;
		const track = stream.getAudioTracks()[0];
		if (track) track.onmute = track.onended = () => { if (recorder && recorder.state !== 'inactive') { interrupted = true; recorder.stop(); } };
		level ??= measureLevel(stream);
		level.setPaused(false);
		recorder.start();
		// Nothing is announced while recording: a screen reader's voice would be recorded too.
		startedAt = performance.now(); elapsed = 0; announce = ''; nudgeUntil = 0;
		stage = 'talk';
		queueMicrotask(() => stopButton?.focus());
		timer = setInterval(() => {
			elapsed = Math.min(TALK_SECONDS, (performance.now() - startedAt) / 1000);
			// The hint shows only after they've started talking, and stays a moment so it doesn't flicker.
			const now = performance.now();
			if ((level?.voiced() ?? 0) > 0 && (level?.quietFor() ?? 0) >= NUDGE_AFTER) nudgeUntil = now + 1500;
			nudge = now < nudgeUntil;
			if (elapsed >= TALK_SECONDS && recorder?.state === 'recording') recorder.stop();
		}, 200);
	}
	const stopEarly = () => { if (recorder?.state === 'recording') recorder.stop(); };
	function finish() {
		clearInterval(timer);
		stream?.getTracks().forEach(t => t.stop()); stream = null;
		const peak = level?.peak() ?? 1, voiced = level?.voiced() ?? Infinity;
		pauses = level?.longPauses() ?? 0;
		level?.stop(); level = null;
		blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' });
		elapsed = Math.round(Math.min(TALK_SECONDS, (performance.now() - startedAt) / 1000));
		if (interrupted) { go('interrupted'); return; }
		// Silence never counts as talking, and a near-silent take is never sent.
		if (peak < SILENT_BELOW || voiced < MIN_VOICED_SECONDS) { go('quiet'); return; }
		void send();
	}

	async function send() {
		if (!blob) return;
		go('processing');
		const body = new FormData();
		body.set('audio', blob, 'speech'); body.set('seconds', String(elapsed)); body.set('topic', String(topic));
		let text: string | null = null;
		try {
			const response = await fetch('/api/english/free-talk', { method: 'POST', body });
			const data = response.ok ? await response.json() : null;
			text = typeof data?.transcript === 'string' ? data.transcript.trim() : null;
		} catch { text = null; }
		if (text === null) { go('failed'); return; }
		blob = null;
		const full = fullRuns(record.runs);
		previous = full[full.length - 1] ?? null;
		bestBefore = bestWords(record.runs);
		latest = { topic, words: countWords(text), pauses, seconds: elapsed, at: Date.now(), full: elapsed >= FULL_RUN_SECONDS };
		firstResult = full.length === 0;
		record = { ...record, runs: [...record.runs, latest].slice(-KEEP_RUNS), lastTranscript: text }; persist();
		showHeard = false;
		go('result');
	}
	let firstResult = $state(false), showMeaning = $state(false);
	function finishModule() { stopAllAudio(); onDone(); }
	const line = $derived(latest ? resultLine(latest, previous, bestBefore) : null);
	const remaining = $derived(Math.max(0, TALK_SECONDS - elapsed));
</script>

{#snippet bottom(label: string, action: () => void)}
	<div class="bar"><button class="primary" type="button" onclick={action}>{label}</button></div>
{/snippet}

<section class="ft">
	<h2 class="sr-only" tabindex="-1" bind:this={heading}>{T('60-second free talk', 'صحبت آزاد ۶۰ ثانیه‌ای')}</h2>
	<p class="sr-only" role="status" aria-live="polite">{announce}</p>

	{#if stage === 'ready'}
		<div class="brief"><span class="avatar" aria-hidden="true">M</span><p>{isFa ? INTRO.fa : INTRO.en}</p></div>
		{#if best}<p class="best">{T(`Your best so far: ${best} words.`, `بهترین رکوردت تا حالا: ${fa(best)} کلمه.`)}{#if usual}{' '}{T(`Your usual: about ${usual}.`, `معمولاً: حدود ${fa(usual)}.`)}{/if}</p>{/if}
		{@render bottom(T('Start', 'شروع'), start)}

	{:else if stage === 'countdown' || stage === 'talk'}
		<p class="label">{T('Your topic', 'موضوع تو')}</p>
		<p class="topic" lang="en" dir="ltr">{TOPICS[topic].en}</p>
		{#if isFa}<p class="topic-fa">{TOPICS[topic].fa}</p>{/if}
		{#if stage === 'countdown'}
			<p class="count" aria-hidden="true">{count}</p>
		{:else}
			<div class="center">
				<div class="ring" class:late={remaining <= 10} style:--p={`${(elapsed / TALK_SECONDS) * 360}deg`} role="timer" aria-label={T('Recording, one minute', 'در حال ضبط، یک دقیقه')}>
					<span class="time" aria-hidden="true">{remaining <= 10 ? Math.ceil(remaining) : `0:${String(Math.floor(elapsed)).padStart(2, '0')}`}</span>
				</div>
				<p class="rec" aria-hidden="true"><span class="dot"></span>{T('Recording', 'در حال ضبط')}</p>
				<p class="nudge" class:on={nudge} aria-hidden="true">{T('Keep going! Say why, or give an example.', 'ادامه بده! بگو چرا، یا یک مثال بزن.')}</p>
			</div>
			<div class="bar quietbar"><button class="link quiet" type="button" bind:this={stopButton} onclick={stopEarly}>{T('Stop', 'توقف')}</button></div>
		{/if}

	{:else if stage === 'processing'}
		<div class="center"><div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>
			<p class="hint" role="status">{T('Counting your words…', 'دارم کلمه‌هایت را می‌شمارم…')}</p></div>

	{:else if stage === 'result' && latest}
		<p class="label">{T('Your minute', 'دقیقهٔ تو')}</p>
		{#if latest.full}
			<div class="numbers">
				<div><span class="big">{isFa ? fa(latest.words) : latest.words}</span><span>{T('words', 'کلمه')}</span>
					{#if previous}<small>{T(`${previous.words} last time`, `${fa(previous.words)} دفعهٔ قبل`)}</small>{/if}</div>
				<div><span class="big">{isFa ? fa(latest.pauses) : latest.pauses}</span><span>{T('long pauses (2 s+)', 'مکث طولانی (۲ ثانیه+)')}</span>
					{#if previous}<small>{T(`${previous.pauses} last time`, `${fa(previous.pauses)} دفعهٔ قبل`)}</small>{/if}</div>
			</div>
		{:else}
			<p class="lead">{T(`Stopped at ${latest.seconds} seconds: ${latest.words} words, ${pausesText(latest.pauses).en}.`, `در ${fa(latest.seconds)} ثانیه تمام شد: ${fa(latest.words)} کلمه، ${pausesText(latest.pauses).fa}.`)}</p>
		{/if}
		{#if line}<p class="praise">{isFa ? line.fa : line.en}</p>{/if}
		{#if firstResult || showMeaning}
			<p class="hint">{T('Words: how much you said in one minute. Long pauses: times you stopped for 2 seconds or more. Your grammar isn’t checked, so mistakes don’t lower your score. Some topics are easier than others, so look at your scores over several days, not one run.', 'کلمه‌ها: چقدر در یک دقیقه گفتی. مکث‌های طولانی: دفعه‌هایی که ۲ ثانیه یا بیشتر ساکت ماندی. دستور زبانت بررسی نمی‌شود، پس اشتباه امتیازت را کم نمی‌کند. بعضی موضوع‌ها آسان‌ترند، پس امتیازهایت را در چند روز ببین، نه در یک بار.')}</p>
		{:else}
			<button class="link quiet" type="button" onclick={() => (showMeaning = true)}>{T('What do the numbers mean?', 'این عددها یعنی چه؟')}</button>
		{/if}
		{#if record.lastTranscript}
			<button class="link quiet" type="button" onclick={() => (showHeard = !showHeard)} aria-expanded={showHeard}>{showHeard ? T('Hide what I heard', 'پنهان کردن آنچه شنیدم') : T('What I heard', 'آنچه شنیدم')}</button>
			{#if showHeard}<p class="said" lang="en" dir="ltr">{record.lastTranscript}</p>
				<p class="hint">{T('Speech-to-text isn’t perfect. It may miss or change a few words.', 'تبدیل گفتار به متن کامل نیست؛ ممکن است چند کلمه را جا بیندازد یا عوض کند.')}</p>{/if}
		{/if}
		<button class="link quiet" type="button" onclick={finishModule}>{T('Finish', 'تمام')}</button>
		{@render bottom(T('Another topic', 'موضوع دیگر'), start)}

	{:else if stage === 'quiet'}
		<p class="lead">{T('I couldn’t hear much. Check your microphone, or try a different topic.', 'چیز زیادی نشنیدم. میکروفونت را بررسی کن، یا یک موضوع دیگر را امتحان کن.')}</p>
		{@render bottom(T('Try again', 'دوباره امتحان کن'), start)}

	{:else if stage === 'interrupted'}
		<p class="lead">{T('The recording stopped (you left the page, or the microphone went off).', 'ضبط متوقف شد (از صفحه بیرون رفتی یا میکروفون قطع شد).')}</p>
		{@render bottom(T('Try again', 'دوباره امتحان کن'), start)}

	{:else if stage === 'denied'}
		<p class="lead">{T('Mira can’t hear you: the microphone is blocked. Allow it in your browser’s site settings, then try again.', 'میرا صدایت را نمی‌شنود: میکروفون بسته است. در تنظیمات سایتِ مرورگر اجازه‌اش را بده و دوباره امتحان کن.')}</p>
		{@render bottom(T('Try again', 'دوباره امتحان کن'), start)}

	{:else if stage === 'failed'}
		<p class="lead">{T('I couldn’t hear that clearly. Check your connection and try again.', 'نتوانستم واضح بشنوم. اینترنت را بررسی کن و دوباره امتحان کن.')}</p>
		<button class="link quiet" type="button" onclick={() => go('ready')}>{T('Back', 'برگشت')}</button>
		{@render bottom(T('Try again', 'دوباره امتحان کن'), send)}
	{/if}
</section>

<style>
	.ft { display: grid; gap: 14px; padding-bottom: 104px; }
	.brief { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.brief p { margin: 0; line-height: 1.55; }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.best { margin: 0; font-weight: 600; color: var(--accent-deep); }
	.label { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .label { letter-spacing: normal; }
	.topic { margin: 0; font-family: var(--font-display); font-size: clamp(1.6rem, 7vw, 2.1rem); line-height: 1.25; text-align: left; }
	.topic-fa { margin: 0; color: var(--ink-soft); }
	.count { margin: 18px 0 0; text-align: center; font-family: var(--font-display); font-size: 3rem; color: var(--ink-soft); }
	.center { display: grid; justify-items: center; gap: 10px; margin-top: 12px; text-align: center; }
	.ring { --p: 0deg; display: grid; place-items: center; inline-size: 168px; block-size: 168px; border-radius: 50%; background: conic-gradient(var(--accent) var(--p), var(--paper-sunken) 0); }
	.ring.late { background: conic-gradient(var(--attention) var(--p), var(--paper-sunken) 0); }
	.ring::before { content: ''; grid-area: 1 / 1; inline-size: 140px; block-size: 140px; border-radius: 50%; background: var(--paper); }
	.time { grid-area: 1 / 1; z-index: 1; font-family: var(--font-display); font-size: 2.4rem; font-variant-numeric: tabular-nums; }
	.nudge { margin: 0; min-height: 1.6em; font-weight: 700; color: var(--accent-deep); opacity: 0; transition: opacity .3s; }
	.nudge.on { opacity: 1; }
	.numbers { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
	.numbers small { color: var(--ink-soft); }
	.rec { display: flex; align-items: center; gap: 8px; margin: 0; font-weight: 700; color: var(--attention); }
	.dot { inline-size: 10px; block-size: 10px; border-radius: 50%; background: currentColor; }
	.numbers div { display: grid; justify-items: center; gap: 2px; padding: 16px 8px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.big { font-family: var(--font-display); font-size: 2.6rem; color: var(--accent-deep); font-variant-numeric: tabular-nums; }
	.praise { margin: 0; font-size: 1.05rem; line-height: 1.55; color: var(--accent-deep); font-weight: 600; }
	.said { margin: 0; padding: 12px 14px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); line-height: 1.6; text-align: left; }
	.lead { margin: 0; font-size: 1.08rem; line-height: 1.55; }
	.hint { margin: 0; color: var(--ink-soft); line-height: 1.5; }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.link.quiet { color: var(--ink-soft); }
	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 20; padding: 12px 20px calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 35%); }
	.quietbar { display: flex; justify-content: center; }
	.primary { display: flex; align-items: center; justify-content: center; inline-size: 100%; max-inline-size: 680px; margin-inline: auto; min-height: 54px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	.dots { display: inline-flex; gap: 6px; }
	.dots span { inline-size: 10px; block-size: 10px; border-radius: 50%; background: var(--ink-soft); animation: blink 1.2s infinite ease-in-out; }
	.dots span:nth-child(2) { animation-delay: .2s; }
	.dots span:nth-child(3) { animation-delay: .4s; }
	@keyframes blink { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	h2:focus { outline: none; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	@media (prefers-reduced-motion: reduce) { .dots span { animation: none; } .nudge { transition: none; } }
</style>
