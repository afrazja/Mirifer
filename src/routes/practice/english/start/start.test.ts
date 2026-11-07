import { describe, it, expect, vi } from 'vitest';
import { load, actions } from './+page.server';

const PROFILE = { reason: 'work', comfort: 'hard', minutes: 15, skipped: false, completedAt: '2026-10-01T10:00:00.000Z' };
function fixture(meta: Record<string, unknown> = {}, answers?: unknown, url = 'https://mirifer.test/practice/english/start', name?: string, work?: unknown) {
	const user = { id: 'u1', user_metadata: { target_language: 'en', display_name: 'Sam', ...meta } };
	const upsert = vi.fn().mockResolvedValue({ error: null });
	const supabase = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }), updateUser: vi.fn().mockResolvedValue({ error: null }) }, from: vi.fn(() => ({ upsert })), upsert };
	const body = new FormData(); if (answers !== undefined) body.set('answers', typeof answers === 'string' ? answers : JSON.stringify(answers));
	if (name !== undefined) body.set('name', name);
	if (work !== undefined) body.set('work', typeof work === 'string' ? work : JSON.stringify(work));
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
		expect(f.supabase.auth.updateUser).toHaveBeenCalledWith({ data: { english_profile_v1: { reason: 'exam', comfort: 'natural', minutes: 20, skipped: false, completedAt: expect.any(String) }, english_work_v1: null } });
	});
	it('saves a skip as defaults', async () => {
		const f = fixture({}, { reason: null, comfort: null, minutes: 15, skipped: true });
		expect(await actions.save(f.event())).toMatchObject({ profile: { skipped: true, minutes: 15 } });
	});
	it('prefills the name sign-up gave us, ours first, then Google’s', async () => {
		expect(await load(fixture({ display_name: undefined, full_name: 'Sara Ahmadi ' }).event())).toMatchObject({ name: 'Sara Ahmadi' });
		expect(await load(fixture({ display_name: undefined }).event())).toMatchObject({ name: '' });
	});
	it('saves the name with the answers, and on the profile row', async () => {
		const f = fixture({}, { reason: 'unsure', comfort: 'simple', minutes: 15, skipped: false }, undefined, '  Ali ');
		expect(await actions.save(f.event())).toMatchObject({ profile: { reason: 'unsure' } });
		expect(f.supabase.auth.updateUser).toHaveBeenCalledWith({ data: { english_profile_v1: expect.objectContaining({ reason: 'unsure' }), english_work_v1: null, display_name: 'Ali' } });
		expect(f.supabase.upsert).toHaveBeenCalledWith({ id: 'u1', display_name: 'Ali' }, { onConflict: 'id' });
	});
	it('saves where the level came from', async () => {
		const f = fixture({}, { reason: 'travel', comfort: 'natural', minutes: 15, skipped: false, levelSource: 'check' });
		expect(await actions.save(f.event())).toMatchObject({ profile: { comfort: 'natural', levelSource: 'check' } });
		expect(await actions.save(fixture({}, { reason: 'travel', comfort: null, minutes: 15, skipped: false, levelSource: 'skipped' }).event())).toMatchObject({ profile: { comfort: null, levelSource: 'skipped' } });
		expect(await actions.save(fixture({}, { reason: 'travel', comfort: null, minutes: 15, skipped: false, levelSource: 'guess' }).event())).toMatchObject({ status: 400 });
	});
	it('rejects an empty or long name when one is sent', async () => {
		const answers = { reason: 'travel', comfort: 'simple', minutes: 15, skipped: false };
		expect(await actions.save(fixture({}, answers, undefined, '   ').event())).toMatchObject({ status: 400 });
		expect(await actions.save(fixture({}, answers, undefined, 'x'.repeat(41)).event())).toMatchObject({ status: 400 });
	});
	it('saves the work goal’s field and career stage apart, and clears them for another goal', async () => {
		const answers = { reason: 'work', comfort: 'simple', minutes: 15, skipped: false };
		const f = fixture({}, answers, undefined, undefined, { field: 'healthcare', seniority: null });
		await actions.save(f.event());
		expect(f.supabase.auth.updateUser).toHaveBeenCalledWith({ data: { english_profile_v1: expect.objectContaining({ reason: 'work' }), english_work_v1: { field: 'healthcare', seniority: null, updatedAt: expect.any(String) } } });
		// The main profile never gets the new keys (older code reads it with a strict schema).
		expect(f.supabase.auth.updateUser.mock.calls[0][0].data.english_profile_v1).not.toHaveProperty('field');
		expect(await actions.save(fixture({}, answers, undefined, undefined, { field: 'astronaut', seniority: null }).event())).toMatchObject({ status: 400 });
		expect(await actions.save(fixture({}, answers, undefined, undefined, { field: 'it', seniority: 'mid', note: 'x' }).event())).toMatchObject({ status: 400 });
		// Work answers sent with another goal are ignored, and any kept ones cleared.
		const other = fixture({ english_work_v1: { field: 'it', seniority: 'mid', updatedAt: '2026-11-01T10:00:00.000Z' } }, { ...answers, reason: 'travel' }, undefined, undefined, { field: 'it', seniority: 'mid' });
		await actions.save(other.event());
		expect(other.supabase.auth.updateUser.mock.calls[0][0].data.english_work_v1).toBeNull();
		// The edit page gets them back.
		expect(await load(fixture({ english_profile_v1: PROFILE, english_work_v1: { field: 'it', seniority: 'mid', updatedAt: '2026-11-01T10:00:00.000Z' } }, undefined, 'https://mirifer.test/practice/english/start?edit=1').event())).toMatchObject({ work: { field: 'it', seniority: 'mid' } });
	});
	it('rejects anything else', async () => {
		expect(await actions.save(fixture({}, { reason: 'exam', comfort: 'natural', minutes: 35, skipped: false }).event())).toMatchObject({ status: 400 });
		expect(await actions.save(fixture({}, { reason: 'exam', comfort: 'natural', minutes: 15, skipped: false, level: 'C2' }).event())).toMatchObject({ status: 400 });
		expect(await actions.save(fixture({}, 'nope').event())).toMatchObject({ status: 400 });
	});
});
