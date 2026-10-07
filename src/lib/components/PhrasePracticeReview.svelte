<script lang="ts">
	/** Read-only look back at "Natural phrases": the five sentences, chunks in bold, Mira's voice, and a ✓ where the chunk was caught. */
	import { playAudioPromise, stopAllAudio } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { PHRASES, shownParts, type PhraseRecord } from '$lib/practice/phrases';
	let { isFa = false, record }: { isFa?: boolean; record: PhraseRecord } = $props();
	const T = (en: string, fa: string) => (isFa ? fa : en);
	function hear(text: string) { stopAllAudio(); void playAudioPromise(text, COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {}); }
</script>

<ol class="review">
	{#each PHRASES as phrase, i}
		<li>
			<button class="hear" type="button" onclick={() => hear(phrase.sentence)} aria-label={T('Hear Mira', 'شنیدن صدای میرا')}><span aria-hidden="true">▶</span></button>
			<p lang="en" dir="ltr">{#each shownParts(phrase.shown) as part}{#if part.tie}<span class="tie" aria-hidden="true"></span>{:else if part.bold}<strong>{part.text}</strong>{:else}{part.text}{/if}{/each}</p>
			{#if record.items[i]?.caught}<span class="ok" aria-label={T('You said this phrase', 'این عبارت را گفتی')}>✓</span>{/if}
		</li>
	{/each}
</ol>

<style>
	.review { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
	li { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; padding: 12px 14px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); }
	p { margin: 0; line-height: 1.5; text-align: left; }
	strong { color: var(--accent-deep); }
	.ok { color: var(--leaf); font-weight: 700; }
	.hear { display: grid; place-items: center; inline-size: 44px; block-size: 44px; border: 1.5px solid var(--accent); border-radius: 50%; background: var(--paper-raised); color: var(--accent-deep); cursor: pointer; }
	.hear:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
	.tie { display: inline-block; inline-size: .42em; block-size: .32em; margin-inline: .04em; border-block-end: 2px solid var(--accent); border-radius: 0 0 50% 50% / 0 0 100% 100%; vertical-align: -.08em; }
</style>
