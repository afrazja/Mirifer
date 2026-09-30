<script lang="ts">
	import { onMount } from "svelte";

	/**
	 * "Install app" — always there on the landing pages, so a visitor can
	 * always find it:
	 * - Chromium browsers with an install prompt: opens the real prompt.
	 * - Everyone else (iPhone Safari, Firefox, a Chromium that has not
	 *   offered the prompt yet): opens short steps for that browser.
	 * Hidden only when the app is already running installed.
	 *
	 * `variant="menu"` is a full-width row for the landing menu; the default
	 * is a pill button whose steps open below it.
	 */
	let { lang = "en", variant = "button" }: { lang?: "en" | "fa"; variant?: "button" | "menu" } = $props();
	const fa = $derived(lang === "fa");

	let deferredPrompt: any = null;
	let installed = $state(false);
	let isIOS = $state(false);
	let showSteps = $state(false);

	onMount(() => {
		const standalone =
			window.matchMedia("(display-mode: standalone)").matches ||
			(navigator as any).standalone === true;
		if (standalone) {
			installed = true;
			return;
		}

		isIOS =
			/iphone|ipad|ipod/i.test(navigator.userAgent) ||
			(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

		const onBeforeInstall = (e: Event) => {
			e.preventDefault();
			deferredPrompt = e;
		};
		const onInstalled = () => {
			installed = true;
			deferredPrompt = null;
		};

		window.addEventListener("beforeinstallprompt", onBeforeInstall);
		window.addEventListener("appinstalled", onInstalled);
		return () => {
			window.removeEventListener("beforeinstallprompt", onBeforeInstall);
			window.removeEventListener("appinstalled", onInstalled);
		};
	});

	async function handleInstall() {
		if (deferredPrompt) {
			deferredPrompt.prompt();
			await deferredPrompt.userChoice;
			deferredPrompt = null;
		} else {
			showSteps = !showSteps;
		}
	}
</script>

{#if !installed}
	<div class="install-wrap" class:menu={variant === "menu"} dir={fa ? "rtl" : "ltr"}>
		<button
			type="button"
			class="install-btn"
			class:menu={variant === "menu"}
			onclick={handleInstall}
			aria-expanded={showSteps}
		>
			<span aria-hidden="true">📲</span>
			{fa ? "نصب برنامه" : "Install app"}
		</button>
		{#if showSteps}
			<div class="steps" role="region" aria-label={fa ? "راهنمای نصب" : "How to install"}>
				<button
					type="button"
					class="steps-close"
					onclick={() => (showSteps = false)}
					aria-label={fa ? "بستن" : "Close"}>✕</button
				>
				{#if isIOS}
					<strong>{fa ? "نصب میریفر روی آیفون یا آیپد:" : "Install Mirifer on your iPhone or iPad:"}</strong>
					<ol>
						{#if fa}
							<li>در Safari روی دکمهٔ <b>Share</b> <span class="share-glyph">⎋</span> بزنید</li>
							<li>پایین بروید و <b>«Add to Home Screen»</b> را بزنید</li>
							<li><b>Add</b> را بزنید — میریفر مثل یک برنامه روی صفحه‌تان می‌آید</li>
						{:else}
							<li>Tap the <b>Share</b> button <span class="share-glyph">⎋</span> in Safari</li>
							<li>Scroll down and tap <b>“Add to Home Screen”</b></li>
							<li>Tap <b>Add</b> — Mirifer appears like a native app</li>
						{/if}
					</ol>
				{:else}
					<strong>{fa ? "نصب میریفر به‌عنوان برنامه:" : "Install Mirifer as an app:"}</strong>
					<ol>
						{#if fa}
							<li>منوی مرورگر را باز کنید (⋮ یا ⋯)</li>
							<li><b>«Install app»</b> یا <b>«Add to Home screen»</b> را بزنید</li>
							<li>اگر این گزینه را نمی‌بینید، با Chrome یا Edge باز کنید</li>
						{:else}
							<li>Open your browser menu (⋮ or ⋯)</li>
							<li>Choose <b>“Install app”</b> or <b>“Add to Home screen”</b></li>
							<li>Not there? Open Mirifer in Chrome or Edge</li>
						{/if}
					</ol>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	.install-wrap {
		position: relative;
		display: inline-block;
	}

	.install-wrap.menu {
		display: block;
	}

	.install-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		min-height: 44px;
		padding: 8px 16px;
		border: 1px solid var(--control-border);
		border-radius: 999px;
		background: var(--control);
		color: var(--ink);
		font: inherit;
		font-size: 0.9rem;
		font-weight: 600;
		white-space: nowrap;
		cursor: pointer;
	}

	.install-btn:hover {
		border-color: var(--accent);
		background: var(--accent-wash);
		color: var(--accent-deep);
	}

	.install-btn:focus-visible,
	.steps-close:focus-visible {
		outline: 3px solid var(--accent);
		outline-offset: 2px;
	}

	.install-btn.menu {
		width: 100%;
		justify-content: flex-start;
		border-color: transparent;
		border-radius: 10px;
		background: transparent;
		padding-inline: 12px;
	}

	.steps {
		position: absolute;
		inset-block-start: calc(100% + 10px);
		inset-inline-end: 0;
		z-index: 60;
		inline-size: 290px;
		padding: 16px 18px;
		border: 1px solid var(--line);
		border-radius: 14px;
		background: var(--paper-raised);
		color: var(--ink);
		font-size: 0.88rem;
		text-align: start;
		box-shadow: 0 14px 40px rgb(0 0 0 / 0.18);
	}

	.install-wrap.menu .steps {
		position: static;
		inline-size: auto;
		margin: 6px 4px 4px;
		box-shadow: none;
		background: var(--paper-sunken);
	}

	.steps strong {
		display: block;
		padding-inline-end: 24px;
	}

	.steps ol {
		margin: 10px 0 0;
		padding-inline-start: 20px;
		line-height: 1.7;
		color: var(--ink-soft);
	}

	.steps-close {
		position: absolute;
		inset-block-start: 6px;
		inset-inline-end: 6px;
		min-inline-size: 36px;
		min-block-size: 36px;
		border: 0;
		background: none;
		color: var(--ink-soft);
		font-size: 0.9rem;
		cursor: pointer;
	}

	.share-glyph {
		display: inline-block;
		transform: rotate(90deg);
	}
</style>
