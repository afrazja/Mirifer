<svelte:head>
	<title>Privacy Policy | Mirifer – Learn German Online</title>
	<meta name="description" content="Mirifer privacy policy. Learn how we handle your data, what we collect, and how we protect your information." />
	<link rel="canonical" href="https://www.mirifer.com/privacy" />
</svelte:head>

<main class="legal-page">
	<nav class="legal-nav">
		<a href="/" class="back-link">← Back to Mirifer</a>
	</nav>

	<span id="main-content" tabindex="-1" class="sr-only"></span>

	<article class="legal-content">
		<h1>Privacy Policy</h1>
		<p class="legal-date">Last updated: September 25, 2026</p>

		<h2>1. What We Collect</h2>
		<p>When you create an account, we collect your <strong>email address</strong>, <strong>display name</strong>, and <strong>password</strong> (stored securely via Supabase Auth). We also store your lesson progress, vocabulary review data, and app preferences.</p>

		<h2>2. Voice Data</h2>
		<p>Voice answers use your browser's speech recognition. Your browser may send audio to its speech recognition service (for example, Google in Chrome). The recognized words appear in the answer box for you to review before sending. Optional practice clips stay in this tab for replay and are never uploaded or graded. Reception lines use browser speech synthesis; a browser may use a network voice service for this authored text. Mirifer does not receive or store your raw voice audio.</p>

		<h2>3. How We Use Your Data</h2>
		<p>Some conversation practice uses AI. In the English hotel lesson, replies the prepared conversation already understands are handled without AI. Other eligible replies you type or approve from speech recognition, together with the current lesson step, go to Google Gemini, DeepSeek, or OpenAI, in that order when available. The provider checks whether your reply fits the conversation and may suggest a short language correction. Empty, oversized, and certain clearly conflicting replies are also handled without AI. German free conversation sends the text of your exchange and lesson context to an AI provider. These providers process the text under their own policies; DeepSeek may process data in China. We do not send your account identifier or voice recording in those AI requests. Prepared examples remain available if the AI checker cannot respond.</p>
		<ul>
			<li>To provide and improve the learning experience</li>
			<li>To track your lesson progress and spaced repetition schedule</li>
			<li>To sync your data across devices when signed in</li>
		</ul>
		<p>We do <strong>not</strong> sell your data to third parties.</p>

		<h2>4. Analytics</h2>
		<p>We use <strong>Vercel Analytics</strong> and <strong>Microsoft Clarity</strong> to understand how visitors use our site. These tools collect anonymous usage data such as page views, device type, and interaction patterns. Clarity may record anonymized session replays to help us improve the user experience. No personally identifiable information is shared with these services.</p>

		<p>For signed-in learners, we also store account-linked visit and lesson events in Supabase to understand where practice stops and identify technical obstacles. These events include lesson positions and content identifiers, answer correctness, hint and answer-reveal actions, replay requests, sampled active lesson time, microphone or playback error categories, coarse device and browser type, and interface language. They do not contain raw voice recordings, transcripts, answer text, or full page URLs. Pending events may be stored in your browser for up to 7 days before delivery. Only administrators can view reports across accounts.</p>

		<p>Optional German progress checks store the question-set identifier, checkpoint dates, listening and reading scores, and skipped-question count. Answer choices are sent to the server for scoring and are not stored. No voice recording is required. For acquisition reporting, we keep an allowlisted source category (such as Google or a friend invitation) and capture dates, linked to your account after sign-in. The first source category may stay in this browser for up to 30 days before sign-in. We do not retain full referrer URLs or arbitrary campaign text in these reports. These pilot checks do not establish a certified language level.</p>
		<h2>5. Data Storage</h2>
		<p>Your account data is stored securely on <strong>Supabase</strong> (hosted on AWS). Passwords are hashed and never stored in plain text. All connections use HTTPS encryption.</p>

		<h2>6. Your Rights</h2>
		<p>You can request deletion of your account and all associated data at any time by contacting us. We will process deletion requests within 30 days.</p>

		<h2>7. Cookies</h2>
		<p>Mirifer uses essential cookies for authentication (keeping you signed in). Analytics tools may set their own cookies for anonymous usage tracking.</p>

		<h2>8. Changes</h2>
		<p>We may update this policy as Mirifer evolves. Significant changes will be communicated through the app.</p>

		<h2>9. Contact</h2>
		<p>Questions about your privacy? Reach us at <strong>afraz.jva@gmail.com</strong>.</p>
	</article>
</main>

<style>
	.legal-page {
		min-height: 100vh;
		background: #0d0d1a;
		color: #ccc;
		padding: 40px 20px 80px;
	}

	.legal-nav {
		max-width: 720px;
		margin: 0 auto 32px;
	}

	.back-link {
		/* 44px minimum touch target. */
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding: 10px 4px;
		color: #e94560;
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.back-link:hover {
		text-decoration: underline;
	}

	.legal-content {
		max-width: 720px;
		margin: 0 auto;
	}

	.legal-content h1 {
		font-size: 2.2rem;
		font-weight: 900;
		color: #fff;
		margin-bottom: 8px;
	}

	.legal-date {
		color: #666;
		font-size: 0.88rem;
		margin-bottom: 40px;
	}

	.legal-content h2 {
		font-size: 1.2rem;
		font-weight: 700;
		color: #fff;
		margin-top: 36px;
		margin-bottom: 12px;
	}

	.legal-content p {
		line-height: 1.75;
		font-size: 0.95rem;
		margin-bottom: 14px;
	}

	.legal-content ul {
		padding-left: 24px;
		margin-bottom: 14px;
	}

	.legal-content li {
		line-height: 1.75;
		font-size: 0.95rem;
		margin-bottom: 6px;
	}

	.legal-content strong {
		color: #fff;
	}
</style>
