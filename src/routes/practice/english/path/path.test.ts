import { describe, it, expect } from 'vitest';
import { load } from './+page.server';
import { EMPTY_PROGRESS } from '$lib/practice/english-progress';

const profile = { reason: 'travel', comfort: 'simple', minutes: 15, skipped: false, completedAt: '2026-10-01T10:00:00.000Z' };
function event(meta: Record<string, unknown>, email = 'afraz.jva@gmail.com') {
	const user = { id: 'u1', email, email_confirmed_at: '2026-01-01T00:00:00Z', user_metadata: { target_language: 'en', english_profile_v1: profile, ...meta } };
	return { locals: { supabase: { auth: { getUser: async () => ({ data: { user }, error: null }) } } }, parent: async () => ({ labAccess: false }) } as any;
}

describe('Your path', () => {
	it('shows the chapters reached, with done, skipped, next and locked steps', async () => {
		const data = await load(event({
			english_progress_v1: { ...EMPTY_PROGRESS, lastThemeId: 'day-1', finishedDays: ['day-1'] },
			english_path_v1: { done: { 'day-2:listen-act': ['i', 3] }, skipped: ['day-2:phrases'], current: null }
		})) as any;
		// The test accounts see the topic steps (a pilot): a Quick chat after each chapter, not numbered.
		expect(data.chapters.map((c: any) => c.id)).toEqual(['day-1', 'topic-food', 'day-2']);
		expect(data.chapters.map((c: any) => [c.number, c.topic])).toEqual([[1, false], [0, true], [2, false]]);
		expect(data.chapters[0].finished).toBe(true);
		expect(data.chapters[1].steps.map((s: any) => s.state)).toEqual(['next']);
		expect(data.chapters[2].steps.map((s: any) => s.state)).toEqual(['done', 'skipped', 'locked', 'locked', 'locked']);
	});
	it('shows a new learner Chapter 1 only, and and every learner has it', async () => {
		const data = await load(event({})) as any;
		expect(data.chapters).toHaveLength(1);
		expect(data.chapters[0].steps[0].state).toBe('next');
		// Every learner has the path now.
		expect((await load(event({}, 'someone@m.test')) as any).chapters[0].steps[0].state).toBe('next');
	});
});
