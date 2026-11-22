<script lang="ts">
	/** One line icon from step-intro.ts (stroke, currentColor). Decorative: the label next to it says the meaning. */
	import type { IntroIcon } from '$lib/practice/step-intro';

	let { name, size = 20 }: { name: IntroIcon; size?: number } = $props();
</script>

<svg class="icon" class:flip={name === 'goal'} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
	{#if name === 'listen'}<path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z" />
	{:else if name === 'speak'}<rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
	{:else if name === 'read'}<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
	{:else if name === 'repeat'}<path d="M17 2l4 4-4 4" /><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4" /><path d="M21 13v2a3 3 0 0 1-3 3H3" />
	{:else if name === 'check'}<circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9.5" />
	{:else if name === 'better'}<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z" />
	{:else if name === 'choose'}<path d="M12 21v-7M12 14L6 8M12 14l6-6" /><path d="M3 8h6V2M21 8h-6V2" />
	{:else if name === 'chat'}<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 9h8M8 13h5" />
	{:else if name === 'build'}<rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="8.5" y="3" width="7" height="7" rx="1" />
	{:else if name === 'spot'}<circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
	{:else if name === 'tap'}<path d="M9 11V5a2 2 0 0 1 4 0v5" /><path d="M13 10a2 2 0 0 1 4 0v1a2 2 0 0 1 4 0v3a7 7 0 0 1-7 7h-1a7 7 0 0 1-5.6-2.8L5 15.5a2 2 0 0 1 3-2.6L9 14" />
	{:else if name === 'connect'}<circle cx="6" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><path d="M8.5 8.5l7 7" />
	{:else if name === 'now'}<circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" />
	{:else if name === 'before'}<path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5M12 8v4l3 2" />
	{:else if name === 'goal'}<path d="M5 12h14M13 6l6 6-6 6" />
	{:else if name === 'story'}<rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" />
	{:else if name === 'time'}<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />{/if}
</svg>

<style>
	.icon { flex: none; display: block; }
	/* Arrows point the way the page reads. */
	:global([dir='rtl']) .flip { transform: scaleX(-1); }
</style>
