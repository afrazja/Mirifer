<script lang="ts">
	/**
	 * "Persian-speaker traps", Module lab (docs/english-traps-spec.md, owner-approved in chat).
	 * For each sentence: tap the mistake a Persian speaker would make, read why, then say the
	 * sentence correctly. Checked in code, no AI; recordings are never stored.
	 */
	import { onDestroy, onMount } from 'svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import MixedText from '$lib/components/MixedText.svelte';
	import { playAudioUrl, stopAllAudio, ttsUrl } from '$services/tts';
	import { SILENT_BELOW, measureLevel, type MicLevel } from '$utils/mic-level';
	import { MAX_WRONG_TAPS, SAY_MAX_SECONDS, SAY_MIN_SECONDS, TRAPS, checkSaid, emptyTrapsRecord, missedOf, summarize, type SaidCheck, type TrapsRecord } from '$lib/practice/traps';

	let { isFa = false, initial = null, onSave, onDone }: {
		isFa?: boolean;
		initial?: TrapsRecord | null;
		onSave?: (record: TrapsRecord) => void;
		onDone: () => void;
	} = $props();

	const INTRO = {
		en: `Here are ${TRAPS.length} sentences. Each one has a mistake that Persian speakers often make. First tap the wrong word and see why. Then say the sentence correctly.`,
		fa: `${TRAPS.length.toLocaleString('fa-IR')} جمله می‌بینی که هر کدام یک اشتباه رایج دارد. اول روی کلمهٔ غلط بزن و ببین چرا. بعد جمله را درست بگو.`
	};
	/** Mira reads the correct sentence (the wrong one is never read aloud: it would model the mistake). */
	const RIGHT_VOICE = 'b';
	const QUIET_AFTER = 3;

	type Status = 'idle' | 'recording' | 'checking' | 'result' | 'silent' | 'short' | 'failed' | 'denied' | 'interrupted';
	// svelte-ignore state_referenced_locally
	let record = $state<TrapsRecord>(initial ?? emptyTrapsRecord());
	let stage = $state<'start' | 'item' | 'end'>('start');
	let status = $state<Status>('idle'), elapsed = $state(0), playing = $state(false), showAnswer = $state(false), tries = $state(0), announce = $state('');
	let check = $state<SaidCheck | null>(null), alsoTapped = $state<number | null>(null);
	let heading: HTMLElement | undefined = $state(), whyBox: HTMLElement | undefined = $state(), resultLine: HTMLElement | undefined = $state();
	let recorder: MediaRecorder | null = null, stream: MediaStream | null = null, chunks: Blob[] = [], level: MicLevel | null = null;
	let startedAt = 0, timer: ReturnType<typeof setInterval> | undefined, interrupted = false, alive = true;

	const T = (en: string, fa: string) => (isFa ? fa : en);
	const N = (n: number) => (isFa ? n.toLocaleString('fa-IR') : String(n));
	const index = $derived(Math.min(record.index, TRAPS.length - 1));
	const trap = $derived(TRAPS[index]);
	const mine = $derived(record.traps[index]);
	const revealed = $derived(mine.found !== null);
	const summary = $derived(summarize(record));
	const retry = $derived(record.retry ?? null);
	const position = $derived(retry ? retry.indexOf(index) : index);
	const count = $derived(retry ? retry.length : TRAPS.length);
	const last = $derived(position + 1 >= count);
	const label = $derived(retry ? T(`Practice ${position + 1} of ${count}`, `تمرین ${N(position + 1)} از ${N(count)}`) : T(`Sentence ${index + 1} of ${TRAPS.length}`, `جملهٔ ${N(index + 1)} از ${N(TRAPS.length)}`));
	const moveOn = $derived(mine.said === true || tries >= 3);
	/** The correct sentence shows after a right answer, a second miss, or when asked for. */
	const answerShown = $derived(mine.said === true || tries >= 2 || showAnswer);
	const missed = $derived(missedOf(record));
	const alsoSentence = $derived(alsoTapped === null ? null : trap.alsoOk?.find(a => a.index === alsoTapped)?.sentence ?? null);

	onMount(() => {
		// A reload returns to the same sentence and step.
		if (record.done || record.index >= TRAPS.length) stage = 'end';
		else if (record.index > 0 || record.step !== 'spot' || record.traps[0].wrongTaps.length || record.traps[0].found !== null) stage = 'item';
		const onHidden = () => { if (document.hidden && recorder && recorder.state !== 'inactive') { interrupted = true; recorder.stop(); } };
		document.addEventListener('visibilitychange', onHidden);
		return () => document.removeEventListener('visibilitychange', onHidden);
	});
	onDestroy(() => { alive = false; clearInterval(timer); if (recorder && recorder.state !== 'inactive') { interrupted = true; recorder.stop(); } closeMic(); stopAllAudio(); });

	function persist() { onSave?.($state.snapshot(record)); }
	function update(changes: Partial<TrapsRecord['traps'][number]>) {
		const traps = [...record.traps]; traps[index] = { ...traps[index], ...changes };
		record = { ...record, traps }; persist();
	}
	function focus(el: () => HTMLElement | undefined) { queueMicrotask(() => el()?.focus()); }
	/** Says a line in the status region, even if it's the same line as last time. */
	function say(text: string) { announce = ''; queueMicrotask(() => (announce = text)); }
	function closeMic() { level?.stop(); level = null; stream?.getTracks().forEach(t => t.stop()); stream = null; }

	async function hear(text: string, voice: 'b' | 'c') {
		if (playing) return;
		stopAllAudio(); playing = true;
		const { url, playback } = ttsUrl(text.replace(/[’‘]/g, "'"), 'en-US', 1, voice);
		await playAudioUrl(url, 15_000, playback);
		playing = false;
	}

	/** A tap on a word: the mistake, or not (after MAX_WRONG_TAPS wrong taps, the mistake is shown). */
	function tap(i: number) {
		if (revealed || mine.wrongTaps.includes(i)) return;
		if (i === trap.wrong || trap.alsoOk?.some(a => a.index === i)) { alsoTapped = i === trap.wrong ? null : i; update({ found: true }); announce = ''; focus(() => whyBox); return; }
		const wrongTaps = [...mine.wrongTaps, i];
		if (wrongTaps.length >= MAX_WRONG_TAPS) { update({ wrongTaps, found: false }); announce = ''; focus(() => whyBox); }
		else { update({ wrongTaps }); say(T('Not that one. Try again.', 'این نه. دوباره امتحان کن.')); }
	}
	function showMe() { update({ found: false }); announce = ''; focus(() => whyBox); }
	function toSay() { stopAllAudio(); record = { ...record, step: 'say' }; persist(); status = 'idle'; tries = 0; showAnswer = false; announce = ''; focus(() => heading); }

	async function speak() {
		if (status === 'recording') { recorder?.stop(); return; }
		if (status === 'checking') return;
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
		startedAt = performance.now(); elapsed = 0; status = 'recording'; say(T('Listening…', 'گوش می‌دهم…'));
		timer = setInterval(() => {
			elapsed = Math.min(SAY_MAX_SECONDS, (performance.now() - startedAt) / 1000);
			const voiced = level?.voiced() ?? 0;
			const finished = voiced !== Infinity && voiced >= 0.6 && level!.quietFor() >= QUIET_AFTER;
			if ((elapsed >= SAY_MAX_SECONDS || finished) && recorder?.state === 'recording') recorder.stop();
		}, 100);
	}
	function finishRecording() {
		clearInterval(timer);
		const peak = level?.peak() ?? 1;
		closeMic();
		if (!alive) return;
		const seconds = (performance.now() - startedAt) / 1000;
		if (interrupted) { status = 'interrupted'; return; }
		if (seconds < SAY_MIN_SECONDS) { status = 'short'; return; }
		if (peak < SILENT_BELOW) { status = 'silent'; return; }
		void send(new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' }), Math.round(seconds));
	}
	async function send(blob: Blob, seconds: number) {
		status = 'checking'; announce = T('Checking…', 'در حال بررسی…');
		const body = new FormData();
		body.set('audio', blob, 'speech'); body.set('seconds', String(seconds));
		let transcript: string | null = null;
		try {
			const response = await fetch('/api/english/traps', { method: 'POST', body });
			const data = response.ok ? await response.json() : null;
			transcript = typeof data?.transcript === 'string' ? data.transcript.trim() : null;
		} catch { transcript = null; }
		if (!alive) return;
		announce = '';
		if (transcript === null) { status = 'failed'; return; }
		if (!transcript) { status = 'silent'; return; }
		check = checkSaid(trap, transcript);
		const ok = check === 'right';
		tries += 1;
		update({ said: ok, saidRight: mine.saidRight || ok, transcript });
		status = 'result';
		focus(() => resultLine);
	}
	function again() { stopAllAudio(); status = 'idle'; focus(() => heading); }
	function next() {
		stopAllAudio();
		// In the practice round, only the missed sentences, say step only.
		const following = retry ? retry[position + 1] : record.index + 1;
		const done = following === undefined || following >= TRAPS.length;
		record = done ? { ...record, index: TRAPS.length, step: 'spot', done: true, retry: null } : { ...record, index: following, step: retry ? 'say' : 'spot', done: false };
		persist();
		status = 'idle'; tries = 0; showAnswer = false; check = null; alsoTapped = null; announce = '';
		if (done) stage = 'end';
		focus(() => heading);
	}
	function start() { stage = 'item'; focus(() => heading); }
	function restart() { stopAllAudio(); record = emptyTrapsRecord(); persist(); status = 'idle'; tries = 0; showAnswer = false; stage = 'item'; focus(() => heading); }
	function practise() {
		stopAllAudio();
		const list = missed;
		if (!list.length) return;
		record = { ...record, retry: list, index: list[0], step: 'say', done: false }; persist();
		status = 'idle'; tries = 0; showAnswer = false; check = null; stage = 'item'; focus(() => heading);
	}
	function finish() { stopAllAudio(); closeMic(); onDone(); }

	const ERRORS: Partial<Record<Status, { en: string; fa: string }>> = {
		silent: { en: 'I couldn’t hear you. Hold the phone closer and try again.', fa: 'صدایت را نشنیدم. گوشی را نزدیک‌تر بگیر و دوباره امتحان کن.' },
		short: { en: 'That was very short. Tap the mic, then say the whole sentence.', fa: 'خیلی کوتاه بود. دکمه را بزن و کل جمله را بگو.' },
		failed: { en: 'That didn’t send. Check your internet and try again.', fa: 'ارسال نشد. اینترنتت را بررسی کن و دوباره امتحان کن.' },
		denied: { en: 'The microphone is blocked. Allow it in your browser’s settings for this site.', fa: 'دسترسی به میکروفون بسته است. در تنظیمات مرورگر، برای این سایت اجازه بده.' },
		interrupted: { en: 'The recording stopped when you left the page. Try again.', fa: 'وقتی از صفحه بیرون رفتی ضبط قطع شد. دوباره امتحان کن.' }
	};
</script>

{#snippet q(text: string)}{isFa ? '«' : '“'}<bdi lang="en" dir="ltr">{text}</bdi>{isFa ? '»' : '”'}{/snippet}
{#snippet why()}
	<div class="why" tabindex="-1" bind:this={whyBox}>
		{#if alsoSentence}
			<p class="whyhead">{T('That works too:', 'این هم درست است:')} {@render q(alsoSentence)}</p>
			<p class="whyhead">{T('But the usual mistake is', 'ولی اشتباه رایج این است:')} {@render q(trap.words[trap.wrong])}</p>
		{:else}
			<p class="whyhead">{mine.found ? T('✓ You found it:', '✓ درست پیدا کردی:') : T('Here’s the mistake:', 'اشتباه این‌جاست:')} {@render q(trap.words[trap.wrong])}</p>
		{/if}
		<p>{#if isFa}<MixedText text={trap.why.fa} />{:else}{trap.why.en}{/if}</p>
	</div>
{/snippet}

<section class="tr">
	<p class="sr-only" role="status" aria-live="polite">{announce}</p>

	{#if stage === 'start'}
		<h2 class="sr-only" tabindex="-1" bind:this={heading}>{T('Persian-speaker traps', 'اشتباه‌های آشنا')}</h2>
		<div class="brief"><span class="avatar" aria-hidden="true">M</span><p>{isFa ? INTRO.fa : INTRO.en}</p></div>
		<ActionBar label={T('Start', 'شروع')} onclick={start} />

	{:else if stage === 'item'}
		<p class="label" aria-hidden="true">{label}</p>
		<div class="dots" aria-hidden="true">{#each TRAPS as _, i}<span class:done={i < index} class:now={i === index}></span>{/each}</div>

		{#if record.step === 'spot'}
			<h2 id="trap-task" tabindex="-1" bind:this={heading}><span class="sr-only">{label}: </span>{T('Tap the wrong word.', 'روی کلمهٔ اشتباه بزن.')}</h2>
			<div class="sentence" role="group" aria-labelledby="trap-task" lang="en" dir="ltr">
				{#each trap.words as word, i}
					{@const isWrong = i === trap.wrong}
					<button type="button" class="word" class:miss={mine.wrongTaps.includes(i)} class:found={revealed && isWrong} class:also={alsoTapped === i} onclick={() => tap(i)}
						aria-disabled={revealed || mine.wrongTaps.includes(i)}>{word}{#if revealed && isWrong}<span class="sr-only" lang={isFa ? 'fa' : 'en'}>: {T('the mistake', 'اشتباه')}</span>{:else if mine.wrongTaps.includes(i)}<span class="sr-only" lang={isFa ? 'fa' : 'en'}>: {T('not this one', 'این نه')}</span>{/if}</button>
				{/each}
			</div>
			{#if revealed}{@render why()}
			{:else}
				{#if mine.wrongTaps.length}<p class="note" aria-hidden="true">{T('Not that one. Try again.', 'این نه. دوباره امتحان کن.')}</p>{/if}
				<button class="link quiet" type="button" onclick={showMe}>{T('Show me the mistake', 'اشتباه را نشانم بده')}</button>
			{/if}
			{#if revealed}<ActionBar label={T('Now say it correctly', 'حالا درستش را بگو')} onclick={toSay} />{/if}

		{:else}
			<h2 tabindex="-1" bind:this={heading}><span class="sr-only">{label}: </span>{T('Say the whole sentence correctly.', 'کل جمله را درست بگو.')}</h2>
			<p class="sentence plain" lang="en" dir="ltr">{#each trap.words as word, i}{#if i > 0}{' '}{/if}{#if i === trap.wrong}<del>{word}</del><span class="sr-only" lang={isFa ? 'fa' : 'en'}> ({T('wrong word', 'کلمهٔ اشتباه')})</span>{:else}{word}{/if}{/each}</p>

			{#if status === 'result'}
				<p class="result" class:ok={mine.said} class:neutral={check === 'selfFixed' || check === 'alsoGood'} tabindex="-1" bind:this={resultLine}>
					{#if mine.said}<span aria-hidden="true">✓</span> {T('Right!', 'درست است!')}
					{:else if check === 'selfFixed'}{T('You fixed it yourself. Nice. Now say it once, straight through.', 'خودت درستش کردی. آفرین. حالا یک بار، یک‌سره بگو.')}
					{:else if check === 'alsoGood'}{T('That’s good English too. Now try it with', 'این هم انگلیسی درستی است. حالا با این امتحان کن:')} {@render q(trap.alsoGood?.word ?? '')}
					{:else}{T('Not yet.', 'هنوز نه.')} <span class="said">{T('You said', 'گفتی:')} {@render q(mine.transcript ?? '')}</span>{/if}
				</p>
				{#if answerShown}
					<div class="answer">{#if !mine.said}<p class="small">{T('Say it like this', 'این‌طوری بگو')}</p>{/if}<p class="right" lang="en" dir="ltr">{trap.right}</p></div>
					<button class="link" type="button" onclick={() => hear(trap.right, RIGHT_VOICE)}><span aria-hidden="true">▶</span> {T('Hear it', 'بشنو')}</button>
				{:else if check === 'wrong'}
					<p class="tip">{#if isFa}<MixedText text={trap.why.fa} />{:else}{trap.why.en}{/if}</p>
				{/if}
				{#if moveOn}
					<ActionBar label={last ? T('See how you did', 'دیدن نتیجه') : T('Next sentence', 'جملهٔ بعدی')} onclick={next} secondary={{ label: mine.said ? T('Say it again', 'دوباره بگو') : T('Try again', 'دوباره امتحان کن'), onclick: again }} />
				{:else}
					<ActionBar label={T('Try again', 'دوباره امتحان کن')} onclick={again} secondary={{ label: last ? T('See how you did', 'دیدن نتیجه') : T('Next sentence', 'جملهٔ بعدی'), onclick: next }} />
				{/if}
			{:else}
				{#if showAnswer}<div class="answer"><p class="small">{T('Say it like this', 'این‌طوری بگو')}</p><p class="right" lang="en" dir="ltr">{trap.right}</p></div>{/if}
				{#if status === 'recording'}<p class="listening" aria-hidden="true"><span class="dot"></span>{T('Listening…', 'گوش می‌دهم…')}</p>{/if}
				{#if ERRORS[status]}<p class="note" role="alert">{T(ERRORS[status]!.en, ERRORS[status]!.fa)}</p>{/if}
				<ActionBar
					label={status === 'recording' ? T('Stop', 'پایان ضبط') : status === 'checking' ? T('Checking…', 'در حال بررسی…') : T('Say it correctly', 'درستش را بگو')}
					icon={status === 'checking' ? null : status === 'recording' ? 'stop' : 'mic'} recording={status === 'recording'} onclick={speak}
					secondary={status === 'recording' || status === 'checking' ? null
						: ERRORS[status] ? { label: last ? T('Skip to the end', 'رفتن به پایان') : T('Skip this sentence', 'از این جمله بگذر'), onclick: next }
						: showAnswer ? { label: last ? T('Skip to the end', 'رفتن به پایان') : T('Skip this sentence', 'از این جمله بگذر'), onclick: next }
						: { label: T('Show the correct sentence', 'جملهٔ درست را نشانم بده'), onclick: () => (showAnswer = true) }} />
			{/if}
		{/if}

	{:else}
		<h2 class="big" tabindex="-1" bind:this={heading}>{T(`You said ${summary.said} of ${summary.total} right`, `از ${N(summary.total)} جمله، ${N(summary.said)} تا را درست گفتی`)}</h2>
		{#if missed.length}
			<p class="small">{T('To practise again', 'برای تمرین دوباره')}</p>
			<ul class="list">
				{#each missed as i}
					<li><span lang="en" dir="ltr">{TRAPS[i].right}</span><span class="kind"><MixedText text={isFa ? TRAPS[i].kind.fa : TRAPS[i].kind.en} /></span></li>
				{/each}
			</ul>
			<ActionBar label={T(`Practise the ${missed.length} you missed`, `${N(missed.length)} جملهٔ جاافتاده را تمرین کن`)} onclick={practise} secondary={{ label: T('Done', 'تمام شد'), onclick: finish }} />
		{:else}
			<p>{T('Every sentence, said right. Well done.', 'همهٔ جمله‌ها را درست گفتی. آفرین.')}</p>
			<ActionBar label={T('Done', 'تمام شد')} onclick={finish} secondary={{ label: T('Start again', 'دوباره از اول'), onclick: restart }} />
		{/if}
	{/if}
</section>

<style>
	.tr { display: grid; gap: 14px; padding-bottom: 136px; }
	.brief { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.brief p { margin: 0; line-height: 1.55; }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.label { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .label { letter-spacing: normal; }
	.dots { display: flex; gap: 4px; }
	.dots span { flex: 1; block-size: 6px; border-radius: 3px; background: var(--paper-sunken); }
	.dots span.done { background: var(--leaf); }
	.dots span.now { background: var(--accent); }
	h2 { margin: 0; font-size: 1.15rem; }
	h2:focus { outline: none; }
	.big { font-family: var(--font-display); font-size: clamp(1.6rem, 7vw, 2.1rem); color: var(--accent-deep); }
	.sentence { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; }
	.word { min-block-size: 48px; min-inline-size: 44px; padding: 8px 14px; border: 2px solid var(--line); border-radius: 12px; background: var(--paper-raised); color: var(--ink); font: inherit; font-size: 1.25rem; cursor: pointer; }
	.word[aria-disabled='true'] { cursor: default; }
	.word.miss { border-style: dashed; color: var(--ink-soft); text-decoration: line-through; }
	.word.also { border-color: var(--accent); font-weight: 600; }
	.word.found { border-color: var(--attention); background: color-mix(in srgb, var(--attention) 14%, var(--paper-raised)); font-weight: 700; }
	.plain { display: block; font-size: 1.3rem; line-height: 1.6; padding: 14px 16px; border-radius: 14px; background: var(--paper-raised); border: 1px solid var(--line); }
	del { color: var(--attention); text-decoration-thickness: 2px; }
	.why { display: grid; gap: 6px; padding: 12px 14px; border-radius: 14px; background: var(--paper-raised); border-inline-start: 4px solid var(--accent); }
	.why:focus { outline: none; }
	.whyhead { font-weight: 700; color: var(--accent-deep); }
	p { margin: 0; line-height: 1.55; }
	.small, .said { color: var(--ink-soft); }
	.small { font-size: .85rem; font-weight: 600; }
	.said { font-weight: 400; }
	.note { color: var(--attention); }
	.result { font-size: 1.15rem; font-weight: 700; color: var(--attention); }
	.result.ok { color: var(--leaf-deep); }
	.result.neutral { color: var(--ink); }
	.tip { padding-inline-start: 10px; border-inline-start: 3px solid var(--accent); }
	.result:focus { outline: none; }
	.answer { display: grid; gap: 4px; padding: 12px 14px; border-radius: 14px; background: var(--paper-raised); border: 1px solid var(--line); }
	.right { font-size: 1.15rem; font-weight: 600; }
	.listening { display: flex; align-items: center; gap: 8px; color: var(--ink); font-weight: 600; }
	.dot { inline-size: 10px; block-size: 10px; border-radius: 50%; background: var(--attention); animation: pulse 1.2s infinite ease-in-out; }
	@keyframes pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
	.list li { display: grid; gap: 2px; font-weight: 600; padding: 10px 14px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); }
	.kind { font-size: .85rem; color: var(--ink-soft); }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	@media (prefers-reduced-motion: reduce) { .dot { animation: none; } }
</style>
