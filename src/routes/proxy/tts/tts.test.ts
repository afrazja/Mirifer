import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventEmitter } from 'node:events';

const { env, edge, user } = vi.hoisted(() => ({
	env: {} as Record<string, string | undefined>,
	/** How each Edge call goes, in order: 'ok' or 'fail' (a 403, as on 2026-11-12). */
	edge: { plan: [] as ('ok' | 'fail')[], voices: [] as string[] },
	user: { signedIn: true }
}));
vi.mock('$env/dynamic/private', () => ({ env }));
vi.mock('$lib/server/rate-limit', () => ({
	createLimiter: () => () => true,
	tooMany: () => new Response('', { status: 429 }),
	verifiedUser: async () => (user.signedIn ? { id: 'u1' } : null)
}));
vi.mock('msedge-tts', () => ({
	OUTPUT_FORMAT: { AUDIO_24KHZ_96KBITRATE_MONO_MP3: 'mp3' },
	MsEdgeTTS: class {
		voice = '';
		async setMetadata(voice: string) { this.voice = voice; edge.voices.push(voice); }
		toStream() {
			const audioStream = new EventEmitter();
			const outcome = edge.plan.shift() ?? 'fail';
			setTimeout(() => {
				if (outcome === 'ok') { audioStream.emit('data', new Uint8Array(500).fill(7)); audioStream.emit('end'); }
				else audioStream.emit('error', new Error('Unexpected server response: 403'));
			}, 0);
			return { audioStream };
		}
		close() {}
	}
}));
import { GET } from './+server';

const fetchMock = vi.fn();
const call = (voice: string, text = 'Listen for the three parts of her answer.') =>
	GET({ url: new URL(`https://www.mirifer.com/proxy/tts?q=${encodeURIComponent(text)}&tl=en&voice=${voice}&rate=1`), request: new Request('https://www.mirifer.com/proxy/tts'), locals: {}, getClientAddress: () => '1.2.3.4' } as any);

beforeEach(() => {
	for (const k of Object.keys(env)) delete env[k];
	env.ELEVENLABS_API_KEY = 'k';
	edge.plan = []; edge.voices = []; user.signedIn = true;
	fetchMock.mockReset();
	fetchMock.mockImplementation(async () => new Response(new Uint8Array(800), { status: 200 }));
	vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('/proxy/tts, English (Mira and the characters)', () => {
	it('uses Edge’s voice for the speaker, cached for good', async () => {
		edge.plan = ['ok'];
		const res = await call('b');
		expect(res.headers.get('X-TTS-Source')).toBe('edge');
		expect(res.headers.get('Cache-Control')).toContain('immutable');
		expect(edge.voices).toEqual(['en-US-AvaMultilingualNeural']);
		expect(fetchMock).not.toHaveBeenCalled();
	});
	it('tries Edge once more when it refuses', async () => {
		edge.plan = ['fail', 'ok'];
		const res = await call('b');
		expect(res.headers.get('X-TTS-Source')).toBe('edge');
		expect(edge.voices).toHaveLength(2);
	});
	it('falls back to a woman’s ElevenLabs voice for Mira, a man’s for the men, cached a day only', async () => {
		edge.plan = ['fail', 'fail'];
		const mira = await call('b');
		expect(mira.headers.get('X-TTS-Source')).toBe('elevenlabs');
		expect(mira.headers.get('Cache-Control')).toBe('public, max-age=86400');
		expect(String(fetchMock.mock.calls[0][0])).toContain('EXAVITQu4vr4xnSDxMaL'); // Sarah, female
		edge.plan = ['fail', 'fail'];
		await call('d');
		expect(String(fetchMock.mock.calls[1][0])).toContain('EXAVITQu4vr4xnSDxMaL');
		edge.plan = ['fail', 'fail'];
		await call('c');
		expect(String(fetchMock.mock.calls[2][0])).toContain('JBFqnCBsd6RMkjVDRZzb'); // George, male
	});
	it('never spends ElevenLabs credits for a signed-out visitor', async () => {
		edge.plan = ['fail', 'fail'];
		user.signedIn = false;
		await call('b');
		expect(fetchMock.mock.calls.some(([u]) => String(u).includes('elevenlabs'))).toBe(false);
	});
});
