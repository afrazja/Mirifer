<script lang="ts">
	/**
	 * "Find the missing information" (docs/english-missing-info-spec.md, owner-approved v2).
	 * Task → at the desk (ask Tom, one question per recording; the card fills in) → the end, on the
	 * same screen → Fix ① → ask it again → Fix ② → ask it again → result. Kept in this browser;
	 * recordings are never stored.
	 */
	import { onDestroy, onMount } from 'svelte';
	import { playAudioPromise, stopAllAudio, ttsIsPlaying } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { changedRange, tokens } from '$lib/practice/say-better-lab';
	import { SILENT_BELOW, measureLevel, type MicLevel } from '$utils/mic-level';
	import {
		GAPS, GAP_IDS, GAP_ORDER, GOODBYE, HINT_STARTERS, LIMIT_LINE, MAX_QUESTIONS, OPENING, QKIND_LABEL, QUESTION_MAX_SECONDS, QUESTION_MIN_SECONDS, QUEUE_AT, QUEUE_LINE, TOM,
		currentGap, deskState, emptyMIRecord, needsHint, questionCountLine, questionsOf, reaskUse, twistLine,
		type GapId, type MIFeedback, type MIRecord, type MIStep, type Turn
	} from '$lib/practice/missing-info';

	let { isFa = false, initial = null, first = false, onSave, onDone }: {
		isFa?: boolean;
		/** A fresh visit: Mira says the instruction as the page opens. */
		first?: boolean;
		initial?: MIRecord | null;
		onSave?: (record: MIRecord) => void;
		onDone: () => void;
	} = $props();

	const INSTRUCTION = {
		en: 'You’re taking your parents on a day trip by train. Ask Tom at the ticket desk. I’ll give you four things to find out, one at a time. Ask one question at a time.',
		fa: 'پدر و مادرت را برای یک سفر یک‌روزه با قطار می‌بری. از تام در باجهٔ بلیت بپرس. چهار چیز را یکی‌یکی به تو می‌دهم تا پیدا کنی. هر بار یک سؤال بپرس.'
	};
	const NUM = ['①', '②'];

	type Stage = MIStep | 'all' | 'loading';
	type Status = 'idle' | 'recording' | 'listening' | 'thinking' | 'failed' | 'typing' | 'confirm' | 'denied' | 'interrupted' | 'silent';
	// svelte-ignore state_referenced_locally
	let record = $state<MIRecord>(initial ?? emptyMIRecord());
	let stage = $state<Stage>('task'), allFrom = $state<Stage>('fix');
	let status = $state<Status>('idle');
	let elapsed = $state(0), failures = $state(0), feedbackFailures = $state(0);
	let typed = $state(''), announce = $state(''), heardYou = $state('');
	let newlyFound = $state<GapId[]>([]);
	/** The thing just found: shown with its answer and a Next button before the next one appears. */
	let justFound = $state<GapId | null>(null);
	/** After Next, the previous exchange is cleared: each new item starts on its own. */
	let exchangeFrom = $state(0);
	let reaskSaid = $state<string | null>(null);
	let recorder: MediaRecorder | null = null, stream: MediaStream | null = null, chunks: Blob[] = [];
	let level: MicLevel | null = null;
	let startedAt = 0, timer: ReturnType<typeof setInterval> | undefined, interrupted = false;
	let heading: HTMLElement | undefined = $state(), micButton: HTMLButtonElement | undefined = $state();
	const playing = $derived($ttsIsPlaying);
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const fa = (n: number) => n.toLocaleString('fa-IR');
	const desk = $derived(deskState(record.turns));
	const foundCount = $derived(GAP_IDS.filter(g => desk.found[g]).length);
	const current = $derived(currentGap(desk.found, record.skipped));
	const position = $derived(Math.min(4, GAP_ORDER.filter(g => desk.found[g] || record.skipped.includes(g)).length + (justFound ? 0 : 1)));
	const lastTom = $derived([...record.turns].reverse().find(t => t.who === 'tom') as Extract<Turn, { who: 'tom' }> | undefined);
	const lastYou = $derived([...record.turns].reverse().find(t => t.who === 'you') as Extract<Turn, { who: 'you' }> | undefined);
	const feedback = $derived(record.feedback);
	const fix = $derived(feedback?.fixes[record.fixIndex] ?? null);
	const hint = $derived(stage === 'desk' && needsHint(record.turns));
	let showHint = $state(false);

	onMount(() => {
		// A reload returns to the step it left; a finished AI call is never repeated, and Tom is not replayed.
		if (record.step === 'desk') {
			stage = 'desk';
			const last = record.turns[record.turns.length - 1];
			if (last?.who === 'you' && last.kind === 'pending') void askTom();
		} else if (record.step === 'end' || record.step === 'fix' || record.step === 'reask' || record.step === 'result') {
			stage = record.step === 'fix' && !feedback ? 'end' : record.step;
		}
		else if (first) void playAudioPromise(INSTRUCTION.en.replace(/’/g, "'"), COACH_RATE, 'en-US', undefined, COACH_VOICE);
		document.addEventListener('visibilitychange', onHidden);
		return () => document.removeEventListener('visibilitychange', onHidden);
	});
	onDestroy(() => { clearInterval(timer); level?.stop(); if (recorder?.state === 'recording') recorder.stop(); stream?.getTracks().forEach(t => t.stop()); });

	function persist() { onSave?.($state.snapshot(record)); }
	function go(next: Stage) {
		stage = next; announce = '';
		if (next !== 'all' && next !== 'loading' && record.step !== next) { record = { ...record, step: next }; persist(); }
		queueMicrotask(() => heading?.focus());
	}
	function onHidden() { if (document.hidden && recorder?.state === 'recording') { interrupted = true; recorder.stop(); } }
	const tomSays = (line: string) => playAudioPromise(line.replace(/’/g, "'"), COACH_RATE, 'en-US', undefined, TOM.voice);
	function hearTom(line: string) { if (playing) stopAllAudio(); else void tomSays(line); }

	// 1. The task
	function toDesk() {
		stopAllAudio();
		if (!record.turns.length) { record = { ...record, turns: [{ who: 'tom', text: OPENING, kind: 'other', found: [] }] }; persist(); }
		go('desk');
		void tomSays(lastTom?.text ?? OPENING);
		queueMicrotask(() => micButton?.focus());
	}

	// Recording (questions at the desk, and asking a fix again)
	async function toggleMic() {
		if (status === 'recording') { recorder?.stop(); return; }
		stopAllAudio(); // tapping the mic while Tom speaks stops him
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { status = 'denied'; return; }
		try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { status = 'denied'; return; }
		const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
		recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64_000 });
		chunks = []; interrupted = false;
		recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
		recorder.onstop = finishRecording;
		const track = stream.getAudioTracks()[0];
		if (track) track.onmute = track.onended = () => { if (recorder?.state === 'recording') { interrupted = true; recorder.stop(); } };
		level = measureLevel(stream);
		recorder.start();
		startedAt = performance.now(); elapsed = 0; status = 'recording'; announce = '';
		timer = setInterval(() => {
			elapsed = Math.min(QUESTION_MAX_SECONDS, (performance.now() - startedAt) / 1000);
			if (elapsed >= QUESTION_MAX_SECONDS && recorder?.state === 'recording') recorder.stop();
		}, 200);
	}
	function finishRecording() {
		clearInterval(timer);
		stream?.getTracks().forEach(track => track.stop()); stream = null;
		const peak = level?.peak() ?? 1; level?.stop(); level = null;
		const blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' });
		const seconds = Math.min(QUESTION_MAX_SECONDS, Math.round((performance.now() - startedAt) / 100) / 10);
		if (interrupted) { status = 'interrupted'; return; }
		if (seconds < QUESTION_MIN_SECONDS) { status = 'idle'; return; }
		// Nothing was said (or the microphone heard nothing): never send it, or speech-to-text makes words up.
		if (peak < SILENT_BELOW) { status = 'silent'; return; }
		void transcribe(blob, seconds);
	}
	async function transcribe(blob: Blob, seconds: number) {
		status = 'listening';
		const body = new FormData();
		body.set('audio', blob, 'speech'); body.set('seconds', String(Math.round(seconds)));
		let text: string | null = null;
		try {
			const response = await fetch('/api/english/missing-info', { method: 'POST', body });
			const data = response.ok ? await response.json() : null;
			text = typeof data?.transcript === 'string' && data.transcript.trim() ? data.transcript.trim() : null;
		} catch { text = null; }
		if (text === null) { failures += 1; status = 'failed'; return; }
		failures = 0;
		if (stage === 'reask') { finishReask(text); return; }
		await ask(text, false);
	}

	// 2. At the desk
	async function ask(text: string, wasTyped: boolean) {
		heardYou = text;
		record = { ...record, turns: [...record.turns, { who: 'you', text, kind: 'pending', ...(wasTyped ? { typed: true } : {}) }] }; persist();
		await askTom();
	}
	async function askTom() {
		status = 'thinking';
		const controller = new AbortController();
		const wait = setTimeout(() => controller.abort(), 25_000);
		let reply: { reply: string; kind: 'answer' | 'askBack' | 'other'; learner: 'question' | 'answer' | 'other'; found: GapId[] } | null = null;
		try {
			const response = await fetch('/api/english/missing-info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ kind: 'turn', turns: record.turns }) });
			reply = response.ok ? await response.json() : null;
		} catch { reply = null; }
		finally { clearTimeout(wait); }
		const turns = [...record.turns];
		const last = turns[turns.length - 1];
		if (!reply || typeof reply.reply !== 'string' || last?.who !== 'you') {
			// The question isn't counted: take it back and let them ask again.
			if (last?.who === 'you' && last.kind === 'pending') turns.pop();
			record = { ...record, turns }; persist();
			failures += 1; status = 'failed'; return;
		}
		turns[turns.length - 1] = { ...last, kind: reply.learner };
		const before = deskState(turns);
		const found = reply.found.filter(g => !before.found[g]);
		const allFound = GAP_IDS.every(g => before.found[g] || found.includes(g));
		const allDone = GAP_IDS.every(g => before.found[g] || found.includes(g) || record.skipped.includes(g));
		const wasCurrent = currentGap(before.found, record.skipped);
		const questions = before.questions;
		let text = reply.reply;
		const ending = allDone || questions >= MAX_QUESTIONS;
		if (allFound && !/trip/i.test(text)) text = `${text} ${GOODBYE}`;
		else if (!allFound && questions >= MAX_QUESTIONS) text = `${text} ${LIMIT_LINE}`;
		else if (questions === QUEUE_AT && reply.learner === 'question') text = `${text} ${QUEUE_LINE}`;
		turns.push({ who: 'tom', text, kind: reply.kind, found });
		record = { ...record, turns }; persist();
		newlyFound = found;
		announce = found.length ? T(`Found: ${found.map(g => deskState(turns).found[g]).join(', ')}`, `پیدا شد: ${found.map(g => deskState(turns).found[g]).join('، ')}`) : '';
		// The one they were working on: show it found, with Next, before the next one appears.
		justFound = !ending && wasCurrent && found.includes(wasCurrent) ? wasCurrent : null;
		status = 'idle'; showHint = false;
		await tomSays(text);
		if (ending) go('end');
		else queueMicrotask(() => micButton?.focus());
	}
	/** The last question was misheard: take it and Tom's answer back. It isn't counted, and anything it found is undone. */
	function takeBack() {
		stopAllAudio();
		const turns = [...record.turns];
		if (turns[turns.length - 1]?.who === 'tom') turns.pop();
		if (turns[turns.length - 1]?.who === 'you') turns.pop();
		record = { ...record, turns }; persist();
		newlyFound = []; announce = T('Taken back. Ask again.', 'برداشته شد. دوباره بپرس.');
		queueMicrotask(() => micButton?.focus());
	}
	function nextThing() {
		justFound = null; newlyFound = []; showHint = false; status = 'idle'; announce = '';
		exchangeFrom = record.turns.length;
		queueMicrotask(() => micButton?.focus());
	}
	/** Stuck on this one: move on (it shows as not found at the end). */
	function skipThis() {
		if (!current) return;
		stopAllAudio();
		record = { ...record, skipped: [...record.skipped, current] }; persist();
		showHint = false;
		if (!currentGap(desk.found, record.skipped)) go('end');
	}
	function sendTyped() { const text = typed.trim(); if (!text) return; typed = ''; failures = 0; void ask(text, true); }
	function finishNow() { stopAllAudio(); status = 'idle'; go('end'); }

	// 3. Feedback
	async function getFeedback() {
		go('loading');
		const controller = new AbortController();
		const wait = setTimeout(() => controller.abort(), 30_000);
		let result: MIFeedback | null = null;
		try {
			const response = await fetch('/api/english/missing-info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify({ kind: 'feedback', turns: record.turns }) });
			result = response.ok ? await response.json() : null;
		} catch { result = null; }
		finally { clearTimeout(wait); }
		if (!result || !Array.isArray(result.fixes) || !Array.isArray(result.mistakes)) { feedbackFailures += 1; go('end'); return; }
		record = { ...record, feedback: result, fixIndex: 0, uses: [], reasks: [] }; persist();
		go('fix');
	}
	/** Tom's line just before a question, for asking it again. */
	function lineBefore(question: number): string {
		let n = 0;
		for (let i = 0; i < record.turns.length; i++) {
			const turn = record.turns[i];
			if (turn.who === 'you' && turn.kind === 'question' && ++n === question) {
				for (let j = i - 1; j >= 0; j--) { const t = record.turns[j]; if (t.who === 'tom') return t.text; }
			}
		}
		return OPENING;
	}
	function toReask() {
		if (!fix) return;
		reaskSaid = null; status = 'idle';
		go('reask');
		void tomSays(lineBefore(fix.question));
	}
	function finishReask(text: string) {
		if (!fix) return;
		const uses = [...record.uses], reasks = [...record.reasks];
		uses[record.fixIndex] = reaskUse(fix, text); reasks[record.fixIndex] = text;
		record = { ...record, uses, reasks }; persist();
		reaskSaid = text; status = 'idle';
	}
	function afterReask() {
		if (feedback && record.fixIndex + 1 < feedback.fixes.length) { record = { ...record, fixIndex: record.fixIndex + 1 }; persist(); go('fix'); }
		else go('result');
	}
	function showAll() { allFrom = stage; go('all'); }
	function finish() { stopAllAudio(); record = { ...record, done: true }; persist(); onDone(); }

	/** The words that changed, marked in the better question. */
	function changedParts(original: string, better: string): { text: string; on: boolean }[] {
		const a = tokens(original), b = tokens(better);
		if (!a.length || !b.length) return [{ text: better, on: false }];
		const r = changedRange(a, b).b;
		const from = b[r[0]].from, to = b[r[1] - 1].to;
		return [{ text: better.slice(0, from), on: false }, { text: better.slice(from, to), on: true }, { text: better.slice(to), on: false }].filter(p => p.text);
	}

	const remaining = $derived(Math.max(0, QUESTION_MAX_SECONDS - elapsed));
	const count = $derived(feedback ? questionCountLine(feedback.asked, feedback.mistakes.length, feedback.fixes.filter(f => !f.natural).length) : null);
	const rowText = (gap: GapId) => desk.found[gap] ? null : gap === 'price' && desk.partly.price ? T('£24 each · for 3 of you?', '£24 هر نفر · برای سه نفرتان؟') : gap === 'back' && desk.partly.back ? T('Train 7:20 · anything later?', 'قطار 7:20 · دیرتر چیزی هست؟') : null;
</script>

{#snippet bottom(label: string, action: () => void, disabled = false)}
	<div class="bar"><button class="primary" type="button" onclick={action} {disabled}>{label}</button></div>
{/snippet}

{#snippet mic(label: string)}
	<div class="bar">
		<button class="primary mic" class:rec={status === 'recording'} type="button" bind:this={micButton} onclick={toggleMic} disabled={status === 'listening' || status === 'thinking'}
			aria-label={status === 'recording' ? T('Stop recording', 'پایان ضبط') : label}>
			{#if status === 'recording'}<span class="dot" aria-hidden="true"></span>{T('Stop', 'پایان')}{#if remaining <= 5}<span class="left"> {Math.ceil(remaining)}</span>{/if}
			{:else}<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0M12 17v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>{label}{/if}
		</button>
	</div>
{/snippet}

{#snippet card(full: boolean, end: boolean)}
	<ul class="card" class:full aria-label={T('Your card', 'کارت تو')}>
		{#each GAP_IDS as gap}
			{@const value = desk.found[gap]}
			{@const partly = rowText(gap)}
			<li class:found={!!value} class:new={newlyFound.includes(gap)}>
				<span class="what">{isFa ? (full ? GAPS[gap].full.fa : GAPS[gap].short.fa) : (full ? GAPS[gap].full.en : GAPS[gap].short.en)}</span>
				{#if !full}
					{#if value}<span class="value"><span aria-hidden="true">✓ </span><span class="sr-only">{T('found:', 'پیدا شد:')} </span><bdi lang="en" dir="ltr"><strong>{value}</strong></bdi></span>
					{:else if end}<span class="value missed">{T('Not found', 'پیدا نشد')} · <bdi lang="en" dir="ltr">{GAPS[gap].answer}</bdi></span>
					{:else if partly}<span class="value partly">{partly}</span>
					{:else}<span class="value empty">{T('not found yet', 'هنوز پیدا نشده')}</span>{/if}
				{/if}
			</li>
		{/each}
	</ul>
{/snippet}

<section class="mi">
	<h2 class="sr-only" tabindex="-1" bind:this={heading}>{T('Find the missing information', 'اطلاعات گم‌شده را پیدا کن')}</h2>
	<p class="sr-only" role="status" aria-live="polite">{announce}</p>

	{#if stage === 'task'}
		<div class="brief"><span class="avatar" aria-hidden="true">M</span><p>{isFa ? INSTRUCTION.fa : INSTRUCTION.en}</p></div>
		{@render bottom(T('Go to the desk', 'برو سراغ باجه'), toDesk)}

	{:else if stage === 'desk'}
		<p class="progress">{T(`${position} of 4`, `${fa(position)} از ۴`)}</p>
		{#if justFound}
			<div class="target found new"><span class="find">{T('Found', 'پیدا شد')}</span>
				<span class="what">{isFa ? GAPS[justFound].full.fa : GAPS[justFound].full.en}</span>
				<span class="value"><span aria-hidden="true">✓ </span><bdi lang="en" dir="ltr"><strong>{desk.found[justFound]}</strong></bdi></span></div>
		{:else if current}
			{@const partly = rowText(current)}
			<div class="target"><span class="find">{T('Find out', 'پیدا کن')}</span>
				<span class="what">{isFa ? GAPS[current].full.fa : GAPS[current].full.en}</span>
				{#if partly}<span class="value partly">{partly}</span>{/if}</div>
		{/if}
		<div class="exchange" lang="en" dir="ltr">
			{#if status === 'listening'}<p class="hint" dir={isFa ? 'rtl' : 'ltr'}>{T('Tom is listening…', 'تام دارد گوش می‌دهد…')}</p>
			{:else if status === 'thinking'}
				<p class="you"><span class="who">{T('You asked', 'پرسیدی')}</span> “{heardYou || lastYou?.text}”</p>
				<p class="hint" dir={isFa ? 'rtl' : 'ltr'}>{T('Tom is checking…', 'تام دارد نگاه می‌کند…')}</p>
			{:else if lastTom && record.turns.length > exchangeFrom}
				{#if lastYou && lastYou.kind !== 'pending' && record.turns.length > 1}
					<p class="you"><span class="who">{T('You asked', 'پرسیدی')}</span> “{lastYou.text}”</p>
					{#if !lastYou.typed && status === 'idle'}<button class="link quiet" type="button" onclick={takeBack} dir={isFa ? 'rtl' : 'ltr'}>{T('Not what I said', 'این را نگفتم')}</button>{/if}
				{/if}
				<p class="tom"><span class="who">Tom</span> {lastTom.text}</p>
				<button class="link quiet" type="button" onclick={() => hearTom(lastTom.text)}>{playing ? T('Stop', 'توقف') : T('Hear it again', 'دوباره بشنو')}</button>
			{/if}
		</div>
		{#if status === 'failed'}
			<p class="note">{T('Sorry, I couldn’t hear that. Please try again.', 'ببخشید، نتوانستم بشنوم. لطفاً دوباره امتحان کن.')}</p>
			{#if failures >= 2}<button class="link" type="button" onclick={() => (status = 'typing')}>{T('Type your question instead', 'به‌جایش سؤالت را بنویس')}</button>{/if}
		{:else if status === 'denied'}
			<p class="note">{T('Mira can’t hear you: the microphone is blocked. Allow it in your browser’s site settings, or type your question.', 'میرا صدایت را نمی‌شنود: میکروفون بسته است. در تنظیمات سایت اجازه‌اش را بده، یا سؤالت را بنویس.')}</p>
			<button class="link" type="button" onclick={() => (status = 'typing')}>{T('Type your question instead', 'به‌جایش سؤالت را بنویس')}</button>
		{:else if status === 'interrupted'}
			<p class="note">{T('The recording stopped. Ask again when you’re ready.', 'ضبط متوقف شد. هر وقت آماده بودی دوباره بپرس.')}</p>
		{:else if status === 'silent'}
			<p class="note">{T('I couldn’t hear anything. Check your microphone, then ask again.', 'چیزی نشنیدم. میکروفونت را بررسی کن و دوباره بپرس.')}</p>
		{/if}
		{#if hint && status !== 'typing' && !justFound}
			<button class="link quiet" type="button" onclick={() => (showHint = !showHint)} aria-expanded={showHint}>{T('Need a hint?', 'راهنمایی می‌خواهی؟')}</button>
			{#if showHint}<p class="starters" lang="en" dir="ltr">{HINT_STARTERS.join(' · ')}</p>
				<button class="link quiet" type="button" onclick={skipThis}>{T('Skip this one', 'از این یکی بگذر')}</button>{/if}
		{/if}
		{#if justFound}
			{@const next = currentGap(desk.found, record.skipped)}
			{@render bottom(next ? T(`Next: ${GAPS[next].short.en}`, `بعدی: ${GAPS[next].short.fa}`) : T('Next', 'بعدی'), nextThing)}
		{:else if status === 'confirm'}
			<p class="note">{T(`Finish now? You’ve found ${foundCount} of 4.`, `الان تمام کنی؟ ${fa(foundCount)} از ۴ را پیدا کرده‌ای.`)}</p>
			<button class="link quiet" type="button" onclick={finishNow}>{T('Finish', 'تمام')}</button>
			{@render bottom(T('Keep asking', 'به پرسیدن ادامه بده'), () => (status = 'idle'))}
		{:else if status === 'typing'}
			<form class="typed" onsubmit={event => { event.preventDefault(); sendTyped(); }}>
				<label class="sr-only" for="mi-typed">{T('Your question', 'سؤالت')}</label>
				<input id="mi-typed" lang="en" dir="ltr" maxlength="300" autocomplete="off" bind:value={typed} />
			</form>
			<button class="link quiet" type="button" onclick={() => (status = 'idle')}>{T('Use the microphone', 'استفاده از میکروفون')}</button>
			{@render bottom(T('Send', 'بفرست'), sendTyped, !typed.trim())}
		{:else}
			{#if desk.questions >= 1 && status === 'idle'}<button class="link quiet" type="button" onclick={() => (status = 'confirm')}>{T('Finish here', 'همین‌جا تمام کن')}</button>{/if}
			{@render mic(T('Ask Tom', 'از تام بپرس'))}
		{/if}

	{:else if stage === 'end'}
		<p class="progress">{T(`${foundCount} of 4 found, in ${desk.questions} questions`, `${fa(foundCount)} از ۴ پیدا شد، با ${fa(desk.questions)} سؤال`)}</p>
		{@render card(false, true)}
		<p class="twist">{isFa ? twistLine(desk).fa : twistLine(desk).en}</p>
		{#if feedbackFailures}<p class="note">{T('I couldn’t check your questions.', 'نتوانستم سؤال‌هایت را بررسی کنم.')}</p>{/if}
		{#if desk.questions === 0 || feedbackFailures >= 2}
			{@render bottom(T('Done', 'تمام'), finish)}
		{:else}
			{@render bottom(feedbackFailures ? T('Try again', 'دوباره امتحان کن') : T('See your questions', 'دیدن سؤال‌هایت'), getFeedback)}
		{/if}

	{:else if stage === 'loading'}
		<div class="center"><div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>
			<p class="hint" role="status">{T('Mira is looking at your questions…', 'میرا دارد سؤال‌هایت را نگاه می‌کند…')}</p></div>

	{:else if stage === 'fix' && feedback}
		{#if count && record.fixIndex === 0}<p class="count">{isFa ? count.fa : count.en}</p>{/if}
		{#if fix}
			<p class="label">{fix.natural ? T('More natural', 'طبیعی‌تر') : feedback.fixes.length > 1 ? T(`Fix ${NUM[record.fixIndex]}`, `اصلاح ${NUM[record.fixIndex]}`) : T('Your fix', 'اصلاح تو')}</p>
			<p class="was" lang="en" dir="ltr"><s>{fix.original}</s></p>
			<p class="now" lang="en" dir="ltr">{#each changedParts(fix.original, fix.better) as part}{#if part.on}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}</p>
			<button class="hear" type="button" onclick={() => hearTom(fix.better)} aria-label={T('Hear it', 'بشنو')}><span aria-hidden="true">{playing ? '■' : '▶'}</span></button>
			<p class="why">{isFa ? fix.why.fa : fix.why.en}</p>
			{#if feedback.mistakes.length}<button class="link quiet" type="button" onclick={showAll}>{T('See all your questions', 'دیدن همهٔ سؤال‌هایت')}</button>{/if}
			{@render bottom(T('Ask it again', 'دوباره بپرس'), toReask)}
		{:else}
			{#if feedback.mistakes.length}<button class="link quiet" type="button" onclick={showAll}>{T('See all your questions', 'دیدن همهٔ سؤال‌هایت')}</button>{/if}
			{@render bottom(T('Done', 'تمام'), finish)}
		{/if}

	{:else if stage === 'reask' && fix}
		<p class="label">{T('Ask it again', 'دوباره بپرس')}</p>
		<p class="tom" lang="en" dir="ltr"><span class="who">Tom</span> {lineBefore(fix.question)}</p>
		<ul class="chips" lang="en" dir="ltr"><li>{fix.better}</li></ul>
		{#if status === 'listening'}<p class="hint">{T('Listening…', 'دارم گوش می‌دهم…')}</p>
		{:else if status === 'failed'}<p class="note">{T('Sorry, I couldn’t hear that. Please try again.', 'ببخشید، نتوانستم بشنوم. لطفاً دوباره امتحان کن.')}</p>
		{:else if status === 'silent'}<p class="note">{T('I couldn’t hear anything. Check your microphone, then ask again.', 'چیزی نشنیدم. میکروفونت را بررسی کن و دوباره بپرس.')}</p>{/if}
		{#if reaskSaid !== null}
			<p class="you" lang="en" dir="ltr"><span class="who">{T('You asked', 'پرسیدی')}</span> “{reaskSaid}”</p>
			<p class={record.uses[record.fixIndex] === 'used' ? 'ok' : 'note'}>{record.uses[record.fixIndex] === 'used' ? T('✓ That’s it.', '✓ همین است.') : T('Not quite. Next time try the words above.', 'هنوز نه. دفعهٔ بعد کلمه‌های بالا را امتحان کن.')}</p>
			<button class="link quiet" type="button" onclick={() => { reaskSaid = null; }}>{T('Ask again', 'دوباره بپرس')}</button>
			{@render bottom(T('Next', 'بعدی'), afterReask)}
		{:else}
			{@render mic(T('Ask Tom', 'از تام بپرس'))}
		{/if}

	{:else if stage === 'all' && feedback}
		<p class="label">{T('All your questions', 'همهٔ سؤال‌هایت')}</p>
		<ol class="all">
			{#each questionsOf(record.turns) as q, i}
				{@const m = feedback.mistakes.find(x => x.question === i + 1)}
				<li>
					<bdi lang="en" dir="ltr">{q.text}</bdi>
					{#if m}<span class="fixline"><bdi lang="en" dir="ltr">→ {m.better}</bdi> <small>· {isFa ? QKIND_LABEL[m.kind].fa : QKIND_LABEL[m.kind].en}</small></span>
					{:else}<span class="okline" aria-label={T('no mistakes', 'بدون اشتباه')}>✓</span>{/if}
				</li>
			{/each}
		</ol>
		{@render bottom(T('Back', 'برگشت'), () => go(allFrom))}

	{:else if stage === 'result' && feedback}
		<p class="label">{T('Result', 'نتیجه')}</p>
		<ul class="uses" lang="en" dir="ltr">
			{#each feedback.fixes as item, i}
				{#if record.uses[i] === 'used'}<li class="ok"><span aria-hidden="true">✓</span> {item.better}</li>
				{:else if record.uses[i] === 'missed'}<li><span dir={isFa ? 'rtl' : 'ltr'}>{T('Next time try:', 'دفعهٔ بعد امتحان کن:')}</span> {item.better}</li>
				{:else}<li class="quiet"><span dir={isFa ? 'rtl' : 'ltr'}>{T('Not used this time:', 'این بار به کار نرفت:')}</span> {item.better}</li>{/if}
			{/each}
		</ul>
		{#if feedback.fixes.length}<p class="hint">{feedback.fixes.length === 1 ? T('This time I only checked your fix.', 'این بار فقط اصلاحت را بررسی کردم.') : T('This time I only checked your 2 fixes.', 'این بار فقط ۲ اصلاحت را بررسی کردم.')}</p>{/if}
		{#if feedback.mistakes.length}<button class="link quiet" type="button" onclick={showAll}>{T('See all your questions', 'دیدن همهٔ سؤال‌هایت')}</button>{/if}
		{@render bottom(T('Done', 'تمام'), finish)}
	{/if}
</section>

<style>
	.mi { display: grid; gap: 12px; padding-bottom: 104px; }
	.brief { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.brief p { margin: 0; line-height: 1.55; }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.progress { margin: 0; font-weight: 700; color: var(--accent-deep); }
	.card { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
	.card li { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 4px 12px; padding: 10px 12px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); line-height: 1.4; }
	.card.full li { padding: 12px 14px; }
	.card li.found { border-color: var(--leaf); background: var(--leaf-wash); }
	.card li.new { animation: flash 1.2s ease-out; }
	@keyframes flash { from { box-shadow: 0 0 0 3px var(--leaf); } to { box-shadow: 0 0 0 0 transparent; } }
	.what { font-weight: 600; }
	.target { display: grid; gap: 4px; padding: 14px 16px; border-radius: 14px; background: var(--paper-raised); border: 1.5px solid var(--accent); }
	.target .what { font-size: 1.12rem; line-height: 1.4; }
	.target.found { border-color: var(--leaf); background: var(--leaf-wash); }
	.target.new { animation: flash 1.2s ease-out; }
	.find { font-size: .75rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .find { letter-spacing: normal; }
	.value { color: var(--ink); }
	.value.empty, .value.missed { color: var(--ink-soft); }
	.value.partly { color: var(--accent-deep); font-style: italic; }
	.exchange { display: grid; gap: 8px; min-height: 96px; align-content: start; }
	.you, .tom { margin: 0; padding: 10px 14px; border-radius: 14px; line-height: 1.5; text-align: left; }
	.you { background: var(--paper-sunken); color: var(--ink-soft); }
	.tom { background: var(--paper-raised); border: 1px solid var(--line); font-size: 1.08rem; }
	.who { display: block; font-size: .75rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--accent-deep); }
	.starters { margin: 0; color: var(--ink-soft); }
	.typed input { inline-size: 100%; min-height: 48px; padding: 10px 14px; border: 1.5px solid var(--line); border-radius: 12px; background: var(--paper-raised); color: var(--ink); font: inherit; }
	.twist { margin: 0; line-height: 1.55; }
	.count { margin: 0; font-weight: 600; line-height: 1.55; }
	.label { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .label, :global([dir='rtl']) .who { letter-spacing: normal; }
	.was { margin: 0; color: var(--ink-soft); font-size: 1.05rem; text-align: left; }
	.now { margin: 0; font-family: var(--font-display); font-size: clamp(1.3rem, 5.8vw, 1.7rem); color: var(--accent-deep); text-align: left; }
	mark { background: color-mix(in srgb, var(--attention) 22%, transparent); color: inherit; border-radius: 4px; padding: 0 2px; }
	.why { margin: 0; color: var(--ink-soft); line-height: 1.6; }
	.note { margin: 0; line-height: 1.5; }
	.ok { margin: 0; color: var(--leaf); font-weight: 700; }
	.chips { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
	.chips li { padding: 8px 14px; border-radius: 999px; background: var(--accent-wash); color: var(--accent-deep); font-weight: 600; }
	.all { margin: 0; padding-inline-start: 22px; display: grid; gap: 10px; }
	.all li { line-height: 1.5; }
	.fixline { display: block; color: var(--accent-deep); }
	.fixline small, .okline { color: var(--ink-soft); }
	.okline { margin-inline-start: 6px; color: var(--leaf); }
	.uses { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
	.uses li { padding: 12px 14px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); }
	.uses li.ok { border-color: var(--leaf); background: var(--leaf-wash); color: var(--ink); font-weight: 400; }
	.uses li.quiet { color: var(--ink-soft); }
	.center { display: grid; justify-items: center; gap: 12px; margin-top: 18px; text-align: center; }
	.hint { margin: 0; color: var(--ink-soft); line-height: 1.5; }
	.hear { justify-self: start; display: grid; place-items: center; inline-size: 48px; block-size: 48px; border: 1.5px solid var(--accent); border-radius: 50%; background: var(--paper-raised); color: var(--accent-deep); cursor: pointer; }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.link.quiet { color: var(--ink-soft); }
	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 20; padding: 12px 20px calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 35%); }
	.primary { display: flex; align-items: center; justify-content: center; gap: 10px; inline-size: 100%; max-inline-size: 680px; margin-inline: auto; min-height: 54px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	.primary:disabled { opacity: .5; cursor: default; }
	.primary.rec { background: var(--attention); }
	.dot { inline-size: 12px; block-size: 12px; border-radius: 50%; background: currentColor; animation: pulse 1.2s infinite ease-in-out; }
	.left { font-variant-numeric: tabular-nums; }
	@keyframes pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
	.dots { display: inline-flex; gap: 6px; }
	.dots span { inline-size: 10px; block-size: 10px; border-radius: 50%; background: var(--ink-soft); animation: blink 1.2s infinite ease-in-out; }
	.dots span:nth-child(2) { animation-delay: .2s; }
	.dots span:nth-child(3) { animation-delay: .4s; }
	@keyframes blink { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	h2:focus { outline: none; }
	button:focus-visible, input:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	@media (prefers-reduced-motion: reduce) { .dot, .dots span, .card li.new, .target.new { animation: none; } }
</style>
