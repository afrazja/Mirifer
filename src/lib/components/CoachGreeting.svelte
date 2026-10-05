<script lang="ts">
	/**
	 * Mira's greeting at the top of Today. Day 1 is scripted: hear Mira (the
	 * tap also checks the sound), then say a first sentence (the microphone
	 * check). Later days: one opening line with one question, the learner's
	 * answer, and one short reply. The day's exchange is kept in this browser,
	 * so a reload shows it again instead of running it twice.
	 */
	import { onDestroy, onMount } from 'svelte';
	import { playAudioPromise, stopAllAudio, ttsIsPlaying } from '$services/tts';
	import {
		COACH_VOICE, DAY_ONE_LINES, firstSentence, greetingMode, isFirstSentenceAttempt, loadGreeting, localDate, daysSince,
		saveGreeting, scriptedOpening, scriptedReply, type GreetingMode, type GreetingRecord
	} from '$lib/practice/coach';
	import type { EnglishProfile } from '$lib/practice/english-profile';
	import type { EnglishProgress } from '$lib/practice/english-progress';
	import type { DisplayText } from '$lib/practice/hotel';

	let { isFa = false, name, profile, progress, question, readOnly = false }: {
		isFa?: boolean; name: string; profile: EnglishProfile; progress: EnglishProgress;
		/** Today's theme-linked question (from the day pack). */
		question: string;
		/** Looking back from a module: show what happened, nothing to do. */
		readOnly?: boolean;
	} = $props();

	type Recognition = {
		lang: string; continuous: boolean; interimResults: boolean;
		onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
		onerror: ((event: { error: string }) => void) | null; onend: (() => void) | null;
		start(): void; stop(): void; abort(): void;
	};

	let ready = $state(false);
	let mode = $state<GreetingMode>('first');
	let record = $state<GreetingRecord | null>(null);
	let opening = $state<DisplayText>({ en: '', fa: '' });
	let reply = $state<DisplayText | null>(null);
	let answer = $state(''), typed = $state(false);
	let heard = $state(false), tooShort = $state(false);
	let showFa = $state(false), typing = $state(false), draft = $state('');
	let listening = $state(false), micProblem = $state<'blocked' | 'unsupported' | 'none' | null>(null);
	let speakOpen = $state(false);
	let recognition: Recognition | null = null;
	let stopTimer: ReturnType<typeof setTimeout> | undefined;
	const playing = $derived($ttsIsPlaying);
	const text = (value: DisplayText) => (isFa && showFa ? value.fa : value.en);
	/** Coach lines are English unless the Persian translation is shown. */
	const lineLang = $derived(isFa && showFa ? 'fa' : 'en');
	const lineDir = $derived(isFa && showFa ? 'rtl' : 'ltr');
	// svelte-ignore state_referenced_locally
	const target = firstSentence(name, profile.reason);

	onMount(() => {
		const now = new Date();
		mode = greetingMode(progress, now);
		showFa = profile.comfort === 'hard';
		const saved = loadGreeting(localDate(now));
		if (saved && saved.mode === mode) {
			record = saved; opening = saved.opening; reply = saved.reply; answer = saved.answer ?? ''; typed = saved.typed;
			heard = mode === 'first' && !!saved.answer; speakOpen = true;
		} else {
			opening = mode === 'first' ? DAY_ONE_LINES.welcome(name) : scriptedOpening(mode, name, daysSince(progress.lastCompletedAt, now), question);
			if (mode === 'again-today') finish(null, null);
		}
		ready = true;
	});
	onDestroy(() => { clearTimeout(stopTimer); recognition?.abort(); stopAllAudio(); });

	function finish(said: string | null, mira: DisplayText | null) {
		record = { date: localDate(new Date()), mode, opening, answer: said, typed, reply: mira, improved: null, noteEn: null, noteFa: null };
		saveGreeting(record);
	}

	async function hear(line: string) {
		if (playing) { stopAllAudio(); return; }
		try { await playAudioPromise(line, 0.95, 'en-US', undefined, COACH_VOICE); } catch { /* the text is on screen */ }
		speakOpen = true;
	}

	/** Takes what the learner said or typed. */
	function take(value: string, wasTyped: boolean) {
		const said = value.trim().slice(0, 300);
		if (!said) return;
		typed = wasTyped; answer = said;
		if (mode === 'first') {
			if (!isFirstSentenceAttempt(said)) { tooShort = true; return; }
			tooShort = false; heard = true; finish(said, null);
		} else {
			reply = scriptedReply(name, true);
			finish(said, reply);
		}
	}
	function skipAnswer() { reply = scriptedReply(name, false); finish(null, reply); }

	function listen() {
		if (listening) { recognition?.stop(); return; }
		const browser = window as Window & { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
		const Constructor = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
		if (!Constructor) { micProblem = 'unsupported'; typing = true; return; }
		stopAllAudio();
		const current = new Constructor();
		let words = '', failed = false;
		current.lang = 'en-US'; current.continuous = true; current.interimResults = true;
		current.onresult = event => {
			words = Array.from(event.results).map(item => item[0]?.transcript ?? '').join(' ').trim();
			clearTimeout(stopTimer); stopTimer = setTimeout(() => current.stop(), 1_800);
		};
		current.onerror = event => {
			failed = true;
			micProblem = event.error === 'not-allowed' || event.error === 'service-not-allowed' ? 'blocked' : 'none';
			if (micProblem === 'blocked') typing = true;
		};
		current.onend = () => {
			clearTimeout(stopTimer); listening = false; recognition = null;
			if (!failed && words) { micProblem = null; take(words, false); }
			else if (!failed) micProblem = 'none';
		};
		recognition = current; micProblem = null; tooShort = false;
		try { current.start(); listening = true; stopTimer = setTimeout(() => current.stop(), 10_000); }
		catch { micProblem = 'blocked'; typing = true; }
	}
	function sendTyped() { take(draft, true); draft = ''; }

	const done = $derived(mode === 'first' ? heard : !!reply);
</script>

{#snippet mic()}
	{#if !typing}
		<button class="mic" class:on={listening} type="button" onclick={listen} aria-pressed={listening}>
			<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0M12 17v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
			<span>{listening ? (isFa ? 'گوش می‌دهم… (برای توقف بزن)' : 'Listening… tap to stop') : (isFa ? 'بزن و صحبت کن' : 'Tap and speak')}</span>
		</button>
		<button class="link" type="button" onclick={() => (typing = true)}>{isFa ? 'به‌جایش بنویس' : 'Type instead'}</button>
	{:else}
		<form class="type" onsubmit={event => { event.preventDefault(); sendTyped(); }}>
			<label class="sr-only" for="coach-input">{isFa ? 'پاسخت به انگلیسی' : 'Your answer in English'}</label>
			<input id="coach-input" bind:value={draft} maxlength="300" lang="en" dir="ltr" autocomplete="off" placeholder={isFa ? 'به انگلیسی بنویس' : 'Type in English'} />
			<button class="send" type="submit" disabled={!draft.trim()}>{isFa ? 'بفرست' : 'Send'}</button>
		</form>
		{#if micProblem !== 'blocked' && micProblem !== 'unsupported'}<button class="link" type="button" onclick={() => (typing = false)}>{isFa ? 'صحبت کن' : 'Speak instead'}</button>{/if}
	{/if}
	{#if micProblem === 'blocked'}<p class="note" role="status">{isFa ? 'میکروفون بسته است. در تنظیمات سایتِ مرورگر اجازه‌اش را بده، یا بنویس. در مرحله‌های صحبت هم می‌توانی بنویسی.' : 'Your microphone is blocked. Allow it in your browser’s site settings, or type instead. In speaking steps you can type too.'}</p>
	{:else if micProblem === 'unsupported'}<p class="note" role="status">{isFa ? 'این مرورگر نمی‌تواند به صدایت گوش بدهد. بنویس؛ در مرحله‌های صحبت هم می‌توانی بنویسی.' : 'This browser can’t listen to your voice. Type instead; in speaking steps you can type too.'}</p>
	{:else if micProblem === 'none'}<p class="note" role="status">{isFa ? 'صدایی نشنیدم. دوباره امتحان کن، یا بنویس.' : 'I didn’t hear anything. Try again, or type it.'}</p>{/if}
{/snippet}

<section class="coach" aria-label={isFa ? 'خوشامد میرا، مربی انگلیسی' : 'Mira, your English coach'} aria-busy={!ready}>
	<div class="head">
		<span class="avatar" aria-hidden="true">M</span>
		<div class="who"><strong>Mira</strong><small>{isFa ? 'مربی انگلیسی تو' : 'your English coach'}</small></div>
		{#if isFa}<button class="toggle" type="button" aria-pressed={showFa} onclick={() => (showFa = !showFa)}>{showFa ? 'نمایش انگلیسی' : 'نمایش ترجمه'}</button>{/if}
	</div>

	{#if ready}
		<div class="bubble mira" class:stack={mode === 'first' && !speakOpen && !readOnly}>
			<div class="body"><p lang={lineLang} dir={lineDir}>{text(opening)}</p></div>
			<button class="hear" class:big={mode === 'first' && !speakOpen && !readOnly} type="button" onclick={() => hear(opening.en)} aria-label={playing ? (isFa ? 'توقف صدا' : 'Stop') : (isFa ? 'شنیدن صدای میرا' : 'Hear Mira')}>
				<span aria-hidden="true">{playing ? '■' : '▶'}</span>{#if mode === 'first' && !speakOpen && !readOnly}&nbsp;{isFa ? 'بزن تا صدای میرا را بشنوی' : 'Tap to hear Mira'}{/if}
			</button>
		</div>

		{#if mode === 'first'}
			{#if !speakOpen && !readOnly}
				<button class="link" type="button" onclick={() => (speakOpen = true)}>{isFa ? 'الان نمی‌توانم صدا پخش کنم' : 'I can’t play sound right now'}</button>
			{:else}
				<div class="bubble mira">
					<div class="body">
						<p lang={lineLang} dir={lineDir}>{text(DAY_ONE_LINES.ask)}</p>
						<p class="target" lang="en" dir="ltr">“{target}”</p>
					</div>
				</div>
				{#if heard}
					<div class="bubble me"><div class="body">
						<p class="label">{typed ? (isFa ? 'نوشتی:' : 'You wrote:') : (isFa ? 'شنیدم:' : 'I heard:')}</p>
						<p lang="en" dir="ltr">“{answer}”</p>
					</div></div>
					<div class="bubble mira" role="status"><div class="body"><p lang={lineLang} dir={lineDir}>{text(typed ? DAY_ONE_LINES.typed : DAY_ONE_LINES.heard)}</p></div></div>
				{:else if !readOnly}
					{#if tooShort}<p class="note" role="status">{text(DAY_ONE_LINES.short)}</p>{/if}
					<div class="answer">{@render mic()}</div>
				{/if}
			{/if}
		{:else if mode === 'returning'}
			{#if answer}<div class="bubble me"><div class="body"><p lang="en" dir="ltr">{answer}</p></div></div>{/if}
			{#if reply}
				<div class="bubble mira" role="status"><div class="body"><p lang={lineLang} dir={lineDir}>{text(reply)}</p></div>
					<button class="hear" type="button" onclick={() => reply && hear(reply.en)} aria-label={isFa ? 'شنیدن صدای میرا' : 'Hear Mira'}><span aria-hidden="true">▶</span></button></div>
			{:else if !readOnly}
				<div class="answer">{@render mic()}</div>
				<button class="link" type="button" onclick={skipAnswer}>{isFa ? 'رد شدن و رفتن به برنامه' : 'Skip to plan'}</button>
			{/if}
		{/if}
		{#if done && !readOnly}<p class="sr-only" role="status">{isFa ? 'آماده‌ای؛ برنامهٔ امروز پایین است.' : 'You’re ready; today’s plan is below.'}</p>{/if}
	{/if}
</section>

<style>
	.coach { display: grid; gap: 10px; padding: 16px; margin: 8px 0 22px; border: 1px solid var(--control-border); border-radius: 18px; background: var(--paper-raised); }
	.head { display: flex; align-items: center; gap: 10px; }
	.avatar { display: grid; place-items: center; inline-size: 40px; block-size: 40px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; font-size: 1.1rem; flex: none; }
	.who { display: grid; line-height: 1.2; }
	.who small { color: var(--ink-soft); font-size: .8rem; }
	.toggle { margin-inline-start: auto; min-height: 36px; padding: 6px 12px; border: 1px solid var(--control-border); border-radius: 999px; background: var(--control); color: var(--ink); font: inherit; font-size: .8rem; cursor: pointer; }
	.bubble { display: grid; grid-template-columns: 1fr auto; align-items: start; gap: 10px; padding: 12px 14px; border-radius: 16px; max-inline-size: 92%; }
	.bubble.stack { grid-template-columns: 1fr; }
	.body { display: grid; gap: 6px; min-width: 0; }
	.bubble p { margin: 0; line-height: 1.55; font-size: 1.04rem; }
	.bubble p[dir='ltr'] { text-align: left; }
	.label { font-size: .8rem !important; color: var(--ink-soft); }
	.mira { background: var(--paper-sunken); border-start-start-radius: 4px; justify-self: start; }
	.me { background: var(--accent-wash); border-start-end-radius: 4px; justify-self: end; }
	.target { font-weight: 600; color: var(--accent-deep); }
	.hear { flex: none; display: inline-flex; align-items: center; justify-content: center; min-inline-size: 40px; min-block-size: 40px; padding: 0 10px; border: 1px solid var(--accent); border-radius: 999px; background: var(--paper-raised); color: var(--accent-deep); font: inherit; font-weight: 600; cursor: pointer; }
	.hear.big { justify-self: start; min-block-size: 48px; padding: 0 18px; background: var(--accent); color: var(--on-accent); }
	.answer { display: grid; gap: 8px; justify-items: start; }
	.mic { display: inline-flex; align-items: center; gap: 10px; min-height: 56px; padding: 10px 20px 10px 14px; border: 0; border-radius: 999px; background: var(--accent); color: var(--on-accent); font: inherit; font-weight: 600; cursor: pointer; }
	.mic.on { background: var(--attention); }
	.type { display: flex; gap: 8px; inline-size: 100%; }
	.type input { flex: 1; min-width: 0; min-height: 48px; padding: 10px 12px; border: 1px solid var(--control-border); border-radius: 12px; background: var(--control); color: var(--ink); font: inherit; }
	.send { min-height: 48px; padding: 10px 16px; border: 0; border-radius: 12px; background: var(--accent); color: var(--on-accent); font: inherit; font-weight: 600; cursor: pointer; }
	.link { justify-self: start; min-height: 44px; padding: 8px 2px; background: none; border: 0; color: var(--accent-deep); font: inherit; font-size: .92rem; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.note { margin: 0; color: var(--ink-soft); font-size: .9rem; line-height: 1.5; }
	button:disabled { opacity: .55; cursor: default; }
	button:focus-visible, input:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
