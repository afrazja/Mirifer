<script lang="ts">
	/**
	 * The owner's list of daily lessons: one row per day, with its theme and whether learners
	 * get it yet. A row opens that day on the Today page (`?day=`); a day with two versions has a
	 * link for each (`&track=`).
	 */
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import EnglishModuleTabs from '$lib/components/EnglishModuleTabs.svelte';
	import { DAYS, TRACKS, TRACK_NAMES, themeOf, type DayModule, type DayPack } from '$lib/practice/day';
	import { getLanguage } from '$services/data-layer';

	let { data }: PageProps = $props();
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	onMount(() => { void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; }); });

	const num = (value: number) => (isFa ? value.toLocaleString('fa-IR') : String(value));
	/** Live, or how many of its parts (across both lengths) are built. */
	function status(day: DayPack): string {
		if (day.ready) return isFa ? 'آماده برای زبان‌آموزها' : 'Live for learners';
		if (day.tracks) return isFa ? 'در حال ساخت' : 'Being built';
		return isFa ? `در حال ساخت؛ ${built(day.modules)}` : `Being built: ${built(day.modules)}`;
	}
	/** "2 of 5 parts ready". */
	function built(modules: DayModule[]): string {
		const done = modules.filter(part => part.built).length;
		return isFa ? `${num(done)} از ${num(modules.length)} بخش آماده` : `${done} of ${modules.length} parts ready`;
	}
</script>

<svelte:head>
	<title>{isFa ? 'درس‌های روزانه | انگلیسی' : 'Daily lessons | English'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="days" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/practice/english/home" backLabel={isFa ? 'انگلیسی' : 'English'} direction={isFa ? 'rtl' : 'ltr'} />
	<EnglishModuleTabs current="today" {isFa} />
	<h1>{isFa ? 'درس‌های روزانه' : 'Daily lessons'}</h1>
	<ul class="list">
		{#each DAYS as day}
			<li>
				{#if day.tracks}
					<div class="day versions">
						<span class="number">{isFa ? `روز ${num(day.number)}` : `Day ${day.number}`}</span>
						<span class="meta">
							<span class="status" class:live={day.ready}>{status(day)}</span>
							{#if data.openDayId === day.id}<span class="tag">{isFa ? 'نیمه‌کاره' : 'In progress'}</span>
							{:else if data.nextDayId === day.id}<span class="tag">{isFa ? 'روز بعدی تو' : 'Your next day'}</span>{/if}
						</span>
						<span class="links">
							{#each TRACKS as track}
								<a class="version" href={`/practice/english/today?day=${day.id}&track=${track}`}>
									<span class="version-name">{isFa ? themeOf(day, track).fa : themeOf(day, track).en}</span>
									<span class="version-meta">{isFa ? TRACK_NAMES[track].fa : TRACK_NAMES[track].en}{isFa ? '، ' : ' · '}{built(day.tracks[track])}</span>
									<span class="arrow" aria-hidden="true">{isFa ? '←' : '→'}</span>
								</a>
							{/each}
						</span>
					</div>
				{:else}
					<a class="day" href={`/practice/english/today?day=${day.id}`}>
						<span class="number">{isFa ? `روز ${num(day.number)}` : `Day ${day.number}`}</span>
						<span class="theme">{isFa ? day.theme.fa : day.theme.en}</span>
						<span class="meta">
							<span class="status" class:live={day.ready}>{status(day)}</span>
							{#if data.openDayId === day.id}<span class="tag">{isFa ? 'نیمه‌کاره' : 'In progress'}</span>
							{:else if data.nextDayId === day.id}<span class="tag">{isFa ? 'روز بعدی تو' : 'Your next day'}</span>{/if}
						</span>
						<span class="arrow" aria-hidden="true">{isFa ? '←' : '→'}</span>
					</a>
				{/if}
			</li>
		{/each}
	</ul>
	<p class="note">{isFa ? 'زبان‌آموزها فهرست را نمی‌بینند؛ هر روز درس آمادهٔ بعدی‌شان را می‌گیرند.' : 'Learners don’t see this list; each day they get their next ready lesson.'}</p>
</main>

<style>
	.days { max-width: 760px; margin: 0 auto; padding: 0 16px 48px; }
	h1 { margin: 18px 0 14px; font-family: var(--font-display); }
	.list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
	.day { display: grid; grid-template-columns: 1fr auto; grid-template-areas: 'number arrow' 'theme arrow' 'meta arrow'; align-items: center; gap: 4px 12px; padding: 16px 20px; border: 1px solid var(--line); border-radius: 18px; background: var(--paper-raised); color: var(--ink); text-decoration: none; }
	a.day:hover { border-color: var(--accent); }
	.day.versions { grid-template-columns: 1fr; grid-template-areas: 'number' 'meta' 'links'; }
	.links { grid-area: links; display: grid; gap: 8px; margin-top: 10px; }
	.version { display: grid; grid-template-columns: 1fr auto; grid-template-areas: 'name arrow' 'vmeta arrow'; align-items: center; gap: 2px 12px; min-height: 56px; padding: 10px 14px; border: 1px solid var(--line); border-radius: 14px; background: var(--paper); color: var(--ink); text-decoration: none; }
	.version:hover { border-color: var(--accent); }
	.version:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
	.version-name { grid-area: name; font-weight: 700; }
	.version-meta { grid-area: vmeta; color: var(--ink-soft); font-size: .88rem; }
	.version .arrow { grid-area: arrow; }
	.day:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
	.number { grid-area: number; color: var(--accent-deep); font-size: .8rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
	.theme { grid-area: theme; font-size: 1.15rem; font-weight: 700; line-height: 1.3; }
	.meta { grid-area: meta; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 4px; }
	.status { color: var(--ink-soft); font-size: .9rem; }
	.status.live { color: var(--accent-deep); font-weight: 600; }
	.tag { padding: 2px 10px; border-radius: 999px; background: var(--paper-sunken); color: var(--ink); font-size: .82rem; font-weight: 600; }
	.arrow { grid-area: arrow; font-size: 1.2rem; color: var(--ink-soft); }
	.note { margin: 18px 4px 0; color: var(--ink-soft); font-size: .9rem; }
</style>
