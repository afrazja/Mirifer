import { describe, it, expect, vi } from 'vitest';
import { load } from './+page.server';

function locals(meta: Record<string, unknown> | null, rows: unknown[] = [], readError: unknown = null) {
	const query: any = { select: () => query, eq: vi.fn(() => query), in: () => query, order: () => query, limit: vi.fn().mockResolvedValue({ data: rows, error: readError }) };
	const user = meta ? { id: 'u1', user_metadata: meta } : null;
	return { supabase: { auth: { getUser: async () => ({ data: { user }, error: null }) }, from: vi.fn(() => query) }, query };
}
const english = (extra: Record<string, unknown> = {}) => ({ target_language: 'en', ...extra });
const progress = { sessionsCompleted: 2, lastCompletedAt: null, lastThemeId: 'day-2', lastResult: 'ok', recent: [{ listening: { correct: 4, total: 5 }, speaking: { correct: 3, total: 4 } }], finishedDays: ['day-1', 'day-2'] };

describe('Your progress', () => {
	it('shows the lessons finished, steps done, days practised and recent answers: only the learner’s own', async () => {
		const l = locals(english({ english_progress_v1: progress }), [
			{ event_name: 'lesson_started', occurred_at: '2026-10-20T08:00:00Z', metadata: {} },
			{ event_name: 'lesson_progress', occurred_at: '2026-10-20T08:05:00Z', metadata: { outcome: 'done' } },
			{ event_name: 'lesson_progress', occurred_at: '2026-10-21T08:05:00Z', metadata: { outcome: 'done' } }
		]);
		const data = await load({ locals: l } as any) as any;
		expect(data.finished.map((d: any) => d.number)).toEqual([1, 2]);
		expect(data.steps).toBe(2);
		expect(data.dates).toEqual(['2026-10-20', '2026-10-21']);
		expect(data.listening).toEqual({ correct: 4, total: 5 });
		expect(data.speaking).toEqual({ correct: 3, total: 4 });
		expect(l.query.eq).toHaveBeenCalledWith('user_id', 'u1');
		// Nothing about the lessons ahead.
		expect(JSON.stringify(data)).not.toMatch(/total_days|ahead|day-3/);
	});
	it('still opens when the events can’t be read', async () => {
		const data = await load({ locals: locals(english(), [], { message: 'down' }) } as any) as any;
		expect(data.eventsLoaded).toBe(false);
		expect(data.finished).toEqual([]);
	});
	it('sends others to sign in or to their own course', async () => {
		await expect(load({ locals: locals(null) } as any)).rejects.toMatchObject({ status: 303, location: '/login' });
		await expect(load({ locals: locals({ target_language: 'de' }) } as any)).rejects.toMatchObject({ location: '/languages' });
	});
});
