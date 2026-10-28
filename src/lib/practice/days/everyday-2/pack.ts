/**
 * Everyday, Chapter 2: "Making plans" (docs/english-everyday-2/README.md, v2: english-coach and
 * learning-UX reviews applied). Two weeks after Chapter 1, Jake invites Sara to trivia night with a
 * few neighbors; she can't on Wednesday, says so kindly and suggests another day; then the plan moves.
 * Step 5 is the group chat: the learner plans Nina's 30th with Maya and Leo.
 * Not ready for learners; a pilot for the owner's test accounts.
 */
import type { DayPack } from '../../day';

export const EVERYDAY_TWO: DayPack = {
	id: 'everyday-2',
	number: 102,
	arc: 'everyday',
	ready: false,
	pilot: true,
	theme: { en: 'Making plans', fa: 'برنامه‌ریزی با دیگران' },
	themePhrase: 'making plans',
	question: 'And you? When a friend invites you and you can’t go, what do you usually say?',
	// The ending is the same whatever the learner did, so it only says what every version practiced.
	goal: {
		en: 'You’ve practiced saying yes to an invitation, saying no kindly and suggesting another day, and making a plan with friends in a group chat.',
		fa: 'تمرین کردی دعوت را قبول کنی، مهربانانه نه بگویی و روز دیگری پیشنهاد بدهی، و در یک چت گروهی با دوستانت برنامه بریزی.'
	},
	goals: {
		intermediate: {
			en: 'You’ve practiced saying yes to an invitation, saying no kindly and suggesting another day, and making a plan with friends in a group chat.',
			fa: 'تمرین کردی دعوت را قبول کنی، مهربانانه نه بگویی و روز دیگری پیشنهاد بدهی، و در یک چت گروهی با دوستانت برنامه بریزی.'
		},
		professional: {
			en: 'You’ve practiced saying no clearly, suggesting another time, moving a plan when something comes up, and making a plan with friends in a group chat.',
			fa: 'تمرین کردی واضح نه بگویی، وقت دیگری پیشنهاد بدهی، وقتی کاری پیش می‌آید برنامه را جابه‌جا کنی، و در یک چت گروهی با دوستانت برنامه بریزی.'
		}
	},
	checkIn: {
		story: {
			en: 'Remember Sara? She’s been in her new apartment for two weeks now. Today, her neighbor Jake invites her to a game night with a few neighbors.',
			fa: 'سارا را یادت هست؟ حالا دو هفته است در آپارتمان تازه‌اش زندگی می‌کند. امروز همسایه‌اش جیک او را به یک شب بازی با چند تا از همسایه‌ها دعوت می‌کند.'
		},
		question: {
			en: 'And you? When a friend invites you and you can’t go, what do you usually say?',
			fa: 'و تو؟ وقتی دوستی دعوتت می‌کند و نمی‌توانی بروی، معمولاً چه می‌گویی؟'
		},
		reply: {
			en: 'Thanks for telling me. Today you’ll practice making plans: saying yes, saying no kindly, and finding another time.',
			fa: 'ممنون که گفتی. امروز برنامه‌ریزی را تمرین می‌کنی: بله گفتن، مهربانانه نه گفتن، و پیدا کردن یک وقت دیگر.'
		}
	},
	checkInMinutes: 2,
	recapMinutes: 2,
	modules: [],
	// The 15-minute lesson keeps the steps where the learner says no in their own words: it leaves
	// out Traps (Intermediate) and Say it again, better (Professional).
	tracks: {
		intermediate: [
			{ id: 'listen-act', title: { en: 'Listen and connect', fa: 'گوش بده و وصل کن' }, short: { en: 'Listen', fa: 'گوش دادن' }, does: { en: 'Hear Jake invite Sara to trivia night, and how the plan changes. Then answer a few questions.', fa: 'گوش بده جیک چطور سارا را به شب مسابقه دعوت می‌کند و برنامه چطور عوض می‌شود. بعد به چند سؤال جواب بده.' }, skill: 'listening', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Listen for the day Sara can’t go, and what she says.', fa: 'گوش بده ببین سارا کدام روز نمی‌تواند برود و چه می‌گوید.' } },
			{ id: 'phrases', title: { en: 'Natural phrases', fa: 'عبارت‌های طبیعی' }, short: { en: 'Phrases', fa: 'عبارت‌ها' }, does: { en: 'Hear five things to say when you make plans, and say each one after Mira.', fa: 'پنج جمله برای برنامه‌ریزی با دیگران بشنو و هر کدام را بعد از میرا تکرار کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Remember Jake, your neighbor upstairs? Here are five phrases for making plans with him, and with your friends. Listen, then say each one after me. I only check the phrase in bold.', fa: 'جیک را یادت هست، همسایهٔ طبقهٔ بالا؟ این پنج جمله برای برنامه‌ریزی با او و با دوستانت است. گوش بده و هر جمله را بعد از من تکرار کن. من فقط عبارت پررنگ را بررسی می‌کنم.' } },
			{ id: 'traps', title: { en: 'Persian-speaker traps', fa: 'اشتباه‌های آشنا' }, short: { en: 'Traps', fa: 'اشتباه‌ها' }, does: { en: 'Find the mistakes Persian speakers often make when they make plans, and pick the best reply.', fa: 'اشتباه‌هایی را که فارسی‌زبان‌ها موقع برنامه‌ریزی زیاد می‌کنند پیدا کن و بهترین جواب را انتخاب کن.' }, skill: 'speaking', minutes: { 20: 3 }, built: true,
				intro: { en: 'Imagine Jake, your neighbor upstairs, invites you to trivia night. Here are five small mistakes Persian speakers often make when they make plans. Spot each one, then say it the right way.', fa: 'فرض کن جیک، همسایهٔ طبقهٔ بالا، تو را به شب مسابقه دعوت می‌کند. این‌ها پنج اشتباه کوچک است که فارسی‌زبان‌ها موقع برنامه‌ریزی زیاد می‌کنند. هر کدام را پیدا کن، بعد درستش را بگو.' } },
			{ id: 'say-in-english', title: { en: 'Say it in English', fa: 'به انگلیسی بگو' }, short: { en: 'Say it', fa: 'بگو' }, does: { en: 'Read what you want to tell Jake in Persian, and say it in English.', fa: 'چیزی را که می‌خواهی به جیک بگویی به فارسی می‌خوانی و به انگلیسی می‌گویی.' }, skill: 'speaking', minutes: { 15: 3, 20: 3 }, built: true,
				intro: { en: 'Imagine Jake, your neighbor upstairs, has invited you to trivia on Wednesday. I’ll show you in Persian what you want to tell him. Say it in English, in your own words.', fa: 'فرض کن جیک، همسایهٔ طبقهٔ بالا، تو را برای چهارشنبه به شب مسابقه دعوت کرده است. چیزی را که می‌خواهی به او بگویی به فارسی نشانت می‌دهم. همان را با کلمات خودت به انگلیسی بگو.' } },
			{ id: 'group-chat', title: { en: 'Group chat', fa: 'چت گروهی' }, short: { en: 'Chat', fa: 'چت' }, does: { en: 'Plan a surprise for your friend Nina with Maya and Leo, by voice notes or messages.', fa: 'با مایا و لئو، با پیام صوتی یا نوشتاری، برای دوستتان نینا یک جشن غافلگیری برنامه‌ریزی کن.' }, skill: 'speaking', minutes: { 15: 6, 20: 6 }, built: true,
				intro: { en: 'Imagine your friends Maya and Leo are planning a surprise for your friend Nina’s 30th, this Saturday. Plan it with them in the group chat: make your own choices, offer to do one thing, and try sending voice notes!', fa: 'فرض کن دوست‌هایت مایا و لئو می‌خواهند برای تولد سی‌سالگی دوستتان نینا، همین شنبه، یک جشن غافلگیری بگیرند. در چت گروهی با آن‌ها برنامه‌اش را بچین: خودت انتخاب کن، یک کار را به عهده بگیر، و سعی کن پیام صوتی بفرستی!' } }
		],
		professional: [
			{ id: 'listen-retell', title: { en: 'Listen and retell', fa: 'گوش بده و بازگو کن' }, short: { en: 'Retell', fa: 'بازگویی' }, does: { en: 'Hear how Sara and Jake make a plan, and how it changes. Then tell what happened.', fa: 'گوش بده سارا و جیک چطور برنامه می‌ریزند و برنامه چطور عوض می‌شود. بعد تعریف کن چه اتفاقی افتاد.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Listen for what Sara and Jake plan, and how the plan changes. Then tell me the story.', fa: 'گوش بده ببین سارا و جیک چه برنامه‌ای می‌ریزند و برنامه چطور عوض می‌شود. بعد ماجرا را برایم تعریف کن.' } },
			{ id: 'phrases', title: { en: 'Natural phrases', fa: 'عبارت‌های طبیعی' }, short: { en: 'Phrases', fa: 'عبارت‌ها' }, does: { en: 'Hear five natural phrases for making and changing plans, and say each one after Mira.', fa: 'پنج عبارت طبیعی برای برنامه ریختن و عوض کردن برنامه بشنو و هر کدام را بعد از میرا تکرار کن.' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				intro: { en: 'Remember Jake, your neighbor upstairs? Here are five natural phrases for making plans with him, and with your friends, and for changing them. Listen, then say each one after me.', fa: 'جیک را یادت هست، همسایهٔ طبقهٔ بالا؟ این پنج عبارت طبیعی برای برنامه ریختن با او و با دوستانت، و برای عوض کردن برنامه است. گوش بده و هر کدام را بعد از من تکرار کن.' } },
			{ id: 'say-it-better', title: { en: 'Your weekend', fa: 'آخر هفته‌ات' }, short: { en: 'Weekend', fa: 'آخر هفته' }, does: { en: 'Tell Jake your weekend plans, say which day doesn’t work, and suggest one that does. Then say it again, better.', fa: 'برنامهٔ آخر هفته‌ات را به جیک بگو، بگو کدام روز نمی‌شود و یک روز دیگر پیشنهاد بده. بعد دوباره و بهتر بگو.' }, skill: 'speaking', minutes: { 20: 4 }, built: true, sayPrompt: 'weekend-plans',
				intro: { en: 'Jake, your neighbor upstairs, asks if you want to get pizza this weekend. Tell him your plans, say which day doesn’t work, and suggest one that does.', fa: 'جیک، همسایهٔ طبقهٔ بالا، می‌پرسد این آخر هفته پیتزا بخورید یا نه. برنامه‌هایت را به او بگو، بگو کدام روز نمی‌شود و روزی را پیشنهاد بده که می‌شود.' } },
			{ id: 'voice-messages', title: { en: 'Voice messages', fa: 'پیام صوتی' }, short: { en: 'Message', fa: 'پیام' }, does: { en: 'Hear Jake invite you to trivia, and reply: you can’t on Wednesday.', fa: 'دعوت جیک برای شب مسابقه را بشنو و جواب بده: چهارشنبه نمی‌توانی.' }, skill: 'speaking', minutes: { 15: 3, 20: 3 }, built: true,
				intro: { en: 'Jake, your neighbor upstairs, sends you a voice message. Imagine you’re busy on Wednesday. Reply with a short voice message, and answer everything he asks.', fa: 'جیک، همسایهٔ طبقهٔ بالا، برایت یک پیام صوتی می‌فرستد. فرض کن چهارشنبه کار داری. با یک پیام صوتی کوتاه جواب بده و به همهٔ سؤال‌هایش جواب بده.' } },
			{ id: 'group-chat', title: { en: 'Group chat', fa: 'چت گروهی' }, short: { en: 'Chat', fa: 'چت' }, does: { en: 'Plan a surprise for your friend Nina with Maya and Leo, and handle a change of plan.', fa: 'با مایا و لئو برای دوستتان نینا یک جشن غافلگیری برنامه‌ریزی کن و از پس تغییر برنامه بربیا.' }, skill: 'speaking', minutes: { 15: 6, 20: 6 }, built: true,
				intro: { en: 'Imagine your friends Maya and Leo are planning a surprise for your friend Nina’s 30th, this Saturday. Plan it with them in the group chat: make your own choices, offer to do one thing, and try sending voice notes! Plans can change, so watch the chat.', fa: 'فرض کن دوست‌هایت مایا و لئو می‌خواهند برای تولد سی‌سالگی دوستتان نینا، همین شنبه، یک جشن غافلگیری بگیرند. در چت گروهی با آن‌ها برنامه‌اش را بچین: خودت انتخاب کن، یک کار را به عهده بگیر، و سعی کن پیام صوتی بفرستی! برنامه‌ها ممکن است عوض شوند؛ حواست به چت باشد.' } }
		]
	}
};
