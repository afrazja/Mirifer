<script lang="ts">
	/**
	 * The learner's dashboard, the first page of the English section: Mira's greeting (welcome back
	 * by name, or what to do the first time; tap to hear her), lessons finished (tap to see
	 * them), this week with the streak (today yellow, days with a lesson green, the rest white), and
	 * today's lesson by number and name, with one button to it. No tabs (owner's decision).
	 */
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import { getLanguage } from '$services/data-layer';
	import { lastSevenDays, streak } from '$lib/practice/learner-stats';
	import { dashboardGreeting, greetingKind, type DashboardMoment } from '$lib/practice/dashboard-greeting';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { playAudioPromise, stopAllAudio } from '$services/tts';

	let { data } = $props();
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	const n = (value: number) => (isFa ? value.toLocaleString('fa-IR') : String(value));
	/** Today on the learner's own device (the week strip and the streak use their calendar). */
	let today = $state<string | null>(null);
	onMount(() => {
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		const now = new Date();
		today = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
	});
	const week = $derived(today ? lastSevenDays(data.dates, today) : []);
	const inARow = $derived(today ? streak(data.dates, today) : 0);
	const weekday = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString(isFa ? 'fa-IR' : 'en-US', { weekday: 'narrow', timeZone: 'UTC' });
	const weekdayLong = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString(isFa ? 'fa-IR' : 'en-US', { weekday: 'long', timeZone: 'UTC' });
	const streakLine = $derived(inARow > 1
		? (isFa ? `${n(inARow)} روز پشت سر هم` : `${inARow} days in a row`)
		: inARow === 1 ? (today && data.dates.includes(today) ? (isFa ? 'امروز تمرین کردی' : 'You practiced today') : (isFa ? 'دیروز تمرین کردی' : 'You practiced yesterday'))
		: (isFa ? 'یک درس امروز، شروع یک زنجیره' : 'A lesson today starts a streak'));
	/** The device's calendar date for a stored time. */
	const localOf = (iso: string) => { const at = new Date(iso); return new Date(at.getTime() - at.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); };
	/** Today's lesson is already done (on this device's calendar): the next one opens tomorrow. */
	const doneToday = $derived(!data.inProgress && !!today && !!data.lastDoneAt && localOf(data.lastDoneAt) === today);
	const dayName = (number: number) => (isFa ? `روز ${n(number)}` : `Day ${number}`);
	const lessonLabel = $derived(data.caughtUp ? (isFa ? 'آخرین درس' : 'Latest lesson') : doneToday ? (isFa ? 'درس بعدی' : 'Next lesson') : (isFa ? 'درس امروز' : 'Today’s lesson'));
	const lessonNote = $derived(data.caughtUp
		? (isFa ? 'همهٔ درس‌ها را تا این‌جا تمام کرده‌ای. درس بعدی به‌زودی آماده می‌شود.' : 'You’ve finished every lesson so far. The next one is coming soon.')
		: doneToday ? (isFa ? 'درس امروز تمام شد. این درس فردا باز می‌شود.' : 'Today’s lesson is done. This one opens tomorrow.')
		: null);
	const button = $derived(data.inProgress
		? { label: isFa ? `ادامهٔ ${dayName(data.lesson.number)}` : `Continue ${dayName(data.lesson.number)}`, href: '/practice/english/today' }
		: doneToday ? { label: isFa ? 'درس امروز را ببین' : 'See today’s lesson', href: '/practice/english/today' }
		: data.caughtUp ? { label: isFa ? `${dayName(data.lesson.number)} را دوباره انجام بده` : `Do ${dayName(data.lesson.number)} again`, href: `/practice/english/today?day=${data.lesson.id}` }
		: { label: isFa ? `شروع ${dayName(data.lesson.number)}` : `Start ${dayName(data.lesson.number)}`, href: '/practice/english/today' });

	/** Days since the learner's last day with a lesson (null if none). */
	const daysAway = $derived(today && data.dates.length ? Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${data.dates.at(-1)}T00:00:00Z`)) / 86_400_000) : null);
	const moment = $derived<DashboardMoment>({
		name: data.name, finished: data.finished, activeDays: data.dates.length, inProgress: data.inProgress, doneToday, caughtUp: data.caughtUp,
		streak: inARow, activeToday: !!today && data.dates.includes(today), daysAway, lessonNumber: data.lesson.number
	});
	const greeting = $derived(dashboardGreeting(moment));
	/** The very first visit: only Mira, today's lesson and the button (nothing to count yet). */
	const firstVisit = $derived(greetingKind(moment) === 'first');
	/** Mira says her line in English when tapped (phones only play sound from a tap). */
	let speaking = $state(false);
	function hearMira() {
		stopAllAudio();
		if (speaking) { speaking = false; return; }
		speaking = true;
		void playAudioPromise(greeting.en, COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {}).finally(() => { speaking = false; });
	}
	onDestroy(() => stopAllAudio());
</script>

<svelte:head>
	<title>{isFa ? 'پیشرفت تو' : 'Your progress'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="progress" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/languages" backLabel={isFa ? 'زبان‌ها' : 'Languages'} direction={isFa ? 'rtl' : 'ltr'} />
	<h1 class="sr-only">{isFa ? 'پیشرفت تو' : 'Your progress'}</h1>

	{#if today}
		<section class="mira" aria-labelledby="mira-name">
			<span class="avatar" aria-hidden="true">M</span>
			<div class="bubble">
				<p id="mira-name" class="who">{isFa ? 'میرا' : 'Mira'}</p>
				<p class="line">{isFa ? greeting.fa : greeting.en}</p>
			</div>
			<button class="listen" type="button" onclick={hearMira} aria-pressed={speaking} aria-label={isFa ? 'شنیدن صدای میرا به انگلیسی' : 'Hear Mira say it'}>
				{#if speaking}<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></svg>
				{:else}<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" /><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>{/if}
			</button>
		</section>
	{/if}

	{#if firstVisit}
		<!-- The first visit: nothing to count yet, so only today's lesson and the button. -->
	{:else if data.finished}
		<a class="card link" href="/practice/english/finished">
			<span class="label">{isFa ? 'درس‌های تمام‌شده' : 'Lessons finished'}</span>
			<span class="row"><span class="big">{n(data.finished)}</span><span class="see">{isFa ? 'ببین' : 'See them'} <span aria-hidden="true">{isFa ? '←' : '→'}</span></span></span>
		</a>
	{:else}
		<section class="card" aria-labelledby="lessons-title">
			<h2 id="lessons-title" class="label">{isFa ? 'درس‌های تمام‌شده' : 'Lessons finished'}</h2>
			<p class="big">{n(0)}</p>
			<p class="note">{isFa ? 'وقتی اولین درس را تمام کنی، این‌جا می‌بینی‌اش.' : 'Finish your first lesson to see it here.'}</p>
		</section>
	{/if}

	{#if !firstVisit}
	<section class="card" aria-labelledby="week-title">
		<h2 id="week-title" class="label">{isFa ? 'این هفته' : 'This week'}</h2>
		{#if data.eventsLoaded && week.length}
			<p class="streak">{streakLine}</p>
			<ol class="week">
				{#each week as day (day.date)}
					<li class:active={day.active} class:today={day.date === today} aria-label={`${day.date === today ? (isFa ? 'امروز، ' : 'Today, ') : ''}${weekdayLong(day.date)}: ${day.active ? (isFa ? 'تمرین کردی' : 'practiced') : (isFa ? 'تمرین نکردی' : 'no lesson')}`} aria-current={day.date === today ? 'date' : undefined}>
						<span class="dot" aria-hidden="true">{day.active ? '✓' : ''}</span>
						<span class="weekday" aria-hidden="true">{weekday(day.date)}</span>
					</li>
				{/each}
			</ol>
		{:else if !data.eventsLoaded}
			<p class="note">{isFa ? 'الان نشد این هفته را نشان بدهیم. بعداً دوباره سر بزن.' : 'We couldn’t load this week right now. Check back later.'}</p>
		{/if}
	</section>
	{/if}

	<section class="card" aria-labelledby="lesson-title">
		<h2 id="lesson-title" class="label">{lessonLabel}</h2>
		<p class="big">{dayName(data.lesson.number)}</p>
		<p class="theme">{isFa ? data.lesson.theme.fa : data.lesson.theme.en}</p>
		{#if lessonNote}<p class="note">{lessonNote}</p>{/if}
	</section>

	<div class="bar-space" aria-hidden="true"></div>
	<ActionBar label={button.label} onclick={() => void goto(button.href)} />
</main>

<style>
	.progress { max-width: 680px; margin: 0 auto; padding: 16px 16px 48px; color: var(--ink); }
	.mira { display: flex; align-items: flex-start; gap: 10px; margin: 18px 0 16px; }
	.avatar { display: grid; place-items: center; flex: none; inline-size: 44px; block-size: 44px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; font-size: 1.2rem; }
	.bubble { flex: 1; padding: 12px 14px; border-radius: 4px 18px 18px 18px; background: var(--accent-wash); }
	[dir='rtl'] .bubble { border-radius: 18px 4px 18px 18px; }
	.who { margin: 0 0 2px; font-weight: 700; font-size: .9rem; color: var(--accent-deep); }
	.line { margin: 0; font-size: 1.05rem; line-height: 1.55; }
	.listen { display: grid; place-items: center; flex: none; inline-size: 44px; block-size: 44px; border: 1px solid var(--control-border); border-radius: 50%; background: var(--paper-raised); color: var(--accent-deep); cursor: pointer; }
	.listen:hover { border-color: var(--accent); }
	.listen:focus-visible { outline: 3px solid var(--accent-deep); outline-offset: 2px; }
	.card { display: block; padding: 18px; margin-bottom: 12px; border: 1px solid var(--control-border); border-radius: 18px; background: var(--paper-raised); box-shadow: var(--paper-shadow); color: inherit; text-decoration: none; }
	.card.link { min-height: 44px; }
	.card.link:hover { border-color: var(--accent); }
	.card.link:focus-visible { outline: 3px solid var(--accent-deep); outline-offset: 2px; }
	.label { display: block; margin: 0; font-size: .82rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-soft); }
	[dir='rtl'] .label { letter-spacing: 0; font-size: .95rem; }
	.row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
	.big { display: block; margin: 4px 0 6px; font-family: var(--font-display); font-size: 2.4rem; font-weight: 600; color: var(--accent-deep); line-height: 1.1; }
	.see { color: var(--accent-deep); font-weight: 600; }
	.note { margin: 6px 0 0; color: var(--ink-soft); font-size: .92rem; line-height: 1.5; }
	.streak { margin: 6px 0 0; font-weight: 600; }
	.week { list-style: none; margin: 12px 0 0; padding: 0; display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; text-align: center; }
	.week li { display: grid; justify-items: center; gap: 4px; }
	/* Not done: white. Done: green. Today: yellow (green with a yellow ring once done). */
	.dot { display: grid; place-items: center; inline-size: 32px; block-size: 32px; border-radius: 50%; border: 2px solid var(--control-border); background: #fff; color: #fff; font-size: .8rem; font-weight: 700; box-sizing: border-box; }
	.week li.active .dot { background: var(--accent); border-color: var(--accent); }
	.week li.today .dot { background: #ffd65a; border-color: #e0b52c; }
	.week li.today.active .dot { background: var(--accent); border-color: var(--accent); box-shadow: 0 0 0 3px #ffd65a; }
	.weekday { font-size: .8rem; color: var(--ink-soft); }
	.week li.today .weekday { color: var(--ink); font-weight: 700; }
	.theme { margin: 0; font-weight: 600; }
	.bar-space { block-size: 120px; }
</style>
