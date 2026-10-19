/**
 * "Listen and connect" (docs/english-listen-connect-spec.md, owner-approved v2):
 * one real conversation, then four questions about how its facts connect
 * (cause → result, plan and reality, condition, instead). Text only, no icons.
 * Written and reviewed by us; no AI at run time.
 */
import type { DisplayText } from './hotel';
import type { TTSVoice } from '$services/tts';

export const MAX_PLAYS = 2;

export interface Speaker { name: string; voice: TTSVoice }
export const SPEAKERS: Record<'agent' | 'sara', Speaker> = {
	agent: { name: 'Agent', voice: 'c' }, // Brian
	sara: { name: 'Sara', voice: 'd' } // Emma; Mira is Ava, so Sara never sounds like Mira
};

export interface Line { who: string; text: string }

export const CONVERSATION: Line[] = [
	{ who: 'agent', text: 'Hello, how can I help?' },
	{ who: 'sara', text: "Hi. I just landed from Istanbul, but only one of my bags came out." },
	{ who: 'agent', text: "Oh, I'm sorry. What does the missing one look like?" },
	{ who: 'sara', text: "It's a small green backpack. My big gray suitcase is here, that one's fine." },
	{ who: 'agent', text: 'Let me check... OK. It was supposed to be on your flight, but it went to Frankfurt, because the tag had the wrong flight number.' },
	{ who: 'sara', text: 'Oh no. So when can I get it?' },
	{ who: 'agent', text: "It'll be on the evening flight, so we can bring it to your hotel tomorrow morning." },
	{ who: 'sara', text: "The thing is, my medicine's in that backpack, and I need it tonight." },
	{ who: 'agent', text: "In that case, just buy what you need at the pharmacy here. We'll pay you back, as long as you keep the receipt." },
	{ who: 'sara', text: "OK. And my phone charger's in there too. Should I buy one of those too?" },
	{ who: 'agent', text: 'No need. You can borrow one at the information desk instead.' }
];

/** The day's link phrases, highlighted in the conversation at the end. */
export const LINK_PHRASES = ['in that case', 'as long as', 'instead'];

/** English inside `backticks` is kept left-to-right (and read as English) in the Persian line. */
export const MIRA_LINE: DisplayText = {
	en: 'The agent used three small phrases: `in that case` (so here’s what to do), `as long as` (only if), `instead` (not that, this). They go by fast, so listen for them.',
	fa: 'راه‌حل کارمند فرودگاه به سه عبارت کوتاه بستگی داشت: `in that case` (در این صورت)، `as long as` (به شرطی که)، `instead` (به‌جایش). این‌ها تند گفته می‌شوند، پس حواست بهشان باشد.'
};
/** Mira's line as she says it (no marks). */
export const MIRA_SPOKEN = MIRA_LINE.en.replace(/`/g, '');

/** Connect: one cause at a time, the same four results each time (shuffled once, here). */
export const CONNECT = {
	causes: ['The tag had the wrong flight number.', 'The backpack is on the evening flight.', 'Her medicine is in the backpack.'],
	results: ['It reaches her hotel tomorrow morning.', 'Her gray suitcase stays with her.', 'The backpack went to Frankfurt.', 'She buys some at the pharmacy.'],
	/** For each cause, the index of its result. */
	answers: [2, 0, 3],
	/** For each cause, the conversation line that proves it. */
	evidence: [4, 6, 8]
};

export interface ChoiceQuestion { kind: DisplayText; question: string; options: string[]; answer: number; evidence: number }
/** Plan and reality, Condition, Instead. `evidence` is the conversation line that proves the answer. */
export const CHOICES: ChoiceQuestion[] = [
	{ kind: { en: 'Plan and reality', fa: 'برنامه و واقعیت' }, question: 'What was supposed to happen to the backpack?', options: ['It was supposed to go to Frankfurt.', "It was supposed to come on Sara's flight.", 'It was supposed to go to her hotel.'], answer: 1, evidence: 4 },
	{ kind: { en: 'Condition', fa: 'شرط' }, question: 'The airline will pay for her medicine. What does Sara have to do?', options: ['Buy it at the information desk.', 'Wait until tomorrow morning.', 'Keep the receipt.'], answer: 2, evidence: 8 },
	{ kind: { en: 'Instead', fa: 'به‌جایش' }, question: 'Sara asks about buying a charger. What does the agent say?', options: ["Don't buy one. Borrow one at the desk.", 'Buy one and keep the receipt.', 'Wait for it with the backpack.'], answer: 0, evidence: 10 }
];

export const TOTAL_POINTS = CONNECT.causes.length + CHOICES.length;

/**
 * The conversation is heard in three short parts (owner's change), each followed by its own
 * questions, so the learner never has to hold the whole conversation in memory at once.
 */
export interface Part { from: number; to: number; title: DisplayText }
export const PARTS: Part[] = [
	{ from: 0, to: 4, title: { en: 'The problem', fa: 'مشکل' } },
	{ from: 5, to: 6, title: { en: 'The plan', fa: 'برنامه' } },
	{ from: 7, to: 10, title: { en: 'The medicine and the charger', fa: 'دارو و شارژر' } }
];
export const partLines = (part: number) => CONVERSATION.slice(PARTS[part].from, PARTS[part].to + 1);
export type Question = { part: number; kind: 'connect' | 'choice'; index: number };
/** The questions in order, each after the part it's about. */
export const QUESTIONS: Question[] = [
	{ part: 0, kind: 'connect', index: 0 }, { part: 0, kind: 'choice', index: 0 },
	{ part: 1, kind: 'connect', index: 1 },
	{ part: 2, kind: 'connect', index: 2 }, { part: 2, kind: 'choice', index: 1 }, { part: 2, kind: 'choice', index: 2 }
];
export type Step = { kind: 'listen'; part: number } | { kind: 'question'; q: number } | { kind: 'end' };
/** Listen to part 1, its questions, listen to part 2, its questions, …, then how it all connects. */
export function stepsOf(set: ConnectSet): Step[] {
	return [
		...set.parts.flatMap((_, part) => [{ kind: 'listen' as const, part }, ...set.questions.map((q, i) => ({ q, i })).filter(x => x.q.part === part).map(x => ({ kind: 'question' as const, q: x.i }))]),
		{ kind: 'end' }
	];
}

/**
 * Everything one day (and version) brings to the module: the conversation and its speakers, the
 * parts, the questions and Mira's closing line. Day 1's is below; later days' are in `days/`.
 */
export interface ConnectSet {
	speakers: Record<string, Speaker>;
	conversation: Line[];
	/** The day's link phrases, highlighted in the conversation at the end. */
	linkPhrases: string[];
	/** Mira's line at the end; English inside `backticks` stays left-to-right. */
	miraLine: DisplayText;
	connect: { causes: string[]; results: string[]; answers: number[]; evidence: number[] };
	choices: ChoiceQuestion[];
	parts: Part[];
	questions: Question[];
}
export const DAY_ONE_SET: ConnectSet = {
	speakers: SPEAKERS, conversation: CONVERSATION, linkPhrases: LINK_PHRASES, miraLine: MIRA_LINE,
	connect: CONNECT, choices: CHOICES, parts: PARTS, questions: QUESTIONS
};
export const STEPS: Step[] = stepsOf(DAY_ONE_SET);
export const totalPoints = (set: ConnectSet) => set.connect.causes.length + set.choices.length;
export const partLinesOf = (set: ConnectSet, part: number) => set.conversation.slice(set.parts[part].from, set.parts[part].to + 1);
/** Mira's line as she says it (no marks). */
export const miraSpoken = (set: ConnectSet) => set.miraLine.en.replace(/`/g, '');

