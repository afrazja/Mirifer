<script lang="ts">
	import { onMount } from "svelte";
	import GoogleSignIn from "$components/GoogleSignIn.svelte";
	import { page } from "$app/stores";
	import { goto } from "$app/navigation";
	import * as auth from "$services/auth";
	import * as dataLayer from "$services/data-layer";
	import { initSyncListeners } from "$services/sync-queue";
	import InstallAppButton from "$lib/components/InstallAppButton.svelte";
	import BrandLogo from "$lib/components/BrandLogo.svelte";
	import LandingLessonPreview from "$lib/components/LandingLessonPreview.svelte";

	// Auth modal state
	let showAuthModal = $state(false);
	let authMode = $state<"signin" | "signup">("signin");
	let authEmail = $state("");
	let authPassword = $state("");
	let authName = $state("");
	let authError = $state("");
	let authLoading = $state(false);

	// Confirmation toast
	let showConfirmToast = $state(false);

	// After signup with email confirmation on: show a "check your email" view
	let signupEmailSent = $state(false);

	let isAuthenticated = $state(false);

	// Navbar scroll effect
	let scrolled = $state(false);


	// Refs for focus trap
	let modalEl: HTMLDivElement | undefined = $state();
	let emailInput: HTMLInputElement | undefined = $state();

	// No i18n needed on landing page — content is English only

	function openSignUp() {
		authMode = "signup";
		showAuthModal = true;
		authError = "";
		signupEmailSent = false;
		setTimeout(() => emailInput?.focus(), 100);
	}

	function openSignIn() {
		authMode = "signin";
		showAuthModal = true;
		authError = "";
		signupEmailSent = false;
		setTimeout(() => emailInput?.focus(), 100);
	}

	function toggleAuthModal() {
		showAuthModal = !showAuthModal;
		authError = "";
		signupEmailSent = false;
		if (showAuthModal) setTimeout(() => emailInput?.focus(), 100);
	}

	function toggleAuthMode() {
		authMode = authMode === "signin" ? "signup" : "signin";
		authError = "";
		signupEmailSent = false;
	}

	async function submitAuth() {
		authError = "";
		if (!authEmail.trim() || !authPassword) {
			authError = "Please enter email and password.";
			return;
		}
		authLoading = true;
		try {
			let result;
			if (authMode === "signup") {
				result = await auth.signUp(
					authEmail.trim(),
					authPassword,
					authName.trim() || "Learner",
				);
			} else {
				result = await auth.signIn(authEmail.trim(), authPassword);
			}
			if (result.error) {
				authError = result.error;
			} else if (
				authMode === "signup" &&
				!(await auth.getSession())
			) {
				// Email confirmation is required: signUp returns a user but no
				// active session. Don't redirect — tell them to check their inbox.
				signupEmailSent = true;
			} else {
				showAuthModal = false;
				authEmail = "";
				authPassword = "";
				authName = "";
				// Navigate immediately — server guards handle the exact destination.
				// Heavy background work (profile sync, UI refresh) runs after navigation.
				const targetLang = result.user?.user_metadata?.target_language;
				goto(
					targetLang === "de" || targetLang === "fr"
						? "/home"
						: "/onboarding",
				);
				// Fire-and-forget: don't await these before navigating
				if (result.user) auth.ensureProfile(result.user);
				dataLayer.syncOnLogin();
				updateProfileUI();
			}
		} catch (e: any) {
			authError = e.message || "An error occurred.";
		} finally {
			authLoading = false;
		}
	}

	/**
	 * The navbar only needs to know whether someone is signed in — the
	 * redesigned page shows "Open App" rather than a name and avatar, so the
	 * display name and avatar state it used to keep are gone. Caching the
	 * avatar URL stays: /home reads it, and warming it here saves that page
	 * a round trip.
	 */
	async function updateProfileUI() {
		isAuthenticated = await auth.isAuthenticated();
		if (!isAuthenticated) return;
		const url = dataLayer.getAvatarUrl() || (await auth.getAvatarUrl());
		if (url) dataLayer.setAvatarUrl(url);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === "Escape" && showAuthModal) toggleAuthModal();
		if (e.key === "Tab" && showAuthModal && modalEl) {
			const focusable = modalEl.querySelectorAll<HTMLElement>(
				'input:not([style*="display:none"]), button, a[href], [tabindex]:not([tabindex="-1"])',
			);
			const visible = Array.from(focusable).filter((el) => {
				let p: HTMLElement | null = el;
				while (p && p !== modalEl) {
					if (p.style && p.style.display === "none") return false;
					p = p.parentElement as HTMLElement;
				}
				return true;
			});
			if (!visible.length) return;
			const first = visible[0];
			const last = visible[visible.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		}
	}

	function handleAuthKeydown(e: KeyboardEvent) {
		if (e.key === "Enter") submitAuth();
	}

	function handleScroll() {
		scrolled = window.scrollY > 60;
	}

	onMount(async () => {
		initSyncListeners();
		const params = $page.url.searchParams;
		if (params.get("confirmed") === "true") {
			showConfirmToast = true;
			setTimeout(() => (showConfirmToast = false), 5000);
			goto("/", { replaceState: true });
		}
		await updateProfileUI();

	});
</script>

<svelte:window onkeydown={handleKeydown} onscroll={handleScroll} />

