<script lang="ts">
	import { onMount } from 'svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import { getLanguage } from '$services/data-layer';

	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	onMount(() => { void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; }); });
	const parts = [
		{ href: '/practice/english/today', en: 'Daily lesson', fa: 'درس روزانه' },
		{ href: '/practice/english/lab', en: 'Module lab', fa: 'آزمایشگاه بخش‌ها' }
	];
</script>

<svelte:head>
	<title>{isFa ? 'انگلیسی' : 'English'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="home" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/languages" backLabel={isFa ? 'زبان‌ها' : 'Languages'} direction={isFa ? 'rtl' : 'ltr'} />
	<h1>{isFa ? 'انگلیسی' : 'English'}</h1>
	<ul class="parts">
		{#each parts as part}<li><a class="part" href={part.href}>{isFa ? part.fa : part.en} <span aria-hidden="true">{isFa ? '←' : '→'}</span></a></li>{/each}
	</ul>
</main>

<style>
	.home { max-width: 760px; margin: 0 auto; padding: 0 16px 48px; }
	h1 { margin: 18px 0 14px; font-family: var(--font-display); }
	.parts { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
	.part { display: flex; align-items: center; justify-content: space-between; min-height: 96px; padding: 20px; border: 1px solid var(--line); border-radius: 18px; background: var(--paper-raised); color: var(--ink); font-size: 1.2rem; font-weight: 700; text-decoration: none; }
	.part:hover { border-color: var(--accent); }
	.part:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
</style>
