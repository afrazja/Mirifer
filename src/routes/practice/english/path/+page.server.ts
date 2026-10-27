import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { minutesOf, trackFor } from '$lib/practice/day';
import { readEnglishProfile } from '$lib/practice/english-profile';
import { chapterFinished, chapterModules, nextStep, readPath, releasedChapters, stepId } from '$lib/practice/path';
import { usesStepPath } from '$lib/server/step-path';

/**
 * The learner's path (docs/goal-path-plan.md): every released chapter with its steps, done,
 * skipped, next or locked. Done and skipped steps can be opened again; nothing ahead of the next
 * step can. Chapters not released yet never show.
 */
export const load: PageServerLoad = async ({ locals, parent }) => {
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	if (error || !user) redirect(303, '/login');
	if (user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	const profile = readEnglishProfile(user.user_metadata);
	if (!profile) redirect(303, '/practice/english/start');
	if (!usesStepPath(user)) redirect(303, '/practice/english/finished');
	const { labAccess } = await parent();
	const track = trackFor(profile);
	const path = readPath(user.user_metadata, track);
	const next = nextStep(path, track, labAccess)?.step ?? null;
	const chapters = releasedChapters(labAccess).map(day => ({
		id: day.id, number: day.number, theme: day.theme, finished: chapterFinished(path, day, track),
		steps: chapterModules(day, track).map(module => {
			const id = stepId(day, module);
			const state = path.done[id] ? 'done' : path.skipped.includes(id) ? 'skipped' : id === next ? 'next' : 'locked';
			return { id, title: module.title, minutes: minutesOf(module, 20), state: state as 'done' | 'skipped' | 'next' | 'locked', underWay: path.current?.step === id };
		})
	}));
	// Chapters the learner hasn't reached yet stay out of sight, except the one with the next step.
	const reached = chapters.filter(chapter => chapter.steps.some(step => step.state !== 'locked'));
	return { chapters: reached.length ? reached : chapters.slice(0, 1) };
};
