import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * Signs the browser out on the server: deletes the Supabase sign-in cookies (`sb-…`), so the next
 * page load is signed out even if the call to Supabase failed or hung (a slow or filtered mobile
 * connection). The session is also ended at Supabase when it can be, without waiting long.
 */
export const POST: RequestHandler = async ({ locals, cookies }) => {
	try {
		await Promise.race([locals.supabase.auth.signOut(), new Promise(resolve => setTimeout(resolve, 3000))]);
	} catch { /* the cookies below are what matter */ }
	for (const { name } of cookies.getAll()) {
		if (name.startsWith('sb-')) cookies.delete(name, { path: '/' });
	}
	return json({ signedOut: true });
};
