<script lang="ts">
	/**
	 * Module lab: "Role-play with a surprise", the daily lesson's module on its own, with any day's
	 * scene (Day 1: the hotel; Day 2: the call about the phone left in the taxi). Each scene's run is
	 * kept under the lab's own key. The full hotel pilot page stays at /practice/english.
	 */
	import { onMount } from 'svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import RolePlay from '$lib/components/RolePlay.svelte';
	import LabSetPicker from '$lib/components/LabSetPicker.svelte';
	import { getLanguage } from '$services/data-layer';
	import { stopAllAudio } from '$services/tts';
	import { loadLab, saveLab } from '$lib/practice/module-lab';
	import { asRolePlayRecord } from '$lib/practice/roleplay';
	import { roleSceneFor } from '$lib/practice/day-content';
	import { saveLabSet, savedLabSet, type LabSet } from '$lib/practice/lab-sets';

	let set = $state<LabSet>(typeof localStorage === 'undefined' ? savedLabSet('') : savedLabSet('role-play'));
	const scene = $derived(roleSceneFor(set.day));
	const ID = $derived(`role-play:${scene.id}`);
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	let run = $state(0), finished = $state(false);
	const initialFor = () => asRolePlayRecord(loadLab(ID), scene);
	function choose(next: LabSet) { stopAllAudio(); set = next; finished = false; run += 1; saveLabSet('role-play', next.id); }
	function again() { saveLab(ID, null); finished = false; run += 1; }

	onMount(() => {
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		return () => stopAllAudio();
	});
</script>

<svelte:head>
	<title>{isFa ? 'نقش‌آفرینی با غافلگیری' : 'Role-play with a surprise'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="module" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/practice/english/lab" backLabel={isFa ? 'آزمایشگاه بخش‌ها' : 'Module lab'} direction={isFa ? 'rtl' : 'ltr'} />
	<p class="eyebrow">{isFa ? 'آزمایشگاه — صحبت کردن' : 'MODULE LAB · SPEAKING'}</p>
	<h1>{isFa ? 'نقش‌آفرینی با غافلگیری' : 'Role-play with a surprise'}</h1>
	<LabSetPicker {isFa} current={set} onChoose={choose} />
	{#if finished}
		<p>{isFa ? 'تمام شد.' : 'All done.'}</p>
		<button class="primary" type="button" onclick={again}>{isFa ? 'دوباره امتحان کن' : 'Try it again'}</button>
	{:else}
		{#key run}
			<RolePlay {isFa} {scene} initial={initialFor()} onSave={record => saveLab(ID, record)} onDone={() => (finished = true)} />
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
