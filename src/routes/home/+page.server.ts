import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { ownAssessments } from '$lib/server/assessments';
import { checkSchedule } from '$lib/analytics/assessment-schedule';
import { isAvailableCourse } from '$lib/courses';

export async function load({ locals }: RequestEvent) {
	// Must be signed in. Send to the app login screen — NOT the marketing
	// landing page — so a direct visit or old bookmark never opens on
	// marketing content.
	if (!locals.session) {
		throw redirect(303, '/login');
	}

	// Must have completed language onboarding
	const targetLang = locals.user?.user_metadata?.target_language;
	if (!isAvailableCourse(targetLang)) {
		throw redirect(303, '/languages');
	}
	if (targetLang === 'en') redirect(303, '/practice/english');

	try {
		const rows = await ownAssessments(locals.supabase, locals.user!.id);
		return { checkIn: checkSchedule(rows), checkLanguage: targetLang };
	} catch { return { checkIn: null, checkLanguage: targetLang }; }
}
