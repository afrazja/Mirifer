import { describe, it, expect, vi, beforeEach } from 'vitest';
const { env, transcribeMock } = vi.hoisted(() => ({ env: {} as Record<string, string | undefined>, transcribeMock: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env }));
vi.mock('$lib/server/transcribe', () => ({ transcribe: transcribeMock, transcriptionConfigured: () => !!env.OPENAI_API_KEY }));
import { POST } from './+server';
import { CLIP_SECONDS, isClipUse } from '$lib/practice/voice-clip';

function fixture(form: FormData, count = 0, user: Record<string, unknown> | null = { id: 'u1', email: 'a@b.c', user_metadata: { target_language: 'en' } }, origin = 'https://m.test') {
	const inserted: unknown[] = [];
	const from = vi.fn().mockImplementation(() => ({
		select: () => ({ eq: () => ({ eq: () => ({ gte: () => Promise.resolve({ count, error: null }) }), maybeSingle: () => Promise.resolve({ data: null }) }) }),
		insert: (row: unknown) => { inserted.push(row); return Promise.resolve({ error: null }); }
	}));
	// jsdom's FormData can't travel through Node's Request, so the form is handed over directly.
	const request = { url: 'https://m.test/api/english/listen', headers: new Headers({ origin, 'content-type': 'multipart/form-data; boundary=x' }), formData: async () => form };
	return { inserted, event: { request, locals: { supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) }, from } } } as any };
}
const clip = (use: string | null = 'greeting', seconds = 4, size = 2000, type = 'audio/webm') => {
	const f = new FormData();
	f.set('audio', new File([new Uint8Array(size)], 'a.webm', { type })); f.set('seconds', String(seconds));
	if (use !== null) f.set('use', use);
	return f;
};

beforeEach(() => { for (const k of Object.keys(env)) delete env[k]; env.OPENAI_API_KEY = 'k'; env.GEMINI_API_KEY = 'g'; transcribeMock.mockReset(); });

describe('/api/english/listen', () => {
	it('turns a clip into text for each use, without spending allowance', async () => {
		transcribeMock.mockResolvedValue('I usually have coffee in the morning.');
		for (const use of ['greeting', 'role-play', 'say-again']) {
			const f = fixture(clip(use));
			expect(await (await POST(f.event)).json()).toEqual({ transcript: 'I usually have coffee in the morning.' });
			expect(f.inserted).toHaveLength(0);
		}
		expect(transcribeMock.mock.calls.map(call => call[1])).toEqual(['English greeting', 'English role-play', 'English say-again']);
	});
	it('refuses an unknown use, a clip that is too long, too large or not audio, and a used-up day', async () => {
		expect((await POST(fixture(clip('hotel')).event)).status).toBe(400);
		expect((await POST(fixture(clip(null)).event)).status).toBe(400);
		expect((await POST(fixture(clip('say-again', CLIP_SECONDS['say-again'] + 4)).event)).status).toBe(400);
		expect((await POST(fixture(clip('greeting', 4, 500_000)).event)).status).toBe(400);
		expect((await POST(fixture(clip('greeting', 4, 2000, 'text/plain')).event)).status).toBe(400);
		expect((await POST(fixture(clip(), 40).event)).status).toBe(429);
		expect(transcribeMock).not.toHaveBeenCalled();
	});
	it('needs a signed-in English learner on this site, and a configured transcriber', async () => {
		expect((await POST(fixture(clip(), 0, null).event)).status).toBe(401);
		expect((await POST(fixture(clip(), 0, undefined, 'https://evil.test').event)).status).toBe(403);
		delete env.OPENAI_API_KEY;
		expect((await POST(fixture(clip()).event)).status).toBe(503);
		expect(transcribeMock).not.toHaveBeenCalled();
	});
	it('reports a failed transcription', async () => {
		transcribeMock.mockResolvedValue(null);
		expect((await POST(fixture(clip()).event)).status).toBe(502);
	});
	it('knows its uses', () => {
		expect(isClipUse('role-play')).toBe(true);
		expect(isClipUse('free-talk')).toBe(false);
		expect(isClipUse(3)).toBe(false);
	});
});