<svelte:head>
	<title
		>Learn German Through Real Conversations – Voice Practice & Daily Lessons | Mirifer</title
	>
	<meta
		name="description"
		content="120 daily German lessons built from real conversations, with native audio, voice practice and spaced repetition. Try a lesson free — no signup."
	/>
	<link rel="canonical" href="https://www.mirifer.com/" />
	<!-- Must mirror the annotations on /fa. Google discards hreflang that is
	     not reciprocal, so omitting these here would silently void both. -->
	<link rel="alternate" hreflang="en" href="https://www.mirifer.com/" />
	<link rel="alternate" hreflang="fa" href="https://www.mirifer.com/fa" />
	<link rel="alternate" hreflang="x-default" href="https://www.mirifer.com/" />

	<!-- Open Graph -->
	<meta
		property="og:title"
		content="Mirifer – Learn German Through Real Conversations"
	/>
	<meta
		property="og:description"
		content="Master German with voice recognition, spaced repetition, and 120 real-life daily lessons. Try a lesson free — no signup."
	/>
	<meta property="og:image" content="https://www.mirifer.com/og-image.jpg" />
	<meta property="og:url" content="https://www.mirifer.com/" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Mirifer" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta
		name="twitter:title"
		content="Mirifer – Learn German Through Real Conversations"
	/>
	<meta
		name="twitter:description"
		content="120 daily lessons. Voice practice. Spaced repetition. Try a lesson free."
	/>
	<meta name="twitter:image" content="https://www.mirifer.com/og-image.jpg" />

	<!-- Structured Data -->
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: "Mirifer",
		applicationCategory: "EducationApplication",
		description:
			"Learn German through real-life conversations with voice recognition and spaced repetition.",
		operatingSystem: "Web",
		offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
		url: "https://www.mirifer.com",
	})}</script>`}
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: [
			{
				"@type": "Question",
				name: "How should I work through the lessons?",
				acceptedAnswer: {
					"@type": "Answer",
					text: "One lesson a day, in order. Completing a lesson unlocks the next, and you can revisit any finished lesson whenever you want. Missed a day? Pick up where you left off — there is no streak to lose.",
				},
			},
			{
				"@type": "Question",
				name: "Can I learn German for free?",
				acceptedAnswer: {
					"@type": "Answer",
					text: "Yes, during early access. You can try a lesson without signing up, and a free account gives you all 120 lessons, voice practice and spaced repetition flashcards — no credit card. If pricing ever changes, early-access users will be told well before anything changes.",
				},
			},
			{
				"@type": "Question",
				name: "How is Mirifer different from Duolingo?",
				acceptedAnswer: {
					"@type": "Answer",
					text: "While Duolingo uses gamified drills with isolated words, Mirifer teaches through real-life conversations. Every lesson is a scenario you'd actually face in Germany — ordering food, asking for directions, making small talk. Mirifer also includes voice recognition so you practise speaking out loud, with instant word-by-word feedback on what you said.",
				},
			},
			{
				"@type": "Question",
				name: "What level of German does Mirifer teach?",
				acceptedAnswer: {
					"@type": "Answer",
					text: "The 120-day path runs from A1 (complete beginner) through A2 and on toward B1. The readiness estimate covers the Goethe A1 exam; the later lessons build toward B1 but are not a B1 exam guarantee.",
				},
			},
		],
	})}</script>`}
</svelte:head>

