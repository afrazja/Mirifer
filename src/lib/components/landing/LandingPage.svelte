<script lang="ts">
	/**
	 * The landing page for the English course, in English (/) or Persian (/fa): docs/landing-copy.md
	 * v2. One primary action, "Start free" (sign-up): in the hero, at the end, and in a bar at the
	 * bottom of the screen while neither of those is in view (never two at once).
	 */
	import { onMount } from 'svelte';
	import BrandLogo from '$lib/components/BrandLogo.svelte';
	import { LANDING, type LandingLang, type Rich } from '$lib/landing/copy';
	import { visitorEvent } from '$services/visitor-events';

	let { lang }: { lang: LandingLang } = $props();
	const c = $derived(LANDING[lang]);
	const isFa = $derived(lang === 'fa');
	const home = $derived(isFa ? '/fa' : '/');
	const other = $derived(isFa ? '/' : '/fa');
	const sampleHref = $derived(isFa ? '/fa/try' : '/try');
	const signupHref = '/login?mode=signup';
	const arrow = $derived(isFa ? '←' : '→');

	let heroCta: HTMLElement | undefined = $state();
	let endCta: HTMLElement | undefined = $state();
	let heroSeen = $state(true), endSeen = $state(false), pastHero = $state(false);
	const showBar = $derived(!heroSeen && !endSeen && pastHero);
	/** A Persian browser on the English page: offer the Persian page (never a redirect). */
	let suggestFa = $state(false);

	onMount(() => {
		try { suggestFa = !isFa && navigator.language.toLowerCase().startsWith('fa') && localStorage.getItem('mirifer_fa_suggestion') !== 'no'; } catch { /* storage blocked */ }
		if (typeof IntersectionObserver === 'undefined') return;
		const watch = new IntersectionObserver(entries => {
			for (const entry of entries) {
				if (entry.target === heroCta) { heroSeen = entry.isIntersecting; if (!entry.isIntersecting && entry.boundingClientRect.top < 0) pastHero = true; if (entry.isIntersecting) pastHero = false; }
				if (entry.target === endCta) endSeen = entry.isIntersecting;
			}
		});
		if (heroCta) watch.observe(heroCta);
		if (endCta) watch.observe(endCta);
		return () => watch.disconnect();
	});
	function dismissFa() { suggestFa = false; try { localStorage.setItem('mirifer_fa_suggestion', 'no'); } catch { /* fine */ } }
	const started = () => visitorEvent('signup_clicked', lang, 'landing');
</script>

