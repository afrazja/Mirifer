<script lang="ts">
	/**
	 * Module lab: "Listen and retell", the same module as in the daily lesson, with every story: the
	 * lab's own and the daily lessons'. The learner's best score per story is kept in their account.
	 */
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import ListenRetell from '$lib/components/ListenRetell.svelte';
	import { ALL_RETELL_PIECES, retellPieceFor } from '$lib/practice/day-content';
	import { MAX_LISTENS, formatDuration, listenSeconds, pieceImage, speakLimit, type RetellPiece, type RetellResult } from '$lib/practice/retell';
	import type { DisplayText } from '$lib/practice/hotel';
	import type { RetellRecord } from '$lib/practice/progress';
	import { getLanguage } from '$services/data-layer';
	import { ENGLISH_VOICES, stopAllAudio } from '$services/tts';

	let { data }: PageProps = $props();
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	const text = (value: DisplayText) => value[language];
	const D = (seconds: number) => (isFa ? formatDuration(seconds).replace(/\d/g, d => Number(d).toLocaleString('fa-IR')) : formatDuration(seconds));
	// svelte-ignore state_referenced_locally
	let records = $state<RetellRecord>(data.records);
	let piece = $state<RetellPiece | null>(null);
	let voice = $state<'a' | 'b' | 'c' | 'd'>('a');
	let run = $state(0);
	/** Which daily lesson a story comes from (none for the lab's own). */
	const fromDay = (item: RetellPiece) => (retellPieceFor('day-2')?.id === item.id ? { en: 'Day 2 · Professional', fa: 'روز ۲ (حرفه‌ای)' } : null);

	onMount(() => {
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		return () => stopAllAudio();
	});
	function open(next: RetellPiece) {
		stopAllAudio();
		voice = next.voice ?? ENGLISH_VOICES[Math.floor(Math.random() * ENGLISH_VOICES.length)].id;
		piece = next; run += 1;
		queueMicrotask(() => window.scrollTo({ top: 0 }));
	}
	function backToList() { stopAllAudio(); piece = null; }
	function keepBest(result: RetellResult, textShown: boolean) {
		if (!piece || !result.saved || result.covered.length < (records[piece.id]?.points ?? -1)) return;
		records = { ...records, [piece.id]: { completedAt: new Date().toISOString(), points: result.covered.length, total: result.total, textShown } };
	}
</script>

<svelte:head>
	<title>{isFa ? 'گوش بده و بازگو کن' : 'Listen and retell'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="module" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/practice/english/lab" backLabel={isFa ? 'آزمایشگاه بخش‌ها' : 'Module lab'} direction={isFa ? 'rtl' : 'ltr'} />
	{#if piece}
		<button class="quiet" type="button" onclick={backToList}><span aria-hidden="true">{isFa ? '→' : '←'}</span> {isFa ? 'همهٔ داستان‌ها' : 'All stories'}</button>
		{#key run}
			<ListenRetell {isFa} {piece} {voice} doneLabel={{ en: 'All stories', fa: 'همهٔ داستان‌ها' }} onResult={keepBest} onDone={backToList} />
		{/key}
	{:else}
		<p class="eyebrow">{isFa ? 'آزمایشگاه — شنیدن و صحبت' : 'MODULE LAB · LISTENING AND SPEAKING'}</p>
		<h1>{isFa ? 'گوش بده و بازگو کن' : 'Listen and retell'}</h1>
		<p class="lead">{isFa ? `یک داستان را بشنو (حداکثر ${(MAX_LISTENS).toLocaleString('fa-IR')} بار)، بعد با کلمات خودت تعریفش کن. می‌بینی کدام نکته‌ها را گفتی و چطور می‌شد طبیعی‌تر گفت.` : `Hear a story (up to ${MAX_LISTENS} times), then tell it in your own words. You’ll see which points you got across, and how to say things more naturally.`}</p>
		<ul class="pieces">
			{#each ALL_RETELL_PIECES as item}
				{@const best = records[item.id]}
				{@const day = fromDay(item)}
				{@const thumb = pieceImage(item, true)}
				<li><button class="piece" class:no-thumb={!thumb} type="button" onclick={() => open(item)}>
					{#if thumb}<img class="thumb" src={thumb} alt="" width="480" height="320" loading="lazy" decoding="async" />{/if}
					<span class="level">{item.level}{day ? ` · ${text(day)}` : ''}</span>
					<strong lang={isFa ? 'fa' : 'en'}>{text(item.title)}</strong>
					<span class="meta">{isFa ? 'شنیدن' : 'Listening'} ≈ {D(listenSeconds(item))}{isFa ? '، ' : ' · '}{isFa ? 'صحبت تا' : 'you speak up to'} {D(speakLimit(item))}</span>
					{#if best}<span class="best">✓ {isFa ? `بهترین: ${best.points.toLocaleString('fa-IR')} از ${best.total.toLocaleString('fa-IR')} نکته` : `Best: ${best.points} of ${best.total} key points`}{best.textShown ? (isFa ? ' (با متن)' : ' (with the text)') : ''}</span>{/if}
				</button></li>
			{/each}
		</ul>
	{/if}
</main>

<style>
	.module { max-width: 680px; margin: 0 auto; padding: 0 16px 48px; }
	.eyebrow { margin: 16px 0 4px; font-size: .78rem; font-weight: 700; letter-spacing: .08em; color: var(--accent-deep); }
	:global([dir='rtl']) .eyebrow { letter-spacing: normal; }
	h1 { margin: 0 0 10px; font-family: var(--font-display); }
	.lead { margin: 0 0 16px; color: var(--ink-soft); line-height: 1.6; }
	.quiet { min-height: 44px; margin: 8px 0; padding: 8px 0; border: 0; background: none; color: var(--accent-deep); font: inherit; font-size: .92rem; cursor: pointer; }
	.pieces { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
	.piece { inline-size: 100%; display: grid; grid-template-columns: 110px 1fr; column-gap: 14px; row-gap: 4px; align-content: center; text-align: start; padding: 12px; border: 1px solid var(--control-border); border-radius: 14px; background: var(--paper-raised); color: var(--ink); font: inherit; cursor: pointer; }
	.piece.no-thumb { grid-template-columns: 1fr; }
	.piece > :not(.thumb) { grid-column: -2 / -1; }
	.thumb { grid-column: 1; grid-row: 1 / span 4; inline-size: 110px; block-size: 80px; object-fit: cover; border-radius: 10px; background: var(--paper-sunken); }
	.piece:hover { border-color: var(--accent); }
	.piece:focus-visible, .quiet:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	.piece strong { font-size: 1.05rem; }
	.level { font-size: .72rem; font-weight: 700; letter-spacing: .06em; color: var(--accent-deep); }
	.meta { color: var(--ink-soft); font-size: .85rem; }
	.best { color: var(--accent-deep); font-size: .85rem; }
</style>
