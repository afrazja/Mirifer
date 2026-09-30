<script lang="ts">
	/**
	 * Pre-teaching, one item at a time: hear it, see it, recall its meaning,
	 * then say it aloud into the microphone and see how close it was. A batch is
	 * a few items, so each one gets the learner's full attention; the quick
	 * check that follows makes them retrieve it.
	 *
	 * Speaking never blocks: after one attempt (or Skip) the learner can move
	 * on. With no microphone the prompt changes to match what is offered.
	 */
	import { tick } from 'svelte';
	import type { TeachItem } from '$services/lesson-plan';
	import { bestVoiceMatch, getWordMatchStatus } from '$utils/text-matching';

	let {
		items,
		batch,
		of,
		language = 'en',
		micAvailable = false,
		listening = false,
		play,
		onMic,
		onDone
	}: {
		items: TeachItem[];
		batch: number;
		of: number;
		language?: 'en' | 'fa';
		/** Whether this browser can take voice input at all. */
		micAvailable?: boolean;
		/** The microphone is on right now. */
		listening?: boolean;
		/** Speak German text. */
		play: (text: string) => void;
		/** Start or stop the microphone. */
		onMic: () => void;
		onDone: () => void;
	} = $props();

	const fa = $derived(language === 'fa');
	const t = (en: string, faText: string) => (fa ? faText : en);

	let position = $state(0);
	let revealed = $state(false);
	/** none: not tried yet. */
	let outcome = $state<'none' | 'good' | 'almost' | 'nothing'>('none');
	let attempted = $state(false);
	let wordStatus = $state<Array<{ word: string; ok: boolean }>>([]);
	let heard = false;
	let cardEl: HTMLDivElement | undefined = $state();
	let sayEl: HTMLDivElement | undefined = $state();
	let nextEl: HTMLButtonElement | undefined = $state();

	const item = $derived(items[position]);
	const last = $derived(position === items.length - 1);
	const meaning = $derived(item ? (fa && item.fa) || item.en : '');
	/** What the learner is asked to say: the item without its blank marks. */
	const target = $derived((item?.de ?? '').replace(/…/g, ' ').replace(/\s+/g, ' ').trim());
	const canContinue = $derived(revealed && (attempted || !micAvailable));

	$effect(() => {
		// A new card: hide the meaning, clear the last attempt, play the item.
		const current = item;
		revealed = false;
		outcome = 'none';
		attempted = false;
		wordStatus = [];
		heard = false;
		if (current) play(current.de);
		// Keyboard and screen-reader users land on the new card.
		void tick().then(() => cardEl?.focus({ preventScroll: true }));
	});

	let wasListening = false;
	$effect(() => {
		// The microphone stopped without a transcript: tell the learner.
		const now = listening;
		if (wasListening && !now) {
			const started = position;
			setTimeout(() => {
				if (started === position && !heard && outcome === 'none') outcome = 'nothing';
			}, 1500);
		}
		if (now) heard = false;
		wasListening = now;
	});

	/** Called by the lesson page with what the microphone heard. */
	export function handleVoice(transcript: string, alternatives: string[] = []) {
		if (!item) return;
		heard = true;
		attempted = true;
		void tick().then(() => nextEl?.focus({ preventScroll: true }));
		const { transcript: best, result } = bestVoiceMatch([transcript, ...alternatives], target);
		if (result.isMatch) {
			outcome = 'good';
			wordStatus = [];
			play(item.de);
			return;
		}
		outcome = 'almost';
		const words = target.split(' ');
		const status = getWordMatchStatus(best, words);
		wordStatus = words.map((word) => ({ word, ok: !!status.get(word) }));
	}

	function skip() {
		if (listening) onMic();
		attempted = true;
		void tick().then(() => nextEl?.focus({ preventScroll: true }));
	}

	function next() {
		if (listening) onMic();
		if (last) onDone();
		else position += 1;
	}

	function back() {
		if (listening) onMic();
		if (position > 0) position -= 1;
	}
</script>

