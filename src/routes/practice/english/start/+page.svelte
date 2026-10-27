<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import BrandLogo from '$lib/components/BrandLogo.svelte';
	import { getLanguage } from '$services/data-layer';
	import { forgetMe } from '$services/me';
	import type { EnglishProfileAnswers } from '$lib/practice/english-profile';
	import type { DisplayText } from '$lib/practice/hotel';
	import { DAY_ONE, lessonMinutes, trackFor } from '$lib/practice/day';
	import LevelCheck from '$lib/components/LevelCheck.svelte';

	let { data }: PageProps = $props();
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	const text = (value: DisplayText) => value[language];
	const num = (value: number) => (isFa ? value.toLocaleString('fa-IR') : String(value));

	type Reason = NonNullable<EnglishProfileAnswers['reason']>;
	type Comfort = NonNullable<EnglishProfileAnswers['comfort']>;
	const REASON_OPTIONS: { id: Reason; icon: string; label: DisplayText }[] = [
		{ id: 'travel', icon: '✈️', label: { en: 'Travel', fa: 'سفر' } },
		{ id: 'everyday', icon: '💬', label: { en: 'Everyday confidence', fa: 'اعتمادبه‌نفس در گفت‌وگوهای روزمره' } },
		{ id: 'abroad', icon: '🏠', label: { en: 'Living abroad', fa: 'زندگی در خارج از کشور' } },
		{ id: 'work', icon: '💼', label: { en: 'Work and interviews', fa: 'کار و مصاحبهٔ کاری' } },
		{ id: 'exam', icon: '🎓', label: { en: 'A speaking exam', fa: 'آزمون اسپیکینگ' } },
		{ id: 'unsure', icon: '🙂', label: { en: 'Not sure yet: I just want to speak better', fa: 'هنوز نمی‌دانم؛ فقط می‌خواهم بهتر حرف بزنم' } }
	];
	/**
	 * Where the journey starts, honestly: only Sara's trip (travel) is built so far, so every other goal
	 * hears that its own lessons are coming (docs/goal-path-plan.md).
	 */
	const JOURNEY: Record<Reason, DisplayText> = {
		travel: { en: 'Your journey starts with Sara’s trip: the airport, a taxi, a hotel.', fa: 'مسیر یادگیری‌ات با ماجرای سفر سارا شروع می‌شود: فرودگاه، تاکسی، هتل.' },
		everyday: { en: 'Your first lessons follow Sara’s trip, full of everyday conversations. Lessons about everyday life are coming next.', fa: 'درس‌های اول، ماجرای سفر ساراست و پر از گفت‌وگوهای روزمره. درس‌هایی دربارهٔ زندگی روزمره به‌زودی اضافه می‌شوند.' },
		abroad: { en: 'Your first lessons follow Sara as she arrives in a new city: the airport, a taxi, a hotel. Lessons about settling in are coming.', fa: 'درس‌های اول، رسیدن سارا به یک شهر تازه است: فرودگاه، تاکسی، هتل. درس‌هایی دربارهٔ زندگی در کشور تازه به‌زودی اضافه می‌شوند.' },
		work: { en: 'Your first lessons follow Sara’s trip, to build your everyday speaking. Lessons for work and job interviews are coming.', fa: 'درس‌های اول، ماجرای سفر ساراست تا حرف زدن روزمره‌ات قوی‌تر شود. درس‌هایی برای کار و مصاحبهٔ کاری به‌زودی اضافه می‌شوند.' },
		unsure: { en: 'Your first lessons follow Sara’s trip, full of everyday conversations. Lessons about everyday life are coming next.', fa: 'درس‌های اول، ماجرای سفر ساراست و پر از گفت‌وگوهای روزمره. درس‌هایی دربارهٔ زندگی روزمره به‌زودی اضافه می‌شوند.' },
		exam: { en: 'Your first lessons follow Sara’s trip: they build the everyday speaking every exam needs. Exam practice is coming.', fa: 'درس‌های اول، ماجرای سفر ساراست و همان حرف زدن روزمره‌ای را تقویت می‌کند که هر آزمونی لازم دارد. تمرین به سبک آزمون به‌زودی اضافه می‌شود.' }
	};
	const COMFORT_OPTIONS: { id: Comfort; label: DisplayText }[] = [
		{ id: 'hard', label: { en: 'It’s hard to say much yet', fa: 'هنوز برایم سخت است زیاد حرف بزنم' } },
		{ id: 'simple', label: { en: 'I can manage simple conversations', fa: 'از پس گفت‌وگوهای ساده برمی‌آیم' } },
		{ id: 'natural', label: { en: 'I can talk, but I want to sound more natural', fa: 'می‌توانم حرف بزنم، ولی می‌خواهم طبیعی‌تر حرف بزنم' } }
	];
	/** The questions, then the ready screen. */
	const QUESTIONS = 3;

	// svelte-ignore state_referenced_locally
	const saved = data.profile;
	let step = $state(1);
	// svelte-ignore state_referenced_locally
	let name = $state(data.name);
	let reason = $state<Reason | null>(saved?.reason ?? null);
	let comfort = $state<Comfort | null>(saved?.comfort ?? null);
	type LevelSource = NonNullable<EnglishProfileAnswers['levelSource']>;
	let levelSource = $state<LevelSource>(saved?.levelSource ?? 'self');
	/** "I'm not sure": the level check runs inside question 3. */
	let checking = $state(false);
	const cleanName = $derived(name.trim().slice(0, 40));
	/** Day 1's length in the version the answers lead to (the same number its Start button shows). */
	const firstMinutes = $derived(lessonMinutes(DAY_ONE, trackFor({ comfort })));
	/** Every session has the default length now (owner's decision); the learner no longer chooses. */
	const minutes = 15;
	let saving = $state(false), saveFailed = $state(false), advancing = $state(false);
	let heading: HTMLHeadingElement | undefined = $state();

	/** Answers so far, in this browser only, so a call or an app switch resumes on the same screen. */
	const DRAFT_KEY = 'mirifer_en_onboarding_v1';
	let restored = $state(false);
	onMount(() => {
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		try {
			const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
			if (draft && !saved) {
				if (typeof draft.name === 'string') name = draft.name.slice(0, 40);
				if (REASON_OPTIONS.some(option => option.id === draft.reason)) reason = draft.reason;
				if (COMFORT_OPTIONS.some(option => option.id === draft.comfort)) comfort = draft.comfort;
				if (['self', 'check', 'skipped'].includes(draft.levelSource)) levelSource = draft.levelSource;
				const furthest = reason ? (comfort || levelSource === 'skipped' ? QUESTIONS + 1 : 3) : 2;
				checking = draft.checking === true && furthest === 3;
				if (Number.isInteger(draft.step)) step = Math.max(1, Math.min(draft.step, furthest));
			}
		} catch { /* nothing kept: start at the first question */ }
		restored = true;
	});
	$effect(() => {
		const draft = JSON.stringify({ step, name, reason, comfort, levelSource, checking });
		if (!restored) return;
		try { localStorage.setItem(DRAFT_KEY, draft); } catch { /* private mode: no resume */ }
	});

	const focusHeading = () => queueMicrotask(() => heading?.focus());
	/** Tap-to-answer: the choice shows as selected for a moment, then the next question comes. */
	function choose(apply: () => void) {
		if (advancing) return;
		apply(); advancing = true;
		setTimeout(() => { step += 1; advancing = false; focusHeading(); }, 180);
	}
	/** A name is welcome, not required: an empty one keeps the name we have, or none. */
	function nameNext(event: SubmitEvent) {
		event.preventDefault();
		step = 2; focusHeading();
	}
	function back() {
		if (saving) return;
		if (checking) { checking = false; focusHeading(); return; }
		if (step > 1) { step -= 1; focusHeading(); }
	}
	function chooseLevel(id: Comfort) { levelSource = 'self'; choose(() => (comfort = id)); }
	function startCheck() { comfort = null; checking = true; }
	/** The check's band, or none when the learner left it ("Not now": the easier version). */
	function checked(band: Comfort | null) {
		comfort = band; levelSource = band ? 'check' : 'skipped'; checking = false;
		step = QUESTIONS + 1; focusHeading();
	}

	async function save() {
		saving = true; saveFailed = false;
		try {
			const body = new FormData();
			body.set('answers', JSON.stringify({ reason, comfort, minutes, skipped: false, levelSource } satisfies EnglishProfileAnswers));
			if (cleanName) body.set('name', cleanName);
			const response = await fetch('?/save', { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
			const result = await response.json().catch(() => null);
			if (!response.ok || result?.type !== 'success') throw new Error('save');
			forgetMe();
			try { localStorage.removeItem(DRAFT_KEY); } catch { /* nothing kept */ }
			// A learner changing their answers goes back to their dashboard; a new one starts lesson 1.
			await goto(saved ? '/practice/english/progress' : '/practice/english/today', { invalidateAll: true });
		} catch { saveFailed = true; saving = false; }
	}
</script>

<svelte:head>
	<title>{isFa ? 'شروع انگلیسی' : 'Get started with English'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="start" dir={isFa ? 'rtl' : 'ltr'}>
	<div class="top">
		{#if step > 1}
			<button class="icon-btn" type="button" onclick={back} disabled={saving} aria-label={isFa ? 'قبلی' : 'Back'}>
				<svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" /></svg>
			</button>
		{:else}
			<span class="logo"><BrandLogo /></span>
		{/if}
		{#if step <= QUESTIONS}
			<p class="count" aria-live="polite">{isFa ? `${num(step)} از ${num(QUESTIONS)}` : `${step} of ${QUESTIONS}`}</p>
		{:else}<span></span>{/if}
		<span class="spacer"></span>
	</div>
	<div class="bar" aria-hidden="true"><span style:width="{Math.min(step, QUESTIONS) / QUESTIONS * 100}%"></span></div>

	{#if step === 1}
		<form class="screen" aria-labelledby="q1" onsubmit={nameNext}>
			<p class="intro">{isFa ? 'سلام، من میرا هستم، مربی انگلیسی‌ات.' : 'Hi, I’m Mira, your English coach.'}</p>
			<h1 id="q1" tabindex="-1" bind:this={heading}>{isFa ? 'چه صدایت کنم؟' : 'What should I call you?'}</h1>
			<label class="field">
				<span class="visually-hidden">{isFa ? 'نام تو' : 'Your name'}</span>
				<input type="text" bind:value={name} maxlength="40" autocomplete="given-name" enterkeyhint="next" dir="auto" placeholder={isFa ? 'نام تو' : 'Your name'} />
			</label>
			<!-- Under the field, not at the screen's foot: the keyboard covers the foot on phones. -->
			<button class="primary" type="submit">{isFa ? 'بعدی' : 'Next'} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button>
		</form>

	{:else if step === 2}
		<section class="screen" aria-labelledby="q2">
			{#if cleanName}<p class="intro">{isFa ? 'خوشبختم، ' : 'Nice to meet you, '}<bdi>{cleanName}</bdi>.</p>{/if}
			<h1 id="q2" tabindex="-1" bind:this={heading}>{isFa ? 'انگلیسی را برای چه می‌خواهی؟' : 'What do you want English for?'}</h1>
			<div class="options" role="group" aria-labelledby="q2">
				{#each REASON_OPTIONS as option}
					<button class="option" class:selected={reason === option.id} type="button" aria-pressed={reason === option.id} onclick={() => choose(() => (reason = option.id))}>
						<span class="icon" aria-hidden="true">{option.icon}</span>{text(option.label)}
					</button>
				{/each}
			</div>
			<p class="note">{isFa ? 'این تعیین می‌کند مسیرت از کجا شروع شود.' : 'This decides where your journey starts.'}</p>
		</section>

	{:else if step === 3 && checking}
		<LevelCheck {language} onDone={band => checked(band)} onLeave={() => checked(null)} />

	{:else if step === 3}
		<section class="screen" aria-labelledby="q3">
			<h1 id="q3" tabindex="-1" bind:this={heading}>{isFa ? 'الان انگلیسی حرف زدنت چطور است؟' : 'How’s your English speaking now?'}</h1>
			<div class="options" role="group" aria-labelledby="q3">
				{#each COMFORT_OPTIONS as option}
					<button class="option" class:selected={comfort === option.id && levelSource === 'self'} type="button" aria-pressed={comfort === option.id && levelSource === 'self'} onclick={() => chooseLevel(option.id)}>{text(option.label)}</button>
				{/each}
				<button class="option unsure" type="button" onclick={startCheck}>{isFa ? 'مطمئن نیستم؛ بیا با هم ببینیم (۲ دقیقه)' : 'I’m not sure. Let’s find out (2 min)'}</button>
			</div>
			<p class="reassure">{isFa ? 'لازم نیست دقیق جواب بدهی. این فقط نقطهٔ شروع است.' : 'You don’t need to get this exactly right. It’s only a starting point.'}</p>
		</section>

	{:else}
		<section class="screen done" aria-labelledby="done">
			<p class="check" aria-hidden="true">✓</p>
			<h1 id="done" tabindex="-1" bind:this={heading}>{#if cleanName}{isFa ? 'همه‌چیز آماده است، ' : 'You’re all set, '}<bdi>{cleanName}</bdi>.{:else}{isFa ? 'همه‌چیز آماده است.' : 'You’re all set.'}{/if}</h1>
			{#if reason}<p class="lead">{text(JOURNEY[reason])}</p>{/if}
			{#if !saved}<p class="minutes">{isFa ? `اولین درس: حدود ${num(firstMinutes)} دقیقه.` : `First lesson: about ${firstMinutes} minutes.`}</p>{/if}
			<button class="text-link" type="button" onclick={() => { step = 1; focusHeading(); }} disabled={saving}>{isFa ? 'تغییر پاسخ‌ها' : 'Change my answers'}</button>
		</section>
	{/if}

	{#if saveFailed}<p class="error" role="alert">{isFa ? 'ذخیره نشد. اتصال اینترنت را بررسی کن و دوباره امتحان کن.' : 'That didn’t save. Check your connection and try again.'}</p>{/if}

	{#if step > QUESTIONS}
		<div class="bottom">
			<button class="primary" type="button" onclick={save} disabled={saving}>{saving ? (isFa ? 'در حال ذخیره…' : 'Saving…') : saved ? (isFa ? 'ذخیره' : 'Save') : (isFa ? 'شروع اولین درس' : 'Start my first lesson')} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button>
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
	.spacer { inline-size: 44px; }
	.field input { inline-size: 100%; box-sizing: border-box; min-height: 56px; padding: 14px 16px; border: 1.5px solid var(--control-border); border-radius: 14px; background: var(--paper-raised); color: var(--ink); font: inherit; font-size: 1.1rem; }
	.field input:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; border-color: var(--accent); }
	.visually-hidden { position: absolute; inline-size: 1px; block-size: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
	.bar { height: 6px; border-radius: 99px; background: var(--paper-sunken); overflow: hidden; margin: 6px 0 28px; }
	.bar span { display: block; height: 100%; background: var(--accent); border-radius: 99px; transition: width .3s; }
	.screen { display: grid; gap: 14px; }
	.intro { margin: 0; color: var(--accent-deep); font-weight: 600; }
	h1 { margin: 0 0 6px; font-family: var(--font-display); font-weight: 500; font-size: clamp(1.6rem, 6vw, 2.2rem); line-height: 1.2; outline: none; }
	.options { display: grid; gap: 10px; }
	.option { display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 14px 16px; border: 1.5px solid var(--control-border); border-radius: 14px; background: var(--paper-raised); color: var(--ink); font: inherit; font-size: 1.02rem; font-weight: 500; text-align: start; cursor: pointer; transition: border-color .15s, background .15s; }
	.option:hover { border-color: var(--accent); }
	.option.unsure { border-style: dashed; color: var(--accent-deep); }
	.option.selected { border-color: var(--accent); background: var(--accent-wash); font-weight: 600; }
	.icon { font-size: 1.3rem; }
	.note { margin: 4px 0 0; color: var(--ink-soft); font-size: .9rem; line-height: 1.6; }
	.reassure { margin: 6px 0 0; padding: 12px 14px; border-radius: 12px; background: var(--paper-sunken); color: var(--ink-soft); font-size: .92rem; line-height: 1.6; }
	.done { text-align: start; }
	.check { display: grid; place-items: center; inline-size: 56px; block-size: 56px; margin: 0; border-radius: 50%; background: var(--leaf-wash); color: var(--leaf-deep); font-size: 1.6rem; font-weight: 700; }
	.lead { margin: 0; font-size: 1.05rem; line-height: 1.7; }
	.minutes { margin: 0; color: var(--ink-soft); }
	form.screen .primary { margin-top: 8px; }
	.text-link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; font-weight: 600; cursor: pointer; }
	.error { margin: 16px 0 0; color: var(--attention); font-weight: 600; }
	.bottom { position: fixed; inset-inline: 0; inset-block-end: 0; padding: 12px 20px calc(16px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 30%); }
	.primary { display: flex; gap: 12px; align-items: center; justify-content: center; inline-size: 100%; max-inline-size: 520px; margin-inline: auto; min-height: 54px; padding: 14px 22px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	.primary:hover:not(:disabled) { background: var(--accent-deep); }
	button:disabled { opacity: .6; cursor: default; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	@media (prefers-reduced-motion: reduce) { .option, .bar span { transition: none; } }
</style>
