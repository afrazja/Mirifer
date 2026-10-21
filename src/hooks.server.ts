import { getSupabaseServerClient } from '$lib/supabase/server';
import { redirect, type Handle } from '@sveltejs/kit';
import { courseRedirect } from '$lib/courses';

export const handle: Handle = async ({ event, resolve }) => {
	const supabase = getSupabaseServerClient(event.cookies);

	// Make Supabase client available to all server-side code
	event.locals.supabase = supabase;

	// Refresh the session (required for cookie-based auth)
	const {
		data: { session }
	} = await supabase.auth.getSession();

	event.locals.session = session;
	event.locals.user = session?.user ?? null;
	if (event.locals.user) {
		const destination = courseRedirect(event.url.pathname, event.locals.user.user_metadata?.target_language);
		if (destination) redirect(303, destination);
	}

	// The public pages take their language from the address, not the learner's saved setting:
	// /fa and its pages are Persian, the rest of the public pages English (screen readers and search).
	const path = event.url.pathname;
	const persian = path === '/fa' || path.startsWith('/fa/');
	return resolve(event, {
		transformPageChunk: ({ html }) => (persian ? html.replace('<html lang="en">', '<html lang="fa" dir="rtl">') : html),
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
