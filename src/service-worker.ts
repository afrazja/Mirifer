/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

/**
 * Service worker — makes Mirifer installable as a PWA and keeps the lesson
 * app working offline.
 *
 * Strategy:
 *  - Precache the built app shell (JS/CSS) and essential static files. Each
 *    file is added on its own: one that fails to download no longer cancels the
 *    whole install, which used to leave a phone on an old worker (and its old
 *    saved pages) for as long as the connection stayed poor.
 *  - Cache-first for immutable build assets (their names change per release).
 *  - Public pages (landing, Persian landing, trial, login) always come from the
 *    network and are never saved: a visitor must never be shown an old design
 *    because one request failed. They need nothing offline.
 *  - App pages (lessons, review, ...) are network-first with a saved copy as the
 *    offline fallback; the app has its own localStorage layer for lesson state.
 *  - Never intercept /proxy/* (TTS audio uses HTTP caching; STT and analytics
 *    must always hit the network) or cross-origin requests (Supabase handles its
 *    own auth/data).
 */

const sw = self as unknown as ServiceWorkerGlobalScope;

import { build, files, version } from '$service-worker';

const CACHE = `mirifer-${version}`;

// Static files worth precaching (skip marketing images & dev generators)
const PRECACHE_FILES = files.filter(
	(f) => !/generate-|WhatsApp|og-image|phone-preview|sitemap|robots|^\/images\//.test(f)
);

const ASSETS = [...build, ...PRECACHE_FILES];
const ASSET_SET = new Set(ASSETS);

/** Pages for anyone who is not signed in yet: always fresh, never saved. */
const PUBLIC_PAGES = new Set(['/', '/fa', '/try', '/login', '/privacy', '/terms']);

sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => Promise.allSettled(ASSETS.map((asset) => cache.add(asset))))
			.then(() => sw.skipWaiting())
	);
});

sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => sw.clients.claim())
	);
});

sw.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);

	// Same-origin only; leave Supabase/analytics/proxies alone
	if (url.origin !== sw.location.origin) return;
	if (url.pathname.startsWith('/proxy/')) return;

	// Public pages: straight to the network, with no saved copy to go stale.
	if (request.mode === 'navigate' && PUBLIC_PAGES.has(url.pathname.replace(/(.)\/$/, '$1'))) return;

	// Immutable build assets & precached statics: cache-first
	if (ASSET_SET.has(url.pathname)) {
		event.respondWith(
			caches.open(CACHE).then(async (cache) => {
				const cached = await cache.match(url.pathname);
				return cached ?? fetch(request);
			})
		);
		return;
	}

	// App pages & everything else: network-first, fall back to cache offline
	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE);
			try {
				const response = await fetch(request);
				// Save successful app page navigations for offline revisits
				if (response.ok && request.mode === 'navigate') {
					cache.put(request, response.clone());
				}
				return response;
			} catch {
				const cached = await cache.match(request);
				if (cached) return cached;
				// Last resort for navigations: the app home shell
				if (request.mode === 'navigate') {
					const home = await cache.match('/home');
					if (home) return home;
				}
				return new Response('Offline', { status: 503, statusText: 'Offline' });
			}
		})()
	);
});
