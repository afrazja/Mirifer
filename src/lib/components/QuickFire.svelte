<script lang="ts">
	/**
	 * "Quick-fire questions": six short personal questions in a fast chat. Mira asks; recording starts
	 * by itself when she finishes and ends by itself after a short silence; the next question follows
	 * from the answer (AI), or is a ready-made follow-up if the AI is slow or unsure. An answer that
	 * doesn't fit the question is asked again once. Feedback (each answer corrected and said better,
	 * quick starts, reasons) comes at the end. Recordings are never stored.
	 */
	import { practiceFetch } from '$services/practice-fetch';
	import { onDestroy, onMount } from 'svelte';
	import { playAudioPromise, stopAllAudio } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { SILENT_BELOW, measureLevel, type MicLevel } from '$utils/mic-level';
	import {
		AI_WAIT_MS, ANSWER_MAX_SECONDS, END_AFTER_QUIET, NO_ANSWER_AFTER, OPENERS, QUESTIONS_PER_ROUND, QUICK_START_MS,
		changedParts, emptyQuickFire, fallbackQuestion, gaveReason, isExtended, newTurn, sameAnswer, summarize, type QuickFireRecord
	} from '$lib/practice/quick-fire';

	let { isFa = false, initial = null, first = false, onSave, onDone }: {
		isFa?: boolean;
		initial?: QuickFireRecord | null;
		first?: boolean;
		onSave?: (record: QuickFireRecord) => void;
		onDone: () => void;
	} = $props();

	const INTRO = {
		en: 'Let’s have a quick chat. I’ll ask you six short questions about you. Answer straight away, in two or three sentences: say your answer, then why. Recording starts by itself when I finish each question.',
		fa: 'بیا یک گپ سریع بزنیم. شش سؤال کوتاه دربارهٔ خودت می‌پرسم. فوراً جواب بده، در دو سه جمله: جوابت را بگو و بعد بگو چرا. وقتی هر سؤال تمام شود، ضبط خودش شروع می‌شود.'
	};
	const BYE = 'That’s it. Nice chat! Now let’s look at your answers.';
	const AGAIN = 'Hmm, that doesn’t really answer my question. Listen again.';

	type Status = 'asking' | 'recording' | 'listening' | 'thinking' | 'missed' | 'failed' | 'denied';
	// svelte-ignore state_referenced_locally
	let record = $state<QuickFireRecord>(initial ?? emptyQuickFire(0));
	// svelte-ignore state_referenced_locally
	let stage = $state<'ready' | 'chat' | 'result'>(initial?.done ? 'result' : 'ready');
	let status = $state<Status>('asking'), elapsed = $state(0), lastHeard = $state(''), notice = $state('');
	let stream: MediaStream | null = null, level: MicLevel | null = null, recorder: MediaRecorder | null = null, chunks: Blob[] = [];
	let startedAt = 0, startMs: number | null = null, voicedAtStart = 0, timer: ReturnType<typeof setInterval> | undefined, interrupted = false, lastBlob: Blob | null = null;
	let heading: HTMLElement | undefined = $state();
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const fa = (n: number) => n.toLocaleString('fa-IR');
	const current = $derived(record.turns[record.turns.length - 1]);
	const number = $derived(record.turns.length);
	const resuming = $derived(record.turns.length > 1 || record.turns[0].answer !== null);

	onMount(() => {
		if (first && !resuming) void playAudioPromise(INTRO.en.replace(/’/g, "'"), COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {});
		const onHidden = () => { if (document.hidden && recorder && recorder.state !== 'inactive') { interrupted = true; recorder.stop(); } };
		document.addEventListener('visibilitychange', onHidden);
		return () => document.removeEventListener('visibilitychange', onHidden);
	});
	onDestroy(() => { clearInterval(timer); if (recorder && recorder.state !== 'inactive') recorder.stop(); closeMic(); });

	function persist() { onSave?.($state.snapshot(record)); }
	function closeMic() { level?.stop(); level = null; stream?.getTracks().forEach(t => t.stop()); stream = null; }
	const say = (line: string) => playAudioPromise(line.replace(/’/g, "'"), COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {});

	/** The Start tap: the microphone (kept open for the whole chat) and the level meter, then the first question. */
	async function start() {
		stopAllAudio();
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { stage = 'chat'; status = 'denied'; return; }
		try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { stage = 'chat'; status = 'denied'; return; }
		level = measureLevel(stream); level.setPaused(true);
		stage = 'chat';
		queueMicrotask(() => heading?.focus());
		// Back after a reload while Mira was choosing the next question: carry on from there.
		if (current.answer !== null) void nextQuestion(); else void ask();
	}

	/** Mira asks; when she finishes, recording starts by itself. */
	async function ask(keepNotice = false) {
		status = 'asking'; lastHeard = '';
		if (!keepNotice) notice = '';
		level?.setPaused(true); // her voice through the speaker is not the learner's
		await say(current.question);
		if (stage !== 'chat' || status !== 'asking') return;
		startRecording();
	}
	function startRecording() {
		if (!stream) return;
		const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
		recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64_000 });
		chunks = []; interrupted = false; startMs = null;
		recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
		recorder.onstop = finishAnswer;
		level?.setPaused(false);
		// Before its first reading the meter says Infinity; count from zero then.
		const voicedNow = level?.voiced() ?? 0;
		voicedAtStart = Number.isFinite(voicedNow) ? voicedNow : 0;
		recorder.start();
		startedAt = performance.now(); elapsed = 0; status = 'recording';
		timer = setInterval(() => {
			const now = performance.now();
			elapsed = (now - startedAt) / 1000;
			// The first sound of their answer: how quickly they started.
			if (startMs === null && (level?.voiced() ?? 0) > voicedAtStart + 0.15) startMs = Math.round(now - startedAt);
			const quiet = level?.quietFor() ?? 0;
			const over = elapsed >= ANSWER_MAX_SECONDS || (startMs !== null && elapsed > 1.5 && quiet >= END_AFTER_QUIET) || (startMs === null && elapsed >= NO_ANSWER_AFTER);
			if (over && recorder?.state === 'recording') recorder.stop();
		}, 100);
	}
	const stopNow = () => { if (recorder?.state === 'recording') recorder.stop(); };

	function finishAnswer() {
		clearInterval(timer);
		level?.setPaused(true);
		if (interrupted) { status = 'missed'; return; }
		const peak = level?.peak() ?? 1;
		if (startMs === null || peak < SILENT_BELOW) { status = 'missed'; return; }
		lastBlob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' });
		void send();
	}

	async function send() {
		if (!lastBlob) return;
		status = 'listening';
		const body = new FormData();
		body.set('audio', lastBlob, 'speech'); body.set('seconds', String(Math.round(elapsed)));
		let text: string | null = null;
		try {
			const response = await practiceFetch('/api/english/quick-fire', { method: 'POST', body });
			const data = response.ok ? await response.json() : null;
			text = typeof data?.transcript === 'string' && data.transcript.trim() ? data.transcript.trim() : null;
		} catch { text = null; }
		if (text === null) { status = 'failed'; return; }
		lastBlob = null; lastHeard = text;
		const turns = [...record.turns];
		turns[turns.length - 1] = { ...turns[turns.length - 1], answer: text, fixed: null, better: null, offTopic: false, startMs };
		record = { ...record, turns }; persist();
		await nextQuestion();
	}

	type Reply = { onTopic: boolean; next: string | null; fixed: string | null; better: string | null };
	/** One small AI call: does the answer fit, the next question (or a ready-made one if it's slow or unsure), and this answer corrected and said better. */
	async function nextQuestion() {
		status = 'thinking'; notice = '';
		const index = record.turns.length - 1, last = record.turns.length >= QUESTIONS_PER_ROUND;
		const answer = record.turns[index].answer;
		const answered = record.turns.filter(t => t.answer).map(t => ({ question: t.question, answer: t.answer! }));
		const call = answered.length
			? practiceFetch('/api/english/quick-fire', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'turn', turns: answered, asked: record.turns.map(t => t.question), last }) })
				.then(r => (r.ok ? r.json() : null)).catch(() => null) as Promise<Reply | null>
			: Promise.resolve(null);
		// Whenever it arrives, the feedback is kept for the end (unless they've answered this question again since).
		void call.then(reply => {
			const turn = record.turns[index];
			if (!reply || !turn || turn.answer !== answer) return;
			const turns = [...record.turns];
			turns[index] = { ...turn, fixed: reply.fixed ?? turn.fixed, better: reply.better ?? turn.better, offTopic: reply.onTopic === false };
			record = { ...record, turns }; persist();
		});
		const reply = await Promise.race([call, new Promise<null>(resolve => setTimeout(() => resolve(null), last ? AI_WAIT_MS * 1.5 : AI_WAIT_MS))]);
		if (stage !== 'chat') return;
		// Off topic: ask the same question once more.
		if (reply?.onTopic === false && !record.turns[index].retried) {
			const turns = [...record.turns]; turns[index] = { ...turns[index], retried: true };
			record = { ...record, turns }; persist();
			notice = T('That doesn’t really answer the question. Listen again.', 'این جواب سؤال نبود. دوباره گوش بده.');
			status = 'asking';
			await say(AGAIN);
			if (stage === 'chat') void ask(true);
			return;
		}
		if (last) { finishChat(); return; }
		const asked = record.turns.map(t => t.question);
		const question = reply?.next ?? fallbackQuestion(record.opener, asked);
		record = { ...record, turns: [...record.turns, newTurn(question)] }; persist();
		void ask();
	}
	/** No answer heard: try the same question again, or skip it (a ready-made follow-up comes next). */
	function tryAgain() { void ask(true); }
	async function skip() {
		if (record.turns.length >= QUESTIONS_PER_ROUND) { finishChat(); return; }
		const question = fallbackQuestion(record.opener, record.turns.map(t => t.question));
		record = { ...record, turns: [...record.turns, newTurn(question)] }; persist();
		void ask();
	}
	function finishChat() {
		closeMic();
		record = { ...record, done: true }; persist();
		stage = 'result';
		queueMicrotask(() => heading?.focus());
		void say(BYE);
	}
	function anotherRound() {
		stopAllAudio();
		record = emptyQuickFire((record.opener + 1) % OPENERS.length); persist();
		stage = 'ready';
	}
	function finish() { stopAllAudio(); closeMic(); onDone(); }

	const summary = $derived(summarize(record.turns));
	const tipText = $derived({
		topic: T('Listen to the question and answer it directly first. Then add more.', 'به سؤال گوش بده و اول مستقیم جوابش را بده. بعد بیشتر بگو.'),
		reason: T('Next time, after your answer, add a reason: “…, because…”.', 'دفعهٔ بعد بعد از جوابت یک دلیل هم بگو: «…, because…».'),
		longer: T('Try to say two or three sentences, not just one.', 'سعی کن دو سه جمله بگویی، نه فقط یکی.'),
		start: T('Try to start straight away, even with “Well, …” while you think.', 'سعی کن فوراً شروع کنی، حتی با «Well, …» وقتی فکر می‌کنی.'),
		great: T('Quick starts and full answers. That’s a natural chat.', 'شروع‌های سریع و جواب‌های کامل. این یعنی یک گپ طبیعی.')
	}[summary.tip]);
	const parts = (text: string) => text.split(/(\[[^\]]*\])/).filter(Boolean).map(p => (p.startsWith('[') ? { text: p.slice(1, -1), added: true } : { text: p, added: false }));
	// A few seconds after the chat ends, a reply that hasn't come won't come.
	let waiting = $state(true);
	$effect(() => { if (stage === 'result') { const t = setTimeout(() => (waiting = false), 8000); return () => clearTimeout(t); } });
	const remaining = $derived(Math.max(0, Math.ceil(ANSWER_MAX_SECONDS - elapsed)));
