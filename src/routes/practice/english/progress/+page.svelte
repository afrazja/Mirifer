<script lang="ts">
	/**
	 * The learner's dashboard, the first page of the English section (owner's layout): today's
	 * lesson on top (by number and name, and where a paused one stopped), then this week with the
	 * streak (today yellow, days with a lesson green, the rest white), then the lessons finished
	 * (tap to see them), and one button to the lesson. No tabs.
	 *
	 * Mira says hello by voice only (owner's decision: no text): one short line for the moment,
	 * once a day per moment, when the page opens. Her button on the lesson card says it again
	 * (a phone may only play sound after a tap).
	 */
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import { onlyOpenCourse } from '$lib/courses';
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
	const lessonNote = $derived(data.resume
		? (data.resume.recap
			? (isFa ? 'فقط مرور کوتاه آخر مانده.' : 'Only the short recap is left.')
			: isFa ? `جایی که ماندی: مرحلهٔ ${n(data.resume.step)} از ${n(data.resume.steps)}${data.resume.title ? `، ${data.resume.title.fa}` : ''}.` : `You stopped at step ${data.resume.step} of ${data.resume.steps}${data.resume.title ? `: ${data.resume.title.en}` : ''}.`)
		: data.caughtUp
		? (isFa ? 'همهٔ درس‌ها را تا این‌جا تمام کرده‌ای. درس بعدی به‌زودی آماده می‌شود.' : 'You’ve finished every lesson so far. The next one is coming soon.')
		: doneToday ? (isFa ? 'درس امروز تمام شد. این درس فردا باز می‌شود.' : 'Today’s lesson is done. This one opens tomorrow.')
		: null);
	const button = $derived(data.inProgress
		? { label: isFa ? `ادامهٔ ${dayName(data.lesson.number)}` : `Resume ${dayName(data.lesson.number)}`, href: '/practice/english/today' }
		: doneToday ? { label: isFa ? 'درس امروز را ببین' : 'See today’s lesson', href: '/practice/english/today' }
		: data.caughtUp ? { label: isFa ? `${dayName(data.lesson.number)} را دوباره انجام بده` : `Do ${dayName(data.lesson.number)} again`, href: `/practice/english/today?day=${data.lesson.id}` }
		: { label: isFa ? `شروع ${dayName(data.lesson.number)}` : `Start ${dayName(data.lesson.number)}`, href: '/practice/english/today' });

	/** Days since the learner's last day with a lesson (null if none). */
	const daysAway = $derived(today && data.dates.length ? Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${data.dates.at(-1)}T00:00:00Z`)) / 86_400_000) : null);
	const moment = $derived<DashboardMoment>({
		name: data.name, finished: data.finished, activeDays: data.dates.length, inProgress: data.inProgress, doneToday, caughtUp: data.caughtUp,
		streak: inARow, activeToday: !!today && data.dates.includes(today), daysAway, lessonNumber: data.lesson.number
	});
	const greeting = $derived(today ? dashboardGreeting(moment, today) : '');
	let speaking = $state(false);
	function say() {
		stopAllAudio();
		speaking = true;
		void playAudioPromise(greeting, COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {}).finally(() => { speaking = false; });
	}
	/** Her button: say it again, or stop. */
	function hearMira() {
		if (speaking) { stopAllAudio(); speaking = false; return; }
		say();
	}
	/** Once a day per moment: coming back after a pause is a new moment, a reload isn't. */
	const HELLO_KEY = 'mirifer_mira_hello';
	let greeted = false;
	$effect(() => {
		if (!today || greeted) return;
		greeted = true;
		const mark = `${today}|${greetingKind(moment)}`;
		try { if (localStorage.getItem(HELLO_KEY) === mark) return; localStorage.setItem(HELLO_KEY, mark); } catch { /* private mode: say it */ }
		say();
	});
	function go(href: string) { stopAllAudio(); void goto(href); }
	onDestroy(() => stopAllAudio());
</script>

<svelte:head>
	<title>{isFa ? 'پیشرفت تو' : 'Your progress'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="progress" dir={isFa ? 'rtl' : 'ltr'}>
	<!-- The English home: nothing to go back to (the language list steps aside while English is the only course). -->
	<AppHeader backHref={onlyOpenCourse() ? undefined : '/languages'} backLabel={isFa ? 'زبان‌ها' : 'Languages'} direction={isFa ? 'rtl' : 'ltr'} />
	<h1>{isFa ? 'پیشرفت تو' : 'Your progress'}</h1>

	<section class="card" aria-labelledby="lesson-title">
		<div class="card-head">
			<h2 id="lesson-title" class="label">{lessonLabel}</h2>
			<button class="mira" class:speaking type="button" onclick={hearMira} aria-pressed={speaking} aria-label={speaking ? (isFa ? 'قطع صدای میرا' : 'Stop Mira') : (isFa ? 'شنیدن صدای میرا' : 'Hear Mira')}>
				<span class="avatar" aria-hidden="true">M</span>
				<svg class="wave" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" /><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
			</button>
		</div>
		<p class="big">{dayName(data.lesson.number)}</p>
		<p class="theme">{isFa ? data.lesson.theme.fa : data.lesson.theme.en}</p>
		{#if lessonNote}<p class="note">{lessonNote}</p>{/if}
	</section>

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

	{#if data.finished}
		<a class="card link" href="/practice/english/finished" onclick={stopAllAudio}>
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

	<div class="bar-space" aria-hidden="true"></div>
	<ActionBar label={button.label} onclick={() => go(button.href)} attention={!!today && greetingKind(moment) === 'first'} />
</main>

<style>
	.progress { max-width: 680px; margin: 0 auto; padding: 16px 16px 48px; color: var(--ink); }
	h1 { font-family: var(--font-display); font-weight: 600; font-size: 1.9rem; margin: 18px 0 14px; }
	.card-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
	/* Mira's button: her avatar with a sound mark; it pulses while she speaks. */
	.mira { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 4px 12px 4px 4px; border: 1px solid var(--control-border); border-radius: 999px; background: var(--paper-raised); color: var(--accent-deep); cursor: pointer; }
	[dir='rtl'] .mira { padding: 4px 4px 4px 12px; }
	.mira:hover { border-color: var(--accent); }
	.mira:focus-visible { outline: 3px solid var(--accent-deep); outline-offset: 2px; }
	.avatar { display: grid; place-items: center; inline-size: 34px; block-size: 34px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.mira.speaking .avatar { animation: talk 1s ease-in-out infinite; }
	@keyframes talk { 0%, 100% { box-shadow: 0 0 0 0 rgb(255 214 90 / .9); } 50% { box-shadow: 0 0 0 6px rgb(255 214 90 / .35); } }
	@media (prefers-reduced-motion: reduce) { .mira.speaking .avatar { animation: none; box-shadow: 0 0 0 3px #ffd65a; } }
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
