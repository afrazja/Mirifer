<script lang="ts">
	/**
	 * A step's first screen, shown rather than explained (CLAUDE.md, "Short, visual instructions"):
	 * an icon header with the time, a small card for a new story, Mira's one line (English, with
	 * the Persian under it for Persian learners) and what to look for: the step's cues, or else its
	 * flow in three parts (step-intro.ts). `header` mode, above a module, keeps the header and
	 * Mira's line only.
	 */
	import StepIcon from '$lib/components/StepIcon.svelte';
	import { MODULE_ICON, STEP_FLOW, type IntroChip } from '$lib/practice/step-intro';
	import type { ModuleId } from '$lib/practice/day';
	import type { DisplayText } from '$lib/practice/hotel';
	import { stopAllAudio, ttsIsPlaying } from '$services/tts';

	let { moduleId, eyebrow, title, minutes = 0, note = null, isFa, mode = 'brief', story = null, cues = [], onHear }: {
		moduleId: ModuleId;
		eyebrow: string;
		title: string;
		/** About how long the step takes; no chip when 0. */
		minutes?: number;
		/** Mira's line; none above a module once the learner has moved on. */
		note?: DisplayText | null;
		isFa: boolean;
		mode?: 'brief' | 'header';
		/** A chapter's first step: the new story, in a few words. */
		story?: DisplayText | null;
		cues?: IntroChip[];
		/** Plays Mira's line (the step owns the audio, so it can wait for it). */
		onHear?: () => void;
	} = $props();

	const T = (en: string, fa: string) => (isFa ? fa : en);
	const text = (value: DisplayText) => (isFa ? value.fa : value.en);
	const playing = $derived($ttsIsPlaying);
	const shown = $derived(cues.length ? cues : STEP_FLOW[moduleId]);
	function toggle() { if (playing) stopAllAudio(); else onHear?.(); }
</script>

<header class="head">
	<span class="tile" aria-hidden="true"><StepIcon name={MODULE_ICON[moduleId]} size={26} /></span>
	<div class="titles">
		<p class="eyebrow">{eyebrow}</p>
		<h1>{title}</h1>
	</div>
	{#if minutes > 0}
		<span class="time"><StepIcon name="time" size={14} /><span>{T(`${minutes} min`, `${minutes.toLocaleString('fa-IR')} دقیقه`)}</span></span>
	{/if}
</header>

{#if mode === 'brief' && story}
	<div class="story">
		<span class="story-icon" aria-hidden="true"><StepIcon name="story" size={22} /></span>
		<div class="story-text">
			<span class="story-tag">{T('NEW STORY', 'داستان تازه')}</span>
			<span class="story-line">{text(story)}</span>
		</div>
	</div>
{/if}

{#if note}
	<div class="mira">
		<span class="avatar" aria-hidden="true">M</span>
		<div class="said">
			<p class="en" lang="en" dir="ltr">{note.en}</p>
			{#if isFa}<p class="fa" lang="fa" dir="rtl">{note.fa}</p>{/if}
		</div>
		{#if onHear}
			<button class="hear" type="button" onclick={toggle} aria-label={playing ? T('Stop Mira', 'توقف صدای میرا') : T('Hear Mira', 'شنیدن صدای میرا')}>
				{#if playing}<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></svg>
				{:else}<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14" /></svg>{/if}
			</button>
		{/if}
	</div>
{/if}

{#if mode === 'brief'}
	{#if cues.length}
		<ul class="cues" aria-label={T('Listen for', 'دنبال این‌ها باش')}>
			{#each shown as cue (cue.label.en)}
				<li class="cue"><StepIcon name={cue.icon} size={24} /><span>{text(cue.label)}</span></li>
			{/each}
		</ul>
	{:else}
		<ol class="flow" aria-label={T('In this step', 'در این مرحله')}>
			{#each shown as part, i (part.label.en)}
				<li class="part" class:current={i === 0} aria-current={i === 0 ? 'step' : undefined}><StepIcon name={part.icon} size={16} /><span>{text(part.label)}</span></li>
			{/each}
		</ol>
	{/if}
{/if}

<style>
	.head { display: grid; grid-template-columns: auto 1fr auto; gap: 14px; align-items: center; margin: 14px 0 16px; }
	.tile { display: grid; place-items: center; inline-size: 52px; block-size: 52px; border-radius: 16px; background: var(--accent); color: var(--on-accent); }
	.titles { min-width: 0; }
	.eyebrow { margin: 0 0 2px; font-size: .74rem; font-weight: 700; letter-spacing: .08em; color: var(--ink-soft); }
	:global([dir='rtl']) .eyebrow { letter-spacing: normal; }
	h1 { margin: 0; font-family: var(--font-display); font-weight: 500; font-size: clamp(1.55rem, 5vw, 2.1rem); line-height: 1.15; }
	.time { display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 999px; background: var(--paper-sunken); color: var(--ink-soft); font-size: .84rem; font-weight: 600; white-space: nowrap; }

	.story { display: flex; align-items: center; gap: 12px; margin: 0 0 14px; padding: 12px 14px; border-radius: 16px; background: var(--paper-raised); border: 1px solid var(--line); border-inline-start: 5px solid var(--attention); }
	.story-icon { color: var(--attention); display: grid; }
	.story-text { display: grid; gap: 1px; min-width: 0; }
	.story-tag { font-size: .7rem; font-weight: 700; letter-spacing: .08em; color: var(--attention); }
	:global([dir='rtl']) .story-tag { letter-spacing: normal; }
	.story-line { font-weight: 600; line-height: 1.4; }

	.mira { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: start; margin: 0 0 16px; padding: 12px 12px 12px 14px; border-radius: 18px; background: var(--paper-raised); border: 1px solid var(--line); }
	.avatar { display: grid; place-items: center; inline-size: 38px; block-size: 38px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-family: var(--font-display); font-weight: 700; }
	.said { display: grid; gap: 4px; min-width: 0; align-self: center; }
	.said p { margin: 0; }
	.en { font-size: 1.1rem; font-weight: 500; line-height: 1.45; text-align: left; }
	.fa { font-size: .95rem; line-height: 1.75; color: var(--ink-soft); text-align: right; }
	.hear { display: grid; place-items: center; inline-size: 44px; block-size: 44px; border: 1.5px solid var(--control-border); border-radius: 50%; background: var(--paper-raised); color: var(--accent-deep); cursor: pointer; }
	.hear:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }

	.cues { display: grid; grid-template-columns: repeat(auto-fit, minmax(88px, 1fr)); gap: 8px; margin: 0; padding: 0; list-style: none; }
	.cue { display: grid; justify-items: center; gap: 6px; padding: 12px 6px; border-radius: 14px; background: var(--paper-raised); border: 1px solid var(--line); color: var(--accent-deep); }
	.cue span { color: var(--ink); font-weight: 600; text-align: center; }

	.flow { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; padding: 0; list-style: none; }
	.part { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--line); background: var(--paper-raised); color: var(--ink-soft); font-size: .9rem; font-weight: 600; }
	.current { background: var(--accent); border-color: var(--accent); color: var(--on-accent); }
</style>
