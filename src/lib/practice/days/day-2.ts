/**
 * Day 2, "Taking a taxi": the day's content, one block per module, per version.
 * Written from one world (docs/english-day-2/world.md) and reviewed; the source text is in
 * docs/english-day-2/. Content only: the modules that show it are built once.
 */
import type { Phrase } from '../phrases';
import type { ConnectSet, Line, Part, Speaker } from '../listen-connect';
import type { Trap } from '../traps';
import type { SayItem } from '../say-in-english';
import type { VoiceMessage } from '../voice-messages';
import type { RetellPiece } from '../retell';
import type { PersuadeSet } from '../persuade';
import type { DisplayText } from '../hotel';
import type { Track } from '../day';

/** Natural phrases: the five steps of the ride (get in → explain where → ask the time → pay → get out). */
export const PHRASES: Record<Track, Phrase[]> = {
	intermediate: [
		{
			sentence: 'Could you take me to the Park Hotel, please?',
			shown: '**Could you take me to** the Park Hotel, please?',
			chunk: 'could you take me to',
			situation: { en: 'You get into the taxi.', fa: 'سوار تاکسی می‌شوی.' },
			tip: { en: '`Could you` runs together: `ku-ja`.', fa: '`Could you` را پیوسته بگو: `d` و `y` به هم می‌چسبند و «ج» می‌شوند، یعنی `ku-ja`.' },
			found: said => /\b(could|can|would) you (please )?take (me|us) to\b/.test(said)
		},
		{
			sentence: "It's right across from Central Station.",
			shown: "It's **right across from** Central Station.",
			chunk: 'right across from',
			situation: { en: 'The driver doesn’t know your hotel.', fa: 'راننده هتلت را بلد نیست.' },
			tip: { en: '`across` starts with a weak “uh”: `uh-CROSS-frum`.', fa: '`across` با یک «اَ»ی خیلی کوتاه شروع می‌شود و تأکید روی `CROSS` است: `uh-CROSS-frum`.' },
			found: said => /\bacross from\b/.test(said)
		},
		{
			sentence: 'How long does it take to get there?',
			shown: '**How long does it take** to get there?',
			chunk: 'how long does it take',
			situation: { en: 'You want to know how long the ride is.', fa: 'می‌خواهی بدانی تا آن‌جا چقدر طول می‌کشد.' },
			tip: { en: '`does it` runs together: `duh-zit`.', fa: '`does it` را پیوسته بگو: `duh-zit`.' },
			found: said => /\bhow long('s| does| will| would| is) (it|the ride) (usually |normally |going to )?take\b/.test(said)
		},
		{
			sentence: 'Do you take cards, or is it cash only?',
			shown: '**Do you take cards**, or is it cash only?',
			chunk: 'do you take cards',
			situation: { en: 'Before you arrive, you check how to pay.', fa: 'قبل از رسیدن، می‌پرسی کرایه را چطور می‌توانی بدهی.' },
			tip: { en: '`Do you` is short and quick: `d’ya`.', fa: '`Do you` را کوتاه و سریع بگو: `d’ya`.' },
			found: said => /\bdo you take (credit |debit )?cards?\b/.test(said)
		},
		{
			sentence: 'You can drop me off here, thanks.',
			shown: 'You can **drop me‿off** here, thanks.',
			chunk: 'drop me off',
			situation: { en: 'You’ve arrived at the hotel.', fa: 'به هتل رسیده‌ای.' },
			tip: { en: '`drop me off`: link them, `drop-mee-YOFF`.', fa: '`drop me off` را پیوسته بگو: بین `me` و `off` یک «ی» کوتاه می‌آید و تأکید روی `OFF` است: `drop-mee-YOFF`.' },
			found: said => /\bdrop (me|us) off\b/.test(said)
		}
	],
	professional: [
		{
			sentence: 'Would you mind helping me with my suitcase?',
			shown: '**Would you mind helping** me with my suitcase?',
			chunk: 'would you mind helping',
			situation: { en: 'You get into a taxi with a heavy suitcase.', fa: 'با یک چمدانِ سنگین در فرودگاه سوار تاکسی می‌شوی.' },
			tip: { en: 'In `mind helping`, the `d` almost disappears: `mine-HEL-ping`.', fa: 'در `mind helping` صدای `d` تقریباً گفته نمی‌شود: `mine-HEL-ping`.' },
			found: said => /\b(would|do) you mind (please )?\w+ing\b/.test(said)
		},
		{
			sentence: "It's pretty new. Have you heard of it?",
			shown: "It's pretty new. **Have you heard‿of‿it**?",
			chunk: 'have you heard of it',
			situation: { en: 'The driver doesn’t seem to know your hotel.', fa: 'راننده انگار هتلت را نمی‌شناسد.' },
			tip: { en: '`heard of it` runs together like one word: `HER-duh-vit`.', fa: '`heard of it` را پیوسته و مثل یک کلمه بگو: `HER-duh-vit`.' },
			found: said => /\bheard (of|about)\b/.test(said)
		},
		{
			sentence: "With all this traffic, how long do you think it'll take?",
			shown: "With all this traffic, **how long do you think it'll take**?",
			chunk: "how long do you think it'll take",
			situation: { en: 'The highway is closed, so you go through downtown.', fa: 'بزرگراه بسته است و از مرکز شهر می‌روید.' },
			tip: { en: '`it’ll` is quick: `ID-ul`, not `it will`.', fa: '`it’ll` را سریع بگو: `ID-ul`، نه `it will`.' },
			found: said => /\bhow long do you think (?:it|the ride|this|that)(?: will| would|'s going to|'s gonna| is going to| is gonna)? takes?\b/.test(said)
		},
		{
			sentence: "I don't have much cash on me, so I'll pay by card.",
			shown: "I **don't have much cash‿on me**, so I'll pay by card.",
			chunk: "don't have much cash on me",
			situation: { en: 'The driver says to have some cash ready.', fa: 'راننده می‌گوید بهتر است کمی پول نقد آماده داشته باشی.' },
			tip: { en: '`cash on me`: link them, `CA-shon-mee`.', fa: '`cash on me` را پیوسته بگو: `sh` به `on` می‌چسبد، یعنی `CA-shon-mee`.' },
			found: said => /\b(cash|money) on me\b/.test(said)
		},
		{
			sentence: 'Thanks for the ride. Have a good one!',
			shown: 'Thanks for the ride. **Have a good one!**',
			chunk: 'have a good one',
			situation: { en: 'You’ve paid, and you’re getting out.', fa: 'کرایه را داده‌ای و داری پیاده می‌شوی.' },
			tip: { en: '`one` starts with a `w` sound, not `v`: `GOOD-wun`.', fa: '`one` با صدای `w` شروع می‌شود، نه `v`: لب‌هایت را گرد کن و بگو `GOOD-wun`.' },
			found: said => /\bhave a (good|nice|great) (one|day|night|evening|trip)\b/.test(said)
		}
	]
};

/**
 * Listen and connect: the taxi ride (docs/english-day-2/listening.md). One conversation and three
 * parts for both versions; each version has its own questions and Mira's closing line.
 */
const RIDE_SPEAKERS: Record<string, Speaker> = {
	driver: { name: 'Driver', voice: 'a' }, // Andrew: Mike in the world; never Day 1's agent (Brian) or Mira (Ava)
	sara: { name: 'Sara', voice: 'd' } // Emma, as on Day 1
};
const RIDE: Line[] = [
	{ who: 'driver', text: 'Hi there. Where to?' },
	{ who: 'sara', text: "Hi. Could you take me to the Park Hotel, please? It's on Main Street." },
	{ who: 'driver', text: "Main Street's pretty long. Is the hotel near anything?" },
	{ who: 'sara', text: "It's right across from Central Station." },
	{ who: 'driver', text: 'Oh, OK, I know where that is.' },
	{ who: 'driver', text: "I was going to take the highway, but it's closed because of an accident. So we'll go through downtown." },
	{ who: 'sara', text: 'OK. How long does it take to get there?' },
	{ who: 'driver', text: 'About forty minutes, unless the traffic near the station is bad.' },
	{ who: 'sara', text: 'Do you take cards, or is it cash only?' },
	{ who: 'driver', text: 'Cards are fine. But my card machine is a little slow today, so maybe have some cash ready, just in case.' },
	{ who: 'driver', text: 'Here we are, the Park Hotel.' },
	{ who: 'sara', text: 'Thanks. Could you drop me off at the entrance? My suitcase is really heavy.' },
	{ who: 'driver', text: "Sure, no problem. That's fifty-five dollars." }
];
const RIDE_PARTS: Part[] = [
	{ from: 0, to: 4, title: { en: 'Where to', fa: 'مقصد' } },
	{ from: 5, to: 7, title: { en: 'The way', fa: 'مسیر' } },
	{ from: 8, to: 12, title: { en: 'Paying and arriving', fa: 'کرایه و رسیدن' } }
];
const RIDE_LINKS = ['because of', 'unless', 'just in case'];

export const CONNECT: Record<Track, ConnectSet> = {
	intermediate: {
		speakers: RIDE_SPEAKERS, conversation: RIDE, parts: RIDE_PARTS, linkPhrases: RIDE_LINKS,
		connect: {
			causes: ["The driver doesn't know the Park Hotel.", 'The highway is closed.', 'The card machine is slow.'],
			results: ['The driver stops at the entrance.', 'They go through downtown.', "Sara says it's across from Central Station.", 'Sara should have some cash ready.'],
			answers: [2, 1, 3],
			evidence: [3, 5, 9]
		},
		choices: [
			{ kind: { en: 'Because of', fa: 'دلیل' }, question: 'Why is the highway closed?', options: ['Because of the traffic.', 'Because of an accident.', 'Because of bad weather.'], answer: 1, evidence: 5 },
			{ kind: { en: 'How long', fa: 'چقدر طول می‌کشد' }, question: 'How long does the ride take?', options: ['About fourteen minutes.', 'About fifty-five minutes.', 'About forty minutes.'], answer: 2, evidence: 7 },
			{ kind: { en: 'Why', fa: 'چرا' }, question: 'Why does Sara ask the driver to stop at the entrance?', options: ['Her suitcase is very heavy.', 'The hotel is hard to find.', 'She wants to pay in cash.'], answer: 0, evidence: 11 }
		],
		questions: [
			{ part: 0, kind: 'connect', index: 0 },
			{ part: 1, kind: 'choice', index: 0 }, { part: 1, kind: 'connect', index: 1 }, { part: 1, kind: 'choice', index: 1 },
			{ part: 2, kind: 'connect', index: 2 }, { part: 2, kind: 'choice', index: 2 }
		],
		miraLine: {
			en: 'The driver used three small phrases: `because of` (why), `unless` (except if), `just in case` (to be ready). Tap a line and listen for them again.',
			fa: 'راننده سه عبارت کوتاه به کار برد: `because of` (به خاطرِ)، `unless` (مگر اینکه)، `just in case` (محض احتیاط). روی یک خط بزن و دوباره به این‌ها گوش بده.'
		}
	},
	professional: {
		speakers: RIDE_SPEAKERS, conversation: RIDE, parts: RIDE_PARTS, linkPhrases: RIDE_LINKS,
		connect: {
			causes: ["The driver doesn't know where the Park Hotel is.", 'There was an accident on the highway.', "Sara's suitcase is really heavy."],
			results: ['They go through downtown.', 'The ride costs fifty-five dollars.', 'The driver stops at the entrance.', "Sara tells him it's across from Central Station."],
			answers: [3, 0, 2],
			evidence: [3, 5, 11]
		},
		choices: [
			{ kind: { en: 'Plan and reality', fa: 'برنامه و واقعیت' }, question: 'What was the driver going to do?', options: ['Go through downtown.', 'Take the highway.', 'Wait until the highway opens.'], answer: 1, evidence: 5 },
			{ kind: { en: 'Condition', fa: 'شرط' }, question: 'When will the ride take more than forty minutes?', options: ['If the traffic near the station is bad.', 'If the card machine is slow.', 'If the highway is open.'], answer: 0, evidence: 7 },
			{ kind: { en: 'Just in case', fa: 'محض احتیاط' }, question: 'Can Sara pay by card?', options: ["No, it's cash only.", 'Yes, but she should have cash ready.', 'No, his card machine is broken.'], answer: 1, evidence: 9 }
		],
		questions: [
			{ part: 0, kind: 'connect', index: 0 },
			{ part: 1, kind: 'choice', index: 0 }, { part: 1, kind: 'connect', index: 1 }, { part: 1, kind: 'choice', index: 1 },
			{ part: 2, kind: 'choice', index: 2 }, { part: 2, kind: 'connect', index: 2 }
		],
		miraLine: {
			en: 'The driver used three small phrases: `because of` (the reason), `unless` (except if), `just in case` (to be ready if something goes wrong). They go by fast, so listen out for them.',
			fa: 'حرف‌های راننده به سه عبارت کوتاه بند بود: `because of` (به خاطرِ)، `unless` (مگر اینکه)، `just in case` (محض احتیاط). این‌ها تند گفته می‌شوند، پس حواست به آن‌ها باشد.'
		}
	}
};

/**
 * Persian-speaker traps: eight mistakes from this trip (docs/english-day-2/phrases-and-messages.md).
 * The Intermediate lesson uses five; all eight are in the Module lab.
 */
export const TRAPS: Trap[] = [
	{
		id: 'been-waiting', kind: { en: 'I’ve been waiting', fa: 'I’ve been waiting' },
		words: ["I'm", 'waiting', 'here', 'for', 'twenty', 'minutes.', "Where's", 'the', 'bus?'], wrong: 0,
		right: "I've been waiting here for twenty minutes. Where's the bus?",
		why: { en: 'For something that started earlier and is still going on, say “I’ve been waiting”, not “I’m waiting”.', fa: 'در فارسی می‌گوییم «بیست دقیقه است که منتظرم». در انگلیسی برای کاری که قبلاً شروع شده و هنوز ادامه دارد، «I’ve been waiting» می‌گوییم، نه «I’m waiting».' },
		accept: [/\b(?:i've|i have|ive) been waiting\b/], reject: [/\b(?:i'm|i am|im) waiting\b/],
		alsoGood: { patterns: [/\b(?:i've|i have|ive) waited\b/, /\b(?:i've|i have|ive) been here\b/], word: 'been waiting' }
	},
	{
		id: 'to-not-until', kind: { en: 'to (a place)', fa: 'to (مقصد)' },
		words: ['How', 'much', 'is', 'it', 'until', 'the', 'Park', 'Hotel?'], wrong: 4,
		right: 'How much is it to the Park Hotel?',
		why: { en: '“Until” is for time (until three). For the place you’re going to, use “to”.', fa: '«تا» در فارسی هم برای زمان است هم برای مکان. در انگلیسی «until» فقط برای زمان است (until three). برای مقصد «to» می‌گوییم: «to the Park Hotel».' },
		accept: [/\bto (?:the )?park hotel\b/], reject: [/\b(?:until|till|til) (?:the )?park hotel\b/]
	},
	{
		id: 'near-of', kind: { en: 'near (no “of”)', fa: 'near (بدون of)' },
		words: ['Is', 'the', 'hotel', 'near', 'of', 'Central', 'Station?'], wrong: 4,
		right: 'Is the hotel near Central Station?',
		why: { en: '“Near” doesn’t need “of”. Say “near the station”.', fa: 'در فارسی می‌گوییم «نزدیکِ ایستگاه» و همین کسره باعث می‌شود «of» اضافه کنیم. ولی «near» خودش کافی است: «near the station».' },
		accept: [/\bnear (?:the )?central station\b/], reject: [/\bnear of\b/],
		alsoGood: { patterns: [/\b(?:close to|next to|across from) (?:the )?central station\b/], word: 'near' }
	},
	{
		id: 'how-long', kind: { en: 'how long (time)', fa: 'how long (زمان)' },
		words: ['How', 'much', 'does', 'it', 'take', 'to', 'get', 'there?'], wrong: 1,
		right: 'How long does it take to get there?',
		why: { en: '“How much” asks about money or amounts. For time, ask “How long”.', fa: 'در فارسی می‌گوییم «چقدر طول می‌کشد»، ولی «how much» در انگلیسی برای پول و مقدار است. برای زمان «how long» می‌گوییم.' },
		accept: [/\bhow long(?:'s| does| will| would| is| do you think)\b/], reject: [/\bhow much (?:does|will|would|is) it (?:going to )?take\b/],
		alsoGood: { patterns: [/\bhow much time\b/], word: 'long' }
	},
	{
		id: 'bad-traffic', kind: { en: 'bad traffic', fa: 'bad traffic' },
		words: ['The', 'traffic', 'is', 'very', 'much', 'today.'], wrong: 4,
		right: 'The traffic is very bad today.',
		why: { en: 'In English, traffic is “bad” or “heavy”, not “much”.', fa: 'در فارسی می‌گوییم «ترافیک خیلی زیاد است»، ولی در انگلیسی ترافیک «bad» یا «heavy» است، نه «much». مثل «ترافیک سنگین» در فارسی، «heavy traffic» هم درست است.' },
		accept: [/\btraffic(?: is|'s) (?:really |very |so |pretty )?(?:bad|heavy|terrible|awful)\b/], reject: [/\btraffic(?: is|'s) (?:very |so |too )?much\b/],
		alsoGood: { patterns: [/\b(?:a lot of|lots of|so much|too much) traffic\b/], word: 'bad' }
	},
	{
		id: 'on-the-bus', kind: { en: 'on the bus', fa: 'on the bus' },
		words: ["I'm", 'in', 'the', 'bus', 'now.'], wrong: 1,
		right: "I'm on the bus now.",
		why: { en: 'You’re “on” a bus or a train, but “in” a taxi or a car.', fa: 'در فارسی می‌گوییم «تو اتوبوسم». در انگلیسی برای اتوبوس و قطار «on» می‌گوییم (on the bus) و برای تاکسی و ماشین «in» (in a taxi).' },
		accept: [/\bon (?:the |a )?(?:bus|train)\b/], reject: [/\bin (?:the |a )?(?:bus|train)\b/]
	},
	{
		id: 'get-out', kind: { en: 'get out (of a car)', fa: 'get out (از ماشین)' },
		words: ["I'll", 'get', 'down', 'here,', 'thanks.'], wrong: 2,
		right: "I'll get out here, thanks.",
		why: { en: 'You “get out of” a car or a taxi, and “get off” a bus or a train. “Get down” means to go lower, like off a chair.', fa: 'در فارسی از ماشین و اتوبوس هر دو «پیاده می‌شویم». در انگلیسی از ماشین و تاکسی «get out» می‌گوییم و از اتوبوس و قطار «get off». «get down» یعنی پایین آمدن، مثلاً از صندلی.' },
		accept: [/\bget out\b/], reject: [/\bget (?:down|off)\b/],
		alsoGood: { patterns: [/\bdrop (?:me|us) off\b/, /\bhere(?:'s| is) fine\b/], word: 'out' }
	},
	{
		id: 'help-with', kind: { en: 'help with', fa: 'help with' },
		words: ['Can', 'you', 'help', 'me', 'for', 'my', 'suitcase?'], wrong: 4,
		right: 'Can you help me with my suitcase?',
		why: { en: 'You help someone “with” something, not “for” it.', fa: 'در فارسی می‌گوییم «برای بردن چمدانم کمکم می‌کنید؟» و «برای» را «for» ترجمه می‌کنیم. ولی در انگلیسی بعد از «help me» کلمهٔ «with» می‌آید، نه «for».' },
		accept: [/\bhelp me with\b/], reject: [/\bhelp me for\b/],
		alsoGood: { patterns: [/\bhelp me (?:carry|take|lift|get)\b/, /\bgive me a hand\b/], word: 'with' }
	}
];
/** The five in the Intermediate lesson: not #1 (B1 grammar), #4 (Natural phrases says it) or #7 ("drop me off" is a phrase). */
export const LESSON_TRAP_IDS = ['to-not-until', 'near-of', 'bad-traffic', 'on-the-bus', 'help-with'];

/**
 * Say it in English (docs/english-day-2/phrases-and-messages.md). Intermediate: four short messages
 * to the taxi driver. Professional: four longer B1 messages to people in Sara's day; the lesson uses
 * three (the RideNow one overlaps a voice message and stays in the Module lab).
 */
const TO_DRIVER = { en: 'To the taxi driver', fa: 'به رانندهٔ تاکسی' };
const RIDE_NAMES = 'Park Hotel, Main Street, Central Station, City Museum, Central Park.';
export const SAY: Record<Track, SayItem[]> = {
	intermediate: [
		{
			id: 'd2-trunk', to: TO_DRIVER, names: RIDE_NAMES,
			fa: 'می‌شه چمدونم رو بذارید صندوق عقب؟ یه کم سنگینه.',
			points: [{ en: 'you’d like help putting your suitcase in the trunk', fa: 'می‌خواهی چمدانت را در صندوق عقب بگذارد' }, { en: 'it’s a little heavy', fa: 'چمدانت کمی سنگین است' }],
			models: ["Could you put my suitcase in the trunk, please? It's a little heavy.", "Can you help me with my suitcase? It's kind of heavy."],
			hints: [{ en: 'trunk', fa: 'صندوق عقب' }, { en: 'heavy', fa: 'سنگینه' }]
		},
		{
			id: 'd2-museum', to: TO_DRIVER, names: RIDE_NAMES,
			fa: 'می‌خوام برم موزهٔ شهر. روبه‌روی پارک مرکزیه.',
			points: [{ en: 'you want to go to the City Museum', fa: 'می‌خواهی به موزهٔ شهر بروی' }, { en: 'it’s across from Central Park', fa: 'موزه روبه‌روی پارک مرکزی است' }],
			models: ["Could you take me to the City Museum? It's right across from Central Park.", "The City Museum, please. It's across from Central Park."],
			hints: [{ en: 'take me to', fa: 'من رو ببرید…' }, { en: 'across from', fa: 'روبه‌روی' }]
		},
		{
			id: 'd2-atm', to: TO_DRIVER, names: RIDE_NAMES,
			fa: 'می‌شه سر راه جلوی یه خودپرداز نگه دارید؟ می‌خوام محض احتیاط یه کم پول نقد بگیرم.',
			points: [{ en: 'you’d like to stop at an ATM on the way', fa: 'می‌خواهی سرِ راه جلوی یک خودپرداز نگه دارد' }, { en: 'you want some cash, just in case', fa: 'می‌خواهی محض احتیاط کمی پول نقد بگیری' }],
			models: ["Could we stop at an ATM on the way? I'd like some cash, just in case.", 'Can you stop at an ATM on the way, please? I want to get some cash, just in case.'],
			hints: [{ en: 'on the way', fa: 'سرِ راه' }, { en: 'just in case', fa: 'محض احتیاط' }]
		},
		{
			id: 'd2-receipt', to: TO_DRIVER, names: RIDE_NAMES,
			fa: 'همین‌جا پیاده می‌شم، ممنون. می‌شه یه رسید هم بدید؟',
			points: [{ en: 'you’d like to get out here', fa: 'می‌خواهی همین‌جا پیاده شوی' }, { en: 'you’re asking for a receipt', fa: 'رسید می‌خواهی' }],
			models: ['You can drop me off here, thanks. Could I get a receipt?', "Here's fine, thanks. Can I have a receipt, please?"],
			hints: [{ en: 'drop me off', fa: 'پیاده می‌شم' }, { en: 'a receipt', fa: 'رسید' }]
		}
	],
	professional: [
		{
			id: 'd2-pay-tip', to: TO_DRIVER, level: 'B1', names: 'Park Hotel, Central Station, Tom, Riverton, RideNow.',
			fa: 'با کارت حساب می‌کنم، آخه پول نقد زیادی همراهم نیست. ده دلار هم انعام بذارید روش، بشه شصت‌وپنج دلار.',
			points: [{ en: 'you’ll pay by card, because you don’t have much cash on you', fa: 'با کارت حساب می‌کنی، چون پول نقد زیادی همراهت نیست' }, { en: 'you want to add a ten-dollar tip, so it comes to sixty-five dollars', fa: 'می‌خواهی ده دلار انعام اضافه کنی، که روی هم شصت‌وپنج دلار شود' }],
			models: ["I'll pay by card, if that's OK. I don't have much cash on me. Could you make it sixty-five, with the tip?", "Can I pay by card? I don't have much cash on me. Could you add a ten-dollar tip? That makes it sixty-five."],
			hints: [{ en: 'cash on me', fa: 'پول نقد همراهم' }, { en: 'make it sixty-five', fa: 'بشه شصت‌وپنج' }]
		},
		{
			id: 'd2-hotel-bags', to: { en: 'To the hotel front desk', fa: 'به پذیرش هتل' }, level: 'B1', names: 'Park Hotel, Central Station, Tom, Riverton, RideNow.',
			fa: 'اتاقم تا ساعت سه آماده نمی‌شه، درسته؟ پس چمدونم رو این‌جا می‌ذارم و بعداً برمی‌گردم. راستی، فردا صبح شرکت هواپیمایی کوله‌پشتیم رو میاره این‌جا؛ اگه نبودم، می‌شه تحویلش بگیرید؟',
			points: [{ en: 'you want to leave your suitcase here until your room is ready', fa: 'می‌خواهی تا آماده شدن اتاق، چمدانت را همین‌جا بگذاری' }, { en: 'the airline is bringing your backpack tomorrow morning, and you’d like them to take it if you’re out', fa: 'شرکت هواپیمایی فردا صبح کوله‌پشتی‌ات را می‌آورد و می‌خواهی اگر نبودی، آن را تحویل بگیرند' }],
			models: ["Can I leave my suitcase here until three? Also, the airline's bringing my backpack tomorrow morning. Could you keep it for me if I'm out?", "I'll leave my suitcase with you, then. The airline's dropping off my backpack tomorrow morning. Could you take it if I'm out?"],
			hints: [{ en: 'leave my suitcase with you', fa: 'چمدونم رو این‌جا می‌ذارم' }, { en: 'if I’m out', fa: 'اگه نبودم' }]
		},
		{
			id: 'd2-tom-dinner', to: { en: 'To Tom, your friend in Riverton', fa: 'به تام، دوستت در ریورتون' }, level: 'B1', names: 'Park Hotel, Central Station, Tom, Riverton, RideNow.',
			fa: 'ساعت هفت عالیه! ماشینت که هنوز خرابه، پس نگران من نباش؛ خودم یه جوری میام رستوران. آدرس رو برام می‌فرستی؟',
			points: [{ en: 'he doesn’t need to worry: you’ll get to the restaurant on your own', fa: 'لازم نیست نگران باشد؛ خودت به رستوران می‌روی' }, { en: 'you’re asking him to send you the address', fa: 'از او می‌خواهی آدرس را برایت بفرستد' }],
			models: ["Seven's perfect! Your car's still broken, right? So don't worry about me. I'll get there on my own. Can you send me the address?", "Seven works for me. Since your car's still in the shop, I'll find my own way there. Could you text me the address?"],
			hints: [{ en: 'on my own', fa: 'خودم' }, { en: 'text me the address', fa: 'آدرس رو برام بفرست' }]
		},
		{
			id: 'd2-ridenow-pickup', to: { en: 'To your RideNow driver', fa: 'به رانندهٔ تاکسی اینترنتی' }, level: 'B1', names: 'Park Hotel, Central Station, Tom, Riverton, RideNow.',
			fa: 'سلام، من جلوی در اصلی هتل منتظرم. اگه این‌جا نمی‌تونید نگه دارید، اشکالی نداره؛ می‌تونم بیام اون طرف خیابون، جلوی ایستگاه.',
			points: [{ en: 'you’re waiting at the hotel’s main entrance', fa: 'جلوی در اصلی هتل منتظر هستی' }, { en: 'if he can’t stop there, you can cross the street to the station', fa: 'اگر نتواند آن‌جا نگه دارد، می‌توانی به آن طرف خیابان، جلوی ایستگاه بروی' }],
			models: ["Hi, I'm waiting at the main entrance of the hotel. If you can't stop here, no problem. I can cross the street to the station.", "Hi, I'm by the hotel's front door. If it's hard to pull over here, I can meet you across the street, at the station."],
			hints: [{ en: 'the main entrance', fa: 'در اصلی' }, { en: 'pull over', fa: 'نگه دارید' }]
		}
	]
};
/** The Professional lesson's three; the fourth is lab practice. */
export const LESSON_SAY_IDS: Record<Track, string[] | null> = { intermediate: null, professional: ['d2-pay-tip', 'd2-hotel-bags', 'd2-tom-dinner'] };

/**
 * Voice messages: four people in Sara's day, in timeline order (docs/english-day-2/phrases-and-messages.md).
 * The learner replies as Sara. The Intermediate lesson uses two (Tom, the hotel); all four are in the lab.
 */
const MESSAGE_NAMES = 'Tom, Airport Express, Central Station, Riverton, Park Hotel, Main Street, Daniel, Carlos, RideNow.';
export const MESSAGES: VoiceMessage[] = [
	{
		id: 'd2-tom', names: MESSAGE_NAMES,
		from: { name: 'Tom', who: { en: 'your friend in Riverton', fa: 'دوستت در ریورتون' }, voice: 'c' },
		sentences: [
			"Hey, it's Tom. Bad news, I'm afraid.",
			"My car broke down this morning, so I can't pick you up at the airport.",
			'The easiest way is the Airport Express. Just follow the green signs, and it takes you to Central Station.',
			"Your hotel's right across from the station.",
			"Or take a taxi, if you're too tired. Let me know what you decide!",
			"And let's have dinner at seven tonight. Does that work for you?"
		],
		asks: [
			{ ask: { en: 'Will you take the train or a taxi?', fa: 'با قطار می‌روی یا با تاکسی؟' }, missed: { en: "You didn't say if you'll take the train or a taxi.", fa: 'نگفتی با قطار می‌روی یا با تاکسی.' } },
			{ ask: { en: 'Is dinner at seven OK?', fa: 'شام ساعت هفت برایت خوب است؟' }, missed: { en: "You didn't say if dinner at seven is OK.", fa: 'نگفتی شام ساعت هفت برایت خوب است یا نه.' } }
		],
		model: "Hi Tom, sorry about your car! My suitcase is really heavy and I'm tired, so I'll take a taxi. Dinner at seven sounds great. See you then!"
	},
	{
		id: 'd2-baggage', names: MESSAGE_NAMES,
		from: { name: 'Baggage desk', who: { en: 'the airline', fa: 'شرکت هواپیمایی' }, voice: 'a' },
		sentences: [
			"Hello, this is the airline's baggage desk at Riverton Airport. I'm calling about your small green backpack.",
			"It's coming on the evening flight, so we can bring it to your hotel tomorrow morning.",
			'We have the Park Hotel on Main Street. Is that right?',
			'Our driver will come between eight and ten a.m.',
			'Will you be there then, or should we leave it at the front desk?',
			'Thank you, and sorry again.'
		],
		asks: [
			{ ask: { en: 'Is the Park Hotel the right hotel?', fa: 'هتلت همان هتل پارک است؟' }, missed: { en: "You didn't say if the Park Hotel is right.", fa: 'نگفتی هتلت همان هتل پارک است یا نه.' } },
			{ ask: { en: 'Will you be there between eight and ten, or should they leave it at the front desk?', fa: 'ساعت هشت تا ده آن‌جا هستی، یا کوله‌پشتی را به پذیرش هتل بدهند؟' }, missed: { en: "You didn't say if you'll be there or if they should leave it at the front desk.", fa: 'نگفتی آن‌جا هستی یا کوله‌پشتی را به پذیرش بدهند.' } }
		],
		model: "Hi, thanks for your message. Yes, it's the Park Hotel on Main Street. I'm not sure I'll be there, so please leave it at the front desk."
	},
	{
		id: 'd2-hotel', names: MESSAGE_NAMES,
		from: { name: 'Park Hotel', who: { en: 'your hotel', fa: 'هتلت' }, voice: 'c' },
		sentences: [
			'Hi, this is Daniel at the front desk of the Park Hotel.',
			"Just so you know, check-in is at three, so your room won't be ready before then.",
			'But you can leave your bags with us and come back later.',
			"What time do you think you'll get here?",
			'And will you need any help with your bags when you arrive?',
			'See you soon!'
		],
		asks: [
			{ ask: { en: 'When will you get to the hotel?', fa: 'کی به هتل می‌رسی؟' }, missed: { en: "You didn't say when you'll get there.", fa: 'نگفتی کی به هتل می‌رسی.' } },
			{ ask: { en: 'Do you need help with your bags?', fa: 'برای بردن وسایلت کمک لازم داری؟' }, missed: { en: "You didn't say if you need help with your bags.", fa: 'نگفتی برای بردن وسایلت کمک لازم داری یا نه.' } }
		],
		model: "Hi Daniel, thanks! I'm in a taxi now, so I'll be there around two. And yes, please, my suitcase is really heavy."
	},
	{
		id: 'd2-ridenow', names: MESSAGE_NAMES,
		from: { name: 'Carlos', who: { en: 'your RideNow driver', fa: 'رانندهٔ تاکسی اینترنتی‌ات' }, voice: 'c' },
		sentences: [
			'Hi, this is Carlos, your RideNow driver.',
			"I'm on Main Street, but the traffic by the station is really bad, so I can't stop at your hotel door.",
			"Right now I'm across the street, in front of Central Station. I'm in a white car.",
			'Can you cross the street and meet me here?',
			"Or I can drive around to the hotel door, but that'll take about ten minutes.",
			'Just let me know. Thanks!'
		],
		asks: [
			{ ask: { en: 'Will you cross the street, or should he come to the hotel door?', fa: 'از خیابان رد می‌شوی و پیشش می‌روی، یا او دور بزند و جلوی در هتل بیاید؟' }, missed: { en: "You didn't say if you'll cross the street or if he should come to the hotel door.", fa: 'نگفتی از خیابان رد می‌شوی یا او بیاید جلوی در هتل.' } }
		],
		model: "Hi Carlos, no problem. I'll cross the street and meet you in front of the station. I'll be there in two minutes."
	}
];
export const LESSON_MESSAGE_IDS = ['d2-tom', 'd2-hotel'];
/** The Module lab's introduction (the lesson has Mira's own). */
export const MESSAGES_INTRO: DisplayText = {
	en: 'Today, you’re Sara. You’ll get four voice messages: from your friend Tom, the airline, the Park Hotel and your RideNow driver. Listen, then reply with a voice message. Make sure you answer their questions.',
	fa: 'امروز جای سارا هستی. چهار پیام صوتی می‌گیری: از دوستت تام، شرکت هواپیمایی، هتل پارک و رانندهٔ تاکسی اینترنتی‌ات. گوش بده و با یک پیام صوتی جواب بده. حواست باشد به سؤال‌هایشان جواب بدهی.'
};

/**
 * Listen and retell (Professional): the story Mike, the taxi driver, likes to tell (docs/english-day-2/listening.md §3).
 * B1, 185 words. No picture yet. Andrew narrates, Mike's voice letter.
 */
export const RETELL: RetellPiece = {
	id: 'wedding-cake',
	title: { en: 'The cake on the back seat', fa: 'کیکِ روی صندلی عقب' },
	level: 'B1',
	voice: 'a',
	text: 'Mike has driven a taxi in Riverton for twenty years, and his favorite story is about his strangest passenger. One Saturday, he picked up a man at the airport. The man was carrying a big white box. He was the bride’s uncle, and inside the box was the wedding cake. He wanted to stop at his hotel first to change, and then go to the wedding at a restaurant on the other side of the city. At the hotel, he was in such a hurry that he grabbed his suitcase and ran inside. Twenty minutes later, Mike looked in the mirror and saw the white box. The cake was still on the back seat! He didn’t have the man’s phone number, but he remembered the name of the restaurant. So he turned around and drove all the way back across the city. He got there just in time, a few minutes before dinner, while the uncle was looking everywhere for the cake. The family was so happy that they invited Mike to stay for dinner. He says it was the best tip he’s ever gotten.',
	keyPoints: [
		'Mike, a taxi driver for twenty years, once picked up a man at the airport with a big box.',
		'The man was the bride’s uncle, and the box had the wedding cake in it.',
		'He stopped at his hotel first, and in his hurry he left the cake on the back seat.',
		'Mike saw the cake later; he didn’t have the man’s number, but he remembered the restaurant.',
		'Mike drove back across the city and got there just in time, before dinner.',
		'The family invited Mike to stay for dinner, and he calls it his best tip ever.'
	]
};

/**
 * Choose and persuade (Professional): the train or a taxi for a friend (docs/english-day-2/conversation.md §4).
 * Today the train is cheaper and faster; the taxi's case is the big suitcase, door to door. No photos yet.
 */
export const PERSUADE: PersuadeSet = {
	id: 'd2-ride',
	intro: {
		en: 'Your friend is coming to Riverton for the first time. She has a big suitcase and a laptop bag, she’s paying for the trip herself, and she has a meeting at the Park Hotel an hour after she lands. Pick the better way for her, tell me why, and I’ll try to change your mind.',
		fa: 'دوستت برای اولین بار به Riverton می‌آید. یک چمدان بزرگ و یک کیف لپ‌تاپ دارد، هزینهٔ سفر را خودش می‌دهد و یک ساعت بعد از فرود، در Park Hotel جلسه دارد. راه بهتر را برایش انتخاب کن، بگو چرا، و من سعی می‌کنم نظرت را عوض کنم.'
	},
	rows: [{ en: 'Price', fa: 'قیمت' }, { en: 'Time today', fa: 'مدت راه (امروز)' }, { en: 'Waiting', fa: 'انتظار' }, { en: 'To the hotel', fa: 'تا هتل' }, { en: 'Minus', fa: 'عیب' }],
	options: {
		a: { id: 'a', label: 'A · Train', title: 'Airport Express train', alt: 'A modern airport train at an underground platform, with green signs on the wall.',
			facts: ['$9', '25 minutes, then a 2-minute walk', 'A train every 15 minutes, under the terminal', 'Across the street; elevators at both stations', 'She carries her own bags'] },
		b: { id: 'b', label: 'B · Taxi', title: 'Taxi', alt: 'A taxi waiting at the taxi stand outside the airport doors.',
			facts: ['About $55, plus a tip', 'About 40 minutes (highway closed)', 'Always waiting, outside door 3', 'Door to door', 'Card machines can be slow'] }
	},
	factIds: ['price', 'tip', 'time', 'highway', 'often', 'signs', 'walk', 'elevators', 'bags', 'waiting', 'door', 'card', 'personal'],
	objections: {
		a: [
			{ point: 'wait', line: 'If she just misses a train, she has to wait 15 minutes. What if she’s late for her meeting?', again: 'You said she might have to wait, but 15 minutes, with a meeting to get to? What if she’s late?', keys: ['wait', 'waiting', 'every', '15', 'often', 'miss', 'late'] },
			{ point: 'bags', line: 'She’ll carry a big suitcase and a laptop bag through two stations and across the street. Won’t that be hard?', again: 'You talked about her bags, but a big suitcase and a laptop bag, on her own? Won’t that be hard?', keys: ['bag', 'bags', 'suitcase', 'carry', 'heavy', 'elevator', 'elevators', 'walk', 'street', 'cross', 'across'] },
			{ point: 'find', line: 'The train’s under the terminal, and it’s her first time here. What if she can’t find it?', again: 'You mentioned finding it, but it’s her first time here. What if she gets lost?', keys: ['find', 'signs', 'green', 'under', 'terminal', 'lost'] }
		],
		b: [
			{ point: 'price', line: 'It’s about $55, plus a tip, and the train’s only $9. Is it really worth it?', again: 'You mentioned the price, but $55 plus a tip, when she’s paying herself? Is it really worth it?', keys: ['price', 'expensive', 'cheap', 'cheaper', 'money', 'cost', 'costs', 'pay', 'paying', 'tip', 'dollars', '55', '9'] },
			{ point: 'time', line: 'The highway’s closed, so it’s about 40 minutes, and the train’s only 25. What if the traffic near the station is bad and she’s late?', again: 'You said it’s slower today, but 40 minutes, with a meeting to get to? Won’t she be late?', keys: ['highway', 'closed', 'accident', '40', 'slow', 'slower', 'fast', 'faster', 'traffic'] },
			{ point: 'card', line: 'Taxi card machines can be slow. What if she’s still trying to pay when her meeting starts?', again: 'You talked about paying, but what if the machine is slow and her meeting’s starting?', keys: ['card', 'cards', 'cash', 'machine'] }
		]
	},
	reasonPhrases: [
		{ en: 'The main reason is that…', fa: 'دلیل اصلی این است که…' },
		{ en: 'Another thing is…', fa: 'یک چیز دیگر این است که…' },
		{ en: 'Even though it costs more, …', fa: 'با اینکه گران‌تر است، … (بدون but)' },
		{ en: 'For her, getting there on time matters more than comfort.', fa: 'برای او به‌موقع رسیدن از راحتی مهم‌تر است.' }
	],
	answerPhrases: [
		{ en: 'That’s true, but…', fa: 'درست است، ولی…' },
		{ en: 'You have a point, but…', fa: 'حق با توست، ولی…' },
		{ en: 'It’s not a big problem for her, because…', fa: 'برای او مشکل بزرگی نیست، چون…' },
		{ en: 'She can always…', fa: 'همیشه می‌تواند… (یک راه‌حل)' }
	],
	numbers: { nine: '9', fifteen: '15', 'twenty five': '25', 'twenty-five': '25', forty: '40', 'fifty five': '55', 'fifty-five': '55' },
	extraNumbers: ['46'],
	groupLabel: { en: 'The two ways', fa: 'دو راه' },
	pick: { a: { en: 'I’d pick the train', fa: 'قطار را انتخاب می‌کنم' }, b: { en: 'I’d pick the taxi', fa: 'تاکسی را انتخاب می‌کنم' } },
	reasonsPrompt: { en: 'Why this one? Give me two reasons, and say why they matter for her.', fa: 'چرا این یکی؟ دو دلیل بگو، و بگو چرا برای او مهم‌اند.' },
	ai: {
		situation: 'They chose one of two ways for a friend to get from Riverton Airport to the Park Hotel, and spoke twice. The friend: first time in Riverton, a big suitcase and a laptop bag, paying for the trip herself, a meeting at the hotel an hour after she lands.',
		optionsName: 'The two ways',
		personal: '"personal" if the reason is about the friend\'s situation or the learner\'s own experience',
		answered: 'why it is not a problem for her, why something else matters more, how she will deal with it, or why they changed their mind',
		switched: 'they would now choose the other way',
		objectionExamples: ['You agreed it costs more, then said she won\'t have to carry her bags. That keeps your choice strong.', 'Next time, say why the wait isn\'t a problem for her.'],
		better: [
			'makes a vague reason specific with a listed fact ("it\'s fast" -> "it\'s only 25 minutes to the station"; "it\'s cheap" -> "it\'s only $9, and a taxi is about $55")',
			'compares the two ways ("it\'s quicker" -> "it\'s 15 minutes faster than a taxi today")',
			'agrees, then keeps the choice ("yes it\'s expensive" -> "That\'s true, but she won\'t have to carry her bags")',
			'says what matters more ("it\'s easy" -> "For her, not carrying a big suitcase matters more than the price")'
		],
		details: 'never invent anything about the friend or their life. Never suggest a tip amount.',
		transcription: 'They are explaining which of two ways from the airport, the Airport Express train or a taxi, they would choose for a friend, and why.'
	}
};
