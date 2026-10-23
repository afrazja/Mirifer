import { describe, it, expect } from 'vitest';
import { load as hub } from './+page.server';
import { load as modulePage } from './[module]/+page.server';

const profile = { reason: 'travel', comfort: 'natural', minutes: 15, skipped: false, completedAt: '2026-10-01T10:00:00.000Z' };
const page = (meta: Record<string, unknown> | null, owner: boolean, params: Record<string, string> = {}) =>
	({ locals: { user: meta === null ? null : { id: 'u1', user_metadata: meta } }, parent: async () => ({ labAccess: owner }), params }) as any;
const outcome = async (run: () => unknown) => { try { return await run(); } catch (e) { return e; } };
const english = { target_language: 'en', english_profile_v1: profile };

describe('the Practice area pages', () => {
	it('send learners to today’s lesson (Practice is off for learners for now)', async () => {
		expect(await outcome(() => hub(page(english, false)))).toMatchObject({ status: 303, location: '/practice/english/today' });
		expect(await outcome(() => modulePage(page(english, false, { module: 'speaking-card' })))).toMatchObject({ status: 303, location: '/practice/english/today' });
		expect(await outcome(() => hub(page(null, false)))).toMatchObject({ status: 303, location: '/login' });
	});
	it('stay for the owner, with their version', async () => {
		expect(await hub(page(english, true))).toEqual({ learnerId: 'u1', track: 'professional' });
		expect(await outcome(() => hub(page({ target_language: 'de' }, true)))).toMatchObject({ status: 303, location: '/languages' });
		expect(await outcome(() => hub(page({ target_language: 'en' }, true)))).toMatchObject({ status: 303, location: '/practice/english/start' });
	});
	it('open each module for the owner, send Listen and retell to its own page, and know nothing else', async () => {
		expect(await modulePage(page(english, true, { module: 'speaking-card' }))).toEqual({ learnerId: 'u1', module: 'speaking-card' });
		expect(await outcome(() => modulePage(page(english, true, { module: 'retell' })))).toMatchObject({ status: 303, location: '/practice/english/retell' });
		expect(await outcome(() => modulePage(page(english, true, { module: 'choose-persuade' })))).toMatchObject({ status: 404 });
	});
});
