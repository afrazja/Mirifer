<script lang="ts">
	import { onMount } from "svelte";
	import AppHeader from "$lib/components/AppHeader.svelte";
	import GermanSectionTabs from "$lib/components/GermanSectionTabs.svelte";
	import { getLanguage, setLanguage, getBasicsCompleted } from "$services/data-layer";
	import { GROUPS, groupFor, matchesQuery, type GroupId } from "$services/basics-groups";
	import type { Language } from "$stores/preferences";

	let { data } = $props();

	let currentLang = $state("en" as Language);

	// Topics the learner has worked all the way through, written by
	// /basics/[category] when its closing checks are finished.
	let completed = $state(new Set<string>());

	/** Search box and the active filter chip, both from the artboard. */
	let query = $state("");
	let filter = $state<GroupId | "all">("all");

	const categories = $derived(
		(data.categories ?? []).map((cat: any) => ({
			key: cat.key,
			icon: cat.icon,
			title: currentLang === "fa" ? cat.title_fa : cat.title_en,
			description:
				currentLang === "fa" ? cat.description_fa : cat.description_en,
			done: completed.has(cat.key),
		})),
	);

	const doneCount = $derived(categories.filter((c: any) => c.done).length);

	/** Chips carry their own counts, so an empty filter is visible before it is tapped. */
	const chips = $derived([
		{
			id: "all" as const,
			label: currentLang === "fa" ? "همه" : "All",
			count: categories.length,
		},
		...GROUPS.map((g) => ({
			id: g.id,
			label: currentLang === "fa" ? g.fa : g.en,
			count: categories.filter((c: any) => groupFor(c.key) === g.id).length,
		})),
	]);

	const visible = $derived(
		categories.filter(
			(c: any) =>
				(filter === "all" || groupFor(c.key) === filter) &&
				matchesQuery(c, query),
		),
	);

	/**
	 * Only groups with something in them, so a filter or a search never
	 * leaves a bare heading with nothing underneath it.
	 */
	const sections = $derived(
		GROUPS.map((g) => ({
			...g,
			topics: visible.filter((c: any) => groupFor(c.key) === g.id),
		})).filter((g) => g.topics.length > 0),
	);

	const pageTitle = $derived(
		currentLang === "fa" ? "مبانی آلمانی" : "German Basics",
	);
	const pageSubtitle = $derived(
		currentLang === "fa"
			? "\u06CC\u06A9 \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0631\u0627 \u0628\u0631\u0627\u06CC \u0634\u0631\u0648\u0639 \u06CC\u0627\u062F\u06AF\u06CC\u0631\u06CC \u0627\u0646\u062A\u062E\u0627\u0628 \u06A9\u0646\u06CC\u062F"
			: "Choose a category to start learning",
	);
	const backText = $derived(
		currentLang === "fa" ? "زبان‌ها" : "Languages",
	);
	const wordsLabel = $derived(
		currentLang === "fa" ? "\u06A9\u0644\u0645\u0647" : "words",
	);

	function handleLanguageChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		currentLang = target.value as Language;
		setLanguage(currentLang);
	}

	onMount(async () => {
		completed = new Set(Object.keys(getBasicsCompleted()));

		const savedLang = await getLanguage();
		if (savedLang === "fa" || savedLang === "en") {
			currentLang = savedLang;
		} else {
			const browserLang = navigator.language || "en";
			currentLang = browserLang.startsWith("fa") ? "fa" : "en";
		}
	});
</script>

<svelte:head>
	<title>{pageTitle} - Mirifer</title>
	<!-- Must mirror /fa/basics. Google discards hreflang that is not
	     reciprocal, so leaving these off would void the Persian side too. -->
	<link rel="canonical" href="https://www.mirifer.com/basics" />
	<link rel="alternate" hreflang="en" href="https://www.mirifer.com/basics" />
	<link rel="alternate" hreflang="fa" href="https://www.mirifer.com/fa/basics" />
</svelte:head>

