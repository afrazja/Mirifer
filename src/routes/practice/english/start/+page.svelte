<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import BrandLogo from '$lib/components/BrandLogo.svelte';
	import { getLanguage } from '$services/data-layer';
	import { SKIPPED_PROFILE, type EnglishProfileAnswers } from '$lib/practice/english-profile';
	import type { DisplayText } from '$lib/practice/hotel';

	let { data }: PageProps = $props();
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	const text = (value: DisplayText) => value[language];
	const num = (value: number) => (isFa ? value.toLocaleString('fa-IR') : String(value));

	type Reason = NonNullable<EnglishProfileAnswers['reason']>;
	type Comfort = NonNullable<EnglishProfileAnswers['comfort']>;
	const REASON_OPTIONS: { id: Reason; icon: string; label: DisplayText; summary: DisplayText }[] = [
		{ id: 'travel', icon: '✈️', label: { en: 'Travel', fa: 'سفر' }, summary: { en: 'We’ll start with situations you meet when you travel.', fa: 'با موقعیت‌هایی شروع می‌کنیم که در سفر پیش می‌آید.' } },
		{ id: 'work', icon: '💼', label: { en: 'Work and interviews', fa: 'کار و مصاحبهٔ کاری' }, summary: { en: 'We’ll start with situations from work and job interviews.', fa: 'با موقعیت‌های کاری و مصاحبهٔ شغلی شروع می‌کنیم.' } },
		{ id: 'exam', icon: '🎓', label: { en: 'IELTS and other exams', fa: 'آیلتس و آزمون‌های دیگر' }, summary: { en: 'We’ll practise the kind of speaking and listening exams like IELTS ask for.', fa: 'همان نوع صحبت کردن و شنیدنی را تمرین می‌کنیم که آزمون‌هایی مثل آیلتس می‌خواهند.' } },
		{ id: 'abroad', icon: '🏠', label: { en: 'Living abroad', fa: 'زندگی در خارج از کشور' }, summary: { en: 'We’ll start with everyday situations from life abroad.', fa: 'با موقعیت‌های روزمرهٔ زندگی در خارج از کشور شروع می‌کنیم.' } },
		{ id: 'everyday', icon: '💬', label: { en: 'Everyday confidence', fa: 'اعتمادبه‌نفس در گفت‌وگوهای روزمره' }, summary: { en: 'We’ll start with everyday conversations, so speaking feels easier.', fa: 'با گفت‌وگوهای روزمره شروع می‌کنیم تا حرف زدن راحت‌تر شود.' } }
	];
	const COMFORT_OPTIONS: { id: Comfort; label: DisplayText }[] = [
		{ id: 'hard', label: { en: 'It’s hard to say much yet', fa: 'هنوز برایم سخت است زیاد حرف بزنم' } },
		{ id: 'simple', label: { en: 'I can manage simple conversations', fa: 'از پس گفت‌وگوهای ساده برمی‌آیم' } },
		{ id: 'natural', label: { en: 'I can talk, but I want to sound more natural', fa: 'می‌توانم حرف بزنم، ولی می‌خواهم طبیعی‌تر حرف بزنم' } }
	];

	// svelte-ignore state_referenced_locally
	const saved = data.profile;
	let step = $state(1);
	let reason = $state<Reason | null>(saved?.reason ?? null);
	let comfort = $state<Comfort | null>(saved?.comfort ?? null);
	/** Every session has the default length now (owner's decision); the learner no longer chooses. */
	const minutes = 15;
	let saving = $state(false), saveFailed = $state(false), advancing = $state(false);
	let heading: HTMLHeadingElement | undefined = $state();

	onMount(() => { void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; }); });

	/** Tap-to-answer: the choice shows as selected for a moment, then the next question comes. */
	function choose(apply: () => void) {
		if (advancing) return;
		apply(); advancing = true;
		setTimeout(() => { step += 1; advancing = false; queueMicrotask(() => heading?.focus()); }, 180);
	}
	function back() { if (step > 1 && !saving) { step -= 1; queueMicrotask(() => heading?.focus()); } }

	async function save(answers: EnglishProfileAnswers) {
		saving = true; saveFailed = false;
		try {
			const body = new FormData();
			body.set('answers', JSON.stringify(answers));
			const response = await fetch('?/save', { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
			const result = await response.json().catch(() => null);
			if (!response.ok || result?.type !== 'success') throw new Error('save');
			await goto('/practice/english/today', { invalidateAll: true });
		} catch { saveFailed = true; saving = false; }
	}
	const finish = () => save({ reason, comfort, minutes, skipped: false });
	const skip = () => save(SKIPPED_PROFILE);

	const summary = $derived(REASON_OPTIONS.find(option => option.id === reason)?.summary ?? null);
</script>

<svelte:head>
	<title>{isFa ? 'شروع انگلیسی' : 'Get started with English'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="start" dir={isFa ? 'rtl' : 'ltr'}>
	<div class="top">
		{#if step > 1 && step <= 3}
			<button class="icon-btn" type="button" onclick={back} disabled={saving} aria-label={isFa ? 'قبلی' : 'Back'}>
				<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
			</button>
		{:else}
			<span class="logo"><BrandLogo /></span>
		{/if}
		{#if step <= 2}
			<p class="count" aria-live="polite">{isFa ? `${num(step)} از ${num(2)}` : `${step} of 2`}</p>
		{/if}
		{#if step <= 2}
			<button class="skip" type="button" onclick={skip} disabled={saving}>{isFa ? 'فعلاً بگذر' : 'Skip for now'}</button>
		{:else}<span></span>{/if}
	</div>
	<div class="bar" aria-hidden="true"><span style:width="{Math.min(step, 2) / 2 * 100}%"></span></div>

	{#if step === 1}
		<section class="screen" aria-labelledby="q1">
			<p class="intro">{#if data.name}{isFa ? 'سلام ' : 'Hi '}<bdi>{data.name}</bdi>{'! '}{/if}{isFa ? 'سه سؤال کوتاه تا تمرین‌ها مناسب خودت باشد.' : 'Three quick questions so your practice fits you.'}</p>
			<h1 id="q1" tabindex="-1" bind:this={heading}>{isFa ? 'بیشتر برای چه کاری انگلیسی لازم داری؟' : 'What do you want English for most?'}</h1>
			<div class="options" role="group" aria-labelledby="q1">
				{#each REASON_OPTIONS as option}
					<button class="option" class:selected={reason === option.id} type="button" aria-pressed={reason === option.id} onclick={() => choose(() => (reason = option.id))}>
						<span class="icon" aria-hidden="true">{option.icon}</span>{text(option.label)}
					</button>
				{/each}
			</div>
			<p class="note">{isFa ? 'این تعیین می‌کند اول چه موقعیت‌هایی را تمرین کنی.' : 'This decides which situations you practise first.'}</p>
		</section>

	{:else if step === 2}
		<section class="screen" aria-labelledby="q2">
			<h1 id="q2" tabindex="-1" bind:this={heading}>{isFa ? 'الان وقتی انگلیسی حرف می‌زنی، چه حسی داری؟' : 'When you speak English, how does it feel right now?'}</h1>
			<div class="options" role="group" aria-labelledby="q2">
				{#each COMFORT_OPTIONS as option}
					<button class="option" class:selected={comfort === option.id} type="button" aria-pressed={comfort === option.id} onclick={() => choose(() => (comfort = option.id))}>{text(option.label)}</button>
				{/each}
			</div>
			<p class="reassure">{isFa ? 'لازم نیست دقیق جواب بدهی. این فقط نقطهٔ شروع است؛ ما تمام تلاشمان را می‌کنیم که سختی هر درس با عملکرد واقعی‌ات جور شود.' : 'You don’t need to get this exactly right. It’s only a starting point: we do our best to match every lesson to how you actually do.'}</p>
		</section>

	{:else}
		<section class="screen done" aria-labelledby="done">
			<p class="check" aria-hidden="true">✓</p>
			<h1 id="done" tabindex="-1" bind:this={heading}>{isFa ? 'همه‌چیز آماده است.' : 'You’re all set.'}</h1>
			<ul class="summary">
				{#if summary}<li>{text(summary)}</li>{/if}
				<li>{isFa ? 'ما تمام تلاشمان را می‌کنیم که هر درس با سطح تو جور باشد: هر جا برایت سخت است آسان‌تر، و هر جا قوی‌تری سخت‌تر.' : 'We do our best to match every lesson to you: easier where you struggle, harder where you’re strong.'}</li>
				<li>{isFa ? `هر جلسه حدود ${num(minutes)} دقیقه است.` : `Each session takes about ${minutes} minutes.`}</li>
			</ul>
			<button class="text-link" type="button" onclick={() => { step = 1; }} disabled={saving}>{isFa ? 'تغییر پاسخ‌ها' : 'Change my answers'}</button>
		</section>
	{/if}

	{#if saveFailed}<p class="error" role="alert">{isFa ? 'ذخیره نشد. اتصال اینترنت را بررسی کن و دوباره امتحان کن.' : 'That didn’t save. Check your connection and try again.'}</p>{/if}

	{#if step === 3}
		<div class="bottom">
			<button class="primary" type="button" onclick={finish} disabled={saving}>{saving ? (isFa ? 'در حال ذخیره…' : 'Saving…') : (isFa ? 'شروع اولین جلسه' : 'Start my first session')} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button>
		</div>
	{/if}
</main>

<style>
	.start { max-width: 560px; min-height: 100dvh; margin: 0 auto; padding: 12px 20px 120px; color: var(--ink); display: flex; flex-direction: column; }
	.top { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 8px; min-height: 52px; }
	.logo { --brand-logo-width: 104px; display: inline-flex; }
	.count { margin: 0; text-align: center; color: var(--ink-soft); font-size: .9rem; font-weight: 600; }
	.icon-btn { display: inline-grid; place-items: center; inline-size: 44px; block-size: 44px; border: 1px solid var(--control-border); border-radius: 50%; background: var(--control); color: var(--ink); cursor: pointer; }
	[dir='rtl'] .icon-btn svg { transform: scaleX(-1); }
	.skip { min-height: 44px; padding: 8px 4px; background: none; border: 0; color: var(--ink-soft); font: inherit; font-size: .9rem; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.bar { height: 6px; border-radius: 99px; background: var(--paper-sunken); overflow: hidden; margin: 6px 0 28px; }
	.bar span { display: block; height: 100%; background: var(--accent); border-radius: 99px; transition: width .3s; }
	.screen { display: grid; gap: 14px; }
	.intro { margin: 0; color: var(--accent-deep); font-weight: 600; }
	h1 { margin: 0 0 6px; font-family: var(--font-display); font-weight: 500; font-size: clamp(1.6rem, 6vw, 2.2rem); line-height: 1.2; outline: none; }
	.options { display: grid; gap: 10px; }
	.option { display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 14px 16px; border: 1.5px solid var(--control-border); border-radius: 14px; background: var(--paper-raised); color: var(--ink); font: inherit; font-size: 1.02rem; font-weight: 500; text-align: start; cursor: pointer; transition: border-color .15s, background .15s; }
	.option:hover { border-color: var(--accent); }
	.option.selected { border-color: var(--accent); background: var(--accent-wash); font-weight: 600; }
	.icon { font-size: 1.3rem; }
	.note { margin: 4px 0 0; color: var(--ink-soft); font-size: .9rem; line-height: 1.6; }
	.reassure { margin: 6px 0 0; padding: 12px 14px; border-radius: 12px; background: var(--paper-sunken); color: var(--ink-soft); font-size: .92rem; line-height: 1.6; }
	.done { text-align: start; }
	.check { display: grid; place-items: center; inline-size: 56px; block-size: 56px; margin: 0; border-radius: 50%; background: var(--leaf-wash); color: var(--leaf-deep); font-size: 1.6rem; font-weight: 700; }
	.summary { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
	.summary li { padding: 14px 16px; border: 1px solid var(--line); border-radius: 14px; background: var(--paper-raised); line-height: 1.6; }
	.text-link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; font-weight: 600; cursor: pointer; }
	.error { margin: 16px 0 0; color: var(--attention); font-weight: 600; }
	.bottom { position: fixed; inset-inline: 0; inset-block-end: 0; padding: 12px 20px calc(16px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 30%); }
	.primary { display: flex; gap: 12px; align-items: center; justify-content: center; inline-size: 100%; max-inline-size: 520px; margin-inline: auto; min-height: 54px; padding: 14px 22px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	.primary:hover:not(:disabled) { background: var(--accent-deep); }
	button:disabled { opacity: .6; cursor: default; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	@media (prefers-reduced-motion: reduce) { .option, .bar span { transition: none; } }
</style>
