<script lang="ts">
	import { getCourse } from '$lib/courses';
	let { language = 'en', targetLanguage }: { language?: string; targetLanguage: string | null } = $props();
	const course = $derived(getCourse(targetLanguage));
	const isFa = $derived(language === 'fa');
</script>

<a class="course-switcher" href="/languages" dir={isFa ? 'rtl' : 'ltr'}>
	<span><small>{isFa ? 'زبان یادگیری' : 'Learning language'}</small>
		<strong>{course ? course.name[isFa ? 'fa' : 'en'] : (isFa ? 'انتخاب زبان' : 'Choose a language')}</strong></span>
	<span class="change">{isFa ? 'زبان‌های من ←' : 'My languages →'}</span>
</a>

<style>
	.course-switcher { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-block: 16px; padding: 14px 18px; border: 1px solid var(--control-border); border-radius: 12px; background: var(--paper-raised); color: var(--ink); text-decoration: none; }
	.course-switcher:hover { background: var(--control-hover); }
	.course-switcher:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	small { display: block; color: var(--ink-soft); font-size: .75rem; margin-bottom: 2px; }
	strong { font-size: 1rem; }
	.change { color: var(--accent-deep); font-size: .9rem; }
</style>
