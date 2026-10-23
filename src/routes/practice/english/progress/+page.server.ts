import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { DaySessionSchema, caughtUp, currentModule, dayById, finishedDays, furthestDayId, nextDay, sessionModules } from '$lib/practice/day';
import { readEnglishProgress } from '$lib/practice/english-progress';
import { readEnglishProfile } from '$lib/practice/english-profile';
import { activeDates, type LessonEventRow } from '$lib/practice/learner-stats';

/**
 * The learner's dashboard, the first page of the English section (owner's decision): Mira's
 * greeting, the lessons finished, this week's days with the streak, and one button to today's lesson. Only what they did
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
	const session = saved.success ? saved.data : null;
	const inProgress = !!session && session.stage !== 'done';
	// The lesson the button opens: the one under way, or the next one (the last one when caught up).
	const lesson = (inProgress ? dayById(session!.day) : null) ?? nextDay(furthestDayId(progress));
	// Where a paused lesson picks up: its step, or the recap once every step is through.
	const steps = inProgress ? sessionModules(session!) : [];
	const next = inProgress ? currentModule(session!) : null;
	const resume = inProgress ? { step: Math.min(session!.done.length + session!.skipped.length + 1, steps.length), steps: steps.length, recap: session!.stage === 'recap', title: next?.title ?? null } : null;
	const name = typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name.trim().slice(0, 40) : '';
	return {
		name,
		finished: finishedDays(progress).length,
		lesson: { id: lesson.id, number: lesson.number, theme: lesson.theme },
		/** Every released lesson is done: the next one is coming. */
		caughtUp: !inProgress && caughtUp(progress),
		/** When the last lesson was finished (the page checks if that was today, on the learner's calendar). */
		lastDoneAt: session?.stage === 'done' ? session.completedAt ?? null : null,
		dates: activeDates(rows),
		eventsLoaded,
		/** A lesson started and not finished: the button says Resume. */
		inProgress,
		resume
	};
};
