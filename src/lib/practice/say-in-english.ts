/**
 * "Say it in English", Module lab (owner-approved in chat). Mira shows something the learner wants
 * to say, in Persian; they say it in English, the way they'd say it to a person. One AI call checks
 * whether the meaning came across (each meaning point) and gives a natural way to say it.
 * Recordings are never stored.
 */
import type { DisplayText } from './hotel';

/** The voice that reads the natural version: the same US voice as Minimal pairs. */
export const VOICE = 'c';
export const SAY_MAX_SECONDS = 20;
export const SAY_MIN_SECONDS = 1;

export interface SayItem {
	id: string;
	/** Who they're talking to. */
	to: DisplayText;
	/** What they want to say, in Persian. */
	fa: string;
	/** What the listener must understand. The AI checks each one; the learner sees the missing ones. */
	points: DisplayText[];
	/** Natural ways to say it (A2), the first one shown when there's nothing better. */
	models: string[];
	/** Key words, shown only if they ask for a hint. */
	hints: { en: string; fa: string }[];
	/** The level the coach writes the natural version for (A2 unless said). */
	level?: 'A2' | 'B1';
	/** Names that may come up, to help speech-to-text (the Day 1 list unless said). */
	names?: string;
}

export const ITEMS: SayItem[] = [
	{
		id: 'taxi',
		to: { en: 'To a taxi driver', fa: 'به رانندهٔ تاکسی' },
		fa: 'لطفاً من رو ببرید هتل پارک. چقدر طول می‌کشه؟',
		points: [
			{ en: 'you want to go to the Park Hotel', fa: 'می‌خواهی به هتل پارک بروی' },
			{ en: 'you’re asking how long it takes', fa: 'می‌پرسی چقدر طول می‌کشد' }
		],
		models: ['Could you take me to the Park Hotel, please? How long will it take?', 'The Park Hotel, please. How long does it take to get there?'],
		hints: [{ en: 'take me to', fa: 'من رو ببرید…' }, { en: 'how long', fa: 'چقدر طول می‌کشه' }]
	},
	{
		id: 'hotel',
		to: { en: 'To the hotel receptionist', fa: 'به مسئول پذیرش هتل' },
		fa: 'سلام، یه اتاق به اسم رضایی رزرو کردم. می‌شه زودتر اتاق رو تحویل بگیرم؟',
		points: [
			{ en: 'you have a booking under the name Rezaei', fa: 'به اسم رضایی اتاق رزرو کرده‌ای' },
			{ en: 'you’d like to check in early', fa: 'می‌خواهی زودتر اتاق را تحویل بگیری' }
		],
		models: ['Hi, I have a booking under the name Rezaei. Can I check in early?', "I've booked a room under Rezaei. Is it possible to check in early?"],
		hints: [{ en: 'a booking under the name…', fa: 'رزرو به اسم…' }, { en: 'check in early', fa: 'زودتر تحویل گرفتن اتاق' }]
	},
	{
		id: 'restaurant',
		to: { en: 'To a waiter', fa: 'به گارسون' },
		fa: 'ببخشید، من گوشت نمی‌خورم. این غذا گوشت داره؟',
		points: [
			{ en: "you don't eat meat", fa: 'گوشت نمی‌خوری' },
			{ en: 'you’re asking if this dish has meat in it', fa: 'می‌پرسی این غذا گوشت دارد یا نه' }
		],
		models: ["I don't eat meat. Does this dish have meat in it?", "I don't eat meat. Is there any meat in this?"],
		hints: [{ en: "I don't eat…", fa: '… نمی‌خورم' }, { en: 'Is there any … in it?', fa: '… داره؟' }]
	},
	{
		id: 'friend',
		to: { en: 'To a friend who is picking you up at the airport', fa: 'به دوستی که قرار است در فرودگاه دنبالت بیاید' },
		fa: 'پروازم تأخیر داره. حدود ساعت نه می‌رسم.',
		points: [
			{ en: 'your flight is delayed', fa: 'پروازت تأخیر دارد' },
			{ en: "you'll arrive at about nine", fa: 'حدود ساعت نه می‌رسی' }
		],
		models: ["My flight's delayed. I'll be there at about nine.", "My flight is late. I'll arrive around nine."],
		hints: [{ en: 'delayed', fa: 'تأخیر داره' }, { en: 'at about nine', fa: 'حدود ساعت نه' }]
	}
];

/** Names that may come up, to help speech-to-text spell them. */
export const NAMES = 'Park Hotel, Rezaei.';

export type Verdict = 'clear' | 'almost' | 'different' | 'notEnglish';
export interface SayFeedback {
	/** Did they speak English (not Persian, not nothing)? */
	english: boolean;
	/** One per meaning point, in order: would a listener understand it? */
	points: boolean[];
	/** What they said, made natural; [bracketed] parts were added. Never null: falls back to a model. */
	better: string;
	/** One short tip, or null. */
	tip: DisplayText | null;
}

export function verdictOf(feedback: SayFeedback): Verdict {
	if (!feedback.english) return 'notEnglish';
	const got = feedback.points.filter(Boolean).length;
	return got === feedback.points.length ? 'clear' : got > 0 ? 'almost' : 'different';
}

export interface SayTry { transcript: string; feedback: SayFeedback }
export interface SayRecord { index: number; tries: (SayTry | null)[]; done: boolean }
export const emptySayRecord = (items: SayItem[] = ITEMS): SayRecord => ({ index: 0, tries: items.map(() => null), done: false });

/** A saved run from this browser, or null if it doesn't look right (an older shape, a bad edit). */
export function asSayRecord(value: unknown, items: SayItem[] = ITEMS): SayRecord | null {
	if (!value || typeof value !== 'object') return null;
	const v = value as Partial<SayRecord>;
	if (typeof v.index !== 'number' || !Array.isArray(v.tries) || v.tries.length !== items.length || typeof v.done !== 'boolean') return null;
	const ok = v.tries.every(t => t === null || (typeof t === 'object' && typeof t.transcript === 'string' && !!t.feedback && Array.isArray(t.feedback.points) && typeof t.feedback.better === 'string'));
	return ok ? { index: Math.max(0, Math.min(items.length, Math.floor(v.index))), tries: v.tries, done: v.done } : null;
}

export function summarize(record: SayRecord): { clear: number; total: number; verdicts: (Verdict | null)[] } {
	const verdicts = record.tries.map(t => (t ? verdictOf(t.feedback) : null));
	return { clear: verdicts.filter(v => v === 'clear').length, total: record.tries.length, verdicts };
}

/** The natural version split into their part and the [added] parts, for highlighting. */
export const betterParts = (better: string) =>
	better.split(/(\[[^\]]*\])/).filter(Boolean).map(p => (p.startsWith('[') && p.endsWith(']') ? { text: p.slice(1, -1), added: true } : { text: p, added: false }));
/** The natural version as plain text, to be read aloud. */
export const plain = (better: string) => better.replace(/[[\]]/g, '').replace(/\s+/g, ' ').trim();
