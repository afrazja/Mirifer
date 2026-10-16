<script lang="ts">
	/**
	 * "Listen and connect" (docs/english-listen-connect-spec.md, owner-approved v2; split into parts at
	 * the owner's request). The conversation is heard in three short parts, each at most twice, and
	 * each part is followed by its own questions, one per screen; then the whole conversation as text
	 * with the day's link phrases. Kept in this browser for the day (reload, Back).
	 */
	import ActionBar from '$lib/components/ActionBar.svelte';
	import { onMount } from 'svelte';
	import { audioPausedBySystem, pauseAudio, playAudioPromise, resumeAudio, stopAllAudio } from '$services/tts';
	import { ENGLISH_RATE } from '$lib/practice/english-voice';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import {
		CHOICES, CONNECT, CONVERSATION, MAX_PLAYS, MIRA_LINE, MIRA_SPOKEN, PARTS, QUESTIONS, SPEAKERS, STEPS, TOTAL_POINTS,
		emptyConnectRecord, linkParts, partLines, scoreConnect, type ConnectRecord
	} from '$lib/practice/listen-connect';

	let { isFa = false, initial = null, onSave, onFocus, onSkip, onDone }: {
		isFa?: boolean;
		initial?: ConnectRecord | null;
		onSave?: (record: ConnectRecord) => void;
		/** Mira's instruction (the listening goal) shows until the first part has been heard. */
		onFocus?: (intro: 'full' | 'compact' | 'hidden') => void;
		onDone: (score: { correct: number; total: number }, record: ConnectRecord) => void;
		/** "Skip this step", shown under the main button on the first screen (the daily lesson). */
		onSkip?: () => void;
	} = $props();

	// svelte-ignore state_referenced_locally
	let record = $state<ConnectRecord>(initial ?? emptyConnectRecord());
	let playing = $state(false);
	/** Play attempts per part: "Read it instead" is offered only after trying to play that part. */
	let attempts = $state(PARTS.map(() => 0));
	/**
	 * A play cut short by the phone or browser (a call, a locked screen) is given back, and can
	 * continue from the line where it stopped; one the learner stops still counts. Switching to
	 * another tab doesn't stop it: the part keeps playing.
	 */
	let interrupted = false, stoppedByLearner = false, lineAt = 0, playRun = 0;
	let resumeFrom = $state<{ part: number; line: number } | null>(null);
	/** The learner's Pause: the line stops where it is; the next line waits too. */
	let paused = $state(false);
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const fa = (n: number) => n.toLocaleString('fa-IR');
	const step = $derived(STEPS[record.step] ?? STEPS[STEPS.length - 1]);
	/** The part being listened to or asked about. */
	const part = $derived(step.kind === 'listen' ? step.part : step.kind === 'question' ? QUESTIONS[step.q].part : PARTS.length - 1);
	const playsLeft = $derived(MAX_PLAYS - record.plays[part]);

	const firstScreen = $derived(record.step === 0 && !record.heard[0]);
	$effect(() => { onFocus?.(firstScreen ? 'full' : 'hidden'); });
	onMount(() => {
		// Back on the page: if the phone or browser paused the line, it would never end.
		const onBack = () => { if (!document.hidden && playing && audioPausedBySystem()) { interrupted = true; stopAllAudio(); } };
		document.addEventListener('visibilitychange', onBack);
		window.addEventListener('focus', onBack);
		return () => { document.removeEventListener('visibilitychange', onBack); window.removeEventListener('focus', onBack); };
	});

	function persist() { onSave?.($state.snapshot(record)); }
	function goStep(next: number) { resumeFrom = null; record = { ...record, step: Math.min(next, STEPS.length - 1) }; persist(); }

	/** Plays one part, line by line in each speaker's voice, from a given line. Counts only if it reaches the end. */
	async function play(from = 0) {
		if (playing || playsLeft <= 0) return;
		if (!Number.isInteger(from) || from < 0) from = 0;
		stopAllAudio(); // Mira may still be giving the listening goal
		const p = part, lines = partLines(p), run = ++playRun;
		playing = true; interrupted = false; stoppedByLearner = false; resumeFrom = null;
		if (from === 0) attempts[p] += 1;
		for (let i = from; i < lines.length; i++) {
			while (paused && !interrupted && run === playRun) await new Promise(resolve => setTimeout(resolve, 150));
			if (interrupted || run !== playRun) break;
			lineAt = i;
			await playAudioPromise(lines[i].text, ENGLISH_RATE, 'en-US', undefined, SPEAKERS[lines[i].who].voice).catch(() => {});
			if (!interrupted && run === playRun) await new Promise(resolve => setTimeout(resolve, 250));
		}
		// Replaced by a newer play (Start the part again): that one owns the state now.
		if (run !== playRun) return;
		playing = false; paused = false;
		// Cut short by the phone or browser: given back, and it can continue from that line.
		if (interrupted && !stoppedByLearner) { resumeFrom = { part: p, line: lineAt }; return; }
		const plays = [...record.plays]; plays[p] += 1;
		const heard = [...record.heard], first = !heard[p]; heard[p] = true;
		record = { ...record, plays, heard }; persist();
		// The first full play of a part goes straight to its questions (not a play the learner stopped).
		if (first && step.kind === 'listen' && !stoppedByLearner) goStep(record.step + 1);
	}
	function stop() { if (playing) stoppedByLearner = true; interrupted = true; resumeFrom = null; paused = false; stopAllAudio(); playing = false; }
	function pause() { if (!playing || paused) return; paused = true; pauseAudio(); }
	function unpause() { if (!paused) return; paused = false; resumeAudio(); }
	/** While paused: start the part again. It's a new play; the stopped one isn't counted or moved on from. */
	function restart() { playRun++; paused = false; playing = false; stopAllAudio(); void play(); }
	const resumable = $derived(resumeFrom !== null && resumeFrom.part === part);
	function resume() { if (resumeFrom) void play(resumeFrom.line); }
	function hearLine(index: number) {
		if (playing) return;
		stopAllAudio();
		const line = CONVERSATION[index];
		void playAudioPromise(line.text, ENGLISH_RATE, 'en-US', undefined, SPEAKERS[line.who].voice).catch(() => {});
	}
	function readInstead() { if (playing) { playRun++; stopAllAudio(); playing = false; paused = false; } record = { ...record, readInstead: true }; persist(); }
	/** "Can't hear it?": while the first play of a part runs, or after one that didn't finish. */
	const readInsteadSlot = $derived({ label: T('Can’t hear it? Read it instead', 'صدا را نمی‌شنوی؟ متنش را بخوان'), onclick: readInstead });
	function toQuestions() {
		const heard = [...record.heard]; heard[part] = true;
		record = { ...record, heard }; persist();
		goStep(record.step + 1);
	}

	function pick(option: number) {
		if (step.kind !== 'question') return;
		const q = QUESTIONS[step.q];
		if (q.kind === 'connect') {
			if (record.connectChecked[q.index]) return;
			const connect = [...record.connect]; connect[q.index] = option;
			record = { ...record, connect };
		} else {
			if (record.checked[q.index]) return;
			const choices = [...record.choices]; choices[q.index] = option;
			record = { ...record, choices };
		}
		persist();
	}
	function check() {
		if (step.kind !== 'question') return;
		const q = QUESTIONS[step.q];
		if (q.kind === 'connect') { const c = [...record.connectChecked]; c[q.index] = true; record = { ...record, connectChecked: c }; }
		else { const c = [...record.checked]; c[q.index] = true; record = { ...record, checked: c }; }
		persist();
	}
	function next() {
		if (playing) stop();
		const nextStep = record.step + 1;
		goStep(nextStep);
		// The last screen: Mira's line about the day's link phrases, from this tap.
		if (STEPS[nextStep]?.kind === 'end') void playAudioPromise(MIRA_SPOKEN, COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {});
	}
	function finish() {
		stopAllAudio();
		record = { ...record, done: true }; persist();
		onDone(scoreConnect(record), $state.snapshot(record));
	}
