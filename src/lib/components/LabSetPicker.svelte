<script lang="ts">
	/** Module lab: which day's content (and version) to run the module with. */
	import { LAB_SETS, type LabSet } from '$lib/practice/lab-sets';
	let { isFa = false, current, sets = LAB_SETS, onChoose }: { isFa?: boolean; current: LabSet; sets?: LabSet[]; onChoose: (set: LabSet) => void } = $props();
</script>

<div class="sets" role="group" aria-label={isFa ? 'محتوای کدام روز' : 'Which day’s content'}>
	{#each sets as set}
		<button type="button" class="set" aria-pressed={set.id === current.id} onclick={() => onChoose(set)}>{isFa ? set.name.fa : set.name.en}</button>
	{/each}
</div>

<style>
	.sets { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
	.set { min-height: 44px; padding: 8px 14px; border: 1px solid var(--control-border); border-radius: 999px; background: var(--control); color: var(--ink); font: inherit; font-size: .92rem; cursor: pointer; }
	.set[aria-pressed='true'] { border-color: var(--accent); background: var(--accent); color: var(--on-accent); font-weight: 600; }
	.set:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
</style>
