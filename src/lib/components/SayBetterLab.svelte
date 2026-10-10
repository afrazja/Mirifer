<script lang="ts">
	/**
	 * "Say it again, better", Module lab version (docs/english-say-better-lab-spec.md, owner-approved v2).
	 * Question → recording (45 s) → what you said (every mistake marked and counted) → fix ①/② →
	 * better version → second try → before and after. One focused screen at a time. The run is kept in
	 * this browser; the recordings only in memory, for playback, until the page closes.
	 */
	import { onDestroy, onMount } from 'svelte';
	import { playAudioPromise, stopAllAudio, ttsIsPlaying } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { fixUse } from '$lib/practice/say-better';
	import {
		KIND_LABEL, LAB_AMBER_AT, LAB_MAX_SECONDS, LAB_MIN_SECONDS, LAB_NUDGE_SECONDS, LAB_QUESTIONS,
		countLine, emptyLabRecord, labQuestion, markParts, type LabFeedback, type LabRecord, type LabStep
	} from '$lib/practice/say-better-lab';

	let { isFa = false, initial = null, first = false, onSave, onDone }: {
		isFa?: boolean;
		initial?: LabRecord | null;
		/** The very first question of a visit: Mira says her instruction before it. */
		first?: boolean;
		onSave?: (record: LabRecord) => void;
		onDone: () => void;
	} = $props();

	const INSTRUCTION = {
		en: 'I’ll ask you a question. Answer in about thirty seconds. Then we’ll look at your answer together, and you’ll say it again, better.',
		fa: 'یک سؤال می‌پرسم. حدود سی ثانیه جواب بده. بعد با هم به جوابت نگاه می‌کنیم و دوباره، بهتر، می‌گویی‌اش.'
	};
	const NUM = ['', '①', '②'];
	const TRIES = [1, 2] as const;

	type Stage = 'question' | 'recording' | 'nudge' | 'short' | 'interrupted' | 'denied' | 'processing' | 'failed' | 'more' | 'heard' | 'fix' | 'better' | 'all' | 'retry' | 'result';
	// svelte-ignore state_referenced_locally
	let record = $state<LabRecord>(initial ?? emptyLabRecord(1));
	let stage = $state<Stage>('question'), allFrom = $state<Stage>('heard');
	let attempt = $state<1 | 2>(1);
	let elapsed = $state(0), note = $state<'listening' | 'thinking'>('listening');
	let failedAt = $state<'transcribe' | 'feedback'>('transcribe');
	let showBoth = $state(false);
	let urls = $state<{ 1: string | null; 2: string | null }>({ 1: null, 2: null });
	let playingTry = $state<1 | 2 | null>(null);
	let recorder: MediaRecorder | null = null, stream: MediaStream | null = null, chunks: Blob[] = [];
	let blob: Blob | null = null, startedAt = 0, timer: ReturnType<typeof setInterval> | undefined, interrupted = false, cut = false;
	let player: HTMLAudioElement | null = null;
	let heading: HTMLElement | undefined = $state();
	const playing = $derived($ttsIsPlaying);
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const fa = (n: number) => n.toLocaleString('fa-IR');
	const question = $derived(labQuestion(record.question) ?? LAB_QUESTIONS[0]);
	const feedback = $derived(record.feedback);

	onMount(() => {
		// A reload returns to the step it left. A finished AI call is never repeated; a missing one is sent again once.
		if (record.transcript2 !== null) { attempt = 2; stage = 'result'; }
		else if (record.feedback) { stage = record.step === 'question' ? 'heard' : record.step; attempt = record.step === 'retry' ? 2 : 1; }
		else if (record.transcript1) void getFeedback();
		else if (first) say(`${INSTRUCTION.en} ${question.text}`);
		document.addEventListener('visibilitychange', onHidden);
		return () => document.removeEventListener('visibilitychange', onHidden);
	});
	onDestroy(() => {
		clearInterval(timer);
		if (recorder?.state === 'recording') recorder.stop();
		stream?.getTracks().forEach(t => t.stop());
		player?.pause();
		for (const url of [urls[1], urls[2]]) if (url) URL.revokeObjectURL(url);
	});

	function persist() { onSave?.($state.snapshot(record)); }
	const STEPS: LabStep[] = ['question', 'heard', 'fix', 'better', 'retry', 'result'];
	function go(next: Stage) {
		stage = next;
		if ((STEPS as string[]).includes(next) && record.step !== next) { record = { ...record, step: next as LabStep }; persist(); }
		queueMicrotask(() => heading?.focus());
	}
	function onHidden() {
		if (!document.hidden) return;
		if (recorder?.state === 'recording') { interrupted = true; recorder.stop(); }
		stopTry();
	}
	function say(line: string) { stopTry(); stopAllAudio(); void playAudioPromise(line.replace(/’/g, "'"), COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {}); }
	function hear(text: string) { if (playing) stopAllAudio(); else say(text); }

	// Recording (both tries)
	async function startRecording() {
		stopAllAudio(); stopTry(); // Mira's voice must never end up in the recording
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { go('denied'); return; }
		try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { go('denied'); return; }
		const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
		recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64_000 });
		chunks = []; interrupted = false; cut = false; blob = null;
		recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
		recorder.onstop = finishRecording;
		// A muted or lost microphone (a phone call, for example) stops the recording too.
		const track = stream.getAudioTracks()[0];
		if (track) track.onmute = track.onended = () => { if (recorder?.state === 'recording') { interrupted = true; recorder.stop(); } };
		recorder.start();
		startedAt = performance.now(); elapsed = 0; stage = 'recording';
		timer = setInterval(() => {
			elapsed = Math.min(LAB_MAX_SECONDS, (performance.now() - startedAt) / 1000);
			if (elapsed >= LAB_MAX_SECONDS && recorder?.state === 'recording') { cut = true; recorder.stop(); }
		}, 200);
	}
	const stopRecording = () => { if (recorder?.state === 'recording') recorder.stop(); };
	function finishRecording() {
		clearInterval(timer);
		stream?.getTracks().forEach(track => track.stop()); stream = null;
		blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' });
		elapsed = Math.min(LAB_MAX_SECONDS, Math.round((performance.now() - startedAt) / 1000));
		if (interrupted) { go('interrupted'); return; }
		if (elapsed < LAB_MIN_SECONDS) { go('short'); return; }
		if (elapsed < LAB_NUDGE_SECONDS) { go('nudge'); return; }
		void send();
	}
	function recordAgain() { blob = null; go(attempt === 1 ? 'question' : 'retry'); }

	async function send() {
		if (!blob) return;
		go('processing'); note = 'listening';
		const body = new FormData();
		body.set('audio', blob, 'speech'); body.set('seconds', String(elapsed)); body.set('question', String(record.question));
		let transcript: string | null = null;
		try {
			const response = await fetch('/api/english/say-better-lab', { method: 'POST', body });
			const data = response.ok ? await response.json() : null;
			transcript = typeof data?.transcript === 'string' ? data.transcript : null;
		} catch { transcript = null; }
		if (transcript === null) { failedAt = 'transcribe'; go('failed'); return; }
		const url = URL.createObjectURL(blob);
		if (urls[attempt]) URL.revokeObjectURL(urls[attempt]!);
		urls = { ...urls, [attempt]: url };
		blob = null;
		if (attempt === 1) {
			record = { ...record, transcript1: transcript, seconds1: elapsed, cut1: cut, feedback: null }; persist();
			await getFeedback();
		} else {
			const uses = (record.feedback?.fixes ?? []).map(fix => fixUse(fix, transcript!));
			record = { ...record, transcript2: transcript, seconds2: elapsed, uses }; persist();
			go('result');
		}
	}

	async function getFeedback() {
		go('processing'); note = 'thinking';
		const controller = new AbortController();
		const wait = setTimeout(() => controller.abort(), 30_000);
		let result: LabFeedback | null = null;
		try {
			const response = await fetch('/api/english/say-better-lab', {
				method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
				body: JSON.stringify({ kind: 'feedback', question: record.question, transcript: record.transcript1, cutOff: record.cut1 })
			});
			result = response.ok ? await response.json() : null;
		} catch { result = null; }
		finally { clearTimeout(wait); }
		if (!result || !Array.isArray(result.mistakes) || !Array.isArray(result.fixes)) { failedAt = 'feedback'; go('failed'); return; }
		record = { ...record, feedback: result, fixIndex: 0 }; persist();
		go(result.case === 'more' ? 'more' : 'heard');
	}

	/** The next question in the list (never a free skip). Spoken inside the tap. */
	function nextQuestion() {
		stopAllAudio(); stopTry();
		for (const url of [urls[1], urls[2]]) if (url) URL.revokeObjectURL(url);
		urls = { 1: null, 2: null }; attempt = 1; showBoth = false;
		const next = (record.question % LAB_QUESTIONS.length) + 1;
		record = emptyLabRecord(next); persist();
		go('question');
		say(labQuestion(next)!.text);
	}
	function answerAgain() { attempt = 1; record = { ...record, transcript1: null, feedback: null, step: 'question' }; persist(); go('question'); }
	function toFixes() { record = { ...record, fixIndex: 0 }; go(feedback?.fixes.length ? 'fix' : 'better'); }
	function nextFix() {
		if (!feedback) return;
		if (record.fixIndex + 1 < feedback.fixes.length) { record = { ...record, fixIndex: record.fixIndex + 1 }; persist(); queueMicrotask(() => heading?.focus()); }
		else go(feedback.better ? 'better' : 'retry');
	}
	function toSecondTry() { stopAllAudio(); attempt = 2; go('retry'); }
	function showAll() { allFrom = stage; go('all'); }
	function finish() { stopAllAudio(); stopTry(); record = { ...record, done: true }; persist(); onDone(); }

	// Before and after: one recording at a time, and never over Mira.
	function playTry(which: 1 | 2) {
		const url = urls[which];
		if (!url) return;
		if (playingTry === which) { stopTry(); return; }
		stopTry(); stopAllAudio();
		player = new Audio(url);
		player.onended = () => (playingTry = null);
		playingTry = which;
		void player.play().catch(() => (playingTry = null));
	}
	function stopTry() { player?.pause(); player = null; playingTry = null; }

	const remaining = $derived(Math.max(0, LAB_MAX_SECONDS - elapsed));
	const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
	const count = $derived(feedback ? countLine(feedback.case, feedback.mistakes.length, feedback.fixes.length) : null);
	const heardParts = $derived(feedback && record.transcript1 ? markParts(record.transcript1, [
		...feedback.mistakes.map(m => ({ at: m.at, focus: m.focus })),
		...(feedback.natural ? [{ at: feedback.natural.at, focus: 1 }] : [])
	]) : []);
	const betterParts = $derived(feedback?.better ? markParts(feedback.better, [
		...feedback.mistakes.map(m => ({ at: m.inBetter, focus: m.focus })),
		...(feedback.natural ? [{ at: feedback.natural.inBetter, focus: 1 }] : [])
	]) : []);
	/** More than about a fifth of the words changed: listen once before trying again. */
	const manyChanges = $derived.by(() => {
		const all = betterParts.reduce((n, p) => n + p.text.split(/\s+/).filter(Boolean).length, 0);
		const changed = betterParts.filter(p => p.focus !== null).reduce((n, p) => n + p.text.split(/\s+/).filter(Boolean).length, 0);
		return all > 0 && changed / all > 0.2;
	});
	const fix = $derived(feedback?.fixes[record.fixIndex] ?? null);
	const fixLabel = $derived(!feedback || feedback.fixes.length < 2 ? T('Your fix', 'اصلاح تو') : T(`Fix ${NUM[record.fixIndex + 1]}`, `اصلاح ${NUM[record.fixIndex + 1]}`));
	const checkedLine = $derived(!feedback?.fixes.length ? null : feedback.fixes.length === 1
		? T('This time I only checked your fix.', 'این بار فقط اصلاحت را بررسی کردم.')
		: T(`This time I only checked your ${feedback.fixes.length} fixes.`, `این بار فقط ${fa(feedback.fixes.length)} اصلاحت را بررسی کردم.`));
