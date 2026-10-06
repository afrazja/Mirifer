import { describe, it, expect, vi, beforeEach } from 'vitest';
const { env, askChain, transcribeMock } = vi.hoisted(() => ({ env: {} as Record<string, string | undefined>, askChain: vi.fn(), transcribeMock: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env }));
vi.mock('$lib/server/english-ai', async importOriginal => ({ ...(await importOriginal<object>()), askChain }));
vi.mock('$lib/server/transcribe', () => ({ transcribe: transcribeMock, transcriptionConfigured: () => !!env.OPENAI_API_KEY }));
import { POST } from './+server';

const T = 'Last summer I go to airport in Istanbul and my bag not arrive so I was very worried and I talked to the woman at the desk and she helped me';
function fixture(body: BodyInit, type: string, count = 0) {
	const user = { id: 'u1', email: 'a@b.c', user_metadata: { target_language: 'en' } };
	const inserted: unknown[] = [];
	const from = vi.fn().mockImplementation(() => ({
		select: () => ({ eq: () => ({ eq: () => ({ gte: () => Promise.resolve({ count, error: null }) }), maybeSingle: () => Promise.resolve({ data: null }) }) }),
		insert: (row: unknown) => { inserted.push(row); return Promise.resolve({ error: null }); }
	}));
	// jsdom's FormData can't travel through Node's Request, so a multipart request hands the form over directly.
	const request = body instanceof FormData
		? { url: 'https://m.test/api/english/say-better', headers: new Headers({ origin: 'https://m.test', 'content-type': 'multipart/form-data; boundary=x' }), formData: async () => body }
		: new Request('https://m.test/api/english/say-better', { method: 'POST', headers: { origin: 'https://m.test', 'content-type': type }, body });
	return { inserted, event: { request, locals: { supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) }, from } } } as any };
}
const audioForm = (seconds = 30) => { const f = new FormData(); f.set('audio', new File([new Uint8Array(2000)], 'a.webm', { type: 'audio/webm' })); f.set('seconds', String(seconds)); return f; };

beforeEach(() => { for (const k of Object.keys(env)) delete env[k]; env.OPENAI_API_KEY = 'k'; askChain.mockReset(); transcribeMock.mockReset(); });

describe('/api/english/say-better', () => {
	it('transcribes a recording without spending allowance', async () => {
		transcribeMock.mockResolvedValue(T);
		const f = fixture(audioForm(), '');
		const res = await POST(f.event);
		expect(await res.json()).toEqual({ transcript: T });
		expect(f.inserted).toHaveLength(0);
	});
	it('refuses recordings over a minute and when the daily allowance is used up', async () => {
		expect((await POST(fixture(audioForm(80), '').event)).status).toBe(400);
		transcribeMock.mockResolvedValue(T);
		expect((await POST(fixture(audioForm(), '', 999).event)).status).toBe(429);
	});
	it('gives feedback and spends allowance only on success', async () => {
		askChain.mockResolvedValueOnce({ onTopic: true, fixes: [{ type: 'mistake', original: 'I go to airport', better: 'I went to the airport', whyEn: 'Past tense.', whyFa: 'گذشته.' }], better: T.replace('I go to airport', 'I went to the airport'), praiseEn: null, praiseFa: null });
		const f = fixture(JSON.stringify({ kind: 'feedback', transcript: T }), 'application/json');
		const body = await (await POST(f.event)).json();
		expect(body).toMatchObject({ case: 'mistakes', fixes: [{ better: 'I went to the airport' }] });
		expect(f.inserted).toHaveLength(1);
		expect(askChain.mock.calls[0][0].user).toContain('<answer>Last summer');
	});
	it('retries once, then fails without spending allowance', async () => {
		askChain.mockResolvedValue({ onTopic: true, fixes: [{ type: 'mistake', original: 'never said this', better: 'x y', whyEn: '', whyFa: '' }], better: 'x', praiseEn: null, praiseFa: null });
		const f = fixture(JSON.stringify({ kind: 'feedback', transcript: T }), 'application/json');
		expect((await POST(f.event)).status).toBe(502);
		expect(askChain).toHaveBeenCalledTimes(2); expect(f.inserted).toHaveLength(0);
	});
});
