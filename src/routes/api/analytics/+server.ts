import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { parseEvent, serverOnly } from '$lib/analytics/contract';

export const POST: RequestHandler = async ({ request, locals }) => {
	// Same-origin, authenticated writes only. No service key at this boundary.
	if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Origin rejected' }, { status: 403 });
	const { data: { user }, error: authError } = await locals.supabase.auth.getUser();
	if (authError || !user) return json({ error: 'Sign in required' }, { status: 401 });
	const raw = await request.text();
	if (raw.length > 64_000) return json({ error: 'Batch too large' }, { status: 413 });
	let body;
	try { body = JSON.parse(raw); } catch { return json({ error: 'Invalid JSON' }, { status: 400 }); }
	if (body?.user_id !== user.id || !Array.isArray(body.events) || body.events.length < 1 || body.events.length > 50) return json({ error: 'Invalid batch' }, { status: 400 });
	const events = body.events.map((event: unknown) => parseEvent(event));
	if (events.some((event: unknown) => event === null)) return json({ error: 'Invalid event' }, { status: 400 });
	// Events only the server writes are dropped (they would add steps or AI use to the admin's numbers).
	const allowed = events.filter((event: NonNullable<ReturnType<typeof parseEvent>>) => !serverOnly(event));
	if (!allowed.length) return json({ accepted: 0 });
	const { error } = await locals.supabase.from('events').upsert(
		allowed.map((event: object) => ({ ...event, user_id: user.id })),
		{ onConflict: 'event_id', ignoreDuplicates: true }
	);
	if (error) return json({ error: 'Collection unavailable' }, { status: 503 });
	return json({ accepted: allowed.length });
};
