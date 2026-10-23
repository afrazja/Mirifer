import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { DaySessionSchema, furthestDayId, nextDay } from '$lib/practice/day';
import { readEnglishProgress } from '$lib/practice/english-progress';

/**
 * Every daily lesson, one row per day, for the owner to open any of them (ready or still being
 * built). Learners don't choose days: they go straight to today's lesson.
 */
export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) redirect(303, '/login');
	if (locals.user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	const { labAccess } = await parent();
	if (!labAccess) redirect(303, '/practice/english/today');
	const meta = locals.user.user_metadata ?? {};
	const saved = DaySessionSchema.safeParse(meta.english_day_v1);
	return {
		/** The day the owner's own progress would open next. */
		nextDayId: nextDay(furthestDayId(readEnglishProgress(meta)), true).id,
		/** A saved session that isn't finished yet, on this day. */
		openDayId: saved.success && saved.data.stage !== 'done' ? saved.data.day : null
	};
};
