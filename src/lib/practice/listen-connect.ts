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

export interface Line { who: keyof typeof SPEAKERS; text: string }

export const CONVERSATION: Line[] = [
	{ who: 'agent', text: 'Hello, how can I help?' },
	{ who: 'sara', text: "Hi. I've just landed from Istanbul, but only one of my bags has come out." },
	{ who: 'agent', text: "Oh, I'm sorry. What does the missing one look like?" },
	{ who: 'sara', text: "It's a small green backpack. My big gray suitcase is here, that one's fine." },
	{ who: 'agent', text: 'Let me check... Right. It was supposed to be on your flight, but it went to Frankfurt, because the tag had the wrong flight number.' },
	{ who: 'sara', text: 'Oh no. So when can I get it?' },
	{ who: 'agent', text: "It'll be on the evening flight, so we can bring it to your hotel tomorrow morning." },
	{ who: 'sara', text: "The thing is, my medicine's in that backpack, and I need it tonight." },
	{ who: 'agent', text: "In that case, just buy what you need at the pharmacy here. We'll pay you back, as long as you keep the receipt." },
	{ who: 'sara', text: "OK. And my phone charger's in there too. Should I buy one of those as well?" },
	{ who: 'agent', text: 'No need. You can borrow one at the information desk instead.' }
];

/** The day's link phrases, highlighted in the conversation at the end. */
export const LINK_PHRASES = ['in that case', 'as long as', 'instead'];

/** English inside `backticks` is kept left-to-right (and read as English) in the Persian line. */
export const MIRA_LINE: DisplayText = {
	en: 'The agent’s plan hung on three small phrases: `in that case` (so here’s what to do), `as long as` (only if), `instead` (not that, this). They go by fast, so listen out for them.',
	fa: 'راه‌حل کارمند فرودگاه به سه عبارت کوتاه بستگی داشت: `in that case` (در این صورت)، `as long as` (به شرطی که)، `instead` (به‌جایش). این‌ها تند گفته می‌شوند، پس حواست بهشان باشد.'
};
/** Mira's line as she says it (no marks). */
export const MIRA_SPOKEN = MIRA_LINE.en.replace(/`/g, '');

/** Connect: one cause at a time, the same four results each time (shuffled once, here). */
export const CONNECT = {
	causes: ['The tag had the wrong flight number.', 'The backpack is on the evening flight.', 'Her medicine is in the backpack.'],
	results: ['It reaches her hotel tomorrow morning.', 'Her gray suitcase stays with her.', 'The backpack went to Frankfurt.', 'She buys some at the pharmacy.'],
	/** For each cause, the index of its result. */
	answers: [2, 0, 3]
};

export interface ChoiceQuestion { kind: DisplayText; question: string; options: string[]; answer: number; evidence: number }
/** Plan and reality, Condition, Instead. `evidence` is the conversation line that proves the answer. */
export const CHOICES: ChoiceQuestion[] = [
	{ kind: { en: 'Plan and reality', fa: 'برنامه و واقعیت' }, question: 'What was supposed to happen to the backpack?', options: ['It was supposed to go to Frankfurt.', "It was supposed to come on Sara's flight.", 'It was supposed to go to her hotel.'], answer: 1, evidence: 4 },
	{ kind: { en: 'Condition', fa: 'شرط' }, question: 'The airline will pay for her medicine. What does Sara have to do?', options: ['Buy it at the information desk.', 'Wait until tomorrow morning.', 'Keep the receipt.'], answer: 2, evidence: 8 },
	{ kind: { en: 'Instead', fa: 'به‌جایش' }, question: 'Sara asks about buying a charger. What does the agent say?', options: ["Don't buy one. Borrow one at the desk.", 'Buy one and keep the receipt.', 'Wait for it with the backpack.'], answer: 0, evidence: 10 }
];

export const TOTAL_POINTS = CONNECT.causes.length + CHOICES.length;

/** What the module keeps in this browser for the day (reload, Back). */
export interface ConnectRecord {
	plays: number;
	/** The first play reached its end: the questions are open. */
	heard: boolean;
	/** Read the text instead of listening (audio didn't work). */
	readInstead: boolean;
	/** Chosen result per cause, and whether Connect was checked. */
	connect: (number | null)[];
	connectChecked: boolean;
	/** Chosen option per choice question, and whether each was checked. */
	choices: (number | null)[];
	checked: boolean[];
	/** 0 = Connect, 1–3 = the choice questions, 4 = how it connects. */
	screen: number;
	done: boolean;
}

export const emptyConnectRecord = (): ConnectRecord => ({
	plays: 0, heard: false, readInstead: false, connect: CONNECT.causes.map(() => null), connectChecked: false,
	choices: CHOICES.map(() => null), checked: CHOICES.map(() => false), screen: 0, done: false
});

export function scoreConnect(record: ConnectRecord): { correct: number; total: number } {
	const connect = record.connect.filter((chosen, i) => chosen === CONNECT.answers[i]).length;
	const choices = record.choices.filter((chosen, i) => chosen === CHOICES[i].answer).length;
	return { correct: connect + choices, total: TOTAL_POINTS };
}

const isChoice = (value: unknown, count: number) => value === null || (Number.isInteger(value) && (value as number) >= 0 && (value as number) < count);

/** Checks a saved record before using it (it comes back from browser storage). */
export function asConnectRecord(value: unknown): ConnectRecord | null {
	const r = value as ConnectRecord | null;
	if (!r || typeof r !== 'object' || typeof r.done !== 'boolean' || typeof r.heard !== 'boolean' || typeof r.connectChecked !== 'boolean') return null;
	if (!Number.isInteger(r.plays) || r.plays < 0 || r.plays > MAX_PLAYS || !Number.isInteger(r.screen) || r.screen < 0 || r.screen > CHOICES.length + 1) return null;
	if (!Array.isArray(r.connect) || r.connect.length !== CONNECT.causes.length || !r.connect.every(v => isChoice(v, CONNECT.results.length))) return null;
	if (!Array.isArray(r.choices) || r.choices.length !== CHOICES.length || !r.choices.every((v, i) => isChoice(v, CHOICES[i].options.length))) return null;
	if (!Array.isArray(r.checked) || r.checked.length !== CHOICES.length || !r.checked.every(v => typeof v === 'boolean')) return null;
	return { ...r, readInstead: r.readInstead === true };
}

/** Splits a line into plain parts and the day's link phrases, for highlighting. */
export function linkParts(text: string): { text: string; link: boolean }[] {
	const pattern = new RegExp(`(${LINK_PHRASES.map(p => p.replace(/ /g, '\\s+')).join('|')})`, 'gi');
	return text.split(pattern).filter(Boolean).map(part => ({ text: part, link: LINK_PHRASES.includes(part.toLowerCase().replace(/\s+/g, ' ')) }));
}
