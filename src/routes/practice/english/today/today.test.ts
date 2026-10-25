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
	it('picks the day: the one after the last finished; a day that isn’t ready is only for the owner', async () => {
		const progress = { sessionsCompleted: 1, lastCompletedAt: '2026-10-01T10:00:00.000Z', lastThemeId: 'day-1', lastResult: 'ok', recent: [] };
		expect(await load(fixture('en').event())).toMatchObject({ nextDayId: 'day-1' });
		// Day 2 is released: a learner who finished Day 1 gets it.
		expect(await load(fixture('en', { english_progress_v1: progress }).event())).toMatchObject({ nextDayId: 'day-2' });
		const two = DAY_TWO as { ready: boolean };
		two.ready = false;
		try {
			expect(await load(fixture('en', { english_progress_v1: progress }).event())).toMatchObject({ nextDayId: 'day-1' });
			expect(await load(fixture('en', { english_progress_v1: progress }, undefined, true).event())).toMatchObject({ nextDayId: 'day-2' });
			expect(await load(fixture('en', {}, undefined, false, '?day=day-2').event())).toMatchObject({ nextDayId: 'day-1', requestedDay: null });
		} finally { two.ready = true; }
		// ?day= works for the owner only, and sets aside a session on another day.
		expect(await load(fixture('en', { english_day_v1: startSession(15) }, undefined, true, '?day=day-2').event())).toMatchObject({ nextDayId: 'day-2', session: null });
		// A learner can't open a day they haven't finished: they get their own next day.
		expect(await load(fixture('en', {}, undefined, false, '?day=day-3').event())).toMatchObject({ nextDayId: 'day-1', requestedDay: null });
		expect(await load(fixture('en', {}, undefined, true, '?day=day-1').event())).toMatchObject({ nextDayId: 'day-1', requestedDay: 'day-1' });
	});
	it('lets a learner open a lesson they finished again, but never one ahead or over a lesson under way', async () => {
		const done = { sessionsCompleted: 2, lastCompletedAt: '2026-10-02T10:00:00.000Z', lastThemeId: 'day-2', lastResult: 'ok', recent: [], finishedDays: ['day-1', 'day-2'] };
		expect(await load(fixture('en', { english_progress_v1: done }, undefined, false, '?day=day-1').event())).toMatchObject({ nextDayId: 'day-1', requestedDay: 'day-1', caughtUp: false });
		expect(await load(fixture('en', { english_progress_v1: done }, undefined, false, '?day=day-4').event())).toMatchObject({ nextDayId: 'day-3', requestedDay: null });
		// A finished session (stage done) gives way; one under way stays, and the request is ignored.
		const finishedToday = { ...startSession(15, new Date(), DAY_TWO), stage: 'done', completedAt: '2026-10-02T10:00:00.000Z' };
		expect(await load(fixture('en', { english_progress_v1: done, english_day_v1: finishedToday }, undefined, false, '?day=day-1').event())).toMatchObject({ requestedDay: 'day-1', session: null });
		const underWay = startSession(15, new Date(), DAY_TWO);
		expect(await load(fixture('en', { english_progress_v1: done, english_day_v1: underWay }, undefined, false, '?day=day-1').event())).toMatchObject({ requestedDay: null, session: underWay });
		// After confirming on the finished list (replace=1), the earlier lesson opens; the one under way is set aside.
		expect(await load(fixture('en', { english_progress_v1: done, english_day_v1: underWay }, undefined, false, '?day=day-1&replace=1').event())).toMatchObject({ requestedDay: 'day-1', session: null });
		// Never a day ahead, even with replace.
		expect(await load(fixture('en', { english_progress_v1: done, english_day_v1: underWay }, undefined, false, '?day=day-4&replace=1').event())).toMatchObject({ requestedDay: null, session: underWay });
	});
	it('a Day 1 session saved before Day 1 had two versions carries on in the learner’s version', async () => {
		const { track: _dropped, ...legacy } = startSession(15);
		const loaded = await load(fixture('en', { english_day_v1: { ...legacy, done: ['listen-act'] } }).event()) as unknown as { session: { track?: string; done: string[] } };
		expect(loaded.session.track).toBe('intermediate');
		expect(loaded.session.done).toEqual(['listen-act']);
	});
	it('gives each learner their version of a day; the owner may pick either', async () => {
		// The fixture's onboarding answer is "simple": Intermediate.
		expect(await load(fixture('en').event())).toMatchObject({ track: 'intermediate' });
		expect(await load(fixture('en', { english_profile_v1: { reason: 'travel', comfort: 'natural', minutes: 20, skipped: false, completedAt: '2026-10-01T10:00:00.000Z' } }).event())).toMatchObject({ track: 'professional' });
		expect(await load(fixture('en', {}, undefined, false, '?day=day-2&track=professional').event())).toMatchObject({ track: 'intermediate', requestedDay: null });
		expect(await load(fixture('en', {}, undefined, true, '?day=day-2&track=professional').event())).toMatchObject({ track: 'professional', requestedDay: 'day-2' });
		expect(await load(fixture('en', {}, undefined, true, '?day=day-2&track=expert').event())).toMatchObject({ track: 'intermediate' });
		// A session on the other version is set aside, as one on another day is.
		const pro = startSession(15, new Date(), DAY_TWO, 'professional');
		expect(await load(fixture('en', { english_day_v1: pro }, undefined, true, '?day=day-2&track=intermediate').event())).toMatchObject({ session: null });
		expect(await load(fixture('en', { english_day_v1: pro }, undefined, true, '?day=day-2&track=professional').event())).toMatchObject({ session: pro });
	});
	it('counts a two-version day by its own modules', async () => {
		const pro = { ...startSession(15, new Date(), DAY_TWO, 'professional'), stage: 'done', done: ['choose-persuade'], scores: { 'choose-persuade': { correct: 4, total: 5 } }, completedAt: new Date().toISOString() };
		const f = fixture('en', {}, pro, true);
		await actions.save(f.event());
		expect(f.supabase.auth.updateUser).toHaveBeenCalledWith({ data: expect.objectContaining({ english_progress_v1: expect.objectContaining({ sessionsCompleted: 1, lastResult: 'strong' }) }) });
	});
	it('saves a session on a day that is not ready only for the owner', async () => {
		const dayTwo = startSession(15, new Date(), DAY_TWO);
		expect(await actions.save(fixture('en', {}, dayTwo).event())).toEqual({ saved: true });
		const two = DAY_TWO as { ready: boolean };
		two.ready = false;
		try {
			expect(await actions.save(fixture('en', {}, dayTwo).event())).toMatchObject({ status: 400 });
			expect(await actions.save(fixture('en', {}, dayTwo, true).event())).toEqual({ saved: true });
		} finally { two.ready = true; }
	});
	it('a day with a skipped step still counts as passed; only a day with every step skipped comes back', async () => {
		const base = { ...startSession(15), stage: 'done', completedAt: new Date().toISOString() };
		const full = fixture('en', {}, { ...base, done: ['listen-act', 'phrases'] });
		await actions.save(full.event());
		expect(full.supabase.auth.updateUser).toHaveBeenCalledWith({ data: expect.objectContaining({ english_progress_v1: expect.objectContaining({ lastThemeId: 'day-1' }) }) });
		const skipped = fixture('en', {}, { ...base, done: ['listen-act'], skipped: ['phrases'] });
		await actions.save(skipped.event());
		expect(skipped.supabase.auth.updateUser).toHaveBeenCalledWith({ data: expect.objectContaining({ english_progress_v1: expect.objectContaining({ sessionsCompleted: 1, lastThemeId: 'day-1' }) }) });
		const none = fixture('en', {}, { ...base, done: [], skipped: ['listen-act', 'phrases', 'say-it-better'] });
		await actions.save(none.event());
		expect(none.supabase.auth.updateUser).toHaveBeenCalledWith({ data: expect.objectContaining({ english_progress_v1: expect.objectContaining({ lastThemeId: null }) }) });
	});
});

