<script lang="ts">
	/**
	 * The end-of-lesson check: a few quick exercises on what the lesson taught.
	 * One question at a time, feedback straight away, a score at the end, and
	 * a chance to go over the ones that were missed. It can be skipped.
	 */
	import { untrack, tick } from 'svelte';
	import {
		type LessonExercise,
		optionText,
		localized,
		isOptionCorrect,
		fillParts,
		orderTiles,
		isOrderCorrect,
		exerciseAudio
	} from '$services/lesson-exercises';
	import { tokenizeForBuild } from '$services/sentence-build';

	let {
		exercises,
		language = 'en',
		mode = 'final',
		play,
		onDone
	}: {
		exercises: LessonExercise[];
		language?: 'en' | 'fa';
		/** `check`: a short quick check inside the lesson, no score screen. `final`: the closing set with a score. */
		mode?: 'check' | 'final';
		/** Speak German text. */
		play: (text: string) => void;
		/** `result` is null when skipped. */
		onDone: (result: { correct: number; total: number } | null) => void;
	} = $props();

	const fa = $derived(language === 'fa');
	const dir = $derived(fa ? 'rtl' : 'ltr');
	const t = (en: string, faText: string) => (fa ? faText : en);

	// The set is fixed for the life of this component; only the queue changes.
	let queue = $state<LessonExercise[]>(untrack(() => [...exercises]));
	let position = $state(0);
	let round = $state(1);
	/** First-try result per exercise id: only round 1 counts towards the score. */
	let firstTry = $state<Record<string, boolean>>({});
	let missed = $state<LessonExercise[]>([]);
	let finished = $state(false);

	// The current question's answer state.
	let picked = $state<number | null>(null);
	let placed = $state<string[]>([]);
	let tiles = $state<string[]>([]);
	let checked = $state(false);
	let correct = $state(false);

	let bodyEl: HTMLDivElement | undefined = $state();
	const current = $derived(finished ? null : queue[position] ?? null);
	const score = $derived(Object.values(firstTry).filter(Boolean).length);
	const total = $derived(exercises.length);
	const answered = $derived(picked !== null || checked);

	$effect(() => {
		// A new question: reset the answer state and, for order, deal the tiles.
		// Position and round are read as well: when the last question of a round is
		// the one missed, the second round starts with the very same exercise, and
		// reading `current` alone would leave it showing as already answered.
		void position;
		void round;
		const ex = current;
		picked = null;
		placed = [];
		checked = false;
		correct = false;
		tiles = ex?.type === 'order' ? orderTiles(ex) : [];
		if (ex?.type === 'listen' && ex.de) play(ex.de);
		// The new question's prompt is read out and is where keyboard focus starts.
		void tick().then(() => bodyEl?.querySelector<HTMLElement>('.ex-prompt')?.focus({ preventScroll: true }));
	});

	function focusNext() {
		void tick().then(() => bodyEl?.querySelector<HTMLElement>('.ex-next')?.focus({ preventScroll: true }));
	}

	function record(ok: boolean) {
		if (!current) return;
		focusNext();
		correct = ok;
		if (round === 1) firstTry = { ...firstTry, [current.id]: ok };
		if (!ok && round === 1) missed = [...missed, current];
		const audio = current ? exerciseAudio(current) : null;
		if (audio && (current.type === 'fill' || ok)) play(audio);
	}

	function choose(index: number) {
		if (!current || answered) return;
		picked = index;
		record(isOptionCorrect(current, index));
	}

	function place(i: number) {
		if (checked) return;
		placed = [...placed, tiles[i]];
		tiles = tiles.filter((_, k) => k !== i);
		void tick().then(() => (bodyEl?.querySelector<HTMLElement>('.ex-tiles .tile') ?? bodyEl?.querySelector<HTMLElement>('.ex-check'))?.focus({ preventScroll: true }));
	}

	function unplace(i: number) {
		if (checked) return;
		tiles = [...tiles, placed[i]];
		placed = placed.filter((_, k) => k !== i);
		void tick().then(() => (bodyEl?.querySelector<HTMLElement>('.ex-answer .tile') ?? bodyEl?.querySelector<HTMLElement>('.ex-tiles .tile'))?.focus({ preventScroll: true }));
	}

	function checkOrder() {
		if (!current || checked) return;
		checked = true;
		record(isOrderCorrect(current, placed));
	}

	function next() {
		if (position + 1 < queue.length) {
			position += 1;
		} else if (round === 1 && missed.length) {
			// What was missed comes round once more, straight away.
			queue = [...missed];
			missed = [];
			position = 0;
			round = 2;
		} else if (mode === 'check') {
			onDone({ correct: score, total });
		} else {
			finished = true;
		}
	}

	const optionState = (i: number) => {
		if (!current || picked === null) return '';
		if (isOptionCorrect(current, i)) return 'right';
		return i === picked ? 'wrong' : '';
	};

	const message = $derived(
		score === total
			? t('Perfect. You have this.', 'عالی! کاملاً یاد گرفتی.')
			: score >= Math.ceil(total * 0.7)
				? t('Good work.', 'آفرین!')
				: t('A good start. Come back to this lesson to strengthen it.', 'شروع خوبی بود. برای محکم‌تر شدن، دوباره به این درس برگرد.')
	);
