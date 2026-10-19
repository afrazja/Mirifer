<script lang="ts">
	/**
	 * "Role-play with a twist" in the daily lesson: the mission (your card and goals), then the
	 * conversation with a character played by AI (/api/english/converse), then the result with a
	 * review of the learner's own sentences. The scene comes from the day (roleplay.ts). One focused
	 * screen at a time; the run is kept in this browser so a reload comes back to it.
	 */
	import { onDestroy, onMount, tick } from 'svelte';
	import ActionBar from '$lib/components/ActionBar.svelte';
	import EnglishSpeechInput from '$lib/components/EnglishSpeechInput.svelte';
	import MixedText from '$lib/components/MixedText.svelte';
	import { ENGLISH_RATE, RECORDED_ENGLISH_RATE } from '$lib/practice/english-voice';
	import {
		MAX_REPLY, MAX_TURNS, goalIdsOf, startRolePlay,
		type Correction, type DisplayText, type RolePlayRecord, type RoleScene
	} from '$lib/practice/roleplay';
	import { wordCount } from '$lib/practice/hotel';
	import { ENGLISH_VOICES, playAudioPromise, playAudioUrl, stopAllAudio } from '$services/tts';

	let { isFa = false, scene, initial = null, onSave, onFocus, onSkip, onDone }: {
		isFa?: boolean;
		scene: RoleScene;
		initial?: RolePlayRecord | null;
		onSave?: (record: RolePlayRecord) => void;
		/** Mira's instruction shows on the mission screen only. */
		onFocus?: (mode: 'full' | 'compact' | 'hidden') => void;
		/** "Skip this step" (the daily lesson). */
		onSkip?: () => void;
		/** Goals reached, out of all. */
		onDone: (score: { correct: number; total: number }, record: RolePlayRecord) => void;
	} = $props();

	const T = (en: string, fa: string) => (isFa ? fa : en);
	const N = (n: number) => (isFa ? n.toLocaleString('fa-IR') : String(n));
	const text = (value: DisplayText) => (isFa ? value.fa : value.en);
	// svelte-ignore state_referenced_locally
	const IDS = goalIdsOf(scene), NAME = scene.screen.character;

	// svelte-ignore state_referenced_locally
	let record = $state<RolePlayRecord>(initial ?? startRolePlay(scene));
	// svelte-ignore state_referenced_locally
	let stage = $state<'mission' | 'goals' | 'call' | 'end'>(initial?.done ? 'end' : initial && initial.turns.length > 1 ? 'call' : 'mission');
	let draft = $state(''), pending = $state(''), checking = $state(false);
	let problem = $state<DisplayText | null>(null), latest = $state<Correction | null>(null);
	let review = $state<'idle' | 'loading' | 'ready' | 'failed' | 'limit'>('idle');
	let voiceOn = $state(true);
	// svelte-ignore state_referenced_locally
	let voice = $state(scene.voice ?? ENGLISH_VOICES[Math.floor(Math.random() * ENGLISH_VOICES.length)].id);
	let heading: HTMLElement | undefined = $state(), input: HTMLTextAreaElement | undefined = $state(), bottom: HTMLElement | undefined = $state();
	let generation = 0, alive = true;

	const replies = $derived(record.turns.filter(turn => turn.speaker === 'learner').map(turn => turn.text));
	const averageWords = $derived(replies.length ? Math.round(replies.reduce((sum, reply) => sum + wordCount(reply), 0) / replies.length * 10) / 10 : 0);
	const outOfTurns = $derived(!record.done && replies.length >= MAX_TURNS);
	const lastLine = $derived([...record.turns].reverse().find(turn => turn.speaker === 'reception')?.text ?? '');

	onMount(() => {
		if (stage !== 'mission') onFocus?.('hidden');
		if (stage === 'end' && !record.upgrades) void loadReview();
		if (stage === 'call') scrollDown();
	});
	onDestroy(() => { alive = false; generation++; stopAllAudio(); });

	function persist() { if (alive) onSave?.($state.snapshot(record)); }
	function go(next: typeof stage) { stage = next; queueMicrotask(() => heading?.focus()); }
	function scrollDown() { void tick().then(() => bottom?.scrollIntoView({ block: 'end' })); }

	/** The character's line, in the expressive voice (signed lines only), or the free voice if that fails. */
	async function speak(line: string, always = false) {
		if ((!voiceOn && !always) || !line) return;
		stopAllAudio();
		const sig = record.voiceSigs[line];
		const url = `/api/english/voice?v=1&voice=${voice}&scene=${encodeURIComponent(scene.id)}&text=${encodeURIComponent(line)}${sig ? `&sig=${encodeURIComponent(sig)}` : ''}`;
		if (!(await playAudioUrl(url, undefined, RECORDED_ENGLISH_RATE)) && alive) void playAudioPromise(line, ENGLISH_RATE, 'en-US', undefined, voice).catch(() => {});
	}
	function toggleVoice() { voiceOn = !voiceOn; if (!voiceOn) stopAllAudio(); else void speak(lastLine); }

	function start(variant = record.variant) {
		generation++; stopAllAudio();
		// Saved with the first reply, so a finished run isn't lost by just opening a new one.
		record = startRolePlay(scene, variant);
		draft = ''; pending = ''; checking = false; problem = null; latest = null; review = 'idle';
		if (!scene.voice) voice = ENGLISH_VOICES[Math.floor(Math.random() * ENGLISH_VOICES.length)].id;
		onFocus?.('hidden'); go('call');
		void speak(scene.greeting);
	}

	const failure: Record<'limit' | 'unavailable' | 'signin', DisplayText> = {
		limit: { en: 'Today’s AI conversation turns are used up. The limit resets at 00:00 UTC.', fa: 'سهمیهٔ امروز گفت‌وگو با هوش مصنوعی تمام شده است. سهمیه ساعت ۰۰:۰۰ به وقت UTC تازه می‌شود.' },
		unavailable: { en: `${NAME} can’t answer right now. Your reply is still in the box. Try sending it again in a moment.`, fa: 'الان جوابی نمی‌آید. پاسخت هنوز در کادر است؛ کمی بعد دوباره بفرست.' },
		signin: { en: 'Your session has ended. Sign in again to continue.', fa: 'نشست تو تمام شده است. برای ادامه دوباره وارد شو.' }
	};

	async function send() {
		const reply = draft.trim();
		if (record.done || checking || outOfTurns || !reply) return;
		if (reply.length > MAX_REPLY) { problem = { en: `Keep each reply under ${MAX_REPLY} characters.`, fa: `هر پاسخ باید کمتر از ${N(MAX_REPLY)} نویسه باشد.` }; return; }
		problem = null; latest = null; stopAllAudio();
		const turns = [...record.turns, { speaker: 'learner' as const, text: reply }];
		const current = generation;
		checking = true; pending = reply; scrollDown();
		try {
			const response = await fetch('/api/english/converse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scene: scene.id, variant: record.variant, turns, goals: record.goals, proof: record.proof }) });
			if (current !== generation || !alive) return;
			if (!response.ok) { problem = failure[response.status === 429 ? 'limit' : response.status === 401 ? 'signin' : 'unavailable']; return; }
			const result = await response.json();
			if (current !== generation || !alive) return;
			if (typeof result.reply !== 'string' || !Array.isArray(result.goals)) { problem = failure.unavailable; return; }
			const fix = result.correction;
			const correction: Correction | null = fix && typeof fix.improved === 'string' && typeof fix.note?.en === 'string' && typeof fix.note?.fa === 'string'
				? { original: reply, improved: fix.improved, note: { en: fix.note.en, fa: fix.note.fa } } : null;
			record = {
				...record, turns: [...turns, { speaker: 'reception', text: result.reply }],
				goals: IDS.filter(id => result.goals.includes(id)), proof: typeof result.proof === 'string' ? result.proof : null,
				done: result.done === true, corrections: correction ? [...record.corrections, correction] : record.corrections,
				voiceSigs: typeof result.voiceSig === 'string' ? { ...record.voiceSigs, [result.reply]: result.voiceSig } : record.voiceSigs
			};
			latest = correction; draft = ''; persist();
			scrollDown();
			void speak(result.reply);
			if (record.done) void loadReview();
		} catch {
			if (current === generation) problem = failure.unavailable;
		} finally {
			if (current === generation) { checking = false; pending = ''; }
		}
	}

	async function loadReview() {
		if (review === 'loading' || !record.done) return;
		if (!record.proof) { review = 'failed'; return; }
		if (record.upgrades) { review = 'ready'; return; }
		const current = generation;
		review = 'loading';
		try {
			const response = await fetch('/api/english/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scene: scene.id, variant: record.variant, turns: record.turns, goals: record.goals, proof: record.proof }) });
			if (current !== generation || !alive) return;
			if (!response.ok) { review = response.status === 429 ? 'limit' : 'failed'; return; }
			const result = await response.json();
			if (current !== generation || !alive) return;
			const items: unknown[] = Array.isArray(result.upgrades) ? result.upgrades : [];
			const valid = items.filter((item): item is { original: string; better: string; why: DisplayText; voiceSig?: unknown } => {
				const value = item as Record<string, any>;
				return typeof value?.original === 'string' && typeof value.better === 'string' && typeof value.why?.en === 'string' && typeof value.why?.fa === 'string';
			});
			const sigs = { ...record.voiceSigs };
			for (const item of valid) if (typeof item.voiceSig === 'string') sigs[item.better] = item.voiceSig;
			record = { ...record, voiceSigs: sigs, upgrades: valid.map(({ original, better, why }) => ({ original, better, why })) }; persist();
			review = 'ready';
		} catch {
			if (current === generation) review = 'failed';
		}
	}

	function toEnd() { stopAllAudio(); go('end'); }
	function finish() {
		stopAllAudio();
		onDone({ correct: record.goals.length, total: IDS.length }, $state.snapshot(record));
	}
	const other = $derived(scene.variants.find(v => v !== record.variant) ?? scene.variants[0]);
</script>

{#snippet goalList()}
	<ul class="goals">
		{#each scene.goals as goal}
			{@const met = record.goals.includes(goal.id)}
			<li class:met><span class="mark" aria-hidden="true">{met ? '✓' : '○'}</span><span>{text(goal.label)}{#if met}<span class="sr-only">{T(' (done)', ' (انجام شد)')}</span>{/if}</span></li>
		{/each}
	</ul>
{/snippet}

{#snippet card()}
	<dl class="card">
		{#each scene.screen.card as row}<div><dt>{text(row.label)}</dt><dd>{#if isFa}<MixedText text={row.value.fa} />{:else}{row.value.en}{/if}</dd></div>{/each}
	</dl>
{/snippet}

<section class="roleplay" dir={isFa ? 'rtl' : 'ltr'}>
	{#if stage === 'mission'}
		<h2 class="title" tabindex="-1" bind:this={heading}>{text(scene.screen.title)}</h2>
		<p class="lead">{#if isFa}<MixedText text={scene.screen.lead.fa} />{:else}{scene.screen.lead.en}{/if}</p>
		{@render card()}
		<ActionBar label={T('Next', 'بعدی')} onclick={() => { onFocus?.('hidden'); go('goals'); }} secondary={onSkip ? { label: T('Skip this step', 'این مرحله را رد کن'), onclick: () => { stopAllAudio(); onSkip?.(); } } : null} />

	{:else if stage === 'goals'}
		<h2 class="title" tabindex="-1" bind:this={heading}>{text(scene.screen.missionHeading)}</h2>
		{@render goalList()}
		<p class="small">{text(scene.screen.instructions)}</p>
		<ActionBar label={scene.screen.start ? text(scene.screen.start) : T('Start the call', 'شروع تماس')} onclick={() => start(record.variant)} secondary={{ label: T('Back to your card', 'برگشت به کارتت'), onclick: () => { onFocus?.('full'); go('mission'); } }} />

	{:else if stage === 'call'}
		<div class="who">
			<span class="avatar" aria-hidden="true">{NAME[0]}</span>
			<div><strong lang="en">{NAME}</strong><small>{#if isFa}<MixedText text={scene.screen.place.fa} />{:else}{scene.screen.place.en}{/if}</small></div>
			<button type="button" class="quiet" aria-pressed={voiceOn} onclick={toggleVoice}>{voiceOn ? T('Voice on', 'صدا روشن') : T('Voice off', 'صدا خاموش')}</button>
		</div>
		<h2 class="sr-only" tabindex="-1" bind:this={heading}>{T(`Talking to ${NAME}`, 'در حال گفت‌وگو')}</h2>
		<details class="mission">
			<summary>{T(`Your goals · ${record.goals.length} of ${IDS.length}`, `هدف‌هایت — ${N(record.goals.length)} از ${N(IDS.length)}`)}</summary>
			{@render goalList()}
			{@render card()}
		</details>
		<div class="turns" role="log" aria-live="polite" aria-relevant="additions" dir="ltr">
			{#each record.turns as turn, index (index)}
				<div class="turn" class:you={turn.speaker === 'learner'}>
					<small>{turn.speaker === 'learner' ? 'You' : NAME}</small>
					<p lang="en">{turn.text}</p>
					{#if turn.speaker === 'reception'}<button type="button" class="listen" onclick={() => void speak(turn.text, true)}>{T('Listen', 'شنیدن')}</button>{/if}
				</div>
			{/each}
			{#if pending}<div class="turn you pending"><small>You</small><p lang="en">{pending}</p></div><p class="typing" dir={isFa ? 'rtl' : 'ltr'}>{T(`${NAME} is answering…`, 'دارد جواب می‌دهد…')}</p>{/if}
		</div>
		{#if latest}<div class="fix" role="status"><strong>{T('A clearer way to say it:', 'شکل طبیعی‌تر:')}</strong> <span lang="en" dir="ltr">{latest.improved}</span><br />{#if isFa}<MixedText text={latest.note.fa} />{:else}{latest.note.en}{/if}</div>{/if}
		{#if problem}<p class="note" role="alert">{text(problem)}</p>{/if}
		{#if record.done}
			<p class="note good" role="status">{T('You reached every goal.', 'به همهٔ هدف‌ها رسیدی.')}</p>
		{:else if outOfTurns}
			<p class="note" role="status">{scene.screen.limit ? text(scene.screen.limit) : T('This call has reached its turn limit.', 'این تماس به سقف نوبت‌ها رسیده است.')}</p>
		{:else}
			<label class="sr-only" for="roleplay-reply">{T('Your reply in English', 'پاسخ تو به انگلیسی')}</label>
			<textarea id="roleplay-reply" bind:this={input} bind:value={draft} lang="en" dir="ltr" rows="2" maxlength={MAX_REPLY} disabled={checking}
				placeholder={T('Say or type your reply…', 'پاسخت را بگو یا بنویس…')}
				onkeydown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); void send(); } }}></textarea>
			{#if scene.screen.hint}<p class="small">{#if isFa}<MixedText text={scene.screen.hint.fa} />{:else}{scene.screen.hint.en}{/if}</p>{/if}
			{#key replies.length}<EnglishSpeechInput {isFa} disabled={checking} onTranscript={value => { draft = value; void tick().then(() => input?.focus()); }} />{/key}
			<p class="small">{T(`${NAME} is played by AI: each reply goes to an AI provider with the conversation so far.`, 'این نقش را هوش مصنوعی بازی می‌کند: هر پاسخت همراه با گفت‌وگوی قبلی به ارائه‌دهندهٔ هوش مصنوعی فرستاده می‌شود.')}</p>
		{/if}
		<div bind:this={bottom}></div>
		{#if record.done || outOfTurns}
			<ActionBar label={T('See how you did', 'دیدن نتیجه')} onclick={toEnd} />
		{:else}
			<ActionBar label={checking ? T('Sending…', 'در حال ارسال…') : T('Send', 'ارسال')} icon={checking ? null : 'send'} disabled={!draft.trim() || checking} onclick={send}
				secondary={problem && onSkip ? { label: T('Skip this step', 'این مرحله را رد کن'), onclick: () => { stopAllAudio(); onSkip?.(); } } : null} />
		{/if}

	{:else}
		<h2 class="title" tabindex="-1" bind:this={heading}>{record.done ? T('Done.', 'انجام شد.') : T(`You reached ${record.goals.length} of ${IDS.length} goals.`, `به ${N(record.goals.length)} هدف از ${N(IDS.length)} رسیدی.`)}</h2>
		{#if record.done}<p class="lead">{text(scene.screen.resultLead)}</p>{/if}
		<p class="small">{T(`${replies.length} replies · ${averageWords} words per reply on average`, `${N(replies.length)} پاسخ، به‌طور میانگین ${N(averageWords)} کلمه در هر پاسخ`)}</p>
		{#if record.done}
			<p class="label">{T('Say it more naturally', 'طبیعی‌تر بگو')}</p>
			{#if review === 'loading' || review === 'idle'}<p class="small" role="status">{T('Looking back at what you said…', 'در حال بررسی جمله‌هایت…')}</p>
			{:else if review === 'ready' && record.upgrades?.length}
				{#each record.upgrades as upgrade}
					<div class="item">
						<p class="said" lang="en" dir="ltr">{upgrade.original}</p>
						<p class="better" lang="en" dir="ltr">{upgrade.better}</p>
						<p class="why">{#if isFa}<MixedText text={upgrade.why.fa} />{:else}{upgrade.why.en}{/if}</p>
						<button type="button" class="quiet" onclick={() => void speak(upgrade.better, true)}>{T('Listen', 'شنیدن')}</button>
					</div>
				{/each}
			{:else if review === 'ready'}<p class="small">{T('Your sentences already sounded natural.', 'جمله‌هایت همین حالا هم طبیعی بودند.')}</p>
			{:else if review === 'limit'}<p class="small">{T('Today’s AI allowance is used up, so the review isn’t available until tomorrow.', 'سهمیهٔ امروز هوش مصنوعی تمام شده است؛ فردا دوباره امتحان کن.')}</p>
			{:else}<p class="small">{T('The review couldn’t load.', 'بررسی جمله‌ها انجام نشد.')} <button type="button" class="quiet" onclick={() => void loadReview()}>{T('Try again', 'دوباره تلاش کن')}</button></p>{/if}
		{/if}
		{#if record.corrections.length}
			<p class="label">{T('For next time', 'برای دفعهٔ بعد')}</p>
			{#each record.corrections as correction}
				<div class="item"><p class="said" lang="en" dir="ltr">{correction.original}</p><p class="better" lang="en" dir="ltr">{correction.improved}</p><p class="why">{#if isFa}<MixedText text={correction.note.fa} />{:else}{correction.note.en}{/if}</p></div>
			{/each}
		{/if}
		<ActionBar label={T('Continue', 'ادامه')} onclick={finish} secondary={{ label: T('Try again with a small twist', 'یک بار دیگر، با تغییری کوچک'), onclick: () => start(other) }} />
	{/if}
</section>

<style>
	.roleplay { display: grid; gap: 12px; padding-block-end: 140px; }
	.title { margin: 0; font-family: var(--font-display); font-size: 1.4rem; line-height: 1.3; }
	.title:focus { outline: none; }
	.lead { margin: 0; line-height: 1.6; }
	.label { margin: 8px 0 0; font-size: .8rem; font-weight: 700; color: var(--accent-deep); }
	.small { margin: 0; font-size: .82rem; color: var(--ink-soft); line-height: 1.55; }
	.card { margin: 0; padding: 12px 14px; display: grid; gap: 8px; border-radius: 14px; background: var(--paper-raised); border: 1px solid var(--line); }
	.card div { display: grid; gap: 2px; }
	.card dt { font-size: .75rem; font-weight: 700; color: var(--ink-soft); }
	.card dd { margin: 0; line-height: 1.5; font-size: .92rem; }
	.goals { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
	.goals li { display: flex; gap: 10px; line-height: 1.5; color: var(--ink); }
	.mark { flex: none; inline-size: 1.2em; color: var(--ink-soft); font-weight: 700; }
	.met .mark { color: var(--accent-deep); }
	.met { color: var(--ink-soft); }
	.who { display: flex; align-items: center; gap: 10px; }
	.who div { display: grid; flex: 1; }
	.who small { color: var(--ink-soft); font-size: .78rem; }
	.avatar { display: grid; place-items: center; inline-size: 40px; block-size: 40px; border-radius: 50%; background: var(--accent-wash); color: var(--accent-deep); font-family: var(--font-display); font-size: 1.3rem; }
	.mission { padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line); background: var(--paper-raised); }
	.mission[open] { display: grid; gap: 10px; }
	.mission summary { cursor: pointer; font-weight: 600; font-size: .9rem; min-height: 32px; display: flex; align-items: center; }
	.turns { display: flex; flex-direction: column; gap: 12px; padding: 12px; border-radius: 14px; background: var(--paper-sunken); }
	.turn { inline-size: fit-content; max-inline-size: 88%; padding: 10px 14px; border-radius: 12px 12px 12px 3px; border: 1px solid var(--line); background: var(--paper-raised); }
	.turn.you { align-self: flex-end; background: var(--accent-wash); border-radius: 12px 12px 3px 12px; }
	.turn small { display: block; color: var(--ink-soft); font-size: .7rem; margin-bottom: 4px; }
	.turn p { margin: 0; line-height: 1.5; }
	.turn.pending { opacity: .7; }
	.typing { margin: 0; color: var(--ink-soft); font-size: .85rem; font-style: italic; }
	.listen { min-height: 32px; margin-top: 4px; padding: 2px 0; border: 0; background: none; color: var(--accent-deep); font: inherit; font-size: .78rem; font-weight: 600; cursor: pointer; }
	.fix, .note { margin: 0; padding: 10px 12px; border-radius: 10px; background: var(--attention-wash); color: var(--attention); font-size: .88rem; line-height: 1.55; }
	.note.good { background: var(--accent-wash); color: var(--accent-deep); }
	textarea { inline-size: 100%; resize: vertical; min-height: 64px; padding: 10px 12px; border: 1px solid var(--control-border); border-radius: 10px; background: var(--paper); color: var(--ink); font: inherit; }
	.quiet { min-height: 44px; padding: 8px 0; border: 0; background: none; color: var(--accent-deep); font: inherit; font-size: .88rem; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.item { display: grid; gap: 4px; padding: 10px 0; border-top: 1px solid var(--line); }
	.item p { margin: 0; line-height: 1.5; }
	.said { color: var(--ink-soft); }
	.better { font-family: var(--font-display); font-size: 1.1rem; color: var(--accent-deep); }
	.why { color: var(--ink-soft); font-size: .88rem; }
	.item .quiet { justify-self: start; }
	button:focus-visible, textarea:focus-visible, summary:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
</style>
