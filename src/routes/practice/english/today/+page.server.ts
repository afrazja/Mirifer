import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { DaySessionSchema, TRACKS, dayById, dayOf, nextDay, sessionModules, trackFor, type DaySession, type Track } from '$lib/practice/day';
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
	// …and either version of a day (?track=professional); learners get theirs from onboarding.
	const askedTrack = url.searchParams.get('track');
	const requestedTrack = labAccess && TRACKS.includes(askedTrack as Track) ? (askedTrack as Track) : null;
	let session = saved.success ? saved.data : null;
	if (requested && session && session.day !== requested.id) session = null;
	if (requestedTrack && session?.track && session.track !== requestedTrack) session = null;
	// A session saved before its day had two versions (Day 1 before its rebuild) carries on in the
	// learner's own version; the version is saved with it from the next save on.
	if (session && !session.track && dayById(session.day)?.tracks) session = { ...session, track: requestedTrack ?? trackFor(profile) };
	// The day a new session starts on: the one after the last finished day.
	const upcoming = requested ?? nextDay(progress.lastThemeId, labAccess);
	const track = requestedTrack ?? trackFor(profile);
	return { name, profile, progress, session, nextDayId: upcoming.id, requestedDay: requested?.id ?? null, track };
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
	const modules = sessionModules(next).flatMap(module => {
		const score = next.scores?.[module.id];
		return score && next.done.includes(module.id) ? [{ skill: module.skill, ...score }] : [];
	});
	// A day counts as passed once any step was done; skipping a step doesn't keep the learner on the same
	// day (that kept those who found a step hard on Day 1). A day with every step skipped comes back.
	const progress = readEnglishProgress(meta);
	return recordSession(progress, next.done.length ? next.day : progress.lastThemeId, modules);
}
