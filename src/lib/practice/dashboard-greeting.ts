/**
 * Mira's greeting at the top of the learner's dashboard (owner's request): a welcome back by name
 * with one line that moves them to today's lesson, or, the very first time, who she is and what to
 * tap. Rules only (no AI, nothing to pay for), in both languages. The button it names is the
 * dashboard's own ("Start Day N", "Continue Day N").
 */
import { hello } from './coach';
import type { DisplayText } from './hotel';

export interface DashboardMoment {
	/** The learner's name, or '' (the line then reads without it). */
	name: string;
	/** Lessons finished so far. */
	finished: number;
	/** Days with any lesson activity, ever. */
	activeDays: number;
	/** A lesson started and not finished. */
	inProgress: boolean;
	/** Today's lesson is already done (on the learner's calendar). */
	doneToday: boolean;
	/** Every released lesson is done. */
	caughtUp: boolean;
	/** Days in a row, ending today or yesterday. */
	streak: number;
	/** Whether the streak includes today. */
	activeToday: boolean;
	/** Days since the last day with a lesson, or null if none. */
	daysAway: number | null;
	/** The lesson the button opens. */
	lessonNumber: number;
}

export type GreetingKind = 'first' | 'in-progress' | 'done-today' | 'caught-up' | 'streak' | 'keep-going' | 'long-break' | 'welcome-back';

export function greetingKind(m: DashboardMoment): GreetingKind {
	if (m.inProgress) return 'in-progress';
	if (m.finished === 0 && m.activeDays === 0) return 'first';
	if (m.doneToday) return 'done-today';
	if (m.caughtUp) return 'caught-up';
	if (m.streak >= 2) return 'streak';
	if (m.streak === 1 && !m.activeToday) return 'keep-going';
	if (m.daysAway !== null && m.daysAway >= 7) return 'long-break';
	return 'welcome-back';
}

const fa = (n: number) => n.toLocaleString('fa-IR');

export function dashboardGreeting(m: DashboardMoment): DisplayText {
	const n = m.lessonNumber;
	switch (greetingKind(m)) {
		case 'first':
			return hello(m.name,
				`Hi {name}, I’m Mira, your English coach. Every day, we do one short lesson together. It takes about 15 minutes. You listen, then you speak. When you’re ready, tap “Start Day ${n}” below.`,
				`سلام {name}، من میرا هستم، مربی انگلیسی تو. هر روز با هم یک درس کوتاه کار می‌کنیم، حدود ۱۵ دقیقه: اول گوش می‌دهی، بعد حرف می‌زنی. هر وقت آماده بودی، دکمهٔ «شروع روز ${fa(n)}» را پایین صفحه بزن.`);
		case 'in-progress':
			return hello(m.name,
				`Welcome back, {name}! You started Day ${n}. Let’s finish it. Tap “Resume Day ${n}” below.`,
				`دوباره خوش آمدی {name}! درس روز ${fa(n)} را شروع کرده‌ای. بیا تمامش کنیم: دکمهٔ «ادامهٔ روز ${fa(n)}» را پایین صفحه بزن.`);
		case 'done-today':
			return m.caughtUp
				? hello(m.name, 'Well done today, {name}! There’s no new lesson yet, so enjoy your break.', 'امروز عالی کار کردی {name}! هنوز درس تازه‌ای نیامده، پس از استراحتت لذت ببر.')
				: hello(m.name, `Well done, {name}! You finished today’s lesson. See you tomorrow for Day ${n}.`, `آفرین {name}! درس امروز را تمام کردی. فردا برای روز ${fa(n)} منتظرت هستم.`);
		case 'caught-up':
			return hello(m.name,
				`Welcome back, {name}! The next lesson isn’t ready yet. You can practice Day ${n} one more time: tap “Do Day ${n} again” below.`,
				`دوباره خوش آمدی {name}! درس بعدی هنوز آماده نیست. می‌توانی روز ${fa(n)} را یک بار دیگر تمرین کنی: دکمهٔ «روز ${fa(n)} را دوباره انجام بده» را پایین صفحه بزن.`);
		case 'streak':
			return hello(m.name,
				`Welcome back, {name}! You’ve practiced ${m.streak} days in a row. Nice work! Day ${n} is ready when you are.`,
				`دوباره خوش آمدی {name}! ${fa(m.streak)} روز پشت سر هم تمرین کرده‌ای. آفرین! هر وقت آماده بودی، روز ${fa(n)} منتظرت است.`);
		case 'keep-going':
			return hello(m.name,
				`Welcome back, {name}! You practiced yesterday. Let’s do Day ${n} today.`,
				`دوباره خوش آمدی {name}! دیروز تمرین کردی. بیا امروز روز ${fa(n)} را انجام بدهیم.`);
		case 'long-break':
			return hello(m.name,
				`Good to see you again, {name}! Let’s keep going with Day ${n}. It takes about 15 minutes.`,
				`خوشحالم که دوباره می‌بینمت {name}! بیا با روز ${fa(n)} ادامه بدهیم. حدود ۱۵ دقیقه طول می‌کشد.`);
		default:
			return hello(m.name,
				`Welcome back, {name}! Day ${n} is ready for you. It takes about 15 minutes. A little speaking every day really helps.`,
				`دوباره خوش آمدی {name}! روز ${fa(n)} آماده است. حدود ۱۵ دقیقه طول می‌کشد. هر روز کمی حرف زدن واقعاً کمک می‌کند.`);
	}
}
