<script lang="ts">
	/**
	 * The 2-minute sample for visitors (docs/landing-copy.md): the start of Day 1, with no AI and no
	 * account. Hear Sara at the baggage desk, answer one question, say one phrase and hear yourself
	 * next to Mira, see an example of feedback, then start Day 1 for free. One thing per screen, one
	 * button at the bottom. Every sound starts from a tap. The recording never leaves the phone and
	 * is never checked: the screen says so.
	 */
	import { onDestroy } from 'svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import { playAudioPromise, stopAllAudio } from '$services/tts';
	import { canRecord, startRecording, type Recording } from '$services/voice-clip';
	import { CONVERSATION, SPEAKERS } from '$lib/practice/listen-connect';
	import { ENGLISH_RATE } from '$lib/practice/english-voice';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { visitorEvent } from '$services/visitor-events';

	let { isFa = false, homeHref = '/', signupHref = '/login?mode=signup&from=sample' }: { isFa?: boolean; homeHref?: string; signupHref?: string } = $props();
	const T = (en: string, fa: string) => (isFa ? fa : en);

	/** The first four lines: the missing bag. */
	const LINES = CONVERSATION.slice(0, 4);
	const QUESTION = 'What does the missing bag look like?';
	const OPTIONS = ['A small green backpack.', 'A big gray suitcase.', 'A small gray backpack.'];
	const ANSWER = 0;
	const PHRASE = 'Hi, only one of my bags came out.';
	const STEPS = 5;

	let step = $state(0);
	let playing = $state(false), heard = $state(false), showWords = $state(false);
	let picked = $state<number | null>(null);
	let recState = $state<'idle' | 'recording' | 'done' | 'silent' | 'blocked'>('idle');
	let clipUrl: string | null = null;
	let recording: Recording | null = null;
	let heading: HTMLElement | undefined = $state();
	let started = false;

	onDestroy(() => { stopAllAudio(); recording?.cancel(); if (clipUrl) URL.revokeObjectURL(clipUrl); });

	function go(next: number) {
		stopAllAudio(); recording?.cancel(); playing = false; step = next;
		queueMicrotask(() => heading?.focus());
		if (next === STEPS) visitorEvent('sample_finished', isFa ? 'fa' : 'en');
	}
	async function playConversation() {
		if (!started) { started = true; visitorEvent('sample_started', isFa ? 'fa' : 'en'); }
		stopAllAudio(); playing = true;
		for (const line of LINES) {
			if (!playing) return;
			await playAudioPromise(line.text, ENGLISH_RATE, 'en-US', undefined, SPEAKERS[line.who as 'agent' | 'sara'].voice).catch(() => {});
		}
		playing = false; heard = true;
	}
	function stopPlaying() { playing = false; stopAllAudio(); }
	const hearMira = () => { stopAllAudio(); void playAudioPromise(PHRASE, COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {}); };

	async function record() {
		if (recState === 'recording') { recording?.stop(); return; }
		stopAllAudio();
		const result = await startRecording('say-again');
		if (result === 'blocked' || result === 'unsupported') { recState = 'blocked'; return; }
		recording = result; recState = 'recording';
		const clip = await result.done;
		recording = null;
		if (clip === null) { recState = 'idle'; return; }
		if (clip === 'silent') { recState = 'silent'; return; }
		if (clipUrl) URL.revokeObjectURL(clipUrl);
		clipUrl = URL.createObjectURL(clip.blob);
		recState = 'done';
		go(3);
	}
	/** Mira's line, then the learner's own recording. */
	async function compare() {
		stopAllAudio();
		await playAudioPromise(PHRASE, COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {});
		if (!clipUrl) return;
		await new Promise<void>(resolve => { const own = new Audio(clipUrl!); own.onended = () => resolve(); own.onerror = () => resolve(); void own.play().catch(() => resolve()); });
	}
</script>

