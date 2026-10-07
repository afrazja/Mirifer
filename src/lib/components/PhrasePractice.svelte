<script lang="ts">
	/**
	 * "Natural phrases" (docs/english-shadowing-spec.md, owner-approved v2, without the
	 * story link for now). Five sentences, one screen each: Mira says it, the learner says
	 * it after her, hears themself, and sees whether the chunk was caught. No score and no
	 * accent judgement; recordings stay in memory and are never stored.
	 */
	import { onDestroy, onMount } from 'svelte';
	import { playAudioPromise, stopAllAudio, ttsIsPlaying } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { MAX_CLIP_SECONDS, MAX_TRIES, PHRASES, caught, emptyPhraseRecord, shownParts, tipParts, type PhraseRecord } from '$lib/practice/phrases';

	let { isFa = false, initial = null, onSave, onFocus, onStep, onDone }: {
		isFa?: boolean;
		/** What was saved earlier today (reload). */
		initial?: PhraseRecord | null;
		onSave?: (record: PhraseRecord) => void;
		/** Mira's introduction shows in full on the start screen only. */
		onFocus?: (intro: 'full' | 'compact' | 'hidden') => void;
		/** Which sentence is on screen (0-based), or null on the start screen. */
		onStep?: (index: number | null) => void;
		onDone: (score: undefined, record: PhraseRecord) => void;
	} = $props();

	type Stage = 'listen' | 'recording' | 'result';
	// svelte-ignore state_referenced_locally
	let record = $state<PhraseRecord>(initial ?? emptyPhraseRecord());
	// svelte-ignore state_referenced_locally
	let stage = $state<Stage>('listen');
	let micOff = $state(false), check = $state<'checking' | 'caught' | 'missed' | 'failed' | null>(null);
	let elapsed = $state(0), clipUrl = $state<string | null>(null), selfPlaying = $state(false);
	let recorder: MediaRecorder | null = null, stream: MediaStream | null = null, chunks: Blob[] = [];
	let startedAt = 0, timer: ReturnType<typeof setInterval> | undefined, discard = false, self: HTMLAudioElement | null = null;
	const playing = $derived($ttsIsPlaying);
	const phrase = $derived(PHRASES[record.index]);
	const item = $derived(record.items[record.index]);
	const last = $derived(record.index === PHRASES.length - 1);
	const T = (en: string, fa: string) => (isFa ? fa : en);

	$effect(() => { onFocus?.('hidden'); });
	$effect(() => { onStep?.(record.index); });
	onMount(() => {
		// The first sentence is started by the page, from the Next tap on Mira's instruction:
		// starting it here, after the tap, is blocked on phones. After a reload it waits for a tap.
		const onHidden = () => { if (document.hidden && recorder?.state === 'recording') { discard = true; recorder.stop(); } };
		document.addEventListener('visibilitychange', onHidden);
		return () => document.removeEventListener('visibilitychange', onHidden);
	});
	onDestroy(() => { clearInterval(timer); if (recorder?.state === 'recording') { discard = true; recorder.stop(); } stream?.getTracks().forEach(t => t.stop()); stopSelf(); stopAllAudio(); dropClip(); });

	function persist() { onSave?.($state.snapshot(record)); }
	/** Mira says the sentence. Called inside a tap, so phones allow the sound. */
	function say(rate = COACH_RATE) { stopSelf(); stopAllAudio(); void playAudioPromise(phrase.sentence, rate, 'en-US', undefined, COACH_VOICE).catch(() => {}); }
	function stopSelf() { self?.pause(); self = null; selfPlaying = false; }
	function dropClip() { if (clipUrl) URL.revokeObjectURL(clipUrl); clipUrl = null; }

	async function startRecording() {
		stopAllAudio(); stopSelf(); // Mira's voice must never end up in the recording
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { micOff = true; return; }
		try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
		catch { micOff = true; return; }
		const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
		recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64_000 });
		chunks = []; discard = false;
		recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
		recorder.onstop = finishRecording;
		recorder.start();
		startedAt = performance.now(); elapsed = 0; stage = 'recording';
		timer = setInterval(() => {
			elapsed = Math.min(MAX_CLIP_SECONDS, (performance.now() - startedAt) / 1000);
			if (elapsed >= MAX_CLIP_SECONDS && recorder?.state === 'recording') recorder.stop();
		}, 200);
	}
	const stopRecording = () => { if (recorder?.state === 'recording') recorder.stop(); };

	function finishRecording() {
		clearInterval(timer);
		stream?.getTracks().forEach(track => track.stop()); stream = null;
		// Left the page mid-recording: start this sentence over; it doesn't count as a try.
		if (discard) { stage = 'listen'; return; }
		const blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' });
		dropClip(); clipUrl = URL.createObjectURL(blob);
		const index = record.index;
		record.items[index] = { ...record.items[index], tries: record.items[index].tries + 1 };
		persist();
		stage = 'result';
		void checkClip(blob, index, Math.min(MAX_CLIP_SECONDS, Math.round((performance.now() - startedAt) / 1000)));
	}

	async function checkClip(blob: Blob, index: number, seconds: number) {
		check = 'checking';
		const body = new FormData();
		body.set('audio', blob, 'clip'); body.set('seconds', String(seconds));
		let transcript: string | null = null;
		const controller = new AbortController();
		const wait = setTimeout(() => controller.abort(), 15_000);
		try {
			const response = await fetch('/api/english/phrases', { method: 'POST', body, signal: controller.signal });
			const data = response.ok ? await response.json() : null;
			transcript = typeof data?.transcript === 'string' ? data.transcript : null;
		} catch { transcript = null; }
		finally { clearTimeout(wait); }
		if (record.index !== index) return; // the learner already moved on
		if (transcript === null) { check = 'failed'; return; }
		const got = caught(PHRASES[index], transcript);
		check = got ? 'caught' : 'missed';
		// The best try counts.
		record.items[index] = { ...record.items[index], caught: got || record.items[index].caught === true };
		persist();
	}

	function hearSelf() {
		if (!clipUrl) return;
		if (selfPlaying) { stopSelf(); return; }
		stopAllAudio();
		self = new Audio(clipUrl); selfPlaying = true;
		self.onended = () => (selfPlaying = false);
		void self.play().catch(() => (selfPlaying = false));
	}

	function tryAgain() { stopSelf(); check = null; stage = 'listen'; }

	function next() {
		stopSelf(); dropClip(); check = null;
		if (last) {
			stopAllAudio();
			record = { ...record, done: true }; persist();
			onDone(undefined, $state.snapshot(record));
			return;
		}
		record = { ...record, index: record.index + 1 }; persist();
		stage = 'listen'; say();
	}
