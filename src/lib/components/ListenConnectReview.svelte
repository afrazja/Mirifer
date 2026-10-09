<script lang="ts">
	/** Read-only look back at "Listen and connect": one line per question, then the conversation on request. */
	import { CHOICES, CONNECT, CONVERSATION, SPEAKERS, linkParts, type ConnectRecord } from '$lib/practice/listen-connect';
	let { isFa = false, record }: { isFa?: boolean; record: ConnectRecord } = $props();
	const T = (en: string, fa: string) => (isFa ? fa : en);
	let showText = $state(false);
	const rows = $derived([
		...CONNECT.causes.map((cause, i) => ({ q: cause, right: record.connect[i] === CONNECT.answers[i], answer: CONNECT.results[CONNECT.answers[i]] })),
		...CHOICES.map((c, i) => ({ q: c.question, right: record.choices[i] === c.answer, answer: c.options[c.answer] }))
	]);
</script>

<ul class="rows">
	{#each rows as row}
		<li class:right={row.right}><span lang="en" dir="ltr">{row.q}</span> <small>{row.right ? T('Right', 'درست') : T('Right answer:', 'جواب درست:')}</small> {#if !row.right}<span lang="en" dir="ltr">{row.answer}</span>{/if}</li>
	{/each}
</ul>
<button class="link" type="button" onclick={() => (showText = !showText)} aria-expanded={showText}>{showText ? T('Hide the conversation', 'پنهان کردن گفت‌وگو') : T('Show the conversation', 'نمایش گفت‌وگو')}</button>
{#if showText}
	<ol class="script" lang="en" dir="ltr">
		{#each CONVERSATION as line}<li><b>{SPEAKERS[line.who].name}:</b> {#each linkParts(line.text) as part}{#if part.link}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}</li>{/each}
	</ol>
{/if}

<style>
	.rows { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
	.rows li { padding: 10px 12px; border-radius: 10px; border: 1px solid var(--attention); background: var(--attention-wash); text-align: left; line-height: 1.5; }
	.rows li.right { border-color: var(--leaf); background: var(--leaf-wash); }
	small { font-weight: 700; color: var(--ink-soft); }
	.script { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; text-align: left; line-height: 1.55; }
	mark { background: color-mix(in srgb, var(--gold) 35%, transparent); color: inherit; border-radius: 4px; padding: 0 2px; }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
</style>
