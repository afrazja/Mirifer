import { describe, it, expect, vi, beforeEach } from 'vitest';
const { env, transcribeMock } = vi.hoisted(() => ({ env: {} as Record<string, string | undefined>, transcribeMock: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env }));
vi.mock('$lib/server/transcribe', () => ({ transcribe: transcribeMock, transcriptionConfigured: () => !!env.OPENAI_API_KEY }));
import { POST } from './+server';

function fixture(form: FormData, count = 0) {
	const user = { id: 'u1', email: 'a@b.c', user_metadata: { target_language: 'en' } };
	const inserted: unknown[] = [];
	const from = vi.fn().mockImplementation(() => ({
		select: () => ({ eq: () => ({ eq: () => ({ gte: () => Promise.resolve({ count, error: null }) }), maybeSingle: () => Promise.resolve({ data: null }) }) }),
		insert: (row: unknown) => { inserted.push(row); return Promise.resolve({ error: null }); }
	}));
	// jsdom's FormData can't travel through Node's Request, so the form is handed over directly.
	const request = { url: 'https://m.test/api/english/phrases', headers: new Headers({ origin: 'https://m.test', 'content-type': 'multipart/form-data; boundary=x' }), formData: async () => form };
	return { inserted, event: { request, locals: { supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) }, from } } } as any };
}
const clip = (seconds = 4, size = 2000, type = 'audio/webm') => { const f = new FormData(); f.set('audio', new File([new Uint8Array(size)], 'a.webm', { type })); f.set('seconds', String(seconds)); return f; };

beforeEach(() => { for (const k of Object.keys(env)) delete env[k]; env.OPENAI_API_KEY = 'k'; transcribeMock.mockReset(); });

describe('/api/english/phrases', () => {
	it('transcribes a short clip without spending allowance or naming the sentence', async () => {
		transcribeMock.mockResolvedValue('It turned out they had put it on the wrong flight.');
		const f = fixture(clip());
		expect(await (await POST(f.event)).json()).toEqual({ transcript: 'It turned out they had put it on the wrong flight.' });
		expect(transcribeMock.mock.calls[0][2]).not.toMatch(/turned|flight/i);
		expect(f.inserted).toHaveLength(0);
	});
	it('refuses long, large or non-audio clips, and when the day’s allowance is used up', async () => {
		expect((await POST(fixture(clip(20)).event)).status).toBe(400);
		expect((await POST(fixture(clip(4, 400_000)).event)).status).toBe(400);
		expect((await POST(fixture(clip(4, 2000, 'text/plain')).event)).status).toBe(400);
		expect((await POST(fixture(clip(), 40).event)).status).toBe(429);
		expect(transcribeMock).not.toHaveBeenCalled();
	});
	it('reports a failed transcription', async () => {
		transcribeMock.mockResolvedValue(null);
		expect((await POST(fixture(clip()).event)).status).toBe(502);
	});
});
