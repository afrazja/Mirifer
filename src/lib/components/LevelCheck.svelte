<script lang="ts">
	/**
	 * The onboarding level check (docs/english-level-check-spec.md): listen, repeat, talk, then one
	 * friendly line. It never feels like a test: no marks, no scores, a quiet way out on every screen,
	 * and a refused microphone just skips the speaking parts. Nothing the learner says is kept; only
	 * the task results stay in this browser while the check runs, so a reload resumes it.
	 */
	import { onDestroy, onMount } from 'svelte';
	import { playAudioPromise, stopAllAudio } from '$services/tts';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { NATURAL_RATE } from '$lib/practice/connected-speech';
	import type { DisplayText } from '$lib/practice/hotel';
	import {
		LISTEN_ITEMS, REPEAT_MAX_SECONDS, REPEAT_SENTENCES, RESULT_LINES, TALK_DONE_AFTER, TALK_MAX_SECONDS, TALK_PROMPT, combine, type Band
	} from '$lib/practice/level-check';

	let { language, onDone, onLeave }: {
		language: 'en' | 'fa';
		/** The band to start from (the learner may pick the easier start on a natural result). */
		onDone: (band: Band) => void;
		/** "Not now": no band, the learner starts in the easier version. */
		onLeave: () => void;
	} = $props();

	const isFa = $derived(language === 'fa');
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const text = (value: DisplayText) => value[language];

	type Stage = 'intro' | 'listen-0' | 'listen-1' | 'repeat-0' | 'repeat-1' | 'talk' | 'result';
	const ORDER: Stage[] = ['intro', 'listen-0', 'listen-1', 'repeat-0', 'repeat-1', 'talk', 'result'];
	interface Progress { stage: Stage; listen: (boolean | null)[]; repeat: (boolean | null)[]; talk: Band | null | undefined; mic: boolean }
	const KEY = 'mirifer_en_level_check_v1';
	let p = $state<Progress>({ stage: 'intro', listen: [null, null], repeat: [null, null], talk: undefined, mic: true });

	let playing = $state(false), replays = $state(0), heard = $state(false);
	let recording = $state(false), sending = $state(false), elapsed = $state(0);
	let talkTry = $state<1 | 2>(1), retryNote = $state<'short' | 'persian' | null>(null);
	let recorder: MediaRecorder | null = null, stream: MediaStream | null = null, chunks: Blob[] = [], timer: ReturnType<typeof setInterval> | undefined, started = 0, discard = false;
	let heading: HTMLHeadingElement | undefined = $state();

	onMount(() => {
		try {
			const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
			if (saved && ORDER.includes(saved.stage) && Array.isArray(saved.listen) && Array.isArray(saved.repeat)) {
				// Back on a task screen after a reload: its sound needs a new tap, so it waits for one.
				p = { stage: saved.stage, listen: saved.listen.slice(0, 2), repeat: saved.repeat.slice(0, 2), talk: saved.talk, mic: saved.mic !== false };
			}
		} catch { /* start from the intro */ }
	});
	$effect(() => { const value = JSON.stringify(p); try { localStorage.setItem(KEY, value); } catch { /* no resume */ } });
	onDestroy(() => { clearInterval(timer); if (recorder?.state === 'recording') { discard = true; recorder.stop(); } stream?.getTracks().forEach(t => t.stop()); stopAllAudio(); });
	const forget = () => { try { localStorage.removeItem(KEY); } catch { /* nothing kept */ } };

	const listenIndex = $derived(p.stage === 'listen-1' ? 1 : 0);
	const repeatIndex = $derived(p.stage === 'repeat-1' ? 1 : 0);
	const count = (values: (boolean | null)[]) => values.every(v => v === null) ? null : values.filter(v => v === true).length;
	const result = $derived(combine({ listen: count(p.listen), repeat: p.mic ? count(p.repeat) : null, talk: p.talk ?? null, mic: p.mic }));
	/** The thin bar inside step 3: the tasks done so far. */
	const progress = $derived(Math.max(0, ORDER.indexOf(p.stage)) / (ORDER.length - 1));

	/** The next screen; its sound starts from this same tap, which phones require. */
	function go(stage: Stage) {
		stopAllAudio();
		replays = 0; heard = false; retryNote = null;
		if (!p.mic && (stage === 'repeat-0' || stage === 'repeat-1' || stage === 'talk')) stage = 'result';
		p = { ...p, stage };
		queueMicrotask(() => heading?.focus());
		if (stage.startsWith('listen')) play(LISTEN_ITEMS[stage === 'listen-1' ? 1 : 0].audio, stage === 'listen-1' ? NATURAL_RATE : COACH_RATE, 'd');
		else if (stage.startsWith('repeat')) play(REPEAT_SENTENCES[stage === 'repeat-1' ? 1 : 0], COACH_RATE, COACH_VOICE);
		else if (stage === 'talk') play(TALK_PROMPT.en, COACH_RATE, COACH_VOICE);
	}
	function play(line: string, rate: number, voice: 'b' | 'd') {
		playing = true;
		void playAudioPromise(line, rate, 'en-US', undefined, voice).catch(() => {}).finally(() => { playing = false; heard = true; });
	}
	function replay() {
		if (playing || replays >= 1) return;
		replays += 1;
		if (p.stage.startsWith('listen')) play(LISTEN_ITEMS[listenIndex].audio, listenIndex ? NATURAL_RATE : COACH_RATE, 'd');
		else play(REPEAT_SENTENCES[repeatIndex], COACH_RATE, COACH_VOICE);
	}

	/** Asks for the microphone inside the Start tap; refused or missing, the check goes on without speaking. */
	async function start() {
		let ok = false;
		try {
			if (navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined') {
				const test = await navigator.mediaDevices.getUserMedia({ audio: true });
				test.getTracks().forEach(t => t.stop());
				ok = true;
			}
		} catch { ok = false; }
		p = { ...p, mic: ok };
		go('listen-0');
	}

	function answer(choice: number | null) {
		const listen = [...p.listen]; listen[listenIndex] = choice === null ? null : choice === LISTEN_ITEMS[listenIndex].answer;
		p = { ...p, listen };
		go(listenIndex === 0 ? 'listen-1' : 'repeat-0');
	}

	async function record() {
		stopAllAudio();
		try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
		catch { p = { ...p, mic: false }; go('result'); return; }
		const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
		recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64_000 });
		chunks = []; discard = false;
		recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
		recorder.onstop = finish;
		recorder.start();
		const limit = p.stage === 'talk' ? TALK_MAX_SECONDS : REPEAT_MAX_SECONDS;
		started = performance.now(); elapsed = 0; recording = true;
		timer = setInterval(() => {
			elapsed = (performance.now() - started) / 1000;
			if (elapsed >= limit && recorder?.state === 'recording') recorder.stop();
		}, 200);
	}
	const stopRecording = () => { if (recorder?.state === 'recording') recorder.stop(); };

	async function finish() {
		clearInterval(timer); recording = false;
		stream?.getTracks().forEach(t => t.stop()); stream = null;
		if (discard) return;
		const stage = p.stage, seconds = Math.round((performance.now() - started) / 100) / 10;
		const body = new FormData();
		body.set('audio', new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' }), 'clip');
		body.set('seconds', String(Math.min(seconds, stage === 'talk' ? TALK_MAX_SECONDS : REPEAT_MAX_SECONDS)));
		body.set('kind', stage === 'talk' ? 'talk' : 'repeat');
		if (stage === 'talk') body.set('try', String(talkTry)); else body.set('index', String(repeatIndex));
		sending = true;
		let data: { passed?: boolean | null; band?: Band | null; retry?: 'short' | 'persian' } | null = null;
		const controller = new AbortController();
		const wait = setTimeout(() => controller.abort(), 30_000);
		try {
			const response = await fetch('/api/english/level-check', { method: 'POST', body, signal: controller.signal });
			data = response.ok ? await response.json() : null;
		} catch { data = null; }
		finally { clearTimeout(wait); sending = false; }
		if (p.stage !== stage) return; // the learner moved on
		if (stage === 'talk') {
			if (data?.retry && talkTry === 1) { talkTry = 2; retryNote = data.retry; return; }
			p = { ...p, talk: data && 'band' in data ? data.band ?? null : null };
			go('result');
			return;
		}
		const repeat = [...p.repeat]; repeat[repeatIndex] = typeof data?.passed === 'boolean' ? data.passed : null;
		p = { ...p, repeat };
		go(repeatIndex === 0 ? 'repeat-1' : 'talk');
	}

	function skipTask() {
		if (recording) { discard = true; stopRecording(); }
		if (p.stage.startsWith('listen')) answer(null);
		else if (p.stage === 'repeat-0') go('repeat-1');
		else if (p.stage === 'repeat-1') go('talk');
		else { p = { ...p, talk: null }; go('result'); }
	}
	function done(band: Band) { forget(); stopAllAudio(); onDone(band); }
	function leave() { if (recording) { discard = true; stopRecording(); } forget(); stopAllAudio(); onLeave(); }

	const secondsLeft = $derived(Math.max(0, Math.ceil((p.stage === 'talk' ? TALK_MAX_SECONDS : REPEAT_MAX_SECONDS) - elapsed)));
	const num = (value: number) => (isFa ? value.toLocaleString('fa-IR') : String(value));
</script>

<div class="check">
	<div class="sub" aria-hidden="true"><span style:width="{progress * 100}%"></span></div>

	{#if p.stage === 'intro'}
		<section class="screen" aria-labelledby="lc">
			<h1 id="lc" tabindex="-1" bind:this={heading}>{T('Let’s find out together', 'بیا با هم پیدایش کنیم')}</h1>
			<p class="lead">{T('No problem. You’ll listen, repeat and talk a little. It takes about two minutes, and there are no right or wrong answers.', 'اشکالی ندارد. گوش می‌دهی، تکرار می‌کنی و کمی حرف می‌زنی. حدود دو دقیقه طول می‌کشد و درست و غلطی در کار نیست.')}</p>
			<p class="note">{T('We’ll ask to use your microphone.', 'برای این کار به میکروفونت نیاز داریم.')}</p>
		</section>
		<ActionBar label={T('Turn on the microphone and start', 'روشن کردن میکروفون و شروع')} icon="mic" onclick={start} secondary={{ label: T('Not now', 'فعلاً نه'), onclick: leave }} />

	{:else if p.stage === 'listen-0' || p.stage === 'listen-1'}
		{@const item = LISTEN_ITEMS[listenIndex]}
		<section class="screen" aria-labelledby="lc">
			<p class="eyebrow">{T('A voice message from a friend', 'پیام صوتی از یک دوست')}</p>
			<h1 id="lc" tabindex="-1" bind:this={heading}>{text(item.question)}</h1>
			<button class="replay" type="button" onclick={replay} disabled={playing || replays >= 1}>
				{playing ? T('Playing…', 'در حال پخش…') : replays >= 1 ? T('Played again', 'دوباره پخش شد') : T('Play it again', 'دوباره پخش کن')}
			</button>
			<div class="options" role="group" aria-labelledby="lc">
				{#each item.options as option, i}
					<button class="option" type="button" onclick={() => answer(i)}>{text(option)}</button>
				{/each}
			</div>
		</section>
		<div class="foot"><button class="quiet" type="button" onclick={skipTask}>{T('Skip this one', 'از این یکی بگذر')}</button></div>

	{:else if p.stage === 'repeat-0' || p.stage === 'repeat-1'}
		<section class="screen" aria-labelledby="lc">
			<p class="eyebrow">{T('Listen, then say it back', 'گوش بده، بعد تکرارش کن')}</p>
			<h1 id="lc" tabindex="-1" bind:this={heading}>{T('Say exactly what you hear.', 'دقیقاً همان چیزی را بگو که می‌شنوی.')}</h1>
			<button class="replay" type="button" onclick={replay} disabled={playing || recording || sending || replays >= 1}>
				{playing ? T('Playing…', 'در حال پخش…') : replays >= 1 ? T('Played again', 'دوباره پخش شد') : T('Hear it again', 'دوباره بشنو')}
			</button>
			{#if sending}<p class="note" role="status">{T('One moment…', 'یک لحظه…')}</p>{/if}
		</section>
		<ActionBar label={recording ? T('Done', 'تمام') : T('Say it', 'بگو')} icon={recording ? 'stop' : 'mic'} {recording}
			suffix={recording ? ` · ${num(secondsLeft)}` : ''}
			disabled={sending || playing || (!heard && !recording)} onclick={recording ? stopRecording : record}
			secondary={sending ? null : { label: T('Skip this one', 'از این یکی بگذر'), onclick: skipTask }} />

	{:else if p.stage === 'talk'}
		<section class="screen" aria-labelledby="lc">
			<p class="eyebrow">{T('Talk for about thirty seconds', 'حدود سی ثانیه حرف بزن')}</p>
			<h1 id="lc" tabindex="-1" bind:this={heading}>{text(TALK_PROMPT)}</h1>
			{#if retryNote === 'persian'}<p class="nudge" role="status">{T('Try it in English, even a few words.', 'به انگلیسی امتحان کن، حتی چند کلمه.')}</p>
			{:else if retryNote === 'short'}<p class="nudge" role="status">{T('I didn’t catch that. Try again, even a few sentences is fine.', 'متوجه نشدم. دوباره امتحان کن؛ چند جمله هم کافی است.')}</p>
			{:else}<p class="note">{T('Say as much as you can. Mistakes are fine.', 'هرچه می‌توانی بگو. اشتباه اشکالی ندارد.')}</p>{/if}
			{#if sending}<p class="note" role="status">{T('One moment…', 'یک لحظه…')}</p>{/if}
		</section>
		<ActionBar label={recording ? T('Done', 'تمام') : T('Start talking', 'شروع به حرف زدن')} icon={recording ? 'stop' : 'mic'} {recording}
			suffix={recording ? ` · ${num(secondsLeft)}` : ''}
			disabled={sending || (recording && elapsed < TALK_DONE_AFTER)} onclick={recording ? stopRecording : record}
			secondary={sending ? null : { label: T('Skip this one', 'از این یکی بگذر'), onclick: skipTask }} />

	{:else}
		<section class="screen" aria-labelledby="lc">
			<h1 id="lc" tabindex="-1" bind:this={heading}>{text(RESULT_LINES[result])}</h1>
			<p class="note">{T('It’s just a starting point.', 'این فقط نقطهٔ شروع است.')}</p>
			{#if !p.mic}<p class="note">{T('Every lesson needs your microphone, so allow it in your browser’s settings before you start.', 'همهٔ درس‌ها به میکروفون نیاز دارند؛ پیش از شروع، در تنظیمات مرورگر اجازه‌اش را بده.')}</p>{/if}
		</section>
		<ActionBar label={T('Continue', 'ادامه')} onclick={() => done(result)}
			secondary={result === 'natural' ? { label: T('Start easier', 'آسان‌تر شروع کن'), onclick: () => done('simple') } : null} />
	{/if}
</div>

<style>
	.check { display: grid; gap: 14px; padding-bottom: 120px; }
	.sub { height: 4px; border-radius: 99px; background: var(--paper-sunken); overflow: hidden; }
	.sub span { display: block; height: 100%; background: var(--accent-soft, var(--accent)); opacity: .7; border-radius: 99px; transition: width .3s; }
	.screen { display: grid; gap: 14px; }
	h1 { margin: 0; font-family: var(--font-display); font-weight: 500; font-size: clamp(1.4rem, 5.5vw, 1.9rem); line-height: 1.25; outline: none; }
	.eyebrow { margin: 0; color: var(--accent-deep); font-weight: 600; font-size: .9rem; }
	.lead { margin: 0; font-size: 1.05rem; line-height: 1.7; }
	.note { margin: 0; color: var(--ink-soft); line-height: 1.6; }
	.nudge { margin: 0; padding: 12px 14px; border-radius: 12px; background: var(--paper-sunken); line-height: 1.6; }
	.replay { justify-self: start; min-height: 44px; padding: 8px 14px; border: 1.5px solid var(--control-border); border-radius: 99px; background: var(--paper-raised); color: var(--ink); font: inherit; font-weight: 600; cursor: pointer; }
	.options { display: grid; gap: 10px; }
	.option { min-height: 56px; padding: 14px 16px; border: 1.5px solid var(--control-border); border-radius: 14px; background: var(--paper-raised); color: var(--ink); font: inherit; font-size: 1rem; text-align: start; line-height: 1.5; cursor: pointer; }
	.option:hover { border-color: var(--accent); }
	.foot { display: flex; justify-content: center; }
	.quiet { min-height: 44px; padding: 8px 12px; background: none; border: 0; color: var(--ink-soft); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	button:disabled { opacity: .55; cursor: default; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	@media (prefers-reduced-motion: reduce) { .sub span { transition: none; } }
</style>
