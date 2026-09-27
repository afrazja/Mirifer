<script lang="ts">
	/**
	 * Sign in with Google.
	 *
	 * Shared because there are three places to sign in — the dashboard
	 * modal, the landing modal and /login — and a button that looks or
	 * behaves differently in one of them reads as a different, less
	 * trustworthy button.
	 *
	 * Why it is worth having at all: signing up currently means inventing a
	 * password, leaving the app, finding a confirmation mail and coming
	 * back. 24 people have registered and 6 have ever finished a lesson;
	 * everything upstream of that lesson is friction we control.
	 */
	import { signInWithGoogle } from '$services/auth';
	import type { Language } from '$stores/preferences';

	interface Props {
		/** Where to land after Google returns. Same-origin path. */
		next?: string;
		lang?: Language;
		/** Shown when Google or Supabase refuses. */
		onError?: (message: string) => void;
		/**
		 * Which side of the password form this sits on.
		 *
		 * 'below' keeps the divider above the button, reading "…form… or
		 * [Google]". 'above' flips it, so the button leads and the divider
		 * separates it from the form underneath. Getting this wrong prints
		 * a stray "or" as the first thing on the page.
		 */
		position?: 'above' | 'below';
	}

	let { next = '/languages', lang = 'en', onError, position = 'below' }: Props = $props();

	const isFa = $derived(lang === 'fa');
	let busy = $state(false);

	async function go() {
		if (busy) return;
		busy = true;
		const { error } = await signInWithGoogle(next);
		// On success the browser is already navigating to Google, so there
		// is nothing to reset — leaving busy true keeps the button from
		// being pressed twice during the hand-off.
		if (error) {
			busy = false;
			onError?.(error);
		}
	}
</script>

{#snippet divider()}
	<div class="gs-or">
		<span>{isFa ? 'یا' : 'or'}</span>
	</div>
{/snippet}

<div class="gs" class:gs-above={position === 'above'}>
	{#if position === 'below'}{@render divider()}{/if}

	<button class="gs-btn" type="button" onclick={go} disabled={busy}>
		<!-- Google's mark, inline. A remote image would be one more thing
		     that can fail on a slow connection, on the button whose whole
		     job is to look dependable. -->
		<svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
			<path
				fill="#4285F4"
				d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
			/>
			<path
				fill="#34A853"
				d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
			/>
			<path
				fill="#FBBC05"
				d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
			/>
			<path
				fill="#EA4335"
				d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
			/>
		</svg>
		<span>
			{busy
				? isFa
					? 'در حال انتقال…'
					: 'Redirecting…'
				: isFa
					? 'ورود با گوگل'
					: 'Continue with Google'}
		</span>
	</button>

	{#if position === 'above'}{@render divider()}{/if}
</div>

<style>
	.gs {
		margin-top: 14px;
	}

	.gs-or {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 12px;
		color: var(--ink-faint);
		font-size: 0.82rem;
	}

	/* Leading the page rather than trailing a form: no gap above, and the
	   divider below the button instead of over it. */
	.gs-above {
		margin-top: 0;
	}

	.gs-above .gs-or {
		margin-bottom: 0;
		margin-top: 14px;
	}

	.gs-or::before,
	.gs-or::after {
		content: '';
		flex: 1;
		height: 1px;
		background: var(--line);
	}

	/* Google's brand guidance wants their mark on a neutral surface, so this
	   stays white/near-white in both themes rather than taking --control. */
	.gs-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		width: 100%;
		min-height: 44px;
		padding: 10px 16px;
		border: 1px solid var(--control-border);
		border-radius: 10px;
		background: #ffffff;
		color: #1f1f1f;
		font: inherit;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s, border-color 0.15s;
	}

	.gs-btn:hover:not(:disabled) {
		background: #f5f5f5;
		border-color: var(--accent);
	}

	.gs-btn:disabled {
		opacity: 0.65;
		cursor: wait;
	}
</style>