describe('lesson analytics', () => {
	it('records a started lesson after the save, and a failed analytics write never fails the save', async () => {
		const f = fixture('en', {}, startSession(15, new Date(), DAY_TWO, 'intermediate'), true);
		const insert = vi.fn().mockResolvedValue({ error: null });
		(f.supabase as any).from = vi.fn(() => ({ insert }));
		expect(await actions.save(f.event())).toEqual({ saved: true });
		expect(insert).toHaveBeenCalledWith([expect.objectContaining({ user_id: 'u1', event_name: 'lesson_started', day: 2, metadata: expect.objectContaining({ course: 'en', track: 'intermediate' }) })]);
		const broken = fixture('en', {}, startSession(15));
		(broken.supabase as any).from = vi.fn(() => { throw new Error('down'); });
		expect(await actions.save(broken.event())).toEqual({ saved: true });
		// A save that fails writes no events.
		const failed = fixture('en', {}, startSession(15));
		failed.supabase.auth.updateUser.mockResolvedValue({ error: { message: 'x' } });
		const none = vi.fn(); (failed.supabase as any).from = vi.fn(() => ({ insert: none }));
		expect(await actions.save(failed.event())).toMatchObject({ status: 503 });
		expect(none).not.toHaveBeenCalled();
	});
});

