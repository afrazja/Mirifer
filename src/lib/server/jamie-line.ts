/**
 * Jamie's AI-written lines in the English hotel role-play.
 *
 * When a learner says something relevant that is not one of the authored
 * choices, the model writes Jamie a short reply instead of the fixed
 * "related" line, so Jamie responds to what was actually said. A reply is
 * used only if it passes `checkJamieLine`: short, a question at the end, and
 * no numbers or prices beyond the scene's own facts. Otherwise the authored
 * line is used.
 *
 * Accepted lines are signed so /api/english/voice can voice them with OpenAI
 * without becoming an open text-to-speech endpoint.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import type { Variant } from '$lib/practice/hotel';

export const MAX_JAMIE_WORDS = 30;
const MAX_JAMIE_CHARS = 220;

/** Returns the cleaned line if it is safe to show, or null to use the authored line. */
export function checkJamieLine(value: unknown, variant: Variant, previous?: string): string | null {
	if (typeof value !== 'string') return null;
	const line = value.replace(/\s+/g, ' ').trim();
	if (line.length < 8 || line.length > MAX_JAMIE_CHARS) return null;
	if (line.split(' ').length > MAX_JAMIE_WORDS) return null;
	if (!line.endsWith('?')) return null;
	if (/[*#<>{}[\]_`|\\$€£¥]/.test(line)) return null;
	if (/\b(?:dollars?|euros?|pounds?|discount|refund|upgrade fee|per night|free breakfast)\b/i.test(line)) return null;
	const allowed = new Set(['204', '512', variant === 'lift' ? '310' : '318']);
	for (const number of line.match(/\d+/g) ?? []) if (!allowed.has(number)) return null;
	const plain = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
	if (previous && plain(previous) === plain(line)) return null;
	return line;
}

function secret(): string | null {
	const key = env.JAMIE_VOICE_SECRET || env.OPENAI_API_KEY;
	return key ? `jamie-voice:${key}` : null;
}

export function signJamieLine(line: string): string | null {
	const key = secret();
	return key ? createHmac('sha256', key).update(line).digest('base64url') : null;
}

export function verifyJamieLine(line: string, signature: string | null): boolean {
	const expected = signJamieLine(line);
	if (!expected || !signature) return false;
	const a = Buffer.from(expected), b = Buffer.from(signature);
	return a.length === b.length && timingSafeEqual(a, b);
}
