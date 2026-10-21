<script lang="ts">
	/** The 2-minute English sample for visitors: the start of Day 1, no AI, no account. */
	import EnglishSample from '$lib/components/EnglishSample.svelte';
</script>

<svelte:head>
	<title>Try a 2-minute English speaking sample | Mirifer</title>
	<meta name="description" content="Hear a real-life conversation at an airport, answer one question, say one sentence and hear yourself. No sign-up, nothing to install." />
	<link rel="canonical" href="https://www.mirifer.com/try" />
	<link rel="alternate" hreflang="en" href="https://www.mirifer.com/try" />
	<link rel="alternate" hreflang="fa" href="https://www.mirifer.com/fa/try" />
	<link rel="alternate" hreflang="x-default" href="https://www.mirifer.com/try" />
</svelte:head>

<main id="main-content" class="try" lang="en" dir="ltr">
	<EnglishSample homeHref="/" />
</main>

<style>
	.try { max-width: 640px; margin: 0 auto; padding: 8px 16px 0; color: var(--ink); }
</style>
