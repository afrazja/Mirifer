/**
 * Everyday, Chapter 1: "Meeting a neighbor" (docs/english-everyday-1/, brief v2 and drafts v2,
 * reviews applied). The first chapter of the Everyday story: Sara has moved to Riverton and meets
 * Jake, her neighbor; the learner imagines they've just moved into 3C. Five steps per version.
 * Not ready for learners; a pilot for the owner's test accounts.
 */
import type { DayPack } from '../../day';

export const EVERYDAY_ONE: DayPack = {
	id: 'everyday-1',
	// Unique across chapters; the UI numbers chapters by the learner's journey.
	number: 101,
	arc: 'everyday',
	ready: false,
	pilot: true,
	theme: { en: 'Meeting a neighbor', fa: 'آشنایی با همسایه' },
	themePhrase: 'meeting a neighbor',
	question: 'And you? Where you’re from, how do people welcome a new neighbor?',
	// v1 never over-claims: Mira says what the learner practiced (conversation.md, "The chapter ending").
	goal: {
		en: 'You’ve practiced introducing yourself to a neighbor, saying yes when you’d like help, and asking someone to say something again.',
		fa: 'تمرین کردی خودت را به همسایه معرفی کنی، وقتی کمک می‌خواهی بله بگویی، و از کسی بخواهی حرفش را دوباره بگوید.'
	},
	goals: {
		intermediate: {
			en: 'You’ve practiced introducing yourself to a neighbor, saying yes when you’d like help, and asking someone to say something again.',
			fa: 'تمرین کردی خودت را به همسایه معرفی کنی، وقتی کمک می‌خواهی بله بگویی، و از کسی بخواهی حرفش را دوباره بگوید.'
		},
		professional: {
			en: 'You’ve practiced introducing yourself to a neighbor, saying yes clearly to help and to an invitation, and stepping around a nosy question politely.',
			fa: 'تمرین کردی خودت را به همسایه معرفی کنی، به کمک و دعوت واضح بله بگویی، و مؤدبانه از یک سؤال فضولی رد شوی.'
		}
	},
	checkIn: {
		// The chapter's opening line, only here (it must work as a learner's very first chapter).
		story: {
			en: 'This is Sara. She came to Riverton on a trip, and now she lives here. She’s just moved into a new apartment, and today she meets her neighbor.',
			fa: 'این ساراست. برای سفر به ریورتون آمد و حالا همین‌جا زندگی می‌کند. تازه به یک آپارتمان جدید اسباب‌کشی کرده و امروز همسایه‌اش را می‌بیند.'
		},
		question: {
			en: 'And you? Where you’re from, how do people welcome a new neighbor?',
			fa: 'و تو؟ جایی که تو از آن‌جا می‌آیی، مردم چطور به همسایهٔ تازه خوشامد می‌گویند؟'
		},
		reply: {
			en: 'Thanks for telling me. Today you’ll practice meeting a new neighbor, step by step.',
			fa: 'ممنون که گفتی. امروز قدم‌به‌قدم آشنا شدن با یک همسایهٔ تازه را تمرین می‌کنی.'
		}
	},
	checkInMinutes: 2,
	recapMinutes: 2,
	modules: [],
	// Steps 2–5 open with the "who and where" clause (steps are often done on different days). The
	// 15-minute lesson leaves out one middle step: Say it in English (Intermediate), Voice messages (Professional).
	tracks: {
		intermediate: [
			{ id: 'listen-act', title: { en: 'Listen and connect', fa: 'گوش بده و وصل کن' }, short: { en: 'Listen', fa: 'گوش دادن' }, does: { en: 'Hear Sara meet Jake, her new neighbor, then answer a few questions.', fa: 'گوش بده سارا چطور با جیک، همسایهٔ تازه‌اش، آشنا می‌شود و بعد به چند سؤال جواب بده.' }, skill: 'listening', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Listen for what happens with Sara’s box.', fa: 'گوش بده ببین با جعبهٔ سارا چه اتفاقی می‌افتد.' } },
			{ id: 'phrases', title: { en: 'Natural phrases', fa: 'عبارت‌های طبیعی' }, short: { en: 'Phrases', fa: 'عبارت‌ها' }, does: { en: 'Hear five things you can say to a new neighbor, and say each one after Mira.', fa: 'پنج جمله بشنو که می‌توانی به یک همسایهٔ تازه بگویی، و هر کدام را بعد از میرا تکرار کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Remember Jake, your neighbor upstairs? Imagine you’ve just moved into 3C. Here are five things to say to him. Listen, then say each one after me. I only check the phrase in bold.', fa: 'جیک را یادت هست، همسایهٔ طبقهٔ بالا؟ فرض کن تازه به واحد 3C اسباب‌کشی کرده‌ای. این پنج جمله را می‌توانی به او بگویی. گوش بده و هر جمله را بعد از من تکرار کن. من فقط عبارت پررنگ را بررسی می‌کنم.' } },
			{ id: 'traps', title: { en: 'Persian-speaker traps', fa: 'اشتباه‌های آشنا' }, short: { en: 'Traps', fa: 'اشتباه‌ها' }, does: { en: 'Find the mistakes Persian speakers often make with a new neighbor, and pick the best reply.', fa: 'اشتباه‌هایی را که فارسی‌زبان‌ها با همسایهٔ تازه زیاد می‌کنند پیدا کن و بهترین جواب را انتخاب کن.' }, skill: 'speaking', minutes: { 15: 3, 20: 3 }, built: true,
				intro: { en: 'Remember Jake, your neighbor upstairs? Imagine you’ve just moved into 3C. Here are five small mistakes Persian speakers often make with a new neighbor. Spot each one, then say it the right way.', fa: 'جیک را یادت هست، همسایهٔ طبقهٔ بالا؟ فرض کن تازه به واحد 3C اسباب‌کشی کرده‌ای. این‌ها پنج اشتباه کوچک است که فارسی‌زبان‌ها با همسایهٔ تازه زیاد می‌کنند. هر کدام را پیدا کن، بعد درستش را بگو.' } },
			{ id: 'say-in-english', title: { en: 'Say it in English', fa: 'به انگلیسی بگو' }, short: { en: 'Say it', fa: 'بگو' }, does: { en: 'Read what you want to tell Jake in Persian, and say it in English.', fa: 'چیزی را که می‌خواهی به جیک بگویی به فارسی می‌خوانی و به انگلیسی می‌گویی.' }, skill: 'speaking', minutes: { 20: 3 }, built: true,
				intro: { en: 'Remember Jake, your neighbor upstairs? Imagine you’ve just moved into 3C. I’ll show you in Persian what you want to tell him. Say it in English, in your own words, with your own name.', fa: 'جیک را یادت هست، همسایهٔ طبقهٔ بالا؟ فرض کن تازه به واحد 3C اسباب‌کشی کرده‌ای. چیزی را که می‌خواهی به او بگویی به فارسی نشانت می‌دهم. همان را با کلمات خودت به انگلیسی بگو، با اسم خودت.' } },
			{ id: 'scenario', title: { en: 'Meeting Jake, with a twist', fa: 'آشنایی با جیک، با یک اتفاق غیرمنتظره' }, short: { en: 'Neighbor', fa: 'همسایه' }, does: { en: 'Meet your new neighbor on the stairs, and handle a surprise.', fa: 'با همسایهٔ تازه‌ات توی راه‌پله آشنا شو؛ وسط کار هم یک اتفاق غیرمنتظره می‌افتد.' }, skill: 'speaking', minutes: { 15: 5, 20: 5 }, built: true,
				intro: { en: 'Imagine you’ve just moved into 3C. You meet Jake on the stairs for the first time, with a heavy box in your hands. Talk to him in your own words. Something unexpected will happen, so listen carefully.', fa: 'فرض کن تازه به واحد 3C اسباب‌کشی کرده‌ای. با یک جعبهٔ سنگین توی دستت، برای اولین بار جیک را توی راه‌پله می‌بینی. با کلمات خودت با او حرف بزن. یک اتفاق غیرمنتظره هم می‌افتد، پس خوب گوش بده.' } }
		],
		professional: [
			{ id: 'listen-retell', title: { en: 'Listen and retell', fa: 'گوش بده و بازگو کن' }, short: { en: 'Retell', fa: 'بازگویی' }, does: { en: 'Hear how Sara meets her new neighbor, then tell what happened.', fa: 'گوش بده سارا چطور با همسایهٔ تازه‌اش آشنا می‌شود و بعد تعریف کن چه اتفاقی افتاد.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Listen for what happens with Sara’s box, then tell me the story.', fa: 'گوش بده ببین با جعبهٔ سارا چه اتفاقی می‌افتد، بعد ماجرا را برایم تعریف کن.' } },
			{ id: 'phrases', title: { en: 'Natural phrases', fa: 'عبارت‌های طبیعی' }, short: { en: 'Phrases', fa: 'عبارت‌ها' }, does: { en: 'Hear five natural phrases for a first chat with a neighbor, and say each one after Mira.', fa: 'پنج عبارت طبیعی برای اولین گپ با یک همسایه بشنو و هر کدام را بعد از میرا تکرار کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Remember Jake, your neighbor upstairs? Imagine you’ve just moved into 3C. Here are five natural phrases for your first chat with him. Listen, then say each one after me.', fa: 'جیک را یادت هست، همسایهٔ طبقهٔ بالا؟ فرض کن تازه به واحد 3C اسباب‌کشی کرده‌ای. این پنج عبارت طبیعی برای اولین گپ با اوست. گوش بده و هر کدام را بعد از من تکرار کن.' } },
			{ id: 'say-it-better', title: { en: 'About you', fa: 'از خودت بگو' }, short: { en: 'About you', fa: 'از خودت' }, does: { en: 'Tell a new neighbor a little about yourself, then say it again, better.', fa: 'کمی از خودت به یک همسایهٔ تازه بگو، بعد دوباره و بهتر بگو.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true, sayPrompt: 'about-you',
				intro: { en: 'Remember Jake, your neighbor upstairs? Imagine you’ve just moved into 3C. Tell Jake a little about yourself: where you’re from, what you do, and one thing you like doing. Share only what you’re happy to share.', fa: 'جیک را یادت هست، همسایهٔ طبقهٔ بالا؟ فرض کن تازه به واحد 3C اسباب‌کشی کرده‌ای. کمی از خودت به جیک بگو: اهل کجایی، چه کار می‌کنی، و یک کاری که دوست داری انجام بدهی. فقط چیزهایی را بگو که دوست داری بگویی.' } },
			{ id: 'voice-messages', title: { en: 'Voice messages', fa: 'پیام صوتی' }, short: { en: 'Messages', fa: 'پیام‌ها' }, does: { en: 'Hear a voice message from Mr. Patel, the building manager, and reply.', fa: 'یک پیام صوتی از آقای پاتل، مدیر ساختمان، بشنو و جواب بده.' }, skill: 'speaking', minutes: { 20: 3 }, built: true,
				intro: { en: 'Imagine you’ve just moved into 3C at 48 Elm Street. Mr. Patel, the building manager, sends you a voice message. Listen, then reply with a short voice message. Make sure you answer his questions.', fa: 'فرض کن تازه به واحد 3C در 48 Elm Street اسباب‌کشی کرده‌ای. آقای پاتل، مدیر ساختمان، برایت یک پیام صوتی می‌فرستد. گوش بده و با یک پیام صوتی کوتاه جواب بده. حواست باشد به سؤال‌هایش جواب بدهی.' } },
			{ id: 'scenario', title: { en: 'Meeting Jake, with a twist', fa: 'آشنایی با جیک، با یک اتفاق غیرمنتظره' }, short: { en: 'Neighbor', fa: 'همسایه' }, does: { en: 'Meet your new neighbor on the stairs, and handle a surprise.', fa: 'با همسایهٔ تازه‌ات توی راه‌پله آشنا شو؛ وسط کار هم یک اتفاق غیرمنتظره می‌افتد.' }, skill: 'speaking', minutes: { 15: 5, 20: 5 }, built: true,
				intro: { en: 'Imagine you’ve just moved into 3C. You meet Jake on the stairs for the first time, with a heavy box in your hands. Get to know him, your way. He may ask you something unexpected.', fa: 'فرض کن تازه به واحد 3C اسباب‌کشی کرده‌ای. با یک جعبهٔ سنگین توی دستت، برای اولین بار جیک را توی راه‌پله می‌بینی. به روش خودت با او آشنا شو. ممکن است سؤال غیرمنتظره‌ای بپرسد.' } }
		]
	}
};
