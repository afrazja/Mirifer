<script lang="ts">
	/**
	 * "Choose and persuade" (docs/english-choose-persuade-spec.md, owner-approved v2).
	 * Choose an apartment → two reasons (spoken) → Mira's objection → your answer →
	 * how you argued → phrases to sound more persuasive → answer again → result.
	 * One focused screen at a time; kept in this browser for the day; audio never stored.
	 */
	import { onDestroy, onMount } from 'svelte';
	import { playAudioPromise, stopAllAudio, ttsIsPlaying } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { fixUse } from '$lib/practice/say-better';
	import {
		ANSWER_MAX, ANSWER_MIN, ANSWER_PHRASES, FLATS, REASONS_MAX, REASONS_MIN, REASON_PHRASES, ROWS,
		emptyPersuadeRecord, pickObjection, tooLittle, type FlatId, type PersuadeFeedback, type PersuadeRecord, type Phrase
	} from '$lib/practice/persuade';

	let { isFa = false, initial = null, onSave, onFocus, onDone }: {
		isFa?: boolean;
		initial?: PersuadeRecord | null;
		onSave?: (record: PersuadeRecord) => void;
		/** Mira's instruction shows on the choice screen only. */
		onFocus?: (intro: 'full' | 'compact' | 'hidden') => void;
		onDone: (score: { correct: number; total: number } | undefined, record: PersuadeRecord) => void;
	} = $props();

	type Take = 'reasons' | 'answer' | 'again';
	type Stage = 'choose' | 'photo' | 'ready' | 'recording' | 'short' | 'interrupted' | 'denied' | 'processing' | 'more' | 'failed' | 'f1' | 'f2' | 'result';
	// svelte-ignore state_referenced_locally
	let record = $state<PersuadeRecord>(initial ?? emptyPersuadeRecord());
	let stage = $state<Stage>('choose');
	let take = $state<Take>('reasons');
	let picked = $state<FlatId | null>(null), photoOf = $state<FlatId>('a');
	let showWords = $state(false), showCompare = $state(false), phraseIndex = $state(0);
	let objectionShown = $state(false), note = $state<'listening' | 'thinking'>('listening'), failures = $state(0), failedAt = $state<'transcribe' | 'feedback'>('transcribe');
	let elapsed = $state(0);
	let recorder: MediaRecorder | null = null, stream: MediaStream | null = null, chunks: Blob[] = [];
	let blob: Blob | null = null, startedAt = 0, timer: ReturnType<typeof setInterval> | undefined, interrupted = false;
	let heading: HTMLElement | undefined = $state();
	const playing = $derived($ttsIsPlaying);
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const flat = $derived(record.flat ? FLATS[record.flat] : null);
	const feedback = $derived(record.feedback);
	const maxFor = (t: Take) => (t === 'reasons' ? REASONS_MAX : ANSWER_MAX);
	const minFor = (t: Take) => (t === 'reasons' ? REASONS_MIN : ANSWER_MIN);

	$effect(() => { onFocus?.(stage === 'choose' ? 'full' : 'hidden'); });

	onMount(() => {
		// A reload returns to the step it left; an AI call that already finished isn't repeated.
		if (record.done || record.again !== null) stage = 'result';
		else if (record.feedback) stage = 'f1';
		else if (record.answer) void getFeedback();
		else if (record.objection) { take = 'answer'; stage = 'ready'; objectionShown = true; }
		else if (record.reasons) { take = 'reasons'; afterReasons(); }
		else if (record.flat) { take = 'reasons'; stage = 'ready'; }
		document.addEventListener('visibilitychange', onHidden);
		return () => document.removeEventListener('visibilitychange', onHidden);
	});
	onDestroy(() => { clearInterval(timer); if (recorder?.state === 'recording') recorder.stop(); stream?.getTracks().forEach(t => t.stop()); });

	function persist() { onSave?.($state.snapshot(record)); }
	function go(next: Stage) { stage = next; queueMicrotask(() => heading?.focus()); }
	function onHidden() { if (document.hidden && recorder?.state === 'recording') { interrupted = true; recorder.stop(); } }
	function say(line: string) { stopAllAudio(); return playAudioPromise(line, COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {}); }

	// 1. Choose
	function choose() {
		if (!picked) return;
		record = { ...record, flat: picked }; persist();
		take = 'reasons'; go('ready');
		void say('Why this one? Give me two reasons, and say why they matter to you.');
	}
	function chooseOther() { record = { ...record, flat: null }; picked = null; go('choose'); }

	// Recording (shared by the three takes)
	async function startRecording() {
		stopAllAudio();
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { go('denied'); return; }
		try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { go('denied'); return; }
		const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
		recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64_000 });
		chunks = []; interrupted = false; blob = null;
		recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
		recorder.onstop = finishRecording;
		recorder.start();
		startedAt = performance.now(); elapsed = 0; stage = 'recording';
		timer = setInterval(() => {
			elapsed = Math.min(maxFor(take), (performance.now() - startedAt) / 1000);
			if (elapsed >= maxFor(take) && recorder?.state === 'recording') recorder.stop();
		}, 200);
	}
	const stopRecording = () => { if (recorder?.state === 'recording') recorder.stop(); };
	function finishRecording() {
		clearInterval(timer);
		stream?.getTracks().forEach(track => track.stop()); stream = null;
		blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' });
		elapsed = Math.min(maxFor(take), Math.round((performance.now() - startedAt) / 1000));
		if (interrupted) { go('interrupted'); return; }
		if (elapsed < minFor(take)) { go('short'); return; }
		void send();
	}

	async function transcribeBlob(): Promise<string | null> {
		if (!blob) return null;
		const body = new FormData();
		body.set('audio', blob, 'speech'); body.set('seconds', String(elapsed));
		try {
			const response = await fetch('/api/english/persuade', { method: 'POST', body });
			const data = response.ok ? await response.json() : null;
			return typeof data?.transcript === 'string' ? data.transcript : null;
		} catch { return null; }
	}

	async function send() {
		go('processing'); note = 'listening';
		const transcript = await transcribeBlob();
		if (transcript === null) {
			failures += 1; failedAt = 'transcribe';
			// Reasons that can't be heard twice: Mira still objects (the apartment's first point), so nobody gets stuck.
			if (take === 'reasons' && failures >= 2 && record.flat) { failures = 0; record = { ...record, reasons: '' }; persist(); afterReasons(); return; }
			go('failed'); return;
		}
		failures = 0; blob = null;
		if (take === 'reasons') {
			if (tooLittle(transcript)) { go('more'); return; }
			record = { ...record, reasons: transcript }; persist();
			afterReasons();
		} else if (take === 'answer') {
			record = { ...record, answer: transcript }; persist();
			await getFeedback();
		} else {
			const uses = (record.feedback?.phrases ?? []).map(fix => fixUse(fix, transcript));
			record = { ...record, again: transcript, uses }; persist();
			go('result');
		}
	}

	/** Mira objects: the objection is picked from what they said (no AI), saved at once, then spoken. */
	function afterReasons() {
		if (!record.flat) return;
		const objection = record.objection ?? pickObjection(record.flat, record.reasons ?? '');
		record = { ...record, objection }; persist();
		take = 'answer'; objectionShown = false; go('ready');
		void say(`Okay. ${objection.line}`).then(() => (objectionShown = true));
		setTimeout(() => (objectionShown = true), 9_000); // the sound may be blocked; the text never waits long
	}

	async function getFeedback() {
		go('processing'); note = 'thinking';
		const controller = new AbortController();
		const wait = setTimeout(() => controller.abort(), 25_000);
		let result: PersuadeFeedback | null = null;
		try {
			const response = await fetch('/api/english/persuade', {
				method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
				body: JSON.stringify({ kind: 'feedback', flat: record.flat, reasons: record.reasons || '…', answer: record.answer })
			});
			result = response.ok ? await response.json() : null;
		} catch { result = null; }
		finally { clearTimeout(wait); }
		if (!result || !Array.isArray(result.reasons)) { failures += 1; failedAt = 'feedback'; go('failed'); return; }
		failures = 0;
		record = { ...record, feedback: result }; persist();
		go('f1');
	}
	const retry = () => (failedAt === 'feedback' ? getFeedback() : send());
	function continueWithout() { finish(); }

	function toPhrases() { phraseIndex = 0; if (feedback?.phrases.length) go('f2'); else answerAgain(); }
	function answerAgain() {
		take = 'again'; objectionShown = true; go('ready');
		if (record.objection) void say(record.objection.line);
	}
	function recordAgain() { blob = null; go('ready'); }
	function finish() {
		stopAllAudio();
		record = { ...record, done: true }; persist();
		const used = record.uses.filter(u => u === 'used').length, missed = record.uses.filter(u => u === 'missed').length;
		const answered = record.feedback?.objection?.verdict === 'answered' ? 1 : 0;
		const reasons = Math.min(2, record.feedback?.reasons.length ?? 0);
		onDone(record.feedback ? { correct: reasons + answered + used, total: 3 + used + missed } : undefined, $state.snapshot(record));
	}

	const remaining = $derived(Math.max(0, maxFor(take) - elapsed));
	const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
	const verdictText = (v: string) => (v === 'answered' ? T('You answered it', 'جوابش را دادی') : v === 'partly' ? T('You partly answered it', 'تا حدی جواب دادی') : T('Not answered yet', 'هنوز جواب ندادی'));
