<script lang="ts">
	/**
	 * The landing pages' header, English and Persian.
	 *
	 * Always visible, on every screen size: the logo, Log in and Sign up. On
	 * tablets the rest (page sections, the free trial, the other language and
	 * Install app) lives in the Menu button; phones have no Menu button.
	 * On wide screens the sections and Install app sit in the bar itself.
	 *
	 * The English page opens its sign-in dialog, so it passes `onLogin` and
	 * `onSignup`; without them the buttons link to /login.
	 */
	import { onMount } from "svelte";
	import BrandLogo from "./BrandLogo.svelte";
	import InstallAppButton from "./InstallAppButton.svelte";

	let {
		lang = "en",
		isAuthenticated = false,
		scrolled = false,
		onLogin,
		onSignup,
	}: {
		lang?: "en" | "fa";
		isAuthenticated?: boolean;
		scrolled?: boolean;
		onLogin?: () => void;
		onSignup?: () => void;
	} = $props();

	const fa = $derived(lang === "fa");
	const sections = [
		{ href: "#session", label: "The session" },
		{ href: "#method", label: "Method" },
		{ href: "#faq", label: "FAQ" },
	];

	let menuOpen = $state(false);
	let root: HTMLElement | undefined = $state();

	onMount(() => {
		const outside = (event: Event) => {
			if (menuOpen && root && !root.contains(event.target as Node)) menuOpen = false;
		};
		const escape = (event: KeyboardEvent) => {
			if (event.key === "Escape" && menuOpen) {
				menuOpen = false;
				root?.querySelector<HTMLElement>(".menu-btn")?.focus();
			}
		};
		document.addEventListener("pointerdown", outside);
		document.addEventListener("keydown", escape);
		return () => {
			document.removeEventListener("pointerdown", outside);
			document.removeEventListener("keydown", escape);
		};
	});
</script>

