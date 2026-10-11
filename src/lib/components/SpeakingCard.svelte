<script lang="ts">
	/**
	 * "Speaking card" (docs/english-speaking-card-spec.md, owner-approved v2).
	 * Card and preparing (one layout) → talk (up to 2:00) → what you covered → making it easier to
	 * follow (one phrase) → your talk, said better. One talk, so nothing is judged twice. Long-turn
	 * skills only, never grammar. The run is kept in this browser; the recording is never stored.
	 */
	import { onDestroy, onMount } from 'svelte';
	import { playAudioPromise, stopAllAudio, ttsIsPlaying } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { SILENT_BELOW, measureLevel, type MicLevel } from '$utils/mic-level';
	import {
		CARDS, MIN_VOICED_SECONDS, PAUSE_FROM, PAUSE_UNTIL, PREP_SECONDS, STUCK_AFTER_SECONDS, TALK_MAX_SECONDS, TALK_MIN_SECONDS, TALK_TARGET_SECONDS,
		cardById, clock, emptyCardRecord, phraseById,
		type CardFeedback, type CardRecord, type CardStep, type Coverage, type Talk
	} from '$lib/practice/speaking-card';

	let { isFa = false, initial = null, first = false, onSave, onDone }: {
		isFa?: boolean;
		initial?: CardRecord | null;
		/** A fresh visit: Mira says the instruction as the page opens. */
		first?: boolean;
		onSave?: (record: CardRecord) => void;
		onDone: () => void;
	} = $props();

	const INSTRUCTION = {
		en: 'Here’s your topic. You’ve got a minute to think first. Then talk for one to two minutes, and try to cover all four points.',
		fa: 'این موضوع توست. اول یک دقیقه وقت داری فکر کنی. بعد یک تا دو دقیقه صحبت کن و سعی کن هر چهار نکته را بگویی.'
	};
	const NEXT_LINE = { en: 'Here’s your next topic.', fa: 'این موضوع بعدی توست.' };

	type Stage = CardStep | 'talk' | 'short' | 'quiet' | 'interrupted' | 'denied' | 'processing' | 'failed' | 'offtopic' | 'notenglish';
	// svelte-ignore state_referenced_locally
	let record = $state<CardRecord>(initial ?? emptyCardRecord(1));
	let stage = $state<Stage>('card');
	let fullIntro = $state(true), showFa = $state(false), showNotes = $state(false), reloadNote = $state(false);
	let now = $state(Date.now()), toneDone = $state(false);
	let elapsed = $state(0), paused = $state(false), askedToContinue = $state(false), stuck = $state(false);
	let announce = $state(''), note = $state<'listening' | 'thinking'>('listening'), failedAt = $state<'transcribe' | 'coverage' | 'feedback'>('transcribe');
	let recorder: MediaRecorder | null = null, stream: MediaStream | null = null, chunks: Blob[] = [], blob: Blob | null = null;
	let level: MicLevel | null = null, audio: AudioContext | null = null;
	let ranFor = 0, segmentStart = 0, timer: ReturnType<typeof setInterval> | undefined, clockTimer: ReturnType<typeof setInterval> | undefined;
	let interrupted = false, cutOff = false, said1min = false, said15 = false;
	let heading: HTMLElement | undefined = $state(), stopButton: HTMLButtonElement | undefined = $state();
	const playing = $derived($ttsIsPlaying);
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const card = $derived(cardById(record.card) ?? CARDS[0]);
	const prepLeft = $derived(record.prepStartedAt === null ? null : Math.max(0, PREP_SECONDS - Math.floor((now - record.prepStartedAt) / 1000)));
	const phrase = $derived(record.feedback ? phraseById(record.feedback.phrase) : null);

	onMount(() => {
		// A reload returns to the step it left. A finished AI call is never repeated; an unfinished one runs again.
		if (record.feedback) stage = record.step === 'card' ? 'better' : record.step;
		else if (record.talk1 && record.coverage1) void getFeedback();
		else if (record.talk1) void judgeFirst();
		else if (first) say(INSTRUCTION.en);
		if (record.talking) { reloadNote = true; record = { ...record, talking: false }; persist(); }
		clockTimer = setInterval(() => {
			now = Date.now();
			if (prepLeft === 0 && !toneDone && stage !== 'talk') { toneDone = true; beep(); }
		}, 250);
		document.addEventListener('visibilitychange', onHidden);
		return () => document.removeEventListener('visibilitychange', onHidden);
	});
	onDestroy(() => {
		clearInterval(timer); clearInterval(clockTimer); level?.stop();
		if (recorder && recorder.state !== 'inactive') recorder.stop();
		stream?.getTracks().forEach(t => t.stop());
		void audio?.close().catch(() => {});
	});

	function persist() { onSave?.($state.snapshot(record)); }
	const STEPS: CardStep[] = ['card', 'covered', 'follow', 'better'];
	function go(next: Stage) {
		stage = next;
		if ((STEPS as string[]).includes(next) && record.step !== next) { record = { ...record, step: next as CardStep }; persist(); }
		queueMicrotask(() => heading?.focus());
	}
	function say(line: string) { stopAllAudio(); void playAudioPromise(line.replace(/[’…]/g, m => (m === '’' ? "'" : '')), COACH_RATE, 'en-US', undefined, COACH_VOICE); }
	function hear(line: string) { if (playing) stopAllAudio(); else say(line); }
	function onHidden() {
		if (!document.hidden) return;
		if (recorder && recorder.state !== 'inactive') { interrupted = true; recorder.stop(); }
	}
	/** A soft tone when the minute is up (audio was unlocked by the "Start preparing" tap; never while recording). */
	function beep() {
		if (!audio || stage === 'talk') return;
		try {
			const osc = audio.createOscillator(), gain = audio.createGain();
			osc.frequency.value = 660; gain.gain.setValueAtTime(0.0001, audio.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.15, audio.currentTime + 0.03); gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + 0.5);
			osc.connect(gain).connect(audio.destination); osc.start(); osc.stop(audio.currentTime + 0.55);
		} catch { /* the button label is the cue anyway */ }
	}

	// 1. Card and preparing
	async function startPreparing() {
		stopAllAudio();
		try { audio ??= new AudioContext(); void audio.resume(); } catch { audio = null; }
		// Ask for the microphone now, so the permission prompt never eats talking time.
		try { const s = await navigator.mediaDevices?.getUserMedia({ audio: true }); s?.getTracks().forEach(t => t.stop()); } catch { /* asked again on Start talking */ }
		toneDone = false;
		record = { ...record, prepStartedAt: Date.now() }; persist();
	}
	function anotherCard() {
		stopAllAudio();
		const next = (record.card % CARDS.length) + 1;
		record = emptyCardRecord(next); persist();
		fullIntro = false; showNotes = false; reloadNote = false; toneDone = false;
		go('card');
		say(NEXT_LINE.en);
	}

	// 2. Talk
	async function startTalking() {
		stopAllAudio(); reloadNote = false;
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { go('denied'); return; }
		try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { go('denied'); return; }
		const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
		recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64_000 });
		chunks = []; blob = null; interrupted = false; cutOff = false; said1min = false; said15 = false;
		recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
		recorder.onstop = finishTalk;
		const track = stream.getAudioTracks()[0];
		if (track) track.onmute = track.onended = () => { if (recorder && recorder.state !== 'inactive') { interrupted = true; recorder.stop(); } };
		level = measureLevel(stream);
		recorder.start();
		// The clock starts only now, after the microphone was allowed; paused time never counts.
		ranFor = 0; segmentStart = performance.now(); elapsed = 0; paused = false; askedToContinue = false; stuck = false; announce = '';
		record = { ...record, talking: true }; persist();
		go('talk');
		queueMicrotask(() => stopButton?.focus());
		timer = setInterval(tick, 200);
	}
	function tick() {
		if (paused) return;
		elapsed = Math.min(TALK_MAX_SECONDS, ranFor + (performance.now() - segmentStart) / 1000);
		stuck = (level?.quietFor() ?? 0) >= STUCK_AFTER_SECONDS;
		if (elapsed >= TALK_TARGET_SECONDS && !said1min) { said1min = true; announce = T('One minute', 'یک دقیقه'); }
		if (elapsed >= TALK_MAX_SECONDS - 15 && !said15) { said15 = true; announce = T('15 seconds left', '۱۵ ثانیه مانده'); }
		if (elapsed >= TALK_MAX_SECONDS && recorder?.state === 'recording') { cutOff = true; recorder.stop(); }
	}
	function stopTalking() {
		if (!recorder || recorder.state === 'inactive') return;
		// An early Stop pauses once and asks for more, where the browser can pause.
		if (!askedToContinue && elapsed >= PAUSE_FROM && elapsed <= PAUSE_UNTIL && recorder.state === 'recording' && typeof recorder.pause === 'function') {
			try {
				recorder.pause(); level?.setPaused(true);
				ranFor = elapsed; paused = true; askedToContinue = true;
				queueMicrotask(() => heading?.focus());
				return;
			} catch { /* can't pause: just stop */ }
		}
		recorder.stop();
	}
	function keepGoing() {
		if (!recorder || recorder.state !== 'paused') return;
		recorder.resume(); level?.setPaused(false);
		segmentStart = performance.now(); paused = false;
		queueMicrotask(() => stopButton?.focus());
	}
	/** Stays paused until the recording has stopped, so paused time never counts. */
	function done() { recorder?.stop(); }
	function finishTalk() {
		clearInterval(timer);
		stream?.getTracks().forEach(t => t.stop()); stream = null;
		record = { ...record, talking: false }; persist();
		const peak = level?.peak() ?? 1, voiced = level?.voiced() ?? Infinity;
		level?.stop(); level = null;
		blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' });
		const seconds = Math.round(Math.min(TALK_MAX_SECONDS, paused ? ranFor : ranFor + (performance.now() - segmentStart) / 1000));
		elapsed = seconds; paused = false;
		if (interrupted) { go('interrupted'); return; }
		if (seconds < TALK_MIN_SECONDS) { go('short'); return; }
		// Silence doesn't count as talking, and a near-silent take is never sent.
		if (peak < SILENT_BELOW || voiced < MIN_VOICED_SECONDS) { go('quiet'); return; }
		void send(seconds);
	}
	function backToReady() { blob = null; go('card'); }

	async function send(seconds = elapsed) {
		if (!blob) return;
		go('processing'); note = 'listening';
		const body = new FormData();
		body.set('audio', blob, 'speech'); body.set('seconds', String(seconds)); body.set('card', String(record.card));
		let text: string | null = null;
		try {
			const response = await fetch('/api/english/speaking-card', { method: 'POST', body });
			const data = response.ok ? await response.json() : null;
			text = typeof data?.transcript === 'string' && data.transcript.trim() ? data.transcript.trim() : null;
		} catch { text = null; }
		if (text === null) { failedAt = 'transcribe'; go('failed'); return; }
		blob = null;
		const talk: Talk = { text, seconds, cutOff };
		record = { ...record, talk1: talk, coverage1: null, feedback: null }; persist();
		await judgeFirst();
	}

	async function post<R>(body: object, wait = 30_000): Promise<R | null> {
		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), wait);
		try {
			const response = await fetch('/api/english/speaking-card', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal, body: JSON.stringify(body) });
			return response.ok ? await response.json() : null;
		} catch { return null; }
		finally { clearTimeout(timeout); }
	}
	const talkInput = (t: Talk) => ({ text: t.text, cutOff: t.cutOff });

	async function judgeFirst() {
		if (!record.talk1) return;
		go('processing'); note = 'thinking';
		const result = await post<{ talks: Coverage[] }>({ kind: 'coverage', card: record.card, talks: [talkInput(record.talk1)] });
		const coverage = result?.talks?.[0];
		if (!coverage || !Array.isArray(coverage.points)) { failedAt = 'coverage'; go('failed'); return; }
		if (!coverage.onTopic || !coverage.mostlyEnglish) {
			record = { ...record, talk1: null }; persist();
			go(coverage.onTopic ? 'notenglish' : 'offtopic'); return;
		}
		record = { ...record, coverage1: coverage }; persist();
		await getFeedback();
	}
	async function getFeedback() {
		if (!record.talk1 || !record.coverage1) return;
		go('processing'); note = 'thinking';
		const result = await post<CardFeedback>({ kind: 'feedback', card: record.card, talk: talkInput(record.talk1), covered: record.coverage1.points.map(p => p.covered) });
		if (!result || typeof result.phrase !== 'string') { failedAt = 'feedback'; go('failed'); return; }
		record = { ...record, feedback: result }; persist();
		go('covered');
	}
	function retry() {
		if (failedAt === 'transcribe') void send();
		else if (failedAt === 'feedback') void getFeedback();
		else void judgeFirst();
	}
	function finish() { stopAllAudio(); record = { ...record, done: true }; persist(); onDone(); }

	const remaining = $derived(Math.max(0, TALK_MAX_SECONDS - elapsed));
	const say1 = (text: string) => text.replace(/…$/, '');
	/** The better version split into their own words and the [suggested] parts for points they missed. */
	const betterParts = $derived((record.feedback?.better ?? '').split(/(\[[^\]]*\])/).filter(Boolean).map(part => (part.startsWith('[') ? { text: part.slice(1, -1), added: true } : { text: part, added: false })));
	const betterSpoken = $derived(betterParts.map(p => p.text).join(''));
