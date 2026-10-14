<script lang="ts">
	/** Persian text with English words in it: each English run is isolated, so the punctuation stays in place. */
	import { latinRuns } from '$utils/bidi';
	let { text }: { text: string } = $props();
	const parts = $derived(latinRuns(text));
</script>

{#each parts as part}{#if part.latin}<bdi dir="ltr" lang="en">{part.text}</bdi>{:else}{part.text}{/if}{/each}
