import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { isPracticeId } from '$lib/practice/practice-area';
import { readEnglishProfile } from '$lib/practice/english-profile';

/** One Practice module, for every English learner. */
export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user) redirect(303, '/login');
	if (locals.user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	if (!readEnglishProfile(locals.user.user_metadata)) redirect(303, '/practice/english/start');
	if (!isPracticeId(params.module)) error(404, 'Not found');
	// Listen and retell has its own page (its stories and best scores).
	if (params.module === 'retell') redirect(303, '/practice/english/retell');
	return { learnerId: locals.user.id, module: params.module };
};
