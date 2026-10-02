<script lang="ts">
	// Self-hosted brand fonts (no external font CDN — PWA/offline friendly).
	//
	// Newsreader = display serif, IBM Plex Sans = body: the two the redesign
	// specifies. Vazirmatn stays because neither covers Persian — it sits
	// after them in the stacks so browsers fall back PER GLYPH, giving Latin
	// the designed face and Persian a real Persian face in the same line.
	// Dropping it would have left every Persian page on a system fallback.
	import '@fontsource-variable/newsreader';
	import '@fontsource-variable/ibm-plex-sans';
	import '@fontsource-variable/vazirmatn';
	import '../app.css';
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';
	import { page, updated } from '$app/state';
	import { beforeNavigate, afterNavigate } from '$app/navigation';
	import { setAnalyticsUser, startAnalyticsListeners, trackEvent, clearLessonContext } from '$services/analytics';
	import { getSupabaseBrowserClient } from '$lib/supabase/client';
	import { authStore } from '$stores/auth';
	import { inject } from '@vercel/analytics';
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { initTheme, refreshTheme } from '$services/theme';
	import { getLanguage, applyDocumentLanguage } from '$services/data-layer';
	import { env } from '$env/dynamic/public';
	import { captureAcquisition } from '$services/acquisition';

	/**
	 * Google Search Console ownership token.
	 *
	 * Read from the environment rather than committed so the code can be set
	 * in Vercel and take effect on the next deploy without a commit — and so
	 * rotating or removing it is not a code change.
	 *
	 * $env/dynamic rather than $env/static on purpose: static would fail the
	 * build on any checkout where the variable is not declared, which is
	 * every local one.
	 */
	const googleVerification = $derived(env.PUBLIC_GOOGLE_SITE_VERIFICATION ?? '');

	if (!dev) {
		inject({ mode: 'production', beforeSend: event => new URL(event.url).pathname.startsWith('/admin') ? null : event });
		injectSpeedInsights({ beforeSend: event => new URL(event.url).pathname.startsWith('/admin') ? null : event });
	}
	// Start a fresh document across the admin boundary so a replay script from
	// a public page can never continue observing private learner reports.
	beforeNavigate(({ from, to, cancel }) => {
		if (from && to && from.url.pathname.startsWith('/admin') !== to.url.pathname.startsWith('/admin')) {
			cancel();
			window.location.assign(to.url.href);
		}
	});

	// The inline script in app.html already painted the right theme before
	// first paint; this just syncs the stores so the toggle shows the
	// correct state and starts following the OS when 'system' is chosen.
	onMount(() => {
		initTheme();
		// The boot script set lang/dir from localStorage. For a signed-in
		// user the authoritative value lives on their profile, so re-apply
		// once it has been fetched.
		getLanguage()
			.then(applyDocumentLanguage)
			.catch(() => {
				/* boot-script value stands */
			});
	});

	let { children, data } = $props();

	// ── Always show the current release ──
	// A new service worker takes over the open tab (it calls skipWaiting and
	// claim): reload once so the page and its scripts are the new ones. Not on
	// the very first install, when there was no controller before.
	onMount(() => {
		if (dev || !('serviceWorker' in navigator)) return;
		let hadController = !!navigator.serviceWorker.controller;
		let reloading = false;
		const onChange = () => {
			if (!hadController) {
				hadController = true;
				return;
			}
			if (reloading) return;
			reloading = true;
			location.reload();
		};
		navigator.serviceWorker.addEventListener('controllerchange', onChange);
		// Look for a new service worker whenever the tab comes back into view.
		const onVisible = () => {
			if (document.visibilityState === 'visible') void navigator.serviceWorker.getRegistration().then((r) => r?.update());
		};
		document.addEventListener('visibilitychange', onVisible);
		return () => {
			navigator.serviceWorker.removeEventListener('controllerchange', onChange);
			document.removeEventListener('visibilitychange', onVisible);
		};
	});

	// SvelteKit polls for a new release (see svelte.config.js). On the public
	// pages nothing is in progress, so reload straight away; in the app the
	// next link click does a full load instead of interrupting a lesson.
	const PUBLIC_PAGES = ['/', '/fa', '/try', '/login'];
	$effect(() => {
		if (updated.current && PUBLIC_PAGES.includes(page.url.pathname)) location.reload();
	});

	// One skip link for the whole app, targeting the <main id="main-content">
	// every page renders. Keyboard users otherwise tab through the header's
	// back button, language select and speed select on every single page.
	let skipLang = $state('en');
	onMount(() => {
		getLanguage()
			.then((l) => {
				if (l === 'fa' || l === 'en') skipLang = l;
			})
			.catch(() => {
				/* stays English */
			});
	});

	afterNavigate(() => {
		refreshTheme();
		captureAcquisition();
		if (window.location.pathname !== '/lesson') clearLessonContext();
		void trackEvent('page_viewed');
	});
	onMount(() => {
		captureAcquisition();
		const stop = authStore.subscribe(auth => setAnalyticsUser(auth.user?.id ?? null));
		const cleanup = startAnalyticsListeners();
		return () => { stop(); cleanup(); };
	});

	// Initialize auth store reactively from server-provided data
	$effect(() => {
		if (data.session) {
			authStore.set({
				user: data.user,
				session: data.session,
				isAuthenticated: true,
				displayName: data.user?.user_metadata?.display_name || 'Learner',
				avatarUrl: null,
				isLoading: false
			});
		}
	});

	onMount(() => {
		const supabase = getSupabaseBrowserClient();

		// Subscribe to auth state changes on the client
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, session) => {
			authStore.set({
				user: session?.user ?? null,
				session,
				isAuthenticated: !!session,
				displayName: session?.user?.user_metadata?.display_name || 'Learner',
				avatarUrl: null,
				isLoading: false
			});
		});

		return () => subscription.unsubscribe();
	});
</script>

<!-- Fallback title for the routes that set none — mostly signed-in app pages,
     which robots.txt already disallows. A page's own svelte:head title
     replaces this one rather than stacking with it; the previous fallback
     lived in app.html, outside svelte:head, which is why it always won. -->
<svelte:head>
	<title>Mirifer — Learn German</title>
	{#if googleVerification}
		<meta name="google-site-verification" content={googleVerification} />
	{/if}
</svelte:head>

<a href="#main-content" class="skip-link">
	{skipLang === 'fa' ? 'رفتن به محتوا' : 'Skip to content'}
</a>

{@render children()}
