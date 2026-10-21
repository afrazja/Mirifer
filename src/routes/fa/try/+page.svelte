<script lang="ts">
	/** The 2-minute sample in Persian: the start of Day 1, no AI, no account. */
	import EnglishSample from '$lib/components/EnglishSample.svelte';
</script>

<svelte:head>
	<title>یک نمونهٔ دودقیقه‌ای از تمرین مکالمهٔ انگلیسی | میریفر</title>
	<meta name="description" content="یک گفت‌وگوی روزمره در فرودگاه بشنو، به یک سؤال جواب بده، یک جمله بگو و صدای خودت را بشنو. بدون ثبت‌نام و بدون نصب." />
	<link rel="canonical" href="https://www.mirifer.com/fa/try" />
	<link rel="alternate" hreflang="en" href="https://www.mirifer.com/try" />
	<link rel="alternate" hreflang="fa" href="https://www.mirifer.com/fa/try" />
	<link rel="alternate" hreflang="x-default" href="https://www.mirifer.com/try" />
</svelte:head>

<main id="main-content" class="try" lang="fa" dir="rtl">
	<EnglishSample isFa homeHref="/fa" />
</main>

<style>
	.try { max-width: 640px; margin: 0 auto; padding: 8px 16px 0; color: var(--ink); }
</style>
