<script lang="ts">
	/**
	 * "Tell me about yourself" (pitch.ts; learning-UX and system-design reviews). One thing per screen:
	 * - Start: Mira's note is above (StepRunner); "Start" asks for the mic.
	 * - Part 1–3 (Now, Before, Next): Mira asks; the learner answers (tap to start and stop; it also
	 *   ends after a quiet pause) or types; then "I heard…" with "Next part" and a quiet "Say it again".
	 * - Mira checks the whole answer ("Say it again, better" engine): at most two fixes, one per
	 *   screen, each with Say it; then the answer a bit better, with Hear it.
	 * - The whole answer once more, with only the three keywords: its time and the fixes used.
	 * Recordings are sent once to be turned into text and never kept; the answers stay in this browser.
	 */
	import { onDestroy, onMount } from 'svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import FeedbackCard from '$lib/components/FeedbackCard.svelte';
	import SayAgain from '$lib/components/SayAgain.svelte';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { changedParts } from '$lib/practice/quick-fire';
	import { fixUse, scoreFor, type Feedback } from '$lib/practice/say-better';
	import { PART_MAX_CHARS, PITCH_FIXES, PITCH_PARTS, emptyPitch, joinParts, lengthNote, type PitchContent, type PitchRecord } from '$lib/practice/pitch';
	import type { Track } from '$lib/practice/day';
	import type { DisplayText } from '$lib/practice/hotel';
	import { playAudioPromise, stopAllAudio } from '$services/tts';
	import { canRecord, startRecording, transcribeClip, type Recording } from '$services/voice-clip';

	let { isFa = false, content, track, initial = null, onSave, onFocus, onSkip, onDone }: {
		isFa?: boolean;
		content: PitchContent;
		track: Track;
		initial?: PitchRecord | null;
		onSave?: (record: PitchRecord) => void;
		onFocus?: (mode: 'full' | 'compact' | 'hidden') => void;
		onSkip?: () => void;
		/** Fixes used on the last try, out of those that came up (none when nothing came up). */
		onDone: (score: { correct: number; total: number } | undefined, record: PitchRecord) => void;
	} = $props();

	const T = (en: string, fa: string) => (isFa ? fa : en);
	const N = (n: number) => (isFa ? n.toLocaleString('fa-IR') : String(n));
	const text = (value: DisplayText) => (isFa ? value.fa : value.en);
	// svelte-ignore state_referenced_locally
	const A2 = track === 'intermediate';
	/** A2 gets more time to think before a pause ends the answer. */
	const PART_TIMINGS = A2 ? { quietStop: 4, noSpeechStop: 12 } : { quietStop: 3, noSpeechStop: 10 };
	const FULL_TIMINGS = { quietStop: 5, noSpeechStop: 12 };

	type Stage = 'start' | 'part' | 'thinking' | 'failed' | 'more' | 'fix' | 'answer' | 'retry' | 'result';
	type Status = 'asking' | 'answer' | 'recording' | 'listening' | 'heard' | 'typing';
	// svelte-ignore state_referenced_locally
	let record = $state<PitchRecord>(initial ?? emptyPitch());
	// svelte-ignore state_referenced_locally
	let stage = $state<Stage>(initial?.done || initial?.transcript2 ? 'result' : initial?.feedback ? 'answer' : 'start');
	let index = $state(0), status = $state<Status>('asking'), fixIndex = $state(0);
	let draft = $state(''), notice = $state<DisplayText | null>(null), showIdeas = $state(false), failures = $state(0);
	let elapsed = $state(0), timer: ReturnType<typeof setInterval> | undefined;
	let recording: Recording | null = null;
	let alive = true, generation = 0;

	const part = $derived(content.parts[index]);
	const said = $derived(record.parts[part?.id ?? 'now']);
	const feedback = $derived<Feedback | null>(record.feedback);
	/** At most two fixes in this step. */
	const fixes = $derived(feedback?.fixes.slice(0, PITCH_FIXES) ?? []);
	const joined = $derived(joinParts(record.parts));
	const plain = (value: string) => value.replace(/\[([^\]]*)\]/g, '$1').replace(/\s+/g, ' ').trim();

	onMount(() => { if (stage !== 'start') onFocus?.('hidden'); });
	onDestroy(() => { alive = false; generation++; clearInterval(timer); recording?.cancel(); stopAllAudio(); });
	function persist() { if (alive) onSave?.($state.snapshot(record)); }
	const say = (line: string) => playAudioPromise(line.replace(/’/g, "'"), COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {});

	/** The Start tap asks for the microphone (phones need a tap), then the first part. */
	async function start() {
		stopAllAudio(); onFocus?.('hidden');
		let typing = !canRecord();
		if (!typing) {
			try { (await navigator.mediaDevices.getUserMedia({ audio: true })).getTracks().forEach(t => t.stop()); }
			catch { typing = true; notice = { en: 'Your microphone is blocked, so type your answer for now. (Allow it in site settings to speak.)', fa: 'میکروفون بسته است؛ فعلاً جوابت را بنویس. (برای صحبت کردن، در تنظیمات سایت اجازه بده.)' }; }
		}
		stage = 'part'; index = 0;
		void ask(typing);
	}
	/** Mira asks this part's question; then the learner answers. */
	async function ask(typing = false) {
		const mine = ++generation;
		showIdeas = false; draft = '';
		if (said) { status = 'heard'; return; }
		status = typing ? 'typing' : 'asking';
		await say(part.question);
		if (!alive || mine !== generation || stage !== 'part' || status !== 'asking') return;
		status = 'answer';
	}

	async function record_(use: 'pitch' | 'pitch-full') {
		if (status === 'recording') { recording?.stop(); return; }
		stopAllAudio(); notice = null;
		const started = await startRecording(use, use === 'pitch' ? PART_TIMINGS : FULL_TIMINGS);
		if (!alive) { if (typeof started === 'object') started.cancel(); return null; }
		if (started === 'unsupported' || started === 'blocked') {
			notice = { en: 'Your microphone isn’t available, so type your answer.', fa: 'میکروفون در دسترس نیست؛ جوابت را بنویس.' };
			status = 'typing'; return null;
		}
		recording = started; status = 'recording';
		const began = performance.now(); elapsed = 0;
		clearInterval(timer); timer = setInterval(() => (elapsed = Math.round((performance.now() - began) / 1000)), 250);
		const clip = await started.done;
		clearInterval(timer); recording = null;
		if (!alive) return null;
		if (clip === null) { status = 'answer'; return null; }
		if (clip === 'silent') { status = 'answer'; notice = { en: 'I didn’t hear anything. Tap Answer and try again.', fa: 'صدایی نشنیدم. «جواب بده» را بزن و دوباره امتحان کن.' }; return null; }
		status = 'listening';
		const result = await transcribeClip(clip, use);
		if (!alive) return null;
		if ('error' in result || !result.transcript.trim()) {
			status = 'answer';
			notice = 'error' in result && result.error === 'limit' ? { en: 'Today’s voice practice is used up. Type your answer instead.', fa: 'تمرین صوتی امروز تمام شد. جوابت را بنویس.' }
				: 'error' in result && result.error === 'unavailable' ? { en: 'Speaking isn’t available right now. Type your answer instead.', fa: 'صحبت کردن الان در دسترس نیست. جوابت را بنویس.' }
				: { en: 'I couldn’t catch that. Check your connection and try again.', fa: 'متوجه نشدم. اینترنت را بررسی کن و دوباره امتحان کن.' };
			return null;
		}
		return { transcript: result.transcript.trim(), seconds: clip.seconds };
	}

	async function answerPart() {
		const heard = await record_('pitch');
		if (!heard || stage !== 'part') return;
		keep(heard.transcript, heard.seconds);
	}
	function sendTyped() {
		const words = draft.replace(/\s+/g, ' ').trim();
		if (!words) return;
		keep(words, 0);
	}
	function keep(words: string, seconds: number) {
		record = { ...record, parts: { ...record.parts, [part.id]: words.slice(0, PART_MAX_CHARS) }, talkSeconds: record.talkSeconds + seconds, feedback: null };
		persist(); status = 'heard';
	}
	function sayAgain() {
		record = { ...record, parts: { ...record.parts, [part.id]: null } }; persist();
		status = 'answer'; notice = null;
	}
	function nextPart() {
		stopAllAudio();
		if (index + 1 < content.parts.length) { index += 1; void ask(status === 'typing'); return; }
		void check();
	}

	/** One call: the joined answer checked by the "Say it again, better" engine. */
	async function check() {
		stage = 'thinking';
		const controller = new AbortController();
		const wait = setTimeout(() => controller.abort(), 25_000);
		let result: Feedback | null = null;
		try {
			const response = await fetch('/api/english/say-better', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
				body: JSON.stringify({ kind: 'feedback', transcript: joined, prompt: 'interview-pitch' }) });
			result = response.ok ? await response.json() : null;
		} catch { result = null; }
		finally { clearTimeout(wait); }
		if (!alive) return;
		if (!result || !Array.isArray(result.fixes)) { failures += 1; stage = 'failed'; return; }
		record = { ...record, feedback: result }; persist();
		fixIndex = 0;
		stage = result.case === 'more' ? 'more' : fixes.length ? 'fix' : 'answer';
	}
	/** "Add a bit more": back to the parts, each kept, so the learner can say any of them again. */
	function addMore() { record = { ...record, feedback: null }; persist(); stage = 'part'; index = 0; status = 'heard'; }
	function nextFix() { stopAllAudio(); if (fixIndex + 1 < fixes.length) fixIndex += 1; else stage = 'answer'; }

	async function sayAll() {
		const heard = await record_('pitch-full');
		if (!heard || stage !== 'retry') return;
		const uses = fixes.map(fix => fixUse(fix, heard.transcript));
		record = { ...record, transcript2: heard.transcript, seconds2: heard.seconds, uses }; persist();
		stage = 'result';
	}
	function finish() {
		stopAllAudio();
		record = { ...record, done: true }; persist();
		onDone(record.feedback ? scoreFor({ ...record.feedback, fixes }, record.uses) : undefined, $state.snapshot(record));
	}
	const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
