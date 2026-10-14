<script lang="ts">
	/**
	 * "Dictation sprint", Module lab (docs/english-dictation-sprint-spec.md, owner-approved).
	 * Ten short lines, audio only; the learner types just the detail asked for. One play, plus a
	 * second that's marked (a play counts only when the audio really starts, and is saved then).
	 * Checked in code, no AI; answers never leave the device. Each answer is timed from the end of
	 * the first play.
	 */
	import { onMount } from 'svelte';
	import MixedText from '$lib/components/MixedText.svelte';
	import { playAudioPromise, playAudioUrl, stopAllAudio, ttsUrl } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { ITEMS, MAX_PLAYS, VOICE, emptyDictation, isRight, summarize, type DictationRecord } from '$lib/practice/dictation';

	let { isFa = false, initial = null, first = false, onSave, onDone, onLater }: {
		isFa?: boolean;
		initial?: DictationRecord | null;
		first?: boolean;
		onSave?: (record: DictationRecord) => void;
		onDone: () => void;
		/** "Finish later": progress is kept. */
		onLater: () => void;
	} = $props();

	const INTRO = {
		en: 'You’ll hear ten short messages. Each time, write down just one detail: a time, a price, a number or a name. Listen once. You can play it a second time, but try to catch it the first time.',
		fa: 'ده پیام کوتاه می‌شنوی. هر بار فقط یک چیز را بنویس: یک ساعت، یک قیمت، یک عدد یا یک اسم. یک بار گوش بده. می‌توانی یک بار دیگر هم پخشش کنی، ولی سعی کن همان بار اول بگیری.'
	};

	// svelte-ignore state_referenced_locally
	let record = $state<DictationRecord>(initial ?? emptyDictation());
	let stage = $state<'start' | 'item' | 'result'>('start');
	let status = $state<'idle' | 'playing' | 'playFailed'>('idle'), typed = $state(''), announce = $state(''), replaying = $state(false);
	/** When the first play ended: the answer is timed from here. */
	let readyAt = 0;
	let heading: HTMLElement | undefined = $state(), resultLine: HTMLElement | undefined = $state(), box: HTMLInputElement | undefined = $state();
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const fa = (n: number) => n.toLocaleString('fa-IR');
	const N = (n: number) => (isFa ? fa(n) : String(n));
	const index = $derived(Math.min(record.index, ITEMS.length - 1));
	const item = $derived(ITEMS[index]);
	const plays = $derived(record.plays[index] ?? 0);
	const answer = $derived(record.answers[index]);
	const persianTyped = $derived(/[؀-ۿ]/.test(typed.replace(/[۰-۹٠-٩]/g, '')));

	onMount(() => {
		// A reload keeps the plays and returns to the item (or its check); nothing plays by itself.
		if (record.done || record.index >= ITEMS.length) stage = 'result';
		else if (record.plays.some(p => p > 0) || record.answers.some(Boolean)) stage = 'item';
		else if (first) void playAudioPromise(INTRO.en.replace(/’/g, "'"), COACH_RATE, 'en-US', undefined, COACH_VOICE);
		return () => stopAllAudio();
	});

	function persist() { onSave?.($state.snapshot(record)); }
	function go(next: typeof stage) { stage = next; queueMicrotask(() => heading?.focus()); }
	const audioOf = (text: string) => ttsUrl(text.replace(/’/g, "'"), 'en-US', 1, VOICE);
	function start() { stopAllAudio(); go('item'); void fetch(audioOf(ITEMS[record.index].line).url).catch(() => {}); }

	/** A play counts the moment audio starts (saved then); a failed or blocked play costs nothing. */
	async function listen() {
		if (plays >= MAX_PLAYS || status === 'playing') return;
		stopAllAudio();
		status = 'playing'; announce = '';
		let started = false;
		const at = index;
		const { url, playback } = audioOf(item.line);
		const ok = await playAudioUrl(url, 15_000, playback, () => {
			if (started) return;
			started = true;
			const used = [...record.plays]; used[at] = Math.min(MAX_PLAYS, used[at] + 1);
			record = { ...record, plays: used }; persist();
		});
		if (!started) { status = 'playFailed'; return; }
		status = 'idle';
		if (!ok) return;
		if (!readyAt || record.plays[at] === 1) readyAt = performance.now();
		announce = T('Type your answer.', 'جوابت را تایپ کن.');
		queueMicrotask(() => box?.focus());
	}
	async function listenAgain(text: string) {
		stopAllAudio(); replaying = true;
		const { url, playback } = audioOf(text);
		await playAudioUrl(url, 15_000, playback);
		replaying = false;
	}

	function check() {
		const text = typed.trim();
		if (!text || persianTyped || status === 'playing') return;
		const seconds = readyAt ? Math.round((performance.now() - readyAt) / 1000) : -1;
		const answers = [...record.answers];
		answers[index] = { text, correct: isRight(text, item), plays, seconds };
		record = { ...record, answers }; persist();
		typed = ''; readyAt = 0;
		queueMicrotask(() => resultLine?.focus());
		// Fetch the next line's audio while the check is showing.
		const next = ITEMS[index + 1];
		if (next) void fetch(audioOf(next.line).url).catch(() => {});
	}
	function nextItem() {
		stopAllAudio();
		const nextIndex = record.index + 1;
		record = { ...record, index: nextIndex, done: nextIndex >= ITEMS.length }; persist();
		status = 'idle'; announce = '';
		go(nextIndex >= ITEMS.length ? 'result' : 'item');
	}
	function again() { stopAllAudio(); record = emptyDictation(); persist(); go('item'); }
	function finish() { stopAllAudio(); onDone(); }
	function later() { stopAllAudio(); onLater(); }

	const summary = $derived(summarize(record));
