<script lang="ts">
	import { onMount } from 'svelte';
	let { isFa = false }: { isFa?: boolean } = $props();
	let recording = $state(false), requesting = $state(false), playback = $state(''), message = $state('');
	let recorder: MediaRecorder | null = null, stream: MediaStream | null = null;
	let panel: HTMLDetailsElement | undefined = $state();
	let timer: ReturnType<typeof setTimeout> | undefined;
	let disposed = false;
	onMount(() => {
		return () => {
			disposed = true; stop();
			if (playback) URL.revokeObjectURL(playback);
		};
	});
	function stop() {
		clearTimeout(timer);
		if (recorder && recorder.state !== 'inactive') recorder.stop();
		stream?.getTracks().forEach(track => track.stop()); stream = null;
		recording = false;
	}
	async function record() {
		if (recording) { stop(); return; }
		message = ''; requesting = true;
		try {
			if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('unsupported');
			window.speechSynthesis?.cancel();
			const acquired = await navigator.mediaDevices.getUserMedia({ audio: true });
			if (disposed || !panel?.open) { acquired.getTracks().forEach(track => track.stop()); return; }
			stream = acquired;
			if (playback) { URL.revokeObjectURL(playback); playback = ''; }
			recorder = new MediaRecorder(stream);
			const chunks: Blob[] = [];
			recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
			recorder.onstop = () => {
				if (!disposed && chunks.length) playback = URL.createObjectURL(new Blob(chunks, { type: chunks[0].type }));
			};
			recorder.onerror = () => { stop(); message = isFa ? 'ضبط انجام نشد. می‌توانی پاسخ را تایپ کنی.' : 'Recording failed. You can type your reply.'; };
			recorder.start(); recording = true; timer = setTimeout(stop, 45_000);
		} catch {
			stop(); message = isFa ? 'میکروفون در دسترس نیست یا اجازه داده نشد. می‌توانی پاسخ را تایپ کنی.' : 'The microphone is unavailable or permission was declined. You can type your reply.';
		} finally { requesting = false; }
	}
</script>

<details class="voice-tools" bind:this={panel} ontoggle={e => { if (!e.currentTarget.open) stop(); }}>
	<summary>{isFa ? 'ضبط و بازشنیدن صدای خودت (اختیاری)' : 'Record and replay your voice (optional)'}</summary>
	<p>{isFa ? 'این فایل فقط برای تمرین خودت است و به‌عنوان پاسخ ارسال نمی‌شود. برای گفتن پاسخ، از «ضبط پاسخ» در بالا استفاده کن. صدا از این صفحه خارج نمی‌شود.' : 'This clip is for your own practice and is not sent as an answer. Use “Record answer” above to speak into the reply box. The clip stays on this page.'}</p>
	<div class="tools">
		<button type="button" onclick={record} disabled={requesting}>{requesting ? (isFa ? 'در انتظار میکروفون…' : 'Opening microphone…') : recording ? (isFa ? 'توقف ضبط' : 'Stop recording') : (isFa ? 'ضبط برای تمرین' : 'Record practice clip')}</button>
	</div>
	{#if recording}<p role="status">{isFa ? 'در حال ضبط… حداکثر ۴۵ ثانیه.' : 'Recording… up to 45 seconds.'}</p>{/if}
	{#if playback}<audio controls src={playback} aria-label={isFa ? 'پخش پاسخ ضبط‌شدهٔ تو' : 'Listen to your recorded reply'}></audio>{/if}
	{#if message}<p role="status">{message}</p>{/if}
</details>

<style>
	.voice-tools { border-top: 1px solid var(--line); padding-block: 16px; color: var(--ink-soft); }
	summary { cursor: pointer; color: var(--accent-deep); font-weight: 600; }
	p { margin-block: 12px; font-size: .85rem; line-height: 1.6; }
	.tools { display: flex; flex-wrap: wrap; gap: 8px; }
	button { padding: 10px 12px; min-height: 44px; border: 1px solid var(--control-border); border-radius: 8px; background: var(--paper-raised); color: var(--ink); cursor: pointer; }
	button:focus-visible, summary:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	button:disabled { opacity: .6; }
	audio { width: 100%; margin-top: 12px; }
</style>
