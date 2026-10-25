import { describe, it, expect, vi } from 'vitest';
import { POST as signUp } from './sign-up/+server';
import { POST as reset } from './reset/+server';
import { POST as newPassword } from './new-password/+server';

let ip = 0;
function event(path: string, body: unknown, auth: Record<string, unknown>, user: unknown = null, origin?: string) {
	const address = `10.1.0.${++ip}`;
	return { request: new Request(`https://m.test${path}`, { method: 'POST', headers: origin ? { origin } : {}, body: JSON.stringify(body) }), url: new URL(`https://m.test${path}`), getClientAddress: () => address, locals: { user, supabase: { auth } } } as any;
}

describe('server fallbacks for sign-up, password reset and new password', () => {
	it('signs up with the same options as the browser, and says if it signed in', async () => {
		const call = vi.fn().mockResolvedValue({ data: { user: { id: 'n', email: 'a@b.com' }, session: null }, error: null });
		const response = await signUp(event('/auth/sign-up', { email: 'a@b.com', password: 'secret1', name: 'Ada' }, { signUp: call }));
		expect(await response.json()).toEqual({ user: { id: 'n', email: 'a@b.com' }, signedIn: false });
		expect(call).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret1', options: { data: { display_name: 'Ada' }, emailRedirectTo: 'https://m.test/proxy/auth/callback?next=/languages' } });
		expect((await signUp(event('/auth/sign-up', { email: 'a@b.com', password: '123' }, { signUp: call }))).status).toBe(400);
	});
	it('sends the reset email with the link back to the new-password page', async () => {
		const call = vi.fn().mockResolvedValue({ error: null });
		expect((await reset(event('/auth/reset', { email: 'a@b.com' }, { resetPasswordForEmail: call }))).status).toBe(200);
		expect(call).toHaveBeenCalledWith('a@b.com', { redirectTo: 'https://m.test/proxy/auth/callback?next=/reset-password' });
	});
	it('sets a new password only for a signed-in session (the reset link’s)', async () => {
		const call = vi.fn().mockResolvedValue({ error: null });
		expect((await newPassword(event('/auth/new-password', { password: 'secret1' }, { updateUser: call }))).status).toBe(401);
		expect((await newPassword(event('/auth/new-password', { password: 'secret1' }, { updateUser: call }, { id: 'u1' }))).status).toBe(200);
		expect(call).toHaveBeenCalledWith({ password: 'secret1' });
	});
	it('refuses requests from another site, and floods of email', async () => {
		const call = vi.fn().mockResolvedValue({ error: null });
		expect((await reset(event('/auth/reset', { email: 'a@b.com' }, { resetPasswordForEmail: call }, null, 'https://evil.test'))).status).toBe(403);
		let last = 200;
		for (let i = 0; i < 4; i++) last = (await reset(event('/auth/reset', { email: 'flood@b.com' }, { resetPasswordForEmail: call }))).status;
		expect(last).toBe(429);
	});
});
