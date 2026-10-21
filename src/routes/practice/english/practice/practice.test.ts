import { describe, it, expect } from 'vitest';
import { load as hub } from './+page.server';
import { load as modulePage } from './[module]/+page.server';

const profile = { reason: 'travel', comfort: 'natural', minutes: 15, skipped: false, completedAt: '2026-10-01T10:00:00.000Z' };
const locals = (meta: Record<string, unknown> | null) => ({ user: meta === null ? null : { id: 'u1', user_metadata: meta } }) as any;
const outcome = async (run: () => unknown) => { try { return await run(); } catch (e) { return e; } };

describe('the Practice area pages', () => {
	it('are for every English learner after onboarding, with their version', async () => {
		expect(await hub({ locals: locals({ target_language: 'en', english_profile_v1: profile }) } as any)).toEqual({ learnerId: 'u1', track: 'professional' });
		expect(await outcome(() => hub({ locals: locals(null) } as any))).toMatchObject({ status: 303, location: '/login' });
		expect(await outcome(() => hub({ locals: locals({ target_language: 'de' }) } as any))).toMatchObject({ status: 303, location: '/languages' });
		expect(await outcome(() => hub({ locals: locals({ target_language: 'en' }) } as any))).toMatchObject({ status: 303, location: '/practice/english/start' });
	});
	it('open each module, send Listen and retell to its own page, and know nothing else', async () => {
		const learner = locals({ target_language: 'en', english_profile_v1: profile });
		expect(await modulePage({ locals: learner, params: { module: 'speaking-card' } } as any)).toEqual({ learnerId: 'u1', module: 'speaking-card' });
		expect(await outcome(() => modulePage({ locals: learner, params: { module: 'retell' } } as any))).toMatchObject({ status: 303, location: '/practice/english/retell' });
		expect(await outcome(() => modulePage({ locals: learner, params: { module: 'choose-persuade' } } as any))).toMatchObject({ status: 404 });
	});
});
