import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { DaySessionSchema, finishedDays } from '$lib/practice/day';
import { readEnglishProgress } from '$lib/practice/english-progress';
import { readEnglishProfile } from '$lib/practice/english-profile';

/**
 * The lessons a learner has finished, from the dashboard. Each one opens again (only finished
 * days: never one ahead). While a lesson is under way they can't, so its progress is never lost.
 */
export const load: PageServerLoad = async ({ locals }) => {
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	if (error || !user) redirect(303, '/login');
	if (user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	if (!readEnglishProfile(user.user_metadata)) redirect(303, '/practice/english/start');
	const saved = DaySessionSchema.safeParse(user.user_metadata?.english_day_v1);
	return {
		finished: finishedDays(readEnglishProgress(user.user_metadata)).map(day => ({ id: day.id, number: day.number, theme: day.theme })),
		inProgress: saved.success && saved.data.stage !== 'done'
	};
};
