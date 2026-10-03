<script lang="ts">
	import { onDestroy } from 'svelte';
	import { playAudioPromise, stopAllAudio, ttsIsPlaying, ENGLISH_VOICES, type TTSVoice } from '$services/tts';
	import { ACT_ROUNDS, MAX_PLAYS, PLACES, PLAYBACK_RATE, THINGS, scoreSteps, type ActRecord, type PlaceId, type Step, type ThingId } from '$lib/practice/listen-act';
	import type { DisplayText } from '$lib/practice/hotel';

	let { isFa = false, onDone }: { isFa?: boolean; onDone: (score: { correct: number; total: number }, record: ActRecord) => void } = $props();
	const text = (value: DisplayText) => (isFa ? value.fa : value.en);

	let round = $state(0);
	let plays = $state(0), heard = $state(false), audioFailed = $state(false);
	let steps = $state<Step[]>([]);
	let pickedThing = $state<ThingId | null>(null);
	let checked = $state<boolean[] | null>(null);
	let totals = $state({ correct: 0, total: 0 });
	let finished = $state(false);
	let rounds = $state<ActRecord['rounds']>([]);
	const voice: TTSVoice = ENGLISH_VOICES[Math.floor(Math.random() * ENGLISH_VOICES.length)].id;
	const current = $derived(ACT_ROUNDS[round]);
	const playing = $derived($ttsIsPlaying);

	async function play() {
		if (plays >= MAX_PLAYS || playing || checked) return;
		plays += 1; audioFailed = false;
		try { await playAudioPromise(current.script, PLAYBACK_RATE[current.level], 'en-US', undefined, voice); heard = true; }
		catch { audioFailed = true; heard = true; }
	}
	function pickThing(id: ThingId) { if (!checked) pickedThing = pickedThing === id ? null : id; }
	function pickPlace(id: PlaceId) {
		if (checked || !pickedThing || steps.length >= current.steps.length + 2) return;
		steps = [...steps, { thing: pickedThing, place: id }]; pickedThing = null;
	}
	const undo = () => { if (!checked) { steps = steps.slice(0, -1); pickedThing = null; } };
	function check() {
		stopAllAudio();
		const { results, correct } = scoreSteps(current.steps, steps);
		rounds = [...rounds, { id: current.id, steps: $state.snapshot(steps), results }];
		checked = results; totals = { correct: totals.correct + correct, total: totals.total + current.steps.length };
	}
	function next() {
		stopAllAudio();
		if (round + 1 >= ACT_ROUNDS.length) { finished = true; return; }
		round += 1; plays = 0; heard = false; audioFailed = false; steps = []; pickedThing = null; checked = null;
	}
	onDestroy(stopAllAudio);

	const stepLabel = (step: Step) => `${text(THINGS[step.thing].label)} → ${text(PLACES[step.place].label)}`;
</script>

