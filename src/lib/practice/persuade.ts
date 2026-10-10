/**
 * "Choose and persuade" (docs/english-choose-persuade-spec.md, owner-approved v2):
 * two apartments, one choice, two reasons, one objection from Mira, an answer, then
 * feedback and a second try. The apartments and objections are written by us; the
 * server picks the objection and never lets the AI make one up.
 */
import type { DisplayText } from './hotel';
import { normalise, type Fix, type FixUse } from './say-better';

export type FlatId = 'a' | 'b';

export const REASONS_MAX = 60, REASONS_MIN = 15, ANSWER_MAX = 45, ANSWER_MIN = 10;
/** Under this many words, or mostly Persian, Mira asks for a bit more before objecting. */
export const REASONS_MIN_WORDS = 15;

export interface Flat {
	id: FlatId;
	label: string;
	title: string;
	photo: string;
	alt: string;
	/** One per row, in the same order for both apartments. */
	facts: string[];
}
export const ROWS: DisplayText[] = [
	{ en: 'Rent', fa: 'اجاره' }, { en: 'Size', fa: 'متراژ' }, { en: 'To work', fa: 'تا محل کار' }, { en: 'Building', fa: 'ساختمان' }, { en: 'Minus', fa: 'عیب' }
];
export const FLATS: Record<FlatId, Flat> = {
	a: { id: 'a', label: 'A · Studio', title: 'Studio in the city center', photo: '/images/lab/flat-a', alt: 'A small, bright studio with a balcony over a busy city street.',
		facts: ['€800 a month, bills included', '30 m², one room', '5-minute walk', '7th floor, no elevator, great view', 'Noisy street at night'] },
	b: { id: 'b', label: 'B · Garden apartment', title: 'Garden apartment in the suburbs', photo: '/images/lab/flat-b', alt: 'A warm dining room with a wooden table and a bay window onto a green garden.',
		facts: ['€950 a month, plus bills', '75 m², two bedrooms', '45 minutes by bus', 'Quiet street, shared garden', 'Old kitchen'] }
};

/** The facts as the AI sees them: id: fact. These are the only facts that exist. */
export const FACT_IDS = ['price', 'size', 'walk', 'floor', 'view', 'noise', 'bedrooms', 'commute', 'garden', 'quiet', 'kitchen', 'personal'] as const;
export type FactId = (typeof FACT_IDS)[number];

export interface Objection { point: string; line: string; again: string; keys: string[] }
export const OBJECTIONS: Record<FlatId, Objection[]> = {
	a: [
		{ point: 'noise', line: "But the street's noisy at night. How are you going to sleep?", again: "You said it's noisy, but every night? How are you going to sleep?", keys: ['noise', 'noisy', 'loud', 'quiet', 'street', 'earplugs'] },
		{ point: 'size', line: "It's only 30 square meters. Where will you put all your things?", again: 'You mentioned the size, but 30 square meters is really small. Where will your things go?', keys: ['small', 'size', 'space', 'tiny', 'square', 'meters', 'metres', 'big'] },
		{ point: 'stairs', line: 'Seven floors and no elevator? How will you carry your shopping up every day?', again: 'You talked about the stairs, but seven floors, every single day? Is that really OK?', keys: ['stairs', 'elevator', 'lift', 'floor', '7', 'seventh', 'climb'] }
	],
	b: [
		{ point: 'commute', line: "It's 45 minutes each way, so an hour and a half on the bus every day. Won't that get tiring?", again: "You said it's far, but an hour and a half every day? Won't that get tiring?", keys: ['bus', 'commute', 'travel', 'far', '45', 'hour'] },
		{ point: 'price', line: "It's €150 more a month, and that's before bills. Is the extra space really worth it?", again: 'You mentioned the price, but €150 more every month? Is it really worth it?', keys: ['price', 'euro', 'euros', 'expensive', 'cheap', 'money', 'cost', 'pay', 'bills', '950', '150'] },
		{ point: 'kitchen', line: "The kitchen's really old. Are you happy cooking in it every day?", again: "You said the kitchen's old, but every day? Are you sure you'll be happy cooking there?", keys: ['kitchen', 'cook', 'cooking'] }
	]
};

