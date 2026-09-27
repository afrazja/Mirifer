<script lang="ts">
	import { onMount } from "svelte";
	import BrandLogo from "./BrandLogo.svelte";
	import Icon from "./Icon.svelte";

	let { language = "en", dueReviews = 0, onSignOut }: {
		language?: "en" | "fa";
		dueReviews?: number;
		onSignOut: () => void | Promise<void>;
	} = $props();
	const menuId = $props.id();
	let drawer: HTMLDialogElement;
	let trigger: HTMLButtonElement;
	let open = $state(false);
	let signingOut = $state(false);

	function closeMenu() { drawer?.close(); }
	function openMenu() { drawer.showModal(); open = true; }
	async function signOut() {
		if (signingOut) return;
		signingOut = true;
		try { await onSignOut(); }
		finally { signingOut = false; }
	}

	onMount(() => {
		const desktop = window.matchMedia("(min-width: 1080px)");
		const handleResize = () => { if (desktop.matches) closeMenu(); };
		desktop.addEventListener("change", handleResize);
		return () => desktop.removeEventListener("change", handleResize);
	});
</script>

{#snippet navigation()}
	<nav class="primary-nav" aria-label={language === "fa" ? "بخش‌های داشبورد" : "Dashboard sections"}>
		<a class="nav-item current" href="/home" aria-current="page" onclick={closeMenu}>
			<span aria-hidden="true">◆</span>{language === "fa" ? "امروز" : "Today"}
		</a>
		<a class="nav-item" href="/lessons" onclick={closeMenu}>
			<span aria-hidden="true">▸</span>{language === "fa" ? "همه درس‌ها" : "All lessons"}
		</a>
		{#if dueReviews > 0}
			<a class="nav-item" href="/review" onclick={closeMenu}>
				<span aria-hidden="true">↻</span>{language === "fa" ? "مرورها" : "Reviews"}
				<em class="review-count">{dueReviews}</em>
			</a>
		{/if}
		<a class="nav-item" href={language === "fa" ? "/fa/basics" : "/basics"} onclick={closeMenu}>
			<span aria-hidden="true">▤</span>{language === "fa" ? "گرامر آلمانی" : "German Basics"}
		</a>
		<a class="nav-item" href="/vocabulary" onclick={closeMenu}>
			<span aria-hidden="true">★</span>{language === "fa" ? "کلمه‌های ذخیره‌شده" : "Saved words"}
		</a>
	</nav>
	<nav class="account-nav" aria-label={language === "fa" ? "حساب کاربری" : "Account"}>
		<a class="nav-item" href="/settings" onclick={closeMenu}>
			<Icon name="gear" size={17} /><span>{language === "fa" ? "تنظیمات" : "Settings"}</span>
		</a>
		<button class="nav-item sign-out" type="button" onclick={signOut} disabled={signingOut}>
			<span aria-hidden="true">⎋</span><span>{language === "fa" ? "خروج" : "Sign out"}</span>
		</button>
	</nav>
{/snippet}

<aside class="desktop-sidebar" aria-label={language === "fa" ? "منوی کناری" : "Side menu"}>
	{@render navigation()}
</aside>

<div class="mobile-bar">
	<button class="menu-button" type="button" bind:this={trigger} onclick={openMenu}
		aria-expanded={open} aria-controls={menuId} aria-haspopup="dialog">
		<span aria-hidden="true">☰</span>{language === "fa" ? "منو" : "Menu"}
	</button>
</div>

<dialog class="mobile-drawer" id={menuId} bind:this={drawer}
	aria-label={language === "fa" ? "منوی کناری" : "Side menu"}
	onclose={() => { open = false; if (trigger?.getClientRects().length) trigger.focus(); }}
	onpointerdown={(event) => {
		if (event.target !== drawer) return;
		const bounds = drawer.getBoundingClientRect();
		if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeMenu();
	}}>
	<div class="drawer-header">
		<a href="/" class="brand" aria-label="Mirifer home" onclick={closeMenu}><BrandLogo /></a>
		<button class="close-button" type="button" onclick={closeMenu} aria-label={language === "fa" ? "بستن منو" : "Close menu"}>×</button>
	</div>
	{@render navigation()}
</dialog>

<style>
	.desktop-sidebar { display: none; }
	.brand { display: flex; text-decoration: none; }
	.mobile-bar {
		--brand-logo-width: 160px;
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 16px;
		padding: 24px 24px 0;
	}
	.menu-button, .close-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		min-height: 44px;
		padding: 8px 12px;
		border: 1px solid var(--line);
		border-radius: var(--radius-control);
		background: var(--control);
		color: var(--ink);
		font: inherit;
		cursor: pointer;
	}
	.close-button { min-width: 44px; font-size: 1.5rem; }
	.mobile-drawer {
		--brand-logo-width: 160px;
		inset: 0 auto 0 0;
		margin: 0;
		width: min(320px, calc(100vw - 24px));
		max-width: none;
		height: 100dvh;
		max-height: none;
		padding: 20px;
		border: 0;
		border-inline-end: 1px solid var(--line);
		background: var(--paper);
		color: var(--ink);
		overflow-y: auto;
	}
	.mobile-drawer[open] { display: flex; flex-direction: column; gap: 24px; }
	.mobile-drawer::backdrop { background: rgb(0 0 0 / 50%); }
	.drawer-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
	.primary-nav, .account-nav { display: flex; flex-direction: column; gap: 2px; }
	.account-nav { margin-top: auto; padding-top: 16px; border-top: 1px solid var(--line); }
	.nav-item {
		display: flex;
		align-items: center;
		gap: 10px;
		width: 100%;
		min-height: 44px;
		padding: 10px 12px;
		border: 0;
		border-radius: var(--radius-control);
		background: transparent;
		color: var(--ink-soft);
		font: inherit;
		font-size: 0.94rem;
		text-align: start;
		text-decoration: none;
		cursor: pointer;
	}
	.nav-item > [aria-hidden] { width: 17px; flex: none; text-align: center; }
	.nav-item:hover { background: var(--control-hover); color: var(--ink); }
	.nav-item.current { background: var(--accent-wash); color: var(--accent); font-weight: 600; }
	.nav-item.sign-out { color: var(--miss); }
	.nav-item:disabled { opacity: 0.6; cursor: wait; }
	.review-count { margin-inline-start: auto; padding: 2px 8px; border-radius: var(--radius-pill); background: var(--attention-wash); color: var(--attention); font-size: 0.72rem; font-style: normal; }
	@media (min-width: 1080px) {
		.mobile-bar { display: none; }
		.desktop-sidebar {
			display: flex;
			flex-direction: column;
			gap: 24px;
			position: sticky;
			top: 0;
			height: 100dvh;
			padding: 28px 20px;
			border-inline-end: 1px solid var(--line);
			overflow-y: auto;
		}
	}
	@media (max-width: 380px) {
		.mobile-bar { padding-inline: 16px; gap: 8px; --brand-logo-width: 140px; }
	}
</style>
