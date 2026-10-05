<script lang="ts">
	/**
	 * The recap's "say it again": the learner hears the better sentence and
	 * says it. Shows what was heard; it is practice, not a test.
	 */
	import { onDestroy } from 'svelte';
	import { playAudioPromise, stopAllAudio } from '$services/tts';
	import { COACH_VOICE } from '$lib/practice/coach';

	let { sentence, isFa = false }: { sentence: string; isFa?: boolean } = $props();
	type Recognition = { lang: string; interimResults: boolean; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start(): void; stop(): void; abort(): void };
	let heard = $state(''), listening = $state(false), unavailable = $state(false);
	let recognition: Recognition | null = null;
	const normal = (text: string) => text.toLowerCase().replace(/[^a-z' ]/g, '').replace(/\s+/g, ' ').trim();
	const matched = $derived(!!heard && normal(heard) === normal(sentence));

	function listen() {
		if (listening) { recognition?.stop(); return; }
		const browser = window as Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
		const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
		if (!Constructor) { unavailable = true; return; }
		stopAllAudio();
		const current = new Constructor();
		current.lang = 'en-US'; current.interimResults = false;
		current.onresult = e => { heard = Array.from(e.results).map(r => r[0]?.transcript ?? '').join(' ').trim(); };
		current.onerror = () => { unavailable = true; };
		current.onend = () => { listening = false; recognition = null; };
		recognition = current; heard = '';
		try { current.start(); listening = true; } catch { unavailable = true; }
	}
	onDestroy(() => recognition?.abort());
</script>

<div class="say">
	<button type="button" class="hear" onclick={() => void playAudioPromise(sentence, 0.9, 'en-US', undefined, COACH_VOICE)}><span aria-hidden="true">▶</span> {isFa ? 'بشنو' : 'Hear it'}</button>
	{#if !unavailable}<button type="button" class="mic" class:on={listening} aria-pressed={listening} onclick={listen}>{listening ? (isFa ? 'گوش می‌دهم…' : 'Listening…') : (isFa ? 'بلند بگو' : 'Say it')}</button>{/if}
</div>
{#if heard}<p class="heard" role="status"><span>{isFa ? 'شنیدم:' : 'I heard:'}</span> <bdi lang="en">“{heard}”</bdi>{matched ? (isFa ? ' — دقیقاً همین.' : ' — that’s it.') : ''}</p>{/if}

<style>
	.say { display: flex; flex-wrap: wrap; gap: 8px; }
	button { min-height: 44px; padding: 8px 16px; border-radius: 999px; font: inherit; font-weight: 600; cursor: pointer; }
	.hear { border: 1px solid var(--accent); background: var(--paper-raised); color: var(--accent-deep); }
	.mic { border: 0; background: var(--accent); color: var(--on-accent); }
	.mic.on { background: var(--attention); }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
	.heard { margin: 8px 0 0; color: var(--ink-soft); }
</style>
