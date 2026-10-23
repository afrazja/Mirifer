import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { canUseLab, LEARNER_VIEW_COOKIE } from '$lib/server/lab-access';

/** The owner switches between their own view and a learner's (see LEARNER_VIEW_COOKIE). */
export const POST: RequestHandler = async ({ locals, request, cookies }) => {
	if (!canUseLab(locals.user)) error(404, 'Not found');
	const form = await request.formData();
	if (form.get('as') === 'learner') cookies.set(LEARNER_VIEW_COOKIE, '1', { path: '/', httpOnly: true, sameSite: 'lax', secure: true, maxAge: 60 * 60 * 24 * 30 });
	else cookies.delete(LEARNER_VIEW_COOKIE, { path: '/' });
	// Back to the English pages only (never an outside address).
	const to = form.get('to');
	redirect(303, typeof to === 'string' && /^\/practice\/english(\/[\w-]*)*(\?[\w=&-]*)?$/.test(to) ? to : '/practice/english/today');
};
