import { redirect } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function load({ locals }: RequestEvent) {
	// Already signed in → straight to the app
	if (locals.session) {
		throw redirect(303, '/languages');
	}
	return {};
}