</script>

<div class="exercises" {dir}>
	<div class="ex-head">
		<span class="ex-badge">✍️ {mode === 'check' ? t('Quick check', 'تمرین سریع') : t('Check what you learned', 'مرور آنچه یاد گرفتی')}</span>
		{#if !finished}
			<span class="ex-progress">
				{#if round > 1}{t('Once more', 'یک بار دیگر')} · {/if}<bdi dir="ltr">{position + 1} / {queue.length}</bdi>
			</span>
		{/if}
	</div>

	{#if current}
		{#key `${round}-${current.id}`}
			<div class="ex-body" bind:this={bodyEl}>
				{#if current.type === 'listen'}
					<p class="ex-prompt" tabindex="-1">{t('Listen. What does it mean?', 'گوش کن. معنی‌اش چیست؟')}</p>
					<button class="ex-listen" onclick={() => current.de && play(current.de)} aria-label={t('Play again', 'پخش دوباره')}>
						🔊 {t('Play again', 'پخش دوباره')}
					</button>
				{:else if current.type === 'choice'}
					<p class="ex-prompt" tabindex="-1">{localized(current.prompt, language)}</p>
					{#if current.de}<p class="ex-de" lang="de" dir="ltr">{current.de}</p>{/if}
				{:else if current.type === 'fill'}
					<p class="ex-prompt" tabindex="-1">{localized(current.prompt, language) || t('Which word fits?', 'کدام کلمه مناسب است؟')}</p>
					{@const [before, after] = fillParts(current)}
					<p class="ex-de" lang="de" dir="ltr">
						{before}<span class="gap" class:filled={picked !== null}
							>{picked !== null ? optionText(current.options![current.answer!], 'en') : '\u00a0'}</span
						>{after}
					</p>
				{:else}
					<p class="ex-prompt" tabindex="-1">{t('Put the words in order.', 'کلمه‌ها را به ترتیب درست بچین.')}</p>
					{#if current.prompt}<p class="ex-meaning">{localized(current.prompt, language)}</p>{/if}
					<div class="ex-answer" dir="ltr" role="group" aria-label={t('Your sentence', 'جملهٔ تو')}>
						{#each placed as word, i (i)}
							<button class="tile placed" disabled={checked} aria-label={t(`${word}, word ${i + 1}, tap to remove`, `${word}، کلمهٔ ${i + 1}، برای برداشتن بزن`)} onclick={() => unplace(i)}>{word}</button>
						{:else}
							<span class="ex-empty">{t('Tap the words below', 'روی کلمه‌های پایین بزن')}</span>
						{/each}
					</div>
					<div class="ex-tiles" dir="ltr">
						{#each tiles as word, i (`${word}-${i}`)}
							<button class="tile" onclick={() => place(i)}>{word}</button>
						{/each}
					</div>
					{#if !checked}
						<button class="ex-check" disabled={tiles.length > 0} onclick={checkOrder}>{t('Check', 'بررسی کن')}</button>
					{/if}
				{/if}

				{#if current.type !== 'order' && current.options}
					<div class="ex-options" role="group" aria-label={t('Answers', 'گزینه‌ها')}>
						{#each current.options as option, i (i)}
							{@const german = typeof option === 'string'}
							<button
								class="ex-option {optionState(i)}"
								disabled={answered}
								dir={german ? 'ltr' : dir}
								lang={german ? 'de' : undefined}
								onclick={() => choose(i)}
							>
								{optionText(option, language)}
							</button>
						{/each}
					</div>
				{/if}

				<div role="status">
					{#if answered}
						<div class="ex-feedback" class:ok={correct}>
							<strong>{correct ? t('Correct ✓', 'درست ✓') : t('Not quite', 'درست نبود')}</strong>
							{#if !correct && current.type === 'order'}
								<span class="ex-solution" dir="ltr" lang="de">{current.de}</span>
							{/if}
							{#if current.explain}<span>{localized(current.explain, language)}</span>{/if}
							{#if !correct && round === 1}<span class="ex-again">{t('You will see this one again.', 'این سؤال دوباره می‌آید.')}</span>{/if}
						</div>
					{/if}
				</div>
				{#if answered}
					<button class="ex-next" onclick={next}>
						{position + 1 < queue.length || (round === 1 && missed.length) ? t('Next →', 'بعدی ←') : mode === 'check' ? t('Continue →', 'ادامه ←') : t('See my result →', 'دیدن نتیجه ←')}
					</button>
				{/if}
			</div>
		{/key}
		{#if !answered && mode === 'final'}
			<button class="ex-skip" onclick={() => onDone(round > 1 ? { correct: score, total } : null)}>
				{round > 1 ? t('Finish', 'پایان') : t('Skip the exercises', 'رد کردن تمرین‌ها')}
			</button>
		{/if}
	{:else if finished}
		<div class="ex-result">
			<p class="ex-score" dir={fa ? 'rtl' : 'ltr'}>{fa ? `${score} از ${total}` : `${score} / ${total}`}</p>
			<p>{message}</p>
			<div class="ex-result-actions">
				<button class="ex-next" onclick={() => onDone({ correct: score, total })}>{t('Continue →', 'ادامه ←')}</button>
			</div>
		</div>
	{/if}
</div>

<style>
	.exercises {
		display: grid;
		gap: 14px;
		max-width: 560px;
		text-align: start;
		font-weight: 500;
		color: var(--ink);
	}

	.ex-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.ex-badge {
		padding: 4px 12px;
		border-radius: 999px;
		background: var(--info-wash);
		color: var(--info);
		font-size: 0.75rem;
		font-weight: 700;
	}

	.ex-progress {
		color: var(--ink-faint);
		font-size: 0.8rem;
		font-weight: 600;
	}

	.ex-body {
		display: grid;
		gap: 12px;
	}

	.ex-prompt {
		margin: 0;
		font-size: 1rem;
		font-weight: 700;
	}

	.ex-meaning {
		margin: 0;
		color: var(--ink-soft);
	}

	.ex-de {
		text-align: center;
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.25rem;
		font-weight: 700;
	}

	.gap {
		display: inline-block;
		min-inline-size: 3.2em;
		padding: 0 6px;
		border-bottom: 2px solid var(--ink-faint);
		text-align: center;
	}

	.gap.filled {
		border-bottom-color: var(--accent);
		color: var(--accent-deep);
	}

	.ex-options {
		display: grid;
		gap: 8px;
	}

	.ex-option,
	.ex-listen,
	.tile {
		min-height: 48px;
		padding: 10px 16px;
		border: 2px solid var(--control-edge);
		border-radius: 12px;
		background: var(--control);
		color: var(--ink);
		font: inherit;
		font-weight: 600;
		text-align: start;
		cursor: pointer;
		box-shadow: 0 3px 0 var(--control-edge);
	}

	.ex-option:active:not(:disabled),
	.tile:active:not(:disabled) {
		transform: translateY(3px);
		box-shadow: none;
	}

	.ex-option.right {
		border-color: var(--leaf);
		background: var(--leaf-wash);
	}

	.ex-option.wrong {
		border-color: var(--miss);
		background: color-mix(in srgb, var(--miss) 12%, transparent);
	}

	.ex-option:disabled:not(.right):not(.wrong) {
		opacity: 0.6;
		cursor: default;
	}

	.ex-listen {
		justify-self: start;
	}

	.ex-answer,
	.ex-tiles {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.ex-answer {
		min-height: 60px;
		padding: 8px;
		align-items: center;
		border-bottom: 2px solid var(--control-edge);
	}

	.ex-empty {
		color: var(--ink-faint);
		font-size: 0.85rem;
	}

	.tile {
		min-height: 44px;
		padding: 8px 14px;
	}

	.tile.placed {
		border-color: var(--accent);
	}

	.ex-check,
	.ex-next {
		justify-self: start;
		min-height: 48px;
		padding: 10px 22px;
		border: none;
		border-radius: 10px;
		background: var(--accent);
		color: var(--on-accent);
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	/* Whole-width in the thumb zone while a question is on screen. */
	.ex-body .ex-next,
	.ex-body .ex-check {
		justify-self: stretch;
	}

	.ex-check:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.ex-feedback {
		display: grid;
		gap: 4px;
		padding: 10px 14px;
		border-radius: 10px;
		background: color-mix(in srgb, var(--miss) 12%, transparent);
	}

	.ex-feedback.ok {
		background: var(--leaf-wash);
	}

	.ex-again {
		color: var(--ink-soft);
		font-size: 0.85rem;
	}

	.ex-solution {
		font-family: var(--font-display);
		font-weight: 700;
	}

	.ex-skip {
		justify-self: start;
		min-height: 44px;
		padding: 0 4px;
		border: 0;
		background: none;
		color: var(--ink);
		font: inherit;
		font-size: 0.9rem;
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}

	.ex-result {
		display: grid;
		gap: 10px;
		text-align: center;
		justify-items: center;
	}

	.ex-result p {
		margin: 0;
	}

	.ex-score {
		font-family: var(--font-display);
		font-size: 2.2rem;
		font-weight: 800;
		color: var(--accent-deep);
	}

	.ex-result-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		justify-content: center;
	}

	.ex-option:focus-visible,
	.ex-listen:focus-visible,
	.tile:focus-visible,
	.ex-check:focus-visible,
	.ex-next:focus-visible,
	.ex-skip:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}
</style>
