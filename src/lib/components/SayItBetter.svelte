<script lang="ts">
	/**
	 * "Say it again, better" (docs/english-say-it-better-spec.md, owner-approved).
	 * One focused screen at a time: task -> recording (1 minute) -> Mira listens ->
	 * what you said -> one fix per screen -> better version -> second try -> what changed.
	 * Progress is kept in this browser as it happens, so a reload never pays for a
	 * second AI call; the audio itself is never stored.
	 */
	import { onDestroy, onMount } from 'svelte';
	import { playAudioPromise, stopAllAudio, ttsIsPlaying } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { MAX_SECONDS, MIN_SECONDS, clampSeconds, fixUse, scoreFor, type Feedback, type SayRecord } from '$lib/practice/say-better';
	import type { DisplayText } from '$lib/practice/hotel';

	let { isFa = false, initial = null, onSave, onFocus, onDone }: {
		isFa?: boolean;
		/** What was saved earlier today (reload). */
		initial?: SayRecord | null;
		onSave?: (record: SayRecord) => void;
		/** true once the task screen is left, so Mira's long intro can fold away. */
		/** How much of Mira's introduction the page shows: all of it on the task, one line while recording, none once the answer is in. */
		onFocus?: (intro: 'full' | 'compact' | 'hidden') => void;
		onDone: (score: { correct: number; total: number } | undefined, record: SayRecord) => void;
	} = $props();

	type Stage = 'task' | 'recording' | 'interrupted' | 'short' | 'denied' | 'processing' | 'failed' | 'heard' | 'fix' | 'better' | 'retry' | 'result';
	let stage = $state<Stage>('task');
	let attempt = $state<1 | 2>(1);
	// svelte-ignore state_referenced_locally
	let record = $state<SayRecord>(initial ?? { transcript1: null, seconds1: 0, feedback: null, transcript2: null, seconds2: 0, uses: [], done: false });
	let fixIndex = $state(0), showIdeas = $state(false);
	let elapsed = $state(0), stageNote = $state<'transcribing' | 'thinking'>('transcribing');
	let failedAt = $state<'transcribe' | 'feedback'>('transcribe'), failures = $state(0);
	let recorder: MediaRecorder | null = null, stream: MediaStream | null = null, chunks: Blob[] = [];
	let blob: Blob | null = null, startedAt = 0, timer: ReturnType<typeof setInterval> | undefined, interrupted = false;
	const playing = $derived($ttsIsPlaying);
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const reason = (why: DisplayText) => (isFa ? why.fa : why.en);
	const feedback = $derived(record.feedback);

	onMount(() => {
		if (record.done) stage = 'result';
		else if (record.transcript2 !== null) stage = 'result';
		else if (record.feedback) stage = 'heard';
		else if (record.transcript1) { stage = 'processing'; void getFeedback(); }
		document.addEventListener('visibilitychange', onHidden);
		return () => document.removeEventListener('visibilitychange', onHidden);
	});
	onDestroy(() => { clearInterval(timer); recorder?.state === 'recording' && recorder.stop(); stream?.getTracks().forEach(t => t.stop()); stopAllAudio(); });
	// Once hidden it stays hidden: showing it again would replay Mira's intro, even over the second recording.
	$effect(() => { onFocus?.(stage === 'task' ? 'full' : attempt === 1 && ['recording', 'short', 'interrupted', 'denied'].includes(stage) ? 'compact' : 'hidden'); });

	function persist() { onSave?.($state.snapshot(record)); }
	function onHidden() { if (document.hidden && recorder?.state === 'recording') { interrupted = true; recorder.stop(); } }

	async function startRecording() {
		stopAllAudio(); // Mira's voice must never end up in the recording
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { stage = 'denied'; return; }
		try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
		catch { stage = 'denied'; return; }
		const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
		recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64_000 });
		chunks = []; interrupted = false; blob = null;
		recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
		recorder.onstop = finishRecording;
		recorder.start();
		// The minute starts only now, after the microphone was allowed.
		startedAt = performance.now(); elapsed = 0; stage = 'recording';
		timer = setInterval(() => {
			elapsed = Math.min(MAX_SECONDS, (performance.now() - startedAt) / 1000);
			if (elapsed >= MAX_SECONDS && recorder?.state === 'recording') recorder.stop();
		}, 200);
	}
	const stopRecording = () => { if (recorder?.state === 'recording') recorder.stop(); };

	function finishRecording() {
		clearInterval(timer);
		stream?.getTracks().forEach(track => track.stop()); stream = null;
		const seconds = clampSeconds((performance.now() - startedAt) / 1000);
		blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' });
		elapsed = seconds;
		if (seconds < MIN_SECONDS) { stage = interrupted ? 'interrupted' : 'short'; return; }
		if (interrupted) { stage = 'interrupted'; return; }
		void send();
	}

	async function send() {
		if (!blob) return;
		stage = 'processing'; stageNote = 'transcribing';
		const body = new FormData();
		body.set('audio', blob, 'speech'); body.set('seconds', String(clampSeconds(elapsed)));
		let transcript: string | null = null;
		try {
			const response = await fetch('/api/english/say-better', { method: 'POST', body });
			const data = response.ok ? await response.json() : null;
			transcript = typeof data?.transcript === 'string' ? data.transcript : null;
		} catch { transcript = null; }
		if (transcript === null) { failedAt = 'transcribe'; stage = 'failed'; return; }
		blob = null; failures = 0;
		if (attempt === 1) {
			record = { ...record, transcript1: transcript, seconds1: clampSeconds(elapsed), feedback: null };
			persist();
			await getFeedback();
		} else {
			const uses = (record.feedback?.fixes ?? []).map(fix => fixUse(fix, transcript!));
			record = { ...record, transcript2: transcript, seconds2: clampSeconds(elapsed), uses };
			persist(); stage = 'result';
		}
	}

	async function getFeedback() {
		stage = 'processing'; stageNote = 'thinking';
		const controller = new AbortController();
		const wait = setTimeout(() => controller.abort(), 20_000);
		let result: Feedback | null = null;
		try {
			const response = await fetch('/api/english/say-better', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'feedback', transcript: record.transcript1 }), signal: controller.signal });
			result = response.ok ? await response.json() : null;
		} catch { result = null; }
		finally { clearTimeout(wait); }
		if (!result || !Array.isArray(result.fixes)) { failedAt = 'feedback'; failures += 1; stage = 'failed'; return; }
		record = { ...record, feedback: result }; persist();
		fixIndex = 0; stage = 'heard';
	}
	const retry = () => (failedAt === 'transcribe' ? send() : getFeedback());

	function recordAgain() { blob = null; stage = attempt === 1 ? 'task' : 'retry'; }
	function tryAgainFromStart() { attempt = 1; record = { ...record, transcript1: null, feedback: null }; persist(); stage = 'task'; }
	function toSecondTry() { stopAllAudio(); attempt = 2; stage = 'retry'; }

	function finish() {
		stopAllAudio();
		record = { ...record, done: true }; persist();
		onDone(record.feedback ? scoreFor(record.feedback, record.uses) : undefined, $state.snapshot(record));
	}
	function hear(text: string) { if (playing) stopAllAudio(); else void playAudioPromise(text, COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {}); }

	/** The transcript split into plain parts and the parts a fix points at. */
	function marked(transcript: string, originals: string[]): { text: string; mark: boolean }[] {
		const lower = transcript.toLowerCase(), spans: [number, number][] = [];
		for (const original of originals) {
			const at = lower.indexOf(original.toLowerCase());
			if (at >= 0) spans.push([at, at + original.length]);
		}
		spans.sort((a, b) => a[0] - b[0]);
		const parts: { text: string; mark: boolean }[] = [];
		let cursor = 0;
		for (const [from, to] of spans) {
			if (from < cursor) continue;
			if (from > cursor) parts.push({ text: transcript.slice(cursor, from), mark: false });
			parts.push({ text: transcript.slice(from, to), mark: true }); cursor = to;
		}
		if (cursor < transcript.length) parts.push({ text: transcript.slice(cursor), mark: false });
		return parts;
	}

	const remaining = $derived(Math.max(0, MAX_SECONDS - elapsed));
	const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
	const resultLine = $derived.by(() => {
		const fixes = record.feedback?.fixes ?? [];
		const used = fixes.find((_, i) => record.uses[i] === 'used');
		if (used) return T(`You fixed “${used.better}” this time.`, `این بار «${used.better}» را درست گفتی.`);
		if (record.uses.includes('missed')) return T('Good effort. Keep these in mind next time.', 'تلاش خوبی بود. دفعهٔ بعد این‌ها را در نظر داشته باش.');
		return T('Nice second try.', 'تلاش دوم خوبی بود.');
	});
