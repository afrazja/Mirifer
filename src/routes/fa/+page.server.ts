import { redirect, type RequestEvent } from '@sveltejs/kit';

/** The landing page is for visitors; signed-in learners go to their languages. */
export async function load({ locals }: RequestEvent) {
	if (locals.user) redirect(303, '/languages');
	return {};
}
