<script lang="ts">
	/**
	 * "Connected speech", Module lab (docs/english-connected-speech-spec.md, owner-approved).
	 * A short sentence plays at natural speed (no text); the learner taps which of three written
	 * sentences they heard, then sees how it sounds next to how it's written, with natural and slow
	 * versions. Checked in code, no AI.
	 */
	import { onMount } from 'svelte';
	import MixedText from '$lib/components/MixedText.svelte';
	import { playAudioPromise, playAudioUrl, stopAllAudio, ttsUrl } from '$services/tts';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import {
		ITEMS, MAX_REPLAYS, NATURAL_RATE, PATTERNS, SLOW_RATE, VOICE, emptyConnected, fullOf, summarize, type ConnectedRecord
	} from '$lib/practice/connected-speech';

	let { isFa = false, initial = null, first = false, onSave, onDone }: {
		isFa?: boolean;
		initial?: ConnectedRecord | null;
		first?: boolean;
		onSave?: (record: ConnectedRecord) => void;
		onDone: () => void;
	} = $props();

	const INTRO = {
		en: `In everyday English, words join together and get shorter. You’ll hear ${ITEMS.length} short sentences at natural speed. After each one, tap the sentence you heard. Then you’ll see how it really sounds.`,
		fa: `در انگلیسی روزمره، کلمه‌ها به هم می‌چسبند و کوتاه‌تر می‌شوند. ${ITEMS.length.toLocaleString('fa-IR')} جملهٔ کوتاه با سرعت طبیعی می‌شنوی. روی جمله‌ای که شنیدی بزن. بعد می‌بینی واقعاً چطور شنیده می‌شود.`
	};

	// svelte-ignore state_referenced_locally
	let record = $state<ConnectedRecord>(initial ?? emptyConnected());
	let stage = $state<'start' | 'item' | 'result'>('start');
	let status = $state<'idle' | 'playing' | 'playFailed'>('idle'), heardOnce = $state(false), announce = $state('');
	let heading: HTMLElement | undefined = $state(), resultLine: HTMLElement | undefined = $state();
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const fa = (n: number) => n.toLocaleString('fa-IR');
	const index = $derived(Math.min(record.index, ITEMS.length - 1));
	const item = $derived(ITEMS[index]);
	const pick = $derived(record.picks[index]);
	const replaysLeft = $derived(MAX_REPLAYS - (record.replays[index] ?? 0));
	const pattern = $derived(PATTERNS[item.pattern]);

	onMount(() => {
		// A reload returns to the item (or its reveal); the sentence waits for a tap.
		if (record.done || record.index >= ITEMS.length) stage = 'result';
		else if (record.picks.some(p => p !== null) || record.replays.some(Boolean)) { stage = 'item'; heardOnce = record.picks[index] !== null; }
		else if (first) void playAudioPromise(INTRO.en.replace(/’/g, "'"), COACH_RATE, 'en-US', undefined, COACH_VOICE);
		return () => stopAllAudio();
	});

	function persist() { onSave?.($state.snapshot(record)); }
	const clean = (text: string) => text.replace(/[’‘]/g, "'");
	const natural = (i: number) => ttsUrl(clean(ITEMS[i].spoken), 'en-US', NATURAL_RATE, VOICE);
	function prefetch(i: number) { if (ITEMS[i]) void fetch(natural(i).url).catch(() => {}); }

	async function play(audio: { url: string; playback: number }): Promise<boolean> {
		stopAllAudio();
		let started = false;
		await playAudioUrl(audio.url, 12_000, audio.playback, () => { started = true; });
		return started;
	}
	/** The sentence at natural speed: by itself on arrival, then one replay before answering. */
	async function playSentence(replay = false) {
		if (status === 'playing' || (replay && replaysLeft <= 0)) return;
		status = 'playing'; announce = '';
		const at = index;
		const started = await play(natural(at));
		if (!started) { status = 'playFailed'; return; }
		if (replay) { const used = [...record.replays]; used[at] = Math.min(MAX_REPLAYS, used[at] + 1); record = { ...record, replays: used }; persist(); }
		heardOnce = true; status = 'idle';
		announce = T('Which sentence did you hear?', 'کدام جمله را شنیدی؟');
	}
	/** After answering: unlimited, never counted. */
	async function hear(slow: boolean) {
		status = 'playing';
		await play(slow ? ttsUrl(clean(fullOf(item)), 'en-US', SLOW_RATE, VOICE) : natural(index));
		status = 'idle';
	}
	function enter() { status = 'idle'; heardOnce = false; announce = ''; queueMicrotask(() => heading?.focus()); void playSentence(); prefetch(index + 1); }
	function start() { stopAllAudio(); stage = 'item'; enter(); }

	function choose(choice: number) {
		if (pick !== null || !heardOnce || status === 'playing') return;
		const picks = [...record.picks]; picks[index] = choice;
		record = { ...record, picks }; persist();
		queueMicrotask(() => resultLine?.focus());
	}
	function next() {
		stopAllAudio();
		const nextIndex = record.index + 1;
		record = { ...record, index: nextIndex, done: nextIndex >= ITEMS.length }; persist();
		if (nextIndex >= ITEMS.length) { announce = ''; stage = 'result'; queueMicrotask(() => heading?.focus()); } else enter();
	}
	function again() { stopAllAudio(); record = emptyConnected(); persist(); stage = 'item'; enter(); }
	function finish() { stopAllAudio(); onDone(); }

	const summary = $derived(summarize(record));
	const weakItems = $derived(summary.weakest === null ? [] : ITEMS.map((it, i) => ({ it, i })).filter(x => x.it.pattern === summary.weakest));
	async function hearItem(i: number) { await play(natural(i)); }
