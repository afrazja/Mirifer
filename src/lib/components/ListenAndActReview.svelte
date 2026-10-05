<script lang="ts">
	import { ACT_ROUNDS, PLACES, THINGS, type ActRecord, type Step } from '$lib/practice/listen-act';
	import type { DisplayText } from '$lib/practice/hotel';

	/** Read-only look back at a finished Listen and act: what the learner did and how it was marked. */
	let { isFa = false, record }: { isFa?: boolean; record: ActRecord } = $props();
	const text = (value: DisplayText) => (isFa ? value.fa : value.en);
	const label = (step: Step) => `${text(THINGS[step.thing].label)} → ${text(PLACES[step.place].label)}`;
	const roundOf = (id: string) => ACT_ROUNDS.find(round => round.id === id)!;
</script>

{#each record.rounds as done, index}
	{@const round = roundOf(done.id)}
	<section class="round" aria-label={isFa ? `دور ${index + 1}` : `Round ${index + 1}`}>
		<h2>{isFa ? `دور ${index + 1}` : `Round ${index + 1}`} · {round.level}</h2>
		<p class="label">{isFa ? 'کارهای تو' : 'Your steps'}</p>
		<ol>
			{#each done.steps as step, i}
				<li class:right={done.results[i] === true} class:wrong={done.results[i] !== true}>{label(step)} <strong>{done.results[i] ? (isFa ? '✓ درست' : '✓ right') : (isFa ? '✗ نادرست' : '✗ not right')}</strong></li>
			{:else}<li class="none">{isFa ? 'کاری انجام ندادی.' : 'No steps were added.'}</li>{/each}
		</ol>
		<p class="label">{isFa ? 'جواب‌های درست' : 'The right answers'}</p>
		<ol>{#each round.steps as step}<li>{label(step)}</li>{/each}</ol>
		<p class="script" lang="en" dir="ltr">“{round.script}”</p>
	</section>
{/each}

<style>
	.round { display: grid; gap: 8px; padding: 14px; margin-bottom: 12px; border: 1px solid var(--control-border); border-radius: 14px; background: var(--paper-raised); }
	h2 { font-size: 1rem; font-weight: 600; margin: 0; }
	.label { margin: 4px 0 0; font-size: .8rem; font-weight: 600; letter-spacing: .06em; color: var(--accent-deep); }
	ol { margin: 0; padding-inline-start: 22px; display: grid; gap: 6px; }
	li { padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; }
	li.right { border-color: var(--leaf); background: var(--leaf-wash); }
	li.wrong { border-color: var(--miss); }
	li.none { list-style: none; margin-inline-start: -22px; color: var(--ink-soft); border-style: dashed; }
	.script { margin: 4px 0 0; line-height: 1.6; font-style: italic; }
</style>
