<script lang="ts">
	/**
	 * "Voice messages", Module lab (docs/english-voice-messages-spec.md, owner-approved in chat).
	 * A voice message arrives from a friend, a colleague, a landlord or a clinic. The learner
	 * listens (as often as they like; the words can be shown), then replies with a voice message.
	 * One AI call checks whether the reply answers what was asked. Recordings are never stored.
	 */
	import { onDestroy, onMount } from 'svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import MixedText from '$lib/components/MixedText.svelte';
	import { playAudioUrl, stopAllAudio, ttsUrl } from '$services/tts';
	import { SILENT_BELOW, measureLevel, type MicLevel } from '$utils/mic-level';
	import { betterParts, plain } from '$lib/practice/say-in-english';
	import {
		MESSAGES as DEFAULT_MESSAGES, RANK, REPLY_MAX_SECONDS, REPLY_MIN_SECONDS, REPLY_VOICE, emptyVoiceRecord, summarize, verdictOf,
		type ReplyFeedback, type ReplyTry, type ReplyVerdict, type VoiceMessage, type VoiceRecord
	} from '$lib/practice/voice-messages';
	import type { DisplayText } from '$lib/practice/hotel';

	let { isFa = false, messages = DEFAULT_MESSAGES, intro = null, initial = null, onSave, onFocus, onSkip, onDone }: {
		isFa?: boolean;
		/** The day's messages (Day 1's by default). */
		messages?: VoiceMessage[];
		/** The day's own introduction (Day 1's by default); not shown in the daily lesson, where Mira's is. */
		intro?: DisplayText | null;
		initial?: VoiceRecord | null;
		onSave?: (record: VoiceRecord) => void;
		/** The daily lesson: Mira's intro shows on the start screen only. */
		onFocus?: (mode: 'full' | 'compact' | 'hidden') => void;
		/** "Skip this step" on the start screen (the daily lesson). */
		onSkip?: () => void;
		/** How many replies answered everything, out of all. */
		onDone: (score: { correct: number; total: number }, record: VoiceRecord) => void;
	} = $props();
	// svelte-ignore state_referenced_locally
	const MESSAGES = messages;

	const DAY_ONE_INTRO = {
		en: 'You’ll get four voice messages, like on WhatsApp or Telegram: from a friend, a colleague, your landlord and a clinic. Listen, then reply with a voice message. Make sure you answer their questions.',
		fa: 'چهار پیام صوتی می‌گیری، مثل واتس‌اپ یا تلگرام: از یک دوست، یک همکار، صاحبخانه‌ات و یک درمانگاه. گوش بده، بعد با یک پیام صوتی جواب بده. حواست باشد به سؤال‌هایشان جواب بدهی.'
	};
	/** The reply has ended once it has been quiet this long after some speech. */
	const QUIET_AFTER = 4;
	const COUNTDOWN_FROM = 5;
	/** Decorative bars for the voice-message bubble. */
	const BARS = [3, 6, 9, 5, 11, 7, 4, 8, 12, 6, 9, 5, 7, 10, 4, 8, 6, 11, 5, 7, 9, 4, 6, 8];

	type Status = 'say' | 'recording' | 'checking' | 'feedback' | 'silent' | 'short' | 'failed' | 'aiFailed' | 'denied' | 'interrupted';
	// svelte-ignore state_referenced_locally
	let record = $state<VoiceRecord>(initial ?? emptyVoiceRecord(messages));
	// svelte-ignore state_referenced_locally
	const INTRO = intro ?? DAY_ONE_INTRO;
	let stage = $state<'start' | 'message' | 'end'>('start');
	let status = $state<Status>('say'), elapsed = $state(0), words = $state(false), announce = $state('');
	let playingAt = $state(-1), playFailed = $state(false), hearing = $state(false);
	let latest = $state<ReplyTry | null>(null), attempts = $state<number[]>(MESSAGES.map(() => 0));
	let heading: HTMLElement | undefined = $state(), resultLine: HTMLElement | undefined = $state();
	let recorder: MediaRecorder | null = null, stream: MediaStream | null = null, chunks: Blob[] = [], level: MicLevel | null = null;
	let startedAt = 0, timer: ReturnType<typeof setInterval> | undefined, interrupted = false, cancelled = false, run = 0, alive = true;
	let myUrl = $state<string | null>(null), myPlayer: HTMLAudioElement | null = null, minePlaying = $state(false);

	const T = (en: string, fa: string) => (isFa ? fa : en);
	const N = (n: number) => (isFa ? n.toLocaleString('fa-IR') : String(n));
	const index = $derived(Math.min(record.index, MESSAGES.length - 1));
	const message = $derived(MESSAGES[index]);
	const listened = $derived(record.listened[index]);
	const mine = $derived(latest ?? record.tries[index]);
	const verdict = $derived<ReplyVerdict | null>(mine ? verdictOf(mine.feedback) : null);
	const last = $derived(index + 1 >= MESSAGES.length);
	const summary = $derived(summarize(record));
	const label = $derived(T(`Message ${index + 1} of ${MESSAGES.length}`, `پیام ${N(index + 1)} از ${N(MESSAGES.length)}`));
	const playing = $derived(playingAt >= 0);
	const progress = $derived(playing ? (playingAt + 1) / message.sentences.length : listened ? 1 : 0);
	const missed = $derived(mine ? message.asks.filter((_, i) => !mine.feedback.answered[i]) : []);
	// Moving on becomes the main action after a good reply, a second Almost, or a third try.
	const moveOn = $derived(verdict === 'answered' || (verdict === 'almost' && attempts[index] >= 2) || attempts[index] >= 3);
	/** They can reply once they've heard it all, read it, or it couldn't play. */
	const canReply = $derived(listened || words || playFailed);
	const remaining = $derived(Math.max(0, Math.ceil(REPLY_MAX_SECONDS - elapsed)));
	const clean = (text: string) => text.replace(/[’‘]/g, "'");

	onMount(() => {
		// A reload returns to the same message (with its feedback, if there was one).
		if (record.done || record.index >= MESSAGES.length) stage = 'end';
		else if (record.index > 0 || record.listened[0]) { stage = 'message'; status = record.tries[record.index] ? 'feedback' : 'say'; prefetch(record.index); }
		if (stage !== 'start') onFocus?.('hidden');
		const onHidden = () => { if (document.hidden && recorder && recorder.state !== 'inactive') { interrupted = true; recorder.stop(); } };
		document.addEventListener('visibilitychange', onHidden);
		return () => document.removeEventListener('visibilitychange', onHidden);
	});
	onDestroy(() => { alive = false; run++; clearInterval(timer); if (recorder && recorder.state !== 'inactive') { interrupted = true; recorder.stop(); } closeMic(); stopAllAudio(); myPlayer?.pause(); if (myUrl) URL.revokeObjectURL(myUrl); });

	function persist() { onSave?.($state.snapshot(record)); }
	function focusHeading() { queueMicrotask(() => heading?.focus()); }
	function closeMic() { level?.stop(); level = null; stream?.getTracks().forEach(t => t.stop()); stream = null; }
	function clearMine() { myPlayer?.pause(); minePlaying = false; if (myUrl) URL.revokeObjectURL(myUrl); myUrl = null; }
	/** The message's audio, fetched ahead so it starts quickly. */
	function prefetch(i: number) { const m = MESSAGES[i]; if (m) for (const s of m.sentences) void fetch(ttsUrl(clean(s), 'en-US', 1, m.from.voice).url).catch(() => {}); }
	function stopPlaying() { run++; stopAllAudio(); playingAt = -1; }

	/** The voice message, one sentence after another; tapping again stops it. */
	async function playMessage() {
		if (playing) { stopPlaying(); return; }
		if (status === 'recording' || status === 'checking') return;
		stopAllAudio(); myPlayer?.pause(); minePlaying = false; playFailed = false; announce = '';
		const token = ++run, at = index;
		for (let i = 0; i < message.sentences.length; i++) {
			playingAt = i;
			const { url, playback } = ttsUrl(clean(message.sentences[i]), 'en-US', 1, message.from.voice);
			let started = false;
			await playAudioUrl(url, 15_000, playback, () => { started = true; });
			if (token !== run || !alive) return;
			if (!started) { playFailed = true; playingAt = -1; return; }
		}
		playingAt = -1;
		if (!record.listened[at]) {
			const heard = [...record.listened]; heard[at] = true;
			record = { ...record, listened: heard }; persist();
			announce = T('Now reply with a voice message.', 'حالا با یک پیام صوتی جواب بده.');
		}
	}

	async function reply() {
		if (status === 'recording') { recorder?.stop(); return; }
		if (status === 'checking') return;
		stopPlaying(); myPlayer?.pause(); minePlaying = false;
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { status = 'denied'; return; }
		try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { status = 'denied'; return; }
		const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
		recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64_000 });
		chunks = []; interrupted = false; cancelled = false;
		recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
		recorder.onstop = finishRecording;
		level = measureLevel(stream);
		recorder.start();
		startedAt = performance.now(); elapsed = 0; status = 'recording'; latest = null;
		timer = setInterval(() => {
			elapsed = Math.min(REPLY_MAX_SECONDS, (performance.now() - startedAt) / 1000);
			// Stops by itself a few seconds after they finish speaking, or at the time limit.
			// Waits for a real reply first (a pause after "Hi Sara…" to think doesn't send it).
			const voiced = level?.voiced() ?? 0;
			const finished = voiced !== Infinity && ((voiced >= 1.5 && level!.quietFor() >= QUIET_AFTER) || (voiced > 0.25 && level!.quietFor() >= QUIET_AFTER * 2));
			if ((elapsed >= REPLY_MAX_SECONDS || finished) && recorder?.state === 'recording') recorder.stop();
		}, 100);
	}
	function finishRecording() {
		clearInterval(timer);
		const peak = level?.peak() ?? 1;
		closeMic();
		if (!alive) return;
		const seconds = (performance.now() - startedAt) / 1000;
		if (cancelled) { status = 'say'; return; }
		if (interrupted) { status = 'interrupted'; return; }
		if (seconds < REPLY_MIN_SECONDS) { status = 'short'; return; }
		if (peak < SILENT_BELOW) { status = 'silent'; return; }
		const blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' });
		clearMine(); myUrl = URL.createObjectURL(blob);
		void send(blob, Math.round(seconds));
	}
	async function send(blob: Blob, seconds: number) {
		status = 'checking'; announce = T('Checking your reply…', 'در حال بررسی جوابت…');
		const body = new FormData();
		body.set('audio', blob, 'reply'); body.set('seconds', String(seconds)); body.set('message', message.id);
		let data: { transcript?: unknown; feedback?: ReplyFeedback; error?: string } | null = null, ok = false;
		try {
			const response = await fetch('/api/english/voice-messages', { method: 'POST', body });
			ok = response.ok; data = await response.json().catch(() => null);
		} catch { data = null; }
		if (!alive) return;
		announce = '';
		if (data?.error === 'Nothing heard') { status = 'silent'; return; }
		const transcript = typeof data?.transcript === 'string' ? data.transcript.trim() : '';
		if (!ok || !data?.feedback || !Array.isArray(data.feedback.answered)) { status = transcript ? 'aiFailed' : 'failed'; return; }
		const now: ReplyTry = { transcript, feedback: data.feedback }, before = record.tries[index];
		latest = now; attempts[index] += 1; words = false;
		const tries = [...record.tries]; tries[index] = before && RANK[verdictOf(before.feedback)] > RANK[verdictOf(now.feedback)] ? before : now;
		record = { ...record, tries }; persist();
		status = 'feedback';
		queueMicrotask(() => resultLine?.focus());
	}
	function again() { stopPlaying(); latest = null; status = 'say'; focusHeading(); }
	function cancelRecording() { cancelled = true; if (recorder?.state === 'recording') recorder.stop(); }
	function next() {
		stopPlaying(); clearMine(); latest = null;
		const nextIndex = record.index + 1;
		record = { ...record, index: nextIndex, done: nextIndex >= MESSAGES.length }; persist();
		words = false; status = 'say';
		if (nextIndex >= MESSAGES.length) stage = 'end'; else prefetch(nextIndex + 1);
		focusHeading();
	}
	function start() { stopAllAudio(); stage = 'message'; status = 'say'; onFocus?.('hidden'); prefetch(0); prefetch(1); focusHeading(); }
	function restart() { stopPlaying(); clearMine(); latest = null; attempts = MESSAGES.map(() => 0); record = emptyVoiceRecord(messages); persist(); words = false; stage = 'message'; status = 'say'; focusHeading(); }
	function finish() { stopPlaying(); closeMic(); onDone({ correct: summary.answered, total: summary.total }, $state.snapshot(record)); }

	async function hear(text: string) {
		if (hearing) return;
		stopPlaying(); myPlayer?.pause(); minePlaying = false; hearing = true;
		const { url, playback } = ttsUrl(clean(text), 'en-US', 1, REPLY_VOICE);
		await playAudioUrl(url, 15_000, playback);
		hearing = false;
	}
	function hearMine() {
		if (!myUrl) return;
		if (minePlaying) { myPlayer?.pause(); minePlaying = false; return; }
		stopPlaying(); myPlayer?.pause();
		myPlayer = new Audio(myUrl); minePlaying = true;
		myPlayer.onended = () => (minePlaying = false);
		void myPlayer.play().catch(() => (minePlaying = false));
	}

	const markText = (v: ReplyVerdict | null) => (v === 'answered' ? T('✓ Answered', '✓ جواب دادی') : v === 'almost' ? T('Almost', 'تقریباً') : v === null ? T('Not tried', 'امتحان نکردی') : T('Not yet', 'هنوز نه'));
	const ERRORS: Partial<Record<Status, { en: string; fa: string }>> = {
		silent: { en: 'I couldn’t hear you. Hold the phone closer and try again.', fa: 'صدایت را نشنیدم. گوشی را نزدیک‌تر بگیر و دوباره امتحان کن.' },
		short: { en: 'That was very short. Tap the mic, then say your whole reply.', fa: 'خیلی کوتاه بود. دکمه را بزن و کل جوابت را بگو.' },
		failed: { en: 'That didn’t send. Check your internet and try again.', fa: 'ارسال نشد. اینترنتت را بررسی کن و دوباره امتحان کن.' },
		aiFailed: { en: 'I heard you, but couldn’t check it just now. Try again in a moment.', fa: 'صدایت را شنیدم، ولی الان نتوانستم بررسی‌اش کنم. کمی بعد دوباره امتحان کن.' },
		denied: { en: 'The microphone is blocked. Allow it in your browser’s settings for this site.', fa: 'دسترسی به میکروفون بسته است. در تنظیمات مرورگر، برای این سایت اجازه بده.' },
		interrupted: { en: 'The recording stopped when you left the page. Try again.', fa: 'وقتی از صفحه بیرون رفتی ضبط قطع شد. دوباره امتحان کن.' }
	};
