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

describe('English hotel AI fallback', () => {
	it('uses Gemini first and returns only an authored choice', async () => {
		Object.assign(env, { GEMINI_API_KEY: 'g', DEEPSEEK_API_KEY: 'd' });
		fetchMock.mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify({ choiceId: 'noise', improved: null, noteEn: null, noteFa: null }) }] } }] }), { status: 200 }));
		const { POST } = await import('./+server'); const f = fixture();
		const response = await POST(f.event);
		expect(await response.json()).toEqual({ choiceId: 'noise', correction: null });
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(f.insert).toHaveBeenCalledOnce();
		expect(JSON.stringify(f.insert.mock.calls[0][0])).not.toContain('music');
	});
	it('rejects model choices outside the current step', async () => {
		env.OPENAI_API_KEY = 'o';
		fetchMock.mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ choiceId: 'accept', improved: null, noteEn: null, noteFa: null }) } }] }), { status: 200 }));
		const { POST } = await import('./+server');
		expect(await (await POST(fixture().event)).json()).toEqual({ choiceId: null });
	});
	it('requires an English account, blocks clear conflicts, and enforces the daily limit', async () => {
		env.GEMINI_API_KEY = 'g'; const { POST } = await import('./+server');
		expect((await POST(fixture({ user: false }).event)).status).toBe(401);
		expect((await POST(fixture({ target: 'de' }).event)).status).toBe(409);
		expect(await (await POST(fixture({ utterance: 'My room is not noisy.' }).event)).json()).toEqual({ choiceId: null });
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