{#if finished}
	<section class="la" aria-live="polite">
		<h2>{isFa ? 'تمام شد' : 'Finished'}</h2>
		<p class="score">{totals.correct} / {totals.total} {isFa ? 'کار درست' : 'actions right'}</p>
		<button class="primary" type="button" onclick={() => onDone(totals, { rounds })}>{isFa ? 'ادامه' : 'Continue'} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button>
	</section>
{:else}
	<section class="la" aria-labelledby="la-title">
		<p class="small" id="la-title">{isFa ? `دور ${round + 1} از ${ACT_ROUNDS.length}` : `Round ${round + 1} of ${ACT_ROUNDS.length}`} · {current.level}</p>
		<p>{isFa ? `به دستورها گوش بده، بعد ${current.steps.length} کار را به ترتیب انجام بده. حداکثر ${MAX_PLAYS} بار می‌توانی گوش بدهی.` : `Listen to the instructions, then do ${current.steps.length} things in order. You can listen up to ${MAX_PLAYS} times.`}</p>

		<button class="play" type="button" onclick={play} disabled={plays >= MAX_PLAYS || playing || !!checked}>
			<span aria-hidden="true">{playing ? '🔊' : '▶'}</span>
			{playing ? (isFa ? 'در حال پخش…' : 'Playing…') : plays === 0 ? (isFa ? 'پخش' : 'Play') : (isFa ? `دوباره بشنو (${MAX_PLAYS - plays} باقی مانده)` : `Listen again (${MAX_PLAYS - plays} left)`)}
		</button>
		{#if audioFailed}<p class="warn" role="status">{isFa ? 'صدا پخش نشد. دوباره امتحان کن.' : 'The audio didn’t play. Try again.'}</p>{/if}

		<h3>{isFa ? '۱. چیزی را انتخاب کن' : '1. Pick a thing'}</h3>
		<div class="grid" role="group" aria-label={isFa ? 'چیزها' : 'Things'}>
			{#each Object.entries(THINGS) as [id, thing]}
				<button type="button" class="tile" class:on={pickedThing === id} aria-pressed={pickedThing === id} disabled={!!checked} onclick={() => pickThing(id as ThingId)}><span aria-hidden="true">{thing.icon}</span> {text(thing.label)}</button>
			{/each}
		</div>
		<h3>{isFa ? '۲. جایش را انتخاب کن' : '2. Pick where it goes'}</h3>
		<div class="grid" role="group" aria-label={isFa ? 'مکان‌ها' : 'Places'}>
			{#each Object.entries(PLACES) as [id, place]}
				<button type="button" class="tile" disabled={!pickedThing || !!checked} onclick={() => pickPlace(id as PlaceId)}><span aria-hidden="true">{place.icon}</span> {text(place.label)}</button>
			{/each}
		</div>

		<h3>{isFa ? 'کارهای تو' : 'Your steps'}</h3>
		<ol class="steps" aria-live="polite">
			{#each steps as step, index}
				<li class:right={checked?.[index] === true} class:wrong={checked && checked[index] !== true}>
					{stepLabel(step)}
					{#if checked}<span class="mark">{checked[index] ? (isFa ? ' ✓ درست' : ' ✓ right') : (isFa ? ' ✗ نادرست' : ' ✗ not right')}</span>{/if}
				</li>
			{:else}<li class="empty">{pickedThing ? (isFa ? 'حالا مکان را انتخاب کن.' : 'Now pick where it goes.') : (isFa ? 'هنوز کاری اضافه نکرده‌ای.' : 'No steps yet.')}</li>{/each}
		</ol>

		{#if !checked}
			<div class="row">
				<button class="primary" type="button" onclick={check} disabled={!steps.length || !heard}>{isFa ? 'بررسی کن' : 'Check my steps'}</button>
				<button class="text-button" type="button" onclick={undo} disabled={!steps.length}>{isFa ? 'آخرین کار را بردار' : 'Undo last step'}</button>
			</div>
			{#if !heard}<p class="small">{isFa ? 'اول یک بار گوش بده.' : 'Listen once first.'}</p>{/if}
		{:else}
			<div class="card" role="status">
				<p class="eyebrow">{isFa ? 'درست‌ها به ترتیب' : 'THE RIGHT ORDER'}</p>
				<ol class="steps">{#each current.steps as step}<li>{stepLabel(step)}</li>{/each}</ol>
				<p class="script" lang="en" dir="ltr">“{current.script}”</p>
				<p class="small">{isFa ? 'به این گوش بده:' : 'Listen for:'} {text(current.listenFor)}</p>
			</div>
			<button class="primary" type="button" onclick={next}>{round + 1 >= ACT_ROUNDS.length ? (isFa ? 'پایان' : 'Finish') : (isFa ? 'دور بعد' : 'Next round')} <span aria-hidden="true">{isFa ? '←' : '→'}</span></button>
		{/if}
	</section>
{/if}

<style>
	.la { display: grid; gap: 10px; }
	h2, h3 { font-family: var(--font-display); font-weight: 500; margin: 8px 0 0; }
	h3 { font-size: 1rem; font-family: inherit; font-weight: 600; }
	p { margin: 0; line-height: 1.6; }
	.small { color: var(--ink-soft); font-size: .88rem; }
	.warn { color: var(--attention); }
	.score { font-size: 1.4rem; font-weight: 600; }
	.play { display: inline-flex; gap: 10px; align-items: center; justify-content: center; min-height: 56px; padding: 12px 20px; border: 2px solid var(--accent); border-radius: 12px; background: var(--accent-wash); color: var(--accent-deep); font: inherit; font-weight: 600; cursor: pointer; }
	.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
	.tile { min-height: 48px; padding: 10px 12px; border: 1px solid var(--control-border); border-radius: 10px; background: var(--paper-raised); color: var(--ink); font: inherit; text-align: start; cursor: pointer; }
	.tile.on { border: 2px solid var(--accent); background: var(--accent-wash); font-weight: 600; }
	.steps { margin: 0; padding-inline-start: 22px; display: grid; gap: 6px; }
	.steps li { padding: 8px 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper-raised); }
	.steps li.empty { list-style: none; margin-inline-start: -22px; color: var(--ink-soft); border-style: dashed; }
	.steps li.right { border-color: var(--leaf); background: var(--leaf-wash); }
	.steps li.wrong { border-color: var(--miss); }
	.mark { font-weight: 600; }
	.card { display: grid; gap: 8px; padding: 14px; border: 1px solid var(--control-border); border-radius: 14px; background: var(--paper-raised); }
	.eyebrow { font-size: .76rem; letter-spacing: .12em; font-weight: 600; color: var(--accent-deep); }
	.script { color: var(--ink); font-style: italic; }
	.row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
	button { cursor: pointer; font: inherit; }
	button:disabled { opacity: .55; cursor: default; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	.primary { display: inline-flex; gap: 14px; align-items: center; justify-content: center; min-height: 48px; padding: 12px 22px; background: var(--accent); color: var(--on-accent); border: 1px solid var(--accent); border-radius: 10px; font-weight: 600; }
	.text-button { min-height: 44px; padding: 8px 4px; background: none; border: 0; color: var(--accent-deep); }
</style>
