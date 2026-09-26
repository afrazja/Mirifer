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

export const MAX_JAMIE_WORDS = 60;
const MAX_JAMIE_CHARS = 420;

const plain = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Why a line can't be used, or null if it's fine. Room numbers must come from
 * the fact sheet; small numbers (floors, times, minutes) are allowed.
 */
export function jamieLineProblem(value: unknown, variant: Variant, previous?: string): string | null {
	if (typeof value !== 'string') return 'it was not text';
	const line = value.replace(/\s+/g, ' ').trim();
	if (line.length < 2) return 'it was empty';
	if (line.length > MAX_JAMIE_CHARS || line.split(' ').length > MAX_JAMIE_WORDS) return `it was too long (keep it under ${MAX_JAMIE_WORDS - 20} words)`;
	if (/[*#<>{}[\]_`|\\]/.test(line)) return 'it used formatting characters';
	if (/[$€£¥%]|\b(?:dollars?|euros?|pounds?|cents?)\b/i.test(line)) return 'it mentioned a price; tonight there is no charge at all';
	const known = new Set(hotelFacts(variant).match(/\d+/g));
	for (const number of line.match(/\d+/g) ?? []) {
		if (!known.has(number) && Number(number) > 24) return `it mentioned ${number}, which is not on the fact sheet`;
	}
	if (previous && plain(previous) === plain(line)) return 'it repeated your previous line';
	return null;
}

/** Returns the cleaned line if it is safe to show, or null. */
export function checkJamieLine(value: unknown, variant: Variant, previous?: string): string | null {
	return jamieLineProblem(value, variant, previous) ? null : (value as string).replace(/\s+/g, ' ').trim();
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