</script>

{#snippet q(text: string)}{isFa ? '«' : '“'}<bdi lang="en" dir="ltr">{text}</bdi>{isFa ? '»' : '”'}{/snippet}
{#snippet wave(fill: number)}
	<span class="wave" aria-hidden="true" dir="ltr">{#each BARS as h, i}<span class:on={i < Math.round(fill * BARS.length)} style:block-size="{h * 2}px"></span>{/each}</span>
{/snippet}

<section class="vm">
	<p class="sr-only" role="status" aria-live="polite">{announce}</p>

	{#if stage === 'start'}
		<h2 class="sr-only" tabindex="-1" bind:this={heading}>{T('Voice messages', 'پیام صوتی')}</h2>
		{#if !onSkip}<div class="brief"><span class="avatar" aria-hidden="true">M</span><p>{isFa ? INTRO.fa : INTRO.en}</p></div>{/if}
		<ActionBar label={T('Start', 'شروع')} onclick={start} secondary={onSkip ? { label: T('Skip this step', 'این مرحله را رد کن'), onclick: () => { stopAllAudio(); onSkip?.(); } } : undefined} />

	{:else if stage === 'message'}
		<p class="label" aria-hidden="true">{label}</p>
		<div class="dots" aria-hidden="true">{#each MESSAGES as _, i}<span class:done={i < index} class:now={i === index}></span>{/each}</div>
		<h2 class="from" tabindex="-1" bind:this={heading}>
			<span class="sr-only">{label}: </span>
			<span class="face" aria-hidden="true">{message.from.name[0]}</span>
			<span><span class="name" lang="en" dir="ltr">{message.from.name}</span><span class="who">{isFa ? message.from.who.fa : message.from.who.en}</span></span>
		</h2>

		<div class="chat">
			<div class="bubble theirs">
				<button class="play" type="button" onclick={playMessage} disabled={status === 'recording' || status === 'checking'} aria-label={playing ? T('Stop the message', 'توقف پیام') : T(`Play ${message.from.name}’s voice message`, `پخش پیام صوتی ${message.from.name}`)}>
					{#if playing}<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></svg>
					{:else}<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>{/if}
				</button>
				{@render wave(progress)}
			</div>
			{#if words}<p class="words" lang="en" dir="ltr">{message.sentences.join(' ')}</p>{/if}

			{#if status === 'recording'}
				<div class="bubble yours recording"><span class="dot" aria-hidden="true"></span><span>{T('Recording… I’ll stop when you finish.', 'در حال ضبط… وقتی تمام کردی، خودم قطع می‌کنم.')}</span></div>
			{:else if myUrl && (status === 'checking' || status === 'feedback' || status === 'aiFailed')}
				<div class="bubble yours">
					<button class="play" type="button" onclick={hearMine} aria-label={minePlaying ? T('Stop my reply', 'توقف جوابم') : T('Play my reply', 'پخش جوابم')}>
						{#if minePlaying}<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></svg>
						{:else}<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>{/if}
					</button>
					{@render wave(1)}
				</div>
				{#if mine && status === 'feedback' && verdict !== 'notEnglish'}<p class="said"><span class="small">{T('You said', 'گفتی:')}</span> {@render q(mine.transcript)}</p>{/if}
			{/if}
		</div>

		{#if status === 'feedback' && mine && verdict}
			<div class="feedback">
				<p class="result" class:ok={verdict === 'answered'} class:almost={verdict === 'almost'} class:neutral={verdict === 'notEnglish'} tabindex="-1" bind:this={resultLine}>
					{#if verdict === 'answered'}<span aria-hidden="true">✓</span> {T('Good reply. You answered everything.', 'خوب بود. به همهٔ سؤال‌ها جواب دادی.')}
					{:else if verdict === 'almost'}{T('Almost.', 'تقریباً.')} {#each missed as m, i}{#if i > 0}{' '}{/if}{isFa ? m.missed.fa : m.missed.en}{/each}
					{:else if verdict === 'notEnglish'}{T('Reply in English this time.', 'این بار به انگلیسی جواب بده.')}
					{:else}<span aria-hidden="true">✗</span> {T('Not yet. Listen again, then answer their questions.', 'هنوز نه. دوباره گوش بده، بعد به سؤال‌هایشان جواب بده.')}{/if}
				</p>
				{#if verdict === 'notYet' || verdict === 'notEnglish'}
					<div class="asked">
						<p class="small"><bdi lang="en" dir="ltr">{message.from.name}</bdi> {T('asked:', 'پرسید:')}</p>
						<ul>{#each message.asks as a}<li>{isFa ? a.ask.fa : a.ask.en}</li>{/each}</ul>
					</div>
				{/if}
				<div class="natural">
					<p class="small">{verdict === 'notYet' || verdict === 'notEnglish' ? T('You could reply like this', 'می‌توانی این‌طوری جواب بدهی') : mine.feedback.fromModel ? T('Another way to reply', 'یک جور دیگر هم می‌شود جواب داد') : T('A natural reply', 'یک جواب طبیعی')}</p>
					<p class="better" lang="en" dir="ltr">{#if verdict === 'almost' && !mine.feedback.fromModel}{#each betterParts(mine.feedback.better) as part}{#if part.added}<span class="sr-only">{T('(the missing answer:) ', '(جواب جاافتاده:) ')}</span><mark>{part.text}</mark>{:else}{part.text}{/if}{/each}{:else}{plain(mine.feedback.better)}{/if}</p>
				</div>
				{#if mine.feedback.tip}<p class="tip">{#if isFa}<MixedText text={mine.feedback.tip.fa} />{:else}{mine.feedback.tip.en}{/if}</p>{/if}
				<button class="link" type="button" onclick={() => hear(plain(mine.feedback.better))}><span aria-hidden="true">▶</span> {T('Hear it', 'بشنو')}</button>
			</div>
			{#if moveOn}
				<ActionBar label={last ? T('See how you did', 'دیدن نتیجه') : T('Next message', 'پیام بعدی')} onclick={next} secondary={{ label: verdict === 'answered' ? T('Reply again', 'دوباره جواب بده') : T('Try again', 'دوباره امتحان کن'), onclick: again }} />
			{:else}
				<ActionBar label={T('Try again', 'دوباره امتحان کن')} onclick={again} secondary={{ label: last ? T('See how you did', 'دیدن نتیجه') : T('Next message', 'پیام بعدی'), onclick: next }} />
			{/if}
		{:else}
			{#if playFailed}<p class="note" role="alert">{T('Couldn’t play the message. Try again, or show the words.', 'پیام پخش نشد. دوباره امتحان کن، یا متنش را ببین.')}</p>
			{:else if !canReply && !playing}<p class="hint"><bdi lang="en" dir="ltr">{message.from.name}</bdi> {T('sent you a voice message. Listen to it first.', 'برایت پیام صوتی فرستاده. اول گوش بده.')}</p>
			{:else if canReply && status === 'say'}<p class="hint">{T('Reply with a voice message, up to 45 seconds. I’ll stop when you finish. You can listen again first.', 'با پیام صوتی جواب بده، تا ۴۵ ثانیه. وقتی تمام کردی، خودم قطع می‌کنم. اگر خواستی، اول دوباره گوش بده.')}</p>{/if}
			{#if ERRORS[status]}<p class="note" role="alert">{T(ERRORS[status]!.en, ERRORS[status]!.fa)}</p>{/if}
			<!-- One bar whose props change, so keyboard focus stays on its button. -->
			<ActionBar
				label={!canReply ? (playing ? T('Stop', 'توقف') : T('Play the message', 'پخش پیام')) : status === 'recording' ? T('Send', 'ارسال') : status === 'checking' ? T('Checking…', 'در حال بررسی…') : T('Record your reply', 'جوابت را ضبط کن')}
				suffix={status === 'recording' && remaining <= COUNTDOWN_FROM ? ` · ${N(remaining)}` : ''}
				icon={!canReply ? (playing ? 'stop' : 'play') : status === 'recording' ? 'send' : status === 'checking' ? null : 'mic'}
				recording={status === 'recording'} onclick={canReply ? reply : playMessage}
				secondary={!canReply ? (playing ? null : { label: T('Can’t listen now? Read it', 'نمی‌توانی گوش بدهی؟ متنش را بخوان'), onclick: () => (words = true) })
					: status === 'recording' ? { label: T('Cancel', 'لغو'), onclick: cancelRecording }
					: status === 'checking' ? null
					: ERRORS[status] ? { label: last ? T('Skip to the end', 'رفتن به پایان') : T('Skip this message', 'از این پیام بگذر'), onclick: next }
					: { label: words ? T('Hide the words', 'پنهان کردن متن') : T('Show the words', 'نمایش متن'), onclick: () => (words = !words) }} />
		{/if}

	{:else}
		<h2 class="big" tabindex="-1" bind:this={heading}>{T(`${summary.answered} answered`, `${N(summary.answered)} جواب کامل`)}{summary.almost ? T(` · ${summary.almost} almost`, ` · ${N(summary.almost)} تقریباً`) : ''}<span class="sr-only">{T(` of ${summary.total}`, ` از ${N(summary.total)}`)}</span></h2>
		<ul class="list">
			{#each MESSAGES as m, i}
				{@const t = record.tries[i]}
				<li class={summary.verdicts[i] ?? 'none'}>
					<span class="row"><span><span lang="en" dir="ltr">{m.from.name}</span> · {isFa ? m.from.who.fa : m.from.who.en}</span><span class="mark">{markText(summary.verdicts[i])}</span></span>
					<span class="en"><span class="sr-only">{T('A natural reply: ', 'یک جواب طبیعی: ')}</span><span lang="en" dir="ltr">{t ? plain(t.feedback.better) : m.model}</span></span>
				</li>
			{/each}
		</ul>
		<ActionBar label={T('Done', 'تمام شد')} onclick={finish} secondary={{ label: T('Start again', 'دوباره از اول'), onclick: restart }} />
	{/if}
</section>

<style>
	.vm { display: grid; gap: 14px; padding-bottom: 136px; }
	.brief { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.brief p { margin: 0; line-height: 1.55; }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.label { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .label { letter-spacing: normal; }
	.dots { display: flex; gap: 4px; }
	.dots span { flex: 1; block-size: 6px; border-radius: 3px; background: var(--paper-sunken); }
	.dots span.done { background: var(--leaf); }
	.dots span.now { background: var(--accent); }
	h2 { margin: 0; }
	h2:focus { outline: none; }
	.from { display: flex; align-items: center; gap: 12px; font-size: 1rem; font-weight: 600; }
	.face { display: grid; place-items: center; flex: none; inline-size: 44px; block-size: 44px; border-radius: 50%; background: var(--paper-sunken); color: var(--ink); font-family: var(--font-display); font-size: 1.2rem; }
	.name { display: block; font-size: 1.1rem; }
	.who { display: block; font-size: .85rem; font-weight: 400; color: var(--ink-soft); }
	.big { font-family: var(--font-display); font-size: clamp(1.6rem, 7vw, 2.1rem); color: var(--accent-deep); }
	.chat { display: grid; gap: 10px; padding: 14px; border-radius: 18px; background: var(--paper-sunken); }
	.bubble { display: flex; align-items: center; gap: 10px; max-inline-size: 86%; padding: 8px 14px 8px 8px; border-radius: 18px; }
	.theirs { justify-self: start; background: var(--paper-raised); border-end-start-radius: 6px; }
	.yours { justify-self: end; background: color-mix(in srgb, var(--leaf) 22%, var(--paper-raised)); border-end-end-radius: 6px; }
	.yours.recording { padding: 12px 16px; color: var(--ink); font-weight: 600; }
	.yours.recording .dot { color: var(--attention); }
	.play { display: grid; place-items: center; flex: none; inline-size: 44px; block-size: 44px; border: 0; border-radius: 50%; background: var(--accent); color: var(--on-accent); cursor: pointer; }
	.play:disabled { opacity: .5; cursor: default; }
	.wave { display: flex; align-items: center; gap: 3px; block-size: 28px; }
	.wave span { inline-size: 3px; border-radius: 2px; background: var(--ink-soft); opacity: .35; }
	.wave span.on { background: var(--accent-deep); opacity: 1; }
	.words { margin: 0; padding: 10px 12px; border-radius: 12px; background: var(--paper-raised); font-size: .95rem; line-height: 1.55; }
	p { margin: 0; line-height: 1.55; }
	.hint, .small, .said { color: var(--ink-soft); }
	.said { justify-self: end; text-align: end; font-size: .9rem; }
	.small { font-size: .85rem; font-weight: 600; }
	.feedback { display: grid; gap: 10px; }
	.asked { display: grid; gap: 4px; }
	.asked ul { margin: 0; padding-inline-start: 20px; display: grid; gap: 2px; font-weight: 600; }
	.result { font-size: 1.1rem; font-weight: 700; color: var(--attention); }
	.result.ok { color: var(--leaf-deep); }
	.result.almost { color: var(--accent-deep); }
	.result.neutral { color: var(--ink); }
	.result:focus { outline: none; }
	.natural { display: grid; gap: 4px; padding: 12px 14px; border-radius: 14px; background: var(--paper-raised); border: 1px solid var(--line); }
	.better { font-size: 1.05rem; font-weight: 600; }
	mark { background: color-mix(in srgb, var(--accent) 18%, transparent); color: inherit; border-radius: 4px; padding: 0 2px; text-decoration: underline 2px var(--accent); text-underline-offset: 4px; }
	.tip { padding-inline-start: 10px; border-inline-start: 3px solid var(--accent); }
	.note { color: var(--attention); }
	.dot { inline-size: 10px; block-size: 10px; border-radius: 50%; background: currentColor; animation: pulse 1.2s infinite ease-in-out; }
	@keyframes pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
	.list li { display: grid; gap: 4px; padding: 10px 14px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); }
	.list li.notYet, .list li.notEnglish { border-color: var(--attention); }
	.row { display: flex; justify-content: space-between; gap: 10px; font-weight: 600; }
	.mark { flex: none; font-size: .9rem; color: var(--ink-soft); }
	.list li.answered .mark { color: var(--leaf-deep); }
	.list li.almost .mark { color: var(--accent-deep); }
	.list .en { color: var(--ink-soft); }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	@media (prefers-reduced-motion: reduce) { .dot { animation: none; } }
</style>
