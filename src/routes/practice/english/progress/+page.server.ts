import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { finishedDays } from '$lib/practice/day';
import { readEnglishProgress, skillTotal } from '$lib/practice/english-progress';
import { activeDates, stepsDone, type LessonEventRow } from '$lib/practice/learner-stats';

/**
 * The learner's progress: lessons finished, lesson steps done, the days they practised, and their
 * right answers in recent sessions. Only what they did (owner's rule): never a total, the lessons
 * ahead, or a level.
 */
export const load: PageServerLoad = async ({ locals }) => {
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	if (error || !user) redirect(303, '/login');
	if (user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	const progress = readEnglishProgress(user.user_metadata);
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
		finished: finishedDays(progress).map(day => ({ number: day.number, theme: day.theme })),
		steps: stepsDone(rows),
		dates: activeDates(rows),
		eventsLoaded,
		listening: skillTotal(progress, 'listening'),
		speaking: skillTotal(progress, 'speaking')
	};
};
