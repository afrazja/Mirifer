import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actions, load } from './+page.server';
import { load as onboarding } from '../onboarding/+page.server';
import { load as home } from '../home/+page.server';
import { needsCourse, courseRedirect } from '$lib/courses';

vi.mock('$lib/server/assessments', () => ({ ownAssessments: vi.fn().mockResolvedValue([]) }));

function fixture(target?: string) {
	const user = { id: 'learner-1', user_metadata: { target_language: target, display_name: 'Learner', onboarding: { reason: 'travel' } } };
	const supabase = { auth: {
		getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }),
		updateUser: vi.fn().mockResolvedValue({ error: null })
	} };
	const form = new FormData();
	form.set('language', 'de');
	return { user, supabase, form, event: () => ({
		locals: { session: { user }, user, supabase },
		url: new URL('https://mirifer.test/languages'),
		request: new Request('https://mirifer.test/languages', { method: 'POST', body: form })
	}) as any };
}

beforeEach(() => vi.clearAllMocks());

describe('course entry and persistence', () => {
	it('requires sign-in to view or save a choice', async () => {
		const f = fixture();
		await expect(load({ locals: {} } as any)).rejects.toMatchObject({ status: 303, location: '/login' });
		f.supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null } as any);
		await expect(actions.default(f.event())).rejects.toMatchObject({ location: '/login' });
		expect(f.supabase.auth.updateUser).not.toHaveBeenCalled();
	});
	it('rejects upcoming and unknown courses even when a form is submitted directly', async () => {
		for (const language of ['fr', 'xx', '']) {
			const f = fixture('de'); f.form.set('language', language);
			expect(await actions.default(f.event())).toMatchObject({ status: 400, data: { error: 'unavailable' } });
			expect(f.supabase.auth.updateUser).not.toHaveBeenCalled();
		}
	});
	it('takes a new learner to setup without prematurely saving a completed course choice', async () => {
		const f = fixture();
		await expect(actions.default(f.event())).rejects.toMatchObject({ location: '/onboarding?language=de' });
		expect(f.supabase.auth.updateUser).not.toHaveBeenCalled();
		const event = f.event(); event.url = new URL('https://mirifer.test/onboarding?language=de');
		expect(await onboarding(event)).toEqual({ targetLanguage: 'de' });
	});
	it('lets an existing German learner continue without writing or resetting anything', async () => {
		const f = fixture('de');
		await expect(actions.default(f.event())).rejects.toMatchObject({ location: '/home' });
		expect(f.supabase.auth.updateUser).not.toHaveBeenCalled();
	});
	it.each(['fr'])('repairs an unavailable %s selection by updating only the course preference', async (course) => {
		const f = fixture(course);
		await expect(actions.default(f.event())).rejects.toMatchObject({ location: '/home' });
		expect(f.supabase.auth.updateUser).toHaveBeenCalledExactlyOnceWith({ data: { target_language: 'de', learning: ['de'] } });
	});
	it('keeps the learner on the chooser when a save fails', async () => {
		const f = fixture('fr');
		f.supabase.auth.updateUser.mockResolvedValue({ error: { message: 'unavailable' } } as any);
		expect(await actions.default(f.event())).toMatchObject({ status: 503, data: { error: 'save_failed' } });
		f.supabase.auth.updateUser.mockRejectedValue(new Error('offline'));
		expect(await actions.default(f.event())).toMatchObject({ status: 503 });
	});
	it('routes missing or unavailable course choices to the chooser without opening German content', async () => {
		for (const target of [undefined, 'fr', 'unknown']) {
			const f = fixture(target);
			await expect(home(f.event())).rejects.toMatchObject({ location: '/languages' });
			await expect(onboarding(f.event())).rejects.toMatchObject({ location: '/languages' });
		}
		const f = fixture(); const event = f.event(); event.url.searchParams.set('language', 'fr');
		await expect(onboarding(event)).rejects.toMatchObject({ location: '/languages' });
	});
	it('starts the English pilot without German onboarding or shared progress writes', async () => {
		for (const target of [undefined, 'de']) {
			const f = fixture(target); f.form.set('language', 'en');
			await expect(actions.default(f.event())).rejects.toMatchObject({ location: '/practice/english/home' });
			expect(f.supabase.auth.updateUser).toHaveBeenCalledExactlyOnceWith({ data: { target_language: 'en', learning: target ? [target, 'en'] : ['en'] } });
		}
		await expect(home(fixture('en').event())).rejects.toMatchObject({ location: '/practice/english/today' });
	});
	it('isolates English and German learning routes while keeping account and landing pages accessible', () => {
		for (const path of ['/home', '/lesson', '/lessons', '/review/quiz', '/basics', '/drill/sprechen', '/check-in', '/vocabulary']) expect(courseRedirect(path, 'en')).toBe('/practice/english/today');
		for (const path of ['/', '/fa', '/languages', '/settings', '/admin', '/api/analytics', '/practice/english']) expect(courseRedirect(path, 'en')).toBeNull();
		expect(courseRedirect('/practice/english', 'de')).toBe('/languages');
		expect(courseRedirect('/practice/english', undefined)).toBe('/languages');
		expect(courseRedirect('/lesson', 'de')).toBeNull();
	});
	it('protects course deep links while leaving the landing page and account pages alone', () => {
		for (const path of ['/lesson', '/lesson/', '/lessons', '/review/quiz', '/drill/sprechen', '/check-in', '/vocabulary']) expect(needsCourse(path)).toBe(true);
		for (const path of ['/', '/fa', '/try', '/languages', '/onboarding', '/settings', '/admin', '/api/analytics', '/review-other']) expect(needsCourse(path)).toBe(false);
	});
	it('sends an English learner adding German through German setup, then keeps both languages', async () => {
		const f = fixture('en'); delete (f.user.user_metadata as any).onboarding;
		await expect(actions.default(f.event())).rejects.toMatchObject({ location: '/onboarding?language=de' });
		expect(f.supabase.auth.updateUser).not.toHaveBeenCalled();
		const event = f.event(); event.url = new URL('https://mirifer.test/onboarding?language=de');
		expect(await onboarding(event)).toEqual({ targetLanguage: 'de' });
		const back = fixture('de'); (back.user.user_metadata as any).learning = ['en', 'de']; back.form.set('language', 'en');
		await expect(actions.default(back.event())).rejects.toMatchObject({ location: '/practice/english/home' });
		expect(back.supabase.auth.updateUser).toHaveBeenCalledExactlyOnceWith({ data: { target_language: 'en', learning: ['de', 'en'] } });
	});
});