</script>

{#snippet bottom(label: string, action: () => void, disabled = false, secondary: { label: string; onclick: () => void } | null = null, icon: 'pause' | 'play' | null = null)}
	<ActionBar {label} onclick={action} {disabled} {icon}
		secondary={secondary ?? (onSkip && firstScreen && !playing ? { label: T('Skip this step', 'این مرحله را رد کن'), onclick: () => { stop(); onSkip?.(); } } : null)} />
{/snippet}

{#snippet again()}
	{#if !record.readInstead && playsLeft > 0}
		{#if resumable && !playing}<button class="link" type="button" onclick={resume}>{T('Continue where it stopped', 'از همان جا ادامه بده')}</button>{/if}
		<button class="link" type="button" onclick={() => (playing ? (paused ? unpause() : pause()) : play())}>{playing ? (paused ? T('Continue listening', 'ادامهٔ پخش') : T('Pause listening', 'مکث پخش')) : T(`Listen to part ${part + 1} again (${playsLeft} left)`, `دوباره گوش بده به بخش ${fa(part + 1)} (${fa(playsLeft)} بار دیگر)`)}</button>
	{/if}
{/snippet}

<section class="connect" aria-live="polite">
	{#if step.kind === 'listen'}
		<p class="kind">{T(`Part ${part + 1} of ${PARTS.length}`, `بخش ${fa(part + 1)} از ${fa(PARTS.length)}`)} · {isFa ? PARTS[part].title.fa : PARTS[part].title.en}</p>
		{#if record.readInstead}
			<!-- No audio: this part as text, then its questions. -->
			<ol class="script" lang="en" dir="ltr">{#each partLines(part) as line}<li><b>{SPEAKERS[line.who].name}:</b> {line.text}</li>{/each}</ol>
			{@render bottom(T('To the questions', 'رفتن به سؤال‌ها'), toQuestions)}
		{:else if playing && paused}
			<p class="status" role="status">{T('Paused.', 'مکث شد.')}</p>
			{@render bottom(T('Continue', 'ادامه'), unpause, false, { label: T('Start the part again', 'بخش را از اول پخش کن'), onclick: restart }, 'play')}
		{:else if playing}
			<p class="status" role="status">{T('Listening…', 'در حال پخش…')}</p>
			{@render bottom(T('Pause', 'مکث'), pause, false, record.heard[part] ? null : readInsteadSlot, 'pause')}
		{:else if resumable}
			<p class="status" role="status">{T('The audio was paused. This didn’t use a play.', 'صدا متوقف شد. این یکی حساب نشد.')}</p>
			{@render bottom(T('Continue', 'ادامه'), resume, false, { label: T('Start the part again', 'بخش را از اول پخش کن'), onclick: () => play() }, 'play')}
		{:else if record.heard[part]}
			{@render again()}
			{@render bottom(T('To the questions', 'رفتن به سؤال‌ها'), () => goStep(record.step + 1))}
		{:else}
			{@render bottom(T(`Play part ${part + 1}`, `پخش بخش ${fa(part + 1)}`), () => play(), false, attempts[part] > 0 ? readInsteadSlot : null, 'play')}
		{/if}

	{:else if step.kind === 'question'}
		{@const q = QUESTIONS[step.q]}
		{@const isConnect = q.kind === 'connect'}
		{@const chosen = isConnect ? record.connect[q.index] : record.choices[q.index]}
		{@const checked = isConnect ? record.connectChecked[q.index] : record.checked[q.index]}
		{@const answer = isConnect ? CONNECT.answers[q.index] : CHOICES[q.index].answer}
		{@const options = isConnect ? CONNECT.results : CHOICES[q.index].options}
		{@const evidence = isConnect ? CONNECT.evidence[q.index] : CHOICES[q.index].evidence}
		<p class="kind">{T(`Part ${part + 1}`, `بخش ${fa(part + 1)}`)} · {isConnect ? T('What led to what?', 'چه چیزی باعث چه شد؟') : isFa ? CHOICES[q.index].kind.fa : CHOICES[q.index].kind.en}</p>
		<p class="q" lang="en" dir="ltr">{isConnect ? CONNECT.causes[q.index] : CHOICES[q.index].question}</p>
		{#if isConnect}<p class="count">{T('What happened because of this?', 'به خاطر این چه شد؟')}</p>{/if}
		<div class="options" role="radiogroup" aria-label={isConnect ? T('Its result', 'نتیجه‌اش') : CHOICES[q.index].question}>
			{#each options as option, i}
				<button class="option" type="button" role="radio" aria-checked={chosen === i} disabled={checked}
					class:chosen={chosen === i} class:right={checked && i === answer} class:wrong={checked && chosen === i && i !== answer}
					onclick={() => pick(i)} lang="en" dir="ltr">
					{option}
					{#if checked && i === answer}<small>{T('Right answer', 'جواب درست')}</small>{:else if checked && chosen === i}<small>{T('Your answer', 'جواب تو')}</small>{/if}
				</button>
			{/each}
		</div>
		{#if checked}
			<button class="evidence" type="button" onclick={() => hearLine(evidence)} lang="en" dir="ltr">“{CONVERSATION[evidence].text}”</button>
			{@render bottom(STEPS[record.step + 1]?.kind === 'end' ? T('See how it connects', 'ببین چطور به هم ربط دارند') : STEPS[record.step + 1]?.kind === 'listen' ? T('Next part', 'بخش بعدی') : T('Next', 'بعدی'), next)}
		{:else}
			{@render again()}
			{@render bottom(T('Check', 'بررسی'), check, chosen === null)}
		{/if}

	{:else}
		{@const score = scoreConnect(record)}
		<p class="kind">{T(`${score.correct} of ${TOTAL_POINTS} correct today`, `امروز ${fa(score.correct)} از ${fa(TOTAL_POINTS)} را درست جواب دادی`)}</p>
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
	.connect { display: grid; gap: 12px; padding-bottom: 150px; }
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
	.evidence { padding: 12px 14px; border: 0; border-inline-start: 3px solid var(--accent); border-radius: 0 10px 10px 0; background: var(--paper-raised); color: var(--ink-soft); font: inherit; font-style: italic; text-align: left; cursor: pointer; }
	.script { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; text-align: left; }
	.script li { line-height: 1.55; }
	.line { padding: 6px 0; border: 0; background: none; color: var(--ink); font: inherit; text-align: left; cursor: pointer; }
	mark { background: color-mix(in srgb, var(--gold) 35%, transparent); color: inherit; border-radius: 4px; padding: 0 2px; }
	.mira { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.mira p { margin: 0; line-height: 1.55; }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
</style>
