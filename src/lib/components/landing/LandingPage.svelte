<script lang="ts">
	/**
	 * The landing page for the English course, in English (/) or Persian (/fa). One warm yellow
	 * page made of cards, in five parts: first screen, a day, practice, privacy and questions,
	 * and the closing card. One primary action, "Start free" (sign-up): in the first screen, in
	 * the closing card, and in a bar at the bottom while neither of those is in view.
	 *
	 * The small animations are decoration only (aria-hidden) and stop for people who ask for
	 * reduced motion. Photo places stay as a quiet pattern until the owner adds real photos
	 * (src/lib/landing/photos.ts).
	 */
	import { onMount, tick } from 'svelte';
	import BrandLogo from '$lib/components/BrandLogo.svelte';
	import { LANDING, type LandingLang, type Rich } from '$lib/landing/copy';
	import { LANDING_PHOTOS, type LandingPhoto } from '$lib/landing/photos';
	import { visitorEvent } from '$services/visitor-events';

	let { lang }: { lang: LandingLang } = $props();
	const c = $derived(LANDING[lang]);
	const isFa = $derived(lang === 'fa');
	const home = $derived(isFa ? '/fa' : '/');
	const other = $derived(isFa ? '/' : '/fa');
	const sampleHref = $derived(isFa ? '/fa/try' : '/try');
	const signupHref = '/login?mode=signup';
	const arrow = $derived(isFa ? '←' : '→');

	let root: HTMLElement | undefined = $state();
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

		// Cards rise in as they scroll into view. Without JavaScript, or with reduced motion,
		// everything is simply shown. Cards already on screen are marked first, so nothing blinks.
		let reveal: IntersectionObserver | undefined;
		if (root && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
			const cards = [...root.querySelectorAll<HTMLElement>('.reveal')];
			for (const card of cards) if (card.getBoundingClientRect().top < innerHeight) card.classList.add('in');
			root.dataset.anim = 'on';
			reveal = new IntersectionObserver(entries => {
				for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('in'); reveal?.unobserve(entry.target); }
			}, { rootMargin: '0px 0px -8% 0px' });
			for (const card of cards) if (!card.classList.contains('in')) reveal.observe(card);
		}
		return () => { watch.disconnect(); reveal?.disconnect(); };
	});
	function dismissFa() {
		suggestFa = false;
		try { localStorage.setItem('mirifer_fa_suggestion', 'no'); } catch { /* fine */ }
		// The ✕ is gone: keep keyboard focus on the page.
		void tick().then(() => document.querySelector<HTMLElement>('.landing .brand')?.focus());
	}
	const started = () => visitorEvent('signup_clicked', lang, 'landing');
	const bars = Array.from({ length: 14 }, (_, i) => i);
</script>

