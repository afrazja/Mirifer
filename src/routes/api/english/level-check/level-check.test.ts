import { describe, it, expect, vi, beforeEach } from 'vitest';
const { env, transcribeMock, askMock } = vi.hoisted(() => ({ env: {} as Record<string, string | undefined>, transcribeMock: vi.fn(), askMock: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env }));
vi.mock('$lib/server/transcribe', () => ({ transcribe: transcribeMock, transcriptionConfigured: () => !!env.OPENAI_API_KEY }));
vi.mock('$lib/server/english-ai', async original => ({ ...(await original<typeof import('$lib/server/english-ai')>()), askChain: askMock }));
import { POST } from './+server';
import { fakeEvents } from '../../../../test/english-events';

function fixture(form: FormData, count = 0) {
	const user = { id: `u${Math.random()}`, email: 'a@b.c', user_metadata: { target_language: 'en' } };
	const events = fakeEvents({ ai: count });
	const request = { url: 'https://m.test/api/english/level-check', headers: new Headers({ origin: 'https://m.test', 'content-type': 'multipart/form-data; boundary=x' }), formData: async () => form };
	return { events, event: { request, locals: { supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) }, from: events.from } } } as any };
}
function clip(fields: Record<string, string>, seconds = 4, size = 2000) {
	const f = new FormData(); f.set('audio', new File([new Uint8Array(size)], 'a.webm', { type: 'audio/webm' })); f.set('seconds', String(seconds));
	for (const [k, v] of Object.entries(fields)) f.set(k, v);
	return f;
}
const answer = async (form: FormData, count = 0) => (await POST(fixture(form, count).event)).json();
const LONG = 'I’m from Shiraz, but I’ve been living in Toronto for about two years now. I work as a nurse, which is pretty tiring, but I like it. Last weekend I didn’t do much, honestly. I just slept a lot and met a friend for coffee.';

beforeEach(() => { for (const k of Object.keys(env)) delete env[k]; env.OPENAI_API_KEY = 'k'; transcribeMock.mockReset(); askMock.mockReset(); });

describe('/api/english/level-check', () => {
	it('checks a repeated sentence without naming it to the transcriber, and returns only the result', async () => {
		transcribeMock.mockResolvedValue('My sister works in a hotel near the station.');
		expect(await answer(clip({ kind: 'repeat', index: '0' }))).toEqual({ passed: true });
		expect(transcribeMock.mock.calls[0][2]).not.toMatch(/sister|hotel/i);
		transcribeMock.mockResolvedValue('My sister');
		expect(await answer(clip({ kind: 'repeat', index: '0' }))).toEqual({ passed: false });
		transcribeMock.mockResolvedValue('Thank you.');
		expect(await answer(clip({ kind: 'repeat', index: '1' }))).toEqual({ passed: null });
	});
	it('rates the talk with the AI, transcribed without forcing English', async () => {
		transcribeMock.mockResolvedValue(LONG);
		askMock.mockResolvedValue({ english: true, memorised: false, band: 'natural', why: 'Connected story.' });
		expect(await answer(clip({ kind: 'talk' }, 30))).toEqual({ band: 'natural' });
		expect(transcribeMock.mock.calls[0][3]).toMatchObject({ anyLanguage: true });
		expect(askMock.mock.calls[0][0].temperature).toBe(0);
	});
	it('asks once more for Persian or a very short answer, then decides', async () => {
		transcribeMock.mockResolvedValue('من در تهران زندگی می‌کنم');
		expect(await answer(clip({ kind: 'talk' }, 10))).toEqual({ retry: 'persian' });
		expect(await answer(clip({ kind: 'talk', try: '2' }, 10))).toEqual({ band: 'hard' });
		transcribeMock.mockResolvedValue('Hello.');
		expect(await answer(clip({ kind: 'talk' }, 10))).toEqual({ retry: 'short' });
		expect(await answer(clip({ kind: 'talk', try: '2' }, 10))).toEqual({ band: null });
		transcribeMock.mockResolvedValue('I live in Tehran. I am teacher.');
		expect(await answer(clip({ kind: 'talk' }, 10))).toEqual({ band: 'hard' });
		expect(askMock).not.toHaveBeenCalled();
	});
	it('decides from the words alone when the AI fails or the day’s allowance is used up: never natural', async () => {
		transcribeMock.mockResolvedValue(LONG);
		askMock.mockResolvedValue(null);
		expect(await answer(clip({ kind: 'talk' }, 30))).toEqual({ band: 'simple' });
		askMock.mockClear();
		expect(await answer(clip({ kind: 'talk' }, 30), 40)).toEqual({ band: 'simple' });
		expect(askMock).not.toHaveBeenCalled();
	});
	it('refuses bad requests', async () => {
		expect((await POST(fixture(clip({ kind: 'nope' })).event)).status).toBe(400);
		expect((await POST(fixture(clip({ kind: 'repeat', index: '5' })).event)).status).toBe(400);
		expect((await POST(fixture(clip({ kind: 'repeat', index: '0' }, 20)).event)).status).toBe(400);
		expect((await POST(fixture(clip({ kind: 'talk' }, 30, 900_000)).event)).status).toBe(400);
		expect(transcribeMock).not.toHaveBeenCalled();
	});
});
