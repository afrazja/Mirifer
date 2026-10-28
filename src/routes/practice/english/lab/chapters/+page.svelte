<script lang="ts">
	/**
	 * Module lab: every chapter, its steps in each version, and any step opened on its own, with that
	 * chapter's content (owner's request: review a module without going through the path from the
	 * start). Runs here never touch the learner's path.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import { DAYS, TRACKS, TRACK_NAMES, arcOf, dayById, minutesOf, type DayPack, type Track } from '$lib/practice/day';
	import { chapterModules } from '$lib/practice/path';
	import { getLanguage } from '$services/data-layer';

	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const KEY = 'mirifer_lab_chapter';

	const ARC_NAMES: Record<string, { en: string; fa: string }> = { travel: { en: 'Travel', fa: 'سفر' }, everyday: { en: 'Everyday', fa: 'روزمره' } };
	/** "Travel 2", "Everyday 1": the chapter's place in its own story. */
	const label = (day: DayPack) => {
		const arc = arcOf(day);
		const n = DAYS.filter(d => arcOf(d) === arc).indexOf(day) + 1;
		const name = ARC_NAMES[arc] ?? { en: arc, fa: arc };
		return isFa ? `${name.fa} ${n.toLocaleString('fa-IR')}` : `${name.en} ${n}`;
	};
	const status = (day: DayPack) => (day.ready ? null : day.pilot ? T('pilot', 'آزمایشی') : T('not released', 'منتشرنشده'));

	let dayId = $state(page.url.searchParams.get('day') ?? '');
	let track = $state<Track>(page.url.searchParams.get('track') === 'professional' ? 'professional' : 'intermediate');
	const day = $derived(dayById(dayId) ?? DAYS.at(-1)!);
	const steps = $derived(chapterModules(day, track));

	function choose(next: { day?: string; track?: Track }) {
		if (next.day) dayId = next.day;
		if (next.track) track = next.track;
		try { localStorage.setItem(KEY, JSON.stringify({ day: day.id, track })); } catch { /* not remembered */ }
		void goto(`?day=${day.id}&track=${track}`, { replaceState: true, keepFocus: true, noScroll: true });
	}

	onMount(() => {
		if (!page.url.searchParams.get('day')) {
			try {
				const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
				if (saved && dayById(saved.day)) { dayId = saved.day; if (TRACKS.includes(saved.track)) track = saved.track; }
			} catch { /* first visit */ }
		}
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
	});
</script>

<svelte:head>
	<title>{T('Chapters', 'فصل‌ها')} | {T('Module lab', 'آزمایشگاه بخش‌ها')} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="lab" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/practice/english/lab" backLabel={T('Module lab', 'آزمایشگاه بخش‌ها')} direction={isFa ? 'rtl' : 'ltr'} />
	<p class="eyebrow">{T('MODULE LAB · CHAPTERS', 'آزمایشگاه — فصل‌ها')}</p>
	<h1>{T('Try any step', 'هر مرحله را امتحان کن')}</h1>
	<p class="small">{T('Open any step of any chapter on its own. Your path doesn’t change.', 'هر مرحله از هر فصل را جداگانه باز کن. مسیرت تغییری نمی‌کند.')}</p>

	<div class="pills" role="group" aria-label={T('Chapter', 'فصل')}>
		{#each DAYS as option}
			<button type="button" aria-pressed={option.id === day.id} onclick={() => choose({ day: option.id })}>{label(option)}</button>
		{/each}
	</div>
	<div class="pills" role="group" aria-label={T('Version', 'نسخه')}>
		{#each TRACKS as option}
			<button type="button" aria-pressed={option === track} onclick={() => choose({ track: option })}>{isFa ? TRACK_NAMES[option].fa : TRACK_NAMES[option].en}</button>
		{/each}
	</div>

	<h2>{isFa ? day.theme.fa : day.theme.en}{#if status(day)}<span class="tag">{status(day)}</span>{/if}</h2>
	<ol class="steps">
		{#each steps as mod, i}
			<li>
				<a class="step" href={`/practice/english/lab/chapters/step?day=${day.id}&track=${track}&module=${mod.id}`}>
					<span class="num" aria-hidden="true">{isFa ? (i + 1).toLocaleString('fa-IR') : i + 1}</span>
					<span class="text">
						<strong>{isFa ? mod.title.fa : mod.title.en}</strong>
						<small>{isFa ? mod.does.fa : mod.does.en}</small>
					</span>
					<span class="min">{T(`${minutesOf(mod, 20)} min`, `${minutesOf(mod, 20).toLocaleString('fa-IR')} دقیقه`)}</span>
				</a>
			</li>
		{/each}
	</ol>
</main>

<style>
	.lab { max-width: 680px; margin: 0 auto; padding: 0 16px 48px; }
	.eyebrow { margin: 16px 0 4px; font-size: .78rem; font-weight: 700; letter-spacing: .08em; color: var(--accent-deep); }
	:global([dir='rtl']) .eyebrow { letter-spacing: normal; }
	h1 { margin: 0 0 6px; font-family: var(--font-display); }
	h2 { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 18px 0 10px; font-size: 1.15rem; }
	.small { margin: 0 0 14px; color: var(--ink-soft); font-size: .9rem; line-height: 1.5; }
	.pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
	.pills button { min-height: 44px; padding: 8px 14px; border: 1px solid var(--control-border); border-radius: 999px; background: var(--control); color: var(--ink); font: inherit; font-size: .92rem; cursor: pointer; }
	.pills button[aria-pressed='true'] { border-color: var(--accent); background: var(--accent); color: var(--on-accent); font-weight: 600; }
	.tag { padding: 2px 10px; border-radius: 999px; background: var(--attention-wash); color: var(--attention); font-size: .78rem; font-weight: 600; }
	.steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
	.step { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; min-height: 64px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 14px; background: var(--paper-raised); color: var(--ink); text-decoration: none; }
	.step:hover { border-color: var(--accent); }
	.num { display: grid; place-items: center; inline-size: 32px; block-size: 32px; border-radius: 50%; background: var(--accent-wash); color: var(--accent-deep); font-weight: 700; }
	.text { display: grid; gap: 2px; }
	.text small { color: var(--ink-soft); line-height: 1.45; }
	.min { color: var(--ink-soft); font-size: .82rem; white-space: nowrap; }
	button:focus-visible, .step:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
</style>
