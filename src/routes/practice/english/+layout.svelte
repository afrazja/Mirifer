<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	let { data, children } = $props();
	// The banner follows the app's display language (set on <html> by the app), read after load.
	let isFa = $state(false);
	onMount(() => { isFa = document.documentElement.lang === 'fa'; });
</script>

{#if data.learnerView}
	<!-- Only the owner ever sees this: they chose to see the English pages as a learner does. -->
	<form class="learner-view" method="POST" action="/practice/english/view" dir={isFa ? 'rtl' : 'ltr'}>
		<input type="hidden" name="as" value="owner" />
		<input type="hidden" name="to" value={page.url.pathname} />
		<span>{isFa ? 'داری برنامه را مثل یک زبان‌آموز می‌بینی.' : 'You’re seeing the app as a learner.'}</span>
		<button type="submit">{isFa ? 'برگشت به نمای مدیر' : 'Back to owner view'}</button>
	</form>
{/if}
{@render children()}

<style>
	.learner-view { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 4px 12px; margin: 0; padding: 6px 16px; background: #fff3c4; color: #14201b; font-size: .88rem; }
	.learner-view button { min-height: 44px; padding: 0 8px; border: 0; background: none; color: #0a4433; font: inherit; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
	.learner-view button:focus-visible { outline: 3px solid #0a4433; outline-offset: 2px; border-radius: 6px; }
</style>
