import { describe, it, expect } from 'vitest';
import { _buildSitemap } from './+server';

const xml = _buildSitemap('2026-08-14');

const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

describe('sitemap', () => {
	it('is well-formed enough to parse', () => {
		// Not a full XML parse, but an unbalanced urlset or a stray & is the
		// realistic failure and Search Console rejects the whole file for it.
		expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
		expect((xml.match(/<url>/g) ?? []).length).toBe((xml.match(/<\/url>/g) ?? []).length);
		expect(xml.trimEnd().endsWith('</urlset>')).toBe(true);
		// A bare & anywhere would be a parse error.
		expect(xml).not.toMatch(/&(?!amp;|lt;|gt;|quot;)/);
	});

	it('lists both language landing pages', () => {
		expect(locs).toContain('https://www.mirifer.com/');
		expect(locs).toContain('https://www.mirifer.com/fa');
	});

	it('lists the English sample in both languages', () => {
		expect(locs).toContain('https://www.mirifer.com/try');
		expect(locs).toContain('https://www.mirifer.com/fa/try');
	});

	it('leaves out the paused German pages', () => {
		// The grammar pages and the speaking drill are German; English learners must not land there from search.
		expect(locs.filter((l) => /\/basics|\/drill/.test(l))).toEqual([]);
	});

	it('does not advertise routes that no longer exist', () => {
		// /placement and /fa/test were removed with the evaluation feature.
		// A sitemap pointing at a 404 is worse than one that omits the page.
		expect(locs).not.toContain('https://www.mirifer.com/placement');
		expect(locs).not.toContain('https://www.mirifer.com/fa/test');
	});

	it('has no duplicate loc', () => {
		// A repeated URL is the usual symptom of a page being added to both
		// the static list and the generated one.
		expect(new Set(locs).size, `duplicates in ${locs.join(', ')}`).toBe(locs.length);
	});

	it('never claims the legal pages changed today', () => {
		// They are pinned. Stamping every crawl with today's date is false and
		// teaches Google to ignore the dates on the pages that do change.
		for (const path of ['/privacy', '/terms']) {
			const block = xml.slice(xml.indexOf(`<loc>https://www.mirifer.com${path}</loc>`));
			const lastmod = /<lastmod>([^<]+)<\/lastmod>/.exec(block)?.[1];
			expect(lastmod, `${path} lastmod`).toBe('2026-02-24');
		}
	});

	it('pairs every hreflang reciprocally', () => {
		// Google discards one-directional annotations, so a block that names
		// an alternate must be named back by that alternate's own block.
		const blocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => m[1]);
		const altsOf = new Map<string, string[]>();

		for (const b of blocks) {
			const loc = /<loc>([^<]+)<\/loc>/.exec(b)?.[1] ?? '';
			const alts = [...b.matchAll(/hreflang="[^"]*" href="([^"]+)"/g)].map((m) => m[1]);
			if (alts.length) altsOf.set(loc, alts);
		}

		for (const [loc, alts] of altsOf) {
			expect(alts, `${loc} omits itself from its own alternates`).toContain(loc);
			for (const a of alts) {
				expect(altsOf.get(a), `${a} is named by ${loc} but names no alternates back`).toBeDefined();
				expect(altsOf.get(a), `${a} does not name ${loc} back`).toContain(loc);
			}
		}
	});

	it('tags the fa alternates fa and the en alternates en', () => {
		expect(xml).toMatch(/hreflang="fa" href="https:\/\/www\.mirifer\.com\/fa"/);
		expect(xml).toMatch(/hreflang="en" href="https:\/\/www\.mirifer\.com\/"/);
	});
});
