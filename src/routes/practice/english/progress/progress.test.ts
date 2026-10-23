import { describe, it, expect, vi } from 'vitest';
import { load } from './+page.server';
import { load as loadFinished } from '../finished/+page.server';
import { DAY_TWO, startSession } from '$lib/practice/day';

function locals(meta: Record<string, unknown> | null, rows: unknown[] = [], readError: unknown = null) {
	const query: any = { select: () => query, eq: vi.fn(() => query), in: () => query, order: () => query, limit: vi.fn().mockResolvedValue({ data: rows, error: readError }) };
	const user = meta ? { id: 'u1', user_metadata: meta } : null;
	return { supabase: { auth: { getUser: async () => ({ data: { user }, error: null }) }, from: vi.fn(() => query) }, query };
}
const profile = { reason: 'travel', comfort: 'simple', minutes: 15, skipped: false, completedAt: '2026-10-01T10:00:00.000Z' };
const english = (extra: Record<string, unknown> = {}) => ({ target_language: 'en', english_profile_v1: profile, ...extra });
const progress = { sessionsCompleted: 2, lastCompletedAt: null, lastThemeId: 'day-2', lastResult: 'ok', recent: [], finishedDays: ['day-1', 'day-2'] };

describe('The learner’s dashboard', () => {
	it('shows the lessons finished and the days practiced: only the learner’s own', async () => {
		const l = locals(english({ english_progress_v1: progress }), [
			{ event_name: 'lesson_started', occurred_at: '2026-10-20T08:00:00Z', metadata: {} },
			{ event_name: 'lesson_progress', occurred_at: '2026-10-21T08:05:00Z', metadata: { outcome: 'done' } }
		]);
		const data = await load({ locals: l } as any) as any;
		expect(data).toEqual({ finished: 2, dates: ['2026-10-20', '2026-10-21'], eventsLoaded: true, inProgress: false });
		expect(l.query.eq).toHaveBeenCalledWith('user_id', 'u1');
	});
	it('says Continue while a lesson is under way', async () => {
		const data = await load({ locals: locals(english({ english_day_v1: startSession(15) })) } as any) as any;
		expect(data.inProgress).toBe(true);
		const done = { ...startSession(15), stage: 'done', completedAt: '2026-10-02T10:00:00.000Z' };
		expect((await load({ locals: locals(english({ english_day_v1: done })) } as any) as any).inProgress).toBe(false);
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
		const busy = await loadFinished({ locals: locals(english({ english_progress_v1: progress, english_day_v1: startSession(15, new Date(), DAY_TWO) })) } as any) as any;
		expect(busy.inProgress).toBe(true);
	});
	it('sends others away', async () => {
		await expect(loadFinished({ locals: locals(null) } as any)).rejects.toMatchObject({ location: '/login' });
		await expect(loadFinished({ locals: locals({ target_language: 'en' }) } as any)).rejects.toMatchObject({ location: '/practice/english/start' });
	});
});
