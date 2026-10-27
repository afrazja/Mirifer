import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { usesStepPath } from '$lib/server/step-path';
import { DaySessionSchema, finishedDays } from '$lib/practice/day';
import { readEnglishProgress } from '$lib/practice/english-progress';
import { readEnglishProfile } from '$lib/practice/english-profile';

/**
 * The lessons a learner has finished, from the dashboard. Each one opens again (only finished
 * days: never one ahead). The lesson already under way opens where the learner left it; another one,
 * while a lesson is under way, asks first (its place would be lost).
 */
export const load: PageServerLoad = async ({ locals }) => {
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	if (error || !user) redirect(303, '/login');
	if (user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	if (!readEnglishProfile(user.user_metadata)) redirect(303, '/practice/english/start');
	// On the step path, the path view replaces the list of finished lessons.
	if (usesStepPath(user)) redirect(303, '/practice/english/path');
	const saved = DaySessionSchema.safeParse(user.user_metadata?.english_day_v1);
	return {
		finished: finishedDays(readEnglishProgress(user.user_metadata)).map(day => ({ id: day.id, number: day.number, theme: day.theme })),
		inProgress: saved.success && saved.data.stage !== 'done',
		/** The lesson under way, if any (it opens where the learner left it). */
		underWay: saved.success && saved.data.stage !== 'done' ? saved.data.day : null
	};
};
