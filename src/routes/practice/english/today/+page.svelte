<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import EnglishModuleTabs from '$lib/components/EnglishModuleTabs.svelte';
	import EnglishSpeechInput from '$lib/components/EnglishSpeechInput.svelte';
	import { getLanguage } from '$services/data-layer';
	import {
		DAY_ONE, DEFAULT_LENGTH, LENGTHS, agendaFor, agendaMinutes, checkInReply, completeSession, currentModule,
		finishModule, recommend, sessionProgress, startSession, type DaySession, type Length, type ModuleId
	} from '$lib/practice/day';
	import type { DisplayText } from '$lib/practice/hotel';

	let { data }: PageProps = $props();
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	const text = (value: DisplayText) => value[language];

	// svelte-ignore state_referenced_locally
	let session = $state<DaySession | null>(data.session);
	// svelte-ignore state_referenced_locally
	let length = $state<Length>(data.session?.length ?? DEFAULT_LENGTH);
	let answer = $state(''), replied = $state<DisplayText | null>(null);
	let saveFailed = $state(false);

	const agenda = $derived(agendaFor(length));
	const step = $derived(session?.stage === 'modules' ? currentModule(session) : null);
	const stepNumber = $derived(session && step ? (session.done.length + session.skipped.length + 1) : 0);
	const stepCount = $derived(agenda.length - 2);
	const share = $derived(session ? sessionProgress(session) : 0);

	onMount(() => { void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; }); });

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
	function sendAnswer() { if (answer.trim()) replied = checkInReply(answer); }
	const begin = () => save(startSession(length));
	const finish = (outcome: 'done' | 'skipped') => { if (session && step) void save(finishModule(session, step.id as ModuleId, outcome)); };
	const finishRecap = () => { if (session) void save(completeSession(session)); };
	function again() { answer = ''; replied = null; void save(null); }
	const greeting = $derived(data.name ? (isFa ? `سلام ${data.name}` : `Hello, ${data.name}`) : (isFa ? 'سلام' : 'Hello'));
</script>