<!-- ── Email Confirmation Toast ─────────────────────────── -->
{#if showConfirmToast}
	<div class="confirm-toast" role="status">
		✅ Email confirmed! You can now sign in.
	</div>
{/if}

<!-- ── Auth Modal ──────────────────────────────────────── -->
{#if showAuthModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		class="auth-overlay"
		role="dialog"
		aria-modal="true"
		aria-labelledby="auth-title"
		onclick={(e) => {
			if (e.target === e.currentTarget) toggleAuthModal();
		}}
	>
		<div class="auth-modal" bind:this={modalEl}>
			<button
				class="auth-close"
				onclick={toggleAuthModal}
				aria-label="Close dialog">×</button
			>
			<div class="auth-logo">
				<BrandLogo />
			</div>

			{#if signupEmailSent}
				<div class="auth-check-email">
					<div class="auth-check-icon">✉️</div>
					<h2 id="auth-title">Check your email</h2>
					<p class="auth-subtitle">
						We sent a confirmation link to <strong
							>{authEmail}</strong
						>. Click it to activate your account, then come back and
						sign in.
					</p>
					<button
						class="auth-submit"
						onclick={() => {
							signupEmailSent = false;
							authMode = "signin";
							authPassword = "";
						}}>Back to sign in</button
					>
				</div>
			{:else}
			<h2 id="auth-title">
				{authMode === "signin" ? "Welcome Back" : "Start Your Journey"}
			</h2>
			<p class="auth-subtitle">
				{authMode === "signin"
					? "Sign in to continue learning German"
					: "Create your free account — no card required"}
			</p>

			{#if authError}
				<div class="auth-error">{authError}</div>
			{/if}

			{#if authMode === "signup"}
				<div class="auth-field">
					<input
						type="text"
						placeholder="Your Name"
						aria-label="Display Name"
						bind:value={authName}
						onkeydown={handleAuthKeydown}
					/>
				</div>
			{/if}

			<div class="auth-field">
				<input
					type="email"
					placeholder="Email address"
					aria-label="Email address"
					bind:this={emailInput}
					bind:value={authEmail}
					onkeydown={handleAuthKeydown}
				/>
			</div>
			<div class="auth-field">
				<input
					type="password"
					placeholder="Password"
					aria-label="Password"
					bind:value={authPassword}
					onkeydown={handleAuthKeydown}
				/>
			</div>

			<button
				class="auth-submit"
				onclick={submitAuth}
				disabled={authLoading}
			>
				{authLoading
					? "···"
					: authMode === "signin"
						? "Sign In"
						: "Create Free Account"}
			</button>

			<GoogleSignIn next="/home" onError={(m) => (authError = m)} />

			{#if authMode === "signin"}
				<!-- This modal is a separate form from /login, so the reset
				     link added there was invisible to anyone who signed in
				     from here. Links across rather than duplicating the
				     flow. -->
				<p class="auth-forgot">
					<a href="/login?mode=reset">Forgot your password?</a>
				</p>
			{/if}

			<p class="auth-toggle">
				<span
					>{authMode === "signin"
						? "Don't have an account?"
						: "Already have an account?"}</span
				>
				<!-- svelte-ignore a11y_invalid_attribute -->
				<a
					href="#"
					onclick={(e) => {
						e.preventDefault();
						toggleAuthMode();
					}}>{authMode === "signin" ? " Sign Up Free" : " Sign In"}</a
				>
			</p>
			{/if}
		</div>
	</div>
{/if}

<!-- ════════════════════════════════════════════════════════ -->
<!--  NAVBAR                                                  -->
<!-- ════════════════════════════════════════════════════════ -->
<nav class="navbar" class:scrolled>
	<a href="/" class="brand" aria-label="Mirifer home">
		<BrandLogo />
	</a>

	<div class="nav-links">
		<a href="#session">The session</a>
		<a href="#method">Method</a>
		<a href="#path">120-day path</a>
		<a href="#faq">FAQ</a>
	</div>

	<div class="navbar-right">
		<a href="/fa" class="lang-link" lang="fa" hreflang="fa">فارسی</a>
		<InstallAppButton />
		{#if isAuthenticated}
			<a href="/home" class="btn btn-primary">Open App &rarr;</a>
		{:else}
			<button class="btn btn-ghost" onclick={openSignIn}>Sign in</button>
			<button class="btn btn-primary" onclick={openSignUp}>Start free</button>
		{/if}
	</div>
</nav>

<main id="main-content" tabindex="-1">
	<!-- ══ HERO ══════════════════════════════════════════ -->
	<section class="hero">
		<div class="hero-copy">
			<span class="eyebrow-pill"><i aria-hidden="true"></i>German for real conversations</span>
			<h1>
				Learn German<br />the way you would<br />learn it <em>on the street</em>.
			</h1>
			<p class="hero-lede">
				One short lesson a day, built entirely out of sentences real people
				say. You hear it, you say it out loud, and the app brings it back
				when you are about to forget it.
			</p>
			<div class="hero-actions">
				{#if isAuthenticated}
					<a href="/home" class="pill pill-solid">Go to my lessons →</a>
				{:else}
					<a href="/try" class="pill pill-solid">Try a lesson now — no signup</a>
				{/if}
			</div>
			<ul class="hero-trust">
				<li>No credit card</li>
				<li>Works in your browser</li>
				<li>English &amp; Persian support</li>
			</ul>
		</div>

		<figure class="hero-visual">
			<img
				class="hero-photo"
				src="/images/mirifer-cafe-hero.webp"
				srcset="/images/mirifer-cafe-hero-768.webp 768w, /images/mirifer-cafe-hero.webp 1536w"
				sizes="(max-width: 640px) calc(100vw - 36px), (max-width: 1000px) calc(100vw - 80px), (max-width: 1280px) calc((100vw - 128px) / 2), 576px"
				width="1536"
				height="1024"
				fetchpriority="high"
				alt="A young woman and man chatting over coffee at a Berlin street café."
			/>
			<figcaption class="hero-speech">
				<span lang="de">Einen Kaffee, bitte!</span>
				<span class="hero-translation">A coffee, please.</span>
			</figcaption>
		</figure>
	</section>


	<!-- ══ THE SESSION ═══════════════════════════════════ -->
	<section class="band" id="session">
		<p class="label">What the app actually is</p>
		<h2>A conversation to hear, understand, and say out loud.</h2>
		<p class="lede">
			Every day opens on one scene — rain, a café, a landlord. Hear everyday German,
			understand each sentence, and practise your reply.
		</p>
		<div class="session-content">
			<ol class="numbered">
				<li>
					<span class="num">01</span>
					<div>
						<h3>Pick the day, or let it pick you</h3>
						<p>Day 44: Talking About Habits · middle A2</p>
					</div>
				</li>
				<li>
					<span class="num">02</span>
					<div>
						<h3>Slow the audio to 0.75×</h3>
						<p>Until the sentence stops being a blur and becomes words.</p>
					</div>
				</li>
				<li>
					<span class="num">03</span>
					<div>
						<h3>Switch on Blind Mode</h3>
						<p>Text disappears. Only your ears are left.</p>
					</div>
				</li>
				<li>
					<span class="num">04</span>
					<div>
						<h3>Read in English or Persian</h3>
						<p>Full Farsi translations, right-to-left, for every line.</p>
					</div>
				</li>
			</ol>
			<div class="session-preview"><LandingLessonPreview /></div>
		</div>
	</section>

	<!-- ══ METHOD — full-bleed green ═════════════════════ -->
	<section class="bleed bleed-green" id="method">
		<div class="bleed-inner">
			<p class="label">The method</p>
			<h2>Four rules that make it work.</h2>
			<p class="lede">
				Forget memorising vocabulary tables. Mirifer puts you into real
				conversation from day one — and these four rules are what turn it
				into German you can actually reach for.
			</p>
			<ol class="rules">
				<li>
					<span class="num">01</span>
					<div>
						<h3>One lesson a day. That is it.</h3>
						<p>
							Same time each day if you can. Four on Sunday and none until
							Friday is not a week of German.
						</p>
					</div>
				</li>
				<li>
					<span class="num">02</span>
					<div>
						<h3>Say every sentence out loud.</h3>
						<p>
							Even alone. Especially alone. Your mouth has to learn the
							shapes, and it only learns them by making them.
						</p>
					</div>
				</li>
				<li>
					<span class="num">03</span>
					<div>
						<h3>Do not restart a lesson for a perfect score.</h3>
						<p>
							Getting it wrong and being corrected is the lesson. Move on —
							the review system will bring it back.
						</p>
					</div>
				</li>
				<li>
					<span class="num">04</span>
					<div>
						<h3>Come back tomorrow.</h3>
						<p>That is the whole method. Everything else is detail.</p>
					</div>
				</li>
			</ol>
		</div>
	</section>

	<!-- ══ THREE PILLARS ═════════════════════════════════ -->
	<section class="band">
		<div class="trio">
			<div class="trio-card">
				<svg class="trio-icon" aria-hidden="true" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/></svg>
				<h3>Hear natural audio</h3>
				<p>
					Native speakers at a natural pace, slowed to 0.75× whenever
					the sentence outruns you.
				</p>
			</div>
			<div class="trio-card">
				<svg class="trio-icon" aria-hidden="true" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
				<h3>Say it out loud</h3>
				<p>
					The mic hears every attempt and tells you which word slipped, so you
					can try the line again.
				</p>
			</div>
			<div class="trio-card">
				<svg class="trio-icon" aria-hidden="true" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
				<h3>Review at the right time</h3>
				<p>
					Spaced repetition schedules each sentence to return at the edge of
					forgetting, not before.
				</p>
			</div>
		</div>
	</section>

	<!-- ══ PROGRESS ══════════════════════════════════════ -->
	<section class="band split">
		<div>
			<p class="label">Know exactly where you stand</p>
			<h2>See which skill is holding you back.</h2>
		</div>
		<div class="split-body">
			<p>
				A Goethe A1 readiness estimate built from your own lesson history —
				listening, reading, writing and speaking scored separately. Listening
				and speaking come from the lessons; reading and writing come from the
				review questions, where you pick the meaning or type the missing word.
				Until you have answered those, the app labels the score an estimate.
			</p>
			<p>
				The sentences
				you keep missing come back first.
			</p>
		</div>
	</section>

	<!-- ══ GRAMMAR ═══════════════════════════════════════ -->
	<section class="band">
		<p class="label">When you need the grammar</p>
		<h2>The rules are there when a sentence stops making sense.</h2>
		<p class="lede">
			German Basics is the reference shelf behind the daily lesson. You open it
			because a sentence confused you, read the rule, and go back.
		</p>
		<ul class="chips">
			<li><a href="/basics/pronounsAndSein">Pronouns</a></li>
			<li><a href="/basics/articles">Articles</a></li>
			<li><a href="/basics/cases">Cases (Fälle)</a></li>
			<li><a href="/basics/wordOrder">Word order</a></li>
			<li><a href="/basics/modalVerbs">Modal verbs</a></li>
			<li><a href="/basics/verbTenses">Verb tenses</a></li>
			<li><a href="/basics/negationImpersonal">Negation</a></li>
			<li><a href="/basics">All eighteen topics →</a></li>
		</ul>
	</section>

	<!-- ══ PHILOSOPHY ════════════════════════════════════ -->
	<section class="band">
		<p class="label">Our philosophy</p>
		<h2>Four ideas Mirifer is built on.</h2>
		<div class="ideas">
			<div>
				<h3>You learn a language in sentences, not words.</h3>
				<p>
					A word list gives you words. A sentence gives you a word, its
					gender, its place in the order, and the shape of the thing around
					it. You learn <em lang="de">ich hätte gern einen Kaffee</em> — not
					<em>coffee</em>.
				</p>
			</div>
			<div>
				<h3>Daily beats intense.</h3>
				<p>
					Fifteen minutes today does more than two hours on Sunday. Missed a
					day? Just pick up where you left off — no penalty, no lost streak.
				</p>
			</div>
			<div>
				<h3>You speak from the first lesson.</h3>
				<p>
					Not after an intro grammar course. On day one you say a German
					sentence out loud and hear what the app heard — the gap between
					those two is where the learning happens.
				</p>
			</div>
			<div>
				<h3>Saying it wrong out loud beats saying it right in your head.</h3>
				<p>
					Silent accuracy does not survive contact with a real conversation.
					Speak, be corrected, speak again. That only works if you make the
					mistakes.
				</p>
			</div>
		</div>
	</section>

	<!-- ══ PATH — full-bleed navy ════════════════════════ -->
	<section class="bleed bleed-navy" id="path">
		<div class="bleed-inner">
			<p class="label">Your learning path</p>
			<h2>One hundred and twenty days, from your first sentence toward real conversation.</h2>
			<p class="lede">
				No more wondering what to do today. Each day has a name, a scene, and
				sentences that build on everything before it.
			</p>
			<div class="levels">
				<div class="level">
					<span class="level-days">Days 1 — 30</span>
					<h3>A1 · Getting by</h3>
					<p>
						Introducing yourself, ordering, asking prices, telling time, and
						the first hundred verbs in the mouth rather than on a page.
					</p>
				</div>
				<div class="level">
					<span class="level-days">Days 31 — 65</span>
					<h3>A2 · Daily life</h3>
					<p>
						Shopping, travel, appointments, work, weekends, habits — the
						situations that fill an ordinary week.
					</p>
				</div>
				<div class="level">
					<span class="level-days">Days 66 — 120</span>
					<h3>Toward B1 · Opinions</h3>
					<p>
						Opinions, stories, and handling the conversation when it turns —
						the groundwork for B1, not a finish line.
					</p>
				</div>
			</div>
			<a class="pill pill-leaf" href="/try">Begin day 1 — it is free</a>
		</div>
	</section>

	<!-- ══ AUDIENCE ══════════════════════════════════════ -->
	<section class="band">
		<p class="label">Who it is for</p>
		<h2>Built for people who actually want to speak.</h2>
		<p class="lede">
			Not for collecting streaks or badges. For the moment someone asks you
			something in German and you answer.
		</p>
		<div class="ideas">
			<div>
				<h3>Complete beginners</h3>
				<p>
					Start at zero. The first days cover greetings, numbers, and the
					handful of verbs everything else hangs off.
				</p>
			</div>
			<div>
				<h3>Travellers</h3>
				<p>
					Planning a trip? Learn what you will actually need: ordering food,
					asking directions, and getting a hotel problem fixed.
				</p>
			</div>
			<div>
				<h3>Expats and new residents</h3>
				<p>
					Anmeldung, landlords, Kita places, doctors and the Bürgeramt — the
					German that decides how your week goes.
				</p>
			</div>
			<div>
				<h3>Persian speakers</h3>
				<p>
					Every sentence carries a full Farsi translation alongside the
					English one, set right-to-left, plus the sounds Persian does not
					have. <a href="/fa">فارسی →</a>
				</p>
			</div>
		</div>
	</section>

	<!-- ══ FAQ ═══════════════════════════════════════════ -->
	<section class="band faq" id="faq">
		<p class="label">Common questions</p>
		<h2>Frequently asked questions</h2>
		<details>
			<summary>How should I work through the lessons?</summary>
			<p>
				One lesson a day, in order. Completing a lesson unlocks the next one,
				and you can revisit any finished lesson whenever you want. Missed a
				day? Pick up where you left off.
			</p>
		</details>
		<details>
			<summary>Can I learn German for free?</summary>
			<p>
				Yes. You can try a lesson without signing up or entering a card.
				Create a free account to save your progress.
			</p>
		</details>
		<details>
			<summary>Will it stay free?</summary>
			<p>
				Mirifer is free during early access. If that ever changes, early-access
				users will hear about it well before anything changes — no surprise
				charges, and no card on file to charge.
			</p>
		</details>
		<details>
			<summary>How is Mirifer different from other language apps?</summary>
			<p>
				No streaks, no gems, no tapping words into a slot. Every lesson is a
				scripted conversation you listen to and say back out loud, and the mic
				tells you which word slipped.
			</p>
		</details>
		<details>
			<summary>What level of German does Mirifer teach?</summary>
			<p>
				The path runs from A1 through A2 and on toward B1. The readiness
				estimate covers the Goethe A1 exam, scored per skill; it does not yet
				benchmark A2 or B1.
			</p>
		</details>
		<details>
			<summary>Do I need a microphone?</summary>
			<p>
				Only for speaking practice, and any laptop or phone mic works. Without
				one you can still listen, read and type.
			</p>
		</details>
		<details>
			<summary>Is it good for a complete beginner?</summary>
			<p>
				Day 1 assumes no German at all. Start with greetings and introductions,
				then build on what you learn as you complete each lesson.
			</p>
		</details>
	</section>

	<!-- ══ CTA ═══════════════════════════════════════════ -->
	<section class="band cta" id="cta">
		<h2>Ready to speak German?</h2>
		<p class="lede">
			Start with day one. Hear a conversation, understand it, and practise
			your reply out loud.
		</p>
		<div class="hero-actions center">
			{#if isAuthenticated}
				<a href="/home" class="pill pill-solid">Go to my lessons →</a>
			{:else}
				<button class="pill pill-solid" onclick={openSignUp}>
					Create your free account
				</button>
				<a href="/try" class="pill pill-outline">See a lesson first</a>
			{/if}
		</div>
		<p class="fine">No credit card · Free during early access</p>
	</section>
</main>

<footer class="site-footer">
	<div class="foot-brand">
		<a href="/" class="brand" aria-label="Mirifer home">
			<BrandLogo />
		</a>
		<span>Learn German through real conversation</span>
	</div>
	<nav class="foot-links" aria-label="Footer">
		<a href="#session">How it works</a>
		<a href="#faq">FAQ</a>
		<a href="/fa" lang="fa" hreflang="fa">فارسی</a>
		<a href="/privacy">Privacy</a>
		<a href="/terms">Terms</a>
	</nav>
</footer>

<style>
	.confirm-toast {
		position: fixed;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		width: max-content;
		max-width: calc(100% - 32px);
		padding: 16px 24px;
		border-radius: 14px;
		background: var(--leaf);
		color: var(--on-accent);
		font-weight: 600;
		box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
		z-index: 2000;
	}

	/*
	 * Landing page — the "Mirifer Landing v2" artboard.
	 *
	 * Written against the tokens the redesign added to app.css rather than
	 * the artboard's raw hexes: those tokens were derived from this very
	 * design, and hardcoding #0E5240 here would fork the palette the moment
	 * anything is adjusted centrally. It is also what makes dark mode work
	 * at all — the artboards are light-only.
	 *
	 * The two full-bleed bands (green, navy) are the one place fixed colour
	 * is correct: they are painted surfaces, not theme-following ones, and
	 * their text is set against them explicitly.
	 */

	/* ── Navbar ──────────────────────────────────────── */
	.navbar {
		position: sticky;
		top: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-5);
		padding: 18px 40px;
		background: color-mix(in srgb, var(--paper) 92%, transparent);
		backdrop-filter: blur(12px);
		border-bottom: 1px solid transparent;
		transition: border-color 0.2s, padding 0.2s;
	}

	.navbar.scrolled {
		padding: 12px 40px;
		border-bottom-color: var(--line);
	}

	.brand {
		display: flex;
		align-items: center;
		flex: none;
		text-decoration: none;
	}

	.nav-links {
		display: flex;
		gap: 26px;
		font-size: 0.92rem;
	}

	.nav-links a {
		color: var(--ink-soft);
		text-decoration: none;
	}

	.nav-links a:hover {
		color: var(--accent);
	}

	.navbar-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	/* Quieter than the sign-in buttons — a way out for the minority who need
	   it, not a competing call to action. Stays visible on mobile, where
	   most Iranian traffic is, unlike the primary CTA. */
	.lang-link {
		display: inline-flex;
		align-items: center;
		min-block-size: 44px;
		padding: 0 10px;
		border-radius: var(--radius-control);
		color: var(--ink-soft);
		font-weight: 600;
		font-size: 0.95rem;
		text-decoration: none;
		white-space: nowrap;
	}

	.lang-link:hover {
		color: var(--accent);
		background: var(--accent-wash);
	}

	.btn {
		font: inherit;
		font-size: 0.92rem;
		font-weight: 500;
		border-radius: var(--radius-pill);
		padding: 10px 20px;
		min-block-size: 44px;
		display: inline-flex;
		align-items: center;
		cursor: pointer;
		text-decoration: none;
		white-space: nowrap;
	}

	.btn-primary {
		background: var(--accent);
		color: var(--on-accent);
		border: none;
	}

	.btn-primary:hover {
		background: var(--accent-deep);
	}

	.btn-ghost {
		background: transparent;
		border: none;
		color: var(--ink-soft);
	}

	.btn-ghost:hover {
		color: var(--accent);
	}

	/* ── Shared rhythm ───────────────────────────────── */
	main {
		display: block;
	}

	.band,
	.hero,
	.bleed-inner,
	.site-footer {
		max-inline-size: 1180px;
		margin-inline: auto;
		padding-inline: 40px;
	}

	.band {
		padding-block: 96px;
	}

	.label {
		font-family: var(--font-mono);
		font-size: var(--type-label);
		letter-spacing: var(--tracking-label);
		text-transform: uppercase;
		color: var(--ink-faint);
		margin: 0 0 14px;
	}

	h1,
	h2,
	h3 {
		font-family: var(--font-display);
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: var(--leading-tight);
		color: var(--ink);
		margin: 0;
	}

	.band > h2 {
		font-size: clamp(1.9rem, 3.6vw, 2.6rem);
		max-inline-size: 22ch;
	}

	.lede {
		font-size: 1.05rem;
		line-height: var(--leading-body);
		color: var(--ink-soft);
		max-inline-size: 62ch;
		margin: 16px 0 0;
	}

	/* ── Pills ───────────────────────────────────────── */
	.pill {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font: inherit;
		font-size: 1rem;
		font-weight: 500;
		padding: 15px 28px;
		min-block-size: 48px;
		border-radius: var(--radius-pill);
		text-decoration: none;
		cursor: pointer;
		border: 1px solid transparent;
		white-space: nowrap;
	}

	.pill-solid {
		background: var(--accent);
		color: var(--on-accent);
	}

	.pill-solid:hover {
		background: var(--accent-deep);
	}

	.pill-outline {
		border-color: var(--control-edge);
		color: var(--ink);
		background: transparent;
	}

	.pill-outline:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.pill-leaf {
		background: var(--leaf);
		color: #fff;
	}

	.pill-leaf:hover {
		background: var(--leaf-deep);
	}

	/* ── Hero ────────────────────────────────────────── */
	.hero {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 48px;
		align-items: center;
		max-inline-size: 1280px;
		padding-block: 64px 72px;
	}

	.eyebrow-pill {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		font-family: var(--font-mono);
		font-size: var(--type-label);
		letter-spacing: var(--tracking-label);
		text-transform: uppercase;
		color: var(--accent);
		border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
		background: var(--accent-wash);
		padding: 7px 13px;
		border-radius: var(--radius-pill);
	}

	.eyebrow-pill i {
		inline-size: 6px;
		block-size: 6px;
		border-radius: 50%;
		background: var(--leaf);
	}

	.hero h1 {
		font-size: clamp(2.6rem, 4.8vw, 4.05rem);
		line-height: 1.04;
		margin: 24px 0 0;
	}

	.hero h1 em {
		font-style: italic;
		color: var(--accent);
		white-space: nowrap;
	}

	.hero-lede {
		font-size: 1.15rem;
		line-height: 1.55;
		color: var(--ink-soft);
		max-inline-size: 47ch;
		margin: 24px 0 0;
	}

	.hero-actions {
		display: flex;
		gap: 14px;
		margin-top: 34px;
		flex-wrap: wrap;
	}

	.hero-actions.center {
		justify-content: center;
	}

	.hero-trust {
		display: flex;
		gap: 24px;
		margin: 28px 0 0;
		padding: 0;
		list-style: none;
		font-size: 0.85rem;
		color: var(--ink-faint);
		flex-wrap: wrap;
	}

	/* ── Hero visual ─────────────────────────────────── */
	.hero-visual {
		position: relative;
		min-inline-size: 0;
		margin: 0;
	}

	.hero-photo {
		display: block;
		inline-size: 100%;
		block-size: auto;
		aspect-ratio: 6 / 5;
		object-fit: cover;
		object-position: 50% 50%;
		border-radius: 26px;
		box-shadow: 0 20px 48px -28px rgb(16 26 21 / 40%);
	}

	.hero-speech {
		position: absolute;
		inset-inline-start: 24px;
		inset-block-end: 24px;
		max-inline-size: calc(100% - 48px);
		padding: 16px 22px;
		border-radius: 18px 18px 18px 4px;
		background: #fffaf2;
		color: #075446;
		box-shadow: 0 8px 28px rgb(0 0 0 / 14%);
	}

	.hero-speech > span {
		display: block;
	}

	.hero-speech > [lang='de'] {
		font-family: var(--font-display);
		font-size: clamp(1.2rem, 2vw, 1.65rem);
		font-weight: 500;
		line-height: 1.2;
	}

	.hero-translation {
		margin-top: 5px;
		font-size: 0.8rem;
		color: #50635a;
	}
	/* ── Stats ───────────────────────────────────────── */

	.session-content {
		display: grid;
		grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
		gap: 56px;
		align-items: center;
		margin-top: 40px;
	}

	.session-content .numbered {
		margin: 0;
	}

	.session-preview {
		min-inline-size: 0;
	}

	/* ── Numbered lists ──────────────────────────────── */
	.numbered,
	.rules {
		list-style: none;
		padding: 0;
		margin: 40px 0 0;
		display: grid;
		gap: 2px;
	}

	.numbered li,
	.rules li {
		display: grid;
		grid-template-columns: 64px 1fr;
		gap: 20px;
		padding: 22px 0;
		border-top: 1px solid var(--line);
		align-items: start;
	}

	.num {
		font-family: var(--font-mono);
		font-size: 0.8rem;
		letter-spacing: var(--tracking-label);
		color: var(--ink-faint);
		padding-top: 4px;
	}

	.numbered h3,
	.rules h3 {
		font-size: var(--type-title);
		margin: 0 0 6px;
	}

	.numbered p,
	.rules p {
		margin: 0;
		color: var(--ink-soft);
		line-height: var(--leading-body);
		max-inline-size: 58ch;
	}

	/* ── Full-bleed bands ────────────────────────────── */
	/* Painted surfaces, not theme-following ones: the colour IS the design
	   here, so it is fixed in both themes and the text is set against it
	   explicitly rather than inheriting an ink token that would invert. */
	.bleed {
		padding-block: 112px;
		margin-block: 0;
	}

	.bleed-green {
		background: var(--accent-deep);
	}

	.bleed-navy {
		background: #10121f;
	}

	.bleed h2,
	.bleed h3 {
		color: #f7f5f0;
	}

	.bleed .label {
		color: rgba(247, 245, 240, 0.6);
	}

	.bleed .lede,
	.bleed p {
		color: rgba(247, 245, 240, 0.76);
	}

	.bleed .num {
		color: rgba(247, 245, 240, 0.5);
	}

	.bleed .rules li {
		border-top-color: rgba(247, 245, 240, 0.16);
	}

	.bleed h2 {
		font-size: clamp(1.9rem, 3.6vw, 2.6rem);
		max-inline-size: 22ch;
	}

	.levels {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 22px;
		margin: 44px 0 36px;
	}

	.level {
		background: rgba(247, 245, 240, 0.06);
		border: 1px solid rgba(247, 245, 240, 0.14);
		border-radius: var(--radius-card);
		padding: 24px 22px;
	}

	.level-days {
		font-family: var(--font-mono);
		font-size: var(--type-label);
		letter-spacing: var(--tracking-label);
		text-transform: uppercase;
		color: rgba(247, 245, 240, 0.6);
	}

	.level h3 {
		font-size: var(--type-title);
		margin: 8px 0 8px;
	}

	.level p {
		margin: 0;
		font-size: 0.92rem;
		line-height: var(--leading-body);
	}

	/* ── Trio ────────────────────────────────────────── */
	.trio {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 22px;
	}

	.trio-card {
		background: var(--paper-raised);
		border: 1px solid var(--line);
		border-radius: var(--radius-card);
		padding: 28px 24px;
	}

	.trio-icon {
		display: block;
		color: var(--accent);
		margin-bottom: 12px;
	}

	.trio-card h3 {
		font-size: var(--type-title);
		margin: 0 0 8px;
	}

	.trio-card p {
		margin: 0;
		color: var(--ink-soft);
		line-height: var(--leading-body);
		font-size: 0.95rem;
	}

	/* ── Split ───────────────────────────────────────── */
	.split {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 60px;
		align-items: start;
	}

	.split-body p {
		margin: 0 0 16px;
		color: var(--ink-soft);
		line-height: var(--leading-body);
	}

	/* ── Chips ───────────────────────────────────────── */
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 10px;
		list-style: none;
		padding: 0;
		margin: 32px 0 0;
	}

	.chips a {
		display: inline-flex;
		align-items: center;
		min-block-size: 44px;
		padding: 8px 18px;
		border: 1px solid var(--line);
		border-radius: var(--radius-pill);
		background: var(--paper-raised);
		color: var(--ink);
		text-decoration: none;
		font-size: 0.92rem;
	}

	.chips a:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	/* ── Ideas grid ──────────────────────────────────── */
	.ideas {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 32px 44px;
		margin-top: 44px;
	}

	.ideas h3 {
		font-size: var(--type-title);
		margin: 0 0 8px;
		line-height: 1.35;
	}

	.ideas p {
		margin: 0;
		color: var(--ink-soft);
		line-height: var(--leading-body);
	}

	.ideas em {
		font-style: normal;
		font-weight: 600;
		color: var(--ink);
	}

	.ideas a {
		color: var(--accent);
		font-weight: 600;
	}

	/* ── FAQ ─────────────────────────────────────────── */
	.faq {
		max-inline-size: 860px;
	}

	.faq details {
		border-top: 1px solid var(--line);
		padding: 4px 0;
	}

	.faq details:last-of-type {
		border-bottom: 1px solid var(--line);
	}

	.faq summary {
		list-style: none;
		cursor: pointer;
		padding: 20px 34px 20px 0;
		position: relative;
		font-size: 1.02rem;
		font-weight: 600;
		color: var(--ink);
	}

	.faq summary::-webkit-details-marker {
		display: none;
	}

	.faq summary::after {
		content: '+';
		position: absolute;
		inset-inline-end: 4px;
		inset-block-start: 18px;
		font-size: 1.3rem;
		font-weight: 400;
		color: var(--ink-faint);
	}

	.faq details[open] summary::after {
		content: '−';
	}

	.faq details p {
		margin: 0 0 20px;
		color: var(--ink-soft);
		line-height: var(--leading-body);
		max-inline-size: 68ch;
	}

	/* ── CTA ─────────────────────────────────────────── */
	.cta {
		text-align: center;
	}

	.cta h2 {
		max-inline-size: none;
		font-size: clamp(2rem, 4vw, 2.9rem);
	}

	.cta .lede {
		margin-inline: auto;
	}

	.fine {
		margin-top: 20px;
		font-size: 0.85rem;
		color: var(--ink-faint);
	}

	/* ── Footer ──────────────────────────────────────── */
	.site-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
		flex-wrap: wrap;
		padding-block: 32px 56px;
		border-top: 1px solid var(--line);
	}

	.foot-brand {
		--landing-logo-width: 160px;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
	}

	.foot-brand span {
		font-size: 0.85rem;
		color: var(--ink-faint);
	}

	.foot-links {
		display: flex;
		gap: 22px;
		flex-wrap: wrap;
		font-size: 0.9rem;
	}

	.foot-links a {
		color: var(--ink-soft);
		text-decoration: none;
	}

	.foot-links a:hover {
		color: var(--accent);
	}

	/* ── Responsive ──────────────────────────────────── */
	@media (max-width: 1000px) {
		.session-content {
			grid-template-columns: minmax(0, 1fr);
			gap: 32px;
		}

		.session-preview {
			order: -1;
			inline-size: 100%;
			max-inline-size: 520px;
			justify-self: center;
		}

		.hero,
		.split {
			grid-template-columns: 1fr;
			gap: 44px;
		}

		.hero-photo {
			aspect-ratio: 3 / 2;
		}

		.nav-links {
			display: none;
		}
	}

	@media (max-width: 640px) {
		.navbar,
		.navbar.scrolled {
			padding: 12px 18px;
			gap: 8px;
			--landing-logo-width: 128px;
		}

		.band,
		.hero,
		.bleed-inner,
		.site-footer {
			padding-inline: 18px;
		}

		.band {
			padding-block: 64px;
		}

		.bleed {
			padding-block: 72px;
		}

		.hero {
			padding-block: 48px 40px;
			gap: 0;
		}

		.hero-copy {
			display: contents;
		}

		.hero .eyebrow-pill {
			justify-self: start;
			order: 1;
		}

		.hero h1 {
			order: 2;
		}

		.hero-lede {
			order: 4;
		}

		.hero .hero-actions {
			order: 5;
		}

		.hero-trust {
			order: 6;
		}

		/* The primary CTA is dropped on phones, so the language link must not
		   be — most Iranian traffic is phone traffic, which makes the small
		   screen where it matters most, not least. */
		.navbar-right .btn-primary {
			display: none;
		}

		.lang-link {
			padding: 0 6px;
			font-size: 0.9rem;
		}

		.hero-actions .pill {
			inline-size: 100%;
		}

		.numbered li,
		.rules li {
			grid-template-columns: 1fr;
			gap: 6px;
		}

		.hero-visual {
			order: 3;
			margin-top: 28px;
		}

		.hero-photo {
			aspect-ratio: 4 / 3;
			border-radius: 20px;
		}

		.hero-speech {
			inset-inline-start: 16px;
			inset-block-end: 16px;
			max-inline-size: calc(100% - 32px);
			padding: 12px 16px;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.navbar {
			transition: none;
		}
	}

	/* ── Auth modal — preserved from the previous design ─────────
	   The modal is unchanged markup, so its styles come across intact
	   rather than being reinvented alongside the new page. */
/* ── Auth modal ──────────────────────────────────── */
	.auth-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.82);
		backdrop-filter: blur(6px);
		z-index: 1000;
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 20px;
	}

.auth-modal {
		background: var(--paper-raised);
		border-radius: 24px;
		padding: 48px 40px 40px;
		max-width: 420px;
		width: 100%;
		border: 1px solid var(--line);
		position: relative;
		box-shadow: var(--paper-shadow);
	}

.auth-close {
		position: absolute;
		top: 16px;
		right: 20px;
		background: none;
		border: none;
		color: var(--ink-soft);
		font-size: 1.6rem;
		cursor: pointer;
		line-height: 1;
		padding: 4px;
		transition: color 0.2s;
	}

.auth-close:hover {
		color: var(--ink);
	}

.auth-logo {
		display: flex;
		justify-content: center;
		margin-bottom: 14px;
	}

.auth-modal h2 {
		text-align: center;
		color: var(--ink);
		font-family: var(--font-display);
		font-size: 1.6rem;
		margin-bottom: 8px;
	}

.auth-subtitle {
		text-align: center;
		color: var(--ink-soft);
		font-size: 0.92rem;
		margin-bottom: 24px;
	}

.auth-check-email {
		text-align: center;
	}

.auth-check-icon {
		font-size: 48px;
		margin-bottom: 8px;
	}

.auth-error {
		background: var(--accent-wash);
		color: var(--accent-deep);
		border: 1px solid var(--accent);
		padding: 12px;
		border-radius: 10px;
		margin-bottom: 16px;
		font-size: 0.9rem;
		text-align: center;
	}

.auth-field {
		margin-bottom: 14px;
	}

.auth-field input {
		width: 100%;
		padding: 14px 16px;
		border-radius: 12px;
		border: 1px solid var(--line);
		background: var(--paper-sunken);
		color: var(--ink);
		font-size: 1rem;
		box-sizing: border-box;
		transition: border-color 0.2s;
		font-family: inherit;
	}

.auth-field input:focus {
		outline: none;
		border-color: var(--accent);
	}

.auth-field input::placeholder {
		color: var(--ink-faint);
	}

.auth-submit {
		width: 100%;
		padding: 14px;
		border-radius: 12px;
		border: none;
		background: var(--accent);
		color: var(--on-accent);
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		margin-top: 8px;
		transition:
			opacity 0.2s,
			transform 0.2s;
		font-family: inherit;
	}

.auth-submit:hover:not(:disabled) {
		filter: brightness(1.06);
		transform: translateY(-1px);
	}

.auth-submit:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

.auth-forgot {
		text-align: center;
		margin: 12px 0 0;
		font-size: 0.86rem;
	}

.auth-forgot a {
		color: var(--ink-faint);
		text-decoration: underline;
	}

.auth-forgot a:hover {
		color: var(--accent);
	}

.auth-toggle {
		text-align: center;
		margin-top: 18px;
		color: var(--ink-faint);
		font-size: 0.9rem;
	}

.auth-toggle a {
		color: var(--accent-deep);
		text-decoration: none;
		font-weight: 700;
	}

@keyframes blobDrift {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		33% {
			transform: translate(22px, -18px) scale(1.04);
		}
		66% {
			transform: translate(-12px, 14px) scale(0.97);
		}
	}

@keyframes phoneFloat {
		0%,
		100% {
			transform: translateY(0) rotate(-1deg);
		}
		50% {
			transform: translateY(-14px) rotate(1deg);
		}
	}
</style>
