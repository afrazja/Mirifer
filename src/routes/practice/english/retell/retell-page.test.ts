import { describe, it, expect, vi } from 'vitest';
vi.mock('$env/dynamic/private', () => ({ env: {} }));
import { load } from './+page.server';
import { ALL_RETELL_PIECES } from '$lib/practice/day-content';

const profile = { reason: 'travel', comfort: 'natural', minutes: 15, skipped: false, completedAt: '2026-10-01T10:00:00.000Z' };
const event = (meta: Record<string, unknown>, owner = false) => ({
	locals: { supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', user_metadata: { target_language: 'en', ...meta } } }, error: null }) } } },
	parent: async () => ({ labAccess: owner })
}) as any;
const outcome = async (run: () => unknown) => { try { return await run(); } catch (e) { return e; } };

describe('Listen and retell in Practice', () => {
	it('sends learners to today’s lesson (Practice is off for learners for now)', async () => {
		expect(await outcome(() => load(event({ english_profile_v1: profile })))).toMatchObject({ status: 303, location: '/practice/english/today' });
	});
	it('gives the owner every story', async () => {
		expect((await load(event({}, true)) as any).visible).toEqual(ALL_RETELL_PIECES.map(piece => piece.id));
	});
});
