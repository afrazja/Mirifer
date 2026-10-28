/**
 * The friends' next messages in an English group chat (group-chat.ts, docs/english-group-chat-spec.md).
 *
 * The chat so far goes to the Gemini → DeepSeek → OpenAI chain, which writes one or two short
 * messages from the friends it plays, the goals the learner has reached (each with the learner's own
 * words as evidence), and the plan agreed so far. The server keeps it honest, as in the role-plays:
 * - every message passes `chatLineProblem` (short, one emoji, no banned words, only the fact sheet's
 *   numbers and prices), at most one question per round and only in the last message, and only the
 *   friends the model plays; a failing round gets one rewrite, then a prepared fallback;
 * - a goal counts only if its evidence is really in the learner's message (`evidencedGoals`); goals
 *   only accumulate, signed for the learner, so nothing needs to be stored;
 * - the twist is sent by the server, never written by the model, once the time and enough goals are
 *   agreed and the plan clashes with it; the time then has to be agreed again;
 * - a scripted reaction (A2: Leo's "Works for me! 👍") comes when a goal is reached;
 * - the chat closes when every goal is agreed, or at the level's message cap, with a closing line.
 */

import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import {
	LEARNER, MAX_CHAT_MESSAGE, chatChars, chatFallback, chatGoalIds, chatTurns, chatTwistSent, evidencedGoals, learnerMessages,
	type ChatLine, type ChatPlan, type ChatScene
} from '$lib/practice/group-chat';
import { chatSceneById } from '$lib/practice/chats';
import { firstName } from '$lib/practice/learner-name';
import { askChain, englishLearner, spendAllowance } from '$lib/server/english-ai';
import { chatLineProblem, provenGoals, signGoals, signJamieLine } from '$lib/server/jamie-line';

const MessageSchema = z.object({ from: z.string().max(20), text: z.string().trim().min(1).max(400), voice: z.boolean().optional() }).strip();
const RequestSchema = z.object({
	scene: z.string().max(40),
	variant: z.string().max(20),
	messages: z.array(MessageSchema).min(2).max(60),
	goals: z.array(z.string().max(20)).max(8),
	proof: z.string().max(100).nullable(),
	quiet: z.number().int().min(0).max(20).optional()
}).strict();

const ReplySchema = z.object({
	messages: z.array(z.object({ from: z.string().max(20), text: z.string().max(600) }).strip()).min(1).max(3),
	goals: z.array(z.object({ id: z.string().max(20), msg: z.number().int().min(1).max(30), quote: z.string().max(200) }).strip()).max(6),
	plan: z.object({ day: z.string().max(10).nullable(), time: z.number().min(0).max(24).nullable(), place: z.string().max(20).nullable() }).strip().nullable(),
	close: z.boolean()
}).strip();
const fields = ['messages', 'goals', 'plan', 'close'];
const schemasFor = (ids: string[], played: string[]) => ({
	openAiSchema: { type: 'object', additionalProperties: false, required: fields, properties: {
		messages: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['from', 'text'], properties: { from: { type: 'string', enum: played }, text: { type: 'string' } } } },
		goals: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'msg', 'quote'], properties: { id: { type: 'string', enum: ids }, msg: { type: 'integer' }, quote: { type: 'string' } } } },
		plan: { type: 'object', additionalProperties: false, required: ['day', 'time', 'place'], properties: { day: { type: ['string', 'null'] }, time: { type: ['number', 'null'] }, place: { type: ['string', 'null'] } } },
		close: { type: 'boolean' }
	} },
	geminiSchema: { type: 'OBJECT', required: fields, properties: {
		messages: { type: 'ARRAY', items: { type: 'OBJECT', required: ['from', 'text'], properties: { from: { type: 'STRING' }, text: { type: 'STRING' } } } },
		goals: { type: 'ARRAY', items: { type: 'OBJECT', required: ['id', 'msg', 'quote'], properties: { id: { type: 'STRING' }, msg: { type: 'INTEGER' }, quote: { type: 'STRING' } } } },
		plan: { type: 'OBJECT', required: ['day', 'time', 'place'], properties: { day: { type: 'STRING', nullable: true }, time: { type: 'NUMBER', nullable: true }, place: { type: 'STRING', nullable: true } } },
		close: { type: 'BOOLEAN' }
	} }
});
const SHAPE = '\nReturn only JSON: {"messages": [{"from": friend id, "text": string}] (1 or 2), "goals": [{"id": goal id, "msg": learner message number, "quote": their exact words}], "plan": {"day": string or null, "time": number or null, "place": string or null}, "close": boolean}. Never omit a key.';

const clean = (text: string) => text.replace(/\s+/g, ' ').trim();
const asks = (text: string) => text.includes('?');

