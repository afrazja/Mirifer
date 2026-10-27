<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import StepRunner from '$lib/components/StepRunner.svelte';
	import { getLanguage } from '$services/data-layer';
	import { stopAllAudio } from '$services/tts';

	let { data }: PageProps = $props();
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	onMount(() => { void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; }); });

	/** The back arrow pauses: the step keeps its place, and the dashboard's button brings the learner back. */
	function pause() { stopAllAudio(); void goto('/practice/english/progress'); }
</script>

<svelte:head>
	<title>{isFa ? 'تمرین انگلیسی' : 'English practice'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="step" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/practice/english/progress" backLabel={isFa ? 'پیشرفت' : 'Progress'} direction={isFa ? 'rtl' : 'ltr'} onBack={pause} logo={false} />
	{#key data.step}
		<StepRunner step={data.step} dayId={data.dayId} moduleId={data.moduleId} index={data.index} total={data.total} replay={data.replay}
			track={data.track} startedAt={data.startedAt} {isFa} labAccess={data.labAccess} name={data.name} />
	{/key}
</main>

<style>
	.step { max-width: 720px; margin: 0 auto; padding: 24px 20px 64px; color: var(--ink); }
</style>
