import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { env } = vi.hoisted(() => ({ env: {} as Record<string, string | undefined> }));
vi.mock('$env/dynamic/private', () => ({ env }));

import { POST } from './+server';
import { POST as REVIEW } from './review/+server';
import { provenGoals, signGoals, verifyJamieLine } from '$lib/server/jamie-line';
import { BIRTHDAY_A2, BIRTHDAY_B1 } from '$lib/practice/chats';
import type { ChatLine } from '$lib/practice/group-chat';

const fetchMock = vi.fn();
const you = (text: string, voice = false) => ({ from: 'you', text, ...(voice ? { voice } : {}) });
const A2_START = [...BIRTHDAY_A2.opening('rosa'), you('I’m in!')];
const B1_START = [...BIRTHDAY_B1.opening('rosa'), you('Count me in!')];

function fixture(body: Record<string, unknown>, url = 'http://localhost/api/english/chat') {
	const insert = vi.fn().mockResolvedValue({ error: null });
	const query: any = { select: () => query, eq: () => query, gte: () => Promise.resolve({ count: 0, error: null }), insert };
	const profileQuery: any = { select: () => profileQuery, eq: () => profileQuery, maybeSingle: () => Promise.resolve({ data: { is_admin: false }, error: null }) };
	const supabase = { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: 'learner@example.com', user_metadata: { target_language: 'en', display_name: 'Ali Rezaei' } } }, error: null }) }, from: vi.fn((table: string) => table === 'events' ? query : profileQuery) };
	const request = new Request(url, { method: 'POST', headers: { Origin: 'http://localhost' }, body: JSON.stringify(body) });
	return { event: { request, locals: { supabase } } as any, insert };
}
const turn = (scene = BIRTHDAY_A2, messages: ChatLine[] = A2_START, extra: Record<string, unknown> = {}) =>
	fixture({ scene: scene.id, variant: 'rosa', messages, goals: [], proof: null, ...extra });
const openAi = (content: Record<string, unknown>) => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
	messages: [{ from: 'maya', text: 'Yay! What time on Saturday? 4 or 5?' }], goals: [], plan: { day: null, time: null, place: null }, close: false, ...content
}) } }] }), { status: 200 });
const respond = (content: Record<string, unknown>) => fetchMock.mockImplementation(() => Promise.resolve(openAi(content)));
const sent = (call = fetchMock.mock.calls.length - 1) => JSON.parse(fetchMock.mock.calls[call][1].body);

beforeEach(() => { for (const key of Object.keys(env)) delete env[key]; fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); env.OPENAI_API_KEY = 'o'; });
afterEach(() => vi.unstubAllGlobals());

