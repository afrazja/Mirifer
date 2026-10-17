<script lang="ts">
	/**
	 * "Check my pronunciation" (Module lab experiment, reached from the Minimal pairs result).
	 * One word at a time: say it, and a small model on the phone says which of the two words it
	 * sounded like. The model downloads once, only after the learner agrees. Nothing is sent.
	 */
	import { onDestroy, onMount } from 'svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import MixedText from '$lib/components/MixedText.svelte';
	import { playAudioUrl, stopAllAudio, ttsUrl } from '$services/tts';
	import { isDownloaded, loadChecker, type CheckResult } from '$services/local-pronounce';
	import { DOWNLOAD_MB } from '$lib/practice/pronounce-local';
	import { CONTRASTS, VOICE, type CheckWord } from '$lib/practice/minimal-pairs';

	let { isFa = false, words, onBack }: { isFa?: boolean; words: CheckWord[]; onBack: () => void } = $props();

	/** Recording stops by itself once they stop speaking, or after this long. */
	const MAX_SECONDS = 6, SPEAKING_LEVEL = 0.02, QUIET_AFTER_MS = 900;
	type Stage = 'checking' | 'consent' | 'loading' | 'failed' | 'say' | 'recording' | 'judging' | 'verdict' | 'end';
	type Verdict = 'right' | 'wrong' | 'unsure' | 'silent' | 'error';
	let stage = $state<Stage>('checking'), progress = $state(0), index = $state(0), elapsed = $state(0);
	let verdict = $state<Verdict | null>(null), micDenied = $state(false), myUrl = $state<string | null>(null), playing = $state(false), announce = $state('');
	// The last clear verdict per word ('unsure' when it was too close to call).
	// svelte-ignore state_referenced_locally
	let results = $state<('right' | 'wrong' | 'unsure' | null)[]>(words.map(() => null));
	let heading: HTMLElement | undefined = $state(), resultLine: HTMLElement | undefined = $state();
	let recorder: MediaRecorder | null = null, stream: MediaStream | null = null, chunks: Blob[] = [], timer: ReturnType<typeof setInterval> | undefined, myPlayer: HTMLAudioElement | null = null;
	let meter: AudioContext | null = null, alive = true, announced = -1;

	const T = (en: string, fa: string) => (isFa ? fa : en);
	const N = (n: number) => (isFa ? n.toLocaleString('fa-IR') : String(n));
	const item = $derived(words[Math.min(index, words.length - 1)]);
	const target = $derived(item.pair[item.target]);
	const other = $derived(item.pair[1 - item.target]);
	const last = $derived(index + 1 >= words.length);
	const right = $derived(results.filter(r => r === 'right').length);
	const checked = $derived(results.filter(r => r === 'right' || r === 'wrong').length);
	const percent = $derived(Math.round(progress * 100));

	onMount(() => { void isDownloaded().then(cached => { if (!alive) return; if (cached) void download(); else { stage = 'consent'; focusHeading(); } }); });
	onDestroy(() => { alive = false; stopMeter(); stopAllAudio(); myPlayer?.pause(); if (recorder && recorder.state !== 'inactive') recorder.stop(); stream?.getTracks().forEach(t => t.stop()); if (myUrl) URL.revokeObjectURL(myUrl); });

	function focusHeading() { queueMicrotask(() => heading?.focus()); }
	async function download() {
		stage = 'loading'; progress = 0; announced = -1; focusHeading();
		try {
			await loadChecker(fraction => {
				progress = fraction;
				// Screen readers hear every quarter, not every percent.
				const step = Math.floor(fraction * 4);
				if (step > announced) { announced = step; announce = step >= 4 ? T('Getting ready…', 'در حال آماده شدن…') : T(`Downloading… ${step * 25}%`, `در حال دانلود… ${N(step * 25)}٪`); }
			});
			if (!alive) return;
			announce = ''; stage = 'say'; focusHeading();
		} catch (error) {
			console.error('Pronunciation checker failed to load', error);
			if (alive) { stage = 'failed'; focusHeading(); }
		}
	}

	async function hearMira() {
		if (playing || stage === 'recording' || stage === 'judging') return;
		stopAllAudio(); myPlayer?.pause(); playing = true;
		const { url, playback } = ttsUrl(target, 'en-US', 1, VOICE);
		await playAudioUrl(url, 10_000, playback);
		playing = false;
	}
	function hearMine() { if (!myUrl) return; stopAllAudio(); myPlayer?.pause(); myPlayer = new Audio(myUrl); void myPlayer.play().catch(() => {}); }

	function stopMeter() { clearInterval(timer); void meter?.close().catch(() => {}); meter = null; }
	async function record() {
		if (stage === 'recording') { recorder?.stop(); return; }
		if (stage !== 'say') return;
		stopAllAudio(); myPlayer?.pause(); micDenied = false;
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { micDenied = true; return; }
		try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { micDenied = true; return; }
		const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
		recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
		chunks = [];
		recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
		recorder.onstop = () => {
			stopMeter();
			stream?.getTracks().forEach(t => t.stop()); stream = null;
			const blob = new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' });
			if (myUrl) URL.revokeObjectURL(myUrl);
			myUrl = chunks.length ? URL.createObjectURL(blob) : null;
			if (alive) void judge(blob);
		};
		recorder.start();
		// A level meter: stop shortly after they finish speaking.
		let level: (() => number) | null = null;
		try {
			meter = new AudioContext();
			const analyser = meter.createAnalyser(), samples = new Float32Array(1024);
			analyser.fftSize = 1024;
			meter.createMediaStreamSource(stream).connect(analyser);
			level = () => { analyser.getFloatTimeDomainData(samples); let sum = 0; for (const v of samples) sum += v * v; return Math.sqrt(sum / samples.length); };
		} catch { level = null; }
		const startedAt = performance.now(); let spoke = false, lastLoud = startedAt;
		elapsed = 0; stage = 'recording';
		timer = setInterval(() => {
			const now = performance.now();
			elapsed = (now - startedAt) / 1000;
			if (level && level() > SPEAKING_LEVEL) { spoke = true; lastLoud = now; }
			const done = elapsed >= MAX_SECONDS || (spoke && now - lastLoud > QUIET_AFTER_MS);
			if (done && recorder?.state === 'recording') recorder.stop();
		}, 100);
	}
	async function judge(blob: Blob) {
		stage = 'judging'; announce = T('Checking…', 'در حال بررسی…');
		let outcome: Verdict;
		try {
			const checker = await loadChecker();
			const result: CheckResult = blob.size ? await checker.judge(blob, item.pair) : { silent: true };
			outcome = result.silent ? 'silent' : result.unsure ? 'unsure' : result.heard === target ? 'right' : 'wrong';
		} catch (error) {
			console.error('Pronunciation check failed', error);
			outcome = 'error';
		}
		if (!alive) return;
		verdict = outcome; announce = '';
		if (outcome === 'right' || outcome === 'wrong' || outcome === 'unsure') { const next = [...results]; next[index] = outcome; results = next; }
		stage = 'verdict';
		queueMicrotask(() => resultLine?.focus());
	}
	function again() { verdict = null; stage = 'say'; focusHeading(); }
	function next() {
		verdict = null; myPlayer?.pause(); if (myUrl) URL.revokeObjectURL(myUrl); myUrl = null;
		if (last) { stage = 'end'; focusHeading(); return; }
		index += 1; stage = 'say'; focusHeading();
	}
	function restart() { results = words.map(() => null); index = 0; again(); }
	function back() { stopAllAudio(); stopMeter(); if (recorder && recorder.state !== 'inactive') { recorder.onstop = null; recorder.stop(); } onBack(); }

	const label = $derived(T(`Word ${index + 1} of ${words.length}`, `کلمهٔ ${N(index + 1)} از ${N(words.length)}`));
	const nextLabel = $derived(last ? T('See how you did', 'دیدن نتیجه') : T('Next word', 'کلمهٔ بعدی'));
	const tryAgain = $derived(T('Try again', 'دوباره امتحان کن'));
	const mark = (r: 'right' | 'wrong' | 'unsure' | null) => (r === 'right' ? '✓' : r === 'wrong' ? '✗' : r === 'unsure' ? '?' : '–');
	const markText = (r: 'right' | 'wrong' | 'unsure' | null) => (r === 'right' ? T('sounded right', 'درست') : r === 'wrong' ? T('sounded like the other word', 'شبیه کلمهٔ دیگر') : r === 'unsure' ? T('hard to tell', 'نامطمئن') : T('not checked', 'بررسی نشد'));
