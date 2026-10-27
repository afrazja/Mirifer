import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';
import { EnglishProfileAnswersSchema, readEnglishProfile } from '$lib/practice/english-profile';

/** The name sign-up gave us (ours, or Google's), for the first question. */
function nameOf(meta: Record<string, unknown> | undefined): string {
	for (const key of ['display_name', 'full_name', 'name']) {
		const value = meta?.[key];
		if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 40);
	}
	return '';
}
const NameSchema = z.string().trim().min(1).max(40);

/** English onboarding, once: the learner's name, their goal and their level. `?edit=1` lets them change it. */
export const load: PageServerLoad = async ({ locals, url }) => {
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	if (error || !user) redirect(303, '/login');
	if (user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	const profile = readEnglishProfile(user.user_metadata);
	if (profile && url.searchParams.get('edit') !== '1') redirect(303, '/practice/english/today');
	return { name: nameOf(user.user_metadata), profile };
};

export const actions: Actions = {
	save: async ({ locals, request }) => {
		const { data: { user }, error } = await locals.supabase.auth.getUser();
		if (error || !user) return fail(401, { error: 'sign_in' });
		if (user.user_metadata?.target_language !== 'en') return fail(409, { error: 'course_changed' });
		const form = await request.formData();
		const raw = form.get('answers');
		if (typeof raw !== 'string' || raw.length > 500) return fail(400, { error: 'invalid' });
		let value: unknown;
		try { value = JSON.parse(raw); } catch { return fail(400, { error: 'invalid' }); }
		const answers = EnglishProfileAnswersSchema.safeParse(value);
		if (!answers.success) return fail(400, { error: 'invalid' });
		// The name is optional here (older pages don't send it); when sent, it must be a real one.
		const rawName = form.get('name');
		const name = rawName === null ? null : NameSchema.safeParse(rawName);
		if (name && !name.success) return fail(400, { error: 'invalid' });
		const displayName = name?.success ? name.data : null;
		const profile = { ...answers.data, completedAt: new Date().toISOString() };
		try {
			const { error: saveError } = await locals.supabase.auth.updateUser({ data: { english_profile_v1: profile, ...(displayName ? { display_name: displayName } : {}) } });
			if (saveError) return fail(503, { error: 'save_failed' });
		} catch { return fail(503, { error: 'save_failed' }); }
		// The settings page reads the name from the profile row; a failure here only delays it there.
		if (displayName) {
			try { await locals.supabase.from('user_profiles').upsert({ id: user.id, display_name: displayName }, { onConflict: 'id' }); } catch { /* the sign-in name still holds it */ }
		}
		return { profile };
	}
};