describe('/api/english/chat', () => {
	it('plays the friends from the fact sheet, numbers the learner’s messages and signs the goals', async () => {
		respond({});
		const body = await (await POST(turn(BIRTHDAY_A2, [...A2_START.slice(0, -1), you('I’m in!', true)]).event)).json();
		expect(body).toMatchObject({ messages: [{ from: 'maya', text: 'Yay! What time on Saturday? 4 or 5?' }], goals: [], done: false, settled: false, quiet: 1 });
		const request = JSON.stringify(sent());
		expect(request).toContain('Rosa\'s, a small Italian restaurant on Elm Street');
		expect(request).toContain('You (1, voice note): I’m in!');
		expect(request).toContain('Ali');
		expect(request).not.toContain('Rezaei');
	});

	it('counts a goal only with the learner’s own words, and Leo reacts (A2)', async () => {
		respond({ goals: [{ id: 'time', msg: 2, quote: 'Saturday at 5 is good' }, { id: 'place', msg: 2, quote: 'Rosa’s' }] });
		const messages = [...A2_START, { from: 'maya', text: 'What time on Saturday? 4 or 5?' }, you('Saturday at 5 is good for me')];
		const body = await (await POST(turn(BIRTHDAY_A2, messages).event)).json();
		expect(body.goals).toEqual(['time']);
		expect(body.messages[0]).toEqual({ from: 'leo', text: 'Works for me! 👍' });
		expect(provenGoals('u1', 'rosa', body.goals, body.proof, ['time', 'place', 'task'], 'birthday-a2')).toEqual(['time']);
		expect(body.quiet).toBe(0);
	});

	it('keeps proven goals and ignores forged ones', async () => {
		respond({});
		const ok = await (await POST(turn(BIRTHDAY_A2, A2_START, { goals: ['time'], proof: signGoals('u1', 'rosa', ['time'], ['time', 'place', 'task'], 'birthday-a2') }).event)).json();
		expect(ok.goals).toEqual(['time']);
		const forged = await (await POST(turn(BIRTHDAY_A2, A2_START, { goals: ['time'], proof: 'forged' }).event)).json();
		expect(forged.goals).toEqual([]);
		// A proof from another scene doesn't carry over.
		const other = await (await POST(turn(BIRTHDAY_A2, A2_START, { goals: ['time'], proof: signGoals('u1', 'rosa', ['time'], ['time', 'place', 'task'], 'birthday-b1') }).event)).json();
		expect(other.goals).toEqual([]);
	});

	it('asks once for a rewrite, then uses a fallback line', async () => {
		const bad = [
			[{ from: 'maya', text: 'Where should we go?' }, { from: 'maya', text: 'And when?' }],
			[{ from: 'nina', text: 'hi guys' }],
			[{ from: 'maya', text: 'Rosa’s has great wine 🍷' }],
			[{ from: 'maya', text: 'It is $50 each. Ok?' }],
			[{ from: 'maya', text: 'It takes 45 minutes to get there' }],
			[{ from: 'maya', text: 'gonna be fun lol' }]
		];
		for (const messages of bad) {
			fetchMock.mockReset();
			fetchMock.mockResolvedValueOnce(openAi({ messages })).mockResolvedValueOnce(openAi({ messages }));
			const body = await (await POST(turn().event)).json();
			expect(body.messages, JSON.stringify(messages)).toEqual([BIRTHDAY_A2.fallback('rosa').time]);
			expect(JSON.stringify(sent(1))).toContain('could not be used because');
		}
	});

	it('the owner’s chat: a later time the learner suggests comes back in the friends’ answer', async () => {
		// "No let's do it a little later, how about after 7?" got the fallback, because Maya's "7" wasn't on the sheet.
		const messages = [...A2_START, { from: 'maya', text: 'Are you free Saturday at 4 or 5?' }, you("No let's do it a little later, how about after 7?")];
		respond({ messages: [{ from: 'maya', text: 'Sure! Saturday at 7:30?' }] });
		expect((await (await POST(turn(BIRTHDAY_A2, messages).event)).json()).messages).toEqual([{ from: 'maya', text: 'Sure! Saturday at 7:30?' }]);
		// A clock hour is fine even if nobody said it; another number is not.
		respond({ messages: [{ from: 'maya', text: 'Hmm, how about 8?' }] });
		expect((await (await POST(turn(BIRTHDAY_A2, messages).event)).json()).messages[0].text).toBe('Hmm, how about 8?');
	});

	it('takes a question before a reaction, and DeepSeek’s looser shapes', async () => {
		respond({ messages: [{ from: 'maya', text: 'Rosa’s or the park?' }, { from: 'maya', text: 'Nina loves both 😄' }] });
		expect((await (await POST(turn().event)).json()).messages).toHaveLength(2);
		// Numbers as text, and a goal in another shape, don't throw the friends' messages away.
		const messages = [...A2_START, { from: 'maya', text: 'What time on Saturday? 4 or 5?' }, you('5 is good')];
		fetchMock.mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
			messages: [{ from: 'maya', text: 'Great! Rosa’s or the park?' }], goals: [{ id: 'time', msg: '2', quote: '5 is good' }, { time: true }], plan: { day: 'sat', time: '17', place: null }, close: 'no'
		}) } }] }), { status: 200 })));
		const body = await (await POST(turn(BIRTHDAY_A2, messages).event)).json();
		expect(body.messages.at(-1)).toEqual({ from: 'maya', text: 'Great! Rosa’s or the park?' });
		expect(body.goals).toEqual(['time']);
	});

	it('B1: the twist comes when the plan clashes, and the time must be agreed again', async () => {
		const messages = [...B1_START, { from: 'maya', text: 'ok what time works for you on Sat? 4 or 5?' }, you('5 works for me, and let’s do the park')];
		respond({
			messages: [{ from: 'maya', text: 'yesss 🙌' }, { from: 'maya', text: 'ok who does what?' }],
			goals: [{ id: 'time', msg: 2, quote: '5 works for me' }, { id: 'place', msg: 2, quote: 'let’s do the park' }],
			plan: { day: 'sat', time: 17, place: 'park' }
		});
		const body = await (await POST(turn(BIRTHDAY_B1, messages).event)).json();
		expect(body.messages.map((m: ChatLine) => m.text)).toEqual(['yesss 🙌', BIRTHDAY_B1.twist!.message.text]);
		expect(body.goals).toEqual(['place']);
		expect(body.done).toBe(false);
		expect(verifyJamieLine(BIRTHDAY_B1.twist!.message.text, body.messages[1].voiceSig)).toBe(true);
		expect(JSON.stringify(sent())).not.toContain('NEWS (Leo just said it)');

		// The next round: the news is in the friends' instructions; the old time doesn't count again.
		const after = [...messages, ...body.messages.map(({ from, text }: ChatLine) => ({ from, text })), you('ok how about Sunday at 4 then? I can bring the cake')];
		respond({
			messages: [{ from: 'maya', text: 'perfect, it’s a plan! 🎉 can’t wait' }],
			goals: [{ id: 'time', msg: 2, quote: '5 works for me' }, { id: 'task', msg: 3, quote: 'I can bring the cake' }], plan: { day: 'sun', time: 16, place: 'park' }, close: true
		});
		const stale = await (await POST(turn(BIRTHDAY_B1, after, { goals: body.goals, proof: body.proof }).event)).json();
		expect(stale.goals).toEqual(['place', 'task']);
		expect(stale.done).toBe(false);
		expect(JSON.stringify(sent())).toContain('NEWS (Leo just said it)');

		respond({
			messages: [{ from: 'maya', text: 'perfect, it’s a plan! 🎉 can’t wait' }],
			goals: [{ id: 'time', msg: 3, quote: 'Sunday at 4' }, { id: 'task', msg: 3, quote: 'I can bring the cake' }], plan: { day: 'sun', time: 16, place: 'park' }, close: true
		});
		const done = await (await POST(turn(BIRTHDAY_B1, after, { goals: body.goals, proof: body.proof }).event)).json();
		expect(done).toMatchObject({ goals: ['time', 'place', 'task'], done: true, settled: true });
	});

	it('B1: no twist when the plan already works', async () => {
		const messages = [...B1_START, you('Saturday at 7 at Rosa’s?')];
		respond({
			messages: [{ from: 'maya', text: 'love it! who’s doing the cake?' }],
			goals: [{ id: 'time', msg: 2, quote: 'Saturday at 7' }, { id: 'place', msg: 2, quote: 'Rosa’s' }], plan: { day: 'sat', time: 19, place: 'restaurant' }
		});
		const body = await (await POST(turn(BIRTHDAY_B1, messages).event)).json();
		expect(body.goals).toEqual(['time', 'place']);
		expect(body.messages).toEqual([{ from: 'maya', text: 'love it! who’s doing the cake?' }]);
	});

	it('closes at the message cap, never on a question', async () => {
		const messages: ChatLine[] = [...BIRTHDAY_A2.opening('rosa')];
		for (let i = 0; i < 8; i++) messages.push(you(`hmm ${'abcdefgh'[i]}`), { from: 'maya', text: `ok ${i}` });
		messages.pop();
		respond({});
		const body = await (await POST(turn(BIRTHDAY_A2, messages).event)).json();
		expect(body).toMatchObject({ settled: true, done: false });
		expect(body.messages.at(-1)).toEqual(BIRTHDAY_A2.fallback('rosa').end);
		messages.push({ from: 'maya', text: 'x' }, you('one more'));
		expect((await POST(turn(BIRTHDAY_A2, messages).event)).status).toBe(400);
	});

	it('refuses unknown speakers, scenes and variants', async () => {
		for (const body of [
			{ scene: 'birthday-a2', variant: 'rosa', messages: [...A2_START, { from: 'nina', text: 'hi' }, you('x')], goals: [], proof: null },
			{ scene: 'nope', variant: 'rosa', messages: A2_START, goals: [], proof: null },
			{ scene: 'birthday-a2', variant: 'nope', messages: A2_START, goals: [], proof: null },
			{ scene: 'birthday-a2', variant: 'rosa', messages: [...A2_START, { from: 'maya', text: 'hi' }], goals: [], proof: null }
		]) expect((await POST(fixture(body).event)).status).toBe(400);
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe('/api/english/chat/review', () => {
	const review = (messages: ChatLine[], scene = BIRTHDAY_A2) => fixture({ scene: scene.id, variant: 'rosa', messages }, 'http://localhost/api/english/chat/review');
	const rewrites = (items: Record<string, unknown>[]) => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ rewrites: items }) } }] }), { status: 200 });
	const chat = [...BIRTHDAY_A2.opening('rosa'), you('Dear friends, hello. I want to inform you that I am agree.'), { from: 'maya', text: 'Yay! 4 or 5?' }, you('We meet in Saturday in 5 o clock?'), you('I bring the cake')];

	it('keeps at most two short rewrites of the learner’s own words', async () => {
		fetchMock.mockResolvedValue(rewrites([
			{ msg: 1, original: 'Dear friends, hello. I want to inform you that I am agree.', better: 'I’m in!', whyFa: 'کوتاه‌تر', whyEn: 'Shorter is friendlier.', kind: 'formal' },
			{ msg: 2, original: 'We meet in Saturday in 5 o clock?', better: 'Saturday at 5?', whyFa: 'at', whyEn: 'Say at 5.', kind: 'preposition' },
			{ msg: 3, original: 'I bring the cake', better: 'I’ll bring the cake!', whyFa: 'قول', whyEn: 'For a promise, say I’ll.', kind: 'future' }
		]));
		const body = await (await REVIEW(review(chat).event)).json();
		expect(body.upgrades.map((u: { better: string }) => u.better)).toEqual(['I’m in!', 'Saturday at 5?']);
		expect(body.upgrades[0]).toMatchObject({ kind: 'formal', why: { en: 'Shorter is friendlier.', fa: 'کوتاه‌تر' } });
		const system = sent().messages[0].content;
		expect(system).toContain('AT MOST TWO');
		expect(sent().messages[1].content).toContain('You (2, typed): We meet in Saturday');
	});

	it('drops rewrites that are invented, longer, add facts or (A2) use slang', async () => {
		fetchMock.mockResolvedValue(rewrites([
			{ msg: 2, original: 'I said something else', better: 'Hi!', whyFa: 'ف', whyEn: 'e', kind: 'other' },
			{ msg: 3, original: 'I bring the cake', better: 'I’ll bring the cake and also some balloons for everyone there!', whyFa: 'ف', whyEn: 'e', kind: 'future' },
			{ msg: 2, original: 'We meet in Saturday in 5 o clock?', better: 'Saturday at 7 at Rosa’s?', whyFa: 'ف', whyEn: 'e', kind: 'preposition' },
			{ msg: 3, original: 'I bring the cake', better: 'gonna bring the cake', whyFa: 'ف', whyEn: 'e', kind: 'future' }
		]));
		expect((await (await REVIEW(review(chat).event)).json()).upgrades).toEqual([]);
	});
});

