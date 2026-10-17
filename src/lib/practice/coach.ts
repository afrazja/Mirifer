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
/** Mira's speaking speed: the course-wide English pace (see english-voice.ts). */
export { ENGLISH_RATE as COACH_RATE } from './english-voice';

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

/**
 * The sentence the learner says to check the microphone. Day 1 uses their
 * onboarding reason; later days a short ready line. No name in it: Mira has
 * already said it once.
 */
export function micSentence(first: boolean, reason: EnglishProfile['reason']): string {
	if (!first) return "I'm ready for today's practice.";
	return `I'm learning English${reason ? ` ${REASON_ENDING[reason]}` : ''}.`;
}

export function wordCount(text: string): number {
	return text.trim().split(/\s+/).filter(Boolean).length;
}

/** Any attempt of three or more words counts: the mic check is not a test. */
export const isMicAttempt = (heard: string) => wordCount(heard) >= 3;

const SMALL_WORDS = new Set(['the', 'you', 'and', 'can', 'could', 'would', 'please', 'for', 'are']);
const keyWords = (text: string) => text.toLowerCase().replace(/[^a-z' ]+/g, ' ').split(/\s+/).filter(word => word.length >= 3 && !SMALL_WORDS.has(word));
/**
 * Did they say (roughly) the sentence they were given? Most of its key words are there.
 * Only for Mira's praise: any attempt still passes the mic check.
 */
export function saidSentence(heard: string, sentence: string): boolean {
	const said = new Set(keyWords(heard)), wanted = keyWords(sentence);
	return wanted.length > 0 && wanted.filter(word => said.has(word)).length / wanted.length >= 0.6;
}

/** Puts the name in, or drops it cleanly ("Welcome back, Sam." / "Welcome back."). */
const fill = (line: string, name: string) => (name ? line.replaceAll('{name}', name) : line.replace(/[,،]? ?\{name\}/g, ''));
/** In a Persian line the (usually Latin) name is isolated, so its direction can't pull the words around it. */
const hello = (name: string, en: string, fa: string): DisplayText => ({ en: fill(en, name), fa: fill(fa, name ? `\u2068${name}\u2069` : '') });

/** Mira's lines around the greeting: her hello, then a mic check, then on to the plan. */
export const MIRA_LINES = {
	welcome: (name: string) => hello(name, 'Hi {name}, I’m Mira, your English coach. Welcome to your first session.', 'سلام {name}، من میرا هستم، مربی انگلیسی تو. به اولین جلسه‌ات خوش آمدی.'),
	ask: { en: 'Before we start, let’s check your microphone. Tap the mic and say:', fa: 'قبل از شروع، میکروفونت را امتحان کنیم. دکمهٔ میکروفون را بزن و بگو:' } satisfies DisplayText,
	heard: { en: 'Great, your mic works. Here’s today’s plan.', fa: 'عالی، میکروفونت کار می‌کند. این برنامهٔ امروز است.' } satisfies DisplayText,
	typed: { en: 'No problem. You can type in the speaking parts too. Here’s the plan.', fa: 'اشکالی ندارد. در بخش‌های صحبت هم می‌توانی بنویسی. برویم سراغ برنامهٔ امروز.' } satisfies DisplayText,
	short: { en: 'I only caught a few words. Try once more?', fa: 'فقط چند کلمه شنیدم. یک بار دیگر امتحان می‌کنی؟' } satisfies DisplayText,
	/** A day's check-in: the mic check with one of today's sentences. */
	warmUp: { en: 'Let’s warm up and check your mic. Tap the mic and say:', fa: 'اول کمی گرم شویم و میکروفونت را امتحان کنیم. دکمهٔ میکروفون را بزن و بگو:' } satisfies DisplayText
};

/** Mira's hello: one line, with the name said once. */
export function opening(mode: GreetingMode, name: string, days: number | null): DisplayText {
	if (mode === 'first') return MIRA_LINES.welcome(name);
	if (mode === 'again-today') return hello(name, 'Back for more, {name}? Let’s go.', 'دوباره آمدی {name}؟ برویم.');
	if (days !== null && days >= 7) return hello(name, 'Good to see you again, {name}. We’ll start with something easy.', 'خوشحالم دوباره می‌بینمت {name}. با یک چیز آسان شروع می‌کنیم.');
	return hello(name, 'Welcome back, {name}. Good to see you again.', 'خوش برگشتی {name}. خوشحالم دوباره می‌بینمت.');
}

/**
 * Mira's hello on a day with a check-in: short, the name once, then the story so far.
 * The first session ever has its own welcome, so here "first" reads as coming back.
 */
export function checkInHello(mode: GreetingMode, name: string, days: number | null, story: DisplayText): DisplayText {
	const line = mode === 'again-today' ? hello(name, 'Hi again, {name}.', 'سلام دوباره، {name}.')
		: days !== null && days >= 7 ? hello(name, 'Good to see you again, {name}.', 'خوشحالم که دوباره می‌بینمت، {name}.')
		: hello(name, 'Welcome back, {name}.', 'خوش برگشتی، {name}.');
	return { en: `${line.en} ${story.en}`, fa: `${line.fa} ${story.fa}` };
}

/** Today's greeting as it happened, kept in this browser for the day only. */
export interface GreetingRecord {
	date: string;
	/** The day it greeted for (records from before days existed are Day 1's). */
	day?: string;
	mode: GreetingMode;
	opening: DisplayText;
	/** Day 1: the sentence they said or typed. Later days: their answer. */
	answer: string | null;
	typed: boolean;
	reply: DisplayText | null;
	/** True once the learner has gone through the greeting (answered or skipped). */
	done: boolean;
	/** Feedback kept for the recap (later days). */
	improved: string | null;
	noteEn: string | null;
	noteFa: string | null;
}

const KEY = 'mirifer_en_greeting_v1';

/** Today's greeting, if it was for this day (any day when `dayId` is left out). */
export function loadGreeting(today: string, dayId?: string): GreetingRecord | null {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return null;
		const value = JSON.parse(raw) as GreetingRecord;
		if (dayId && (value?.day ?? 'day-1') !== dayId) return null;
		return value && value.date === today && typeof value.opening?.en === 'string' ? { ...value, done: value.done === true } : null;
	} catch { return null; }
}

export function saveGreeting(record: GreetingRecord): void {
	try { localStorage.setItem(KEY, JSON.stringify(record)); } catch { /* the greeting just runs again after a reload */ }
}

const NUMBER_EN = ['One', 'Two', 'Three', 'Four', 'Five', 'Six'];
const NUMBER_FA = ['یک', 'دو', 'سه', 'چهار', 'پنج', 'شش'];
const COUNT_EN = ['', 'one part', 'two parts', 'three parts', 'four parts', 'five parts', 'six parts'];

/** Mira reads today's plan: "Today we have three parts. One: …. Two: …. Three: …." */
export function planLine(parts: DisplayText[]): DisplayText {
	const items = parts.slice(0, 6);
	return {
		en: `Today we have ${COUNT_EN[items.length]}. ${items.map((part, index) => `${NUMBER_EN[index]}: ${part.en}.`).join(' ')}`,
		fa: `امروز ${NUMBER_FA[items.length - 1]} بخش داریم. ${items.map((part, index) => `${NUMBER_FA[index]}: ${part.fa}.`).join(' ')}`
	};
}
