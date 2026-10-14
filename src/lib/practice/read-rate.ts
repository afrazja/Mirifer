/**
 * "Read, rate, respond", Module lab (owner-approved in chat): the module with reading. Read a short
 * real-life text (a review, a friend's message, an ad), give an opinion with one tap, then say a
 * reply that uses facts from the text. One AI call checks the reply against the text: which facts
 * they used (and whether they got any wrong), whether they gave a reason, and a better reply.
 */
import type { DisplayText } from './hotel';

export const RESPOND_MAX_SECONDS = 45;
/** Shorter than this is a slip of the finger, not an answer. */
export const RESPOND_MIN_SECONDS = 2;

export interface Gloss { word: string; fa: string }
export interface RateQuestion {
	ask: DisplayText;
	/** Stars (1–5), or two named choices. */
	kind: 'stars' | 'choice';
	options?: [DisplayText, DisplayText];
}
export interface ReadText {
	id: string;
	kind: DisplayText;
	title: string;
	/** Paragraphs of the text (English only). */
	body: string[];
	/** Harder words: tap to see them in Persian. Each appears in the body as written here. */
	glosses: Gloss[];
	rate: RateQuestion;
	task: DisplayText;
}

export const TEXTS: ReadText[] = [
	{
		id: 'hotel-review',
		kind: { en: 'A hotel review', fa: 'نظر یک مسافر دربارهٔ هتل' },
		title: 'Hotel Bella Vista · “Nice, but not perfect”',
		body: [
			'We stayed at the Bella Vista for three nights in July. The location is great: the beach is a five-minute walk away, and there are lots of cafés nearby.',
			'Our room was clean and quiet, but quite small, and the Wi-Fi only worked in the lobby. Breakfast was excellent, with fresh fruit and homemade bread.',
			'The staff at reception were friendly, but check-in took almost an hour. For about $90 a night, it was good value, but I wouldn’t stay there on a work trip.'
		],
		glosses: [
			{ word: 'lobby', fa: 'لابی، سالن ورودی هتل' },
			{ word: 'homemade', fa: 'خانگی' },
			{ word: 'good value', fa: 'به‌صرفه، ارزش پولش را دارد' }
		],
		rate: { kind: 'stars', ask: { en: 'How good is this hotel?', fa: 'این هتل چقدر خوب است؟' } },
		task: {
			en: 'A friend wants to book this hotel. Tell them if they should, and why. Use details from the review.',
			fa: 'یکی از دوستانت می‌خواهد این هتل را رزرو کند. به او بگو این کار را بکند یا نه، و چرا. از جزئیات همین نظر استفاده کن.'
		}
	},
	{
		id: 'friend-message',
		kind: { en: 'A message from a friend', fa: 'پیام یک دوست' },
		title: 'Message from Leila',
		body: [
			'Hi! I need your advice. I’ve been offered a job in Dubai. The pay is much better than now, and they’ll pay for my apartment.',
			'But I’d have to move in two months, and I don’t know anyone there. My parents are getting older, and I’d only see them twice a year.',
			'Also, my English would improve a lot, which I really want. I have to decide by Friday. What would you do?'
		],
		glosses: [
			{ word: 'offered', fa: 'پیشنهاد داده‌اند' },
			{ word: 'getting older', fa: 'سنشان بالا می‌رود' },
			{ word: 'improve', fa: 'بهتر شدن' }
		],
		rate: {
			kind: 'choice', ask: { en: 'What should Leila do?', fa: 'لیلا چه کار کند؟' },
			options: [{ en: 'Take the job', fa: 'کار را قبول کند' }, { en: 'Stay', fa: 'بماند' }]
		},
		task: {
			en: 'Leave Leila a voice message with your advice and at least one reason from her message.',
			fa: 'برای لیلا یک پیام صوتی بگذار: نصیحتت را بگو و دست‌کم یک دلیل از خود پیامش بیاور.'
		}
	},
	{
		id: 'gym-ad',
		kind: { en: 'An ad', fa: 'یک آگهی' },
		title: 'FitZone Gym · New members’ offer!',
		body: [
			'Join this month for just $25 a month (normally $40). Open 6 a.m. to 11 p.m., seven days a week.',
			'Free classes: yoga, spinning and boxing. One free session with a personal trainer.',
			'Minimum contract: 12 months. Parking costs $3 a day. Towels are not included.'
		],
		glosses: [
			{ word: 'personal trainer', fa: 'مربی شخصی' },
			{ word: 'Minimum contract', fa: 'حداقل مدت قرارداد' },
			{ word: 'not included', fa: 'شامل نمی‌شود، جدا حساب می‌شود' }
		],
		rate: { kind: 'stars', ask: { en: 'Is it a good deal?', fa: 'پیشنهاد خوبی است؟' } },
		task: {
			en: 'Would you sign up? Say why, using two details from the ad.',
			fa: 'ثبت‌نام می‌کنی؟ بگو چرا، و از دو جزئیات همین آگهی استفاده کن.'
		}
	}
];