{#snippet rich(parts: Rich)}{#each parts as part}{#if typeof part === 'string'}{part}{:else}<bdi lang="en">{part.en}</bdi>{/if}{/each}{/snippet}

<div class="landing" lang={lang} dir={isFa ? 'rtl' : 'ltr'}>
	{#if suggestFa}
		<p class="suggest" lang="fa" dir="rtl"><a href="/fa">این صفحه به فارسی هم هست</a> <button type="button" onclick={dismissFa} aria-label="نه، ممنون">✕</button></p>
	{/if}
	<header class="top">
		<a href={home} class="brand" aria-label={isFa ? 'میریفر، صفحهٔ اصلی' : 'Mirifer home'}><BrandLogo /></a>
		<nav class="links" aria-label={c.footer.site}>
			<a href={other} lang={isFa ? 'en' : 'fa'} hreflang={isFa ? 'en' : 'fa'}>{c.switchLabel}</a>
			<a href="/login">{c.signIn}</a>
		</nav>
	</header>

	<main id="main-content">
		<section class="hero">
			<p class="eyebrow">{c.eyebrow}</p>
			<h1>{c.h1}</h1>
			<p class="line">{c.line}</p>
			<a class="primary" href={signupHref} bind:this={heroCta} onclick={started}>{c.cta} <span aria-hidden="true">{arrow}</span></a>
			<a class="quiet center" href={sampleHref}>{c.sample}</a>
			<p class="small">{c.small}</p>

			<figure class="phone">
				<figcaption class="sr-only">{c.figure.caption}</figcaption>
				<div class="mira">
					<span class="av" aria-hidden="true">M</span>
					<div class="bubble">
						<span class="sr-only">{c.figure.mira}</span>
						<span class="chip" aria-hidden="true">▶ {c.digits(0)}:{c.digits(0)}{c.digits(3)}</span>
						<p class="prompt-fa" lang="fa" dir="rtl">{c.figure.promptFa}</p>
						{#if c.figure.promptEn}<p class="prompt-en" lang="en" dir="ltr">{c.figure.promptEn}</p>{/if}
					</div>
				</div>
				<div class="you">
					<span class="sr-only">{c.figure.you}</span>
					<span class="chip" aria-hidden="true">🎤</span>
					<p class="en" lang="en" dir="ltr">{c.figure.said}</p>
				</div>
				<div class="fix">
					<b>{c.figure.fixLabel}</b>
					<p class="en better" lang="en" dir="ltr">{c.figure.fix}</p>
					<p class="tip"><b>{c.figure.tipLabel}:</b> {@render rich(c.figure.tip)}</p>
				</div>
			</figure>
		</section>

		<section class="band">
			<div class="wrap"><h2>{c.problem.h}</h2><p>{c.problem.t}</p></div>
		</section>

		<section>
			<div class="wrap">
				<h2>{c.day.h}</h2>
				<ol class="steps" role="list">
					{#each c.day.steps as step, i}<li><span class="n" aria-hidden="true">{c.digits(i + 1)}</span><div><b>{step.title}.</b> {step.text}</div></li>{/each}
				</ol>
				<p>{c.day.dayOne}</p>
				<p class="note">{c.day.need}</p>
				<a class="quiet" href={sampleHref}>{c.sample}</a>
			</div>
		</section>

		<section class="band">
			<div class="wrap">
				<h2>{c.practice.h}</h2>
				<ul class="plain" role="list">{#each c.practice.lines as line}<li><b>{line.lead}</b> {line.text}</li>{/each}</ul>
				<p class="note">{c.practice.note}</p>
			</div>
		</section>

		<section>
			<div class="wrap"><h2>{c.persian.h}</h2><ul class="points">{#each c.persian.points as point}<li>{point}</li>{/each}</ul></div>
		</section>

		<section class="band">
			<div class="wrap"><h2>{c.privacy.h}</h2><p>{c.privacy.t}</p><a class="quiet" href="/privacy">{c.privacy.link}</a></div>
		</section>

		<section>
			<div class="wrap">
				<h2>{c.faq.h}</h2>
				{#each c.faq.items as item, i}<details open={i === 0}><summary>{item.q}</summary><p>{item.a}</p></details>{/each}
			</div>
		</section>

		<section class="band end">
			<div class="wrap">
				<h2>{c.end.h}</h2>
				<p>{c.end.t}</p>
				<a class="primary" href={signupHref} bind:this={endCta} onclick={started}>{c.cta} <span aria-hidden="true">{arrow}</span></a>
			</div>
		</section>
	</main>

	<footer>
		<nav aria-label={c.footer.nav}><a href="/privacy">{c.footer.privacy}</a><a href="/terms">{c.footer.terms}</a></nav>
		<p>{c.footer.trademark}</p>
	</footer>

	<div class="bar" hidden={!showBar} inert={!showBar}>
		<a class="primary" href={signupHref} onclick={started}>{c.cta} <span aria-hidden="true">{arrow}</span></a>
	</div>
</div>

<style>
	.landing { min-height: 100dvh; background: var(--paper); color: var(--ink); scroll-padding-bottom: 96px; }
	.suggest { display: flex; justify-content: center; align-items: center; gap: 8px; margin: 0; padding: 6px 16px; background: var(--accent-wash); font-size: .92rem; }
	.suggest a { color: var(--accent-deep); font-weight: 600; min-height: 44px; display: inline-flex; align-items: center; }
	.suggest button { min-width: 44px; min-height: 44px; border: 0; background: none; color: var(--ink-soft); font: inherit; cursor: pointer; }
	.top { display: flex; align-items: center; justify-content: space-between; gap: 12px; max-width: 1000px; margin: 0 auto; padding: 8px 16px; }
	.brand { display: inline-flex; align-items: center; min-height: 44px; color: var(--ink); text-decoration: none; }
	.links { display: flex; gap: 18px; }
	.links a { min-height: 44px; display: inline-flex; align-items: center; color: var(--accent-deep); font-weight: 500; text-decoration: none; }
	.links a:hover { text-decoration: underline; }
	main { display: block; }
	.hero { max-width: 560px; margin: 0 auto; padding: 18px 16px 32px; }
	.wrap { max-width: 560px; margin: 0 auto; }
	section:not(.hero) { padding: 32px 16px; }
	.band { background: var(--paper-raised); border-block: 1px solid var(--line); }
	.eyebrow { margin: 0 0 10px; font-size: .76rem; font-weight: 700; letter-spacing: .1em; color: var(--accent-deep); }
	[dir='rtl'] .eyebrow { letter-spacing: normal; font-size: .9rem; }
	h1, h2 { font-family: var(--font-display); font-weight: 500; line-height: 1.15; margin: 0; overflow-wrap: break-word; }
	[dir='rtl'] h1, [dir='rtl'] h2 { font-weight: 700; }
	h1 { font-size: clamp(2.1rem, 9vw, 3.2rem); margin-bottom: 12px; }
	h2 { font-size: clamp(1.5rem, 6vw, 2rem); margin-bottom: 12px; }
	p { line-height: 1.65; margin: 0 0 12px; }
	.line { font-size: 1.1rem; color: var(--ink-soft); margin-bottom: 20px; }
	.primary { display: flex; gap: 12px; align-items: center; justify-content: center; min-height: 54px; padding: 12px 22px; border-radius: 12px; background: var(--accent); color: var(--on-accent); font-weight: 600; font-size: 1.05rem; text-decoration: none; }
	.primary:hover { background: var(--accent-deep); }
	.quiet { display: inline-flex; align-items: center; min-height: 44px; color: var(--accent-deep); font-weight: 500; text-underline-offset: 3px; }
	.quiet.center { display: flex; justify-content: center; margin-top: 6px; }
	a:focus-visible, button:focus-visible, summary:focus-visible { outline: 3px solid var(--accent-deep); outline-offset: 2px; border-radius: 6px; }
	.small { text-align: center; color: var(--ink-soft); font-size: .86rem; margin: 2px 0 24px; }
	.phone { margin: 0; display: grid; gap: 10px; padding: 16px; border: 1px solid var(--line); border-radius: 22px; background: var(--paper-raised); box-shadow: var(--paper-shadow); }
	.phone p { margin: 0; }
	.mira { display: flex; gap: 8px; align-items: flex-start; }
	.av { flex: none; display: grid; place-items: center; inline-size: 30px; block-size: 30px; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-weight: 700; font-size: .85rem; }
	.bubble { padding: 9px 12px; border-radius: 14px; background: var(--paper-sunken); font-size: .95rem; }
	.chip { display: inline-flex; gap: 4px; font-size: .75rem; color: var(--accent-deep); }
	.prompt-fa { font-family: var(--font-body); text-align: right; }
	.prompt-en { color: var(--ink-soft); font-size: .86rem; }
	.you { justify-self: end; max-width: 85%; padding: 9px 12px; border-radius: 14px; background: var(--accent-wash); font-size: .95rem; }
	.en { direction: ltr; text-align: left; unicode-bidi: isolate; }
	.fix { padding: 8px 12px; border-inline-start: 3px solid var(--accent); border-radius: 8px; background: var(--paper); font-size: .9rem; }
	.fix > b { display: block; color: var(--accent-deep); font-size: .78rem; }
	.better { font-weight: 600; color: var(--accent-deep); }
	.tip { color: var(--ink-soft); font-size: .86rem; }
	.steps { list-style: none; padding: 0; margin: 14px 0; display: grid; gap: 12px; }
	.steps li { display: flex; gap: 12px; }
	.n { flex: none; display: grid; place-items: center; inline-size: 30px; block-size: 30px; border-radius: 50%; border: 1px solid var(--accent); color: var(--accent-deep); font-weight: 700; }
	.note { color: var(--ink-soft); font-size: .93rem; }
	.plain { list-style: none; padding: 0; margin: 14px 0; display: grid; gap: 10px; }
	.plain li { padding: 12px 14px; border-inline-start: 3px solid var(--accent); border-radius: 8px; background: var(--paper); line-height: 1.6; }
	.points { padding-inline-start: 20px; margin: 10px 0; }
	.points li { margin-bottom: 8px; line-height: 1.6; }
	details { border-bottom: 1px solid var(--line); }
	summary { min-height: 48px; display: flex; align-items: center; font-weight: 600; cursor: pointer; }
	details p { color: var(--ink-soft); }
	.end { text-align: center; }
	footer { max-width: 560px; margin: 0 auto; padding: 20px 16px 120px; text-align: center; color: var(--ink-soft); font-size: .85rem; }
	footer nav { display: flex; justify-content: center; gap: 16px; }
	footer a { min-height: 44px; display: inline-flex; align-items: center; color: var(--accent-deep); }
	footer p { margin: 6px 0 0; font-size: .8rem; }
	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 30; padding: 10px 16px calc(12px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--paper) 35%); }
	.bar .primary { max-width: 560px; margin: 0 auto; }
	.bar[hidden] { display: none; }
	@media (min-width: 900px) {
		.hero { max-width: 1000px; display: grid; grid-template-columns: 1fr 380px; column-gap: 48px; align-items: start; padding-top: 48px; }
		.hero > :not(.phone) { grid-column: 1; }
		.phone { grid-column: 2; grid-row: 1 / span 6; }
	}
	@media (max-height: 480px) { .bar { display: none; } }
</style>
