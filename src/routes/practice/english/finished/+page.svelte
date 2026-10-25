<script lang="ts">
	/**
	 * The lessons the learner has finished, from the dashboard. Tapping one opens it again. The lesson
	 * already under way opens where the learner left it; another one, while a lesson is under way,
	 * first asks on its own screen (its place would be lost).
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import { dayById } from '$lib/practice/day';
	import { getLanguage } from '$services/data-layer';

	let { data } = $props();
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	const n = (value: number) => (isFa ? value.toLocaleString('fa-IR') : String(value));
	onMount(() => { void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; }); });
	const name = (lesson: { number: number; theme: { en: string; fa: string } }) => (isFa ? `روز ${n(lesson.number)}: ${lesson.theme.fa}` : `Day ${lesson.number}: ${lesson.theme.en}`);
	type Lesson = (typeof data.finished)[number];
	/** The lesson under way, if any. */
	const current = $derived(data.underWay ? dayById(data.underWay) : null);
	const dayName = (number: number) => (isFa ? `روز ${n(number)}` : `Day ${number}`);
	/** Another lesson tapped while one is under way: asks first. */
	let confirming = $state<Lesson | null>(null);
</script>

<svelte:head>
	<title>{isFa ? 'درس‌های تمام‌شده' : 'Lessons finished'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="finished" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/practice/english/progress" backLabel={isFa ? 'پیشرفت' : 'Progress'} direction={isFa ? 'rtl' : 'ltr'} />
	{#if confirming && current}
		<h1>{isFa ? `${dayName(confirming.number)} را دوباره شروع می‌کنی؟` : `Start ${dayName(confirming.number)} again?`}</h1>
		<p class="note">{isFa ? `الان وسط ${dayName(current.number)} هستی. اگر ${dayName(confirming.number)} را شروع کنی، جایی که در ${dayName(current.number)} بودی از دست می‌رود.` : `You’re in the middle of ${dayName(current.number)}. If you start ${dayName(confirming.number)} again, you’ll lose your place in ${dayName(current.number)}.`}</p>
		<ActionBar label={isFa ? `شروع ${dayName(confirming.number)}` : `Start ${dayName(confirming.number)}`} onclick={() => confirming && void goto(`/practice/english/today?day=${confirming.id}&replace=1`)} secondary={{ label: isFa ? `${dayName(current.number)} را نگه دار` : `Keep ${dayName(current.number)}`, onclick: () => (confirming = null) }} />
	{:else}
	<h1>{isFa ? 'درس‌های تمام‌شده' : 'Lessons finished'}</h1>

	{#if !data.finished.length}
		<p class="note">{isFa ? 'وقتی اولین درس را تمام کنی، این‌جا می‌بینی‌اش.' : 'Finish your first lesson to see it here.'}</p>
	{:else}
		<p class="note">{isFa ? 'یکی را انتخاب کن تا دوباره انجامش بدهی.' : 'Tap one to do it again.'}</p>
		<ul class="list">
			{#each data.finished as lesson (lesson.id)}
				<li>
					{#if data.inProgress && lesson.id === data.underWay}
						<a class="item" href="/practice/english/today"><span class="tick" aria-hidden="true">✓</span><span class="name">{name(lesson)}<small class="tag">{isFa ? 'در حال انجام: ادامه بده' : 'In progress: continue'}</small></span><span class="go" aria-hidden="true">{isFa ? '←' : '→'}</span></a>
					{:else if data.inProgress}
						<button class="item" type="button" onclick={() => (confirming = lesson)}><span class="tick" aria-hidden="true">✓</span><span class="name">{name(lesson)}</span><span class="go" aria-hidden="true">{isFa ? '←' : '→'}</span></button>
					{:else}
						<a class="item" href={`/practice/english/today?day=${lesson.id}`}><span class="tick" aria-hidden="true">✓</span><span class="name">{name(lesson)}</span><span class="go" aria-hidden="true">{isFa ? '←' : '→'}</span></a>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
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
	button.item { inline-size: 100%; font: inherit; font-weight: 600; text-align: start; cursor: pointer; }
	button.item:hover { border-color: var(--accent); }
	button.item:focus-visible { outline: 3px solid var(--accent-deep); outline-offset: 2px; }
	.tag { display: block; margin-top: 2px; color: var(--accent-deep); font-size: .82rem; font-weight: 600; }
	.go { color: var(--accent-deep); }
	.tick { display: inline-grid; place-items: center; inline-size: 26px; block-size: 26px; border-radius: 50%; background: var(--accent-wash); color: var(--accent-deep); font-size: .8rem; font-weight: 700; flex: none; }
</style>
