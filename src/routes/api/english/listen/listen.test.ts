import { describe, it, expect, vi, beforeEach } from 'vitest';
const { env, transcribeMock } = vi.hoisted(() => ({ env: {} as Record<string, string | undefined>, transcribeMock: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env }));
vi.mock('$lib/server/transcribe', () => ({ transcribe: transcribeMock, transcriptionConfigured: () => !!env.OPENAI_API_KEY }));
import { POST } from './+server';
import { fakeEvents } from '../../../../test/english-events';
import { CLIP_SECONDS, isClipUse, maxClipBytes } from '$lib/practice/voice-clip';
import { MAX_DAILY_CLIPS } from '$lib/server/english-ai';

/** `count`: AI requests today; `clips`: clips today. */
function fixture(form: FormData, count = 0, user: Record<string, unknown> | null = { id: 'u1', email: 'a@b.c', user_metadata: { target_language: 'en' } }, origin = 'https://m.test', clips = 0) {
	const events = fakeEvents({ ai: count, clips });
	const from = events.from;
	// jsdom's FormData can't travel through Node's Request, so the form is handed over directly.
	const request = { url: 'https://m.test/api/english/listen', headers: new Headers({ origin, 'content-type': 'multipart/form-data; boundary=x' }), formData: async () => form };
	return { get inserted() { return events.inserted.filter(row => row.event_name !== 'english_clip_transcribed'); }, clips: () => events.rows('english_clip_transcribed'), event: { request, locals: { supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) }, from } } } as any };
}
const clip = (use: string | null = 'greeting', seconds = 4, size = 2000, type = 'audio/webm') => {
	const f = new FormData();
	f.set('audio', new File([new Uint8Array(size)], 'a.webm', { type })); f.set('seconds', String(seconds));
	if (use !== null) f.set('use', use);
	return f;
};

beforeEach(() => { for (const k of Object.keys(env)) delete env[k]; env.OPENAI_API_KEY = 'k'; env.GEMINI_API_KEY = 'g'; transcribeMock.mockReset(); });

describe('/api/english/listen', () => {
	it('turns a clip into text for each use, counting a clip but not an AI request', async () => {
		transcribeMock.mockResolvedValue('I usually have coffee in the morning.');
		for (const use of ['greeting', 'role-play', 'say-again']) {
			const f = fixture(clip(use));
			expect(await (await POST(f.event)).json()).toEqual({ transcript: 'I usually have coffee in the morning.' });
			// It counts one clip (and its audio) against the day's voice budget, not an AI request.
			expect(f.inserted).toEqual([]);
			expect(f.clips()).toEqual([expect.objectContaining({ metadata: { course: 'en', route: use, audio_seconds: 4 } })]);
		}
		expect(transcribeMock.mock.calls.map(call => call[1])).toEqual(['English greeting', 'English role-play', 'English say-again']);
	});
	it('refuses an unknown use, a clip that is too long, too large or not audio, and a used-up day', async () => {
		expect((await POST(fixture(clip('hotel')).event)).status).toBe(400);
		expect((await POST(fixture(clip(null)).event)).status).toBe(400);
		expect((await POST(fixture(clip('say-again', CLIP_SECONDS['say-again'] + 4)).event)).status).toBe(400);
		expect((await POST(fixture(clip('greeting', 4, maxClipBytes('greeting') + 1)).event)).status).toBe(400);
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
	it('stops at the day’s clip budget, without sending the clip', async () => {
		const f = fixture(clip(), 0, undefined, undefined, MAX_DAILY_CLIPS);
		const response = await POST(f.event);
		expect(response.status).toBe(429);
		expect(await response.json()).toEqual({ error: 'Daily voice limit reached' });
		expect(f.inserted).toHaveLength(0);
		expect(transcribeMock).not.toHaveBeenCalled();
	});
	it('takes a longer clip for a role-play than for "say it again"', async () => {
		transcribeMock.mockResolvedValue('ok');
		const big = maxClipBytes('say-again') + 1000;
		expect(big).toBeLessThan(maxClipBytes('role-play'));
		expect((await POST(fixture(clip('say-again', 4, big)).event)).status).toBe(400);
		expect((await POST(fixture(clip('role-play', 4, big)).event)).status).toBe(200);
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
