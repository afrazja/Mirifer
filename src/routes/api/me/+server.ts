import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { fromOurPages } from '$lib/server/auth-fallback';

/**
 * The signed-in learner's own settings, through our server: app language, voice speed, display name
 * and photo. The browser's own calls to Supabase can be lost on a filtered or unstable connection
 * (src/lib/services/auth.ts); our server always reaches it. Row-level security still applies: the
 * server's Supabase client acts as the learner.
 *
 * GET also creates the learner's profile row the first time (the browser used to do that after
 * sign-in, and could lose that call too).
 */
const Patch = z.object({
	language: z.enum(['en', 'fa']).optional(),
	voiceSpeed: z.number().min(0.5).max(1.5).optional(),
	displayName: z.string().trim().min(1).max(40).optional()
}).strict();

type Row = { display_name: string | null; language: string | null; voice_speed: number | null; avatar_url: string | null };
const shape = (row: Row | null) => ({ language: row?.language ?? null, voiceSpeed: row?.voice_speed ?? null, displayName: row?.display_name ?? null, avatarUrl: row?.avatar_url ?? null });
const nameOf = (meta: Record<string, unknown> | undefined) => {
	for (const key of ['display_name', 'full_name', 'name']) { const value = meta?.[key]; if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 40); }
	return 'Learner';
};

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) return json({ error: 'Not signed in' }, { status: 401 });
	const { data, error } = await locals.supabase.from('user_profiles').select('display_name, language, voice_speed, avatar_url').eq('id', locals.user.id).maybeSingle();
	if (error) return json({ error: 'Unavailable' }, { status: 503 });
	if (!data) {
		const row = { id: locals.user.id, display_name: nameOf(locals.user.user_metadata) };
		await locals.supabase.from('user_profiles').upsert(row, { onConflict: 'id' });
		return json(shape({ display_name: row.display_name, language: null, voice_speed: null, avatar_url: null }));
	}
	return json(shape(data as Row));
};

export const PATCH: RequestHandler = async ({ request, url, locals }) => {
	const refused = fromOurPages(request, url);
	if (refused) return refused;
	if (!locals.user) return json({ error: 'Not signed in' }, { status: 401 });
	let body: z.infer<typeof Patch>;
	try { body = Patch.parse(await request.json()); } catch { return json({ error: 'Invalid settings' }, { status: 400 }); }
	const changes: Record<string, unknown> = { updated_at: new Date().toISOString() };
	if (body.language) changes.language = body.language;
	if (body.voiceSpeed !== undefined) changes.voice_speed = body.voiceSpeed;
	if (body.displayName) changes.display_name = body.displayName;
	const { error } = await locals.supabase.from('user_profiles').upsert({ id: locals.user.id, ...changes }, { onConflict: 'id' });
	if (error) return json({ error: 'Your settings couldn’t be saved. Try again.' }, { status: 503 });
	// The name also lives on the account (the greeting and the admin read it there).
	if (body.displayName) {
		const { error: authError } = await locals.supabase.auth.updateUser({ data: { display_name: body.displayName } });
		if (authError) return json({ error: authError.message }, { status: 400 });
	}
	return json({ saved: true });
};