/** What the module keeps in this browser for the day (reload, Back). */
export interface ConnectRecord {
	/** Plays used, per part. */
	plays: number[];
	/** Each part's first play reached its end. */
	heard: boolean[];
	/** Read the text instead of listening (audio didn't work). */
	readInstead: boolean;
	/** Chosen result per cause, and whether each was checked. */
	connect: (number | null)[];
	connectChecked: boolean[];
	/** Chosen option per choice question, and whether each was checked. */
	choices: (number | null)[];
	checked: boolean[];
	/** Where the learner is, in STEPS. */
	step: number;
	done: boolean;
}

export const emptyConnectRecord = (set: ConnectSet = DAY_ONE_SET): ConnectRecord => ({
	plays: set.parts.map(() => 0), heard: set.parts.map(() => false), readInstead: false, connect: set.connect.causes.map(() => null), connectChecked: set.connect.causes.map(() => false),
	choices: set.choices.map(() => null), checked: set.choices.map(() => false), step: 0, done: false
});

export function scoreConnect(record: ConnectRecord, set: ConnectSet = DAY_ONE_SET): { correct: number; total: number } {
	const connect = record.connect.filter((chosen, i) => chosen === set.connect.answers[i]).length;
	const choices = record.choices.filter((chosen, i) => chosen === set.choices[i].answer).length;
	return { correct: connect + choices, total: totalPoints(set) };
}

const isChoice = (value: unknown, count: number) => value === null || (Number.isInteger(value) && (value as number) >= 0 && (value as number) < count);

/** Checks a saved record before using it (it comes back from browser storage). A record from before the parts is dropped. */
export function asConnectRecord(value: unknown, set: ConnectSet = DAY_ONE_SET): ConnectRecord | null {
	const r = value as ConnectRecord | null;
	if (!r || typeof r !== 'object' || typeof r.done !== 'boolean') return null;
	const flags = (v: unknown, n: number) => Array.isArray(v) && v.length === n && v.every(x => typeof x === 'boolean');
	const { parts, connect, choices } = set;
	if (!Array.isArray(r.plays) || r.plays.length !== parts.length || !r.plays.every(n => Number.isInteger(n) && n >= 0 && n <= MAX_PLAYS)) return null;
	if (!flags(r.heard, parts.length) || !flags(r.connectChecked, connect.causes.length) || !flags(r.checked, choices.length)) return null;
	if (!Number.isInteger(r.step) || r.step < 0 || r.step >= stepsOf(set).length) return null;
	if (!Array.isArray(r.connect) || r.connect.length !== connect.causes.length || !r.connect.every(v => isChoice(v, connect.results.length))) return null;
	if (!Array.isArray(r.choices) || r.choices.length !== choices.length || !r.choices.every((v, i) => isChoice(v, choices[i].options.length))) return null;
	return { ...r, readInstead: r.readInstead === true };
}

/** Splits a line into plain parts and the day's link phrases, for highlighting. */
export function linkParts(text: string, phrases: string[] = LINK_PHRASES): { text: string; link: boolean }[] {
	const pattern = new RegExp(`(${phrases.map(p => p.replace(/ /g, '\\s+')).join('|')})`, 'gi');
	return text.split(pattern).filter(Boolean).map(part => ({ text: part, link: phrases.includes(part.toLowerCase().replace(/\s+/g, ' ')) }));
}
