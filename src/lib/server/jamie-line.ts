/**
 * Server-side checks and signatures for the AI-run English hotel role-play.
 *
 * - `checkJamieLine` screens each AI-written receptionist line: bounded
 *   length, and no numbers or currency beyond the scene's fact sheet, so a
 *   model slip can't invent a room or a price. A failing line is replaced
 *   by a prepared fallback.
 * - Accepted lines are signed so /api/english/voice can voice them with
 *   OpenAI without becoming an open text-to-speech endpoint.
 * - The goals reached so far are signed for the learner, so completion can
 *   be verified without the server storing the conversation.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { GOAL_IDS, hotelFacts, type GoalId, type Variant } from '$lib/practice/hotel';

export const MAX_JAMIE_WORDS = 45;
const MAX_JAMIE_CHARS = 320;

const plain = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Returns the cleaned line if it is safe to show, or null to use a fallback. */
export function checkJamieLine(value: unknown, variant: Variant, previous?: string): string | null {
	if (typeof value !== 'string') return null;
	const line = value.replace(/\s+/g, ' ').trim();
	if (line.length < 2 || line.length > MAX_JAMIE_CHARS) return null;
	if (line.split(' ').length > MAX_JAMIE_WORDS) return null;
	if (/[*#<>{}[\]_`|\\$€£¥%]/.test(line)) return null;
	if (/\b(?:dollars?|euros?|pounds?|cents?)\b/i.test(line)) return null;
	const allowed = new Set(hotelFacts(variant).match(/\d+/g));
	for (const number of line.match(/\d+/g) ?? []) if (!allowed.has(number)) return null;
	if (previous && plain(previous) === plain(line)) return null;
	return line;
}

function sign(purpose: string, data: string): string | null {
	const key = env.JAMIE_VOICE_SECRET || env.OPENAI_API_KEY || env.GEMINI_API_KEY || env.DEEPSEEK_API_KEY;
	return key ? createHmac('sha256', `mirifer-english:${purpose}:${key}`).update(data).digest('base64url') : null;
}
function verify(purpose: string, data: string, signature: unknown): boolean {
	const expected = sign(purpose, data);
	if (!expected || typeof signature !== 'string') return false;
	const a = Buffer.from(expected), b = Buffer.from(signature);
	return a.length === b.length && timingSafeEqual(a, b);
}

export const signJamieLine = (line: string) => sign('voice', line);
export const verifyJamieLine = (line: string, signature: unknown) => verify('voice', line, signature);

const goalData = (userId: string, variant: Variant, goals: readonly string[]) =>
	`${userId}|${variant}|${GOAL_IDS.filter(id => goals.includes(id)).join(',')}`;
export const signGoals = (userId: string, variant: Variant, goals: readonly GoalId[]) => sign('goals', goalData(userId, variant, goals));
/** The goals a proof vouches for, or none if it doesn't verify. */
export function provenGoals(userId: string, variant: Variant, goals: unknown, proof: unknown): GoalId[] {
	if (!Array.isArray(goals)) return [];
	const claimed = GOAL_IDS.filter(id => goals.includes(id));
	return claimed.length && verify('goals', goalData(userId, variant, claimed), proof) ? claimed : [];
}
