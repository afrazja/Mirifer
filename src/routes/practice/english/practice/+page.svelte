<script lang="ts">
	/**
	 * The Practice area: modules to do on your own, outside the daily lesson. One list, grouped,
	 * with one suggestion as the main button (the next one the learner hasn't tried).
	 */
	import { onMount } from 'svelte';
	import AppHeader from '$lib/components/AppHeader.svelte';
	import { getLanguage } from '$services/data-layer';
	import { PRACTICE_GROUPS, PRACTICE_MODULES, suggestPractice, triedPractice, type PracticeId } from '$lib/practice/practice-area';
	import type { DisplayText } from '$lib/practice/hotel';

	let { data } = $props();
	let language = $state<'en' | 'fa'>('en');
	const isFa = $derived(language === 'fa');
	const text = (value: DisplayText) => (isFa ? value.fa : value.en);
	let tried = $state<string[]>([]);
	const next = $derived(PRACTICE_MODULES[suggestPractice(tried, data.track)]);
	const minutes = (n: number) => (isFa ? `حدود ${n.toLocaleString('fa-IR')} دقیقه` : `about ${n} min`);

	onMount(() => {
		void getLanguage().then(value => { if (value === 'fa' || value === 'en') language = value; });
		tried = triedPractice(data.learnerId);
	});
	const isNew = (id: PracticeId) => !tried.includes(id);
</script>

<svelte:head>
	<title>{isFa ? 'تمرین' : 'Practice'} — Mirifer</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main-content" class="practice" dir={isFa ? 'rtl' : 'ltr'}>
	<AppHeader backHref="/practice/english/today" backLabel={isFa ? 'درس امروز' : 'Today’s lesson'} direction={isFa ? 'rtl' : 'ltr'} />
	<p class="eyebrow">{isFa ? 'تمرین' : 'PRACTICE'}</p>
	<h1>{isFa ? 'تمرین به انتخاب خودت' : 'Practice on your own'}</h1>
	<p class="lead">{isFa ? 'هر وقت خواستی، یکی را انتخاب کن. درس روزانه سر جایش می‌ماند.' : 'Pick one whenever you like. Your daily lesson stays where it is.'}</p>

	{#each PRACTICE_GROUPS as group (group.id)}
		<section aria-labelledby={`group-${group.id}`}>
			<h2 id={`group-${group.id}`}>{text(group.title)}</h2>
			<ul>
				{#each group.ids as id (id)}
					{@const item = PRACTICE_MODULES[id]}
					<li>
						<a href={item.href}>
							<span class="title">{text(item.title)}{#if isNew(id) && tried.length}<span class="new">{isFa ? 'تازه' : 'New'}</span>{/if}</span>
							<span class="does">{text(item.does)}</span>
							<span class="mins">{minutes(item.minutes)}</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}
	<div class="bar-space" aria-hidden="true"></div>

	<div class="start-bar">
		<a class="primary" href={next.href}>{isFa ? `شروع: ${next.title.fa}` : `Start: ${next.title.en}`} <span aria-hidden="true">{isFa ? '←' : '→'}</span></a>
	</div>
</main>

<style>
	.practice { max-width: 680px; margin: 0 auto; padding: 0 16px 48px; color: var(--ink); }
	.eyebrow { margin: 16px 0 4px; font-size: .78rem; font-weight: 700; letter-spacing: .08em; color: var(--accent-deep); }
	:global([dir='rtl']) .eyebrow { letter-spacing: normal; }
	h1 { margin: 0 0 6px; font-family: var(--font-display); font-weight: 500; font-size: clamp(1.7rem, 5vw, 2.3rem); }
	.lead { margin: 0 0 8px; color: var(--ink-soft); line-height: 1.6; }
	h2 { margin: 26px 0 10px; font-size: .8rem; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-soft); }
	:global([dir='rtl']) h2 { letter-spacing: normal; }
	ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
	a:not(.primary) { display: grid; gap: 4px; min-height: 56px; padding: 14px 16px; border: 1px solid var(--control-border); border-radius: 14px; background: var(--paper-raised); color: var(--ink); text-decoration: none; }
	a:not(.primary):hover { border-color: var(--accent); }
	a:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; }
	.title { display: flex; align-items: center; gap: 8px; font-weight: 600; }
	.new { padding: 1px 8px; border-radius: 999px; background: var(--accent); color: var(--on-accent); font-size: .72rem; font-weight: 600; }
	.does { color: var(--ink-soft); font-size: .92rem; line-height: 1.5; }
	.mins { color: var(--ink-soft); font-size: .82rem; }
	.bar-space { block-size: 100px; }
	.start-bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 20; padding: 12px 16px calc(14px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 35%); }
	.primary { display: flex; gap: 12px; align-items: center; justify-content: center; inline-size: 100%; max-inline-size: 680px; margin-inline: auto; min-height: 54px; padding: 12px 22px; border-radius: 12px; background: var(--accent); color: var(--on-accent); font-weight: 600; font-size: 1.05rem; text-decoration: none; }
</style>
