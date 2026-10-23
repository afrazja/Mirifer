/**
 * Mira's AI greeting for returning learners (Day 2+): `open` writes today's
 * opening line with one question (not used by the browser now), `reply`
 * answers the learner once: on a day with a check-in, their answer to the
 * day's casual question. Each counts against the daily AI allowance. Day 1 is
 * scripted in the browser and never calls this.
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
import { DAY_IDS, dayById, furthestDayId, nextDay } from '$lib/practice/day';
import { canUseLab } from '$lib/server/lab-access';
import {
	OpeningSchema, ReplySchema, coachFacts, daysSinceIn, levelFor, localParts, openingProblem, openingPrompt, openingUser,
	partOfDay, replyProblem, replyPrompt, replyUser, usableFeedback, usablePersian, type Opening, type Reply
} from '$lib/server/coach-ai';

const RequestSchema = z.discriminatedUnion('kind', [
	z.object({ kind: z.literal('open'), timeZone: z.string().max(64) }).strict(),
	z.object({ kind: z.literal('reply'), timeZone: z.string().max(64), opening: z.string().trim().min(1).max(300), answer: z.string().trim().max(300), day: z.enum(DAY_IDS).optional() }).strict()
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
	// Today's day: the one the browser is on if the learner may open it (the owner may try any day),
	// else the one after the last finished day.
	const owner = canUseLab(user);
	const requested = parsed.data.kind === 'reply' ? dayById(parsed.data.day) : null;
	const day = requested && (requested.ready || owner) ? requested : nextDay(furthestDayId(progress), owner);
	// A day's check-in question always gets Mira's reply. Otherwise Day 1 and a second session the same day are scripted.
	const checkInReply = parsed.data.kind === 'reply' && !!day.checkIn;
	if (!checkInReply && (progress.sessionsCompleted === 0 || days === 0)) return json({ error: 'Scripted greeting' }, { status: 409 });
	const level = levelFor(profile);

	const refused = await spendAllowance(locals, user, parsed.data.kind === 'open' ? 1 : 2);
	if (refused) return refused;

	if (parsed.data.kind === 'open') {
		const facts = coachFacts(typeof meta.display_name === 'string' ? meta.display_name : '', profile, progress, days);
		const system = openingPrompt(level);
		const ask = (note = '') => askChain<Opening>({ label: 'English greeting open', system, user: openingUser(facts, day.question, partOfDay(localParts(now, parsed.data.timeZone).hour)) + note, schema: OpeningSchema, ...openSchemas, temperature: 0.7, maxTokens: 300 });
		let result = await ask();
		let problem = result ? openingProblem(result.line) : 'no reply';
		if (problem) { result = await ask(`\n\n(Your last line could not be used because ${problem}. Write it again, following every rule.)`); problem = result ? openingProblem(result.line) : 'no reply'; }
		if (!result || problem) return json({ error: 'AI line unusable' }, { status: 502 });
		return json({ line: result.line.trim(), lineFa: usablePersian(result.lineFa) });
	}

	const { answer } = parsed.data;
	// On a check-in day the question is the day's own, not the browser's copy.
	const opening = day.checkIn ? day.question : parsed.data.opening;
	const system = replyPrompt(level);
	const ask = (note = '') => askChain<Reply>({ label: 'English greeting reply', system, user: replyUser(opening, day.themePhrase, answer) + note, schema: ReplySchema, ...replySchemas, temperature: 0.5, maxTokens: 400 });
	let result = await ask();
	let problem = result ? replyProblem(result.line) : 'no reply';
	if (problem) { result = await ask(`\n\n(Your last reply could not be used because ${problem}. Write it again, following every rule.)`); problem = result ? replyProblem(result.line) : 'no reply'; }
	if (!result || problem) return json({ error: 'AI line unusable' }, { status: 502 });
	return json({ line: result.line.trim(), lineFa: usablePersian(result.lineFa), ...usableFeedback(answer, result) });
};
