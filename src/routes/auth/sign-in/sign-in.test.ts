import { describe, it, expect, vi } from 'vitest';
import { POST } from './+server';

let ip = 0;
function event(body: unknown, signIn = vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'a@b.com' } }, error: null })) {
	const upsert = vi.fn().mockResolvedValue({ error: null });
	const address = `10.0.0.${++ip}`;
	return { signIn, upsert, event: { request: new Request('https://m.test/auth/sign-in', { method: 'POST', body: JSON.stringify(body) }), url: new URL('https://m.test/auth/sign-in'), getClientAddress: () => address, locals: { supabase: { auth: { signInWithPassword: signIn }, from: () => ({ upsert }) } } } as any };
}

describe('server sign-in (the fallback for a filtered connection)', () => {
	it('signs in with Supabase on the server and returns the user', async () => {
		const f = event({ email: 'a@b.com', password: 'pw' });
		const response = await POST(f.event);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ user: { id: 'u1', email: 'a@b.com' } });
		expect(f.signIn).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' });
		expect(f.upsert).toHaveBeenCalled();
	});
	it('passes on a wrong password, and refuses a bad request', async () => {
		const wrong = event({ email: 'a@b.com', password: 'x' }, vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Invalid login credentials' } }));
		const response = await POST(wrong.event);
		expect(response.status).toBe(400);
		expect(await response.json()).toEqual({ error: 'Invalid login credentials' });
		expect((await POST(event({ email: 'not-an-email', password: 'x' }).event)).status).toBe(400);
		expect((await POST(event({ email: 'a@b.com', password: 'x', extra: 1 }).event)).status).toBe(400);
	});
	it('refuses a request from another site', async () => {
		const f = event({ email: 'a@b.com', password: 'pw' });
		f.event.request = new Request('https://m.test/auth/sign-in', { method: 'POST', headers: { origin: 'https://evil.test' }, body: JSON.stringify({ email: 'a@b.com', password: 'pw' }) });
		f.event.url = new URL('https://m.test/auth/sign-in');
		expect((await POST(f.event)).status).toBe(403);
		expect(f.signIn).not.toHaveBeenCalled();
	});
	it('limits tries per email', async () => {
		let last = 200;
		for (let i = 0; i < 9; i++) last = (await POST(event({ email: 'many@b.com', password: 'x' }).event)).status;
		expect(last).toBe(429);
	});
});
