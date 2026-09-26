import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const env: Record<string, string | undefined> = {};
vi.mock('$env/dynamic/private', () => ({ env }));
const fetchMock = vi.fn();

function fixture({ target = 'en', user = true, count = 0, stage = 'problem', utterance = 'The music kept me awake all night.', email = 'learner@example.com', isAdmin = false } = {}) {
	const insert = vi.fn().mockResolvedValue({ error: null });
	const query: any = { select: () => query, eq: () => query, gte: () => Promise.resolve({ count, error: null }), insert };
	const profileQuery: any = { select: () => profileQuery, eq: () => profileQuery, maybeSingle: () => Promise.resolve({ data: { is_admin: isAdmin }, error: null }) };
	const supabase = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: user ? { id: 'u1', email, email_confirmed_at: '2026-09-01T00:00:00Z', user_metadata: { target_language: target } } : null }, error: null }) }, from: vi.fn((table: string) => table === 'events' ? query : profileQuery) };
	const request = new Request('http://localhost/api/english/interpret', { method: 'POST', headers: { Origin: 'http://localhost' }, body: JSON.stringify({ stage, variant: 'lift', utterance }) });
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
	it('describes room choices by meaning, not only their sample phrase', async () => {
		env.OPENAI_API_KEY = 'o';
		fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ choiceId: null, related: true, improved: null, noteEn: null, noteFa: null }) } }] }), { status: 200 })));
		const { POST } = await import('./+server');
		expect(await (await POST(fixture({ stage: 'offer', utterance: "I'd prefer the courtyard-facing option so I can sleep." }).event)).json()).toEqual({ choiceId: 'quieter', correction: null });
		expect(await (await POST(fixture({ stage: 'offer', utterance: 'Does the courtyard-facing room have a window?' }).event)).json()).toEqual({ choiceId: 'related', correction: null });
		expect(JSON.stringify(fetchMock.mock.calls[0][1].body)).toContain('the courtyard-facing option');
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
		expect((await POST(fixture({ count: 18 }).event)).status).toBe(429);
		expect(fetchMock).not.toHaveBeenCalled();
	});
	it('gives verified admin testers a bounded allowance without raising the learner limit', async () => {
		Object.assign(env, { OPENAI_API_KEY: 'o', ADMIN_EMAIL: 'admin@example.com' });
		fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ choiceId: 'noise', related: true, improved: null, noteEn: null, noteFa: null }) } }] }), { status: 200 })));
		const { POST } = await import('./+server');
		const byEmail = fixture({ count: 18, email: 'admin@example.com' });
		expect((await POST(byEmail.event)).status).toBe(200);
		expect(byEmail.insert).toHaveBeenCalledOnce();
		const byProfile = fixture({ count: 18, isAdmin: true });
		expect((await POST(byProfile.event)).status).toBe(200);
		expect(byProfile.insert).toHaveBeenCalledOnce();
		const atAdminLimit = fixture({ count: 60, email: 'admin@example.com' });
		expect((await POST(atAdminLimit.event)).status).toBe(429);
		expect(atAdminLimit.insert).not.toHaveBeenCalled();
	});
	it('returns unavailable when configured providers fail', async () => {
		Object.assign(env, { GEMINI_API_KEY: 'g', DEEPSEEK_API_KEY: 'd' });
		fetchMock.mockResolvedValue(new Response('{}', { status: 500 }));
		const { POST } = await import('./+server');
		expect((await POST(fixture().event)).status).toBe(502);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
	it('lets Jamie answer a relevant reply in his own words, and signs the line for voicing', async () => {
		env.OPENAI_API_KEY = 'o';
		const line = 'I’m afraid I can’t show you the rooms right now, but room 512 is much quieter. Which one would you like?';
		fetchMock.mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ choiceId: null, related: true, improved: null, noteEn: null, noteFa: null, jamieReply: line }) } }] }), { status: 200 }));
		const { POST } = await import('./+server');
		const body = await (await POST(fixture({ stage: 'offer', utterance: 'I need to see them before I choose any' }).event)).json();
		expect(body).toMatchObject({ choiceId: 'related', correction: null, jamieReply: line });
		expect(typeof body.jamieSig).toBe('string');
		const { verifyJamieLine } = await import('$lib/server/jamie-line');
		expect(verifyJamieLine(line, body.jamieSig)).toBe(true);
		expect(verifyJamieLine('Something else?', body.jamieSig)).toBe(false);
		expect(JSON.stringify(fetchMock.mock.calls[0][1].body)).toContain('respond to what the guest actually said');
	});
	it('falls back to the authored line when Jamie’s reply invents facts or is too long', async () => {
		env.OPENAI_API_KEY = 'o';
		const bad = ['Room 640 is free tonight. Would you like it?', 'Room 512 costs $20 more. Which would you prefer?', 'Sure. ' + 'word '.repeat(40) + 'ok?', 'I can help you with that.'];
		for (const jamieReply of bad) fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ choiceId: null, related: true, improved: null, noteEn: null, noteFa: null, jamieReply }) } }] }), { status: 200 }));
		const { POST } = await import('./+server');
		for (const _ of bad) expect(await (await POST(fixture({ stage: 'offer' }).event)).json()).toEqual({ choiceId: 'related', correction: null });
	});
});
