<script lang="ts">
	/**
	 * One Practice module on its own (src/routes/practice/english/practice/[module]). An unfinished run comes back where it was; a finished one
	 * shows its end screen, and "Try again" goes on to the next card, question or opener. When the
	 * day's practice or voice limit is used up, a calm "come back tomorrow" screen replaces it.
	 */
	import { onMount, untrack } from 'svelte';
	import { goto } from '$app/navigation';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import SpeakingCard from '$lib/components/SpeakingCard.svelte';
	import QuickFire from '$lib/components/QuickFire.svelte';
	import SayBetterLab from '$lib/components/SayBetterLab.svelte';
	import ReadRate from '$lib/components/ReadRate.svelte';
	import FreeTalk from '$lib/components/FreeTalk.svelte';
	import DictationSprint from '$lib/components/DictationSprint.svelte';
	import Traps from '$lib/components/Traps.svelte';
	import { trapsFor } from '$lib/practice/day-content';
	import { DAYS } from '$lib/practice/day';
	import { asTrapsRecord, type TrapsRecord } from '$lib/practice/traps';
	import { getLanguage } from '$services/data-layer';
	import { stopAllAudio } from '$services/tts';
	import { dailyLimit } from '$services/practice-fetch';
	import { PRACTICE_GROUPS, PRACTICE_MODULES, loadPractice, savePractice, type PracticeId } from '$lib/practice/practice-area';
	import { CARDS, asCardRecord, emptyCardRecord } from '$lib/practice/speaking-card';
	import { LAB_QUESTIONS, asLabRecord, emptyLabRecord } from '$lib/practice/say-better-lab';
	import { OPENERS, asQuickFire, emptyQuickFire } from '$lib/practice/quick-fire';
	import { asReadRate } from '$lib/practice/read-rate';
	import { asFreeTalk } from '$lib/practice/free-talk';
	import { asDictation } from '$lib/practice/dictation';

	let props: { learnerId: string; module: PracticeId } = $props();
	// The page rebuilds this component for each module ({#key}), so these are fixed for its life.
	const { learnerId, id } = untrack(() => ({ learnerId: props.learnerId, id: props.module }));
	const info = PRACTICE_MODULES[id];
	const group = PRACTICE_GROUPS.find(g => g.ids.includes(id))!;
	const HUB = '/practice/english/practice';

	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const load = () => loadPractice(learnerId, id);
	const save = (value: unknown) => savePractice(learnerId, id, value);

	/** Whether this learner has done this module here before (the module's own first-time intro). */
	const seenBefore = load() !== null;
	/**
	 * Traps: each round is one day's sentences (the airport, the taxi, the hotel), kept as
	 * { day, record }; "Try another one" goes on to the next day's.
	 */
	type TrapsRun = { day: string; record: TrapsRecord | null };
	/** Only days released to learners (a day still in testing stays out of Practice). */
	const TRAP_DAYS: string[] = DAYS.filter(day => day.ready).map(day => day.id);
	function trapsRun(): TrapsRun {
		const value = load() as { day?: unknown; record?: unknown } | null;
		const day = typeof value?.day === 'string' && TRAP_DAYS.includes(value.day) ? value.day : TRAP_DAYS[0];
		return { day, record: asTrapsRecord(value?.record, trapsFor(day, true)) };
	}
	function nextTrapsRun(): TrapsRun {
		const run = trapsRun();
		if (!run.record?.done) return run;
		const day = TRAP_DAYS[(TRAP_DAYS.indexOf(run.day) + 1) % TRAP_DAYS.length];
		return { day, record: null };
	}
	let trapsDay = $state(TRAP_DAYS[0]);

	/** A finished run in storage: show its end screen, not a silent restart. */
	function savedDone(): boolean {
		const value = load();
		const done = id === 'traps' ? trapsRun().record?.done : (value as { done?: unknown } | null)?.done;
		return id !== 'free-talk' && done === true;
	}
	/** What a run starts with: the unfinished run, or after a finished one, the next item. */
	function startWith(): unknown {
		const value = load();
		switch (id) {
			case 'speaking-card': { const r = asCardRecord(value); return !r ? null : r.done ? emptyCardRecord((r.card % CARDS.length) + 1) : r; }
			case 'say-better': { const r = asLabRecord(value); return !r ? null : r.done ? emptyLabRecord((r.question % LAB_QUESTIONS.length) + 1) : r; }
			case 'quick-fire': { const r = asQuickFire(value); return !r ? null : r.done ? emptyQuickFire((r.opener + 1) % OPENERS.length) : r; }
			case 'read-rate': { const r = asReadRate(value); return r && !r.done ? r : null; }
			case 'free-talk': return asFreeTalk(value);
			case 'dictation': { const r = asDictation(value); return r && !r.done ? r : null; }
			case 'traps': { const next = nextTrapsRun(); trapsDay = next.day; return next.record; }
			default: return null;
		}
	}

	let run = $state(0);
	let finished = $state<'done' | 'later' | null>(savedDone() ? 'done' : null);
	let initial = $state<unknown>(savedDone() ? null : startWith());

	onMount(() => {
		dailyLimit.set(null);
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		return () => { stopAllAudio(); dailyLimit.set(null); };
	});
	function again() { stopAllAudio(); initial = startWith(); finished = null; run += 1; }
	function back() { stopAllAudio(); void goto(HUB); }
	const onDone = () => (finished = 'done');

	const limitText = $derived($dailyLimit === 'voice'
		? T('You’ve used today’s speaking time. Come back tomorrow to keep practicing.', 'وقت صحبت امروزت تمام شد. فردا برگرد و تمرین را ادامه بده.')
		: $dailyLimit === 'practice'
			? T('You’ve done all the practice for today. Come back tomorrow; your daily lesson is still open.', 'تمرین امروزت کامل شد. فردا برگرد؛ درس روزانه‌ات هنوز باز است.')
			: T('Today’s coaching is used up. Come back tomorrow.', 'سهم امروزت از بازخورد میرا تمام شد. فردا برگرد.'));
