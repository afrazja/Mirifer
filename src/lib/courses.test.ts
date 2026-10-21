import { describe, it, expect, vi } from 'vitest';
import { COURSES, courseRedirect, getCourse, isAvailableCourse } from './courses';
import { actions } from '../routes/languages/+page.server';

describe('German is paused (owner’s decision)', () => {
	it('is listed as coming soon; English is open', () => {
		expect(getCourse('de')?.available).toBe(false);
		expect(isAvailableCourse('de')).toBe(false);
		expect(isAvailableCourse('en')).toBe(true);
		expect(COURSES.map(course => course.code)).toContain('de');
	});
	it('sends a German learner from German lessons to the language list, and keeps English learners on English', () => {
		for (const path of ['/home', '/lesson', '/lessons', '/review', '/vocabulary', '/drill/sprechen', '/check-in']) expect(courseRedirect(path, 'de'), path).toBe('/languages');
		expect(courseRedirect('/practice/english/today', 'en')).toBeNull();
		expect(courseRedirect('/lesson', 'en')).toBe('/practice/english/today');
	});
	it('can’t be started or continued from the language list', async () => {
		const user = { id: 'u1', user_metadata: { target_language: 'de' } };
		const updateUser = vi.fn();
		const body = new FormData(); body.set('language', 'de');
		const event = { request: new Request('https://m.test/languages', { method: 'POST', body }), locals: { supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }), updateUser } } } } as any;
		expect(await actions.default(event)).toMatchObject({ status: 400, data: { error: 'unavailable' } });
		expect(updateUser).not.toHaveBeenCalled();
	});
});
