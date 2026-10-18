import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	if (!locals.user) redirect(303, '/login');
	if (locals.user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	const { labAccess } = await parent();
	if (!labAccess) redirect(303, '/practice/english/today');
	return {};
};
