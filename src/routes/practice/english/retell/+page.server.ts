import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { RetellRecordSchema } from '$lib/practice/progress';
import { ALL_RETELL_PIECES, retellPieceFor } from '$lib/practice/day-content';
import { RETELL_PIECES } from '$lib/practice/retell';
import { finishedDays, trackFor } from '$lib/practice/day';
import { readEnglishProgress } from '$lib/practice/english-progress';
import { readEnglishProfile } from '$lib/practice/english-profile';

/**
 * Listen and retell in the Practice area. Learners get the stories made for practice, and a daily
 * lesson's story only once they have finished that day in its version (Professional): never a day
 * still ahead of them. The owner gets every story.
 */
export const load: PageServerLoad = async ({ locals, parent }) => {
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	if (error || !user) redirect(303, '/login');
	if (user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	const records = RetellRecordSchema.safeParse(user.user_metadata?.english_retell_v1);
	const { labAccess } = await parent();
	const professional = trackFor(readEnglishProfile(user.user_metadata)) === 'professional';
	const fromDoneDays = professional ? finishedDays(readEnglishProgress(user.user_metadata)).flatMap(day => { const piece = retellPieceFor(day.id); return piece ? [piece.id] : []; }) : [];
	const visible = labAccess ? ALL_RETELL_PIECES.map(piece => piece.id) : [...RETELL_PIECES.map(piece => piece.id), ...fromDoneDays];
	return { records: records.success ? records.data : {}, visible, learnerId: user.id };
};
