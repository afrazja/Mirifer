<script lang="ts">
	/**
	 * The one bottom bar of a focused screen (CLAUDE.md design rule): the main action in thumb
	 * reach, and under it a quiet secondary slot (Skip, Start again, Read it instead). The slot
	 * always keeps its height, so the main button never moves from one screen to the next.
	 */
	let { label, onclick, disabled = false, icon = null, recording = false, secondary = null, suffix = '' }: {
		label: string;
		onclick: () => void;
		disabled?: boolean;
		icon?: 'mic' | 'pause' | 'play' | 'stop' | 'send' | null;
		/** The main button while recording (the attention colour). */
		recording?: boolean;
		secondary?: { label: string; onclick: () => void } | null;
		/** Shown after the label but hidden from screen readers (a countdown). */
		suffix?: string;
	} = $props();
</script>

<div class="bar">
	<button class="primary" class:recording type="button" {onclick} {disabled}>
		{#if icon === 'mic'}<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0M12 17v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
		{:else if icon === 'pause'}<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" /><rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" /></svg>
		{:else if icon === 'play'}<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></svg>
		{:else if icon === 'stop'}<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" /></svg>
		{:else if icon === 'send'}<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" class="flip"><path d="M4 12 20 4l-4 16-4-6-8-2Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" /></svg>{/if}
		<span>{label}</span>{#if suffix}<span aria-hidden="true">{suffix}</span>{/if}
	</button>
	<div class="second">
		{#if secondary}<button class="quiet" type="button" onclick={secondary.onclick}>{secondary.label}</button>{/if}
	</div>
</div>

<style>
	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 20; padding: 12px 20px calc(6px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 30%); }
	.primary { display: flex; align-items: center; justify-content: center; gap: 10px; inline-size: 100%; max-inline-size: 680px; margin-inline: auto; min-height: 54px; border: 0; border-radius: 14px; background: var(--accent); color: var(--on-accent); font: inherit; font-size: 1.05rem; font-weight: 600; cursor: pointer; }
	.primary:disabled { opacity: .5; cursor: default; }
	.primary.recording { background: var(--attention); }
	.second { display: grid; place-items: center; min-block-size: 48px; }
	.quiet { min-height: 44px; padding: 8px 12px; border: 0; background: none; color: var(--ink-soft); font: inherit; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	button:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	:global([dir='rtl']) .flip { transform: scaleX(-1); }
</style>
