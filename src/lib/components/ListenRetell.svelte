<script lang="ts">
	/**
	 * "Listen and retell": hear a short story (at most twice; the words can be shown), tell it in
	 * your own words, then see which key points came across and a few sentences said more naturally.
	 * The daily lesson shows the day's story; the Module lab's story list opens any of them.
	 * The recording goes to the server to be transcribed and is never stored.
	 */
	import { onDestroy, onMount } from 'svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import { RECORDED_ENGLISH_RATE } from '$lib/practice/english-voice';
	import {
		MAX_LISTENS, PLAYBACK_RATE, emptyRetellRun, formatDuration, listenSeconds, pieceImage, speakLimit,
		type RetellPiece, type RetellResult, type RetellRun
	} from '$lib/practice/retell';
	import type { DisplayText } from '$lib/practice/hotel';
	import { playAudioUrl, stopAllAudio } from '$services/tts';

	let { isFa = false, piece, voice = 'a', initial = null, doneLabel = null, onSave, onFocus, onSkip, onResult, onDone }: {
		isFa?: boolean;
		piece: RetellPiece;
		/** The narrator for this go (the story's own when it has one). */
		voice?: 'a' | 'b' | 'c' | 'd';
		initial?: RetellRun | null;
		/** The main button under the feedback ("Continue" by default). */
		doneLabel?: DisplayText | null;
		onSave?: (run: RetellRun) => void;
		/** The daily lesson: Mira's intro shows on the start screen only. */
		onFocus?: (mode: 'full' | 'compact' | 'hidden') => void;
		/** "Skip this step" on the start screen (the daily lesson). */
		onSkip?: () => void;
		/** A retelling was checked (the Module lab keeps the learner's best). */
		onResult?: (result: RetellResult, textShown: boolean) => void;
		/** Key points covered, out of all. */
		onDone: (score: { correct: number; total: number }, run: RetellRun) => void;
	} = $props();

	const T = (en: string, fa: string) => (isFa ? fa : en);
	const N = (n: number) => (isFa ? n.toLocaleString('fa-IR') : String(n));
	const D = (seconds: number) => (isFa ? formatDuration(seconds).replace(/\d/g, d => N(Number(d))) : formatDuration(seconds));
	const text = (value: DisplayText) => (isFa ? value.fa : value.en);

	// svelte-ignore state_referenced_locally
	let run = $state<RetellRun>(initial ?? emptyRetellRun());
	// svelte-ignore state_referenced_locally
	let stage = $state<'start' | 'listen' | 'speak' | 'result'>(initial?.result ? 'result' : initial && (initial.listens > 0 || initial.textShown) ? 'listen' : 'start');
	let heading: HTMLElement | undefined = $state();

	// Listening
	let audio: HTMLAudioElement | null = null;
	let playing = $state(false), loadingAudio = $state(false), progress = $state(0), audioFailed = $state(false);
	// Speaking
	let recorder: MediaRecorder | null = null, stream: MediaStream | null = null, chunks: Blob[] = [];
	let recording = $state(false), checking = $state(false), elapsed = $state(0), recordingUrl = $state(''), recordingBlob: Blob | null = null;
	let tick: ReturnType<typeof setInterval> | undefined, startedAt = 0, generation = 0, alive = true;
	let micMessage = $state<DisplayText | null>(null), error = $state<DisplayText | null>(null);

	const limit = $derived(speakLimit(piece));
	const image = $derived(pieceImage(piece));
	const listensLeft = $derived(Math.max(0, MAX_LISTENS - run.listens));
	const midway = $derived(progress > 0 && progress < 1);
	/** They can retell once they've heard it (or read it, or it couldn't play). */
	const heard = $derived((run.listens > 0 && !playing && !midway && !loadingAudio) || run.textShown || audioFailed);
	const canListenAgain = $derived(listensLeft > 0 && !audioFailed);
	const result = $derived(run.result);

	onMount(() => { if (stage !== 'start') onFocus?.('hidden'); });
	onDestroy(() => { alive = false; generation++; cleanUpAudio(); stopRecording(true); discardRecording(); });

	function persist() { onSave?.($state.snapshot(run)); }
	function focusHeading() { queueMicrotask(() => heading?.focus()); }
	function go(next: typeof stage) { stage = next; focusHeading(); }

	function start() { stopAllAudio(); onFocus?.('hidden'); go('listen'); togglePlay(); }

	function cleanUpAudio() {
		if (audio) { audio.onplay = audio.onpause = audio.onended = audio.ontimeupdate = audio.onerror = null; audio.pause(); audio.src = ''; audio = null; }
		playing = false; loadingAudio = false;
	}
	/** Pausing never costs a play; starting from the beginning does. */
	function togglePlay() {
		if (audio && playing) { audio.pause(); return; }
		if (audio && midway) { void audio.play(); return; }
		if (listensLeft <= 0) return;
		stopAllAudio();
		if (!audio) {
			audio = new Audio(`/api/english/voice?v=1&voice=${voice}&piece=${piece.id}`);
			audio.onplay = () => { playing = true; loadingAudio = false; };
			audio.onpause = () => { playing = false; };
			audio.onended = () => { playing = false; progress = 1; };
			audio.ontimeupdate = () => { if (audio?.duration) progress = audio.currentTime / audio.duration; };
			audio.onerror = () => { loadingAudio = false; playing = false; audioFailed = true; };
			loadingAudio = true;
		} else audio.currentTime = 0;
		audio.defaultPlaybackRate = audio.playbackRate = PLAYBACK_RATE[piece.level];
		progress = 0;
		run = { ...run, listens: run.listens + 1 }; persist();
		audio.play().catch(() => { loadingAudio = false; audioFailed = true; });
	}
	function showText() { run = { ...run, textShown: true }; persist(); }
	function toSpeak() { cleanUpAudio(); error = null; go('speak'); }
	function backToListen() { stopRecording(true); discardRecording(); progress = 0; go('listen'); togglePlay(); }

	function discardRecording() {
		if (recordingUrl) URL.revokeObjectURL(recordingUrl);
		recordingUrl = ''; recordingBlob = null; elapsed = 0;
	}
	async function startRecording() {
		micMessage = null; error = null; discardRecording(); stopAllAudio();
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
			micMessage = { en: 'This browser can’t record audio. Try Chrome, Edge or Safari.', fa: 'این مرورگر نمی‌تواند صدا ضبط کند. کروم، اج یا سافاری را امتحان کن.' }; return;
		}
		const current = generation;
		try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
		catch { micMessage = { en: 'Microphone access was blocked. Allow the microphone for this site and try again.', fa: 'دسترسی به میکروفون مسدود شد. اجازهٔ میکروفون را برای این سایت بده و دوباره امتحان کن.' }; return; }
		if (current !== generation || stage !== 'speak' || !alive) { stream.getTracks().forEach(track => track.stop()); stream = null; return; }
		const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
		const own = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 32_000 });
		recorder = own;
		chunks = [];
		own.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
		own.onstop = () => {
			const blob = new Blob(chunks, { type: (own.mimeType || mimeType || 'audio/webm').split(';')[0] });
			if (blob.size && alive) { recordingBlob = blob; recordingUrl = URL.createObjectURL(blob); }
			if (recorder === own) recorder = null;
		};
		own.start(1000);
		recording = true; startedAt = Date.now(); elapsed = 0;
		tick = setInterval(() => {
			elapsed = (Date.now() - startedAt) / 1000;
			if (elapsed >= limit) stopRecording();
		}, 200);
	}
	function stopRecording(discard = false) {
		clearInterval(tick);
		if (recording) elapsed = Math.min(limit, (Date.now() - startedAt) / 1000);
		if (discard && recorder) recorder.onstop = null;
		if (recorder && recorder.state !== 'inactive') recorder.stop();
		if (discard) recorder = null;
		stream?.getTracks().forEach(track => track.stop()); stream = null;
		recording = false;
	}

	async function submit() {
		if (!recordingBlob || checking) return;
		const current = generation;
		checking = true; error = null;
		const body = new FormData();
		body.set('piece', piece.id);
		body.set('seconds', String(Math.round(elapsed)));
		body.set('textShown', run.textShown ? '1' : '0');
		body.set('audio', recordingBlob, 'retell');
		try {
			const response = await fetch('/api/english/retell', { method: 'POST', body });
			if (current !== generation || !alive) return;
			if (!response.ok) {
				error = response.status === 429
					? { en: 'Today’s AI allowance is used up. It resets at 00:00 UTC.', fa: 'سهمیهٔ امروز هوش مصنوعی تمام شده است. ساعت ۰۰:۰۰ به وقت UTC تازه می‌شود.' }
					: response.status === 413 ? { en: 'That recording is too large to send.', fa: 'این ضبط برای ارسال خیلی بزرگ است.' }
					: { en: 'We couldn’t check your recording just now. It’s still here; try again in a moment.', fa: 'الان نتوانستیم ضبطت را بررسی کنیم. ضبطت هنوز اینجاست؛ کمی بعد دوباره امتحان کن.' };
				return;
			}
			const value = (await response.json()) as RetellResult;
			if (current !== generation || !alive) return;
			run = { ...run, result: value }; persist();
			onResult?.(value, run.textShown);
			discardRecording();
			go('result');
		} catch {
			if (current !== generation || !alive) return;
			error = { en: 'We couldn’t reach the server. Check your connection and try again.', fa: 'به سرور دسترسی نداشتیم. اتصال را بررسی کن و دوباره امتحان کن.' };
		} finally {
			if (current === generation) checking = false;
		}
	}
	function listenTo(better: string, sig?: string) {
		const signed = sig ? `&sig=${encodeURIComponent(sig)}` : '';
		void playAudioUrl(`/api/english/voice?v=1&voice=${voice}&text=${encodeURIComponent(better)}${signed}`, undefined, RECORDED_ENGLISH_RATE);
	}
	/** The story again from the start: two fresh listens, a new retelling. */
	function again() {
		generation++; stopAllAudio(); cleanUpAudio(); stopRecording(true); discardRecording();
		checking = false; error = null; micMessage = null; progress = 0; audioFailed = false;
		run = emptyRetellRun(); persist();
		go('listen');
	}
	function finish() {
		stopAllAudio();
		onDone({ correct: result?.covered.length ?? 0, total: result?.total ?? piece.keyPoints.length }, $state.snapshot(run));
	}