describe('the AI provider chain', () => {
	it('when the configured Gemini model is gone (404), it uses Google’s current Flash model', async () => {
		env.GEMINI_API_KEY = 'g'; env.GEMINI_MODEL = 'gemini-old-retired';
		const reply = { messages: [{ from: 'maya', text: 'Yay! What time on Saturday? 4 or 5?' }], goals: [], plan: null, close: false };
		fetchMock.mockImplementation((url: string) => Promise.resolve(url.includes('gemini-old-retired')
			? new Response('{}', { status: 404 })
			: new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(reply) }] } }] }), { status: 200 })));
		const body = await (await POST(turn().event)).json();
		expect(body.messages).toEqual(reply.messages);
		expect(fetchMock.mock.calls.map(call => String(call[0]))).toEqual([
			expect.stringContaining('models/gemini-old-retired:'), expect.stringContaining('models/gemini-flash-latest:')
		]);
	});
	it('another Gemini failure goes on down the chain, without a second Gemini try', async () => {
		env.GEMINI_API_KEY = 'g'; env.GEMINI_MODEL = 'gemini-x';
		fetchMock.mockImplementation((url: string) => Promise.resolve(url.includes('googleapis') ? new Response('{}', { status: 500 }) : openAi({})));
		await POST(turn().event);
		expect(fetchMock.mock.calls.filter(call => String(call[0]).includes('googleapis'))).toHaveLength(1);
	});
});
