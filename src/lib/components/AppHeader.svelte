<script lang="ts">
	/**
	 * The app header, the same on every page, in one bar:
	 * logo (back to My languages) · back arrow · page title, then the
	 * page's own controls and the account menu at the far end.
	 *
	 * The back link shows its label on wide screens and only the arrow on
	 * phones, where the title beside it says where the learner is. When a
	 * page has controls and the bar is too narrow for a title as well, the
	 * title stays for screen readers only.
	 */
	import type { Snippet } from "svelte";
	import BrandLogo from "./BrandLogo.svelte";
	import AccountMenu from "./AccountMenu.svelte";

	let {
		title,
		subtitle,
		icon,
		backHref,
		backLabel = "Home",
		onBack,
		actions,
		secondary,
		secondaryLabel = "Page controls",
		sticky = false,
		direction = "ltr",
		menu = true,
		logo = true,
	}: {
		title?: string;
		subtitle?: string;
		icon?: string;
		backHref?: string;
		backLabel?: string;
		onBack?: () => void;
		actions?: Snippet;
		secondary?: Snippet;
		secondaryLabel?: string;
		sticky?: boolean;
		direction?: "ltr" | "rtl";
		/** The account menu (My languages, Settings, Sign out). On for every app page. */
		menu?: boolean;
		/** The logo link. On for every page except focus screens such as the lesson. */
		logo?: boolean;
	} = $props();

	const isFa = $derived(direction === "rtl");
	const backName = $derived(isFa ? `بازگشت: ${backLabel}` : `Back to ${backLabel}`);
</script>

{#snippet backContent()}
	<svg class="chevron" viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
		<path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
	<span class="label">{backLabel}</span>
{/snippet}

<div class="header-stack" class:sticky dir={direction}>
	<header class="app-header" class:connected={secondary} class:has-actions={!!actions}>
		{#if logo}
			<a class="brand" href="/languages" aria-label={isFa ? "میریفر: زبان‌های من" : "Mirifer: my languages"}>
				<BrandLogo />
			</a>
		{/if}

		{#if onBack || backHref}
			{#if logo}<span class="sep" aria-hidden="true"></span>{/if}
			{#if onBack}
				<button class="back-link" type="button" onclick={onBack} aria-label={backName}>
					{@render backContent()}
				</button>
			{:else}
				<a class="back-link" href={backHref} aria-label={backName}>
					{@render backContent()}
				</a>
			{/if}
		{/if}

		{#if title}
			<div class="title-block">
				<div class="title-row">
					{#if icon}<span class="title-icon" aria-hidden="true">{icon}</span>{/if}
					<h1>{title}</h1>
				</div>
				{#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
			</div>
		{/if}

		<div class="top-end">
			{#if actions}<div class="actions">{@render actions()}</div>{/if}
			{#if menu}<AccountMenu {isFa} />{/if}
		</div>
	</header>

	{#if secondary}
		<div class="secondary-toolbar" role="toolbar" aria-label={secondaryLabel}>
			{@render secondary()}
		</div>
	{/if}
</div>

<style>
	.header-stack {
		width: 100%;
		flex-shrink: 0;
	}

	.header-stack.sticky {
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.app-header {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		min-height: 60px;
		padding: 8px 12px 8px 16px;
		background: color-mix(in srgb, var(--paper-raised) 94%, var(--paper));
		border: 1px solid var(--line);
		border-radius: 16px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	[dir="rtl"] .app-header {
		padding: 8px 16px 8px 12px;
	}

	.header-stack.sticky .app-header {
		border-radius: 0 0 16px 16px;
	}

	.app-header.connected {
		border-radius: 16px 16px 0 0;
	}

	.header-stack.sticky .app-header.connected {
		border-radius: 0;
	}

	.brand {
		--brand-logo-width: 124px;
		display: inline-flex;
		align-items: center;
		flex: none;
		min-height: 44px;
		border-radius: 8px;
		text-decoration: none;
	}

	.sep {
		flex: none;
		width: 1px;
		height: 24px;
		background: var(--line);
	}

	/* A plain text link, not a pill: it is navigation, not an action. The
	   padding keeps a 44px touch target without making it look bigger. */
	.back-link {
		display: inline-flex;
		align-items: center;
		flex: none;
		gap: 2px;
		min-height: 44px;
		padding: 6px 12px 6px 6px;
		border: 0;
		border-radius: 10px;
		background: none;
		color: var(--accent-deep);
		font: inherit;
		font-size: 0.9rem;
		font-weight: 600;
		line-height: 1.2;
		text-decoration: none;
		cursor: pointer;
	}

	[dir="rtl"] .back-link {
		padding: 6px 6px 6px 12px;
	}

	.back-link:hover {
		background: var(--accent-wash);
	}

	.label {
		white-space: nowrap;
	}

	.chevron {
		flex: none;
	}

	[dir="rtl"] .chevron {
		transform: scaleX(-1);
	}

	.brand:focus-visible,
	.back-link:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.title-block {
		flex: 1 1 auto;
		min-width: 0;
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	h1 {
		margin: 0;
		overflow: hidden;
		color: var(--ink);
		font-family: var(--font-display);
		font-size: clamp(1.1rem, 2.2vw, 1.35rem);
		font-weight: 700;
		line-height: 1.2;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.title-icon {
		font-size: 1.05rem;
		line-height: 1;
	}

	.subtitle {
		margin: 1px 0 0;
		overflow: hidden;
		color: var(--ink-soft);
		font-size: 0.8rem;
		line-height: 1.25;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.top-end {
		display: flex;
		align-items: center;
		flex: none;
		gap: 10px;
		margin-inline-start: auto;
		min-width: 0;
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 8px;
	}

	/* Whatever a page drops into the controls slot keeps a 44px target. */
	.actions :global(select),
	.actions :global(button),
	.actions :global(a) {
		min-height: 44px;
	}

	.secondary-toolbar {
		display: flex;
		align-items: center;
		width: 100%;
		min-height: 52px;
		padding: 8px 16px;
		background: var(--paper-raised);
		border: 1px solid var(--line);
		border-top: 0;
		border-radius: 0 0 16px 16px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.secondary-toolbar > :global(*) {
		width: 100%;
	}

	@media (max-width: 760px) {
		.app-header {
			gap: 8px;
			min-height: 56px;
			padding: 6px 10px 6px 14px;
			border-radius: 14px;
		}

		[dir="rtl"] .app-header {
			padding: 6px 14px 6px 10px;
		}

		.header-stack.sticky .app-header {
			border-radius: 0 0 14px 14px;
		}

		.app-header.connected {
			border-radius: 14px 14px 0 0;
		}

		.header-stack.sticky .app-header.connected {
			border-radius: 0;
		}

		.secondary-toolbar {
			min-height: 48px;
			padding: 8px 12px;
			border-radius: 0 0 14px 14px;
		}

		.brand {
			--brand-logo-width: 104px;
		}

		.subtitle {
			display: none;
		}
	}

	/* Phones: the arrow alone is the back link; the title beside it says where you are. */
	@media (max-width: 600px) {
		.label {
			display: none;
		}

		.back-link,
		[dir="rtl"] .back-link {
			padding: 6px 8px;
		}

		.top-end {
			gap: 8px;
		}
	}

	@media (max-width: 440px) {
		.brand {
			--brand-logo-width: 88px;
		}

		.title-icon {
			display: none;
		}

		/* No room for a title next to the page's controls: screen readers only. */
		.app-header.has-actions .title-block {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip-path: inset(50%);
			white-space: nowrap;
		}
	}
</style>
