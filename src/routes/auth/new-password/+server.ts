import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { addressOf, bodyOf, fromOurPages, limits } from '$lib/server/auth-fallback';

/**
 * Setting a new password (after a reset link, or while signed in) through our own server: the
 * fallback when the browser's own call to Supabase is lost (see ../sign-in). Needs the signed-in
 * session the reset link created (its cookies).
 */
const Body = z.object({ password: z.string().min(6).max(200) }).strict();
const allowed = limits(10, 5);

export const POST: RequestHandler = async ({ request, url, locals, getClientAddress }) => {
	const refused = fromOurPages(request, url);
	if (refused) return refused;
	if (!locals.user) return json({ error: 'The reset link has expired. Ask for a new one.' }, { status: 401 });
	const body = await bodyOf(request, Body);
	if (!body) return json({ error: 'The password needs at least 6 characters.' }, { status: 400 });
	const limited = allowed(addressOf(getClientAddress), locals.user.id);
	if (limited) return limited;
	try {
		const { error } = await locals.supabase.auth.updateUser({ password: body.password });
		if (error) return json({ error: error.message }, { status: 400 });
		return json({ updated: true });
	} catch {
		return json({ error: 'Changing the password is unavailable right now. Try again in a minute.' }, { status: 503 });
	}
};
