import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { GOAL_IDS } from '$lib/practice/hotel';
import { provenGoals } from '$lib/server/jamie-line';
import { HotelCompletionSchema, HotelSubmissionSchema } from '$lib/practice/progress';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	if (error || !user) redirect(303, '/login');
	if (user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	const completed = HotelCompletionSchema.safeParse(user.user_metadata?.english_hotel_v1);
	return { learnerId: user.id, completed: completed.success ? completed.data : null };
};

export const actions: Actions = {
	complete: async ({ locals, request }) => {
		const { data: { user }, error } = await locals.supabase.auth.getUser();
		if (error || !user) return fail(401, { error: 'sign_in' });
		if (user.user_metadata?.target_language !== 'en') return fail(409, { error: 'course_changed' });
		const raw = (await request.formData()).get('result');
		if (typeof raw !== 'string' || raw.length > 3000) return fail(400, { error: 'invalid' });
		let value: unknown;
		try { value = JSON.parse(raw); } catch { return fail(400, { error: 'invalid' }); }
		const result = HotelSubmissionSchema.safeParse(value);
		if (!result.success) return fail(400, { error: 'invalid' });
		const { variant, goals, proof, turns, averageWords } = result.data;
		if (provenGoals(user.id, variant, goals, proof).length !== GOAL_IDS.length) return fail(400, { error: 'invalid' });
		const completed = { completedAt: new Date().toISOString(), variant, turns, averageWords: Math.round(averageWords * 10) / 10 };
		try {
			const { error: saveError } = await locals.supabase.auth.updateUser({ data: { english_hotel_v1: completed } });
			if (saveError) return fail(503, { error: 'save_failed' });
		} catch { return fail(503, { error: 'save_failed' }); }
		return { completed };
	}
};
