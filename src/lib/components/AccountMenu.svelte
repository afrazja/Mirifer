<script lang="ts">
	/**
	 * The account menu in every app header: My languages, Settings, Sign out.
	 * Signed-out visitors get a Sign in link instead.
	 */
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { signOut } from '$services/auth';

	let { isFa = false }: { isFa?: boolean } = $props();
	let open = $state(false), signingOut = $state(false);
	let root: HTMLDivElement | undefined = $state();
	const user = $derived(page.data?.user as { email?: string; user_metadata?: Record<string, unknown> } | null | undefined);
	const name = $derived(String(user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.email || ''));
	const initial = $derived((name.trim()[0] ?? 'M').toUpperCase());
	const avatar = $derived(typeof user?.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url as string : '');

	onMount(() => {
		const close = (event: Event) => { if (open && root && !root.contains(event.target as Node)) open = false; };
		const escape = (event: KeyboardEvent) => { if (event.key === 'Escape' && open) { open = false; root?.querySelector('button')?.focus(); } };
		document.addEventListener('pointerdown', close);
		document.addEventListener('keydown', escape);
		return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
	});

	async function leave() {
		signingOut = true;
		try { await signOut(); } finally { open = false; signingOut = false; await goto('/login', { invalidateAll: true }); }
	}
</script>

{#if user}
	<div class="account-menu" bind:this={root}>
		<button type="button" class="trigger" aria-haspopup="menu" aria-expanded={open} aria-label={isFa ? 'منوی حساب' : 'Account menu'} onclick={() => (open = !open)}>
			<span class="avatar" aria-hidden="true">{#if avatar}<img src={avatar} alt="" />{:else}{initial}{/if}</span>
			<span class="caret" aria-hidden="true">▾</span>
		</button>
		{#if open}
			<div class="menu" role="menu" dir={isFa ? 'rtl' : 'ltr'}>
				{#if name}<p class="who">{name}</p>{/if}
				<a role="menuitem" href="/languages" onclick={() => (open = false)}>{isFa ? 'زبان‌های من' : 'My languages'}</a>
				<a role="menuitem" href="/settings" onclick={() => (open = false)}>{isFa ? 'تنظیمات' : 'Settings'}</a>
				<button role="menuitem" type="button" onclick={leave} disabled={signingOut}>{signingOut ? (isFa ? 'در حال خروج…' : 'Signing out…') : (isFa ? 'خروج از حساب' : 'Sign out')}</button>
			</div>
		{/if}
	</div>
{:else}
	<a class="sign-in" href="/login">{isFa ? 'ورود' : 'Sign in'}</a>
{/if}

<style>
	.account-menu { position: relative; }
	.trigger { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 4px 10px 4px 4px; border: 1px solid var(--control-border); border-radius: 999px; background: var(--control); color: var(--ink); cursor: pointer; font: inherit; }
	.trigger:hover { border-color: var(--accent); }
	.trigger:focus-visible, .menu a:focus-visible, .menu button:focus-visible, .sign-in:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; }
	.avatar { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; overflow: hidden; background: var(--accent-wash); color: var(--accent-deep); font-weight: 700; font-size: .95rem; }
	.avatar img { width: 100%; height: 100%; object-fit: cover; }
	.caret { font-size: .7rem; color: var(--ink-soft); }
	.menu { position: absolute; inset-inline-end: 0; top: calc(100% + 8px); z-index: 200; min-width: 200px; padding: 6px; border: 1px solid var(--control-border); border-radius: 12px; background: var(--paper-raised); box-shadow: 0 10px 30px rgb(0 0 0 / .14); display: grid; }
	.who { margin: 0; padding: 8px 12px 10px; border-bottom: 1px solid var(--line); margin-bottom: 4px; color: var(--ink-soft); font-size: .8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px; }
	.menu a, .menu button { display: block; width: 100%; min-height: 44px; padding: 11px 12px; border: 0; border-radius: 8px; background: none; color: var(--ink); font: inherit; font-size: .92rem; text-align: start; text-decoration: none; cursor: pointer; }
	.menu a:hover, .menu button:hover { background: var(--accent-wash); color: var(--accent-deep); }
	.menu button { color: var(--miss, #b3261e); }
	.sign-in { display: inline-flex; align-items: center; min-height: 44px; padding: 8px 14px; border: 1px solid var(--accent); border-radius: 999px; color: var(--accent-deep); font-weight: 600; text-decoration: none; }
</style>
