<script lang="ts">
	/**
	 * One step of the English path (docs/goal-path-plan.md): Mira's note, the module, then one
	 * screen at a time: Step done (Next / Done for now), a skipped step offered once before the
	 * chapter ends, and the chapter ending. The page keys this by step, so each step starts fresh.
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import StepRating from '$lib/components/StepRating.svelte';
	import { phraseScore, scoreLine, type StepScore } from '$lib/practice/step-feedback';
	import ListenConnect from '$lib/components/ListenConnect.svelte';
	import PhrasePractice from '$lib/components/PhrasePractice.svelte';
	import Traps from '$lib/components/Traps.svelte';
	import SayInEnglish from '$lib/components/SayInEnglish.svelte';
	import VoiceMessages from '$lib/components/VoiceMessages.svelte';
	import ListenRetell from '$lib/components/ListenRetell.svelte';
	import ChoosePersuade from '$lib/components/ChoosePersuade.svelte';
	import RolePlay from '$lib/components/RolePlay.svelte';
	import SayItBetter from '$lib/components/SayItBetter.svelte';
	import { loadRecord, saveRecord } from '$lib/practice/day-records';
	import { asConnectRecord } from '$lib/practice/listen-connect';
	import { asPhraseRecord } from '$lib/practice/phrases';
	import { asTrapsRecord } from '$lib/practice/traps';
	import { asSayRecord as asSayInEnglishRecord } from '$lib/practice/say-in-english';
	import { asVoiceRecord } from '$lib/practice/voice-messages';
	import { asRetellRun } from '$lib/practice/retell';
	import { asPersuadeRecord } from '$lib/practice/persuade';
	import { asRolePlayRecord } from '$lib/practice/roleplay';
	import { asSayRecord } from '$lib/practice/say-better';
	import { connectSetFor, persuadeSetFor, phrasesFor, roleSceneFor, retellPieceFor, sayItemsFor, trapsFor, voiceMessagesFor } from '$lib/practice/day-content';
	import { COACH_RATE, COACH_VOICE } from '$lib/practice/coach';
	import { dayById, minutesOf, DAY_ONE, type DayModule, type ModuleId, type Track } from '$lib/practice/day';
	import { chapterModules, splitStep, type StepId } from '$lib/practice/path';
	import { withName } from '$lib/practice/learner-name';
	import type { DisplayText } from '$lib/practice/hotel';
	import { playAudioPromise, stopAllAudio } from '$services/tts';

	let { step, dayId, moduleId, index, total, replay, track, startedAt: savedStart, isFa, labAccess = false, name = '' }: {
		step: StepId; dayId: string; moduleId: ModuleId; index: number; total: number; replay: boolean; track: Track;
		startedAt: string | null; isFa: boolean; labAccess?: boolean;
		/** The learner's first name, for "{name}" in model answers (Everyday chapters). */
		name?: string;
	} = $props();

	const T = (en: string, fa: string) => (isFa ? fa : en);
	const text = (value: DisplayText) => (isFa ? value.fa : value.en);
	const num = (value: number) => (isFa ? value.toLocaleString('fa-IR') : String(value));

	// svelte-ignore state_referenced_locally
	const day = dayById(dayId) ?? DAY_ONE;
	// svelte-ignore state_referenced_locally
	const mod = chapterModules(day, track).find(item => item.id === moduleId)!;
	// svelte-ignore state_referenced_locally
	const first = index === 0 && !replay;
	/** Where the chapter's story is now: Mira's first line at a chapter's first step. */
	const story = first ? day.checkIn?.story ?? null : null;
	/** Crowded modules (and a chapter's first step) open with Mira's note on its own screen. */
	const BRIEF_FIRST = new Set(['phrases', 'choose-persuade', 'scenario']);

	type Stage = 'loading' | 'brief' | 'module' | 'saving' | 'finished' | 'offer' | 'chapter';
	let stage = $state<Stage>('loading');
	// svelte-ignore state_referenced_locally
	let startedAt = $state<string | null>(savedStart);
	let intro = $state<'full' | 'compact' | 'hidden'>('full');
	let saveFailed = $state(false);
	let result = $state<{ outcome: 'done' | 'skipped'; goalJustMet: boolean; chapterDone: boolean; skippedHere: StepId[]; next: StepId | null; nextIsReplay: boolean } | null>(null);

	onMount(() => {
		// A new step has nothing saved yet: it shows at once, and its start is saved in the background.
		if (!startedAt) stage = first || BRIEF_FIRST.has(mod.id) ? 'brief' : 'module';
		void (async () => {
			if (!startedAt) {
				try {
					const body = new FormData(); body.set('step', step);
					const response = await fetch('?/start', { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
					const reply = deserialize(await response.text());
					const value = reply.type === 'success' ? reply.data?.startedAt : null;
					startedAt = typeof value === 'string' ? value : new Date().toISOString();
				} catch { startedAt = new Date().toISOString(); }
			}
			if (stage === 'loading') {
				const resumed = !!startedAt && loadRecord(startedAt, mod.id) !== null;
				stage = (first || BRIEF_FIRST.has(mod.id)) && !resumed ? 'brief' : 'module';
			}
		})();
		say();
		return () => stopAllAudio();
	});

	/** Mira reads her note (from the tap that opened the step, where phones allow it). */
	let introPlay = $state<Promise<void> | null>(null);
	function say() {
		stopAllAudio();
		const line = `${story && stage === 'brief' ? `${story.en} ` : ''}${mod.intro.en}`;
		introPlay = playAudioPromise(line, COACH_RATE, 'en-US', undefined, COACH_VOICE).catch(() => {});
	}
	function endBrief() { stopAllAudio(); stage = 'module'; }

	/** The learner's result for this step (shown on the next screen), when the step gives one. */
	let shownScore = $state<StepScore | null>(null);
	async function finish(outcome: 'done' | 'skipped', given?: { correct: number; total: number }, record?: unknown) {
		stopAllAudio();
		const score = outcome === 'done' ? given ?? (mod.id === 'phrases' ? phraseScore(record) ?? undefined : undefined) : undefined;
		shownScore = score ?? null;
		if (record && startedAt) saveRecord(startedAt, mod.id, record);
		stage = 'saving'; saveFailed = false;
		const body = new FormData();
		body.set('step', step); body.set('outcome', outcome);
		if (score && outcome === 'done') body.set('score', JSON.stringify(score));
		body.set('utcOffset', String(-new Date().getTimezoneOffset()));
		try {
			const response = await fetch('?/result', { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } });
			const reply = deserialize(await response.text());
			if (reply.type !== 'success' || !reply.data) throw new Error('save');
			const data = reply.data as { goalJustMet?: boolean; chapterDone?: boolean; skippedHere?: StepId[]; next?: StepId | null; nextIsReplay?: boolean };
			result = {
				outcome,
				goalJustMet: data.goalJustMet === true,
				chapterDone: data.chapterDone === true,
				skippedHere: data.skippedHere ?? [],
				next: data.next ?? null,
				nextIsReplay: data.nextIsReplay === true
			};
			stage = result.chapterDone && result.skippedHere.length ? 'offer' : result.chapterDone ? 'chapter' : 'finished';
		} catch {
			saveFailed = true; stage = 'module';
		}
	}

	const nextInfo = $derived.by(() => {
		const next = result?.next ? splitStep(result.next) : null;
		if (!next) return null;
		const module = chapterModules(next.day, track).find(item => item.id === next.module);
		return module ? { day: next.day, module, minutes: minutesOf(module, 20) } : null;
	});
	const offered = $derived.by(() => {
		const id = result?.skippedHere[0];
		const parts = id ? splitStep(id) : null;
		return parts ? { id: id!, module: chapterModules(parts.day, track).find(item => item.id === parts.module) ?? null } : null;
	});
	/** The chapter's goal, said as done: "Now you can …". */
	const nowYouCan = $derived(day.goals?.[track] ?? {
		en: day.goal.en.replace(/^By the end, you can/, 'Now you can'),
		fa: day.goal.fa.replace(/^در پایان می‌توانی/, 'حالا می‌توانی')
	});
	const open = (id: StepId) => goto(`/practice/english/step?step=${encodeURIComponent(id)}`, { invalidateAll: true });
	const home = () => { stopAllAudio(); void goto('/practice/english/progress'); };
	function goNext() {
		if (!result?.next) { home(); return; }
		void open(result.next);
	}
	/** No new step is left: new practice is coming soon (replaying is a quiet option). */
	const comingSoon = $derived(!!result && (!result.next || result.nextIsReplay));
	const nextLabel = $derived(!nextInfo ? T('Back to your progress', 'برگشت به پیشرفتت')
		: result?.nextIsReplay ? T(`Practice again: ${nextInfo.module.title.en}`, `دوباره تمرین کن: ${nextInfo.module.title.fa}`)
		: nextInfo.day.id !== day.id ? T('Start the next chapter', 'شروع فصل بعد')
		: T(`Next: ${nextInfo.module.title.en} · ${nextInfo.minutes} min`, `بعدی: ${nextInfo.module.title.fa} · ${num(nextInfo.minutes)} دقیقه`));

	// The module's content for this chapter and version.
	// svelte-ignore state_referenced_locally
	const content = {
		connect: connectSetFor(day.id, track), phrases: phrasesFor(day.id, track), traps: trapsFor(day.id), say: withName(sayItemsFor(day.id, track), name),
		messages: withName(voiceMessagesFor(day.id), name), story: retellPieceFor(day.id), choice: persuadeSetFor(day.id), scene: roleSceneFor(day.id, track)
	};
	const keep = (record: unknown) => { if (startedAt) saveRecord(startedAt, mod.id, record); };
	const loaded = () => (startedAt ? loadRecord(startedAt, mod.id) : null);
	const onDone = (score?: { correct: number; total: number }, record?: unknown) => void finish('done', score, record);
	const onSkip = () => void finish('skipped');
	const onFocus = (mode: 'full' | 'compact' | 'hidden') => (intro = mode);
</script>

{#snippet endOfStep()}
	{@const line = scoreLine(mod.id, shownScore)}
	{#if line}
		<div class="score"><span class="score-value">{isFa ? line.valueFa : line.value}</span><span class="score-label">{text(line.label)}</span></div>
	{/if}
	<StepRating {step} {isFa} />
{/snippet}

{#snippet note(m: DayModule)}
	<div class="brief">
		<span class="avatar" aria-hidden="true">M</span>
		<div class="brief-text" lang={isFa ? 'fa' : 'en'}>
			{#if story && stage === 'brief'}<p class="brief-line story">{text(story)}</p>{/if}
			<p class="brief-line">{text(m.intro)}</p>
		</div>
	</div>
{/snippet}

{#if stage === 'loading' || stage === 'brief' || stage === 'module' || stage === 'saving'}<p class="eyebrow">
	{#if replay}{T(`PRACTICE AGAIN · ${day.themePhrase.toUpperCase()}`, `تمرین دوباره · ${day.theme.fa}`)}
	{:else}{T(`${day.themePhrase.toUpperCase()} · STEP ${index + 1} OF ${total}`, `${day.theme.fa} · مرحلهٔ ${num(index + 1)} از ${num(total)}`)}{/if}
</p>{/if}

{#if stage === 'loading'}
	<h1>{text(mod.title)}</h1>

{:else if stage === 'brief'}
	<h1>{text(mod.title)}</h1>
	{@render note(mod)}
	<!-- Phones may block Mira's voice when the step opens on its own; this tap always plays it. -->
	<button class="hear" type="button" onclick={say}><span aria-hidden="true">🔊</span> {T('Hear Mira', 'شنیدن صدای میرا')}</button>
	<ActionBar label={T('Next', 'بعدی')} onclick={endBrief} secondary={{ label: T('Skip this step', 'این مرحله را رد کن'), onclick: onSkip }} />

{:else if stage === 'module' || stage === 'saving'}
	<h1>{text(mod.title)}</h1>
	{#if saveFailed}<p class="warn" role="alert">{T('That didn’t save. Check your connection and try again.', 'ذخیره نشد. اتصال اینترنت را بررسی کن و دوباره امتحان کن.')}</p>{/if}
	{#if intro === 'full' && !BRIEF_FIRST.has(mod.id) && !first}{@render note(mod)}{/if}
	<div class:busy={stage === 'saving'}>
		{#if mod.id === 'listen-act'}
			<ListenConnect {isFa} {onSkip} set={content.connect} initial={asConnectRecord(loaded(), content.connect)} {onFocus} onSave={keep} {onDone} />
		{:else if mod.id === 'phrases'}
			<PhrasePractice {isFa} {onSkip} phrases={content.phrases} initial={asPhraseRecord(loaded(), content.phrases)} afterIntro={introPlay} {onFocus} onSave={keep} {onDone} />
		{:else if mod.id === 'traps'}
			<Traps {isFa} {onSkip} traps={content.traps} initial={asTrapsRecord(loaded(), content.traps)} {onFocus} onSave={keep} {onDone} />
		{:else if mod.id === 'say-in-english'}
			<SayInEnglish {isFa} {onSkip} items={content.say} initial={asSayInEnglishRecord(loaded(), content.say)} {onFocus} onSave={keep} {onDone} />
		{:else if mod.id === 'voice-messages'}
			<VoiceMessages {isFa} {onSkip} messages={content.messages} initial={asVoiceRecord(loaded(), content.messages)} {onFocus} onSave={keep} {onDone} />
		{:else if mod.id === 'listen-retell' && content.story}
			<ListenRetell {isFa} {onSkip} piece={content.story} voice={content.story.voice} initial={asRetellRun(loaded())} {onFocus} onSave={keep} {onDone} />
		{:else if mod.id === 'choose-persuade'}
			<ChoosePersuade {isFa} {onSkip} set={content.choice} initial={asPersuadeRecord(loaded())} {onFocus} onSave={keep} {onDone} />
		{:else if mod.id === 'scenario'}
			<RolePlay {isFa} {onSkip} scene={content.scene} initial={asRolePlayRecord(loaded(), content.scene)} {onFocus} onSave={keep} {onDone} />
		{:else if mod.id === 'say-it-better'}
			<SayItBetter {isFa} {onSkip} prompt={mod.sayPrompt} initial={asSayRecord(loaded())} {onFocus} onSave={keep} {onDone} />
		{:else}
			<p>{T('This step is not ready yet.', 'این مرحله هنوز آماده نیست.')}</p>
			<ActionBar label={T('Continue', 'ادامه')} onclick={() => onDone()} />
		{/if}
	</div>
	{#if labAccess}<p class="small">{T(`Owner: ${step} · ${track}`, `مدیر: ${step}`)}</p>{/if}

{:else if stage === 'finished' && result}
	<div class="done-mark" aria-hidden="true">{result.outcome === 'done' ? '✓' : '→'}</div>
	<h1>{result.outcome === 'done' ? T('Step done.', 'این مرحله تمام شد.') : T('No problem. This step will come back later.', 'اشکالی ندارد. این مرحله بعداً برمی‌گردد.')}</h1>
	{#if result.goalJustMet}<p class="goal">{T('That’s your goal for today ✓', 'هدف امروزت انجام شد ✓')}</p>{/if}
	{#if result.outcome === 'done'}{@render endOfStep()}{/if}
	{#if comingSoon}<p class="soon">{T('That’s every step for now. New practice is coming soon.', 'تا این‌جا همهٔ مرحله‌ها را انجام دادی. تمرین‌های تازه به‌زودی می‌آیند.')}</p>{/if}
	<ActionBar label={comingSoon ? T('Done', 'تمام') : nextLabel} onclick={comingSoon ? home : goNext}
		secondary={comingSoon ? (result?.next ? { label: T('Practise a step again', 'یک مرحله را دوباره تمرین کن'), onclick: goNext } : null) : nextInfo ? { label: T('Done for now', 'فعلاً کافی است'), onclick: home } : null} />

{:else if stage === 'offer' && offered?.module}
	<h1>{T(`You skipped ${offered.module.title.en}. Do it now?`, `«${offered.module.title.fa}» را رد کردی. همین حالا انجامش بدهی؟`)}</h1>
	<p class="small">{T('It takes a few minutes, and it finishes this chapter properly.', 'چند دقیقه طول می‌کشد و این فصل را کامل می‌کند.')}</p>
	<ActionBar label={T('Do it now', 'همین حالا')} onclick={() => void open(offered!.id)} secondary={{ label: T('Later', 'بعداً'), onclick: () => (stage = 'chapter') }} />

{:else if (stage === 'chapter' || stage === 'offer') && result}
	<div class="done-mark big" aria-hidden="true">★</div>
	<p class="eyebrow">{T('CHAPTER DONE', 'فصل تمام شد')}</p>
	<h1>{text(day.theme)}</h1>
	<p class="goal">{text(nowYouCan)}</p>
	{#if result.goalJustMet}<p class="small">{T('And that’s your goal for today ✓', 'و هدف امروزت هم انجام شد ✓')}</p>{/if}
	{#if result.outcome === 'done'}{@render endOfStep()}{/if}
	{#if comingSoon}<p class="soon">{T('That’s every step for now. New practice is coming soon.', 'تا این‌جا همهٔ مرحله‌ها را انجام دادی. تمرین‌های تازه به‌زودی می‌آیند.')}</p>{/if}
	<ActionBar label={comingSoon ? T('Done', 'تمام') : nextLabel} onclick={comingSoon ? home : goNext}
		secondary={comingSoon ? (result?.next ? { label: T('Practise a step again', 'یک مرحله را دوباره تمرین کن'), onclick: goNext } : null) : nextInfo ? { label: T('Done for now', 'فعلاً کافی است'), onclick: home } : null} />
{/if}

<div class="bar-space" aria-hidden="true"></div>

<style>
	.eyebrow { font-size: .76rem; letter-spacing: .12em; font-weight: 600; color: var(--accent-deep); margin: 18px 0 10px; }
	h1 { font-family: var(--font-display); font-weight: 500; font-size: clamp(1.7rem, 5vw, 2.4rem); line-height: 1.2; margin: 0 0 14px; }
	p { line-height: 1.65; }
	.brief { display: grid; grid-template-columns: auto 1fr; gap: 12px; align-items: start; margin: 8px 0 16px; padding: 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); }
	.avatar { display: grid; place-items: center; inline-size: 40px; block-size: 40px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.brief-text { display: grid; gap: 10px; }
	.brief-line { margin: 0; font-size: 1.04rem; line-height: 1.55; }
	.story { color: var(--ink-soft); }
	.goal { font-size: 1.1rem; font-weight: 600; color: var(--leaf-deep, var(--accent-deep)); margin: 0 0 12px; }
	.small { color: var(--ink-soft); font-size: .9rem; }
	.warn { color: var(--attention); font-weight: 600; }
	.busy { opacity: .6; pointer-events: none; }
	.done-mark { display: grid; place-items: center; inline-size: 64px; block-size: 64px; margin: 28px 0 8px; border-radius: 50%; background: var(--leaf-wash); color: var(--leaf-deep); font-size: 1.8rem; font-weight: 700; }
	.done-mark.big { inline-size: 80px; block-size: 80px; font-size: 2.2rem; background: var(--gold-wash, var(--leaf-wash)); }
	.bar-space { block-size: 110px; }
	.soon { margin: 14px 0 0; padding: 12px 14px; border-radius: 14px; background: var(--accent-wash); color: var(--accent-deep); font-weight: 600; line-height: 1.5; }
	.score { display: flex; align-items: baseline; gap: 10px; margin: 12px 0 0; }
	.score-value { font-family: var(--font-display); font-size: 2rem; font-weight: 600; color: var(--accent-deep); }
	.score-label { color: var(--ink-soft); }
	.hear { display: inline-flex; gap: 8px; align-items: center; min-height: 44px; padding: 8px 14px; border: 1.5px solid var(--control-border); border-radius: 999px; background: var(--paper-raised); color: var(--accent-deep); font: inherit; font-weight: 600; cursor: pointer; }
	.hear:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
</style>
