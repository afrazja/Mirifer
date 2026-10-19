/**
 * Day 3, "Checking in": Natural phrases, Persian-speaker traps, Say it in English and Voice messages.
 * Written from one world (docs/english-day-3/world.md) and reviewed; the source text is
 * docs/english-day-3/phrases-and-messages.md. Content only: the modules that show it are built once.
 */
import type { Phrase } from '../../phrases';
import type { Trap } from '../../traps';
import type { SayItem } from '../../say-in-english';
import type { VoiceMessage } from '../../voice-messages';
import type { DisplayText } from '../../hotel';
import type { Track } from '../../day';

/**
 * Natural phrases: Sara's check-in, in order. A2: arrive and give the name → the booking → Wi-Fi →
 * breakfast → the backpack. B1: give the name → check the booking → the Wi-Fi password → a late
 * check-out → the backpack.
 */
export const PHRASES: Record<Track, Phrase[]> = {
	intermediate: [
		{
			sentence: "Hi, I'm here to check in. It's under Demir.",
			shown: "Hi, **I'm here to check‿in**. It's under Demir.",
			chunk: "i'm here to check in",
			situation: { en: 'You get to the front desk.', fa: 'به پذیرش هتل می‌رسی.' },
			tip: { en: '`check in`: link the words and stress `IN`: `che-KIN`.', fa: '`check in` را پیوسته بگو و روی `IN` تأکید کن: `che-KIN`.' },
			found: said => /\bcheck(?:ing)? in\b/.test(said)
		},
		{
			sentence: "I'm staying for three nights, until Tuesday.",
			shown: "**I'm staying for** three nights, until Tuesday.",
			chunk: "i'm staying for",
			situation: { en: 'The receptionist asks how long you’re staying.', fa: 'مسئول پذیرش می‌پرسد چند شب می‌مانی.' },
			tip: { en: '`for` is short and weak: `fer`, so `STAY-ing-fer`.', fa: '`for` را کوتاه و ضعیف بگو، مثل `fer`: `STAY-ing-fer`.' },
			found: said => /\b(?:i am|we are|i will be|we will be) staying\b/.test(said)
		},
		{
			sentence: 'How do I connect to the Wi-Fi?',
			shown: 'How do I **connect‿to the Wi-Fi**?',
			chunk: 'connect to the wi-fi',
			situation: { en: 'You want to get online in your room.', fa: 'می‌خواهی در اتاقت به اینترنت وصل شوی.' },
			tip: { en: '`connect to`: say the `t` only once: `kuh-NEK-tuh`.', fa: 'در `connect to` صدای `t` را فقط یک بار بگو: `kuh-NEK-tuh`.' },
			found: said => /\b(?:connect(?:ed|ing)? to|join|get on|get onto|log on to|log onto|log into|log in to) (?:the )?(?:wi ?fi|internet|network)\b/.test(said)
		},
		{
			sentence: 'Is breakfast included, or is it extra?',
			shown: '**Is breakfast included**, or is it extra?',
			chunk: 'is breakfast included',
			situation: { en: 'You want to know if you pay extra for breakfast.', fa: 'می‌خواهی بدانی صبحانه پول جدا دارد یا نه.' },
			tip: { en: '`included`: stress the middle, `in-CLOO-did`.', fa: 'در `included` تأکید روی بخش وسط است: `in-CLOO-did`.' },
			found: said => /\bis (?:the )?breakfast included\b|\bincludes? breakfast\b|\bcomes? with breakfast\b/.test(said)
		},
		{
			sentence: 'Could you call my room when it arrives?',
			shown: 'Could you call my room **when‿it arrives**?',
			chunk: 'when it arrives',
			situation: { en: 'Your backpack is coming tomorrow morning.', fa: 'کوله‌پشتی‌ات فردا صبح می‌رسد.' },
			tip: { en: '`when it` runs together: `weh-nit`.', fa: '`when it` را پیوسته بگو: `n` به `it` می‌چسبد، یعنی `weh-nit`.' },
			found: said => /\b(?:when|once|as soon as) (?:it|the backpack|my backpack|the bag|my bag|the package)(?: arrives| gets here| comes| comes in|'s here| is here)\b/.test(said)
		}
	],
	professional: [
		{
			sentence: 'Hi, there should be a reservation under Demir.',
			shown: 'Hi, **there should be a reservation‿under** Demir.',
			chunk: 'there should be a reservation under',
			situation: { en: 'You get to the front desk after a long day.', fa: 'بعد از یک روز طولانی به پذیرش هتل می‌رسی.' },
			tip: { en: '`reservation under`: the `n` moves to `under`: `rez-er-VAY-shuh-NUN-der`.', fa: 'در `reservation under` صدای `n` به `under` می‌چسبد: `rez-er-VAY-shuh-NUN-der`.' },
			found: said => /\b(?:reservations?|bookings?|room|booked|it|it's|it is|that's|that is|should be) under\b/.test(said)
		},
		{
			sentence: "Just to double-check, I'm checking out on Tuesday, right?",
			shown: "**Just to double-check**, I'm checking out on Tuesday, right?",
			chunk: 'just to double-check',
			situation: { en: 'The receptionist finds your booking.', fa: 'مسئول پذیرش رزروت را پیدا می‌کند.' },
			tip: { en: '`double-check`: stress `CHECK`, not `double`: `dub-ul-CHECK`.', fa: 'در `double-check` تأکید روی `CHECK` است، نه `double`: `dub-ul-CHECK`.' },
			found: said => /\bdouble check(?:ing|ed)?\b/.test(said)
		},
		{
			sentence: 'Sorry, is the Wi-Fi password all one word?',
			shown: 'Sorry, is the Wi-Fi password **all‿one word**?',
			chunk: 'all one word',
			situation: { en: 'The receptionist says the Wi-Fi password very fast.', fa: 'مسئول پذیرش رمز وای‌فای را خیلی تند می‌گوید.' },
			tip: { en: '`all one word`: say it as one group, `aw-lwun-WURD`.', fa: '`all one word` را یک‌نفس بگو: `l` به `one` می‌چسبد، یعنی `aw-lwun-WURD`.' },
			found: said => /\b(?:all )?one word\b/.test(said)
		},
		{
			sentence: 'Would it be possible to get a late check-out on Tuesday?',
			shown: '**Would‿it be possible to** get a late check-out on Tuesday?',
			chunk: 'would it be possible to',
			situation: { en: 'You’d like to leave a little later on Tuesday.', fa: 'می‌خواهی سه‌شنبه کمی دیرتر از هتل بروی.' },
			tip: { en: '`would it` runs together, quick and soft: `wu-dit-be-POSS-uh-bul`.', fa: '`would it` را پیوسته، سریع و نرم بگو: `wu-dit-be-POSS-uh-bul`.' },
			found: said => /\b(?:would it be|will it be|is it) possible (?:for (?:me|us) )?to\b/.test(said)
		},
		{
			sentence: "My backpack's coming tomorrow. Could you hold on to it for me?",
			shown: "My backpack's coming tomorrow. Could you **hold‿on to it** for me?",
			chunk: 'hold on to it',
			situation: { en: 'Your backpack arrives tomorrow morning, and you might not be in your room.', fa: 'کوله‌پشتی‌ات فردا صبح می‌رسد و شاید آن موقع در اتاقت نباشی.' },
			tip: { en: '`hold on`: the `d` moves to `on`: `hol-DON`.', fa: 'در `hold on` صدای `d` به `on` می‌چسبد: `hol-DON`.' },
			found: said => /\b(?:hold|hang) (?:on to|onto) (?:it|that|my backpack|the backpack|my bag|the bag|them)\b/.test(said)
		}
	]
};

/**
 * Persian-speaker traps: six mistakes from a check-in (docs/english-day-3/phrases-and-messages.md).
 * "You" are the learner, booked under Karimi. The Intermediate lesson uses five; all six are in the Module lab.
 */
export const TRAPS: Trap[] = [
	{
		id: 'under-name', kind: { en: 'under (a name)', fa: 'under (به اسمِ)' },
		words: ['I', 'have', 'a', 'reservation', 'on', 'the', 'name', 'Karimi.'], wrong: 4,
		right: 'I have a reservation under the name Karimi.',
		why: { en: 'A booking is “under” a name: “a reservation under the name Karimi”, or just “under Karimi”.', fa: 'در فارسی می‌گوییم «به اسمِ کریمی» و برای همین «on the name» یا «with the name» به ذهنمان می‌رسد. در انگلیسی رزرو را «under» یک اسم می‌گویند: «under the name Karimi» یا خیلی ساده «under Karimi».' },
		accept: [/\b(?:reservation|booking|room|booked|it's|it is) under\b/, /\bunder (?:the|my) name\b/], reject: [/\b(?:on|with|by|to) (?:the|my) name\b/],
		alsoGood: { patterns: [/\bin (?:the|my) name\b/], word: 'under' }
	},
	{
		id: 'on-the-floor', kind: { en: 'on the … floor', fa: 'on the … floor (طبقه)' },
		words: ['The', 'gym', 'is', 'in', 'the', 'second', 'floor.'], wrong: 3,
		right: 'The gym is on the second floor.',
		why: { en: 'Floors take “on”: “on the second floor”, “on the ground floor”.', fa: 'در فارسی می‌گوییم «باشگاه تو طبقهٔ دومه» و برای همین «in» به ذهنمان می‌رسد. ولی در انگلیسی برای طبقه «on» می‌گوییم: «on the second floor».' },
		accept: [/\bon the (?:second|2nd|2) floor\b/, /\bon floor (?:two|2)\b/], reject: [/\b(?:in|at) the (?:second|2nd|2) floor\b/, /\b(?:in|at) floor (?:two|2)\b/]
	},
	{
		id: 'password-for', kind: { en: 'the password for', fa: 'the password for (رمزِ)' },
		words: ["What's", 'the', 'password', 'of', 'the', 'Wi-Fi?'], wrong: 3,
		right: "What's the password for the Wi-Fi?",
		why: { en: 'Say “the password for the Wi-Fi”, or just “the Wi-Fi password”, not “of”.', fa: 'در فارسی می‌گوییم «رمزِ وای‌فای» و همین کسره باعث می‌شود «of» بگوییم. در انگلیسی «the password for the Wi-Fi» یا خیلی ساده «the Wi-Fi password» می‌گوییم.' },
		accept: [/\bpassword (?:for|to) (?:the )?wi ?fi\b/, /\bwi ?fi password\b/], reject: [/\b(?:password|code) of (?:the )?wi ?fi\b/]
	},
	{
		id: 'phone-dead', kind: { en: 'a dead phone', fa: 'a dead phone (گوشی بی‌شارژ)' },
		words: ['My', 'phone', 'battery', 'is', 'finished.'], wrong: 4,
		right: 'My phone battery is dead.',
		why: { en: 'A phone or battery with no charge left is “dead”, not “finished”. You can also say “My phone died.”', fa: 'در فارسی می‌گوییم «شارژ گوشیم تموم شده» و برای همین «finished» به ذهنمان می‌رسد. در انگلیسی گوشی یا باتری‌ای که شارژ ندارد «dead» است: «My phone is dead» یا «My phone died».' },
		accept: [/\b(?:phone|battery)(?: is|'s) (?:\w+ )?dead\b/, /\b(?:phone|battery)(?: has| just|'s)* died\b/], reject: [/\b(?:phone|battery|charge)(?: is|'s) (?:\w+ )?finished\b/],
		alsoGood: { patterns: [/\bout of (?:battery|charge|power)\b/, /\bneeds? (?:to be )?charg/], word: 'dead' }
	},
	{
		id: 'lend-me', kind: { en: 'lend / borrow', fa: 'lend / borrow' },
		words: ['Can', 'you', 'borrow', 'me', 'a', 'charger?'], wrong: 2,
		right: 'Can you lend me a charger?',
		why: { en: 'You “borrow” something from someone; they “lend” it to you. So: “Can you lend me…?” or “Can I borrow…?”', fa: 'در فارسی هر دو را با «قرض» می‌گوییم: قرض دادن و قرض گرفتن. در انگلیسی کسی که می‌دهد «lend» می‌گوید و کسی که می‌گیرد «borrow». پس بگو «Can you lend me a charger» یا «Can I borrow a charger».' },
		accept: [/\b(?:lend|loan) me\b/, /\b(?:can|could|may) i borrow\b/], reject: [/\bborrow me\b/],
		alsoGood: { patterns: [/\b(?:can|could|may) i (?:have|get|use)\b/, /\bdo you have a (?:phone )?charger\b/], word: 'lend' }
	},
	{
		id: 'im-staying', kind: { en: 'I’m staying (plans)', fa: 'I’m staying (برنامه)' },
		words: ['I', 'stay', 'here', 'for', 'four', 'nights.'], wrong: 1,
		right: "I'm staying here for four nights.",
		why: { en: 'For your plans on this trip, say “I’m staying”. “I stay” sounds like something you always do.', fa: 'در فارسی می‌گوییم «چهار شب این‌جا می‌مونم». در انگلیسی برای برنامهٔ همین سفر «I’m staying» می‌گوییم. «I stay» یعنی کاری که همیشه انجام می‌دهی.' },
		accept: [/\b(?:i'm|i am|im|i'll be|i will be) staying\b/], reject: [/\bi stay\b/],
		alsoGood: { patterns: [/\b(?:i'll|i will) stay\b/, /\b(?:i'm|i am|im) here for\b/], word: 'staying' }
	}
];
/** The five in the Intermediate lesson, in check-in order: not #4 `phone-dead` (the charger is already in `lend-me`). */
export const LESSON_TRAP_IDS = ['under-name', 'im-staying', 'on-the-floor', 'password-for', 'lend-me'];

/**
 * Say it in English (docs/english-day-3/phrases-and-messages.md). Intermediate: four short messages
 * to the front desk, as the learner checking in under Karimi. Professional: three longer B1 messages
 * Sara says to Daniel at the front desk. Both sets are used whole in the lesson.
 */
const TO_DESK = { en: 'To the hotel front desk', fa: 'به پذیرش هتل' };
const TO_DANIEL = { en: 'To Daniel at the front desk', fa: 'به دنیل، در پذیرش هتل' };
const DESK_NAMES = 'Park Hotel, Karimi.';
const DANIEL_NAMES = 'Park Hotel, Daniel, Demir, Riverton.';
export const SAY: Record<Track, SayItem[]> = {
	intermediate: [
		{
			id: 'd3-checkin', to: TO_DESK, names: DESK_NAMES,
			fa: 'سلام، اومدم اتاقم رو تحویل بگیرم. رزرو به اسم کریمیه.',
			points: [{ en: 'you’re here to check in', fa: 'آمده‌ای اتاقت را تحویل بگیری' }, { en: 'the reservation is under Karimi', fa: 'رزرو به اسم کریمی است' }],
			models: ["Hi, I'm here to check in. The reservation is under Karimi.", "Hi, I'd like to check in, please. It's under Karimi."],
			hints: [{ en: 'check in', fa: 'تحویل گرفتن اتاق' }, { en: 'under…', fa: 'به اسمِ…' }]
		},
		{
			id: 'd3-dates', to: TO_DESK, names: DESK_NAMES,
			fa: 'فقط برای این‌که مطمئن بشم: چهار شب می‌مونم، تا چهارشنبه، درسته؟ چهارشنبه ساعت چند باید اتاق رو تحویل بدم؟',
			points: [{ en: 'you’re checking that you’re staying four nights, until Wednesday', fa: 'می‌خواهی مطمئن شوی که چهار شب، تا چهارشنبه، می‌مانی' }, { en: 'you’re asking what time you have to check out on Wednesday', fa: 'می‌پرسی چهارشنبه ساعت چند باید اتاق را تحویل بدهی' }],
			models: ["Just to check, I'm staying for four nights, until Wednesday, right? And what time is check-out?", "So that's four nights, until Wednesday? What time do I have to check out?"],
			hints: [{ en: 'I’m staying for…', fa: '… می‌مونم' }, { en: 'check out', fa: 'تحویل دادن اتاق' }]
		},
		{
			id: 'd3-wifi', to: TO_DESK, names: DESK_NAMES,
			fa: 'ببخشید، وای‌فای مجانیه؟ رمزش چیه؟',
			points: [{ en: 'you’re asking if the Wi-Fi is free', fa: 'می‌پرسی وای‌فای مجانی است یا نه' }, { en: 'you’re asking for the password', fa: 'رمز وای‌فای را می‌خواهی' }],
			models: ["Excuse me, is the Wi-Fi free? What's the password?", 'Is the Wi-Fi free? And could I get the password, please?'],
			hints: [{ en: 'free', fa: 'مجانی' }, { en: 'the Wi-Fi password', fa: 'رمز وای‌فای' }]
		},
		{
			id: 'd3-breakfast', to: TO_DESK, names: DESK_NAMES,
			fa: 'صبحونه هم جزو قیمت اتاقه؟ فردا از ساعت چند شروع می‌شه؟',
			points: [{ en: 'you’re asking if breakfast is included', fa: 'می‌پرسی صبحانه جزو قیمت اتاق است یا نه' }, { en: 'you’re asking what time it starts tomorrow', fa: 'می‌پرسی فردا صبحانه از ساعت چند شروع می‌شود' }],
			models: ['Is breakfast included? What time does it start tomorrow?', 'Is breakfast included in the price? And what time is it tomorrow?'],
			hints: [{ en: 'included', fa: 'جزو قیمت' }, { en: 'What time does it start?', fa: 'از ساعت چند…؟' }]
		}
	],
	professional: [
		{
			id: 'd3-hold', to: TO_DANIEL, level: 'B1', names: DANIEL_NAMES,
			fa: 'فقط می‌خوام مطمئن بشم: این شبی پنجاه دلار که روی کارتم بلوکه می‌کنید از حسابم کم نمی‌شه، درسته؟ کی آزاد می‌شه؟',
			points: [{ en: 'you want to make sure the fifty dollars a night is only a hold, not a charge', fa: 'می‌خواهی مطمئن شوی شبی پنجاه دلار فقط روی کارتت بلوکه می‌شود و از حسابت کم نمی‌شود' }, { en: 'you’re asking when you’ll get it back', fa: 'می‌پرسی کی آزاد می‌شود' }],
			models: ['Just to double-check, the fifty dollars a night is only a hold, not a charge, right? When do I get it back?', "So it's just a hold on my card, and you won't actually charge it, right? When will it be released?"],
			hints: [{ en: 'just to double-check', fa: 'فقط برای این‌که مطمئن بشم' }, { en: 'a hold, not a charge', fa: 'بلوکه کردن، نه برداشت' }]
		},
		{
			id: 'd3-backpack-desk', to: TO_DANIEL, level: 'B1', names: DANIEL_NAMES,
			fa: 'فردا صبح بین هشت تا ده، شرکت هواپیمایی کوله‌پشتیم رو میاره. شاید اون موقع سر صبحونه باشم. می‌شه نگهش دارید تا بعد از صبحونه بیام بگیرمش؟',
			points: [{ en: 'the airline is bringing your backpack tomorrow between eight and ten, and you might be at breakfast then', fa: 'شرکت هواپیمایی فردا بین هشت تا ده کوله‌پشتی‌ات را می‌آورد و شاید آن موقع سر صبحانه باشی' }, { en: 'you’d like them to keep it until you pick it up after breakfast', fa: 'می‌خواهی آن را نگه دارند تا بعد از صبحانه بیایی و بگیری' }],
			models: ["The airline's bringing my backpack tomorrow between eight and ten. I might be at breakfast, so could you hold on to it? I'll pick it up after.", "My backpack should get here tomorrow, between eight and ten. If I'm at breakfast, would you mind keeping it at the desk? I'll come get it after that."],
			hints: [{ en: 'I might be at breakfast', fa: 'شاید سر صبحونه باشم' }, { en: 'hold on to it', fa: 'نگهش دارید' }]
		},
		{
			id: 'd3-late-checkout', to: TO_DANIEL, level: 'B1', names: DANIEL_NAMES,
			fa: 'امکانش هست سه‌شنبه یه کم دیرتر اتاق رو تحویل بدم، مثلاً ساعت یک؟ اگه هزینهٔ اضافه داره، ترجیح می‌دم همون ساعت یازده برم.',
			points: [{ en: 'you’d like a late check-out on Tuesday, at about one', fa: 'می‌خواهی سه‌شنبه دیرتر، حدود ساعت یک، اتاق را تحویل بدهی' }, { en: 'if it costs extra, you’d rather leave at eleven', fa: 'اگر هزینهٔ اضافه دارد، ترجیح می‌دهی همان ساعت یازده بروی' }],
			models: ["Would it be possible to get a late check-out on Tuesday, around one? If it costs extra, I'll just leave at eleven.", "Could I check out a bit later on Tuesday, say at one? If there's an extra charge, eleven is fine."],
			hints: [{ en: 'a late check-out', fa: 'دیرتر تحویل دادن اتاق' }, { en: 'if it costs extra', fa: 'اگه هزینهٔ اضافه داره' }]
		}
	]
};
/** Both sets are used whole in the lesson. */
export const LESSON_SAY_IDS: Record<Track, string[] | null> = { intermediate: null, professional: null };

/**
 * Voice messages: two on Saturday evening, after Sara's phone is charged in room 714
 * (docs/english-day-3/phrases-and-messages.md). The learner replies as Sara. Both are in the lesson and the lab.
 */
const MESSAGE_NAMES = "Tom, Rosa's, Elm Street, Riverton, Park Hotel, Main Street, Daniel, RideNow.";
export const MESSAGES: VoiceMessage[] = [
	{
		id: 'd3-tom', names: MESSAGE_NAMES,
		from: { name: 'Tom', who: { en: 'your friend in Riverton', fa: 'دوستت در ریورتون' }, voice: 'c' },
		sentences: [
			"Hey, it's Tom. I tried to call you, but it went straight to voicemail. Is everything OK?",
			"Anyway, dinner's at seven, at Rosa's. It's on Elm Street, about ten minutes from your hotel by car.",
			"I'll get there a little early and get us a table.",
			'So how are you getting there?',
			'Let me know. See you soon!'
		],
		asks: [
			{ ask: { en: "Is everything OK? Why couldn't he call you?", fa: 'همه‌چیز روبه‌راه است؟ چرا نتوانست به تو زنگ بزند؟' }, missed: { en: "You didn't say why he couldn't call you.", fa: 'نگفتی چرا نتوانست به تو زنگ بزند.' } },
			{ ask: { en: "How are you getting to Rosa's?", fa: 'چطور به رستوران رزا می‌روی؟' }, missed: { en: "You didn't say how you're getting to Rosa's.", fa: 'نگفتی چطور به رستوران رزا می‌روی.' } }
		],
		model: "Hi Tom! Sorry, my phone battery was dead, but the hotel lent me a charger. I'm taking a RideNow at six forty. See you at Rosa's!"
	},
	{
		id: 'd3-baggage', names: MESSAGE_NAMES,
		from: { name: 'Baggage desk', who: { en: 'the airline', fa: 'شرکت هواپیمایی' }, voice: 'a' },
		sentences: [
			"Hello, this is the airline's baggage desk at Riverton Airport. It's about your small green backpack.",
			'Our driver will bring it to the Park Hotel tomorrow morning, between eight and ten.',
			'Could you tell us your room number, please?',
			'And will you be in your room then, or should we leave it at the front desk?',
			'Thanks, and have a good evening.'
		],
		asks: [
			{ ask: { en: "What's your room number?", fa: 'شمارهٔ اتاقت چند است؟' }, missed: { en: "You didn't say your room number.", fa: 'نگفتی شمارهٔ اتاقت چند است.' } },
			{ ask: { en: 'Will you be in your room, or should they leave it at the front desk?', fa: 'آن موقع در اتاقت هستی، یا کوله‌پشتی را تحویل پذیرش بدهند؟' }, missed: { en: "You didn't say if you'll be in your room or if they should leave it at the front desk.", fa: 'نگفتی در اتاقت هستی یا کوله‌پشتی را تحویل پذیرش بدهند.' } }
		],
		model: "Hi, thanks for calling. My room number is 714. I might be at breakfast then, so please leave it at the front desk. They'll keep it for me. Thanks!"
	}
];
export const LESSON_MESSAGE_IDS = ['d3-tom', 'd3-baggage'];
/** The Module lab's introduction (the lesson has Mira's own). */
export const MESSAGES_INTRO: DisplayText = {
	en: 'Today, you’re Sara, in room 714 at the Park Hotel. You’ll get two voice messages: from your friend Tom and the airline. Listen, then reply with a voice message. Make sure you answer their questions.',
	fa: 'امروز جای سارا هستی، در اتاق ۷۱۴ هتل پارک. دو پیام صوتی می‌گیری: از دوستت تام و از شرکت هواپیمایی. گوش بده و با یک پیام صوتی جواب بده. حواست باشد به سؤال‌هایشان جواب بدهی.'
};
