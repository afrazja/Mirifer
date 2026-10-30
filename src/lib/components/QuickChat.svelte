<script lang="ts">
	/**
	 * A topic step on the path: a Quick chat about the learner's own life (topics.ts,
	 * docs/english-topic-steps.md; built from the learning-UX review). One thing per screen:
	 * - Start: Mira's note is above (StepRunner); one button, "Start the chat" (it asks for the mic).
	 * - The chat: Mira asks; the question and (Intermediate) idea chips show. Intermediate taps to
	 *   answer (calm timings, "Hear again"); Professional's recording starts by itself. The answer ends
	 *   after a short quiet. "Can't talk now? Type" is always there; a blocked mic switches to typing.
	 *   The next question follows from the answer (AI, the topic and level in the prompt), or is a
	 *   ready-made one. An answer that doesn't fit is asked again once.
	 * - After each answer (owner's phone test): its feedback on its own screen: what they said, said
	 *   correctly (the changes in bold), and a fuller answer; then "Next question".
	 * - The end: "That's it", and every answer with its corrections.
	 * Recordings are sent once to be turned into text and never kept.
	 */
	import { onDestroy, onMount } from 'svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { changedParts, emptyQuickFire, fallbackQuestion, newTurn, sameAnswer, type Opener, type QuickChatRecord } from '$lib/practice/quick-fire';
	import { chatQuestions, topicOpeners, type Topic, type TopicLevelId } from '$lib/practice/topics';
	import type { DisplayText } from '$lib/practice/hotel';
	import { playAudioPromise, stopAllAudio } from '$services/tts';
	import { canRecord, startRecording, transcribeClip, type Recording } from '$services/voice-clip';

	let { isFa = false, topic, level, initial = null, onSave, onFocus, onSkip, onDone }: {
		isFa?: boolean;
		topic: Topic;
		level: TopicLevelId;
		initial?: QuickChatRecord | null;
		onSave?: (record: QuickChatRecord) => void;
		onFocus?: (mode: 'full' | 'compact' | 'hidden') => void;
		onSkip?: () => void;
		/** Questions answered, out of all. */
		onDone: (score: { correct: number; total: number }, record: QuickChatRecord) => void;
	} = $props();

	const T = (en: string, fa: string) => (isFa ? fa : en);
	const N = (n: number) => (isFa ? n.toLocaleString('fa-IR') : String(n));
	const text = (value: DisplayText) => (isFa ? value.fa : value.en);
	// svelte-ignore state_referenced_locally
	const LEVEL = topic[level], CALM = level === 'a2', TOTAL = chatQuestions(level);
	// svelte-ignore state_referenced_locally
	const OPENERS: Opener[] = topicOpeners(topic, level);
	/** Intermediate: calm timings (docs/speaking-first.md rule 5); Professional: the lab's pace. */
	const TIMINGS = CALM ? { quietStop: 4, noSpeechStop: 12 } : { quietStop: 2.5, noSpeechStop: 8 };
	const AGAIN = 'Hmm, I think that answers a different question. Here it is again.';

	// svelte-ignore state_referenced_locally
	let record = $state<QuickChatRecord>(initial ?? { ...emptyQuickFire(0, OPENERS), talkSeconds: 0, reviewed: false });
	// svelte-ignore state_referenced_locally
	let stage = $state<'ready' | 'chat' | 'end'>(initial?.done ? 'end' : 'ready');
	type Status = 'asking' | 'answer' | 'recording' | 'listening' | 'thinking' | 'feedback' | 'missed' | 'failed';
	/** The next question, once the AI has written it (null: a ready-made one). */
	let upcoming: string | null = null;
	/** How long the feedback can take before the answer's screen shows without it. */
	const FEEDBACK_WAIT_MS = 12_000;
	let status = $state<Status>('asking');
	let typing = $state(false), draft = $state(''), notice = $state<DisplayText | null>(null);
	let recording: Recording | null = null;
	let alive = true, generation = 0;
	const current = $derived(record.turns[record.turns.length - 1]);
	const number = $derived(record.turns.length);

	onMount(() => { if (stage !== 'ready') onFocus?.('hidden'); });
	onDestroy(() => { alive = false; generation++; recording?.cancel(); stopAllAudio(); });
	function persist() { if (alive) onSave?.($state.snapshot(record)); }
	const say = (line: string) => playAudioPromise(line.replace(/’/g, "'"), COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {});

	/** The Start tap: the mic's permission is asked here (phones need a tap), then the first question. */
	async function start() {
		stopAllAudio(); onFocus?.('hidden');
		if (!canRecord()) typing = true;
		else {
			try { (await navigator.mediaDevices.getUserMedia({ audio: true })).getTracks().forEach(track => track.stop()); }
			catch { typing = true; notice = { en: 'Your microphone is blocked, so type your answers for now. (Allow it in site settings to speak.)', fa: 'میکروفون بسته است؛ فعلاً جواب‌هایت را بنویس. (برای صحبت کردن، در تنظیمات سایت اجازه بده.)' }; }
		}
		stage = 'chat';
		if (current.answer !== null) void next(); else void ask();
	}

	/** Mira asks; then Intermediate taps to answer, Professional's recording starts by itself. */
	async function ask(keepNotice = false) {
		const mine = ++generation;
		status = 'asking'; if (!keepNotice) notice = null;
		await say(current.question);
		if (!alive || mine !== generation || stage !== 'chat') return;
		if (typing || CALM) { status = 'answer'; return; }
		void answer();
	}
	function hearAgain() { recording?.cancel(); void ask(true); }

	async function answer() {
		if (status === 'recording') { recording?.stop(); return; }
		stopAllAudio(); notice = null;
		const started = await startRecording('quick-chat', TIMINGS);
		if (!alive) { if (typeof started === 'object') started.cancel(); return; }
		if (started === 'unsupported' || started === 'blocked') {
			typing = true; status = 'answer';
			notice = { en: 'Your microphone isn’t available, so type your answer.', fa: 'میکروفون در دسترس نیست؛ جوابت را بنویس.' };
			return;
		}
		recording = started; status = 'recording';
		const clip = await started.done;
		recording = null;
		if (!alive || stage !== 'chat') return;
		if (clip === null) { status = 'answer'; return; }
		if (clip === 'silent') { status = 'missed'; return; }
		status = 'listening';
		const result = await transcribeClip(clip, 'quick-chat');
		if (!alive || stage !== 'chat') return;
		if ('error' in result || !result.transcript.trim()) {
			if ('error' in result && result.error !== 'failed') {
				typing = true; status = 'answer';
				notice = result.error === 'limit' ? { en: 'Today’s voice practice is used up. Type your answer instead.', fa: 'تمرین صوتی امروز تمام شد. جوابت را بنویس.' } : { en: 'Speaking isn’t available right now. Type your answer instead.', fa: 'صحبت کردن الان در دسترس نیست. جوابت را بنویس.' };
			} else status = 'failed';
			return;
		}
		record = { ...record, talkSeconds: record.talkSeconds + clip.seconds };
		await answered(result.transcript.trim().slice(0, 1_500));
	}
	function sendTyped() {
		const words = draft.replace(/\s+/g, ' ').trim();
		if (!words || status === 'thinking') return;
		draft = '';
		void answered(words.slice(0, 1_500));
	}

	async function answered(words: string) {
		const turns = [...record.turns];
		turns[turns.length - 1] = { ...turns[turns.length - 1], answer: words, fixed: null, better: null, offTopic: false, startMs: null };
		record = { ...record, turns }; persist();
		await next();
	}

	/** One small AI call: does the answer fit, the next question (or a ready-made one), and this answer corrected and said better. */
	async function next() {
		status = 'thinking';
		const mine = ++generation;
		const index = record.turns.length - 1, last = record.turns.length >= TOTAL;
		const answer = record.turns[index].answer;
		const done = record.turns.filter(t => t.answer).map(t => ({ question: t.question, answer: t.answer! }));
		const call = fetch('/api/english/quick-fire', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
			kind: 'turn', mode: 'path', topic: topic.id, level, turns: done, asked: record.turns.map(t => t.question), last
		}) }).then(r => (r.ok ? r.json() : null)).catch(() => null) as Promise<{ onTopic: boolean; next: string | null; fixed: string | null; better: string | null } | null>;
		upcoming = null;
		// Whenever it comes, the feedback is kept (a late one still shows on the answer's screen and at the end).
		void call.then(reply => {
			const turn = record.turns[index];
			if (!alive || !reply || !turn || turn.answer !== answer) return;
			if (mine === generation) upcoming = reply.next;
			const turns = [...record.turns];
			turns[index] = { ...turn, fixed: reply.fixed ?? turn.fixed, better: reply.better ?? turn.better, offTopic: reply.onTopic === false };
			record = { ...record, turns }; persist();
		});
		const reply = await Promise.race([call, new Promise<null>(resolve => setTimeout(() => resolve(null), FEEDBACK_WAIT_MS))]);
		if (!alive || mine !== generation || stage !== 'chat') return;
		// Not an answer to the question: asked again once.
		if (reply?.onTopic === false && !record.turns[index].retried) {
			const turns = [...record.turns]; turns[index] = { ...turns[index], retried: true };
			record = { ...record, turns }; persist();
			notice = { en: 'I think that answers a different question. Here it is again.', fa: 'فکر کنم جواب یک سؤال دیگر را دادی. دوباره گوش بده.' };
			await say(AGAIN);
			if (alive && stage === 'chat') void ask(true);
			return;
		}
		// The answer's own screen: what they said, corrected, and a fuller answer.
		upcoming = reply?.next ?? upcoming;
		status = 'feedback';
	}
	/** "Next question" (or, after the last one, the end). */
	function goOn() {
		stopAllAudio();
		if (record.turns.length >= TOTAL) { finishChat(); return; }
		const question = upcoming ?? fallbackQuestion(record.opener, record.turns.map(t => t.question), OPENERS);
		upcoming = null;
		record = { ...record, turns: [...record.turns, newTurn(question)] }; persist();
		void ask();
	}
	function skipQuestion() {
		if (record.turns.length >= TOTAL) { finishChat(); return; }
		record = { ...record, turns: [...record.turns, newTurn(fallbackQuestion(record.opener, record.turns.map(t => t.question), OPENERS))] }; persist();
		void ask();
	}
	function finishChat() {
		recording?.cancel(); stopAllAudio();
		record = { ...record, done: true, reviewed: true }; persist();
		stage = 'end';
		void say('That’s it. Nice chat!');
	}

	const plain = (better: string) => better.replace(/\[([^\]]*)\]/g, '$1').replace(/\s+/g, ' ').trim();
	const hasFix = (turn: { answer: string | null; fixed: string | null }) => !!turn.answer && !!turn.fixed && !sameAnswer(turn.fixed, turn.answer);
	const fixes = $derived(record.turns.filter(hasFix).length);

	const answeredCount = $derived(record.turns.filter(t => t.answer).length);
	const talk = $derived(record.talkSeconds < 50 ? T(`You spoke for about ${Math.max(5, Math.round(record.talkSeconds / 5) * 5)} seconds.`, `حدود ${N(Math.max(5, Math.round(record.talkSeconds / 5) * 5))} ثانیه صحبت کردی.`)
		: T(`You spoke for about ${Math.round(record.talkSeconds / 60) || 1} minute${Math.round(record.talkSeconds / 60) > 1 ? 's' : ''}.`, `حدود ${N(Math.round(record.talkSeconds / 60) || 1)} دقیقه صحبت کردی.`));
	function finish() { stopAllAudio(); onDone({ correct: answeredCount, total: TOTAL }, $state.snapshot(record)); }
