<script lang="ts">
	/** Module lab: "Voice messages" on its own, to try and judge before it joins a daily lesson. */
	import { onMount } from 'svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import VoiceMessages from '$lib/components/VoiceMessages.svelte';
	import { getLanguage } from '$services/data-layer';
	import { stopAllAudio } from '$services/tts';
	import { loadLab, saveLab } from '$lib/practice/module-lab';
	import { asVoiceRecord } from '$lib/practice/voice-messages';
	import { voiceMessagesFor, voiceMessagesIntro } from '$lib/practice/day-content';
	import LabSetPicker from '$lib/components/LabSetPicker.svelte';
	import { LAB_CHAPTER_SETS, saveLabSet, savedLabSet, type LabSet } from '$lib/practice/lab-sets';

	/** One set of messages per day (both versions share Day 2's). */
	const SETS: LabSet[] = LAB_CHAPTER_SETS;
	const remembered = typeof localStorage === 'undefined' ? SETS[0] : savedLabSet('voice-messages');
	let set = $state<LabSet>(SETS.find(item => item.day === remembered.day) ?? SETS[0]);
	const messages = $derived(voiceMessagesFor(set.day, true));
	const intro = $derived(voiceMessagesIntro(set.day));
	const ID = $derived(`voice-messages:${set.day}`);
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	let run = $state(0), finished = $state(false);
	function initialFor() { const saved = asVoiceRecord(loadLab(ID), messages); return saved?.done ? null : saved; }
	function choose(next: LabSet) { stopAllAudio(); set = next; finished = false; run += 1; saveLabSet('voice-messages', next.id); }
	// A finished round starts again; an unfinished one comes back where it was.

	onMount(() => {
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		return () => stopAllAudio();
	});
	function again() { saveLab(ID, null); finished = false; run += 1; }
</script>

<svelte:head>
	<title>{isFa ? 'پیام صوتی' : 'Voice messages'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="module" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/practice/english/lab" backLabel={isFa ? 'آزمایشگاه بخش‌ها' : 'Module lab'} direction={isFa ? 'rtl' : 'ltr'} />
	<p class="eyebrow">{isFa ? 'آزمایشگاه — شنیدن و صحبت' : 'MODULE LAB · LISTENING & SPEAKING'}</p>
	<h1>{isFa ? 'پیام صوتی' : 'Voice messages'}</h1>
	<LabSetPicker {isFa} current={set} sets={SETS} onChoose={choose} />
	{#if finished}
		<p>{isFa ? 'تمام شد.' : 'All done.'}</p>
		<button class="primary" type="button" onclick={again}>{isFa ? 'دوباره امتحان کن' : 'Try it again'}</button>
	{:else}
		{#key run}
			<VoiceMessages {isFa} {messages} {intro} initial={initialFor()} onSave={record => saveLab(ID, record)} onDone={() => (finished = true)} />
		{/key}
	{/if}
</main>

<style>
	.module { max-width: 680px; margin: 0 auto; padding: 0 16px 48px; }
	.eyebrow { margin: 16px 0 4px; font-size: .78rem; font-weight: 700; letter-spacing: .08em; color: var(--accent-deep); }
	:global([dir='rtl']) .eyebrow { letter-spacing: normal; }
	h1 { margin: 0 0 10px; font-family: var(--font-display); }
	.primary { min-height: 52px; padding: 12px 22px; border: 0; border-radius: 12px; background: var(--accent); color: var(--on-accent); font: inherit; font-weight: 600; cursor: pointer; }
</style>
