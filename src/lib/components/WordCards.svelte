<script lang="ts">
	/**
	 * Pre-teaching, one item at a time: hear it, see it, recall its meaning,
	 * say it aloud. A batch is a few items, so each one gets the learner's full
	 * attention; the quick check that follows makes them retrieve it.
	 */
	import type { TeachItem } from '$services/lesson-plan';

	let {
		items,
		batch,
		of,
		language = 'en',
		play,
		onDone
	}: {
		items: TeachItem[];
		batch: number;
		of: number;
		language?: 'en' | 'fa';
		/** Speak German text. */
		play: (text: string) => void;
		onDone: () => void;
	} = $props();

	const fa = $derived(language === 'fa');
	const t = (en: string, faText: string) => (fa ? faText : en);

	let position = $state(0);
	let revealed = $state(false);
	const item = $derived(items[position]);
	const last = $derived(position === items.length - 1);
	const meaning = $derived(item ? (fa && item.fa) || item.en : '');

	$effect(() => {
		// A new card: hide the meaning and play the item.
		const current = item;
		revealed = false;
		if (current) play(current.de);
	});

	function next() {
		if (last) onDone();
		else position += 1;
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
			<div class="card">
				<p class="kind">{item.phrase ? t('Learn it whole', 'یک‌جا یاد بگیر') : t('Word', 'کلمه')}</p>
				<p class="de" lang="de" dir="ltr">{item.de}</p>
				<button class="play" onclick={() => play(item.de)} aria-label={t('Play again', 'پخش دوباره')}>🔊</button>

				{#if revealed}
					<p class="meaning">{meaning}</p>
					<p class="say">🎙️ {t('Now say it out loud.', 'حالا بلند بگو.')}</p>
				{:else}
					<button class="reveal" onclick={() => (revealed = true)}>{t('What does it mean?', 'یعنی چه؟')}</button>
				{/if}
			</div>
		{/key}
	{/if}

	<div class="actions">
		<button class="next" disabled={!revealed} onclick={next}>
			{last ? t('Quick check →', 'مرور سریع ←') : t('Next →', 'بعدی ←')}
		</button>
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

	.say {
		margin: 0;
		color: var(--ink-soft);
		font-size: 0.95rem;
	}

	.actions {
		position: sticky;
		inset-block-end: 0;
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

	.next:disabled {
		opacity: 0.4;
		cursor: default;
	}

	.play:focus-visible,
	.reveal:focus-visible,
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
