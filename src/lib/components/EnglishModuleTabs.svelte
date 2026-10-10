<script lang="ts">
	/**
	 * The English section's two parts: the daily lesson, and the Module lab (every
	 * module type as a card, for the owner and admins while they are built). Learners
	 * without lab access see no switch at all.
	 */
	import { page } from '$app/state';
	let { current, isFa = false }: { current: 'today' | 'lab'; isFa?: boolean } = $props();
	const tabs = [
		{ id: 'today', href: '/practice/english/today', en: 'Daily lesson', fa: 'درس روزانه' },
		{ id: 'lab', href: '/practice/english/lab', en: 'Module lab', fa: 'آزمایشگاه بخش‌ها' }
	] as const;
	const show = $derived(page.data?.labAccess === true);
</script>

{#if show}
	<nav class="module-tabs" aria-label={isFa ? 'بخش‌های انگلیسی' : 'English sections'} dir={isFa ? 'rtl' : 'ltr'}>
		{#each tabs as tab}
			<a href={tab.href} class:active={tab.id === current} aria-current={tab.id === current ? 'page' : undefined}>{isFa ? tab.fa : tab.en}</a>
		{/each}
	</nav>
{/if}

<style>
	.module-tabs { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; padding: 6px; margin-block: 16px 8px; border: 1px solid var(--control-border); border-radius: 14px; background: var(--paper-sunken); }
	a { display: grid; place-items: center; padding: 10px 14px; border-radius: 10px; color: var(--ink-soft); text-decoration: none; min-height: 44px; font-weight: 600; font-size: .95rem; }
	a:hover { background: var(--control-hover); color: var(--ink); }
	a.active { background: var(--paper-raised); color: var(--accent-deep); box-shadow: 0 1px 3px rgb(0 0 0 / .08); }
	a:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
</style>
