<script lang="ts">
	/** Module lab: "Natural phrases" on its own, with any day's sentences (each day's set, each version), to try without the whole lesson. */
	import { onMount } from 'svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import PhrasePractice from '$lib/components/PhrasePractice.svelte';
	import { getLanguage } from '$services/data-layer';
	import { stopAllAudio } from '$services/tts';
	import { loadLab, saveLab } from '$lib/practice/module-lab';
	import { asPhraseRecord } from '$lib/practice/phrases';
	import { phrasesFor } from '$lib/practice/day-content';
	import type { Track } from '$lib/practice/day';
	import type { DisplayText } from '$lib/practice/hotel';

	/** Every set of sentences, by day and version. */
	const SETS: { id: string; day: string; track: Track; name: DisplayText }[] = [
		{ id: 'day-1', day: 'day-1', track: 'intermediate', name: { en: 'Day 1', fa: 'روز ۱' } },
		{ id: 'day-2-intermediate', day: 'day-2', track: 'intermediate', name: { en: 'Day 2 · Intermediate', fa: 'روز ۲، متوسط' } },
		{ id: 'day-2-professional', day: 'day-2', track: 'professional', name: { en: 'Day 2 · Professional', fa: 'روز ۲، حرفه‌ای' } }
	];
	const SET_KEY = 'mirifer_lab_phrases_set';
	function savedSet(): string { try { return localStorage.getItem(SET_KEY) ?? 'day-1'; } catch { return 'day-1'; } }
	let setId = $state(typeof localStorage === 'undefined' ? 'day-1' : savedSet());
	const set = $derived(SETS.find(item => item.id === setId) ?? SETS[0]);
	const phrases = $derived(phrasesFor(set.day, set.track));
	const ID = $derived(`natural-phrases:${set.id}`);
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	let run = $state(0), finished = $state(false);
	// A finished run starts again; an unfinished one comes back where it was.
	function initialFor(): ReturnType<typeof asPhraseRecord> { const saved = asPhraseRecord(loadLab(ID), phrases); return saved?.done ? null : saved; }
	function choose(id: string) {
		stopAllAudio(); setId = id; finished = false; run += 1;
		try { localStorage.setItem(SET_KEY, id); } catch { /* the choice just isn't remembered */ }
	}

	onMount(() => {
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		return () => stopAllAudio();
	});
	function again() { saveLab(ID, null); finished = false; run += 1; }
</script>

<svelte:head>
	<title>{isFa ? 'عبارت‌های طبیعی' : 'Natural phrases'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="module" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/practice/english/lab" backLabel={isFa ? 'آزمایشگاه بخش‌ها' : 'Module lab'} direction={isFa ? 'rtl' : 'ltr'} />
	<p class="eyebrow">{isFa ? 'آزمایشگاه — صحبت کردن' : 'MODULE LAB · SPEAKING'}</p>
	<h1>{isFa ? 'عبارت‌های طبیعی' : 'Natural phrases'}</h1>
	<div class="sets" role="group" aria-label={isFa ? 'کدام جمله‌ها' : 'Which sentences'}>
		{#each SETS as item}
			<button type="button" class="set" aria-pressed={item.id === set.id} onclick={() => choose(item.id)}>{isFa ? item.name.fa : item.name.en}</button>
		{/each}
	</div>
	{#if finished}
		<p>{isFa ? 'تمام شد.' : 'All done.'}</p>
		<button class="primary" type="button" onclick={again}>{isFa ? 'دوباره امتحان کن' : 'Try it again'}</button>
	{:else}
		{#key run}
			<PhrasePractice {isFa} {phrases} initial={initialFor()} onSave={record => saveLab(ID, record)} onDone={() => (finished = true)} />
		{/key}
	{/if}
</main>

<style>
	.module { max-width: 680px; margin: 0 auto; padding: 0 16px 48px; }
	.eyebrow { margin: 16px 0 4px; font-size: .78rem; font-weight: 700; letter-spacing: .08em; color: var(--accent-deep); }
	:global([dir='rtl']) .eyebrow { letter-spacing: normal; }
	h1 { margin: 0 0 10px; font-family: var(--font-display); }
	.sets { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
	.set { min-height: 44px; padding: 8px 14px; border: 1px solid var(--control-border); border-radius: 999px; background: var(--control); color: var(--ink); font: inherit; font-size: .92rem; cursor: pointer; }
	.set[aria-pressed='true'] { border-color: var(--accent); background: var(--accent); color: var(--on-accent); font-weight: 600; }
	.set:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
	.primary { min-height: 52px; padding: 12px 22px; border: 0; border-radius: 12px; background: var(--accent); color: var(--on-accent); font: inherit; font-weight: 600; cursor: pointer; }
</style>
