<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import CourseSwitcher from '$lib/components/CourseSwitcher.svelte';
	import { RETELL_PIECES, MAX_LISTENS, formatDuration, listenSeconds, speakLimit, type RetellPiece } from '$lib/practice/retell';
	import type { DisplayText } from '$lib/practice/hotel';
	import type { RetellRecord } from '$lib/practice/progress';
	import { getLanguage, setLanguage } from '$services/data-layer';
	import { playAudioUrl, stopAllAudio, ENGLISH_VOICES, type TTSVoice } from '$services/tts';

	let { data }: PageProps = $props();
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	const text = (value: DisplayText) => value[language];
	let records = $state<RetellRecord>({});

	type Stage = 'list' | 'listen' | 'speak' | 'checking' | 'result';
	let stage = $state<Stage>('list');
	let piece = $state<RetellPiece | null>(null);
	let voice = $state<TTSVoice>('b');

	// Listening
	let audio: HTMLAudioElement | null = null;
	let listens = $state(0), playing = $state(false), loadingAudio = $state(false), progress = $state(0);
	let audioFailed = $state(false), textShown = $state(false);

	// Speaking
	let recorder: MediaRecorder | null = null, stream: MediaStream | null = null, chunks: Blob[] = [];
	let recording = $state(false), elapsed = $state(0), recordingUrl = $state(''), recordingBlob: Blob | null = null;
	let tick: ReturnType<typeof setInterval> | undefined, startedAt = 0;
	let micMessage = $state<DisplayText | null>(null);

	// Result
	type Upgrade = { original: string; better: string; why: DisplayText; voiceSig?: string };
	type Result = {
		transcript: string; words: number; seconds: number; wordsPerMinute: number | null; total: number;
		covered: number[]; inaccuracies: { said: string; fact: string }[]; upgrades: Upgrade[];
		feedback: DisplayText | null; feedbackError?: boolean;
	};
	let result = $state<Result | null>(null);
	let error = $state<DisplayText | null>(null);
	let generation = 0;

	const limit = $derived(piece ? speakLimit(piece) : 90);
	/** Pausing never costs a play; starting from the beginning does. */
	const canPlay = $derived(!audioFailed && !loadingAudio && (playing || (progress > 0 && progress < 1) || listens < MAX_LISTENS));

	onMount(() => {
		records = data.records;
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		return () => { cleanUpAudio(); stopRecording(true); if (recordingUrl) URL.revokeObjectURL(recordingUrl); };
	});
	async function changeDisplay(value: 'en' | 'fa') { language = value; await setLanguage(value); }

	function cleanUpAudio() {
		if (audio) { audio.pause(); audio.src = ''; audio = null; }
		playing = false; loadingAudio = false;
	}
	function open(next: RetellPiece) {
		generation++;
		cleanUpAudio(); stopRecording(true); discardRecording();
		piece = next; stage = 'listen'; listens = 0; progress = 0; audioFailed = false; textShown = false;
		result = null; error = null; micMessage = null;
		voice = ENGLISH_VOICES[Math.floor(Math.random() * ENGLISH_VOICES.length)].id;
	}
	function backToList() {
		generation++; cleanUpAudio(); stopRecording(true); discardRecording(); stopAllAudio();
		stage = 'list'; piece = null; result = null; error = null;
	}

	function togglePlay() {
		if (!piece) return;
		if (audio && playing) { audio.pause(); return; }
		if (audio && !audio.ended && audio.currentTime > 0) { void audio.play(); return; }
		if (listens >= MAX_LISTENS) return;
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
		listens++;
		audio.play().catch(() => { loadingAudio = false; audioFailed = true; });
	}
	function showText() { textShown = true; }
	function readyToSpeak() { cleanUpAudio(); stage = 'speak'; error = null; }

	function discardRecording() {
		if (recordingUrl) URL.revokeObjectURL(recordingUrl);
		recordingUrl = ''; recordingBlob = null; elapsed = 0;
	}
	async function startRecording() {
		micMessage = null; discardRecording(); stopAllAudio();
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
			micMessage = { en: 'This browser can’t record audio. Try Chrome, Edge or Safari.', fa: 'این مرورگر نمی‌تواند صدا ضبط کند. کروم، اج یا سافاری را امتحان کن.' }; return;
		}
		const current = generation;
		try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
		catch { micMessage = { en: 'Microphone access was blocked. Allow the microphone for this site and try again.', fa: 'دسترسی به میکروفون مسدود شد. اجازهٔ میکروفون را برای این سایت بده و دوباره امتحان کن.' }; return; }
		if (current !== generation || stage !== 'speak') { stream.getTracks().forEach(track => track.stop()); stream = null; return; }
		const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
		recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 32_000 });
		chunks = [];
		recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
		recorder.onstop = () => {
			const blob = new Blob(chunks, { type: (recorder?.mimeType || mimeType || 'audio/webm').split(';')[0] });
			if (blob.size) { recordingBlob = blob; recordingUrl = URL.createObjectURL(blob); }
			recorder = null;
		};
		recorder.start(1000);
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
		stream?.getTracks().forEach(track => track.stop()); stream = null;
		recording = false;
	}

	async function submit() {
		if (!piece || !recordingBlob) return;
		const current = generation;
		stage = 'checking'; error = null;
		const body = new FormData();
		body.set('piece', piece.id);
		body.set('seconds', String(Math.round(elapsed)));
		body.set('textShown', textShown ? '1' : '0');
		body.set('audio', recordingBlob, 'retell');
		try {
			const response = await fetch('/api/english/retell', { method: 'POST', body });
			if (current !== generation) return;
			if (!response.ok) {
				stage = 'speak';
				error = response.status === 429
					? { en: 'Today’s AI allowance is used up. It resets at 00:00 UTC.', fa: 'سهمیهٔ امروز هوش مصنوعی تمام شده است. ساعت ۰۰:۰۰ به وقت UTC تازه می‌شود.' }
					: response.status === 413 ? { en: 'That recording is too large to send.', fa: 'این ضبط برای ارسال خیلی بزرگ است.' }
					: { en: 'We couldn’t check your recording just now. Your recording is still here; try again in a moment.', fa: 'الان نتوانستیم ضبطت را بررسی کنیم. ضبطت هنوز اینجاست؛ کمی بعد دوباره امتحان کن.' };
				return;
			}
			const value = await response.json();
			if (current !== generation) return;
			result = value as Result;
			if (value.saved && result.covered.length >= (records[piece.id]?.points ?? -1)) {
				records = { ...records, [piece.id]: { completedAt: new Date().toISOString(), points: result.covered.length, total: result.total, textShown } };
			}
			stage = 'result';
		} catch {
			if (current !== generation) return;
			stage = 'speak';
			error = { en: 'We couldn’t reach the server. Check your connection and try again.', fa: 'به سرور دسترسی نداشتیم. اتصال را بررسی کن و دوباره امتحان کن.' };
		}
	}
	function listenTo(upgrade: Upgrade) {
		const sig = upgrade.voiceSig ? `&sig=${encodeURIComponent(upgrade.voiceSig)}` : '';
		void playAudioUrl(`/api/english/voice?v=1&voice=${voice}&text=${encodeURIComponent(upgrade.better)}${sig}`);
	}
	function tryAgain() { if (piece) open(piece); }
