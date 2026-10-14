<script lang="ts">
	/**
	 * "Spot the lie", Module lab (docs/english-spot-the-lie-spec.md, owner-approved).
	 * A short talk (audio only, one play plus one replay), then three statements read by Mira, also
	 * audio only; the learner picks the lie. The text appears only at the reveal, with the sentence
	 * that proves it. Checked in code, no AI.
	 */
	import { onMount } from 'svelte';
	import { playAudioPromise, playAudioUrl, stopAllAudio, ttsUrl, type TTSVoice } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import MixedText from '$lib/components/MixedText.svelte';
	import {
		LETTERS, MAX_TALK_PLAYS, STATEMENT_VOICE, TALKS, TRAP_LABEL, emptyLie, statementLine, summarize, talkText, type LieRecord
	} from '$lib/practice/spot-the-lie';

	let { isFa = false, initial = null, first = false, onSave, onDone }: {
		isFa?: boolean;
		initial?: LieRecord | null;
		first?: boolean;
		onSave?: (record: LieRecord) => void;
		onDone: () => void;
	} = $props();

	const INTRO = {
		en: `You’ll hear ${TALKS.length} people talk about their lives. After each one, I’ll say three sentences about it. Two are true, and one is a lie. Listen carefully and find the lie. Watch out: the lie often uses the same words as the talk.`,
		fa: `حرف‌های ${TALKS.length.toLocaleString('fa-IR')} نفر را دربارهٔ زندگی‌شان می‌شنوی. بعد از هر کدام، سه جمله دربارهٔ حرف‌هایش می‌گویم. دو تا درست است و یکی دروغ. با دقت گوش بده و دروغ را پیدا کن. حواست باشد: جملهٔ دروغ اغلب همان کلمه‌هایی را دارد که شنیدی.`
	};

	// svelte-ignore state_referenced_locally
	let record = $state<LieRecord>(initial ?? emptyLie());
	let stage = $state<'start' | 'talk' | 'result'>('start');
	/** What's playing: the talk, one statement, the proof, or nothing. */
	let playing = $state<'talk' | 0 | 1 | 2 | 'proof' | null>(null), failed = $state(false), selected = $state<number | null>(null), announce = $state('');
	let sequence = 0;
	let heading: HTMLElement | undefined = $state(), resultLine: HTMLElement | undefined = $state();
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const fa = (n: number) => n.toLocaleString('fa-IR');
	const index = $derived(Math.min(record.index, TALKS.length - 1));
	const talk = $derived(TALKS[index]);
	const plays = $derived(record.plays[index] ?? 0);
	const heard = $derived(record.heard[index] ?? [false, false, false]);
	const pick = $derived(record.picks[index]);
	const allHeard = $derived(heard.every(Boolean));

	onMount(() => {
		// A reload returns to the same talk and step; nothing plays by itself.
		if (record.done || record.index >= TALKS.length) stage = 'result';
		else if (record.index > 0 || record.step !== 'listen' || record.plays[0] > 0) stage = 'talk';
		else if (first) void playAudioPromise(INTRO.en.replace(/’/g, "'"), COACH_RATE, 'en-US', undefined, COACH_VOICE);
		return () => stopAllAudio();
	});

	function persist() { onSave?.($state.snapshot(record)); }
	const clean = (text: string) => text.replace(/[’‘]/g, "'");
	async function play(text: string, voice: TTSVoice): Promise<boolean> {
		const { url, playback } = ttsUrl(clean(text), 'en-US', 1, voice);
		let started = false;
		await playAudioUrl(url, 15_000, playback, () => { started = true; });
		return started;
	}
	function stop() { sequence++; stopAllAudio(); playing = null; }
	function setStep(step: LieRecord['step']) { record = { ...record, step }; persist(); queueMicrotask(() => heading?.focus()); }

	/** The talk: a play counts the moment it starts; a failed play costs nothing. */
	async function listen() {
		if (plays >= MAX_TALK_PLAYS || playing === 'talk') return;
		stop(); failed = false; playing = 'talk'; announce = '';
		const at = index;
		const { url, playback } = ttsUrl(clean(talkText(talk)), 'en-US', 1, talk.voice);
		let started = false;
		await playAudioUrl(url, 20_000, playback, () => {
			if (started) return;
			started = true;
			const used = [...record.plays]; used[at] = Math.min(MAX_TALK_PLAYS, used[at] + 1);
			record = { ...record, plays: used }; persist();
		});
		if (playing === 'talk') playing = null;
		if (!started) failed = true;
		else if (record.step === 'listen') announce = T('When you’re ready, go to the statements.', 'هر وقت آماده بودی، برو سراغ جمله‌ها.');
	}
	function markHeard(i: number) {
		if (record.heard[index][i]) return;
		const all = record.heard.map(h => [...h]); all[index][i] = true;
		record = { ...record, heard: all }; persist();
	}
	/** Mira reads A, B and C, one after another. */
	async function playStatements() {
		stop();
		const mine = ++sequence;
		for (const i of [0, 1, 2] as const) {
			if (mine !== sequence) return;
			playing = i;
			const started = await play(statementLine(talk, i), STATEMENT_VOICE);
			if (mine !== sequence) return;
			if (started) markHeard(i); else { failed = true; break; }
		}
		playing = null;
		announce = T('Which one is the lie?', 'کدام‌یکی دروغ است؟');
	}
	/** Tapping a statement plays it again and chooses it. */
	async function tapStatement(i: 0 | 1 | 2) {
		stop(); failed = false; selected = i; playing = i;
		const mine = sequence;
		const started = await play(statementLine(talk, i), STATEMENT_VOICE);
		if (mine !== sequence) return;
		if (started) markHeard(i); else failed = true;
		playing = null;
	}
	function toStatements() { setStep('choose'); selected = null; void playStatements(); }
	function check() {
		if (selected === null || !allHeard) return;
		stop();
		const picks = [...record.picks]; picks[index] = selected;
		record = { ...record, picks, step: 'reveal' }; persist();
		queueMicrotask(() => resultLine?.focus());
	}
	async function hearProof() { stop(); playing = 'proof'; await play(talk.sentences[talk.proof], talk.voice); if (playing === 'proof') playing = null; }
	function next() {
		stop();
		const nextIndex = record.index + 1;
		record = { ...record, index: nextIndex, step: 'listen', done: nextIndex >= TALKS.length }; persist();
		selected = null; failed = false; announce = '';
		if (nextIndex >= TALKS.length) stage = 'result';
		queueMicrotask(() => heading?.focus());
	}
	function start() { stopAllAudio(); stage = 'talk'; queueMicrotask(() => heading?.focus()); }
	function again() { stop(); record = emptyLie(); persist(); selected = null; stage = 'talk'; queueMicrotask(() => heading?.focus()); }
	function finish() { stop(); onDone(); }

	const summary = $derived(summarize(record));
