import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { addressOf, bodyOf, fromOurPages, limits } from '$lib/server/auth-fallback';

/**
 * Sign-up through our own server: the fallback when the browser's own call to Supabase is lost
 * (see ../sign-in). Same options as the browser's sign-up: the name, and the confirmation link
 * through our callback into the app. When no confirmation is needed, the sign-in cookies are set
 * on this response; otherwise Supabase sends the email (its one-time code cookie is set here, so
 * the link works in this browser).
 */
const Body = z.object({ email: z.string().trim().email().max(320), password: z.string().min(6).max(200), name: z.string().trim().max(60).optional() }).strict();
const allowed = limits(10, 4);

export const POST: RequestHandler = async ({ request, url, locals, getClientAddress }) => {
	const refused = fromOurPages(request, url);
	if (refused) return refused;
	const body = await bodyOf(request, Body);
	if (!body) return json({ error: 'Enter your email and a password of at least 6 characters.' }, { status: 400 });
	const limited = allowed(addressOf(getClientAddress), body.email);
	if (limited) return limited;
	try {
		const { data, error } = await locals.supabase.auth.signUp({
			email: body.email, password: body.password,
			options: { data: { display_name: body.name || 'Learner' }, emailRedirectTo: `${url.origin}/proxy/auth/callback?next=/languages` }
		});
		if (error || !data.user) return json({ error: error?.message ?? 'Sign-up failed.' }, { status: 400 });
		return json({ user: { id: data.user.id, email: data.user.email }, signedIn: !!data.session });
	} catch {
		return json({ error: 'Sign-up is unavailable right now. Try again in a minute.' }, { status: 503 });
	}
};
