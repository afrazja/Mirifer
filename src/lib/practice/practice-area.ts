/**
 * The Practice area (docs/landing-plan.md, step 1): modules a learner can do on their own, outside
 * the daily lesson. They were built and tried in the owner's Module lab; Choose and persuade waits
 * until it has sets of its own (its only sets are the daily lessons').
 *
 * Inside the app this is "speaking test practice", never an exam's name (the specs' rule; the
 * landing page may say "IELTS-style").
 */
import type { DisplayText } from './hotel';

export const PRACTICE_IDS = ['speaking-card', 'quick-fire', 'say-better', 'traps', 'read-rate', 'free-talk', 'retell', 'dictation'] as const;
export type PracticeId = (typeof PRACTICE_IDS)[number];
export const isPracticeId = (value: unknown): value is PracticeId => typeof value === 'string' && (PRACTICE_IDS as readonly string[]).includes(value);

export interface PracticeModule {
	id: PracticeId;
	title: DisplayText;
	/** One line: what you do. */
	does: DisplayText;
	/** About how long one round takes. */
	minutes: number;
	href: string;
}

const href = (id: PracticeId) => (id === 'retell' ? '/practice/english/retell' : `/practice/english/practice/${id}`);
const module = (id: PracticeId, title: DisplayText, does: DisplayText, minutes: number): PracticeModule => ({ id, title, does, minutes, href: href(id) });

export const PRACTICE_MODULES: Record<PracticeId, PracticeModule> = {
	'speaking-card': module('speaking-card', { en: 'Speaking card', fa: 'کیوکارت' },
		{ en: 'Get a topic, prepare for a minute, then talk about it for up to two minutes.', fa: 'یک موضوع می‌گیری، یک دقیقه آماده می‌شوی و بعد تا دو دقیقه درباره‌اش صحبت می‌کنی.' }, 6),
	'quick-fire': module('quick-fire', { en: 'Quick-fire questions', fa: 'سؤال‌های سریع' },
		{ en: 'Answer six short questions about yourself, one after another.', fa: 'به شش سؤال کوتاه دربارهٔ خودت، یکی پس از دیگری، جواب بده.' }, 4),
	'say-better': module('say-better', { en: 'Say it again, better', fa: 'دوباره بگو، بهتر' },
		{ en: 'Answer a question, get one tip from Mira, then answer it again.', fa: 'به یک سؤال جواب بده، از میرا یک نکته بگیر و دوباره جواب بده.' }, 5),
	traps: module('traps', { en: 'Persian-speaker traps', fa: 'اشتباه‌های آشنا' },
		{ en: 'Find the mistake Persian speakers often make, then say the sentence right.', fa: 'اشتباهی را که فارسی‌زبان‌ها زیاد می‌کنند پیدا کن و بعد جمله را درست بگو.' }, 4),
	'read-rate': module('read-rate', { en: 'Read, rate, respond', fa: 'بخوان، امتیاز بده، پاسخ بده' },
		{ en: 'Read a short review, message or ad, rate it, and say what you think.', fa: 'یک نقد، پیام یا آگهی کوتاه بخوان، به آن امتیاز بده و نظرت را بگو.' }, 6),
	'free-talk': module('free-talk', { en: '60-second free talk', fa: 'صحبت آزاد ۶۰ ثانیه‌ای' },
		{ en: 'Talk for one minute about an easy topic, without stopping.', fa: 'یک دقیقه، بدون توقف، دربارهٔ یک موضوع ساده صحبت کن.' }, 3),
	retell: module('retell', { en: 'Listen and retell', fa: 'گوش بده و بازگو کن' },
		{ en: 'Hear a short story, then tell it in your own words.', fa: 'یک ماجرای کوتاه بشنو و بعد به زبان خودت تعریفش کن.' }, 5),
	dictation: module('dictation', { en: 'Dictation sprint', fa: 'دیکتهٔ سریع' },
		{ en: 'Hear short sentences and type exactly what you hear.', fa: 'جمله‌های کوتاه را بشنو و دقیقاً همان را که می‌شنوی بنویس.' }, 4)
};

export const PRACTICE_GROUPS: { id: string; title: DisplayText; ids: PracticeId[] }[] = [
	{ id: 'test', title: { en: 'Speaking test practice', fa: 'تمرین آزمون اسپیکینگ' }, ids: ['speaking-card', 'quick-fire', 'say-better'] },
	{ id: 'mistakes', title: { en: 'Common mistakes', fa: 'اشتباه‌های رایج' }, ids: ['traps'] },
	{ id: 'opinion', title: { en: 'Speak your mind', fa: 'نظرت را بگو' }, ids: ['read-rate', 'free-talk'] },
	{ id: 'listening', title: { en: 'Listening', fa: 'شنیداری' }, ids: ['retell', 'dictation'] }
];

/**
 * The module to suggest: the first one not tried yet, in an order that starts easy for
 * Intermediate learners; once all are tried, the one tried longest ago comes first again.
 */
export function suggestPractice(tried: readonly string[], track: 'intermediate' | 'professional' = 'intermediate'): PracticeId {
	const order: PracticeId[] = track === 'intermediate'
		? ['quick-fire', 'traps', 'dictation', 'free-talk', 'retell', 'say-better', 'read-rate', 'speaking-card']
		: ['speaking-card', 'quick-fire', 'say-better', 'traps', 'read-rate', 'retell', 'free-talk', 'dictation'];
	return order.find(id => !tried.includes(id)) ?? order.find(id => id === tried[0]) ?? order[0];
}

/**
 * Practice runs, kept in this browser per account (so two people on one phone don't see each
 * other's), apart from the daily lesson's records and the owner's Module lab.
 */
const keyFor = (learnerId: string) => `mirifer_en_practice_v1:${learnerId}`;
function readAll(learnerId: string): Record<string, unknown> {
	try { return JSON.parse(localStorage.getItem(keyFor(learnerId)) ?? '{}') as Record<string, unknown>; } catch { return {}; }
}
export function loadPractice(learnerId: string, id: string): unknown {
	return readAll(learnerId)[id] ?? null;
}
export function savePractice(learnerId: string, id: string, value: unknown): void {
	try {
		const all = readAll(learnerId);
		if (value === null) delete all[id]; else all[id] = value;
		// The order of keys is the order last used, most recent last (for the suggestion).
		const { [id]: current, ...rest } = all;
		localStorage.setItem(keyFor(learnerId), JSON.stringify(current === undefined ? rest : { ...rest, [id]: current }));
	} catch { /* private mode: the run just starts again after a reload */ }
}
/** The modules this learner has tried here, least recently used first. */
export function triedPractice(learnerId: string): string[] {
	return Object.keys(readAll(learnerId)).filter(isPracticeId);
}
/** Marks a module as tried, even one that keeps no run of its own (Listen and retell). */
export function markTried(learnerId: string, id: PracticeId): void {
	const value = loadPractice(learnerId, id);
	savePractice(learnerId, id, value ?? { tried: true });
}