</script>

{#snippet feedback(turn: { answer: string | null; fixed: string | null; better: string | null; offTopic: boolean })}
	<div class="feedback">
		<p class="said" lang="en" dir="ltr"><span class="who">{T('You said', 'گفتی')}</span>{turn.answer}</p>
		{#if hasFix(turn)}
			<p class="better" lang="en" dir="ltr"><span class="who">{T('Say it like this', 'این‌طور بگو')}</span>{#each changedParts(turn.answer ?? '', turn.fixed ?? '') as part, i}{i ? ' ' : ''}{#if part.changed}<strong>{part.text}</strong>{:else}{part.text}{/if}{/each}</p>
		{:else if turn.fixed}
			<p class="good">{T('No mistakes ✓', 'بدون اشتباه ✓')}</p>
		{/if}
		{#if turn.better}
			<p class="fuller" lang="en" dir="ltr"><span class="who">{turn.offTopic ? T('You could answer', 'می‌توانستی بگویی') : T('A fuller answer', 'یک جواب کامل‌تر')}</span>{plain(turn.better)}</p>
			<button type="button" class="quiet" onclick={() => { stopAllAudio(); void say(plain(turn.better ?? '')); }}><span aria-hidden="true">🔊</span> {T('Hear it', 'بشنو')}</button>
		{/if}
		{#if !turn.fixed && !turn.better}
			<p class="hint">{T('I couldn’t check this answer. Let’s keep going.', 'نتوانستم این جواب را بررسی کنم. ادامه بدهیم.')}</p>
		{/if}
	</div>
{/snippet}

<section class="chat" dir={isFa ? 'rtl' : 'ltr'}>
	{#if stage === 'ready'}
		<ActionBar label={record.turns[0].answer ? T('Continue the chat', 'ادامهٔ گپ') : T('Start the chat', 'شروع گپ')} icon="mic" onclick={() => void start()}
			secondary={onSkip ? { label: T('Skip this step', 'این مرحله را رد کن'), onclick: () => { stopAllAudio(); onSkip?.(); } } : null} />

	{:else if stage === 'chat'}
		<p class="label">{T(`Question ${number} of ${TOTAL}`, `سؤال ${N(number)} از ${N(TOTAL)}`)}</p>
		<div class="dots" aria-hidden="true">{#each Array(TOTAL) as _, i}<span class:done={i < number - 1} class:now={i === number - 1}></span>{/each}</div>
		{#if status === 'feedback'}
			<p class="small" lang="en" dir="ltr">{current.question}</p>
		{:else}
		<p class="question" lang="en" dir="ltr">{current.question}</p>
		{/if}
		{#if CALM && number === 1 && status !== 'feedback' && LEVEL.ideas?.length}
			<ul class="ideas" aria-label={T('Some ideas', 'چند ایده')}>{#each LEVEL.ideas as idea}<li><span lang="en" dir="ltr">{idea.en}</span><small lang="fa" dir="rtl">{idea.fa}</small></li>{/each}</ul>
		{/if}
		{#if notice}<p class="note" role="status">{text(notice)}</p>{/if}
		{#if status !== 'recording' && status !== 'listening' && status !== 'thinking' && status !== 'feedback'}
			<button type="button" class="quiet" onclick={hearAgain}><span aria-hidden="true">🔊</span> {T('Hear again', 'دوباره بشنو')}</button>
		{/if}

		{#if typing && (status === 'answer' || status === 'asking')}
			<label class="sr-only" for="chat-answer">{T('Your answer in English', 'جوابت به انگلیسی')}</label>
			<textarea id="chat-answer" bind:value={draft} lang="en" dir="ltr" rows="3" maxlength="600" placeholder={T('Type your answer…', 'جوابت را بنویس…')}
				onkeydown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); sendTyped(); } }}></textarea>
			<ActionBar label={T('Send', 'ارسال')} icon="send" disabled={!draft.trim()} onclick={sendTyped}
				secondary={canRecord() ? { label: T('Use the mic', 'با میکروفون بگو'), onclick: () => { typing = false; notice = null; status = 'answer'; } } : null} />
		{:else if status === 'asking'}
			<p class="hint" role="status">{T('Mira is asking…', 'میرا دارد می‌پرسد…')}</p>
			<ActionBar label={T('Answer', 'جواب بده')} icon="mic" disabled onclick={() => {}} secondary={{ label: T('Can’t talk now? Type', 'الان نمی‌توانی حرف بزنی؟ بنویس'), onclick: () => { typing = true; status = 'answer'; } }} />
		{:else if status === 'answer'}
			<ActionBar label={T('Answer', 'جواب بده')} icon="mic" onclick={() => void answer()} secondary={{ label: T('Can’t talk now? Type', 'الان نمی‌توانی حرف بزنی؟ بنویس'), onclick: () => { typing = true; } }} />
		{:else if status === 'recording'}
			<p class="rec" role="status"><span class="dot" aria-hidden="true"></span>{CALM ? T('Your turn', 'نوبت توست') : T('Your turn: answer now', 'نوبت توست: جواب بده')}</p>
			<ActionBar label={T('Done', 'تمام')} icon="stop" recording onclick={() => recording?.stop()} />
		{:else if status === 'feedback'}
			{@render feedback(current)}
			<ActionBar label={number >= TOTAL ? T('See how you did', 'نتیجه را ببین') : T('Next question', 'سؤال بعدی')} onclick={goOn} />
		{:else if status === 'listening' || status === 'thinking'}
			<p class="hint" role="status">{status === 'listening' ? T('Mira is listening…', 'میرا دارد گوش می‌دهد…') : T('Mira is checking your answer…', 'میرا دارد جوابت را بررسی می‌کند…')}</p>
			<ActionBar label={T('One moment…', 'یک لحظه…')} disabled onclick={() => {}} />
		{:else if status === 'missed' || status === 'failed'}
			<p class="note" role="status">{status === 'missed' ? T('I didn’t hear an answer.', 'جوابی نشنیدم.') : T('I couldn’t catch that. Check your connection.', 'متوجه نشدم. اینترنت را بررسی کن.')}</p>
			<ActionBar label={T('Try again', 'دوباره امتحان کن')} icon="mic" onclick={() => void answer()} secondary={{ label: T('Skip this question', 'از این سؤال بگذر'), onclick: skipQuestion }} />
		{/if}

	{:else}
		<h2 class="title">{T('That’s it.', 'تمام شد.')}</h2>
		<p class="lead">{T(`You answered ${answeredCount} of ${TOTAL} questions.`, `به ${N(answeredCount)} سؤال از ${N(TOTAL)} جواب دادی.`)}{record.talkSeconds > 0 ? ` ${talk}` : ''}</p>
		{#if fixes}<p class="small">{T(`${fixes} ${fixes === 1 ? 'answer has' : 'answers have'} something to fix. Here they all are.`, `${N(fixes)} جواب نکته‌ای برای درست کردن دارد. همه این‌جا هستند.`)}</p>{/if}
		<ol class="turns">
			{#each record.turns as turn, i}
				<li>
					<p class="q" lang="en" dir="ltr">{N(i + 1)}. {turn.question}</p>
					{#if turn.answer}{@render feedback(turn)}{:else}<p class="said">{T('No answer', 'بدون جواب')}</p>{/if}
				</li>
			{/each}
		</ol>
		<ActionBar label={T('Continue', 'ادامه')} onclick={finish} />
	{/if}
</section>

<style>
	.chat { display: grid; gap: 14px; padding-block-end: 140px; }
	.label { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .label { letter-spacing: normal; }
	.dots { display: flex; gap: 6px; }
	.dots span { flex: 1; block-size: 6px; border-radius: 3px; background: var(--paper-sunken); }
	.dots span.done { background: var(--leaf, var(--accent)); }
	.dots span.now { background: var(--accent); }
	.question { margin: 6px 0 0; font-family: var(--font-display); font-size: clamp(1.5rem, 6.6vw, 2rem); line-height: 1.3; text-align: left; }
	.ideas { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
	.ideas li { display: grid; padding: 6px 12px; border-radius: 12px; background: var(--paper-sunken); color: var(--ink); font-size: .92rem; text-align: center; }
	.ideas small { color: var(--ink-soft); font-size: .78rem; }
	.rec { display: flex; align-items: center; gap: 8px; margin: 0; font-weight: 700; color: var(--attention); }
	.dot { inline-size: 12px; block-size: 12px; border-radius: 50%; background: currentColor; animation: pulse 1.2s infinite ease-in-out; }
	@keyframes pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
	@media (prefers-reduced-motion: reduce) { .dot { animation: none; } }
	.hint, .small { margin: 0; color: var(--ink-soft); line-height: 1.5; }
	.note { margin: 0; padding: 10px 12px; border-radius: 10px; background: var(--attention-wash); color: var(--attention); line-height: 1.5; }
	.quiet { justify-self: start; min-height: 44px; padding: 8px 0; border: 0; background: none; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	textarea { inline-size: 100%; resize: vertical; min-height: 80px; padding: 10px 12px; border: 1px solid var(--control-border); border-radius: 10px; background: var(--paper); color: var(--ink); font: inherit; }
	.title { margin: 0; font-family: var(--font-display); font-size: 1.4rem; line-height: 1.3; }
	.lead { margin: 0; line-height: 1.6; }
	.said, .better { margin: 0; padding: 10px 14px; border-radius: 12px; line-height: 1.55; text-align: left; }
	.said { background: var(--paper-sunken); }
	.better { background: var(--paper-raised); border: 1px solid var(--accent); }
	.better strong { color: var(--accent-deep); }
	.fuller { margin: 0; padding: 10px 14px; border-radius: 12px; line-height: 1.55; text-align: left; background: var(--accent-wash); }
	.good { margin: 0; font-weight: 700; color: var(--leaf-deep, var(--accent-deep)); }
	.feedback { display: grid; gap: 10px; }
	.who { display: block; font-size: .72rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--ink-soft); }
	:global([dir='rtl']) .who { letter-spacing: normal; }
	.turns { margin: 0; padding: 0; list-style: none; display: grid; gap: 14px; }
	.turns li { display: grid; gap: 6px; }
	.q { margin: 0; font-weight: 700; text-align: left; }
	button:focus-visible, textarea:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
</style>
