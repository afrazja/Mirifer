import { describe, it, expect, vi, beforeEach } from 'vitest';

const { env, askChain } = vi.hoisted(() => ({ env: {} as Record<string, string | undefined>, askChain: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env }));
vi.mock('$lib/server/english-ai', async importOriginal => ({ ...(await importOriginal<object>()), askChain }));

import { POST } from './+server';
import { EMPTY_PROGRESS, recordSession } from '$lib/practice/english-progress';

const yesterday = () => new Date(Date.now() - 26 * 3_600_000).toISOString();
function fixture(body: unknown, progress: unknown = { ...recordSession(EMPTY_PROGRESS, 'day-1', [{ skill: 'listening', correct: 9, total: 10 }]), lastCompletedAt: yesterday() }) {
	const user = { id: 'u1', email: 'a@b.c', user_metadata: { target_language: 'en', display_name: 'Sam', english_progress_v1: progress, english_profile_v1: { reason: 'work', comfort: 'simple', minutes: 15, skipped: false, completedAt: '2026-10-01T10:00:00.000Z' } } };
	const count = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnThis(), gte: vi.fn().mockResolvedValue({ count: 0, error: null }) });
	const from = vi.fn().mockImplementation(() => ({ select: () => ({ eq: () => ({ eq: () => ({ gte: () => Promise.resolve({ count: 0, error: null }) }) }) }), insert: () => Promise.resolve({ error: null }) }));
	const supabase = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) }, from };
	void count;
	const request = new Request('https://mirifer.test/api/english/greeting', { method: 'POST', headers: { origin: 'https://mirifer.test', 'content-type': 'application/json' }, body: JSON.stringify(body) });
	return { event: { request, locals: { supabase } } as any, supabase };
}

beforeEach(() => { for (const key of Object.keys(env)) delete env[key]; env.OPENAI_API_KEY = 'k'; askChain.mockReset(); });

describe('/api/english/greeting', () => {
	it('writes an opening that passes the checks', async () => {
		askChain.mockResolvedValueOnce({ line: 'Welcome back, Sam. Today is about travel problems. Has anything ever gone wrong on a trip?', lineFa: 'خوش برگشتی سام.' });
		const response = await POST(fixture({ kind: 'open', timeZone: 'UTC' }).event);
		expect(await response.json()).toEqual({ line: 'Welcome back, Sam. Today is about travel problems. Has anything ever gone wrong on a trip?', lineFa: 'خوش برگشتی سام.' });
		const sent = askChain.mock.calls[0][0];
		expect(sent.user).toContain('"name":"Sam"'); expect(sent.user).not.toMatch(/\b9\b|10/);
	});
	it('retries a bad line once, then gives up so the browser uses its script', async () => {
		askChain.mockResolvedValue({ line: 'Hi Sam. How are you? What did you do today?', lineFa: null });
		const response = await POST(fixture({ kind: 'open', timeZone: 'UTC' }).event);
		expect(response.status).toBe(502); expect(askChain).toHaveBeenCalledTimes(2);
		expect(askChain.mock.calls[1][0].user).toMatch(/could not be used because it must contain exactly one question mark/);
	});
	it('replies once and returns only a real fix', async () => {
		askChain.mockResolvedValueOnce({ line: 'Oh no, your bag didn’t arrive. Let’s practise that today.', lineFa: null, improved: 'My bag didn’t arrive.', noteEn: 'Past tense with did.', noteFa: 'گذشته' });
		const response = await POST(fixture({ kind: 'reply', timeZone: 'UTC', opening: 'Has anything gone wrong on a trip?', answer: 'My bag not arrive' }).event);
		expect(await response.json()).toMatchObject({ line: 'Oh no, your bag didn’t arrive. Let’s practise that today.', improved: 'My bag didn’t arrive.', noteFa: 'گذشته' });
		expect(askChain.mock.calls[0][0].user).toContain('<answer>My bag not arrive</answer>');
	});
	it('leaves Day 1 and same-day sessions to the script, without spending allowance', async () => {
		const first = fixture({ kind: 'open', timeZone: 'UTC' }, EMPTY_PROGRESS);
		expect((await POST(first.event)).status).toBe(409);
		const sameDay = fixture({ kind: 'open', timeZone: 'UTC' }, { ...EMPTY_PROGRESS, sessionsCompleted: 1, lastCompletedAt: new Date().toISOString() });
		expect((await POST(sameDay.event)).status).toBe(409);
		expect(first.supabase.from).not.toHaveBeenCalled(); expect(askChain).not.toHaveBeenCalled();
	});
	it('rejects bad input and other sites', async () => {
		expect((await POST(fixture({ kind: 'reply', timeZone: 'UTC', opening: 'Q?', answer: 'x'.repeat(301) }).event)).status).toBe(400);
		expect((await POST(fixture({ kind: 'open' }).event)).status).toBe(400);
		const f = fixture({ kind: 'open', timeZone: 'UTC' });
		f.event.request = new Request('https://mirifer.test/api/english/greeting', { method: 'POST', headers: { origin: 'https://evil.test' }, body: '{}' });
		expect((await POST(f.event)).status).toBe(403);
	});
});
