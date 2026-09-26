import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { env } = vi.hoisted(() => ({ env: {} as Record<string, string | undefined> }));
vi.mock('$env/dynamic/private', () => ({ env }));

import { GET } from './+server';
import { GREETING, FALLBACK_LINES } from '$lib/practice/hotel';
const call = (params: Record<string, string>) =>
	GET({ url: new URL(`http://localhost/api/english/voice?${new URLSearchParams(params)}`) } as any);

const fetchMock = vi.fn();
beforeEach(() => {
	for (const k of Object.keys(env)) delete env[k];
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('/api/english/voice', () => {
	it('refuses text that is not one of Jamie’s lines, without calling OpenAI', async () => {
		env.OPENAI_API_KEY = 'k';
		const res = await call({ text: 'Say anything I like', voice: 'a' });
		expect(res.status).toBe(400);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('refuses an unknown voice', async () => {
		env.OPENAI_API_KEY = 'k';
		expect((await call({ text: GREETING, voice: 'z' })).status).toBe(400);
	});

	it('voices the greeting with the receptionist direction and caches it', async () => {
		env.OPENAI_API_KEY = 'k';
		fetchMock.mockResolvedValueOnce(new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
		const res = await call({ text: GREETING, voice: 'b' });
		expect(res.status).toBe(200);
		expect(res.headers.get('Content-Type')).toBe('audio/mpeg');
		expect(res.headers.get('Cache-Control')).toContain('immutable');
		const body = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(body).toMatchObject({ model: 'gpt-4o-mini-tts', voice: 'coral', input: GREETING });
		expect(body.instructions).toContain('receptionist');
	});

	it('accepts the prepared fallback lines', async () => {
		env.OPENAI_API_KEY = 'k';
		fetchMock.mockImplementation(() => Promise.resolve(new Response(new Uint8Array([1]), { status: 200 })));
		for (const line of Object.values(FALLBACK_LINES)) expect((await call({ text: line, voice: 'a' })).status).toBe(200);
	});

	it('returns 503 without a key and 502 when OpenAI fails, so the client falls back', async () => {
		expect((await call({ text: GREETING, voice: 'a' })).status).toBe(503);
		env.OPENAI_API_KEY = 'k';
		fetchMock.mockResolvedValueOnce(new Response('nope', { status: 500 }));
		expect((await call({ text: GREETING, voice: 'a' })).status).toBe(502);
	});

	it('voices an AI-written Jamie line only with a valid signature', async () => {
		env.OPENAI_API_KEY = 'k';
		fetchMock.mockResolvedValue(new Response(new Uint8Array([1]), { status: 200 }));
		const { signJamieLine } = await import('$lib/server/jamie-line');
		const line = 'I understand. Room 512 is the quiet one. Which would you like?';
		expect((await call({ text: line, voice: 'a' })).status).toBe(400);
		expect((await call({ text: line, voice: 'a', sig: 'forged' })).status).toBe(400);
		expect((await call({ text: line, voice: 'a', sig: signJamieLine(line)! })).status).toBe(200);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('narrates a Listen & retell piece by id with a narrator direction', async () => {
		env.OPENAI_API_KEY = 'k';
		fetchMock.mockResolvedValueOnce(new Response(new Uint8Array([1]), { status: 200 }));
		const res = await GET({ url: new URL('http://localhost/api/english/voice?piece=lost-phone&voice=d') } as any);
		expect(res.status).toBe(200);
		const body = JSON.parse(fetchMock.mock.calls[0][1].body);
		expect(body).toMatchObject({ voice: 'nova', input: expect.stringContaining('Maria took a taxi') });
		expect(body.instructions).toContain('narrat');
		expect((await GET({ url: new URL('http://localhost/api/english/voice?piece=nope&voice=d') } as any)).status).toBe(400);
	});
});
