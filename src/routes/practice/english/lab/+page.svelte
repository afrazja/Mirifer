<script lang="ts">
	import { onMount } from 'svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import EnglishModuleTabs from '$lib/components/EnglishModuleTabs.svelte';
	import { LAB_MODULES } from '$lib/practice/module-lab';
	import { getLanguage } from '$services/data-layer';

	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	onMount(() => { void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; }); });
</script>

<svelte:head>
	<title>{isFa ? 'آزمایشگاه بخش‌ها | انگلیسی' : 'Module lab | English'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="lab" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/languages" backLabel={isFa ? 'زبان‌ها' : 'Languages'} direction={isFa ? 'rtl' : 'ltr'} />
	<EnglishModuleTabs current="lab" {isFa} />
	<h1>{isFa ? 'آزمایشگاه بخش‌ها' : 'Module lab'}</h1>
	<ul class="cards">
		{#each LAB_MODULES as mod}
			<li>
				{#if mod.href}<a class="card" href={mod.href}>{isFa ? mod.name.fa : mod.name.en}</a>
				{:else}<span class="card">{isFa ? mod.name.fa : mod.name.en}</span>{/if}
			</li>
		{/each}
	</ul>
</main>

<style>
	.lab { max-width: 760px; margin: 0 auto; padding: 0 16px 48px; }
	h1 { margin: 18px 0 14px; font-family: var(--font-display); }
	.cards { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
	.card { display: flex; align-items: center; min-height: 88px; padding: 16px; border: 1px solid var(--line); border-radius: 16px; background: var(--paper-raised); color: var(--ink); font-weight: 600; line-height: 1.35; text-decoration: none; }
	a.card:hover { border-color: var(--accent); }
	a.card:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
</style>
