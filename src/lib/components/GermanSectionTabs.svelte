<script lang="ts">
	/**
	 * Switches between the German course sections. Replaces the old side
	 * menu so German uses the same header-plus-tabs layout as English.
	 */
	import { onMount } from 'svelte';

	type Section = 'today' | 'lessons' | 'basics' | 'vocabulary' | 'review';
	let { current, language = 'en', dueReviews = 0 }: { current: Section; language?: 'en' | 'fa'; dueReviews?: number } = $props();
	const isFa = $derived(language === 'fa');
	const tabs = [
		{ id: 'today', href: '/home', en: 'Today', fa: 'امروز' },
		{ id: 'lessons', href: '/lessons', en: 'All lessons', fa: 'همه درس‌ها' },
		{ id: 'review', href: '/review', en: 'Reviews', fa: 'مرورها' },
		{ id: 'basics', href: '/basics', en: 'German Basics', fa: 'گرامر آلمانی' },
		{ id: 'vocabulary', href: '/vocabulary', en: 'Saved words', fa: 'کلمه‌های ذخیره‌شده' }
	] as const;
	let nav: HTMLElement | undefined = $state();
	// On a phone the row scrolls; bring the current section into view.
	onMount(() => nav?.querySelector<HTMLElement>('.active')?.scrollIntoView({ block: 'nearest', inline: 'center' }));
</script>

<nav class="section-tabs" bind:this={nav} aria-label={isFa ? 'بخش‌های دورهٔ آلمانی' : 'German course sections'} dir={isFa ? 'rtl' : 'ltr'}>
	{#each tabs as tab}
		<a href={tab.href} class:active={tab.id === current} aria-current={tab.id === current ? 'page' : undefined}>
			{isFa ? tab.fa : tab.en}
			{#if tab.id === 'review' && dueReviews > 0}<em aria-label={isFa ? `${dueReviews} مرور` : `${dueReviews} due`}>{dueReviews}</em>{/if}
		</a>
	{/each}
</nav>

<style>
	.section-tabs { display: flex; min-width: 0; max-width: 100%; gap: 6px; padding: 6px; margin-block: 16px 8px; border: 1px solid var(--control-border); border-radius: 14px; background: var(--paper-sunken); overflow-x: auto; scrollbar-width: none; }
	.section-tabs::-webkit-scrollbar { display: none; }
	a { flex: 1 0 auto; display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; padding: 8px 14px; border-radius: 10px; color: var(--ink-soft); font-size: .92rem; font-weight: 600; text-decoration: none; white-space: nowrap; }
	a:hover { background: var(--control-hover); color: var(--ink); }
	a.active { background: var(--paper-raised); color: var(--accent-deep); box-shadow: 0 1px 3px rgb(0 0 0 / .08); }
	a:focus-visible { outline: 3px solid var(--accent); outline-offset: -3px; }
	em { padding: 1px 7px; border-radius: 999px; background: var(--attention-wash); color: var(--attention); font-size: .72rem; font-style: normal; }
</style>
