<script lang="ts">
	/**
	 * The app header, the same on every page.
	 *
	 * Row 1: the logo (always back to My languages) and the account menu.
	 * Row 2, when the page has one: a back link sitting above the page title,
	 * with the page's own controls on the other side. The back link always
	 * shows its label, on phones too, so it reads as "back to X", not as a
	 * bare arrow.
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
	} = $props();

	const hasBack = $derived(!!onBack || !!backHref);
	/** With no back link and no title, the page controls fit on the top row. */
	const pageRow = $derived(hasBack || !!title);
	const isFa = $derived(direction === "rtl");
</script>

{#snippet backContent()}
	<svg class="chevron" viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
		<path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
	<span>{backLabel}</span>
{/snippet}

<div class="header-stack" class:sticky dir={direction}>
	<header class="app-header" class:connected={secondary}>
		<div class="top-row">
			<a class="brand" href="/languages" aria-label={isFa ? "میریفر: زبان‌های من" : "Mirifer: my languages"}>
				<BrandLogo />
			</a>
			<div class="top-end">
				{#if actions && !pageRow}<div class="actions">{@render actions()}</div>{/if}
				{#if menu}<AccountMenu {isFa} />{/if}
			</div>
		</div>

		{#if pageRow}
			<div class="page-row">
				<div class="page-start">
					{#if onBack}
						<button class="back-link" type="button" onclick={onBack} aria-label={isFa ? `بازگشت: ${backLabel}` : `Back to ${backLabel}`}>
							{@render backContent()}
						</button>
					{:else if backHref}
						<a class="back-link" href={backHref} aria-label={isFa ? `بازگشت: ${backLabel}` : `Back to ${backLabel}`}>
							{@render backContent()}
						</a>
					{/if}
					{#if title}
						<div class="title-row">
							{#if icon}<span class="title-icon" aria-hidden="true">{icon}</span>{/if}
							<h1>{title}</h1>
						</div>
						{#if subtitle}<p class="subtitle">{subtitle}</p>{/if}
					{/if}
				</div>
				{#if actions}<div class="actions">{@render actions()}</div>{/if}
			</div>
		{/if}
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
		width: 100%;
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
		border-radius: 16px 16px 0 0;
	}

	.header-stack.sticky .app-header.connected {
		border-radius: 0;
	}

	.top-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		min-height: 60px;
		padding: 8px 12px 8px 16px;
	}

	[dir="rtl"] .top-row {
		padding: 8px 16px 8px 12px;
	}

	.brand {
		--brand-logo-width: 124px;
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		border-radius: 8px;
		text-decoration: none;
	}

	.top-end {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.page-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 6px 16px 12px;
		border-top: 1px solid var(--line);
	}

	.page-start {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		min-width: 0;
	}

	/* A plain text link, not a pill: it is navigation, not an action. The
	   padding keeps a 44px touch target without making it look bigger. */
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		min-height: 44px;
		margin-inline-start: -8px;
		padding: 6px 10px 6px 4px;
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
		padding: 6px 4px 6px 10px;
	}

	.back-link:hover {
		background: var(--accent-wash);
	}

	.back-link span {
		overflow: hidden;
		text-overflow: ellipsis;
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

	.title-row {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		max-width: 100%;
	}

	.back-link + .title-row {
		margin-top: -4px;
	}

	h1 {
		margin: 0;
		overflow: hidden;
		color: var(--ink);
		font-family: var(--font-display);
		font-size: clamp(1.15rem, 2.2vw, 1.4rem);
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
		margin: 2px 0 0;
		color: var(--ink-soft);
		font-size: 0.8rem;
		line-height: 1.3;
	}

	.actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		flex-wrap: wrap;
		gap: 8px;
		flex-shrink: 0;
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
		.app-header,
		.secondary-toolbar {
			border-radius: 14px;
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

		.top-row {
			min-height: 56px;
			padding-block: 6px;
		}

		.brand {
			--brand-logo-width: 108px;
		}

		.page-row {
			padding: 4px 12px 10px 16px;
		}

		[dir="rtl"] .page-row {
			padding: 4px 16px 10px 12px;
		}

		.subtitle {
			display: none;
		}
	}
</style>
