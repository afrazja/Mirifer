/**
 * Jamie's next turn in the English hotel role-play.
 *
 * The whole conversation so far goes to the Gemini → DeepSeek → OpenAI chain,
 * which plays Jamie from the scene's fact sheet, tracks which goals the
 * learner has reached, and suggests a correction for the learner's latest
 * reply. There is no answer key: any sensible route through the scene works.
 *
 * The server keeps the model honest where it matters. Jamie's line must pass
 * `jamieLineProblem` (bounded, no invented numbers or prices); a failing line
 * gets one rewrite, then a prepared fallback. Goals only accumulate, and are returned with a signed
 * proof the learner sends back on the next turn and at completion, so
 * nothing about the conversation needs to be stored.
 *
 * Each day can bring its own scene (`scene`, the hotel when absent; see roleplay.ts). A scene with
 * a twist has the server say an authored line once the learner has reached the twist's goals; the
 * model never says it, and a line that gives it away early is rewritten.
 */

import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { MAX_REPLY, MAX_TURNS } from '$lib/practice/hotel';
import { HOTEL_SCENE, fallbackFor, goalIdsOf, missedGoals, twistSaid, type RoleScene } from '$lib/practice/roleplay';
import { roleSceneById } from '$lib/practice/day-content';
import { askChain, englishLearner, spendAllowance } from '$lib/server/english-ai';
import { provenGoals, sceneLineProblem, signGoals, signJamieLine } from '$lib/server/jamie-line';

/** The character's turns are 'reception' in every scene (the hotel came first). */
const TurnSchema = z.discriminatedUnion('speaker', [
	z.object({ speaker: z.literal('learner'), text: z.string().trim().min(1).max(MAX_REPLY) }).strict(),
	z.object({ speaker: z.literal('reception'), text: z.string().trim().min(1).max(400) }).strict()
]);
const RequestSchema = z.object({
	scene: z.string().max(40).optional(),
	variant: z.string().max(20),
	turns: z.array(TurnSchema).min(2).max(MAX_TURNS * 2 + 1),
	goals: z.array(z.string().max(20)).max(8),
	proof: z.string().max(100).nullable()
}).strict();
const ReplySchema = z.object({
	reply: z.string().max(1000),
	goalsMet: z.array(z.string().max(40)).max(10),
	done: z.boolean(),
	improved: z.string().max(MAX_REPLY + 100).nullable(),
	noteEn: z.string().max(240).nullable(),
	noteFa: z.string().max(240).nullable()
}).strip();

const fields = ['reply', 'goalsMet', 'done', 'improved', 'noteEn', 'noteFa'];
const schemasFor = (ids: string[]) => ({
	openAiSchema: { type: 'object', additionalProperties: false, required: fields, properties: {
		reply: { type: 'string' }, goalsMet: { type: 'array', items: { type: 'string', enum: ids } }, done: { type: 'boolean' },
		improved: { type: ['string', 'null'] }, noteEn: { type: ['string', 'null'] }, noteFa: { type: ['string', 'null'] }
	} },
	geminiSchema: { type: 'OBJECT', required: fields, properties: {
		reply: { type: 'STRING' }, goalsMet: { type: 'ARRAY', items: { type: 'STRING' } }, done: { type: 'BOOLEAN' },
		improved: { type: 'STRING', nullable: true }, noteEn: { type: 'STRING', nullable: true }, noteFa: { type: 'STRING', nullable: true }
	} }
});
const SHAPE = '\nReturn only JSON: {"reply": string, "goalsMet": array of goal ids, "done": boolean, "improved": string or null, "noteEn": string or null, "noteFa": string or null}. Never omit a key.';

