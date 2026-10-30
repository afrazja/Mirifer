<script lang="ts">
	/**
	 * Module lab: one step of a chapter on its own, as the path shows it (Mira's note, the module,
	 * the score), with that chapter's content and version. A run is kept in this browser until it
	 * ends, so a reload comes back to it; nothing goes to the learner's path.
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import ChapterModule from '$lib/components/ChapterModule.svelte';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { TRACK_NAMES, dayById, DAY_ONE } from '$lib/practice/day';
	import { chapterModules } from '$lib/practice/path';
	import { loadLab, saveLab } from '$lib/practice/module-lab';
	import { phraseScore, scoreLine, type StepScore } from '$lib/practice/step-feedback';
	import { getLanguage } from '$services/data-layer';
	import { playAudioPromise, stopAllAudio } from '$services/tts';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const num = (n: number) => (isFa ? n.toLocaleString('fa-IR') : String(n));

	const day = $derived(dayById(data.dayId) ?? DAY_ONE);
	const steps = $derived(chapterModules(day, data.track));
	const index = $derived(steps.findIndex(item => item.id === data.moduleId));
	const mod = $derived(steps[index]);
	const next = $derived(steps[index + 1] ?? null);
	const KEY = $derived(`chapter:${data.dayId}:${data.track}:${data.moduleId}`);
	const back = $derived(`/practice/english/lab/chapters?day=${data.dayId}&track=${data.track}`);

	/** As on the path: crowded modules (and a chapter's first step) open with Mira's note on its own screen. */
	const BRIEF_FIRST = new Set(['phrases', 'choose-persuade', 'scenario', 'group-chat']);
	const briefFirst = () => (index === 0 && !day.topic) || BRIEF_FIRST.has(data.moduleId);
	// svelte-ignore state_referenced_locally
	let stage = $state<'brief' | 'module' | 'done'>(briefFirst() ? 'brief' : 'module');
	let intro = $state<'full' | 'compact' | 'hidden'>('full');
	let outcome = $state<'done' | 'skipped'>('done');
	let score = $state<StepScore | null>(null);
	let run = $state(0);
	let introPlay = $state<Promise<void> | null>(null);
	/** Mira's first line of the chapter goes with its first step, as on the path. */
	const story = $derived(index === 0 ? day.checkIn?.story ?? null : null);

	function say() {
		stopAllAudio();
		const line = `${story && stage === 'brief' ? `${story.en} ` : ''}${mod.intro.en}`;
		introPlay = playAudioPromise(line, COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {});
	}
	function start() { stopAllAudio(); stage = 'module'; intro = 'full'; }
	function end(result: 'done' | 'skipped', given?: StepScore, record?: unknown) {
		stopAllAudio();
		outcome = result;
		score = result === 'done' ? given ?? (mod.id === 'phrases' ? phraseScore(record) : null) ?? null : null;
		saveLab(KEY, null);
		stage = 'done';
		scrollTo(0, 0);
	}
	function again() { saveLab(KEY, null); run += 1; intro = 'full'; stage = briefFirst() ? 'brief' : 'module'; scrollTo(0, 0); }
	const line = $derived(scoreLine(mod.id, score));

	onMount(() => {
		if (loadLab(KEY) !== null) stage = 'module';
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		return () => stopAllAudio();
	});
</script>

