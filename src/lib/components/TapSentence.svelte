<script lang="ts">
	/**
	 * A lesson sentence whose words can be tapped (owner preview): a panel slides up with the word,
	 * Listen, its Persian meaning in this sentence, and the sentence it came from. Keeps the
	 * sentence's own marks: **bold** for the chunk, ‿ for linked sounds.
	 */
	import { onDestroy } from 'svelte';
	import { shownParts } from '$lib/practice/phrases';
	import { glossFor, wordKey, type WordGloss } from '$lib/practice/word-glosses';
	import { playAudioPromise, stopAllAudio } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';

	let { shown, sentence, isFa = false }: { shown: string; sentence: string; isFa?: boolean } = $props();
	const T = (en: string, fa: string) => (isFa ? fa : en);

	/** The sentence in pieces: words (tappable when they have a meaning), spaces and punctuation, and the link marks. */
	type Piece = { kind: 'tie' | 'word' | 'text'; text: string; bold: boolean };
	const pieces = $derived(shownParts(shown).flatMap((part): Piece[] => part.tie
		? [{ kind: 'tie', text: '', bold: false }]
		: part.text.split(/([A-Za-z’']+)/).filter(Boolean).map((text): Piece => ({ kind: /[A-Za-z]/.test(text) ? 'word' : 'text', text, bold: part.bold }))));

	let open = $state<{ word: string; gloss: WordGloss } | null>(null);
	let dialog = $state<HTMLDialogElement | null>(null);
	let playing = $state(false);
	function show(word: string) {
		const gloss = glossFor(sentence, word);
		if (!gloss) return;
		open = { word: word.replace(/’/g, "'"), gloss };
		dialog?.showModal();
		listen();
	}
	function listen() {
		if (!open) return;
		stopAllAudio();
		playing = true;
		void playAudioPromise(open.word, COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {}).finally(() => (playing = false));
	}
	function close() { dialog?.close(); }
	onDestroy(() => { if (dialog?.open) dialog.close(); });
</script>

<p class="sentence" lang="en" dir="ltr">{#each pieces as piece}{#if piece.kind === 'tie'}<span class="tie" aria-hidden="true"></span>{:else if piece.kind === 'word' && glossFor(sentence, piece.text)}<button type="button" class="word" class:bold={piece.bold} onclick={() => show(piece.text)} aria-haspopup="dialog">{piece.text}</button>{:else if piece.bold}<strong>{piece.text}</strong>{:else}{piece.text}{/if}{/each}</p>
<p class="hint">{T('Tap a word to see what it means.', 'روی هر کلمه بزن تا معنی‌اش را ببینی.')}</p>

<dialog bind:this={dialog} class="sheet" aria-labelledby="word-title" onclose={() => { open = null; stopAllAudio(); }} onclick={e => { if (e.target === dialog) close(); }}>
	{#if open}
		<div class="sheet-body" dir={isFa ? 'rtl' : 'ltr'}>
			<div class="head">
				<h2 id="word-title" lang="en" dir="ltr">{open.word}</h2>
				<button type="button" class="listen" onclick={listen} aria-label={T('Listen', 'گوش بده')}>
					<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" /><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
					{playing ? T('Playing…', 'در حال پخش…') : T('Listen', 'گوش بده')}
				</button>
			</div>
			<p class="label">{T('Meaning here', 'معنی در این جمله')}</p>
			<p class="meaning" lang="fa" dir="rtl">{open.gloss.fa}</p>
			{#if open.gloss.chunk}
				<p class="label">{T('Part of', 'بخشی از')}</p>
				<p class="chunk" lang="en" dir="ltr">{open.gloss.chunk.en}</p>
				<p class="chunk-fa" lang="fa" dir="rtl">{open.gloss.chunk.fa}</p>
			{/if}
			<p class="label">{T('In the sentence', 'در جمله')}</p>
			<p class="example" lang="en" dir="ltr">{#each sentence.split(/([A-Za-z’']+)/) as bit}{#if wordKey(bit) && wordKey(bit) === wordKey(open.word)}<mark>{bit}</mark>{:else}{bit}{/if}{/each}</p>
			<button type="button" class="done" onclick={close}>{T('Close', 'بستن')}</button>
		</div>
	{/if}
</dialog>

<style>
	.sentence { margin: 4px 0 0; font-family: var(--font-display); font-size: clamp(1.45rem, 6.4vw, 1.9rem); line-height: 1.45; text-align: left; }
	.sentence strong, .word.bold { color: var(--accent-deep); font-weight: 700; }
	/* A word looks like text with a quiet dotted underline; tapping it opens the panel. */
	.word { display: inline; padding: 0; margin: 0; min-height: 0; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; text-decoration: underline dotted; text-decoration-color: color-mix(in srgb, currentColor 40%, transparent); text-underline-offset: .18em; border-radius: 4px; }
	.word:hover, .word:focus-visible { background: var(--accent-wash); outline: none; }
	.tie { display: inline-block; inline-size: .42em; block-size: .32em; margin-inline: .04em; border-block-end: 2px solid var(--accent); border-radius: 0 0 50% 50% / 0 0 100% 100%; vertical-align: -.08em; }
	.hint { margin: 6px 0 0; color: var(--ink-soft); font-size: .85rem; }
	.sheet { inset-block: auto 0; inline-size: min(100%, 680px); max-inline-size: 100%; margin: 0 auto; padding: 0; border: 0; border-radius: 20px 20px 0 0; background: var(--paper-raised); color: var(--ink); box-shadow: 0 -8px 30px rgb(0 0 0 / .18); }
	.sheet::backdrop { background: rgb(0 0 0 / .35); }
	.sheet[open] { animation: rise .22s ease-out; }
	@keyframes rise { from { transform: translateY(30%); opacity: .6; } to { transform: none; opacity: 1; } }
	@media (prefers-reduced-motion: reduce) { .sheet[open] { animation: none; } }
	.sheet-body { display: grid; gap: 4px; padding: 20px 20px calc(16px + env(safe-area-inset-bottom)); }
	.head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
	h2 { margin: 0; font-family: var(--font-display); font-size: 2rem; font-weight: 600; }
	.listen { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 8px 14px; border: 1px solid var(--control-border); border-radius: 999px; background: var(--paper); color: var(--accent-deep); font: inherit; font-weight: 600; cursor: pointer; }
	.label { margin: 10px 0 0; color: var(--ink-soft); font-size: .8rem; font-weight: 600; }
	.meaning { margin: 0; font-size: 1.25rem; font-weight: 600; text-align: start; }
	.chunk, .example { margin: 0; font-size: 1.05rem; line-height: 1.5; }
	.chunk { font-weight: 700; color: var(--accent-deep); }
	.chunk-fa { margin: 0; font-size: 1rem; line-height: 1.6; text-align: start; }
	.example mark { background: var(--accent-wash); color: var(--accent-deep); border-radius: 4px; padding: 0 2px; font-weight: 700; }
	.done { margin-top: 16px; min-height: 52px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
</style>
