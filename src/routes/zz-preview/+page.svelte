<script lang="ts">
	import ConnectedSpeech from '$lib/components/ConnectedSpeech.svelte';
	let done = $state(false);
</script>
<main id="main-content" style="padding:0 16px">{#if done}<p>FINISHED</p>{:else}<ConnectedSpeech first onDone={() => (done = true)} />{/if}</main>
