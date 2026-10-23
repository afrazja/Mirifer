<script lang="ts">
	/**
	 * The lessons the learner has finished, from the dashboard. Tapping one opens it again. While a
	 * lesson is under way, they're listed but not opened, so its progress is kept.
	 */
	import { onMount } from 'svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import { getLanguage } from '$services/data-layer';

	let { data } = $props();
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	const n = (value: number) => (isFa ? value.toLocaleString('fa-IR') : String(value));
	onMount(() => { void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; }); });
	const name = (lesson: { number: number; theme: { en: string; fa: string } }) => (isFa ? `روز ${n(lesson.number)}: ${lesson.theme.fa}` : `Day ${lesson.number}: ${lesson.theme.en}`);
</script>

<svelte:head>
	<title>{isFa ? 'درس‌های تمام‌شده' : 'Lessons finished'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="finished" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/practice/english/progress" backLabel={isFa ? 'پیشرفت' : 'Progress'} direction={isFa ? 'rtl' : 'ltr'} />
	<h1>{isFa ? 'درس‌های تمام‌شده' : 'Lessons finished'}</h1>

	{#if !data.finished.length}
		<p class="note">{isFa ? 'وقتی اولین درس را تمام کنی، این‌جا می‌بینی‌اش.' : 'Finish your first lesson to see it here.'}</p>
	{:else}
		<p class="note">{data.inProgress
			? (isFa ? 'اول درس امروز را تمام کن؛ بعد می‌توانی هر کدام از این‌ها را دوباره انجام بدهی.' : 'Finish today’s lesson first. Then you can do any of these again.')
			: (isFa ? 'یکی را انتخاب کن تا دوباره انجامش بدهی.' : 'Tap one to do it again.')}</p>
		<ul class="list">
			{#each data.finished as lesson (lesson.id)}
				<li>
					{#if data.inProgress}
						<span class="item"><span class="tick" aria-hidden="true">✓</span><span class="name">{name(lesson)}</span></span>
					{:else}
						<a class="item" href={`/practice/english/today?day=${lesson.id}`}><span class="tick" aria-hidden="true">✓</span><span class="name">{name(lesson)}</span><span class="go" aria-hidden="true">{isFa ? '←' : '→'}</span></a>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</main>

<style>
	.finished { max-width: 680px; margin: 0 auto; padding: 16px 16px 48px; color: var(--ink); }
	h1 { font-family: var(--font-display); font-weight: 600; font-size: 1.9rem; margin: 18px 0 8px; }
	.note { margin: 0 0 14px; color: var(--ink-soft); line-height: 1.5; }
	.list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
	.item { display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 12px 16px; border: 1px solid var(--control-border); border-radius: 16px; background: var(--paper-raised); color: inherit; text-decoration: none; font-weight: 600; }
	a.item:hover { border-color: var(--accent); }
	a.item:focus-visible { outline: 3px solid var(--accent-deep); outline-offset: 2px; }
	.name { flex: 1; }
	.go { color: var(--accent-deep); }
	.tick { display: inline-grid; place-items: center; inline-size: 26px; block-size: 26px; border-radius: 50%; background: var(--accent-wash); color: var(--accent-deep); font-size: .8rem; font-weight: 700; flex: none; }
</style>
