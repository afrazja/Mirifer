import { describe, it, expect, vi } from 'vitest';
import { createLimiter, verifiedUser } from './rate-limit';

describe('audio proxy limiter', () => {
	it('allows up to max in the window, then recovers', () => {
		const hit = createLimiter(2, 1000);
		expect(hit('a', 0)).toBe(true); expect(hit('a', 10)).toBe(true); expect(hit('a', 20)).toBe(false);
		expect(hit('b', 20)).toBe(true);
		expect(hit('a', 1500)).toBe(true);
	});
	it('treats a failed or missing auth lookup as signed out', async () => {
		const locals = (value: unknown) => ({ supabase: { auth: { getUser: value } } }) as any;
		expect(await verifiedUser(locals(vi.fn().mockResolvedValue({ data: { user: { id: 'u' } }, error: null })))).toMatchObject({ id: 'u' });
		expect(await verifiedUser(locals(vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('x') })))).toBeNull();
		expect(await verifiedUser(locals(vi.fn().mockRejectedValue(new Error('down'))))).toBeNull();
	});
});
