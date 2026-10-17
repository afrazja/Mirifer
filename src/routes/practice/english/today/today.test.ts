import { describe, it, expect, vi } from 'vitest';
vi.mock('$env/dynamic/private', () => ({ env: { ADMIN_EMAIL: 'owner@m.test' } }));
import { load, actions } from './+page.server';
import { DAY_TWO, startSession } from '$lib/practice/day';

function fixture(target = 'en', meta: Record<string, unknown> = {}, session?: unknown, owner = false, query = '') {
	const profile = { reason: 'travel', comfort: 'simple', minutes: 20, skipped: false, completedAt: '2026-10-01T10:00:00.000Z' };
	const user = { id: 'u1', ...(owner ? { email: 'owner@m.test', email_confirmed_at: '2026-01-01T00:00:00Z' } : {}), user_metadata: { target_language: target, display_name: 'Sam', english_profile_v1: profile, ...meta } };
	const supabase = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }), updateUser: vi.fn().mockResolvedValue({ error: null }) } };
	const body = new FormData(); if (session !== undefined) body.set('session', typeof session === 'string' ? session : JSON.stringify(session));
	return { supabase, event: () => ({ locals: { supabase }, url: new URL(`https://mirifer.test/practice/english/today${query}`), parent: async () => ({ labAccess: owner }), request: new Request('https://mirifer.test/practice/english/today?/save', { method: 'POST', body }) }) as any };
}

describe('English today page', () => {
	it('needs a signed-in English learner', async () => {
		const f = fixture(); f.supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
		await expect(load(f.event())).rejects.toMatchObject({ location: '/login' });
		await expect(load(fixture('de').event())).rejects.toMatchObject({ location: '/languages' });
		expect(await actions.save(fixture('de', {}, startSession(15)).event())).toMatchObject({ status: 409 });
	});
	it('sends a learner without a profile to onboarding first', async () => {
		await expect(load(fixture('en', { english_profile_v1: undefined }).event())).rejects.toMatchObject({ location: '/practice/english/start' });
	});
	it('loads the saved checkpoint and ignores a damaged one', async () => {
		const saved = startSession(20);
		expect(await load(fixture('en', { english_day_v1: saved }).event())).toMatchObject({ name: 'Sam', session: saved });
		expect(await load(fixture('en', { english_day_v1: { junk: 1 } }).event())).toMatchObject({ session: null });
	});
	it('saves only a valid checkpoint, and clears on empty', async () => {
		const f = fixture('en', {}, startSession(15));
		expect(await actions.save(f.event())).toEqual({ saved: true });
		expect(f.supabase.auth.updateUser).toHaveBeenCalledWith({ data: { english_day_v1: expect.objectContaining({ day: 'day-1', length: 15 }) } });
		expect(await actions.save(fixture('en', {}, { ...startSession(15), answer: 'private' }).event())).toMatchObject({ status: 400 });
		expect(await actions.save(fixture('en', {}, 'not json').event())).toMatchObject({ status: 400 });
		const clear = fixture('en', {}, ''); await actions.save(clear.event());
		expect(clear.supabase.auth.updateUser).toHaveBeenCalledWith({ data: { english_day_v1: null } });
	});
	it('counts a finished session once towards progress', async () => {
		const done = { ...startSession(15), stage: 'done', done: ['listen-act'], scores: { 'listen-act': { correct: 9, total: 10 } }, completedAt: new Date().toISOString() };
		const first = fixture('en', {}, done);
		await actions.save(first.event());
		expect(first.supabase.auth.updateUser).toHaveBeenCalledWith({ data: { english_day_v1: expect.objectContaining({ stage: 'done' }), english_progress_v1: expect.objectContaining({ sessionsCompleted: 1, lastResult: 'strong' }) } });
		const again = fixture('en', { english_day_v1: done }, done);
		await actions.save(again.event());
		expect(again.supabase.auth.updateUser).toHaveBeenCalledWith({ data: { english_day_v1: expect.anything() } });
		const midway = fixture('en', {}, startSession(15));
		await actions.save(midway.event());
		expect(midway.supabase.auth.updateUser).toHaveBeenCalledWith({ data: { english_day_v1: expect.anything() } });
	});
	it('picks the day: the one after the last finished; Day 2 only for the owner until it is ready', async () => {
		const progress = { sessionsCompleted: 1, lastCompletedAt: '2026-10-01T10:00:00.000Z', lastThemeId: 'day-1', lastResult: 'ok', recent: [] };
		expect(await load(fixture('en').event())).toMatchObject({ nextDayId: 'day-1' });
		expect(await load(fixture('en', { english_progress_v1: progress }).event())).toMatchObject({ nextDayId: 'day-1' });
		expect(await load(fixture('en', { english_progress_v1: progress }, undefined, true).event())).toMatchObject({ nextDayId: 'day-2' });
		// ?day= works for the owner only, and sets aside a session on another day.
		expect(await load(fixture('en', { english_day_v1: startSession(15) }, undefined, true, '?day=day-2').event())).toMatchObject({ nextDayId: 'day-2', session: null });
		expect(await load(fixture('en', {}, undefined, false, '?day=day-2').event())).toMatchObject({ nextDayId: 'day-1' });
	});
	it('saves a session on a day that is not ready only for the owner', async () => {
		const dayTwo = startSession(15, new Date(), DAY_TWO);
		expect(await actions.save(fixture('en', {}, dayTwo).event())).toMatchObject({ status: 400 });
		expect(await actions.save(fixture('en', {}, dayTwo, true).event())).toEqual({ saved: true });
	});
});
