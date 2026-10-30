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
	 *   correctly (the changes in bold), and a fuller answer; "Say it again" for the corrected sentence
	 *   (or, with no mistakes, the fuller answer); then "Next question".
	 * - The end: "That's it", and every answer with its corrections.
	 * Recordings are sent once to be turned into text and never kept.
	 */
	import { onDestroy, onMount } from 'svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import SayAgain from '$lib/components/SayAgain.svelte';
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
	/** How long they spoke, short: "45 s", "2 min". */
	const spoke = $derived(record.talkSeconds < 60 ? T(`${Math.max(5, Math.round(record.talkSeconds / 5) * 5)} s`, `${N(Math.max(5, Math.round(record.talkSeconds / 5) * 5))} ثانیه`)
		: T(`${Math.round(record.talkSeconds / 60)} min`, `${N(Math.round(record.talkSeconds / 60))} دقیقه`));
	function finish() { stopAllAudio(); onDone({ correct: answeredCount, total: TOTAL }, $state.snapshot(record)); }
</script>

<!-- Icons for the cards: each kind of card has its own colour and icon, so it reads without its label. -->
{#snippet icon(kind: 'you' | 'fix' | 'ok' | 'more')}
	<span class="icon {kind}" aria-hidden="true">
		{#if kind === 'you'}<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-7 2-7 4.5V20h14v-1.5C19 16 16 14 12 14Z" fill="currentColor"/></svg>
		{:else if kind === 'fix' || kind === 'ok'}<svg viewBox="0 0 24 24" width="18" height="18"><path d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7z" fill="currentColor"/></svg>
		{:else}<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18.5l-2.2-6.3L3.5 10l6.3-1.7zM19 15l1 2.6 2.6 1-2.6 1L19 22l-1-2.4-2.6-1 2.6-1z" fill="currentColor"/></svg>{/if}
	</span>
{/snippet}

<!-- One answer as cards: what they said (mistakes marked red), the correct way (changes green), and a fuller answer.
     `practise`: the answer's own screen, where they say the better sentence again (not the end's list). -->
{#snippet feedback(turn: { answer: string | null; fixed: string | null; better: string | null; offTopic: boolean }, practise = false)}
	<div class="cards">
		<article class="card you-card">
			<header>{@render icon('you')}<span class="tag">{T('You said', 'تو گفتی')}</span></header>
			<p class="text" lang="en" dir="ltr">{#if hasFix(turn)}{#each changedParts(turn.fixed ?? '', turn.answer ?? '') as part, i}{i ? ' ' : ''}{#if part.changed}<mark class="wrong">{part.text}</mark>{:else}{part.text}{/if}{/each}{:else}{turn.answer}{/if}</p>
		</article>
		{#if hasFix(turn)}
			<article class="card fix-card">
				<header>{@render icon('fix')}<span class="tag">{T('Correct way', 'شکل درست')}</span></header>
				<p class="text" lang="en" dir="ltr">{#each changedParts(turn.answer ?? '', turn.fixed ?? '') as part, i}{i ? ' ' : ''}{#if part.changed}<mark class="right">{part.text}</mark>{:else}{part.text}{/if}{/each}</p>
				{#if practise}<div class="card-actions"><SayAgain sentence={turn.fixed ?? ''} {isFa} /></div>{/if}
			</article>
		{:else if turn.fixed}
			<article class="card ok-card">
				<header>{@render icon('ok')}<span class="tag">{T('No mistakes', 'بدون اشتباه')}</span></header>
			</article>
		{/if}
		{#if turn.better}
			<article class="card more-card">
				<header>{@render icon('more')}<span class="tag">{turn.offTopic ? T('You could say', 'می‌توانستی بگویی') : T('Say more', 'کامل‌تر بگو')}</span></header>
				<p class="text serif" lang="en" dir="ltr">{plain(turn.better)}</p>
				<div class="card-actions">
					{#if practise && !hasFix(turn)}<SayAgain sentence={plain(turn.better)} {isFa} />
					{:else}<button type="button" class="hear" onclick={() => { stopAllAudio(); void say(plain(turn.better ?? '')); }}><span aria-hidden="true">▶</span> {T('Hear it', 'بشنو')}</button>{/if}
				</div>
			</article>
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
			<div class="asked"><span class="mira" aria-hidden="true">M</span><p lang="en" dir="ltr"><span class="sr-only">{T('Mira asked: ', 'میرا پرسید: ')}</span>{current.question}</p></div>
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
			{@render feedback(current, true)}
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
		<div class="stats">
			<div class="stat"><span class="stat-value">{N(answeredCount)}/{N(TOTAL)}</span><span class="stat-label">{T('answered', 'جواب دادی')}</span></div>
			{#if record.talkSeconds > 0}<div class="stat"><span class="stat-value">{spoke}</span><span class="stat-label">{T('you spoke', 'صحبت کردی')}</span></div>{/if}
			<div class="stat" class:warn={fixes > 0}><span class="stat-value">{N(fixes)}</span><span class="stat-label">{T('to fix', 'برای درست کردن')}</span></div>
		</div>
		<ol class="turns">
			{#each record.turns as turn, i}
				<li class="turn">
					<div class="asked"><span class="num" aria-hidden="true">{N(i + 1)}</span><p lang="en" dir="ltr"><span class="sr-only">{T(`Question ${i + 1}: `, `سؤال ${i + 1}: `)}</span>{turn.question}</p></div>
					{#if turn.answer}{@render feedback(turn)}{:else}<p class="hint">{T('No answer', 'بدون جواب')}</p>{/if}
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
	/* Mira's question: a bubble with her avatar. */
	.asked { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: start; }
	.asked p { margin: 0; padding: 10px 14px; border-radius: 4px 16px 16px 16px; background: var(--paper-raised); border: 1px solid var(--line); font-family: var(--font-display); font-size: 1.12rem; line-height: 1.4; text-align: left; }
	.mira, .num { display: grid; place-items: center; inline-size: 34px; block-size: 34px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.num { background: var(--ink); color: var(--paper); font-family: var(--font-body); font-size: .9rem; }

	/* The answer's cards: each kind its own colour, stripe and icon. */
	.cards { display: grid; gap: 12px; }
	.card { display: grid; gap: 8px; padding: 12px 14px 14px; border-radius: var(--radius-card, 18px); background: var(--paper-raised); border: 1px solid var(--line); border-inline-start: 5px solid var(--stripe); box-shadow: var(--paper-shadow); }
	.card header { display: flex; align-items: center; gap: 8px; }
	.tag { font-size: .78rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--stripe-ink); }
	:global([dir='rtl']) .tag { letter-spacing: normal; }
	.icon { display: grid; place-items: center; inline-size: 28px; block-size: 28px; border-radius: 50%; background: var(--stripe); color: #fff; flex: none; }
	.text { margin: 0; font-size: 1.06rem; line-height: 1.6; text-align: left; color: var(--ink); }
	.serif { font-family: var(--font-display); font-size: 1.14rem; font-style: italic; }
	.you-card { --stripe: var(--ink-faint); --stripe-ink: var(--ink-soft); background: var(--paper-sunken); box-shadow: none; }
	.fix-card { --stripe: var(--leaf); --stripe-ink: var(--leaf-deep); background: linear-gradient(var(--leaf-wash), var(--leaf-wash)), var(--paper-raised); }
	.ok-card { --stripe: var(--leaf); --stripe-ink: var(--leaf-deep); background: linear-gradient(var(--leaf-wash), var(--leaf-wash)), var(--paper-raised); }
	.more-card { --stripe: var(--info); --stripe-ink: var(--info); background: linear-gradient(var(--info-wash), var(--info-wash)), var(--paper-raised); }
	mark { padding: 0 3px; border-radius: 4px; color: inherit; }
	mark.wrong { background: color-mix(in srgb, var(--miss) 16%, transparent); text-decoration: line-through 2px var(--miss); }
	mark.right { background: color-mix(in srgb, var(--leaf) 22%, transparent); font-weight: 700; color: var(--leaf-deep); }
	.card-actions { display: flex; flex-wrap: wrap; gap: 8px; }
	.hear { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 8px 16px; border: 1.5px solid var(--info); border-radius: 999px; background: var(--paper-raised); color: var(--info); font: inherit; font-weight: 700; cursor: pointer; }
	.hear:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }

	/* The end: three tiles, then each question with its cards. */
	.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 10px; }
	.stat { display: grid; gap: 2px; padding: 12px; border-radius: 14px; background: var(--paper-raised); border: 1px solid var(--line); box-shadow: var(--paper-shadow); text-align: center; }
	.stat-value { font-family: var(--font-display); font-size: 1.6rem; font-weight: 600; color: var(--accent-deep); }
	.stat.warn .stat-value { color: var(--attention); }
	.stat-label { font-size: .8rem; color: var(--ink-soft); }
	.turns { margin: 0; padding: 0; list-style: none; display: grid; gap: 26px; }
	.turn { display: grid; gap: 12px; }
	button:focus-visible, textarea:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
</style>
