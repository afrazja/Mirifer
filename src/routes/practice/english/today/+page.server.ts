import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { DaySessionSchema, dayById, dayOf, nextDay, type DaySession } from '$lib/practice/day';
import { readEnglishProgress, recordSession, type EnglishProgress } from '$lib/practice/english-progress';
import { readEnglishProfile } from '$lib/practice/english-profile';
import { canUseLab } from '$lib/server/lab-access';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	if (error || !user) redirect(303, '/login');
	if (user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	// First visit: the three onboarding questions come before the first session.
	const profile = readEnglishProfile(user.user_metadata);
	if (!profile) redirect(303, '/practice/english/start');
	const saved = DaySessionSchema.safeParse(user.user_metadata?.english_day_v1);
	const name = typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name.slice(0, 40) : '';
	const progress = readEnglishProgress(user.user_metadata);
	// The owner can open any day with ?day=day-2, to try a day that isn't ready for learners yet.
	const { labAccess } = await parent();
	const requested = labAccess ? dayById(url.searchParams.get('day')) : null;
	let session = saved.success ? saved.data : null;
	if (requested && session && session.day !== requested.id) session = null;
	// The day a new session starts on: the one after the last finished day.
	const upcoming = requested ?? nextDay(progress.lastThemeId, labAccess);
	return { name, profile, progress, session, nextDayId: upcoming.id };
};

export const actions: Actions = {
	/** Saves the checkpoint after each step. `session` empty clears it ("start again"). */
	save: async ({ locals, request }) => {
		const { data: { user }, error } = await locals.supabase.auth.getUser();
		if (error || !user) return fail(401, { error: 'sign_in' });
		if (user.user_metadata?.target_language !== 'en') return fail(409, { error: 'course_changed' });
		const raw = (await request.formData()).get('session');
		if (typeof raw !== 'string' || raw.length > 1000) return fail(400, { error: 'invalid' });
		let value: unknown = null;
		if (raw !== '') {
			try { value = JSON.parse(raw); } catch { return fail(400, { error: 'invalid' }); }
			const parsed = DaySessionSchema.safeParse(value);
			if (!parsed.success) return fail(400, { error: 'invalid' });
			// A day that isn't ready yet is only for the owner to try.
			if (!dayOf(parsed.data).ready && !canUseLab(user)) return fail(400, { error: 'invalid' });
			value = parsed.data;
		}
		const data: Record<string, unknown> = { english_day_v1: value };
		const progress = progressAfter(user.user_metadata, value as DaySession | null);
		if (progress) data.english_progress_v1 = progress;
		try {
			const { error: saveError } = await locals.supabase.auth.updateUser({ data });
			if (saveError) return fail(503, { error: 'save_failed' });
		} catch { return fail(503, { error: 'save_failed' }); }
		return { saved: true };
	}
};

/**
 * When this save finishes a session (stage "done" and the stored copy was not
 * yet done), the session counts once towards progress, from its module scores.
 */
function progressAfter(meta: Record<string, unknown> | undefined, next: DaySession | null): EnglishProgress | null {
	if (next?.stage !== 'done') return null;
	const stored = DaySessionSchema.safeParse(meta?.english_day_v1);
	if (stored.success && stored.data.stage === 'done' && stored.data.startedAt === next.startedAt) return null;
	const modules = dayOf(next).modules.flatMap(module => {
		const score = next.scores?.[module.id];
		return score && next.done.includes(module.id) ? [{ skill: module.skill, ...score }] : [];
	});
	// A day with skipped steps comes back next time (the recap promises it), so it doesn't count as passed.
	const progress = readEnglishProgress(meta);
	return recordSession(progress, next.skipped.length ? progress.lastThemeId : next.day, modules);
}
