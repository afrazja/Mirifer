import { describe, it, expect, vi } from 'vitest';
import { load, actions } from './+page.server';
import { startSession } from '$lib/practice/day';

function fixture(target = 'en', meta: Record<string, unknown> = {}, session?: unknown) {
	const user = { id: 'u1', user_metadata: { target_language: target, display_name: 'Sam', ...meta } };
	const supabase = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }), updateUser: vi.fn().mockResolvedValue({ error: null }) } };
	const body = new FormData(); if (session !== undefined) body.set('session', typeof session === 'string' ? session : JSON.stringify(session));
	return { supabase, event: () => ({ locals: { supabase }, request: new Request('https://mirifer.test/practice/english/today?/save', { method: 'POST', body }) }) as any };
}

describe('English today page', () => {
	it('needs a signed-in English learner', async () => {
		const f = fixture(); f.supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
		await expect(load(f.event())).rejects.toMatchObject({ location: '/login' });
		await expect(load(fixture('de').event())).rejects.toMatchObject({ location: '/languages' });
		expect(await actions.save(fixture('de', {}, startSession(15)).event())).toMatchObject({ status: 409 });
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
});
