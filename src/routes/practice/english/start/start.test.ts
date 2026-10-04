import { describe, it, expect, vi } from 'vitest';
import { load, actions } from './+page.server';

const PROFILE = { reason: 'work', comfort: 'hard', minutes: 15, skipped: false, completedAt: '2026-10-01T10:00:00.000Z' };
function fixture(meta: Record<string, unknown> = {}, answers?: unknown, url = 'https://mirifer.test/practice/english/start') {
	const user = { id: 'u1', user_metadata: { target_language: 'en', display_name: 'Sam', ...meta } };
	const supabase = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }), updateUser: vi.fn().mockResolvedValue({ error: null }) } };
	const body = new FormData(); if (answers !== undefined) body.set('answers', typeof answers === 'string' ? answers : JSON.stringify(answers));
	return { supabase, event: () => ({ locals: { supabase }, url: new URL(url), request: new Request(url + '?/save', { method: 'POST', body }) }) as any };
}

describe('English onboarding', () => {
	it('shows to a learner without a profile, and skips to Today once answered', async () => {
		expect(await load(fixture().event())).toMatchObject({ name: 'Sam', profile: null });
		await expect(load(fixture({ english_profile_v1: PROFILE }).event())).rejects.toMatchObject({ location: '/practice/english/today' });
		expect(await load(fixture({ english_profile_v1: PROFILE }, undefined, 'https://mirifer.test/practice/english/start?edit=1').event())).toMatchObject({ profile: PROFILE });
	});
	it('needs a signed-in English learner', async () => {
		const f = fixture(); f.supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
		await expect(load(f.event())).rejects.toMatchObject({ location: '/login' });
		await expect(load(fixture({ target_language: 'de' }).event())).rejects.toMatchObject({ location: '/languages' });
	});
	it('saves only the three answers and a time', async () => {
		const f = fixture({}, { reason: 'exam', comfort: 'natural', minutes: 20, skipped: false });
		expect(await actions.save(f.event())).toMatchObject({ profile: { reason: 'exam', minutes: 20 } });
		expect(f.supabase.auth.updateUser).toHaveBeenCalledWith({ data: { english_profile_v1: { reason: 'exam', comfort: 'natural', minutes: 20, skipped: false, completedAt: expect.any(String) } } });
	});
	it('saves a skip as defaults', async () => {
		const f = fixture({}, { reason: null, comfort: null, minutes: 15, skipped: true });
		expect(await actions.save(f.event())).toMatchObject({ profile: { skipped: true, minutes: 15 } });
	});
	it('rejects anything else', async () => {
		expect(await actions.save(fixture({}, { reason: 'exam', comfort: 'natural', minutes: 35, skipped: false }).event())).toMatchObject({ status: 400 });
		expect(await actions.save(fixture({}, { reason: 'exam', comfort: 'natural', minutes: 15, skipped: false, level: 'C2' }).event())).toMatchObject({ status: 400 });
		expect(await actions.save(fixture({}, 'nope').event())).toMatchObject({ status: 400 });
	});
});