const converse = (scene: RoleScene, system: string, transcript: string) => askChain({
	label: 'English converse', system, user: transcript, schema: ReplySchema, ...schemasFor(goalIdsOf(scene)), shape: SHAPE, temperature: 0.6, maxTokens: 500
});

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await englishLearner(request, locals);
	if (user instanceof Response) return user;
	const raw = await request.text();
	if (raw.length > 24_000) return json({ error: 'Request too long' }, { status: 413 });
	let input: unknown;
	try { input = JSON.parse(raw); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
	const parsed = RequestSchema.safeParse(input);
	if (!parsed.success) return json({ error: 'Invalid request' }, { status: 400 });
	const scene = roleSceneById(parsed.data.scene);
	const { variant, turns, goals: claimed, proof } = parsed.data;
	if (!scene || !scene.variants.includes(variant)) return json({ error: 'Invalid request' }, { status: 400 });
	const ids = goalIdsOf(scene);
	/** Proofs are bound to the scene (the hotel's keep their original form). */
	const scope = scene === HOTEL_SCENE ? '' : scene.id;
	const learnerCount = turns.filter(turn => turn.speaker === 'learner').length;
	if (turns.at(-1)?.speaker !== 'learner' || learnerCount > MAX_TURNS) return json({ error: 'Invalid request' }, { status: 400 });

	const refused = await spendAllowance(locals, user, learnerCount);
	if (refused) return refused;

	const met = provenGoals(user.id, variant, claimed, proof, ids, scope);
	const { learner, character } = scene.labels;
	const transcript = `Conversation so far (${character} speaks next):\n` +
		turns.map(turn => `${turn.speaker === 'learner' ? learner : character}: ${turn.text.replace(/\s+/g, ' ')}`).join('\n');
	const previous = [...turns].reverse().find(turn => turn.speaker === 'reception')?.text;
	const twistBefore = twistSaid(scene, variant, turns);
	const problemOf = (line: unknown) => sceneLineProblem(scene, line, variant, previous)
		?? (scene.twist && !twistBefore && typeof line === 'string' && scene.twist.leak.test(line)
			? `it gave away the surprise too early: ${character} says nothing about it until that news is in the conversation` : null);
	const system = scene.prompt(variant, met);
	let result = await converse(scene, system, transcript);
	if (!result) return json({ error: 'AI temporarily unavailable' }, { status: 502 });
	// A line that fails the checks gets one rewrite with the reason, so the character
	// still answers what was said; the prepared fallback is the last resort.
	let problem = problemOf(result.reply);
	if (problem) {
		console.error(`English converse: ${character}'s line rejected (${problem}); retrying`);
		const retry = await converse(scene, system, `${transcript}\n\n(Your last attempt at ${character}'s reply could not be used because ${problem}. Write ${character}'s reply again, following every rule.)`);
		if (retry) { result = retry; problem = problemOf(retry.reply); }
		if (problem) console.error(`English converse: retry rejected too (${problem}); using a fallback line`);
	}

	// Goals only accumulate; some need another first (confirming needs a decision to confirm).
	const reached = new Set<string>([...met, ...ids.filter(id => result.goalsMet.includes(id))]);
	for (const [goal, need] of Object.entries(scene.needs)) if (!reached.has(need)) reached.delete(goal);
	// The twist: said by the server, in place of the model's line, once its goals are reached.
	// Goals it unlocks only count after the learner has heard it.
	let twistNow = false;
	if (scene.twist && !twistBefore) {
		for (const goal of scene.twist.unlocks) reached.delete(goal);
		twistNow = scene.twist.after.every(goal => reached.has(goal));
	}
	// First-try goals: a refusal before the goal was reached misses it for this run (worked out from
	// what the learner said each time, so nothing extra needs signing; it can only cost them a goal).
	const learnerLines = turns.filter(turn => turn.speaker === 'learner').map(turn => turn.text);
	const missed = missedGoals(scene, met, learnerLines);
	for (const goal of missed) reached.delete(goal);
	const goals = ids.filter(id => reached.has(id));
	// The learner's reply to the twist (the turn right after it): its outcome is decided in code,
	// and some outcomes get the character's fixed answer (the slow repeat).
	const lastCharacter = [...turns].reverse().find(turn => turn.speaker === 'reception')?.text;
	const answeringTwist = !!scene.twist?.check && lastCharacter === scene.twist.lines[variant] && turns.at(-1)?.speaker === 'learner';
	const twistOutcome = answeringTwist ? scene.twist!.check!(turns.at(-1)!.text) : null;
	const fixedAnswer = twistOutcome ? scene.twist!.replies?.[twistOutcome] ?? null : null;
	const done = !twistNow && result.done && goals.length === ids.length;
	// The chat may also close with a goal missed, once the twist (if any) has been said.
	const settled = done || (!twistNow && result.done && (!scene.twist || twistBefore) && ids.every(id => goals.includes(id) || missed.includes(id)));
	const reply = twistNow ? scene.twist!.lines[variant]
		: fixedAnswer ?? (problem ? fallbackFor(scene, settled ? ids : [...goals, ...missed]) : result.reply.replace(/\s+/g, ' ').trim());
	// No correction on the reply to the twist: that turn is about asking, not grammar.
	const correction = !answeringTwist && result.improved && result.noteEn && result.noteFa && result.improved.trim() !== turns.at(-1)!.text.trim()
		? { improved: result.improved.trim(), note: { en: result.noteEn, fa: result.noteFa } } : null;
	return json({ reply, voiceSig: signJamieLine(reply), goals, proof: signGoals(user.id, variant, goals, ids, scope), done, settled, missed, twistOutcome, correction });
};
