<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import EnglishModuleTabs from '$lib/components/EnglishModuleTabs.svelte';
	import ListenAndAct from '$lib/components/ListenAndAct.svelte';
	import ListenAndActReview from '$lib/components/ListenAndActReview.svelte';
	import { clearRecords, loadRecord, saveRecord } from '$lib/practice/day-records';
	import { asActRecord, type ActRecord } from '$lib/practice/listen-act';
	import CoachGreeting from '$lib/components/CoachGreeting.svelte';
	import SayAgain from '$lib/components/SayAgain.svelte';
	import { loadGreeting, localDate, type GreetingRecord } from '$lib/practice/coach';
	import { getLanguage } from '$services/data-layer';
	import {
		DAY_ONE, DEFAULT_LENGTH, LENGTHS, agendaFor, agendaMinutes, completeSession, currentModule,
		completeLater, finishModule, moduleBefore, modulesFor, recommend, sessionProgress, startSession, type DaySession, type Length, type ModuleId
	} from '$lib/practice/day';
	import type { DisplayText } from '$lib/practice/hotel';
	import type { DayModule } from '$lib/practice/day';

	let { data }: PageProps = $props();
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	const text = (value: DisplayText) => value[language];

	// svelte-ignore state_referenced_locally
	let session = $state<DaySession | null>(data.session);
	// svelte-ignore state_referenced_locally
	let length = $state<Length>(data.session?.length ?? data.profile?.minutes ?? DEFAULT_LENGTH);
	let saveFailed = $state(false);
	/** A finished module the learner went back to look at again. Its result is not saved a second time. */
	let reviewing = $state<string | null>(null);
	/** Back at the check-in (greeting, plan) after the session has started. The plan is read-only then. */
	let showCheckIn = $state(false);
	/** Before a session starts: Mira first, then today's plan (one focused screen each). */
	let startStep = $state<'greeting' | 'plan'>('greeting');
	/** Today's chat with Mira, for the recap's one correction (kept in this browser). */
	let chat = $state<GreetingRecord | null>(null);
	$effect(() => { if (session?.stage === 'recap') chat = loadGreeting(localDate(new Date())); });
	/** Doing a skipped module now, from the look-back view. */
	let doingNow = $state(false);
	const reviewed = $derived(reviewing && session ? modulesFor(session.length).find(m => m.id === reviewing) ?? null : null);

	const agenda = $derived(agendaFor(length));
	const step = $derived(session?.stage === 'modules' ? currentModule(session) : null);
	/** The module before the one on screen: before the current step, before the recap, or before the one being reviewed. */
	/** What the learner did in the module being looked back at (this browser only). */
	const reviewedRecord = $derived(reviewed && session ? loadRecord(session.startedAt, reviewed.id) : null);
	const previous = $derived(session && session.stage !== 'done' ? moduleBefore(session.length, reviewed ? reviewed.id : step ? step.id : null) : null);
	const stepNumber = $derived(session && step ? (session.done.length + session.skipped.length + 1) : 0);
	const stepCount = $derived(agenda.length - 2);
	const share = $derived(session ? sessionProgress(session) : 0);

	onMount(() => {
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		if (loadGreeting(localDate(new Date()))?.done) startStep = 'plan';
	});

	/** Saves the checkpoint. A failed save never blocks the learner; they get a quiet note. */
	async function save(next: DaySession | null) {
		session = next; saveFailed = false;
		try {
			const body = new FormData();
			body.set('session', next ? JSON.stringify(next) : '');
			const response = await fetch('?/save', { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
			if (!response.ok) saveFailed = true;
		} catch { saveFailed = true; }
	}
	const begin = () => { clearRecords(); return save(startSession(length)); };
	const finish = (outcome: 'done' | 'skipped', score?: { correct: number; total: number }, record?: unknown) => {
		if (!session || !step) return;
		if (record) saveRecord(session.startedAt, step.id, record);
		void save(finishModule(session, step.id as ModuleId, outcome, score));
	};
	const finishRecap = () => { if (!session) return; clearRecords(); void save(completeSession(session)); };
	/** Finishes a module that was skipped earlier, then goes back to where the learner was. */
	function finishLater(id: string, score?: { correct: number; total: number }, record?: unknown) {
		if (!session) return;
		if (record) saveRecord(session.startedAt, id, record);
		doingNow = false; reviewing = null;
		void save(completeLater(session, id as ModuleId, score));
	}
	function again() { clearRecords(); void save(null); }
</script>

{#snippet moduleBody(mod: DayModule, onDone: (score?: { correct: number; total: number }, record?: ActRecord) => void)}
	{#if mod.id === 'listen-act' && mod.built}
		{#key mod.id}<ListenAndAct {isFa} {onDone} />{/key}
	{:else}
		<div class="card stand-in" role="note">
			<strong>{isFa ? 'این بخش هنوز ساخته نشده.' : 'This step is not built yet.'}</strong>
			<p>{isFa ? 'جای آن را نگه داشته‌ایم تا ترتیب و زمان‌بندی روز را ببینی.' : 'It holds its place so you can see the order and timing of the day.'}</p>
		</div>
		<button class="primary" type="button" onclick={() => onDone()}>{isFa ? 'ادامه' : 'Continue'} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button>
	{/if}
{/snippet}

{#snippet reviewBody(mod: DayModule)}
	{@const actRecord = mod.id === 'listen-act' ? asActRecord(reviewedRecord) : null}
	{#if actRecord}
		<ListenAndActReview {isFa} record={actRecord} />
	{:else if session?.skipped.includes(mod.id as ModuleId)}
		<div class="card" role="note"><p>{isFa ? 'این مرحله را رد کردی، پس چیزی برای دیدن نیست.' : 'You skipped this step, so there is nothing to look back at.'}</p></div>
	{:else}
		<div class="card" role="note"><p>{isFa ? 'چیزی از این مرحله روی این دستگاه ذخیره نشده است.' : 'Nothing from this step is saved on this device.'}</p></div>
	{/if}
{/snippet}

{#snippet backButton()}
	{#if previous}
		<button class="back" type="button" onclick={() => { doingNow = false; reviewing = previous?.id ?? null; }}><span aria-hidden="true">{isFa ? '→' : '←'}</span> {isFa ? `قبلی: ${text(previous.title)}` : `Back: ${text(previous.title)}`}</button>
	{:else if session && session.stage !== 'done'}
		<button class="back" type="button" onclick={() => { doingNow = false; reviewing = null; showCheckIn = true; }}><span aria-hidden="true">{isFa ? '→' : '←'}</span> {isFa ? 'قبلی: شروع' : 'Back: Check-in'}</button>
	{/if}
{/snippet}

<svelte:head>
	<title>{isFa ? 'امروز | تمرین انگلیسی' : 'Today | English practice'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="today" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/languages" backLabel={isFa ? 'زبان‌ها' : 'Languages'} direction={isFa ? 'rtl' : 'ltr'} />
	{#if !session && startStep === 'plan'}<EnglishModuleTabs current="today" {isFa} />{/if}

	{#if !session && startStep === 'greeting'}
		<h1 class="sr-only">{isFa ? 'امروز' : 'Today'}</h1>
		<CoachGreeting {isFa} name={data.name} profile={data.profile} progress={data.progress} question={DAY_ONE.question} onDone={() => (startStep = 'plan')} />

	{:else if !session || showCheckIn}
		<section aria-labelledby="start-title" class="start">
			{#if session}
				<CoachGreeting {isFa} name={data.name} profile={data.profile} progress={data.progress} question={DAY_ONE.question} readOnly />
			{/if}
			<p class="eyebrow">{isFa ? 'برنامهٔ امروز' : 'TODAY’S PLAN'}</p>
			<h1 id="start-title" class="theme-title">{text(DAY_ONE.theme)}</h1>
			<p class="goal">{text(DAY_ONE.goal)}</p>
			<fieldset class="lengths">
				<legend class="sr-only">{isFa ? 'مدت جلسه' : 'Session length'}</legend>
				{#each LENGTHS as option}
					<label class:selected={length === option}><input type="radio" name="length" value={option} bind:group={length} disabled={!!session} /> {option} {isFa ? 'دقیقه' : 'min'}</label>
				{/each}
			</fieldset>
			<ol class="agenda">
				{#each agenda as item}<li><span>{text(item.title)}</span><span class="min">{item.minutes} {isFa ? 'دقیقه' : 'min'}</span></li>{/each}
			</ol>
			{#if session}
				<button class="text-button" type="button" onclick={() => { showCheckIn = false; again(); }}>{isFa ? 'شروع دوباره' : 'Start again'}</button>
			{:else}
				<button class="text-button" type="button" onclick={() => (startStep = 'greeting')}><span aria-hidden="true">{isFa ? '→' : '←'}</span> {isFa ? 'میرا' : 'Mira'}</button>
			{/if}

			<div class="start-bar">
				{#if session}
					<button class="primary wide" type="button" onclick={() => (showCheckIn = false)}>{isFa ? 'ادامه' : 'Continue'} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button>
				{:else}
					<button class="primary wide" type="button" onclick={begin}>{isFa ? `شروع · ${agendaMinutes(length)} دقیقه` : `Start · ${agendaMinutes(length)} min`} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button>
				{/if}
			</div>
		</section>

	{:else if reviewed}
		<section aria-labelledby="review-title">
			{@render backButton()}
			<p class="eyebrow">{isFa ? 'مرور مرحلهٔ قبلی' : 'REVIEWING AN EARLIER STEP'}</p>
			<h1 id="review-title">{text(reviewed.title)}</h1>
			{#if doingNow && session.skipped.includes(reviewed.id as ModuleId)}
				{@render moduleBody(reviewed, (score, record) => finishLater(reviewed.id, score, record))}
			{:else}
				{#if session.skipped.includes(reviewed.id as ModuleId)}
					{@render reviewBody(reviewed)}
					<button class="primary" type="button" onclick={() => (doingNow = true)}>{isFa ? 'همین حالا انجامش بده' : 'Do this step now'} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button>
				{:else}
					<p class="small">{isFa ? 'فقط خواندنی: این همان کاری است که کردی. دوباره انجام دادن ممکن نیست.' : 'Read-only: this is what you did. It can’t be redone.'}</p>
					{@render reviewBody(reviewed)}
				{/if}
				<button class={session.skipped.includes(reviewed.id as ModuleId) ? 'text-button' : 'primary'} type="button" onclick={() => (reviewing = null)}>{isFa ? 'برگشت به جایی که بودم' : 'Back to where I was'}</button>
			{/if}
		</section>

	{:else if session.stage === 'modules' && step}
		<section aria-labelledby="step-title">
			{@render backButton()}
			<div class="bar" role="progressbar" aria-label={isFa ? 'پیشرفت جلسه' : 'Session progress'} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(share * 100)}><span style:width="{share * 100}%"></span></div>
			<p class="eyebrow">{isFa ? `مرحلهٔ ${stepNumber} از ${stepCount}` : `STEP ${stepNumber} OF ${stepCount}`} · {step.skill === 'listening' ? (isFa ? 'شنیدن' : 'LISTENING') : (isFa ? 'صحبت کردن' : 'SPEAKING')}</p>
			<h1 id="step-title">{text(step.title)}</h1>
			<p>{text(step.does)}</p>
			{@render moduleBody(step, (score, record) => finish('done', score, record))}
			<button class="text-button" type="button" onclick={() => finish('skipped')}>{isFa ? 'این مرحله را رد کن' : 'Skip this step'}</button>
		</section>

	{:else if session.stage === 'recap'}
		{@const next = recommend(session)}
		<section aria-labelledby="recap-title">
			{@render backButton()}
			<div class="bar"><span style:width="{share * 100}%"></span></div>
			<p class="eyebrow">{isFa ? 'مرور' : 'RECAP'}</p>
			<h1 id="recap-title">{isFa ? 'کار امروز' : 'What you did today'}</h1>
			<ul class="done-list">
				{#each DAY_ONE.modules.filter(m => m.minutes[session!.length] !== undefined) as item}
					<li>{text(item.title)}
						{#if session.done.includes(item.id)}<span class="min">{session.scores?.[item.id] ? `${session.scores[item.id]?.correct}/${session.scores[item.id]?.total}` : (isFa ? 'انجام شد' : 'done')}</span>
						{:else}<button class="text-button inline" type="button" onclick={() => { doingNow = true; reviewing = item.id; }}>{isFa ? 'رد شد · همین حالا انجامش بده' : 'Skipped · do it now'}</button>{/if}</li>
				{/each}
			</ul>
			{#if chat?.improved && chat.answer}
				<div class="card">
					<p class="eyebrow">{isFa ? 'از گفت‌وگویت با میرا' : 'FROM YOUR CHAT WITH MIRA'}</p>
					<p><span class="small">{isFa ? 'گفتی:' : 'You said:'}</span> <bdi lang="en" class="said">“{chat.answer}”</bdi></p>
					<p><span class="small">{isFa ? 'این‌طور بگو:' : 'Try:'}</span> <bdi lang="en" class="better">“{chat.improved}”</bdi></p>
					{#if (isFa ? chat.noteFa : chat.noteEn)}<p class="small">{isFa ? chat.noteFa : chat.noteEn}</p>{/if}
					<SayAgain sentence={chat.improved} {isFa} />
				</div>
			{/if}
			<div class="card">
				<p class="eyebrow">{isFa ? 'پیشنهاد برای دفعهٔ بعد' : 'NEXT TIME'}</p>
				<strong>{text(next.title)}</strong>
				<p>{text(next.why)}</p>
			</div>
			<p class="small">{isFa ? 'نوار پیشرفت شنیدن و صحبت کردن با اولین ماژول‌های ساخته‌شده پر می‌شود.' : 'The Listening and Speaking progress bars fill in once the first modules are built.'}</p>
			<button class="primary" type="button" onclick={finishRecap}>{isFa ? 'پایان جلسه' : 'Finish session'}</button>
		</section>

	{:else}
		<section aria-labelledby="done-title">
			<p class="eyebrow">{isFa ? 'روز ۱' : 'DAY 1'}</p>
			<h1 id="done-title">{isFa ? 'جلسهٔ امروز تمام شد.' : 'Today’s session is done.'}</h1>
			<p>{isFa ? 'فردا برگرد؛ پیشنهاد بعدی آماده است.' : 'Come back tomorrow; your next suggestion is ready.'}</p>
			<button class="secondary" type="button" onclick={again}>{isFa ? 'دوباره از اول' : 'Start Day 1 again'}</button>
		</section>
	{/if}

	{#if saveFailed}<p class="small warn" role="status">{isFa ? 'پیشرفتت ذخیره نشد؛ اینترنت را بررسی کن. می‌توانی ادامه بدهی.' : 'Your progress didn’t save. Check your connection; you can keep going.'}</p>{/if}
</main>

<style>
	.today { max-width: 720px; margin: 0 auto; padding: 24px 20px 64px; color: var(--ink); }
	.eyebrow { font-size: .76rem; letter-spacing: .12em; font-weight: 600; color: var(--accent-deep); margin: 18px 0 10px; }
	h1 { font-family: var(--font-display); font-weight: 500; font-size: clamp(1.8rem, 5vw, 2.6rem); line-height: 1.15; margin: 0 0 14px; }
	p { line-height: 1.65; }
	.goal { color: var(--ink-soft); margin-top: 0; }
	.card { display: grid; gap: 10px; padding: 16px; margin: 18px 0; border: 1px solid var(--control-border); border-radius: 14px; background: var(--paper-raised); }
	.card p { margin: 0; }
	label { font-weight: 600; }
	.lengths { display: flex; gap: 10px; border: 0; padding: 0; margin: 0 0 14px; }
	.lengths label { display: inline-flex; align-items: center; gap: 8px; min-height: 48px; padding: 10px 16px; border: 1px solid var(--control-border); border-radius: 10px; background: var(--paper-raised); font-weight: 500; cursor: pointer; }
	.lengths label.selected { border-color: var(--accent); background: var(--accent-wash); font-weight: 600; }
	.lengths label:has(input:focus-visible) { outline: 3px solid var(--accent); outline-offset: 2px; }
	.agenda, .done-list { list-style: none; padding: 0; margin: 0 0 14px; display: grid; gap: 8px; }
	.agenda li, .done-list li { display: flex; justify-content: space-between; gap: 12px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper-raised); }
	.min { color: var(--ink-soft); font-size: .88rem; white-space: nowrap; }
	.small { color: var(--ink-soft); font-size: .88rem; }
	.warn { color: var(--attention); }
	.bar { height: 8px; border-radius: 99px; background: var(--paper-sunken); overflow: hidden; margin-top: 8px; }
	.bar span { display: block; height: 100%; background: var(--accent); border-radius: 99px; transition: width .3s; }
	.stand-in { background: var(--paper-sunken); }
	button { font: inherit; cursor: pointer; }
	button:disabled { opacity: .55; cursor: default; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	.primary { display: inline-flex; gap: 14px; align-items: center; justify-content: center; min-height: 48px; padding: 12px 22px; background: var(--accent); color: var(--on-accent); border: 1px solid var(--accent); border-radius: 10px; font-weight: 600; }
	.primary:hover:not(:disabled) { background: var(--accent-deep); }
	.secondary { min-height: 48px; padding: 12px 18px; background: var(--paper-raised); border: 1px solid var(--control-border); border-radius: 10px; color: var(--ink); }
	.text-button { min-height: 44px; padding: 8px 4px; background: none; border: 0; color: var(--accent-deep); }
	.back { display: inline-flex; gap: 8px; align-items: center; min-height: 44px; padding: 8px 4px; margin-bottom: 4px; background: none; border: 0; color: var(--accent-deep); font-weight: 600; }
	.inline { min-height: 44px; padding: 8px 0; }
	.start { padding-bottom: 96px; }
	.theme-title { font-size: clamp(1.5rem, 5vw, 2.1rem); }
	.start-bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 20; padding: 12px 20px calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 35%); }
	.primary.wide { display: flex; inline-size: 100%; max-inline-size: 680px; margin-inline: auto; min-height: 54px; font-size: 1.05rem; }
	.said { color: var(--ink-soft); }
	.better { font-weight: 600; color: var(--accent-deep); }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
