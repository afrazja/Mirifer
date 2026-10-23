import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { DaySessionSchema, finishedDays } from '$lib/practice/day';
import { readEnglishProgress } from '$lib/practice/english-progress';
import { readEnglishProfile } from '$lib/practice/english-profile';
import { activeDates, type LessonEventRow } from '$lib/practice/learner-stats';

/**
 * The learner's dashboard, the first page of the English section (owner's decision): the lessons
 * finished, this week's days with the streak, and one button to today's lesson. Only what they did
 * (owner's rule): never a total, the lessons ahead, or a level.
 */
export const load: PageServerLoad = async ({ locals }) => {
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	if (error || !user) redirect(303, '/login');
	if (user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	// First visit: the three onboarding questions come first.
	if (!readEnglishProfile(user.user_metadata)) redirect(303, '/practice/english/start');
	const progress = readEnglishProgress(user.user_metadata);
	const saved = DaySessionSchema.safeParse(user.user_metadata?.english_day_v1);
	// The learner's own lesson events (row-level security: they can only read their own).
	let rows: LessonEventRow[] = [];
	let eventsLoaded = true;
	try {
		const { data, error: readError } = await locals.supabase.from('events')
			.select('event_name, occurred_at, metadata')
			.eq('user_id', user.id)
			.in('event_name', ['lesson_started', 'lesson_progress', 'lesson_completed'])
			.order('occurred_at', { ascending: true })
			.limit(5000);
		if (readError) eventsLoaded = false;
		else rows = (data ?? []) as LessonEventRow[];
	} catch { eventsLoaded = false; }
	return {
		finished: finishedDays(progress).length,
		dates: activeDates(rows),
		eventsLoaded,
		/** A lesson started and not finished: the button says Continue. */
		inProgress: saved.success && saved.data.stage !== 'done'
	};
};
