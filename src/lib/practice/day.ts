/**
 * The English daily session: a fixed shell (check-in, modules, recap) around
 * a day's theme (docs/english-themes-plan.md). Day 1 is lost luggage at the
 * airport; Day 2 is taking a taxi from the airport to the hotel.
 *
 * The shell knows nothing about what a module teaches; it only keeps the
 * order, the time budget and the saved checkpoint. Each day lists its modules;
 * a module is built one at a time, each after the owner has checked it, and a
 * day is `ready` for learners only when all of its modules are.
 */
import { z } from 'zod';
import type { DisplayText } from './hotel';

/** Every day's id, in order. */
export const DAY_IDS = ['day-1', 'day-2'] as const;
export type DayId = (typeof DAY_IDS)[number];
/** Day 1's id (kept for older callers). */
export const DAY_ID: DayId = 'day-1';
/** Every module type a day can use. */
export const MODULE_IDS = ['listen-act', 'scenario', 'phrases', 'say-it-better', 'say-in-english', 'traps', 'voice-messages', 'listen-retell', 'choose-persuade'] as const;
export type ModuleId = (typeof MODULE_IDS)[number];
export const LENGTHS = [15, 20] as const;
export type Length = (typeof LENGTHS)[number];
export const DEFAULT_LENGTH: Length = 15;

/**
 * From Day 2 a day comes in two versions (owner's decision): the same story, different modules and
 * content. Day 1 has one version for everyone.
 */
export const TRACKS = ['intermediate', 'professional'] as const;
export type Track = (typeof TRACKS)[number];
export const TRACK_NAMES: Record<Track, DisplayText> = {
	intermediate: { en: 'Intermediate', fa: 'متوسط' },
	professional: { en: 'Professional', fa: 'حرفه‌ای' }
};
/** A learner's version, from their onboarding answer about speaking (a starting point only). */
export function trackFor(profile: { comfort: string | null } | null | undefined): Track {
	return profile?.comfort === 'natural' ? 'professional' : 'intermediate';
}

