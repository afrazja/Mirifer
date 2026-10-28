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
import { EVERYDAY_ONE } from './days/everyday-1/pack';

/** Every day's id, in order. */
export const DAY_IDS = ['day-1', 'day-2', 'day-3', 'day-4', 'everyday-1'] as const;
export type DayId = (typeof DAY_IDS)[number];
/** Day 1's id (kept for older callers). */
export const DAY_ID: DayId = 'day-1';
/** Every module type a day can use. */
export const MODULE_IDS = ['listen-act', 'scenario', 'phrases', 'say-it-better', 'say-in-english', 'traps', 'voice-messages', 'listen-retell', 'choose-persuade', 'group-chat'] as const;
export type ModuleId = (typeof MODULE_IDS)[number];
export const LENGTHS = [15, 20] as const;
export type Length = (typeof LENGTHS)[number];
export const DEFAULT_LENGTH: Length = 15;

/**
 * From Day 2 a day comes in two versions (owner's decision): the same story, different modules and
 * content. Day 1 has one version for everyone.
 */
/**
 * The stories a goal starts with (docs/goal-path-plan.md): each chapter belongs to one. A learner's
 * goal decides which arc comes first; the others follow. Only Travel exists so far.
 */
export const ARCS = ['travel', 'everyday', 'abroad', 'work', 'exam'] as const;
export type ArcId = (typeof ARCS)[number];
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
	/** Say it again, better: the chapter's question (`SAY_PROMPTS`; Day 1's trip problem when missing). */
	sayPrompt?: string;
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
	/** The chapter ending's line per version, when it differs ("You've practiced…"); else from `goal`. */
	goals?: Partial<Record<Track, DisplayText>>;
	/** Mira's check-in for this day; Day 1 has its own first-session welcome instead. */
	checkIn?: DayCheckIn;
	/** False until every module is built and checked: learners never get it; the owner can try it. */
	ready: boolean;
	/** The story it belongs to (Travel when missing: Days 1–4). */
	arc?: ArcId;
	/** Not ready, but shown to the owner's test accounts on the step path (a pilot before release). */
	pilot?: boolean;
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
	theme: { en: 'Lost luggage at the airport', fa: 'بار گمشده در فرودگاه' } satisfies DisplayText,
	/** How the coach names today's theme in a sentence ("Today is about …"). */
	themePhrase: 'lost luggage',
	/** The coach's theme-linked warm-up question for this day (Day 2+ greeting). */
	question: 'Has anything ever gone wrong for you on a trip?',
	goal: {
		en: 'By the end, you can describe your bag and ask when you’ll get it back.',
		fa: 'در پایان می‌توانی بارت را توصیف کنی و بپرسی کِی پسش می‌گیری.'
	} satisfies DisplayText,
	checkInMinutes: 2,
	recapMinutes: 2,
	modules: [],
	// docs/english-day-1/README.md: rebuilt in two versions (the owner's choice), five modules each;
	// both open with Sara at the baggage desk, and Day 1 stays the lightest day.
	tracks: {
		intermediate: [
			{ id: 'listen-act', title: { en: 'Listen and connect', fa: 'گوش بده و وصل کن' }, short: { en: 'Listen', fa: 'گوش دادن' }, does: { en: 'Hear Sara at the airport baggage desk, then show what you caught about her missing bag.', fa: 'گفت‌وگوی سارا با کارمند باجهٔ بار گمشده را بشنو و نشان بده دربارهٔ بارش چه چیزهایی را فهمیدی.' }, skill: 'listening', minutes: { 15: 3, 20: 3 }, built: true,
				intro: { en: 'Sara is at the airport, and one of her bags is missing. Listen for what it looks like, where it went, when it comes, and what’s inside.', fa: 'سارا در فرودگاه است و یکی از بارهایش نیامده. گوش بده ببین چه شکلی است، کجا رفته، کِی می‌رسد و داخلش چه چیزهایی هست.' } },
			{ id: 'phrases', title: { en: 'Natural phrases', fa: 'عبارت‌های طبیعی' }, short: { en: 'Phrases', fa: 'عبارت‌ها' }, does: { en: 'Hear five sentences you can say at the baggage desk, and say each one after Mira.', fa: 'پنج جمله بشنو که می‌توانی جلوی باجهٔ بار گمشده بگویی، و هر کدام را بعد از میرا تکرار کن.' }, skill: 'speaking', minutes: { 15: 3, 20: 3 }, built: true,
				intro: { en: 'Now it’s your turn at the baggage desk. Here, your name is Karimi, and one of your bags didn’t come out. Listen, then say each sentence after me. I only check the phrase in bold, not your accent.', fa: 'حالا نوبت خودت است که به باجهٔ بار گمشده بروی. این‌جا اسمت کریمی است و یکی از بارهایت بیرون نیامده. گوش بده و هر جمله را بعد از من تکرار کن. من فقط عبارت پررنگ را چک می‌کنم، نه لهجه‌ات را.' } },
			{ id: 'traps', title: { en: 'Persian-speaker traps', fa: 'اشتباه‌های آشنا' }, short: { en: 'Traps', fa: 'اشتباه‌ها' }, does: { en: 'Find the mistake Persian speakers often make at the airport, then say the sentence right.', fa: 'اشتباهی را که فارسی‌زبان‌ها در فرودگاه زیاد می‌کنند پیدا کن، بعد جمله را درست بگو.' }, skill: 'speaking', minutes: { 20: 2 }, built: true,
				intro: { en: 'Here are three things you might say at the baggage desk. Each one has a mistake that Persian speakers often make. Tap the wrong word, then say the sentence the right way.', fa: 'این سه جمله را ممکن است جلوی باجهٔ بار گمشده بگویی. هر کدام یک اشتباه دارد که فارسی‌زبان‌ها زیاد می‌کنند. روی کلمهٔ اشتباه بزن، بعد جمله را درست بگو.' } },
			{ id: 'say-in-english', title: { en: 'Say it in English', fa: 'به انگلیسی بگو' }, short: { en: 'Say it', fa: 'بگو' }, does: { en: 'Read what you want to tell the baggage desk in Persian, and say it in English.', fa: 'چیزی را که می‌خواهی به باجهٔ بار گمشده بگویی به فارسی می‌خوانی و به انگلیسی می‌گویی.' }, skill: 'speaking', minutes: { 15: 3, 20: 3 }, built: true,
				intro: { en: 'Now say it your own way. I’ll show you what you want to tell the desk, in Persian. Say it in English, the way you’d really say it at the desk.', fa: 'حالا با کلمات خودت بگو. چیزی را که می‌خواهی به باجه بگویی به فارسی نشانت می‌دهم. به انگلیسی بگو، همان‌طور که واقعاً جلوی باجه می‌گفتی.' } },
			{ id: 'voice-messages', title: { en: 'Voice messages', fa: 'پیام صوتی' }, short: { en: 'Messages', fa: 'پیام‌ها' }, does: { en: 'Hear two voice messages, from the baggage desk and your friend Ben, and reply to each one.', fa: 'دو پیام صوتی بشنو، از باجهٔ بار گمشده و از دوستت بن، و به هر کدام جواب بده.' }, skill: 'speaking', minutes: { 15: 3, 20: 3 }, built: true,
				intro: { en: 'You’ve just left the baggage desk, and two voice messages come in: first from the desk, then from your friend Ben. Listen, then reply with a short voice message of your own. Make sure you answer their questions.', fa: 'تازه از باجهٔ بار گمشده آمده‌ای و دو پیام صوتی برایت رسیده: اول از باجه، بعد از دوستت بن. گوش بده و با یک پیام صوتی کوتاه جواب بده. حواست باشد به سؤال‌هایشان جواب بدهی.' } }
		],
		professional: [
			{ id: 'listen-act', title: { en: 'Listen and connect', fa: 'گوش بده و وصل کن' }, short: { en: 'Listen', fa: 'گوش دادن' }, does: { en: 'Hear Sara at the airport baggage desk, then show how the facts connect.', fa: 'گفت‌وگوی سارا با کارمند باجهٔ بار گمشده را بشنو و نشان بده اتفاق‌هایش چطور به هم ربط دارند.' }, skill: 'listening', minutes: { 15: 3, 20: 3 }, built: true,
				intro: { en: 'Sara has a problem at the airport. Listen for what went wrong, and what the airline will do about it.', fa: 'سارا در فرودگاه به مشکل خورده. گوش بده ببین چه مشکلی پیش آمده و شرکت هواپیمایی قرار است برایش چه کار کند.' } },
			{ id: 'phrases', title: { en: 'Natural phrases', fa: 'عبارت‌های طبیعی' }, short: { en: 'Phrases', fa: 'عبارت‌ها' }, does: { en: 'Hear five natural phrases from Sara’s story at the baggage desk, and say each one after Mira.', fa: 'پنج عبارت طبیعی از ماجرای سارا در باجهٔ بار گمشده بشنو و هر کدام را بعد از میرا تکرار کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'These five sentences tell what happened to Sara at the baggage desk, the way she tells it later. Listen, then say each one after me. You’ll use these phrases in your own story a little later.', fa: 'این پنج جمله ماجرای سارا در باجهٔ بار گمشده را تعریف می‌کنند، همان‌طور که خودش بعداً تعریفش می‌کند. گوش بده و هر کدام را بعد از من تکرار کن. کمی بعد، در داستان خودت هم به کارشان می‌بری.' } },
			{ id: 'say-it-better', title: { en: 'Tell your story', fa: 'داستانت را بگو' }, short: { en: 'Story', fa: 'داستان' }, does: { en: 'Tell a short story about a problem you had, then tell it a second time, clearer.', fa: 'ماجرای کوتاه یک مشکل را بگو، بعد دوباره و روشن‌تر بگو.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
			intro: { en: 'Now it’s your turn to talk. Tell me about a problem you had on a trip. You have one minute. Then you’ll see how to say it better, and you can try again.', fa: 'حالا نوبت توست که حرف بزنی. از مشکلی که در یک سفر داشتی برایم بگو. یک دقیقه وقت داری. بعد می‌بینی چطور بهترش بگویی و می‌توانی دوباره امتحان کنی.' } },
			{ id: 'say-in-english', title: { en: 'Say it in English', fa: 'به انگلیسی بگو' }, short: { en: 'Say it', fa: 'بگو' }, does: { en: 'Read three things you want to tell the baggage desk, in Persian, and say each one in English.', fa: 'سه چیزی را که می‌خواهی به باجهٔ بار گمشده بگویی به فارسی می‌خوانی و هر کدام را به انگلیسی می‌گویی.' }, skill: 'speaking', minutes: { 20: 3 }, built: true,
				intro: { en: 'Now it’s your turn at the baggage desk. Here, your name is Karimi, and your suitcase didn’t come out. I’ll show you three things you want to say, in Persian. Say each one in English, the way you’d really say it.', fa: 'حالا نوبت خودت است که به باجهٔ بار گمشده بروی. این‌جا اسمت کریمی است و چمدانت بیرون نیامده. سه چیزی را که می‌خواهی بگویی به فارسی نشانت می‌دهم. هر کدام را به انگلیسی بگو، همان‌طور که واقعاً جلوی باجه می‌گفتی.' } },
			{ id: 'scenario', title: { en: 'A lost bag with a twist', fa: 'چمدان گمشده، با یک غافلگیری' }, short: { en: 'Lost bag', fa: 'چمدان' }, does: { en: 'Report your own missing suitcase at the baggage desk, and handle a surprise.', fa: 'گم شدن چمدان خودت را در باجهٔ بار گمشده گزارش بده؛ وسط کار هم یک اتفاق غیرمنتظره می‌افتد.' }, skill: 'speaking', minutes: { 15: 5, 20: 5 }, built: true,
				intro: { en: 'Now it’s your turn. You’ve just landed in Riverton too, and one of your own suitcases didn’t come out. Go to the baggage desk and talk to Ryan. Something unexpected will happen, so take your time.', fa: 'حالا نوبت توست. تو هم تازه در Riverton فرود آمده‌ای و یکی از چمدان‌های خودت روی نوار نیامده. به باجهٔ بار گمشده برو و با رایان حرف بزن. یک اتفاق غیرمنتظره هم می‌افتد، پس عجله نکن.' } }
		]
	}
};

/**
 * Day 2 (docs/english-themes-plan.md, sub-theme 1.12): Sara takes a taxi from the airport
 * to her hotel. Its modules are being built; until then the shell shows stand-ins and only
 * the owner gets this day.
 */
export const DAY_TWO: DayPack = {
	id: 'day-2',
	number: 2,
	ready: true,
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
			{ id: 'traps', title: { en: 'Persian-speaker traps', fa: 'اشتباه‌های آشنا' }, short: { en: 'Traps', fa: 'اشتباه‌ها' }, does: { en: 'Find the mistake Persian speakers often make in a taxi, then say the sentence right.', fa: 'اشتباهی را که فارسی‌زبان‌ها در تاکسی زیاد می‌کنند پیدا کن، بعد جمله را درست بگو.' }, skill: 'speaking', minutes: { 20: 3 }, built: true,
				intro: { en: 'Each sentence has one mistake that Persian speakers often make. Tap the wrong word, then say the sentence the right way.', fa: 'هر جمله یک اشتباه دارد که فارسی‌زبان‌ها زیاد می‌کنند. روی کلمهٔ اشتباه بزن، بعد جمله را درست بگو.' } },
			{ id: 'say-in-english', title: { en: 'Say it in English', fa: 'به انگلیسی بگو' }, short: { en: 'Say it', fa: 'بگو' }, does: { en: 'Read what you want to tell a taxi driver in Persian, and say it in English.', fa: 'چیزی را که می‌خواهی به رانندهٔ تاکسی بگویی به فارسی می‌خوانی و به انگلیسی می‌گویی.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Now you talk to the driver. I’ll show you what you want to say in Persian. Say it in English, the way you’d really say it.', fa: 'حالا با راننده حرف می‌زنی. چیزی را که می‌خواهی بگویی به فارسی نشانت می‌دهم. همان را به انگلیسی بگو، همان‌طور که واقعاً می‌گفتی.' } },
			{ id: 'voice-messages', title: { en: 'Voice messages', fa: 'پیام صوتی' }, short: { en: 'Messages', fa: 'پیام‌ها' }, does: { en: 'Hear two voice messages, from Tom and from the hotel, and reply to each one.', fa: 'دو پیام صوتی بشنو، از تام و از هتل، و به هر کدام جواب بده.' }, skill: 'speaking', minutes: { 15: 3, 20: 3 }, built: true,
				intro: { en: 'Here, you’re Sara. Two people send you voice messages. Listen, then reply with a short voice message of your own.', fa: 'این‌جا جای سارا هستی. دو نفر برایت پیام صوتی می‌فرستند. گوش بده و با یک پیام صوتی کوتاه جواب بده.' } }
		],
		professional: [
			{ id: 'listen-retell', title: { en: 'Listen and retell', fa: 'گوش بده و بازگو کن' }, short: { en: 'Retell', fa: 'بازگویی' }, does: { en: 'Hear the taxi driver’s strangest story, then tell it in your own words.', fa: 'عجیب‌ترین ماجرای رانندهٔ تاکسی را بشنو و بعد با کلمات خودت تعریفش کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Here’s the story Mike, the taxi driver, loves to tell his passengers. Listen, then tell it in your own words.', fa: 'این ماجرایی است که مایک، رانندهٔ تاکسی، دوست دارد برای مسافرهایش تعریف کند. گوش بده و بعد با کلمات خودت تعریفش کن.' } },
			{ id: 'phrases', title: { en: 'Natural phrases', fa: 'عبارت‌های طبیعی' }, short: { en: 'Phrases', fa: 'عبارت‌ها' }, does: { en: 'Hear five natural phrases for a taxi ride, and say each one after Mira.', fa: 'پنج عبارت طبیعی برای سفر با تاکسی بشنو و هر کدام را بعد از میرا تکرار کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Here are five phrases that sound natural in a taxi, and that you’ll use later in this story. Listen, then say each one after me.', fa: 'این پنج عبارت در تاکسی طبیعی است و بعداً در همین داستان به کارشان می‌بری. گوش بده و هر کدام را بعد از من تکرار کن.' } },
			{ id: 'say-in-english', title: { en: 'Say it in English', fa: 'به انگلیسی بگو' }, short: { en: 'Say it', fa: 'بگو' }, does: { en: 'Read three messages in Persian, and say each one in English.', fa: 'سه پیام را به فارسی می‌خوانی و هر کدام را به انگلیسی می‌گویی.' }, skill: 'speaking', minutes: { 20: 4 }, built: true,
				intro: { en: 'Here, you’re Sara. I’ll show you three things she wants to say, in Persian. Say each one in English, the way you’d really say it.', fa: 'این‌جا جای سارا هستی. سه چیزی را که می‌خواهد بگوید به فارسی نشانت می‌دهم. هر کدام را به انگلیسی بگو، همان‌طور که واقعاً می‌گفتی.' } },
			{ id: 'choose-persuade', title: { en: 'Choose and persuade', fa: 'انتخاب کن و قانع کن' }, short: { en: 'Persuade', fa: 'قانع کردن' }, does: { en: 'Choose the train or a taxi for a friend, and stand by your choice.', fa: 'برای یک دوست بین قطار و تاکسی انتخاب کن و از انتخابت دفاع کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Your friend is coming to Riverton for the first time. She has a big suitcase and a laptop bag, she’s paying for the trip herself, and she has a meeting at the Park Hotel an hour after she lands. Pick the better way for her, tell me why, and I’ll try to change your mind.', fa: 'دوستت برای اولین بار به Riverton می‌آید. یک چمدان بزرگ و یک کیف لپ‌تاپ دارد، هزینهٔ سفر را خودش می‌دهد و یک ساعت بعد از فرود، در Park Hotel جلسه دارد. راه بهتر را برایش انتخاب کن، بگو چرا، و من سعی می‌کنم نظرت را عوض کنم.' } },
			{ id: 'scenario', title: { en: 'A call with a twist', fa: 'تماسی با یک غافلگیری' }, short: { en: 'Call', fa: 'تماس' }, does: { en: 'Call the taxi company about the phone you left in the taxi, and handle a surprise.', fa: 'به شرکت تاکسی زنگ بزن و دربارهٔ گوشی‌ای که در تاکسی جا گذاشته‌ای حرف بزن؛ وسط تماس هم یک اتفاق غیرمنتظره می‌افتد.' }, skill: 'speaking', minutes: { 15: 5, 20: 5 }, built: true,
				intro: { en: 'You left your phone in the taxi. Call Riverton Taxi and get it back. Something unexpected will happen, so take your time.', fa: 'گوشی‌ات را در تاکسی جا گذاشته‌ای. به شرکت Riverton Taxi زنگ بزن و پسش بگیر. یک اتفاق غیرمنتظره هم می‌افتد، پس عجله نکن.' } }
		]
	}
};

