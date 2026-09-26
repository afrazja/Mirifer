import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { env } = vi.hoisted(() => ({ env: {} as Record<string, string | undefined> }));
vi.mock('$env/dynamic/private', () => ({ env }));

import { POST } from './+server';
import { verifyJamieLine } from '$lib/server/jamie-line';

const fetchMock = vi.fn();
const TRANSCRIPT = 'Maria take a taxi from the airport and she sleep. At home her phone was not there. The driver find it under the seat and bring it back and he want only coffee.';

function fixture({ piece = 'lost-phone', seconds = '48', audio = new Blob([new Uint8Array(2000)], { type: 'audio/webm' }) as Blob | string, count = 0, metadata = {} as Record<string, unknown> } = {}) {
	const insert = vi.fn().mockResolvedValue({ error: null });
	const query: any = { select: () => query, eq: () => query, gte: () => Promise.resolve({ count, error: null }), maybeSingle: () => Promise.resolve({ data: { is_admin: false }, error: null }), insert };
	const updateUser = vi.fn().mockResolvedValue({ error: null });
	const supabase = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', user_metadata: { target_language: 'en', ...metadata } } }, error: null }), updateUser }, from: vi.fn(() => query) };
	const body = new FormData();
	body.set('piece', piece); body.set('seconds', seconds); body.set('textShown', '0');
	if (typeof audio === 'string') body.set('audio', audio); else body.set('audio', audio, 'retell');
	// jsdom's FormData can't travel through Node's Request, so hand the parsed form over directly.
	const request = { url: 'http://localhost/api/english/retell', headers: new Headers({ Origin: 'http://localhost' }), formData: async () => body };
	return { event: { request, locals: { supabase } } as any, insert, updateUser };
}
const transcription = (text = TRANSCRIPT) => new Response(JSON.stringify({ text }), { status: 200 });
const feedback = (value: Record<string, unknown> = {}) => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
	covered: [1, 2, 4, 5, 9], inaccuracies: [{ said: 'she sleep at home', fact: 'She fell asleep in the taxi.' }],
	upgrades: [
		{ original: 'The driver find it under the seat and bring it back', better: 'The driver found it under the seat and brought it back to her.', whyEn: 'Use the past tense for a story.', whyFa: 'برای داستان از زمان گذشته استفاده کن.' },
		{ original: 'Something she never said', better: 'Something else.', whyEn: 'x', whyFa: 'y' }
	],
	feedbackEn: 'Good job covering the main events.', feedbackFa: 'آفرین.', ...value
}) } }] }), { status: 200 });

beforeEach(() => { for (const key of Object.keys(env)) delete env[key]; env.OPENAI_API_KEY = 'o'; fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());

describe('/api/english/retell', () => {
	it('transcribes the recording, checks it against the key points and saves the best score', async () => {
		fetchMock.mockResolvedValueOnce(transcription()).mockResolvedValueOnce(feedback());
		const f = fixture();
		const body = await (await POST(f.event)).json();
		expect(fetchMock.mock.calls[0][0]).toBe('https://api.openai.com/v1/audio/transcriptions');
		const upload = fetchMock.mock.calls[0][1].body as FormData;
		expect(upload.get('model')).toBe('gpt-4o-mini-transcribe');
		expect((upload.get('file') as File).name).toBe('retell.webm');
		expect(JSON.stringify(fetchMock.mock.calls[1][1].body)).toContain('Maria took a taxi home');
		expect(body).toMatchObject({ transcript: TRANSCRIPT, covered: [1, 2, 4, 5], total: 5, seconds: 48, feedback: { en: 'Good job covering the main events.' }, saved: true });
		expect(body.words).toBe(TRANSCRIPT.split(' ').length);
		expect(body.upgrades).toHaveLength(1);
		expect(verifyJamieLine(body.upgrades[0].better, body.upgrades[0].voiceSig)).toBe(true);
		expect(f.insert).toHaveBeenCalledOnce();
		expect(f.updateUser).toHaveBeenCalledWith({ data: { english_retell_v1: { 'lost-phone': { completedAt: expect.any(String), points: 4, total: 5, textShown: false } } } });
		expect(JSON.stringify(f.updateUser.mock.calls)).not.toContain('Maria');
	});

	it('keeps an earlier, better score', async () => {
		fetchMock.mockResolvedValueOnce(transcription()).mockResolvedValueOnce(feedback({ covered: [1] }));
		const f = fixture({ metadata: { english_retell_v1: { 'lost-phone': { completedAt: '2026-09-20T10:00:00.000Z', points: 5, total: 5, textShown: false } } } });
		expect((await (await POST(f.event)).json()).covered).toEqual([1]);
		expect(f.updateUser).not.toHaveBeenCalled();
	});

	it('skips feedback when almost nothing was said', async () => {
		fetchMock.mockResolvedValueOnce(transcription('Um.'));
		const body = await (await POST(fixture().event)).json();
		expect(body).toMatchObject({ words: 1, covered: [], feedback: null });
		expect(fetchMock).toHaveBeenCalledOnce();
	});

	it('still returns the transcript when feedback fails', async () => {
		fetchMock.mockResolvedValueOnce(transcription()).mockResolvedValueOnce(new Response('{}', { status: 500 }));
		expect(await (await POST(fixture().event)).json()).toMatchObject({ transcript: TRANSCRIPT, feedbackError: true });
	});

	it('rejects bad input before spending anything', async () => {
		for (const f of [fixture({ piece: 'nope' }), fixture({ audio: 'not a file' }), fixture({ audio: new Blob(['x'], { type: 'text/plain' }) }), fixture({ audio: new Blob([], { type: 'audio/webm' }) })]) {
			expect((await POST(f.event)).status).toBe(400);
			expect(f.insert).not.toHaveBeenCalled();
		}
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('respects the daily allowance and reports transcription failure', async () => {
		expect((await POST(fixture({ count: 40 }).event)).status).toBe(429);
		fetchMock.mockResolvedValueOnce(new Response('{}', { status: 500 }));
		expect((await POST(fixture().event)).status).toBe(502);
	});

	it('needs OpenAI for transcription', async () => {
		delete env.OPENAI_API_KEY; env.GEMINI_API_KEY = 'g';
		expect((await POST(fixture().event)).status).toBe(503);
	});
});