</script>

{#snippet bottom(label: string, action: () => void, disabled = false)}
	<div class="bar"><button class="primary" type="button" onclick={action} {disabled}>{label}</button></div>
{/snippet}

<section class="cs">
	<h2 class="sr-only" tabindex="-1" bind:this={heading}>{stage === 'item' ? T(`Sentence ${index + 1} of ${ITEMS.length}`, `جملهٔ ${fa(index + 1)} از ${fa(ITEMS.length)}`) : T('Connected speech', 'گفتار پیوسته')}</h2>
	<p class="sr-only" role="status" aria-live="polite">{announce}</p>

	{#if stage === 'start'}
		<div class="brief"><span class="avatar" aria-hidden="true">M</span><p>{isFa ? INTRO.fa : INTRO.en}</p></div>
		{@render bottom(T('Start', 'شروع'), start)}

	{:else if stage === 'item'}
		<p class="label" aria-hidden="true">{T(`Sentence ${index + 1} of ${ITEMS.length}`, `جملهٔ ${fa(index + 1)} از ${fa(ITEMS.length)}`)}</p>
		<div class="dots" aria-hidden="true">{#each ITEMS as _, i}<span class:done={i < index} class:now={i === index}></span>{/each}</div>

		{#if pick === null}
			<p class="ask">{T('Which sentence did you hear?', 'کدام جمله را شنیدی؟')}</p>
			<div class="choices" dir="ltr">
				{#each item.choices as choice, i}
					<button class="choice" type="button" lang="en" onclick={() => choose(i)} disabled={!heardOnce || status === 'playing'}>{choice}</button>
				{/each}
			</div>
			{#if status === 'playing'}<p class="hint">{T('Listen…', 'گوش بده…')}</p>
			{:else if status === 'playFailed' || !heardOnce}<button class="link" type="button" onclick={() => playSentence()}>▶ {T('Play the sentence', 'جمله را پخش کن')}</button>
				{#if status === 'playFailed'}<p class="note">{T('Couldn’t play. Try again.', 'پخش نشد. دوباره امتحان کن.')}</p>{/if}
			{:else if replaysLeft > 0}<button class="link quiet" type="button" onclick={() => playSentence(true)}>▶ {T('Hear it again', 'دوباره بشنو')}</button>
			{:else}<p class="hint">{T('No more replays.', 'دیگر نمی‌شود دوباره پخش کرد.')}</p>{/if}

		{:else}
			<p class="result" class:ok={pick === item.answer} tabindex="-1" bind:this={resultLine}>{pick === item.answer ? `✓ ${T('Right!', 'درست!')}` : `✗ ${T('Not quite.', 'نه، این نبود.')}`}</p>
			{#if pick !== item.answer}<p class="picked" lang="en" dir="ltr"><span class="who" lang={isFa ? 'fa' : 'en'} dir={isFa ? 'rtl' : 'ltr'}>{T('You chose', 'انتخاب تو')}</span><s>{item.choices[pick]}</s></p>{/if}
			<div class="pair">
				<p class="sounds" lang="en" dir="ltr"><span class="who" lang={isFa ? 'fa' : 'en'} dir={isFa ? 'rtl' : 'ltr'}>{T('It sounds like', 'این‌طور شنیده می‌شود')}</span>{item.soundsLike}</p>
				<p class="written" lang="en" dir="ltr"><span class="who" lang={isFa ? 'fa' : 'en'} dir={isFa ? 'rtl' : 'ltr'}>{T('It’s written', 'این‌طور نوشته می‌شود')}</span>{fullOf(item)}</p>
			</div>
			<div class="plays">
				<button class="link" type="button" onclick={() => hear(false)} disabled={status === 'playing'}>▶ {T('Natural', 'طبیعی')}</button>
				<button class="link" type="button" onclick={() => hear(true)} disabled={status === 'playing'}>▶ {T('Slow', 'آهسته')}</button>
			</div>
			<p class="tip"><strong><bdi>{isFa ? pattern.label.fa : pattern.label.en}</bdi>:</strong>{isFa ? '\u200f' : ''} {#if isFa}<MixedText text={pattern.tip.fa} />{:else}{pattern.tip.en}{/if}</p>
			{@render bottom(index + 1 < ITEMS.length ? T('Next', 'بعدی') : T('See your result', 'دیدن نتیجه'), next)}
		{/if}

	{:else}
		<p class="label">{T('Your result', 'نتیجهٔ تو')}</p>
		<p class="big">{T(`${summary.right} of ${ITEMS.length} right`, `${fa(summary.right)} از ${fa(ITEMS.length)} درست`)}</p>
		<ul class="rows">
			{#each summary.byPattern as row}
				<li class:miss={row.right < row.total}><span>{#if isFa}<MixedText text={PATTERNS[row.pattern].label.fa} />{:else}{PATTERNS[row.pattern].label.en}{/if}</span><span>{row.right === row.total ? '✓' : '✗'} {isFa ? `${fa(row.right)} از ${fa(row.total)}` : `${row.right}/${row.total}`}</span></li>
			{/each}
		</ul>
		{#if summary.weakest !== null}
			<div class="weak">
				<p class="boxlabel">{T('To work on', 'برای تمرین بیشتر')}: <bdi>{#if isFa}<MixedText text={PATTERNS[summary.weakest].label.fa} />{:else}{PATTERNS[summary.weakest].label.en}{/if}</bdi></p>
				<p class="tip">{#if isFa}<MixedText text={PATTERNS[summary.weakest].tip.fa} />{:else}{PATTERNS[summary.weakest].tip.en}{/if}</p>
				{#each weakItems as { it, i }}
					<button class="link" type="button" onclick={() => hearItem(i)}>▶ <bdi lang="en" dir="ltr">{it.soundsLike}</bdi></button>
				{/each}
			</div>
		{:else}
			<p class="tip">{T('You caught every one. Real conversations are messier, so keep listening for these patterns.', 'همه را درست تشخیص دادی. در گفت‌وگوی واقعی کار سخت‌تر است؛ پس همچنان حواست به این الگوها باشد.')}</p>
		{/if}
		<button class="link quiet" type="button" onclick={again}>{T('Try it again', 'دوباره امتحان کن')}</button>
		{@render bottom(T('Done', 'تمام'), finish)}
	{/if}
</section>

<style>
	.cs { display: grid; gap: 14px; padding-bottom: 104px; }
	.brief { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.brief p { margin: 0; line-height: 1.55; }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.label { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .label { letter-spacing: normal; }
	.dots { display: flex; gap: 4px; }
	.dots span { flex: 1; block-size: 6px; border-radius: 3px; background: var(--paper-sunken); }
	.dots span.done { background: var(--leaf); }
	.dots span.now { background: var(--accent); }
	.ask { margin: 8px 0 0; font-family: var(--font-display); font-size: 1.35rem; }
	.choices { display: grid; gap: 10px; }
	.choice { min-block-size: 64px; padding: 12px 16px; border: 2px solid var(--accent); border-radius: 16px; background: var(--paper-raised); color: var(--ink); font: inherit; font-size: 1.08rem; line-height: 1.4; text-align: left; cursor: pointer; }
	.choice:disabled { cursor: default; opacity: .55; }
	.result { margin: 0; font-size: 1.3rem; font-weight: 700; color: var(--attention); }
	.result.ok { color: var(--leaf); }
	.result:focus { outline: none; }
	.pair { display: grid; gap: 8px; }
	.who { display: block; text-align: start; font-size: .72rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--ink-soft); }
	:global([dir='rtl']) .who { letter-spacing: normal; }
	.picked, .sounds, .written { margin: 0; padding: 12px 16px; border-radius: 14px; line-height: 1.55; text-align: left; }
	.picked { background: var(--paper-sunken); }
	.picked s { text-decoration-color: var(--attention); }
	.sounds { background: var(--paper-raised); border: 2px solid var(--accent); font-family: var(--font-display); font-size: 1.3rem; }
	.written { background: var(--paper-raised); border: 1px solid var(--line); font-size: 1.05rem; }
	.plays { display: flex; gap: 20px; }
	.big { margin: 0; font-family: var(--font-display); font-size: clamp(1.6rem, 7vw, 2.1rem); color: var(--accent-deep); }
	.rows { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
	.rows li { display: flex; justify-content: space-between; gap: 12px; padding: 10px 14px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); font-weight: 600; }
	.rows li.miss { border-color: var(--attention); }
	.rows li.miss span:last-child { color: var(--attention); }
	.weak { display: grid; gap: 6px; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--accent); }
	.boxlabel { margin: 0; font-size: .85rem; font-weight: 700; color: var(--accent-deep); }
	.tip { margin: 0; line-height: 1.55; }
	.note { margin: 0; line-height: 1.5; }
	.hint { margin: 0; color: var(--ink-soft); line-height: 1.5; }
	.link { justify-self: start; min-height: 44px; padding: 8px 0; background: none; border: 0; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; text-align: start; }
	.link.quiet { color: var(--ink-soft); }
	.link:disabled { opacity: .5; cursor: default; }
	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 20; padding: 12px 20px calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 35%); }
	.primary { display: flex; align-items: center; justify-content: center; inline-size: 100%; max-inline-size: 680px; margin-inline: auto; min-height: 54px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
	h2:focus { outline: none; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
</style>
