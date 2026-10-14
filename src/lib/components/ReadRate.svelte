<script lang="ts">
	/**
	 * "Read, rate, respond", Module lab (docs/english-read-rate-spec.md, owner-approved).
	 * For each of three short texts: read it (tap a dotted word for Persian), rate it with one tap,
	 * then say a reply that uses facts from the text. After "I heard: …" the learner asks for
	 * feedback: one AI call checks the reply against the text. Recordings are never stored.
	 */
	import { onDestroy, onMount } from 'svelte';
	import { playAudioPromise, stopAllAudio } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { SILENT_BELOW, measureLevel, type MicLevel } from '$utils/mic-level';
	import {
		RESPOND_MAX_SECONDS, RESPOND_MIN_SECONDS, TEXTS, emptyReadRate, glossParts, summarize, type ReadRateRecord, type ReplyFeedback, type Step
	} from '$lib/practice/read-rate';

	let { isFa = false, initial = null, first = false, onSave, onDone }: {
		isFa?: boolean;
		initial?: ReadRateRecord | null;
		first?: boolean;
		onSave?: (record: ReadRateRecord) => void;
		onDone: () => void;
	} = $props();

	const INTRO = {
		en: 'You’ll read three short texts: a review, a message and an ad. For each one, give your opinion with one tap, then say a short reply. Use details from the text, and give a reason.',
		fa: 'سه متن کوتاه می‌خوانی: یک نظر دربارهٔ هتل، یک پیام و یک آگهی. برای هر کدام، با یک ضربه نظرت را بده، بعد یک جواب کوتاه بگو. از جزئیات خود متن استفاده کن و دلیل بیاور.'
	};

	type Status = 'idle' | 'recording' | 'listening' | 'checking' | 'silent' | 'short' | 'failed' | 'denied' | 'interrupted' | 'aiFailed';
	// svelte-ignore state_referenced_locally
	let record = $state<ReadRateRecord>(initial ?? emptyReadRate());
	let stage = $state<'start' | 'text' | 'result'>('start');
	let status = $state<Status>('idle'), elapsed = $state(0), shownGloss = $state<number | null>(null);
	let recorder: MediaRecorder | null = null, stream: MediaStream | null = null, chunks: Blob[] = [], level: MicLevel | null = null;
	let startedAt = 0, timer: ReturnType<typeof setInterval> | undefined, interrupted = false, lastBlob: Blob | null = null, lastSeconds = 0;
	let heading: HTMLElement | undefined = $state();
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const fa = (n: number) => n.toLocaleString('fa-IR');
	const index = $derived(Math.min(record.index, TEXTS.length - 1));
	const text = $derived(TEXTS[index]);
	const mine = $derived(record.texts[index]);

	onMount(() => {
		// A reload returns to the same text and step (a reply in progress is lost).
		if (record.done || record.index >= TEXTS.length) stage = 'result';
		else if (record.index > 0 || record.texts[0].step !== 'read') { stage = 'text'; if (record.texts[record.index].step === 'respond') status = 'idle'; }
		else if (first) void playAudioPromise(INTRO.en.replace(/’/g, "'"), COACH_RATE, 'en-US', undefined, COACH_VOICE);
		const onHidden = () => { if (document.hidden && recorder && recorder.state !== 'inactive') { interrupted = true; recorder.stop(); } };
		document.addEventListener('visibilitychange', onHidden);
		return () => document.removeEventListener('visibilitychange', onHidden);
	});
	onDestroy(() => { clearInterval(timer); if (recorder && recorder.state !== 'inactive') { interrupted = true; recorder.stop(); } closeMic(); });

	function persist() { onSave?.($state.snapshot(record)); }
	function closeMic() { level?.stop(); level = null; stream?.getTracks().forEach(t => t.stop()); stream = null; }
	function update(changes: Partial<ReadRateRecord['texts'][number]>) {
		const texts = [...record.texts]; texts[index] = { ...texts[index], ...changes };
		record = { ...record, texts }; persist();
	}
	function go(step: Step) { update({ step }); status = 'idle'; shownGloss = null; queueMicrotask(() => heading?.focus()); }

	function rate(value: number) { update({ rating: value }); }

	async function speak() {
		if (status === 'recording') { recorder?.stop(); return; }
		stopAllAudio();
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { status = 'denied'; return; }
		try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { status = 'denied'; return; }
		const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
		recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64_000 });
		chunks = []; interrupted = false;
		recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
		recorder.onstop = finishRecording;
		level = measureLevel(stream);
		recorder.start();
		startedAt = performance.now(); elapsed = 0; status = 'recording';
		timer = setInterval(() => {
			elapsed = Math.min(RESPOND_MAX_SECONDS, (performance.now() - startedAt) / 1000);
			if (elapsed >= RESPOND_MAX_SECONDS && recorder?.state === 'recording') recorder.stop();
		}, 200);
	}
	function finishRecording() {
		clearInterval(timer);
		const peak = level?.peak() ?? 1;
		closeMic();
		const seconds = (performance.now() - startedAt) / 1000;
		if (interrupted) { status = 'interrupted'; return; }
		if (seconds < RESPOND_MIN_SECONDS) { status = 'short'; return; }
		if (peak < SILENT_BELOW) { status = 'silent'; return; }
		lastBlob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' }); lastSeconds = Math.round(seconds);
		void send();
	}
	async function send() {
		if (!lastBlob) return;
		status = 'listening';
		const body = new FormData();
		body.set('audio', lastBlob, 'speech'); body.set('seconds', String(lastSeconds));
		let transcript: string | null = null;
		try {
			const response = await fetch('/api/english/read-rate', { method: 'POST', body });
			const data = response.ok ? await response.json() : null;
			transcript = typeof data?.transcript === 'string' && data.transcript.trim() ? data.transcript.trim() : null;
		} catch { transcript = null; }
		if (transcript === null) { status = 'failed'; return; }
		lastBlob = null;
		update({ transcript, step: 'heard' }); status = 'idle';
		queueMicrotask(() => heading?.focus());
	}
	/** One AI call: the reply checked against the text. */
	async function getFeedback() {
		if (!mine.transcript || mine.rating === null) return;
		status = 'checking';
		let feedback: ReplyFeedback | null = null;
		try {
			const response = await fetch('/api/english/read-rate', {
				method: 'POST', headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ kind: 'feedback', text: text.id, rating: mine.rating, reply: mine.transcript })
			});
			feedback = response.ok ? await response.json() : null;
		} catch { feedback = null; }
		if (!feedback || !Array.isArray(feedback.facts)) { status = 'aiFailed'; return; }
		update({ feedback, step: 'feedback' }); status = 'idle';
		queueMicrotask(() => heading?.focus());
	}
	function sayAgain() { update({ transcript: null, step: 'respond' }); status = 'idle'; }
	function next() {
		stopAllAudio();
		const nextIndex = record.index + 1;
		record = { ...record, index: nextIndex, done: nextIndex >= TEXTS.length }; persist();
		status = 'idle'; shownGloss = null;
		if (nextIndex >= TEXTS.length) stage = 'result';
		queueMicrotask(() => heading?.focus());
	}
	function start() { stopAllAudio(); stage = 'text'; queueMicrotask(() => heading?.focus()); }
	function again() { record = emptyReadRate(); persist(); stage = 'text'; status = 'idle'; queueMicrotask(() => heading?.focus()); }
	function finish() { stopAllAudio(); closeMic(); onDone(); }

	const parts = (b: string) => b.split(/(\[[^\]]*\])/).filter(Boolean).map(p => (p.startsWith('[') ? { text: p.slice(1, -1), added: true } : { text: p, added: false }));
	const remaining = $derived(Math.max(0, Math.ceil(RESPOND_MAX_SECONDS - elapsed)));
	const summary = $derived(summarize(record));
	const ratingLabel = $derived(mine.rating === null ? '' : text.rate.kind === 'stars' ? '★'.repeat(mine.rating) + '☆'.repeat(5 - mine.rating) : isFa ? text.rate.options![mine.rating].fa : text.rate.options![mine.rating].en);