</script>

<section class="pitch" dir={isFa ? 'rtl' : 'ltr'}>
	{#if stage === 'start'}
		<ActionBar label={T('Start', 'شروع')} icon="mic" onclick={() => void start()}
			secondary={onSkip ? { label: T('Skip this step', 'این مرحله را رد کن'), onclick: () => { stopAllAudio(); onSkip?.(); } } : null} />

	{:else if stage === 'part' && part}
		<p class="label">{T(`Part ${index + 1} of ${content.parts.length} · ${part.keyword.en}`, `بخش ${N(index + 1)} از ${N(content.parts.length)} · ${part.keyword.fa}`)}</p>
		<div class="dots" aria-hidden="true">{#each content.parts as _, i}<span class:done={i < index} class:now={i === index}></span>{/each}</div>
		<div class="asked"><span class="mira" aria-hidden="true">M</span><div><p class="q" lang="en" dir="ltr">{part.question}</p><p class="q-fa" lang="fa" dir="rtl">{part.questionFa}</p></div></div>

		{#if status === 'heard' && said}
			<FeedbackCard kind="you" label={T('I heard', 'شنیدم')}>{said}</FeedbackCard>
			<ActionBar label={index + 1 < content.parts.length ? T('Next part', 'بخش بعدی') : T('Check my answer', 'جوابم را بررسی کن')} onclick={nextPart}
				secondary={{ label: T('Say it again', 'دوباره بگو'), onclick: sayAgain }} />
		{:else}
			{#if A2 || showIdeas}
				<ul class="starters" aria-label={T('You could start with', 'می‌توانی این‌طور شروع کنی')}>{#each part.starters as starter}<li lang="en" dir="ltr">{starter.includes('…') ? starter : `${starter}…`}</li>{/each}</ul>
			{:else}
				<button type="button" class="quiet" onclick={() => (showIdeas = true)}>{T('Need an idea?', 'ایده می‌خواهی؟')}</button>
			{/if}
			{#if notice}<p class="note" role="status">{text(notice)}</p>{/if}
			{#if status === 'typing'}
				<label class="sr-only" for="pitch-answer">{T('Your answer in English', 'جوابت به انگلیسی')}</label>
				<textarea id="pitch-answer" bind:value={draft} lang="en" dir="ltr" rows="3" maxlength={PART_MAX_CHARS} placeholder={T('Type your answer…', 'جوابت را بنویس…')}></textarea>
				<ActionBar label={T('Send', 'ارسال')} icon="send" disabled={!draft.trim()} onclick={sendTyped}
					secondary={canRecord() ? { label: T('Use the mic', 'با میکروفون بگو'), onclick: () => { status = 'answer'; notice = null; } } : null} />
			{:else if status === 'recording'}
				<p class="rec" role="status"><span class="dot" aria-hidden="true"></span>{T('Your turn', 'نوبت توست')} · {clock(elapsed)}</p>
				<ActionBar label={T('Done', 'تمام')} icon="stop" recording onclick={() => recording?.stop()} />
			{:else if status === 'listening'}
				<p class="hint" role="status">{T('Mira is listening…', 'میرا دارد گوش می‌دهد…')}</p>
				<ActionBar label={T('One moment…', 'یک لحظه…')} disabled onclick={() => {}} />
			{:else}
				<ActionBar label={T('Answer', 'جواب بده')} icon="mic" disabled={status === 'asking'} onclick={() => void answerPart()}
					secondary={{ label: T('Can’t talk now? Type', 'الان نمی‌توانی حرف بزنی؟ بنویس'), onclick: () => { generation++; stopAllAudio(); status = 'typing'; } }} />
			{/if}
		{/if}

	{:else if stage === 'thinking'}
		<p class="hint" role="status">{T('Mira is checking your answer…', 'میرا دارد جوابت را بررسی می‌کند…')}</p>
		<FeedbackCard kind="you" label={T('Your answer', 'جوابت')}>{joined}</FeedbackCard>
		<ActionBar label={T('One moment…', 'یک لحظه…')} disabled onclick={() => {}} />

	{:else if stage === 'failed'}
		<p class="note" role="status">{T('I couldn’t check your answer. Check your connection and try again.', 'نتوانستم جوابت را بررسی کنم. اینترنت را بررسی کن و دوباره امتحان کن.')}</p>
		<ActionBar label={T('Try again', 'دوباره امتحان کن')} onclick={() => void check()}
			secondary={failures >= 2 ? { label: T('Continue without feedback', 'بدون بازخورد ادامه بده'), onclick: () => (stage = 'retry') } : null} />

	{:else if stage === 'more'}
		<h2 class="title">{T('Tell me a bit more', 'کمی بیشتر بگو')}</h2>
		<p class="lead">{T('Your answer was quite short. Say each part again with one more detail.', 'جوابت خیلی کوتاه بود. هر بخش را دوباره با یک جزئیات بیشتر بگو.')}</p>
		<FeedbackCard kind="you" label={T('Your answer', 'جوابت')}>{joined}</FeedbackCard>
		<ActionBar label={T('Try again', 'دوباره امتحان کن')} onclick={addMore} />

	{:else if stage === 'fix' && fixes[fixIndex]}
		{@const fix = fixes[fixIndex]}
		<p class="label">{T(`Fix ${fixIndex + 1} of ${fixes.length}`, `اصلاح ${N(fixIndex + 1)} از ${N(fixes.length)}`)}</p>
		<FeedbackCard kind="you" label={T('You said', 'تو گفتی')}>{#each changedParts(fix.better, fix.original) as piece, i}{i ? ' ' : ''}{#if piece.changed}<mark class="wrong">{piece.text}</mark>{:else}{piece.text}{/if}{/each}</FeedbackCard>
		<FeedbackCard kind="fix" label={T('Correct way', 'شکل درست')}>
			{#each changedParts(fix.original, fix.better) as piece, i}{i ? ' ' : ''}{#if piece.changed}<mark class="right">{piece.text}</mark>{:else}{piece.text}{/if}{/each}
			{#snippet actions()}<SayAgain sentence={fix.better} {isFa} />{/snippet}
		</FeedbackCard>
		<p class="why">{text(fix.why)}</p>
		<ActionBar label={fixIndex + 1 < fixes.length ? T('Next fix', 'اصلاح بعدی') : T('See your answer', 'دیدن جوابت')} onclick={nextFix} />

	{:else if stage === 'answer'}
		{#if feedback?.praise}<p class="praise">{text(feedback.praise)}</p>{:else if feedback?.case === 'strong'}<p class="praise">{T('That was clear and natural. Well done.', 'روشن و طبیعی بود. آفرین.')}</p>{/if}
		<FeedbackCard kind="more" serif label={feedback?.better ? T('Your answer, a bit better', 'جوابت، کمی بهتر') : T('Your answer', 'جوابت')}>
			{plain(feedback?.better ?? joined)}
			{#snippet actions()}<button type="button" class="hear" onclick={() => { stopAllAudio(); void say(plain(feedback?.better ?? joined)); }}><span aria-hidden="true">▶</span> {T('Hear it', 'بشنو')}</button>{/snippet}
		</FeedbackCard>
		<ActionBar label={T('Now say it all', 'حالا همه‌اش را بگو')} onclick={() => { stopAllAudio(); stage = 'retry'; status = 'answer'; notice = null; }} />

	{:else if stage === 'retry'}
		<h2 class="title">{T('Your whole answer', 'کل جوابت')}</h2>
		<p class="lead">{T('Say your whole answer once, without reading. Use the three parts:', 'یک بار کل جوابت را بگو، بدون خواندن. از این سه بخش کمک بگیر:')}</p>
		<ul class="keywords">{#each content.parts as p}<li>{text(p.keyword)}</li>{/each}</ul>
		{#if fixes.length}
			<p class="small">{T('And remember:', 'و یادت باشد:')}</p>
			<ul class="starters">{#each fixes as fix}<li lang="en" dir="ltr">{fix.better}</li>{/each}</ul>
		{/if}
		{#if notice}<p class="note" role="status">{text(notice)}</p>{/if}
		{#if status === 'recording'}
			<p class="rec" role="status"><span class="dot" aria-hidden="true"></span>{T('Recording', 'در حال ضبط')} · {clock(elapsed)}</p>
			<ActionBar label={T('Done', 'تمام')} icon="stop" recording onclick={() => recording?.stop()} />
		{:else if status === 'listening'}
			<p class="hint" role="status">{T('Mira is listening…', 'میرا دارد گوش می‌دهد…')}</p>
			<ActionBar label={T('One moment…', 'یک لحظه…')} disabled onclick={() => {}} />
		{:else}
			<ActionBar label={T('Start talking', 'شروع صحبت')} icon="mic" disabled={!canRecord()} onclick={() => void sayAll()}
				secondary={{ label: T('Not now', 'الان نه'), onclick: () => { stopAllAudio(); stage = 'result'; } }} />
		{/if}

	{:else}
		<h2 class="title">{record.transcript2 ? T('Well done.', 'آفرین.') : T('That’s it for now.', 'فعلاً همین.')}</h2>
		{#if record.transcript2}
			<div class="stats">
				<div class="stat"><span class="stat-value">{isFa ? `${N(record.seconds2)} ث` : `${record.seconds2} s`}</span><span class="stat-label">{T('your whole answer', 'کل جوابت')}</span></div>
				{#if fixes.length}<div class="stat"><span class="stat-value">{N(record.uses.filter(u => u === 'used').length)}/{N(fixes.length)}</span><span class="stat-label">{T('fixes used', 'اصلاح به کار رفت')}</span></div>{/if}
			</div>
			<p class="lead">{text(lengthNote(record.seconds2, track))}</p>
			{#each fixes as fix, i}
				{#if record.uses[i] === 'used'}<FeedbackCard kind="fix" label={T('You used it', 'به کارش بردی')}>{fix.better}</FeedbackCard>
				{:else if record.uses[i] === 'missed'}<FeedbackCard kind="more" label={T('Next time, try', 'دفعهٔ بعد امتحان کن')}>{fix.better}</FeedbackCard>{/if}
			{/each}
		{:else}
			<p class="lead">{T('Your answer is ready. Say it out loud a few times before the interview.', 'جوابت آماده است. قبل از مصاحبه چند بار بلند تمرینش کن.')}</p>
		{/if}
		<ActionBar label={T('Continue', 'ادامه')} onclick={finish} />
	{/if}
</section>

<style>
	.pitch { display: grid; gap: 14px; padding-block-end: 150px; }
	.label { margin: 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	:global([dir='rtl']) .label { letter-spacing: normal; }
	.dots { display: flex; gap: 6px; }
	.dots span { flex: 1; block-size: 6px; border-radius: 3px; background: var(--paper-sunken); }
	.dots span.done { background: var(--leaf, var(--accent)); }
	.dots span.now { background: var(--accent); }
	.asked { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: start; }
	.asked > div { padding: 10px 14px; border-radius: 4px 16px 16px 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.mira { display: grid; place-items: center; inline-size: 34px; block-size: 34px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.q { margin: 0; font-family: var(--font-display); font-size: 1.3rem; line-height: 1.35; text-align: left; }
	.q-fa { margin: 4px 0 0; color: var(--ink-soft); font-size: .9rem; text-align: right; }
	.starters { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
	.starters li { padding: 6px 12px; border-radius: 12px; background: var(--paper-sunken); font-size: .95rem; }
	.keywords { list-style: none; margin: 0; padding: 0; display: flex; gap: 8px; }
	.keywords li { flex: 1; padding: 10px 8px; border-radius: 12px; border: 1.5px dashed var(--accent); background: var(--accent-wash); color: var(--accent-deep); font-weight: 700; text-align: center; }
	.quiet { justify-self: start; min-height: 44px; padding: 8px 0; border: 0; background: none; color: var(--accent-deep); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.note { margin: 0; padding: 10px 12px; border-radius: 10px; background: var(--attention-wash); color: var(--attention); line-height: 1.5; }
	.hint, .small { margin: 0; color: var(--ink-soft); line-height: 1.5; }
	.rec { display: flex; align-items: center; gap: 8px; margin: 0; font-weight: 700; color: var(--attention); font-variant-numeric: tabular-nums; }
	.dot { inline-size: 12px; block-size: 12px; border-radius: 50%; background: currentColor; animation: pulse 1.2s infinite ease-in-out; }
	@keyframes pulse { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
	@media (prefers-reduced-motion: reduce) { .dot { animation: none; } }
	textarea { inline-size: 100%; box-sizing: border-box; resize: vertical; min-height: 90px; padding: 10px 12px; border: 1px solid var(--control-border); border-radius: 10px; background: var(--paper); color: var(--ink); font: inherit; }
	.title { margin: 0; font-family: var(--font-display); font-size: 1.4rem; line-height: 1.3; }
	.lead { margin: 0; line-height: 1.6; }
	.why { margin: 0; color: var(--ink-soft); line-height: 1.6; }
	.praise { margin: 0; font-weight: 600; color: var(--accent-deep); line-height: 1.55; }
	.hear { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 8px 16px; border: 1.5px solid var(--info); border-radius: 999px; background: var(--paper-raised); color: var(--info); font: inherit; font-weight: 700; cursor: pointer; }
	.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }
	.stat { display: grid; gap: 2px; padding: 12px; border-radius: 14px; background: var(--paper-raised); border: 1px solid var(--line); box-shadow: var(--paper-shadow); text-align: center; }
	.stat-value { font-family: var(--font-display); font-size: 1.6rem; font-weight: 600; color: var(--accent-deep); }
	.stat-label { font-size: .8rem; color: var(--ink-soft); }
	button:focus-visible, textarea:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
</style>