<section class="sample" aria-labelledby="sample-step">
	<div class="top">
		<a class="close" href={homeHref} aria-label={T('Close the sample', 'بستن نمونه')}><span aria-hidden="true">✕</span></a>
		{#if step < STEPS}
			<ol class="dots" aria-label={T(`Step ${step + 1} of ${STEPS}`, `مرحلهٔ ${(step + 1).toLocaleString('fa-IR')} از ${STEPS.toLocaleString('fa-IR')}`)}>
				{#each Array(STEPS) as _, i}<li class:on={i <= step} aria-hidden="true"></li>{/each}
			</ol>
		{/if}
	</div>

	{#if step === 0}
		<p class="eyebrow">{T('DAY 1 · AT THE BAGGAGE DESK', 'روز اول — باجهٔ بار گمشده')}</p>
		<h1 id="sample-step" tabindex="-1" bind:this={heading}>{T('Listen', 'گوش بده')}</h1>
		<p class="mira"><span class="av" aria-hidden="true">M</span>{T('Sara has just landed. One of her bags is missing. Listen: what does it look like?', 'سارا تازه رسیده و یکی از چمدان‌هایش گم شده. گوش بده: چه شکلی است؟')}</p>
		{#if showWords}
			<ul class="words" dir="ltr" lang="en">{#each LINES as line}<li><b>{SPEAKERS[line.who as 'agent' | 'sara'].name}:</b> {line.text}</li>{/each}</ul>
		{/if}
		{#if heard || playing}<button class="quiet" type="button" onclick={() => (showWords = !showWords)}>{showWords ? T('Hide the words', 'پنهان کردن متن') : T('Show the words', 'نشان دادن متن')}</button>{/if}
		{#if !heard}
			<ActionBar label={playing ? T('Stop', 'توقف') : T('Play', 'پخش')} icon={playing ? 'stop' : 'play'} onclick={() => (playing ? stopPlaying() : void playConversation())} />
		{:else}
			<ActionBar label={T('Next', 'بعدی')} onclick={() => go(1)} secondary={{ label: T('Play again', 'دوباره پخش کن'), onclick: () => void playConversation() }} />
		{/if}

	{:else if step === 1}
		<p class="eyebrow">{T('ONE QUESTION', 'یک سؤال')}</p>
		<h1 id="sample-step" tabindex="-1" bind:this={heading} lang="en" dir="ltr" class="en">{QUESTION}</h1>
		<div class="options" role="group" aria-label={T('Answers', 'جواب‌ها')}>
			{#each OPTIONS as option, i}
				<button type="button" class="option" class:right={picked === i && i === ANSWER} class:wrong={picked === i && i !== ANSWER} aria-pressed={picked === i} lang="en" dir="ltr" onclick={() => (picked = i)} disabled={picked === ANSWER}>{option}</button>
			{/each}
		</div>
		{#if picked !== null && picked !== ANSWER}
			<p class="note" role="status">{T('Not quite. That’s not the missing one. Sara said:', 'نه دقیقاً. آن چمدانِ گمشده نیست. سارا گفت:')} <bdi lang="en">“{LINES[3].text}”</bdi> {T('Try again.', 'دوباره امتحان کن.')}</p>
		{:else if picked === ANSWER}
			<p class="note good" role="status">✓ {T('Yes, a small green backpack.', 'درست است، یک کوله‌پشتی کوچک سبز.')}</p>
		{/if}
		{#if picked === ANSWER}<ActionBar label={T('Next', 'بعدی')} onclick={() => go(2)} />{/if}

	{:else if step === 2}
		<p class="eyebrow">{T('SAY IT', 'بگو')}</p>
		<h1 id="sample-step" tabindex="-1" bind:this={heading}>{T('Now it’s you at the desk', 'حالا تو جلوی باجه‌ای')}</h1>
		<p class="phrase" lang="en" dir="ltr">“{PHRASE}”</p>
		<p class="gloss">{T('(Hello, only one of my bags came out.)', '(سلام، فقط یکی از چمدان‌هایم بیرون آمد.)')}</p>
		<button class="quiet" type="button" onclick={hearMira}><span aria-hidden="true">▶</span> {T('Hear Mira say it', 'بشنو میرا چطور می‌گوید')}</button>
		<p class="small">{T('Your voice stays on this phone. Nothing is sent.', 'صدایت روی همین گوشی می‌ماند و جایی فرستاده نمی‌شود.')}</p>
		{#if recState === 'silent'}<p class="note" role="status">{T('I didn’t hear anything. Try again, a little louder.', 'صدایی نشنیدم. دوباره، کمی بلندتر امتحان کن.')}</p>{/if}
		{#if recState === 'blocked' || !canRecord()}
			<p class="note" role="status">{T('The microphone isn’t available. You can still see the rest.', 'میکروفون در دسترس نیست. باز هم می‌توانی بقیه را ببینی.')}</p>
			<ActionBar label={T('Next', 'بعدی')} onclick={() => go(4)} />
		{:else}
			<ActionBar label={recState === 'recording' ? T('Stop', 'توقف') : T('Say it', 'بگو')} icon={recState === 'recording' ? 'stop' : 'mic'} recording={recState === 'recording'} onclick={() => void record()} secondary={{ label: T('Skip', 'رد شو'), onclick: () => go(4) }} />
		{/if}

	{:else if step === 3}
		<p class="eyebrow">{T('HEAR YOURSELF', 'صدای خودت را بشنو')}</p>
		<h1 id="sample-step" tabindex="-1" bind:this={heading}>{T('Compare with Mira', 'با میرا مقایسه کن')}</h1>
		<p class="phrase" lang="en" dir="ltr">“{PHRASE}”</p>
		<button class="quiet" type="button" onclick={() => void compare()}><span aria-hidden="true">▶</span> {T('Mira, then you', 'اول میرا، بعد تو')}</button>
		<p class="note">{T('In the app, Mira checks what you say. Here, just compare.', 'در خودِ برنامه، میرا حرفت را بررسی می‌کند. اینجا فقط مقایسه کن.')}</p>
		<ActionBar label={T('Next', 'بعدی')} onclick={() => go(4)} secondary={{ label: T('Say it again', 'دوباره بگو'), onclick: () => { recState = 'idle'; go(2); } }} />

	{:else if step === 4}
		<p class="eyebrow">{T('EXAMPLE', 'نمونه')}</p>
		<h1 id="sample-step" tabindex="-1" bind:this={heading}>{T('What feedback looks like', 'بازخورد این شکلی است')}</h1>
		<div class="fb">
			<p><span class="lbl">{T('You said', 'گفتی')}</span><span class="en" lang="en" dir="ltr">Hi, one of my bag didn’t come.</span></p>
			<p class="better"><span class="lbl">{T('A natural way to say it', 'شکل طبیعی‌تر')}</span><span class="en" lang="en" dir="ltr">Hi, one of my bags didn’t come.</span></p>
			<p><span class="lbl">{T('Tip', 'نکته')}</span>{#if isFa}بعد از <bdi lang="en">one of my</bdi> اسم جمع می‌آید: <bdi lang="en">bags</bdi>، نه <bdi lang="en">bag</bdi>.{:else}After <bdi lang="en">“one of my”</bdi>, say <b>bags</b>, not <b>bag</b>.{/if}</p>
		</div>
		<p class="small">{T('This is an example. In the app, the feedback is about what you said.', 'این یک نمونه است. در برنامه، بازخورد دربارهٔ حرف خودت است.')}</p>
		<ActionBar label={T('Next', 'بعدی')} onclick={() => go(5)} />

	{:else}
		<h1 id="sample-step" tabindex="-1" bind:this={heading}>{T('That was the start of Day 1', 'این شروعِ روز اول بود')}</h1>
		<p>{T('The full lesson is about 15 minutes, and Mira checks what you say. It’s free for now.', 'درس کامل حدود ۱۵ دقیقه است و میرا حرفت را بررسی می‌کند. فعلاً رایگان است.')}</p>
		<div class="bar">
			<a class="primary" href={signupHref} onclick={() => visitorEvent('signup_clicked', isFa ? 'fa' : 'en', 'sample')}>{T('Start Day 1 free', 'روز اول را رایگان شروع کن')} <span aria-hidden="true">{isFa ? '←' : '→'}</span></a>
			<a class="quiet back" href={homeHref}>{T('Back to the page', 'برگشت به صفحه')}</a>
		</div>
	{/if}
</section>

<style>
	.sample { display: grid; gap: 4px; padding-bottom: 150px; }
	.top { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 48px; }
	.close { display: inline-grid; place-items: center; inline-size: 44px; block-size: 44px; border-radius: 50%; color: var(--ink); text-decoration: none; font-size: 1.1rem; }
	.close:focus-visible, .quiet:focus-visible, .option:focus-visible, .primary:focus-visible { outline: 3px solid var(--accent-deep); outline-offset: 2px; }
	.dots { display: flex; gap: 6px; list-style: none; margin: 0; padding: 0; }
	.dots li { inline-size: 8px; block-size: 8px; border-radius: 50%; background: var(--line); }
	.dots li.on { background: var(--accent); }
	.eyebrow { margin: 12px 0 2px; font-size: .76rem; font-weight: 700; letter-spacing: .08em; color: var(--accent-deep); }
	:global([dir='rtl']) .eyebrow { letter-spacing: normal; }
	h1 { margin: 0 0 12px; font-family: var(--font-display); font-weight: 500; font-size: clamp(1.6rem, 6vw, 2.1rem); line-height: 1.2; overflow-wrap: break-word; }
	h1:focus { outline: none; }
	.en { direction: ltr; unicode-bidi: isolate; }
	.mira { display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 14px; background: var(--paper-raised); border: 1px solid var(--line); line-height: 1.6; }
	.av { flex: none; display: grid; place-items: center; inline-size: 32px; block-size: 32px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-weight: 700; }
	.words { list-style: none; margin: 8px 0 0; padding: 12px 14px; border-radius: 12px; background: var(--paper-sunken); display: grid; gap: 6px; text-align: left; }
	.quiet { justify-self: start; display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 4px; border: 0; background: none; color: var(--accent-deep); font: inherit; font-weight: 500; cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
	.options { display: grid; gap: 10px; }
	.option { min-height: 52px; padding: 12px 16px; border: 1.5px solid var(--control-border); border-radius: 12px; background: var(--paper-raised); color: var(--ink); font: inherit; text-align: left; cursor: pointer; }
	.option.right { border-color: var(--accent); background: var(--accent-wash); }
	.option.wrong { border-color: var(--attention); }
	.option:disabled { cursor: default; }
	.note { margin: 10px 0 0; line-height: 1.6; }
	.note.good { color: var(--accent-deep); font-weight: 600; }
	.phrase { margin: 4px 0 0; font-size: 1.3rem; font-weight: 600; text-align: left; }
	.gloss { margin: 0; color: var(--ink-soft); }
	.small { margin: 6px 0 0; color: var(--ink-soft); font-size: .88rem; }
	.fb { display: grid; gap: 10px; padding: 14px; border-radius: 14px; background: var(--paper-raised); border: 1px solid var(--line); }
	.fb p { margin: 0; }
	.fb .lbl { display: block; font-size: .76rem; font-weight: 700; color: var(--ink-soft); }
	.fb .better .en { color: var(--accent-deep); font-weight: 600; }
	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; display: grid; justify-items: center; gap: 2px; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 30%); }
	.primary { display: flex; gap: 12px; align-items: center; justify-content: center; inline-size: 100%; max-inline-size: 640px; min-height: 54px; border-radius: 12px; background: var(--accent); color: var(--on-accent); font-weight: 600; font-size: 1.05rem; text-decoration: none; }
	.back { justify-self: center; }
</style>
