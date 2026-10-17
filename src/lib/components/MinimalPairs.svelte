<script lang="ts">
	/**
	 * "Minimal pairs duel", Module lab (docs/english-minimal-pairs-spec.md, owner-approved).
	 * One word plays by itself; the learner taps which of the two it was, then hears both. Checked
	 * in code, no AI. At the end they can record their weakest pair and compare it with Mira's
	 * (kept in memory only, not scored, never sent anywhere).
	 */
	import { onDestroy, onMount } from 'svelte';
	import MixedText from '$lib/components/MixedText.svelte';
	import PronounceCheck from '$lib/components/PronounceCheck.svelte';
	import { playAudioPromise, playAudioUrl, stopAllAudio, ttsUrl } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import {
		CONTRASTS, MAX_REPLAYS, checkList, SAY_MAX_SECONDS, VOICE, newRound, pairOf, practiceRound, summarize, wordOf, type PairsRecord, type Side
	} from '$lib/practice/minimal-pairs';

	let { isFa = false, initial = null, first = false, pronounceCheck = false, onSave, onDone }: {
		isFa?: boolean;
		initial?: PairsRecord | null;
		first?: boolean;
		/** The on-device pronunciation check (Module lab experiment). */
		pronounceCheck?: boolean;
		onSave?: (record: PairsRecord) => void;
		onDone: () => void;
	} = $props();

	const INTRO = {
		en: 'You’ll hear one word. Two words will be on the screen: tap the one you heard. They sound close, so listen carefully.',
		fa: 'یک کلمه می‌شنوی. دو کلمه روی صفحه است: همان را که شنیدی بزن. صدایشان نزدیک است، پس با دقت گوش بده.'
	};

	// svelte-ignore state_referenced_locally
	let record = $state<PairsRecord>(initial ?? newRound());
	let stage = $state<'start' | 'duel' | 'result' | 'check'>('start');
	let status = $state<'idle' | 'playing' | 'playFailed'>('idle'), heardOnce = $state(false), announce = $state('');
	let heading: HTMLElement | undefined = $state(), resultLine: HTMLElement | undefined = $state();
	// Speaking: record-and-compare, in memory only.
	let sayStatus = $state<'idle' | 'recording' | 'denied'>('idle'), myUrl = $state<string | null>(null), elapsed = $state(0);
	let recorder: MediaRecorder | null = null, stream: MediaStream | null = null, chunks: Blob[] = [], timer: ReturnType<typeof setInterval> | undefined, myPlayer: HTMLAudioElement | null = null;
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const fa = (n: number) => n.toLocaleString('fa-IR');
	const N = (n: number) => (isFa ? fa(n) : String(n));
	const index = $derived(Math.min(record.index, record.duels.length - 1));
	const duel = $derived(record.duels[index]);
	const pair = $derived(pairOf(duel));
	const pick = $derived(record.picks[index]);
	const replaysLeft = $derived(MAX_REPLAYS - (record.replays[index] ?? 0));

	onMount(() => {
		// A reload returns to the duel (or its check); the word waits for a tap.
		if (record.done || record.index >= record.duels.length) stage = 'result';
		else if (record.picks.some(p => p !== null) || record.replays.some(Boolean)) { stage = 'duel'; heardOnce = record.picks[index] !== null; }
		else if (first) void playAudioPromise(INTRO.en.replace(/’/g, "'"), COACH_RATE, 'en-US', undefined, COACH_VOICE);
	});
	onDestroy(() => { clearInterval(timer); myPlayer?.pause(); if (recorder && recorder.state !== 'inactive') recorder.stop(); stream?.getTracks().forEach(t => t.stop()); if (myUrl) URL.revokeObjectURL(myUrl); });

	function persist() { onSave?.($state.snapshot(record)); }
	const audioOf = (text: string) => ttsUrl(text, 'en-US', 1, VOICE);
	/** Both words, one after the other, so they hear the difference. */
	const both = (words: [string, string]) => `${words[0]}. ${words[1]}.`;
	function prefetch(i: number) { const d = record.duels[i]; if (d) void fetch(audioOf(wordOf(d)).url).catch(() => {}); }

	async function play(text: string): Promise<boolean> {
		stopAllAudio();
		const { url, playback } = audioOf(text);
		let started = false;
		await playAudioUrl(url, 10_000, playback, () => { started = true; });
		return started;
	}
	/** The word for this duel: by itself on arrival, then one replay. */
	async function playWord(replay = false) {
		if (status === 'playing' || (replay && replaysLeft <= 0)) return;
		status = 'playing'; announce = '';
		const at = index;
		const started = await play(wordOf(duel));
		if (!started) { status = 'playFailed'; return; }
		if (replay) { const used = [...record.replays]; used[at] = Math.min(MAX_REPLAYS, used[at] + 1); record = { ...record, replays: used }; persist(); }
		heardOnce = true; status = 'idle';
		announce = T('Which word did you hear?', 'کدام کلمه را شنیدی؟');
	}
	function enter() { status = 'idle'; heardOnce = false; announce = ''; queueMicrotask(() => heading?.focus()); void playWord(); prefetch(index + 1); }
	function start() { stopAllAudio(); stage = 'duel'; enter(); }

	function choose(side: Side) {
		if (pick !== null || !heardOnce || status === 'playing') return;
		const picks = [...record.picks]; picks[index] = side;
		record = { ...record, picks }; persist();
		queueMicrotask(() => resultLine?.focus());
		void playBoth();
	}
	async function playBoth() { status = 'playing'; await play(both(pair)); status = 'idle'; }
	function next() {
		stopAllAudio();
		const nextIndex = record.index + 1;
		record = { ...record, index: nextIndex, done: nextIndex >= record.duels.length }; persist();
		if (nextIndex >= record.duels.length) { announce = ''; stage = 'result'; queueMicrotask(() => heading?.focus()); } else enter();
	}

	// The result: say the weakest pair and compare with Mira.
	async function say() {
		if (sayStatus === 'recording') { recorder?.stop(); return; }
		stopAllAudio(); myPlayer?.pause();
		if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') { sayStatus = 'denied'; return; }
		try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { sayStatus = 'denied'; return; }
		const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
		recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
		chunks = [];
		recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
		recorder.onstop = () => {
			clearInterval(timer);
			stream?.getTracks().forEach(t => t.stop()); stream = null;
			if (myUrl) URL.revokeObjectURL(myUrl);
			myUrl = chunks.length ? URL.createObjectURL(new Blob(chunks, { type: recorder?.mimeType || 'audio/webm' })) : null;
			sayStatus = 'idle';
		};
		recorder.start();
		const startedAt = performance.now(); elapsed = 0; sayStatus = 'recording';
		timer = setInterval(() => {
			elapsed = (performance.now() - startedAt) / 1000;
			if (elapsed >= SAY_MAX_SECONDS && recorder?.state === 'recording') recorder.stop();
		}, 200);
	}
	function hearMine() { if (!myUrl) return; stopAllAudio(); myPlayer?.pause(); myPlayer = new Audio(myUrl); void myPlayer.play().catch(() => {}); }

	function practise() { stopAllAudio(); record = practiceRound(summary.missed); persist(); resetSay(); stage = 'duel'; enter(); }
	function again() { stopAllAudio(); record = newRound(); persist(); resetSay(); stage = 'duel'; enter(); }
	function resetSay() { myPlayer?.pause(); if (myUrl) URL.revokeObjectURL(myUrl); myUrl = null; sayStatus = 'idle'; }
	function finish() { stopAllAudio(); onDone(); }
	function openCheck() { stopAllAudio(); resetSay(); stage = 'check'; }
	function closeCheck() { stage = 'result'; queueMicrotask(() => heading?.focus()); }

	const summary = $derived(summarize(record));
	// The word pair they missed in their hardest sounds, to say and compare.
	const weakDuel = $derived(summary.weakest === null ? null : record.duels.find((d, i) => d.contrast === summary.weakest && record.picks[i] !== d.target) ?? null);
	const weakPair = $derived(weakDuel ? pairOf(weakDuel) : null);
