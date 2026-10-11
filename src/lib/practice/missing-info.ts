/**
 * "Find the missing information", Module lab (docs/english-missing-info-spec.md, owner-approved v2).
 * The learner asks Tom at a station ticket desk for four facts. Everything Tom may say is
 * on the fact sheet below; the server checks every number he says and decides, with the
 * state worked out here from the conversation, when a blank on the card is filled.
 */
import type { DisplayText } from './hotel';
import { normalise, words, type FixUse } from './say-better';

export const TOM = { name: 'Tom', voice: 'c' as const }; // Brian; Mira is Ava
export const MAX_QUESTIONS = 14, QUEUE_AT = 12;
export const QUESTION_MAX_SECONDS = 15, QUESTION_MIN_SECONDS = 1;

export type GapId = 'train' | 'price' | 'back' | 'platform';
export const GAP_IDS: GapId[] = ['train', 'price', 'back', 'platform'];
export const GAPS: Record<GapId, { short: DisplayText; full: DisplayText; answer: string }> = {
	train: { short: { en: 'Train before 10 am', fa: 'قطار قبل از ۱۰ صبح' }, full: { en: 'A train that gets you to Kingsley before 10 am', fa: 'قطاری که قبل از ساعت ۱۰ صبح به کینگزلی برسد' }, answer: '8:40 → 9:55' },
	price: { short: { en: 'Price for 3 of you', fa: 'قیمت برای سه نفرتان' }, full: { en: 'The total price for the three of you (a return each; your parents are over 60)', fa: 'قیمت کل برای شما سه نفر (برای هر نفر بلیت رفت‌وبرگشت؛ پدر و مادرت بالای ۶۰ سال‌اند)' }, answer: '£56' },
	back: { short: { en: 'Latest way back', fa: 'دیرترین راه برگشت' }, full: { en: 'The latest way to get back on Saturday evening', fa: 'دیرترین راه برای برگشتن، شنبه عصر' }, answer: '8:30 pm bus' },
	platform: { short: { en: 'Platform', fa: 'سکو' }, full: { en: 'The platform for your train', fa: 'سکوی قطارت' }, answer: 'Platform 3' }
};

export const OPENING = 'Hi there. How can I help?';
export const QUEUE_LINE = 'There’s a queue behind me. Anything else?';
export const LIMIT_LINE = 'Sorry, I need to help the next person now. Have a good trip!';
export const GOODBYE = 'Have a lovely trip!';
export const SAFE_LINE = 'Sorry, one moment… Could you ask me that again?';

/** Everything Tom knows. He must not add facts. */
export const FACT_SHEET = [
	'Millbrook station ticket desk. Today is Thursday. Tom only has this Saturday\'s timetable.',
	'Saturday trains from Millbrook to Kingsley leave every hour at :40, from 6:40 am to 8:40 pm, all from Platform 3. The journey takes 1 hour 15 minutes: 6:40 arrives 7:55, 7:40 arrives 8:55, 8:40 arrives 9:55, 9:40 arrives 10:55, and so on.',
	'Trains back from Kingsley leave every hour at :20. This Saturday the last one is at 7:20 pm (back in Millbrook at 8:35 pm), because of work on the line.',
	'After that, a bus leaves at 8:30 pm from outside Kingsley station, by the main entrance. It takes about 1 hour 30 minutes (back at about 10 pm). Train tickets are valid on the bus.',
	'A return ticket is £24. People over 60 get a third off: £16. Three adult returns: £72. One adult and two over 60: £56. Tickets are sold here at the desk or at the machines, by card or cash.',
	'Extras, the only ones: there is a café by the main entrance; the toilets are by the main entrance; bikes are allowed on the train and are free.'
].join('\n');

/** Every time Tom may say (12-hour clock): departures :40, arrivals :55, trains back :20 and :35, the bus. */
export const ALLOWED_TIMES = new Set<string>([
	// No 8:20 or 9:35: the last train back this Saturday is the 7:20 (back at 8:35).
	...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].flatMap(h => [`${h}:40`, `${h}:55`, ...(h === 8 ? [] : [`${h}:20`]), ...(h === 9 ? [] : [`${h}:35`])]),
	'8:30', '10:00', '1:15', '1:30'
]);
export const ALLOWED_PRICES = new Set(['8', '16', '24', '32', '48', '56', '72']);
export const timesIn = (text: string) => [...text.matchAll(/\b(\d{1,2})[:.](\d{2})\b/g)].map(m => `${Number(m[1]) > 12 ? Number(m[1]) - 12 : Number(m[1])}:${m[2]}`);
export const pricesIn = (text: string) => [...text.matchAll(/£\s?(\d+)|\b(\d+)\s?(?:pounds|quid)\b/gi)].map(m => m[1] ?? m[2]);
export const platformsIn = (text: string) => [...text.matchAll(/\bplatforms?\s+(\w+)/gi)].map(m => m[1].toLowerCase());

