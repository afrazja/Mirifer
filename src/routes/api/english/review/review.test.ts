import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { env } = vi.hoisted(() => ({ env: {} as Record<string, string | undefined> }));
vi.mock('$env/dynamic/private', () => ({ env }));

import { POST } from './+server';
import { signGoals, verifyJamieLine } from '$lib/server/jamie-line';
import { GOAL_IDS, GREETING } from '$lib/practice/hotel';

const fetchMock = vi.fn();
const TURNS = [
	{ speaker: 'reception', text: GREETING },
	{ speaker: 'learner', text: 'My room is very noisy, I can not sleep.' },
	{ speaker: 'reception', text: 'I’m sorry. Would you like to move?' },
	{ speaker: 'learner', text: 'Yes. I also go and pick up some of my stuff.' }
];
function fixture(body: Record<string, unknown> = {}, count = 0) {
	const insert = vi.fn().mockResolvedValue({ error: null });
	const query: any = { select: () => query, eq: () => query, gte: () => Promise.resolve({ count, error: null }), insert };
	const profileQuery: any = { select: () => profileQuery, eq: () => profileQuery, maybeSingle: () => Promise.resolve({ data: { is_admin: false }, error: null }) };
	const supabase = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', user_metadata: { target_language: 'en' } } }, error: null }) }, from: vi.fn((table: string) => table === 'events' ? query : profileQuery) };
	const request = new Request('http://localhost/api/english/review', { method: 'POST', headers: { Origin: 'http://localhost' }, body: JSON.stringify({ variant: 'lift', turns: TURNS, goals: GOAL_IDS, proof: signGoals('u1', 'lift', GOAL_IDS), ...body }) });
	return { event: { request, locals: { supabase } } as any, insert };
}
const openAi = (upgrades: unknown[]) => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ upgrades }) } }] }), { status: 200 });
const grab = { original: 'I also go and pick up some of my stuff.', better: 'Let me just go and grab a few things.', whyEn: '“Grab” is the everyday word here.', whyFa: '«grab» در گفت‌وگوی روزمره طبیعی‌تر است.' };

beforeEach(() => { for (const key of Object.keys(env)) delete env[key]; env.OPENAI_API_KEY = 'o'; fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());

describe('/api/english/review', () => {
	it('returns more natural versions of the learner’s own sentences, voiced and counted once', async () => {
		fetchMock.mockResolvedValue(openAi([grab, { original: 'My room is very noisy, I can not sleep.', better: 'My room’s really noisy and I can’t get to sleep.', whyEn: 'Contractions sound natural.', whyFa: 'شکل کوتاه طبیعی‌تر است.' }]));
		const f = fixture();
		const body = await (await POST(f.event)).json();
		expect(body.upgrades).toHaveLength(2);
		expect(body.upgrades[0]).toMatchObject({ original: grab.original, better: grab.better, why: { en: grab.whyEn, fa: grab.whyFa } });
		expect(verifyJamieLine(grab.better, body.upgrades[0].voiceSig)).toBe(true);
		expect(f.insert).toHaveBeenCalledOnce();
		expect(JSON.stringify(fetchMock.mock.calls[0][1].body)).toContain('Guest: Yes. I also go and pick up');
	});

	it('drops upgrades of things the learner never said, unchanged ones and duplicates', async () => {
		fetchMock.mockResolvedValue(openAi([
			{ ...grab, original: 'I would like a quieter room.' },
			{ ...grab, better: grab.original },
			grab, grab
		]));
		expect((await (await POST(fixture().event)).json()).upgrades).toHaveLength(1);
	});

	it('is only available once every goal is proven', async () => {
		const partial = ['problem', 'solution'] as const;
		expect((await POST(fixture({ goals: [...partial], proof: signGoals('u1', 'lift', [...partial]) }).event)).status).toBe(409);
		expect((await POST(fixture({ proof: 'forged' }).event)).status).toBe(409);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('respects the daily allowance and reports provider failure', async () => {
		expect((await POST(fixture({}, 40).event)).status).toBe(429);
		fetchMock.mockResolvedValue(new Response('{}', { status: 500 }));
		expect((await POST(fixture().event)).status).toBe(502);
	});
});
