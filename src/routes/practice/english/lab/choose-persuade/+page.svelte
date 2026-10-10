<script lang="ts">
	/** Module lab: "Choose and persuade" on its own, to try and judge before it joins a daily lesson. */
	import { onMount } from 'svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import ChoosePersuade from '$lib/components/ChoosePersuade.svelte';
	import { getLanguage } from '$services/data-layer';
	import { playAudioPromise, stopAllAudio } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { loadLab, saveLab } from '$lib/practice/module-lab';
	import { asPersuadeRecord } from '$lib/practice/persuade';

	const INTRO = {
		en: 'You’re moving to a new city for work, and you can rent one of these two apartments. Look at both, and pick one. Then tell me why, and I’ll try to change your mind.',
		fa: 'برای کار به یک شهر تازه می‌روی و می‌توانی یکی از این دو آپارتمان را اجاره کنی. هر دو را ببین و یکی را انتخاب کن. بعد بگو چرا، و من سعی می‌کنم نظرت را عوض کنم.'
	};
	const ID = 'choose-persuade';
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	let intro = $state<'full' | 'compact' | 'hidden'>('full');
	let run = $state(0), finished = $state(false);
	const initial = asPersuadeRecord(loadLab(ID));

	onMount(() => {
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		if (!initial) void playAudioPromise(INTRO.en.replace(/’/g, "'"), COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {});
		return () => stopAllAudio();
	});
	function again() { saveLab(ID, null); finished = false; run += 1; intro = 'full'; }
</script>

<svelte:head>
	<title>{isFa ? 'انتخاب کن و قانع کن' : 'Choose and persuade'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="module" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/practice/english/lab" backLabel={isFa ? 'آزمایشگاه بخش‌ها' : 'Module lab'} direction={isFa ? 'rtl' : 'ltr'} />
	<p class="eyebrow">{isFa ? 'آزمایشگاه — صحبت کردن' : 'MODULE LAB · SPEAKING'}</p>
	<h1>{isFa ? 'انتخاب کن و قانع کن' : 'Choose and persuade'}</h1>
	{#if finished}
		<p>{isFa ? 'تمام شد.' : 'All done.'}</p>
		<button class="primary" type="button" onclick={again}>{isFa ? 'دوباره امتحان کن' : 'Try it again'}</button>
	{:else}
		{#if intro === 'full'}
			<div class="brief"><span class="avatar" aria-hidden="true">M</span><p lang={isFa ? 'fa' : 'en'} dir={isFa ? 'rtl' : 'ltr'}>{isFa ? INTRO.fa : INTRO.en}</p></div>
		{/if}
		{#key run}
			<ChoosePersuade {isFa} initial={run === 0 ? initial : null} onFocus={mode => (intro = mode)} onSave={record => saveLab(ID, record)} onDone={() => (finished = true)} />
		{/key}
	{/if}
</main>

<style>
	.module { max-width: 680px; margin: 0 auto; padding: 0 16px 48px; }
	.eyebrow { margin: 16px 0 4px; font-size: .78rem; font-weight: 700; letter-spacing: .08em; color: var(--accent-deep); }
	:global([dir='rtl']) .eyebrow { letter-spacing: normal; }
	h1 { margin: 0 0 10px; font-family: var(--font-display); }
	.brief { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; margin: 4px 0 14px; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.brief p { margin: 0; line-height: 1.55; }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.primary { min-height: 52px; padding: 12px 22px; border: 0; border-radius: 12px; background: var(--accent); color: var(--on-accent); font: inherit; font-weight: 600; cursor: pointer; }
</style>
