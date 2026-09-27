<script lang="ts">
	import { goto } from "$app/navigation";
	import GoogleSignIn from "$components/GoogleSignIn.svelte";
	import BrandLogo from "$lib/components/BrandLogo.svelte";
	import { onMount } from "svelte";
	import * as auth from "$services/auth";
	import * as dataLayer from "$services/data-layer";

	let mode = $state<"signin" | "signup" | "reset">("signin");
	/** Set once a reset mail has gone out, so the form is replaced by advice. */
	let resetSent = $state(false);

	/**
	 * Deep links: ?mode=signup from the guest demo win screen, ?mode=reset
	 * from the sign-in modals on / and /home.
	 *
	 * Those modals are separate forms from this page — which is why adding
	 * "Forgot your password?" here alone left it invisible to anyone who
	 * signed in from the landing page. They link here rather than each
	 * growing their own copy of the reset flow.
	 */
	onMount(() => {
		const m = new URLSearchParams(location.search).get("mode");
		if (m === "signup" || m === "reset") mode = m;
	});
	let email = $state("");
	let password = $state("");
	let name = $state("");
	let error = $state("");
	let loading = $state(false);
	let emailSent = $state(false);

	function toggleMode() {
		mode = mode === "signin" ? "signup" : "signin";
		error = "";
		emailSent = false;
		resetSent = false;
	}

	function showReset() {
		mode = "reset";
		error = "";
		resetSent = false;
	}

	/**
	 * Ask for a reset link.
	 *
	 * The reply is deliberately the same whether or not the address has an
	 * account. Saying "no account with that email" turns this form into a
	 * way to test which of your users exist, and Supabase does not report
	 * the difference either.
	 */
	async function sendReset() {
		error = "";
		if (!email.trim()) {
			error = "Please enter your email.";
			return;
		}
		loading = true;
		const res = await auth.sendPasswordReset(email.trim());
		loading = false;
		if (res.error) {
			error = res.error;
			return;
		}
		resetSent = true;
	}

	async function submit() {
		if (mode === "reset") return sendReset();
		error = "";
		if (!email.trim() || !password) {
			error = "Please enter email and password.";
			return;
		}
		loading = true;
		try {
			let result;
			if (mode === "signup") {
				result = await auth.signUp(
					email.trim(),
					password,
					name.trim() || "Learner",
				);
			} else {
				result = await auth.signIn(email.trim(), password);
			}
			if (result.error) {
				error = result.error;
			} else if (mode === "signup" && !(await auth.getSession())) {
				// Email confirmation required — no active session yet
				emailSent = true;
			} else {
				// Everyone lands on My languages; a new learner picks a course there.
				goto("/languages");
				// Fire-and-forget after navigation
				if (result.user) auth.ensureProfile(result.user);
				dataLayer.syncOnLogin();
			}
		} catch (e: any) {
			error = e.message || "An error occurred.";
		} finally {
			loading = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Enter") submit();
	}
</script>

<svelte:head>
	<title>Sign In – Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="login-page">

	<span id="main-content" tabindex="-1" class="sr-only"></span>
	<div class="login-card">
		<div class="brand">
			<BrandLogo />
		</div>

		{#if emailSent}
			<div class="email-sent">
				<div class="email-sent-icon">📬</div>
				<h1>Check your email</h1>
				<p>
					We sent a confirmation link to <b>{email}</b>. Tap it to
					activate your account, then come back and sign in.
				</p>
				<button class="ghost-btn" onclick={toggleMode}>
					← Back to sign in
				</button>
			</div>
		{:else}
			<h1>
				{mode === "reset"
					? "Reset your password"
					: mode === "signin"
						? "Welcome back"
						: "Create your account"}
			</h1>
			<p class="subtitle">
				{mode === "reset"
					? "We'll email you a link to choose a new one."
					: mode === "signin"
						? "Sign in to continue learning German."
						: "Free during early access — no credit card."}
			</p>

			{#if error}
				<div class="error">{error}</div>
			{/if}

			<!--
				Google leads, the password form follows.

				56 accounts exist and roughly three in four have never signed
				in — they entered an email, never confirmed it, and were never
				seen again. Google skips the confirmation round-trip entirely:
				no password to invent, no inbox to visit, no way to be lost
				between the two.

				This page had no Google option at all until now, which is the
				worst place for that gap: it is where the level test and
				/placement send people, so the highest-intent signups met
				nothing but the wall.
			-->
			{#if mode !== "reset"}
				<GoogleSignIn
					position="above"
					next="/languages"
					onError={(m) => (error = m)}
				/>
			{/if}

			{#if mode === "signup"}
				<label for="login-name">Name</label>
				<input
					id="login-name"
					type="text"
					bind:value={name}
					placeholder="Your name"
					autocomplete="name"
					onkeydown={handleKeydown}
				/>
			{/if}

			<label for="login-email">Email</label>
			<input
				id="login-email"
				type="email"
				bind:value={email}
				placeholder="you@example.com"
				autocomplete="username"
				onkeydown={handleKeydown}
			/>

			{#if mode !== "reset"}
				<label for="login-password">Password</label>
				<input
					id="login-password"
					type="password"
					bind:value={password}
					placeholder={mode === "signup" ? "Min. 6 characters" : "Password"}
					autocomplete={mode === "signup"
						? "new-password"
						: "current-password"}
					onkeydown={handleKeydown}
				/>
			{/if}

			{#if mode === "reset" && resetSent}
				<!-- Same wording whether or not the address has an account.
				     Confirming which emails exist would turn this into a user
				     directory, and Supabase does not distinguish either. -->
				<p class="sent-note">
					If there's an account for <strong>{email.trim()}</strong>, a
					reset link is on its way. It expires after a while and works
					once — check spam if it doesn't appear.
				</p>
			{:else}
				<button class="submit-btn" onclick={submit} disabled={loading}>
					{loading
						? "…"
						: mode === "reset"
							? "Send reset link"
							: mode === "signin"
								? "Sign In"
								: "Create Account"}
				</button>
			{/if}

			{#if mode === "signin"}
				<!-- There was no recovery path at all before this: forgetting
				     your password meant asking an admin to reset it by hand. -->
				<button class="link-btn" onclick={showReset}>
					Forgot your password?
				</button>
			{/if}

			<button class="ghost-btn" onclick={toggleMode}>
				{mode === "reset"
					? "Back to sign in"
					: mode === "signin"
						? "New here? Create a free account"
						: "Already have an account? Sign in"}
			</button>
		{/if}
	</div>

	<a href="/" class="site-link">About Mirifer →</a>
</main>

<style>
	:global(body) {
		margin: 0;
	}

	.login-page {
		min-height: 100vh;
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 18px;
		padding: 24px 16px;
		box-sizing: border-box;
		background: var(--paper);
		font-family: var(--font-body);
	}

	.login-card {
		width: 100%;
		max-width: 400px;
		background: var(--paper-raised);
		border: 1px solid var(--line);
		border-radius: 20px;
		box-shadow: var(--paper-shadow);
		padding: 34px 30px;
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 22px;
	}



	h1 {
		font-family: var(--font-display);
		margin: 0 0 6px;
		font-size: 1.55rem;
		color: var(--ink);
	}

	.subtitle {
		margin: 0 0 20px;
		color: var(--ink-soft);
		font-size: 0.92rem;
	}

	.error {
		background: rgba(233, 69, 96, 0.15);
		border: 1px solid rgba(233, 69, 96, 0.5);
		color: #ff8a9b;
		border-radius: 10px;
		padding: 10px 14px;
		font-size: 0.87rem;
		margin-bottom: 14px;
	}

	label {
		font-size: 0.78rem;
		color: var(--ink-soft);
		margin: 10px 0 6px;
	}

	input {
		background: var(--paper-sunken);
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 13px 15px;
		color: var(--ink);
		font-size: 1rem;
	}

	input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.submit-btn {
		margin-top: 22px;
		background: var(--accent);
		color: var(--on-accent);
		border: none;
		border-radius: 12px;
		padding: 14px;
		font-size: 1.02rem;
		font-weight: 700;
		cursor: pointer;
		transition: filter 0.2s;
	}

	.submit-btn:hover:not(:disabled) {
		filter: brightness(1.08);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: wait;
	}

	.link-btn {
		display: block;
		inline-size: 100%;
		min-block-size: 44px;
		background: none;
		border: none;
		color: var(--ink-faint);
		font: inherit;
		font-size: 0.88rem;
		text-decoration: underline;
		cursor: pointer;
	}

	.link-btn:hover {
		color: var(--accent);
	}

	.sent-note {
		background: var(--paper-sunken);
		border-radius: 10px;
		padding: 14px 16px;
		color: var(--ink-soft);
		line-height: 1.7;
		font-size: 0.9rem;
	}

	.ghost-btn {
		margin-top: 14px;
		background: none;
		border: none;
		color: var(--ink-soft);
		font-size: 0.88rem;
		cursor: pointer;
		text-decoration: underline;
	}

	.ghost-btn:hover {
		color: var(--accent-deep);
	}

	.email-sent {
		text-align: center;
	}

	.email-sent-icon {
		font-size: 2.6rem;
		margin-bottom: 8px;
	}

	.email-sent p {
		color: var(--ink-soft);
		line-height: 1.6;
		font-size: 0.92rem;
	}

	.site-link {
		color: var(--ink-faint);
		font-size: 0.85rem;
		text-decoration: none;
	}

	.site-link:hover {
		color: var(--ink);
	}
</style>
