<script lang="ts">
	/**
	 * Module lab: "Group chat" (group-chat.ts) on its own: plan Nina's surprise with Maya and Leo, at
	 * either level (Intermediate: Maya leads and Leo only reacts; Professional: both, and a twist).
	 * Each level's run is kept under the lab's own key.
	 */
	import { onMount } from 'svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import GroupChat from '$lib/components/GroupChat.svelte';
	import { getLanguage } from '$services/data-layer';
	import { stopAllAudio } from '$services/tts';
	import { loadLab, saveLab } from '$lib/practice/module-lab';
	import { asChatRecord } from '$lib/practice/group-chat';
	import { BIRTHDAY_A2, BIRTHDAY_B1 } from '$lib/practice/chats';

	const LEVELS = [
		{ id: 'a2', scene: BIRTHDAY_A2, name: { en: 'Intermediate', fa: 'متوسط' } },
		{ id: 'b1', scene: BIRTHDAY_B1, name: { en: 'Professional', fa: 'حرفه‌ای' } }
	] as const;
	const KEY = 'group-chat-level';
	let level = $state<'a2' | 'b1'>('a2');
	const scene = $derived(level === 'b1' ? BIRTHDAY_B1 : BIRTHDAY_A2);
	const ID = $derived(`group-chat:${scene.id}`);
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	let run = $state(0), finished = $state(false);
	const initialFor = () => asChatRecord(loadLab(ID), scene);
	function choose(next: 'a2' | 'b1') {
		stopAllAudio(); level = next; finished = false; run += 1;
		try { localStorage.setItem(KEY, next); } catch { /* private mode */ }
	}
	function again() { saveLab(ID, null); finished = false; run += 1; }

	onMount(() => {
		try { if (localStorage.getItem(KEY) === 'b1') { level = 'b1'; run += 1; } } catch { /* private mode */ }
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		return () => stopAllAudio();
	});
</script>

<svelte:head>
	<title>{isFa ? 'چت گروهی' : 'Group chat'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="module" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/practice/english/lab" backLabel={isFa ? 'آزمایشگاه بخش‌ها' : 'Module lab'} direction={isFa ? 'rtl' : 'ltr'} />
	<p class="eyebrow">{isFa ? 'آزمایشگاه — صحبت کردن' : 'MODULE LAB · SPEAKING'}</p>
	<h1>{isFa ? 'چت گروهی' : 'Group chat'}</h1>
	<div class="levels" role="group" aria-label={isFa ? 'سطح' : 'Level'}>
		{#each LEVELS as option}
			<button type="button" aria-pressed={level === option.id} onclick={() => choose(option.id)}>{isFa ? option.name.fa : option.name.en}</button>
		{/each}
	</div>
	{#if finished}
		<p>{isFa ? 'تمام شد.' : 'All done.'}</p>
		<button class="primary" type="button" onclick={again}>{isFa ? 'دوباره امتحان کن' : 'Try it again'}</button>
	{:else}
		{#key run}
			<GroupChat {isFa} {scene} initial={initialFor()} onSave={record => saveLab(ID, record)} onDone={() => (finished = true)} />
		{/key}
	{/if}
</main>

<style>
	.module { max-width: 680px; margin: 0 auto; padding: 0 16px 48px; }
	.eyebrow { margin: 16px 0 4px; font-size: .78rem; font-weight: 700; letter-spacing: .08em; color: var(--accent-deep); }
	:global([dir='rtl']) .eyebrow { letter-spacing: normal; }
	h1 { margin: 0 0 10px; font-family: var(--font-display); }
	.levels { display: flex; gap: 8px; margin-block-end: 14px; }
	.levels button { min-height: 44px; padding: 8px 16px; border: 1px solid var(--line); border-radius: 999px; background: var(--paper-raised); color: var(--ink); font: inherit; font-weight: 600; cursor: pointer; }
	.levels button[aria-pressed='true'] { border-color: var(--accent); background: var(--accent-wash); color: var(--accent-deep); }
	.primary { min-height: 52px; padding: 12px 22px; border: 0; border-radius: 12px; background: var(--accent); color: var(--on-accent); font: inherit; font-weight: 600; cursor: pointer; }
</style>
