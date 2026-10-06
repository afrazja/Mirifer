/**
 * "Say it again, better": the rules shared by the server and the browser.
 * Spec: docs/english-say-it-better-spec.md (owner-approved v2).
 */
import type { DisplayText } from './hotel';

export const MAX_SECONDS = 60;
export const MIN_SECONDS = 10;
export const MAX_FIXES = 3;
/** "Strong" (a pass with no fixes) needs a real answer, not a short safe one. */
export const STRONG_MIN_WORDS = 40;
/** Under this, or off-topic/Persian, Mira asks for a bit more. */
export const TOO_SHORT_WORDS = 15;

export interface Fix { type: 'mistake' | 'natural'; original: string; better: string; why: DisplayText }
export type FeedbackCase = 'mistakes' | 'natural' | 'strong' | 'more';
export interface Feedback { case: FeedbackCase; fixes: Fix[]; better: string | null; praise: DisplayText | null }

/** Lower case, plain apostrophes, contractions spelled out ("didn't" = "did not"), no punctuation. */
export const normalise = (text: string) => text.toLowerCase().replace(/[’`]/g, "'")
	.replace(/\bwon't\b/g, 'will not').replace(/\bcan't\b/g, 'can not').replace(/\bcannot\b/g, 'can not').replace(/n't\b/g, ' not')
	.replace(/'m\b/g, ' am').replace(/'re\b/g, ' are').replace(/'ve\b/g, ' have').replace(/'ll\b/g, ' will').replace(/'d\b/g, ' would')
	.replace(/[^\p{L}\p{N}' ]+/gu, ' ').replace(/\s+/g, ' ').trim();
export const words = (text: string) => normalise(text).split(' ').filter(Boolean);

/** The server, not the model, decides the case. */
export function decideCase(fixes: Fix[], transcript: string): FeedbackCase {
	if (fixes.some(fix => fix.type === 'mistake')) return 'mistakes';
	if (fixes.length) return 'natural';
	return words(transcript).length >= STRONG_MIN_WORDS ? 'strong' : 'more';
}

export type FixUse = 'used' | 'missed' | 'absent';

/** What the module keeps in this browser for the day (reload, Back). */
export interface SayRecord {
	transcript1: string | null; seconds1: number; feedback: Feedback | null;
	transcript2: string | null; seconds2: number; uses: FixUse[]; done: boolean;
}

/** Checks a saved record before using it (it comes back from browser storage). */
export function asSayRecord(value: unknown): SayRecord | null {
	const r = value as SayRecord | null;
	if (!r || typeof r !== 'object' || typeof r.done !== 'boolean' || !Array.isArray(r.uses)) return null;
	if (r.transcript1 !== null && typeof r.transcript1 !== 'string') return null;
	if (r.transcript2 !== null && typeof r.transcript2 !== 'string') return null;
	const f = r.feedback;
	if (f !== null && (typeof f !== 'object' || !Array.isArray(f.fixes) || !['mistakes', 'natural', 'strong', 'more'].includes(f.case))) return null;
	return r;
}
/**
 * Did the second attempt use a fix? Used: the corrected words appear together
 * with at least one nearby word from the original phrase (so "the" alone never
 * counts). Missed: the original mistake came back. Otherwise it didn't come up.
 */
export function fixUse(fix: Fix, second: string): FixUse {
	const said = ` ${normalise(second)} `;
	const original = normalise(fix.original), better = normalise(fix.better);
	if (original && said.includes(` ${original} `) && original !== better) return 'missed';
	if (!better || !said.includes(` ${better} `)) return 'absent';
	const betterWords = new Set(better.split(' '));
	const anchors = original.split(' ').filter(word => !betterWords.has(word) || word.length > 3);
	const context = original.split(' ').filter(word => word.length > 2);
	const near = (anchors.length ? anchors : context).some(word => said.includes(` ${word} `));
	return near || better.split(' ').length >= 3 ? 'used' : 'absent';
}

/** Progress score (numbers only): strong = 1/1; else fixes used / (used + missed). */
export function scoreFor(feedback: Feedback, uses: FixUse[]): { correct: number; total: number } | undefined {
	if (feedback.case === 'strong') return { correct: 1, total: 1 };
	const used = uses.filter(use => use === 'used').length, missed = uses.filter(use => use === 'missed').length;
	return used + missed ? { correct: used, total: used + missed } : undefined;
}

/** Recording length in whole seconds, capped. */
export const clampSeconds = (seconds: number) => Math.max(0, Math.min(MAX_SECONDS, Math.round(seconds)));
