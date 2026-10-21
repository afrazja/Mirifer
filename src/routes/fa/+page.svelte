<script lang="ts">
	/** The landing page, in Persian (docs/landing-copy.md). Signed-in learners are sent on by +page.server.ts. */
	import LandingPage from '$lib/components/landing/LandingPage.svelte';
	import { LANDING } from '$lib/landing/copy';
	import { landingStructuredData } from '$lib/landing/head';
	const c = LANDING.fa;
</script>

<svelte:head>
	<title>{c.title}</title>
	<meta name="description" content={c.description} />
	<link rel="canonical" href="https://www.mirifer.com/fa" />
	<link rel="alternate" hreflang="en" href="https://www.mirifer.com/" />
	<link rel="alternate" hreflang="fa" href="https://www.mirifer.com/fa" />
	<link rel="alternate" hreflang="x-default" href="https://www.mirifer.com/" />
	<meta property="og:title" content={c.title} />
	<meta property="og:description" content={c.description} />
	<meta property="og:image" content="https://www.mirifer.com/og-image.jpg" />
	<meta property="og:url" content="https://www.mirifer.com/fa" />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Mirifer" />
	<meta property="og:locale" content="fa_IR" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={c.title} />
	<meta name="twitter:description" content={c.description} />
	<meta name="twitter:image" content="https://www.mirifer.com/og-image.jpg" />
	{@html landingStructuredData('fa')}
</svelte:head>

<LandingPage lang="fa" />
