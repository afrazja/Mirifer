import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchMe, patchMe, forgetMe } from './me';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); forgetMe(); });

describe('the learner’s settings through our server', () => {
	it('shares one read between callers', async () => {
		const server = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ language: 'fa' }) });
		vi.stubGlobal('fetch', server);
		const [a, b] = await Promise.all([fetchMe(), fetchMe()]);
		expect(a?.language).toBe('fa');
		expect(b?.language).toBe('fa');
		expect(server).toHaveBeenCalledTimes(1);
	});
	it('gives up after 5 s instead of waiting for ever', async () => {
		vi.useFakeTimers();
		vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
		const pending = fetchMe();
		await vi.advanceTimersByTimeAsync(5000);
		expect(await pending).toBeNull();
	});
	it('saves, and says when it couldn’t', async () => {
		const server = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
		vi.stubGlobal('fetch', server);
		await patchMe({ language: 'en' });
		expect(server).toHaveBeenCalledWith('/api/me', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ language: 'en' }) }));
		server.mockResolvedValue({ ok: false, json: async () => ({ error: 'Your settings couldn’t be saved. Try again.' }) });
		await expect(patchMe({ language: 'en' })).rejects.toThrow(/couldn’t be saved/);
	});
});