export type ModuleSkill = 'listening' | 'speaking';
export interface DayModule {
	id: ModuleId;
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

/**
 * Mira's check-in on a day after the first: her hello with a link back to the story so far, then
 * one casual question the learner answers freely (it is also the mic check), then her reply.
 */
export interface DayCheckIn {
	/** After her hello: where the story is now (true to the last day's content). */
	story: DisplayText;
	/** Her casual, personal question, linked to today's theme. Its English is the day's `question`. */
	question: DisplayText;
	/** Her reply when the AI can't answer in time. */
	reply: DisplayText;
}

export interface DayPack {
	id: DayId;
	/** Its number in the course (shown as "Day 2"). */
	number: number;
	theme: DisplayText;
	/** How the coach names the day's theme in a sentence ("Today is about …"). */
	themePhrase: string;
	/** The coach's theme-linked warm-up question for this day (Day 2+ greeting). */
	question: string;
	goal: DisplayText;
	/** Mira's check-in for this day; Day 1 has its own first-session welcome instead. */
	checkIn?: DayCheckIn;
	/** False until every module is built and checked: learners never get it; the owner can try it. */
	ready: boolean;
	checkInMinutes: number;
	recapMinutes: number;
	/** The modules, for a day with one version (Day 1). */
	modules: DayModule[];
	/** The modules of each version, for a day with two (Day 2 on); `modules` is then empty. */
	tracks?: Record<Track, DayModule[]>;
}

export const DAY_ONE: DayPack = {
	id: 'day-1',
	number: 1,
	ready: true,
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
		{ id: 'listen-act', title: { en: 'Listen and connect', fa: 'گوش بده و وصل کن' }, short: { en: 'Listen', fa: 'گوش دادن' }, does: { en: 'Hear a real conversation, then show how its facts connect.', fa: 'یک گفت‌وگوی واقعی بشنو و نشان بده اتفاق‌هایش چطور به هم ربط دارند.' }, skill: 'listening', minutes: { 15: 3, 20: 4 }, built: true,
			intro: { en: 'Sara has a problem at the airport. Listen for what went wrong, and what the airline will do about it.', fa: 'سارا در فرودگاه به مشکل خورده. گوش بده ببین چه مشکلی پیش آمده و شرکت هواپیمایی قرار است برایش چه کار کند.' } },
		{ id: 'scenario', title: { en: 'Scene with a twist', fa: 'صحنه با یک غافلگیری' }, short: { en: 'Scene', fa: 'صحنه' }, does: { en: 'Solve a problem at the hotel desk when something unexpected happens.', fa: 'در پذیرش هتل مشکلی را حل کن، وقتی اتفاق غیرمنتظره‌ای می‌افتد.' }, skill: 'speaking', minutes: { 20: 4 }, built: false,
			intro: { en: 'You’re at a hotel desk with a problem. Talk to the receptionist and sort it out. Something unexpected will happen, so take your time.', fa: 'در پذیرش هتل هستی و مشکلی داری. با مسئول پذیرش حرف بزن و حلش کن. یک اتفاق غیرمنتظره هم می‌افتد، پس عجله نکن.' } },
		{ id: 'phrases', title: { en: 'Natural phrases', fa: 'عبارت‌های طبیعی' }, short: { en: 'Phrases', fa: 'عبارت‌ها' }, does: { en: 'Hear five sentences that tell a short travel story, and say each one after Mira.', fa: 'پنج جمله بشنو که با هم داستان کوتاهی از یک سفر را تعریف می‌کنند و هر کدام را بعد از میرا تکرار کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
			intro: { en: 'In this part, you’ll hear five short sentences. Together they tell a travel story. Listen, then say each one after me. Notice the phrases in bold.', fa: 'در این بخش پنج جملهٔ کوتاه می‌شنوی که با هم داستان یک سفر را تعریف می‌کنند. گوش بده و هر جمله را بعد از من تکرار کن. به عبارت‌های پررنگ دقت کن.' } },
		{ id: 'say-it-better', title: { en: 'Tell your story', fa: 'داستانت را بگو' }, short: { en: 'Story', fa: 'داستان' }, does: { en: 'Tell a short story about a problem you had, then tell it a second time, clearer.', fa: 'ماجرای کوتاه یک مشکل را بگو، بعد دوباره و روشن‌تر بگو.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
			intro: { en: 'Now it’s your turn to talk. Tell me about a problem you had on a trip. You have one minute. Then you’ll see how to say it better, and you can try again.', fa: 'حالا نوبت توست که حرف بزنی. از مشکلی که در یک سفر داشتی برایم بگو. یک دقیقه وقت داری. بعد می‌بینی چطور بهترش بگویی و می‌توانی دوباره امتحان کنی.' } }
	]
};

/**
 * Day 2 (docs/english-themes-plan.md, sub-theme 1.12): Sara takes a taxi from the airport
 * to her hotel. Its modules are being built; until then the shell shows stand-ins and only
 * the owner gets this day.
 */
export const DAY_TWO: DayPack = {
	id: 'day-2',
	number: 2,
	ready: false,
	theme: { en: 'Taking a taxi', fa: 'گرفتن تاکسی' },
	themePhrase: 'taking a taxi',
	question: 'And you? When you travel, how do you usually get from the airport to your hotel?',
	goal: {
		en: 'By the end, you can tell a taxi driver where you’re going, explain where it is, ask how long it takes, and check how to pay.',
		fa: 'در پایان می‌توانی به راننده بگویی کجا می‌روی و آن‌جا کجاست، بپرسی چقدر طول می‌کشد و کرایه را چطور بدهی.'
	},
	checkIn: {
		// Day 1: Sara's backpack went to Frankfurt; the airline will bring it to her hotel.
		story: {
			en: 'Remember Sara? Her backpack went to Frankfurt, but the airline will bring it to her hotel. Now she needs a taxi to the hotel.',
			fa: 'سارا یادت هست؟ کوله‌پشتی‌اش به فرانکفورت رفت، ولی شرکت هواپیمایی آن را به هتلش می‌آورد. حالا خود سارا باید با تاکسی به هتل برود.'
		},
		question: {
			en: 'And you? When you travel, how do you usually get from the airport to your hotel?',
			fa: 'و تو؟ وقتی سفر می‌کنی، معمولاً چطور از فرودگاه به هتل می‌روی؟'
		},
		reply: {
			en: 'Thanks for telling me. Today you’ll practice taking a taxi, step by step.',
			fa: 'ممنون که گفتی. امروز قدم‌به‌قدم گرفتن تاکسی را تمرین می‌کنی.'
		}
	},
	checkInMinutes: 2,
	recapMinutes: 2,
	modules: [],
	// docs/english-day-2/README.md: the owner's two versions, five modules each.
	tracks: {
		intermediate: [
			{ id: 'listen-act', title: { en: 'Listen and connect', fa: 'گوش بده و وصل کن' }, short: { en: 'Listen', fa: 'گوش دادن' }, does: { en: 'Hear Sara and a taxi driver, then show how the facts connect.', fa: 'گفت‌وگوی سارا و رانندهٔ تاکسی را بشنو و نشان بده اتفاق‌هایش چطور به هم ربط دارند.' }, skill: 'listening', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Sara is taking a taxi from the airport to her hotel. Listen for where she’s going, what changes on the way, and how she pays.', fa: 'سارا با تاکسی از فرودگاه به هتلش می‌رود. گوش بده ببین کجا می‌رود، سر راه چه چیزی عوض می‌شود و کرایه را چطور می‌دهد.' } },
			{ id: 'phrases', title: { en: 'Natural phrases', fa: 'عبارت‌های طبیعی' }, short: { en: 'Phrases', fa: 'عبارت‌ها' }, does: { en: 'Hear five sentences from the taxi ride, and say each one after Mira.', fa: 'پنج جمله از همین سفر با تاکسی بشنو و هر کدام را بعد از میرا تکرار کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Here are five sentences from Sara’s ride, in order. Listen, then say each one after me. Notice the phrases in bold.', fa: 'این پنج جمله از سفر سارا است، به همان ترتیب. گوش بده و هر جمله را بعد از من تکرار کن. به عبارت‌های پررنگ دقت کن.' } },
			{ id: 'traps', title: { en: 'Persian-speaker traps', fa: 'اشتباه‌های آشنا' }, short: { en: 'Traps', fa: 'اشتباه‌ها' }, does: { en: 'Find the mistake Persian speakers often make in a taxi, then say the sentence right.', fa: 'اشتباهی را که فارسی‌زبان‌ها در تاکسی زیاد می‌کنند پیدا کن، بعد جمله را درست بگو.' }, skill: 'speaking', minutes: { 15: 3, 20: 3 }, built: false,
				intro: { en: 'Each sentence has one mistake that Persian speakers often make. Tap the wrong word, then say the sentence the right way.', fa: 'هر جمله یک اشتباه دارد که فارسی‌زبان‌ها زیاد می‌کنند. روی کلمهٔ اشتباه بزن، بعد جمله را درست بگو.' } },
			{ id: 'say-in-english', title: { en: 'Say it in English', fa: 'به انگلیسی بگو' }, short: { en: 'Say it', fa: 'بگو' }, does: { en: 'Read what you want to tell a taxi driver in Persian, and say it in English.', fa: 'چیزی را که می‌خواهی به رانندهٔ تاکسی بگویی به فارسی می‌خوانی و به انگلیسی می‌گویی.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: false,
				intro: { en: 'Now you talk to the driver. I’ll show you what you want to say in Persian. Say it in English, the way you’d really say it.', fa: 'حالا با راننده حرف می‌زنی. چیزی را که می‌خواهی بگویی به فارسی نشانت می‌دهم. همان را به انگلیسی بگو، همان‌طور که واقعاً می‌گفتی.' } },
			{ id: 'voice-messages', title: { en: 'Voice messages', fa: 'پیام صوتی' }, short: { en: 'Messages', fa: 'پیام‌ها' }, does: { en: 'Hear two voice messages, from Tom and from the hotel, and reply to each one.', fa: 'دو پیام صوتی بشنو، از تام و از هتل، و به هر کدام جواب بده.' }, skill: 'speaking', minutes: { 15: 3, 20: 3 }, built: false,
				intro: { en: 'Today, you’re Sara. Two people send you voice messages. Listen, then reply with a short voice message of your own.', fa: 'امروز جای سارا هستی. دو نفر برایت پیام صوتی می‌فرستند. گوش بده و با یک پیام صوتی کوتاه جواب بده.' } }
		],
		professional: [
			{ id: 'listen-retell', title: { en: 'Listen and retell', fa: 'گوش بده و بازگو کن' }, short: { en: 'Retell', fa: 'بازگویی' }, does: { en: 'Hear the taxi driver’s strangest story, then tell it in your own words.', fa: 'عجیب‌ترین ماجرای رانندهٔ تاکسی را بشنو و بعد با کلمات خودت تعریفش کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: false,
				intro: { en: 'On the way to the hotel, Mike, the taxi driver, tells Sara a story. Listen, then tell it in your own words.', fa: 'در راه هتل، مایک، رانندهٔ تاکسی، برای سارا ماجرایی تعریف می‌کند. گوش بده و بعد با کلمات خودت تعریفش کن.' } },
			{ id: 'phrases', title: { en: 'Natural phrases', fa: 'عبارت‌های طبیعی' }, short: { en: 'Phrases', fa: 'عبارت‌ها' }, does: { en: 'Hear five natural phrases for a taxi ride, and say each one after Mira.', fa: 'پنج عبارت طبیعی برای سفر با تاکسی بشنو و هر کدام را بعد از میرا تکرار کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Here are five phrases that sound natural in a taxi, and that you’ll use today. Listen, then say each one after me.', fa: 'این پنج عبارت در تاکسی طبیعی است و امروز به کارشان می‌بری. گوش بده و هر کدام را بعد از من تکرار کن.' } },
			{ id: 'say-in-english', title: { en: 'Say it in English', fa: 'به انگلیسی بگو' }, short: { en: 'Say it', fa: 'بگو' }, does: { en: 'Read three messages in Persian, and say each one in English.', fa: 'سه پیام را به فارسی می‌خوانی و هر کدام را به انگلیسی می‌گویی.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: false,
				intro: { en: 'Today, you’re Sara. I’ll show you three things she wants to say, in Persian. Say each one in English, the way you’d really say it.', fa: 'امروز جای سارا هستی. سه چیزی را که می‌خواهد بگوید به فارسی نشانت می‌دهم. هر کدام را به انگلیسی بگو، همان‌طور که واقعاً می‌گفتی.' } },
			{ id: 'choose-persuade', title: { en: 'Choose and persuade', fa: 'انتخاب کن و قانع کن' }, short: { en: 'Persuade', fa: 'قانع کردن' }, does: { en: 'Choose the train or a taxi for a friend, and convince her.', fa: 'برای یک دوست بین قطار و تاکسی انتخاب کن و قانعش کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: false,
				intro: { en: 'A friend is landing at Riverton Airport with a big suitcase. Choose the best way to the hotel for her, and convince her.', fa: 'دوستی با یک چمدان بزرگ در فرودگاه ریورتون فرود می‌آید. بهترین راه رفتن به هتل را برایش انتخاب کن و قانعش کن.' } },
			{ id: 'scenario', title: { en: 'A call with a twist', fa: 'تماسی با یک غافلگیری' }, short: { en: 'Call', fa: 'تماس' }, does: { en: 'Call the taxi company about the phone you left in the taxi, and handle a surprise.', fa: 'به شرکت تاکسی زنگ بزن و دربارهٔ گوشی‌ای که در تاکسی جا گذاشته‌ای حرف بزن؛ وسط تماس هم یک اتفاق غیرمنتظره می‌افتد.' }, skill: 'speaking', minutes: { 15: 5, 20: 5 }, built: false,
				intro: { en: 'At the hotel, you find that your phone is still in the taxi. Call the taxi company and get it back. Something unexpected will happen, so take your time.', fa: 'در هتل می‌فهمی گوشی‌ات در تاکسی جا مانده. به شرکت تاکسی زنگ بزن و پسش بگیر. یک اتفاق غیرمنتظره هم می‌افتد، پس عجله نکن.' } }
		]
	}
};

/** Every day, in course order. */
export const DAYS: DayPack[] = [DAY_ONE, DAY_TWO];
export function dayById(id: string | null | undefined): DayPack | null {
	return DAYS.find(day => day.id === id) ?? null;
}
/**
 * The day to do next: the first one after the last finished day. A day that isn't ready is
 * skipped, except for the owner (who tries it). After the last day, the last one again.
 */
export function nextDay(lastDayId: string | null | undefined, preview = false): DayPack {
	const open = DAYS.filter(day => day.ready || preview);
	const lastIndex = DAYS.findIndex(day => day.id === lastDayId);
	return open.find(day => DAYS.indexOf(day) > lastIndex) ?? open.at(-1) ?? DAY_ONE;
}
/** A saved session's day (Day 1 if the id is unknown). */
export const dayOf = (session: { day: string }) => dayById(session.day) ?? DAY_ONE;

/** The recap's name in the session's progress bar. */
export const RECAP_SHORT: DisplayText = { en: 'Recap', fa: 'مرور' };

/** Mira's line when the recap opens. */
export const RECAP_INTRO: DisplayText = { en: 'Well done. Here’s what you did today, and what comes next.', fa: 'آفرین. این کارهایی است که امروز انجام دادی، و قدم بعدی.' };

/** The modules in a day's session, in order: the version's list, or (one version) those in this length. */
export function modulesFor(length: Length, day: DayPack = DAY_ONE, track: Track = 'intermediate'): DayModule[] {
	if (day.tracks) return day.tracks[track];
	return day.modules.filter(module => module.minutes[length] !== undefined);
}
/** Every module a day has, in all its versions (for counting what's built). */
export const allModules = (day: DayPack): DayModule[] => (day.tracks ? [...day.tracks.intermediate, ...day.tracks.professional] : day.modules);
/** A module's minutes in this session (a version's modules have the same minutes in every length). */
export const minutesOf = (module: DayModule, length: Length) => module.minutes[length] ?? module.minutes[15] ?? module.minutes[20] ?? 0;

/** The module just before `id` in a day's session; `null` as `id` means "the end", so the last module. */
export function moduleBefore(length: Length, id: string | null, day: DayPack = DAY_ONE, track: Track = 'intermediate'): DayModule | null {
	const list = modulesFor(length, day, track);
	const index = id === null ? list.length : list.findIndex(module => module.id === id);
	return index > 0 ? list[index - 1] : null;
}

export interface AgendaItem { id: string; title: DisplayText; minutes: number }
/** Every step with its minutes, check-in first and recap last. The total equals `length`. */
export function agendaFor(length: Length, day: DayPack = DAY_ONE, track: Track = 'intermediate'): AgendaItem[] {
	return [
		{ id: 'check-in', title: { en: 'Check-in', fa: 'شروع' }, minutes: day.checkInMinutes },
		...modulesFor(length, day, track).map(module => ({ id: module.id, title: module.title, minutes: minutesOf(module, length) })),
		{ id: 'recap', title: { en: 'Recap', fa: 'مرور' }, minutes: day.recapMinutes }
	];
}
export const agendaMinutes = (length: Length, day: DayPack = DAY_ONE, track: Track = 'intermediate') => agendaFor(length, day, track).reduce((sum, item) => sum + item.minutes, 0);

/** Saved checkpoint. Holds progress only, never what the learner said. */
export const DaySessionSchema = z.object({
	day: z.enum(DAY_IDS),
	/** The day's version (only on a day with two). */
	track: z.enum(TRACKS).optional(),
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

export function startSession(length: Length, now = new Date(), day: DayPack = DAY_ONE, track: Track = 'intermediate'): DaySession {
	return { day: day.id, ...(day.tracks ? { track } : {}), length, stage: 'modules', done: [], skipped: [], startedAt: now.toISOString() };
}
/** A session's modules, in order. */
export const sessionModules = (session: DaySession) => modulesFor(session.length, dayOf(session), session.track ?? 'intermediate');

/** The first module of the session that is neither done nor skipped, or null when all are. */
export function currentModule(session: DaySession): DayModule | null {
	return sessionModules(session).find(module => !session.done.includes(module.id) && !session.skipped.includes(module.id)) ?? null;
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
	const day = dayOf(session);
	const total = agendaMinutes(session.length, day, session.track ?? 'intermediate');
	if (session.stage === 'done') return 1;
	let spent: number = day.checkInMinutes;
	for (const module of sessionModules(session)) {
		if (session.done.includes(module.id) || session.skipped.includes(module.id)) spent += minutesOf(module, session.length);
	}
	return Math.min(1, spent / total);
}

export interface Recommendation { title: DisplayText; why: DisplayText }
/**
 * Tomorrow's suggestion. Until modules report results, the only signal is
 * what the learner skipped: that comes back first. With nothing skipped the
 * learner moves on to the next theme (named when `upcoming` is given).
 */
export function recommend(session: DaySession, upcoming?: DayPack | null): Recommendation {
	const modules = sessionModules(session);
	const skipped = modules.find(module => session.skipped.includes(module.id));
	const weak = modules.find(module => { const score = session.scores?.[module.id]; return score && score.correct / score.total < 0.6; });
	if (weak && !session.skipped.includes(weak.id)) return { title: { en: `Next time: ${weak.title.en} again`, fa: `دفعهٔ بعد: دوباره ${weak.title.fa}` }, why: { en: 'It was the hardest part today, so you get another go with new details.', fa: 'امروز سخت‌ترین بخش بود، پس با جزئیات تازه دوباره امتحانش می‌کنی.' } };
	if (skipped) return { title: { en: `Next time: ${skipped.title.en}`, fa: `دفعهٔ بعد: ${skipped.title.fa}` }, why: { en: 'You skipped it today, so it comes back first.', fa: 'امروز ردش کردی، پس اول از همه برمی‌گردد.' } };
	if (upcoming && upcoming.id === session.day) {
		// No new day is open yet: say so, never promise a new theme.
		const day = dayOf(session);
		return { title: { en: `Next time: Day ${day.number} again`, fa: `دفعهٔ بعد: دوباره روز ${day.number.toLocaleString('fa-IR')}` }, why: { en: 'New days are on the way. Until then, practising this one again helps it stick.', fa: 'روزهای تازه در راه است. تا آن موقع، تمرین دوبارهٔ همین روز کمک می‌کند بهتر یادت بماند.' } };
	}
	const title = upcoming
		? { en: `Next time: Day ${upcoming.number}, ${upcoming.theme.en}`, fa: `دفعهٔ بعد: روز ${upcoming.number.toLocaleString('fa-IR')}، ${upcoming.theme.fa}` }
		: { en: 'Next time: a new theme', fa: 'دفعهٔ بعد: یک موضوع تازه' };
	return { title, why: { en: 'You finished every step today, so you move on.', fa: 'امروز همهٔ مرحله‌ها را تمام کردی، پس جلو می‌روی.' } };
}
