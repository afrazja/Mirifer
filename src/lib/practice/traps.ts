/**
 * "Persian-speaker traps", Module lab (owner-approved in chat). Each sentence has one mistake that
 * Persian speakers often make (he/she, "I am agree", "said me"…). The learner first taps the
 * mistake, reads why, then says the sentence correctly. Checked in code, no AI: speech-to-text
 * writes what they said, and the fix must be there and the mistake gone. Recordings are never stored.
 */
import type { DisplayText } from './hotel';

export const SAY_MAX_SECONDS = 12;
export const SAY_MIN_SECONDS = 0.6;
/** Wrong taps before the mistake is shown. */
export const MAX_WRONG_TAPS = 2;

export interface Trap {
	id: string;
	/** What kind of trap, for the end list (and later review by type). */
	kind: DisplayText;
	/** The sentence with the mistake, word by word. */
	words: string[];
	/** The index of the wrong word (the one to tap). */
	wrong: number;
	/** Other words that are also a sensible fix (credited, with the sentence it makes, then the usual mistake is shown). */
	alsoOk?: { index: number; sentence: string }[];
	/** The sentence said correctly. */
	right: string;
	/** Why, in short, through the Persian that causes it. */
	why: DisplayText;
	/** What the learner says must match one of these (after normalising)… */
	accept: RegExp[];
	/** …and none of these (the mistake again). */
	reject: RegExp[];
	/** Good English that avoids the point of the drill: praised, then asked for the target word. */
	alsoGood?: { patterns: RegExp[]; word: string };
}