/** Why the model's round can't be used, or null. */
function roundProblem(scene: ChatScene, variant: string, lines: ChatLine[], previous: string | undefined, twistSaid: boolean): string | null {
	if (!lines.length || lines.length > 2) return 'write one or two messages';
	for (const line of lines) {
		if (!scene.played.includes(line.from)) return `"${line.from}" is not a friend you play`;
		const problem = chatLineProblem(scene, line.text, variant, previous, twistSaid ? scene.twist?.news : '');
		if (problem) return problem;
		if (scene.twist && !twistSaid && scene.twist.leak.test(line.text)) return 'it gave away news nobody knows yet';
	}
	// One message may offer the choices ("What time on Saturday? 4 or 5?"); two asking messages are two questions.
	if (lines.filter(line => asks(line.text)).length > 1) return 'it asked more than one question (one question at most, in the last message)';
	if (lines.length === 2 && asks(lines[0].text)) return 'the question must be in the last message';
	return null;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await englishLearner(request, locals);
	if (user instanceof Response) return user;
	const raw = await request.text();
	if (raw.length > 30_000) return json({ error: 'Request too long' }, { status: 413 });
	let input: unknown;
	try { input = JSON.parse(raw); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
	const parsed = RequestSchema.safeParse(input);
	if (!parsed.success) return json({ error: 'Invalid request' }, { status: 400 });
	const scene = chatSceneById(parsed.data.scene);
	const { variant, messages, goals: claimed, proof } = parsed.data;
	if (!scene || !scene.variants.includes(variant)) return json({ error: 'Invalid request' }, { status: 400 });
	const members = new Set([LEARNER, ...scene.members.map(m => m.id)]);
	const said = learnerMessages(messages);
	const cap = chatTurns(scene);
	if (!messages.every(m => members.has(m.from)) || messages.at(-1)?.from !== LEARNER || said.length > cap
		|| said.some(m => m.text.length > Math.max(chatChars(scene), MAX_CHAT_MESSAGE))) return json({ error: 'Invalid request' }, { status: 400 });

	const refused = await spendAllowance(locals, user, said.length, scene.id);
	if (refused) return refused;

	const ids = chatGoalIds(scene);
	const met = provenGoals(user.id, variant, claimed, proof, ids, scene.id);
	const twistSaid = chatTwistSent(scene, messages);
	const last = said.length >= cap;
	const twist = scene.twist;
	// Whether the twist is due once this round's goals are in, if the plan clashes with it. The model
	// isn't told in advance: on that round only its first message is kept (if it asks nothing), then the twist.
	const twistReady = (goals: readonly string[]) => !!twist && !twistSaid && !last && goals.includes(twist.reopens) && goals.length >= twist.minGoals;
	const name = (id: string) => scene.members.find(m => m.id === id)?.name ?? id;
	let n = 0;
	const transcript = `The chat so far (the friends write next):\n${messages.map(m => m.from === LEARNER
		? `You (${++n}, ${m.voice ? 'voice note' : 'typed'}): ${clean(m.text)}` : `${name(m.from)}: ${clean(m.text)}`).join('\n')}`;
	const system = scene.prompt(variant, {
		met, twistSaid, last, stalled: (parsed.data.quiet ?? 0) >= 2,
		learnerName: firstName(typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name : '') || null
	});
	const ask = (text: string) => askChain({
		label: 'English group chat', system, user: text, schema: ReplySchema, ...schemasFor(ids, scene.played), shape: SHAPE, temperature: 0.7, maxTokens: 500
	});
	const previous = [...messages].reverse().find(m => m.from !== LEARNER)?.text;
	let result = await ask(transcript);
	if (!result) return json({ error: 'AI temporarily unavailable' }, { status: 502 });
	const linesOf = (r: NonNullable<typeof result>) => r.messages.map(m => ({ from: m.from, text: clean(m.text) }));
	let problem = roundProblem(scene, variant, linesOf(result), previous, twistSaid);
	if (problem) {
		console.error(`English group chat: round rejected (${problem}); retrying`);
		const retry = await ask(`${transcript}\n\n(Your last attempt could not be used because ${problem}. Write the friends' messages again, following every rule.)`);
		if (retry) { result = retry; problem = roundProblem(scene, variant, linesOf(retry), previous, twistSaid); }
		if (problem) console.error(`English group chat: retry rejected too (${problem}); using a fallback line`);
	}

	// Goals only accumulate, and only with the learner's own words as evidence.
	const reached = new Set<string>([...met, ...evidencedGoals(scene, messages, result.goals)]);
	let goals = ids.filter(id => reached.has(id));
	const fresh = goals.filter(id => !met.includes(id));
	// The twist: once the time and enough goals are agreed, if the plan runs into the news. The time
	// then has to be agreed again. No clash: no twist, and nothing is lost.
	const plan: ChatPlan = result.plan ?? { day: null, time: null, place: null };
	const twistNow = twistReady(goals) && twist!.clash(plan);
	if (twistNow) goals = goals.filter(id => id !== twist!.reopens);
	const done = !twistNow && goals.length === ids.length;
	const settled = done || last;

	let lines: ChatLine[] = problem ? [] : linesOf(result);
	if (problem) lines = [settled ? scene.fallback(variant)[done ? 'done' : 'end'] : chatFallback(scene, variant, goals, twistSaid)];
	if (twistNow) lines = [...(problem ? [] : lines.slice(0, 1).filter(line => !asks(line.text))), twist!.message];
	else if (settled && lines.some(line => asks(line.text))) {
		// A closing round never ends on a question.
		lines = [...lines.filter(line => !asks(line.text)), scene.fallback(variant)[done ? 'done' : 'end']].slice(-2);
	}
	// A scripted reaction (A2's second friend) comes first when the learner's message reached a goal.
	const reaction = !twistNow && fresh.length ? scene.reactions?.[fresh[0]] : undefined;
	if (reaction && !messages.some(m => m.from === reaction.from && m.text === reaction.text)) lines = [reaction, ...lines];

	return json({
		messages: lines.map(line => ({ ...line, ...(line.voice ? { voiceSig: signJamieLine(line.text) } : {}) })),
		goals, proof: signGoals(user.id, variant, goals, ids, scene.id), done, settled,
		quiet: fresh.length ? 0 : (parsed.data.quiet ?? 0) + 1
	});
};