</script>

<svelte:head>
	<title>{isFa ? 'گوش بده و بازگو کن | تمرین انگلیسی' : 'Listen & retell | English practice'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="retell-page" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/practice/english" backLabel={isFa ? 'تمرین انگلیسی' : 'English practice'} direction={isFa ? 'rtl' : 'ltr'}>
		{#snippet actions()}
			<label class="display-control">{isFa ? 'نمایش' : 'Display'}
				<select aria-label={isFa ? 'زبان نمایش' : 'Display language'} value={language} onchange={e => void changeDisplay(e.currentTarget.value as 'en' | 'fa')}>
					<option value="en">English</option><option value="fa">فارسی</option>
				</select>
			</label>
		{/snippet}
	</AppHeader>
	<CourseSwitcher {language} targetLanguage="en" />

	{#if stage === 'list' || !piece}
		<section class="intro">
			<p class="eyebrow">{isFa ? 'انگلیسی · گوش بده و بازگو کن' : 'ENGLISH · LISTEN & RETELL'}</p>
			<h1>{isFa ? 'گوش بده، بعد با کلمات خودت تعریفش کن.' : 'Listen, then tell it in your own words.'}</h1>
			<ol class="how">
				<li>{isFa ? `به متن گوش بده (حداکثر ${MAX_LISTENS} بار).` : `Listen to the piece (up to ${MAX_LISTENS} times).`}</li>
				<li>{isFa ? 'هر چه یادت مانده را با کلمات خودت بگو.' : 'Retell what you remember, in your own words.'}</li>
				<li>{isFa ? 'ببین کدام نکته‌ها را گفتی، و چطور می‌شد طبیعی‌تر گفت. بعد متن را بخوان.' : 'See which points you covered and how to say things more naturally, then read the text.'}</li>
			</ol>
			<p class="rule"><strong>{isFa ? 'زمان صحبت:' : 'Speaking time:'}</strong> {isFa ? 'حداقلی وجود ندارد؛ هر قدر می‌خواهی صحبت کن. هر متن یک سقف دارد که قبل از شروع می‌بینی: متن‌های کوتاه تا ۱:۳۰ و متن‌های بلندتر حداکثر ۲:۰۰. ضبط در سقف زمان خودکار متوقف می‌شود.' : 'There’s no minimum: speak for as long as you like. Each piece has a maximum, shown before you start: up to 1:30 for short pieces, and never more than 2:00, however long the listening. Recording stops automatically at the limit.'}</p>
		</section>
		<ul class="pieces">
			{#each RETELL_PIECES as item}
				{@const best = records[item.id]}
				<li><button class="piece" onclick={() => open(item)}>
					<span class="level">{item.level}</span>
					<strong>{text(item.title)}</strong>
					<span class="meta">{isFa ? 'شنیدن' : 'Listening'} ≈ {formatDuration(listenSeconds(item))} · {isFa ? 'صحبت تا' : 'You speak up to'} {formatDuration(speakLimit(item))}</span>
					{#if best}<span class="best">✓ {isFa ? `بهترین: ${best.points} از ${best.total} نکته` : `Best: ${best.points} of ${best.total} key points`}{best.textShown ? (isFa ? ' (با متن)' : ' (with text)') : ''}</span>{/if}
				</button></li>
			{/each}
		</ul>
		<p class="small-note other"><a href="/practice/english">{isFa ? 'گفت‌وگوی هتل را امتحان کن ←' : 'Or practise a conversation: A quieter room →'}</a></p>
	{:else}
		<div class="session-heading">
			<div><p class="eyebrow">{piece.level} · {isFa ? 'گوش بده و بازگو کن' : 'LISTEN & RETELL'}</p><h1>{text(piece.title)}</h1></div>
			<button class="text-button" onclick={backToList}>{isFa ? 'همهٔ متن‌ها' : 'All pieces'}</button>
		</div>
		<ol class="steps" aria-label={isFa ? 'مراحل' : 'Steps'}>
			<li class:current={stage === 'listen'}>{isFa ? '۱. گوش بده' : '1. Listen'}</li>
			<li class:current={stage === 'speak' || stage === 'checking'}>{isFa ? '۲. بازگو کن' : '2. Retell'}</li>
			<li class:current={stage === 'result'}>{isFa ? '۳. بازخورد' : '3. Feedback'}</li>
		</ol>

		{#if stage === 'listen'}
			<section class="panel">
				<p class="rule"><strong>{isFa ? 'سقف صحبت برای این متن:' : 'Speaking limit for this piece:'}</strong> {formatDuration(limit)}. {isFa ? 'حداقلی ندارد.' : 'No minimum.'}</p>
				<div class="player">
					<button class="primary" onclick={togglePlay} disabled={!canPlay}>
						{#if loadingAudio}{isFa ? 'در حال آماده‌سازی…' : 'Preparing…'}{:else if playing}{isFa ? 'مکث' : 'Pause'}{:else if progress > 0 && progress < 1}{isFa ? 'ادامه' : 'Resume'}{:else if listens === 0}{isFa ? 'پخش' : 'Play'}{:else}{isFa ? 'پخش دوباره' : 'Play again'}{/if}
					</button>
					<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress * 100)} aria-label={isFa ? 'پیشرفت پخش' : 'Playback progress'}><span style:width={`${progress * 100}%`}></span></div>
					<span class="count">{isFa ? `${MAX_LISTENS - listens} بار دیگر` : `${MAX_LISTENS - listens} ${MAX_LISTENS - listens === 1 ? 'play' : 'plays'} left`}</span>
				</div>
				{#if loadingAudio}<p class="small-note">{isFa ? 'بار اول ممکن است تا نیم دقیقه طول بکشد.' : 'The first play can take up to half a minute to prepare.'}</p>{/if}
				{#if audioFailed}<p class="notice">{isFa ? 'صدا الان در دسترس نیست. می‌توانی متن را بخوانی و بعد بازگو کنی.' : 'The audio isn’t available right now. You can read the text instead, then retell it.'}</p>{/if}
				{#if textShown}<div class="piece-text" lang="en" dir="ltr">{piece.text}</div>
				{:else}<button class="text-button" onclick={showText}>{isFa ? 'نمایش متن (در نتیجه «با متن» ثبت می‌شود)' : 'Show the text (your result is marked “with text”)'}</button>{/if}
				<div class="actions"><button class="primary" onclick={readyToSpeak} disabled={listens === 0 && !textShown}>{isFa ? 'آماده‌ام بازگو کنم' : 'I’m ready to retell'} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button></div>
			</section>
		{:else if stage === 'speak' || stage === 'checking'}
			<section class="panel">
				<p class="rule">{isFa ? `هر چه یادت مانده را با کلمات خودت بگو. حداقلی ندارد؛ حداکثر ${formatDuration(limit)}. ضبط در این زمان خودکار متوقف می‌شود.` : `Tell it in your own words. There’s no minimum; the maximum is ${formatDuration(limit)}, and recording stops automatically then.`}</p>
				<div class="recorder">
					<div class="clock" aria-live="off"><strong>{formatDuration(elapsed)}</strong> / {formatDuration(limit)}</div>
					<div class="bar"><span style:width={`${Math.min(1, elapsed / limit) * 100}%`}></span></div>
					{#if recording}<button class="primary stop" onclick={() => stopRecording()}>{isFa ? 'پایان' : 'Stop'}</button>
					{:else}<button class="primary" onclick={startRecording} disabled={stage === 'checking'}>{recordingUrl ? (isFa ? 'ضبط دوباره' : 'Record again') : (isFa ? 'شروع صحبت' : 'Start speaking')}</button>{/if}
				</div>
				{#if micMessage}<p class="notice" role="alert">{text(micMessage)}</p>{/if}
				{#if recordingUrl && !recording}
					<!-- svelte-ignore a11y_media_has_caption -->
					<audio controls src={recordingUrl}></audio>
					<div class="actions"><button class="primary" onclick={submit} disabled={stage === 'checking'}>{stage === 'checking' ? (isFa ? 'در حال گوش دادن به تو…' : 'Listening to your retelling…') : (isFa ? 'دریافت بازخورد' : 'Get feedback')} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button></div>
				{/if}
				{#if error}<p class="notice" role="alert">{text(error)}</p>{/if}
				<p class="small-note">{isFa ? 'ضبط تو برای تبدیل به متن به OpenAI فرستاده می‌شود و ذخیره نمی‌شود.' : 'Your recording is sent to OpenAI to turn it into text. It isn’t stored.'}</p>
			</section>
		{:else if stage === 'result' && result}
			<section class="panel result">
				<div class="stats">
					<span><strong>{result.covered.length}/{result.total}</strong> {isFa ? 'نکتهٔ کلیدی' : 'key points'}</span>
					<span><strong>{formatDuration(result.seconds)}</strong> {isFa ? 'صحبت' : 'speaking'}</span>
					<span><strong>{result.words}</strong> {isFa ? 'کلمه' : 'words'}</span>
					{#if result.wordsPerMinute}<span><strong>{result.wordsPerMinute}</strong> {isFa ? 'کلمه در دقیقه' : 'words per minute'}</span>{/if}
				</div>
				{#if result.words < 3}<p class="notice">{isFa ? 'تقریباً چیزی نشنیدیم. میکروفون را بررسی کن و دوباره امتحان کن.' : 'We could hardly hear anything. Check your microphone and try again.'}</p>{/if}
				{#if result.feedback}<p class="feedback">{text(result.feedback)}</p>{:else if result.feedbackError}<p class="notice">{isFa ? 'متن صحبتت آماده است، اما بازخورد الان در دسترس نیست.' : 'Your transcript is ready, but feedback isn’t available right now.'}</p>{/if}

				<h2>{isFa ? 'نکته‌های کلیدی' : 'Key points'}</h2>
				<ul class="points">{#each piece.keyPoints as point, index}<li class:hit={result.covered.includes(index + 1)} lang="en" dir="ltr">{point}<span class="sr-only">{result.covered.includes(index + 1) ? ' (covered)' : ' (missed)'}</span></li>{/each}</ul>

				{#if result.inaccuracies.length}
					<h2>{isFa ? 'با متن فرق داشت' : 'Not quite what the piece said'}</h2>
					{#each result.inaccuracies as item}<div class="item" lang="en" dir="ltr"><p><span class="said">{item.said}</span></p><p>{item.fact}</p></div>{/each}
				{/if}

				{#if result.upgrades.length}
					<h2>{isFa ? 'طبیعی‌تر بگو' : 'Say it more naturally'}</h2>
					{#each result.upgrades as upgrade}<div class="item"><p lang="en" dir="ltr"><span class="said">{upgrade.original}</span> <span aria-hidden="true">→</span> <strong>{upgrade.better}</strong></p><p>{text(upgrade.why)}</p><button type="button" class="text-button" onclick={() => listenTo(upgrade)}>{isFa ? 'شنیدن' : 'Listen'}</button></div>{/each}
				{/if}

				<details><summary>{isFa ? 'آنچه گفتی' : 'What you said'}</summary><p lang="en" dir="ltr">{result.transcript || '—'}</p></details>
				<details open><summary>{isFa ? 'متن کامل' : 'The full text'}</summary><p lang="en" dir="ltr">{piece.text}</p></details>
				<div class="actions"><button class="secondary" onclick={tryAgain}>{isFa ? 'دوباره امتحان کن' : 'Try this one again'}</button><button class="primary" onclick={backToList}>{isFa ? 'متن بعدی' : 'Choose another piece'}</button></div>
			</section>
		{/if}
	{/if}
</main>

<style>
	.retell-page { max-width: 860px; margin: 0 auto; padding: 24px 24px 64px; color: var(--ink); }
	.display-control { display: flex; align-items: center; gap: 8px; color: var(--ink-soft); font-size: .8rem; }
	select { min-height: 40px; padding: 5px 8px; border: 1px solid var(--control-border); border-radius: 8px; background: var(--paper-raised); color: var(--ink); }
	.eyebrow { font-size: .76rem; letter-spacing: .12em; font-weight: 600; color: var(--accent-deep); margin-bottom: 12px; }
	h1, h2 { font-family: var(--font-display); font-weight: 500; }
	h1 { font-size: clamp(1.8rem, 4vw, 2.8rem); line-height: 1.15; margin-bottom: 18px; }
	h2 { font-size: 1.25rem; margin: 26px 0 12px; }
	p { line-height: 1.65; }
	button { font: inherit; cursor: pointer; }
	button:disabled { opacity: .55; cursor: default; }
	button:focus-visible, select:focus-visible, a:focus-visible, summary:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	.primary { display: inline-flex; gap: 14px; align-items: center; justify-content: center; min-height: 48px; padding: 12px 22px; background: var(--accent); color: var(--on-accent); border: 1px solid var(--accent); border-radius: 10px; font-weight: 600; }
	.primary:hover:not(:disabled) { background: var(--accent-deep); }
	.secondary { min-height: 48px; padding: 12px 18px; background: var(--paper-raised); border: 1px solid var(--control-border); border-radius: 10px; color: var(--ink); }
	.text-button { min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font-size: .88rem; text-align: start; }
	.intro { padding: 32px 0 8px; }
	.how { padding-inline-start: 22px; color: var(--ink-soft); line-height: 1.9; margin-bottom: 18px; }
	.rule { padding: 12px 14px; border-radius: 10px; background: var(--paper-sunken); border: 1px solid var(--line); font-size: .9rem; }
	.pieces { list-style: none; padding: 0; margin: 24px 0; display: grid; gap: 12px; }
	.piece { width: 100%; display: grid; gap: 4px; text-align: start; padding: 18px 20px; border: 1px solid var(--control-border); border-radius: 14px; background: var(--paper-raised); color: var(--ink); }
	.piece:hover { border-color: var(--accent); }
	.piece strong { font-size: 1.1rem; }
	.level { font-size: .72rem; font-weight: 700; letter-spacing: .1em; color: var(--accent-deep); }
	.meta { color: var(--ink-soft); font-size: .85rem; }
	.best { color: var(--accent-deep); font-size: .85rem; }
	.other a { color: var(--accent-deep); }
	.session-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin: 28px 0 12px; }
	.session-heading h1 { margin: 0; font-size: 1.9rem; }
	.steps { display: flex; gap: 18px; list-style: none; padding: 0; margin: 0 0 18px; color: var(--ink-soft); font-size: .85rem; }
	.steps li.current { color: var(--accent-deep); font-weight: 600; }
	.panel { border: 1px solid var(--control-border); border-radius: 18px; background: var(--paper-raised); padding: 24px; display: grid; gap: 16px; }
	.player, .recorder { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 14px; }
	.recorder { grid-template-columns: auto 1fr auto; }
	.bar { height: 8px; border-radius: 8px; background: var(--paper-sunken); border: 1px solid var(--line); overflow: hidden; }
	.bar span { display: block; height: 100%; background: var(--accent); transition: width .2s linear; }
	.count, .clock { color: var(--ink-soft); font-size: .85rem; white-space: nowrap; }
	.clock strong { color: var(--ink); font-size: 1.1rem; }
	.stop { background: var(--miss, #c0392b); border-color: var(--miss, #c0392b); }
	.piece-text { padding: 16px; border-radius: 12px; background: var(--paper-sunken); line-height: 1.8; }
	.notice { padding: 12px 14px; border-radius: 10px; background: var(--attention-wash); color: var(--attention); font-size: .9rem; }
	.actions { display: flex; flex-wrap: wrap; gap: 12px; justify-content: flex-end; }
	audio { width: 100%; }
	.small-note { font-size: .8rem; color: var(--ink-soft); }
	.stats { display: flex; flex-wrap: wrap; gap: 10px 26px; color: var(--ink-soft); }
	.stats strong { color: var(--ink); font-size: 1.2rem; }
	.feedback { padding: 14px 16px; border-radius: 12px; background: var(--accent-wash); }
	.points { list-style: none; padding: 0; display: grid; gap: 8px; }
	.points li { display: flex; gap: 10px; color: var(--ink-soft); line-height: 1.5; }
	.points li::before { content: '○'; }
	.points li.hit { color: var(--ink); }
	.points li.hit::before { content: '✓'; color: var(--accent-deep); font-weight: 700; }
	.item { padding: 12px 0; border-top: 1px solid var(--line); }
	.item p { margin: 0; }
	.item p + p { color: var(--ink-soft); margin-top: 6px; font-size: .9rem; }
	.said { color: var(--ink-soft); }
	details { border-top: 1px solid var(--line); padding-top: 12px; }
	summary { cursor: pointer; font-weight: 600; min-height: 32px; }
	details p { margin-top: 10px; line-height: 1.8; }
	@media (max-width: 640px) {
		.retell-page { padding: 16px 16px 40px; }
		.panel { padding: 18px 16px; }
		.player, .recorder { grid-template-columns: 1fr; }
		.session-heading h1 { font-size: 1.5rem; }
		.display-control { font-size: 0; } .display-control select { font-size: .85rem; }
	}
</style>
