<script lang="ts">
	/**
	 * Module lab: "Listen and connect", the same module as in the daily lesson, on its own, with any
	 * day's conversation and questions. Each set's run is kept under the lab's own key, apart from the
	 * daily lesson's records.
	 */
	import { onMount } from 'svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import ListenConnect from '$lib/components/ListenConnect.svelte';
	import { getLanguage } from '$services/data-layer';
	import { playAudioPromise, stopAllAudio } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { loadLab, saveLab } from '$lib/practice/module-lab';
	import { asConnectRecord } from '$lib/practice/listen-connect';
	import { connectSetFor } from '$lib/practice/day-content';
	import LabSetPicker from '$lib/components/LabSetPicker.svelte';
	import { labModule, saveLabSet, savedLabSet, type LabSet } from '$lib/practice/lab-sets';

	let set = $state<LabSet>(typeof localStorage === 'undefined' ? savedLabSet('') : savedLabSet('listen-connect'));
	const ID = $derived(`listen-connect:${set.id}`);
	const content = $derived(connectSetFor(set.day, set.track));
	// Mira's instruction, word for word as in that day's lesson.
	const module = $derived(labModule(set, 'listen-act')!);
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	let intro = $state<'full' | 'compact' | 'hidden'>('full');
	let run = $state(0), finished = $state<{ correct: number; total: number } | null>(null);
	// A finished run starts again; an unfinished one comes back where it was.
	function initialFor() { const saved = asConnectRecord(loadLab(ID), content); return saved?.done ? null : saved; }
	function choose(next: LabSet) { stopAllAudio(); set = next; finished = null; run += 1; intro = 'full'; saveLabSet('listen-connect', next.id); speakIntro(); }
	function speakIntro() { void playAudioPromise(module.intro.en.replace(/[’`]/g, m => (m === '’' ? "'" : '')), COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {}); }

	onMount(() => {
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		if (!initialFor()) speakIntro();
		return () => stopAllAudio();
	});
	function again() { saveLab(ID, null); finished = null; run += 1; intro = 'full'; }
</script>

<svelte:head>
	<title>{isFa ? 'گوش بده و وصل کن' : 'Listen and connect'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="module" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/practice/english/lab" backLabel={isFa ? 'آزمایشگاه بخش‌ها' : 'Module lab'} direction={isFa ? 'rtl' : 'ltr'} />
	<p class="eyebrow">{isFa ? 'آزمایشگاه — شنیدن' : 'MODULE LAB · LISTENING'}</p>
	<h1>{isFa ? 'گوش بده و وصل کن' : 'Listen and connect'}</h1>
	<LabSetPicker {isFa} current={set} onChoose={choose} />
	{#if finished}
		<p>{isFa ? `تمام شد: ${finished.correct.toLocaleString('fa-IR')} از ${finished.total.toLocaleString('fa-IR')}.` : `All done: ${finished.correct} of ${finished.total}.`}</p>
		<button class="primary" type="button" onclick={again}>{isFa ? 'دوباره امتحان کن' : 'Try it again'}</button>
	{:else}
		{#if intro === 'full'}
			<div class="brief"><span class="avatar" aria-hidden="true">M</span><p lang={isFa ? 'fa' : 'en'} dir={isFa ? 'rtl' : 'ltr'}>{(isFa ? module.intro.fa : module.intro.en).replace(/`/g, '')}</p></div>
		{/if}
		{#key run}
			<ListenConnect {isFa} set={content} initial={initialFor()} onFocus={mode => (intro = mode)} onSave={record => saveLab(ID, record)} onDone={score => (finished = score)} />
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