</script>

{#snippet bottom(label: string, action: () => void, disabled = false)}
	<div class="bar"><button class="primary" type="button" onclick={action} {disabled}>{label}</button></div>
{/snippet}

{#snippet micBar(label: string)}
	<div class="bar"><button class="primary mic" type="button" onclick={startRecording}>
		<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0M12 17v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
		{label}
	</button></div>
{/snippet}

{#snippet marked(parts: { text: string; focus: number | null }[], natural: boolean)}
	{#each parts as part}{#if part.focus}<mark class="focus">{part.text}<span class="num" aria-hidden="true">{NUM[part.focus]}</span><span class="sr-only"> ({natural ? T('more natural', 'طبیعی‌تر') : T(`fix ${part.focus}`, `اصلاح ${fa(part.focus)}`)})</span></mark>{:else if part.focus === 0}<span class="other">{part.text}<span class="sr-only"> ({T('mistake', 'اشتباه')})</span></span>{:else}{part.text}{/if}{/each}
{/snippet}

<section class="lab" aria-live="polite">
	<h2 class="sr-only" tabindex="-1" bind:this={heading}>{T('Say it again, better', 'دوباره بگو، بهتر')}</h2>

	{#if stage === 'question'}
		<div class="brief"><span class="avatar" aria-hidden="true">M</span><p>{isFa ? INSTRUCTION.fa : INSTRUCTION.en}</p></div>
		<p class="question" lang="en" dir="ltr">{question.text}</p>
		<div class="row">
			<button class="hear" type="button" onclick={() => hear(question.text)} aria-label={T('Hear the question', 'سؤال را بشنو')}><span aria-hidden="true">{playing ? '■' : '▶'}</span></button>
			<button class="link quiet" type="button" onclick={nextQuestion}>{T('Another question', 'سؤال دیگر')}</button>
		</div>
		{@render micBar(T('Tap to start', 'بزن تا شروع شود'))}

	{:else if stage === 'retry'}
		<p class="label">{T('Say it again', 'دوباره بگو')}</p>
		<p class="question small" lang="en" dir="ltr">{question.text}</p>
		{#if feedback?.fixes.length}
			<p class="lead">{T('Answer again in your own words. Try to use:', 'دوباره با کلمات خودت جواب بده. سعی کن این‌ها را به کار ببری:')}</p>
			<ul class="chips" lang="en" dir="ltr">{#each feedback.fixes as item, i}<li>{#if feedback.fixes.length > 1}<span aria-hidden="true">{NUM[i + 1]} </span>{/if}{item.better}</li>{/each}</ul>
		{:else}
			<p class="lead">{T('Answer once more, in your own words.', 'یک بار دیگر با کلمات خودت جواب بده.')}</p>
		{/if}
		{@render micBar(T('Tap to start', 'بزن تا شروع شود'))}

	{:else if stage === 'recording'}
		<div class="center">
			<div class="ring" class:late={elapsed >= LAB_AMBER_AT} style:--p={`${(elapsed / LAB_MAX_SECONDS) * 360}deg`} role="timer" aria-label={T(`${Math.ceil(remaining)} seconds left`, `${fa(Math.ceil(remaining))} ثانیه مانده`)}>
				<span class="time">{remaining <= 10 ? Math.ceil(remaining) : clock(elapsed)}</span>
			</div>
			<p class="hint">{remaining <= 10 ? T('Finish your sentence…', 'جمله‌ات را تمام کن…') : T('Recording… it stops by itself at 0:45', 'در حال ضبط… در ۰:۴۵ خودش تمام می‌شود')}</p>
		</div>
		{@render bottom(T('Stop', 'پایان ضبط'), stopRecording)}

	{:else if stage === 'nudge'}
		<p class="lead">{T(`That was ${elapsed} seconds.`, `${fa(elapsed)} ثانیه بود.`)}</p>
		<button class="link" type="button" onclick={recordAgain}>{T('Say a bit more?', 'کمی بیشتر می‌گویی؟')}</button>
		{@render bottom(T('Send it', 'بفرست'), send)}

	{:else if stage === 'short'}
		<p class="lead">{T('That was very short. Try to say a bit more.', 'خیلی کوتاه بود. سعی کن کمی بیشتر بگویی.')}</p>
		{@render bottom(T('Record again', 'دوباره ضبط کن'), recordAgain)}

	{:else if stage === 'interrupted'}
		<p class="lead">{T('The recording stopped (you left the page, or the microphone went off).', 'ضبط متوقف شد (از صفحه بیرون رفتی یا میکروفون قطع شد).')}</p>
		{#if elapsed >= LAB_MIN_SECONDS}<button class="link" type="button" onclick={send}>{T('Send what you have', 'همین را بفرست')}</button>{/if}
		{@render bottom(T('Record again', 'دوباره ضبط کن'), recordAgain)}

	{:else if stage === 'denied'}
		<p class="lead">{T('Mira can’t hear you: the microphone is blocked. Allow it in your browser’s site settings, then try again.', 'میرا صدایت را نمی‌شنود: میکروفون بسته است. در تنظیمات سایتِ مرورگر اجازه‌اش را بده و دوباره امتحان کن.')}</p>
		{@render bottom(T('Try again', 'دوباره امتحان کن'), recordAgain)}

	{:else if stage === 'processing'}
		<div class="center">
			<div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>
			<p class="hint" role="status">{note === 'listening' ? T('Mira is listening…', 'میرا دارد گوش می‌دهد…') : T('Here’s what I heard. Mira is thinking…', 'این را شنیدم. میرا دارد فکر می‌کند…')}</p>
			{#if note === 'thinking' && record.transcript1}<p class="said" lang="en" dir="ltr">“{record.transcript1}”</p>{/if}
		</div>

	{:else if stage === 'failed'}
		{#if failedAt === 'transcribe'}
			<p class="lead">{T('I couldn’t hear that clearly. Check your connection and try again.', 'نتوانستم واضح بشنوم. اینترنت را بررسی کن و دوباره امتحان کن.')}</p>
			<button class="link quiet" type="button" onclick={recordAgain}>{T('Record again', 'دوباره ضبط کن')}</button>
			{@render bottom(T('Try again', 'دوباره امتحان کن'), send)}
		{:else}
			<p class="lead">{T('I couldn’t check that one. Here’s what I heard:', 'نتوانستم این یکی را بررسی کنم. این را شنیدم:')}</p>
			{#if record.transcript1}<p class="said" lang="en" dir="ltr">{record.transcript1}</p>{/if}
			<button class="link quiet" type="button" onclick={getFeedback}>{T('Try again', 'دوباره امتحان کن')}</button>
			{@render bottom(T('Another question', 'سؤال دیگر'), nextQuestion)}
		{/if}

	{:else if stage === 'more'}
		<p class="lead">{T('Tell me a bit more.', 'کمی بیشتر بگو.')}</p>
		<p class="question small" lang="en" dir="ltr">{question.text}</p>
		<button class="link quiet" type="button" onclick={nextQuestion}>{T('Another question', 'سؤال دیگر')}</button>
		{@render bottom(T('Record again', 'دوباره ضبط کن'), answerAgain)}

	{:else if stage === 'heard' && feedback}
		{#if feedback.praise}<p class="praise">{isFa ? feedback.praise.fa : feedback.praise.en}</p>{/if}
		<p class="label">{T('What you said', 'چیزی که گفتی')}</p>
		<p class="said" lang="en" dir="ltr">{@render marked(heardParts, feedback.case === 'natural')}</p>
		{#if count}<p class="count">{isFa ? count.fa : count.en}</p>{/if}
		{#if feedback.case === 'strong'}
			<button class="link" type="button" onclick={toSecondTry}>{T('Say it again anyway', 'باز هم بگو')}</button>
			{@render bottom(T('Next question', 'سؤال بعدی'), nextQuestion)}
		{:else}
			{@render bottom(feedback.fixes.length > 1 ? T('See the fixes', 'دیدن اصلاح‌ها') : T('See the fix', 'دیدن اصلاح'), toFixes)}
		{/if}

	{:else if stage === 'fix' && feedback && fix}
		<p class="label">{fixLabel}</p>
		<p class="was" lang="en" dir="ltr"><s>{fix.original}</s></p>
		<p class="now" lang="en" dir="ltr">{fix.better}</p>
		<button class="hear" type="button" onclick={() => hear(fix.better)} aria-label={T('Hear it', 'بشنو')}><span aria-hidden="true">{playing ? '■' : '▶'}</span></button>
		<p class="why">{isFa ? fix.why.fa : fix.why.en}</p>
		{@render bottom(record.fixIndex + 1 < feedback.fixes.length ? T('Next fix', 'اصلاح بعدی') : T('See your better version', 'دیدن نسخهٔ بهترت'), nextFix)}

	{:else if stage === 'better' && feedback?.better}
		<p class="label">{T('Your answer, a bit better', 'جوابت، کمی بهتر')}</p>
		<p class="said better" lang="en" dir="ltr">{@render marked(betterParts, feedback.case === 'natural')}</p>
		<div class="row">
			<button class="hear" type="button" onclick={() => hear(feedback.better ?? '')} aria-label={T('Hear Mira read it', 'بشنو که میرا می‌خواندش')}><span aria-hidden="true">{playing ? '■' : '▶'}</span></button>
			<button class="link quiet" type="button" onclick={showAll}>{T('See all fixes', 'دیدن همهٔ اصلاح‌ها')}</button>
		</div>
		{#if manyChanges}<p class="hint">{T('Your better version has quite a few changes. Listen once before you try again.', 'نسخهٔ بهترت تغییرهای زیادی دارد. قبل از اینکه دوباره امتحان کنی، یک بار گوش بده.')}</p>{/if}
		{@render bottom(T('Try again', 'دوباره امتحان کن'), toSecondTry)}

	{:else if stage === 'all' && feedback}
		<p class="label">{T('All fixes', 'همهٔ اصلاح‌ها')}</p>
		<ul class="all">
			{#each feedback.mistakes as m}
				<li><bdi lang="en" dir="ltr">{#if m.focus}<span aria-hidden="true">{NUM[m.focus]} </span>{/if}{m.better ? `${m.original} → ${m.better}` : `“${m.original}” → (left out)`}</bdi> <small>· {isFa ? KIND_LABEL[m.kind].fa : KIND_LABEL[m.kind].en}</small></li>
			{/each}
			{#if feedback.case === 'natural' && feedback.fixes[0]}
				<li><bdi lang="en" dir="ltr">{feedback.fixes[0].original} → {feedback.fixes[0].better}</bdi> <small>· {T('more natural', 'طبیعی‌تر')}</small></li>
			{/if}
		</ul>
		{@render bottom(T('Back', 'برگشت'), () => go(allFrom))}

	{:else if stage === 'result'}
		<p class="label">{T('Before and after', 'قبل و بعد')}</p>
		{#if urls[1] && urls[2]}
			<div class="tries">
				{#each TRIES as which}
					<button class="try" type="button" class:on={playingTry === which} aria-pressed={playingTry === which} onclick={() => playTry(which)}>
						<span aria-hidden="true">{playingTry === which ? '■' : '▶'}</span>
						{which === 1 ? T('First try', 'بار اول') : T('Second try', 'بار دوم')}
						<span class="dur">{clock(which === 1 ? record.seconds1 : record.seconds2)}</span>
					</button>
				{/each}
			</div>
		{:else}
			<p class="hint">{T('Recordings are kept only while this page is open.', 'صداها فقط تا وقتی این صفحه باز است نگه داشته می‌شوند.')}</p>
			<button class="link quiet" type="button" onclick={() => (showBoth = !showBoth)} aria-expanded={showBoth}>{showBoth ? T('Hide both answers', 'پنهان کردن هر دو جواب') : T('Show both answers', 'نمایش هر دو جواب')}</button>
			{#if showBoth}
				<p class="said" lang="en" dir="ltr">{record.transcript1}</p>
				<p class="said better" lang="en" dir="ltr">{record.transcript2}</p>
			{/if}
		{/if}
		{#if feedback?.fixes.length}
			<ul class="uses">
				{#each feedback.fixes as item, i}
					{#if record.uses[i] === 'used'}<li class="ok"><span aria-hidden="true">✓</span> <bdi lang="en">{item.better}</bdi></li>
					{:else if record.uses[i] === 'missed'}<li>{T('Next time try:', 'دفعهٔ بعد امتحان کن:')} <bdi lang="en">{item.better}</bdi></li>
					{:else}<li class="quiet">{T('Not used this time:', 'این بار به کار نرفت:')} <bdi lang="en">{item.better}</bdi></li>{/if}
				{/each}
			</ul>
		{/if}
		{#if checkedLine}<p class="hint">{checkedLine}</p>{/if}
		{#if feedback?.mistakes.length || feedback?.case === 'natural'}<button class="link quiet" type="button" onclick={showAll}>{T('See all fixes', 'دیدن همهٔ اصلاح‌ها')}</button>{/if}
		<button class="link quiet" type="button" onclick={finish}>{T('Finish', 'تمام')}</button>
		{@render bottom(T('Next question', 'سؤال بعدی'), nextQuestion)}
	{/if}
</section>

<style>
	.lab { display: grid; gap: 14px; padding-bottom: 96px; }
	.brief { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.brief p { margin: 0; line-height: 1.55; }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.question { margin: 6px 0 0; font-family: var(--font-display); font-size: clamp(1.45rem, 6.4vw, 1.9rem); line-height: 1.3; text-align: left; }
	.question.small { margin: 0; font-size: 1.15rem; color: var(--ink-soft); }
	.row { display: flex; align-items: center; gap: 18px; }
	.lead { margin: 0; font-size: 1.1rem; line-height: 1.55; }
	.label { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .label { letter-spacing: normal; }
	.said { margin: 0; padding: 14px 16px; border-radius: 14px; background: var(--paper-raised); border: 1px solid var(--line); line-height: 1.8; text-align: left; }
	.said.better { border-color: var(--accent); }
	.other { text-decoration: underline dotted var(--attention); text-decoration-thickness: 2px; text-underline-offset: 4px; }
	mark.focus { background: color-mix(in srgb, var(--attention) 22%, transparent); color: inherit; font-weight: 700; border-radius: 4px; padding: 0 2px; }
	.num { margin-inline-start: 2px; font-size: .85em; color: var(--accent-deep); }
	.count { margin: 0; line-height: 1.55; font-weight: 600; }
	.praise { margin: 0; font-size: 1.08rem; line-height: 1.55; color: var(--accent-deep); font-weight: 600; }
	.was { margin: 0; color: var(--ink-soft); font-size: 1.1rem; text-align: left; }
	.now { margin: 0; font-family: var(--font-display); font-size: clamp(1.4rem, 6vw, 1.8rem); color: var(--accent-deep); text-align: left; }
	.why { margin: 0; color: var(--ink-soft); line-height: 1.6; }
	.chips { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
	.chips li { padding: 8px 14px; border-radius: 999px; background: var(--accent-wash); color: var(--accent-deep); font-weight: 600; }
	.all { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
	.all li { padding: 10px 12px; border-radius: 10px; background: var(--paper-raised); border: 1px solid var(--line); line-height: 1.5; }
	.all small { color: var(--ink-soft); }
	.tries { display: grid; gap: 10px; }
	.try { display: flex; align-items: center; gap: 12px; inline-size: 100%; min-height: 56px; padding: 10px 16px; border: 1.5px solid var(--accent); border-radius: 14px; background: var(--paper-raised); color: var(--ink); font: inherit; font-weight: 600; cursor: pointer; }
	.try.on { background: var(--accent-wash); }
	.dur { margin-inline-start: auto; color: var(--ink-soft); font-variant-numeric: tabular-nums; }
	.uses { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
	.uses li { padding: 12px 14px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); }
	.uses li.ok { border-color: var(--leaf); background: var(--leaf-wash); }
	.uses li.quiet { color: var(--ink-soft); }
	.center { display: grid; justify-items: center; gap: 12px; margin-top: 18px; text-align: center; }
	.hint { margin: 0; color: var(--ink-soft); line-height: 1.5; }
	.ring { --p: 0deg; display: grid; place-items: center; inline-size: 168px; block-size: 168px; border-radius: 50%; background: conic-gradient(var(--accent) var(--p), var(--paper-sunken) 0); }
	.ring.late { background: conic-gradient(var(--attention) var(--p), var(--paper-sunken) 0); }
	.ring::before { content: ''; grid-area: 1 / 1; inline-size: 140px; block-size: 140px; border-radius: 50%; background: var(--paper); }
	.time { grid-area: 1 / 1; z-index: 1; font-family: var(--font-display); font-size: 2.4rem; font-variant-numeric: tabular-nums; }
	.hear { flex: none; display: grid; place-items: center; inline-size: 48px; block-size: 48px; border: 1.5px solid var(--accent); border-radius: 50%; background: var(--paper-raised); color: var(--accent-deep); cursor: pointer; }
	.lab > .hear { justify-self: start; }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.link.quiet { color: var(--ink-soft); }
	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 20; padding: 12px 20px calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 35%); }
	.primary { display: flex; align-items: center; justify-content: center; gap: 10px; inline-size: 100%; max-inline-size: 680px; margin-inline: auto; min-height: 54px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	.primary:disabled { opacity: .5; cursor: default; }
	.dots { display: inline-flex; gap: 6px; }
	.dots span { inline-size: 10px; block-size: 10px; border-radius: 50%; background: var(--ink-soft); animation: blink 1.2s infinite ease-in-out; }
	.dots span:nth-child(2) { animation-delay: .2s; }
	.dots span:nth-child(3) { animation-delay: .4s; }
	@keyframes blink { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	h2:focus { outline: none; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	@media (prefers-reduced-motion: reduce) { .dots span { animation: none; } }
</style>