<div class="cards" dir={fa ? 'rtl' : 'ltr'}>
	<div class="head">
		<span class="badge">🧱 {t('New words', 'کلمه‌های تازه')} <bdi dir="ltr">{batch}/{of}</bdi></span>
		<span class="dots" role="img" aria-label={t(`Card ${position + 1} of ${items.length}`, `کارت ${position + 1} از ${items.length}`)}>
			{#each items as _, i}<span class="dot" class:on={i === position} class:done={i < position}></span>{/each}
		</span>
	</div>

	{#if item}
		{#key position}
			<div
				class="card"
				bind:this={cardEl}
				tabindex="-1"
				role="group"
				aria-label={t(`Card ${position + 1} of ${items.length}: ${item.de}`, `کارت ${position + 1} از ${items.length}: ${item.de}`)}
			>
				<p class="kind">{item.phrase ? t('Learn it whole', 'یک‌جا یاد بگیر') : t('Word', 'کلمه')}</p>
				<p class="de" lang="de" dir="ltr">{item.de}</p>
				<button class="play" onclick={() => play(item.de)} aria-label={t('Play again', 'پخش دوباره')}>🔊</button>

				{#if !revealed}
					<button
						class="reveal"
						onclick={() => {
							revealed = true;
							// The button is about to disappear; move on to what comes next.
							void tick().then(() => sayEl?.querySelector<HTMLElement>('.mic, .skip')?.focus() ?? nextEl?.focus());
						}}
					>{t('What does it mean?', 'معنی‌اش چیست؟')}</button>
				{:else}
					<p class="meaning" role="status">{meaning}</p>
				{/if}
			</div>
		{/key}
	{/if}

	{#if revealed}
		<div class="say-step" aria-live="polite" bind:this={sayEl}>
			{#if micAvailable}
				<p class="say">🎙️ {t('Tap the mic and say it.', 'میکروفن را بزن و آن را بگو.')}</p>
				<div class="mic-row">
					<button
						class="mic"
						class:on={listening}
						onclick={onMic}
						aria-label={listening ? t('Stop recording', 'توقف ضبط') : t('Record yourself', 'ضبط صدای خودت')}
					>{listening ? '🛑' : '🎙️'}</button>
					{#if !attempted}<button class="skip" onclick={skip}>{t('Skip', 'رد کردن')}</button>{/if}
				</div>
				{#if listening}
					<p class="status">{t('Listening…', 'در حال گوش دادن…')}</p>
				{:else if outcome === 'good'}
					<p class="status good">✓ {t('Good!', 'آفرین!')}</p>
				{:else if outcome === 'almost'}
					<p class="status almost">{t('Almost. Listen and try again.', 'تقریباً. گوش کن و دوباره بگو.')}</p>
					<p class="words" lang="de" dir="ltr">
						{#each wordStatus as w}<span class:ok={w.ok} class:miss={!w.ok}>{w.word}</span>{' '}{/each}
					</p>
				{:else if outcome === 'nothing'}
					<p class="status almost">{t('We did not hear anything. Try again, or skip.', 'چیزی نشنیدیم. دوباره امتحان کن یا رد شو.')}</p>
				{/if}
			{:else}
				<p class="say">🗣️ {t('Say it quietly to yourself.', 'آن را آهسته برای خودت بگو.')}</p>
			{/if}
		</div>
	{/if}

	<div class="actions">
		{#if position > 0}
			<button class="back" onclick={back}>{t('‹ Previous', 'قبلی ›')}</button>
		{/if}
		{#if canContinue}
			<button class="next" bind:this={nextEl} onclick={next}>
				{last ? t('Quick check →', 'تمرین سریع ←') : t('Next →', 'بعدی ←')}
			</button>
		{/if}
	</div>
</div>

<style>
	.cards {
		display: grid;
		gap: 16px;
		max-width: 480px;
		margin-inline: auto;
		text-align: center;
		font-weight: 500;
		color: var(--ink);
	}

	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
	}

	.badge {
		padding: 4px 12px;
		border-radius: 999px;
		background: var(--info-wash);
		color: var(--info);
		font-size: 0.75rem;
		font-weight: 700;
	}

	.dots {
		display: inline-flex;
		gap: 6px;
	}

	.dot {
		inline-size: 10px;
		block-size: 10px;
		border-radius: 50%;
		background: var(--control-edge);
	}

	.dot.on {
		background: var(--accent);
		transform: scale(1.25);
	}

	.dot.done {
		background: var(--leaf);
	}

	.card {
		display: grid;
		justify-items: center;
		gap: 12px;
		min-block-size: 250px;
		padding: 24px 16px;
		border: 2px solid var(--control-edge);
		border-radius: 18px;
		background: var(--control);
		align-content: center;
	}

	.kind {
		margin: 0;
		color: var(--ink-faint);
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.de {
		margin: 0;
		font-family: var(--font-display);
		font-size: clamp(1.7rem, 7vw, 2.2rem);
		font-weight: 700;
		line-height: 1.25;
		overflow-wrap: anywhere;
	}

	.play {
		inline-size: 64px;
		block-size: 64px;
		border: 2px solid var(--accent);
		border-radius: 50%;
		background: var(--accent-wash);
		font-size: 1.6rem;
		cursor: pointer;
	}

	.reveal {
		min-block-size: 48px;
		padding: 10px 22px;
		border: 2px solid var(--control-edge);
		border-radius: 12px;
		background: var(--paper-raised);
		color: var(--ink);
		font: inherit;
		font-weight: 600;
		cursor: pointer;
	}

	.meaning {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--accent-deep);
	}

	.say-step {
		display: grid;
		justify-items: center;
		gap: 10px;
	}

	.say {
		margin: 0;
		color: var(--ink-soft);
		font-size: 0.95rem;
	}

	.mic-row {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.mic {
		inline-size: 72px;
		block-size: 72px;
		border: none;
		border-radius: 50%;
		background: var(--accent);
		color: white;
		font-size: 30px;
		cursor: pointer;
	}

	.mic.on {
		background: var(--miss);
	}

	.skip,
	.back {
		min-block-size: 44px;
		padding: 0 14px;
		border: 0;
		background: none;
		color: var(--ink);
		font: inherit;
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}

	.status {
		margin: 0;
		font-weight: 700;
	}

	.status.good {
		color: var(--leaf);
	}

	.status.almost {
		color: var(--ink-soft);
	}

	.words {
		margin: 0;
		font-family: var(--font-display);
		font-size: 1.15rem;
		font-weight: 700;
	}

	.words .ok {
		color: var(--leaf);
	}

	.words .miss {
		color: var(--miss);
		text-decoration: underline;
	}

	.actions {
		position: sticky;
		inset-block-end: 0;
		display: grid;
		gap: 4px;
		justify-items: center;
		margin-block-start: 8px;
		padding-block: 6px;
	}

	.next {
		inline-size: 100%;
		min-block-size: 52px;
		border: none;
		border-radius: 12px;
		background: var(--accent);
		color: var(--on-accent);
		font: inherit;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
	}

	.play:focus-visible,
	.reveal:focus-visible,
	.mic:focus-visible,
	.skip:focus-visible,
	.back:focus-visible,
	.next:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: no-preference) {
		.dot {
			transition: transform 0.15s;
		}
	}
</style>
