import { describe, it, expect, vi, afterEach } from 'vitest';
import { canRecord, startRecording, stopActiveRecording, transcribeClip, type Recording } from './voice-clip';

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
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"error":"Daily voice limit reached"}', { status: 429 })));
		expect(await transcribeClip(clip, 'greeting')).toEqual({ error: 'limit' });
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"error":"Daily AI limit reached"}', { status: 429 })));
		expect(await transcribeClip(clip, 'greeting')).toEqual({ error: 'limit' });
		// Only too many in a minute: try again, not "used up".
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{"error":"Too many requests"}', { status: 429 })));
		expect(await transcribeClip(clip, 'greeting')).toEqual({ error: 'failed' });
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 502 })));
		expect(await transcribeClip(clip, 'greeting')).toEqual({ error: 'failed' });
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
		expect(await transcribeClip(clip, 'greeting')).toEqual({ error: 'failed' });
	});
});

/** A fake microphone and recorder (the test browser has neither). */
function fakeMic(options: { deny?: boolean } = {}) {
	const tracks = [{ stop: vi.fn(), onmute: null as null | (() => void), onended: null as null | (() => void) }];
	const stream = { getTracks: () => tracks, getAudioTracks: () => tracks };
	class FakeRecorder {
		static isTypeSupported = (type: string) => type === 'audio/webm;codecs=opus';
		state = 'inactive'; mimeType = 'audio/webm;codecs=opus';
		ondataavailable: ((e: { data: Blob }) => void) | null = null; onstop: (() => void) | null = null; onerror: (() => void) | null = null;
		start() { this.state = 'recording'; }
		stop() { this.state = 'inactive'; this.ondataavailable?.({ data: new Blob([new Uint8Array(500)], { type: this.mimeType }) }); this.onstop?.(); }
	}
	vi.stubGlobal('MediaRecorder', FakeRecorder);
	Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: options.deny ? vi.fn().mockRejectedValue(new Error('denied')) : vi.fn().mockResolvedValue(stream) } });
	return { tracks };
}

describe('recording a clip', () => {
	afterEach(() => { Reflect.deleteProperty(navigator, 'mediaDevices'); });
	const start = async () => (await startRecording('role-play')) as Recording;

	it('records until Stop, then gives the clip and closes the microphone', async () => {
		const { tracks } = fakeMic();
		expect(canRecord()).toBe(true);
		const recording = await start();
		recording.stop();
		const clip = await recording.done;
		expect(clip).toMatchObject({ seconds: 0 });
		expect((clip as { blob: Blob }).blob.size).toBe(500);
		expect(tracks[0].stop).toHaveBeenCalled();
	});
	it('gives nothing when cancelled', async () => {
		fakeMic();
		const recording = await start();
		recording.cancel();
		expect(await recording.done).toBeNull();
	});
	it('says the microphone is blocked when permission is refused', async () => {
		fakeMic({ deny: true });
		expect(await startRecording('greeting')).toBe('blocked');
	});
	it('stops, keeping what was said, when the app plays a voice, the phone locks or the page is hidden', async () => {
		const { tracks } = fakeMic();
		let recording = await start();
		stopActiveRecording();
		expect(await recording.done).not.toBeNull();

		recording = await start();
		tracks[0].onmute?.();
		expect(await recording.done).not.toBeNull();

		recording = await start();
		const hidden = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
		document.dispatchEvent(new Event('visibilitychange'));
		expect(await recording.done).not.toBeNull();
		hidden.mockRestore();
	});
	it('a new recording cancels one still running (one microphone)', async () => {
		fakeMic();
		const first = await start();
		const second = await start();
		expect(await first.done).toBeNull();
		second.stop();
		expect(await second.done).not.toBeNull();
	});
});
