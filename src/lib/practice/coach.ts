/**
 * Mira, the English coach: which greeting a learner gets today, the scripted
 * lines (Day 1, and the fallbacks when the AI is not used or not available),
 * and the day's greeting kept in this browser so a reload shows it again
 * without new AI calls.
 */
import type { DisplayText } from './hotel';
import type { EnglishProfile } from './english-profile';
import type { EnglishProgress } from './english-progress';

export const COACH_NAME = 'Mira';
/** Mira's voice: one of the free English voices (Ava). */
export const COACH_VOICE = 'b' as const;

export type GreetingMode = 'first' | 'returning' | 'again-today';

/** Local calendar date, YYYY-MM-DD, in the learner's own time zone. */
export function localDate(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Whole calendar days between the last finished session and now, in local time; null if never. */
export function daysSince(lastCompletedAt: string | null, now = new Date()): number | null {
	if (!lastCompletedAt) return null;
	const last = new Date(lastCompletedAt);
	if (Number.isNaN(last.getTime())) return null;
	const a = Date.UTC(last.getFullYear(), last.getMonth(), last.getDate());
	const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
	return Math.max(0, Math.round((b - a) / 86_400_000));
}

export function greetingMode(progress: EnglishProgress, now = new Date()): GreetingMode {
	if (progress.sessionsCompleted === 0) return 'first';
	return daysSince(progress.lastCompletedAt, now) === 0 ? 'again-today' : 'returning';
}

/** The end of the learner's first sentence, from their onboarding reason. */
const REASON_ENDING: Record<NonNullable<EnglishProfile['reason']>, string> = {
	travel: 'for travel', work: 'for work', exam: 'for an exam', abroad: 'to live abroad', everyday: 'to speak with more confidence'
};

/** Day 1: the sentence the learner says first. Names go in as typed; nothing else from the learner. */
export function firstSentence(name: string, reason: EnglishProfile['reason']): string {
	const ending = reason ? ` ${REASON_ENDING[reason]}` : '';
	return name ? `Hi, I'm ${name}, and I'm learning English${ending}.` : `Hi, I'm learning English${ending}.`;
}

export function wordCount(text: string): number {
	return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Any attempt of three or more words counts: a misheard name is never "wrong". */
export const isFirstSentenceAttempt = (heard: string) => wordCount(heard) >= 3;

/** Puts the name in, or drops it cleanly ("Welcome back, Sam." / "Welcome back."). */
const fill = (line: string, name: string) => (name ? line.replaceAll('{name}', name) : line.replace(/[,،]? ?\{name\}/g, ''));
const hello = (name: string, en: string, fa: string): DisplayText => ({ en: fill(en, name), fa: fill(fa, name) });

export const DAY_ONE_LINES = {
	welcome: (name: string) => hello(name, 'Hi {name}, I’m Mira, your English coach. Welcome to your first session.', 'سلام {name}، من میرا هستم، مربی انگلیسی تو. به اولین جلسه‌ات خوش آمدی.'),
	ask: { en: 'Let’s hear your voice. Tap the mic and say:', fa: 'بیا صدایت را بشنویم. دکمهٔ میکروفون را بزن و بگو:' } satisfies DisplayText,
	heard: { en: 'Great, your mic works. That’s your first sentence.', fa: 'عالی، میکروفونت کار می‌کند. این اولین جمله‌ات بود.' } satisfies DisplayText,
	typed: { en: 'Nice, that’s your first sentence. In speaking steps you can type too.', fa: 'خوب بود، این اولین جمله‌ات بود. در مرحله‌های صحبت هم می‌توانی بنویسی.' } satisfies DisplayText,
	short: { en: 'I only caught a few words. Try once more?', fa: 'فقط چند کلمه شنیدم. یک بار دیگر امتحان می‌کنی؟' } satisfies DisplayText
};

/** Scripted openings: used when the AI is not available, and as the model's fallback. */
export function scriptedOpening(mode: GreetingMode, name: string, days: number | null, question: string): DisplayText {
	if (mode === 'again-today') return hello(name, 'Back for more, {name}? Let’s go.', 'دوباره آمدی {name}؟ برویم.');
	if (days !== null && days >= 7) return hello(name, `Good to see you again, {name}. We’ll start with something easy. ${question}`, 'خوشحالم دوباره می‌بینمت {name}. با یک چیز آسان شروع می‌کنیم.');
	return hello(name, `Welcome back, {name}. ${question}`, 'خوش برگشتی {name}.');
}

export function scriptedReply(name: string, answered: boolean): DisplayText {
	return answered
		? hello(name, 'Thanks, {name}. Let’s start today’s practice.', 'ممنون {name}. تمرین امروز را شروع کنیم.')
		: { en: 'Okay, let’s start today’s practice.', fa: 'باشه، تمرین امروز را شروع کنیم.' };
}

/** Today's greeting as it happened, kept in this browser for the day only. */
export interface GreetingRecord {
	date: string;
	mode: GreetingMode;
	opening: DisplayText;
	/** Day 1: the sentence they said or typed. Later days: their answer. */
	answer: string | null;
	typed: boolean;
	reply: DisplayText | null;
	/** Feedback kept for the recap (later days). */
	improved: string | null;
	noteEn: string | null;
	noteFa: string | null;
}

const KEY = 'mirifer_en_greeting_v1';

export function loadGreeting(today: string): GreetingRecord | null {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return null;
		const value = JSON.parse(raw) as GreetingRecord;
		return value && value.date === today && typeof value.opening?.en === 'string' ? value : null;
	} catch { return null; }
}

export function saveGreeting(record: GreetingRecord): void {
	try { localStorage.setItem(KEY, JSON.stringify(record)); } catch { /* the greeting just runs again after a reload */ }
}