/** Every day, in course order. */
/**
 * Day 3 (docs/english-themes-plan.md, sub-theme 1.9): Sara checks in at the Park Hotel.
 * docs/english-day-3/: the world, the two lessons (the same five modules per version as Day 2,
 * the owner's choice) and their reviewed content. Only the owner gets it until it is ready.
 */
export const DAY_THREE: DayPack = {
	id: 'day-3',
	number: 3,
	ready: true,
	theme: { en: 'Checking in at the hotel', fa: 'تحویل گرفتن اتاق در هتل' },
	themePhrase: 'checking in at a hotel',
	question: 'And you? When you get to a hotel, what’s the first thing you ask about?',
	goal: {
		en: 'By the end, you can give your booking name, check your dates, and ask about the Wi-Fi and breakfast.',
		fa: 'در پایان می‌توانی بگویی اتاق به چه اسمی رزرو شده، تاریخ‌ها را چک کنی و دربارهٔ وای‌فای و صبحانه بپرسی.'
	},
	checkIn: {
		// Day 2: the taxi got Sara to the Park Hotel; her room was ready from 3 p.m.
		story: {
			en: 'Sara’s taxi got her to the Park Hotel. Her room is ready now, so she goes to the front desk to check in.',
			fa: 'تاکسی سارا را به Park Hotel رساند. حالا اتاقش آماده است و به پذیرش می‌رود تا اتاق را تحویل بگیرد.'
		},
		question: {
			en: 'And you? When you get to a hotel, what’s the first thing you ask about?',
			fa: 'و تو؟ وقتی به هتل می‌رسی، اولین چیزی که می‌پرسی چیست؟'
		},
		reply: {
			en: 'Thanks for telling me. Today you’ll practice checking in, step by step.',
			fa: 'ممنون که گفتی. امروز قدم‌به‌قدم تحویل گرفتن اتاق را تمرین می‌کنی.'
		}
	},
	checkInMinutes: 2,
	recapMinutes: 2,
	modules: [],
	tracks: {
		intermediate: [
			{ id: 'listen-act', title: { en: 'Listen and connect', fa: 'گوش بده و وصل کن' }, short: { en: 'Listen', fa: 'گوش دادن' }, does: { en: 'Hear Sara check in with Daniel at the front desk, then show how the facts connect.', fa: 'گفت‌وگوی سارا و دنیل را در پذیرش هتل بشنو و نشان بده اتفاق‌هایش چطور به هم ربط دارند.' }, skill: 'listening', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Sara is checking in at the Park Hotel. Listen for her room number, the Wi-Fi password, the breakfast time, and how Daniel helps her.', fa: 'سارا در پذیرش Park Hotel است و می‌خواهد اتاقش را تحویل بگیرد. گوش بده ببین شمارهٔ اتاقش چند است، رمز وای‌فای چیست، صبحانه چه ساعتی است و دنیل چطور کمکش می‌کند.' } },
			{ id: 'phrases', title: { en: 'Natural phrases', fa: 'عبارت‌های طبیعی' }, short: { en: 'Phrases', fa: 'عبارت‌ها' }, does: { en: 'Hear five sentences from Sara’s check-in, and say each one after Mira.', fa: 'پنج جمله از پذیرش سارا در هتل بشنو و هر کدام را بعد از میرا تکرار کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Here are five sentences from Sara’s check-in at the Park Hotel, in order. Listen, then say each one after me. Notice the phrases in bold.', fa: 'این پنج جمله از پذیرش سارا در هتل پارک است، به همان ترتیب. گوش بده و هر جمله را بعد از من تکرار کن. به عبارت‌های پررنگ دقت کن.' } },
			{ id: 'traps', title: { en: 'Persian-speaker traps', fa: 'اشتباه‌های آشنا' }, short: { en: 'Traps', fa: 'اشتباه‌ها' }, does: { en: 'Find the mistake Persian speakers often make at a hotel desk, then say the sentence right.', fa: 'اشتباهی را که فارسی‌زبان‌ها در پذیرش هتل زیاد می‌کنند پیدا کن، بعد جمله را درست بگو.' }, skill: 'speaking', minutes: { 20: 3 }, built: true,
				intro: { en: 'Each sentence has one mistake that Persian speakers often make when they check in. Tap the wrong word, then say the sentence the right way.', fa: 'هر جمله یک اشتباه دارد که فارسی‌زبان‌ها موقع ورود به هتل زیاد می‌کنند. روی کلمهٔ اشتباه بزن، بعد جمله را درست بگو.' } },
			{ id: 'say-in-english', title: { en: 'Say it in English', fa: 'به انگلیسی بگو' }, short: { en: 'Say it', fa: 'بگو' }, does: { en: 'Read what you want to tell the front desk in Persian, and say it in English.', fa: 'چیزی را که می‌خواهی به پذیرش هتل بگویی به فارسی می‌خوانی و به انگلیسی می‌گویی.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Now it’s your turn to check in. Your booking is under Karimi. I’ll show you what you want to say, in Persian. Say it in English, the way you’d really say it at the desk.', fa: 'حالا نوبت خودت است که اتاقت را تحویل بگیری. رزروت به اسم کریمی است. چیزی را که می‌خواهی بگویی به فارسی نشانت می‌دهم. همان را به انگلیسی بگو، همان‌طور که واقعاً در پذیرش می‌گفتی.' } },
			{ id: 'voice-messages', title: { en: 'Voice messages', fa: 'پیام صوتی' }, short: { en: 'Messages', fa: 'پیام‌ها' }, does: { en: 'Hear two voice messages, from Tom and from the airline, and reply to each one.', fa: 'دو پیام صوتی بشنو، از تام و از شرکت هواپیمایی، و به هر کدام جواب بده.' }, skill: 'speaking', minutes: { 15: 3, 20: 3 }, built: true,
				intro: { en: 'Here, you’re Sara, in room 714. Your phone is charging, and two voice messages come in. Listen, then reply with a short voice message of your own. Make sure you answer their questions.', fa: 'این‌جا جای سارا هستی، در اتاق ۷۱۴. گوشی‌ات را زده‌ای به شارژ و دو پیام صوتی برایت آمده. گوش بده و با یک پیام صوتی کوتاه جواب بده. حواست باشد به سؤال‌هایشان جواب بدهی.' } }
		],
		professional: [
			{ id: 'listen-retell', title: { en: 'Listen and retell', fa: 'گوش بده و بازگو کن' }, short: { en: 'Retell', fa: 'بازگویی' }, does: { en: 'Hear Daniel’s favorite check-in story, then tell it in your own words.', fa: 'ماجرای موردعلاقهٔ دنیل در پذیرش هتل را بشنو و بعد با کلمات خودت تعریفش کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Daniel at the front desk has a favorite story about a guest. Listen, then tell it in your own words.', fa: 'دنیل، مسئول پذیرش هتل، ماجرایی دربارهٔ یکی از مهمان‌هایش دارد که عاشق تعریف کردنش است. گوش بده و بعد با کلمات خودت تعریفش کن.' } },
			{ id: 'phrases', title: { en: 'Natural phrases', fa: 'عبارت‌های طبیعی' }, short: { en: 'Phrases', fa: 'عبارت‌ها' }, does: { en: 'Hear five natural phrases for checking in, and say each one after Mira.', fa: 'پنج عبارت طبیعی برای ورود به هتل بشنو و هر کدام را بعد از میرا تکرار کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Here are five phrases from Sara’s check-in at the Park Hotel. You’ll need them later in this story, too. Listen, then say each one after me.', fa: 'این پنج عبارت از پذیرش سارا در هتل پارک است. بعداً در همین داستان خودت هم به کارشان می‌بری. گوش بده و هر کدام را بعد از من تکرار کن.' } },
			{ id: 'say-in-english', title: { en: 'Say it in English', fa: 'به انگلیسی بگو' }, short: { en: 'Say it', fa: 'بگو' }, does: { en: 'Read three things Sara wants to ask the front desk, in Persian, and say each one in English.', fa: 'سه چیزی را که سارا می‌خواهد از پذیرش هتل بپرسد به فارسی می‌خوانی و هر کدام را به انگلیسی می‌گویی.' }, skill: 'speaking', minutes: { 20: 4 }, built: true,
				intro: { en: 'Here, you’re Sara again. I’ll show you three things she wants to ask Daniel at the front desk, in Persian. Say each one in English, the way you’d really say it.', fa: 'این‌جا هم جای سارا هستی. سه چیزی را که می‌خواهد از دنیل در پذیرش هتل بپرسد به فارسی نشانت می‌دهم. هر کدام را به انگلیسی بگو، همان‌طور که واقعاً می‌گفتی.' } },
			{ id: 'choose-persuade', title: { en: 'Choose and persuade', fa: 'انتخاب کن و قانع کن' }, short: { en: 'Persuade', fa: 'قانع کردن' }, does: { en: 'Choose a hotel for a friend’s trip, and stand by your choice.', fa: 'برای سفر دوستت یک هتل انتخاب کن و از انتخابت دفاع کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Your friend is staying in Riverton for three nights next month, for a two-day conference near the Park Hotel. He’s paying for the hotel himself, and his flight home is at 6:30 in the morning. Pick the better hotel for him, tell me why, and I’ll try to change your mind.', fa: 'دوستت ماه آینده برای یک کنفرانس دوروزه به Riverton می‌آید و سه شب می‌ماند. کنفرانس نزدیک Park Hotel است. پول هتل را خودش می‌دهد و پرواز برگشتش ساعت ۶:۳۰ صبح است. هتل بهتر را برایش انتخاب کن، بگو چرا، و من سعی می‌کنم نظرت را عوض کنم.' } },
			{ id: 'scenario', title: { en: 'A check-in with a twist', fa: 'تحویل گرفتن اتاق با یک غافلگیری' }, short: { en: 'Check-in', fa: 'پذیرش' }, does: { en: 'Check in at the Park Hotel with your own booking, and handle a surprise.', fa: 'در Park Hotel با رزرو خودت اتاق تحویل بگیر؛ وسط کار هم یک اتفاق غیرمنتظره می‌افتد.' }, skill: 'speaking', minutes: { 15: 5, 20: 5 }, built: true,
				intro: { en: 'You’ve just arrived at the Park Hotel, with your own booking. Check in with Daniel at the front desk. Something unexpected will happen, so take your time.', fa: 'تازه به Park Hotel رسیده‌ای و اتاقت را از قبل رزرو کرده‌ای. در پذیرش با دنیل حرف بزن و اتاقت را تحویل بگیر. یک اتفاق غیرمنتظره هم می‌افتد، پس عجله نکن.' } }
		]
	}
};

/**
 * Day 4 (docs/english-themes-plan.md, sub-theme 1.14): Sara asks the way to the Sunday market.
 * docs/english-day-4/: the world, the two lessons (the same five modules per version as Days 2–3,
 * the owner's choice) and their reviewed content. One item comes back from an earlier day; so that
 * learners see it in the 15-minute lesson, Day 4 keeps Traps (Intermediate) and Say it in English
 * (Professional) and leaves out Say it in English and Choose and persuade instead (owner's decision).
 * Only the owner gets it until it is ready.
 */
export const DAY_FOUR: DayPack = {
	id: 'day-4',
	number: 4,
	ready: false,
	theme: { en: 'Asking the way', fa: 'پرسیدن راه' },
	themePhrase: 'asking the way',
	question: 'And you? In a new city, do you ask people for directions, or use a map on your phone?',
	goal: {
		en: 'By the end, you can ask how to get somewhere, understand the answer, and check it by saying it back.',
		fa: 'در پایان می‌توانی راه جایی را بپرسی، جواب را بفهمی و با تکرارش مطمئن شوی درست شنیده‌ای.'
	},
	checkIn: {
		// Day 3: Sara checked in on Saturday; the airline was bringing her backpack on Sunday morning.
		story: {
			en: 'It’s Sunday morning in Riverton. Sara’s backpack finally arrived, and she wants to walk to the Sunday market in Central Park. But her phone has no data, so she can’t use a map.',
			fa: 'یکشنبه صبح در Riverton. کوله‌پشتی سارا بالاخره رسیده و می‌خواهد پیاده تا بازار یکشنبه در Central Park برود. ولی گوشی‌اش اینترنت ندارد و نمی‌تواند نقشه ببیند.'
		},
		question: {
			en: 'And you? In a new city, do you ask people for directions, or use a map on your phone?',
			fa: 'و تو؟ در یک شهر تازه، راه را از مردم می‌پرسی یا با نقشهٔ گوشی‌ات پیدا می‌کنی؟'
		},
		reply: {
			en: 'Thanks for telling me. Today you’ll practice asking the way, and understanding the answer.',
			fa: 'ممنون که گفتی. امروز پرسیدن راه و فهمیدن جوابش را تمرین می‌کنی.'
		}
	},
	checkInMinutes: 2,
	recapMinutes: 2,
	modules: [],
	tracks: {
		intermediate: [
			{ id: 'listen-act', title: { en: 'Listen and connect', fa: 'گوش بده و وصل کن' }, short: { en: 'Listen', fa: 'گوش دادن' }, does: { en: 'Hear Sara ask Daniel the way to the Sunday market, then show how the facts connect.', fa: 'بشنو سارا چطور راه بازار یکشنبه را از دنیل می‌پرسد و بعد نشان بده اتفاق‌هایش چطور به هم ربط دارند.' }, skill: 'listening', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Sara wants to go to the Sunday market in Central Park. Listen for how long it takes, where she turns left, where the market is, and how Sara checks the way.', fa: 'سارا می‌خواهد به بازار یکشنبه در Central Park برود. گوش بده ببین راه چقدر طول می‌کشد، کجا باید به چپ بپیچد، بازار کجاست و سارا چطور مطمئن می‌شود راه را درست فهمیده.' } },
			{ id: 'phrases', title: { en: 'Natural phrases', fa: 'عبارت‌های طبیعی' }, short: { en: 'Phrases', fa: 'عبارت‌ها' }, does: { en: 'Hear five sentences from Sara’s walk to the Sunday market, and say each one after Mira.', fa: 'پنج جمله از مسیر سارا تا بازار یکشنبه بشنو و هر کدام را بعد از میرا تکرار کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Here are five sentences from Sara’s Sunday morning, as she asks the way to the market. Listen, then say each one after me. Notice the phrases in bold.', fa: 'این پنج جمله از صبح یکشنبهٔ سارا است، وقتی راه بازار را می‌پرسد. گوش بده و هر جمله را بعد از من تکرار کن. به عبارت‌های پررنگ دقت کن.' } },
			{ id: 'traps', title: { en: 'Persian-speaker traps', fa: 'اشتباه‌های آشنا' }, short: { en: 'Traps', fa: 'اشتباه‌ها' }, does: { en: 'Find the mistake Persian speakers often make when they ask the way, then say the sentence right.', fa: 'اشتباهی را که فارسی‌زبان‌ها موقع پرسیدن راه زیاد می‌کنند پیدا کن، بعد جمله را درست بگو.' }, skill: 'speaking', minutes: { 15: 3, 20: 3 }, built: true,
				intro: { en: 'Each sentence has one mistake that Persian speakers often make. The first one is from Day 1, about your lost bag. The other four are about directions. Tap the mistake, then say the sentence the right way.', fa: 'هر جمله یک اشتباه دارد که فارسی‌زبان‌ها زیاد می‌کنند. اولی از روز اول است، دربارهٔ چمدان گمشده‌ات. چهار تای دیگر اشتباه‌هایی است که موقع پرسیدن راه پیش می‌آید. روی اشتباه بزن، بعد جمله را درست بگو.' } },
			{ id: 'say-in-english', title: { en: 'Say it in English', fa: 'به انگلیسی بگو' }, short: { en: 'Say it', fa: 'بگو' }, does: { en: 'Read what you want to ask the front desk in Persian, and say it in English.', fa: 'چیزی را که می‌خواهی از پذیرش هتل بپرسی به فارسی می‌خوانی و به انگلیسی می‌گویی.' }, skill: 'speaking', minutes: { 20: 4 }, built: true,
				intro: { en: 'Now it’s your turn. You want to go to the City Museum today, so you ask the front desk the way. I’ll show you what you want to say, in Persian. Say it in English, the way you’d really say it.', fa: 'حالا نوبت خودت است. امروز می‌خواهی به City Museum بروی و راهش را از پذیرش هتل می‌پرسی. چیزی را که می‌خواهی بگویی به فارسی نشانت می‌دهم. همان را به انگلیسی بگو، همان‌طور که واقعاً می‌گفتی.' } },
			{ id: 'voice-messages', title: { en: 'Voice messages', fa: 'پیام صوتی' }, short: { en: 'Messages', fa: 'پیام‌ها' }, does: { en: 'Hear two voice messages, from Daniel and from Tom, and reply to each one.', fa: 'دو پیام صوتی بشنو، از دنیل و از تام، و به هر کدام جواب بده.' }, skill: 'speaking', minutes: { 15: 3, 20: 3 }, built: true,
				intro: { en: 'Here, you’re Sara, in room 714. It’s Sunday morning, and your phone is on the hotel Wi-Fi. Two voice messages come in. Listen, then reply with a short voice message of your own. Make sure you answer their questions.', fa: 'این‌جا جای سارا هستی، در اتاق ۷۱۴. صبح یکشنبه است و گوشی‌ات به وای‌فای هتل وصل است. دو پیام صوتی برایت می‌آید. گوش بده و با یک پیام صوتی کوتاه جواب بده. حواست باشد به سؤال‌هایشان جواب بدهی.' } }
		],
		professional: [
			{ id: 'listen-retell', title: { en: 'Listen and retell', fa: 'گوش بده و بازگو کن' }, short: { en: 'Retell', fa: 'بازگویی' }, does: { en: 'Hear how Sara finds another way to the market, then tell a friend the way.', fa: 'بشنو سارا چطور از راه دیگری به بازار می‌رسد و بعد راه را با کلمات خودت برای یک دوست توضیح بده.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Oak Street is closed, so Sara asks a man at the bus stop for another way to the market. Listen, then tell a friend how to get there from the corner of Main and Oak, in your own words.', fa: 'خیابان Oak بسته است و سارا از مردی در ایستگاه اتوبوس راه دیگری به بازار می‌پرسد. گوش بده و بعد با کلمات خودت به یک دوست بگو از سر خیابان Main و Oak چطور به بازار برسد.' } },
			{ id: 'phrases', title: { en: 'Natural phrases', fa: 'عبارت‌های طبیعی' }, short: { en: 'Phrases', fa: 'عبارت‌ها' }, does: { en: 'Hear five natural phrases for asking the way, and say each one after Mira.', fa: 'پنج عبارت طبیعی برای پرسیدن راه بشنو و هر کدام را بعد از میرا تکرار کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Here are five phrases from Sara’s Sunday morning, on her way to the market. You’ll need them later in this story, too. Listen, then say each one after me.', fa: 'این پنج عبارت از صبح یکشنبهٔ سارا است، در راه بازار. بعداً در همین داستان خودت هم به کارشان می‌بری. گوش بده و هر کدام را بعد از من تکرار کن.' } },
			{ id: 'say-in-english', title: { en: 'Say it in English', fa: 'به انگلیسی بگو' }, short: { en: 'Say it', fa: 'بگو' }, does: { en: 'Read three things Sara wants to say, in Persian, and say each one in English.', fa: 'سه چیزی را که سارا می‌خواهد بگوید به فارسی می‌خوانی و هر کدام را به انگلیسی می‌گویی.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Here, you’re Sara. The first one is from when you were checking in at the hotel: let’s see if you still remember it. Then two things you say this morning, before you get to the market. Say each one in English, the way you’d really say it.', fa: 'این‌جا جای سارا هستی. اولی مال وقتی است که در هتل اتاقت را تحویل می‌گرفتی؛ ببینیم هنوز یادت هست یا نه. بعد دو چیزی که امروز صبح، پیش از رسیدن به بازار، می‌گویی. هر کدام را به انگلیسی بگو، همان‌طور که واقعاً می‌گفتی.' } },
			{ id: 'choose-persuade', title: { en: 'Choose and persuade', fa: 'انتخاب کن و قانع کن' }, short: { en: 'Persuade', fa: 'قانع کردن' }, does: { en: 'Choose a way to the museum for a friend, and stand by your choice.', fa: 'برای رفتن دوستت به موزه یک راه انتخاب کن و از انتخابت دفاع کن.' }, skill: 'speaking', minutes: { 20: 4 }, built: true,
				intro: { en: 'Your friend at the Park Hotel is meeting his sister at the City Museum at 2:45 this afternoon, and he’ll leave at about 2. He’s tired after his long flight, and he loves taking photos. Pick the better way for him, tell me why, and I’ll try to change your mind.', fa: 'دوستت در Park Hotel می‌ماند و امروز ساعت ۲:۴۵ بعدازظهر در City Museum با خواهرش قرار دارد؛ حدود ساعت ۲ راه می‌افتد. بعد از پرواز طولانی‌اش خسته است و عاشق عکس گرفتن است. راه بهتر را برایش انتخاب کن، بگو چرا، و من سعی می‌کنم نظرت را عوض کنم.' } },
			{ id: 'scenario', title: { en: 'Asking the way with a twist', fa: 'پرسیدن راه با یک غافلگیری' }, short: { en: 'Ask the way', fa: 'پرسیدن راه' }, does: { en: 'Ask a stranger the way to the Sunday market, and check that you’ve understood.', fa: 'راه بازار یکشنبه را از یک غریبه بپرس و مطمئن شو درست فهمیده‌ای.' }, skill: 'speaking', minutes: { 15: 5, 20: 5 }, built: true,
				intro: { en: 'You’re walking to the Sunday market in Central Park, but the street you need is closed. Ask the man at the corner the way. Something unexpected will happen, so listen carefully.', fa: 'داری پیاده به بازار یکشنبه در Central Park می‌روی، ولی خیابانی که باید از آن بروی بسته است. راه را از مردی که سر چهارراه ایستاده بپرس. یک اتفاق غیرمنتظره هم می‌افتد، پس با دقت گوش بده.' } }
		]
	}
};

/** Every chapter, Travel's first (the daily lessons only ever use Travel's). */
export const DAYS: DayPack[] = [DAY_ONE, DAY_TWO, DAY_THREE, DAY_FOUR, EVERYDAY_ONE];
/** A chapter's story. */
export const arcOf = (day: DayPack): ArcId => day.arc ?? 'travel';
export function dayById(id: string | null | undefined): DayPack | null {
	return DAYS.find(day => day.id === id) ?? null;
}
/**
 * The day to do next: the first one after the last finished day. Learners stop at a day that
 * isn't ready (the owner can try it). After the last day, the last one again.
 */
export function nextDay(lastDayId: string | null | undefined, preview = false): DayPack {
	// The days tell one story, so learners never skip a day that isn't ready: they get the days up to it.
	// The daily lessons are the Travel story's days; other stories live on the step path only.
	const travel = DAYS.filter(day => (day.arc ?? 'travel') === 'travel');
	const firstClosed = travel.findIndex(day => !day.ready);
	const open = preview || firstClosed === -1 ? travel : travel.slice(0, Math.max(1, firstClosed));
	const lastIndex = travel.findIndex(day => day.id === lastDayId);
	return open.find(day => travel.indexOf(day) > lastIndex) ?? open.at(-1) ?? DAY_ONE;
}
/**
 * The daily lessons a learner has passed, in course order. Older progress records only kept the last
 * one; the days are done in order, so every day up to it counts as passed.
 */
export function finishedDays(progress: { lastThemeId: string | null; finishedDays?: string[] }): DayPack[] {
	if (progress.finishedDays) return DAYS.filter(day => progress.finishedDays!.includes(day.id));
	const last = DAYS.findIndex(day => day.id === progress.lastThemeId);
	return last < 0 ? [] : DAYS.slice(0, last + 1);
}
/** The furthest day passed (doing an earlier day again never moves a learner back), or null. */
export const furthestDayId = (progress: { lastThemeId: string | null; finishedDays?: string[] }): string | null => finishedDays(progress).at(-1)?.id ?? null;
/**
 * Whether a learner has passed every lesson released so far: their next day would be one they've
 * already passed. The lesson page then says the next one is coming, instead of offering it again.
 */
export function caughtUp(progress: { lastThemeId: string | null; finishedDays?: string[] }): boolean {
	const furthest = furthestDayId(progress);
	return furthest !== null && nextDay(furthest).id === furthest;
}
/** A saved session's day (Day 1 if the id is unknown). */
export const dayOf = (session: { day: string }) => dayById(session.day) ?? DAY_ONE;

/** The recap's name in the session's progress bar. */
export const RECAP_SHORT: DisplayText = { en: 'Recap', fa: 'مرور' };

/** Mira's line when the recap opens. */
export const RECAP_INTRO: DisplayText = { en: 'Well done. Here’s what you did today, and what comes next.', fa: 'آفرین. این کارهایی است که امروز انجام دادی، و قدم بعدی.' };

/**
 * The modules in a day's session, in order: those in this length (a module without minutes for a
 * length isn't in it). Every lesson is 15 minutes (owner's decision), so each version leaves out one
 * middle step there: on Days 2–3 Traps in Intermediate and Say it in English in Professional; on Day 4
 * Say it in English and Choose and persuade, so the item from an earlier day is seen.
 */
export function modulesFor(length: Length, day: DayPack = DAY_ONE, track: Track = 'intermediate'): DayModule[] {
	const list = day.tracks ? day.tracks[track] : day.modules;
	return list.filter(module => module.minutes[length] !== undefined);
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
/** A lesson's length as the learner sees it: its steps and the recap (the lesson opens on the plan, with no check-in). */
export const lessonMinutes = (day: DayPack = DAY_ONE, track: Track = 'intermediate', length: Length = DEFAULT_LENGTH) =>
	modulesFor(length, day, track).reduce((sum, module) => sum + minutesOf(module, length), 0) + day.recapMinutes;

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
	// Every step skipped: the same day comes back. Some steps skipped: the learner still moves on.
	if (skipped && !session.done.length) return { title: { en: `Next time: ${skipped.title.en}`, fa: `دفعهٔ بعد: ${skipped.title.fa}` }, why: { en: 'You skipped it today, so it comes back first.', fa: 'امروز ردش کردی، پس اول از همه برمی‌گردد.' } };
	const skippedNote = skipped ? { en: ` You skipped ${skipped.title.en} today, and that’s fine.`, fa: ` امروز «${skipped.title.fa}» را رد کردی و اشکالی ندارد.` } : { en: '', fa: '' };
	if (upcoming && upcoming.id === session.day) {
		// No new day is open yet: say so, never promise a new theme.
		const day = dayOf(session);
		return { title: { en: `Next time: Day ${day.number} again`, fa: `دفعهٔ بعد: دوباره روز ${day.number.toLocaleString('fa-IR')}` }, why: { en: 'New days are on the way. Until then, practicing this one again helps it stick.', fa: 'روزهای تازه در راه است. تا آن موقع، تمرین دوبارهٔ همین روز کمک می‌کند بهتر یادت بماند.' } };
	}
	const title = upcoming
		? { en: `Next time: Day ${upcoming.number}, ${upcoming.theme.en}`, fa: `دفعهٔ بعد: روز ${upcoming.number.toLocaleString('fa-IR')}، ${upcoming.theme.fa}` }
		: { en: 'Next time: a new theme', fa: 'دفعهٔ بعد: یک موضوع تازه' };
	return { title, why: skipped
		? { en: `You did the rest of today’s steps, so you move on.${skippedNote.en}`, fa: `بقیهٔ مرحله‌های امروز را انجام دادی، پس جلو می‌روی.${skippedNote.fa}` }
		: { en: 'You finished every step today, so you move on.', fa: 'امروز همهٔ مرحله‌ها را تمام کردی، پس جلو می‌روی.' } };
}