</script>

{#snippet bottom(label: string, action: () => void, disabled = false)}
	<div class="bar"><button class="primary" type="button" onclick={action} {disabled}>{label}</button></div>
{/snippet}

{#snippet compare()}
	<table class="compare" lang="en" dir="ltr">
		<thead><tr><th scope="col"><span class="sr-only">{T('Fact', 'ویژگی')}</span></th><th scope="col">A</th><th scope="col">B</th></tr></thead>
		<tbody>{#each ROWS as row, i}<tr><th scope="row">{row.en}</th><td>{FLATS.a.facts[i]}</td><td>{FLATS.b.facts[i]}</td></tr>{/each}</tbody>
	</table>
{/snippet}

{#snippet words(list: Phrase[])}
	<button class="link" type="button" onclick={() => (showWords = !showWords)} aria-expanded={showWords}>{showWords ? T('Hide words', 'پنهان کردن عبارت‌ها') : T('Need words?', 'عبارت لازم داری؟')}</button>
	{#if showWords}<ul class="words">{#each list as phrase}<li><bdi lang="en" dir="ltr">{phrase.en}</bdi>{#if isFa}<small>{phrase.fa}</small>{/if}</li>{/each}</ul>{/if}
{/snippet}

<section class="persuade" aria-live="polite">
	<h2 class="sr-only" tabindex="-1" bind:this={heading}>{T('Choose and persuade', 'انتخاب کن و قانع کن')}</h2>

	{#if stage === 'choose'}
		<div class="flats" role="group" aria-label={T('The two apartments', 'دو آپارتمان')}>
			{#each [FLATS.a, FLATS.b] as option}
				<button class="flat" type="button" class:on={picked === option.id} aria-pressed={picked === option.id} onclick={() => (picked = option.id)}
					aria-label={`${option.label}, ${option.title}, ${option.facts[0]}`}>
					<picture><source srcset={`${option.photo}-640.webp`} type="image/webp" /><img src={`${option.photo}-640.webp`} alt={option.alt} width="640" height="480" /></picture>
					<span class="flat-label" lang="en" dir="ltr">{option.label}</span>
					{#if picked === option.id}<span class="selected">✓ {T('Selected', 'انتخاب شد')}</span>{/if}
				</button>
			{/each}
		</div>
		{@render compare()}
		{#if picked}<button class="link" type="button" onclick={() => { photoOf = picked ?? 'a'; go('photo'); }}>{T('See the photo', 'دیدن عکس')}</button>{/if}
		{@render bottom(picked ? T(`I'd take Apartment ${picked.toUpperCase()}`, `آپارتمان ${picked.toUpperCase()} را می‌گیرم`) : T('Pick one', 'یکی را انتخاب کن'), choose, !picked)}

	{:else if stage === 'photo'}
		<img class="big" src={`${FLATS[photoOf].photo}.webp`} alt={FLATS[photoOf].alt} width="1200" height="900" />
		{@render bottom(T('Back', 'برگشت'), () => go('choose'))}

	{:else if stage === 'ready' || stage === 'recording'}
		{#if flat}<p class="chosen" lang="en" dir="ltr">{flat.label} · {flat.facts[0]}</p>{/if}
		{#if take === 'reasons'}
			<p class="mira">{T('Why this one? Give me two reasons, and say why they matter to you.', 'چرا این یکی؟ دو دلیل بگو، و بگو چرا برایت مهم‌اند.')}</p>
		{:else if record.objection}
			{#if objectionShown || stage === 'recording'}<p class="mira" lang="en" dir="ltr">“{record.objection.line}”</p>
			{:else}<p class="mira muted" role="status">{T('Mira is speaking…', 'میرا دارد حرف می‌زند…')}</p>{/if}
			{#if stage === 'ready'}<button class="link" type="button" onclick={() => record.objection && say(record.objection.line).then(() => (objectionShown = true))}>{playing ? T('Playing…', 'در حال پخش…') : T('Hear it again', 'دوباره بشنو')}</button>{/if}
		{/if}
		{#if take === 'again' && feedback?.phrases.length}<ul class="chips" lang="en" dir="ltr">{#each feedback.phrases as fix}<li>{fix.better}</li>{/each}</ul>{/if}
		<button class="link" type="button" onclick={() => (showCompare = !showCompare)} aria-expanded={showCompare}>{showCompare ? T('Hide the table', 'پنهان کردن جدول') : T('Compare again', 'دوباره مقایسه کن')}</button>
		{#if showCompare}{@render compare()}{/if}
		{@render words(take === 'reasons' ? REASON_PHRASES : ANSWER_PHRASES)}
		{#if stage === 'recording'}
			<p class="recording" role="timer" aria-label={T(`${Math.ceil(remaining)} seconds left`, `${Math.ceil(remaining)} ثانیه مانده`)}><span class="dot" aria-hidden="true"></span>{clock(elapsed)} / {clock(maxFor(take))}</p>
			{@render bottom(T('Stop', 'پایان ضبط'), stopRecording)}
		{:else}
			{#if take === 'reasons' && !record.reasons}<button class="link quiet" type="button" onclick={chooseOther}>{T('Choose the other one', 'آن یکی را انتخاب کن')}</button>{/if}
			{@render bottom(take === 'reasons' ? T('Tell me why', 'بگو چرا') : T('Answer Mira', 'جواب میرا را بده'), startRecording)}
		{/if}

	{:else if stage === 'short'}
		<p class="lead">{T('That was very short. Try to say a bit more.', 'خیلی کوتاه بود. سعی کن کمی بیشتر بگویی.')}</p>
		{@render bottom(T('Record again', 'دوباره ضبط کن'), recordAgain)}

	{:else if stage === 'more'}
		<p class="lead">{T('Tell me a bit more: why this one?', 'کمی بیشتر بگو: چرا این یکی؟')}</p>
		{@render bottom(T('Record again', 'دوباره ضبط کن'), recordAgain)}

	{:else if stage === 'interrupted'}
		<p class="lead">{T('The recording stopped when you left the page.', 'وقتی از صفحه بیرون رفتی، ضبط متوقف شد.')}</p>
		{#if elapsed >= minFor(take)}<button class="link" type="button" onclick={send}>{T('Send what you have', 'همین را بفرست')}</button>{/if}
		{@render bottom(T('Record again', 'دوباره ضبط کن'), recordAgain)}

	{:else if stage === 'denied'}
		<p class="lead">{T('Mira can’t hear you: the microphone is blocked. Allow it in your browser’s site settings, then try again.', 'میرا صدایت را نمی‌شنود: میکروفون بسته است. در تنظیمات سایتِ مرورگر اجازه‌اش را بده و دوباره امتحان کن.')}</p>
		{@render bottom(T('Try again', 'دوباره امتحان کن'), recordAgain)}

	{:else if stage === 'processing'}
		<div class="center"><div class="dots" aria-hidden="true"><span></span><span></span><span></span></div>
			<p class="hint" role="status">{note === 'listening' ? T('Mira is listening…', 'میرا دارد گوش می‌دهد…') : T('Mira is thinking about how you argued…', 'میرا دارد به استدلالت فکر می‌کند…')}</p></div>

	{:else if stage === 'failed'}
		<p class="lead">{failedAt === 'transcribe' ? T('I couldn’t hear that clearly. Check your connection and try again.', 'نتوانستم واضح بشنوم. اینترنت را بررسی کن و دوباره امتحان کن.') : T('I couldn’t check that one.', 'نتوانستم آن را بررسی کنم.')}</p>
		{#if failedAt === 'feedback' && failures >= 2}<button class="link" type="button" onclick={continueWithout}>{T('Continue without feedback', 'بدون بازخورد ادامه بده')}</button>{/if}
		{@render bottom(T('Try again', 'دوباره امتحان کن'), retry)}

	{:else if stage === 'f1' && feedback}
		{#if feedback.praise}<p class="praise">{isFa ? feedback.praise.fa : feedback.praise.en}</p>{/if}
		<p class="label">{T('Your reasons', 'دلیل‌هایت')}</p>
		{#if feedback.reasons.length}<ul class="reasons" lang="en" dir="ltr">{#each feedback.reasons as reason}<li>{reason.text}</li>{/each}</ul>
		{:else}<p class="hint">{T('I didn’t catch a clear reason this time.', 'این بار دلیل روشنی نشنیدم.')}</p>{/if}
		{#if record.objection}
			<p class="label">{T('My question', 'سؤال من')}</p>
			<p class="said" lang="en" dir="ltr">“{record.objection.line}”</p>
			{#if record.answer}<p class="said you" lang="en" dir="ltr">{record.answer}</p>{/if}
			{#if feedback.objection}<p class="verdict"><strong>{verdictText(feedback.objection.verdict)}.</strong> {isFa ? feedback.objection.line.fa : feedback.objection.line.en}</p>{/if}
		{/if}
		{#if feedback.phrases.length}{@render bottom(T('Next', 'بعدی'), toPhrases)}
		{:else}
			<button class="link" type="button" onclick={finish}>{T('Finish', 'تمام')}</button>
			{@render bottom(T('Answer me again', 'دوباره جوابم را بده'), answerAgain)}
		{/if}

	{:else if stage === 'f2' && feedback}
		{@const fix = feedback.phrases[phraseIndex]}
		<p class="label">{T(`Phrase ${phraseIndex + 1} of ${feedback.phrases.length}`, `عبارت ${(phraseIndex + 1).toLocaleString('fa-IR')} از ${feedback.phrases.length.toLocaleString('fa-IR')}`)}</p>
		<p class="was" lang="en" dir="ltr"><s>{fix.original}</s></p>
		<p class="now" lang="en" dir="ltr">{fix.better}</p>
		<button class="link" type="button" onclick={() => say(fix.better)}>{T('Hear it', 'بشنو')}</button>
		<p class="why">{isFa ? fix.why.fa : fix.why.en}</p>
		{#if phraseIndex + 1 < feedback.phrases.length}{@render bottom(T('Next phrase', 'عبارت بعدی'), () => (phraseIndex += 1))}
		{:else}
			<button class="link" type="button" onclick={finish}>{T('Finish', 'تمام')}</button>
			{@render bottom(T('Answer me again', 'دوباره جوابم را بده'), answerAgain)}
		{/if}

	{:else if stage === 'result'}
		{#if feedback?.phrases.length}
			<ul class="uses" lang="en" dir="ltr">
				{#each feedback.phrases as fix, i}<li class:ok={record.uses[i] === 'used'}>{#if record.uses[i] === 'used'}✓ {/if}{fix.better}</li>{/each}
			</ul>
			<p class="praise">{record.uses.includes('used') ? T('You used a stronger phrase this time.', 'این بار یک عبارت قوی‌تر به کار بردی.') : T('Good second try. Keep these phrases for next time.', 'تلاش دوم خوبی بود. این عبارت‌ها را برای دفعهٔ بعد نگه دار.')}</p>
		{:else}<p class="praise">{T('Nice second answer.', 'جواب دوم خوبی بود.')}</p>{/if}
		{#if record.again}<p class="said you" lang="en" dir="ltr">{record.again}</p>{/if}
		{@render bottom(T('Done', 'تمام'), finish)}
	{/if}
</section>

<style>
	.persuade { display: grid; gap: 12px; padding-bottom: 96px; }
	.flats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
	.flat { position: relative; display: grid; gap: 6px; padding: 6px; border: 2px solid var(--line); border-radius: 14px; background: var(--paper-raised); color: var(--ink); font: inherit; text-align: left; cursor: pointer; }
	.flat.on { border-color: var(--accent); background: var(--accent-wash); }
	.flat img { inline-size: 100%; block-size: auto; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 10px; display: block; }
	.flat-label { font-weight: 700; font-size: .92rem; padding: 0 4px 2px; }
	.selected { position: absolute; inset-block-start: 12px; inset-inline-start: 12px; padding: 2px 8px; border-radius: 999px; background: var(--accent); color: var(--on-accent); font-size: .78rem; font-weight: 700; }
	.compare { inline-size: 100%; border-collapse: collapse; font-size: .86rem; line-height: 1.35; }
	.compare th, .compare td { padding: 7px 6px; border-block-end: 1px solid var(--line); text-align: left; vertical-align: top; }
	.compare thead th { font-size: .8rem; color: var(--ink-soft); }
	.compare tbody th { font-weight: 600; color: var(--ink-soft); white-space: nowrap; inline-size: 1%; }
	.big { inline-size: 100%; block-size: auto; border-radius: 14px; }
	.chosen { margin: 0; font-size: .85rem; color: var(--ink-soft); }
	.mira { margin: 0; font-family: var(--font-display); font-size: clamp(1.25rem, 5.4vw, 1.55rem); line-height: 1.4; }
	.mira.muted { color: var(--ink-soft); font-size: 1rem; font-family: inherit; }
	.words { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
	.words li { display: grid; gap: 2px; padding: 8px 12px; border-radius: 10px; background: var(--paper-raised); border: 1px solid var(--line); }
	.words small { color: var(--ink-soft); }
	.chips { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
	.chips li { padding: 8px 14px; border-radius: 999px; background: var(--accent-wash); color: var(--accent-deep); font-weight: 600; }
	.recording { display: flex; align-items: center; gap: 10px; margin: 6px 0 0; font-weight: 600; font-variant-numeric: tabular-nums; }
	.dot { inline-size: 12px; block-size: 12px; border-radius: 50%; background: var(--attention); animation: pulse 1.2s infinite ease-in-out; }
	@keyframes pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
	.lead { margin: 0; font-size: 1.1rem; line-height: 1.55; }
	.label { margin: 8px 0 0; font-size: .8rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .label { letter-spacing: normal; }
	.reasons { margin: 0; padding-inline-start: 20px; line-height: 1.7; text-align: left; }
	.said { margin: 0; padding: 12px 14px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); line-height: 1.6; text-align: left; }
	.said.you { color: var(--ink-soft); }
	.verdict { margin: 0; line-height: 1.55; }
	.praise { margin: 0; font-size: 1.05rem; line-height: 1.55; color: var(--accent-deep); font-weight: 600; }
	.was { margin: 0; color: var(--ink-soft); font-size: 1.05rem; text-align: left; }
	.now { margin: 0; font-family: var(--font-display); font-size: clamp(1.3rem, 5.8vw, 1.7rem); color: var(--accent-deep); text-align: left; }
	.why { margin: 0; color: var(--ink-soft); line-height: 1.6; }
	.uses { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
	.uses li { padding: 12px 14px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); }
	.uses li.ok { border-color: var(--leaf); background: var(--leaf-wash); }
	.center { display: grid; justify-items: center; gap: 12px; margin-top: 18px; text-align: center; }
	.hint { margin: 0; color: var(--ink-soft); }
	.dots { display: inline-flex; gap: 6px; }
	.dots span { inline-size: 10px; block-size: 10px; border-radius: 50%; background: var(--ink-soft); animation: blink 1.2s infinite ease-in-out; }
	.dots span:nth-child(2) { animation-delay: .2s; }
	.dots span:nth-child(3) { animation-delay: .4s; }
	@keyframes blink { 0%, 80%, 100% { opacity: .25; } 40% { opacity: 1; } }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.link.quiet { color: var(--ink-soft); }
	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 20; padding: 12px 20px calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 35%); }
	.primary { display: flex; align-items: center; justify-content: center; inline-size: 100%; max-inline-size: 680px; margin-inline: auto; min-height: 54px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	.primary:disabled { opacity: .5; cursor: default; }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	h2:focus { outline: none; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	@media (prefers-reduced-motion: reduce) { .dot, .dots span { animation: none; } }
</style>
