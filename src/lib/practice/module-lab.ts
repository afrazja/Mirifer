/**
 * Every module type planned for the English course (owner's list), shown as cards in
 * the Module lab. Each is built and judged on its own before it joins a daily lesson.
 */
import type { DisplayText } from './hotel';

export interface LabModule { id: string; name: DisplayText; /** A page where it can be tried now. */ href?: string }

export const LAB_MODULES: LabModule[] = [
	{ id: 'chapters', name: { en: 'Chapters: try any step', fa: 'فصل‌ها: هر مرحله را امتحان کن' }, href: '/practice/english/lab/chapters' },
	{ id: 'group-chat', name: { en: 'Group chat', fa: 'چت گروهی' }, href: '/practice/english/lab/group-chat' },
	{ id: 'role-play-twist', name: { en: 'Role-play with a surprise', fa: 'نقش‌آفرینی با غافلگیری' }, href: '/practice/english/lab/role-play' },
	{ id: 'choose-persuade', name: { en: 'Choose and persuade', fa: 'انتخاب کن و قانع کن' }, href: '/practice/english/lab/choose-persuade' },
	{ id: 'say-it-better', name: { en: 'Say it again, better', fa: 'دوباره بگو، بهتر' }, href: '/practice/english/lab/say-better' },
	{ id: 'missing-info', name: { en: 'Find the missing information', fa: 'اطلاعات گم‌شده را پیدا کن' }, href: '/practice/english/lab/missing-info' },
	{ id: 'speaking-card', name: { en: 'Speaking card', fa: 'کارت صحبت' }, href: '/practice/english/lab/speaking-card' },
	{ id: 'free-talk', name: { en: '60-second free talk', fa: 'صحبت آزاد ۶۰ ثانیه‌ای' }, href: '/practice/english/lab/free-talk' },
	{ id: 'natural-phrases', name: { en: 'Natural phrases', fa: 'عبارت‌های طبیعی' }, href: '/practice/english/lab/natural-phrases' },
	{ id: 'quick-fire', name: { en: 'Quick-fire questions', fa: 'سؤال‌های سریع' }, href: '/practice/english/lab/quick-fire' },
	{ id: 'listen-retell', name: { en: 'Listen and retell', fa: 'گوش بده و بازگو کن' }, href: '/practice/english/retell' },
	{ id: 'listen-connect', name: { en: 'Listen and connect', fa: 'گوش بده و وصل کن' }, href: '/practice/english/lab/listen-connect' },
	{ id: 'dictation', name: { en: 'Dictation sprint', fa: 'دیکتهٔ سریع' }, href: '/practice/english/lab/dictation' },
	{ id: 'connected-speech', name: { en: 'Connected speech', fa: 'گفتار پیوسته' }, href: '/practice/english/lab/connected-speech' },
	{ id: 'spot-the-lie', name: { en: 'Spot the lie', fa: 'دروغ را پیدا کن' }, href: '/practice/english/lab/spot-the-lie' },
	{ id: 'read-rate-respond', name: { en: 'Read, rate, respond', fa: 'بخوان، امتیاز بده، پاسخ بده' }, href: '/practice/english/lab/read-rate' },
	{ id: 'say-in-english', name: { en: 'Say it in English', fa: 'به انگلیسی بگو' }, href: '/practice/english/lab/say-in-english' },
	{ id: 'voice-messages', name: { en: 'Voice messages', fa: 'پیام صوتی' }, href: '/practice/english/lab/voice-messages' },
	{ id: 'traps', name: { en: 'Persian-speaker traps', fa: 'اشتباه‌های آشنا' }, href: '/practice/english/lab/traps' }
	// "Word rescue" was dropped by the owner: it is a review feature across modules, not a practice module.
];

/** A lab run, kept in this browser under its own key, apart from the daily lesson's records. */
const LAB_KEY = 'mirifer_en_lab_v1';
export function loadLab(id: string): unknown {
	try { return (JSON.parse(localStorage.getItem(LAB_KEY) ?? '{}') as Record<string, unknown>)[id] ?? null; } catch { return null; }
}
export function saveLab(id: string, value: unknown): void {
	try {
		const all = JSON.parse(localStorage.getItem(LAB_KEY) ?? '{}') as Record<string, unknown>;
		if (value === null) delete all[id]; else all[id] = value;
		localStorage.setItem(LAB_KEY, JSON.stringify(all));
	} catch { /* private mode: the run just starts again after a reload */ }
}
