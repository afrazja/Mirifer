<script lang="ts">
	import { onMount } from "svelte";
	import { goto } from "$app/navigation";
	import { updateLanguagePreferences, getUser } from "$services/auth";
	import { preferencesStore } from "$stores/preferences";
	import type { TargetLanguage } from "$stores/preferences";
	import * as dataLayer from "$services/data-layer";
	import { onboardingStrings } from "$services/onboarding-strings";
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	// The flow steps
	let step = $state(2);
	let maxSteps = $state(6);

	// The collected data
	const targetLanguage = $derived<TargetLanguage>(data.targetLanguage);
	// Seeded from the browser in onMount. Steps 1 and 2 come BEFORE the
	// learner tells us, so a guess is all we have for those two screens —
	// and step 2's buttons are 🇬🇧/🇮🇷 flagged, readable either way.
	let interfaceLanguage = $state<"en" | "fa">("en");
	let reason = $state("");
	let examGoal = $state<"scheduled" | "planned" | "none">("none");
	let examDate = $state("");
	let targetDate = $state<string | null>(null);
	let showDatePicker = $state(false);
	let showTargetPicker = $state(false);
	let skillLevel = $state("");
	let dailyGoal = $state("");

	let isSaving = $state(false);
	let saveError = $state("");

	// Date bounds for the exam picker: tomorrow … +2 years
	const toISO = (d: Date) =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
	const minExamDate = toISO(new Date(Date.now() + 86400000));
	const maxExamDate = toISO(new Date(Date.now() + 2 * 365 * 86400000));

	/** "Ready in ~N months" quick-pick → soft target date. */
	function pickTarget(months: number | null) {
		targetDate = months === null ? null : toISO(new Date(Date.now() + months * 30 * 86400000));
		nextStep("planned", "examGoal");
	}

	// Animations
	let enterClass = $state("slide-in-right");

	/**
	 * Put the interface into a language the moment we know it.
	 *
	 * The choice used to be stashed in a variable and only applied by
	 * finishOnboarding — so someone who asked for Persian at step 2 then
	 * answered four more questions in English, including the exam step that
	 * sets their countdown. Answering the wrong question there costs them a
	 * wrong exam date, not just a bad first impression.
	 */
	function applyLanguage(lang: "en" | "fa") {
		interfaceLanguage = lang;
		preferencesStore.update((s) => ({ ...s, language: lang }));
		if (typeof document !== "undefined") {
			document.documentElement.setAttribute("lang", lang);
			document.documentElement.setAttribute("dir", lang === "fa" ? "rtl" : "ltr");
		}
	}

	function nextStep(
		val: any,
		field: "interface" | "reason" | "examGoal" | "skill" | "goal",
	) {
		if (field === "interface") applyLanguage(val);
		if (field === "reason") reason = val;
		if (field === "examGoal") examGoal = val;
		if (field === "skill") skillLevel = val;
		if (field === "goal") dailyGoal = val;

		if (step < maxSteps) {
			enterClass = "slide-in-right";
			step++;
		} else {
			finishOnboarding();
		}
	}

	function prevStep() {
		if (step === 2) {
			goto('/languages', { invalidateAll: true });
		} else if (step > 2) {
			enterClass = "slide-in-left";
			showDatePicker = false;
			showTargetPicker = false;
			step--;
		}
	}

	async function finishOnboarding() {
		isSaving = true;
		saveError = "";

		try {
			// Update auth metadata
			const res = await updateLanguagePreferences(
				interfaceLanguage,
				targetLanguage,
			);
			if (res.error) throw new Error(res.error);

			// Update preferences store
			preferencesStore.update((s) => ({
				...s,
				language: interfaceLanguage,
				targetLanguage: targetLanguage,
			}));

			// Local Data Layer updates
			await dataLayer.setLanguage(interfaceLanguage);

			// Goethe exam plan — drives the countdown + readiness on /home
			await dataLayer.setExamSettings({
				goal: examGoal,
				examDate: examGoal === "scheduled" && examDate ? examDate : null,
				targetDate: examGoal === "planned" ? targetDate : null,
			});

			// Optional: save the other onboarding data explicitly to the database
			// (If you want to create a column for it later, or store it in user_metadata)
			const user = await getUser();
			if (user) {
				const { getSupabaseBrowserClient } = await import(
					"$lib/supabase/client"
				);
				const sb = getSupabaseBrowserClient();
				if (sb) {
					await sb.auth.updateUser({
						data: {
							onboarding: {
								reason,
								skillLevel,
								dailyGoal,
							},
						},
					});
				}
			}

			// Force a hard sync then navigate to the dashboard
			await dataLayer.syncOnLogin();
			goto("/home", { invalidateAll: true });
		} catch {
			saveError = interfaceLanguage === 'fa'
				? 'انتخاب‌هایت ذخیره نشد. اتصال اینترنت را بررسی کن و دوباره هدف روزانه‌ات را انتخاب کن.'
				: 'Your choices could not be saved. Check your connection and choose your daily goal again to retry.';
			isSaving = false;
		}
	}


	const isFa = $derived(interfaceLanguage === "fa");
	const t = $derived(onboardingStrings(isFa));

	onMount(() => {
		// A guess for the two screens that precede the question. Wrong for a
		// Persian speaker running an English browser, which is common — but
		// step 2 is two taps away and overrides it.
		const browser = navigator.language || "en";
		if (browser.toLowerCase().startsWith("fa")) applyLanguage("fa");

	});
