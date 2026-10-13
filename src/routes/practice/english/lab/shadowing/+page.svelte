<script lang="ts">
	/** Module lab: "Shadowing" on its own, to try and judge before it joins a daily lesson. */
	import { onMount } from 'svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import ShadowingLab from '$lib/components/ShadowingLab.svelte';
	import { getLanguage } from '$services/data-layer';
	import { stopAllAudio } from '$services/tts';
	import { loadLab, saveLab } from '$lib/practice/module-lab';
	import { asShadowRecord } from '$lib/practice/shadowing-lab';

	const ID = 'shadowing';
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	let run = $state(0), finished = $state<'done' | 'later' | null>(null);
	const saved = asShadowRecord(loadLab(ID));
	// A finished run starts again; an unfinished one comes back where it was (plays included).
	const initial = saved?.done ? null : saved;

	onMount(() => {
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		return () => stopAllAudio();
	});
	function again() { if (finished === 'done') saveLab(ID, null); finished = null; run += 1; }
</script>

<svelte:head>
	<title>{isFa ? 'تکرار همزمان' : 'Shadowing'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="module" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/practice/english/lab" backLabel={isFa ? 'آزمایشگاه بخش‌ها' : 'Module lab'} direction={isFa ? 'rtl' : 'ltr'} />
	<p class="eyebrow">{isFa ? 'آزمایشگاه — شنیدن و گفتن' : 'MODULE LAB · LISTENING'}</p>
	<h1>{isFa ? 'تکرار همزمان' : 'Shadowing'}</h1>
	{#if finished}
		<p>{finished === 'later' ? (isFa ? 'پیشرفتت ذخیره شد. هر وقت خواستی برگرد.' : 'Your progress is saved. Come back any time.') : isFa ? 'تمام شد.' : 'All done.'}</p>
		<button class="primary" type="button" onclick={again}>{finished === 'later' ? (isFa ? 'ادامه بده' : 'Carry on') : isFa ? 'دوباره امتحان کن' : 'Try it again'}</button>
	{:else}
		{#key run}
			<ShadowingLab {isFa} initial={run === 0 ? initial : asShadowRecord(loadLab(ID))} first={run === 0 && !initial} onSave={record => saveLab(ID, record)} onDone={() => (finished = 'done')} onLater={() => (finished = 'later')} />
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
