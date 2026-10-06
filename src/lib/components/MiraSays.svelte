<script lang="ts">
	/**
	 * Mira introduces a step, like a teacher: her line on screen, read aloud
	 * when the step opens, with a replay button. Persian learners also see the
	 * Persian under the English, so the instruction is never missed.
	 * Phones may block sound that wasn't started by a tap; the button is
	 * always there.
	 */
	import { onDestroy, onMount } from 'svelte';
	import { playAudioPromise, stopAllAudio, ttsIsPlaying } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import type { DisplayText } from '$lib/practice/hotel';

	let { line, isFa = false, autoplay = true, compact = false }: { line: DisplayText; isFa?: boolean; autoplay?: boolean; /** Folded to one line once the learner has moved on. */ compact?: boolean } = $props();
	const playing = $derived($ttsIsPlaying);
	function play() { void playAudioPromise(line.en, COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {}); }
	function toggle() { if (playing) stopAllAudio(); else play(); }
	onMount(() => { if (autoplay) play(); });
	onDestroy(stopAllAudio);
</script>

{#if compact}
<div class="mira compact">
	<span class="avatar" aria-hidden="true">M</span>
	<span class="fold">{isFa ? 'میرا' : 'Mira'}</span>
	<button class="hear" type="button" onclick={toggle} aria-label={playing ? (isFa ? 'توقف صدا' : 'Stop') : (isFa ? 'شنیدن دوبارهٔ میرا' : 'Hear Mira again')}><span aria-hidden="true">{playing ? '■' : '▶'}</span></button>
</div>
{:else}
<div class="mira">
	<span class="avatar" aria-hidden="true">M</span>
	<div class="said">
		{#if isFa}<p class="fa" lang="fa" dir="rtl">{line.fa}</p>{:else}<p class="en" lang="en" dir="ltr">{line.en}</p>{/if}
	</div>
	<button class="hear" type="button" onclick={toggle} aria-label={playing ? (isFa ? 'توقف صدا' : 'Stop') : (isFa ? 'شنیدن صدای میرا' : 'Hear Mira')}><span aria-hidden="true">{playing ? '■' : '▶'}</span></button>
</div>
{/if}

<style>
	.mira { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: start; padding: 14px; margin: 6px 0 18px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.said { display: grid; gap: 6px; min-width: 0; }
	p { margin: 0; line-height: 1.55; }
	.en { font-size: 1.04rem; text-align: left; }
	.fa { font-size: 1.04rem; }
	.hear { display: grid; place-items: center; inline-size: 44px; block-size: 44px; border: 1.5px solid var(--accent); border-radius: 50%; background: var(--paper-raised); color: var(--accent-deep); cursor: pointer; }
	.compact { padding: 8px 12px; align-items: center; }
	.fold { font-weight: 700; }
	.hear:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
</style>
