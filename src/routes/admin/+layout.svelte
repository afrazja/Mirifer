<script lang="ts">
	let { children, data } = $props();
</script>

<!-- The admin interface stays English and LTR independently of the learner's language.
     One page now, so a slim top bar instead of a sidebar: the page keeps the full width. -->
<div class="admin-shell" lang="en" dir="ltr">
	{#if data.authorized}
		<nav class="admin-nav" aria-label="Admin">
			<a href="/admin" class="admin-brand">⚙️ Mirifer Admin</a>
			<span class="admin-user">👤 {data.adminUser.displayName}</span>
			<a href="/" class="nav-back">← Back to the app</a>
		</nav>
	{/if}
	<main id="main-content" class="admin-main" dir="ltr">
		{@render children()}
	</main>
</div>

<style>
	.admin-shell { min-height: 100vh; text-align: left; background: #101b16; color: #f0f3ed; font-family: 'IBM Plex Sans Variable', sans-serif; }
	.admin-nav { display: flex; align-items: center; gap: 16px; padding: 10px 24px; border-bottom: 1px solid rgba(255, 255, 255, .1); background: rgba(255, 255, 255, .04); }
	.admin-brand { font-weight: 700; color: #2ecc71; text-decoration: none; min-height: 44px; display: flex; align-items: center; }
	.admin-user { color: #888; font-size: .85rem; }
	.nav-back { margin-left: auto; color: #aaa; text-decoration: none; font-size: .9rem; min-height: 44px; display: flex; align-items: center; }
	.nav-back:hover, .admin-brand:hover { text-decoration: underline; }
	.admin-main { min-width: 0; padding: 28px 32px; }
	@media (max-width: 700px) {
		.admin-nav { padding: 6px 14px; gap: 10px; }
		.admin-user { display: none; }
		.admin-main { padding: 20px 14px; }
	}
</style>
