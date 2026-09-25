import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const env: Record<string, string | undefined> = {};
vi.mock('$env/dynamic/private', () => ({ env }));
const fetchMock = vi.fn();

function fixture({ target = 'en', user = true, count = 0, utterance = 'The music kept me awake all night.' } = {}) {
	const insert = vi.fn().mockResolvedValue({ error: null });
	const query: any = { select: () => query, eq: () => query, gte: () => Promise.resolve({ count, error: null }), insert };
	const supabase = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: user ? { id: 'u1', user_metadata: { target_language: target } } : null }, error: null }) }, from: vi.fn().mockReturnValue(query) };
	const request = new Request('http://localhost/api/english/interpret', { method: 'POST', headers: { Origin: 'http://localhost' }, body: JSON.stringify({ stage: 'problem', variant: 'lift', utterance }) });
	return { event: { request, locals: { supabase } } as any, insert };
}

beforeEach(() => { for (const key of Object.keys(env)) delete env[key]; fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());

describe('English hotel semantic checking', () => {
	it('uses Gemini first and accepts a meaningful reply with a correction', async () => {
		Object.assign(env, { GEMINI_API_KEY: 'g', DEEPSEEK_API_KEY: 'd' });
		fetchMock.mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ choiceId: 'noise', related: true, improved: 'The music kept me awake all night.', noteEn: 'Use “kept me awake” for a past problem.', noteFa: 'برای مشکل گذشته از «kept me awake» استفاده کن.' }) }] } }] }), { status: 200 }));
		const { POST } = await import('./+server'); const f = fixture({ utterance: 'The music keep me awake all night.' });
		const response = await POST(f.event);
		expect(await response.json()).toEqual({ choiceId: 'noise', correction: { improved: 'The music kept me awake all night.', note: { en: 'Use “kept me awake” for a past problem.', fa: 'برای مشکل گذشته از «kept me awake» استفاده کن.' } } });
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(f.insert).toHaveBeenCalledOnce();
		expect(JSON.stringify(f.insert.mock.calls[0][0])).not.toContain('music');
		expect(JSON.stringify(fetchMock.mock.calls[0][1].body)).toContain('meaning, not similarity');
		expect(JSON.stringify(fetchMock.mock.calls[0][1].body)).toContain('Do not omit a correction merely because the meaning is clear');
	});
	it('acknowledges a relevant reply outside the prepared choices without advancing', async () => {
		env.OPENAI_API_KEY = 'o';
		fetchMock.mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ choiceId: null, related: true, improved: null, noteEn: null, noteFa: null }) } }] }), { status: 200 }));
		const { POST } = await import('./+server');
		expect(await (await POST(fixture().event)).json()).toEqual({ choiceId: 'related', correction: null });
	});
	it('rejects model choices outside the current step and off-topic replies', async () => {
		env.OPENAI_API_KEY = 'o';
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ choiceId: 'accept', related: false, improved: null, noteEn: null, noteFa: null }) } }] }), { status: 200 }));
		fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ choiceId: null, related: false, improved: null, noteEn: null, noteFa: null }) } }] }), { status: 200 }));
		const { POST } = await import('./+server');
		expect(await (await POST(fixture().event)).json()).toEqual({ choiceId: null, correction: null });
		expect(await (await POST(fixture().event)).json()).toEqual({ choiceId: null, correction: null });
	});
	it('requires an English account, blocks clear conflicts, and enforces the daily limit', async () => {
		env.GEMINI_API_KEY = 'g'; const { POST } = await import('./+server');
		expect((await POST(fixture({ user: false }).event)).status).toBe(401);
		expect((await POST(fixture({ target: 'de' }).event)).status).toBe(409);
		expect(await (await POST(fixture({ utterance: 'My room is not noisy.' }).event)).json()).toEqual({ choiceId: null, correction: null });
		expect((await POST(fixture({ count: 12 }).event)).status).toBe(429);
		expect(fetchMock).not.toHaveBeenCalled();
	});
	it('returns unavailable when configured providers fail', async () => {
		Object.assign(env, { GEMINI_API_KEY: 'g', DEEPSEEK_API_KEY: 'd' });
		fetchMock.mockResolvedValue(new Response('{}', { status: 500 }));
		const { POST } = await import('./+server');
		expect((await POST(fixture().event)).status).toBe(502);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