<svelte:head>
	<title>{isFa ? mod.title.fa : mod.title.en} | {T('Module lab', 'آزمایشگاه بخش‌ها')} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="lab" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref={back} backLabel={T('Chapters', 'فصل‌ها')} direction={isFa ? 'rtl' : 'ltr'} />
	<p class="eyebrow">{T(`LAB · ${day.themePhrase.toUpperCase()} · STEP ${index + 1} OF ${steps.length} · ${TRACK_NAMES[data.track].en.toUpperCase()}`, `آزمایشگاه · ${day.theme.fa} · مرحلهٔ ${num(index + 1)} از ${num(steps.length)} · ${TRACK_NAMES[data.track].fa}`)}</p>

	{#if stage === 'brief'}
		<h1>{isFa ? mod.title.fa : mod.title.en}</h1>
		<div class="brief">
			<span class="avatar" aria-hidden="true">M</span>
			<div class="brief-text" lang={isFa ? 'fa' : 'en'}>
				{#if story}<p class="brief-line story">{isFa ? story.fa : story.en}</p>{/if}
				<p class="brief-line">{isFa ? mod.intro.fa : mod.intro.en}</p>
			</div>
		</div>
		<button class="hear" type="button" onclick={say}><span aria-hidden="true">🔊</span> {T('Hear Mira', 'شنیدن صدای میرا')}</button>
		<ActionBar label={T('Start', 'شروع')} onclick={start} secondary={{ label: T('Back to the chapter', 'برگشت به فصل'), onclick: () => void goto(back) }} />

	{:else if stage === 'module'}
		<h1>{isFa ? mod.title.fa : mod.title.en}</h1>
		{#if intro === 'full' && !briefFirst()}
			<div class="brief"><span class="avatar" aria-hidden="true">M</span><div class="brief-text" lang={isFa ? 'fa' : 'en'}><p class="brief-line">{isFa ? mod.intro.fa : mod.intro.en}</p></div></div>
		{/if}
		{#key run}
			<ChapterModule dayId={day.id} {mod} track={data.track} {isFa} name={data.name} initial={loadLab(KEY)} afterIntro={introPlay}
				onSave={record => saveLab(KEY, record)} onFocus={mode => (intro = mode)} onSkip={() => end('skipped')} onDone={(given, record) => end('done', given, record)} />
		{/key}

	{:else}
		<div class="done-mark" aria-hidden="true">{outcome === 'done' ? '✓' : '→'}</div>
		<h1>{outcome === 'done' ? T('Step done.', 'این مرحله تمام شد.') : T('Step skipped.', 'این مرحله رد شد.')}</h1>
		{#if line}<div class="score"><span class="score-value">{isFa ? line.valueFa : line.value}</span><span class="score-label">{isFa ? line.label.fa : line.label.en}</span></div>{/if}
		<p class="small">{T('Lab run: your path hasn’t changed.', 'اجرای آزمایشی: مسیرت تغییری نکرده است.')}</p>
		<button class="again" type="button" onclick={again}>{T('Do this step again', 'این مرحله را دوباره انجام بده')}</button>
		<ActionBar label={next ? T(`Next: ${next.title.en}`, `بعدی: ${next.title.fa}`) : T('Back to the chapter', 'برگشت به فصل')}
			onclick={() => void goto(next ? `/practice/english/lab/chapters/step?day=${data.dayId}&track=${data.track}&module=${next.id}` : back)}
			secondary={next ? { label: T('Back to the chapter', 'برگشت به فصل'), onclick: () => void goto(back) } : null} />
	{/if}
	<div class="bar-space" aria-hidden="true"></div>
</main>

<style>
	.lab { max-width: 680px; margin: 0 auto; padding: 0 16px 48px; }
	.eyebrow { margin: 16px 0 8px; font-size: .74rem; font-weight: 700; letter-spacing: .08em; color: var(--accent-deep); }
	:global([dir='rtl']) .eyebrow { letter-spacing: normal; }
	h1 { font-family: var(--font-display); font-weight: 500; font-size: clamp(1.6rem, 5vw, 2.2rem); line-height: 1.2; margin: 0 0 14px; }
	.brief { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; margin: 8px 0 16px; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.avatar { display: grid; place-items: center; inline-size: 40px; block-size: 40px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.brief-text { display: grid; gap: 10px; }
	.brief-line { margin: 0; font-size: 1.04rem; line-height: 1.55; }
	.story { color: var(--ink-soft); }
	.hear, .again { display: inline-flex; gap: 8px; align-items: center; min-height: 44px; padding: 8px 14px; border: 1.5px solid var(--control-border); border-radius: 999px; background: var(--paper-raised); color: var(--accent-deep); font: inherit; font-weight: 600; cursor: pointer; }
	.small { color: var(--ink-soft); font-size: .9rem; }
	.done-mark { display: grid; place-items: center; inline-size: 64px; block-size: 64px; margin: 28px 0 8px; border-radius: 50%; background: var(--leaf-wash); color: var(--leaf-deep); font-size: 1.8rem; font-weight: 700; }
	.score { display: flex; align-items: baseline; gap: 10px; margin: 12px 0 0; }
	.score-value { font-family: var(--font-display); font-size: 2rem; font-weight: 600; color: var(--accent-deep); }
	.score-label { color: var(--ink-soft); }
	.bar-space { block-size: 110px; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
</style>
