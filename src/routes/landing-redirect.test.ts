import { describe, it, expect } from 'vitest';
import { load as loadEn } from './+page.server';
import { load as loadFa } from './fa/+page.server';
import { LANDING } from '$lib/landing/copy';

describe('landing pages', () => {
	it('send signed-in learners to their languages and show visitors the page', async () => {
		for (const load of [loadEn, loadFa]) {
			await expect(load({ locals: { user: { id: 'u1' } } } as any)).rejects.toMatchObject({ status: 303, location: '/languages' });
			await expect(load({ locals: { user: null } } as any)).resolves.toEqual({});
		}
	});
	it('promise only what the app does: English, IELTS-style, both languages in step', () => {
		const en = JSON.stringify(LANDING.en), fa = JSON.stringify(LANDING.fa);
		// German is paused; the page is about English.
		expect(en).not.toMatch(/German|Deutsch/);
		// "IELTS-style" only: never a score, a band or a partnership.
		expect(en).not.toMatch(/\bband\b|score (?!you)|official partner/i);
		expect(en).toMatch(/isn’t affiliated with or endorsed by IELTS/);
		expect(fa).toContain('هیچ ارتباط رسمی با آیلتس ندارد');
		// The two languages say the same things.
		for (const key of ['faq', 'day', 'practice'] as const) {
			expect(JSON.stringify(Object.values(LANDING.en[key]).map(v => (Array.isArray(v) ? v.length : typeof v)))).toBe(JSON.stringify(Object.values(LANDING.fa[key]).map(v => (Array.isArray(v) ? v.length : typeof v))));
		}
		// No Persian "·" next to digits (it reads like a zero).
		expect(fa).not.toContain('·');
	});
});
