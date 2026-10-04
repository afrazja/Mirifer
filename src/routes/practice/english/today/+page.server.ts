import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { DaySessionSchema } from '$lib/practice/day';
import { readEnglishProfile } from '$lib/practice/english-profile';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	if (error || !user) redirect(303, '/login');
	if (user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	// First visit: the three onboarding questions come before the first session.
	const profile = readEnglishProfile(user.user_metadata);
	if (!profile) redirect(303, '/practice/english/start');
	const session = DaySessionSchema.safeParse(user.user_metadata?.english_day_v1);
	const name = typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name.slice(0, 40) : '';
	return { name, profile, session: session.success ? session.data : null };
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
			value = parsed.data;
		}
		try {
			const { error: saveError } = await locals.supabase.auth.updateUser({ data: { english_day_v1: value } });
			if (saveError) return fail(503, { error: 'save_failed' });
		} catch { return fail(503, { error: 'save_failed' }); }
		return { saved: true };
	}
};