export const TRAPS: Trap[] = [
	{
		id: 'he-she', kind: { en: 'he / she', fa: 'he / she' },
		words: ['My', 'sister', 'is', 'a', 'doctor.', 'He', 'works', 'at', 'night.'], wrong: 5, alsoOk: [{ index: 1, sentence: 'My brother is a doctor. He works at night.' }],
		right: 'My sister is a doctor. She works at night.',
		why: { en: 'In Persian, «او» means both he and she. In English, a woman is “she”.', fa: 'در فارسی «او» هم برای مرد است هم برای زن. در انگلیسی برای زن «she» می‌گوییم.' },
		accept: [/\bshe(?: works|'s working| is working)\b/], reject: [/\bhe(?: works|'s working| is working)\b/]
	},
	{
		id: 'agree', kind: { en: 'agree (no “am”)', fa: 'agree (بدون am)' },
		words: ['I', 'am', 'agree', 'with', 'you.'], wrong: 1,
		right: 'I agree with you.',
		why: { en: '“Agree” is a verb, so you don’t need “am”. Say “I agree”, like “I like”.', fa: 'در فارسی می‌گوییم «موافق هستم»، ولی «agree» خودش فعل است، مثل «like». پس «I agree»، نه «I am agree».' },
		accept: [/\bi (?:really |totally |completely |fully |absolutely |also |do )?agree\b/], reject: [/\b(?:i am|i'm|im) (?:really |totally |completely )?agree\b/]
	},
	{
		id: 'said-told', kind: { en: 'say / tell', fa: 'say / tell' },
		words: ['He', 'said', 'me', 'the', 'answer.'], wrong: 1, alsoOk: [{ index: 2, sentence: 'He said the answer.' }],
		right: 'He told me the answer.',
		why: { en: '“Tell” + a person: “He told me.” “Say” + what was said: “He said it was easy.”', fa: 'در فارسی هر دو «گفت» است. اگر بعدش آدم بیاید (me، him)، «tell» بگو: «He told me». بعد از «say» آدم نمی‌آید.' },
		accept: [/\btold me\b/], reject: [/\bsaid me\b/],
		alsoGood: { patterns: [/\bgave me the answer\b/], word: 'told' }
	},
	{
		id: 'age', kind: { en: 'age: I’m 30', fa: 'سن: I’m 30' },
		words: ['I', 'have', 'thirty', 'years', 'old.'], wrong: 1,
		right: "I'm thirty years old.",
		why: { en: 'In English you “are” your age: “I’m thirty (years old)”, not “I have thirty years”.', fa: 'در فارسی می‌گوییم «سی سال دارم»، ولی در انگلیسی سن را با «am» می‌گوییم: «I’m thirty years old».' },
		accept: [/\b(?:i'm|i am|im) (?:thirty|30)\b/], reject: [/\bi have (?:thirty|30)\b/]
	},
	{
		id: 'since-for', kind: { en: 'since / for', fa: 'since / for' },
		words: ["I've", 'lived', 'here', 'since', 'two', 'years.'], wrong: 3,
		right: "I've lived here for two years.",
		why: { en: '“For” + how long (two years). “Since” + when it started (2020, last May).', fa: '«for» برای مدت است و «since» برای زمان شروع. «دو سال است که…» می‌شود «for two years»؛ «از ۲۰۲۰» می‌شود «since 2020».' },
		accept: [/\bfor (?:two|2) years\b/], reject: [/\bsince (?:two|2) years\b/]
	},
	{
		id: 'than', kind: { en: 'taller than', fa: 'taller than' },
		words: ['My', 'brother', 'is', 'taller', 'from', 'me.'], wrong: 4,
		right: 'My brother is taller than me.',
		why: { en: 'After “taller”, “bigger” or “older”, use “than”, not “from”.', fa: 'در فارسی می‌گوییم «از من بلندتر»، ولی در انگلیسی بعد از «taller» کلمهٔ «than» می‌آید، نه «from».' },
		accept: [/\btaller than\b/], reject: [/\btaller from\b/]
	},
	{
		id: 'afraid-of', kind: { en: 'afraid of', fa: 'afraid of' },
		words: ['My', 'son', 'is', 'afraid', 'from', 'dogs.'], wrong: 4,
		right: 'My son is afraid of dogs.',
		why: { en: 'We say “afraid of” and “scared of”, not “from”.', fa: 'در فارسی می‌گوییم «از سگ می‌ترسد»، ولی در انگلیسی «afraid of» می‌گوییم، نه «from».' },
		accept: [/\b(?:afraid|scared) of\b/], reject: [/\b(?:afraid|scared) from\b/]
	},
	{
		id: 'bored', kind: { en: 'bored / boring', fa: 'bored / boring' },
		words: ["I'm", 'so', 'boring', 'today.', "Let's", 'go', 'out.'], wrong: 2, alsoOk: [{ index: 0, sentence: "It's so boring today. Let's go out." }],
		right: "I'm so bored today. Let's go out.",
		why: { en: '“Bored” is how you feel. “Boring” is what makes you feel it: “This movie is boring, so I’m bored.”', fa: '«bored» یعنی «حوصله‌ام سر رفته». «boring» یعنی «حوصله‌سربر» یا «خسته‌کننده». پس بگو «I’m bored»؛ «I’m boring» یعنی «من آدم حوصله‌سربری هستم».' },
		accept: [/\b(?:i'm|i am|im) (?:so |really |very )?bored\b/], reject: [/\b(?:i'm|i am|im) (?:so |really |very )?boring\b/]
	}
];

/** Lower case, plain quotes and spaces, no punctuation: what speech-to-text wrote, ready to match. */
export function normalise(text: string): string {
	return text.toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Did they say it right? The fix must be there, and the mistake gone. */
export function saidRight(trap: Trap, transcript: string): boolean {
	return checkSaid(trap, transcript) === 'right';
}
/**
 * What they said: right; the mistake fixed in mid-sentence ("he said me, sorry, he told me");
 * good English that skips the drill's word ("He gave me the answer"); or wrong.
 */
export type SaidCheck = 'right' | 'selfFixed' | 'alsoGood' | 'wrong';
export function checkSaid(trap: Trap, transcript: string): SaidCheck {
	const said = normalise(transcript);
	const fixed = trap.accept.some(r => r.test(said)), mistake = trap.reject.some(r => r.test(said));
	if (fixed && !mistake) return 'right';
	if (fixed && mistake) return 'selfFixed';
	if (!mistake && trap.alsoGood?.patterns.some(r => r.test(said))) return 'alsoGood';
	return 'wrong';
}

export interface TrapState {
	/** Wrong taps so far (the mistake is shown after MAX_WRONG_TAPS). */
	wrongTaps: number[];
	/** Found the mistake by tapping (false if it was shown). */
	found: boolean | null;
	/** The last check of what they said. */
	said: boolean | null;
	/** Ever said right (kept if a later try is wrong). */
	saidRight: boolean;
	transcript: string | null;
}
export interface TrapsRecord {
	index: number; step: 'spot' | 'say'; traps: TrapState[]; done: boolean;
	/** Practising only the missed sentences (their indexes, in order), or null for the full round. */
	retry?: number[] | null;
}
/** The sentences not yet said right, to practise again. */
export const missedOf = (record: TrapsRecord) => record.traps.map((t, i) => (t.saidRight ? -1 : i)).filter(i => i >= 0);
const freshTrap = (): TrapState => ({ wrongTaps: [], found: null, said: null, saidRight: false, transcript: null });
export const emptyTrapsRecord = (traps: Trap[] = TRAPS): TrapsRecord => ({ index: 0, step: 'spot', traps: traps.map(freshTrap), done: false, retry: null });

export function asTrapsRecord(value: unknown, traps: Trap[] = TRAPS): TrapsRecord | null {
	if (!value || typeof value !== 'object') return null;
	const v = value as Partial<TrapsRecord>;
	if (typeof v.index !== 'number' || typeof v.done !== 'boolean' || (v.step !== 'spot' && v.step !== 'say')) return null;
	if (!Array.isArray(v.traps) || v.traps.length !== traps.length) return null;
	const ok = v.traps.every(t => t && typeof t === 'object' && Array.isArray(t.wrongTaps) && typeof t.saidRight === 'boolean');
	const retry = Array.isArray(v.retry) && v.retry.every(i => Number.isInteger(i) && i >= 0 && i < traps.length) ? v.retry : null;
	return ok ? { index: Math.max(0, Math.min(traps.length, Math.floor(v.index))), step: v.step, traps: v.traps, done: v.done, retry } : null;
}

export function summarize(record: TrapsRecord): { found: number; said: number; total: number } {
	return { found: record.traps.filter(t => t.found).length, said: record.traps.filter(t => t.saidRight).length, total: record.traps.length };
}
