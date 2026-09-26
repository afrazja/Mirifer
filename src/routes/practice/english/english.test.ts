import { describe, it, expect, vi, beforeEach } from 'vitest';

const { env } = vi.hoisted(() => ({ env: {} as Record<string, string | undefined> }));
vi.mock('$env/dynamic/private', () => ({ env }));

import { load, actions } from './+page.server';
import { signGoals } from '$lib/server/jamie-line';
import { GOAL_IDS } from '$lib/practice/hotel';

beforeEach(() => { for (const key of Object.keys(env)) delete env[key]; env.OPENAI_API_KEY = 'k'; });

function fixture(target = 'en', result?: unknown) {
	const user = { id: 'learner-1', user_metadata: { target_language: target, display_name: 'Learner', exam_settings: { goal: 'planned' } } };
	const supabase = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }), updateUser: vi.fn().mockResolvedValue({ error: null }) }, from: vi.fn() };
	const body = new FormData();
	body.set('result', typeof result === 'string' ? result : JSON.stringify(result ?? { variant: 'lift', goals: GOAL_IDS, proof: signGoals('learner-1', 'lift', GOAL_IDS), turns: 7, averageWords: 9.14 }));
	return { supabase, body, event: () => ({ locals: { supabase }, request: new Request('https://mirifer.test/practice/english?/complete', { method: 'POST', body }) }) as any };
}
describe('English pilot persistence', () => {
	it('requires a verified account and the English course', async () => {
		const f = fixture(); f.supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
		await expect(load(f.event())).rejects.toMatchObject({ location: '/login' });
		expect(await actions.complete(f.event())).toMatchObject({ status: 401 });
		await expect(load(fixture('de').event())).rejects.toMatchObject({ location: '/languages' });
		expect(await actions.complete(fixture('de').event())).toMatchObject({ status: 409 });
	});
	it('writes only a bounded English completion record, without German progress or learner text', async () => {
		const f = fixture(); expect(await actions.complete(f.event())).toMatchObject({ completed: { variant: 'lift', turns: 7, averageWords: 9.1 } });
		expect(f.supabase.auth.updateUser).toHaveBeenCalledExactlyOnceWith({ data: { english_hotel_v1: { variant: 'lift', turns: 7, averageWords: 9.1, completedAt: expect.any(String) } } });
		expect(f.supabase.from).not.toHaveBeenCalled();
	});
	it('requires a server proof of every goal', async () => {
		const partial = ['problem', 'solution', 'cost'] as const;
		for (const result of [
			'not json',
			{ variant: 'lift', goals: GOAL_IDS, proof: 'forged', turns: 7, averageWords: 9 },
			{ variant: 'lift', goals: partial, proof: signGoals('learner-1', 'lift', [...partial]), turns: 7, averageWords: 9 },
			{ variant: 'street', goals: GOAL_IDS, proof: signGoals('learner-1', 'lift', GOAL_IDS), turns: 7, averageWords: 9 },
			{ variant: 'lift', goals: GOAL_IDS, proof: signGoals('someone-else', 'lift', GOAL_IDS), turns: 7, averageWords: 9 }
		]) {
			const f = fixture('en', result);
			expect(await actions.complete(f.event())).toMatchObject({ status: 400 });
			expect(f.supabase.auth.updateUser).not.toHaveBeenCalled();
		}
	});
	it('still reads completions saved by the earlier guided version', async () => {
		const f = fixture();
		(await f.supabase.auth.getUser()).data.user.user_metadata.english_hotel_v1 = { completedAt: '2026-09-20T10:00:00.000Z', variant: 'lift', hints: 2 };
		expect(await load(f.event())).toMatchObject({ completed: { variant: 'lift', hints: 2 } });
	});
	it('reports save failures so completion can be retried', async () => {
		const f = fixture(); f.supabase.auth.updateUser.mockResolvedValue({ error: { message: 'offline' } });
		expect(await actions.complete(f.event())).toMatchObject({ status: 503 });
		f.supabase.auth.updateUser.mockRejectedValue(new Error('network'));
		expect(await actions.complete(f.event())).toMatchObject({ status: 503 });
	});
});
