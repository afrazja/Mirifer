import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { EnglishProfileAnswersSchema, readEnglishProfile } from '$lib/practice/english-profile';

/** English onboarding: three questions, once. `?edit=1` lets the learner change their answers. */
export const load: PageServerLoad = async ({ locals, url }) => {
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	if (error || !user) redirect(303, '/login');
	if (user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	const profile = readEnglishProfile(user.user_metadata);
	if (profile && url.searchParams.get('edit') !== '1') redirect(303, '/practice/english/today');
	const name = typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name.slice(0, 40) : '';
	return { name, profile };
};

export const actions: Actions = {
	save: async ({ locals, request }) => {
		const { data: { user }, error } = await locals.supabase.auth.getUser();
		if (error || !user) return fail(401, { error: 'sign_in' });
		if (user.user_metadata?.target_language !== 'en') return fail(409, { error: 'course_changed' });
		const raw = (await request.formData()).get('answers');
		if (typeof raw !== 'string' || raw.length > 500) return fail(400, { error: 'invalid' });
		let value: unknown;
		try { value = JSON.parse(raw); } catch { return fail(400, { error: 'invalid' }); }
		const answers = EnglishProfileAnswersSchema.safeParse(value);
		if (!answers.success) return fail(400, { error: 'invalid' });
		const profile = { ...answers.data, completedAt: new Date().toISOString() };
		try {
			const { error: saveError } = await locals.supabase.auth.updateUser({ data: { english_profile_v1: profile } });
			if (saveError) return fail(503, { error: 'save_failed' });
		} catch { return fail(503, { error: 'save_failed' }); }
		return { profile };
	}
};
