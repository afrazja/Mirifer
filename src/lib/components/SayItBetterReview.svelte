<script lang="ts">
	/** Read-only look back at "Say it again, better": both transcripts, the fixes, the better version. */
	import type { SayRecord } from '$lib/practice/say-better';
	let { isFa = false, record }: { isFa?: boolean; record: SayRecord } = $props();
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const feedback = $derived(record.feedback);
</script>

<div class="review">
	{#if record.transcript1}<p class="label">{T('First try', 'تلاش اول')}</p><p class="said" lang="en" dir="ltr">“{record.transcript1}”</p>{/if}
	{#if feedback?.praise}<p class="praise">{isFa ? feedback.praise.fa : feedback.praise.en}</p>{/if}
	{#if feedback?.case === 'strong'}<p class="praise">{T('That was clear and natural.', 'روشن و طبیعی بود.')}</p>{/if}
	{#if feedback?.fixes.length}
		<p class="label">{T('Fixes', 'اصلاح‌ها')}</p>
		<ul>
			{#each feedback.fixes as fix, i}
				<li><span lang="en" dir="ltr"><s>{fix.original}</s> → <strong>{fix.better}</strong></span><br /><small>{isFa ? fix.why.fa : fix.why.en}</small>
					{#if record.uses[i] === 'used'}<small class="ok"> · {T('used in the second try', 'در تلاش دوم استفاده شد')}</small>{/if}</li>
			{/each}
		</ul>
	{/if}
	{#if feedback?.better}<p class="label">{T('Better version', 'نسخهٔ بهتر')}</p><p class="said" lang="en" dir="ltr">{feedback.better}</p>{/if}
	{#if record.transcript2}<p class="label">{T('Second try', 'تلاش دوم')}</p><p class="said" lang="en" dir="ltr">“{record.transcript2}”</p>{/if}
</div>

<style>
	.review { display: grid; gap: 10px; }
	.label { margin: 8px 0 0; font-size: .8rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent-deep); }
	.said { margin: 0; padding: 12px 14px; border-radius: 12px; background: var(--paper-raised); border: 1px solid var(--line); line-height: 1.7; text-align: left; }
	.praise { margin: 0; color: var(--accent-deep); font-weight: 600; }
	ul { margin: 0; padding: 0; list-style: none; display: grid; gap: 8px; }
	li { padding: 10px 12px; border-radius: 10px; background: var(--paper-raised); border: 1px solid var(--line); line-height: 1.6; }
	small { color: var(--ink-soft); }
	.ok { color: var(--leaf-deep); }
</style>
