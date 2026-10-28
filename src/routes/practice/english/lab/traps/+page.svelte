<script lang="ts">
	/** Module lab: "Persian-speaker traps" on its own, with any day's sentences (all of them, not only the lesson's). */
	import { onMount } from 'svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import Traps from '$lib/components/Traps.svelte';
	import { getLanguage } from '$services/data-layer';
	import { stopAllAudio } from '$services/tts';
	import { loadLab, saveLab } from '$lib/practice/module-lab';
	import { asTrapsRecord } from '$lib/practice/traps';
	import { trapsFor } from '$lib/practice/day-content';
	import LabSetPicker from '$lib/components/LabSetPicker.svelte';
	import { LAB_CHAPTER_SETS, saveLabSet, savedLabSet, type LabSet } from '$lib/practice/lab-sets';

	/** One set of traps per day (both versions share Day 2's). */
	const SETS: LabSet[] = LAB_CHAPTER_SETS;
	const remembered = typeof localStorage === 'undefined' ? SETS[0] : savedLabSet('traps');
	let set = $state<LabSet>(SETS.find(item => item.day === remembered.day) ?? SETS[0]);
	const traps = $derived(trapsFor(set.day, true));
	const ID = $derived(`traps:${set.day}`);
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	let run = $state(0), finished = $state(false);
	// A finished round starts again; an unfinished one comes back where it was.
	function initialFor() { const saved = asTrapsRecord(loadLab(ID), traps); return saved?.done ? null : saved; }
	function choose(next: LabSet) { stopAllAudio(); set = next; finished = false; run += 1; saveLabSet('traps', next.id); }

	onMount(() => {
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		return () => stopAllAudio();
	});
	function again() { saveLab(ID, null); finished = false; run += 1; }
</script>

<svelte:head>
	<title>{isFa ? 'اشتباه‌های آشنا' : 'Persian-speaker traps'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="module" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/practice/english/lab" backLabel={isFa ? 'آزمایشگاه بخش‌ها' : 'Module lab'} direction={isFa ? 'rtl' : 'ltr'} />
	<p class="eyebrow">{isFa ? 'آزمایشگاه — صحبت' : 'MODULE LAB · SPEAKING'}</p>
	<h1>{isFa ? 'اشتباه‌های آشنا' : 'Persian-speaker traps'}</h1>
	<LabSetPicker {isFa} current={set} sets={SETS} onChoose={choose} />
	{#if finished}
		<p>{isFa ? 'تمام شد.' : 'All done.'}</p>
		<button class="primary" type="button" onclick={again}>{isFa ? 'دوباره امتحان کن' : 'Try it again'}</button>
	{:else}
		{#key run}
			<Traps {isFa} {traps} initial={initialFor()} onSave={record => saveLab(ID, record)} onDone={() => (finished = true)} />
		{/key}
	{/if}
</main>

<style>
	.module { max-width: 680px; margin: 0 auto; padding: 0 16px 48px; }
	.eyebrow { margin: 16px 0 4px; font-size: .78rem; font-weight: 700; letter-spacing: .08em; color: var(--accent-deep); }
	:global([dir='rtl']) .eyebrow { letter-spacing: normal; }
	h1 { margin: 0 0 10px; font-family: var(--font-display); }
	.primary { min-height: 52px; padding: 12px 22px; border: 0; border-radius: 12px; background: var(--accent); color: var(--on-accent); font: inherit; font-weight: 600; cursor: pointer; }
</style>
