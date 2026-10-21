import { describe, it, expect, vi, beforeEach } from 'vitest';
const { env, askChain, transcribeMock } = vi.hoisted(() => ({ env: {} as Record<string, string | undefined>, askChain: vi.fn(), transcribeMock: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env }));
vi.mock('$lib/server/english-ai', async importOriginal => ({ ...(await importOriginal<object>()), askChain }));
vi.mock('$lib/server/transcribe', () => ({ transcribe: transcribeMock, transcriptionConfigured: () => !!env.OPENAI_API_KEY }));
import { POST } from './+server';
import { fakeEvents } from '../../../../test/english-events';

const REASONS = 'I would take the studio because it is only five minutes from my work and it is cheaper.';
const ANSWER = 'Yes, it is noisy, but I can sleep with earplugs.';
function fixture(body: FormData | object, count = 0) {
	const user = { id: 'u1', email: 'owner@m.test', email_confirmed_at: '2026-01-01T00:00:00Z', user_metadata: { target_language: 'en' } };
	const events = fakeEvents({ ai: count });
	const from = events.from;
	const request = body instanceof FormData
		? { url: 'https://m.test/api/english/persuade', headers: new Headers({ origin: 'https://m.test', 'content-type': 'multipart/form-data; boundary=x' }), formData: async () => body }
		: new Request('https://m.test/api/english/persuade', { method: 'POST', headers: { origin: 'https://m.test', 'content-type': 'application/json' }, body: JSON.stringify(body) });
	return { get inserted() { return events.inserted.filter(row => row.event_name !== 'english_clip_transcribed'); }, clips: () => events.rows('english_clip_transcribed'), event: { request, locals: { supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) }, from } } } as any };
}
const audio = (seconds = 30) => { const f = new FormData(); f.set('audio', new File([new Uint8Array(2000)], 'a.webm', { type: 'audio/webm' })); f.set('seconds', String(seconds)); return f; };
const good = { reasons: [{ quote: 'only five minutes from my work', text: 'It is close to work.', fact: 'walk' }], verdict: 'answered', evidence: 'I can sleep with earplugs', switched: false, objectionEn: 'Good.', objectionFa: 'خوب.', phrases: [], praiseEn: null, praiseFa: null };

beforeEach(() => { for (const k of Object.keys(env)) delete env[k]; env.OPENAI_API_KEY = 'k'; env.ADMIN_EMAIL = 'owner@m.test'; askChain.mockReset(); transcribeMock.mockReset(); });

describe('/api/english/persuade', () => {
	it('is open to every English learner (it is in the daily lesson now)', async () => {
		env.ADMIN_EMAIL = 'someone-else@m.test';
		transcribeMock.mockResolvedValue(REASONS);
		expect((await POST(fixture(audio()).event)).status).toBe(200);
	});
	it('uses the day’s choice: Day 2’s train or taxi, with its own transcription hint and facts', async () => {
		transcribeMock.mockResolvedValue(REASONS);
		const f = audio(); f.set('set', 'd2-ride');
		await POST(fixture(f).event);
		expect(transcribeMock.mock.calls[0][2]).toContain('Airport Express train or a taxi');
		askChain.mockResolvedValue({ ...good, evidence: 'she can use the elevators', reasons: [] });
		const body = await (await POST(fixture({ kind: 'feedback', set: 'd2-ride', flat: 'a', reasons: 'The train is only nine dollars and it is fast, she is paying herself.', answer: 'That is true, but she can use the elevators at both stations.' }).event)).json();
		const system = askChain.mock.calls[0][0].system;
		expect(system).toContain('About $55, plus a tip');
		expect(system).toContain('Never suggest a tip amount');
		expect(system).not.toContain('apartment');
		expect(body.objection.verdict).toBe('answered');
		const bad = audio(); bad.set('set', 'nope');
		expect((await POST(fixture(bad).event)).status).toBe(400);
		expect((await POST(fixture({ kind: 'feedback', set: 'nope', flat: 'a', reasons: 'x', answer: 'y' }).event)).status).toBe(400);
	});
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