export type LearnerKind = 'question' | 'answer' | 'other';
export type TomKind = 'answer' | 'askBack' | 'other';
export type Turn =
	/** 'pending' until Tom's reply says what kind of turn it was. */
	| { who: 'you'; text: string; kind: LearnerKind | 'pending'; typed?: boolean }
	| { who: 'tom'; text: string; kind: TomKind; found: GapId[] };

/** What the card shows, worked out from the conversation alone. */
export interface DeskState {
	found: Partial<Record<GapId, string>>;
	/** A price without the discount was heard; the last train (7:20) was heard. */
	partly: { price: boolean; back: boolean };
	discountGiven: boolean;
	busRevealed: boolean;
	questions: number;
}
const TRAINS: Record<string, string> = { '6:40': '7:55', '7:40': '8:55', '8:40': '9:55' };
export function gapValue(gap: GapId, reply: string): string {
	if (gap === 'train') { const t = timesIn(reply).find(time => TRAINS[time]); return t ? `${t} → ${TRAINS[t]}` : GAPS.train.answer; }
	return GAPS[gap].answer;
}
export function deskState(turns: Turn[]): DeskState {
	const state: DeskState = { found: {}, partly: { price: false, back: false }, discountGiven: false, busRevealed: false, questions: 0 };
	for (const turn of turns) {
		if (turn.who === 'you') { if (turn.kind === 'question') state.questions++; continue; }
		const prices = pricesIn(turn.text);
		if (prices.includes('16')) state.discountGiven = true;
		if (/\bbus\b/i.test(turn.text)) state.busRevealed = true;
		if (prices.some(p => p === '24' || p === '72')) state.partly.price = true;
		if (timesIn(turn.text).includes('7:20')) state.partly.back = true;
		for (const gap of turn.found) state.found[gap] ??= gapValue(gap, turn.text);
	}
	return state;
}

/**
 * Which gaps a reply really fills: the model must claim it, the value must be in the reply,
 * and what Tom revealed before (or in this reply) must allow it.
 */
export function confirmFound(claimed: GapId[], reply: string, before: DeskState, kind: TomKind): GapId[] {
	if (kind === 'askBack') return [];
	const prices = pricesIn(reply), times = timesIn(reply);
	const discount = before.discountGiven || prices.includes('16');
	const bus = before.busRevealed || /\bbus\b/i.test(reply);
	const ok: Record<GapId, boolean> = {
		train: times.some(t => TRAINS[t] || Object.values(TRAINS).includes(t)),
		price: prices.includes('56') && discount,
		back: times.includes('8:30') && bus,
		platform: platformsIn(reply).some(p => p === '3' || p === 'three')
	};
	return [...new Set(claimed)].filter(gap => GAP_IDS.includes(gap) && ok[gap] && !before.found[gap]);
}

/** Problems with a reply that the learner must never hear; null when it is fine. */
export function replyProblem(reply: string, kind: TomKind, newGaps: number): string | null {
	if (!reply.trim()) return 'the reply is empty';
	if (/[؀-ۿ]/.test(reply)) return 'the reply must be in English';
	if (words(reply).length > 40) return 'the reply is longer than 40 words';
	const badTime = timesIn(reply).find(t => !ALLOWED_TIMES.has(t));
	if (badTime) return `${badTime} is not on the fact sheet`;
	const badPrice = pricesIn(reply).find(p => !ALLOWED_PRICES.has(p));
	if (badPrice) return `£${badPrice} is not on the fact sheet`;
	if (platformsIn(reply).some(p => p !== '3' && p !== 'three')) return 'only Platform 3 is on the fact sheet';
	if (kind === 'askBack' && (timesIn(reply).length || pricesIn(reply).length || platformsIn(reply).length)) return 'a question back must not contain a time, price or platform';
	if (newGaps >= 3) return 'one reply gave away three facts at once';
	return null;
}