</script>

{#snippet bottom(label: string, action: () => void, disabled = false)}
	<div class="bar"><button class="primary" type="button" onclick={action} {disabled}>{label}</button></div>
{/snippet}

<section class="ds">
	<h2 class="sr-only" tabindex="-1" bind:this={heading}>{stage === 'item' ? T(`Message ${index + 1} of ${ITEMS.length}`, `پیام ${fa(index + 1)} از ${fa(ITEMS.length)}`) : T('Dictation sprint', 'دیکتهٔ سریع')}</h2>
	<p class="sr-only" role="status" aria-live="polite">{announce}</p>

	{#if stage === 'start'}
		<div class="brief"><span class="avatar" aria-hidden="true">M</span><p>{isFa ? INTRO.fa : INTRO.en}</p></div>
		{@render bottom(T('Start', 'شروع'), start)}

	{:else if stage === 'item'}
		<p class="label" aria-hidden="true">{T(`Message ${index + 1} of ${ITEMS.length}`, `پیام ${fa(index + 1)} از ${fa(ITEMS.length)}`)}</p>
		<div class="dots" aria-hidden="true">{#each ITEMS as _, i}<span class:done={i < index} class:now={i === index}></span>{/each}</div>

		{#if !answer}
			{#if plays === 0}
				<button class="listen" type="button" onclick={listen} disabled={status === 'playing'}>
					<span class="icon" aria-hidden="true">{status === 'playing' ? '♪' : '▶'}</span>
					<span>{status === 'playing' ? T('Playing…', 'در حال پخش…') : T('Listen', 'گوش بده')}</span>
				</button>
				{#if status === 'playFailed'}<p class="note">{T('Couldn’t play. Try again; this didn’t count.', 'پخش نشد. دوباره امتحان کن؛ این یکی حساب نشد.')}</p>{/if}
			{:else}
				<p class="ask">{isFa ? item.ask.fa : item.ask.en}</p>
				<form class="typed" onsubmit={event => { event.preventDefault(); check(); }}>
					<label class="sr-only" for="ds-answer">{isFa ? item.ask.fa : item.ask.en}</label>
					<input id="ds-answer" bind:this={box} bind:value={typed} lang="en" dir="ltr" inputmode={item.inputMode} placeholder={item.placeholder}
						autocapitalize="off" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="done" maxlength="60" disabled={status === 'playing'} />
					{#if persianTyped}<p class="note">{T('Switch to an English keyboard.', 'صفحه‌کلید را انگلیسی کن.')}</p>{/if}
				</form>
				{#if plays < MAX_PLAYS}
					<button class="link quiet" type="button" onclick={listen} disabled={status === 'playing'}>{status === 'playing' ? T('Playing…', 'در حال پخش…') : `▶ ${T('Play once more (it will be marked)', 'یک بار دیگر پخش کن (علامت می‌خورد)')}`}</button>
				{:else}
					<p class="hint">{T('No more plays.', 'دیگر پخشی نمانده.')}</p>
				{/if}
				{#if status === 'playFailed'}<p class="note">{T('Couldn’t play. This didn’t count.', 'پخش نشد. این یکی حساب نشد.')}</p>{/if}
				{@render bottom(T('Check', 'بررسی'), check, !typed.trim() || persianTyped || status === 'playing')}
			{/if}
			<button class="link quiet later" type="button" onclick={later}>{T('Finish later', 'بعداً تمام می‌کنم')}</button>

		{:else}
			<p class="result" class:right={answer.correct} tabindex="-1" bind:this={resultLine}>{answer.correct ? `✓ ${T('Right!', 'درست!')}` : `✗ ${T('Not quite.', 'نه کاملاً.')}`}
				{#if answer.plays > 1}<small>{T('(2 plays)', '(۲ بار پخش)')}</small>{/if}</p>
			<div class="pair">
				<p class="boxlabel">{T('You wrote', 'نوشتی')}</p>
				<p class="yours" lang="en" dir="ltr">{answer.text}</p>
				{#if !answer.correct}
					<p class="boxlabel">{T('Correct', 'درست')}</p>
					<p class="correct" lang="en" dir="ltr">{item.answer}</p>
				{/if}
				<p class="boxlabel">{T('What you heard', 'آنچه شنیدی')}</p>
				<p class="line" lang="en" dir="ltr">{item.line}</p>
			</div>
			<button class="link" type="button" onclick={() => listenAgain(item.line)} disabled={replaying}>▶ {T('Listen again', 'دوباره گوش بده')}</button>
			{#if !answer.correct || answer.plays > 1}<p class="tip">{#if isFa}<MixedText text={item.tip.fa} />{:else}{item.tip.en}{/if}</p>{/if}
			{@render bottom(index + 1 < ITEMS.length ? T('Next', 'بعدی') : T('See your result', 'دیدن نتیجه'), nextItem)}
		{/if}

	{:else}
		<p class="label">{T('Your result', 'نتیجهٔ تو')}</p>
		<p class="big">{T(`${summary.right} of ${ITEMS.length} right`, `${fa(summary.right)} از ${fa(ITEMS.length)} درست`)}</p>
		<ul class="stats">
			<li><span class="num">{N(summary.firstListen)}</span>{T('caught on the first listen', 'با بار اول گرفتی')}</li>
			{#if summary.averageSeconds !== null}<li><span class="num">{N(summary.averageSeconds)}{T('s', ' ث')}</span>{T('average time to answer', 'میانگین زمان جواب')}</li>{/if}
		</ul>
		{#if summary.missed.length}
			<p class="hint">{T('The ones you missed:', 'آن‌هایی که از دست دادی:')}</p>
			<ul class="missed">
				{#each summary.missed as i}
					<li>
						<p class="line" lang="en" dir="ltr">{ITEMS[i].line}</p>
						<p class="hint">{T('Answer:', 'جواب:')} <bdi lang="en" dir="ltr"><strong>{ITEMS[i].answer}</strong></bdi> · {T('you wrote', 'نوشتی')} <bdi lang="en" dir="ltr">{record.answers[i]?.text}</bdi></p>
						<button class="link" type="button" onclick={() => listenAgain(ITEMS[i].line)} disabled={replaying}>▶ {T('Listen', 'گوش بده')}</button>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="tip">{T('You caught every detail. Great listening!', 'همهٔ جزئیات را گرفتی. عالی گوش دادی!')}</p>
		{/if}
		<button class="link quiet" type="button" onclick={again}>{T('Try it again', 'دوباره امتحان کن')}</button>
		{@render bottom(T('Done', 'تمام'), finish)}
	{/if}
</section>

<style>
	.ds { display: grid; gap: 14px; padding-bottom: 104px; }
	.brief { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.brief p { margin: 0; line-height: 1.55; }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.label { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .label { letter-spacing: normal; }
	.dots { display: flex; gap: 4px; }
	.dots span { flex: 1; block-size: 6px; border-radius: 3px; background: var(--paper-sunken); }
	.dots span.done { background: var(--leaf); }
	.dots span.now { background: var(--accent); }
	.listen { display: grid; justify-items: center; gap: 6px; inline-size: 100%; padding: 28px 16px; border: 2px solid var(--accent); border-radius: 20px; background: var(--paper-raised); color: var(--accent-deep); font: inherit; font-size: 1.15rem; font-weight: 700; cursor: pointer; }
	.listen:disabled { border-color: var(--line); color: var(--ink-soft); cursor: default; }
	.listen .icon { font-size: 2.2rem; line-height: 1; }
	.ask { margin: 0; font-family: var(--font-display); font-size: clamp(1.35rem, 6vw, 1.75rem); line-height: 1.3; }
	.typed { display: grid; gap: 6px; }
	.typed input { inline-size: 100%; min-height: 56px; padding: 12px 16px; border: 1.5px solid var(--line); border-radius: 14px; background: var(--paper-raised); color: var(--ink); font: inherit; font-size: 1.3rem; letter-spacing: .02em; }
	.result { margin: 0; font-size: 1.3rem; font-weight: 700; color: var(--attention); }
	.result.right { color: var(--leaf); }
	.result small { margin-inline-start: 6px; font-size: .85rem; color: var(--ink-soft); }
	.result:focus { outline: none; }
	.pair { display: grid; gap: 6px; }
	.boxlabel { margin: 4px 0 0; font-size: .75rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--ink-soft); }
	:global([dir='rtl']) .boxlabel { letter-spacing: normal; }
	.yours, .correct, .line { margin: 0; padding: 12px 16px; border-radius: 14px; line-height: 1.6; text-align: left; }
	.yours { background: var(--paper-sunken); font-size: 1.15rem; }
	.correct { background: var(--paper-raised); border: 1px solid var(--leaf); font-size: 1.15rem; font-weight: 700; }
	.line { background: var(--paper-raised); border: 1px solid var(--line); }
	.big { margin: 0; font-family: var(--font-display); font-size: clamp(1.6rem, 7vw, 2.1rem); color: var(--accent-deep); }
	.stats { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
	.stats li { display: grid; gap: 4px; justify-items: center; padding: 14px 8px; border-radius: 14px; background: var(--paper-raised); border: 1px solid var(--line); text-align: center; color: var(--ink-soft); font-size: .88rem; }
	.num { font-family: var(--font-display); font-size: 2rem; color: var(--accent-deep); }
	.missed { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
	.missed li { display: grid; gap: 4px; }
	.tip { margin: 0; line-height: 1.55; }
	.note { margin: 0; line-height: 1.5; }
	.hint { margin: 0; color: var(--ink-soft); line-height: 1.5; }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.link.quiet { color: var(--ink-soft); }
	.link:disabled { opacity: .5; cursor: default; }
	.later { margin-top: 8px; }
	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 20; padding: 12px 20px calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 35%); }
	.primary { display: flex; align-items: center; justify-content: center; inline-size: 100%; max-inline-size: 680px; margin-inline: auto; min-height: 54px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	.primary:disabled { opacity: .5; cursor: default; }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	h2:focus { outline: none; }
	button:focus-visible, input:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
</style>
