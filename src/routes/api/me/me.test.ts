import { describe, it, expect, vi } from 'vitest';
import { GET, PATCH } from './+server';
import { POST as upload, DELETE as remove } from './avatar/+server';

function supabase(row: Record<string, unknown> | null) {
	const upsert = vi.fn().mockResolvedValue({ error: null });
	const update = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ error: null }) }));
	const query: any = { select: () => query, eq: () => query, maybeSingle: vi.fn().mockResolvedValue({ data: row, error: null }), upsert, update };
	const bucket = { upload: vi.fn().mockResolvedValue({ error: null }), getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.test/avatars/u1/avatar.png' } }), list: vi.fn().mockResolvedValue({ data: [{ name: 'avatar.png' }] }), remove: vi.fn().mockResolvedValue({ error: null }) };
	return { upsert, update, bucket, client: { from: () => query, auth: { updateUser: vi.fn().mockResolvedValue({ error: null }) }, storage: { from: () => bucket } } };
}
const user = { id: 'u1', user_metadata: { full_name: 'Sara Ahmadi' } };
const request = (method: string, body?: BodyInit, origin?: string, type = 'application/json') =>
	new Request('https://m.test/api/me', { method, body, headers: { ...(origin ? { origin } : {}), ...(typeof body === 'string' ? { 'content-type': type } : {}) } });
const url = new URL('https://m.test/api/me');

describe('the learner’s own settings, through our server', () => {
	it('reads the profile, and creates it (with the account’s name) the first time', async () => {
		const found = supabase({ display_name: 'Sara', language: 'fa', voice_speed: 1.1, avatar_url: null });
		expect(await (await GET({ locals: { user, supabase: found.client } } as any)).json()).toEqual({ language: 'fa', voiceSpeed: 1.1, displayName: 'Sara', avatarUrl: null });
		const missing = supabase(null);
		expect(await (await GET({ locals: { user, supabase: missing.client } } as any)).json()).toMatchObject({ displayName: 'Sara Ahmadi', language: null });
		expect(missing.upsert).toHaveBeenCalledWith({ id: 'u1', display_name: 'Sara Ahmadi' }, { onConflict: 'id' });
		expect((await GET({ locals: { user: null, supabase: found.client } } as any)).status).toBe(401);
	});
	it('saves the language, voice speed and name (the name on the account too)', async () => {
		const s = supabase(null);
		const response = await PATCH({ request: request('PATCH', JSON.stringify({ language: 'fa', voiceSpeed: 1.2, displayName: 'Sara' })), url, locals: { user, supabase: s.client } } as any);
		expect(response.status).toBe(200);
		expect(s.upsert).toHaveBeenCalledWith(expect.objectContaining({ id: 'u1', language: 'fa', voice_speed: 1.2, display_name: 'Sara' }), { onConflict: 'id' });
		expect(s.client.auth.updateUser).toHaveBeenCalledWith({ data: { display_name: 'Sara' } });
	});
	it('refuses bad values and other sites', async () => {
		const s = supabase(null);
		expect((await PATCH({ request: request('PATCH', JSON.stringify({ language: 'de' })), url, locals: { user, supabase: s.client } } as any)).status).toBe(400);
		expect((await PATCH({ request: request('PATCH', JSON.stringify({ language: 'fa' }), 'https://evil.test'), url, locals: { user, supabase: s.client } } as any)).status).toBe(403);
	});
	it('uploads and removes the photo in the learner’s own folder', async () => {
		const s = supabase(null);
		const form = new FormData();
		form.set('file', new File([new Uint8Array(10)], 'me.png', { type: 'image/png' }));
		const response = await upload({ request: { headers: new Headers(), formData: async () => form }, url, locals: { user, supabase: s.client } } as any);
		expect((await response.json()).url).toMatch(/^https:\/\/cdn\.test\/avatars\/u1\/avatar\.png\?t=\d+$/);
		expect(s.bucket.upload).toHaveBeenCalledWith('u1/avatar.png', expect.any(File), { upsert: true, contentType: 'image/png' });
		const bad = new FormData();
		bad.set('file', new File([new Uint8Array(10)], 'me.txt', { type: 'text/plain' }));
		expect((await upload({ request: { headers: new Headers(), formData: async () => bad }, url, locals: { user, supabase: s.client } } as any)).status).toBe(400);
		expect((await remove({ request: new Request('https://m.test/api/me/avatar', { method: 'DELETE' }), url, locals: { user, supabase: s.client } } as any)).status).toBe(200);
		expect(s.bucket.remove).toHaveBeenCalledWith(['u1/avatar.png']);
	});
});
