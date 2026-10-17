<script lang="ts">
	/**
	 * "Say it in English", Module lab (docs/english-say-in-english-spec.md, owner-approved in chat).
	 * One message at a time: Mira shows what you want to say, in Persian, and who you're talking to.
	 * You say it in English; one AI call checks whether the meaning came across and gives a natural
	 * way to say it. Recordings are never stored.
	 */
	import { onDestroy, onMount } from 'svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import MixedText from '$lib/components/MixedText.svelte';
	import { playAudioPromise, playAudioUrl, stopAllAudio, ttsUrl } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { SILENT_BELOW, measureLevel, type MicLevel } from '$utils/mic-level';
	import {
		ITEMS, SAY_MAX_SECONDS, SAY_MIN_SECONDS, VOICE, betterParts, emptySayRecord, plain, summarize, verdictOf, type SayFeedback, type SayRecord, type SayTry, type Verdict
	} from '$lib/practice/say-in-english';

	let { isFa = false, initial = null, first = false, onSave, onDone }: {
		isFa?: boolean;
		initial?: SayRecord | null;
		first?: boolean;
		onSave?: (record: SayRecord) => void;
		onDone: () => void;
	} = $props();

	const INTRO = {
		en: 'I’ll show you a short message in Persian and who it’s for. Say it in English, the way you’d really say it to them. Don’t translate word for word. Just make sure they understand you.',
		fa: 'یک جمله به فارسی نشانت می‌دهم و می‌گویم با چه کسی حرف می‌زنی. همان را به انگلیسی بگو، همان‌طور که به خود آن آدم می‌گفتی. لازم نیست کلمه‌به‌کلمه ترجمه کنی؛ مهم این است که منظورت را بفهمد.'
	};
	/** Speech has ended once it has been quiet this long after some speech. */
	const QUIET_AFTER = 4;
	/** The countdown shows only near the end, so it doesn't rush them. */
	const COUNTDOWN_FROM = 5;

	type Status = 'say' | 'recording' | 'checking' | 'feedback' | 'silent' | 'short' | 'failed' | 'aiFailed' | 'denied' | 'interrupted';
	// svelte-ignore state_referenced_locally
	let record = $state<SayRecord>(initial ?? emptySayRecord());
	let stage = $state<'start' | 'item' | 'end'>('start');
	let status = $state<Status>('say'), elapsed = $state(0), hint = $state(false), playing = $state(false), announce = $state('');
	// The latest try is what they see; the record keeps their best try per message.
	let latest = $state<SayTry | null>(null), attempts = $state<number[]>(ITEMS.map(() => 0));
	let heading: HTMLElement | undefined = $state(), resultLine: HTMLElement | undefined = $state(), hintList: HTMLElement | undefined = $state();
	let recorder: MediaRecorder | null = null, stream: MediaStream | null = null, chunks: Blob[] = [], level: MicLevel | null = null;
	let startedAt = 0, timer: ReturnType<typeof setInterval> | undefined, interrupted = false, myUrl = $state<string | null>(null), myPlayer: HTMLAudioElement | null = null, alive = true;

	const T = (en: string, fa: string) => (isFa ? fa : en);
	const N = (n: number) => (isFa ? n.toLocaleString('fa-IR') : String(n));
	const index = $derived(Math.min(record.index, ITEMS.length - 1));
	const item = $derived(ITEMS[index]);
	const mine = $derived(latest ?? record.tries[index]);
	const verdict = $derived<Verdict | null>(mine ? verdictOf(mine.feedback) : null);
	const last = $derived(index + 1 >= ITEMS.length);
	const summary = $derived(summarize(record));
	const label = $derived(T(`Message ${index + 1} of ${ITEMS.length}`, `جملهٔ ${N(index + 1)} از ${N(ITEMS.length)}`));

	onMount(() => {
		// A reload returns to the same message (with its feedback, if there was one).
		if (record.done || record.index >= ITEMS.length) stage = 'end';
		else if (record.index > 0 || record.tries.some(Boolean)) { stage = 'item'; status = record.tries[record.index] ? 'feedback' : 'say'; }
		const onHidden = () => { if (document.hidden && recorder && recorder.state !== 'inactive') { interrupted = true; recorder.stop(); } };
		document.addEventListener('visibilitychange', onHidden);
		return () => document.removeEventListener('visibilitychange', onHidden);
	});
	onDestroy(() => { alive = false; clearInterval(timer); if (recorder && recorder.state !== 'inactive') { interrupted = true; recorder.stop(); } closeMic(); stopAllAudio(); myPlayer?.pause(); if (myUrl) URL.revokeObjectURL(myUrl); });

	function persist() { onSave?.($state.snapshot(record)); }
	function focusHeading() { queueMicrotask(() => heading?.focus()); }
	function closeMic() { level?.stop(); level = null; stream?.getTracks().forEach(t => t.stop()); stream = null; }
	function clearMine() { myPlayer?.pause(); if (myUrl) URL.revokeObjectURL(myUrl); myUrl = null; }

	async function speak() {
		if (status === 'recording') { recorder?.stop(); return; }
		if (status === 'checking') return;
		stopAllAudio(); myPlayer?.pause();
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { status = 'denied'; return; }
		try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { status = 'denied'; return; }
		const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
		recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64_000 });
		chunks = []; interrupted = false;
		recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
		recorder.onstop = finishRecording;
		level = measureLevel(stream);
		recorder.start();
		startedAt = performance.now(); elapsed = 0; status = 'recording'; announce = '';
		timer = setInterval(() => {
			elapsed = Math.min(SAY_MAX_SECONDS, (performance.now() - startedAt) / 1000);
			// Stops by itself shortly after they finish speaking, or at the time limit.
			const finished = level && level.voiced() > 0.25 && level.voiced() !== Infinity && level.quietFor() >= QUIET_AFTER;
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
		const blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' });
		clearMine(); myUrl = URL.createObjectURL(blob);
		void send(blob, Math.round(seconds));
	}
	async function send(blob: Blob, seconds: number) {
		status = 'checking'; announce = T('Checking…', 'در حال بررسی…');
		const body = new FormData();
		body.set('audio', blob, 'speech'); body.set('seconds', String(seconds)); body.set('item', item.id);
		let data: { transcript?: unknown; feedback?: SayFeedback; error?: string } | null = null, ok = false;
		try {
			const response = await fetch('/api/english/say-in-english', { method: 'POST', body });
			ok = response.ok; data = await response.json().catch(() => null);
		} catch { data = null; }
		if (!alive) return;
		announce = '';
		if (data?.error === 'Nothing heard') { status = 'silent'; return; }
		const transcript = typeof data?.transcript === 'string' ? data.transcript.trim() : '';
		if (!ok || !data?.feedback || !Array.isArray(data.feedback.points)) { status = transcript ? 'aiFailed' : 'failed'; return; }
		const now: SayTry = { transcript, feedback: data.feedback }, before = record.tries[index];
		latest = now; attempts[index] += 1;
		const tries = [...record.tries]; tries[index] = before && RANK[verdictOf(before.feedback)] > RANK[verdictOf(now.feedback)] ? before : now;
		record = { ...record, tries }; persist();
		status = 'feedback';
		queueMicrotask(() => resultLine?.focus());
	}
	function again() { stopAllAudio(); latest = null; status = 'say'; focusHeading(); }
	function showHint() { hint = true; queueMicrotask(() => hintList?.focus()); }
	function next() {
		stopAllAudio(); clearMine(); latest = null;
		const nextIndex = record.index + 1;
		record = { ...record, index: nextIndex, done: nextIndex >= ITEMS.length }; persist();
		hint = false; status = 'say';
		if (nextIndex >= ITEMS.length) stage = 'end';
		focusHeading();
	}
	function start() { stopAllAudio(); stage = 'item'; status = 'say'; focusHeading(); }
	function restart() { stopAllAudio(); clearMine(); latest = null; attempts = ITEMS.map(() => 0); record = emptySayRecord(); persist(); hint = false; stage = 'item'; status = 'say'; focusHeading(); }
	function finish() { stopAllAudio(); closeMic(); onDone(); }

	async function hear(text: string) {
		if (playing) return;
		stopAllAudio(); myPlayer?.pause(); playing = true;
		const { url, playback } = ttsUrl(text, 'en-US', 1, VOICE);
		await playAudioUrl(url, 10_000, playback);
		playing = false;
	}
	function hearMine() { if (!myUrl) return; stopAllAudio(); myPlayer?.pause(); myPlayer = new Audio(myUrl); void myPlayer.play().catch(() => {}); }

	const remaining = $derived(Math.max(0, Math.ceil(SAY_MAX_SECONDS - elapsed)));
	const RANK: Record<Verdict, number> = { clear: 3, almost: 2, different: 1, notEnglish: 0 };
	// Stuck on "Almost" after two tries: moving on becomes the main action.
	const moveOn = $derived(verdict === 'clear' || (verdict === 'almost' && attempts[index] >= 2));
	function hearIntro() { void playAudioPromise(INTRO.en.replace(/’/g, "'"), COACH_RATE, 'en-US', undefined, COACH_VOICE); }
	const missing = $derived(mine ? item.points.filter((_, i) => !mine.feedback.points[i]) : []);
	const markText = (v: Verdict | null) => (v === 'clear' ? T('✓ Clear', '✓ واضح') : v === 'almost' ? T('Almost', 'تقریباً') : v === null ? T('Not tried', 'امتحان نکردی') : T('Not yet', 'هنوز نه'));
	const almostCount = $derived(summary.verdicts.filter(v => v === 'almost').length);
	const ERRORS: Partial<Record<Status, { en: string; fa: string }>> = {
		silent: { en: 'I couldn’t hear you. Hold the phone closer and try again.', fa: 'صدایت را نشنیدم. گوشی را نزدیک‌تر بگیر و دوباره امتحان کن.' },
		short: { en: 'That was very short. Tap the mic, then say the whole message.', fa: 'خیلی کوتاه بود. دکمه را بزن و کل جمله را بگو.' },
		failed: { en: 'That didn’t go through. Check your connection and try again; it didn’t count.', fa: 'ارسال نشد. اتصالت را بررسی کن و دوباره امتحان کن؛ این بار حساب نمی‌شود.' },
		aiFailed: { en: 'I heard you, but couldn’t check it just now. Try again in a moment.', fa: 'صدایت را شنیدم، ولی الان نتوانستم بررسی‌اش کنم. کمی بعد دوباره امتحان کن.' },
		denied: { en: 'The microphone is blocked. Allow it in your browser’s settings for this site.', fa: 'دسترسی به میکروفون بسته است. در تنظیمات مرورگر، برای این سایت اجازه بده.' },
		interrupted: { en: 'The recording stopped when you left the page. Try again.', fa: 'وقتی از صفحه بیرون رفتی ضبط قطع شد. دوباره امتحان کن.' }
	};
</script>

{#snippet q(text: string)}{isFa ? '«' : '“'}<bdi lang="en" dir="ltr">{text}</bdi>{isFa ? '»' : '”'}{/snippet}

<section class="se">
	<p class="sr-only" role="status" aria-live="polite">{announce}</p>

	{#if stage === 'start'}
		<h2 class="sr-only" tabindex="-1" bind:this={heading}>{T('Say it in English', 'به انگلیسی بگو')}</h2>
		<div class="brief"><span class="avatar" aria-hidden="true">M</span><p>{isFa ? INTRO.fa : INTRO.en}</p></div>
		{#if !isFa}<button class="link" type="button" onclick={hearIntro}><span aria-hidden="true">▶</span> Hear Mira say it</button>{/if}
		<ActionBar label={T('Start', 'شروع')} onclick={start} />

	{:else if stage === 'item'}
		<p class="label" aria-hidden="true">{label}</p>
		<div class="dots" aria-hidden="true">{#each ITEMS as _, i}<span class:done={i < index} class:now={i === index}></span>{/each}</div>
		<h2 tabindex="-1" bind:this={heading}><span class="sr-only">{label}: </span>{isFa ? item.to.fa : item.to.en}</h2>
		<p class="message" lang="fa" dir="rtl"><span class="sr-only" lang={isFa ? 'fa' : 'en'}>{T('In Persian: ', 'به فارسی: ')}</span>{item.fa}</p>

		{#if status === 'feedback' && mine && verdict}
			<p class="result" class:ok={verdict === 'clear'} class:almost={verdict === 'almost'} class:neutral={verdict === 'notEnglish'} tabindex="-1" bind:this={resultLine}>
				{#if verdict === 'clear'}<span aria-hidden="true">✓</span> {T('Clear. They’d understand you.', 'واضح بود. منظورت را می‌فهمند.')}
				{:else if verdict === 'almost'}{T('Almost. They wouldn’t know that', 'تقریباً. ولی نمی‌فهمند که')} {#each missing as point, i}{#if i > 0}{T(' or that ', ' و ')}{/if}{isFa ? point.fa : point.en}{/each}.
				{:else if verdict === 'notEnglish'}{T('Say it in English this time.', 'این بار به انگلیسی بگو.')}
				{:else}<span aria-hidden="true">✗</span> {T('Not yet. They wouldn’t understand what you mean.', 'هنوز نه. منظورت را نمی‌فهمند.')}{/if}
			</p>
			{#if verdict !== 'notEnglish'}<p class="said"><span class="small">{T('You said', 'گفتی:')}</span> {@render q(mine.transcript)}</p>{/if}
			<div class="natural">
				<p class="small">{verdict === 'almost' || verdict === 'clear' ? T('A natural way to say it', 'طبیعی‌اش این‌طوری است') : T('You could say it like this', 'می‌توانی این‌طوری بگویی')}</p>
				<p class="better" lang="en" dir="ltr">{#if verdict === 'almost'}{#each betterParts(mine.feedback.better) as part}{#if part.added}<span class="sr-only">{T('(the missing part:) ', '(بخش جاافتاده:) ')}</span><mark>{part.text}</mark>{:else}{part.text}{/if}{/each}{:else}{plain(mine.feedback.better)}{/if}</p>
			</div>
			{#if mine.feedback.tip}<p class="tip">{#if isFa}<MixedText text={mine.feedback.tip.fa} />{:else}{mine.feedback.tip.en}{/if}</p>{/if}
			<div class="links">
				<button class="link" type="button" onclick={() => hear(plain(mine.feedback.better))}><span aria-hidden="true">▶</span> {T('Hear it', 'بشنو')}</button>
				{#if myUrl && verdict !== 'notEnglish'}<button class="link" type="button" onclick={hearMine}><span aria-hidden="true">▶</span> {T('My voice', 'صدای خودم')}</button>{/if}
			</div>
			{#if moveOn}
				<ActionBar label={last ? T('See how you did', 'دیدن نتیجه') : T('Next', 'بعدی')} onclick={next} secondary={{ label: verdict === 'clear' ? T('Say it again', 'دوباره بگو') : T('Try again', 'دوباره امتحان کن'), onclick: again }} />
			{:else}
				<ActionBar label={T('Try again', 'دوباره امتحان کن')} onclick={again} secondary={{ label: last ? T('See how you did', 'دیدن نتیجه') : T('Next', 'بعدی'), onclick: next }} />
			{/if}
		{:else}
			{#if hint}
				<ul class="hints" aria-label={T('Hint', 'راهنما')} tabindex="-1" bind:this={hintList}>
					{#each item.hints as h}<li><bdi lang="en" dir="ltr">{h.en}</bdi> <span class="gloss" lang="fa" dir="rtl">{h.fa}</span></li>{/each}
				</ul>
			{:else if status === 'say'}
				<p class="hint">{T('Say it to them in English.', 'حالا به انگلیسی به او بگو.')}</p>
			{/if}
			{#if status === 'recording'}<p class="listening"><span class="dot" aria-hidden="true"></span>{T('Listening… I’ll stop when you finish.', 'گوش می‌دهم… وقتی تمام کردی، خودم قطع می‌کنم.')}</p>{/if}
			{#if ERRORS[status]}<p class="note" role="alert">{T(ERRORS[status]!.en, ERRORS[status]!.fa)}</p>{/if}
			<ActionBar
				label={status === 'recording' ? T('Stop', 'پایان ضبط') : status === 'checking' ? T('Checking…', 'در حال بررسی…') : T('Say it in English', 'به انگلیسی بگو')}
				suffix={status === 'recording' && remaining <= COUNTDOWN_FROM ? ` · ${N(remaining)}` : ''}
				icon={status === 'checking' ? null : 'mic'} recording={status === 'recording'} onclick={speak}
				secondary={status === 'recording' || status === 'checking' ? null : !hint ? { label: T('Show a hint', 'راهنمایی'), onclick: showHint } : { label: T('Skip this one', 'از این یکی بگذر'), onclick: next }} />
		{/if}

	{:else}
		<h2 class="big" tabindex="-1" bind:this={heading}>{T(`${summary.clear} clear`, `${N(summary.clear)} واضح`)}{almostCount ? T(` · ${almostCount} almost`, ` · ${N(almostCount)} تقریباً`) : ''}<span class="sr-only">{T(` of ${summary.total}`, ` از ${N(summary.total)}`)}</span></h2>
		<ul class="list">
			{#each ITEMS as it, i}
				{@const t = record.tries[i]}
				<li class={summary.verdicts[i] ?? 'none'}>
					<span class="row"><span lang="fa" dir="rtl" class="fa">{it.fa}</span><span class="mark">{markText(summary.verdicts[i])}</span></span>
					<span class="en"><span class="sr-only">{T('In English: ', 'به انگلیسی: ')}</span><span lang="en" dir="ltr">{t ? plain(t.feedback.better) : it.models[0]}</span></span>
				</li>
			{/each}
		</ul>
		<ActionBar label={T('Done', 'تمام شد')} onclick={finish} secondary={{ label: T('Start again', 'دوباره از اول'), onclick: restart }} />
	{/if}
</section>

<style>
	.se { display: grid; gap: 14px; padding-bottom: 136px; }
	.brief { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.brief p { margin: 0; line-height: 1.55; }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.label { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .label { letter-spacing: normal; }
	.dots { display: flex; gap: 4px; }
	.dots span { flex: 1; block-size: 6px; border-radius: 3px; background: var(--paper-sunken); }
	.dots span.done { background: var(--leaf); }
	.dots span.now { background: var(--accent); }
	h2 { margin: 0; font-size: 1rem; font-weight: 600; color: var(--ink-soft); }
	h2:focus { outline: none; }
	.big { font-family: var(--font-display); font-size: clamp(1.6rem, 7vw, 2.1rem); color: var(--accent-deep); font-weight: 700; }
	.message { margin: 0; padding: 18px; border-radius: 20px 20px 20px 6px; background: color-mix(in srgb, var(--accent) 9%, var(--paper)); font-size: clamp(1.3rem, 6vw, 1.6rem); line-height: 1.7; text-align: start; }
	p { margin: 0; line-height: 1.55; }
	.hint, .small { color: var(--ink-soft); }
	.small { font-size: .85rem; font-weight: 600; }
	.result { font-size: 1.15rem; font-weight: 700; color: var(--attention); }
	.result.ok { color: var(--leaf-deep); }
	.result.almost { color: var(--accent-deep); }
	.result.neutral { color: var(--ink); }
	.listening { display: flex; align-items: center; gap: 8px; color: var(--attention); font-weight: 600; }
	.dot { inline-size: 10px; block-size: 10px; border-radius: 50%; background: currentColor; animation: pulse 1.2s infinite ease-in-out; }
	@keyframes pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
	@media (prefers-reduced-motion: reduce) { .dot { animation: none; } }
	.result:focus { outline: none; }
	.said { color: var(--ink-soft); }
	.natural { display: grid; gap: 4px; padding: 12px 14px; border-radius: 14px; background: var(--paper-raised); border: 1px solid var(--line); }
	.better { font-size: 1.1rem; font-weight: 600; }
	mark { background: color-mix(in srgb, var(--accent) 18%, transparent); color: inherit; border-radius: 4px; padding: 0 2px; text-decoration: underline 2px var(--accent); text-underline-offset: 4px; }
	.tip { padding-inline-start: 10px; border-inline-start: 3px solid var(--accent); }
	.note { color: var(--attention); }
	.hints { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
	.hints:focus { outline: none; }
	.hints li { font-weight: 600; }
	.gloss { font-weight: 400; color: var(--ink-soft); }
	.links { display: flex; gap: 20px; }
	.link { min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
	.list li { display: grid; gap: 4px; padding: 10px 14px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); }
	.list li.different, .list li.notEnglish { border-color: var(--attention); }
	.row { display: flex; justify-content: space-between; gap: 10px; font-weight: 600; }
	.mark { flex: none; font-size: .9rem; color: var(--ink-soft); }
	.list li.clear .mark { color: var(--leaf-deep); }
	.list li.almost .mark { color: var(--accent-deep); }
	.list .en { color: var(--ink-soft); }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
</style>
