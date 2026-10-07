/**
 * The English daily session: a fixed shell (check-in, modules, recap) around
 * a day's theme. Day 1 is "Handle a problem while travelling".
 *
 * The shell knows nothing about what a module teaches; it only keeps the
 * order, the time budget and the saved checkpoint. Modules are added to
 * `DAY_ONE.modules` one at a time, each after the owner has checked it.
 */
import { z } from 'zod';
import type { DisplayText } from './hotel';

export const DAY_ID = 'day-1';
export const LENGTHS = [15, 20] as const;
export type Length = (typeof LENGTHS)[number];
export const DEFAULT_LENGTH: Length = 15;

export type ModuleSkill = 'listening' | 'speaking';
export interface DayModule {
	id: string;
	title: DisplayText;
	/** One or two words for the session's progress bar. */
	short: DisplayText;
	/** One line that says what the learner will do. */
	does: DisplayText;
	skill: ModuleSkill;
	/** Minutes per session length; a missing length means "not in that session". */
	minutes: Partial<Record<Length, number>>;
	/** False until the module has been built and checked. The shell shows a stand-in. */
	built: boolean;
	/** Mira's spoken introduction, as a teacher would say it (shown and read aloud). */
	intro: DisplayText;
}

export const DAY_ONE = {
	id: DAY_ID,
	theme: { en: 'Handle a problem while travelling', fa: 'حل یک مشکل در سفر' } satisfies DisplayText,
	/** How the coach names today's theme in a sentence ("Today is about …"). */
	themePhrase: 'travel problems',
	/** The coach's theme-linked warm-up question for this day (Day 2+ greeting). */
	question: 'Has anything ever gone wrong for you on a trip?',
	goal: {
		en: 'By the end, you can explain a problem, ask for help, and say it clearly.',
		fa: 'در پایان می‌توانی یک مشکل را توضیح بدهی، کمک بخواهی و روشن بگویی.'
	} satisfies DisplayText,
	checkInMinutes: 2,
	recapMinutes: 2,
	modules: [
		{ id: 'listen-act', title: { en: 'Listen and act', fa: 'گوش بده و عمل کن' }, short: { en: 'Listen', fa: 'گوش دادن' }, does: { en: 'Hear instructions, then do exactly what they say.', fa: 'دستورها را بشنو و دقیقاً انجامشان بده.' }, skill: 'listening', minutes: { 15: 3, 20: 4 }, built: true,
			intro: { en: 'In this part, you’ll hear a few short instructions. Listen carefully, then do what they ask. You can listen twice.', fa: 'در این بخش چند دستور کوتاه می‌شنوی. با دقت گوش بده و بعد آن‌ها را انجام بده. دو بار می‌توانی گوش بدهی.' } },
		{ id: 'scenario', title: { en: 'Scene with a twist', fa: 'صحنه با یک غافلگیری' }, short: { en: 'Scene', fa: 'صحنه' }, does: { en: 'Solve a problem at the hotel desk when something unexpected happens.', fa: 'در پذیرش هتل مشکلی را حل کن، وقتی اتفاق غیرمنتظره‌ای می‌افتد.' }, skill: 'speaking', minutes: { 20: 4 }, built: false,
			intro: { en: 'You’re at a hotel desk with a problem. Talk to the receptionist and sort it out. Something unexpected will happen, so take your time.', fa: 'در پذیرش هتل هستی و مشکلی داری. با مسئول پذیرش حرف بزن و حلش کن. یک اتفاق غیرمنتظره هم می‌افتد، پس عجله نکن.' } },
		{ id: 'phrases', title: { en: 'Natural phrases', fa: 'عبارت‌های طبیعی' }, short: { en: 'Phrases', fa: 'عبارت‌ها' }, does: { en: 'Hear five sentences that tell a short travel story, and say each one after Mira.', fa: 'پنج جمله بشنو که با هم داستان کوتاهی از یک سفر را تعریف می‌کنند و هر کدام را بعد از میرا تکرار کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
			intro: { en: 'In this part, you’ll hear five short sentences. Together they tell a travel story. Listen, then say each one after me. Notice the phrases in bold.', fa: 'در این بخش پنج جملهٔ کوتاه می‌شنوی که با هم داستان یک سفر را تعریف می‌کنند. گوش بده و هر جمله را بعد از من تکرار کن. به عبارت‌های پررنگ دقت کن.' } },
		{ id: 'say-it-better', title: { en: 'Say it again, better', fa: 'دوباره بگو، بهتر' }, short: { en: 'Story', fa: 'داستان' }, does: { en: 'Tell a short story about a problem you had, then tell it a second time, clearer.', fa: 'ماجرای کوتاه یک مشکل را بگو، بعد دوباره و روشن‌تر بگو.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
			intro: { en: 'Now it’s your turn to talk. Tell me about a problem you had on a trip. You have one minute. Then you’ll see how to say it better, and you can try again.', fa: 'حالا نوبت توست که حرف بزنی. از مشکلی که در یک سفر داشتی برایم بگو. یک دقیقه وقت داری. بعد می‌بینی چطور بهترش بگویی و می‌توانی دوباره امتحان کنی.' } }
	] satisfies DayModule[]
} as const;

/** The recap's name in the session's progress bar. */
export const RECAP_SHORT: DisplayText = { en: 'Recap', fa: 'مرور' };

/** Mira's line when the recap opens. */
export const RECAP_INTRO: DisplayText = { en: 'Well done. Here’s what you did today, and what comes next.', fa: 'آفرین. این کارهایی است که امروز انجام دادی، و قدم بعدی.' };

export type ModuleId = (typeof DAY_ONE.modules)[number]['id'];
const MODULE_IDS = DAY_ONE.modules.map(module => module.id) as [ModuleId, ...ModuleId[]];

/** The modules in today's session, in order. */
export function modulesFor(length: Length): DayModule[] {
	return DAY_ONE.modules.filter(module => module.minutes[length] !== undefined);
}

/** The module just before `id` in today's session; `null` as `id` means "the end", so the last module. */
export function moduleBefore(length: Length, id: string | null): DayModule | null {
	const list = modulesFor(length);
	const index = id === null ? list.length : list.findIndex(module => module.id === id);
	return index > 0 ? list[index - 1] : null;
}

export interface AgendaItem { id: string; title: DisplayText; minutes: number }
/** Every step with its minutes, check-in first and recap last. The total equals `length`. */
export function agendaFor(length: Length): AgendaItem[] {
	return [
		{ id: 'check-in', title: { en: 'Check-in', fa: 'شروع' }, minutes: DAY_ONE.checkInMinutes },
		...modulesFor(length).map(module => ({ id: module.id, title: module.title, minutes: module.minutes[length] as number })),
		{ id: 'recap', title: { en: 'Recap', fa: 'مرور' }, minutes: DAY_ONE.recapMinutes }
	];
}
export const agendaMinutes = (length: Length) => agendaFor(length).reduce((sum, item) => sum + item.minutes, 0);

/** Saved checkpoint. Holds progress only, never what the learner said. */
export const DaySessionSchema = z.object({
	day: z.literal(DAY_ID),
	length: z.union([z.literal(15), z.literal(20)]),
	stage: z.enum(['modules', 'recap', 'done']),
	done: z.array(z.enum(MODULE_IDS)).max(8),
	skipped: z.array(z.enum(MODULE_IDS)).max(8),
	/** Result of each finished module: how many parts were right. Numbers only. */
	scores: z.partialRecord(z.enum(MODULE_IDS), z.object({ correct: z.number().int().min(0).max(20), total: z.number().int().min(1).max(20) })).optional(),
	startedAt: z.string().datetime(),
	completedAt: z.string().datetime().optional()
}).strict();
export type DaySession = z.infer<typeof DaySessionSchema>;

export function startSession(length: Length, now = new Date()): DaySession {
	return { day: DAY_ID, length, stage: 'modules', done: [], skipped: [], startedAt: now.toISOString() };
}

/** The first module of the session that is neither done nor skipped, or null when all are. */
export function currentModule(session: DaySession): DayModule | null {
	return modulesFor(session.length).find(module => !session.done.includes(module.id as ModuleId) && !session.skipped.includes(module.id as ModuleId)) ?? null;
}

export function finishModule(session: DaySession, id: ModuleId, outcome: 'done' | 'skipped', score?: { correct: number; total: number }): DaySession {
	if (session.stage !== 'modules' || session.done.includes(id) || session.skipped.includes(id)) return session;
	const next = { ...session, [outcome]: [...session[outcome], id], ...(score && outcome === 'done' ? { scores: { ...session.scores, [id]: score } } : {}) } as DaySession;
	return currentModule(next) ? next : { ...next, stage: 'recap' };
}

/** A module skipped earlier, done now: it moves from skipped to done and keeps its score. */
export function completeLater(session: DaySession, id: ModuleId, score?: { correct: number; total: number }): DaySession {
	if (session.stage === 'done' || !session.skipped.includes(id)) return session;
	return { ...session, skipped: session.skipped.filter(item => item !== id), done: [...session.done, id], ...(score ? { scores: { ...session.scores, [id]: score } } : {}) };
}

export function completeSession(session: DaySession, now = new Date()): DaySession {
	return { ...session, stage: 'done', completedAt: now.toISOString() };
}

/** How far through the session, 0–1, by minutes. Check-in counts once the session has started. */
export function sessionProgress(session: DaySession): number {
	const total = agendaMinutes(session.length);
	if (session.stage === 'done') return 1;
	let spent: number = DAY_ONE.checkInMinutes;
	for (const module of modulesFor(session.length)) {
		if (session.done.includes(module.id as ModuleId) || session.skipped.includes(module.id as ModuleId)) spent += module.minutes[session.length] as number;
	}
	return Math.min(1, spent / total);
}

export interface Recommendation { title: DisplayText; why: DisplayText }
/**
 * Tomorrow's suggestion. Until modules report results, the only signal is
 * what the learner skipped: that comes back first. With nothing skipped the
 * learner moves on to the next theme.
 */
export function recommend(session: DaySession): Recommendation {
	const skipped = DAY_ONE.modules.find(module => session.skipped.includes(module.id));
	const weak = DAY_ONE.modules.find(module => { const score = session.scores?.[module.id]; return score && score.correct / score.total < 0.6; });
	if (weak && !session.skipped.includes(weak.id)) return { title: { en: `Next time: ${weak.title.en} again`, fa: `دفعهٔ بعد: دوباره ${weak.title.fa}` }, why: { en: 'It was the hardest part today, so you get another go with new details.', fa: 'امروز سخت‌ترین بخش بود، پس با جزئیات تازه دوباره امتحانش می‌کنی.' } };
	if (skipped) return { title: { en: `Next time: ${skipped.title.en}`, fa: `دفعهٔ بعد: ${skipped.title.fa}` }, why: { en: 'You skipped it today, so it comes back first.', fa: 'امروز ردش کردی، پس اول از همه برمی‌گردد.' } };
	return { title: { en: 'Next time: a new theme', fa: 'دفعهٔ بعد: یک موضوع تازه' }, why: { en: 'You finished every step today, so you move on.', fa: 'امروز همهٔ مرحله‌ها را تمام کردی، پس جلو می‌روی.' } };
}
