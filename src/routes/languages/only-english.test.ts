import { describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';
import { onlyOpenCourse } from '$lib/courses';

vi.mock('$lib/server/my-languages', () => ({ myLanguages: vi.fn().mockResolvedValue([]), learningList: (value: unknown) => (Array.isArray(value) ? value : []) }));

function event(meta: Record<string, unknown>, saveError: unknown = null) {
	const user = { id: 'u1', user_metadata: meta };
	const supabase = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }), updateUser: vi.fn().mockResolvedValue({ error: saveError }) } };
	return { supabase, event: { locals: { session: { user }, user, supabase } } as any };
}

describe('while English is the only course open, the language list steps aside', () => {
	it('knows English is the only open course', () => {
		expect(onlyOpenCourse()).toBe('en');
	});
	it('sends an English learner straight in, saving nothing', async () => {
		const f = event({ target_language: 'en' });
		await expect(load(f.event)).rejects.toMatchObject({ status: 303, location: '/practice/english/home' });
		expect(f.supabase.auth.updateUser).not.toHaveBeenCalled();
	});
	it('saves English for a new account (or a paused German one) first, keeping what they learn', async () => {
		const fresh = event({});
		await expect(load(fresh.event)).rejects.toMatchObject({ location: '/practice/english/home' });
		expect(fresh.supabase.auth.updateUser).toHaveBeenCalledWith({ data: { target_language: 'en', learning: ['en'] } });
		const german = event({ target_language: 'de', learning: ['de'] });
		await expect(load(german.event)).rejects.toMatchObject({ location: '/practice/english/home' });
		expect(german.supabase.auth.updateUser).toHaveBeenCalledWith({ data: { target_language: 'en', learning: ['de', 'en'] } });
	});
	it('shows the list as before if saving the course fails (never a redirect loop)', async () => {
		const f = event({}, { message: 'down' });
		const data = await load(f.event) as any;
		expect(data.languages).toEqual([]);
	});
});
