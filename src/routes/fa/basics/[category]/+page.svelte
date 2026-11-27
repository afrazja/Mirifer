<script lang="ts">
	/**
	 * Persian grammar reference — one category.
	 *
	 * Server-rendered Persian, no client language switch. The app-side page at
	 * /basics/[category] renders the same rows but resolves its language in
	 * onMount, so its server output is always English; that is fine for a
	 * signed-in learner and useless for a crawler. Here the language is fixed
	 * by the URL, which is what lets this rank for a Persian query.
	 *
	 * The tables are plain HTML on purpose. This page has no quiz, no audio
	 * and no speech recogniser — someone arriving from search wants to read
	 * the answer, and the practice tools are one link away.
	 */
	import type { PageData } from './$types';

	// The shared loader widens these to Record<string, any>; the server's
	// null-or-array returns defeat PageData inference the same way they do on
	// the English route.
	type CategoryData = PageData & {
		category?: Record<string, any> | null;
		words?: Array<Record<string, any>> | null;
		sections?: Array<Record<string, any>> | null;
	};

	let { data }: { data: CategoryData } = $props();

	const category = $derived(data.category);
	const words = $derived(data.words ?? []);
	const sections = $derived(data.sections ?? []);

	const title = $derived(category?.title_fa || category?.title_en || '');
	const desc = $derived(category?.description_fa || category?.description_en || '');
	const explanation = $derived(category?.explanation_fa || '');
	const pitfall = $derived(category?.pitfall_fa || '');
	const key = $derived(category?.key ?? '');

	/** Persian example if it exists, else the German-only one, else nothing. */
	function exampleFa(w: Record<string, any>): string {
		return w.example_fa || w.exampleFa || '';
	}
</script>

<svelte:head>
	<title>{title} در زبان آلمانی — آموزش به فارسی | میریفر</title>
	<meta
		name="description"
		content={`${title} در گرامر آلمانی، توضیح‌داده‌شده به فارسی${desc ? ' — ' + desc : ''}. جدول، مثال و ترجمه. رایگان و بدون ثبت‌نام.`}
	/>
	<link rel="canonical" href={`https://mirifer.vercel.app/fa/basics/${key}`} />
	<link rel="alternate" hreflang="fa" href={`https://mirifer.vercel.app/fa/basics/${key}`} />
	<link rel="alternate" hreflang="en" href={`https://mirifer.vercel.app/basics/${key}`} />
</svelte:head>

