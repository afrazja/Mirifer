import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { DaySessionSchema, caughtUp, currentModule, dayById, finishedDays, furthestDayId, nextDay, sessionModules } from '$lib/practice/day';
import { readEnglishProgress } from '$lib/practice/english-progress';
import { readEnglishProfile } from '$lib/practice/english-profile';
import { lessonDates, stepDates, type LessonEventRow } from '$lib/practice/learner-stats';
import { trackFor } from '$lib/practice/day';
import { chapterNumber, nextStep, readPath, stepInfo, stepsDone, type NextStep, type Preview } from '$lib/practice/path';
import { minutesOf } from '$lib/practice/day';
import { previewFor, usesStepPath } from '$lib/server/step-path';

/**
 * The learner's dashboard, the first page of the English section (owner's decision): Mira's
 * greeting, the lessons finished, this week's days with the streak, and one button to today's lesson. Only what they did
 * (owner's rule): never a total, the lessons ahead, or a level.
 */
export const load: PageServerLoad = async ({ locals, parent }) => {
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	if (error || !user) redirect(303, '/login');
	if (user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	// First visit: the three onboarding questions come first.
	if (!readEnglishProfile(user.user_metadata)) redirect(303, '/practice/english/start');
	const progress = readEnglishProgress(user.user_metadata);
	if (usesStepPath(user)) return pathDashboard(locals, user, previewFor(user, (await parent()).labAccess));
	const saved = DaySessionSchema.safeParse(user.user_metadata?.english_day_v1);
	// The learner's own lesson events (row-level security: they can only read their own).
	let rows: LessonEventRow[] = [];
	let eventsLoaded = true;
	try {
		const { data, error: readError } = await locals.supabase.from('events')
			.select('event_name, occurred_at, metadata')
			.eq('user_id', user.id)
			.eq('event_name', 'lesson_completed')
			// English only (the paused German course writes the same event), newest first so a long
			// history never pushes out the recent days the week strip and the streak need.
			.eq('metadata->>course', 'en')
			.order('occurred_at', { ascending: false })
			.limit(1000);
		if (readError) eventsLoaded = false;
		else rows = (data ?? []) as LessonEventRow[];
	} catch { eventsLoaded = false; }
	const session = saved.success ? saved.data : null;
	const inProgress = !!session && session.stage !== 'done';
	// The lesson the button opens: the one under way, or the next one (the last one when caught up).
	const lesson = (inProgress ? dayById(session!.day) : null) ?? nextDay(furthestDayId(progress));
	// Where a paused lesson picks up: its step, or the recap once every step is through (the recap
	// counts as the last step, as on the lesson's plan).
	const steps = inProgress ? sessionModules(session!) : [];
	const next = inProgress ? currentModule(session!) : null;
	const resume = inProgress ? { step: Math.min(session!.done.length + session!.skipped.length + 1, steps.length + 1), steps: steps.length + 1, recap: session!.stage === 'recap', title: next?.title ?? null } : null;
	const name = typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name.trim().slice(0, 40) : '';
	return {
		name,
		finished: finishedDays(progress).length,
		lesson: { id: lesson.id, number: lesson.number, theme: lesson.theme },
		/** Every released lesson is done: the next one is coming. */
		caughtUp: !inProgress && caughtUp(progress),
		/** When the last lesson was finished (the page checks if that was today, on the learner's calendar). */
		lastDoneAt: session?.stage === 'done' ? session.completedAt ?? null : null,
		/** The days a lesson was finished (the week strip and the streak). */
		dates: lessonDates(rows),
		eventsLoaded,
		/** A lesson started and not finished: the button says Resume. */
		inProgress,
		resume
	};
};

/** A step, as the dashboard's card shows it (the chapter numbered in this learner's journey). */
const stepCard = (next: NextStep, preview: Preview, reason: string | null) => ({
	id: next.step, chapter: chapterNumber(next.day, preview, reason), theme: next.day.theme, title: next.module.title,
	index: next.index, total: next.total, minutes: minutesOf(next.module, 20)
});

/**
 * The dashboard on the step path (docs/goal-path-plan.md): the next step (or, with nothing new left,
 * the app's pick to practise again), this week from the days with a step done, and the steps done.
 */
async function pathDashboard(locals: App.Locals, user: { id: string; user_metadata: Record<string, unknown> }, preview: Preview) {
	const profile = readEnglishProfile(user.user_metadata);
	const track = trackFor(profile);
	const path = readPath(user.user_metadata, track);
	const reason = profile?.reason ?? null;
	const next = nextStep(path, track, preview, reason);
	// With nothing new left, the card says new practice is coming (a replay under way still shows).
	const shown = next ?? (path.current ? stepInfo(path.current.step, track) : null);
	let rows: LessonEventRow[] = [];
	let eventsLoaded = true;
	try {
		const { data, error } = await locals.supabase.from('events')
			.select('event_name, occurred_at, metadata')
			.eq('user_id', user.id)
			.in('event_name', ['lesson_progress', 'lesson_completed'])
			.eq('metadata->>course', 'en')
			.order('occurred_at', { ascending: false })
			.limit(1000);
		if (error) eventsLoaded = false;
		else rows = (data ?? []) as LessonEventRow[];
	} catch { eventsLoaded = false; }
	const name = typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name.trim().slice(0, 40) : '';
	const lastDays = Object.values(path.done).map(entry => entry?.[1] ?? 0);
	return {
		name,
		dates: stepDates(rows),
		eventsLoaded,
		path: {
			stepsDone: stepsDone(path),
			step: shown ? stepCard(shown, preview, reason) : null,
			/** Every released step is done: new practice is coming soon (any step can be practised again from the path). */
			comingSoon: !next,
			/** The card's step is one done before (a replay under way). */
			replay: !!shown && !!path.done[shown.step],
			/** The step on the card was opened and not finished. */
			underWay: !!shown && path.current?.step === shown.step,
			/** The learner's local day of their latest step (the goal shows done even if its event was lost). */
			lastDoneDay: lastDays.length ? Math.max(...lastDays) : null
		}
	};
}
