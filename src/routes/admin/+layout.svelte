<script lang="ts">
	let { children, data } = $props();
</script>

<!-- The admin interface stays English and LTR independently of the learner's language. -->
<div class="admin-shell" lang="en" dir="ltr">
	{#if data.authorized}
		<nav class="admin-nav">
			<div class="admin-brand">⚙️ Mirifer Admin</div>
			<div class="admin-user">👤 {data.adminUser.displayName}</div>
			<a href="/admin" class="nav-link">📊 English</a>
			<a href="/admin/users" class="nav-link">👥 Accounts</a>
			<a href="/" class="nav-link nav-back">← Back to App</a>
		</nav>
	{/if}
	<main id="main-content" class="admin-main" dir="ltr">
		{@render children()}
	</main>
</div>

<style>
	.admin-shell {
		display: flex;
		min-height: 100vh;
		text-align: left;
		background: #101b16;
		color: #f0f3ed;
		font-family: 'IBM Plex Sans Variable', sans-serif;
	}

	.admin-nav {
		width: 220px;
		min-width: 220px;
		background: rgba(255,255,255,0.05);
		border-right: 1px solid rgba(255,255,255,0.1);
		padding: 24px 16px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.admin-brand {
		font-size: 1.2rem;
		font-weight: 700;
		color: #2ecc71;
		margin-bottom: 8px;
		padding-bottom: 12px;
		border-bottom: 1px solid rgba(255,255,255,0.1);
	}

	.admin-user {
		font-size: 0.85rem;
		color: #888;
		margin-bottom: 16px;
		padding-bottom: 12px;
		border-bottom: 1px solid rgba(255,255,255,0.1);
	}

	.nav-link {
		display: block;
		padding: 10px 14px;
		border-radius: 8px;
		color: #ccc;
		text-decoration: none;
		font-size: 0.95rem;
		transition: all 0.2s;
	}

	.nav-link:hover {
		background: rgba(46,204,113,0.15);
		color: #2ecc71;
	}

	.nav-back {
		margin-top: auto;
		color: #888;
		border-top: 1px solid rgba(255,255,255,0.1);
		padding-top: 16px;
	}

	.admin-main {
		flex: 1;
		min-width: 0;
		padding: 32px;
		overflow-y: auto;
	}

	@media (max-width: 700px) {
		.admin-main { padding: 20px 14px; }
		.admin-shell { flex-direction: column; }
		.admin-nav { width: 100%; min-width: unset; flex-direction: row; flex-wrap: wrap; padding: 12px; gap: 4px; }
		.admin-brand { width: 100%; margin-bottom: 0; padding-bottom: 8px; }
		.admin-user { display: none; }
		.nav-back { margin-top: 0; border-top: none; padding-top: 0; }
	}
</style>
