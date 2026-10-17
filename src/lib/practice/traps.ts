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
	/** What kind of trap, for later review by type. */
	kind: DisplayText;
	/** The sentence with the mistake, word by word. */
	words: string[];
	/** The index of the wrong word (the one to tap). */
	wrong: number;
	/** The sentence said correctly. */
	right: string;
	/** Why, in short; the Persian explains it through Persian. */
	why: DisplayText;
	/** What the learner says must match one of these (after normalising)… */
	accept: RegExp[];
	/** …and none of these (the mistake again). */
	reject: RegExp[];
}

export const TRAPS: Trap[] = [
	{
		id: 'he-she', kind: { en: 'he / she', fa: 'he / she' },
		words: ['My', 'sister', 'is', 'a', 'nurse.', 'He', 'works', 'at', 'night.'], wrong: 5,
		right: 'My sister is a nurse. She works at night.',
		why: { en: 'In Persian, «او» means both he and she. In English, a woman is “she”.', fa: 'در فارسی «او» هم برای مرد است هم برای زن. در انگلیسی برای زن «she» می‌گوییم.' },
		accept: [/\bshe works\b/, /\bshe's working\b/], reject: [/\bhe works\b/, /\bhe's working\b/]
	},
	{
		id: 'agree', kind: { en: 'I am agree', fa: 'I am agree' },
		words: ['I', 'am', 'agree', 'with', 'you.'], wrong: 1,
		right: 'I agree with you.',
		why: { en: '“Agree” is a verb, like “like”: say “I agree”, not “I am agree”.', fa: '«agree» خودش فعل است، مثل «like». پس بگو «I agree»، نه «I am agree».' },
		accept: [/\bi agree\b/, /\bi totally agree\b/, /\bi completely agree\b/], reject: [/\b(i am|i'm|im) (totally |completely )?agree\b/]
	},
	{
		id: 'said-told', kind: { en: 'say / tell', fa: 'say / tell' },
		words: ['He', 'said', 'me', 'the', 'answer.'], wrong: 1,
		right: 'He told me the answer.',
		why: { en: 'With a person after it, use “tell”: “He told me”. “Say” has no person after it: “He said that…”.', fa: 'وقتی بعدش «به کسی» می‌آید، «tell» می‌گوییم: «He told me». بعد از «say» اسم آدم نمی‌آید.' },
		accept: [/\btold me\b/, /\bsaid the answer to me\b/], reject: [/\bsaid me\b/]
	},
	{
		id: 'go-home', kind: { en: 'go home', fa: 'go home' },
		words: ["I'm", 'going', 'to', 'home', 'now.'], wrong: 2,
		right: "I'm going home now.",
		why: { en: 'No “to” before “home”: “go home”, “come home”, “get home”.', fa: 'قبل از «home» کلمهٔ «to» نمی‌آید: «go home»، «come home».' },
		accept: [/\bgoing home\b/, /\bgo home\b/], reject: [/\bto home\b/]
	},
	{
		id: 'since-for', kind: { en: 'since / for', fa: 'since / for' },
		words: ["I've", 'lived', 'here', 'since', 'two', 'years.'], wrong: 3,
		right: "I've lived here for two years.",
		why: { en: '“For” + how long (two years). “Since” + when it started (2020, last May).', fa: '«for» برای مدت است (دو سال). «since» برای زمان شروع است (از ۲۰۲۰). در فارسی هر دو «از» یا «است که» می‌شوند.' },
		accept: [/\bfor (two|2) years\b/], reject: [/\bsince (two|2) years\b/]
	},
	{
		id: 'what-call', kind: { en: 'What do you call…?', fa: 'What do you call…?' },
		words: ['How', 'do', 'you', 'call', 'this', 'in', 'English?'], wrong: 0,
		right: 'What do you call this in English?',
		why: { en: 'To ask for a word, say “What do you call…?” (or “How do you say…?”). «چطور می‌گویند» becomes “what”, not “how”, with “call”.', fa: 'برای پرسیدن اسم چیزی بگو «What do you call…?» (یا «How do you say…?»). با «call» از «how» استفاده نمی‌کنیم.' },
		accept: [/\bwhat do you call\b/, /\bhow do you say\b/, /\bwhat's this called\b/, /\bwhat is this called\b/], reject: [/\bhow do you call\b/]
	},
	{
		id: 'turn-off', kind: { en: 'turn off', fa: 'turn off' },
		words: ['Can', 'you', 'close', 'the', 'light,', 'please?'], wrong: 2,
		right: 'Can you turn off the light, please?',
		why: { en: 'We “turn off” (or “switch off”) lights and machines. We “close” doors and windows.', fa: 'چراغ و وسایل برقی را «turn off» (یا «switch off») می‌کنیم. «close» برای در و پنجره است.' },
		accept: [/\b(turn|switch) (off|out) the lights?\b/, /\b(turn|switch) the lights? (off|out)\b/], reject: [/\bclose the lights?\b/]
	},
	{
		id: 'bored', kind: { en: 'bored / boring', fa: 'bored / boring' },
		words: ["I'm", 'so', 'boring', 'today.', "Let's", 'go', 'out.'], wrong: 2,
		right: "I'm so bored today. Let's go out.",
		why: { en: '“Bored” is how you feel. “Boring” is what makes you feel it: “This film is boring, so I’m bored.”', fa: '«bored» یعنی «حوصله‌ام سر رفته». «boring» یعنی «خسته‌کننده». پس بگو «I’m bored»؛ «I’m boring» یعنی «من آدم خسته‌کننده‌ای هستم».' },
		accept: [/\b(i'm|i am|im) (so |really |very )?bored\b/], reject: [/\b(i'm|i am|im) (so |really |very )?boring\b/]
	}
];

/** Lower case, plain quotes and spaces, no punctuation: what speech-to-text wrote, ready to match. */
export function normalise(text: string): string {
	return text.toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Did they say it right? The fix must be there, and the mistake gone. */
export function saidRight(trap: Trap, transcript: string): boolean {
	const said = normalise(transcript);
	return trap.accept.some(r => r.test(said)) && !trap.reject.some(r => r.test(said));
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
export interface TrapsRecord { index: number; step: 'spot' | 'say'; traps: TrapState[]; done: boolean }
const freshTrap = (): TrapState => ({ wrongTaps: [], found: null, said: null, saidRight: false, transcript: null });
export const emptyTrapsRecord = (): TrapsRecord => ({ index: 0, step: 'spot', traps: TRAPS.map(freshTrap), done: false });

export function asTrapsRecord(value: unknown): TrapsRecord | null {
	if (!value || typeof value !== 'object') return null;
	const v = value as Partial<TrapsRecord>;
	if (typeof v.index !== 'number' || typeof v.done !== 'boolean' || (v.step !== 'spot' && v.step !== 'say')) return null;
	if (!Array.isArray(v.traps) || v.traps.length !== TRAPS.length) return null;
	const ok = v.traps.every(t => t && typeof t === 'object' && Array.isArray(t.wrongTaps) && typeof t.saidRight === 'boolean');
	return ok ? { index: Math.max(0, Math.min(TRAPS.length, Math.floor(v.index))), step: v.step, traps: v.traps, done: v.done } : null;
}

export function summarize(record: TrapsRecord): { found: number; said: number; total: number } {
	return { found: record.traps.filter(t => t.found).length, said: record.traps.filter(t => t.saidRight).length, total: TRAPS.length };
}