</script>

<svelte:head>
	<title>Customize Your Path | Mirifer</title>
</svelte:head>

<div class="onboarding-bg">
	<div class="stars"></div>
	<div class="stars2"></div>
</div>

<main id="main-content" class="onboarding-layout">
	<!-- Progress Bar -->
	<div class="progress-bar">
		<div
			class="progress-fill"
			style="width: {((step - 1) / (maxSteps - 1)) * 100}%"
		></div>
	</div>

	{#if step > 1 && !isSaving}
		<button class="back-btn" onclick={prevStep} aria-label={isFa ? 'برگشت' : 'Go back'}
			>{isFa ? '→ برگشت' : '← Back'}</button
		>
	{/if}

	<div class="wizard-container">
		{#if saveError && !isSaving}
			<div class="error-box" role="alert">{saveError}</div>
		{/if}
		{#if isSaving}
			<div class="wizard-step centered flex-col fade-in">
				<div class="spinner"></div>
				<h1 class="save-title">{t.saving}</h1>
				<p class="save-subtitle">
					{isFa ? 'در حال آماده‌سازی درس‌ها و مرورهای تو.' : 'Getting your lessons and reviews ready.'}
				</p>
				{#if saveError}
					<div class="error-box">
						{saveError}
						<button onclick={() => (isSaving = false)}>{t.retry}</button
						>
					</div>
				{/if}
			</div>
		{:else if step === 2}
			<!-- STEP 2: INTERFACE LANGUAGE -->
			<div class="wizard-step {enterClass}">
				<h1 class="q-title">
					{t.q2}
				</h1>
				<p class="q-sub">
					{t.q2sub}
				</p>

				<div class="options-grid cols-2">
					<button
						class="choice-card"
						onclick={() => nextStep("en", "interface")}
					>
						<span class="flag">🇬🇧</span>
						<span class="lbl">English</span>
					</button>
					<button
						class="choice-card"
						onclick={() => nextStep("fa", "interface")}
					>
						<span class="flag">🇮🇷</span>
						<span class="lbl">Persian (فارسی)</span>
					</button>
				</div>
			</div>
		{:else if step === 3}
			<!-- STEP 3: WHY ARE YOU LEARNING -->
			<div class="wizard-step {enterClass}">
				<h1 class="q-title">
					{t.q3}
				</h1>
				<p class="q-sub">
					{t.q3sub}
				</p>

				<div class="options-grid cols-2">
					<button
						class="choice-card small-lbl"
						onclick={() => nextStep("moving", "reason")}
					>
						<span class="emoji">✈️</span>
						<span>{t.rMove}</span>
					</button>
					<button
						class="choice-card small-lbl"
						onclick={() => nextStep("work", "reason")}
					>
						<span class="emoji">💼</span>
						<span>{t.rCareer}</span>
					</button>
					<button
						class="choice-card small-lbl"
						onclick={() => nextStep("study", "reason")}
					>
						<span class="emoji">🎓</span>
						<span>{t.rStudy}</span>
					</button>
					<button
						class="choice-card small-lbl"
						onclick={() => nextStep("travel", "reason")}
					>
						<span class="emoji">🌍</span>
						<span>{t.rTravel}</span>
					</button>
					<button
						class="choice-card small-lbl"
						onclick={() => nextStep("brain", "reason")}
					>
						<span class="emoji">🧠</span>
						<span>{t.rBrain}</span>
					</button>
					<button
						class="choice-card small-lbl"
						onclick={() => nextStep("other", "reason")}
					>
						<span class="emoji">💬</span>
						<span>{t.rPeople}</span>
					</button>
				</div>
			</div>
		{:else if step === 4}
			<!-- STEP 4: GOETHE A1 EXAM -->
			<div class="wizard-step {enterClass}">
				<h1 class="q-title">
					{t.q4}
				</h1>
				<p class="q-sub">
					{t.q4sub}
				</p>

				{#if showDatePicker}
					<div class="date-block">
						<label class="date-label" for="exam-date"
							>{t.examWhen}</label
						>
						<input
							id="exam-date"
							class="date-input"
							type="date"
							bind:value={examDate}
							min={minExamDate}
							max={maxExamDate}
						/>
						<button
							class="date-continue"
							disabled={!examDate}
							onclick={() => nextStep("scheduled", "examGoal")}
							>{t.continue}</button
						>
						<button
							class="date-skip"
							onclick={() => {
								showDatePicker = false;
								showTargetPicker = true;
							}}>{t.noDate}</button
						>
					</div>
				{:else if showTargetPicker}
					<div class="date-block">
						<label class="date-label" for="target-picks"
							>{t.readyWhen}</label
						>
						<div class="options-grid cols-2" id="target-picks">
							<button class="choice-card small-lbl" onclick={() => pickTarget(3)}>
								<span class="emoji">🚀</span>
								<span>{t.in3}</span>
							</button>
							<button class="choice-card small-lbl" onclick={() => pickTarget(6)}>
								<span class="emoji">🏃</span>
								<span>{t.in6}</span>
							</button>
							<button class="choice-card small-lbl" onclick={() => pickTarget(12)}>
								<span class="emoji">🚶</span>
								<span>{t.in12}</span>
							</button>
							<button class="choice-card small-lbl" onclick={() => pickTarget(null)}>
								<span class="emoji">🤷</span>
								<span>{t.eUnsure}</span>
							</button>
						</div>
					</div>
				{:else}
					<div class="options-grid cols-1">
						<button
							class="choice-card flex-row"
							onclick={() => (showDatePicker = true)}
						>
							<span class="emoji">📅</span>
							<div class="lbl-block">
								<strong>{t.eBooked}</strong>
								<span>Goethe-Zertifikat A1 (Start Deutsch 1)</span>
							</div>
						</button>
						<button
							class="choice-card flex-row"
							onclick={() => (showTargetPicker = true)}
						>
							<span class="emoji">🎯</span>
							<div class="lbl-block">
								<strong>{t.ePlanned}</strong>
								<span>{t.noDateSub}</span>
							</div>
						</button>
						<button
							class="choice-card flex-row"
							onclick={() => nextStep("none", "examGoal")}
						>
							<span class="emoji">🌱</span>
							<div class="lbl-block">
								<strong>{t.eNone}</strong>
								<span>{t.eNoneSub}</span>
							</div>
						</button>
					</div>
				{/if}
			</div>
		{:else if step === 5}
			<!-- STEP 5: CURRENT LEVEL -->
			<div class="wizard-step {enterClass}">
				<h1 class="q-title">
					{isFa ? 'چقدر آلمانی بلدی؟' : 'How much German do you already know?'}
				</h1>
				<p class="q-sub">{t.q5sub}</p>

				<div class="options-grid cols-1">
					<button
						class="choice-card flex-row"
						onclick={() => nextStep("beginner", "skill")}
					>
						<span class="emoji">🐣</span>
						<div class="lbl-block">
							<strong>{t.lNone}</strong>
							<span>{t.lNoneSub}</span>
						</div>
					</button>
					<button
						class="choice-card flex-row"
						onclick={() => nextStep("some_words", "skill")}
					>
						<span class="emoji">🐥</span>
						<div class="lbl-block">
							<strong>{t.lFew}</strong>
							<span>{t.lFewSub}</span>
						</div>
					</button>
					<button
						class="choice-card flex-row"
						onclick={() => nextStep("basic", "skill")}
					>
						<span class="emoji">🦅</span>
						<div class="lbl-block">
							<strong>{t.lBasic}</strong>
							<span
								>{t.lBasicSub}</span
							>
						</div>
					</button>
				</div>
			</div>
		{:else if step === 6}
			<!-- STEP 6: DAILY GOAL -->
			<div class="wizard-step {enterClass}">
				<h1 class="q-title">{t.q6}</h1>
				<p class="q-sub">
					Consistency beats intensity when learning a language.
				</p>

				<div class="options-grid cols-1">
					<button
						class="choice-card flex-row"
						onclick={() => nextStep("5m", "goal")}
					>
						<span class="emoji">☕</span>
						<div class="lbl-block">
							<strong>5 minutes a day</strong>
							<span>{t.gCasual}</span>
						</div>
					</button>
					<button
						class="choice-card flex-row"
						onclick={() => nextStep("15m", "goal")}
					>
						<span class="emoji">🏃</span>
						<div class="lbl-block">
							<strong>15 minutes a day</strong>
							<span
								>{t.gRegular}</span
							>
						</div>
					</button>
					<button
						class="choice-card flex-row"
						onclick={() => nextStep("30m", "goal")}
					>
						<span class="emoji">🚀</span>
						<div class="lbl-block">
							<strong>30+ minutes a day</strong>
							<span>{t.gSerious}</span>
						</div>
					</button>
				</div>
			</div>
		{/if}
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: var(--paper);
	}

	.onboarding-bg {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100vh;
		background: var(--paper);
		z-index: 1;
		pointer-events: none;
	}

	.onboarding-layout {
		position: relative;
		z-index: 10;
		display: flex;
		flex-direction: column;
		min-height: 100vh;
		padding: 24px;
		max-width: 800px;
		margin: 0 auto;
	}

	/* Progress Bar */
	.progress-bar {
		width: 100%;
		height: 6px;
		background: var(--paper-sunken);
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 30px;
	}
	.progress-fill {
		height: 100%;
		background: var(--leaf);
		border-radius: 6px;
		transition: width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
	}

	.back-btn {
		background: none;
		border: none;
		color: var(--ink-soft);
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		align-self: flex-start;
		padding: 8px 0;
		margin-bottom: 20px;
		transition: color 0.2s;
	}
	.back-btn:hover {
		color: var(--ink);
	}

	.wizard-container {
		flex: 1;
		display: flex;
		align-items: center;
		padding-bottom: 10vh;
	}

	.wizard-step {
		width: 100%;
	}

	.q-title {
		font-size: clamp(2rem, 5vw, 2.6rem);
		font-weight: 700;
		font-family: var(--font-display);
		color: var(--ink);
		line-height: 1.15;
		margin: 0 0 12px 0;
		letter-spacing: -0.02em;
	}

	.q-sub {
		font-size: 1.1rem;
		color: var(--ink-soft);
		margin-bottom: 40px;
	}

	/* CSS Animations */
	@keyframes slideInRight {
		from {
			opacity: 0;
			transform: translateX(30px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
	@keyframes slideInLeft {
		from {
			opacity: 0;
			transform: translateX(-30px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.slide-in-right {
		animation: slideInRight 0.4s forwards cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.slide-in-left {
		animation: slideInLeft 0.4s forwards cubic-bezier(0.2, 0.8, 0.2, 1);
	}
	.fade-in {
		animation: fadeIn 0.4s forwards;
	}

	/* Options Grid */
	.options-grid {
		display: grid;
		gap: 16px;
	}
	.cols-2 {
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
	}
	.cols-1 {
		grid-template-columns: 1fr;
		max-width: 600px;
	}

	.choice-card {
		background: var(--paper-raised);
		border: 2px solid var(--line);
		border-radius: 16px;
		padding: 24px;
		text-align: center;
		cursor: pointer;
		transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.choice-card:hover {
		background: var(--accent-wash);
		border-color: var(--accent);
		transform: translateY(-2px);
	}
	.choice-card:active {
		transform: scale(0.98);
	}

	.choice-card.flex-row {
		flex-direction: row;
		padding: 20px 24px;
		text-align: left;
		align-items: center;
		justify-content: flex-start;
		gap: 20px;
	}

	.flag,
	.emoji {
		font-size: 3rem;
		margin-bottom: 12px;
	}
	.choice-card.flex-row .emoji {
		margin-bottom: 0;
		font-size: 2.5rem;
	}

	.lbl {
		font-size: 1.4rem;
		font-weight: 700;
		color: var(--ink);
	}
	.small-lbl {
		padding: 20px;
	}
	.small-lbl .emoji {
		font-size: 2.4rem;
		margin-bottom: 10px;
	}
	.small-lbl span {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--ink);
	}

	.lbl-block {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.lbl-block strong {
		font-size: 1.15rem;
		color: var(--ink);
	}
	.lbl-block span {
		font-size: 0.95rem;
		color: var(--ink-soft);
	}

	/* Exam date picker */
	.date-block {
		display: flex;
		flex-direction: column;
		gap: 14px;
		max-width: 420px;
	}

	.date-label {
		font-weight: 600;
		color: var(--ink);
		font-size: 1.05rem;
	}

	.date-input {
		background: var(--paper-raised);
		border: 2px solid var(--line);
		border-radius: 12px;
		padding: 14px 16px;
		font-size: 1.1rem;
		font-family: var(--font-body);
		color: var(--ink);
	}

	.date-input:focus {
		border-color: var(--accent);
		outline: none;
	}

	.date-continue {
		background: var(--accent);
		color: var(--on-accent);
		border: none;
		border-radius: 12px;
		padding: 14px 20px;
		font-size: 1.05rem;
		font-weight: 700;
		cursor: pointer;
	}

	.date-continue:disabled {
		opacity: 0.5;
		cursor: default;
	}

	.date-skip {
		background: none;
		border: none;
		color: var(--ink-faint);
		text-decoration: underline;
		cursor: pointer;
		font-size: 0.95rem;
		padding: 4px;
	}

	/* Save state */
	.centered {
		text-align: center;
		align-items: center;
		justify-content: center;
	}
	.flex-col {
		display: flex;
		flex-direction: column;
	}
	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid var(--line);
		border-left-color: var(--accent);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 24px;
	}
	@keyframes spin {
		100% {
			transform: rotate(360deg);
		}
	}

	.save-title {
		font-size: 1.8rem;
		font-weight: 700;
		color: var(--ink);
		margin-bottom: 8px;
	}
	.save-subtitle {
		color: var(--ink-soft);
		font-size: 1.1rem;
	}
</style>
