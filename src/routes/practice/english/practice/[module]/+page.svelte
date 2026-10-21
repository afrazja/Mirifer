<script lang="ts">
	/** One Practice module: rebuilt for each module, so moving between modules starts fresh. */
	import PracticeModule from '$lib/components/PracticeModule.svelte';
	import type { PracticeId } from '$lib/practice/practice-area';
	let { data } = $props();
</script>

{#key data.module}<PracticeModule learnerId={data.learnerId} module={data.module as PracticeId} />{/key}