/** "Need a hint?" shows after two ask-backs in a row, or four questions with no new fact. */
export function needsHint(turns: Turn[]): boolean {
	const tom = turns.filter(t => t.who === 'tom') as Extract<Turn, { who: 'tom' }>[];
	if (tom.length >= 2 && tom.slice(-2).every(t => t.kind === 'askBack')) return true;
	let questions = 0;
	for (let i = turns.length - 1; i >= 0; i--) {
		const turn = turns[i];
		if (turn.who === 'tom' && turn.found.length) break;
		if (turn.who === 'you' && turn.kind === 'question') questions++;
	}
	return questions >= 4;
}
export const HINT_STARTERS = ['What time…?', 'How much…?', 'Which…?', 'Is there…?'];

/** The twist line at the end. */
export function twistLine(state: DeskState): DisplayText {
	if (state.found.back) return { en: 'You asked about the way back and found the 8:30 bus.', fa: 'دربارهٔ راه برگشت پرسیدی و اتوبوس ساعت ۸:۳۰ را پیدا کردی.' };
	if (state.partly.back) return { en: 'The last train back was at 7:20. There was also a bus at 8:30. You could find it by asking: “Is there anything later?”', fa: 'آخرین قطار برگشت ساعت ۷:۲۰ بود. یک اتوبوس هم ساعت ۸:۳۰ بود. می‌توانستی با این سؤال پیدایش کنی: «Is there anything later?»' };
	return { en: 'You didn’t ask about getting back. The last train was at 7:20, and there was a bus at 8:30.', fa: 'دربارهٔ برگشتن نپرسیدی. آخرین قطار ساعت ۷:۲۰ بود و یک اتوبوس هم ساعت ۸:۳۰.' };
}

// Feedback on the learner's questions

/** Fixed kinds, in the order the fixes are chosen. */
export const QKINDS = ['word order', 'question word', 'vague question', 'not a full question', 'tense', 'a bit direct', 'preposition', 'a/the'] as const;
export type QKind = (typeof QKINDS)[number];
export const QKIND_LABEL: Record<QKind, DisplayText> = {
	'word order': { en: 'word order', fa: 'ترتیب کلمه‌ها' }, 'question word': { en: 'question word', fa: 'کلمهٔ پرسشی' },
	'vague question': { en: 'not clear enough', fa: 'به اندازهٔ کافی روشن نیست' }, 'not a full question': { en: 'not a full question', fa: 'سؤال کامل نیست' },
	tense: { en: 'tense / verb form', fa: 'زمان / شکل فعل' }, 'a bit direct': { en: 'a bit direct', fa: 'کمی رک' },
	preposition: { en: 'preposition', fa: 'حرف اضافه' }, 'a/the': { en: 'a/the', fa: 'a/the' }
};
export const QKIND_WHY: Record<QKind, DisplayText> = {
	'word order': { en: 'In a question, the helping verb comes before the subject.', fa: 'در سؤال، فعل کمکی قبل از فاعل می‌آید.' },
	'question word': { en: 'This question word fits better here.', fa: 'این کلمهٔ پرسشی اینجا بهتر است.' },
	'vague question': { en: 'Say exactly what you want to know.', fa: 'دقیقاً بگو چه می‌خواهی بدانی.' },
	'not a full question': { en: 'A full question is clearer and more polite.', fa: 'سؤال کامل روشن‌تر و مؤدبانه‌تر است.' },
	tense: { en: 'The verb needs this form here.', fa: 'فعل اینجا این شکل را لازم دارد.' },
	'a bit direct': { en: 'A question sounds friendlier than an order.', fa: 'سؤال از دستور دوستانه‌تر است.' },
	preposition: { en: 'English uses this small word here.', fa: 'انگلیسی اینجا این حرف اضافه را به کار می‌برد.' },
	'a/the': { en: 'English needs a or the here.', fa: 'انگلیسی اینجا a یا the لازم دارد.' }
};

/** One question that had something to fix (the whole question, corrected). */
export interface QMistake { question: number; original: string; better: string; kind: QKind; focus: 0 | 1 | 2 }
export interface QFix { question: number; original: string; better: string; why: DisplayText; natural: boolean }
export interface MIFeedback { asked: number; mistakes: QMistake[]; fixes: QFix[] }

/** Picks the fixes: by kind order, repeated kinds first, two different kinds, prepositions and a/the only when repeated. */
export function chooseQFocus(mistakes: { kind: QKind }[], max = 2): number[] {
	const countOf = (kind: QKind) => mistakes.filter(m => m.kind === kind).length;
	const minor = (kind: QKind) => kind === 'preposition' || kind === 'a/the';
	const order = mistakes.map((_, i) => i).filter(i => !minor(mistakes[i].kind) || countOf(mistakes[i].kind) >= 2)
		.sort((x, y) => QKINDS.indexOf(mistakes[x].kind) - QKINDS.indexOf(mistakes[y].kind) || (countOf(mistakes[y].kind) > 1 ? 1 : 0) - (countOf(mistakes[x].kind) > 1 ? 1 : 0) || x - y);
	const chosen: number[] = [];
	for (const i of order) {
		if (chosen.length >= max) break;
		if (!chosen.some(c => mistakes[c].kind === mistakes[i].kind)) chosen.push(i);
	}
	if (!chosen.length && mistakes.length) chosen.push(0);
	return chosen;
}

