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
	/** Their answer with only the mistakes corrected (same as the answer if it had none); null while waiting or if it failed. */
	fixed: string | null;
	/** Their answer said better (answer + reason + example); null while waiting or if it failed. */
	better: string | null;
	/** The answer didn't answer the question (after one second try). */
	offTopic: boolean;
	/** Already asked again once because the first answer was off topic. */
	retried: boolean;
	/** Milliseconds from the start of recording to their first sound; null if they never spoke. */
	startMs: number | null;
}
export interface QuickFireRecord { opener: number; turns: Turn[]; done: boolean }
export const newTurn = (question: string): Turn => ({ question, answer: null, fixed: null, better: null, offTopic: false, retried: false, startMs: null });
export const emptyQuickFire = (opener = 0): QuickFireRecord => ({ opener, turns: [newTurn(OPENERS[opener].question)], done: false });
export function asQuickFire(value: unknown): QuickFireRecord | null {
	const r = value as QuickFireRecord | null;
	if (!r || typeof r !== 'object' || typeof r.done !== 'boolean' || !Number.isInteger(r.opener) || !OPENERS[r.opener] || !Array.isArray(r.turns) || !r.turns.length) return null;
	if (!r.turns.every(t => t && typeof t.question === 'string' && (t.answer === null || typeof t.answer === 'string'))) return null;
	// Records saved before corrections and the topic check existed.
	return { ...r, turns: r.turns.map(t => ({ ...newTurn(t.question), ...t, fixed: t.fixed ?? null, offTopic: t.offTopic === true, retried: t.retried === true })) };
}

export interface Summary { quick: number; reasons: number; extended: number; answered: number; offTopic: number; tip: 'topic' | 'start' | 'reason' | 'longer' | 'great' }
export function summarize(turns: Turn[]): Summary {
	const answered = turns.filter(t => t.answer);
	const quick = turns.filter(t => t.startMs !== null && t.startMs <= QUICK_START_MS).length;
	const reasons = answered.filter(t => gaveReason(t.answer!)).length;
	const extended = answered.filter(t => isExtended(t.answer!)).length;
	const n = turns.length;
	// The weakest skill gets the tip.
	const offTopic = answered.filter(t => t.offTopic).length;
	const tip = offTopic ? 'topic' : reasons < n / 2 ? 'reason' : extended < n / 2 ? 'longer' : quick < n / 2 ? 'start' : 'great';
	return { quick, reasons, extended, answered: answered.length, offTopic, tip };
}

const key = (text: string) => words(text).join(' ');
/** The corrected answer is the same as what they said (no mistakes). */
export const sameAnswer = (fixed: string, answer: string) => key(fixed) === key(answer);
/** The corrected answer as parts (shown with a space between them), with the words that changed from what they said marked (word-by-word, longest common sequence). */
export function changedParts(answer: string, fixed: string): { text: string; changed: boolean }[] {
	const a = words(answer), pieces = fixed.trim().split(/\s+/).filter(Boolean), b = pieces.map(p => words(p).join(' '));
	const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
	for (let i = a.length - 1; i >= 0; i--) for (let j = b.length - 1; j >= 0; j--)
		table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
	const kept = new Array<boolean>(b.length).fill(false);
	for (let i = 0, j = 0; i < a.length && j < b.length;) {
		if (a[i] === b[j]) { kept[j] = true; i++; j++; } else if (table[i + 1][j] >= table[i][j + 1]) i++; else j++;
	}
	// Neighbouring words of the same kind join into one part.
	const parts: { text: string; changed: boolean }[] = [];
	pieces.forEach((piece, j) => {
		const changed = !kept[j] && b[j] !== '', last = parts[parts.length - 1];
		if (last && last.changed === changed) last.text += ' ' + piece; else parts.push({ text: piece, changed });
	});
	return parts;
}
