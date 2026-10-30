import { describe, it, expect, vi, beforeEach } from 'vitest';
const { env, askChain } = vi.hoisted(() => ({ env: {} as Record<string, string | undefined>, askChain: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env }));
vi.mock('$lib/server/english-ai', async importOriginal => ({ ...(await importOriginal<object>()), askChain }));
import { POST } from './+server';
import { fakeEvents } from '../../../../test/english-events';

/** A topic step's Quick chat on the path (mode 'path'): every English learner, the lesson AI allowance. */
function fixture(body: Record<string, unknown>, { email = 'someone@m.test', count = 0 } = {}) {
	const user = { id: 'u1', email, email_confirmed_at: '2026-01-01T00:00:00Z', user_metadata: { target_language: 'en' } };
	const events = fakeEvents({ ai: count });
	const request = new Request('https://m.test/api/english/quick-fire', { method: 'POST', headers: { origin: 'https://m.test', 'content-type': 'application/json' }, body: JSON.stringify(body) });
	return { events, event: { request, locals: { supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) }, from: events.from } } } as any };
}
const turn = (extra: Record<string, unknown> = {}) => ({ kind: 'turn', mode: 'path', topic: 'food', level: 'a2', last: false,
	turns: [{ question: 'What’s your favorite food, and why?', answer: 'I like rice because my mother cook it.' }], ...extra });
const reply = { onTopic: true, next: 'Do you cook rice at home?', fixed: 'I like rice because my mother cooks it.', better: 'I love rice, because my mother cooks it. [It tastes like home.]' };

beforeEach(() => { for (const k of Object.keys(env)) delete env[k]; env.OPENAI_API_KEY = 'k'; askChain.mockReset(); });

describe('/api/english/quick-fire, a topic step on the path', () => {
	it('is open to every learner, follows the topic and level, and records the AI outcome', async () => {
		askChain.mockImplementationOnce(async (req: any) => { req.onOutcome?.({ provider: 'gemini', firstFail: null, ms: 900 }); return reply; });
		const f = fixture(turn());
		const res = await POST(f.event);
		expect(res.status).toBe(200);
		expect(await res.json()).toEqual({ onTopic: true, next: reply.next, fixed: reply.fixed, better: reply.better });
		const system = askChain.mock.calls[0][0].system as string;
		expect(system).toContain('Food you love');
		expect(system).toMatch(/A2/);
		expect(system).toContain('(2 of 4)');
		expect(system).toMatch(/at most 10 words/);
		const outcome = f.events.rows('english_ai_outcome');
		expect(outcome).toHaveLength(1);
		expect(outcome[0].metadata).toMatchObject({ route: 'quick-chat', ai_result: 'ok', provider: 'gemini' });
	});
	it('says when a question failed its checks (a ready-made one is used)', async () => {
		askChain.mockResolvedValueOnce({ ...reply, next: 'Is religion important to you?' });
		const f = fixture(turn());
		expect((await (await POST(f.event)).json()).next).toBeNull();
		expect(f.events.rows('english_ai_outcome')[0].metadata).toMatchObject({ ai_result: 'fallback' });
	});
	it('a failed AI call still answers, and is recorded as failed', async () => {
		askChain.mockResolvedValueOnce(null);
		const f = fixture(turn({ level: 'b1', topic: 'weekend' }));
		expect(await (await POST(f.event)).json()).toEqual({ onTopic: true, next: null, fixed: null, better: null });
		expect(f.events.rows('english_ai_outcome')[0].metadata).toMatchObject({ ai_result: 'failed' });
	});
	it('refuses an unknown topic, too many turns, and a used-up allowance', async () => {
		expect((await POST(fixture(turn({ topic: 'politics' })).event)).status).toBe(400);
		const five = Array.from({ length: 5 }, (_, i) => ({ question: `Question number ${i}?`, answer: 'An answer.' }));
		expect((await POST(fixture(turn({ turns: five })).event)).status).toBe(400);
		expect((await POST(fixture(turn(), { count: 9_999 }).event)).status).toBe(429);
		expect(askChain).not.toHaveBeenCalled();
	});
	it('keeps the lab’s Quick-fire for the owner only', async () => {
		expect((await POST(fixture(turn({ mode: undefined })).event)).status).toBe(404);
	});
});
