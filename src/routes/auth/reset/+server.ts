import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { addressOf, bodyOf, fromOurPages, limits } from '$lib/server/auth-fallback';

/**
 * "Forgot password" through our own server: the fallback when the browser's own call to Supabase
 * is lost (see ../sign-in). Supabase emails the reset link, through our callback to the new-password
 * page; its one-time code cookie is set on this response, so the link works in this browser.
 */
const Body = z.object({ email: z.string().trim().email().max(320) }).strict();
const allowed = limits(10, 3);

export const POST: RequestHandler = async ({ request, url, locals, getClientAddress }) => {
	const refused = fromOurPages(request, url);
	if (refused) return refused;
	const body = await bodyOf(request, Body);
	if (!body) return json({ error: 'Enter your email.' }, { status: 400 });
	const limited = allowed(addressOf(getClientAddress), body.email);
	if (limited) return limited;
	try {
		const { error } = await locals.supabase.auth.resetPasswordForEmail(body.email, { redirectTo: `${url.origin}/proxy/auth/callback?next=/reset-password` });
		if (error) return json({ error: error.message }, { status: 400 });
		return json({ sent: true });
	} catch {
		return json({ error: 'Password reset is unavailable right now. Try again in a minute.' }, { status: 503 });
	}
};
