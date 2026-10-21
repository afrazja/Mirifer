import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { trackFor } from '$lib/practice/day';
import { readEnglishProfile } from '$lib/practice/english-profile';

/** The Practice area: every English learner, after onboarding. */
export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/login');
	if (locals.user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	const profile = readEnglishProfile(locals.user.user_metadata);
	if (!profile) redirect(303, '/practice/english/start');
	return { learnerId: locals.user.id, track: trackFor(profile) };
};