</script>

{#snippet bottom(label: string, action: () => void, disabled = false)}
	<div class="bar"><button class="primary" type="button" onclick={action} {disabled}>{label}</button></div>
{/snippet}

{#snippet theCard()}
	<div class="card">
		<p class="title" lang="en" dir="ltr">{card.title.en}</p>
		{#if isFa}<p class="title-fa">{card.title.fa}</p>{/if}
		<p class="should" lang="en" dir="ltr">You should say:</p>
		<ul class="points" lang="en" dir="ltr">
			{#each card.points as point, i}
				<li class:explain={i === 3}>
					{point.en}
					{#if showFa}<small lang="fa" dir="rtl">{point.fa}</small>{/if}
				</li>
			{/each}
		</ul>
		{#if isFa}<button class="link quiet" type="button" onclick={() => (showFa = !showFa)} aria-expanded={showFa}>{showFa ? 'پنهان کردن فارسی' : 'نمایش به فارسی'}</button>{/if}
	</div>
{/snippet}

{#snippet notesBox()}
	{#if showNotes || record.notes}
		<label class="sr-only" for="sc-notes">{T('Your keywords', 'کلمه‌های کلیدی تو')}</label>
		<input id="sc-notes" class="notes" maxlength="80" autocomplete="off" placeholder={T('Keywords, in English or Persian', 'کلمه‌های کلیدی، انگلیسی یا فارسی')}
			value={record.notes} oninput={event => { record = { ...record, notes: (event.currentTarget as HTMLInputElement).value }; persist(); }} />
	{:else}
		<button class="link quiet" type="button" onclick={() => (showNotes = true)}>{T('Write a few keywords', 'چند کلمهٔ کلیدی بنویس')}</button>
	{/if}
{/snippet}

<section class="sc">
	<h2 class="sr-only" tabindex="-1" bind:this={heading}>{stage === 'talk' && paused ? T('Paused', 'مکث') : T('Speaking card', 'کارت صحبت')}</h2>
	<p class="sr-only" role="status" aria-live="polite">{announce}</p>

	{#if stage === 'card'}
		{#if record.prepStartedAt === null}
			<div class="brief"><span class="avatar" aria-hidden="true">M</span><p>{fullIntro ? (isFa ? INSTRUCTION.fa : INSTRUCTION.en) : (isFa ? NEXT_LINE.fa : NEXT_LINE.en)}</p></div>
		{/if}
		{#if reloadNote}<p class="note">{T('The recording stopped when the page reloaded.', 'وقتی صفحه دوباره باز شد، ضبط متوقف شد.')}</p>{/if}
		{#if prepLeft !== null}
			<div class="prep" role="timer" aria-label={prepLeft > 0 ? T(`${prepLeft} seconds to prepare`, `${prepLeft} ثانیه برای آماده شدن`) : T('Time’s up', 'وقت تمام شد')}>
				<span class="ring" style:--p={`${((PREP_SECONDS - prepLeft) / PREP_SECONDS) * 360}deg`} aria-hidden="true"></span>
				<span>{prepLeft > 0 ? T(`Prepare · ${clock(prepLeft)}`, `آماده شو · ${clock(prepLeft)}`) : T('Time’s up', 'وقت تمام شد')}</span>
			</div>
		{/if}
		{@render theCard()}
		{#if prepLeft !== null}{@render notesBox()}{/if}
		<p class="hint">{T('You can talk for up to 2 minutes.', 'می‌توانی تا ۲ دقیقه صحبت کنی.')}</p>
		{#if prepLeft === null}
			<button class="link quiet" type="button" onclick={anotherCard}>{T('Another card', 'کارت دیگر')}</button>
			{@render bottom(T('Start preparing', 'شروع آماده شدن'), startPreparing)}
		{:else}
			{@render bottom(T('Start talking', 'شروع صحبت'), startTalking)}
		{/if}

	{:else if stage === 'talk'}
		{@render theCard()}
		{#if record.notes}<p class="mynotes"><span class="who">{T('Your keywords', 'کلمه‌های کلیدی تو')}</span> {record.notes}</p>{/if}
		{#if paused}
			<p class="lead">{T('You’ve still got time. Is there a point you haven’t talked about yet?', 'هنوز وقت داری. نکته‌ای هست که هنوز درباره‌اش حرف نزده باشی؟')}</p>
			<button class="link quiet" type="button" onclick={done}>{T('I’m done', 'تمام شد')}</button>
			{@render bottom(T('Keep going', 'ادامه بده'), keepGoing)}
		{:else}
			{#if stuck}<p class="hint">{T('Stuck? Try the next point.', 'گیر کردی؟ نکتهٔ بعدی را امتحان کن.')}</p>{/if}
			{#if remaining <= 15}<p class="hint">{T('Finish your sentence…', 'جمله‌ات را تمام کن…')}</p>{/if}
			<div class="bar"><div class="talkbar">
				<span class="clock" aria-hidden="true"><span class="dot"></span>{clock(elapsed)}{#if elapsed >= TALK_TARGET_SECONDS}<small> · {T('1 minute ✓', '۱ دقیقه ✓')}</small>{/if}</span>
				<button class="primary stop" type="button" bind:this={stopButton} onclick={stopTalking}>{T('Stop', 'پایان')}</button>
			</div></div>
		{/if}

	{:else if stage === 'short'}
		<p class="lead">{T('That was too short for me to give you feedback. Try again, and aim for about a minute.', 'برای بازخورد خیلی کوتاه بود. دوباره امتحان کن و سعی کن حدود یک دقیقه صحبت کنی.')}</p>
		{@render bottom(T('Try again', 'دوباره امتحان کن'), backToReady)}

	{:else if stage === 'quiet'}
		<p class="lead">{T('I could hardly hear you talking. Check your microphone, then try again.', 'صدای صحبتت را به‌سختی شنیدم. میکروفونت را بررسی کن و دوباره امتحان کن.')}</p>
		{@render bottom(T('Try again', 'دوباره امتحان کن'), backToReady)}

	{:else if stage === 'interrupted'}
		<p class="lead">{T('The recording stopped (you left the page, or the microphone went off).', 'ضبط متوقف شد (از صفحه بیرون رفتی یا میکروفون قطع شد).')}</p>
		{#if elapsed >= TALK_MIN_SECONDS}<button class="link" type="button" onclick={() => send()}>{T('Send what you have', 'همین را بفرست')}</button>{/if}
		{@render bottom(T('Record again', 'دوباره ضبط کن'), backToReady)}

	{:else if stage === 'denied'}
		<p class="lead">{T('Mira can’t hear you: the microphone is blocked. Allow it in your browser’s site settings, then try again.', 'میرا صدایت را نمی‌شنود: میکروفون بسته است. در تنظیمات سایتِ مرورگر اجازه‌اش را بده و دوباره امتحان کن.')}</p>
		{@render bottom(T('Try again', 'دوباره امتحان کن'), backToReady)}

	{:else if stage === 'offtopic' || stage === 'notenglish'}
		<p class="lead">{stage === 'offtopic' ? T('That seemed to be about something else. Have another look at the card and try again.', 'به نظر درباره‌ی چیز دیگری بود. دوباره به کارت نگاه کن و امتحان کن.') : T('I couldn’t hear much English there. Try again in English. Persian names are fine.', 'انگلیسی زیادی نشنیدم. دوباره به انگلیسی امتحان کن. اسم‌های فارسی اشکالی ندارد.')}</p>
		{@render bottom(T('Try again', 'دوباره امتحان کن'), backToReady)}

	{:else if stage === 'processing'}
		<div class="center"><div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>
			<p class="hint" role="status">{note === 'listening' ? T('Mira is listening…', 'میرا دارد گوش می‌دهد…') : T('Mira is looking at what you covered…', 'میرا دارد نگاه می‌کند چه چیزهایی را گفتی…')}</p></div>

	{:else if stage === 'failed'}
		<p class="lead">{failedAt === 'transcribe' ? T('I couldn’t hear that clearly. Check your connection and try again.', 'نتوانستم واضح بشنوم. اینترنت را بررسی کن و دوباره امتحان کن.') : T('I couldn’t check that one.', 'نتوانستم آن را بررسی کنم.')}</p>
		<button class="link quiet" type="button" onclick={finish}>{T('Finish', 'تمام')}</button>
		{@render bottom(T('Try again', 'دوباره امتحان کن'), retry)}

	{:else if stage === 'covered' && record.coverage1 && record.talk1}
		<p class="label">{T('What you covered', 'چه چیزهایی را گفتی')}</p>
		<ul class="covered">
			{#each card.points as point, i}
				{@const p = record.coverage1.points[i]}
				<li class:ok={p.covered}>
					<span class="point" lang="en" dir="ltr">{#if p.covered}<span aria-hidden="true">✓ </span><span class="sr-only">{T('covered:', 'گفتی:')} </span>{/if}{point.en}</span>
					{#if p.covered}<span class="quote">{T('You said:', 'گفتی:')} <bdi lang="en" dir="ltr">“{p.quote}”</bdi></span>
					{:else}<span class="quote">{T('You didn’t talk about this.', 'درباره‌ی این حرف نزدی.')}</span>{/if}
					{#if p.unclear}<span class="quote">{T('I wasn’t sure what you meant by', 'مطمئن نبودم منظورت از این چه بود:')} <bdi lang="en" dir="ltr">“{p.unclear}”</bdi></span>{/if}
				</li>
			{/each}
		</ul>
		<p class="count">{record.talk1.seconds >= TALK_TARGET_SECONDS ? T(`You spoke for ${clock(record.talk1.seconds)}.`, `${clock(record.talk1.seconds)} صحبت کردی.`) : T(`You spoke for ${clock(record.talk1.seconds)}. Next time, try to keep going past a minute.`, `${clock(record.talk1.seconds)} صحبت کردی. دفعهٔ بعد سعی کن بیشتر از یک دقیقه ادامه بدهی.`)}</p>
		<p class="hint">{T('I checked what you talked about, not your grammar. For grammar, try “Say it again, better”.', 'بررسی کردم درباره‌ی چه حرف زدی، نه دستور زبانت را. برای دستور زبان «دوباره بگو، بهتر» را امتحان کن.')}</p>
		{@render bottom(T('Next', 'بعدی'), () => go('follow'))}

	{:else if stage === 'follow' && record.feedback}
		<p class="label">{T('Making it easier to follow', 'راحت‌تر کردنِ دنبال کردن')}</p>
		{#if record.feedback.organisation}<p class="org">{isFa ? record.feedback.organisation.fa : record.feedback.organisation.en}</p>{/if}
		{#if phrase}
			<p class="label">{T('Try this next time', 'دفعهٔ بعد این را امتحان کن')}</p>
			<p class="now" lang="en" dir="ltr">{phrase.text}</p>
			<button class="hear" type="button" onclick={() => hear(say1(phrase.text))} aria-label={T('Hear it', 'بشنو')}><span aria-hidden="true">{playing ? '■' : '▶'}</span></button>
			<p class="why">{isFa ? record.feedback.why.fa : record.feedback.why.en}</p>
		{/if}
		{#if record.feedback.better}{@render bottom(T('See your talk, said better', 'دیدن صحبتت، بهتر گفته‌شده'), () => go('better'))}
		{:else}
			<button class="link quiet" type="button" onclick={finish}>{T('Finish', 'تمام')}</button>
			{@render bottom(T('Next card', 'کارت بعدی'), anotherCard)}
		{/if}

	{:else if stage === 'better' && record.feedback?.better}
		<p class="label">{T('Your talk, said better', 'صحبتت، بهتر گفته‌شده')}</p>
		<p class="said" lang="en" dir="ltr">{#each betterParts as part}{#if part.added}<mark>{part.text}<span class="sr-only"> ({T('suggested', 'پیشنهادی')})</span></mark>{:else}{part.text}{/if}{/each}</p>
		<button class="hear" type="button" onclick={() => hear(betterSpoken)} aria-label={T('Hear Mira read it', 'بشنو که میرا می‌خواندش')}><span aria-hidden="true">{playing ? '■' : '▶'}</span></button>
		<p class="hint">{T('Your ideas, organised and in correct English.', 'ایده‌های خودت، مرتب و با انگلیسی درست.')}{#if betterParts.some(p => p.added)}{' '}{T('Highlighted: what you could add for the points you missed.', 'رنگی: چیزی که می‌توانستی برای نکته‌های جاافتاده بگویی.')}{/if}</p>
		<button class="link quiet" type="button" onclick={finish}>{T('Finish', 'تمام')}</button>
		{@render bottom(T('Next card', 'کارت بعدی'), anotherCard)}
	{/if}
</section>

<style>
	.sc { display: grid; gap: 12px; padding-bottom: 104px; }
	.brief { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.brief p { margin: 0; line-height: 1.55; }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.card { display: grid; gap: 6px; padding: 16px; border-radius: 16px; background: var(--paper-raised); border: 1.5px solid var(--accent); }
	.title { margin: 0; font-family: var(--font-display); font-size: clamp(1.3rem, 5.6vw, 1.6rem); line-height: 1.3; text-align: left; }
	.title-fa { margin: 0; color: var(--ink-soft); }
	.should { margin: 4px 0 0; font-size: .85rem; color: var(--ink-soft); text-align: left; }
	.points { margin: 0; padding-inline-start: 20px; display: grid; gap: 4px; line-height: 1.45; text-align: left; }
	.points li.explain { font-weight: 600; }
	.points small { display: block; color: var(--ink-soft); }
	.prep { display: flex; align-items: center; gap: 10px; font-weight: 700; color: var(--accent-deep); font-variant-numeric: tabular-nums; }
	.ring { --p: 0deg; inline-size: 26px; block-size: 26px; border-radius: 50%; background: conic-gradient(var(--accent) var(--p), var(--paper-sunken) 0); }
	.notes { inline-size: 100%; min-height: 46px; padding: 10px 14px; border: 1.5px solid var(--line); border-radius: 12px; background: var(--paper-raised); color: var(--ink); font: inherit; }
	.mynotes { margin: 0; padding: 8px 12px; border-radius: 10px; background: var(--paper-sunken); line-height: 1.5; }
	.who { display: block; font-size: .72rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--accent-deep); }
	.lead { margin: 0; font-size: 1.08rem; line-height: 1.55; }
	.label { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .label, :global([dir='rtl']) .who { letter-spacing: normal; }
	.covered { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
	.covered li { display: grid; gap: 4px; padding: 12px 14px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); line-height: 1.45; }
	.covered li.ok { border-color: var(--leaf); background: var(--leaf-wash); }
	.point { font-weight: 600; text-align: left; }
	.quote { color: var(--ink-soft); }
	.count { margin: 0; font-weight: 600; }
	.org { margin: 0; font-size: 1.05rem; line-height: 1.55; }
	.now { margin: 0; font-family: var(--font-display); font-size: clamp(1.4rem, 6vw, 1.8rem); color: var(--accent-deep); text-align: left; }
	.why { margin: 0; color: var(--ink-soft); line-height: 1.6; }
	.said { margin: 0; padding: 14px 16px; border-radius: 14px; background: var(--paper-raised); border: 1px solid var(--accent); line-height: 1.75; text-align: left; }
	mark { background: color-mix(in srgb, var(--attention) 20%, transparent); color: inherit; border-radius: 4px; padding: 0 2px; }
	.note { margin: 0; line-height: 1.5; }
	.center { display: grid; justify-items: center; gap: 12px; margin-top: 18px; text-align: center; }
	.hint { margin: 0; color: var(--ink-soft); line-height: 1.5; }
	.hear { justify-self: start; display: grid; place-items: center; inline-size: 48px; block-size: 48px; border: 1.5px solid var(--accent); border-radius: 50%; background: var(--paper-raised); color: var(--accent-deep); cursor: pointer; }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.link.quiet { color: var(--ink-soft); }
	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 20; padding: 12px 20px calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 35%); }
	.talkbar { display: flex; align-items: center; gap: 14px; max-inline-size: 680px; margin-inline: auto; }
	.clock { display: flex; align-items: center; gap: 8px; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
	.clock small { font-weight: 600; color: var(--leaf); }
	.dot { inline-size: 12px; block-size: 12px; border-radius: 50%; background: var(--attention); animation: pulse 1.2s infinite ease-in-out; }
	@keyframes pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
	.primary { display: flex; align-items: center; justify-content: center; gap: 10px; inline-size: 100%; max-inline-size: 680px; margin-inline: auto; min-height: 54px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	.primary.stop { flex: 1; background: var(--attention); }
	.primary:disabled { opacity: .5; cursor: default; }
	.dots { display: inline-flex; gap: 6px; }
	.dots span { inline-size: 10px; block-size: 10px; border-radius: 50%; background: var(--ink-soft); animation: blink 1.2s infinite ease-in-out; }
	.dots span:nth-child(2) { animation-delay: .2s; }
	.dots span:nth-child(3) { animation-delay: .4s; }
	@keyframes blink { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	h2:focus { outline: none; }
	button:focus-visible, input:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	@media (prefers-reduced-motion: reduce) { .dot, .dots span { animation: none; } }
</style>
