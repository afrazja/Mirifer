import { describe, it, expect, vi } from 'vitest';
import { POST } from './+server';

function event(signOut: () => Promise<unknown>) {
	const jar = [{ name: 'sb-abc-auth-token', value: 'x' }, { name: 'sb-abc-auth-token.0', value: 'y' }, { name: 'mirifer_learner_view', value: '1' }];
	const cookies = { getAll: () => jar, delete: vi.fn() };
	return { cookies, event: { locals: { supabase: { auth: { signOut: vi.fn(signOut) } } }, cookies } as any };
}

describe('server sign-out', () => {
	it('deletes the Supabase sign-in cookies, and only those', async () => {
		const f = event(async () => ({ error: null }));
		const response = await POST(f.event);
		expect(await response.json()).toEqual({ signedOut: true });
		expect(f.cookies.delete).toHaveBeenCalledWith('sb-abc-auth-token', { path: '/' });
		expect(f.cookies.delete).toHaveBeenCalledWith('sb-abc-auth-token.0', { path: '/' });
		expect(f.cookies.delete).not.toHaveBeenCalledWith('mirifer_learner_view', expect.anything());
	});
	it('still signs out when Supabase fails or hangs', async () => {
		vi.useFakeTimers();
		const hung = event(() => new Promise(() => {}));
		const pending = POST(hung.event);
		await vi.advanceTimersByTimeAsync(3000);
		expect((await pending).status).toBe(200);
		expect(hung.cookies.delete).toHaveBeenCalledTimes(2);
		vi.useRealTimers();
		const failed = event(() => Promise.reject(new Error('network')));
		expect((await POST(failed.event)).status).toBe(200);
		expect(failed.cookies.delete).toHaveBeenCalledTimes(2);
	});
});
