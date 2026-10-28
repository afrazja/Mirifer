<script lang="ts">
	/**
	 * "Did you enjoy this step?": five faces, one tap, optional, and the learner can change it
	 * (owner's request: we learn which steps people like). Saved through the step page's `rate` action.
	 */
	import { deserialize } from '$app/forms';
	import { RATINGS } from '$lib/practice/step-feedback';
	import type { StepId } from '$lib/practice/path';

	let { step, isFa }: { step: StepId; isFa: boolean } = $props();
	const T = (en: string, fa: string) => (isFa ? fa : en);
	let chosen = $state<number | null>(null), failed = $state(false), saving = $state(false);

	async function rate(value: number) {
		if (saving) return;
		chosen = value; failed = false; saving = true;
		try {
			const body = new FormData(); body.set('step', step); body.set('rating', String(value));
			const response = await fetch('?/rate', { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
			if (deserialize(await response.text()).type !== 'success') failed = true;
		} catch { failed = true; } finally { saving = false; }
	}
</script>

<div class="rating" role="group" aria-labelledby="rating-q">
	<p id="rating-q" class="q">{T('Did you enjoy this step?', 'این مرحله برایت چقدر جذاب بود؟')}</p>
	<div class="faces">
		{#each RATINGS as option}
			<button type="button" class="face" class:on={chosen === option.value} aria-pressed={chosen === option.value}
				aria-label={isFa ? option.label.fa : option.label.en} title={isFa ? option.label.fa : option.label.en} onclick={() => rate(option.value)}>
				<span aria-hidden="true">{option.face}</span>
			</button>
		{/each}
	</div>
	<p class="note" role="status">
		{#if failed}{T('That didn’t send. Tap again to try once more.', 'ارسال نشد. دوباره بزن.')}
		{:else if chosen !== null}{T('Thanks! That helps us make Mirifer better.', 'ممنون! این به ما کمک می‌کند میریفر را بهتر کنیم.')}{/if}
	</p>
</div>

<style>
	.rating { margin: 18px 0 8px; padding: 14px 16px; border: 1px solid var(--line); border-radius: 16px; background: var(--paper-raised); }
	.q { margin: 0 0 10px; font-weight: 600; }
	.faces { display: flex; justify-content: space-between; gap: 6px; }
	.face { display: grid; place-items: center; inline-size: 52px; block-size: 52px; border: 2px solid transparent; border-radius: 50%; background: var(--paper-sunken); font-size: 1.6rem; cursor: pointer; transition: transform .15s; }
	.face.on { border-color: var(--accent); background: var(--accent-wash); transform: scale(1.08); }
	.face:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
	.note { min-block-size: 1.4em; margin: 8px 0 0; color: var(--ink-soft); font-size: .9rem; }
	@media (prefers-reduced-motion: reduce) { .face { transition: none; } .face.on { transform: none; } }
</style>