</script>

{#snippet bottom(label: string, action: () => void, mic = false)}
	<div class="bar">
		<button class="primary" type="button" onclick={action}>
			{#if mic}<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0M12 17v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>{/if}
			{label}
		</button>
	</div>
{/snippet}

<section class="phrases" aria-live="polite">
		<p class="situation">{isFa ? phrase.situation.fa : phrase.situation.en}</p>
		<p class="sentence" lang="en" dir="ltr">{#each shownParts(phrase.shown) as part}{#if part.tie}<span class="tie" aria-hidden="true"></span>{:else if part.bold}<strong>{part.text}</strong>{:else}{part.text}{/if}{/each}</p>
		<p class="tip">{#each tipParts(isFa ? phrase.tip.fa : phrase.tip.en) as part}{#if part.english}<bdi class="en" lang="en" dir="ltr">{part.text}</bdi>{:else}{part.text}{/if}{/each}</p>
		{#if stage !== 'recording'}
			<p class="row">
				<button class="link" type="button" onclick={() => (playing ? stopAllAudio() : say())}><span aria-hidden="true">{playing ? '■' : '▶'}</span> {T('Again', 'دوباره')}</button>
				<span aria-hidden="true">·</span>
				<button class="link" type="button" onclick={() => say(COACH_RATE * 0.85)}>{T('Slower', 'آهسته‌تر')}</button>
			</p>
		{/if}

		{#if stage === 'listen'}
			{#if micOff}
				<p class="note">{T('Your mic is off: say it aloud, then tap Next.', 'میکروفون در دسترس نیست؛ جمله را بلند بگو و بعد «بعدی» را بزن.')}</p>
				{@render bottom(last ? T('Finish', 'تمام') : T('Next', 'بعدی'), next)}
			{:else}
				{@render bottom(T('Your turn', 'نوبت تو'), startRecording, true)}
			{/if}

		{:else if stage === 'recording'}
			<p class="recording" role="timer"><span class="dot" aria-hidden="true"></span>{T(`Recording… ${Math.floor(elapsed)}s`, `در حال ضبط… ${Math.floor(elapsed).toLocaleString('fa-IR')} ثانیه`)}</p>
			{@render bottom(T('Stop', 'پایان ضبط'), stopRecording)}

		{:else if stage === 'result'}
			<div class="result">
				{#if clipUrl}<button class="link" type="button" onclick={hearSelf}><span aria-hidden="true">{selfPlaying ? '■' : '▶'}</span> {T('Hear yourself', 'صدای خودت را بشنو')}</button>{/if}
				<p class="check" role="status">
					{#if check === 'checking'}{T('Checking…', 'در حال بررسی…')}
					{:else if check === 'caught'}<span class="ok">✓ {T('Got it', 'شنیدم')}</span>
					{:else if check === 'missed'}{#if isFa}«<bdi class="en" lang="en" dir="ltr">{phrase.chunk}</bdi>» را نشنیدم. اگر خواستی دوباره امتحان کن.{:else}I didn’t catch: <bdi class="en" lang="en" dir="ltr">{phrase.chunk}</bdi>. Try again if you like.{/if}
					{:else if check === 'failed'}{T('I couldn’t check this one.', 'نتوانستم این یکی را بررسی کنم.')}{/if}
				</p>
				{#if item.tries < MAX_TRIES}<button class="link" type="button" onclick={tryAgain}>{T('Try again', 'دوباره امتحان کن')}</button>{/if}
			</div>
			{@render bottom(last ? T('Finish', 'تمام') : T('Next', 'بعدی'), next)}
		{/if}
</section>

<style>
	.phrases { display: grid; gap: 12px; padding-bottom: 96px; }
	.situation { margin: 0; color: var(--ink-soft); font-size: .95rem; }
	.sentence { margin: 4px 0 0; font-family: var(--font-display); font-size: clamp(1.45rem, 6.4vw, 1.9rem); line-height: 1.35; text-align: left; }
	.sentence strong { color: var(--accent-deep); }
	.tip { margin: 0; color: var(--ink-soft); line-height: 1.6; }
	.en { font-style: italic; white-space: nowrap; }
	.row { display: flex; align-items: center; gap: 10px; margin: 0; color: var(--ink-soft); }
	.link { min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.note { margin: 8px 0 0; padding: 12px 14px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); }
	.recording { display: flex; align-items: center; gap: 10px; margin: 8px 0 0; font-weight: 600; }
	.dot { inline-size: 12px; block-size: 12px; border-radius: 50%; background: var(--attention); animation: pulse 1.2s infinite ease-in-out; }
	@keyframes pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
	.result { display: grid; justify-items: start; gap: 4px; margin-top: 4px; padding-top: 10px; border-top: 1px solid var(--line); }
	.check { margin: 0; line-height: 1.6; }
	.ok { color: var(--leaf); font-weight: 700; }
	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 20; padding: 12px 20px calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 35%); }
	.primary { display: flex; align-items: center; justify-content: center; gap: 8px; inline-size: 100%; max-inline-size: 680px; margin-inline: auto; min-height: 54px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	@media (prefers-reduced-motion: reduce) { .dot { animation: none; } }
	.tie { display: inline-block; inline-size: .42em; block-size: .32em; margin-inline: .04em; border-block-end: 2px solid var(--accent); border-radius: 0 0 50% 50% / 0 0 100% 100%; vertical-align: -.08em; }
</style>
