import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { RetellRecordSchema } from '$lib/practice/progress';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	if (error || !user) redirect(303, '/login');
	if (user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	const records = RetellRecordSchema.safeParse(user.user_metadata?.english_retell_v1);
	return { records: records.success ? records.data : {} };
};
