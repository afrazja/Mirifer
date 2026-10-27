/**
 * Test accounts only (src/lib/server/test-accounts.ts): clears the signed-in account's English
 * progress so it starts again as a new learner (onboarding, then lesson 1). With `history`, its
 * activity records go too (the week strip, the streak, the admin's view of it). Always the account
 * in the request's own session; no id is read from the body.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ENGLISH_STATE_KEYS, canResetEnglish } from '$lib/server/test-accounts';
import { serviceClient } from '$lib/server/supabase-admin';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Origin rejected' }, { status: 403 });
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	if (error || !user) return json({ error: 'Sign in required' }, { status: 401 });
	if (!canResetEnglish(user)) return json({ error: 'Not available for this account' }, { status: 403 });
	const body = await request.json().catch(() => null) as { history?: unknown } | null;
	const history = body?.history === true;

	const cleared = Object.fromEntries(ENGLISH_STATE_KEYS.map(key => [key, null]));
	const { error: saveError } = await locals.supabase.auth.updateUser({ data: cleared });
	if (saveError) return json({ error: 'The reset didn’t save. Try again.' }, { status: 503 });

	let historyCleared = false;
	if (history) {
		const svc = serviceClient();
		if (svc) {
			const { error: deleteError } = await svc.from('events').delete().eq('user_id', user.id);
			historyCleared = !deleteError;
		}
	}
	return json({ ok: true, historyCleared });
};
