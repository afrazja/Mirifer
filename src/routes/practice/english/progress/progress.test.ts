import { describe, it, expect, vi } from 'vitest';
// These tests cover the daily lessons, now the rollback mode: only the test accounts get the step path.
vi.mock('$lib/server/step-path', async original => {
	const real = await original<typeof import('$lib/server/step-path')>();
	const { canResetEnglish } = await import('$lib/server/test-accounts');
	return { ...real, usesStepPath: (user: Parameters<typeof real.usesStepPath>[0]) => canResetEnglish(user) };
});
import { load } from './+page.server';
import { load as loadFinished } from '../finished/+page.server';
import { DAY_TWO, sessionModules, startSession } from '$lib/practice/day';

function locals(meta: Record<string, unknown> | null, rows: unknown[] = [], readError: unknown = null) {
	const query: any = { select: () => query, eq: vi.fn(() => query), in: () => query, order: () => query, limit: vi.fn().mockResolvedValue({ data: rows, error: readError }) };
	const user = meta ? { id: 'u1', user_metadata: meta } : null;
	return { supabase: { auth: { getUser: async () => ({ data: { user }, error: null }) }, from: vi.fn(() => query) }, query };
}
const profile = { reason: 'travel', comfort: 'simple', minutes: 15, skipped: false, completedAt: '2026-10-01T10:00:00.000Z' };
const english = (extra: Record<string, unknown> = {}) => ({ target_language: 'en', english_profile_v1: profile, ...extra });
const progress = { sessionsCompleted: 2, lastCompletedAt: null, lastThemeId: 'day-2', lastResult: 'ok', recent: [], finishedDays: ['day-1', 'day-2'] };

describe('The learner’s dashboard', () => {
	it('shows the lessons finished and the days a lesson was finished: only the learner’s own', async () => {
		const l = locals(english({ english_progress_v1: progress }), [
			{ event_name: 'lesson_completed', occurred_at: '2026-10-20T08:20:00Z', metadata: { done: 4 } },
			{ event_name: 'lesson_completed', occurred_at: '2026-10-21T08:20:00Z', metadata: { done: 3 } }
		]);
		const data = await load({ locals: l } as any) as any;
		expect(data).toEqual({ name: '', finished: 2, lesson: { id: 'day-3', number: 3, theme: expect.any(Object) }, caughtUp: false, lastDoneAt: null, dates: ['2026-10-20', '2026-10-21'], eventsLoaded: true, inProgress: false, resume: null });
		expect(l.query.eq).toHaveBeenCalledWith('user_id', 'u1');
		expect(l.query.eq).toHaveBeenCalledWith('event_name', 'lesson_completed');
		expect(l.query.eq).toHaveBeenCalledWith('metadata->>course', 'en');
	});
	it('names the lesson the button opens: the one under way, the next one, or the last when caught up', async () => {
		const busy = await load({ locals: locals(english({ english_progress_v1: progress, english_day_v1: startSession(15, new Date(), DAY_TWO) })) } as any) as any;
		expect(busy).toMatchObject({ inProgress: true, lesson: { id: 'day-2', number: 2 }, caughtUp: false, resume: { step: 1, recap: false } });
		expect(busy.resume.steps).toBeGreaterThan(1);
		expect(busy.resume.title.en).toBeTruthy();
		// Paused after two steps: Resume picks up at the third.
		const paused = startSession(15, new Date(), DAY_TWO);
		const [first, second] = sessionModules(paused);
		const later = await load({ locals: locals(english({ english_progress_v1: progress, english_day_v1: { ...paused, done: [first.id], skipped: [second.id] } })) } as any) as any;
		expect(later.resume).toMatchObject({ step: 3, recap: false });
		const atRecap = await load({ locals: locals(english({ english_progress_v1: progress, english_day_v1: { ...paused, stage: 'recap', done: sessionModules(paused).map(m => m.id) } })) } as any) as any;
		expect(atRecap.resume).toMatchObject({ recap: true, title: null });
		const done = { ...startSession(15, new Date(), DAY_TWO), stage: 'done', completedAt: '2026-10-02T10:00:00.000Z' };
		expect(await load({ locals: locals(english({ english_progress_v1: progress, english_day_v1: done })) } as any)).toMatchObject({ inProgress: false, lesson: { id: 'day-3' }, lastDoneAt: '2026-10-02T10:00:00.000Z' });
		expect(await load({ locals: locals(english()) } as any)).toMatchObject({ lesson: { id: 'day-1', number: 1 }, caughtUp: false });
		// Day 4 isn't released yet: after Day 3 the learner is caught up, and the lesson shown is Day 3.
		const three = { ...progress, lastThemeId: 'day-3', finishedDays: ['day-1', 'day-2', 'day-3'] };
		expect(await load({ locals: locals(english({ english_progress_v1: three })) } as any)).toMatchObject({ lesson: { id: 'day-3' }, caughtUp: true });
	});
	it('still opens when the events can’t be read', async () => {
		const data = await load({ locals: locals(english(), [], { message: 'down' }) } as any) as any;
		expect(data.eventsLoaded).toBe(false);
		expect(data.finished).toBe(0);
	});
	it('sends others to sign in, their own course, or onboarding first', async () => {
		await expect(load({ locals: locals(null) } as any)).rejects.toMatchObject({ status: 303, location: '/login' });
		await expect(load({ locals: locals({ target_language: 'de' }) } as any)).rejects.toMatchObject({ location: '/languages' });
		await expect(load({ locals: locals({ target_language: 'en' }) } as any)).rejects.toMatchObject({ location: '/practice/english/start' });
	});
});

