import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const env: Record<string, string | undefined> = {};
vi.mock('$env/dynamic/private', () => ({ env }));

const GOOD = {
	understood: true,
	reply: 'Wo arbeitest du?',
	replyEn: 'Where do you work?',
	replyFa: 'کجا کار می‌کنی؟',
	correction: null,
	note: null,
	noteFa: null,
	needsRepeat: false
};

const geminiBody = (reply: unknown) => ({
	candidates: [{ content: { parts: [{ text: JSON.stringify(reply) }] } }]
});
const chatBody = (reply: unknown) => ({ choices: [{ message: { content: JSON.stringify(reply) } }] });

function respond(status: number, body: unknown = {}) {
	return new Response(JSON.stringify(body), { status });
}

/** Supabase stub for the daily-cap COUNT query. */
function locals() {
	const q: any = {};
	q.from = () => q;
	q.select = () => q;
	q.eq = () => q;
	q.gte = () => Promise.resolve({ count: 0 });
	return { user: { id: 'u1' }, supabase: q };
}

function post(extra: Record<string, unknown> = {}) {
	return new Request('http://localhost/proxy/converse', {
		method: 'POST',
		body: JSON.stringify({
			scenario: 'At a café',
			history: [{ role: 'partner', text: 'Hallo! Was machst du?' }],
			utterance: 'Ich arbeite in ein Restaurant',
			...extra
		})
	});
}

async function load() {
	vi.resetModules();
	return import('./+server');
}

const fetchMock = vi.fn();

beforeEach(() => {
	for (const k of Object.keys(env)) delete env[k];
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('/proxy/converse provider chain', () => {
	it('answers from Gemini and never touches the paid providers', async () => {
		Object.assign(env, { GEMINI_API_KEY: 'g', DEEPSEEK_API_KEY: 'd', OPENAI_API_KEY: 'o' });
		fetchMock.mockResolvedValueOnce(respond(200, geminiBody(GOOD)));
		const { POST } = await load();

		const res = await POST({ request: post(), locals: locals() } as any);

		expect(res.status).toBe(200);
		expect(await res.json()).toEqual(GOOD);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(String(fetchMock.mock.calls[0][0])).toContain('generativelanguage.googleapis.com');
	});

	it('sends Gemini a response schema and opens the conversation on a user turn', async () => {
		env.GEMINI_API_KEY = 'g';
		fetchMock.mockResolvedValueOnce(respond(200, geminiBody(GOOD)));
		const { POST } = await load();

		await POST({ request: post(), locals: locals() } as any);

		const body = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(body.generationConfig.responseSchema.required).toContain('correction');
		expect(body.contents[0].role).toBe('user');
		expect(body.contents.at(-1)).toEqual({ role: 'user', parts: [{ text: 'Ich arbeite in ein Restaurant' }] });
	});

	it('falls through to DeepSeek when Gemini drops a key', async () => {
		Object.assign(env, { GEMINI_API_KEY: 'g', DEEPSEEK_API_KEY: 'd', OPENAI_API_KEY: 'o' });
		const { correction: _dropped, ...incomplete } = GOOD;
		fetchMock
			.mockResolvedValueOnce(respond(200, geminiBody(incomplete)))
			.mockResolvedValueOnce(respond(200, chatBody(GOOD)));
		const { POST } = await load();

		const res = await POST({ request: post(), locals: locals() } as any);

		expect(res.status).toBe(200);
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(String(fetchMock.mock.calls[1][0])).toContain('api.deepseek.com');
		const body = JSON.parse(fetchMock.mock.calls[1][1].body);
		expect(body.messages[0].content).toContain('RESPONSE FORMAT');
	});

	it('returns 503 when every configured key is refused', async () => {
		Object.assign(env, { GEMINI_API_KEY: 'g', OPENAI_API_KEY: 'o' });
		fetchMock.mockResolvedValueOnce(respond(403)).mockResolvedValueOnce(respond(401));
		const { POST, GET } = await load();

		const res = await POST({ request: post(), locals: locals() } as any);
		expect(res.status).toBe(503);

		// The refusal is remembered, so the card stays hidden without re-probing.
		const probe = await GET({} as any);
		expect(await probe.json()).toEqual({ available: false });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('returns 502 when a provider fails for a reason other than its key', async () => {
		Object.assign(env, { GEMINI_API_KEY: 'g', OPENAI_API_KEY: 'o' });
		fetchMock.mockResolvedValueOnce(respond(500)).mockResolvedValueOnce(respond(401));
		const { POST } = await load();

		const res = await POST({ request: post(), locals: locals() } as any);
		expect(res.status).toBe(502);
	});

	it('returns 503 with no keys at all', async () => {
		const { POST } = await load();
		const res = await POST({ request: post(), locals: locals() } as any);
		expect(res.status).toBe(503);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe('/proxy/converse availability probe', () => {
	it('is available when any configured key works', async () => {
		Object.assign(env, { GEMINI_API_KEY: 'g', OPENAI_API_KEY: 'o' });
		fetchMock.mockResolvedValueOnce(respond(401)).mockResolvedValueOnce(respond(200));
		const { GET } = await load();

		expect(await (await GET({} as any)).json()).toEqual({ available: true });
	});

	it('does not cache a result that rests on a network failure', async () => {
		env.GEMINI_API_KEY = 'g';
		fetchMock.mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(respond(401));
		const { GET } = await load();

		expect(await (await GET({} as any)).json()).toEqual({ available: true });
		// Second call probes again instead of reusing the wobble.
		expect(await (await GET({} as any)).json()).toEqual({ available: false });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});
