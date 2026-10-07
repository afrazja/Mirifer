import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { load as loadEn } from './+page.server';
import { load as loadFa } from './fa/+page.server';

describe('landing pages', () => {
	it('send signed-in learners to their languages and show visitors the page', async () => {
		for (const load of [loadEn, loadFa]) {
			await expect(load({ locals: { user: { id: 'u1' } } } as any)).rejects.toMatchObject({ status: 303, location: '/languages' });
			await expect(load({ locals: { user: null } } as any)).resolves.toEqual({});
		}
	});
	it('the top bar has no signed-in "Open app" version', () => {
		const nav = readFileSync('src/lib/components/LandingNav.svelte', 'utf8');
		expect(nav).not.toMatch(/Open app|isAuthenticated/);
		expect(nav).toContain('Log in');
		expect(nav).toContain('Sign up');
		expect(nav).toContain('InstallAppButton');
	});
});