describe('The lessons finished list', () => {
	it('lists only the finished lessons, and says when one is under way', async () => {
		const data = await loadFinished({ locals: locals(english({ english_progress_v1: progress })) } as any) as any;
		expect(data.finished.map((d: any) => d.id)).toEqual(['day-1', 'day-2']);
		expect(data.inProgress).toBe(false);
		// Nothing about the lessons ahead.
		expect(JSON.stringify(data)).not.toMatch(/day-3|day-4/);
		expect(data.underWay).toBeNull();
		const busy = await loadFinished({ locals: locals(english({ english_progress_v1: progress, english_day_v1: startSession(15, new Date(), DAY_TWO) })) } as any) as any;
		expect(busy).toMatchObject({ inProgress: true, underWay: 'day-2' });
	});
	it('sends others away', async () => {
		await expect(loadFinished({ locals: locals(null) } as any)).rejects.toMatchObject({ location: '/login' });
		await expect(loadFinished({ locals: locals({ target_language: 'en' }) } as any)).rejects.toMatchObject({ location: '/practice/english/start' });
	});
});

describe('The dashboard on the step path', () => {
	const tester = (meta: Record<string, unknown>, rows: unknown[] = []) => {
		const l = locals(meta, rows);
		const user = { id: 'u1', email: 'afraz.jva@gmail.com', email_confirmed_at: '2026-01-01T00:00:00Z', user_metadata: meta };
		l.supabase.auth.getUser = async () => ({ data: { user: user as any }, error: null });
		return { l, event: { locals: l, parent: async () => ({ labAccess: false }) } as any };
	};
	it('shows the next step, the steps done and the days with a step done', async () => {
		const { event } = tester(english({ english_progress_v1: progress }), [
			{ event_name: 'lesson_progress', occurred_at: '2026-10-25T08:20:00Z', metadata: { outcome: 'done' } },
			{ event_name: 'lesson_progress', occurred_at: '2026-10-26T08:20:00Z', metadata: { outcome: 'skipped' } },
			{ event_name: 'lesson_completed', occurred_at: '2026-10-20T08:20:00Z', metadata: { done: 4 } }
		]);
		const data = await load(event) as any;
		expect(data.dates).toEqual(['2026-10-20', '2026-10-25']);
		expect(data.path).toMatchObject({ stepsDone: 10, replay: false, underWay: false, step: { id: 'day-3:listen-act', chapter: 3, index: 0, total: 5 } });
	});
	it('says new practice is coming soon when every released step is done', async () => {
		const all = { ...progress, lastThemeId: 'everyday-2', finishedDays: ['day-1', 'day-2', 'day-3', 'everyday-1', 'everyday-2'] }; // incl. the pilot chapters
		const data = await load(tester(english({ english_progress_v1: all })).event) as any;
		expect(data.path).toMatchObject({ comingSoon: true, step: null, stepsDone: 25 });
	});
	it('the finished-lessons list leads to the path', async () => {
		const { l } = tester(english());
		await expect(loadFinished({ locals: l, url: new URL('https://m.test/practice/english/finished') } as any)).rejects.toMatchObject({ location: '/practice/english/path' });
	});
});