</script>

<section class="retell" dir={isFa ? 'rtl' : 'ltr'}>
	{#if stage === 'start'}
		{#if image}<img class="banner" src={image} srcset={`${pieceImage(piece, true)} 480w, ${image} 960w`} sizes="(max-width: 640px) 100vw, 680px" alt={piece.imageAlt ? text(piece.imageAlt) : ''} width="960" height="640" decoding="async" />{/if}
		<div class="card">
			<p class="label">{piece.level} · {T('Listen and retell', 'گوش بده و بازگو کن')}</p>
			<h2 class="title" lang={isFa ? 'fa' : 'en'}>{text(piece.title)}</h2>
			<p class="meta">{T(`About ${D(listenSeconds(piece))} to listen, up to ${MAX_LISTENS} times. Then you speak, up to ${D(limit)}.`, `حدود ${D(listenSeconds(piece))} گوش می‌دهی، حداکثر ${N(MAX_LISTENS)} بار. بعد صحبت می‌کنی، حداکثر ${D(limit)}.`)}</p>
		</div>
		<ActionBar label={T('Start', 'شروع')} icon="play" onclick={start} secondary={onSkip ? { label: T('Skip this step', 'این مرحله را رد کن'), onclick: () => { stopAllAudio(); onSkip?.(); } } : undefined} />

	{:else if stage === 'listen'}
		<p class="label" aria-hidden="true">{T('1 of 2 · Listen', '۱ از ۲ — گوش بده')}</p>
		<h2 class="title" tabindex="-1" bind:this={heading} lang={isFa ? 'fa' : 'en'}>{text(piece.title)}</h2>
		{#if image}<img class="banner" src={image} srcset={`${pieceImage(piece, true)} 480w, ${image} 960w`} sizes="(max-width: 640px) 100vw, 680px" alt={piece.imageAlt ? text(piece.imageAlt) : ''} width="960" height="640" decoding="async" />{/if}
		<div class="card player">
			<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress * 100)} aria-label={T('Story played', 'مقدار پخش‌شدهٔ داستان')}><span style:width={`${progress * 100}%`}></span></div>
			<p class="meta">{loadingAudio ? T('Getting the story ready… the first time can take up to half a minute.', 'داستان در حال آماده شدن است… بار اول ممکن است تا نیم دقیقه طول بکشد.') : listensLeft === 0 ? T('No plays left.', 'دیگر پخشی نمانده.') : T(`${listensLeft} ${listensLeft === 1 ? 'play' : 'plays'} left`, `${N(listensLeft)} بار دیگر می‌توانی گوش بدهی`)}</p>
		</div>
		{#if audioFailed}<p class="note" role="alert">{T('The story can’t play right now. Read it instead, then retell it.', 'داستان الان پخش نمی‌شود. به جایش بخوانش و بعد بازگو کن.')}</p>{/if}
		{#if run.textShown}
			<div class="words" lang="en" dir="ltr">{piece.text}</div>
		{:else}
			<button class="quiet" type="button" onclick={showText}>{T('Show the words (your result is marked “with the text”)', 'نمایش متن (نتیجه‌ات «با متن» ثبت می‌شود)')}</button>
		{/if}
		{#if playing}
			<ActionBar label={T('Pause', 'مکث')} icon="pause" onclick={togglePlay} />
		{:else if midway}
			<ActionBar label={T('Resume', 'ادامهٔ پخش')} icon="play" onclick={togglePlay} secondary={{ label: T('I’m ready to retell', 'آماده‌ام بازگو کنم'), onclick: toSpeak }} />
		{:else if heard}
			<ActionBar label={T('I’m ready to retell', 'آماده‌ام بازگو کنم')} onclick={toSpeak} secondary={canListenAgain ? { label: T('Listen again', 'دوباره گوش بده'), onclick: togglePlay } : null} />
		{:else}
			<ActionBar label={loadingAudio ? T('Getting ready…', 'در حال آماده شدن…') : T('Play the story', 'پخش داستان')} icon={loadingAudio ? null : 'play'} disabled={loadingAudio} onclick={togglePlay} />
		{/if}

	{:else if stage === 'speak'}
		<p class="label" aria-hidden="true">{T('2 of 2 · Retell', '۲ از ۲ — بازگو کن')}</p>
		<h2 class="title" tabindex="-1" bind:this={heading}>{T('Now tell the story in your own words.', 'حالا داستان را با کلمات خودت تعریف کن.')}</h2>
		<p class="meta">{T(`Say everything you remember. There’s no minimum; recording stops on its own at ${D(limit)}.`, `هر چه یادت مانده بگو. حداقلی ندارد؛ ضبط در ${D(limit)} خودش متوقف می‌شود.`)}</p>
		<div class="card player">
			<div class="clock" aria-live="off"><strong>{D(elapsed)}</strong> / {D(limit)}</div>
			<div class="bar" aria-hidden="true"><span style:width={`${Math.min(1, elapsed / limit) * 100}%`}></span></div>
		</div>
		{#if recordingUrl && !recording}
			<p class="meta">{T('Your recording:', 'ضبط تو:')}</p>
			<!-- svelte-ignore a11y_media_has_caption -->
			<audio controls src={recordingUrl}></audio>
		{/if}
		{#if micMessage}<p class="note" role="alert">{text(micMessage)}</p>{/if}
		{#if error}<p class="note" role="alert">{text(error)}</p>{/if}
		<p class="small">{T('Your recording is sent to OpenAI to turn it into text. It isn’t stored.', 'ضبط تو برای تبدیل به متن به OpenAI فرستاده می‌شود و ذخیره نمی‌شود.')}</p>
		{#if recording}
			<ActionBar label={T('Stop', 'پایان')} icon="stop" recording onclick={() => stopRecording()} />
		{:else if checking}
			<ActionBar label={T('Listening to your retelling…', 'در حال گوش دادن به تو…')} disabled onclick={() => {}} />
		{:else if recordingUrl}
			<ActionBar label={T('Get feedback', 'دریافت بازخورد')} icon="send" onclick={submit} secondary={{ label: T('Record again', 'دوباره ضبط کن'), onclick: startRecording }} />
		{:else}
			<ActionBar label={T('Start speaking', 'شروع صحبت')} icon="mic" onclick={startRecording} secondary={canListenAgain ? { label: T('Listen again first', 'اول دوباره گوش بده'), onclick: backToListen } : null} />
		{/if}

	{:else if result}
		<p class="label" aria-hidden="true">{T('Your retelling', 'بازگویی تو')}</p>
		<h2 class="title" tabindex="-1" bind:this={heading}>{T(`You got across ${result.covered.length} of ${result.total} key points.`, `${N(result.covered.length)} نکتهٔ کلیدی از ${N(result.total)} را گفتی.`)}</h2>
		<p class="meta">{T(`${D(result.seconds)} speaking · ${result.words} words`, `${D(result.seconds)} صحبت، ${N(result.words)} کلمه`)}{run.textShown ? T(' · with the text', '، با متن') : ''}</p>
		{#if result.words < 3}<p class="note">{T('We could hardly hear anything. Check your microphone and try again.', 'تقریباً چیزی نشنیدیم. میکروفون را بررسی کن و دوباره امتحان کن.')}</p>{/if}
		{#if result.feedback}<p class="feedback">{text(result.feedback)}</p>{:else if result.feedbackError}<p class="note">{T('Your words are below, but feedback isn’t available right now.', 'حرف‌هایت پایین هست، اما بازخورد الان در دسترس نیست.')}</p>{/if}

		<h3>{T('Key points', 'نکته‌های کلیدی')}</h3>
		<ul class="points">{#each piece.keyPoints as point, index}{@const hit = result.covered.includes(index + 1)}<li class:hit lang="en" dir="ltr">{point}<span class="sr-only">{hit ? ' (covered)' : ' (missed)'}</span></li>{/each}</ul>

		{#if result.inaccuracies.length}
			<h3>{T('Not quite what the story said', 'با داستان فرق داشت')}</h3>
			{#each result.inaccuracies as item}<div class="item" lang="en" dir="ltr"><p class="said">{item.said}</p><p>{item.fact}</p></div>{/each}
		{/if}
		{#if result.upgrades.length}
			<h3>{T('Say it more naturally', 'طبیعی‌تر بگو')}</h3>
			{#each result.upgrades as upgrade}
				<div class="item">
					<p lang="en" dir="ltr"><span class="said">{upgrade.original}</span> <span aria-hidden="true">→</span> <strong>{upgrade.better}</strong></p>
					<p class="why">{text(upgrade.why)}</p>
					<button type="button" class="quiet" onclick={() => listenTo(upgrade.better, upgrade.voiceSig)}>{T('Listen', 'شنیدن')}</button>
				</div>
			{/each}
		{/if}
		<details><summary>{T('What you said', 'آنچه گفتی')}</summary><p lang="en" dir="ltr">{result.transcript || '—'}</p></details>
		<details><summary>{T('The story', 'متن داستان')}</summary><p lang="en" dir="ltr">{piece.text}</p></details>
		<ActionBar label={doneLabel ? text(doneLabel) : T('Continue', 'ادامه')} onclick={finish} secondary={{ label: T('Try this story again', 'این داستان را دوباره امتحان کن'), onclick: again }} />
	{/if}
</section>

<style>
	.retell { display: grid; gap: 14px; padding-block-end: 130px; }
	.label { margin: 0; font-size: .78rem; font-weight: 700; letter-spacing: .06em; color: var(--accent-deep); }
	:global([dir='rtl']) .label { letter-spacing: normal; }
	.title { margin: 0; font-family: var(--font-display); font-size: 1.35rem; line-height: 1.3; }
	.title:focus { outline: none; }
	.card { padding: 16px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); display: grid; gap: 10px; }
	.card .title { font-size: 1.4rem; }
	.meta { margin: 0; color: var(--ink-soft); font-size: .92rem; line-height: 1.55; }
	.banner { display: block; inline-size: 100%; block-size: auto; max-block-size: 220px; aspect-ratio: 3 / 2; object-fit: cover; border-radius: 16px; background: var(--paper-sunken); }
	.bar { block-size: 8px; border-radius: 8px; background: var(--paper-sunken); border: 1px solid var(--line); overflow: hidden; }
	.bar span { display: block; block-size: 100%; background: var(--accent); transition: width .2s linear; }
	.clock { color: var(--ink-soft); font-size: .9rem; }
	.clock strong { color: var(--ink); font-size: 1.3rem; }
	.words { padding: 14px 16px; border-radius: 12px; background: var(--paper-sunken); line-height: 1.75; }
	.quiet { justify-self: start; min-height: 44px; padding: 8px 0; border: 0; background: none; color: var(--accent-deep); font: inherit; font-size: .92rem; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; text-align: start; }
	.note { margin: 0; padding: 12px 14px; border-radius: 10px; background: var(--attention-wash); color: var(--attention); font-size: .92rem; }
	.small { margin: 0; font-size: .8rem; color: var(--ink-soft); }
	audio { inline-size: 100%; }
	.feedback { margin: 0; padding: 14px 16px; border-radius: 12px; background: var(--accent-wash); line-height: 1.6; }
	h3 { margin: 10px 0 0; font-family: var(--font-display); font-size: 1.1rem; }
	.points { list-style: none; padding: 0; margin: 0; display: grid; gap: 8px; }
	.points li { display: flex; gap: 10px; color: var(--ink-soft); line-height: 1.5; }
	.points li::before { content: '○'; flex: none; }
	.points li.hit { color: var(--ink); }
	.points li.hit::before { content: '✓'; color: var(--accent-deep); font-weight: 700; }
	.item { display: grid; gap: 4px; padding: 10px 0; border-top: 1px solid var(--line); }
	.item p { margin: 0; line-height: 1.55; }
	.said { color: var(--ink-soft); }
	.why { color: var(--ink-soft); font-size: .9rem; }
	details { border-top: 1px solid var(--line); padding-top: 10px; }
	summary { cursor: pointer; font-weight: 600; min-height: 44px; display: flex; align-items: center; }
	details p { margin: 8px 0 0; line-height: 1.75; }
	button:focus-visible, summary:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
</style>
