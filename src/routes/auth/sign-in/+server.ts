import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { addressOf, bodyOf, fromOurPages, limits } from '$lib/server/auth-fallback';

/**
 * Email sign-in through our own server: the fallback when the browser's own call to Supabase fails
 * or never arrives (a filtered or unstable mobile connection: the owner's phone sent the check
 * before the request, and the request itself never reached Supabase). The server's Supabase client
 * signs in and sets the sign-in cookies on this response, so the next page load is signed in.
 *
 * Only a fallback (src/lib/services/auth.ts): every server sign-in reaches Supabase from our few
 * server addresses, and Supabase limits sign-ins per address.
 */
const Body = z.object({ email: z.string().trim().email().max(320), password: z.string().min(1).max(200) }).strict();
const allowed = limits(20, 8);

export const POST: RequestHandler = async ({ request, url, locals, getClientAddress }) => {
	const refused = fromOurPages(request, url);
	if (refused) return refused;
	const body = await bodyOf(request, Body);
	if (!body) return json({ error: 'Enter your email and password.' }, { status: 400 });
	const limited = allowed(addressOf(getClientAddress), body.email);
	if (limited) return limited;
	try {
		const { data, error } = await locals.supabase.auth.signInWithPassword({ email: body.email, password: body.password });
		if (error || !data.user) return json({ error: error?.message ?? 'Sign-in failed.' }, { status: 400 });
		// The learner's starting rows, as the browser does after its own sign-in (best effort).
		try { await locals.supabase.from('user_progress').upsert({ user_id: data.user.id }, { onConflict: 'user_id' }); } catch { /* the app creates it later */ }
		return json({ user: { id: data.user.id, email: data.user.email } });
	} catch {
		return json({ error: 'Sign-in is unavailable right now. Try again in a minute.' }, { status: 503 });
	}
};
