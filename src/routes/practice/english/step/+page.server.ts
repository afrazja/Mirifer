import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { trackFor, type Track } from '$lib/practice/day';
import { readEnglishProgress, type EnglishProgress } from '$lib/practice/english-progress';
import { readEnglishProfile } from '$lib/practice/english-profile';
import {
	applyStep, chapterFinished, chapterSteps, doneOn, isOpenStep, isStepId, localDay, nextStep, readPath, recordStep,
	replayPick, splitStep, startStep, chapterModules, type Path, type Preview, type StepId
} from '$lib/practice/path';
import { canUseLab } from '$lib/server/lab-access';
import { openedEvent, previewFor, ratingEvent, stepEvents, stepSeconds, usesStepPath } from '$lib/server/step-path';
import { isRating } from '$lib/practice/step-feedback';

/**
 * One step of the English path (docs/goal-path-plan.md). The app chooses it: the step under way,
 * else the next one. `?step=` opens a step done or skipped before (a replay, from the path or the
 * dashboard's "Practice again"); nothing ahead of the next step can be opened.
 */
export const load: PageServerLoad = async ({ locals, url, parent }) => {
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	if (error || !user) redirect(303, '/login');
	if (user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	const profile = readEnglishProfile(user.user_metadata);
	if (!profile) redirect(303, '/practice/english/start');
	if (!usesStepPath(user)) redirect(303, '/practice/english/today');
	const { labAccess } = await parent();
	const track = trackFor(profile);
	const path = readPath(user.user_metadata, track);
	const step = chooseStep(path, track, previewFor(user, labAccess), url.searchParams.get('step'), profile.reason);
	// Nothing new left and no replay asked for: the dashboard offers one.
	if (!step) redirect(303, '/practice/english/progress');
	const parts = splitStep(step)!;
	const modules = chapterModules(parts.day, track);
	const index = modules.findIndex(module => module.id === parts.module);
	const replay = !!path.done[step];
	const name = typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name.slice(0, 40) : '';
	return {
		name, track, step, dayId: parts.day.id, moduleId: parts.module, index, total: modules.length, replay,
		/** A step done before but skipped this time round is not a replay; a skipped one comes back as itself. */
		wasSkipped: path.skipped.includes(step),
		startedAt: path.current?.step === step ? path.current.startedAt : null
	};
};

/** The step this page shows: an allowed `asked` step, else the one under way, else the next. */
function chooseStep(path: Path, track: Track, preview: Preview, asked: string | null, reason: string | null): StepId | null {
	const next = nextStep(path, track, preview, reason);
	if (isStepId(asked) && isOpenStep(asked, track, preview, reason) && (path.done[asked] || path.skipped.includes(asked) || next?.step === asked)) return asked;
	if (path.current && isOpenStep(path.current.step, track, preview, reason)) return path.current.step;
	return next?.step ?? null;
}

const ScoreSchema = z.object({ correct: z.number().int().min(0).max(20), total: z.number().int().min(1).max(20) }).strict();

/** The signed-in learner, their version and path, or the failure to return. */
async function learner(locals: App.Locals) {
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	if (error || !user) return fail(401, { error: 'sign_in' });
	if (user.user_metadata?.target_language !== 'en') return fail(409, { error: 'course_changed' });
	const profile = readEnglishProfile(user.user_metadata);
	if (!profile || !usesStepPath(user)) return fail(403, { error: 'not_available' });
	const track = trackFor(profile);
	return { user, track, reason: profile.reason, path: readPath(user.user_metadata, track), preview: previewFor(user, canUseLab(user)) };
}

/** A step this learner may work on: open in their version, and not ahead of their next step. */
function allowed(path: Path, track: Track, preview: Preview, value: unknown, reason: string | null): StepId | null {
	if (!isStepId(value) || !isOpenStep(value, track, preview, reason)) return null;
	return chooseStep(path, track, preview, value, reason) === value ? value : null;
}

export const actions: Actions = {
	/** How much the learner liked a step they did (1–5); optional, and a later rating replaces it in the admin. */
	rate: async ({ locals, request }) => {
		const me = await learner(locals);
		if ('status' in me) return me;
		const form = await request.formData();
		const step = form.get('step'), rating = Number(form.get('rating'));
		if (!isStepId(step) || !isOpenStep(step, me.track, me.preview, me.reason) || !me.path.done[step] || !isRating(rating)) return fail(400, { error: 'invalid' });
		const { day, module } = splitStep(step)!;
		try {
			const { error } = await locals.supabase.from('events').insert([{ ...ratingEvent(me.user.id, day, me.track, module, rating, new Date()), user_id: me.user.id }]);
			if (error) return fail(503, { error: 'save_failed' });
		} catch { return fail(503, { error: 'save_failed' }); }
		return { rated: rating };
	},

	/** The step opens: it becomes the one under way, with its start (which keys its answers in the browser). */
	start: async ({ locals, request }) => {
		const me = await learner(locals);
		if ('status' in me) return me;
		const form = await request.formData();
		const step = allowed(me.path, me.track, me.preview, form.get('step'), me.reason);
		if (!step) return fail(400, { error: 'invalid' });
		// Opened again (a reload, a second tab): the same start, and no second "opened".
		if (me.path.current?.step === step) return { startedAt: me.path.current.startedAt };
		const path = startStep(me.path, step, me.track);
		try {
			const { error } = await locals.supabase.auth.updateUser({ data: { english_path_v1: path } });
			if (error) return fail(503, { error: 'save_failed' });
		} catch { return fail(503, { error: 'save_failed' }); }
		// Analytics never fail the step.
		try {
			const { day, module } = splitStep(step)!;
			const offset = Number(form.get('utcOffset'));
			const event = openedEvent(me.user.id, day, me.track, module, chapterModules(day, me.track).findIndex(item => item.id === module), !!me.path.done[step],
				new Date(path.current!.startedAt), Number.isInteger(offset) && Math.abs(offset) <= 840 ? offset : null);
			await locals.supabase.from('events').insert([{ ...event, user_id: me.user.id }]);
		} catch { /* best effort */ }
		return { startedAt: path.current!.startedAt };
	},

	/**
	 * A step's result, merged into a fresh read of the path (two tabs or devices can't undo each
	 * other's steps). Keeps `english_progress_v1` current for Mira's greeting and the coach.
	 */
	result: async ({ locals, request }) => {
		const me = await learner(locals);
		if ('status' in me) return me;
		const form = await request.formData();
		const step = allowed(me.path, me.track, me.preview, form.get('step'), me.reason);
		const outcome = form.get('outcome');
		if (!step || (outcome !== 'done' && outcome !== 'skipped')) return fail(400, { error: 'invalid' });
		let score: z.infer<typeof ScoreSchema> | null = null;
		const rawScore = form.get('score');
		// The score also comes for steps without one of their own (Natural phrases: the phrases caught).
		if (typeof rawScore === 'string' && rawScore) {
			try { const parsed = ScoreSchema.safeParse(JSON.parse(rawScore)); if (parsed.success) score = parsed.data; } catch { /* no score */ }
		}
		const offset = Number(form.get('utcOffset'));
		const utcOffsetMin = Number.isInteger(offset) && Math.abs(offset) <= 840 ? offset : null;
		const now = new Date(), today = localDay(now, utcOffsetMin);

		const { day, module: moduleId } = splitStep(step)!;
		const modules = chapterModules(day, me.track);
		const module = modules.find(item => item.id === moduleId)!;
		const before = me.path;
		const replay = !!before.done[step];
		const goalBefore = doneOn(before, today);
		const wasFinished = chapterFinished(before, day, me.track);
		const startedChapter = !replay && chapterSteps(day, me.track).every(item => !before.done[item] && !before.skipped.includes(item));
		const path = applyStep(before, { step, outcome }, me.track, today);
		const finishedNow = chapterFinished(path, day, me.track) && !wasFinished;

		let progress = readEnglishProgress(me.user.user_metadata);
		if (outcome === 'done') progress = recordStep(progress, day.id, score ? { skill: module.skill, ...score } : null, finishedNow, now);
		else if (finishedNow) progress = withFinishedDay(progress, day.id);
		try {
			const { error } = await locals.supabase.auth.updateUser({ data: { english_path_v1: path, english_progress_v1: progress } });
			if (error) return fail(503, { error: 'save_failed' });
		} catch { return fail(503, { error: 'save_failed' }); }

		// Analytics never fail the step.
		try {
			const steps = chapterSteps(day, me.track);
			const rows = stepEvents(me.user.id, {
				day, track: me.track, module: moduleId, index: modules.indexOf(module), total: modules.length, outcome, replay, score,
				seconds: before.current?.step === step ? stepSeconds(before.current.startedAt, now) : null,
				chapterStarted: startedChapter,
				chapterCompleted: finishedNow ? { done: steps.filter(item => path.done[item]).length, skipped: steps.filter(item => path.skipped.includes(item)).length } : null
			}, now, utcOffsetMin);
			await locals.supabase.from('events').insert(rows.map(row => ({ ...row, user_id: me.user.id })));
		} catch { /* best effort */ }

		const next = nextStep(path, me.track, me.preview, me.reason);
		const again = next ? null : replayPick(path, me.track, me.preview, me.reason);
		return {
			goalJustMet: outcome === 'done' && !goalBefore,
			chapterDone: finishedNow,
			/** Steps of this chapter still skipped: one is offered before the chapter ending. */
			skippedHere: finishedNow ? chapterSteps(day, me.track).filter(item => path.skipped.includes(item)) : [],
			next: next?.step ?? again?.step ?? null,
			nextIsReplay: !next && !!again
		};
	}
};

/** A chapter that ended on a skip still counts as passed (as a daily lesson with a skipped step did). */
function withFinishedDay(progress: EnglishProgress, dayId: string): EnglishProgress {
	const days = progress.finishedDays ?? [];
	return days.includes(dayId) ? progress : { ...progress, finishedDays: [...days, dayId], lastThemeId: dayId };
}
