<script lang="ts">
	import { onMount } from 'svelte';
	import { stopAllAudio } from '$services/tts';

	type SpeechResultItem = ArrayLike<{ transcript: string }> & { isFinal: boolean };
	type SpeechResult = { results: ArrayLike<SpeechResultItem> };
	type SpeechError = { error: string };
	type Recognition = {
		lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number;
		onresult: ((event: SpeechResult) => void) | null;
		onerror: ((event: SpeechError) => void) | null;
		onend: (() => void) | null;
		start(): void; stop(): void; abort(): void;
	};
	type RecognitionConstructor = new () => Recognition;
	let { isFa = false, disabled = false, onTranscript }: {
		isFa?: boolean; disabled?: boolean; onTranscript: (value: string) => void;
	} = $props();
	let supported = $state(false), listening = $state(false), message = $state('');
	let Constructor: RecognitionConstructor | null = null;
	let recognition: Recognition | null = null;
	let disposed = false;
	let pauseTimer: ReturnType<typeof setTimeout> | undefined;
	let maxTimer: ReturnType<typeof setTimeout> | undefined;
	function clearTimers() { clearTimeout(pauseTimer); clearTimeout(maxTimer); }

	onMount(() => {
		const browser = window as Window & { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
		Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition ?? null;
		supported = !!Constructor;
		return () => { disposed = true; clearTimers(); recognition?.abort(); recognition = null; };
	});

	function recordAnswer() {
		if (listening) { recognition?.stop(); return; }
		if (!Constructor || disabled) return;
		stopAllAudio(); // don't record Jamie's voice
		message = '';
		const current = new Constructor();
		let heardText = '', failed = false;
		current.lang = 'en-US'; current.continuous = true; current.interimResults = true; current.maxAlternatives = 1;
		current.onresult = event => {
			if (disposed || recognition !== current) return;
			const final: string[] = [];
			let interim = '';
			for (let index = 0; index < event.results.length; index++) {
				const item = event.results[index];
				const words = item?.[0]?.transcript?.trim();
				if (!words) continue;
				if (item.isFinal) final.push(words); else interim = words;
			}
			heardText = [...final, interim].filter(Boolean).join(' ');
			clearTimeout(pauseTimer);
			pauseTimer = setTimeout(() => current.stop(), 2_000);
		};
		current.onerror = event => {
			if (disposed || recognition !== current) return;
			failed = true;
			message = event.error === 'not-allowed' || event.error === 'service-not-allowed'
				? (isFa ? 'اجازهٔ میکروفون داده نشد. می‌توانی پاسخ را بنویسی.' : 'Microphone permission was declined. You can type your reply.')
				: (isFa ? 'صدا تشخیص داده نشد. دوباره تلاش کن یا پاسخ را بنویس.' : 'We could not hear a reply. Try again or type it.');
		};
		current.onend = () => {
			if (recognition !== current) return;
			clearTimers();
			recognition = null; listening = false;
			if (failed) return;
			const answer = heardText.trim();
			if (answer.length > 300) message = isFa ? 'پاسخ خیلی بلند بود. پاسخ کوتاه‌تری بگو یا بنویس.' : 'That reply was too long. Say or type a shorter answer.';
			else if (answer) { onTranscript(answer); message = isFa ? 'متن شنیده‌شده را بررسی کن و بعد ارسال کن.' : 'Check the words we heard, then send your reply.'; }
			else message = isFa ? 'پاسخی شنیده نشد. دوباره تلاش کن یا آن را بنویس.' : 'No reply was heard. Try again or type it.';
		};
		recognition = current;
		try {
			current.start(); listening = true;
			pauseTimer = setTimeout(() => current.stop(), 8_000);
			maxTimer = setTimeout(() => current.stop(), 30_000);
		} catch { clearTimers(); recognition = null; message = isFa ? 'میکروفون در دسترس نیست. می‌توانی پاسخ را بنویسی.' : 'The microphone is unavailable. You can type your reply.'; }
	}
</script>

<div class="speech-input">
	{#if supported}
		<button type="button" class:active={listening} onclick={recordAnswer} disabled={disabled} aria-pressed={listening}>
			<span aria-hidden="true">{listening ? '■' : '●'}</span>
			{listening ? (isFa ? 'توقف ضبط' : 'Stop recording') : (isFa ? 'ضبط پاسخ' : 'Record answer')}
		</button>
		<span class="hint">{isFa ? 'گفتارت به متن تبدیل می‌شود؛ پیش از ارسال آن را بررسی کن.' : 'Your browser turns speech into text. Review it before sending.'}</span>
	{:else}
		<span class="hint">{isFa ? 'پاسخ صوتی در این مرورگر در دسترس نیست؛ پاسخ را بنویس.' : 'Voice answers are unavailable in this browser; type your reply.'}</span>
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
