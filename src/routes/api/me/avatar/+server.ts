import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { fromOurPages } from '$lib/server/auth-fallback';

/**
 * The learner's photo, through our server (see ../+server.ts): upload (POST, multipart `file`) and
 * remove (DELETE). Stored in the `avatars` bucket under the learner's own folder, as before.
 */
const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp' };

export const POST: RequestHandler = async ({ request, url, locals }) => {
	const refused = fromOurPages(request, url);
	if (refused) return refused;
	if (!locals.user) return json({ error: 'Not signed in' }, { status: 401 });
	let file: FormDataEntryValue | null;
	try { file = (await request.formData()).get('file'); } catch { return json({ error: 'No image' }, { status: 400 }); }
	if (!(file instanceof File) || !file.size) return json({ error: 'No image' }, { status: 400 });
	if (file.size > MAX_BYTES) return json({ error: 'Image must be less than 5MB' }, { status: 400 });
	const ext = EXT[file.type];
	if (!ext) return json({ error: 'Only JPG, PNG, GIF, or WebP images are allowed' }, { status: 400 });
	const path = `${locals.user.id}/avatar.${ext}`;
	const bucket = locals.supabase.storage.from('avatars');
	const { error } = await bucket.upload(path, file, { upsert: true, contentType: file.type });
	if (error) return json({ error: error.message }, { status: 400 });
	const url_ = bucket.getPublicUrl(path).data.publicUrl + '?t=' + Date.now();
	await locals.supabase.from('user_profiles').update({ avatar_url: url_, updated_at: new Date().toISOString() }).eq('id', locals.user.id);
	return json({ url: url_ });
};

export const DELETE: RequestHandler = async ({ request, url, locals }) => {
	const refused = fromOurPages(request, url);
	if (refused) return refused;
	if (!locals.user) return json({ error: 'Not signed in' }, { status: 401 });
	const bucket = locals.supabase.storage.from('avatars');
	const { data: files } = await bucket.list(locals.user.id);
	if (files?.length) await bucket.remove(files.map(f => `${locals.user!.id}/${f.name}`));
	const { error } = await locals.supabase.from('user_profiles').update({ avatar_url: null, updated_at: new Date().toISOString() }).eq('id', locals.user.id);
	if (error) return json({ error: error.message }, { status: 503 });
	return json({ removed: true });
};
