/**
 * "Say it again, better", Module lab version (docs/english-say-better-lab-spec.md,
 * owner-approved v2). The owner's rule: never let a mistake pass as correct. Every
 * mistake is shown; only the one or two most important are practised.
 */
import type { DisplayText } from './hotel';
import { normalise, type Fix, type FixUse } from './say-better';

export const LAB_MAX_SECONDS = 45, LAB_MIN_SECONDS = 10, LAB_NUDGE_SECONDS = 15, LAB_AMBER_AT = 35;
export const LAB_MAX_FOCUS = 2;
/** Under this, or off-topic/Persian, Mira asks for a bit more. */
export const LAB_TOO_SHORT_WORDS = 12;
/** "No mistakes" needs a real answer, not a short safe one. */
export const LAB_STRONG_MIN_WORDS = 30;

export interface LabQuestion { id: number; text: string; topic: string; tense: string }
export const LAB_QUESTIONS: LabQuestion[] = [
	{ id: 1, text: 'What do you usually do on weekends?', topic: 'their usual weekends', tense: 'present simple (habits)' },
	{ id: 2, text: "Tell me about a place you'd like to visit, and why.", topic: "a place they'd like to visit", tense: "would like to, and because" },
	{ id: 3, text: 'Tell me about a good day you had recently.', topic: 'a good day they had recently', tense: 'past simple' },
	{ id: 4, text: "Tell me about someone who's helped you a lot.", topic: 'a person who helped them', tense: 'he/she, past and present' },
	{ id: 5, text: "What do you like about where you live? Is there anything you don't like?", topic: 'where they live', tense: 'present simple, there is/are' },
	{ id: 6, text: "Tell me about a habit you'd like to change.", topic: "a habit they'd like to change", tense: 'would like to, trying to' }
];
export const labQuestion = (id: number) => LAB_QUESTIONS.find(q => q.id === id) ?? null;

/** Fixed kinds, in the order the focus fixes are chosen (meaning first, articles last). */
export const KINDS = ['unclear', 'word choice', 'tense', 'verb form', 'he/she', 'missing word', 'plural/agreement', 'preposition', 'word order', 'a/the'] as const;
export type MistakeKind = (typeof KINDS)[number];
export const KIND_LABEL: Record<MistakeKind, DisplayText> = {
	unclear: { en: 'unclear', fa: 'نامفهوم' }, 'word choice': { en: 'word choice', fa: 'انتخاب کلمه' }, tense: { en: 'tense', fa: 'زمان فعل' },
	'verb form': { en: 'verb form', fa: 'شکل فعل' }, 'he/she': { en: 'he/she', fa: 'he/she' }, 'missing word': { en: 'missing word', fa: 'کلمهٔ جاافتاده' },
	'plural/agreement': { en: 'plural/agreement', fa: 'جمع/مطابقت' }, preposition: { en: 'preposition', fa: 'حرف اضافه' }, 'word order': { en: 'word order', fa: 'ترتیب کلمه‌ها' }, 'a/the': { en: 'a/the', fa: 'a/the' }
};
/** A short reason per kind, used when the model's reason can't be matched to a focus fix. */
export const KIND_WHY: Record<MistakeKind, DisplayText> = {
	unclear: { en: 'This part was hard to understand.', fa: 'این بخش سخت فهمیده می‌شد.' },
	'word choice': { en: 'This word changes the meaning here.', fa: 'این کلمه معنی را عوض می‌کند.' },
	tense: { en: 'The time of the action needs this tense.', fa: 'زمان کار این زمان فعل را لازم دارد.' },
	'verb form': { en: 'The verb needs this form here.', fa: 'فعل اینجا این شکل را لازم دارد.' },
	'he/she': { en: 'Use he for a man, she for a woman.', fa: 'برای مرد he و برای زن she.' },
	'missing word': { en: 'English needs this word here.', fa: 'انگلیسی اینجا این کلمه را لازم دارد.' },
	'plural/agreement': { en: 'The words need to match: one or many.', fa: 'کلمه‌ها باید با هم جور باشند: یکی یا چندتا.' },
	preposition: { en: 'English uses this small word here.', fa: 'انگلیسی اینجا این حرف اضافه را به کار می‌برد.' },
	'word order': { en: 'English puts these words in this order.', fa: 'انگلیسی این کلمه‌ها را به این ترتیب می‌گوید.' },
	'a/the': { en: 'English needs a or the here.', fa: 'انگلیسی اینجا a یا the لازم دارد.' }
};

