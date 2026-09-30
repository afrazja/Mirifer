<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import AppHeader from "$lib/components/AppHeader.svelte";
	import GermanSectionTabs from "$lib/components/GermanSectionTabs.svelte";
	import { preferencesStore, type Language } from "$stores/preferences";
	import {
		getDueReviewItems,
		removeFromReview,
	} from "$services/spaced-repetition";
	import { getDueCount } from "$services/lesson-controller";
	import { loadLessons, getLesson } from "$services/lesson-loader";
	import { getTranslation } from "$utils/i18n";
	import {
		getLanguage,
		setLanguage,
		removeBookmark,
	} from "$services/data-layer";
	import { initSyncListeners } from "$services/sync-queue";

	interface ReviewItem {
		day: number;
		sentenceId: number;
		germanText: string;
		translation: string;
	}

	let isLoading = $state(true);
	let reviewItems: ReviewItem[] = $state([]);
	const prefs = $derived($preferencesStore);

	async function loadReviewItems() {
		isLoading = true;
		try {
			const dueItems = await getDueReviewItems();
			if (dueItems.length === 0) {
				reviewItems = [];
				isLoading = false;
				return;
			}

			const uniqueDays = [...new Set(dueItems.map((i) => i.day))];
			await loadLessons(uniqueDays);

			const items: ReviewItem[] = [];
			for (const item of dueItems) {
				const lessonData = getLesson(item.day);
				if (!lessonData) continue;
				const sentence = lessonData.sentences.find(
					(s) => s.id === item.sentenceId,
				);
				if (!sentence) continue;
				const german =
					sentence.role === "received"
						? sentence.audioText!
						: sentence.targetText!;
				const translation = getTranslation(sentence, prefs.language);
				items.push({
					day: item.day,
					sentenceId: item.sentenceId,
					germanText: german,
					translation,
				});
			}
			reviewItems = items;
		} catch (err) {
			console.error("[Review] Error loading items:", err);
			reviewItems = [];
		}
		isLoading = false;
	}

	async function handleRemoveItem(day: number, sentenceId: number) {
		await removeFromReview(day, sentenceId);
		removeBookmark(day, sentenceId);
		reviewItems = reviewItems.filter(
			(i) => !(i.day === day && i.sentenceId === sentenceId),
		);
	}

	async function handleClearAll() {
		for (const item of reviewItems) {
			await removeFromReview(item.day, item.sentenceId);
			removeBookmark(item.day, item.sentenceId);
		}
		reviewItems = [];
	}

	function handleStartQuiz() {
		goto("/review/quiz");
	}

	onMount(async () => {
		initSyncListeners();
		const savedLang = await getLanguage();
		if (savedLang) {
			preferencesStore.update((s) => ({
				...s,
				language: savedLang as Language,
			}));
		}
		await loadReviewItems();
	});
</script>

<svelte:head>
	<title>Mirifer - Review</title>
</svelte:head>

