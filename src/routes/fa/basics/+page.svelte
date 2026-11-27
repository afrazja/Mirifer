<script lang="ts">
	/**
	 * Persian grammar reference — index.
	 *
	 * The content behind this already existed and Google could not see any of
	 * it. Two reasons, both fixed here: robots.txt disallowed /basics/, and
	 * the English page picks its language from a store inside onMount, so the
	 * server always rendered English and the Persian only appeared after
	 * hydration. A crawler indexing «حروف تعریف آلمانی» saw a page titled
	 * "Articles - Mirifer".
	 *
	 * These routes render Persian on the server with no client language
	 * switch, which is the whole point — the language is the URL.
	 *
	 * Deliberately lean. The interactive quiz and voice practice live on the
	 * app-side page; a reference page that someone lands on from search needs
	 * to be readable in one second on a phone, not to boot a lesson engine.
	 */
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const categories = $derived(data.categories ?? []);
</script>

<svelte:head>
	<title>گرامر آلمانی به زبان فارسی — مرجع رایگان سطح A1 | میریفر</title>
	<meta
		name="description"
		content="مرجع رایگان گرامر آلمانی با توضیح فارسی: حروف تعریف، صرف فعل، حالت‌ها، حروف اضافه، اعداد و رنگ‌ها. مناسب برای شروع از صفر و آمادگی آزمون گوته A1."
	/>
	<link rel="canonical" href="https://mirifer.vercel.app/fa/basics" />
	<link rel="alternate" hreflang="fa" href="https://mirifer.vercel.app/fa/basics" />
	<link rel="alternate" hreflang="en" href="https://mirifer.vercel.app/basics" />
</svelte:head>

<div class="wrap" lang="fa" dir="rtl">
	<nav class="crumbs" aria-label="مسیر">
		<a href="/fa">میریفر</a> <span aria-hidden="true">›</span> <span>گرامر آلمانی</span>
	</nav>

	<header>
		<h1>گرامر آلمانی به زبان فارسی</h1>
		<p class="lede">
			پایه‌های زبان آلمانی، توضیح‌داده‌شده به فارسی. هر بخش با جدول، مثال و ترجمه — رایگان و
			بدون ثبت‌نام.
		</p>
	</header>

	{#if categories.length === 0}
		<p class="empty">فهرست موقتاً در دسترس نیست. لطفاً بعداً دوباره سر بزن.</p>
	{:else}
		<ul class="grid">
			{#each categories as c}
				<li>
					<a href="/fa/basics/{c.key}">
						<span class="icon" aria-hidden="true">{c.icon ?? '📚'}</span>
						<span class="text">
							<strong>{c.title_fa || c.title_en}</strong>
							{#if c.description_fa || c.description_en}
								<span class="desc">{c.description_fa || c.description_en}</span>
							{/if}
						</span>
						<span class="chev" aria-hidden="true">←</span>
					</a>
				</li>
			{/each}
		</ul>
	{/if}

	<aside class="cta">
		<h2>می‌خواهی از حفظ‌کردن جدول جلوتر بروی؟</h2>
		<p>
			دورهٔ روزانهٔ میریفر همین ساختارها را داخل جمله‌های واقعی تمرین می‌دهد — با صدا، تلفظ و
			توضیح فارسی.
		</p>
		<div class="acts">
			<a class="btn primary" href="/fa">شروع رایگان دوره</a>
		</div>
	</aside>
</div>

<style>
	.wrap {
		max-inline-size: 760px;
		margin: 0 auto;
		padding: 28px 20px 64px;
		font-family: var(--font-body);
		color: var(--ink);
	}


	.crumbs {
		font-size: 0.85rem;
		color: var(--ink-faint);
		margin-bottom: 16px;
	}


	.crumbs a { color: var(--accent); text-decoration: none; }

	.crumbs a:hover { text-decoration: underline; }


	h1 {
		font-family: var(--font-display);
		font-size: clamp(1.6rem, 5vw, 2.2rem);
		line-height: 1.35;
		margin: 0 0 10px;
	}


	.lede {
		color: var(--ink-soft);
		line-height: 1.9;
		margin: 0 0 28px;
	}


	.empty {
		background: var(--paper-sunken);
		border-radius: 12px;
		padding: 18px;
		color: var(--ink-soft);
	}


	.grid {
		list-style: none;
		padding: 0;
		margin: 0 0 36px;
		display: grid;
		gap: 10px;
	}


	.grid a {
		display: flex;
		align-items: center;
		gap: 14px;
		background: var(--paper-raised);
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 14px 16px;
		min-block-size: 64px;
		text-decoration: none;
		color: inherit;
		transition: border-color 0.15s, background 0.15s;
	}


	.grid a:hover {
		border-color: var(--accent);
		background: var(--control-hover);
	}


	.icon { font-size: 1.5rem; flex: none; }


	.text { display: flex; flex-direction: column; gap: 3px; flex: 1; }

	.text strong { font-size: 1.02rem; }


	.desc {
		font-size: 0.88rem;
		color: var(--ink-faint);
		line-height: 1.6;
	}


	.chev { color: var(--ink-faint); flex: none; }


	.cta {
		background: var(--paper-sunken);
		border-radius: 16px;
		padding: 24px 20px;
		text-align: center;
	}


	.cta h2 {
		font-family: var(--font-display);
		font-size: 1.2rem;
		margin: 0 0 8px;
	}


	.cta p {
		color: var(--ink-soft);
		line-height: 1.9;
		margin: 0 0 16px;
	}


	.acts {
		display: flex;
		gap: 10px;
		justify-content: center;
		flex-wrap: wrap;
	}


	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-block-size: 46px;
		padding: 10px 22px;
		border-radius: 12px;
		font-weight: 700;
		text-decoration: none;
	}


	.primary { background: var(--accent); color: var(--on-accent); }

	.primary:hover { filter: brightness(1.06); }


	@media (max-width: 640px) {
		.wrap { padding: 20px 14px 48px; }
		.acts .btn { inline-size: 100%; }
	}</style>
