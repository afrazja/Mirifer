/**
 * Sitemap, generated rather than checked in.
 *
 * Only the English course's public pages. The paused German pages (the
 * grammar pages under /basics and /fa/basics, the speaking drill) are left
 * out, so search engines stop sending English learners to German
 * (owner's decision 2026-11-10). They stay online for the German rebuild.
 *
 * Replaces static/sitemap.xml — a file in static/ is served by the CDN
 * before a route with the same path is ever reached, so the two cannot
 * coexist and the static one had to go.
 */

import type { RequestHandler } from './$types';

const ORIGIN = 'https://www.mirifer.com';

interface StaticPage {
	path: string;
	priority: string;
	changefreq: string;
	/**
	 * Pinned date for pages that genuinely do not change. Without this the
	 * legal pages would claim to have been revised today on every crawl,
	 * which is both false and the kind of thing that gets a sitemap's dates
	 * ignored wholesale.
	 */
	lastmod?: string;
}

const STATIC_PAGES: StaticPage[] = [
	{ path: '/', priority: '1.0', changefreq: 'weekly' },
	{ path: '/fa', priority: '1.0', changefreq: 'weekly' },
	{ path: '/try', priority: '0.8', changefreq: 'monthly' },
	{ path: '/fa/try', priority: '0.8', changefreq: 'monthly' },
	{ path: '/privacy', priority: '0.3', changefreq: 'yearly', lastmod: '2026-02-24' },
	{ path: '/terms', priority: '0.3', changefreq: 'yearly', lastmod: '2026-02-24' }
];

/** The two landing pages are translations of each other; the rest are not. */
const LANDING_ALTERNATES = new Set(['/', '/fa']);

function xmlEscape(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

function hreflangFor(path: string): string {
	return path === '/fa' || path.startsWith('/fa/') ? 'fa' : 'en';
}

function urlEntry(
	path: string,
	lastmod: string,
	priority: string,
	changefreq: string,
	alts?: string[]
): string {
	const altTags = (alts ?? [])
		.map(
			(a) =>
				`\n    <xhtml:link rel="alternate" hreflang="${hreflangFor(a)}" href="${xmlEscape(ORIGIN + a)}"/>`
		)
		.join('');
	return `  <url>
    <loc>${xmlEscape(ORIGIN + path)}</loc>${altTags}
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

/**
 * Pure builder, so the XML can be asserted on without standing up a Supabase
 * client. Underscore-prefixed because SvelteKit rejects any other named
 * export from a +server module, and it does so only at postbuild.
 */
export function _buildSitemap(today: string): string {
	const entries = [
		...STATIC_PAGES.map((p) =>
			urlEntry(
				p.path,
				p.lastmod ?? today,
				p.priority,
				p.changefreq,
				LANDING_ALTERNATES.has(p.path) ? ['/', '/fa'] : undefined
			)
		)
	];

	return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>`;
}

export const GET: RequestHandler = async ({ setHeaders }) => {
	const today = new Date().toISOString().slice(0, 10);

	setHeaders({
		'Content-Type': 'application/xml',
		'Cache-Control': 'public, max-age=3600'
	});

	return new Response(_buildSitemap(today));
};
