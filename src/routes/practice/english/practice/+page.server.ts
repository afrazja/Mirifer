import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { trackFor } from '$lib/practice/day';
import { readEnglishProfile } from '$lib/practice/english-profile';

/**
 * The Practice area. Off for learners for now (owner's decision: the daily lesson is the one way to
 * learn); the owner keeps it, unless seeing the app as a learner.
 */
export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) redirect(303, '/login');
	if (!(await parent()).labAccess) redirect(303, '/practice/english/today');
	if (locals.user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	const profile = readEnglishProfile(locals.user.user_metadata);
	if (!profile) redirect(303, '/practice/english/start');
	return { learnerId: locals.user.id, track: trackFor(profile) };
};