/** One mistake as the page draws it. Spans are [start, end) character positions, worked out by the server. */
export interface LabMistake {
	original: string; better: string; kind: MistakeKind;
	/** 1 or 2 for a focus fix, 0 for the rest. */
	focus: 0 | 1 | 2;
	/** The changed words in the transcript. */
	at: [number, number];
	/** The changed words in the better version; null when the part was left out. */
	inBetter: [number, number] | null;
}
export type LabCase = 'mistakes' | 'natural' | 'strong' | 'more';
export interface LabFeedback {
	case: LabCase;
	mistakes: LabMistake[];
	/** The focus fixes, in order (same shape as Tell your story's, for the second-try check). */
	fixes: Fix[];
	better: string | null;
	praise: DisplayText | null;
	/** Where the one "more natural" fix sits (natural case only). */
	natural: { at: [number, number]; inBetter: [number, number] | null } | null;
}

/**
 * Picks the focus fixes from all mistakes: by kind order, repeated kinds first, two different kinds,
 * a/the only when repeated. A left-out part (no better words) can't be practised, so it is never one.
 */
export function chooseFocus(mistakes: { kind: MistakeKind; better?: string }[], max = LAB_MAX_FOCUS): number[] {
	const countOf = (kind: MistakeKind) => mistakes.filter(m => m.kind === kind).length;
	const practicable = (i: number) => mistakes[i].better !== '';
	const order = mistakes.map((m, i) => i)
		.filter(i => practicable(i) && (mistakes[i].kind !== 'a/the' || countOf('a/the') >= 2))
		.sort((x, y) => {
			const kx = KINDS.indexOf(mistakes[x].kind), ky = KINDS.indexOf(mistakes[y].kind);
			const rx = countOf(mistakes[x].kind) > 1 ? 0 : 1, ry = countOf(mistakes[y].kind) > 1 ? 0 : 1;
			return kx - ky || rx - ry || x - y;
		});
	const chosen: number[] = [];
	for (const i of order) {
		if (chosen.length >= max) break;
		if (chosen.some(c => mistakes[c].kind === mistakes[i].kind)) continue;
		chosen.push(i);
	}
	// Only a/the mistakes, said once: still practise one, never pretend there's nothing.
	const first = mistakes.findIndex((_, i) => practicable(i));
	if (!chosen.length && first >= 0) chosen.push(first);
	return chosen;
}

/** A word of a text with where it sits; `norm` is the word normalised. */
export interface Token { norm: string; from: number; to: number }
export function tokens(text: string): Token[] {
	// "didn't" becomes two words ("did", "not") that share its position, so either spelling matches.
	return [...text.matchAll(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu)]
		.flatMap(m => normalise(m[0]).split(' ').filter(Boolean).map(norm => ({ norm, from: m.index!, to: m.index! + m[0].length })));
}
const sameWords = (a: Token[], b: Token[]) => a.length === b.length && a.every((t, i) => t.norm === b[i].norm);

/** Every place (as token index ranges [i, j)) where `phrase` appears in `text`'s tokens. */
export function occurrences(text: Token[], phrase: string): [number, number][] {
	const want = tokens(phrase);
	const found: [number, number][] = [];
	if (!want.length) return found;
	for (let i = 0; i + want.length <= text.length; i++) if (sameWords(text.slice(i, i + want.length), want)) found.push([i, i + want.length]);
	return found;
}

/**
 * The words that really changed between a mistake and its correction, as token ranges inside each:
 * the shared words at the start and end are left unmarked. When one side has no changed words
 * (a word added or removed), a neighbouring word is included so there is always something to mark.
 */
export function changedRange(original: Token[], better: Token[]): { a: [number, number]; b: [number, number] } {
	let start = 0;
	while (start < original.length && start < better.length && original[start].norm === better[start].norm) start++;
	let endA = original.length, endB = better.length;
	while (endA > start && endB > start && original[endA - 1].norm === better[endB - 1].norm) { endA--; endB--; }
	if (endA === start) {
		// A word was added: mark the words on both sides of where it goes ("to park" -> "to the park").
		if (start > 0) start--;
		if (endA < original.length) { endA++; endB++; }
	} else if (endB === start) {
		// A word was taken out: in the better version, mark the word before the gap.
		if (start > 0) start--; else { endA = Math.min(original.length, endA + 1); endB = Math.min(better.length, endB + 1); }
	}
	return { a: [start, Math.max(start + 1, endA)].map(n => Math.min(n, original.length)) as [number, number], b: [start, Math.max(start + 1, endB)].map(n => Math.min(n, better.length)) as [number, number] };
}
/** Character positions of a token range. */
export const charSpan = (list: Token[], [i, j]: [number, number]): [number, number] => [list[i].from, list[j - 1].to];

