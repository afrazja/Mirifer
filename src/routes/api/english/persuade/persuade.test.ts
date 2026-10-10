import { describe, it, expect, vi, beforeEach } from 'vitest';
const { env, askChain, transcribeMock } = vi.hoisted(() => ({ env: {} as Record<string, string | undefined>, askChain: vi.fn(), transcribeMock: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env }));
vi.mock('$lib/server/english-ai', async importOriginal => ({ ...(await importOriginal<object>()), askChain }));
vi.mock('$lib/server/transcribe', () => ({ transcribe: transcribeMock, transcriptionConfigured: () => !!env.OPENAI_API_KEY }));
import { POST } from './+server';

const REASONS = 'I would take the studio because it is only five minutes from my work and it is cheaper.';
const ANSWER = 'Yes, it is noisy, but I can sleep with earplugs.';
function fixture(body: FormData | object, count = 0) {
	const user = { id: 'u1', email: 'a@b.c', user_metadata: { target_language: 'en' } };
	const inserted: unknown[] = [];
	const from = vi.fn().mockImplementation(() => ({
		select: () => ({ eq: () => ({ eq: () => ({ gte: () => Promise.resolve({ count, error: null }) }), maybeSingle: () => Promise.resolve({ data: null }) }) }),
		insert: (row: unknown) => { inserted.push(row); return Promise.resolve({ error: null }); }
	}));
	const request = body instanceof FormData
		? { url: 'https://m.test/api/english/persuade', headers: new Headers({ origin: 'https://m.test', 'content-type': 'multipart/form-data; boundary=x' }), formData: async () => body }
		: new Request('https://m.test/api/english/persuade', { method: 'POST', headers: { origin: 'https://m.test', 'content-type': 'application/json' }, body: JSON.stringify(body) });
	return { inserted, event: { request, locals: { supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) }, from } } } as any };
}
const audio = (seconds = 30) => { const f = new FormData(); f.set('audio', new File([new Uint8Array(2000)], 'a.webm', { type: 'audio/webm' })); f.set('seconds', String(seconds)); return f; };
const good = { reasons: [{ quote: 'only five minutes from my work', text: 'It is close to work.', fact: 'walk' }], verdict: 'answered', evidence: 'I can sleep with earplugs', switched: false, objectionEn: 'Good.', objectionFa: 'خوب.', phrases: [], praiseEn: null, praiseFa: null };

beforeEach(() => { for (const k of Object.keys(env)) delete env[k]; env.OPENAI_API_KEY = 'k'; askChain.mockReset(); transcribeMock.mockReset(); });

describe('/api/english/persuade', () => {
	it('transcribes a recording without spending allowance', async () => {
		transcribeMock.mockResolvedValue(REASONS);
		const f = fixture(audio());
		expect(await (await POST(f.event)).json()).toEqual({ transcript: REASONS });
		expect(f.inserted).toHaveLength(0);
	});
	it('gives feedback on the objection it works out itself, and spends allowance once', async () => {
		askChain.mockResolvedValue(good);
		const f = fixture({ kind: 'feedback', flat: 'a', reasons: REASONS, answer: ANSWER });
		const body = await (await POST(f.event)).json();
		expect(body.objection.verdict).toBe('answered');
		expect(askChain.mock.calls[0][0].system).toContain('noisy at night');
		expect(f.inserted).toHaveLength(1);
	});
	it('retries once when the evidence is not the learner’s words, then hides the verdict', async () => {
		askChain.mockResolvedValue({ ...good, evidence: 'something else entirely here' });
		const body = await (await POST(fixture({ kind: 'feedback', flat: 'a', reasons: REASONS, answer: ANSWER }).event)).json();
		expect(askChain).toHaveBeenCalledTimes(2);
		expect(body.objection).toBeNull();
	});
	it('refuses bad input and long recordings', async () => {
		expect((await POST(fixture({ kind: 'feedback', flat: 'c', reasons: 'x', answer: 'y' }).event)).status).toBe(400);
		expect((await POST(fixture(audio(200)).event)).status).toBe(400);
		askChain.mockResolvedValue(null);
		expect((await POST(fixture({ kind: 'feedback', flat: 'a', reasons: REASONS, answer: ANSWER }).event)).status).toBe(502);
	});
});
