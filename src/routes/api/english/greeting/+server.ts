/**
 * Mira's AI greeting for returning learners (Day 2+): `open` writes today's
 * opening line with one question, `reply` answers the learner once. At most
 * two calls a day; each counts against the daily AI allowance. Day 1 and the
 * same-day second session are scripted in the browser and never call this.
 *
 * Nothing the learner says is stored here. On any failure the browser uses
 * its scripted line, so this route can answer 4xx/5xx freely.
 */
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { askChain, englishLearner, spendAllowance } from '$lib/server/english-ai';
import { readEnglishProfile } from '$lib/practice/english-profile';
import { readEnglishProgress } from '$lib/practice/english-progress';
import { DAY_ONE } from '$lib/practice/day';
import {
	OpeningSchema, ReplySchema, coachFacts, daysSinceIn, levelFor, localParts, openingProblem, openingPrompt, openingUser,
	partOfDay, replyProblem, replyPrompt, replyUser, usableFeedback, usablePersian, type Opening, type Reply
} from '$lib/server/coach-ai';

const RequestSchema = z.discriminatedUnion('kind', [
	z.object({ kind: z.literal('open'), timeZone: z.string().max(64) }).strict(),
	z.object({ kind: z.literal('reply'), timeZone: z.string().max(64), opening: z.string().trim().min(1).max(300), answer: z.string().trim().max(300) }).strict()
]);

const openSchemas = {
	openAiSchema: { type: 'object', additionalProperties: false, required: ['line', 'lineFa'], properties: { line: { type: 'string' }, lineFa: { type: ['string', 'null'] } } },
	geminiSchema: { type: 'OBJECT', required: ['line', 'lineFa'], properties: { line: { type: 'STRING' }, lineFa: { type: 'STRING', nullable: true } } },
	shape: '\nReturn only JSON: {"line": string, "lineFa": string or null}.'
};
const replyFields = ['line', 'lineFa', 'improved', 'noteEn', 'noteFa'];
const replySchemas = {
	openAiSchema: { type: 'object', additionalProperties: false, required: replyFields, properties: Object.fromEntries(replyFields.map(field => [field, { type: field === 'line' ? 'string' : ['string', 'null'] }])) },
	geminiSchema: { type: 'OBJECT', required: replyFields, properties: Object.fromEntries(replyFields.map(field => [field, field === 'line' ? { type: 'STRING' } : { type: 'STRING', nullable: true }])) },
	shape: '\nReturn only JSON: {"line": string, "lineFa": string or null, "improved": string or null, "noteEn": string or null, "noteFa": string or null}. Never omit a key.'
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await englishLearner(request, locals);
	if (user instanceof Response) return user;
	const raw = await request.text();
	if (raw.length > 2_000) return json({ error: 'Request too long' }, { status: 413 });
	let input: unknown;
	try { input = JSON.parse(raw); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
	const parsed = RequestSchema.safeParse(input);
	if (!parsed.success) return json({ error: 'Invalid request' }, { status: 400 });

	const meta = user.user_metadata ?? {};
	const progress = readEnglishProgress(meta), profile = readEnglishProfile(meta);
	const now = new Date();
	const days = daysSinceIn(progress.lastCompletedAt, now, parsed.data.timeZone);
	// Day 1 and a second session the same day are scripted.
	if (progress.sessionsCompleted === 0 || days === 0) return json({ error: 'Scripted greeting' }, { status: 409 });
	const level = levelFor(profile);

	const refused = await spendAllowance(locals, user, parsed.data.kind === 'open' ? 1 : 2);
	if (refused) return refused;

	if (parsed.data.kind === 'open') {
		const facts = coachFacts(typeof meta.display_name === 'string' ? meta.display_name : '', profile, progress, days);
		const system = openingPrompt(level);
		const ask = (note = '') => askChain<Opening>({ label: 'English greeting open', system, user: openingUser(facts, DAY_ONE.question, partOfDay(localParts(now, parsed.data.timeZone).hour)) + note, schema: OpeningSchema, ...openSchemas, temperature: 0.7, maxTokens: 300 });
		let result = await ask();
		let problem = result ? openingProblem(result.line) : 'no reply';
		if (problem) { result = await ask(`\n\n(Your last line could not be used because ${problem}. Write it again, following every rule.)`); problem = result ? openingProblem(result.line) : 'no reply'; }
		if (!result || problem) return json({ error: 'AI line unusable' }, { status: 502 });
		return json({ line: result.line.trim(), lineFa: usablePersian(result.lineFa) });
	}

	const { opening, answer } = parsed.data;
	const system = replyPrompt(level);
	const ask = (note = '') => askChain<Reply>({ label: 'English greeting reply', system, user: replyUser(opening, DAY_ONE.themePhrase, answer) + note, schema: ReplySchema, ...replySchemas, temperature: 0.5, maxTokens: 400 });
	let result = await ask();
	let problem = result ? replyProblem(result.line) : 'no reply';
	if (problem) { result = await ask(`\n\n(Your last reply could not be used because ${problem}. Write it again, following every rule.)`); problem = result ? replyProblem(result.line) : 'no reply'; }
	if (!result || problem) return json({ error: 'AI line unusable' }, { status: 502 });
	return json({ line: result.line.trim(), lineFa: usablePersian(result.lineFa), ...usableFeedback(answer, result) });
};
