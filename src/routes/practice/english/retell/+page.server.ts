import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { RetellRecordSchema } from '$lib/practice/progress';
import { ALL_RETELL_PIECES } from '$lib/practice/day-content';

/**
 * Listen and retell in the Practice area: the owner only for now (the Practice area is off for
 * learners, the owner's decision), with every story. Learners go to today's lesson. When it comes
 * back for learners, see git history for their rules (practice stories, plus a lesson's story only
 * after they finish that day in Professional).
 */
export const load: PageServerLoad = async ({ locals, parent }) => {
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	if (error || !user) redirect(303, '/login');
	if (user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	if (!(await parent()).labAccess) redirect(303, '/practice/english/today');
	const records = RetellRecordSchema.safeParse(user.user_metadata?.english_retell_v1);
	return { records: records.success ? records.data : {}, visible: ALL_RETELL_PIECES.map(piece => piece.id), learnerId: user.id };
};
