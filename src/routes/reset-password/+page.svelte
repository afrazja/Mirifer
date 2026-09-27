<script lang="ts">
	/**
	 * Choose a new password after following a reset link.
	 *
	 * The link goes through /proxy/auth/callback, which exchanges the code
	 * for a session before redirecting here — so by the time this page
	 * loads, updatePassword() has the session it needs. That is the whole
	 * reason the flow routes through the callback rather than landing here
	 * directly.
	 *
	 * If there is no session the link was stale, already used, or opened
	 * after expiry. Saying so plainly beats a form that fails on submit.
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import * as auth from '$services/auth';

	let checking = $state(true);
	let hasSession = $state(false);
	let password = $state('');
	let confirm = $state('');
	let saving = $state(false);
	let error = $state('');
	let done = $state(false);

	onMount(async () => {
		hasSession = await auth.isAuthenticated();
		checking = false;
	});

	async function submit() {
		error = '';
		if (password.length < 6) {
			error = 'Password must be at least 6 characters.';
			return;
		}
		if (password !== confirm) {
			error = 'Passwords do not match.';
			return;
		}
		saving = true;
		const res = await auth.updatePassword(password);
		saving = false;
		if (res.error) {
			error = res.error;
			return;
		}
		done = true;
		// Already signed in by the code exchange, so straight into the app.
		setTimeout(() => goto('/languages'), 1200);
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Enter') submit();
	}
</script>

<svelte:head>
	<title>Choose a new password | Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="wrap">
	<div class="card">
		{#if checking}
			<p class="muted">Checking your link…</p>
		{:else if done}
			<h1>Password updated</h1>
			<p class="muted">Taking you to your lessons…</p>
		{:else if !hasSession}
			<h1>This link has expired</h1>
			<p class="muted">
				Reset links can only be used once, and they stop working after a
				while. Ask for a new one and it will arrive in a moment.
			</p>
			<a class="btn" href="/login">Back to sign in</a>
		{:else}
			<h1>Choose a new password</h1>
			<p class="muted">Then you'll be signed in automatically.</p>

			{#if error}<div class="error">{error}</div>{/if}

			<label for="pw">New password</label>
			<input
				id="pw"
				type="password"
				bind:value={password}
				placeholder="Min. 6 characters"
				autocomplete="new-password"
				onkeydown={onKey}
			/>

			<label for="pw2">Confirm password</label>
			<input
				id="pw2"
				type="password"
				bind:value={confirm}
				placeholder="Type it again"
				autocomplete="new-password"
				onkeydown={onKey}
			/>

			<button class="btn primary" onclick={submit} disabled={saving}>
				{saving ? 'Saving…' : 'Save new password'}
			</button>
		{/if}
	</div>
</main>

<style>
	.wrap {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		background: var(--paper);
		color: var(--ink);
		font-family: var(--font-body);
	}

	.card {
		inline-size: 100%;
		max-inline-size: 400px;
		background: var(--paper-raised);
		border: 1px solid var(--line);
		border-radius: 16px;
		padding: 30px 26px;
	}

	h1 {
		font-family: var(--font-display);
		font-size: 1.4rem;
		margin: 0 0 8px;
	}

	.muted {
		color: var(--ink-soft);
		line-height: 1.7;
		margin: 0 0 18px;
	}

	label {
		display: block;
		font-size: 0.85rem;
		font-weight: 700;
		margin-bottom: 6px;
	}

	input {
		inline-size: 100%;
		box-sizing: border-box;
		min-block-size: 44px;
		padding: 10px 14px;
		margin-bottom: 14px;
		border: 1px solid var(--control-border);
		border-radius: 10px;
		background: var(--control);
		color: var(--ink);
		font: inherit;
	}

	.btn {
		display: flex;
		align-items: center;
		justify-content: center;
		inline-size: 100%;
		min-block-size: 46px;
		border-radius: 10px;
		border: 1px solid var(--control-border);
		background: var(--control);
		color: var(--ink);
		font: inherit;
		font-weight: 700;
		text-decoration: none;
		cursor: pointer;
	}

	.btn.primary {
		background: var(--accent);
		color: var(--on-accent);
		border-color: transparent;
	}

	.btn:disabled {
		opacity: 0.65;
		cursor: wait;
	}

	.error {
		background: color-mix(in srgb, var(--accent) 12%, var(--paper-sunken));
		border-inline-start: 3px solid var(--accent);
		border-radius: 8px;
		padding: 10px 12px;
		margin-bottom: 14px;
		font-size: 0.9rem;
	}
</style>