/** The count line under "What you said". Counts mistakes only, never "more natural" suggestions. */
export function countLine(c: LabCase, count: number, focus: number): DisplayText {
	const fa = (n: number) => n.toLocaleString('fa-IR');
	if (c === 'strong') return { en: 'I didn’t hear any mistakes there. That was clear.', fa: 'اشتباهی نشنیدم. روشن بود.' };
	if (c === 'natural') return { en: 'No mistakes there. Here’s one way to make it sound more natural.', fa: 'اشتباهی نبود. این یک راه است که طبیعی‌تر به نظر برسد.' };
	if (count === 1) return { en: 'There’s one thing to fix. Let’s work on it now.', fa: 'یک چیز برای درست کردن هست. همین حالا رویش کار کنیم.' };
	if (count === 2 && focus === 2) return { en: 'There are two things to fix. Let’s work on both now.', fa: 'دو چیز برای درست کردن هست. همین حالا روی هر دو کار کنیم.' };
	const practise = focus === 1 ? { en: 'the one', fa: 'همان یکی' } : { en: `the ${focus}`, fa: `آن ${fa(focus)} مورد` };
	if (count >= 6) return {
		en: `There are ${count} things to fix. Let’s not try to fix everything at once. We’ll practise ${focus} now, and you’ll see the rest in your better version.`,
		fa: `${fa(count)} چیز برای درست کردن هست. لازم نیست همه را یک‌جا درست کنیم. الان ${fa(focus)} مورد را تمرین می‌کنیم و بقیه را در نسخهٔ بهترت می‌بینی.`
	};
	return {
		en: `There are ${count} things to fix. Let’s practise ${practise.en} that matter${focus === 1 ? 's' : ''} most. You’ll see the rest in your better version.`,
		fa: `${fa(count)} چیز برای درست کردن هست. ${practise.fa} را که مهم‌تر است تمرین می‌کنیم. بقیه را در نسخهٔ بهترت می‌بینی.`
	};
}

/** Splits a text into plain parts and marked parts, from server-made spans (they never overlap). */
export function markParts(text: string, spans: { at: [number, number] | null; focus: number }[]): { text: string; focus: number | null }[] {
	const sorted = spans.filter(s => s.at && s.at[0] >= 0 && s.at[1] <= text.length && s.at[1] > s.at[0]).sort((a, b) => a.at![0] - b.at![0]);
	const parts: { text: string; focus: number | null }[] = [];
	let cursor = 0;
	for (const span of sorted) {
		const [from, to] = span.at!;
		if (from < cursor) continue;
		if (from > cursor) parts.push({ text: text.slice(cursor, from), focus: null });
		parts.push({ text: text.slice(from, to), focus: span.focus });
		cursor = to;
	}
	if (cursor < text.length) parts.push({ text: text.slice(cursor), focus: null });
	return parts;
}

export type LabStep = 'question' | 'heard' | 'fix' | 'better' | 'retry' | 'result';
/** What a lab run keeps in this browser (reload, Back). Recordings are never stored. */
export interface LabRecord {
	question: number;
	step: LabStep;
	fixIndex: number;
	transcript1: string | null; seconds1: number; cut1: boolean;
	feedback: LabFeedback | null;
	transcript2: string | null; seconds2: number;
	uses: FixUse[];
	done: boolean;
}
export const emptyLabRecord = (question = 1): LabRecord => ({ question, step: 'question', fixIndex: 0, transcript1: null, seconds1: 0, cut1: false, feedback: null, transcript2: null, seconds2: 0, uses: [], done: false });

/** Checks a saved record before using it (it comes back from browser storage). */
export function asLabRecord(value: unknown): LabRecord | null {
	const r = value as LabRecord | null;
	if (!r || typeof r !== 'object' || typeof r.done !== 'boolean' || !labQuestion(r.question) || !Array.isArray(r.uses)) return null;
	if (!['question', 'heard', 'fix', 'better', 'retry', 'result'].includes(r.step)) return null;
	for (const key of ['transcript1', 'transcript2'] as const) if (r[key] !== null && typeof r[key] !== 'string') return null;
	const f = r.feedback;
	if (f !== null && (typeof f !== 'object' || !Array.isArray(f.mistakes) || !Array.isArray(f.fixes) || !['mistakes', 'natural', 'strong', 'more'].includes(f.case))) return null;
	return { ...r, fixIndex: Number.isInteger(r.fixIndex) ? r.fixIndex : 0 };
}
