<script lang="ts">
	/**
	 * A learner's two English pages: today's lesson and their progress. (Practice on your own is off
	 * for learners for now, the owner's decision.)
	 * Shown only outside a lesson (focused flows have no navigation). The owner has their own tabs
	 * (EnglishModuleTabs) unless they're seeing the app as a learner.
	 */
	import { page } from '$app/state';
	let { current, isFa = false }: { current: 'today' | 'progress'; isFa?: boolean } = $props();
	const tabs = [
		{ id: 'today', href: '/practice/english/today', en: 'Today', fa: 'امروز' },
		{ id: 'progress', href: '/practice/english/progress', en: 'Progress', fa: 'پیشرفت' }
	] as const;
	const show = $derived(page.data?.labAccess !== true);
</script>

{#if show}
	<nav class="learner-tabs" aria-label={isFa ? 'بخش‌های انگلیسی' : 'English sections'} dir={isFa ? 'rtl' : 'ltr'}>
		{#each tabs as tab}
			<a href={tab.href} class:active={tab.id === current} aria-current={tab.id === current ? 'page' : undefined}>{isFa ? tab.fa : tab.en}</a>
		{/each}
	</nav>
{/if}

<style>
	.learner-tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; padding: 6px; margin-block: 16px 8px; border: 1px solid var(--control-border); border-radius: 14px; background: var(--paper-sunken); }
	a { display: grid; place-items: center; padding: 10px 8px; border-radius: 10px; color: var(--ink-soft); text-decoration: none; min-height: 44px; font-weight: 600; font-size: .95rem; }
	a:hover { background: var(--control-hover); color: var(--ink); }
	a.active { background: var(--paper-raised); color: var(--accent-deep); box-shadow: 0 1px 3px rgb(0 0 0 / .08); }
	a:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
</style>