</script>

{#snippet bottom(label: string, action: () => void, disabled = false)}
	<div class="bar"><button class="primary" type="button" onclick={action} {disabled}>{label}</button></div>
{/snippet}

{#snippet reading(showGlosses: boolean)}
	<article class="doc" lang="en" dir="ltr">
		<p class="kind">{text.kind.en}</p>
		<h3>{text.title}</h3>
		{#each text.body as paragraph}
			<p>{#each glossParts(paragraph, text.glosses) as part}{#if part.gloss !== null && showGlosses}<button class="gloss" class:on={shownGloss === part.gloss} type="button" onclick={() => (shownGloss = shownGloss === part.gloss ? null : part.gloss)}>{part.text}</button>{:else}{part.text}{/if}{/each}</p>
		{/each}
	</article>
	{#if showGlosses}
		{#if shownGloss !== null}<p class="glossline"><bdi lang="en" dir="ltr">{text.glosses[shownGloss].word}</bdi>: <span lang="fa" dir="rtl">{text.glosses[shownGloss].fa}</span></p>
		{:else}<p class="hint">{T('Tap a dotted word to see it in Persian.', 'روی کلمه‌های نقطه‌چین بزن تا معنی فارسی‌اش را ببینی.')}</p>{/if}
	{/if}
{/snippet}

<section class="rr">
	<h2 class="sr-only" tabindex="-1" bind:this={heading}>{stage === 'text' ? T(`Text ${index + 1} of ${TEXTS.length}`, `متن ${fa(index + 1)} از ${fa(TEXTS.length)}`) : T('Read, rate, respond', 'بخوان، امتیاز بده، پاسخ بده')}</h2>

	{#if stage === 'start'}
		<div class="brief"><span class="avatar" aria-hidden="true">M</span><p>{isFa ? INTRO.fa : INTRO.en}</p></div>
		{@render bottom(T('Start', 'شروع'), start)}

	{:else if stage === 'text'}
		<p class="label" aria-hidden="true">{T(`Text ${index + 1} of ${TEXTS.length}`, `متن ${fa(index + 1)} از ${fa(TEXTS.length)}`)} · {isFa ? text.kind.fa : text.kind.en}</p>
		<div class="dots" aria-hidden="true">{#each TEXTS as _, i}<span class:done={i < index} class:now={i === index}></span>{/each}</div>

		{#if mine.step === 'read'}
			{@render reading(true)}
			{@render bottom(T('I’ve read it', 'خواندم'), () => go('rate'))}

		{:else if mine.step === 'rate'}
			<p class="ask">{isFa ? text.rate.ask.fa : text.rate.ask.en}</p>
			{#if text.rate.kind === 'stars'}
				<div class="stars" role="radiogroup" aria-label={isFa ? text.rate.ask.fa : text.rate.ask.en} dir="ltr">
					{#each [1, 2, 3, 4, 5] as n}
						<button type="button" role="radio" aria-checked={mine.rating === n} aria-label={T(`${n} of 5`, `${fa(n)} از ۵`)} class:on={mine.rating !== null && n <= mine.rating} onclick={() => rate(n)}>★</button>
					{/each}
				</div>
			{:else}
				<div class="choices">
					{#each text.rate.options ?? [] as option, i}
						<button type="button" class="choice" class:on={mine.rating === i} aria-pressed={mine.rating === i} onclick={() => rate(i)}>{isFa ? option.fa : option.en}</button>
					{/each}
				</div>
			{/if}
			<button class="link quiet" type="button" onclick={() => go('read')}>{T('Read it again', 'دوباره بخوان')}</button>
			{@render bottom(T('Next', 'بعدی'), () => go('respond'), mine.rating === null)}

		{:else if mine.step === 'respond'}
			<p class="task">{isFa ? text.task.fa : text.task.en}</p>
			<p class="yourrating">{T('Your rating:', 'امتیاز تو:')} <bdi>{ratingLabel}</bdi></p>
			<details class="peek"><summary>{T('See the text', 'دیدن متن')}</summary>{@render reading(false)}</details>
			{#if status === 'listening'}<p class="hint" role="status">{T('Mira is listening…', 'میرا دارد گوش می‌دهد…')}</p>{/if}
			{#if status === 'silent'}<p class="note">{T('I couldn’t hear anything. Check your microphone, then try again.', 'چیزی نشنیدم. میکروفونت را بررسی کن و دوباره امتحان کن.')}</p>{/if}
			{#if status === 'short'}<p class="note">{T('That was very short. Tap the mic, speak, then tap again to stop.', 'خیلی کوتاه بود. میکروفون را بزن، صحبت کن، بعد دوباره بزن تا تمام شود.')}</p>{/if}
			{#if status === 'interrupted'}<p class="note">{T('The recording stopped. Try again when you’re ready.', 'ضبط متوقف شد. هر وقت آماده بودی دوباره امتحان کن.')}</p>{/if}
			{#if status === 'denied'}<p class="note">{T('The microphone is blocked. Allow it in your browser’s site settings, then try again.', 'میکروفون بسته است. در تنظیمات سایت اجازه‌اش را بده و دوباره امتحان کن.')}</p>{/if}
			{#if status === 'failed'}<p class="note">{T('I couldn’t hear that clearly. Check your connection.', 'نتوانستم واضح بشنوم. اینترنت را بررسی کن.')}</p>
				<button class="link quiet" type="button" onclick={send}>{T('Send it again', 'دوباره بفرست')}</button>{/if}
			<div class="bar"><button class="primary" class:rec={status === 'recording'} type="button" onclick={speak} disabled={status === 'listening'}>
				{#if status === 'recording'}<span class="dot" aria-hidden="true"></span>{T('Stop', 'پایان')}<span aria-hidden="true">&nbsp;{remaining}</span>
				{:else}<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0M12 17v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>{T('Say your reply', 'جوابت را بگو')}{/if}
			</button></div>

		{:else if mine.step === 'heard'}
			<p class="boxlabel">{T('I heard', 'شنیدم')}</p>
			<p class="you" lang="en" dir="ltr">{mine.transcript}</p>
			<p class="hint">{T('If that’s not what you said, say it again.', 'اگر این چیزی نیست که گفتی، دوباره بگو.')}</p>
			{#if status === 'checking'}<p class="hint" role="status">{T('Mira is checking your reply against the text…', 'میرا دارد جوابت را با متن مقایسه می‌کند…')}</p>{/if}
			{#if status === 'aiFailed'}<p class="note">{T('Mira couldn’t check it just now. Try again in a moment.', 'میرا الان نتوانست بررسی کند. کمی بعد دوباره امتحان کن.')}</p>{/if}
			{#if status !== 'checking'}<button class="link quiet" type="button" onclick={sayAgain}>{T('Say it again', 'دوباره بگو')}</button>{/if}
			{@render bottom(T('Get feedback', 'بازخورد بگیر'), getFeedback, status === 'checking')}

		{:else if mine.feedback}
			{@const f = mine.feedback}
			<p class="boxlabel">{T('You said', 'گفتی')}</p>
			<p class="you" lang="en" dir="ltr">{mine.transcript}</p>
			{#if !f.onTask}
				<p class="note warn">{T('That doesn’t really answer the task. Read it again and give your opinion of this text.', 'این جواب واقعاً به خواستهٔ سؤال نمی‌پردازد. دوباره بخوان و نظرت را دربارهٔ همین متن بگو.')}</p>
			{:else}
				<ul class="checks">
					<li class:ok={f.facts.some(x => x.correct)}>{f.facts.some(x => x.correct) ? '✓' : '✗'} {T('Used details from the text', 'از جزئیات متن استفاده کردی')}
						{#if f.facts.length}<ul>{#each f.facts as fact}<li lang="en" dir="ltr" class:wrong={!fact.correct}>{fact.correct ? '✓' : '✗'} {fact.said}{#if !fact.correct}<span class="fix">{fact.fix}</span>{/if}</li>{/each}</ul>{/if}
					</li>
					<li class:ok={f.reason}>{f.reason ? '✓' : '✗'} {T('Gave a reason', 'دلیل آوردی')}</li>
				</ul>
			{/if}
			{#if f.better}
				<p class="boxlabel">{T('A better reply', 'یک جواب بهتر')}</p>
				<p class="better" lang="en" dir="ltr">{#each parts(f.better) as part}{#if part.added}<mark>{part.text}</mark>{:else}{part.text}{/if}{/each}</p>
				{#if f.better.includes('[')}<p class="hint">{T('Highlighted: something from the text you could add.', 'رنگی: چیزی از متن که می‌توانستی اضافه کنی.')}</p>{/if}
			{/if}
			<button class="link quiet" type="button" onclick={sayAgain}>{T('Try this one again', 'این یکی را دوباره امتحان کن')}</button>
			{@render bottom(index + 1 < TEXTS.length ? T('Next text', 'متن بعدی') : T('See your result', 'دیدن نتیجه'), next)}
		{/if}

	{:else}
		<p class="label">{T('Your result', 'نتیجهٔ تو')}</p>
		<ul class="stats">
			<li><span class="big">{isFa ? `${fa(summary.usedText)} از ${fa(TEXTS.length)}` : `${summary.usedText}/${TEXTS.length}`}</span>{T('replies used details from the text', 'جواب با جزئیات متن')}</li>
			<li><span class="big">{isFa ? `${fa(summary.reasons)} از ${fa(TEXTS.length)}` : `${summary.reasons}/${TEXTS.length}`}</span>{T('replies gave a reason', 'جواب با دلیل')}</li>
		</ul>
		<p class="tip">{summary.wrongFacts
			? T('Some details didn’t match the text. Before you reply, look back at the text for the exact detail.', 'بعضی جزئیات با متن نمی‌خواند. قبل از جواب دادن، جزئیات دقیق را دوباره در متن نگاه کن.')
			: summary.usedText < TEXTS.length
				? T('Next time, use one or two details from the text to support your opinion.', 'دفعهٔ بعد، برای نظرت یکی دو جزئیات از خود متن بیاور.')
				: summary.reasons < TEXTS.length
					? T('Next time, add a reason: “…, because…”.', 'دفعهٔ بعد یک دلیل هم بیاور: «…, because…».')
					: T('Clear opinions, backed by the text. Nicely done.', 'نظرهای روشن، با پشتوانهٔ متن. آفرین.')}</p>
		<button class="link quiet" type="button" onclick={again}>{T('Try it again', 'دوباره امتحان کن')}</button>
		{@render bottom(T('Done', 'تمام'), finish)}
	{/if}
</section>

<style>
	.rr { display: grid; gap: 14px; padding-bottom: 104px; }
	.brief { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.brief p { margin: 0; line-height: 1.55; }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.label { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .label { letter-spacing: normal; }
	.dots { display: flex; gap: 6px; }
	.dots span { flex: 1; block-size: 6px; border-radius: 3px; background: var(--paper-sunken); }
	.dots span.done { background: var(--leaf); }
	.dots span.now { background: var(--accent); }
	.doc { padding: 16px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); text-align: left; }
	.doc .kind { margin: 0; font-size: .72rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-soft); }
	.doc h3 { margin: 4px 0 10px; font-family: var(--font-display); font-size: 1.2rem; line-height: 1.3; }
	.doc p:not(.kind) { margin: 0 0 10px; line-height: 1.65; font-size: 1.05rem; }
	.doc p:last-child { margin-bottom: 0; }
	.gloss { padding: 0; border: 0; background: none; color: inherit; font: inherit; text-decoration: underline dotted var(--accent); text-underline-offset: 4px; text-decoration-thickness: 2px; cursor: pointer; }
	.gloss.on { background: color-mix(in srgb, var(--accent) 15%, transparent); border-radius: 4px; }
	.glossline { margin: 0; padding: 10px 14px; border-radius: 12px; background: var(--paper-sunken); font-weight: 600; }
	.ask, .task { margin: 8px 0 0; font-family: var(--font-display); font-size: 1.3rem; line-height: 1.35; }
	.stars { display: flex; gap: 6px; justify-content: center; }
	.stars button { inline-size: 56px; block-size: 56px; border: 0; background: none; font-size: 2.6rem; line-height: 1; color: var(--line); cursor: pointer; }
	.stars button.on { color: var(--accent); }
	.choices { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
	.choice { min-block-size: 72px; border: 2px solid var(--line); border-radius: 16px; background: var(--paper-raised); color: var(--ink); font: inherit; font-size: 1.1rem; font-weight: 600; cursor: pointer; }
	.choice.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--paper-raised)); }
	.yourrating { margin: 0; color: var(--ink-soft); }
	.yourrating bdi { color: var(--accent-deep); font-weight: 700; }
	.peek summary { min-height: 44px; display: flex; align-items: center; color: var(--accent-deep); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.boxlabel { margin: 0; font-size: .75rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-soft); }
	:global([dir='rtl']) .boxlabel { letter-spacing: normal; }
	.you, .better { margin: 0; padding: 12px 16px; border-radius: 14px; line-height: 1.6; text-align: left; }
	.you { background: var(--paper-sunken); }
	.better { background: var(--paper-raised); border: 1px solid var(--accent); }
	mark { background: color-mix(in srgb, var(--attention) 20%, transparent); color: inherit; border-radius: 4px; padding: 0 2px; }
	.checks { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; font-weight: 600; color: var(--attention); }
	.checks > li.ok { color: var(--leaf); }
	.checks ul { list-style: none; margin: 6px 0 0; padding: 0 0 0 14px; display: grid; gap: 4px; font-weight: 400; color: var(--ink); text-align: left; }
	.checks ul li.wrong { color: var(--attention); }
	.fix { display: block; color: var(--ink); font-size: .92rem; }
	.stats { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
	.stats li { display: grid; gap: 4px; justify-items: center; padding: 14px 8px; border-radius: 14px; background: var(--paper-raised); border: 1px solid var(--line); text-align: center; color: var(--ink-soft); font-size: .88rem; }
	.big { font-family: var(--font-display); font-size: 2rem; color: var(--accent-deep); }
	.tip { margin: 0; line-height: 1.55; font-weight: 600; color: var(--accent-deep); }
	.note { margin: 0; line-height: 1.5; }
	.note.warn { color: var(--attention); font-weight: 600; }
	.hint { margin: 0; color: var(--ink-soft); line-height: 1.5; }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.link.quiet { color: var(--ink-soft); }
	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 20; padding: 12px 20px calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 35%); }
	.primary { display: flex; align-items: center; justify-content: center; gap: 10px; inline-size: 100%; max-inline-size: 680px; margin-inline: auto; min-height: 54px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	.primary:disabled { opacity: .5; cursor: default; }
	.primary.rec { background: var(--attention); }
	.dot { inline-size: 12px; block-size: 12px; border-radius: 50%; background: currentColor; animation: pulse 1.2s infinite ease-in-out; }
	@keyframes pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	h2:focus { outline: none; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	@media (prefers-reduced-motion: reduce) { .dot { animation: none; } }
</style>
