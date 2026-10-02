<script lang="ts">
	/**
	 * Switches between the English practice modules. A stopgap until the
	 * daily-lesson journey decides the order; each module keeps its own URL.
	 */
	let { current, isFa = false }: { current: 'today' | 'conversation' | 'retell'; isFa?: boolean } = $props();
	const tabs = [
		{ id: 'today', href: '/practice/english/today', en: 'Today', fa: 'امروز', hintEn: 'Your daily session', hintFa: 'جلسهٔ روزانه' },
		{ id: 'conversation', href: '/practice/english', en: 'Conversation', fa: 'گفت‌وگو', hintEn: 'Talk it through with AI', hintFa: 'گفت‌وگو با هوش مصنوعی' },
		{ id: 'retell', href: '/practice/english/retell', en: 'Listen & retell', fa: 'گوش بده و بازگو کن', hintEn: 'Hear a story, tell it back', hintFa: 'داستان را بشنو و بازگو کن' }
	] as const;
</script>

<nav class="module-tabs" aria-label={isFa ? 'بخش‌های تمرین انگلیسی' : 'English practice modules'} dir={isFa ? 'rtl' : 'ltr'}>
	{#each tabs as tab}
		<a href={tab.href} class:active={tab.id === current} aria-current={tab.id === current ? 'page' : undefined}>
			<strong>{isFa ? tab.fa : tab.en}</strong>
			<small>{isFa ? tab.hintFa : tab.hintEn}</small>
		</a>
	{/each}
</nav>

<style>
	.module-tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; padding: 6px; margin-block: 16px 8px; border: 1px solid var(--control-border); border-radius: 14px; background: var(--paper-sunken); }
	a { display: grid; gap: 2px; padding: 10px 14px; border-radius: 10px; color: var(--ink-soft); text-decoration: none; min-height: 44px; }
	a:hover { background: var(--control-hover); color: var(--ink); }
	a.active { background: var(--paper-raised); color: var(--ink); box-shadow: 0 1px 3px rgb(0 0 0 / .08); }
	a.active strong { color: var(--accent-deep); }
	a:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
	strong { font-size: .95rem; }
	small { font-size: .75rem; }
	@media (max-width: 480px) { small { display: none; } a { text-align: center; } }
</style>
