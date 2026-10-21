import { describe, it, expect, vi, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { dailyLimit, practiceFetch } from './practice-fetch';

afterEach(() => { vi.unstubAllGlobals(); dailyLimit.set(null); });
const reply = (status: number, body: unknown) => vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

describe('practice requests', () => {
	it('say which daily limit is used up, and pass the response on', async () => {
		for (const [error, limit] of [['Daily voice limit reached', 'voice'], ['Daily practice limit reached', 'practice'], ['Daily AI limit reached', 'lesson']] as const) {
			dailyLimit.set(null);
			vi.stubGlobal('fetch', reply(429, { error }));
			expect((await practiceFetch('/api/english/quick-fire')).status).toBe(429);
			expect(get(dailyLimit)).toBe(limit);
		}
	});
	it('leave a per-minute limit and other answers to the module', async () => {
		vi.stubGlobal('fetch', reply(429, { error: 'Too many requests' }));
		await practiceFetch('/x');
		vi.stubGlobal('fetch', reply(200, { transcript: 'Hi' }));
		expect(await (await practiceFetch('/x')).json()).toEqual({ transcript: 'Hi' });
		expect(get(dailyLimit)).toBeNull();
	});
});
