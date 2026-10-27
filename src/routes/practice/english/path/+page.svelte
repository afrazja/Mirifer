<script lang="ts">
	/**
	 * Your path: the chapters reached so far, each with its steps. Finished chapters fold to one row
	 * (tap to open); the chapter with the next step is open. Done steps can be practised again;
	 * locked ones can't be opened (the app chooses the order, owner's rule).
	 */
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import { getLanguage } from '$services/data-layer';

	let { data }: PageProps = $props();
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	const T = (en: string, fa: string) => (isFa ? fa : en);
	const n = (value: number) => (isFa ? value.toLocaleString('fa-IR') : String(value));
	onMount(() => { void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; }); });
	const href = (id: string) => `/practice/english/step?step=${encodeURIComponent(id)}`;
</script>

<svelte:head>
	<title>{isFa ? 'مسیر تو' : 'Your path'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="path" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/practice/english/progress" backLabel={isFa ? 'پیشرفت' : 'Progress'} direction={isFa ? 'rtl' : 'ltr'} />
	<h1>{T('Your path', 'مسیر تو')}</h1>

	{#each data.chapters as chapter (chapter.id)}
		<details class="chapter" open={!chapter.finished}>
			<summary>
				<span class="chapter-name">{T(`Chapter ${chapter.number} · ${chapter.theme.en}`, `فصل ${n(chapter.number)}: ${chapter.theme.fa}`)}</span>
				{#if chapter.finished}<span class="tick" aria-label={T('finished', 'تمام شد')}>✓</span>{/if}
			</summary>
			<ol class="steps">
				{#each chapter.steps as step, i (step.id)}
					<li class={step.state}>
						{#if step.state === 'locked'}
							<span class="step" aria-disabled="true">
								<span class="num" aria-hidden="true">{n(i + 1)}</span>
								<span class="title">{isFa ? step.title.fa : step.title.en}</span>
								<span class="state">{T('Later', 'بعداً')}</span>
							</span>
						{:else}
							<a class="step" href={href(step.id)}>
								<span class="num" aria-hidden="true">{step.state === 'done' ? '✓' : n(i + 1)}</span>
								<span class="title">{isFa ? step.title.fa : step.title.en}</span>
								<span class="state">
									{#if step.state === 'next'}{step.underWay ? T('Continue', 'ادامه') : T(`Next · ${step.minutes} min`, `بعدی · ${n(step.minutes)} دقیقه`)}
									{:else if step.state === 'skipped'}{T('Skipped · Do it', 'رد شده · انجامش بده')}
									{:else}{T('Practice again', 'دوباره تمرین کن')}{/if}
								</span>
							</a>
						{/if}
					</li>
				{/each}
			</ol>
		</details>
	{/each}
	<p class="note">{T('New chapters are added as they’re ready.', 'فصل‌های تازه هر وقت آماده شوند اضافه می‌شوند.')}</p>
</main>

<style>
	.path { max-width: 680px; margin: 0 auto; padding: 16px 16px 48px; color: var(--ink); }
	h1 { font-family: var(--font-display); font-weight: 600; font-size: 1.9rem; margin: 18px 0 14px; }
	.chapter { margin-bottom: 12px; border: 1px solid var(--control-border); border-radius: 18px; background: var(--paper-raised); overflow: hidden; }
	summary { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 52px; padding: 12px 18px; cursor: pointer; font-weight: 700; }
	summary:focus-visible { outline: 3px solid var(--accent-deep); outline-offset: -3px; }
	.tick { display: grid; place-items: center; inline-size: 28px; block-size: 28px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-size: .85rem; }
	.steps { list-style: none; margin: 0; padding: 0 8px 10px; display: grid; gap: 6px; }
	.step { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 8px 10px; border-radius: 12px; color: inherit; text-decoration: none; }
	a.step:hover { background: var(--paper-sunken); }
	a.step:focus-visible { outline: 3px solid var(--accent-deep); outline-offset: 2px; }
	.num { display: grid; place-items: center; flex: none; inline-size: 30px; block-size: 30px; border-radius: 50%; background: var(--paper-sunken); color: var(--ink-soft); font-weight: 700; font-size: .9rem; }
	.title { flex: 1; font-weight: 500; }
	.state { flex: none; font-size: .88rem; color: var(--ink-soft); }
	.done .num { background: var(--accent); color: var(--on-accent); }
	.next .step { background: var(--accent-wash); }
	.next .num { background: var(--accent); color: var(--on-accent); }
	.next .state { color: var(--accent-deep); font-weight: 700; }
	.skipped .state { color: var(--accent-deep); }
	.locked .step { opacity: .55; }
	.note { color: var(--ink-soft); font-size: .92rem; }
</style>
