import { describe, it, expect, vi, afterEach } from 'vitest';
import { canRecord, startRecording, transcribeClip } from './voice-clip';

const clip = { blob: new Blob([new Uint8Array(10)], { type: 'audio/webm' }), seconds: 3 };
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('voice clips', () => {
	it('says when the browser cannot record (no MediaRecorder in the test browser)', async () => {
		expect(canRecord()).toBe(false);
		expect(await startRecording('greeting')).toBe('unsupported');
	});
	it('sends the clip with its use and returns the text', async () => {
		const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ transcript: 'Hello there.' }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);
		expect(await transcribeClip(clip, 'role-play')).toEqual({ transcript: 'Hello there.' });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe('/api/english/listen');
		const body = init.body as FormData;
		expect(body.get('use')).toBe('role-play'); expect(body.get('seconds')).toBe('3'); expect(body.get('audio')).toBeInstanceOf(Blob);
	});
	it('tells a used-up day apart from a failure', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 429 })));
		expect(await transcribeClip(clip, 'greeting')).toEqual({ error: 'limit' });
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 502 })));
		expect(await transcribeClip(clip, 'greeting')).toEqual({ error: 'failed' });
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
		expect(await transcribeClip(clip, 'greeting')).toEqual({ error: 'failed' });
	});
});