export function questionCountLine(asked: number, withMistakes: number, fixes: number): DisplayText {
	const fa = (n: number) => n.toLocaleString('fa-IR');
	const q = asked === 1 ? { en: 'You asked 1 question', fa: 'یک سؤال پرسیدی' } : { en: `You asked ${asked} questions`, fa: `${fa(asked)} سؤال پرسیدی` };
	if (!withMistakes) return { en: `${q.en}, and I didn’t hear any mistakes.`, fa: `${q.fa} و اشتباهی نشنیدم.` };
	if (withMistakes === 1) return { en: `${q.en}. One had something to fix. Let’s work on it now.`, fa: `${q.fa}. یکی چیزی برای درست کردن داشت. همین حالا رویش کار کنیم.` };
	if (fixes === 1) return { en: `${q.en}. ${withMistakes} had something to fix. Let’s practise the one that matters most.`, fa: `${q.fa}. ${fa(withMistakes)} تا چیزی برای درست کردن داشتند. مهم‌ترینش را تمرین می‌کنیم.` };
	return { en: `${q.en}. ${withMistakes} had something to fix. Let’s practise the 2 that matter most.`, fa: `${q.fa}. ${fa(withMistakes)} تا چیزی برای درست کردن داشتند. آن ۲ تا را که مهم‌ترند تمرین می‌کنیم.` };
}

/** Longest common run of words, in order (not necessarily next to each other). */
function common(a: string[], b: string[]): number {
	const row = new Array(b.length + 1).fill(0);
	for (const x of a) { let prev = 0; for (let j = 1; j <= b.length; j++) { const keep = row[j]; row[j] = x === b[j - 1] ? prev + 1 : Math.max(row[j], row[j - 1]); prev = keep; } }
	return row[b.length];
}
/** Did the asked-again question use the fix? It must be close to the better question, and closer to it than to the old one. */
export function reaskUse(fix: QFix, said: string): FixUse {
	const s = words(said), better = words(fix.better), original = words(fix.original);
	if (!s.length) return 'absent';
	const toBetter = common(s, better) / better.length, toOriginal = common(s, original) / Math.max(1, original.length);
	if (` ${normalise(said)} `.includes(` ${normalise(fix.original)} `) && normalise(fix.original) !== normalise(fix.better)) return 'missed';
	return toBetter >= 0.8 && toBetter > toOriginal ? 'used' : 'missed';
}

export type MIStep = 'task' | 'desk' | 'end' | 'fix' | 'reask' | 'result';
export interface MIRecord {
	step: MIStep;
	turns: Turn[];
	feedback: MIFeedback | null;
	fixIndex: number;
	/** What they said when asking each fix again, and whether it used the fix. */
	reasks: (string | null)[];
	uses: FixUse[];
	done: boolean;
}
export const emptyMIRecord = (): MIRecord => ({ step: 'task', turns: [], feedback: null, fixIndex: 0, reasks: [], uses: [], done: false });
export function asMIRecord(value: unknown): MIRecord | null {
	const r = value as MIRecord | null;
	if (!r || typeof r !== 'object' || typeof r.done !== 'boolean' || !Array.isArray(r.turns) || !Array.isArray(r.uses) || !Array.isArray(r.reasks)) return null;
	if (!['task', 'desk', 'end', 'fix', 'reask', 'result'].includes(r.step)) return null;
	if (!r.turns.every(t => t && (t.who === 'you' || t.who === 'tom') && typeof t.text === 'string' && (t.who === 'you' || Array.isArray(t.found)))) return null;
	if (r.feedback !== null && (typeof r.feedback !== 'object' || !Array.isArray(r.feedback.mistakes) || !Array.isArray(r.feedback.fixes))) return null;
	return { ...r, fixIndex: Number.isInteger(r.fixIndex) ? r.fixIndex : 0 };
}
/** The learner's questions, numbered from 1, as the feedback sees them. */
export const questionsOf = (turns: Turn[]) => turns.filter((t): t is Extract<Turn, { who: 'you' }> => t.who === 'you' && t.kind === 'question');