{#snippet rich(parts: Rich)}{#each parts as part}{#if typeof part === 'string'}{part}{:else}<bdi lang="en">{part.en}</bdi>{/if}{/each}{/snippet}

{#snippet photo(item: LandingPhoto | null, kind: string, eager = false)}
	{#if item}
		<img class="photo {kind}" src={item.src} alt={item.alt[lang]} loading={eager ? 'eager' : 'lazy'} decoding="async" />
	{:else}
		<div class="photo {kind} empty" aria-hidden="true">
			<svg viewBox="0 0 24 24" width="34" height="34"><path d="M4 7h3l2-2h6l2 2h3v12H4z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" /><circle cx="12" cy="13" r="3.6" fill="none" stroke="currentColor" stroke-width="1.6" /></svg>
		</div>
	{/if}
{/snippet}

{#snippet wave(count: number)}
	<span class="wave" aria-hidden="true">{#each bars.slice(0, count) as i}<i style="--i:{i}"></i>{/each}</span>
{/snippet}

<div class="landing" lang={lang} dir={isFa ? 'rtl' : 'ltr'} bind:this={root}>
	{#if suggestFa}
		<p class="suggest" lang="fa" dir="rtl"><a href="/fa">این صفحه به فارسی هم هست</a> <button type="button" onclick={dismissFa} aria-label="نه، ممنون">✕</button></p>
	{/if}
	<header class="top">
		<a href={home} class="brand" aria-label={isFa ? 'میریفر، صفحهٔ اصلی' : 'Mirifer home'}><BrandLogo /></a>
		<nav class="links" aria-label={c.footer.site}>
			<a href={other} lang={isFa ? 'en' : 'fa'} hreflang={isFa ? 'en' : 'fa'}>{c.switchLabel}</a>
			<a href="/login" class="signin">{c.signIn}</a>
		</nav>
	</header>

	<main id="main-content">
		<!-- 1. First screen -->
		<section class="hero">
			<div class="copy">
				<p class="eyebrow">{c.eyebrow}</p>
				<h1>{c.h1}</h1>
				<p class="line">{c.line}</p>
				<a class="primary" href={signupHref} bind:this={heroCta} onclick={started}>{c.cta} <span aria-hidden="true">{arrow}</span></a>
				<a class="quiet" href={sampleHref}>{c.sample}</a>
				<p class="small">{c.small}</p>
			</div>

			<div class="stage reveal">
				{@render photo(LANDING_PHOTOS.hero, 'hero-photo', true)}
				<figure class="phone">
					<figcaption class="sr-only">{c.figure.caption}</figcaption>
					<div class="msg mira">
						<span class="av" aria-hidden="true">M</span>
						<div class="bubble">
							<span class="sr-only">{c.figure.mira}</span>
							<span class="audio" aria-hidden="true"><span class="play">▶</span>{@render wave(12)}<span class="time">{c.digits(0)}:{c.digits(0)}{c.digits(3)}</span></span>
							<p class="prompt-fa" lang="fa" dir="rtl">{c.figure.promptFa}</p>
							{#if c.figure.promptEn}<p class="prompt-en" lang="en" dir="ltr">{c.figure.promptEn}</p>{/if}
						</div>
					</div>
					<div class="msg you">
						<span class="sr-only">{c.figure.you}</span>
						<span class="rec" aria-hidden="true"><span class="dot"></span>{@render wave(8)}</span>
						<p class="en" lang="en" dir="ltr">{c.figure.said}</p>
					</div>
					<div class="msg fix">
						<b>{c.figure.fixLabel}</b>
						<p class="en better" lang="en" dir="ltr">{c.figure.fix}</p>
						<p class="tip"><b>{c.figure.tipLabel}:</b> {@render rich(c.figure.tip)}</p>
					</div>
				</figure>
				<ul class="badges">
					{#each c.badges as badge, i}<li class="badge b{i}">{badge}</li>{/each}
				</ul>
			</div>
		</section>

		<!-- 2. A day -->
		<section class="block" aria-labelledby="day-h">
			<div class="head reveal">
				<h2 id="day-h">{c.day.h}</h2>
				<p class="pill">{c.day.dayOne}</p>
			</div>
			<!-- A sideways-scrolling row must take keyboard focus so arrow keys can scroll it. -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<div class="scroller" role="region" aria-label={c.day.row} tabindex="0">
				<ol class="steps" role="list">
					{#each c.day.steps as step, i}
						<li class="card step reveal" style="--d:{i}">
							<div class="art art-{i}" aria-hidden="true">
								{#if i === 0}
									<span class="head-icon">
										<svg viewBox="0 0 24 24" width="30" height="30"><path d="M4 14v-2a8 8 0 0 1 16 0v2" fill="none" stroke="currentColor" stroke-width="2" /><rect x="3" y="13" width="4" height="7" rx="1.5" fill="currentColor" /><rect x="17" y="13" width="4" height="7" rx="1.5" fill="currentColor" /></svg>
									</span>
									{@render wave(14)}
								{:else if i === 1}
									<span class="mic"><span class="ring"></span><span class="ring r2"></span>
										<svg viewBox="0 0 24 24" width="30" height="30"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" /><path d="M6 11a6 6 0 0 0 12 0M12 17v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg>
									</span>
									<span class="chip-fix" dir="ltr">bag → <b>bags</b> ✓</span>
								{:else}
									<span class="note n1" dir="ltr"><span class="play">▶</span>{@render wave(9)}</span>
									<span class="note n2" dir="ltr"><span class="play">▶</span>{@render wave(7)}</span>
								{/if}
							</div>
							<span class="num" aria-hidden="true">{c.digits(i + 1)}</span>
							<h3>{step.title}</h3>
							<p>{step.text}</p>
						</li>
					{/each}
				</ol>
			</div>
			<p class="need reveal">{c.day.need} <a class="quiet inline" href={sampleHref}>{c.sample}</a></p>
		</section>

		<!-- 3. Practice -->
		<section class="block" aria-labelledby="practice-h">
			<div class="head reveal"><h2 id="practice-h">{c.practice.h}</h2></div>
			<ul class="bento" role="list">
				{#each c.practice.cards as card, i}
					<li class="card tile t{i} reveal" style="--d:{i}">
						<div class="art" aria-hidden="true">
							{#if i === 0}
								<span class="cue"><i></i><i></i><i></i></span>
								<svg class="timer" viewBox="0 0 44 44" width="64" height="64"><circle cx="22" cy="22" r="18" class="track" /><circle cx="22" cy="22" r="18" class="run" /><text x="22" y="26" text-anchor="middle">2:00</text></svg>
							{:else if i === 1}
								<span class="say s1"><i></i></span><span class="arrow">{arrow}</span><span class="say s2"><i></i><i></i><b>★</b></span>
							{:else if i === 2}
								<span class="head-icon">
									<svg viewBox="0 0 24 24" width="26" height="26"><path d="M4 14v-2a8 8 0 0 1 16 0v2" fill="none" stroke="currentColor" stroke-width="2" /><rect x="3" y="13" width="4" height="7" rx="1.5" fill="currentColor" /><rect x="17" y="13" width="4" height="7" rx="1.5" fill="currentColor" /></svg>
								</span>
								{@render wave(10)}
							{:else}
								<span class="trap" dir="ltr">Please call <s>to</s> me.</span>
							{/if}
						</div>
						<div class="words">
							<h3>{card.title}</h3>
							<p>{card.text}</p>
						</div>
					</li>
				{/each}
				<li class="card tile soon reveal" style="--d:4">
					{@render photo(LANDING_PHOTOS.practice, 'soon-photo')}
					<div class="words">
						<h3 class="tag">{c.practice.soon.title}</h3>
						<p>{c.practice.soon.text}</p>
					</div>
				</li>
			</ul>
		</section>

		<!-- 4. Privacy and questions -->
		<section class="block" aria-labelledby="trust-h">
			<h2 id="trust-h" class="sr-only">{c.trust}</h2>
			<div class="two">
				<div class="card privacy reveal">
					<span class="lock" aria-hidden="true">
						<svg viewBox="0 0 24 24" width="30" height="30"><rect x="5" y="10" width="14" height="10" rx="2.5" fill="currentColor" /><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2" /></svg>
					</span>
					<h3>{c.privacy.h}</h3>
					<p>{c.privacy.t}</p>
					<a class="quiet" href="/privacy">{c.privacy.link}</a>
				</div>
				<div class="card faq reveal" style="--d:1">
					<h3>{c.faq.h}</h3>
					{#each c.faq.items as item}<details><summary>{item.q}<span class="plus" aria-hidden="true"></span></summary><p>{item.a}</p></details>{/each}
				</div>
			</div>
		</section>

		<!-- 5. Closing card -->
		<section class="block last">
			<div class="endcard reveal">
				<div class="end-words">
					<h2>{c.end.h}</h2>
					<p>{c.end.t}</p>
					<a class="primary on-green" href={signupHref} bind:this={endCta} onclick={started}>{c.cta} <span aria-hidden="true">{arrow}</span></a>
					<a class="quiet on-green" href={sampleHref}>{c.sample}</a>
				</div>
				{@render photo(LANDING_PHOTOS.end, 'end-photo')}
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
	/* ── The page's own palette: warm yellow with deep green, white cards. ── */
	.landing {
		--y: #ffd65a;
		--y-soft: #fff3c4;
		--card: #ffffff;
		--ink: #14201b;
		--ink-2: #3c4842;
		--g: #0e5c45;
		--g-deep: #0a4433;
		--g-soft: #dcefe4;
		--g-text: #0e5c45;
		--coral: #d9452b;
		--btn: #0e5c45;
		--btn-hover: #0a4433;
		--on-btn: #ffffff;
		--focus: #14201b;
		--shadow: 0 1px 0 rgba(20, 32, 27, 0.06), 0 14px 32px -12px rgba(20, 32, 27, 0.28);
		min-height: 100dvh;
		background: var(--y);
		color: var(--ink);
	}
	:global(:root[data-theme='dark']) .landing {
		--y: #121d18;
		--y-soft: #1b2a23;
		--card: #1d2c25;
		--ink: #f5f1e6;
		--ink-2: #c3cdc7;
		--g: #155f49;
		--g-deep: #0d4636;
		--g-soft: #23392f;
		--g-text: #8fe0b8;
		--coral: #ff8a70;
		--btn: #ffd65a;
		--btn-hover: #ffe285;
		--on-btn: #14201b;
		--focus: #ffd65a;
		--shadow: 0 1px 0 rgba(0, 0, 0, 0.3), 0 14px 32px -12px rgba(0, 0, 0, 0.6);
	}
	/* The page scrolls on <html>: keep a focused item clear of the bottom bar. */
	:global(html:has(.landing)) { scroll-padding-block-end: 100px; }

	.suggest { display: flex; justify-content: center; align-items: center; gap: 8px; margin: 0; padding: 4px 16px; background: var(--y-soft); font-size: .92rem; }
	.suggest a { color: var(--ink); font-weight: 600; min-height: 44px; display: inline-flex; align-items: center; }
	.suggest button { min-width: 44px; min-height: 44px; border: 0; background: none; color: var(--ink-2); font: inherit; cursor: pointer; }
	.top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; max-width: 1120px; margin: 0 auto; padding: 8px 16px; }
	.brand { display: inline-flex; align-items: center; min-height: 44px; color: var(--ink); text-decoration: none; }
	.links { display: flex; align-items: center; gap: 10px; }
	.links a { min-height: 44px; min-inline-size: 44px; padding: 0 10px; justify-content: center; display: inline-flex; align-items: center; color: var(--ink); font-weight: 600; text-decoration: none; border-radius: 999px; }
	.links a:hover { text-decoration: underline; }
	.links .signin { background: var(--card); box-shadow: var(--shadow); padding: 0 18px; }

	main { display: block; }
	h1, h2, h3 { margin: 0; overflow-wrap: break-word; }
	h1, h2 { font-family: var(--font-display); font-weight: 600; line-height: 1.08; letter-spacing: -0.01em; }
	[dir='rtl'] h1, [dir='rtl'] h2 { font-weight: 800; letter-spacing: 0; line-height: 1.3; }
	h1 { font-size: clamp(2.4rem, 10vw, 4.2rem); margin-bottom: 14px; }
	h2 { font-size: clamp(1.7rem, 6.5vw, 2.6rem); }
	h3 { font-size: 1.08rem; font-weight: 700; margin-bottom: 4px; }
	p { line-height: 1.6; margin: 0; }
	.en { direction: ltr; text-align: left; unicode-bidi: isolate; }
	a:focus-visible, button:focus-visible, summary:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; border-radius: 8px; }
	.scroller:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; border-radius: 12px; }

	.primary { display: flex; gap: 12px; align-items: center; justify-content: center; min-height: 56px; padding: 12px 26px; border-radius: 999px; background: var(--btn); color: var(--on-btn); font-weight: 700; font-size: 1.08rem; text-decoration: none; box-shadow: var(--shadow); transition: transform .15s ease, background .15s ease; }
	.primary:hover { background: var(--btn-hover); transform: translateY(-1px); }
	.quiet { display: inline-flex; align-items: center; min-height: 44px; color: var(--ink); font-weight: 600; text-decoration: underline; text-underline-offset: 4px; text-decoration-thickness: 2px; }
	.quiet.inline { display: inline; min-height: 0; }

	/* ── 1. First screen ── */
	.hero { max-width: 1120px; margin: 0 auto; padding: 12px 16px 40px; display: grid; gap: 28px; }
	.copy { display: grid; justify-items: start; }
	.eyebrow { display: inline-block; margin: 0 0 14px; padding: 6px 12px; border-radius: 999px; background: var(--card); font-size: .74rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
	[dir='rtl'] .eyebrow { letter-spacing: normal; font-size: .86rem; }
	.line { font-size: 1.12rem; color: var(--ink-2); margin-bottom: 22px; max-width: 34em; }
	.copy .primary { justify-self: stretch; }
	.copy .quiet { justify-self: center; margin-top: 6px; }
	.small { justify-self: center; color: var(--ink-2); font-size: .86rem; }

	.stage { position: relative; padding-bottom: 8px; }
	.photo { display: block; width: 100%; border-radius: 28px; object-fit: cover; }
	.photo.empty { display: grid; place-items: center; color: rgba(255, 255, 255, .5); background-color: var(--g); background-image: radial-gradient(rgba(255, 255, 255, .14) 1.4px, transparent 1.6px); background-size: 18px 18px; }
	.hero-photo { aspect-ratio: 4 / 3; }
	.hero-photo.empty { place-items: start end; padding: 22px; }
	.phone { position: relative; z-index: 1; margin: -38% 14px 0; display: grid; gap: 9px; padding: 14px; border-radius: 26px; background: var(--card); box-shadow: 0 30px 60px -20px rgba(20, 32, 27, .45); }
	.phone p { margin: 0; }
	.msg.mira { display: flex; gap: 8px; align-items: flex-start; }
	.av { flex: none; display: grid; place-items: center; inline-size: 30px; block-size: 30px; border-radius: 50%; background: var(--g); color: #fff; font-weight: 700; font-size: .85rem; }
	.bubble { padding: 9px 12px; border-radius: 16px; border-start-start-radius: 4px; background: var(--g-soft); font-size: .95rem; }
	.audio, .rec { display: flex; align-items: center; gap: 8px; color: var(--g-text); font-size: .74rem; margin-bottom: 4px; direction: ltr; }
	.play { font-size: .7rem; }
	.time { font-variant-numeric: tabular-nums; }
	.prompt-fa { font-family: var(--font-body); text-align: right; }
	.prompt-en { color: var(--ink-2); font-size: .86rem; }
	.msg.you { justify-self: end; max-width: 86%; padding: 9px 12px; border-radius: 16px; border-start-end-radius: 4px; background: var(--y-soft); font-size: .95rem; }
	.dot { inline-size: 8px; block-size: 8px; border-radius: 50%; background: var(--coral); }
	.msg.fix { padding: 9px 12px; border-inline-start: 4px solid var(--g); border-radius: 10px; background: var(--y-soft); font-size: .9rem; }
	.msg.fix > b { display: block; color: var(--g-text); font-size: .78rem; }
	.better { font-weight: 700; color: var(--g-text); }
	.tip { color: var(--ink-2); font-size: .86rem; }

	.badges { list-style: none; margin: 14px 0 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
	.badge { position: relative; z-index: 2; padding: 7px 12px; border-radius: 999px; background: var(--card); box-shadow: var(--shadow); font-size: .8rem; font-weight: 700; white-space: nowrap; }

	/* The wave: little bars that rise and fall like a voice. */
	.wave { display: inline-flex; align-items: center; gap: 2px; block-size: 18px; }
	.wave i { inline-size: 3px; block-size: 100%; border-radius: 2px; background: currentColor; transform: scaleY(.45); }
	.wave i:nth-child(3n) { transform: scaleY(.8); }
	.wave i:nth-child(4n + 1) { transform: scaleY(.3); }
	.wave i:nth-child(5n + 2) { transform: scaleY(1); }

	/* ── Shared section and card shapes ── */
	.block { max-width: 1120px; margin: 0 auto; padding: 36px 16px; }
	.head { display: grid; gap: 12px; justify-items: start; margin-bottom: 20px; }
	.pill { padding: 8px 14px; border-radius: 999px; background: var(--card); font-weight: 600; font-size: .95rem; }
	.card { border-radius: 24px; background: var(--card); box-shadow: var(--shadow); }
	.card p { color: var(--ink-2); }
	.art { display: flex; align-items: center; justify-content: center; gap: 12px; border-radius: 18px; color: var(--g-text); }

	/* ── 2. A day: three cards, side by side (a swipeable row on phones) ── */
	.scroller { margin-inline: -16px; padding: 6px 16px 18px; overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding-inline: 16px; scrollbar-width: none; }
	.scroller::-webkit-scrollbar { display: none; }
	.steps { list-style: none; margin: 0; padding: 0; display: grid; grid-auto-flow: column; grid-auto-columns: 80%; gap: 14px; }
	.step { scroll-snap-align: start; padding: 14px 14px 20px; position: relative; }
	.step .art { block-size: 120px; margin-bottom: 14px; }
	.art-0 { background: var(--g); color: #ffd65a; }
	.art-1 { background: var(--y-soft); flex-direction: column; gap: 10px; }
	.art-2 { background: var(--g-soft); flex-direction: column; align-items: stretch; padding: 0 18px; gap: 10px; }
	.art-0 .wave { block-size: 44px; gap: 4px; }
	.art-0 .wave i { inline-size: 5px; }
	.mic { position: relative; display: grid; place-items: center; inline-size: 58px; block-size: 58px; border-radius: 50%; background: var(--g); color: #fff; }
	.ring { position: absolute; inset: 0; border-radius: 50%; border: 2px solid var(--g-text); opacity: 0; }
	.chip-fix { padding: 4px 10px; border-radius: 999px; background: var(--card); font-size: .8rem; color: var(--ink); }
	.chip-fix b { color: var(--g-text); }
	.note { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 14px; inline-size: 72%; }
	.n1 { background: var(--g); color: #fff; justify-self: start; }
	.n2 { background: var(--card); color: var(--g-text); align-self: flex-end; }
	.num { position: absolute; inset-block-start: 22px; inset-inline-end: 22px; display: grid; place-items: center; inline-size: 30px; block-size: 30px; border-radius: 50%; background: var(--card); color: var(--ink); font-weight: 800; font-size: .9rem; box-shadow: var(--shadow); }
	.need { color: var(--ink-2); font-size: .92rem; }

	/* ── 3. Practice: a grid of cards ── */
	.bento { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
	.tile { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; padding: 12px; }
	.tile .art { flex: none; inline-size: 92px; block-size: 92px; }
	.t0 .art { background: var(--g); color: #fff; }
	.t1 .art { background: var(--y-soft); }
	.t2 .art { background: var(--g-soft); flex-direction: column; gap: 6px; }
	.t3 .art { background: var(--y-soft); padding: 8px; }
	.cue { display: none; }
	.timer { overflow: visible; }
	.timer .track { fill: none; stroke: rgba(255, 255, 255, .25); stroke-width: 4; }
	.timer .run { fill: none; stroke: #ffd65a; stroke-width: 4; stroke-linecap: round; stroke-dasharray: 113.1; stroke-dashoffset: 28; transform: rotate(-90deg); transform-origin: 22px 22px; }
	.timer text { fill: #fff; font-size: 10px; font-weight: 700; font-family: var(--font-body); }
	.say { display: grid; gap: 4px; padding: 7px; border-radius: 10px; background: var(--card); }
	.say i { display: block; block-size: 4px; border-radius: 2px; background: var(--ink-2); opacity: .5; inline-size: 18px; }
	.s2 { position: relative; background: var(--g); }
	.s2 i { background: #fff; opacity: .9; inline-size: 24px; }
	.s2 b { position: absolute; inset-block-start: -9px; inset-inline-end: -8px; color: #e0a800; font-size: .9rem; }
	.arrow { font-weight: 700; color: var(--g-text); font-size: .9rem; }
	.say.s1 { padding: 7px 6px; }
	.t1 .art { gap: 5px; }
	.trap { font-size: .8rem; font-weight: 700; color: var(--ink); text-align: center; line-height: 1.3; }
	.trap s { color: var(--coral); text-decoration-thickness: 2px; }
	.words { flex: 1 1 10em; min-width: 0; }
	.words p { font-size: .93rem; line-height: 1.5; }
	.soon-photo { flex: none; inline-size: 92px; block-size: 92px; border-radius: 18px; }
	.soon-photo.empty svg { inline-size: 26px; }
	.soon .words { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; }
	.tag { margin: 0; padding: 4px 10px; border-radius: 999px; background: #ffd65a; color: #14201b; font-weight: 800; font-size: .8rem; }

	/* ── 4. Privacy and questions ── */
	.two { display: grid; gap: 12px; }
	.privacy, .faq { padding: 22px; }
	.lock { display: inline-grid; place-items: center; inline-size: 54px; block-size: 54px; border-radius: 16px; background: var(--g); color: #ffd65a; margin-bottom: 12px; }
	.privacy h3, .faq h3 { font-family: var(--font-display); font-size: 1.5rem; font-weight: 600; margin-bottom: 8px; }
	[dir='rtl'] .privacy h3, [dir='rtl'] .faq h3 { font-weight: 800; }
	.privacy p { margin-bottom: 6px; }
	details { border-bottom: 1px solid rgba(20, 32, 27, .1); }
	:global(:root[data-theme='dark']) .landing details { border-color: rgba(255, 255, 255, .12); }
	details:last-of-type { border-bottom: 0; }
	summary { min-height: 50px; display: flex; align-items: center; justify-content: space-between; gap: 12px; font-weight: 600; cursor: pointer; list-style: none; }
	summary::-webkit-details-marker { display: none; }
	.plus { position: relative; flex: none; inline-size: 26px; block-size: 26px; border-radius: 50%; background: var(--y-soft); }
	.plus::before, .plus::after { content: ''; position: absolute; inset-block-start: 12px; inset-inline-start: 7px; inline-size: 12px; block-size: 2px; border-radius: 1px; background: var(--ink); transition: transform .2s ease; }
	.plus::after { transform: rotate(90deg); }
	details[open] .plus::after { transform: rotate(0deg); }
	details p { padding-bottom: 14px; font-size: .95rem; }

	/* ── 5. Closing card ── */
	.last { padding-bottom: 20px; }
	.endcard { display: grid; gap: 18px; padding: 26px 20px; border-radius: 28px; background: var(--g); color: #fff; box-shadow: var(--shadow); overflow: hidden; }
	.end-words { display: grid; gap: 10px; justify-items: center; text-align: center; }
	.end-words p { color: rgba(255, 255, 255, .85); }
	.endcard .primary.on-green { justify-self: stretch; background: #ffd65a; color: #14201b; }
	.endcard .primary.on-green:hover { background: #ffe285; }
	.endcard .quiet.on-green { color: #fff; }
	.endcard a:focus-visible { outline-color: #ffd65a; }
	.end-photo { aspect-ratio: 16 / 9; border-radius: 20px; }
	.end-photo.empty { background-color: var(--g-deep); }
	/* On phones an empty photo place would only make the page longer. */
	@media (max-width: 959px) { .end-photo.empty { display: none; } }

	footer { max-width: 1120px; margin: 0 auto; padding: 8px 16px 120px; text-align: center; color: var(--ink-2); font-size: .85rem; }
	footer nav { display: flex; justify-content: center; gap: 16px; }
	footer a { min-height: 44px; min-inline-size: 44px; justify-content: center; display: inline-flex; align-items: center; color: var(--ink); font-weight: 600; }
	footer p { margin: 4px 0 0; font-size: .8rem; }

	.bar { position: fixed; inset-inline: 0; inset-block-end: 0; z-index: 30; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); background: linear-gradient(transparent, var(--y) 38%); }
	.bar .primary { max-width: 520px; margin: 0 auto; }
	.bar[hidden] { display: none; }
	@media (max-height: 480px) { .bar { display: none; } }
	@media print { .reveal { opacity: 1 !important; transform: none !important; } .bar { display: none; } }

	/* ── Wider screens ── */
	@media (min-width: 720px) {
		.steps { grid-auto-flow: row; grid-template-columns: repeat(3, 1fr); grid-auto-columns: auto; }
		.scroller { overflow: visible; margin-inline: 0; padding-inline: 0; }
		.bento { grid-template-columns: repeat(2, 1fr); }
		.two { grid-template-columns: 1fr 1.25fr; align-items: start; }
	}
	@media (min-width: 960px) {
		.hero { grid-template-columns: 1fr 1.05fr; align-items: center; column-gap: 56px; padding-top: 36px; padding-bottom: 56px; }
		.copy .primary { justify-self: start; }
		.copy .quiet, .small { justify-self: start; }
		.stage { padding: 0 0 30px; }
		.phone { position: absolute; inset-block-end: 0; inset-inline-start: -36px; inline-size: 340px; margin: 0; }
		.hero-photo { aspect-ratio: 5 / 4; inline-size: 88%; margin-inline-start: auto; }
		.badges { margin: 0; display: block; }
		.badge { position: absolute; }
		.b0 { inset-block-start: 22px; inset-inline-start: 18%; }
		.b1 { inset-block-start: 40%; inset-inline-end: -10px; }
		.b2 { inset-block-end: 6px; inset-inline-end: 6%; }
		.block { padding: 48px 24px; }
		.bento { grid-template-columns: repeat(3, 1fr); grid-template-rows: auto auto; }
		.tile { flex-direction: column; align-items: stretch; padding: 14px; }
		.tile .art { inline-size: auto; block-size: 110px; }
		.t0 { grid-row: span 2; }
		.t0 .art { block-size: auto; flex: 1; min-block-size: 220px; flex-direction: column; gap: 16px; }
		.cue { display: grid; gap: 6px; padding: 14px 16px; border-radius: 12px; background: #fff; inline-size: 62%; transform: rotate(-3deg); }
		.cue i { display: block; block-size: 6px; border-radius: 3px; background: #c9d6cf; }
		.cue i:first-child { inline-size: 70%; background: var(--g); }
		.cue i:last-child { inline-size: 55%; }
		.t0 .timer { inline-size: 76px; block-size: 76px; }
		.soon { flex-direction: column; align-items: stretch; }
		.soon-photo { inline-size: auto; block-size: 110px; }
		.t1 .art > * { scale: 1.45; }
		.t1 .art { gap: 14px; }
		.t2 .art .head-icon svg { inline-size: 34px; block-size: 34px; }
		.t2 .art .wave { block-size: 30px; gap: 3px; }
		.t2 .art .wave i { inline-size: 4px; }
		.trap { font-size: 1.1rem; }
		.endcard { grid-template-columns: 1.1fr 1fr; align-items: center; padding: 36px; }
		.end-words { justify-items: start; text-align: start; }
		.endcard .primary.on-green { justify-self: start; }
		.end-photo { aspect-ratio: 4 / 3; }
	}

	/* ── Motion, only for people who have not asked to reduce it ── */
	@media (prefers-reduced-motion: no-preference) {
		.landing:global([data-anim='on']) .reveal { transition: opacity .6s ease, transform .6s cubic-bezier(.2, .7, .2, 1); transition-delay: calc(var(--d, 0) * 90ms); }
		.landing:global([data-anim='on']) .reveal:not(:focus-within):not(:global(.in)) { opacity: 0; transform: translateY(22px); }

		/* Each drawing plays when its card comes into view and stops within about five seconds. */
		.landing:global([data-anim='on']) .reveal:global(.in) .wave i { animation: talk 1.1s ease-in-out 4 alternate; animation-delay: calc(var(--i) * -170ms); }
		@keyframes talk { from { transform: scaleY(.22); } to { transform: scaleY(1); } }

		/* The chat plays once like a lesson: Mira asks, you answer, then the better way appears. */
		.landing:global([data-anim='on']) .reveal:global(.in) .msg { animation: 4.5s ease 1 both; }
		.landing:global([data-anim='on']) .reveal:global(.in) .mira { animation-name: msg1; }
		.landing:global([data-anim='on']) .reveal:global(.in) .you { animation-name: msg2; }
		.landing:global([data-anim='on']) .reveal:global(.in) .fix { animation-name: msg3; }
		@keyframes msg1 { 0% { opacity: 0; transform: translateY(10px); } 12%, 100% { opacity: 1; transform: none; } }
		@keyframes msg2 { 0%, 35% { opacity: 0; transform: translateY(10px); } 48%, 100% { opacity: 1; transform: none; } }
		@keyframes msg3 { 0%, 70% { opacity: 0; transform: translateY(10px) scale(.97); } 84%, 100% { opacity: 1; transform: none; } }
		.landing:global([data-anim='on']) .reveal:global(.in) .dot { animation: blink 1s steps(2, start) 4; }
		@keyframes blink { to { visibility: hidden; } }

		.landing:global([data-anim='on']) .reveal:global(.in) .badge { animation: bob 2.4s ease-in-out 2; }
		.landing:global([data-anim='on']) .reveal:global(.in) .b1 { animation-delay: .4s; }
		.landing:global([data-anim='on']) .reveal:global(.in) .b2 { animation-delay: .8s; }
		@keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }

		.landing:global([data-anim='on']) .reveal:global(.in) .ring { animation: pulse 2.2s ease-out 2; }
		.landing:global([data-anim='on']) .reveal:global(.in) .r2 { animation-delay: 1.1s; }
		@keyframes pulse { from { opacity: .7; transform: scale(1); } to { opacity: 0; transform: scale(1.9); } }
		.landing:global([data-anim='on']) .reveal:global(.in) .chip-fix b { animation: pop 1.6s ease 1.2s 1; display: inline-block; }
		@keyframes pop { 0% { transform: scale(1); } 50% { transform: scale(1.25); } 100% { transform: scale(1); } }

		.landing:global([data-anim='on']) .reveal:global(.in) .n1 { animation: slide .8s ease 1 both; }
		.landing:global([data-anim='on']) .reveal:global(.in) .n2 { animation: slide .8s ease 1.4s 1 both; }
		@keyframes slide { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

		.landing:global([data-anim='on']) .reveal:global(.in) .timer .run { animation: count 4s linear 1 both; }
		@keyframes count { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 28; } }
		.landing:global([data-anim='on']) .reveal:global(.in) .s2 { animation: grow 1.4s ease .6s 1 both; }
		@keyframes grow { from { transform: scale(.85); opacity: .5; } to { transform: none; opacity: 1; } }
		.landing:global([data-anim='on']) .reveal:global(.in) .trap s { animation: strike 1.6s ease 1 both; }
		@keyframes strike { 0%, 50% { text-decoration-color: transparent; } 100% { text-decoration-color: currentColor; } }
		.primary { transition: transform .15s ease, background .15s ease; }
	}
</style>