export interface Phrase { en: string; fa: string }
export const REASON_PHRASES: Phrase[] = [
	{ en: 'The main reason is that…', fa: 'دلیل اصلی این است که…' },
	{ en: 'Another thing is…', fa: 'یک چیز دیگر این است که…' },
	{ en: 'Even though it’s smaller, I…', fa: 'با اینکه کوچک‌تر است، من… (بدون but)' },
	{ en: 'For me, being close to work matters more than space.', fa: 'برای من نزدیک بودن به محل کار از فضا مهم‌تر است.' }
];
export const ANSWER_PHRASES: Phrase[] = [
	{ en: 'That’s true, but…', fa: 'درست است، ولی…' },
	{ en: 'You have a point, but…', fa: 'حق با توست، ولی…' },
	{ en: 'It’s not a big problem for me, because…', fa: 'برای من مشکل بزرگی نیست، چون…' },
	{ en: 'I can always…', fa: 'همیشه می‌توانم… (یک راه‌حل)' }
];

const NUMBERS: Record<string, string> = { seven: '7', seventh: '7', 'forty five': '45', 'forty-five': '45', 'one hundred fifty': '150', 'a hundred and fifty': '150', 'one hundred and fifty': '150', 'hundred and fifty': '150', 'nine hundred fifty': '950', 'nine hundred and fifty': '950', thirty: '30', eight: '8', 'eight hundred': '800' };
/** Lower case, no punctuation, contractions spelled out, number words as digits. */
export function normaliseSaid(text: string): string {
	let said = ` ${normalise(text.replace(/-/g, ' '))} `;
	for (const [word, digit] of Object.entries(NUMBERS).sort((x, y) => y[0].length - x[0].length)) said = said.replaceAll(` ${word.replace(/-/g, ' ')} `, ` ${digit} `);
	return said;
}
const mentions = (said: string, key: string) => said.includes(` ${key} `);

/**
 * The objection for the chosen apartment: the first whose key words the learner didn't use.
 * If they covered every point, the second form of the least-mentioned one, so Mira never
 * sounds as if she wasn't listening.
 */
export function pickObjection(flat: FlatId, reasons: string): { point: string; line: string } {
	const said = normaliseSaid(reasons);
	const list = OBJECTIONS[flat];
	const free = list.find(o => !o.keys.some(key => mentions(said, key)));
	if (free) return { point: free.point, line: free.line };
	const count = (o: Objection) => o.keys.reduce((n, key) => n + said.split(` ${key} `).length - 1, 0);
	const least = [...list].sort((x, y) => count(x) - count(y))[0];
	return { point: least.point, line: least.again };
}
export const objectionPoint = (flat: FlatId, point: string) => OBJECTIONS[flat].find(o => o.point === point) ?? null;

const PERSIAN = /[؀-ۿ]/g;
/** Too little to object to: under 15 words, or mostly Persian. */
export function tooLittle(transcript: string): boolean {
	const persian = (transcript.match(PERSIAN) ?? []).length;
	const latin = (transcript.match(/[a-z]/gi) ?? []).length;
	return normalise(transcript).split(' ').filter(Boolean).length < REASONS_MIN_WORDS || persian > latin;
}

export type Verdict = 'answered' | 'partly' | 'not answered';
export interface PersuadeFeedback {
	reasons: { text: string; fact: FactId }[];
	objection: { verdict: Verdict; line: DisplayText } | null;
	/** Phrases to sound more persuasive (same shape as Tell your story's fixes, for the second try). */
	phrases: Fix[];
	praise: DisplayText | null;
	/** The answer switched apartment with a reason. */
	switched: boolean;
}

/** What the module keeps in this browser for the day (reload, Back). Recordings are never stored. */
export interface PersuadeRecord {
	flat: FlatId | null;
	reasons: string | null;
	objection: { point: string; line: string } | null;
	answer: string | null;
	feedback: PersuadeFeedback | null;
	again: string | null;
	uses: FixUse[];
	done: boolean;
}
export const emptyPersuadeRecord = (): PersuadeRecord => ({ flat: null, reasons: null, objection: null, answer: null, feedback: null, again: null, uses: [], done: false });

/** Checks a saved record before using it (it comes back from browser storage). */
export function asPersuadeRecord(value: unknown): PersuadeRecord | null {
	const r = value as PersuadeRecord | null;
	if (!r || typeof r !== 'object' || typeof r.done !== 'boolean' || !Array.isArray(r.uses)) return null;
	if (r.flat !== null && r.flat !== 'a' && r.flat !== 'b') return null;
	for (const key of ['reasons', 'answer', 'again'] as const) if (r[key] !== null && typeof r[key] !== 'string') return null;
	if (r.objection !== null && (typeof r.objection?.line !== 'string' || typeof r.objection?.point !== 'string')) return null;
	if (r.feedback !== null && (typeof r.feedback !== 'object' || !Array.isArray(r.feedback.reasons) || !Array.isArray(r.feedback.phrases))) return null;
	return r;
}
