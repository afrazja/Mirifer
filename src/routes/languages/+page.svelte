<script lang="ts">
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import { getCourse, isAvailableCourse } from '$lib/courses';
	import { progressShare, type CourseProgress } from '$lib/practice/course-progress';
	import { applyDocumentLanguage, getLanguage, setLanguage } from '$services/data-layer';
	let { data, form }: PageProps = $props();
	let language = $state<'en' | 'fa'>('en');
	let saving = $state<string | null>(null);
	const isFa = $derived(language === 'fa');
	const learning = $derived(data.languages as CourseProgress[]);
	const firstVisit = $derived(learning.length === 0);
	const unavailableChoice = $derived(getCourse(data.currentLanguage) && !isAvailableCourse(data.currentLanguage) ? getCourse(data.currentLanguage) : null);
	onMount(() => {
		language = navigator.language.startsWith('fa') ? 'fa' : 'en';
		void getLanguage().then(saved => {
			if (saved === 'en' || saved === 'fa') language = saved;
			applyDocumentLanguage(language);
		}).catch(() => applyDocumentLanguage(language));
	});
	async function changeDisplay(value: 'en' | 'fa') { language = value; await setLanguage(value); }
	const fa = (value: number) => isFa ? value.toLocaleString('fa-IR') : String(value);
	function summary(progress: CourseProgress): { label: string; detail: string } {
		if (progress.code === 'de') return {
			label: isFa ? `درس ${fa(progress.currentDay)} از ${fa(progress.total)}` : `Lesson ${progress.currentDay} of ${progress.total}`,
			detail: isFa ? `${fa(progress.completed)} درس تمام‌شده · ${fa(progress.xp)} امتیاز` : `${progress.completed} ${progress.completed === 1 ? 'lesson' : 'lessons'} completed · ${progress.xp} XP`
		};
		const done = (progress.conversationDone ? 1 : 0) + progress.retellDone, total = 1 + progress.retellTotal;
		return {
			label: isFa ? `${fa(done)} از ${fa(total)} تمرین` : `${done} of ${total} activities`,
			detail: isFa
				? `گفت‌وگو: ${progress.conversationDone ? 'انجام شد' : 'هنوز نه'} · گوش بده و بازگو کن: ${fa(progress.retellDone)} از ${fa(progress.retellTotal)}`
				: `Conversation: ${progress.conversationDone ? 'done' : 'not yet'} · Listen & retell: ${progress.retellDone} of ${progress.retellTotal}`
		};
	}
	const submitting = () => {
		return async ({ result, update }: { result: { type: string }; update: () => Promise<void> }) => {
			try {
				if (result.type === 'error') form = { error: 'save_failed' };
				else await update();
			} finally { saving = null; }
		};
	};
</script>

