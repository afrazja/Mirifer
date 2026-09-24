<script lang="ts">
	import type { Snippet } from "svelte";
	import BrandLogo from "./BrandLogo.svelte";

	let {
		title,
		subtitle,
		icon,
		backHref,
		backLabel = "Home",
		onBack,
		leading,
		actions,
		secondary,
		secondaryLabel = "Page controls",
		sticky = false,
		direction = "ltr",
		variant = "plain",
	}: {
		title?: string;
		subtitle?: string;
		icon?: string;
		backHref?: string;
		backLabel?: string;
		onBack?: () => void;
		leading?: Snippet;
		actions?: Snippet;
		secondary?: Snippet;
		secondaryLabel?: string;
		sticky?: boolean;
		direction?: "ltr" | "rtl";
		/** "brand" = solid green band (lesson chrome from the screenshot).
		 *  "dark"  = near-black ribbon with green-outlined controls, for the
		 *  dashboard and Basics where a pale header washed out. */
		variant?: "plain" | "brand" | "dark";
	} = $props();
</script>

<div
	class="header-stack"
	class:sticky
	class:brand-variant={variant === "brand"}
	class:dark-variant={variant === "dark"}
	dir={direction}
>
	<header class="app-header" class:connected={secondary}>
		<div class="leading">
			{#if leading}
				{@render leading()}
			{:else if onBack}
				<button class="back-control" type="button" onclick={onBack} aria-label={backLabel}>
					<span class="back-arrow" aria-hidden="true">&larr;</span>
					<span>{backLabel}</span>
				</button>
			{:else if backHref}
				<a class="back-control" href={backHref} aria-label={backLabel}>
					<span class="back-arrow" aria-hidden="true">&larr;</span>
					<span>{backLabel}</span>
				</a>
			{:else}
				<a class="brand" href="/home" aria-label="Mirifer home">
					<BrandLogo tone={variant === "plain" ? "auto" : "light"} />
				</a>
			{/if}
		</div>

		{#if title}
			<div class="identity">
				<div class="title-row">
					{#if icon}<span class="title-icon" aria-hidden="true">{icon}</span>{/if}
					<h1>{title}</h1>
				</div>
				{#if subtitle}<p>{subtitle}</p>{/if}
			</div>
		{/if}

		<div class="actions">
			{#if actions}{@render actions()}{/if}
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
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
		align-items: center;
		gap: 16px;
		width: 100%;
		min-height: 68px;
		padding: 12px 16px;
		background: color-mix(in srgb, var(--paper-raised) 94%, var(--paper));
		border: 1px solid var(--line);
		border-radius: 16px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.header-stack.sticky .app-header {
		border-radius: 0 0 16px 16px;
	}

	.app-header.connected,
	.header-stack.sticky .app-header.connected {
		border-radius: 0;
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

	.leading,
	.actions {
		display: flex;
		align-items: center;
		min-width: 0;
	}

	.leading {
		grid-column: 1;
		justify-content: flex-start;
	}

	.actions {
		grid-column: 3;
		justify-content: flex-end;
		gap: 8px;
		flex-wrap: wrap;
	}

	.identity {
		grid-column: 2;
		min-width: 0;
		text-align: center;
	}

	.title-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	h1 {
		margin: 0;
		color: var(--ink);
		font-family: var(--font-display);
		font-size: clamp(1.1rem, 2vw, 1.35rem);
		font-weight: 700;
		line-height: 1.15;
		white-space: nowrap;
	}

	.identity p {
		margin: 3px 0 0;
		color: var(--ink-soft);
		font-size: 0.8rem;
		line-height: 1.25;
	}

	.title-icon {
		font-size: 1.05rem;
		line-height: 1;
	}

	.back-control,
	.brand {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		/* 44px: the minimum touch target. Was 40. */
		min-height: 44px;
		padding: 10px 12px;
		/* Lifted off the page ground so the control is visible as a control —
		   var(--paper) here made it the same colour as the page. */
		border: 1px solid var(--control-border);
		border-radius: 999px;
		background: var(--control);
		color: var(--ink);
		font: inherit;
		font-size: 0.88rem;
		font-weight: 700;
		line-height: 1;
		text-decoration: none;
		cursor: pointer;
		transition: border-color 0.18s, background 0.18s, color 0.18s, transform 0.18s;
	}

	.back-control:hover,
	.brand:hover {
		border-color: var(--accent);
		background: var(--accent-wash);
		color: var(--accent-deep);
	}

	.back-control:active,
	.brand:active {
		transform: translateY(1px);
	}

	[dir="rtl"] .back-arrow {
		transform: rotate(180deg);
	}

	/* ── Brand variant: solid green band, inverted controls ──
	   The lesson chrome from the app screenshot. Controls stay white
	   pills so they read as controls against the colour. */
	.brand-variant .app-header,
	.brand-variant .secondary-toolbar {
		background: var(--brand-surface);
		border-color: var(--brand-surface-deep);
	}

	.brand-variant .app-header {
		box-shadow: none;
	}

	.brand-variant :global(h1),
	.brand-variant .identity p,
	.brand-variant .title-icon {
		color: var(--on-brand);
	}

	.brand-variant .identity p {
		color: var(--on-brand-soft);
	}

	.brand-variant .back-control,
	.brand-variant .brand {
		background: var(--accent-strong, #3ab362);
		border-color: rgba(255, 255, 255, 0.5);
		color: var(--on-brand);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.25),
			0 2px 0 var(--brand-surface-deep);
	}

	.brand-variant .back-control:hover,
	.brand-variant .brand:hover {
		background: #45c470;
		border-color: #ffffff;
		color: var(--on-brand);
	}

	/* Page controls dropped into the toolbar slot (selects, toggles). These
	   sit on their own light pill, so they take ink rather than the band's
	   white. */
	.brand-variant .secondary-toolbar :global(select),
	.brand-variant .secondary-toolbar :global(button) {
		color: var(--ink);
	}

	/* Labels are deliberately NOT coloured here. A slotted label might sit
	   directly on the green band or inside a white pill, and only the page
	   knows which — the lesson has one of each. Forcing --on-brand made the
	   Blind Mode label white on a white pill: 1.00:1, invisible. */

	/* ── Dark variant: near-black ribbon, green-outlined controls ──
	   Used where a pale header made the page look washed out. The green
	   outline is what carries the brand here, since the band itself is
	   neutral. */
	.dark-variant .app-header,
	.dark-variant .secondary-toolbar {
		background: var(--strip);
		border-color: rgba(255, 255, 255, 0.14);
	}

	.dark-variant :global(h1),
	.dark-variant .title-icon {
		color: var(--on-brand);
	}

	.dark-variant .identity p {
		color: var(--on-brand-soft);
	}

	.dark-variant .back-control,
	.dark-variant .brand {
		background: rgba(255, 255, 255, 0.06);
		border: 1.5px solid var(--leaf);
		color: var(--on-brand);
		box-shadow:
			inset 0 1px 0 rgba(255, 255, 255, 0.1),
			0 2px 0 rgba(0, 0, 0, 0.45);
	}

	.dark-variant .back-control:hover,
	.dark-variant .brand:hover {
		background: var(--leaf);
		border-color: var(--leaf);
		color: var(--on-accent);
	}

	/* Page controls dropped into either slot keep a green outline. */
	.dark-variant .actions :global(select),
	.dark-variant .actions :global(button),
	.dark-variant .actions :global(a),
	.dark-variant .secondary-toolbar :global(select),
	.dark-variant .secondary-toolbar :global(button) {
		background: rgba(255, 255, 255, 0.06);
		border: 1.5px solid var(--leaf);
		color: var(--on-brand);
	}

	.dark-variant .secondary-toolbar :global(label) {
		color: var(--on-brand-soft);
	}


	.header-stack .brand,
	.header-stack .brand:hover {
		--brand-logo-width: 132px;
		padding: 0;
		border: 0;
		border-radius: 0;
		background: transparent;
		box-shadow: none;
	}

	/* Whatever a page drops into the toolbar slot. This beats the page's own
	   rule on specificity, so 40px here quietly capped every slotted control
	   in the app below the 44px minimum target — the page could not opt out. */
	.actions :global(select),
	.actions :global(button),
	.actions :global(a) {
		min-height: 44px;
	}

	@media (max-width: 760px) {
		.app-header {
			grid-template-columns: auto minmax(0, 1fr) auto;
			gap: 8px;
			min-height: 60px;
			padding: 9px 10px;
			border-radius: 14px;
		}

		.header-stack.sticky .app-header {
			border-radius: 0 0 14px 14px;
		}

		.app-header.connected,
		.header-stack.sticky .app-header.connected {
			border-radius: 0;
		}

		.secondary-toolbar {
			min-height: 48px;
			padding: 8px 10px;
			border-radius: 0 0 14px 14px;
		}

		h1 {
			max-width: 42vw;
			overflow: hidden;
			font-size: 1.05rem;
			text-overflow: ellipsis;
		}

		.identity p {
			display: none;
		}

		.back-control,
		.brand {
			min-height: 44px;
			padding: 10px 10px;
			font-size: 0.8rem;
		}

		.header-stack .brand {
			--brand-logo-width: 112px;
		}

	}

	@media (max-width: 440px) {
		.back-control {
			width: 44px;
			padding-inline: 8px;
		}

		.back-control > span:last-child {
			display: none;
		}
	}
</style>