<div class="wrap" lang="fa" dir="rtl">
	<nav class="crumbs" aria-label="مسیر">
		<a href="/fa">میریفر</a> <span aria-hidden="true">›</span>
		<a href="/fa/basics">گرامر آلمانی</a> <span aria-hidden="true">›</span>
		<span>{title}</span>
	</nav>

	<header>
		<h1><span class="icon" aria-hidden="true">{category?.icon ?? '📚'}</span> {title}</h1>
		{#if desc}<p class="lede">{desc}</p>{/if}
	</header>

	{#if explanation}
		<section class="rule">
			<h2>قاعده</h2>
			<p>{explanation}</p>
		</section>
	{/if}

	{#if pitfall}
		<section class="pitfall">
			<h2>اشتباه رایج فارسی‌زبان‌ها</h2>
			<p>{pitfall}</p>
		</section>
	{/if}

	{#if words.length > 0}
		<table>
			<thead>
				<tr><th>آلمانی</th><th>فارسی</th><th>مثال</th></tr>
			</thead>
			<tbody>
				{#each words as w}
					<tr>
						<td class="de" dir="ltr" lang="de">{w.german}</td>
						<td>{w.fa || w.en}</td>
						<td class="ex">
							{#if w.example}
								<span dir="ltr" lang="de" class="de">{w.example}</span>
								{#if exampleFa(w)}<span class="tr">{exampleFa(w)}</span>{/if}
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}

	{#each sections as sec}
		<section class="sec">
			<h2>{sec.heading_fa || sec.heading_en}</h2>
			{#if sec.explanation_fa}<p class="secnote">{sec.explanation_fa}</p>{/if}

			{#if sec.type === 'conjugation' && sec.tenses}
				{#if sec.infinitive}
					<p class="inf">
						<span dir="ltr" lang="de" class="de">{sec.infinitive.german}</span>
						— {sec.infinitive.fa || sec.infinitive.en}
					</p>
				{/if}
				{#each sec.tenses as tense}
					<h3>{tense.name?.fa || tense.name?.en}</h3>
					<table>
						<thead><tr><th>ضمیر</th><th>فعل</th><th>فارسی</th></tr></thead>
						<tbody>
							{#each tense.forms ?? [] as f}
								<tr>
									<td class="de" dir="ltr" lang="de">{f.pronoun}</td>
									<td class="de" dir="ltr" lang="de">{f.verb}</td>
									<td>{f.fa || f.en}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/each}
			{:else if sec.type === 'declension' && sec.declension}
				<div class="scroll">
					<table>
						<thead>
							<tr>
								<th></th>
								{#each sec.declension.columns ?? [] as col}
									<th>{col.fa || col.en || col.de}</th>
								{/each}
							</tr>
						</thead>
						<tbody>
							{#each sec.declension.rows ?? [] as row}
								<tr>
									<th scope="row">{row.label?.fa || row.label?.en || row.label?.de}</th>
									{#each row.forms ?? [] as form}
										<td class="de" dir="ltr" lang="de">{form}</td>
									{/each}
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{:else if (sec.words ?? []).length > 0}
				<table>
					<thead><tr><th>آلمانی</th><th>فارسی</th><th>مثال</th></tr></thead>
					<tbody>
						{#each sec.words as w}
							<tr>
								<td class="de" dir="ltr" lang="de">{w.german}</td>
								<td>{w.fa || w.en}</td>
								<td class="ex">
									{#if w.example}
										<span dir="ltr" lang="de" class="de">{w.example}</span>
										{#if exampleFa(w)}<span class="tr">{exampleFa(w)}</span>{/if}
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</section>
	{/each}

	<aside class="cta">
		<h2>این‌ها را داخل جمله تمرین کن</h2>
		<p>
			دورهٔ روزانه همین ساختارها را در مکالمهٔ واقعی می‌آورد — با صدا، تشخیص تلفظ و توضیح
			فارسی. رایگان.
		</p>
		<div class="acts">
			<a class="btn primary" href="/fa">شروع رایگان</a>
			<a class="btn ghost" href="/fa/basics">بقیهٔ بخش‌های گرامر</a>
		</div>
	</aside>
</div>

<style>
	.wrap {
		max-inline-size: 800px;
		margin: 0 auto;
		padding: 28px 20px 64px;
		font-family: var(--font-body);
		color: var(--ink);
	}

	.crumbs { font-size: 0.85rem; color: var(--ink-faint); margin-bottom: 16px; }
	.crumbs a { color: var(--accent); text-decoration: none; }
	.crumbs a:hover { text-decoration: underline; }

	h1 {
		font-family: var(--font-display);
		font-size: clamp(1.6rem, 5vw, 2.1rem);
		line-height: 1.35;
		margin: 0 0 8px;
	}

	.icon { font-size: 1.6rem; }

	.lede { color: var(--ink-soft); line-height: 1.9; margin: 0 0 24px; }

	h2 {
		font-family: var(--font-display);
		font-size: 1.15rem;
		margin: 28px 0 10px;
	}

	h3 {
		font-size: 1rem;
		margin: 20px 0 8px;
		color: var(--ink-soft);
	}

	.rule,
	.pitfall {
		border-radius: 12px;
		padding: 16px 18px;
		margin-bottom: 16px;
	}

	.rule { background: var(--paper-sunken); }

	/* The pitfall is the reason this site exists rather than a dictionary, so
	   it gets the accent rather than being another grey box. */
	.pitfall {
		background: color-mix(in srgb, var(--accent) 8%, var(--paper-sunken));
		border-inline-start: 3px solid var(--accent);
	}

	.rule h2,
	.pitfall h2 { margin: 0 0 6px; font-size: 0.86rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-faint); }

	.rule p,
	.pitfall p { margin: 0; line-height: 1.95; color: var(--ink-soft); }

	.secnote { color: var(--ink-soft); line-height: 1.9; margin: 0 0 12px; }

	.inf { margin: 0 0 14px; color: var(--ink-soft); }

	/* Wide declension tables scroll inside their own box rather than making
	   the whole page scroll sideways on a phone. */
	.scroll { overflow-x: auto; }

	table {
		inline-size: 100%;
		border-collapse: collapse;
		margin: 0 0 18px;
		font-size: 0.95rem;
	}

	th, td {
		text-align: start;
		padding: 10px 12px;
		border-block-end: 1px solid var(--line);
		vertical-align: top;
	}

	thead th {
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--ink-faint);
		border-block-end: 2px solid var(--line);
		white-space: nowrap;
	}

	tbody th { font-weight: 700; white-space: nowrap; }

	tbody tr:hover { background: var(--paper-sunken); }

	/* German is isolated so its punctuation is not reordered by the RTL
	   paragraph direction it sits inside. */
	.de {
		unicode-bidi: isolate;
		font-weight: 600;
	}

	.ex { color: var(--ink-soft); }
	.ex .tr { display: block; font-size: 0.88rem; color: var(--ink-faint); margin-block-start: 3px; }

	.cta {
		background: var(--paper-sunken);
		border-radius: 16px;
		padding: 24px 20px;
		text-align: center;
		margin-top: 34px;
	}

	.cta h2 { margin: 0 0 8px; font-size: 1.2rem; text-transform: none; letter-spacing: normal; color: var(--ink); }
	.cta p { color: var(--ink-soft); line-height: 1.9; margin: 0 0 16px; }

	.acts { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }

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

	.ghost { background: var(--control); color: var(--ink); border: 1px solid var(--control-border); }
	.ghost:hover { background: var(--control-hover); }

	@media (max-width: 640px) {
		.wrap { padding: 20px 14px 48px; }
		th, td { padding: 8px 8px; }
		.acts .btn { inline-size: 100%; }
	}
</style>