</script>

{#snippet bottom(label: string, action: () => void, disabled = false)}
	<div class="bar"><button class="primary" type="button" onclick={action} {disabled}>{label}</button></div>
{/snippet}

<section class="qf">
	<h2 class="sr-only" tabindex="-1" bind:this={heading}>{T('Quick-fire questions', 'سؤال‌های سریع')}</h2>

	{#if stage === 'ready'}
		<div class="brief"><span class="avatar" aria-hidden="true">M</span><p>{isFa ? INTRO.fa : INTRO.en}</p></div>
		{@render bottom(resuming ? T('Continue the chat', 'ادامهٔ گپ') : T('Start', 'شروع'), start)}

	{:else if stage === 'chat'}
		<p class="label">{T(`Question ${number} of ${QUESTIONS_PER_ROUND}`, `سؤال ${fa(number)} از ${fa(QUESTIONS_PER_ROUND)}`)}</p>
		<div class="dots" aria-hidden="true">{#each Array(QUESTIONS_PER_ROUND) as _, i}<span class:done={i < number - 1} class:now={i === number - 1}></span>{/each}</div>
		<p class="question" lang="en" dir="ltr">{current.question}</p>
		{#if notice && (status === 'asking' || status === 'recording')}<p class="note offtopic" role="status">{notice}</p>{/if}

		{#if status === 'asking'}
			<p class="hint">{T('Mira is asking…', 'میرا دارد می‌پرسد…')}</p>
		{:else if status === 'recording'}
			<p class="rec"><span class="dot" aria-hidden="true"></span>{T('Your turn: answer now', 'نوبت توست: همین حالا جواب بده')} <span class="left" aria-hidden="true">{remaining}</span></p>
			{@render bottom(T('Done', 'تمام'), stopNow)}
		{:else if status === 'listening' || status === 'thinking'}
			{#if lastHeard}<p class="heard" lang="en" dir="ltr">“{lastHeard}”</p>{/if}
			<p class="hint" role="status">{status === 'listening' ? T('Mira is listening…', 'میرا دارد گوش می‌دهد…') : T('Mira is thinking of a question…', 'میرا دارد به یک سؤال فکر می‌کند…')}</p>
		{:else if status === 'missed'}
			<p class="note">{T('I didn’t hear an answer.', 'جوابی نشنیدم.')}</p>
			<button class="link quiet" type="button" onclick={skip}>{T('Skip this question', 'از این سؤال بگذر')}</button>
			{@render bottom(T('Try again', 'دوباره امتحان کن'), tryAgain)}
		{:else if status === 'failed'}
			<p class="note">{T('I couldn’t hear that clearly. Check your connection.', 'نتوانستم واضح بشنوم. اینترنت را بررسی کن.')}</p>
			<button class="link quiet" type="button" onclick={skip}>{T('Skip this question', 'از این سؤال بگذر')}</button>
			{@render bottom(T('Try again', 'دوباره امتحان کن'), send)}
		{:else if status === 'denied'}
			<p class="note">{T('Mira can’t hear you: the microphone is blocked. Allow it in your browser’s site settings, then try again.', 'میرا صدایت را نمی‌شنود: میکروفون بسته است. در تنظیمات سایت اجازه‌اش را بده و دوباره امتحان کن.')}</p>
			{@render bottom(T('Try again', 'دوباره امتحان کن'), start)}
		{/if}

	{:else}
		<p class="label">{T('Your chat', 'گپ تو')}</p>
		<ul class="stats">
			<li><span class="big">{isFa ? fa(summary.quick) : summary.quick}/{isFa ? fa(record.turns.length) : record.turns.length}</span>{T('quick starts (within 3 seconds)', 'شروع سریع (زیر ۳ ثانیه)')}</li>
			<li><span class="big">{isFa ? fa(summary.reasons) : summary.reasons}/{isFa ? fa(record.turns.length) : record.turns.length}</span>{T('answers with a reason or example', 'جواب با دلیل یا مثال')}</li>
		</ul>
		<p class="tip">{tipText}</p>
		<ol class="turns">
			{#each record.turns as turn}
				<li>
					<p class="q" lang="en" dir="ltr">{turn.question}</p>
					{#if turn.answer}
						<p class="you" lang="en" dir="ltr"><span class="who">{T('You said', 'گفتی')}</span>{turn.answer}
							{#if turn.offTopic}<small class="off">{T('didn’t answer the question', 'جواب سؤال نبود')}</small>{:else}{#if gaveReason(turn.answer)}<small class="ok">✓ {T('reason', 'دلیل')}</small>{/if}{#if !isExtended(turn.answer)}<small>{T('short', 'کوتاه')}</small>{/if}{/if}</p>
						{#if turn.fixed}
							{#if sameAnswer(turn.fixed, turn.answer)}<p class="nofix">✓ {T('No mistakes', 'بدون اشتباه')}</p>
							{:else}<p class="fixed" lang="en" dir="ltr"><span class="who">{T('Corrected', 'درست‌شده')}</span>{#each changedParts(turn.answer, turn.fixed) as part, i}{i ? ' ' : ''}{#if part.changed}<strong>{part.text}</strong>{:else}{part.text}{/if}{/each}</p>{/if}
						{/if}
						{#if turn.better}<p class="better" lang="en" dir="ltr"><span class="who">{turn.offTopic ? T('An answer to this question', 'یک جواب برای این سؤال') : T('A fuller answer', 'یک جواب کامل‌تر')}</span>{#each parts(turn.better) as part}{#if part.added}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}</p>{/if}
						{#if !turn.fixed && !turn.better}<p class="hint">{waiting ? T('Mira is still checking this answer…', 'میرا هنوز دارد این جواب را بررسی می‌کند…') : T('No feedback for this answer: Mira didn’t reply in time.', 'برای این جواب بازخوردی نیامد: میرا به‌موقع جواب نداد.')}</p>{/if}
					{:else}<p class="you">{T('No answer', 'بدون جواب')}</p>{/if}
				</li>
			{/each}
		</ol>
		<p class="hint">{T('Bold: what was corrected. Highlighted: something you could add.', 'پررنگ: چیزی که درست شد. رنگی: چیزی که می‌توانستی اضافه کنی.')}</p>
		<button class="link quiet" type="button" onclick={finish}>{T('Finish', 'تمام')}</button>
		{@render bottom(T('Another round', 'یک دور دیگر'), anotherRound)}
	{/if}
</section>

<style>
	.qf { display: grid; gap: 14px; padding-bottom: 104px; }
	.brief { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.brief p { margin: 0; line-height: 1.55; }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.label { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .label { letter-spacing: normal; }
	.dots { display: flex; gap: 6px; }
	.dots span { flex: 1; block-size: 6px; border-radius: 3px; background: var(--paper-sunken); }
	.dots span.done { background: var(--leaf); }
	.dots span.now { background: var(--accent); }
	.question { margin: 6px 0 0; font-family: var(--font-display); font-size: clamp(1.5rem, 6.6vw, 2rem); line-height: 1.3; text-align: left; }
	.rec { display: flex; align-items: center; gap: 8px; margin: 0; font-weight: 700; color: var(--attention); }
	.rec .left { margin-inline-start: auto; color: var(--ink-soft); font-variant-numeric: tabular-nums; }
	.dot { inline-size: 12px; block-size: 12px; border-radius: 50%; background: currentColor; animation: pulse 1.2s infinite ease-in-out; }
	@keyframes pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
	.heard { margin: 0; padding: 10px 14px; border-radius: 12px; background: var(--paper-sunken); color: var(--ink-soft); line-height: 1.5; text-align: left; }
	.stats { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
	.stats li { display: grid; gap: 4px; justify-items: center; padding: 14px 8px; border-radius: 14px; background: var(--paper-raised); border: 1px solid var(--line); text-align: center; color: var(--ink-soft); font-size: .88rem; }
	.big { font-family: var(--font-display); font-size: 2.2rem; color: var(--accent-deep); }
	.tip { margin: 0; font-weight: 600; color: var(--accent-deep); line-height: 1.5; }
	.turns { margin: 0; padding: 0; list-style: none; display: grid; gap: 14px; }
	.turns li { display: grid; gap: 6px; }
	.q { margin: 0; font-weight: 700; text-align: left; }
	.you, .better { margin: 0; padding: 10px 14px; border-radius: 12px; line-height: 1.55; text-align: left; }
	.you { background: var(--paper-sunken); }
	.better { background: var(--paper-raised); border: 1px solid var(--accent); }
	.fixed { margin: 0; padding: 10px 14px; border-radius: 12px; line-height: 1.55; text-align: left; background: var(--paper-raised); border: 1px solid var(--line); }
	.fixed strong { color: var(--leaf); }
	.nofix { margin: 0; font-size: .88rem; font-weight: 700; color: var(--leaf); }
	.you small.off { color: var(--attention); }
	.offtopic { color: var(--attention); font-weight: 600; }
	.who { display: block; font-size: .72rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--ink-soft); }
	:global([dir='rtl']) .who { letter-spacing: normal; }
	.you small { margin-inline-start: 8px; font-size: .75rem; font-weight: 700; color: var(--ink-soft); }
	.you small.ok { color: var(--leaf); }
	mark { background: color-mix(in srgb, var(--attention) 20%, transparent); color: inherit; border-radius: 4px; padding: 0 2px; }
	.note { margin: 0; line-height: 1.5; }
	.hint { margin: 0; color: var(--ink-soft); line-height: 1.5; }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.link.quiet { color: var(--ink-soft); }
	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 20; padding: 12px 20px calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 35%); }
	.primary { display: flex; align-items: center; justify-content: center; inline-size: 100%; max-inline-size: 680px; margin-inline: auto; min-height: 54px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	h2:focus { outline: none; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	@media (prefers-reduced-motion: reduce) { .dot { animation: none; } }
</style>