</script>

{#snippet bottom(label: string, action: () => void, disabled = false)}
	<div class="bar"><button class="primary" type="button" onclick={action} {disabled}>{label}</button></div>
{/snippet}

<section class="mp">
	<h2 class="sr-only" tabindex="-1" bind:this={heading}>{stage === 'duel' ? T(`Duel ${index + 1} of ${record.duels.length}`, `دوئل ${fa(index + 1)} از ${fa(record.duels.length)}`) : T('Minimal pairs duel', 'دوئل کلمه‌های هم‌آوا')}</h2>
	<p class="sr-only" role="status" aria-live="polite">{announce}</p>

	{#if stage === 'start'}
		<div class="brief"><span class="avatar" aria-hidden="true">M</span><p>{isFa ? INTRO.fa : INTRO.en}</p></div>
		{@render bottom(T('Start', 'شروع'), start)}

	{:else if stage === 'duel'}
		<p class="label" aria-hidden="true">{record.practice ? T('Practice · ', 'تمرین · ') : ''}{T(`Duel ${index + 1} of ${record.duels.length}`, `دوئل ${fa(index + 1)} از ${fa(record.duels.length)}`)}</p>
		<div class="dots" aria-hidden="true">{#each record.duels as _, i}<span class:done={i < index} class:now={i === index}></span>{/each}</div>

		<p class="ask">{pick === null ? T('Which word did you hear?', 'کدام کلمه را شنیدی؟') : ''}</p>
		<div class="choices">
			{#each pair as word, side}
				<button class="choice" type="button" lang="en" onclick={() => choose(side as Side)} disabled={pick === null ? !heardOnce || status === 'playing' : false}
					class:right={pick !== null && side === duel.target} class:wrong={pick === side && side !== duel.target} aria-pressed={pick === side}>
					{word}{#if pick !== null && side === duel.target}<span class="mark" aria-hidden="true"> ✓</span>{:else if pick === side}<span class="mark" aria-hidden="true"> ✗</span>{/if}
				</button>
			{/each}
		</div>

		{#if pick === null}
			{#if status === 'playing'}<p class="hint">{T('Listen…', 'گوش بده…')}</p>
			{:else if status === 'playFailed' || !heardOnce}<button class="link" type="button" onclick={() => playWord()}>▶ {T('Play the word', 'کلمه را پخش کن')}</button>
				{#if status === 'playFailed'}<p class="note">{T('Couldn’t play. Try again.', 'پخش نشد. دوباره امتحان کن.')}</p>{/if}
			{:else if replaysLeft > 0}<button class="link quiet" type="button" onclick={() => playWord(true)}>▶ {T('Hear it again', 'دوباره بشنو')}</button>
			{:else}<p class="hint">{T('No more replays.', 'دیگر تکرار نمانده.')}</p>{/if}
		{:else}
			<p class="result" class:ok={pick === duel.target} tabindex="-1" bind:this={resultLine}>
				{pick === duel.target ? `✓ ${T('Right!', 'درست!')}` : `✗ ${T(`It was “${wordOf(duel)}”.`, `«${wordOf(duel)}» بود.`)}`}
			</p>
			<button class="link" type="button" onclick={playBoth} disabled={status === 'playing'}>▶ {T('Hear both', 'هر دو را بشنو')}: <bdi lang="en" dir="ltr">{pair[0]} … {pair[1]}</bdi></button>
			{#if pick !== duel.target}<p class="tip">{#if isFa}<MixedText text={CONTRASTS[duel.contrast].tip.fa} />{:else}{CONTRASTS[duel.contrast].tip.en}{/if}</p>{/if}
			{@render bottom(index + 1 < record.duels.length ? T('Next', 'بعدی') : T('See your result', 'دیدن نتیجه'), next)}
		{/if}

	{:else if stage === 'check'}
		<PronounceCheck {isFa} words={checkList(summary.weakest)} onBack={closeCheck} />

	{:else}
		<p class="label">{record.practice ? T('Practice result', 'نتیجهٔ تمرین') : T('Your result', 'نتیجهٔ تو')}</p>
		<p class="big">{T(`${summary.right} of ${summary.total} right`, `${fa(summary.right)} از ${fa(summary.total)} درست`)}</p>
		<ul class="sounds">
			{#each summary.byContrast as row}
				<li class:miss={row.right < row.total}><span lang="en" dir="ltr">{isFa ? CONTRASTS[row.contrast].label.fa : CONTRASTS[row.contrast].label.en}</span><span>{row.right === row.total ? '✓' : '✗'} {N(row.right)}/{N(row.total)}</span></li>
			{/each}
		</ul>

		{#if summary.weakest !== null && weakPair}
			<div class="weak">
				<p class="boxlabel">{T('Your hardest sounds', 'سخت‌ترین صداها برای تو')}: <bdi lang="en" dir="ltr">{CONTRASTS[summary.weakest].label.en}</bdi></p>
				<p class="tip">{#if isFa}<MixedText text={CONTRASTS[summary.weakest].tip.fa} />{:else}{CONTRASTS[summary.weakest].tip.en}{/if}</p>
				<button class="link" type="button" onclick={() => play(both(weakPair))}>▶ {T('Mira', 'میرا')}: <bdi lang="en" dir="ltr">{weakPair[0]} … {weakPair[1]}</bdi></button>
				<p class="hint">{T(`Now say both words: “${weakPair[0]}, ${weakPair[1]}”. Then compare.`, `حالا هر دو کلمه را بگو: «${weakPair[0]}, ${weakPair[1]}». بعد مقایسه کن.`)}</p>
				<button class="say" class:rec={sayStatus === 'recording'} type="button" onclick={say}>
					{#if sayStatus === 'recording'}<span class="dot" aria-hidden="true"></span>{T('Stop', 'پایان')}<span aria-hidden="true">&nbsp;{Math.max(0, Math.ceil(SAY_MAX_SECONDS - elapsed))}</span>
					{:else}<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0M12 17v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>{myUrl ? T('Say it again', 'دوباره بگو') : T('Say them', 'بگو')}{/if}
				</button>
				{#if myUrl}<button class="link" type="button" onclick={hearMine}>▶ {T('Me', 'خودم')}</button>
					<p class="hint">{T('Does yours sound like two different words? This isn’t scored.', 'آیا صدای تو مثل دو کلمهٔ متفاوت است؟ این امتیاز ندارد.')}</p>{/if}
				{#if sayStatus === 'denied'}<p class="note">{T('The microphone is blocked. Allow it in your browser’s site settings.', 'میکروفون بسته است. در تنظیمات سایت اجازه‌اش را بده.')}</p>{/if}
			</div>
			<button class="link quiet" type="button" onclick={practise}>{T('Practise my weak sounds', 'صداهای ضعیفم را تمرین کن')}</button>
		{:else}
			<p class="tip">{T('A perfect ear: you heard every difference.', 'گوش بی‌نقص: همهٔ تفاوت‌ها را شنیدی.')}</p>
		{/if}
		{#if pronounceCheck}<button class="link" type="button" onclick={openCheck}>{T('Check my pronunciation (experiment)', 'تلفظم را بررسی کن (آزمایشی)')}</button>{/if}
		<button class="link quiet" type="button" onclick={again}>{T('Try a new round', 'یک دور تازه')}</button>
		{@render bottom(T('Done', 'تمام'), finish)}
	{/if}
</section>

<style>
	.mp { display: grid; gap: 14px; padding-bottom: 104px; }
	.brief { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.brief p { margin: 0; line-height: 1.55; }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.label { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .label { letter-spacing: normal; }
	.dots { display: flex; gap: 4px; }
	.dots span { flex: 1; block-size: 6px; border-radius: 3px; background: var(--paper-sunken); }
	.dots span.done { background: var(--leaf); }
	.dots span.now { background: var(--accent); }
	.ask { margin: 8px 0 0; min-block-size: 1.5em; font-family: var(--font-display); font-size: 1.35rem; }
	.choices { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; direction: ltr; }
	.choice { min-block-size: 120px; padding: 16px 8px; border: 2px solid var(--accent); border-radius: 20px; background: var(--paper-raised); color: var(--ink); font-family: var(--font-display); font-size: clamp(1.6rem, 8vw, 2.2rem); cursor: pointer; }
	.choice:disabled { cursor: default; opacity: .55; }
	.choice.right { border-color: var(--leaf); background: color-mix(in srgb, var(--leaf) 14%, var(--paper-raised)); opacity: 1; }
	.choice.wrong { border-color: var(--attention); background: color-mix(in srgb, var(--attention) 14%, var(--paper-raised)); opacity: 1; }
	.mark { font-size: .7em; }
	.result { margin: 0; font-size: 1.25rem; font-weight: 700; color: var(--attention); }
	.result.ok { color: var(--leaf); }
	.result:focus { outline: none; }
	.big { margin: 0; font-family: var(--font-display); font-size: clamp(1.6rem, 7vw, 2.1rem); color: var(--accent-deep); }
	.sounds { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
	.sounds li { display: flex; justify-content: space-between; padding: 10px 14px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); font-weight: 600; }
	.sounds li.miss { border-color: var(--attention); }
	.sounds li.miss span:last-child { color: var(--attention); }
	.weak { display: grid; gap: 8px; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--accent); }
	.boxlabel { margin: 0; font-size: .8rem; font-weight: 700; color: var(--accent-deep); }
	.say { justify-self: start; display: inline-flex; align-items: center; gap: 8px; min-height: 48px; padding: 10px 18px; border: 2px solid var(--accent); border-radius: 999px; background: none; color: var(--accent-deep); font: inherit; font-weight: 700; cursor: pointer; }
	.say.rec { border-color: var(--attention); color: var(--attention); }
	.dot { inline-size: 10px; block-size: 10px; border-radius: 50%; background: currentColor; animation: pulse 1.2s infinite ease-in-out; }
	@keyframes pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
	.tip { margin: 0; line-height: 1.55; }
	.note { margin: 0; line-height: 1.5; }
	.hint { margin: 0; color: var(--ink-soft); line-height: 1.5; }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.link.quiet { color: var(--ink-soft); }
	.link:disabled { opacity: .5; cursor: default; }
	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 20; padding: 12px 20px calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 35%); }
	.primary { display: flex; align-items: center; justify-content: center; inline-size: 100%; max-inline-size: 680px; margin-inline: auto; min-height: 54px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	h2:focus { outline: none; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	@media (prefers-reduced-motion: reduce) { .dot { animation: none; } }
</style>
