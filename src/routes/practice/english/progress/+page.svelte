<script lang="ts">
	/**
	 * Your progress: lessons finished, lesson steps done, the days you practised (with a streak and
	 * this week's days), and right answers in your recent lessons. Only what the learner did.
	 */
	import { onMount } from 'svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import LearnerTabs from '$lib/components/LearnerTabs.svelte';
	import { getLanguage } from '$services/data-layer';
	import { lastSevenDays, streak } from '$lib/practice/learner-stats';

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
	const right = (tally: { correct: number; total: number }) => (isFa ? `${n(tally.correct)} از ${n(tally.total)} درست` : `${tally.correct} of ${tally.total} right`);
</script>

<svelte:head>
	<title>{isFa ? 'پیشرفت تو' : 'Your progress'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="progress" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/languages" backLabel={isFa ? 'زبان‌ها' : 'Languages'} direction={isFa ? 'rtl' : 'ltr'} />
	<LearnerTabs current="progress" {isFa} />
	<h1>{isFa ? 'پیشرفت تو' : 'Your progress'}</h1>

	<section class="card" aria-labelledby="lessons-title">
		<h2 id="lessons-title">{isFa ? 'درس‌های تمام‌شده' : 'Lessons finished'}</h2>
		<p class="big">{n(data.finished.length)}</p>
		{#if data.finished.length}
			<ul class="finished">
				{#each data.finished as lesson (lesson.number)}
					<li><span class="tick" aria-hidden="true">✓</span>{isFa ? `روز ${n(lesson.number)}: ${lesson.theme.fa}` : `Day ${lesson.number}: ${lesson.theme.en}`}</li>
				{/each}
			</ul>
		{:else}
			<p class="note">{isFa ? 'وقتی اولین درس را تمام کنی، این‌جا می‌بینی‌اش.' : 'Finish your first lesson to see it here.'}</p>
		{/if}
	</section>

	<div class="pair">
		<section class="card" aria-labelledby="steps-title">
			<h2 id="steps-title">{isFa ? 'بخش‌های انجام‌شده' : 'Steps completed'}</h2>
			<p class="big">{data.eventsLoaded ? n(data.steps) : '–'}</p>
			<p class="note">{isFa ? 'گوش دادن، عبارت‌ها، گفت‌وگو و…' : 'Listening, phrases, conversations and more'}</p>
		</section>
		<section class="card" aria-labelledby="days-title">
			<h2 id="days-title">{isFa ? 'روزهای تمرین' : 'Days practised'}</h2>
			<p class="big">{data.eventsLoaded ? n(data.dates.length) : '–'}</p>
			<p class="note">{inARow > 1 ? (isFa ? `${n(inARow)} روز پشت سر هم` : `${inARow} days in a row`) : inARow === 1 ? (isFa ? 'امروز یا دیروز تمرین کردی' : 'You practised today or yesterday') : (isFa ? 'یک درس امروز، شروع یک زنجیره' : 'A lesson today starts a streak')}</p>
		</section>
	</div>

	{#if week.length}
		<section class="card" aria-labelledby="week-title">
			<h2 id="week-title">{isFa ? 'این هفته' : 'This week'}</h2>
			<ol class="week">
				{#each week as day (day.date)}
					<li class:active={day.active} aria-label={`${weekdayLong(day.date)}: ${day.active ? (isFa ? 'تمرین کردی' : 'practised') : (isFa ? 'تمرین نکردی' : 'no lesson')}`}>
						<span class="dot" aria-hidden="true">{day.active ? '✓' : ''}</span>
						<span class="weekday" aria-hidden="true">{weekday(day.date)}</span>
					</li>
				{/each}
			</ol>
		</section>
	{/if}

	<section class="card" aria-labelledby="skills-title">
		<h2 id="skills-title">{isFa ? 'گوش دادن و حرف زدن' : 'Listening and speaking'}</h2>
		{#if data.listening.total || data.speaking.total}
			<dl class="skills">
				<div><dt>{isFa ? 'گوش دادن' : 'Listening'}</dt><dd>{data.listening.total ? right(data.listening) : '–'}</dd></div>
				<div><dt>{isFa ? 'حرف زدن' : 'Speaking'}</dt><dd>{data.speaking.total ? right(data.speaking) : '–'}</dd></div>
			</dl>
			<p class="note">{isFa ? 'جواب‌هایت در ۱۰ درس آخر.' : 'Your answers in your last 10 lessons.'}</p>
		{:else}
			<p class="note">{isFa ? 'بعد از اولین درس، جواب‌هایت این‌جا جمع می‌شود.' : 'After your first lesson, your answers add up here.'}</p>
		{/if}
	</section>
</main>

<style>
	.progress { max-width: 680px; margin: 0 auto; padding: 16px 16px 48px; color: var(--ink); }
	h1 { font-family: var(--font-display); font-weight: 600; font-size: 1.9rem; margin: 18px 0 14px; }
	.card { padding: 18px; margin-bottom: 12px; border: 1px solid var(--control-border); border-radius: 18px; background: var(--paper-raised); box-shadow: var(--paper-shadow); }
	h2 { margin: 0; font-size: .82rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-soft); }
	[dir='rtl'] h2 { letter-spacing: 0; font-size: .95rem; }
	.big { margin: 4px 0 6px; font-family: var(--font-display); font-size: 2.4rem; font-weight: 600; color: var(--accent-deep); line-height: 1.1; }
	.note { margin: 0; color: var(--ink-soft); font-size: .92rem; line-height: 1.5; }
	.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
	.pair .card { margin-bottom: 12px; }
	.finished { list-style: none; margin: 6px 0 0; padding: 0; display: grid; gap: 6px; }
	.finished li { display: flex; align-items: center; gap: 8px; }
	.tick { display: inline-grid; place-items: center; inline-size: 22px; block-size: 22px; border-radius: 50%; background: var(--accent-wash); color: var(--accent-deep); font-size: .75rem; font-weight: 700; flex: none; }
	.week { list-style: none; margin: 10px 0 0; padding: 0; display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; text-align: center; }
	.week li { display: grid; justify-items: center; gap: 4px; }
	.dot { display: grid; place-items: center; inline-size: 32px; block-size: 32px; border-radius: 50%; border: 2px solid var(--control-border); color: #fff; font-size: .8rem; font-weight: 700; }
	.week li.active .dot { background: var(--accent); border-color: var(--accent); }
	.weekday { font-size: .8rem; color: var(--ink-soft); }
	.skills { margin: 8px 0 6px; display: grid; gap: 6px; }
	.skills div { display: flex; justify-content: space-between; gap: 12px; }
	.skills dt { font-weight: 600; }
	.skills dd { margin: 0; color: var(--accent-deep); font-weight: 600; }
	@media (max-width: 360px) { .pair { grid-template-columns: 1fr; } }
</style>
