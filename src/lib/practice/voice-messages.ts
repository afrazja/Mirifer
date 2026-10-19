/**
 * "Voice messages", Module lab (owner-approved in chat). A voice message arrives, like on WhatsApp
 * or Telegram, from a friend, a colleague, a landlord or a clinic. The learner listens (as often as
 * they like), then replies with a voice message. One AI call checks whether the reply answers what
 * they were asked, and gives a natural reply. Recordings are never stored.
 */
import type { DisplayText } from './hotel';
import type { TTSVoice } from '$services/tts';

export const REPLY_MAX_SECONDS = 45;
export const REPLY_MIN_SECONDS = 1;
/** The voice that reads the natural reply: Mira's (the coach). */
export const REPLY_VOICE: TTSVoice = 'b';

export interface VoiceMessage {
	id: string;
	from: { name: string; who: DisplayText; voice: TTSVoice };
	/** The voice message, one sentence per audio request (a whole message is too long for one). */
	sentences: string[];
	/** What they asked: the reply should answer each one. */
	asks: { ask: DisplayText; missed: DisplayText }[];
	/** A natural reply (A2+), shown when there's nothing better. */
	model: string;
	/** Names that may come up, to help speech-to-text (the Day 1 list unless said). */
	names?: string;
}

export const MESSAGES: VoiceMessage[] = [
	{
		id: 'friend',
		from: { name: 'Sara', who: { en: 'a friend', fa: 'دوستت' }, voice: 'd' },
		sentences: [
			"Hey, it's Sara!",
			'A few of us are going for coffee on Saturday, at about four.',
			"It's at the café near the park.",
			'Do you want to come?',
			"Oh, and could you bring Ali's book? He needs it back.",
			'Let me know. Bye!'
		],
		asks: [
			{ ask: { en: 'Can you come on Saturday?', fa: 'شنبه می‌آیی؟' }, missed: { en: "You didn't say if you can come on Saturday.", fa: 'نگفتی شنبه می‌آیی یا نه.' } },
			{ ask: { en: "Can you bring Ali's book?", fa: 'کتاب علی را می‌آوری؟' }, missed: { en: "You didn't say if you can bring Ali's book.", fa: 'نگفتی کتاب علی را می‌آوری یا نه.' } }
		],
		model: "Hi Sara! Thanks, I'd love to come on Saturday. And yes, I'll bring Ali's book. See you at four!"
	},
	{
		id: 'colleague',
		from: { name: 'Tom', who: { en: 'a colleague', fa: 'همکارت' }, voice: 'c' },
		sentences: [
			"Hi, it's Tom from work.",
			"Tomorrow's meeting is at eleven thirty now, not ten.",
			'Is that OK for you?',
			'And could you send me the sales report before the meeting?',
			'Thanks, see you tomorrow.'
		],
		asks: [
			{ ask: { en: 'Is the new time (eleven thirty) OK for you?', fa: 'ساعت جدید (یازده و نیم) برایت مشکلی ندارد؟' }, missed: { en: "You didn't say if the new time is OK.", fa: 'نگفتی ساعت جدید برایت مشکلی ندارد یا نه.' } },
			{ ask: { en: 'Can you send the report before the meeting?', fa: 'گزارش را قبل از جلسه می‌فرستی؟' }, missed: { en: "You didn't say if you can send the report.", fa: 'نگفتی گزارش را می‌فرستی یا نه.' } }
		],
		model: "Hi Tom, thanks for letting me know. Eleven thirty is fine. I'll send you the report this afternoon."
	},
	{
		id: 'landlord',
		from: { name: 'Mr Brown', who: { en: 'your landlord', fa: 'صاحب‌خانه‌ات' }, voice: 'a' },
		sentences: [
			'Hello, this is Mr Brown, your landlord.',
			'The plumber can come and fix the kitchen tap on Thursday, between nine and twelve.',
			'Will someone be at home then?',
			'And could you send me a photo of the tap today, please?',
			'Then he knows what to bring. Thanks.'
		],
		asks: [
			{ ask: { en: 'Will someone be at home on Thursday morning?', fa: 'پنج‌شنبه صبح کسی خانه هست؟' }, missed: { en: "You didn't say if someone will be at home on Thursday.", fa: 'نگفتی پنج‌شنبه کسی خانه هست یا نه.' } },
			{ ask: { en: 'Can you send a photo of the tap today?', fa: 'امروز عکس شیر آب را می‌فرستی؟' }, missed: { en: "You didn't say if you can send the photo today.", fa: 'نگفتی امروز عکس شیر آب را می‌فرستی یا نه.' } }
		],
		model: "Hello Mr Brown, thank you. Yes, I'll be at home on Thursday morning. I'll send you a photo of the tap today."
	},
	{
		id: 'clinic',
		from: { name: 'Green Street Clinic', who: { en: 'a clinic', fa: 'درمانگاه' }, voice: 'd' },
		sentences: [
			'Hello, this is Green Street Clinic, about your appointment on Monday at two.',
			"I'm sorry, but the doctor isn't working that day, so we need to change it.",
			'We have Tuesday at ten, or Wednesday at four.',
			"Please reply with the time that's best for you. Thank you."
		],
		asks: [
			{ ask: { en: 'Tuesday at ten, or Wednesday at four?', fa: 'سه‌شنبه ساعت ده، یا چهارشنبه ساعت چهار؟' }, missed: { en: "You didn't say which time is best for you.", fa: 'نگفتی کدام وقت را می‌خواهی.' } }
		],
		model: 'Hello, thanks for letting me know. Wednesday at four is good for me.'
	}
];

