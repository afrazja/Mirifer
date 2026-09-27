import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { getCourse, isAvailableCourse } from '$lib/courses';

export async function load({ locals, url }: RequestEvent) {
	// Must be signed in to access onboarding
	if (!locals.session) {
		throw redirect(303, '/login');
	}

	// Onboarding is German setup (exam goal, level). Skip it once done; an
	// English learner adding German still goes through it.
	const targetLang = locals.user?.user_metadata?.target_language;
	const meta = locals.user?.user_metadata ?? {};
	if (targetLang === 'de' || (getCourse(targetLang) && (meta.exam_settings || meta.onboarding))) {
		throw redirect(303, isAvailableCourse(targetLang) ? '/home' : '/languages');
	}
	const language = url.searchParams.get('language');
	if (!isAvailableCourse(language)) redirect(303, '/languages');
	// The English pilot starts directly from the chooser, without Goethe setup.
	if (language === 'en') redirect(303, '/languages');
	return { targetLanguage: language };
}