</script>

{#snippet bottom(label: string, action: () => void, disabled = false)}
	<div class="bar"><button class="primary" type="button" onclick={action} {disabled}>{label}</button></div>
{/snippet}

<section class="say" aria-live="polite">
	{#if stage === 'task' || stage === 'retry'}
		{#if stage === 'retry' && feedback?.fixes.length}
			<p class="lead">{T('Tell it again in your own words. Try to use these:', 'دوباره با کلمات خودت تعریف کن. سعی کن از این‌ها استفاده کنی:')}</p>
			<ul class="chips">{#each feedback.fixes as fix}<li lang="en" dir="ltr">{fix.better}</li>{/each}</ul>
		{:else if stage === 'retry'}
			<p class="lead">{T('Tell it once more, in your own words.', 'یک بار دیگر با کلمات خودت تعریف کن.')}</p>
		{:else}
			<button class="link" type="button" onclick={() => (showIdeas = !showIdeas)} aria-expanded={showIdeas}>{T('Need ideas?', 'ایده می‌خواهی؟')}</button>
			{#if showIdeas}<ul class="ideas" lang="en" dir="ltr"><li>Where were you?</li><li>What went wrong?</li><li>What did you do?</li></ul>{/if}
		{/if}
		<div class="center">
			<button class="mic" type="button" onclick={startRecording} aria-label={T('Start recording (one minute)', 'شروع ضبط (یک دقیقه)')}>
				<svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0M12 17v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
			</button>
			<p class="hint">{T('Tap to start · 1 minute', 'بزن تا شروع شود · ۱ دقیقه')}</p>
		</div>

	{:else if stage === 'recording'}
		<div class="center">
			<div class="ring" class:late={elapsed >= 50} style:--p={`${(elapsed / MAX_SECONDS) * 360}deg`} role="timer" aria-label={T(`${Math.ceil(remaining)} seconds left`, `${Math.ceil(remaining)} ثانیه مانده`)}>
				<span class="time">{clock(elapsed)}</span>
			</div>
			<p class="hint">{T('Recording… it stops by itself at 1:00', 'در حال ضبط… در ۱:۰۰ خودش تمام می‌شود')}</p>
		</div>
		{@render bottom(T('Stop', 'تمام'), stopRecording)}

	{:else if stage === 'short'}
		<p class="lead">{T('That was very short. Try to say a bit more.', 'خیلی کوتاه بود. سعی کن کمی بیشتر بگویی.')}</p>
		{@render bottom(T('Record again', 'دوباره ضبط کن'), recordAgain)}

	{:else if stage === 'interrupted'}
		<p class="lead">{T('The recording stopped when you left the page.', 'وقتی از صفحه بیرون رفتی، ضبط متوقف شد.')}</p>
		{#if elapsed >= MIN_SECONDS}<button class="link" type="button" onclick={send}>{T('Send what you have', 'همین را بفرست')}</button>{/if}
		{@render bottom(T('Record again', 'دوباره ضبط کن'), recordAgain)}

	{:else if stage === 'denied'}
		<p class="lead">{T('Mira can’t hear you: the microphone is blocked. Allow it in your browser’s site settings, then try again.', 'میرا صدایت را نمی‌شنود: میکروفون بسته است. در تنظیمات سایتِ مرورگر اجازه‌اش را بده و دوباره امتحان کن.')}</p>
		{@render bottom(T('Try again', 'دوباره امتحان کن'), recordAgain)}

	{:else if stage === 'processing'}
		<div class="center">
			<div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>
			<p class="hint" role="status">{stageNote === 'transcribing' ? T('Mira is listening…', 'میرا دارد گوش می‌دهد…') : T('Here’s what I heard. Mira is thinking…', 'این را شنیدم. میرا دارد فکر می‌کند…')}</p>
			{#if stageNote === 'thinking' && record.transcript1}<p class="said" lang="en" dir="ltr">“{record.transcript1}”</p>{/if}
		</div>

	{:else if stage === 'failed'}
		<p class="lead">{failedAt === 'transcribe' ? T('I couldn’t hear that clearly. Check your connection and try again.', 'نتوانستم واضح بشنوم. اینترنت را بررسی کن و دوباره امتحان کن.') : T('I couldn’t check that one.', 'نتوانستم آن را بررسی کنم.')}</p>
		{#if failedAt === 'feedback' && failures >= 2}<button class="link" type="button" onclick={finish}>{T('Continue without feedback', 'بدون بازخورد ادامه بده')}</button>{/if}
		{@render bottom(T('Try again', 'دوباره امتحان کن'), retry)}

	{:else if stage === 'heard' && feedback}
		{#if feedback.case === 'more'}
			<p class="lead">{T('Tell me a bit more: what happened, and what did you do?', 'کمی بیشتر بگو: چه اتفاقی افتاد و چه کار کردی؟')}</p>
			{#if record.transcript1}<p class="said" lang="en" dir="ltr">“{record.transcript1}”</p>{/if}
			{@render bottom(T('Record again', 'دوباره ضبط کن'), tryAgainFromStart)}
		{:else}
			{#if feedback.praise}<p class="praise">{isFa ? feedback.praise.fa : feedback.praise.en}</p>{/if}
			{#if feedback.case === 'strong'}<p class="praise">{T('That was clear and natural. Well done.', 'روشن و طبیعی بود. آفرین.')}</p>{/if}
			<p class="label">{T('What you said', 'چیزی که گفتی')}</p>
			<p class="said" lang="en" dir="ltr">{#each marked(record.transcript1 ?? '', feedback.fixes.map(f => f.original)) as part}{#if part.mark}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}</p>
			{#if feedback.case === 'strong'}
				<button class="link" type="button" onclick={toSecondTry}>{T('Say it again anyway', 'باز هم بگو')}</button>
				{@render bottom(T('Next', 'بعدی'), finish)}
			{:else}
				{@render bottom(T(`See ${feedback.fixes.length === 1 ? 'the fix' : 'the fixes'}`, 'دیدن اصلاح‌ها'), () => { fixIndex = 0; stage = 'fix'; })}
			{/if}
		{/if}

	{:else if stage === 'fix' && feedback}
		{@const fix = feedback.fixes[fixIndex]}
		<p class="label">{T(`Fix ${fixIndex + 1} of ${feedback.fixes.length}`, `اصلاح ${(fixIndex + 1).toLocaleString('fa-IR')} از ${feedback.fixes.length.toLocaleString('fa-IR')}`)}</p>
		<p class="was" lang="en" dir="ltr"><s>{fix.original}</s></p>
		<p class="now" lang="en" dir="ltr">{fix.better}</p>
		<button class="hear" type="button" onclick={() => hear(fix.better)} aria-label={T('Hear it', 'بشنو')}><span aria-hidden="true">{playing ? '■' : '▶'}</span></button>
		<p class="why">{reason(fix.why)}</p>
		{@render bottom(fixIndex + 1 < feedback.fixes.length ? T('Next fix', 'اصلاح بعدی') : T('See the better version', 'دیدن نسخهٔ بهتر'), () => (fixIndex + 1 < feedback.fixes.length ? (fixIndex += 1) : (stage = 'better')))}

	{:else if stage === 'better' && feedback?.better}
		<p class="label">{T('Your story, a bit better', 'داستانت، کمی بهتر')}</p>
		<p class="said better" lang="en" dir="ltr">{feedback.better}</p>
		<button class="hear" type="button" onclick={() => hear(feedback.better ?? '')} aria-label={T('Hear Mira read it', 'بشنو که میرا می‌خواندش')}><span aria-hidden="true">{playing ? '■' : '▶'}</span></button>
		{@render bottom(T('Try again', 'دوباره امتحان کن'), toSecondTry)}

	{:else if stage === 'result'}
		<p class="praise">{resultLine}</p>
		{#if feedback?.fixes.length}
			<ul class="uses">
				{#each feedback.fixes as fix, i}
					{#if record.uses[i] === 'used'}<li class="ok"><span aria-hidden="true">✓</span> <bdi lang="en">{fix.better}</bdi></li>
					{:else if record.uses[i] === 'missed'}<li>{T('Next time try:', 'دفعهٔ بعد امتحان کن:')} <bdi lang="en">{fix.better}</bdi></li>{/if}
				{/each}
			</ul>
		{/if}
		{#if record.seconds2 > record.seconds1}<p class="hint">{T(`You spoke for ${record.seconds2} seconds (before: ${record.seconds1}).`, `${record.seconds2.toLocaleString('fa-IR')} ثانیه صحبت کردی (قبلاً: ${record.seconds1.toLocaleString('fa-IR')}).`)}</p>{/if}
		{@render bottom(T('Next', 'بعدی'), finish)}
	{/if}
</section>

<style>
	.say { display: grid; gap: 14px; padding-bottom: 96px; }
	.lead { margin: 0; font-size: 1.1rem; line-height: 1.55; }
	.label { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	.said { margin: 0; padding: 14px 16px; border-radius: 14px; background: var(--paper-raised); border: 1px solid var(--line); line-height: 1.7; text-align: left; }
	.said.better { border-color: var(--accent); }
	mark { background: color-mix(in srgb, var(--attention) 18%, transparent); color: inherit; border-radius: 4px; padding: 0 2px; }
	.praise { margin: 0; font-size: 1.08rem; line-height: 1.55; color: var(--accent-deep); font-weight: 600; }
	.was { margin: 0; color: var(--ink-soft); font-size: 1.1rem; text-align: left; }
	.now { margin: 0; font-family: var(--font-display); font-size: clamp(1.4rem, 6vw, 1.8rem); color: var(--accent-deep); text-align: left; }
	.why { margin: 0; color: var(--ink-soft); line-height: 1.6; }
	.chips { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
	.chips li { padding: 8px 14px; border-radius: 999px; background: var(--accent-wash); color: var(--accent-deep); font-weight: 600; }
	.ideas { margin: 0; padding-inline-start: 20px; color: var(--ink-soft); line-height: 1.8; text-align: left; }
	.uses { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
	.uses li { padding: 12px 14px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); }
	.uses li.ok { border-color: var(--leaf); background: var(--leaf-wash); }
	.center { display: grid; justify-items: center; gap: 12px; margin-top: 18px; text-align: center; }
	.hint { margin: 0; color: var(--ink-soft); }
	.mic { display: grid; place-items: center; inline-size: 92px; block-size: 92px; border: 0; border-radius: 50%; background: var(--accent); color: var(--on-accent); box-shadow: 0 6px 18px rgb(0 0 0 / .15); cursor: pointer; }
	.ring { --p: 0deg; display: grid; place-items: center; inline-size: 168px; block-size: 168px; border-radius: 50%; background: conic-gradient(var(--accent) var(--p), var(--paper-sunken) 0); }
	.ring.late { background: conic-gradient(var(--attention) var(--p), var(--paper-sunken) 0); }
	.ring::before { content: ''; grid-area: 1 / 1; inline-size: 140px; block-size: 140px; border-radius: 50%; background: var(--paper); }
	.time { grid-area: 1 / 1; z-index: 1; font-family: var(--font-display); font-size: 2.4rem; font-variant-numeric: tabular-nums; }
	.hear { justify-self: start; display: grid; place-items: center; inline-size: 48px; block-size: 48px; border: 1.5px solid var(--accent); border-radius: 50%; background: var(--paper-raised); color: var(--accent-deep); cursor: pointer; }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 20; padding: 12px 20px calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 35%); }
	.primary { display: flex; align-items: center; justify-content: center; inline-size: 100%; max-inline-size: 680px; margin-inline: auto; min-height: 54px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	.dots { display: inline-flex; gap: 6px; }
	.dots span { inline-size: 10px; block-size: 10px; border-radius: 50%; background: var(--ink-soft); animation: blink 1.2s infinite ease-in-out; }
	.dots span:nth-child(2) { animation-delay: .2s; }
	.dots span:nth-child(3) { animation-delay: .4s; }
	@keyframes blink { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	@media (prefers-reduced-motion: reduce) { .dots span { animation: none; } }
</style>