<div class="review-page">
	<div class="header-shell">
		<AppHeader
			title={prefs.language === "fa" ? "مرور" : "Review"}
			icon="🔄"
			backHref="/languages"
			backLabel={prefs.language === "fa" ? "زبان‌ها" : "Languages"}
			direction={prefs.language === "fa" ? "rtl" : "ltr"}
		/>
		<GermanSectionTabs current="review" language={prefs.language} />
	</div>

	<main id="main-content" tabindex="-1" class="review-content">
		<a class="drill-link" href="/drill/sprechen">
			🎙 {prefs.language === "fa" ? "تمرین Sprechen: معرفی خود ←" : "Sprechen drill: introduce yourself →"}
		</a>
		{#if isLoading}
			<div class="empty-state">
				<div class="empty-icon">⏳</div>
				<p>
					{prefs.language === "fa"
						? "در حال بارگذاری..."
						: "Loading..."}
				</p>
			</div>
		{:else if reviewItems.length === 0}
			<div class="empty-state">
				<div class="empty-icon">✅</div>
				<h2>
					{prefs.language === "fa"
						? "هیچ جمله‌ای برای مرور نیست!"
						: "No sentences due for review!"}
				</h2>
				<p>
					{prefs.language === "fa"
						? "جملات را در درس‌ها ذخیره کنید تا اینجا ظاهر شوند."
						: "Save sentences in your lessons and they'll appear here."}
				</p>
				<a href="/lesson" class="back-to-lessons">
					{prefs.language === "fa"
						? "📚 برو به درس‌ها"
						: "📚 Go to Lessons"}
				</a>
			</div>
		{:else}
			<div class="review-actions">
				<span class="review-count">
					{reviewItems.length}
					{prefs.language === "fa" ? "مورد" : "items"}
				</span>
				<div class="review-btns">
					<button class="btn-quiz" onclick={handleStartQuiz}>
						{prefs.language === "fa"
							? "🎯 شروع آزمون"
							: "🎯 Start Quiz"}
					</button>
					<button class="btn-clear" onclick={handleClearAll}>
						{prefs.language === "fa"
							? "🗑️ حذف همه"
							: "🗑️ Clear All"}
					</button>
				</div>
			</div>

			<div class="review-list">
				{#each reviewItems as item}
					<div class="review-item">
						<div class="item-content">
							<span class="item-day"
								>{prefs.language === "fa"
									? `روز ${item.day}`
									: `Day ${item.day}`}</span
							>
							<div class="item-german">{item.germanText}</div>
							<div
								class="item-translation"
								dir={prefs.language === "fa" ? "rtl" : "ltr"}
							>
								{item.translation}
							</div>
						</div>
						<button
							class="item-remove"
							onclick={() =>
								handleRemoveItem(item.day, item.sentenceId)}
							aria-label="Remove from review"
						>
							✕
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

<style>
	:global(body) {
		background: var(--paper);
	}

	.review-page {
		min-height: 100vh;
		min-height: 100dvh;
		background: var(--paper);
		display: flex;
		flex-direction: column;
	}

	.header-shell {
		width: min(100%, 1100px);
		margin: 0 auto;
		padding: 12px 16px 0;
	}

	/* Content */
	.drill-link { display: flex; align-items: center; min-height: 44px; margin-bottom: 14px; padding: 8px 14px; border: 1px solid var(--line); border-radius: 12px; background: var(--paper-raised); color: var(--accent-deep); font-weight: 600; text-decoration: none; }
	.drill-link:hover { border-color: var(--accent); background: var(--accent-wash); }

	.review-content {
		flex: 1;
		max-width: 600px;
		width: 100%;
		margin: 0 auto;
		padding: 16px;
	}

	/* Empty state */
	.empty-state {
		text-align: center;
		padding: 60px 20px;
		color: var(--ink-faint);
	}

	.empty-icon {
		font-size: 3rem;
		margin-bottom: 12px;
	}

	.empty-state h2 {
		margin: 0 0 8px;
		color: var(--ink);
		font-size: 1.2rem;
		font-family: var(--font-display);
	}

	.empty-state p {
		margin: 0 0 20px;
		color: var(--ink-soft);
		font-size: 0.9rem;
	}

	.back-to-lessons {
		display: inline-block;
		padding: 10px 24px;
		background: var(--leaf);
		color: white;
		border-radius: 24px;
		text-decoration: none;
		font-weight: 600;
		transition: all 0.2s;
	}

	.back-to-lessons:hover {
		background: var(--leaf);
		transform: translateY(-1px);
	}

	/* Actions bar */
	.review-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 12px;
		padding: 12px 16px;
		background: var(--paper-raised);
		border: 1px solid var(--line);
		border-radius: 12px;
		box-shadow: var(--paper-shadow);
	}

	.review-count {
		font-size: 0.9rem;
		color: var(--ink-faint);
		font-weight: 600;
	}

	.review-btns {
		display: flex;
		gap: 8px;
	}

	.btn-quiz {
		padding: 8px 18px;
		border-radius: 20px;
		border: none;
		background: var(--leaf);
		color: white;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.btn-quiz:hover {
		background: var(--leaf);
		transform: translateY(-1px);
	}

	.btn-clear {
		padding: 8px 18px;
		border-radius: 20px;
		border: 2px solid #e74c3c;
		background: transparent;
		color: #e74c3c;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.btn-clear:hover {
		background: #e74c3c;
		color: white;
	}

	/* Review list */
	.review-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.review-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 14px;
		background: var(--paper-raised);
		border: 1px solid var(--line);
		border-radius: 12px;
		box-shadow: var(--paper-shadow);
		transition: all 0.2s;
	}

	.review-item:hover {
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
	}

	.item-content {
		flex: 1;
		min-width: 0;
	}

	.item-day {
		display: inline-block;
		font-size: 0.65rem;
		color: white;
		background: var(--leaf);
		padding: 2px 8px;
		border-radius: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 4px;
	}

	.item-german {
		font-size: 1rem;
		color: var(--ink);
		font-weight: 500;
		margin: 3px 0;
		line-height: 1.4;
	}

	.item-translation {
		font-size: 0.85rem;
		color: var(--ink-soft);
		line-height: 1.3;
	}

	.item-remove {
		flex-shrink: 0;
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: none;
		background: transparent;
		color: var(--ink-soft);
		font-size: 1.1rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		margin-left: 10px;
	}

	.item-remove:hover {
		background: rgba(231, 76, 60, 0.08);
		color: #e74c3c;
	}

	/* Mobile */
	@media (max-width: 480px) {
		.review-content {
			padding: 10px;
		}

		.review-actions {
			flex-direction: column;
			gap: 10px;
			align-items: stretch;
		}

		.review-count {
			text-align: center;
		}

		.review-btns {
			justify-content: center;
		}
	}
</style>