/** Names that may come up, to help speech-to-text spell them. */
export const NAMES = 'Sara, Ali, Tom, Mr Brown, Green Street Clinic.';

export type ReplyVerdict = 'answered' | 'almost' | 'notYet' | 'notEnglish';
export interface ReplyFeedback {
	english: boolean;
	/** One per ask: did the reply answer it? */
	answered: boolean[];
	/** The reply made natural; [bracketed] parts were added. */
	better: string;
	/** True when `better` is our model reply, not theirs made natural (it may not match their choices). */
	fromModel?: boolean;
	tip: DisplayText | null;
}
export function verdictOf(feedback: ReplyFeedback): ReplyVerdict {
	if (!feedback.english) return 'notEnglish';
	const got = feedback.answered.filter(Boolean).length;
	return got === feedback.answered.length ? 'answered' : got > 0 ? 'almost' : 'notYet';
}
export const RANK: Record<ReplyVerdict, number> = { answered: 3, almost: 2, notYet: 1, notEnglish: 0 };

export interface ReplyTry { transcript: string; feedback: ReplyFeedback }
export interface VoiceRecord { index: number; listened: boolean[]; tries: (ReplyTry | null)[]; done: boolean }
export const emptyVoiceRecord = (messages: VoiceMessage[] = MESSAGES): VoiceRecord => ({ index: 0, listened: messages.map(() => false), tries: messages.map(() => null), done: false });

/** A saved run from this browser, or null if it doesn't look right. */
export function asVoiceRecord(value: unknown, messages: VoiceMessage[] = MESSAGES): VoiceRecord | null {
	if (!value || typeof value !== 'object') return null;
	const v = value as Partial<VoiceRecord>;
	if (typeof v.index !== 'number' || typeof v.done !== 'boolean' || !Array.isArray(v.tries) || v.tries.length !== messages.length) return null;
	if (!Array.isArray(v.listened) || v.listened.length !== messages.length || !v.listened.every(x => typeof x === 'boolean')) return null;
	const ok = v.tries.every(t => t === null || (typeof t === 'object' && typeof t.transcript === 'string' && !!t.feedback && Array.isArray(t.feedback.answered) && typeof t.feedback.better === 'string'));
	return ok ? { index: Math.max(0, Math.min(messages.length, Math.floor(v.index))), listened: v.listened, tries: v.tries, done: v.done } : null;
}

export function summarize(record: VoiceRecord): { answered: number; almost: number; total: number; verdicts: (ReplyVerdict | null)[] } {
	const verdicts = record.tries.map(t => (t ? verdictOf(t.feedback) : null));
	return { answered: verdicts.filter(v => v === 'answered').length, almost: verdicts.filter(v => v === 'almost').length, total: record.tries.length, verdicts };
}
