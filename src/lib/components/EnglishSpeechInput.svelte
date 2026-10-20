<script lang="ts">
	/**
	 * The microphone button under a role-play's reply box: records the reply, our server turns it
	 * into text (/api/english/listen), and the text goes into the box to check before sending.
	 */
	import { onMount } from 'svelte';
	import { stopAllAudio } from '$services/tts';
	import { canRecord, startRecording, transcribeClip, type Recording } from '$services/voice-clip';
	import { MAX_REPLY } from '$lib/practice/hotel';

	let { isFa = false, disabled = false, onTranscript }: {
		isFa?: boolean; disabled?: boolean; onTranscript: (value: string) => void;
	} = $props();
	let supported = $state(false), stage = $state<'idle' | 'opening' | 'recording' | 'checking'>('idle'), message = $state('');
	let recording: Recording | null = null;
	let checking: AbortController | null = null;
	let disposed = false, attempt = 0;
	const T = (en: string, fa: string) => (isFa ? fa : en);

	onMount(() => {
		supported = canRecord();
		return () => { disposed = true; drop(); };
	});
	// A reply is being sent: what is still being recorded or checked must not land in the box afterwards.
	$effect(() => { if (disabled) drop(); });

	/** Drops any recording or check under way, including a microphone still waiting for permission. */
	function drop() {
		if (stage === 'idle' && !recording && !checking) return;
		attempt++; recording?.cancel(); recording = null; checking?.abort(); checking = null;
		if (!disposed) stage = 'idle';
	}

	/** Cuts a long reply at a word, to fit the reply box. */
	function fit(answer: string): string {
		if (answer.length <= MAX_REPLY) return answer;
		const cut = answer.slice(0, MAX_REPLY), space = cut.lastIndexOf(' ');
		return (space > MAX_REPLY * 0.6 ? cut.slice(0, space) : cut).trim();
	}

	async function recordAnswer() {
		if (stage === 'recording') { recording?.stop(); return; }
		if (stage !== 'idle' || disabled) return;
		stopAllAudio(); // don't record the other speaker's voice
		const mine = ++attempt;
		message = ''; stage = 'opening';
		const started = await startRecording('role-play');
		if (disposed || mine !== attempt) { if (typeof started === 'object') started.cancel(); return; }
		if (started === 'unsupported') { stage = 'idle'; supported = false; return; }
		if (started === 'blocked') { stage = 'idle'; message = T('Microphone permission was declined. You can type your reply.', 'اجازهٔ میکروفون داده نشد. می‌توانی پاسخ را بنویسی.'); return; }
		recording = started; stage = 'recording';
		const clip = await started.done;
		if (disposed || mine !== attempt) return;
		recording = null;
		if (clip === null) { stage = 'idle'; return; }
		if (clip === 'silent') { stage = 'idle'; message = T('No reply was heard. Try again or type it.', 'پاسخی شنیده نشد. دوباره تلاش کن یا آن را بنویس.'); return; }
		stage = 'checking';
		const controller = new AbortController(); checking = controller;
		const result = await transcribeClip(clip, 'role-play', controller.signal);
		if (disposed || mine !== attempt) return;
		checking = null; stage = 'idle';
		if ('error' in result) {
			message = result.error === 'limit' ? T('You’ve used today’s voice practice. You can type your reply.', 'تمرین صوتی امروز تمام شد. می‌توانی پاسخ را بنویسی.')
				: result.error === 'unavailable' ? T('Speaking isn’t available right now. You can type your reply.', 'گفتن الان در دسترس نیست. می‌توانی پاسخ را بنویسی.')
				: T('We could not turn that into text. Try again or type it.', 'نتوانستیم صدا را به متن تبدیل کنیم. دوباره تلاش کن یا آن را بنویس.');
			return;
		}
		const answer = result.transcript.trim();
		if (!answer) { message = T('No reply was heard. Try again or type it.', 'پاسخی شنیده نشد. دوباره تلاش کن یا آن را بنویس.'); return; }
		const fitted = fit(answer);
		onTranscript(fitted);
		message = fitted.length < answer.length
			? T('That was long, so we kept the first part. Check it, then send your reply.', 'پاسخ بلند بود و بخش اولش را نگه داشتیم. آن را بررسی کن و بعد ارسال کن.')
			: T('Check the words we heard, then send your reply.', 'متن شنیده‌شده را بررسی کن و بعد ارسال کن.');
	}
</script>

<div class="speech-input">
	{#if supported}
		<button type="button" class:active={stage === 'recording'} onclick={recordAnswer} disabled={disabled || stage === 'opening' || stage === 'checking'} aria-pressed={stage === 'recording'}>
			<span aria-hidden="true">{stage === 'recording' ? '■' : '●'}</span>
			{stage === 'recording' ? T('Stop recording', 'توقف ضبط') : stage === 'checking' ? T('Turning it into text…', 'در حال تبدیل به متن…') : stage === 'opening' ? T('Opening microphone…', 'در انتظار میکروفون…') : T('Record answer', 'ضبط پاسخ')}
		</button>
		<span class="hint">{T('Your voice is turned into text. Review it before sending.', 'صدایت به متن تبدیل می‌شود؛ پیش از ارسال آن را بررسی کن.')}</span>
	{:else}
		<span class="hint">{T('Voice answers are unavailable in this browser; type your reply.', 'پاسخ صوتی در این مرورگر در دسترس نیست؛ پاسخ را بنویس.')}</span>
	{/if}
	{#if message}<span class="message" role="status">{message}</span>{/if}
</div>

<style>
	.speech-input { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-top: 10px; }
	button { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 9px 13px; border: 1px solid var(--control-border); border-radius: 9px; background: var(--paper-raised); color: var(--ink); font: inherit; font-size: .88rem; font-weight: 600; cursor: pointer; }
	button.active { border-color: var(--attention); color: var(--attention); }
	button:disabled { opacity: .55; cursor: default; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	.hint, .message { color: var(--ink-soft); font-size: .75rem; line-height: 1.45; }
	.message { flex-basis: 100%; color: var(--accent-deep); }
</style>
