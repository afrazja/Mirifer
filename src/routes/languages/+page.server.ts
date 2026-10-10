import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { COURSES, getCourse, isAvailableCourse } from '$lib/courses';
import { learningList, myLanguages } from '$lib/server/my-languages';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.session || !locals.user) redirect(303, '/login');
	const { data: { user } } = await locals.supabase.auth.getUser();
	const languages = user ? await myLanguages(locals.supabase, user) : [];
	const started = new Set<string>(languages.map(language => language.code));
	return {
		currentLanguage: getCourse(locals.user.user_metadata?.target_language)?.code ?? null,
		languages,
		/** Everything not started yet, including courses that are coming soon. */
		more: COURSES.filter(course => !started.has(course.code)).map(course => course.code)
	};
};

/** English opens on its start page: the two parts for admins, straight to the daily lesson for everyone else. */
const courseHome = (language: string) => (language === 'en' ? '/practice/english/home' : '/home');

export const actions: Actions = {
	/** Continue a language, or start a new one. Nothing is ever reset. */
	default: async ({ request, locals }) => {
		// Verify the account before changing a preference; never trust a form user ID.
		const { data: { user }, error } = await locals.supabase.auth.getUser();
		if (error || !user) redirect(303, '/login');
		const language = (await request.formData()).get('language');
		if (!isAvailableCourse(language)) return fail(400, { error: 'unavailable' });
		const meta = user.user_metadata ?? {};

		// German learners set their exam goal first: brand-new learners, and English
		// learners adding German. The onboarding page saves the course itself, so a
		// refresh or back button never marks it half-done.
		const germanSetUp = meta.target_language === 'de' || (getCourse(meta.target_language) && (meta.exam_settings || meta.onboarding));
		if (language === 'de' && !germanSetUp) redirect(303, `/onboarding?language=${language}`);

		const learning = new Set(learningList(meta.learning));
		if (isAvailableCourse(meta.target_language)) learning.add(meta.target_language);
		learning.add(language);
		// Continuing the current course writes nothing; the list is updated on a switch.
		if (meta.target_language !== language) {
			try {
				const { error: saveError } = await locals.supabase.auth.updateUser({
					data: { target_language: language, learning: [...learning] }
				});
				if (saveError) return fail(503, { error: 'save_failed' });
			} catch { return fail(503, { error: 'save_failed' }); }
		}
		redirect(303, courseHome(language));
	}
};
