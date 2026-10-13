/**
 * "Quick-fire questions", Module lab (owner-approved in chat): a fast chat of six short, personal
 * questions (IELTS Part 1 style). The first comes from our list; each next one follows from the
 * learner's last answer (AI, one small call), with a ready-made follow-up whenever the AI is slow,
 * fails, or asks something it shouldn't. Feedback waits until the end, so the chat keeps its pace.
 */
import { words } from './say-better';

export const QUESTIONS_PER_ROUND = 6;
export const ANSWER_MAX_SECONDS = 20;
/** Once they've spoken, this much quiet ends the answer by itself (keeps the pace). */
export const END_AFTER_QUIET = 2.5;
/** Nothing said for this long: the answer is treated as missed. */
export const NO_ANSWER_AFTER = 8;
/** Starting to speak within this counts as a quick start. */
export const QUICK_START_MS = 3000;
/** Waiting longer than this for the AI, Mira asks a ready-made follow-up instead. */
export const AI_WAIT_MS = 4000;

export interface Opener { question: string; followUps: string[] }
export const OPENERS: Opener[] = [
	{ question: 'What do you usually do after work or class?', followUps: [
		'How long have you been doing that?', 'Who do you usually do it with?', 'What do you like most about it?',
		'What did you do last weekend?', 'Is there something new you’d like to try in your free time?'
	] },
	{ question: 'What kind of food do you like?', followUps: [
		'Do you cook it yourself, or do you eat out?', 'What did you eat yesterday?', 'Is there a dish you’d like to learn to cook?',
		'What food did you love when you were a child?', 'Where’s your favourite place to eat?'
	] },
	{ question: 'Where do you live at the moment?', followUps: [
		'What do you like most about living there?', 'How long have you lived there?', 'What’s there to do near your home?',
		'How do you usually get around?', 'Would you like to live somewhere else one day?'
	] }
];

/** Never asked: topics that are political, religious or uncomfortably personal. */
const SENSITIVE = /\b(politic|government|president|election|religio|god|pray|mosque|church|hijab|war|money|salary|earn|income|rich|poor|boyfriend|girlfriend|married|divorce|marriage|sex|dating|ill|illness|sick|disease|death|died|die|weight|age|old are you|protest|police|prison|drug|alcohol|drink alcohol)\b/i;
/** Is an AI question fit to ask? Short, English, a question, nothing sensitive, not asked before. */
export function questionOk(question: string, asked: string[]): boolean {
	const q = question.trim();
	if (!q.endsWith('?') || /[؀-ۿ]/.test(q) || words(q).length < 3 || words(q).length > 15 || SENSITIVE.test(q)) return false;
	const key = words(q).join(' ');
	return !asked.some(a => words(a).join(' ') === key);
}
/** The next ready-made follow-up, never one already asked. */
export function fallbackQuestion(opener: number, asked: string[]): string {
	const used = new Set(asked.map(a => words(a).join(' ')));
	return OPENERS[opener].followUps.find(f => !used.has(words(f).join(' '))) ?? OPENERS[(opener + 1) % OPENERS.length].question;
}

/** Did the answer extend itself with a reason or an example? */
export const gaveReason = (answer: string) => /\b(because|cause|so|since|for example|for instance|that's why|that is why|but|actually|especially)\b/i.test(answer.replace(/’/g, "'"));
export const isExtended = (answer: string) => words(answer).length >= 10;

export interface Turn {
	question: string;
	answer: string | null;
	/** Their last answer said better (answer + reason + example); null while waiting or if it failed. */
	better: string | null;
	/** Milliseconds from the start of recording to their first sound; null if they never spoke. */
	startMs: number | null;
}
export interface QuickFireRecord { opener: number; turns: Turn[]; done: boolean }
export const emptyQuickFire = (opener = 0): QuickFireRecord => ({ opener, turns: [{ question: OPENERS[opener].question, answer: null, better: null, startMs: null }], done: false });
export function asQuickFire(value: unknown): QuickFireRecord | null {
	const r = value as QuickFireRecord | null;
	if (!r || typeof r !== 'object' || typeof r.done !== 'boolean' || !Number.isInteger(r.opener) || !OPENERS[r.opener] || !Array.isArray(r.turns) || !r.turns.length) return null;
	if (!r.turns.every(t => t && typeof t.question === 'string' && (t.answer === null || typeof t.answer === 'string'))) return null;
	return r;
}

export interface Summary { quick: number; reasons: number; extended: number; answered: number; tip: 'start' | 'reason' | 'longer' | 'great' }
export function summarize(turns: Turn[]): Summary {
	const answered = turns.filter(t => t.answer);
	const quick = turns.filter(t => t.startMs !== null && t.startMs <= QUICK_START_MS).length;
	const reasons = answered.filter(t => gaveReason(t.answer!)).length;
	const extended = answered.filter(t => isExtended(t.answer!)).length;
	const n = turns.length;
	// The weakest skill gets the tip.
	const tip = reasons < n / 2 ? 'reason' : extended < n / 2 ? 'longer' : quick < n / 2 ? 'start' : 'great';
	return { quick, reasons, extended, answered: answered.length, tip };
}