</script>

{#snippet bottom(label: string, action: () => void, disabled = false)}
	<div class="bar"><button class="primary" type="button" onclick={action} {disabled}>{label}</button></div>
{/snippet}

<section class="sl">
	<h2 class="sr-only" tabindex="-1" bind:this={heading}>{stage === 'talk' ? T(`Talk ${index + 1} of ${TALKS.length}`, `صحبت ${fa(index + 1)} از ${fa(TALKS.length)}`) : T('Spot the lie', 'دروغ را پیدا کن')}</h2>
	<p class="sr-only" role="status" aria-live="polite">{announce}</p>

	{#if stage === 'start'}
		<div class="brief"><span class="avatar" aria-hidden="true">M</span><p>{isFa ? INTRO.fa : INTRO.en}</p></div>
		{@render bottom(T('Start', 'شروع'), start)}

	{:else if stage === 'talk'}
		<p class="label" aria-hidden="true">{T(`Talk ${index + 1} of ${TALKS.length}`, `صحبت ${fa(index + 1)} از ${fa(TALKS.length)}`)} · <bdi>{isFa ? talk.speakerFa : talk.speaker}</bdi></p>
		<div class="dots" aria-hidden="true">{#each TALKS as _, i}<span class:done={i < index} class:now={i === index}></span>{/each}</div>

		{#if record.step === 'listen'}
			<p class="ask">{T(`Listen to ${talk.speaker}.`, `به ${talk.speakerFa} گوش بده.`)}</p>
			{#if plays === 0}
				<button class="listen" type="button" onclick={listen} disabled={playing === 'talk'}>
					<span class="icon" aria-hidden="true">{playing === 'talk' ? '♪' : '▶'}</span>
					<span>{playing === 'talk' ? T('Playing…', 'در حال پخش…') : T('Listen', 'گوش بده')}</span>
				</button>
			{:else}
				{#if playing === 'talk'}<p class="hint">{T('Listen…', 'گوش بده…')}</p>
				{:else if plays < MAX_TALK_PLAYS}<button class="link quiet" type="button" onclick={listen}>▶ {T('Hear it again (1 left)', 'دوباره بشنو (یک بار دیگر)')}</button>{/if}
				{@render bottom(T('Next: the three sentences', 'بعدی: سه جمله'), toStatements, playing === 'talk')}
			{/if}
			{#if failed}<p class="note">{T('Couldn’t play. Try again; this didn’t count.', 'پخش نشد. دوباره امتحان کن؛ این یکی حساب نشد.')}</p>{/if}

		{:else if record.step === 'choose'}
			<p class="ask">{T('Which one is the lie?', 'کدام‌یکی دروغ است؟')}</p>
			<div class="cards" dir="ltr">
				{#each LETTERS as letter, i}
					<button class="card" class:chosen={selected === i} class:now={playing === i} type="button" onclick={() => tapStatement(i as 0 | 1 | 2)} aria-pressed={selected === i}
						aria-label={T(`Sentence ${letter}${heard[i] ? '' : ', not heard yet'}`, `جملهٔ ${letter}${heard[i] ? '' : '، هنوز شنیده نشده'}`)}>
						<span class="letter">{letter}</span>
						<span class="state" aria-hidden="true">{playing === i ? '♪' : heard[i] ? '▶' : '…'}</span>
					</button>
				{/each}
			</div>
			<p class="hint">{allHeard ? T('Tap a sentence to hear it again and choose it.', 'روی یک جمله بزن تا دوباره بشنوی و انتخابش کنی.') : T('Listen to all three.', 'به هر سه گوش بده.')}</p>
			{#if failed}<p class="note">{T('Couldn’t play. Tap a sentence to try again.', 'پخش نشد. روی یک جمله بزن تا دوباره امتحان کنی.')}</p>{/if}
			{#if plays < MAX_TALK_PLAYS && playing === null}<button class="link quiet" type="button" onclick={listen}>▶ {T(`Hear ${talk.speaker} again (1 left)`, `دوباره به ${talk.speakerFa} گوش بده (یک بار دیگر)`)}</button>{/if}
			{@render bottom(selected === null ? T('Choose the lie', 'دروغ را انتخاب کن') : T(`${LETTERS[selected]} is the lie`, `جملهٔ ${LETTERS[selected]} دروغ است`), check, selected === null || !allHeard)}

		{:else if pick !== null}
			<p class="result" class:ok={pick === talk.lie} tabindex="-1" bind:this={resultLine}>{pick === talk.lie ? `✓ ${T('You found the lie!', 'دروغ را پیدا کردی!')}` : `✗ ${T(`The lie was ${LETTERS[talk.lie]}.`, `جملهٔ ${LETTERS[talk.lie]} دروغ بود.`)}`}</p>
			<ul class="statements" dir="ltr">
				{#each talk.statements as statement, i}
					<li class:lie={i === talk.lie}>
						<span class="letter">{LETTERS[i]}</span>
						<span class="text" lang="en">{statement}</span>
						<span class="tag" lang={isFa ? 'fa' : 'en'} dir={isFa ? 'rtl' : 'ltr'}>{i === talk.lie ? T('lie', 'دروغ') : T('true', 'درست')}{i === pick ? T(' · your choice', ' · انتخاب تو') : ''}</span>
					</li>
				{/each}
			</ul>
			<div class="proof">
				<p class="who">{T(`What ${talk.speaker} said`, `${talk.speakerFa} گفت:`)}</p>
				<p class="said" lang="en" dir="ltr">“{talk.sentences[talk.proof]}”</p>
				<button class="link" type="button" onclick={hearProof} disabled={playing === 'proof'}>▶ {T('Hear that part', 'همان قسمت را بشنو')}</button>
			</div>
			<p class="tip">{#if isFa}<MixedText text={talk.why.fa} />{:else}{talk.why.en}{/if}</p>
			{@render bottom(index + 1 < TALKS.length ? T('Next talk', 'صحبت بعدی') : T('See your result', 'دیدن نتیجه'), next)}
		{/if}

	{:else}
		<p class="label">{T('Your result', 'نتیجهٔ تو')}</p>
		<p class="big">{T(`You found ${summary.right} of ${TALKS.length} lies`, `${fa(summary.right)} از ${fa(TALKS.length)} دروغ را پیدا کردی`)}</p>
		<ul class="rows">
			{#each summary.traps as row}
				<li class:miss={!row.caught}>
					<span><bdi>{isFa ? TALKS[row.talk].speakerFa : TALKS[row.talk].speaker}</bdi> · {#if isFa}<MixedText text={TRAP_LABEL[row.trap].fa} />{:else}{TRAP_LABEL[row.trap].en}{/if}</span>
					<span>{row.caught ? '✓' : '✗'}</span>
				</li>
			{/each}
		</ul>
		{#each summary.traps.filter(t => !t.caught) as row}
			<p class="tip"><strong><bdi>{isFa ? TALKS[row.talk].speakerFa : TALKS[row.talk].speaker}</bdi>:</strong>{isFa ? '‏' : ''} {#if isFa}<MixedText text={TALKS[row.talk].why.fa} />{:else}{TALKS[row.talk].why.en}{/if}</p>
		{:else}
			<p class="tip">{T('You caught every trap. Sharp listening!', 'هیچ تله‌ای گولت نزد. خیلی دقیق گوش دادی!')}</p>
		{/each}
		<button class="link quiet" type="button" onclick={again}>{T('Try it again', 'دوباره امتحان کن')}</button>
		{@render bottom(T('Done', 'تمام'), finish)}
	{/if}
</section>

<style>
	.sl { display: grid; gap: 14px; padding-bottom: 104px; }
	.brief { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.brief p { margin: 0; line-height: 1.55; }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.label { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .label { letter-spacing: normal; }
	.dots { display: flex; gap: 6px; }
	.dots span { flex: 1; block-size: 6px; border-radius: 3px; background: var(--paper-sunken); }
	.dots span.done { background: var(--leaf); }
	.dots span.now { background: var(--accent); }
	.ask { margin: 8px 0 0; font-family: var(--font-display); font-size: 1.35rem; }
	.listen { display: grid; justify-items: center; gap: 6px; inline-size: 100%; padding: 28px 16px; border: 2px solid var(--accent); border-radius: 20px; background: var(--paper-raised); color: var(--accent-deep); font: inherit; font-size: 1.15rem; font-weight: 700; cursor: pointer; }
	.listen:disabled { border-color: var(--line); color: var(--ink-soft); cursor: default; }
	.listen .icon { font-size: 2.2rem; line-height: 1; }
	.cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
	.card { display: grid; justify-items: center; gap: 4px; min-block-size: 110px; padding: 12px 6px; border: 2px solid var(--line); border-radius: 18px; background: var(--paper-raised); color: var(--ink); font: inherit; cursor: pointer; }
	.card .letter { font-family: var(--font-display); font-size: 2.2rem; line-height: 1.1; }
	.card .state { color: var(--ink-soft); }
	.card.now { border-color: var(--accent); }
	.card.chosen { border-color: var(--attention); background: color-mix(in srgb, var(--attention) 12%, var(--paper-raised)); }
	.result { margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--attention); }
	.result.ok { color: var(--leaf); }
	.result:focus { outline: none; }
	.statements { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
	.statements li { display: grid; grid-template-columns: auto 1fr; gap: 2px 10px; padding: 10px 14px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); text-align: left; }
	.statements li.lie { border: 2px solid var(--attention); }
	.statements .letter { grid-row: span 2; min-inline-size: 1.1em; font-family: var(--font-display); font-size: 1.4rem; color: var(--accent-deep); }
	.statements .text { line-height: 1.45; }
	.statements .tag { font-size: .78rem; font-weight: 700; color: var(--leaf); text-align: start; }
	.statements li.lie .tag { color: var(--attention); }
	.proof { display: grid; gap: 4px; padding: 12px 14px; border-radius: 14px; background: var(--paper-sunken); }
	.who { margin: 0; font-size: .75rem; font-weight: 700; color: var(--ink-soft); }
	.said { margin: 0; line-height: 1.55; text-align: left; font-size: 1.05rem; }
	.big { margin: 0; font-family: var(--font-display); font-size: clamp(1.5rem, 6.6vw, 2rem); color: var(--accent-deep); }
	.rows { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
	.rows li { display: flex; justify-content: space-between; gap: 12px; padding: 10px 14px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); font-weight: 600; }
	.rows li.miss { border-color: var(--attention); }
	.rows li.miss span:last-child { color: var(--attention); }
	.tip { margin: 0; line-height: 1.55; }
	.note { margin: 0; line-height: 1.5; }
	.hint { margin: 0; color: var(--ink-soft); line-height: 1.5; }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.link.quiet { color: var(--ink-soft); }
	.link:disabled { opacity: .5; cursor: default; }
	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 20; padding: 12px 20px calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 35%); }
	.primary { display: flex; align-items: center; justify-content: center; inline-size: 100%; max-inline-size: 680px; margin-inline: auto; min-height: 54px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	.primary:disabled { opacity: .5; cursor: default; }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	h2:focus { outline: none; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
</style>
