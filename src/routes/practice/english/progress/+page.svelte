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
	import { calendarWeek, streak, weekStartDay } from '$lib/practice/learner-stats';
	import { dashboardGreeting, greetingKind, type DashboardMoment } from '$lib/practice/dashboard-greeting';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { playAudioPromise, stopAllAudio } from '$services/tts';

	let { data } = $props();
	/** The step path (owner's test accounts first): the next step instead of today's lesson. */
	const path = $derived('path' in data ? data.path : null);
	type LessonData = { [K in 'lesson' | 'finished' | 'inProgress' | 'caughtUp' | 'resume' | 'lastDoneAt']-?: Exclude<(typeof data)[K], undefined> };
	/** The daily lessons (everyone else, until the step path is rolled out). */
	const lesson = $derived(path ? null : (data as unknown as LessonData));
	/** The learner's local day as a number (the path saves each step's day this way). */
	const localDayNumber = () => { const now = new Date(); return Math.floor((now.getTime() - now.getTimezoneOffset() * 60_000) / 86_400_000); };
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	const n = (value: number) => (isFa ? value.toLocaleString('fa-IR') : String(value));
	/** Today on the learner's own device (the week strip and the streak use their calendar). */
	let today = $state<string | null>(null);
	/** The first day of the learner's week (Saturday in Iran). */
	let firstDay = $state(1);
	onMount(() => {
		try { firstDay = weekStartDay(Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.language); } catch { /* Monday */ }
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		const now = new Date();
		today = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
	});
	/** A step saved today counts even if its event was lost. */
	const goalDone = $derived(!!path && !!today && (data.dates.includes(today) || path.lastDoneDay === localDayNumber()));
	const dates = $derived(goalDone && today && !data.dates.includes(today) ? [...data.dates, today] : data.dates);
	const week = $derived(today ? calendarWeek(dates, today, firstDay) : []);
	const inARow = $derived(today ? streak(dates, today) : 0);
	const weekday = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString(isFa ? 'fa-IR' : 'en-US', { weekday: 'narrow', timeZone: 'UTC' });
	const weekdayLong = (date: string) => new Date(`${date}T12:00:00Z`).toLocaleDateString(isFa ? 'fa-IR' : 'en-US', { weekday: 'long', timeZone: 'UTC' });
	const streakLine = $derived(inARow > 1
		? (isFa ? `${n(inARow)} روز پشت سر هم` : `${inARow} days in a row`)
		: inARow === 1 ? (today && dates.includes(today) ? (isFa ? 'امروز تمرین کردی' : 'You practiced today') : (isFa ? 'دیروز تمرین کردی' : 'You practiced yesterday'))
		: path ? (isFa ? 'یک مرحله امروز، شروع یک زنجیره' : 'One step today starts a streak')
		: (isFa ? 'یک درس امروز، شروع یک زنجیره' : 'A lesson today starts a streak'));
	/** The device's calendar date for a stored time. */
	const localOf = (iso: string) => { const at = new Date(iso); return new Date(at.getTime() - at.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); };
	/** Today's lesson is already done (on this device's calendar): the next one opens tomorrow. */
	const doneToday = $derived(path ? goalDone : !lesson!.inProgress && !!today && !!lesson!.lastDoneAt && localOf(lesson!.lastDoneAt) === today);
	const dayName = (number: number) => (isFa ? `روز ${n(number)}` : `Day ${number}`);
	const lessonLabel = $derived(!lesson ? '' : lesson.caughtUp ? (isFa ? 'آخرین درس' : 'Latest lesson') : doneToday ? (isFa ? 'درس بعدی' : 'Next lesson') : (isFa ? 'درس امروز' : 'Today’s lesson'));
	const lessonNote = $derived(!lesson ? null : lesson.resume
		? (lesson.resume.recap
			? (isFa ? 'فقط مرور کوتاه آخر مانده.' : 'Only the short recap is left.')
			: isFa ? `جایی که ماندی: مرحلهٔ ${n(lesson.resume.step)} از ${n(lesson.resume.steps)}${lesson.resume.title ? `، ${lesson.resume.title.fa}` : ''}.` : `You stopped at step ${lesson.resume.step} of ${lesson.resume.steps}${lesson.resume.title ? `: ${lesson.resume.title.en}` : ''}.`)
		: lesson.caughtUp
		? (isFa ? 'همهٔ درس‌ها را تا این‌جا تمام کرده‌ای. درس بعدی به‌زودی آماده می‌شود.' : 'You’ve finished every lesson so far. The next one is coming soon.')
		: doneToday ? (isFa ? 'درس امروز تمام شد. این درس فردا باز می‌شود.' : 'Today’s lesson is done. This one opens tomorrow.')
		: null);
	const button = $derived(path
		? (!path.step ? (path.comingSoon ? { label: isFa ? 'مسیرت را ببین' : 'See your path', href: '/practice/english/path' } : { label: isFa ? 'شروع' : 'Start', href: '/practice/english/step' })
			: { label: path.underWay ? (isFa ? 'ادامه' : 'Continue') : path.replay ? (isFa ? 'دوباره تمرین کن' : 'Practice again') : path.step.topic ? (isFa ? 'شروع گپ' : 'Start the chat') : (isFa ? `شروع مرحلهٔ ${n(path.step.index + 1)}` : `Start step ${path.step.index + 1}`), href: `/practice/english/step?step=${encodeURIComponent(path.step.id)}` })
		: lesson!.inProgress
		? { label: isFa ? `ادامهٔ ${dayName(lesson!.lesson.number)}` : `Resume ${dayName(lesson!.lesson.number)}`, href: '/practice/english/today' }
		: doneToday ? { label: isFa ? 'درس امروز را ببین' : 'See today’s lesson', href: '/practice/english/today' }
		: lesson!.caughtUp ? { label: isFa ? `${dayName(lesson!.lesson.number)} را دوباره انجام بده` : `Do ${dayName(lesson!.lesson.number)} again`, href: `/practice/english/today?day=${lesson!.lesson.id}` }
		: { label: isFa ? `شروع ${dayName(lesson!.lesson.number)}` : `Start ${dayName(lesson!.lesson.number)}`, href: '/practice/english/today' });

	/** Days since the learner's last day with a lesson (null if none). */
	const daysAway = $derived(today && dates.length ? Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${dates.at(-1)}T00:00:00Z`)) / 86_400_000) : null);
	const moment = $derived<DashboardMoment>(path
		? { name: data.name, finished: path.stepsDone, activeDays: dates.length, inProgress: path.underWay, doneToday, caughtUp: path.comingSoon,
			streak: inARow, activeToday: !!today && dates.includes(today), daysAway, lessonNumber: path.step?.chapter ?? 1 }
		: { name: data.name, finished: lesson!.finished, activeDays: dates.length, inProgress: lesson!.inProgress, doneToday, caughtUp: lesson!.caughtUp,
			streak: inARow, activeToday: !!today && dates.includes(today), daysAway, lessonNumber: lesson!.lesson.number });
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

	{#snippet miraButton()}
		<button class="mira" class:speaking type="button" onclick={hearMira} aria-pressed={speaking} aria-label={speaking ? (isFa ? 'قطع صدای میرا' : 'Stop Mira') : (isFa ? 'شنیدن صدای میرا' : 'Hear Mira')}>
			<span class="avatar" aria-hidden="true">M</span>
			<svg class="wave" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" /><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
		</button>
	{/snippet}

	{#if path}
	<section class="card" aria-labelledby="lesson-title">
		<div class="card-head">
			<h2 id="lesson-title" class="label">{path.underWay ? (isFa ? 'جایی که ماندی' : 'Where you stopped') : path.comingSoon ? (isFa ? 'همه را انجام دادی' : 'All caught up') : (isFa ? 'مرحلهٔ بعد' : 'Next step')}</h2>
			{@render miraButton()}
		</div>
		{#if path.comingSoon && !path.step}
			<p class="big small-big">{isFa ? 'تمرین‌های تازه به‌زودی می‌آیند.' : 'New practice is coming soon.'}</p>
			<p class="note">{isFa ? 'همهٔ مرحله‌ها را تا این‌جا انجام داده‌ای. هر مرحله‌ای را که بخواهی، از مسیرت دوباره تمرین کن.' : 'You’ve done every step so far. You can practise any step again from your path.'}</p>
		{:else if path.step?.topic}
			<p class="theme">{isFa ? 'گپ کوتاه' : 'Quick chat'}</p>
			<p class="big">{isFa ? path.step.theme.fa : path.step.theme.en}</p>
			<p class="note">{isFa ? `دربارهٔ خودت · ${n(path.step.minutes)} دقیقه` : `About you · ${path.step.minutes} min`}</p>
			{#if path.replay}<p class="note">{isFa ? 'داری این مرحله را دوباره تمرین می‌کنی.' : 'You’re practising this step again.'}</p>{/if}
		{:else if path.step}
			<p class="theme">{isFa ? `فصل ${n(path.step.chapter)}: ${path.step.theme.fa}` : `Chapter ${path.step.chapter} · ${path.step.theme.en}`}</p>
			{#if !path.replay}<p class="big">{isFa ? `مرحلهٔ ${n(path.step.index + 1)} از ${n(path.step.total)}` : `Step ${path.step.index + 1} of ${path.step.total}`}</p>{/if}
			<p class={path.replay ? 'big small-big' : 'note'}>{isFa ? `${path.step.title.fa} · ${n(path.step.minutes)} دقیقه` : `${path.step.title.en} · ${path.step.minutes} min`}</p>
			{#if path.replay}<p class="note">{isFa ? 'داری این مرحله را دوباره تمرین می‌کنی.' : 'You’re practising this step again.'}</p>{/if}
		{/if}
	</section>
	{:else}
	<section class="card" aria-labelledby="lesson-title">
		<div class="card-head">
			<h2 id="lesson-title" class="label">{lessonLabel}</h2>
			{@render miraButton()}
		</div>
		<p class="big">{dayName(lesson!.lesson.number)}</p>
		<p class="theme">{isFa ? lesson!.lesson.theme.fa : lesson!.lesson.theme.en}</p>
		{#if lessonNote}<p class="note">{lessonNote}</p>{/if}
	</section>
	{/if}

	<section class="card" aria-labelledby="week-title">
		<h2 id="week-title" class="label">{isFa ? 'این هفته' : 'This week'}</h2>
		{#if data.eventsLoaded && week.length}
			{#if path}<p class="goal-line" class:met={goalDone}>{goalDone ? (isFa ? 'هدف امروز: انجام شد ✓' : 'Today’s goal: done ✓') : (isFa ? 'هدف امروز: ۱ مرحله' : 'Today’s goal: 1 step')}</p>{/if}
			<p class="streak">{streakLine}</p>
			<ol class="week">
				{#each week as day (day.date)}
					<li class:active={day.active} class:today={day.date === today} class:future={day.future} aria-label={`${day.date === today ? (isFa ? 'امروز، ' : 'Today, ') : ''}${weekdayLong(day.date)}: ${day.active ? (isFa ? 'تمرین کردی' : 'practiced') : day.future ? (isFa ? 'هنوز نیامده' : 'still to come') : (isFa ? 'تمرین نکردی' : 'no lesson')}`} aria-current={day.date === today ? 'date' : undefined}>
						<span class="dot" aria-hidden="true">{day.active ? '✓' : ''}</span>
						<span class="weekday" aria-hidden="true">{weekday(day.date)}</span>
					</li>
				{/each}
			</ol>
		{:else if !data.eventsLoaded}
			<p class="note">{isFa ? 'الان نشد این هفته را نشان بدهیم. بعداً دوباره سر بزن.' : 'We couldn’t load this week right now. Check back later.'}</p>
		{/if}
	</section>

	{#if path}
		<a class="card link" href="/practice/english/path" onclick={stopAllAudio}>
			<span class="label">{isFa ? 'مرحله‌های انجام‌شده' : 'Steps done'}</span>
			<span class="row"><span class="big">{n(path.stepsDone)}</span><span class="see">{isFa ? 'مسیرت را ببین' : 'See your path'} <span aria-hidden="true">{isFa ? '←' : '→'}</span></span></span>
		</a>
	{:else if lesson!.finished}
		<a class="card link" href="/practice/english/finished" onclick={stopAllAudio}>
			<span class="label">{isFa ? 'درس‌های تمام‌شده' : 'Lessons finished'}</span>
			<span class="row"><span class="big">{n(lesson!.finished)}</span><span class="see">{isFa ? 'ببین' : 'See them'} <span aria-hidden="true">{isFa ? '←' : '→'}</span></span></span>
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
	/* Days still to come this week: faded, dashed. */
	.week li.future .dot { background: transparent; border-style: dashed; opacity: .55; }
	.week li.future .weekday { opacity: .6; }
	.theme { margin: 0; font-weight: 600; }
	.small-big { font-size: 1.6rem; }
	.goal-line { margin: 6px 0 0; font-weight: 700; color: var(--ink); }
	.goal-line.met { color: var(--accent-deep); }
	.bar-space { block-size: 120px; }
</style>