<svelte:head>
	<title>{isFa ? 'زبان‌های من' : 'My languages'} | Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="language-page" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader direction={isFa ? 'rtl' : 'ltr'}>
		{#snippet actions()}
			<div class="header-actions">
				<label class="display-control">{isFa ? 'نمایش' : 'Display'}
					<select aria-label={isFa ? 'زبان نمایش' : 'Display language'} value={language} onchange={e => void changeDisplay(e.currentTarget.value as 'en' | 'fa')}>
						<option value="en">English</option><option value="fa">فارسی</option>
					</select>
				</label>
			</div>
		{/snippet}
	</AppHeader>
	<section class="introduction" aria-labelledby="language-title">
		<p class="eyebrow">{isFa ? 'مسیر یادگیری تو' : 'YOUR LEARNING JOURNEY'}</p>
		<h1 id="language-title">{firstVisit ? (isFa ? 'دوست داری چه زبانی یاد بگیری؟' : 'What would you like to learn?') : (isFa ? 'زبان‌های من' : 'My languages')}</h1>
		<p>{firstVisit
			? (isFa ? 'یک زبان انتخاب کن. بعداً می‌توانی زبان‌های دیگری هم اضافه کنی.' : 'Choose a language to get started. You can add more languages later.')
			: (isFa ? 'هر زبان را از همان‌جایی که مانده‌ای ادامه بده، یا زبان تازه‌ای اضافه کن.' : 'Pick up any language where you left off, or add a new one.')}</p>
	</section>

	{#if unavailableChoice}
		<p class="notice" role="status">{isFa ? `قبلاً ${unavailableChoice.name.fa} را انتخاب کرده‌ای، اما درس‌های آن هنوز آماده نیستند.` : `You previously chose ${unavailableChoice.name.en}, but its lessons are not ready yet.`}</p>
	{/if}
	{#if form?.error}
		<p class="error" role="alert">{form.error === 'unavailable'
			? (isFa ? 'این زبان هنوز آماده نیست. لطفاً یک زبان آماده را انتخاب کن.' : 'This course is not available yet. Please choose an available language.')
			: (isFa ? 'انتخابت ذخیره نشد. اتصال اینترنت را بررسی کن و دوباره تلاش کن.' : 'Your choice could not be saved. Check your connection and try again.')}</p>
	{/if}

	<form method="POST" aria-busy={saving !== null} use:enhance={({ submitter }) => { saving = (submitter as HTMLButtonElement | null)?.value ?? ''; return submitting(); }}>
		{#if learning.length}
			<section aria-labelledby="learning-title">
				<h2 id="learning-title" class="section-title">{isFa ? 'در حال یادگیری' : 'Learning now'}</h2>
				<div class="learning">
					{#each learning as progress (progress.code)}
						{@const course = getCourse(progress.code)!}
						{@const info = summary(progress)}
						{@const share = progressShare(progress)}
						<article class="learning-card" class:active={data.currentLanguage === progress.code} aria-labelledby={`learning-${progress.code}`}>
							<div class="card-top">
								<span class={`flag flag-${course.code}`} aria-hidden="true" dir="ltr">{course.code === 'en' ? 'EN' : ''}</span>
								<div class="names"><h3 id={`learning-${progress.code}`}>{course.name[language]}</h3>{#if course.nativeName !== course.name[language]}<p class="native-name" lang={course.code} dir="ltr">{course.nativeName}</p>{/if}</div>
								{#if data.currentLanguage === progress.code}<span class="status available">{isFa ? 'آخرین زبان' : 'Last studied'}</span>{/if}
							</div>
							<div class="progress-label"><strong>{info.label}</strong><span>{fa(Math.round(share * 100))}%</span></div>
							<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(share * 100)} aria-label={isFa ? `پیشرفت ${course.name.fa}` : `${course.name.en} progress`}><span style:width={`${Math.max(share * 100, share > 0 ? 3 : 0)}%`}></span></div>
							<p class="detail">{info.detail}</p>
							<button type="submit" name="language" value={course.code} disabled={saving !== null}>
								{saving === course.code ? (isFa ? 'در حال باز کردن…' : 'Opening…') : (isFa ? `ادامهٔ ${course.name.fa}` : `Continue ${course.name.en}`)}
								<span aria-hidden="true">{isFa ? '←' : '→'}</span>
							</button>
						</article>
					{/each}
				</div>
			</section>
		{/if}

		{#if data.more.length}
			<section aria-labelledby="more-title">
				<h2 id="more-title" class="section-title">{firstVisit ? (isFa ? 'زبان‌ها' : 'Languages') : (isFa ? 'افزودن زبان' : 'Add a language')}</h2>
				<div class="courses">
					{#each data.more as code (code)}
						{@const course = getCourse(code)!}
						<article class="course" class:upcoming={!course.available} aria-labelledby={`course-${course.code}`}>
							<div class="card-top">
								<span class={`flag flag-${course.code}`} aria-hidden="true" dir="ltr">{course.code === 'en' ? 'EN' : ''}</span>
								<span class="status" class:available={course.available}>{course.code === 'en' ? (isFa ? 'آزمایشی' : 'Pilot') : course.available ? (isFa ? 'آمادهٔ شروع' : 'Available now') : (isFa ? 'به‌زودی' : 'Coming soon')}</span>
							</div>
							<h3 id={`course-${course.code}`}>{course.name[language]}</h3>
							{#if course.nativeName !== course.name[language]}<p class="native-name" lang={course.code} dir="ltr">{course.nativeName}</p>{/if}
							<p class="description">{course.description[language]}</p>
							{#if course.available}
								<button type="submit" name="language" value={course.code} disabled={saving !== null} class:secondary={!firstVisit}>
									{saving === course.code ? (isFa ? 'در حال شروع…' : 'Starting…') : (isFa ? `شروع ${course.name.fa}` : `Start ${course.name.en}`)}
									<span aria-hidden="true">{isFa ? '←' : '→'}</span>
								</button>
							{:else}
								<p class="not-ready">{isFa ? 'درس‌ها هنوز در دسترس نیستند' : 'Lessons are not available yet'}</p>
							{/if}
						</article>
					{/each}
				</div>
			</section>
		{/if}
	</form>
	<p class="display-note">{isFa ? 'زبان نمایش برنامه (انگلیسی یا فارسی) را جداگانه در تنظیمات انتخاب می‌کنی.' : 'Your English or Persian display language is a separate setting.'}</p>
</main>

<style>
	.language-page { max-width: 1120px; margin: 0 auto; padding: 24px 24px 64px; color: var(--ink); }
	.introduction { max-width: 650px; margin: 48px auto 32px; text-align: center; }
	.section-title { font: 600 .8rem var(--font-body); letter-spacing: .12em; text-transform: uppercase; color: var(--ink-soft); margin: 36px 0 14px; }
	.learning { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 20px; }
	.learning-card { display: flex; flex-direction: column; gap: 10px; padding: 26px; background: var(--paper-raised); border: 1px solid var(--control-border); border-radius: 20px; box-shadow: var(--paper-shadow); }
	.learning-card.active { border-color: var(--accent); }
	.learning-card .card-top { margin-bottom: 8px; justify-content: flex-start; }
	.learning-card .status { margin-inline-start: auto; }
	.names h3 { margin: 0; }
	.names .native-name { margin: 0; }
	.progress-label { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
	.progress-label span { color: var(--ink-soft); font-size: .9rem; }
	.bar { height: 10px; border-radius: 10px; background: var(--paper-sunken); border: 1px solid var(--line); overflow: hidden; }
	.bar span { display: block; height: 100%; background: var(--accent); border-radius: 10px; }
	.detail { color: var(--ink-soft); font-size: .9rem; line-height: 1.5; margin-bottom: 8px; flex: 1; }
	button.secondary { background: var(--paper-raised); color: var(--accent-deep); }
	button.secondary:hover { background: var(--accent-wash); }
	.eyebrow { color: var(--accent-deep); font-size: .8rem; font-weight: 600; letter-spacing: .12em; margin-bottom: 16px; }
	h1 { font-family: var(--font-display); font-weight: 500; font-size: clamp(2rem, 5vw, 3.25rem); line-height: 1.15; margin-bottom: 18px; }
	.introduction > p:last-child, .display-note { color: var(--ink-soft); line-height: 1.6; }
	.courses { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr)); gap: 24px; }
	.header-actions { display: flex; align-items: center; gap: 14px; }
	.display-control { display: flex; align-items: center; gap: 8px; color: var(--ink-soft); font-size: .8rem; }
	.display-control select { min-height: 40px; padding: 5px 8px; border: 1px solid var(--control-border); border-radius: 8px; background: var(--paper-raised); color: var(--ink); font: inherit; font-size: .85rem; }
	.course { display: flex; flex-direction: column; padding: 30px; background: var(--paper-raised); border: 1px solid var(--control-border); border-radius: 20px; box-shadow: var(--paper-shadow); }
	.upcoming { background: var(--paper-sunken); box-shadow: none; }
	.card-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 28px; }
	.flag { width: 54px; height: 36px; border-radius: 6px; box-shadow: 0 0 0 1px rgb(0 0 0 / 12%); flex-shrink: 0; }
	.flag-de { background: linear-gradient(#191919 33.33%, #b62d2b 33.33% 66.66%, #f1c54b 66.66%); }
	.flag-en { display: grid; place-items: center; background: #21468b; color: #fff; font-size: .9rem; font-weight: 600; letter-spacing: .08em; }
	.flag-fr { background: linear-gradient(to right, #21468b 33.33%, #fff 33.33% 66.66%, #c73e47 66.66%); }
	.status { font-size: .8rem; padding: 5px 10px; border-radius: 20px; background: var(--control); color: var(--ink-soft); }
	.status.available { background: var(--accent-wash); color: var(--accent-deep); }
	h3 { font: 500 1.8rem var(--font-display); margin-bottom: 4px; }
	.native-name { color: var(--ink-faint); text-align: start; margin-bottom: 18px; }
	[dir='rtl'] .native-name { text-align: right; }
	.description { color: var(--ink-soft); line-height: 1.65; margin-bottom: 28px; flex: 1; }
	button { width: 100%; min-height: 48px; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 18px; border: 1px solid var(--accent); border-radius: 10px; background: var(--accent); color: var(--on-accent); font: 600 1rem var(--font-body); cursor: pointer; }
	button:hover { background: var(--accent-deep); }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 4px; }
	button:disabled { cursor: wait; opacity: .7; }
	.not-ready { padding: 13px 0; color: var(--ink-faint); font-size: .9rem; }
	.display-note { max-width: 580px; margin: 28px auto 0; font-size: .9rem; text-align: center; }
	.notice, .error { padding: 16px; border-radius: 12px; margin-bottom: 24px; line-height: 1.6; }
	.notice { background: var(--attention-wash); color: var(--attention); }
	.error { border: 1px solid var(--miss); color: var(--miss); }
	@media (max-width: 640px) { .display-control { font-size: 0; } .display-control select { font-size: .85rem; } .language-page { padding: 16px 16px 40px; } .introduction { margin-top: 36px; } .courses { grid-template-columns: 1fr; gap: 16px; } .course, .learning-card { padding: 22px; } .card-top { margin-bottom: 20px; } }
</style>