<main class="basics-container">
	{#snippet headerActions()}
		<div class="controls">
			<select
				aria-label="Select language"
				value={currentLang}
				onchange={handleLanguageChange}
			>
				<option value="fa">فارسی</option>
				<option value="en">English</option>
			</select>
		</div>
	{/snippet}

	<AppHeader
		title={pageTitle}
		subtitle={pageSubtitle}
		icon="🔤"
		backHref="/languages"
		backLabel={backText}
		actions={headerActions}
		direction={currentLang === "fa" ? "rtl" : "ltr"}
	/>
	<GermanSectionTabs current="basics" language={currentLang} />

	<!-- Skip-link target: absolutely positioned, so it adds no box. -->
	<span id="main-content" tabindex="-1" class="sr-only"></span>


	<div class="shelf" dir={currentLang === "fa" ? "rtl" : "ltr"}>
		<!-- The count is the artboard's "5 / 18 topics finished". Shown from
		     zero rather than only once something is done: on a first visit it
		     says how much there is, which is the more useful reading. -->
		<p class="tally">
			<strong>{doneCount} / {categories.length}</strong>
			<span>{currentLang === "fa" ? "مبحث تمام‌شده" : "topics finished"}</span>
		</p>

		<div class="finder">
			<input
				type="search"
				class="search"
				bind:value={query}
				placeholder={currentLang === "fa"
					? "جست‌وجو در مبحث‌ها…"
					: "Search topics…"}
				aria-label={currentLang === "fa" ? "جست‌وجو" : "Search topics"}
			/>
			<div class="chips" role="group" aria-label={currentLang === "fa" ? "دسته‌ها" : "Filter by group"}>
				{#each chips as c (c.id)}
					<button
						type="button"
						class="chip"
						class:on={filter === c.id}
						aria-pressed={filter === c.id}
						onclick={() => (filter = c.id)}
					>
						{c.label}<em>{c.count}</em>
					</button>
				{/each}
			</div>
		</div>

		{#if sections.length === 0}
			<div class="empty">
				<p class="empty-head">
					{currentLang === "fa" ? "چیزی پیدا نشد." : "Nothing matches that."}
				</p>
				<p class="empty-sub">
					{currentLang === "fa"
						? "«حالت‌ها»، «ترتیب کلمات» یا «فعل» را امتحان کن، یا جست‌وجو را پاک کن."
						: "Try “cases”, “word order”, “modal” — or clear the search."}
				</p>
				<button class="chip" type="button" onclick={() => { query = ""; filter = "all"; }}>
					{currentLang === "fa" ? "پاک کردن" : "Clear"}
				</button>
			</div>
		{:else}
			{#each sections as g (g.id)}
				<section class="group">
					<div class="group-head">
						<h2>{currentLang === "fa" ? g.fa : g.en}</h2>
						<p>{currentLang === "fa" ? g.noteFa : g.noteEn}</p>
					</div>
					<ul class="topics">
						{#each g.topics as cat (cat.key)}
							<li>
								<a href="/basics/{cat.key}" class="topic" class:done={cat.done}>
									<span class="t-icon" aria-hidden="true">{cat.icon}</span>
									<span class="t-body">
										<span class="t-title">{cat.title}</span>
										<span class="t-desc">{cat.description}</span>
									</span>
									<span class="t-status">
										{#if cat.done}
											<span class="t-done">
												✓ {currentLang === "fa" ? "تمام" : "Done"}
											</span>
										{:else}
											<span class="t-open">
												{currentLang === "fa" ? "باز کن" : "Open"}
											</span>
										{/if}
									</span>
								</a>
							</li>
						{/each}
					</ul>
				</section>
			{/each}
		{/if}
	</div>
</main>

<style>
	:global(body) {
		background: var(--paper);
	}


	.basics-container {
		max-width: 900px;
		margin: 0 auto;
		padding: 30px 20px;
	}


	.controls select {
		/* 44px minimum touch target. */
		min-height: 44px;
		padding: 8px 16px;
		border-radius: 20px;
		border: 1px solid var(--control-border);
		background: var(--control);
		color: var(--ink);
		font-size: 0.9rem;
		cursor: pointer;
	}


	.controls select option {
		background: var(--paper-raised);
		color: var(--ink);
	}

	/* ── The shelf (German Basics artboard) ──────────────── */
	.shelf {
		margin-top: 26px;
	}

	.tally {
		display: flex;
		align-items: baseline;
		gap: 10px;
		margin: 0 0 22px;
	}

	.tally strong {
		font-family: var(--font-display);
		font-size: var(--type-display-lg);
		font-weight: 500;
		letter-spacing: -0.02em;
		color: var(--accent);
		line-height: 1;
	}

	.tally span {
		font-family: var(--font-mono);
		font-size: var(--type-label);
		letter-spacing: var(--tracking-label);
		text-transform: uppercase;
		color: var(--ink-faint);
	}

	.finder {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 30px;
	}

	.search {
		inline-size: 100%;
		box-sizing: border-box;
		min-block-size: 46px;
		padding: 10px 16px;
		border: 1px solid var(--control-border);
		border-radius: var(--radius-control);
		background: var(--control);
		color: var(--ink);
		font: inherit;
	}

	.search:focus {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}

	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		min-block-size: 44px;
		padding: 6px 15px;
		border: 1px solid var(--line);
		border-radius: var(--radius-pill);
		background: var(--control);
		color: var(--ink-soft);
		font: inherit;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.chip:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.chip.on {
		background: var(--accent);
		border-color: var(--accent);
		color: var(--on-accent);
	}

	/* The count rides inside the chip, so an empty filter is visible
	   before it is tapped rather than after. */
	.chip em {
		font-family: var(--font-mono);
		font-style: normal;
		font-size: 0.72rem;
		opacity: 0.7;
	}

	.group {
		margin-bottom: 34px;
	}

	.group-head {
		border-block-end: 1px solid var(--line);
		padding-block-end: 10px;
		margin-block-end: 4px;
	}

	.group-head h2 {
		font-family: var(--font-display);
		font-size: var(--type-display-md);
		font-weight: 500;
		letter-spacing: -0.015em;
		margin: 0;
		color: var(--ink);
	}

	.group-head p {
		margin: 4px 0 0;
		font-size: var(--type-small);
		color: var(--ink-faint);
	}

	.topics {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	/* A row, not a card. Eighteen cards is a wall; eighteen rows is a
	   list you can run your eye down, which is what a reference shelf
	   is for. */
	.topic {
		display: grid;
		grid-template-columns: 34px minmax(0, 1fr) auto;
		align-items: center;
		gap: 14px;
		padding: 15px 6px;
		border-block-end: 1px solid var(--line);
		text-decoration: none;
		color: var(--ink);
		min-block-size: 60px;
	}

	.topic:hover {
		background: var(--control-hover);
	}

	.t-icon {
		font-size: 1.35rem;
	}

	.t-body {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.t-title {
		font-size: var(--type-title);
		font-weight: 600;
		letter-spacing: -0.005em;
	}

	.t-desc {
		font-size: var(--type-small);
		color: var(--ink-faint);
		line-height: 1.5;
	}

	.t-status {
		font-family: var(--font-mono);
		font-size: var(--type-label);
		letter-spacing: var(--tracking-label);
		text-transform: uppercase;
		white-space: nowrap;
	}

	.t-done {
		color: var(--leaf-deep);
	}

	.t-open {
		color: var(--ink-faint);
	}

	.topic.done .t-title {
		color: var(--ink-soft);
	}

	.empty {
		text-align: center;
		padding: 48px 20px;
		background: var(--paper-sunken);
		border-radius: var(--radius-card);
	}

	.empty-head {
		font-family: var(--font-display);
		font-size: var(--type-display-md);
		margin: 0 0 6px;
		color: var(--ink);
	}

	.empty-sub {
		margin: 0 0 18px;
		color: var(--ink-soft);
	}

	@media (max-width: 640px) {
		.topic {
			grid-template-columns: 28px minmax(0, 1fr);
			row-gap: 6px;
		}

		.t-status {
			grid-column: 2;
		}
	}
</style>
