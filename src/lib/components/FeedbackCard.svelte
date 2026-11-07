<script lang="ts">
	/**
	 * One feedback card (owner's rule, 2026-10-31: every part of feedback in its own card, told apart
	 * by colour, stripe and icon without reading the label). The same kinds mean the same thing on
	 * every screen:
	 * - you: what the learner said (grey, person icon);
	 * - fix: the correct way (green, tick);
	 * - ok: no mistakes (green, tick, no body);
	 * - more: a fuller or better answer (blue, sparkle, serif italic text).
	 * The text goes in the default slot; buttons (Hear it, Say it) in `actions`.
	 */
	import type { Snippet } from 'svelte';

	let { kind, label, serif = false, children, actions }: {
		kind: 'you' | 'fix' | 'ok' | 'more';
		label: string;
		/** The text in the display font, italic (the "more" card's model answer). */
		serif?: boolean;
		children?: Snippet;
		actions?: Snippet;
	} = $props();
</script>

<article class="card {kind}">
	<header>
		<span class="icon" aria-hidden="true">
			{#if kind === 'you'}<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4 0-7 2-7 4.5V20h14v-1.5C19 16 16 14 12 14Z" fill="currentColor"/></svg>
			{:else if kind === 'more'}<svg viewBox="0 0 24 24" width="18" height="18"><path d="M12 2l2.2 6.3L20.5 10l-6.3 2.2L12 18.5l-2.2-6.3L3.5 10l6.3-1.7zM19 15l1 2.6 2.6 1-2.6 1L19 22l-1-2.4-2.6-1 2.6-1z" fill="currentColor"/></svg>
			{:else}<svg viewBox="0 0 24 24" width="18" height="18"><path d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7z" fill="currentColor"/></svg>{/if}
		</span>
		<span class="tag">{label}</span>
	</header>
	{#if children}<div class="text" class:serif lang="en" dir="ltr">{@render children()}</div>{/if}
	{#if actions}<div class="actions">{@render actions()}</div>{/if}
</article>

<style>
	.card { display: grid; gap: 8px; padding: 12px 14px 14px; border-radius: var(--radius-card, 18px); background: var(--paper-raised); border: 1px solid var(--line); border-inline-start: 5px solid var(--stripe); box-shadow: var(--paper-shadow); }
	header { display: flex; align-items: center; gap: 8px; }
	.tag { font-size: .78rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--stripe-ink); }
	:global([dir='rtl']) .tag { letter-spacing: normal; }
	.icon { display: grid; place-items: center; inline-size: 28px; block-size: 28px; border-radius: 50%; background: var(--stripe); color: #fff; flex: none; }
	.text { font-size: 1.06rem; line-height: 1.6; text-align: left; color: var(--ink); overflow-wrap: anywhere; }
	.serif { font-family: var(--font-display); font-size: 1.14rem; font-style: italic; }
	.actions { display: flex; flex-wrap: wrap; gap: 8px; }
	.you { --stripe: var(--ink-faint); --stripe-ink: var(--ink-soft); background: var(--paper-sunken); box-shadow: none; }
	.fix, .ok { --stripe: var(--leaf); --stripe-ink: var(--leaf-deep); background: linear-gradient(var(--leaf-wash), var(--leaf-wash)), var(--paper-raised); }
	.more { --stripe: var(--info); --stripe-ink: var(--info); background: linear-gradient(var(--info-wash), var(--info-wash)), var(--paper-raised); }
	/* Marks inside the text: a wrong word (red, struck) and a corrected one (green). */
	.text :global(mark.wrong) { padding: 0 3px; border-radius: 4px; color: inherit; background: color-mix(in srgb, var(--miss) 16%, transparent); text-decoration: line-through 2px var(--miss); }
	.text :global(mark.right) { padding: 0 3px; border-radius: 4px; background: color-mix(in srgb, var(--leaf) 22%, transparent); font-weight: 700; color: var(--leaf-deep); }
</style>