<svelte:head>
	<title>{isFa ? 'امروز | تمرین انگلیسی' : 'Today | English practice'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="today" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/languages" backLabel={isFa ? 'زبان‌ها' : 'Languages'} direction={isFa ? 'rtl' : 'ltr'} />
	<EnglishModuleTabs current="today" {isFa} />

	{#if !session}
		<section aria-labelledby="start-title">
			<p class="eyebrow">{isFa ? 'انگلیسی · روز ۱' : 'ENGLISH · DAY 1'}</p>
			<h1 id="start-title">{greeting}</h1>
			<p class="theme"><strong>{isFa ? 'موضوع امروز:' : 'Today’s theme:'}</strong> {text(DAY_ONE.theme)}</p>
			<p class="goal">{text(DAY_ONE.goal)}</p>

			<div class="card">
				<label for="mood">{isFa ? 'امروزت چطور بود؟ (اختیاری)' : 'How was your day so far? (optional)'}</label>
				<textarea id="mood" rows="3" maxlength="300" bind:value={answer} disabled={!!replied} lang="en" dir="ltr" placeholder={isFa ? 'به انگلیسی بنویس یا بگو' : 'Write or say it in English'}></textarea>
				{#if !replied}
					<div class="row">
						<EnglishSpeechInput {isFa} onTranscript={value => (answer = value)} />
						<button class="secondary" type="button" onclick={sendAnswer} disabled={!answer.trim()}>{isFa ? 'بفرست' : 'Send'}</button>
					</div>
				{:else}
					<p class="reply" role="status">{text(replied)}</p>
				{/if}
			</div>

			<h2>{isFa ? 'برنامهٔ امروز' : 'Today’s plan'}</h2>
			<fieldset class="lengths">
				<legend class="sr-only">{isFa ? 'مدت جلسه' : 'Session length'}</legend>
				{#each LENGTHS as option}
					<label class:selected={length === option}><input type="radio" name="length" value={option} bind:group={length} /> {option} {isFa ? 'دقیقه' : 'min'}</label>
				{/each}
			</fieldset>
			<ol class="agenda">
				{#each agenda as item}<li><span>{text(item.title)}</span><span class="min">{item.minutes} {isFa ? 'دقیقه' : 'min'}</span></li>{/each}
			</ol>
			<p class="small">{isFa ? 'هر مرحله ذخیره می‌شود؛ هر وقت برگشتی از همان‌جا ادامه می‌دهی.' : 'Each step is saved, so you can come back and carry on where you stopped.'}</p>
			<button class="primary" type="button" onclick={begin}>{isFa ? `شروع (${agendaMinutes(length)} دقیقه)` : `Start (${agendaMinutes(length)} min)`} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button>
		</section>

	{:else if session.stage === 'modules' && step}
		<section aria-labelledby="step-title">
			<div class="bar" role="progressbar" aria-label={isFa ? 'پیشرفت جلسه' : 'Session progress'} aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(share * 100)}><span style:width="{share * 100}%"></span></div>
			<p class="eyebrow">{isFa ? `مرحلهٔ ${stepNumber} از ${stepCount}` : `STEP ${stepNumber} OF ${stepCount}`} · {step.skill === 'listening' ? (isFa ? 'شنیدن' : 'LISTENING') : (isFa ? 'صحبت کردن' : 'SPEAKING')}</p>
			<h1 id="step-title">{text(step.title)}</h1>
			<p>{text(step.does)}</p>
			{#if !step.built}
				<div class="card stand-in" role="note">
					<strong>{isFa ? 'این بخش هنوز ساخته نشده.' : 'This step is not built yet.'}</strong>
					<p>{isFa ? 'جای آن را نگه داشته‌ایم تا ترتیب و زمان‌بندی روز را ببینی.' : 'It holds its place so you can see the order and timing of the day.'}</p>
				</div>
			{/if}
			<div class="row">
				<button class="primary" type="button" onclick={() => finish('done')}>{isFa ? 'ادامه' : 'Continue'} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button>
				<button class="text-button" type="button" onclick={() => finish('skipped')}>{isFa ? 'این مرحله را رد کن' : 'Skip this step'}</button>
			</div>
		</section>

	{:else if session.stage === 'recap'}
		{@const next = recommend(session)}
		<section aria-labelledby="recap-title">
			<div class="bar"><span style:width="{share * 100}%"></span></div>
			<p class="eyebrow">{isFa ? 'مرور' : 'RECAP'}</p>
			<h1 id="recap-title">{isFa ? 'کار امروز' : 'What you did today'}</h1>
			<ul class="done-list">
				{#each DAY_ONE.modules.filter(m => m.minutes[session!.length] !== undefined) as item}
					<li>{text(item.title)} <span class="min">{session.done.includes(item.id) ? (isFa ? 'انجام شد' : 'done') : (isFa ? 'رد شد' : 'skipped')}</span></li>
				{/each}
			</ul>
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
	h2 { font-family: var(--font-display); font-weight: 500; font-size: 1.25rem; margin: 26px 0 10px; }
	p { line-height: 1.65; }
	.theme { font-size: 1.1rem; margin: 0 0 4px; }
	.goal { color: var(--ink-soft); margin-top: 0; }
	.card { display: grid; gap: 10px; padding: 16px; margin: 18px 0; border: 1px solid var(--control-border); border-radius: 14px; background: var(--paper-raised); }
	.card p { margin: 0; }
	textarea { width: 100%; box-sizing: border-box; padding: 12px; font: inherit; border: 1px solid var(--control-border); border-radius: 10px; background: var(--control); color: var(--ink); resize: vertical; }
	label { font-weight: 600; }
	.row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-top: 8px; }
	.reply { color: var(--accent-deep); font-weight: 600; }
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
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