</script>

{#snippet q(word: string)}{isFa ? '«' : '“'}<bdi lang="en" dir="ltr">{word}</bdi>{isFa ? '»' : '”'}{/snippet}
{#snippet wordList()}{#each words as w, i}{#if i > 0}{isFa ? '، ' : ', '}{/if}<bdi lang="en" dir="ltr">{w.pair[w.target]}</bdi>{/each}{/snippet}

<section class="pc">
	<p class="label">{T('Experiment · pronunciation check', 'آزمایشی · بررسی تلفظ')}</p>
	<p class="sr-only" role="status" aria-live="polite">{announce}</p>

	{#if stage === 'checking'}
		<p class="hint">{T('One moment…', 'یک لحظه…')}</p>

	{:else if stage === 'consent' || stage === 'loading' || stage === 'failed'}
		<h2 tabindex="-1" bind:this={heading}>{T('Check how you say these words', 'ببین این کلمه‌ها را چطور می‌گویی')}</h2>
		{#if stage === 'consent'}
			<p>{T(`You’ll say ${words.length} words:`, `${N(words.length)} کلمه را می‌گویی:`)} {@render wordList()}{T('. A small checker on this phone listens and tells you how each one sounded.', '. ابزاری روی همین گوشی گوش می‌دهد و می‌گوید هر کدام چطور شنیده شد.')}</p>
			<p>{T(`It downloads once: about ${DOWNLOAD_MB} MB, so use Wi‑Fi if you can. Then allow the microphone.`, `فقط یک بار حدود ${N(DOWNLOAD_MB)} مگابایت دانلود می‌شود؛ اگر می‌توانی به وای‌فای وصل شو. بعد اجازهٔ میکروفون را بده.`)}</p>
			<p>{T('Your voice never leaves your phone. It’s an experiment, so it can be wrong.', 'صدایت از گوشی‌ات بیرون نمی‌رود. این بخش آزمایشی است و ممکن است اشتباه کند.')}</p>
			<ActionBar label={T(`Download (${DOWNLOAD_MB} MB)`, `دانلود (${N(DOWNLOAD_MB)} مگابایت)`)} onclick={download} secondary={{ label: T('Not now', 'الان نه'), onclick: back }} />
		{:else if stage === 'loading'}
			<p aria-hidden="true">{progress >= 1 ? T('Getting ready…', 'در حال آماده شدن…') : T(`Downloading… ${percent}%`, `در حال دانلود… ${N(percent)}٪`)}</p>
			<div class="track" role="progressbar" aria-label={T('Download', 'دانلود')} aria-valuemin="0" aria-valuemax="100" aria-valuenow={percent}><span style:inline-size="{percent}%"></span></div>
			<ActionBar label={progress >= 1 ? T('Getting ready…', 'در حال آماده شدن…') : T('Downloading…', 'در حال دانلود…')} onclick={() => {}} disabled secondary={{ label: T('Back', 'برگشت'), onclick: back }} />
		{:else}
			<p class="note" role="alert">{T('Couldn’t download the checker. Check your connection and try again.', 'ابزار بررسی تلفظ دانلود نشد. اتصال اینترنت را بررسی کن و دوباره امتحان کن.')}</p>
			<ActionBar label={tryAgain} onclick={download} secondary={{ label: T('Back', 'برگشت'), onclick: back }} />
		{/if}

	{:else if stage === 'end'}
		<h2 tabindex="-1" bind:this={heading} class="big">
			{#if checked === 0}{T('No clear results this time', 'این بار نتیجهٔ روشنی نبود')}
			{:else}{T(`${right} of ${checked} sounded right`, `${N(right)} از ${N(checked)} کلمه درست به گوش رسید`)}{/if}
		</h2>
		<ul class="list">
			{#each words as w, i}
				<li class={results[i] ?? 'none'}><bdi lang="en" dir="ltr">{w.pair[w.target]}</bdi><span><span aria-hidden="true">{mark(results[i])}</span><span class="sr-only">{markText(results[i])}</span></span></li>
			{/each}
		</ul>
		<p class="hint">{T('This checker is an experiment and can be wrong. Trust your ear too.', 'این بررسی آزمایشی است و ممکن است اشتباه کند. به گوش خودت هم اعتماد کن.')}</p>
		<ActionBar label={T('Back to your result', 'برگشت به نتیجه')} onclick={back} secondary={{ label: T('Say them again', 'دوباره همه را بگو'), onclick: restart }} />

	{:else}
		<p class="step" aria-hidden="true">{label}</p>
		<div class="dots" aria-hidden="true">{#each words as _, i}<span class:done={i < index} class:now={i === index}></span>{/each}</div>
		<h2 class="word" tabindex="-1" bind:this={heading}><span class="sr-only">{label}: </span><span lang="en" dir="ltr">{target}</span></h2>

		{#if stage === 'verdict' && verdict}
			<p class="result" class:ok={verdict === 'right'} tabindex="-1" bind:this={resultLine}>
				{#if verdict === 'silent'}{T('I didn’t hear you. Hold the phone closer and try again.', 'صدایت را نشنیدم. گوشی را نزدیک‌تر بگیر و دوباره امتحان کن.')}
				{:else if verdict === 'error'}{T('Couldn’t check that one. Try again.', 'این یکی را نتوانستم بررسی کنم. دوباره امتحان کن.')}
				{:else if verdict === 'unsure'}{T('Hard to tell. Try again, a little slower.', 'مطمئن نیستم چه شنیدم. یک بار دیگر، کمی آهسته‌تر بگو.')}
				{:else if verdict === 'right'}✓ {#if isFa}شبیه {@render q(target)} بود{:else}That sounded like {@render q(target)}{/if}
				{:else}✗ {#if isFa}انگار گفتی {@render q(other)}{:else}That sounded more like {@render q(other)}{/if}{/if}
			</p>
			{#if verdict === 'wrong'}<p class="tip">{#if isFa}<MixedText text={CONTRASTS[item.contrast].tip.fa} />{:else}{CONTRASTS[item.contrast].tip.en}{/if}</p>{/if}
			<div class="links">
				{#if myUrl}<button class="link" type="button" onclick={hearMine}><span aria-hidden="true">▶</span> {T('My voice', 'صدای خودم')}</button>{/if}
				<button class="link" type="button" onclick={hearMira}><span aria-hidden="true">▶</span> {T('Mira', 'صدای میرا')}</button>
			</div>
			{#if verdict === 'right'}
				<ActionBar label={nextLabel} onclick={next} secondary={{ label: tryAgain, onclick: again }} />
			{:else}
				<ActionBar label={tryAgain} onclick={again} secondary={{ label: nextLabel, onclick: next }} />
			{/if}
		{:else}
			<p class="hint">{T('Say this word. Not', 'این کلمه را بگو، نه')} {@render q(other)}{isFa ? ' را' : ''}.</p>
			<button class="link" type="button" onclick={hearMira}><span aria-hidden="true">▶</span> {T('Hear Mira say it', 'از میرا بشنو')}</button>
			{#if micDenied}<p class="note" role="alert">{T('The microphone is blocked. Allow it in your browser’s site settings.', 'دسترسی به میکروفون بسته است. در تنظیمات مرورگر، برای این سایت اجازه بده.')}</p>{/if}
			<ActionBar
				label={stage === 'recording' ? T('Stop', 'پایان ضبط') : stage === 'judging' ? T('Checking…', 'در حال بررسی…') : T('Say it', 'بگو')}
				suffix={stage === 'recording' ? ` · ${N(Math.max(0, Math.ceil(MAX_SECONDS - elapsed)))}` : ''}
				icon={stage === 'judging' ? null : 'mic'} recording={stage === 'recording'} disabled={stage === 'judging'} onclick={record}
				secondary={stage === 'say' ? { label: T('Back to your result', 'برگشت به نتیجه'), onclick: back } : null} />
		{/if}
	{/if}
</section>

<style>
	.pc { display: grid; gap: 14px; padding-bottom: 136px; }
	.label { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .label { letter-spacing: normal; }
	h2 { margin: 0; font-family: var(--font-display); font-size: 1.35rem; line-height: 1.35; }
	h2:focus { outline: none; }
	.big { font-size: clamp(1.6rem, 7vw, 2.1rem); color: var(--accent-deep); }
	.word { text-align: center; padding: 28px 8px; border: 2px solid var(--accent); border-radius: 20px; background: var(--paper-raised); font-size: clamp(2.2rem, 12vw, 3rem); }
	.step { margin: 0; font-weight: 600; color: var(--ink-soft); }
	.dots { display: flex; gap: 4px; }
	.dots span { flex: 1; block-size: 6px; border-radius: 3px; background: var(--paper-sunken); }
	.dots span.done { background: var(--leaf); }
	.dots span.now { background: var(--accent); }
	p { margin: 0; line-height: 1.55; }
	.hint { color: var(--ink-soft); }
	.result { font-size: 1.2rem; font-weight: 700; color: var(--attention); }
	.result.ok { color: var(--leaf-deep); }
	.result:focus { outline: none; }
	.list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
	.list li { display: flex; justify-content: space-between; padding: 10px 14px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); font-weight: 600; }
	.list li.wrong { border-color: var(--attention); }
	.list li.wrong > span { color: var(--attention); }
	.list li.right > span { color: var(--leaf-deep); }
	.track { block-size: 10px; border-radius: 5px; background: var(--paper-sunken); overflow: hidden; }
	.track span { display: block; block-size: 100%; background: var(--accent); transition: inline-size .2s; }
	.links { display: flex; gap: 20px; }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	@media (prefers-reduced-motion: reduce) { .track span { transition: none; } }
</style>
