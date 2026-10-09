<script lang="ts">
	/**
	 * "Listen and connect" (docs/english-listen-connect-spec.md, owner-approved v2).
	 * Listen to one conversation (twice at most), then four questions about how its
	 * facts connect, one screen each, then the conversation as text with the day's
	 * link phrases. Text only. Kept in this browser for the day (reload, Back).
	 */
	import { onMount } from 'svelte';
	import { playAudioPromise, stopAllAudio } from '$services/tts';
	import { ENGLISH_RATE } from '$lib/practice/english-voice';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import {
		CHOICES, CONNECT, CONVERSATION, MAX_PLAYS, MIRA_LINE, MIRA_SPOKEN, SPEAKERS, TOTAL_POINTS, emptyConnectRecord, linkParts, scoreConnect, type ConnectRecord
	} from '$lib/practice/listen-connect';

	let { isFa = false, initial = null, onSave, onFocus, onDone }: {
		isFa?: boolean;
		initial?: ConnectRecord | null;
		onSave?: (record: ConnectRecord) => void;
		/** Mira's instruction (the listening goal) shows until the questions open. */
		onFocus?: (intro: 'full' | 'compact' | 'hidden') => void;
		onDone: (score: { correct: number; total: number }, record: ConnectRecord) => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	let record = $state<ConnectRecord>(initial ?? emptyConnectRecord());
	let playing = $state(false), attempts = $state(0);
	/** Which cause of Connect is on screen. */
	let causeIndex = $state(0);
	/** A play cut short by a call or a hidden tab is given back; one the learner stops still counts. */
	let interrupted = false, stoppedByLearner = false;
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const playsLeft = $derived(MAX_PLAYS - record.plays);
	const open = $derived(record.heard || record.readInstead);

	$effect(() => { onFocus?.(open ? 'hidden' : 'full'); });
	onMount(() => {
		const onHidden = () => { if (document.hidden && playing) { interrupted = true; stopAllAudio(); } };
		document.addEventListener('visibilitychange', onHidden);
		return () => document.removeEventListener('visibilitychange', onHidden);
	});

	function persist() { onSave?.($state.snapshot(record)); }

	/** Plays the whole conversation, line by line in each speaker's voice. Counts only if it reaches the end. */
	async function play() {
		if (playing || playsLeft <= 0) return;
		stopAllAudio(); // Mira may still be giving the listening goal
		playing = true; interrupted = false; stoppedByLearner = false; attempts += 1;
		for (const line of CONVERSATION) {
			if (interrupted) break;
			await playAudioPromise(line.text, ENGLISH_RATE, 'en-US', undefined, SPEAKERS[line.who].voice).catch(() => {});
			if (!interrupted) await new Promise(resolve => setTimeout(resolve, 250));
		}
		playing = false;
		if (interrupted && !stoppedByLearner) return; // cut short by a call or a hidden tab: given back
		record = { ...record, plays: record.plays + 1, heard: true };
		persist();
	}
	function stop() { if (playing) stoppedByLearner = true; interrupted = true; stopAllAudio(); playing = false; }
	function hearLine(index: number) {
		if (playing) return;
		stopAllAudio();
		const line = CONVERSATION[index];
		void playAudioPromise(line.text, ENGLISH_RATE, 'en-US', undefined, SPEAKERS[line.who].voice).catch(() => {});
	}
	function readInstead() { if (playing) stop(); record = { ...record, readInstead: true }; persist(); }

	function pickResult(option: number) {
		if (record.connectChecked) return;
		const connect = [...record.connect]; connect[causeIndex] = option;
		record = { ...record, connect }; persist();
		if (causeIndex < CONNECT.causes.length - 1) causeIndex += 1;
	}
	function checkConnect() { record = { ...record, connectChecked: true }; persist(); }
	function pickChoice(q: number, option: number) {
		if (record.checked[q]) return;
		const choices = [...record.choices]; choices[q] = option;
		record = { ...record, choices }; persist();
	}
	function checkChoice(q: number) { const checked = [...record.checked]; checked[q] = true; record = { ...record, checked }; persist(); }
	function next() {
		if (playing) stop();
		const screen = record.screen + 1;
		record = { ...record, screen }; persist();
		// The last screen: Mira's line about the day's link phrases, from this tap.
		if (screen === CHOICES.length + 1) void playAudioPromise(MIRA_SPOKEN, COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {});
	}
	function finish() {
		stopAllAudio();
		record = { ...record, done: true }; persist();
		onDone(scoreConnect(record), $state.snapshot(record));
	}
	const choiceQ = $derived(record.screen >= 1 && record.screen <= CHOICES.length ? record.screen - 1 : -1);
	const allConnected = $derived(record.connect.every(v => v !== null));
</script>

{#snippet bottom(label: string, action: () => void, disabled = false)}
	<div class="bar"><button class="primary" type="button" onclick={action} {disabled}>{label}</button></div>
{/snippet}

{#snippet again()}
	{#if !record.readInstead && playsLeft > 0 && record.screen <= CHOICES.length}
		<button class="link" type="button" onclick={() => (playing ? stop() : play())}>{playing ? T('Stop', 'توقف') : T(`Listen again (${playsLeft} left)`, `دوباره گوش بده (${playsLeft.toLocaleString('fa-IR')} بار دیگر)`)}</button>
	{/if}
{/snippet}

<section class="connect" aria-live="polite">
	{#if !open}
		{#if playing}
			<p class="status" role="status">{T('Listening…', 'در حال پخش…')}</p>
			{@render bottom(T('Stop', 'توقف'), stop)}
		{:else}
			{#if attempts > 0}<button class="link" type="button" onclick={readInstead}>{T('Can’t hear it? Read it instead', 'صدا را نمی‌شنوی؟ متنش را بخوان')}</button>{/if}
			{@render bottom(T('Play the conversation', 'پخش گفت‌وگو'), play)}
		{/if}

	{:else if record.readInstead && !record.heard}
		<!-- No audio: the conversation as text first, then the questions. -->
		<ol class="script" lang="en" dir="ltr">{#each CONVERSATION as line}<li><b>{SPEAKERS[line.who].name}:</b> {line.text}</li>{/each}</ol>
		{@render bottom(T('To the questions', 'رفتن به سؤال‌ها'), () => { record = { ...record, heard: true }; persist(); })}

	{:else if record.screen === 0}
		<p class="kind">{T('What led to what? · 3 points', 'چه چیزی باعث چه شد؟ — ۳ امتیاز')}</p>
		{#if !record.connectChecked}
			<p class="count">{T(`${causeIndex + 1} of ${CONNECT.causes.length}`, `${(causeIndex + 1).toLocaleString('fa-IR')} از ${CONNECT.causes.length.toLocaleString('fa-IR')}`)}</p>
			<p class="q" lang="en" dir="ltr">{CONNECT.causes[causeIndex]}</p>
			<div class="options" role="radiogroup" aria-label={T('Its result', 'نتیجه‌اش')}>
				{#each CONNECT.results as result, i}
					<button class="option" type="button" role="radio" aria-checked={record.connect[causeIndex] === i} class:chosen={record.connect[causeIndex] === i} onclick={() => pickResult(i)} lang="en" dir="ltr">{result}</button>
				{/each}
			</div>
			{#if causeIndex > 0}<button class="link" type="button" onclick={() => (causeIndex -= 1)}>{T('Previous', 'قبلی')}</button>{/if}
			{@render again()}
			{@render bottom(T('Check', 'بررسی'), checkConnect, !allConnected)}
		{:else}
			<ul class="results">
				{#each CONNECT.causes as cause, i}
					{@const right = record.connect[i] === CONNECT.answers[i]}
					<li class:right>
						<span lang="en" dir="ltr">{cause}</span>
						<span class="mark">{right ? T('Right', 'درست') : T('Right answer:', 'جواب درست:')}</span>
						<span lang="en" dir="ltr">{CONNECT.results[CONNECT.answers[i]]}</span>
					</li>
				{/each}
			</ul>
			{@render again()}
			{@render bottom(T('Next', 'بعدی'), next)}
		{/if}

	{:else if choiceQ >= 0}
		{@const q = CHOICES[choiceQ]}
		{@const checked = record.checked[choiceQ]}
		<p class="kind">{isFa ? q.kind.fa : q.kind.en}</p>
		<p class="q" lang="en" dir="ltr">{q.question}</p>
		<div class="options" role="radiogroup" aria-label={q.question}>
			{#each q.options as option, i}
				<button class="option" type="button" role="radio" aria-checked={record.choices[choiceQ] === i} disabled={checked}
					class:chosen={record.choices[choiceQ] === i} class:right={checked && i === q.answer} class:wrong={checked && record.choices[choiceQ] === i && i !== q.answer}
					onclick={() => pickChoice(choiceQ, i)} lang="en" dir="ltr">
					{option}
					{#if checked && i === q.answer}<small>{T('Right answer', 'جواب درست')}</small>{:else if checked && record.choices[choiceQ] === i}<small>{T('Your answer', 'جواب تو')}</small>{/if}
				</button>
			{/each}
		</div>
		{#if checked}
			<button class="evidence" type="button" onclick={() => hearLine(q.evidence)} lang="en" dir="ltr">“{CONVERSATION[q.evidence].text}”</button>
			{@render bottom(choiceQ === CHOICES.length - 1 ? T('See how it connects', 'ببین چطور به هم ربط دارند') : T('Next', 'بعدی'), next)}
		{:else}
			{@render again()}
			{@render bottom(T('Check', 'بررسی'), () => checkChoice(choiceQ), record.choices[choiceQ] === null)}
		{/if}

	{:else}
		{@const score = scoreConnect(record)}
		<p class="kind">{T(`${score.correct} of ${TOTAL_POINTS} correct today`, `امروز ${score.correct.toLocaleString('fa-IR')} از ${TOTAL_POINTS.toLocaleString('fa-IR')} را درست جواب دادی`)}</p>
		<ol class="script" lang="en" dir="ltr">
			{#each CONVERSATION as line, i}
				<li><button class="line" type="button" onclick={() => hearLine(i)}><b>{SPEAKERS[line.who].name}:</b> {#each linkParts(line.text) as part}{#if part.link}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}</button></li>
			{/each}
		</ol>
		<div class="mira"><span class="avatar" aria-hidden="true">M</span><p lang={isFa ? 'fa' : 'en'} dir={isFa ? 'rtl' : 'ltr'}>{#each (isFa ? MIRA_LINE.fa : MIRA_LINE.en).split('`') as part, i}{#if i % 2}<bdi lang="en" dir="ltr"><i>{part}</i></bdi>{:else}{part}{/if}{/each}</p></div>
		{@render bottom(T('Next', 'بعدی'), finish)}
	{/if}
</section>

<style>
	.connect { display: grid; gap: 12px; padding-bottom: 96px; }
	.status { margin: 12px 0 0; font-weight: 600; }
	.kind:lang(fa), :global([dir='rtl']) .kind { letter-spacing: normal; }
	.kind { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--accent-deep); }
	.count { margin: 0; color: var(--ink-soft); font-size: .9rem; }
	.q { margin: 0; font-family: var(--font-display); font-size: clamp(1.3rem, 5.6vw, 1.6rem); line-height: 1.35; text-align: left; }
	.options { display: grid; gap: 8px; }
	.option { display: grid; gap: 2px; min-height: 52px; padding: 12px 14px; border: 1.5px solid var(--line); border-radius: 12px; background: var(--paper-raised); color: var(--ink); font: inherit; text-align: left; cursor: pointer; }
	.option.chosen { border-color: var(--accent); background: var(--accent-wash); }
	.option.right { border-color: var(--leaf); background: var(--leaf-wash); }
	.option.wrong { border-color: var(--attention); background: var(--attention-wash); }
	.option:disabled { cursor: default; color: var(--ink); }
	.option small { font-size: .8rem; font-weight: 700; color: var(--ink-soft); }
	.results { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
	.results li { display: grid; gap: 4px; padding: 12px 14px; border-radius: 12px; border: 1.5px solid var(--attention); background: var(--attention-wash); text-align: left; }
	.results li.right { border-color: var(--leaf); background: var(--leaf-wash); }
	.mark { font-size: .8rem; font-weight: 700; color: var(--ink-soft); }
	.evidence { padding: 12px 14px; border: 0; border-inline-start: 3px solid var(--accent); border-radius: 0 10px 10px 0; background: var(--paper-raised); color: var(--ink-soft); font: inherit; font-style: italic; text-align: left; cursor: pointer; }
	.script { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; text-align: left; }
	.script li { line-height: 1.55; }
	.line { padding: 6px 0; border: 0; background: none; color: var(--ink); font: inherit; text-align: left; cursor: pointer; }
	mark { background: color-mix(in srgb, var(--gold) 35%, transparent); color: inherit; border-radius: 4px; padding: 0 2px; }
	.mira { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.mira p { margin: 0; line-height: 1.55; }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 20; padding: 12px 20px calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 35%); }
	.primary { display: flex; align-items: center; justify-content: center; inline-size: 100%; max-inline-size: 680px; margin-inline: auto; min-height: 54px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	.primary:disabled { opacity: .5; cursor: default; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
</style>