</script>

<svelte:head>
	<title>{T(info.title.en, info.title.fa)} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="module" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref={HUB} backLabel={T('Practice', 'تمرین')} direction={isFa ? 'rtl' : 'ltr'} />
	<p class="eyebrow">{T(`PRACTICE · ${group.title.en.toUpperCase()}`, `تمرین — ${group.title.fa}`)}</p>
	<!-- Each module shows its own title; the end screens show the module's here. -->
	{#if $dailyLimit || finished}<h1>{T(info.title.en, info.title.fa)}</h1>{/if}

	{#if $dailyLimit}
		<p class="lead" role="status">{limitText}</p>
		<ActionBar label={T('Back to Practice', 'برگشت به تمرین')} onclick={back} />
	{:else if finished === 'done'}
		<p class="lead">{T('Well done. That’s one round finished.', 'آفرین. یک دور تمام شد.')}</p>
		<ActionBar label={T('Back to Practice', 'برگشت به تمرین')} onclick={back} secondary={{ label: T('Try another one', 'یکی دیگر'), onclick: again }} />
	{:else if finished === 'later'}
		<p class="lead">{T('Your place is saved. You can finish it later.', 'جایت ذخیره شد. بعداً می‌توانی تمامش کنی.')}</p>
		<ActionBar label={T('Back to Practice', 'برگشت به تمرین')} onclick={back} secondary={{ label: T('Keep going', 'ادامه بده'), onclick: again }} />
	{:else}
		{#key run}
			{#if id === 'speaking-card'}<SpeakingCard {isFa} initial={initial as never} first={run === 0 && !seenBefore} onSave={save} {onDone} />
			{:else if id === 'quick-fire'}<QuickFire {isFa} initial={initial as never} first={run === 0 && !seenBefore} onSave={save} {onDone} />
			{:else if id === 'say-better'}<SayBetterLab {isFa} initial={initial as never} first={run === 0 && !seenBefore} onSave={save} {onDone} />
			{:else if id === 'read-rate'}<ReadRate {isFa} initial={initial as never} first={run === 0 && !seenBefore} onSave={save} {onDone} />
			{:else if id === 'free-talk'}<FreeTalk {isFa} initial={initial as never} first={run === 0 && !seenBefore} onSave={save} {onDone} />
			{:else if id === 'traps'}<Traps {isFa} traps={trapsFor(trapsDay, true)} initial={initial as never} onSave={record => save({ day: trapsDay, record })} onDone={onDone} />
			{:else if id === 'dictation'}<DictationSprint {isFa} initial={initial as never} first={run === 0 && !seenBefore} onSave={save} {onDone} onLater={() => (finished = 'later')} />{/if}
		{/key}
	{/if}
</main>

<style>
	.module { max-width: 680px; margin: 0 auto; padding: 0 16px 140px; color: var(--ink); }
	.eyebrow { margin: 16px 0 4px; font-size: .78rem; font-weight: 700; letter-spacing: .08em; color: var(--accent-deep); }
	:global([dir='rtl']) .eyebrow { letter-spacing: normal; }
	h1 { margin: 0 0 10px; font-family: var(--font-display); font-weight: 500; }
	.lead { line-height: 1.65; }
</style>
