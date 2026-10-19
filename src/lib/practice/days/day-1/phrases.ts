/**
 * Day 1, "The lost bag": Natural phrases, Persian-speaker traps, Say it in English and Voice messages.
 * Written from one world (docs/english-day-1/world.md) and reviewed; the source text is
 * docs/english-day-1/phrases-and-messages.md. Content only: the modules that show it are built once.
 */
import { PHRASES as B1_PHRASES } from '../../phrases';
import type { Phrase } from '../../phrases';
import type { Trap } from '../../traps';
import type { SayItem } from '../../say-in-english';
import type { VoiceMessage } from '../../voice-messages';
import type { DisplayText } from '../../hotel';
import type { Track } from '../../day';

/**
 * Natural phrases. A2: you (Karimi) at the baggage desk, in order: only one bag came out → describe
 * it → when do I get it back → the toothbrush → buy a new one? B1: the built set, Sara's moment at
 * the desk told afterwards, as a story.
 */
export const PHRASES: Record<Track, Phrase[]> = {
	intermediate: [
		{
			sentence: 'Hi, only one of my bags came out.',
			shown: 'Hi, only **one‿of my bags** came out.',
			chunk: 'one of my bags',
			situation: { en: 'Only one of your two bags came out on the belt. You go to the baggage desk.', fa: 'از دو تا بارت فقط یکی روی نوار آمد. به باجهٔ بار گمشده می‌روی.' },
			tip: { en: '`one of` runs together: the `n` moves to `of`, `WUH-nuv`.', fa: '`one of` را پیوسته بگو: `n` به `of` می‌چسبد، یعنی `WUH-nuv`.' },
			found: said => /\bone of (?:my|our|the) (?:two |three )?(?:bags|suitcases|backpacks)\b/.test(said)
		},
		{
			sentence: "It's a big dark blue suitcase.",
			shown: "It's **a big dark blue suitcase**.",
			chunk: 'a big dark blue suitcase',
			situation: { en: 'The agent asks what your missing bag looks like.', fa: 'کارمند می‌پرسد بارِ گمشده‌ات چه شکلی است.' },
			tip: { en: 'Say it as one group, with the main stress on `SUIT`: `a big dark blue SUIT-case`.', fa: 'همه را یک‌جا بگو و تأکید اصلی را روی `SUIT` بگذار: `a big dark blue SUIT-case`.' },
			found: said => /\b(?:small|little|big|large|medium|medium size|medium sized) (?:dark |light |navy )?(?:green|gray|grey|black|blue|navy|red|brown|white|yellow|orange|pink|purple|silver) (?:hard |soft |plastic |hard plastic )?(?:backpack|bag|suitcase|one)\b/.test(said)
		},
		{
			sentence: 'Oh no. So when can I get it back?',
			shown: 'Oh no. So when can I **get‿it back**?',
			chunk: 'get it back',
			situation: { en: "The agent says your suitcase wasn't on your flight.", fa: 'کارمند می‌گوید چمدانت با پروازت نیامده.' },
			tip: { en: '`get it`: the `t` turns soft and quick, like a `d`: `geh-dit-BACK`.', fa: 'در `get it` صدای `t` نرم و سریع می‌شود، شبیه `d`: `geh-dit-BACK`.' },
			found: said => /\b(?:get|have) (?:it|them|my suitcase|the suitcase|my bag|the bag|my backpack|the backpack) back\b/.test(said)
		},
		{
			sentence: 'My toothbrush is in there, and I need it tonight.',
			shown: 'My toothbrush is in there, and **I need‿it tonight**.',
			chunk: 'I need it tonight',
			situation: { en: 'Your toothbrush is in the suitcase.', fa: 'مسواکت توی چمدان است.' },
			tip: { en: '`need it` runs together: `NEE-dit`.', fa: '`need it` را پیوسته بگو: `d` به `it` می‌چسبد، یعنی `NEE-dit`.' },
			found: said => /\b(?:i|we) (?:will )?(?:really |still |do )?need (?:it|them|that|my toothbrush|the toothbrush)\b/.test(said)
		},
		{
			sentence: 'So should I buy a new one?',
			shown: 'So should I **buy a new one**?',
			chunk: 'buy a new one',
			situation: { en: "You can't wait until the suitcase comes.", fa: 'نمی‌توانی تا رسیدن چمدان صبر کنی.' },
			tip: { en: 'Stress `new`, and keep `a` and `one` light: `uh-NOO-wun`.', fa: 'روی `new` تأکید کن و `a` و `one` را سبک بگو: `uh-NOO-wun`.' },
			found: said => /\b(?:buy|get) (?:a new one|another one|a new toothbrush|another toothbrush|one)\b/.test(said)
		}
	],
	professional: B1_PHRASES
};