<nav class="navbar" class:scrolled dir={fa ? "rtl" : "ltr"} lang={fa ? "fa" : "en"} bind:this={root}>
	<a href={fa ? "/fa" : "/"} class="brand" aria-label={fa ? "میریفر، صفحهٔ اصلی" : "Mirifer home"}>
		<BrandLogo />
	</a>

	{#if !fa}
		<div class="nav-links">
			{#each sections as section}
				<a href={section.href}>{section.label}</a>
			{/each}
		</div>
	{/if}

	<div class="navbar-right">
		<a href={fa ? "/" : "/fa"} class="lang-link" lang={fa ? "en" : "fa"} hreflang={fa ? "en" : "fa"}>
			{fa ? "English" : "فارسی"}
		</a>
		<span class="install-desktop"><InstallAppButton {lang} /></span>

		{#if isAuthenticated}
			<a href="/home" class="btn btn-primary">{fa ? "رفتن به درس‌ها ←" : "Open app →"}</a>
		{:else}
			{#if onLogin}
				<button type="button" class="btn btn-login" onclick={onLogin}>{fa ? "ورود" : "Log in"}</button>
			{:else}
				<a href="/login" class="btn btn-login">{fa ? "ورود" : "Log in"}</a>
			{/if}
			{#if onSignup}
				<button type="button" class="btn btn-primary" onclick={onSignup}>{fa ? "ثبت‌نام" : "Sign up"}</button>
			{:else}
				<a href="/login?mode=signup" class="btn btn-primary">{fa ? "ثبت‌نام" : "Sign up"}</a>
			{/if}
		{/if}

		<button
			type="button"
			class="menu-btn"
			aria-expanded={menuOpen}
			aria-controls="landing-menu"
			aria-label={fa ? "منو" : "Menu"}
			onclick={() => (menuOpen = !menuOpen)}
		>
			<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
				{#if menuOpen}
					<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" />
				{:else}
					<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none" />
				{/if}
			</svg>
		</button>
	</div>

	{#if menuOpen}
		<div class="menu" id="landing-menu">
			{#if !fa}
				{#each sections as section}
					<a href={section.href} onclick={() => (menuOpen = false)}>{section.label}</a>
				{/each}
			{/if}
			<a href="/try" onclick={() => (menuOpen = false)}>
				{fa ? "امتحان رایگان یک درس، بدون ثبت‌نام" : "Try a lesson — no signup"}
			</a>
			<a href={fa ? "/" : "/fa"} lang={fa ? "en" : "fa"} hreflang={fa ? "en" : "fa"} onclick={() => (menuOpen = false)}>
				{fa ? "English" : "فارسی"}
			</a>
			<InstallAppButton {lang} variant="menu" />
		</div>
	{/if}
</nav>

<style>
	.navbar {
		position: sticky;
		top: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 20px;
		padding: 18px 40px;
		background: color-mix(in srgb, var(--paper) 92%, transparent);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid transparent;
		transition: border-color 0.2s, padding 0.2s;
	}

	.navbar.scrolled {
		padding: 12px 40px;
		border-bottom-color: var(--line);
	}

	.brand {
		display: flex;
		align-items: center;
		flex: none;
		text-decoration: none;
	}

	.nav-links {
		display: flex;
		gap: 26px;
		font-size: 0.92rem;
	}

	.nav-links a {
		color: var(--ink-soft);
		text-decoration: none;
	}

	.nav-links a:hover {
		color: var(--accent);
	}

	.navbar-right {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.lang-link {
		display: inline-flex;
		align-items: center;
		min-block-size: 44px;
		padding: 0 10px;
		border-radius: var(--radius-control);
		color: var(--ink-soft);
		font-weight: 600;
		font-size: 0.95rem;
		text-decoration: none;
		white-space: nowrap;
	}

	.lang-link:hover {
		color: var(--accent);
		background: var(--accent-wash);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		min-block-size: 44px;
		padding: 10px 20px;
		border: 1px solid transparent;
		border-radius: var(--radius-pill);
		font: inherit;
		font-size: 0.92rem;
		font-weight: 600;
		text-decoration: none;
		white-space: nowrap;
		cursor: pointer;
	}

	/* Both are clearly buttons: Log in outlined, Sign up filled. */
	.btn-login {
		border-color: var(--control-border);
		background: var(--control);
		color: var(--ink);
	}

	.btn-login:hover {
		border-color: var(--accent);
		background: var(--accent-wash);
		color: var(--accent-deep);
	}

	.btn-primary {
		background: var(--accent);
		color: var(--on-accent);
	}

	.btn-primary:hover {
		background: var(--accent-deep);
	}

	.btn:focus-visible,
	.menu-btn:focus-visible,
	.brand:focus-visible,
	.lang-link:focus-visible,
	.menu a:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.menu-btn {
		display: none;
		align-items: center;
		justify-content: center;
		inline-size: 44px;
		block-size: 44px;
		border: 1px solid var(--control-border);
		border-radius: 12px;
		background: var(--control);
		color: var(--ink);
		cursor: pointer;
	}

	.menu {
		position: absolute;
		inset-block-start: 100%;
		inset-inline: 12px;
		display: none;
		flex-direction: column;
		gap: 2px;
		padding: 8px;
		border: 1px solid var(--line);
		border-radius: 14px;
		background: var(--paper-raised);
		box-shadow: 0 14px 40px rgb(0 0 0 / 0.16);
	}

	.menu a {
		display: flex;
		align-items: center;
		min-block-size: 44px;
		padding: 8px 12px;
		border-radius: 10px;
		color: var(--ink);
		font-size: 0.95rem;
		text-decoration: none;
	}

	.menu a:hover {
		background: var(--accent-wash);
		color: var(--accent-deep);
	}

	/* Below wide screens the sections, language and Install move into the
	   Menu; Log in and Sign up stay in the bar. */
	@media (max-width: 1000px) {
		.nav-links,
		.lang-link,
		.install-desktop {
			display: none;
		}

		.menu-btn {
			display: inline-flex;
		}

		.menu {
			display: flex;
		}
	}

	/* Phones: no Menu button. The free trial and the language links are on the page itself. */
	@media (max-width: 640px) {
		.menu-btn,
		.menu {
			display: none;
		}

		.navbar,
		.navbar.scrolled {
			padding: 10px 14px;
			gap: 8px;
		}

		.brand {
			--brand-logo-width: 104px;
		}

		.navbar-right {
			gap: 6px;
		}

		.btn {
			padding: 8px 14px;
			font-size: 0.88rem;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.navbar {
			transition: none;
		}
	}
</style>