/** The rating in words, for the AI and the screen. */
export function ratingText(text: ReadText, rating: number): string {
	if (text.rate.kind === 'stars') return `${rating} of 5 stars`;
	return text.rate.options?.[rating]?.en ?? '';
}
export const validRating = (text: ReadText, rating: unknown): rating is number =>
	Number.isInteger(rating) && (text.rate.kind === 'stars' ? (rating as number) >= 1 && (rating as number) <= 5 : (rating as number) === 0 || (rating as number) === 1);

/** The body split so glossed words can be tapped: plain text and gloss indexes, in order. */
export function glossParts(paragraph: string, glosses: Gloss[]): { text: string; gloss: number | null }[] {
	const parts: { text: string; gloss: number | null }[] = [];
	let rest = paragraph;
	while (rest) {
		let best: { at: number; gloss: number } | null = null;
		glosses.forEach((g, i) => {
			const at = rest.indexOf(g.word);
			if (at >= 0 && (!best || at < best.at)) best = { at, gloss: i };
		});
		if (!best) { parts.push({ text: rest, gloss: null }); break; }
		const { at, gloss } = best as { at: number; gloss: number };
		if (at > 0) parts.push({ text: rest.slice(0, at), gloss: null });
		parts.push({ text: glosses[gloss].word, gloss });
		rest = rest.slice(at + glosses[gloss].word.length);
	}
	return parts;
}

export interface FactCheck { said: string; correct: boolean; fix: string }
export interface ReplyFeedback {
	/** Did the reply do the task (an opinion about this text)? */
	onTask: boolean;
	facts: FactCheck[];
	reason: boolean;
	/** Their reply said better; anything added is in [brackets]. Null if it failed its checks. */
	better: string | null;
}

export type Step = 'read' | 'rate' | 'respond' | 'heard' | 'feedback';
export interface TextRecord { step: Step; rating: number | null; transcript: string | null; feedback: ReplyFeedback | null }
export interface ReadRateRecord { index: number; texts: TextRecord[]; done: boolean }
const emptyText = (): TextRecord => ({ step: 'read', rating: null, transcript: null, feedback: null });
export const emptyReadRate = (): ReadRateRecord => ({ index: 0, texts: TEXTS.map(emptyText), done: false });
const STEPS: Step[] = ['read', 'rate', 'respond', 'heard', 'feedback'];
export function asReadRate(value: unknown): ReadRateRecord | null {
	const r = value as ReadRateRecord | null;
	if (!r || typeof r !== 'object' || typeof r.done !== 'boolean' || !Number.isInteger(r.index) || r.index < 0 || r.index > TEXTS.length) return null;
	if (!Array.isArray(r.texts) || r.texts.length !== TEXTS.length) return null;
	const ok = r.texts.every((t, i) => t && STEPS.includes(t.step) && (t.rating === null || validRating(TEXTS[i], t.rating))
		&& (t.transcript === null || typeof t.transcript === 'string') && (t.feedback === null || (typeof t.feedback === 'object' && Array.isArray(t.feedback.facts))));
	return ok ? r : null;
}

export interface ReadRateSummary { replied: number; usedText: number; reasons: number; wrongFacts: number }
export function summarize(record: ReadRateRecord): ReadRateSummary {
	const done = record.texts.map(t => t.feedback).filter((f): f is ReplyFeedback => !!f);
	return {
		replied: done.length,
		usedText: done.filter(f => f.facts.some(x => x.correct)).length,
		reasons: done.filter(f => f.reason).length,
		wrongFacts: done.reduce((n, f) => n + f.facts.filter(x => !x.correct).length, 0)
	};
}
