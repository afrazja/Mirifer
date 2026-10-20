<script lang="ts">
	/**
	 * The recap's "say it again": the learner hears the better sentence and
	 * says it. Shows what was heard; it is practice, not a test. The recording
	 * goes to our server to be turned into text (/api/english/listen).
	 */
	import { onDestroy, onMount } from 'svelte';
	import { playAudioPromise, stopAllAudio } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { canRecord, startRecording, transcribeClip, type Recording } from '$services/voice-clip';

	let { sentence, isFa = false }: { sentence: string; isFa?: boolean } = $props();
	let heard = $state(''), stage = $state<'idle' | 'opening' | 'recording' | 'checking'>('idle'), unavailable = $state(false), note = $state('');
	let recording: Recording | null = null;
	let checking: AbortController | null = null;
	let destroyed = false;
	const normal = (text: string) => text.toLowerCase().replace(/[^a-z' ]/g, '').replace(/\s+/g, ' ').trim();
	const matched = $derived(!!heard && normal(heard) === normal(sentence));
	const T = (en: string, fa: string) => (isFa ? fa : en);

	onMount(() => { unavailable = !canRecord(); });
	onDestroy(() => { destroyed = true; recording?.cancel(); checking?.abort(); });

	async function listen() {
		if (stage === 'recording') { recording?.stop(); return; }
		if (stage !== 'idle') return;
		stopAllAudio(); // Mira's voice must never end up in the recording
		heard = ''; note = ''; stage = 'opening';
		const started = await startRecording('say-again');
		if (destroyed) { if (typeof started === 'object') started.cancel(); return; }
		if (typeof started !== 'object') { stage = 'idle'; unavailable = true; return; }
		recording = started; stage = 'recording';
		const clip = await started.done;
		recording = null;
		if (destroyed || clip === null) { stage = 'idle'; return; }
		if (clip === 'silent') { stage = 'idle'; note = T('I didn’t hear anything. Try again.', 'صدایی نشنیدم. دوباره امتحان کن.'); return; }
		stage = 'checking';
		const controller = new AbortController(); checking = controller;
		const result = await transcribeClip(clip, 'say-again', controller.signal);
		if (destroyed || checking !== controller) return;
		checking = null; stage = 'idle';
		if ('error' in result || !result.transcript.trim()) { note = T('I couldn’t catch that. Try again.', 'متوجه نشدم. دوباره امتحان کن.'); return; }
		heard = result.transcript.trim();
	}
</script>

<div class="say">
	<button type="button" class="hear" onclick={() => void playAudioPromise(sentence, COACH_RATE, 'en-US', undefined, COACH_VOICE)}><span aria-hidden="true">▶</span> {isFa ? 'بشنو' : 'Hear it'}</button>
	{#if !unavailable}<button type="button" class="mic" class:on={stage === 'recording'} aria-pressed={stage === 'recording'} disabled={stage === 'opening' || stage === 'checking'} onclick={listen}>{stage === 'recording' ? T('Listening… tap to stop', 'گوش می‌دهم… بزن تا تمام شود') : stage === 'checking' ? T('One moment…', 'یک لحظه…') : T('Say it', 'بلند بگو')}</button>{/if}
</div>
{#if note}<p class="heard" role="status">{note}</p>{/if}
{#if heard}<p class="heard" role="status"><span>{isFa ? 'شنیدم:' : 'I heard:'}</span> <bdi lang="en">“{heard}”</bdi>{matched ? (isFa ? ' — دقیقاً همین.' : ' — that’s it.') : ''}</p>{/if}

<style>
	.say { display: flex; flex-wrap: wrap; gap: 8px; }
	button { min-height: 44px; padding: 8px 16px; border-radius: 999px; font: inherit; font-weight: 600; cursor: pointer; }
	.hear { border: 1px solid var(--accent); background: var(--paper-raised); color: var(--accent-deep); }
	.mic { border: 0; background: var(--accent); color: var(--on-accent); }
	.mic.on { background: var(--attention); }
	.mic:disabled { opacity: .7; cursor: default; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
	.heard { margin: 8px 0 0; color: var(--ink-soft); }
</style>