/**
 * Persian-speaker traps: four mistakes from the baggage desk (docs/english-day-1/phrases-and-messages.md).
 * "You" are the learner, at the baggage desk with your own missing bag. The Intermediate lesson uses three;
 * all four are in the Module lab.
 */
export const TRAPS: Trap[] = [
	{
		id: 'my-bags', kind: { en: 'bags / luggage', fa: 'bags / luggage (بار)' },
		words: ['One', 'of', 'my', 'baggages', 'is', 'missing.'], wrong: 3,
		right: 'One of my bags is missing.',
		why: { en: '“Baggage” and “luggage” have no plural: “my luggage”. For one piece, say “one of my bags” or “one of my suitcases”.', fa: 'در فارسی می‌گوییم «بارهام» یا «چمدون‌هام» و برای همین «baggages» به ذهنمان می‌رسد. ولی «baggage» و «luggage» در انگلیسی جمع بسته نمی‌شوند. برای یکی از بارهایت بگو «one of my bags» یا «one of my suitcases».' },
		accept: [/\bone of (?:my|our|the) (?:two |three )?(?:bags|suitcases)\b/], reject: [/\b(?:baggages|luggages)\b/, /\bone of (?:my|our|the) (?:baggage|luggage|bag|suitcase)\b/],
		alsoGood: { patterns: [/\b(?:my|our) (?:luggage|baggage) (?:is|isn't|didn't|hasn't)\b/, /\b(?:my|a) (?:bag|suitcase) is missing\b/], word: 'bags' }
	},
	{
		id: 'by-tomorrow', kind: { en: 'by (a time)', fa: 'by (مهلت)' },
		words: ['Can', 'I', 'get', 'it', 'back', 'until', 'tomorrow?'], wrong: 5,
		right: 'Can I get it back by tomorrow?',
		why: { en: '“By tomorrow” means “tomorrow or sooner”. “Until” is for something that goes on up to a time: “I’ll wait until five.”', fa: 'در فارسی می‌گوییم «تا فردا به دستم می‌رسه؟» و برای همین «until» به ذهنمان می‌رسد. ولی برای مهلت، یعنی «حداکثر تا فردا»، در انگلیسی «by» می‌گوییم: «by tomorrow». «until» برای کاری است که تا یک زمان ادامه دارد، مثل «I’ll wait until five».' },
		accept: [/\bby (?:tomorrow|tonight|the morning|sunday)\b/], reject: [/\b(?:until|till|til) (?:tomorrow|tonight|sunday)\b/],
		alsoGood: { patterns: [/\b(?:back|it) (?:on )?(?:tomorrow|sunday)\b/], word: 'by' }
	},
	{
		id: 'call-me', kind: { en: 'call (no “to”)', fa: 'call (بدون to)' },
		words: ['Please', 'call', 'to', 'me', 'when', 'you', 'find', 'it.'], wrong: 2,
		right: 'Please call me when you find it.',
		why: { en: 'You “call” someone, with no “to”: “call me”, “call the hotel”.', fa: 'در فارسی می‌گوییم «به من زنگ بزنید» و برای همین «call to me» به ذهنمان می‌رسد. ولی بعد از «call» حرف اضافه نمی‌آید: «call me»، «call the hotel».' },
		accept: [/\bcall me\b/, /\bgive me a call\b/], reject: [/\bcall (?:to|for) me\b/],
		alsoGood: { patterns: [/\b(?:text|email|contact|phone) me\b/, /\blet me know\b/], word: 'call' }
	},
	{
		id: 'look-like', kind: { en: 'What … look like?', fa: 'What … look like? (چه شکلیه؟)' },
		words: ['How', 'does', 'your', 'bag', 'look', 'like?'], wrong: 0,
		right: 'What does your bag look like?',
		why: { en: 'With “look like”, ask “What”: “What does it look like?”', fa: 'در فارسی می‌پرسیم «چه شکلیه؟» یا «چطوریه؟» و برای همین «How» به ذهنمان می‌رسد. ولی با «look like» در انگلیسی «What» می‌گوییم: «What does it look like?».' },
		accept: [/\bwhat (?:does|do|did) (?:\w+ ){1,3}look like\b/], reject: [/\bhow (?:\w+ ){1,4}looks? like\b/],
		alsoGood: { patterns: [/\bcan you describe\b/, /\bwhat colou?r is\b/], word: 'What' }
	}
];
/** The three in the Intermediate lesson, in the order of a baggage-desk visit: not #4 `look-like` (the agent's question, not the learner's line). */
export const LESSON_TRAP_IDS = ['my-bags', 'by-tomorrow', 'call-me'];

/**
 * Say it in English (docs/english-day-1/phrases-and-messages.md). "You" are the learner, Karimi, at
 * the baggage desk with your own missing bag (a big, dark blue suitcase with a yellow ribbon on the
 * handle), staying at the Park Hotel. Intermediate: three short A2 messages; Professional: three B1
 * messages. Both sets are used whole in the lesson.
 */
const TO_DESK = { en: 'To the agent at the baggage desk', fa: 'به کارمند باجهٔ بار گمشده' };
const SAY_NAMES = 'Riverton Airport, Park Hotel, Karimi.';
export const SAY: Record<Track, SayItem[]> = {
	intermediate: [
		{
			id: 'd1-missing-bag', to: TO_DESK, names: SAY_NAMES,
			fa: 'سلام، یکی از چمدون‌هام نیومد بیرون. یه چمدون بزرگ سرمه‌ایه، با یه روبان زرد روی دسته‌ش.',
			points: [{ en: "one of your bags didn't come out", fa: 'یکی از چمدان‌هایت بیرون نیامد' }, { en: "it's a big dark blue suitcase with a yellow ribbon on the handle", fa: 'یک چمدان بزرگ سرمه‌ای است، با یک روبان زرد روی دسته‌اش' }],
			models: ["Hi, one of my bags didn't come out. It's a big dark blue suitcase with a yellow ribbon on the handle.", "Hi, one of my suitcases is missing. It's big and dark blue, with a yellow ribbon on the handle."],
			hints: [{ en: 'one of my bags', fa: 'یکی از چمدون‌هام' }, { en: 'a big dark blue suitcase', fa: 'یه چمدون بزرگ سرمه‌ای' }]
		},
		{
			id: 'd1-when', to: TO_DESK, names: SAY_NAMES,
			fa: 'کِی به دستم می‌رسه؟ باید تا فردا صبح دستم باشه.',
			points: [{ en: "you're asking when you'll get it", fa: 'می‌پرسی کِی به دستت می‌رسد' }, { en: 'you need it by tomorrow morning', fa: 'باید تا فردا صبح به دستت برسد' }],
			models: ['When will I get it? I need it by tomorrow morning.', 'When can I get it back? I need it by tomorrow morning.'],
			hints: [{ en: 'get it back', fa: 'به دستم برسه' }, { en: 'by tomorrow morning', fa: 'تا فردا صبح' }]
		},
		{
			id: 'd1-call-me', to: TO_DESK, names: SAY_NAMES,
			fa: 'اسمم کریمیه و توی هتل پارک هستم. لطفاً هر وقت پیداش کردید به من زنگ بزنید.',
			points: [{ en: "your name is Karimi and you're staying at the Park Hotel", fa: 'اسمت کریمی است و در Park Hotel اقامت داری' }, { en: 'they should call you when they find it', fa: 'وقتی پیدایش کردند به تو زنگ بزنند' }],
			models: ["My name's Karimi, and I'm staying at the Park Hotel. Please call me when you find it.", "I'm Karimi, at the Park Hotel. Could you call me when you find it?"],
			hints: [{ en: "I'm staying at…", fa: 'توی … هستم' }, { en: 'call me', fa: 'به من زنگ بزنید' }]
		}
	],
	professional: [
		{
			id: 'd1-suitcase', to: TO_DESK, level: 'B1', names: SAY_NAMES,
			fa: 'چمدون بزرگ سرمه‌ای‌م نیومد بیرون. یه روبان زرد به دسته‌ش بستم که راحت پیدا بشه.',
			points: [{ en: "your big dark blue suitcase didn't come out", fa: 'چمدان بزرگ سرمه‌ای‌ات بیرون نیامد' }, { en: "it has a yellow ribbon on the handle, so it's easy to find", fa: 'یک روبان زرد به دسته‌اش بسته‌ای که راحت پیدا شود' }],
			models: ["My big dark blue suitcase didn't come out. I tied a yellow ribbon to the handle, so it's easy to spot.", "My suitcase never came out. It's big and dark blue, with a yellow ribbon on the handle, so you can't miss it."],
			hints: [{ en: "so it's easy to spot", fa: 'که راحت پیدا بشه' }, { en: 'on the handle', fa: 'به دسته‌ش' }]
		},
		{
			id: 'd1-clothes', to: TO_DESK, level: 'B1', names: SAY_NAMES,
			fa: 'همهٔ لباس‌هام توشه، پس حتماً باید تا فردا صبح دستم باشه. اگه دیر برسه، می‌تونم چند تا چیز ضروری بخرم و پولش رو پس بگیرم؟',
			points: [{ en: 'all your clothes are in it, so you need it by tomorrow morning', fa: 'همهٔ لباس‌هایت در آن است و حتماً باید تا فردا صبح به دستت برسد' }, { en: "if it's late, you're asking if you can buy a few things and get the money back", fa: 'می‌پرسی اگر دیر برسد، می‌توانی چند چیز ضروری بخری و پولش را پس بگیری یا نه' }],
			models: ["All my clothes are in there, so I really need it by tomorrow morning. If it's late, can I buy a few things and get the money back?", "All my clothes are in that suitcase. If it's not here by tomorrow morning, will you pay for the basics I buy?"],
			hints: [{ en: 'by tomorrow morning', fa: 'تا فردا صبح' }, { en: 'get the money back', fa: 'پولش رو پس بگیرم' }]
		},
		{
			id: 'd1-delivery', to: TO_DESK, level: 'B1', names: SAY_NAMES,
			fa: 'خب، حالا چی می‌شه؟ وقتی پیداش کردید، می‌شه بیاریدش هتل پارک؟ اگه نبودم، تحویل پذیرش بدید.',
			points: [{ en: "you're asking what happens next", fa: 'می‌پرسی حالا چه می‌شود و قدم بعدی چیست' }, { en: "when they find it, they should bring it to the Park Hotel, and leave it at the front desk if you're out", fa: 'وقتی پیدایش کردند، آن را به Park Hotel بیاورند و اگر نبودی، تحویل پذیرش بدهند' }],
			models: ["So what happens next? When you find it, could you bring it to the Park Hotel? If I'm out, just leave it at the front desk.", "What's the next step? Once you find it, please send it to the Park Hotel. If I'm not there, the front desk can take it."],
			hints: [{ en: 'what happens next', fa: 'حالا چی می‌شه' }, { en: "if I'm out", fa: 'اگه نبودم' }]
		}
	]
};
/** Both sets are used whole in the lesson. */
export const LESSON_SAY_IDS: Record<Track, string[] | null> = { intermediate: null, professional: null };

/**
 * Voice messages: two on Saturday, late afternoon, after the learner (Karimi) leaves the baggage desk
 * (docs/english-day-1/phrases-and-messages.md). The desk calls first (about 5 p.m.) with the news, then
 * your friend Ben (about 5:15), whose question needs that news. Both are in the lesson and the lab.
 */
const MESSAGE_NAMES = 'Ben, Karimi, Riverton Airport, Park Hotel.';
export const MESSAGES: VoiceMessage[] = [
	{
		id: 'd1-desk', names: MESSAGE_NAMES,
		from: { name: 'Baggage desk', who: { en: 'the baggage desk at Riverton Airport', fa: 'باجهٔ بار گمشدهٔ فرودگاه Riverton' }, voice: 'a' },
		sentences: [
			'Hello, this is the baggage desk at Riverton Airport.',
			'Good news: I think we found your suitcase.',
			"Can you tell me one more thing about it, so we know it's yours?",
			"If it's yours, it comes tomorrow, and our driver can bring it to your hotel.",
			'How can the driver reach you before the delivery?',
			'Thanks, and sorry again about your bag.'
		],
		asks: [
			{ ask: { en: 'Can you tell them one more thing about your suitcase?', fa: 'یک چیز دیگر دربارهٔ چمدانت می‌گویی؟' }, missed: { en: "You didn't tell them anything more about your suitcase.", fa: 'چیز دیگری دربارهٔ چمدانت نگفتی.' } },
			{ ask: { en: 'How can the driver reach you?', fa: 'راننده چطور با تو تماس بگیرد؟' }, missed: { en: "You didn't say how the driver can reach you.", fa: 'نگفتی راننده چطور با تو تماس بگیرد.' } }
		],
		model: 'Hi, thank you so much! Yes, it has a yellow ribbon on the handle. Please call me at this number before the delivery.'
	},
	{
		id: 'd1-ben', names: MESSAGE_NAMES,
		from: { name: 'Ben', who: { en: 'your friend', fa: 'دوستت' }, voice: 'c' },
		sentences: [
			"Hey, it's Ben! Did you land OK?",
			'So, did both your bags come out?',
			'If one is missing, when do you get it back?',
			"Send me a message when you're at your hotel. Talk soon!"
		],
		asks: [
			{ ask: { en: 'Did both your bags come out?', fa: 'هر دو بارَت سالم رسید؟' }, missed: { en: "You didn't say if your bags came out.", fa: 'نگفتی بارهایت رسید یا نه.' } },
			{ ask: { en: 'When do you get it back?', fa: 'کِی پسش می‌گیری؟' }, missed: { en: "You didn't say when you get it back.", fa: 'نگفتی کِی پسش می‌گیری.' } }
		],
		model: "Hi Ben! Yes, I landed OK, but only one of my bags came out. They found my suitcase, and I get it back tomorrow. They're bringing it to my hotel."
	}
];
export const LESSON_MESSAGE_IDS = ['d1-desk', 'd1-ben'];
/** The Module lab's introduction (the lesson has Mira's own). */
export const MESSAGES_INTRO: DisplayText = {
	en: 'Today, you’re Karimi, at Riverton Airport. One of your bags didn’t come out, and you’ve just left the baggage desk. You’ll get two voice messages: from the baggage desk and your friend Ben. Listen, then reply with a voice message. Make sure you answer their questions.',
	fa: 'امروز اسمت کریمی است و در فرودگاه Riverton هستی. یکی از بارهایت بیرون نیامده و همین حالا از باجهٔ بار گمشده می‌آیی. دو پیام صوتی می‌گیری: از باجهٔ بار گمشده و از دوستت بن. گوش بده و با یک پیام صوتی جواب بده. حواست باشد به سؤال‌هایشان جواب بدهی.'
};
