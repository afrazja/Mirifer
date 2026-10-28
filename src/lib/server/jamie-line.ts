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
import type { RoleScene } from '$lib/practice/roleplay';
import { FRIEND_WORDS, type ChatScene } from '$lib/practice/group-chat';

/** The longest friend message (a chat line is short). */
const MAX_FRIEND_MESSAGE = 200;

export const MAX_JAMIE_WORDS = 60;
/** The same as the longest character turn the conversation route accepts back. */
const MAX_JAMIE_CHARS = 400;

const plain = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Why a line can't be used, or null if it's fine. Room numbers must come from
 * the fact sheet; small numbers (floors, times, minutes) are allowed.
 */
export function jamieLineProblem(value: unknown, variant: Variant, previous?: string): string | null {
	return characterLineProblem(value, hotelFacts(variant), previous, 'tonight there is no charge at all');
}

/** The same checks for any scene's character: the numbers must come from that scene's fact sheet. */
export function sceneLineProblem(scene: RoleScene, value: unknown, variant: string, previous?: string): string | null {
	return characterLineProblem(value, scene.facts(variant), previous, scene.priceReason);
}

/**
 * A friend's chat message: short (the level's word cap, with a little slack), one emoji at most, none
 * of the scene's banned words, and only numbers from the fact sheet; the prices on it ("$20 each")
 * may be said.
 */
export function chatLineProblem(scene: ChatScene, value: unknown, variant: string, previous?: string, news = ''): string | null {
	if (typeof value !== 'string') return 'it was not text';
	const line = value.replace(/\s+/g, ' ').trim();
	const words = FRIEND_WORDS[scene.level];
	if (line.length > MAX_FRIEND_MESSAGE || line.split(' ').length > words + 4) return `a message was too long for a chat (at most ${words} words each)`;
	if ((line.match(/\p{Extended_Pictographic}/gu) ?? []).length > 1) return 'a message had more than one emoji';
	const banned = scene.banned?.exec(line);
	if (banned) return `a message used "${banned[0]}", which the friends never say here`;
	const checked = scene.allowedPrices ? line.replace(new RegExp(scene.allowedPrices.source, 'gi'), 'the price') : line;
	const sheet = `${scene.facts(variant)}\n${news}`;
	const known = new Set(sheet.match(/\d+/g));
	for (const number of checked.match(/\d+/g) ?? []) if (!known.has(number)) return `it mentioned ${number}, which is not on the fact sheet`;
	return characterLineProblem(checked, sheet, previous, scene.priceReason);
}

function characterLineProblem(value: unknown, facts: string, previous: string | undefined, priceReason: string): string | null {
	if (typeof value !== 'string') return 'it was not text';
	const line = value.replace(/\s+/g, ' ').trim();
	if (line.length < 2) return 'it was empty';
	if (line.length > MAX_JAMIE_CHARS || line.split(' ').length > MAX_JAMIE_WORDS) return `it was too long (keep it under ${MAX_JAMIE_WORDS - 20} words)`;
	if (/[*#<>{}[\]_`|\\]/.test(line)) return 'it used formatting characters';
	if (/[$€£¥%]|\b(?:dollars?|euros?|pounds?|cents?)\b/i.test(line)) return `it mentioned a price; ${priceReason}`;
	const known = new Set(facts.match(/\d+/g));
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
/**
 * A model-written "better" sentence (the reviews): signed for the voice only if it looks like one
 * short spoken sentence, so a learner can't steer the model into signing anything else.
 */
export function signBetter(line: string): string | null {
	const text = line.replace(/\s+/g, ' ').trim();
	if (!text || text.length > 200 || text.split(' ').length > 30 || /[*#<>{}[\]_`|\\@]|https?:|www\./i.test(text)) return null;
	return signJamieLine(text);
}
export const verifyJamieLine = (line: string, signature: unknown) => verify('voice', line, signature);

/** Goal proofs. Each scene has its own variant names, so a proof for one scene never vouches for another. */
const goalData = (userId: string, variant: string, goals: readonly string[], ids: readonly string[], scope: string) =>
	`${scope ? `${scope}|` : ''}${userId}|${variant}|${ids.filter(id => goals.includes(id)).join(',')}`;
/** `scope`: the scene id (none for the hotel, whose proofs came first). */
export const signGoals = (userId: string, variant: string, goals: readonly string[], ids: readonly string[] = GOAL_IDS, scope = '') => sign('goals', goalData(userId, variant, goals, ids, scope));
/** The goals a proof vouches for, or none if it doesn't verify. */
export function provenGoals(userId: string, variant: Variant, goals: unknown, proof: unknown): GoalId[];
export function provenGoals(userId: string, variant: string, goals: unknown, proof: unknown, ids: readonly string[], scope?: string): string[];
export function provenGoals(userId: string, variant: string, goals: unknown, proof: unknown, ids: readonly string[] = GOAL_IDS, scope = ''): string[] {
	if (!Array.isArray(goals)) return [];
	const claimed = ids.filter(id => goals.includes(id));
	return claimed.length && verify('goals', goalData(userId, variant, claimed, ids, scope), proof) ? claimed : [];
}
