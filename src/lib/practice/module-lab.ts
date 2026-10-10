/**
 * Every module type planned for the English course (owner's list), shown as cards in
 * the Module lab. Each is built and judged on its own before it joins a daily lesson.
 */
import type { DisplayText } from './hotel';

export interface LabModule { id: string; name: DisplayText; /** A page where it can be tried now. */ href?: string }

export const LAB_MODULES: LabModule[] = [
	{ id: 'role-play-twist', name: { en: 'Role-play with a surprise', fa: 'نقش‌آفرینی با غافلگیری' }, href: '/practice/english' },
	{ id: 'choose-persuade', name: { en: 'Choose and persuade', fa: 'انتخاب کن و قانع کن' }, href: '/practice/english/lab/choose-persuade' },
	{ id: 'say-it-better', name: { en: 'Say it again, better', fa: 'دوباره بگو، بهتر' } },
	{ id: 'missing-info', name: { en: 'Find the missing information', fa: 'اطلاعات گم‌شده را پیدا کن' } },
	{ id: 'speaking-card', name: { en: 'Speaking card', fa: 'کارت صحبت' } },
	{ id: 'free-talk', name: { en: '60-second free talk', fa: 'صحبت آزاد ۶۰ ثانیه‌ای' } },
	{ id: 'shadowing', name: { en: 'Shadowing', fa: 'تکرار همزمان' } },
	{ id: 'story-chain', name: { en: 'Story chain', fa: 'زنجیرهٔ داستان' } },
	{ id: 'quick-fire', name: { en: 'Quick-fire questions', fa: 'سؤال‌های سریع' } },
	{ id: 'listen-retell', name: { en: 'Listen and retell', fa: 'گوش بده و بازگو کن' }, href: '/practice/english/retell' },
	{ id: 'listen-connect', name: { en: 'Listen and connect', fa: 'گوش بده و وصل کن' } },
	{ id: 'dictation', name: { en: 'Dictation sprint', fa: 'دیکتهٔ سریع' } },
	{ id: 'minimal-pairs', name: { en: 'Minimal pairs duel', fa: 'دوئل کلمه‌های هم‌آوا' } },
	{ id: 'connected-speech', name: { en: 'Connected speech', fa: 'گفتار پیوسته' } },
	{ id: 'spot-the-lie', name: { en: 'Spot the lie', fa: 'دروغ را پیدا کن' } },
	{ id: 'read-rate-respond', name: { en: 'Read, rate, respond', fa: 'بخوان، امتیاز بده، پاسخ بده' } },
	{ id: 'word-rescue', name: { en: 'Word rescue', fa: 'نجات کلمه‌ها' } }
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
