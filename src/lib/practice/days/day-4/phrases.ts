/**
 * Day 4, "Asking the way": Natural phrases, Persian-speaker traps, Say it in English and Voice messages.
 * Written from one world (docs/english-day-4/world.md) and reviewed; the source text is
 * docs/english-day-4/phrases-and-messages.md. Content only: the modules that show it are built once.
 * Two items come back from earlier days, word for word and by reference (not copied): Day 1's trap
 * `call-me` and Day 3's Say-it item `d3-late-checkout`. Mira's intros say "From Day N".
 */
import type { Phrase } from '../../phrases';
import type { Trap } from '../../traps';
import type { SayItem } from '../../say-in-english';
import type { VoiceMessage } from '../../voice-messages';
import type { DisplayText } from '../../hotel';
import type { Track } from '../../day';
import { TRAPS as DAY_ONE_TRAPS } from '../day-1/phrases';
import { SAY as DAY_THREE_SAY } from '../day-3/phrases';

/** An earlier day's item, the same object (so its text and checks can't drift apart). */
function reused<T extends { id: string }>(items: readonly T[], id: string): T {
	const item = items.find(each => each.id === id);
	if (!item) throw new Error(`Day 4 reuses "${id}", which is missing`);
	return item;
}

/**
 * Natural phrases: Sara's Sunday morning, in order. A2: ask the way (Daniel) → can I walk? → check it
 * back → ask for a repeat, slower (Greg) → thanks. B1: ask the best way (Daniel) → is it walking
 * distance? → check it back → ask the man at the bus stop to slow down (Greg) → thanks.
 */
export const PHRASES: Record<Track, Phrase[]> = {
	intermediate: [
		{
			sentence: 'Excuse me, how do I get to the Sunday market?',
			shown: 'Excuse me, **how do I get‿to** the Sunday market?',
			chunk: 'how do I get to',
			situation: { en: 'You want to go to the Sunday market. You ask at the front desk.', fa: 'می‌خواهی به بازار یکشنبه بروی. از پذیرش هتل می‌پرسی.' },
			tip: { en: '`get to`: say the `t` only once, soft and quick: `GEH-tuh`.', fa: 'در `get to` صدای `t` را فقط یک بار بگو، نرم و سریع: `GEH-tuh`.' },
			found: said => /\bhow (?:do|can|could|would|should) (?:i|we|you) get (?:to|there)\b/.test(said)
		},
		{
			sentence: 'Can I walk there, or is it too far?',
			shown: '**Can I walk there**, or is it too far?',
			chunk: 'can I walk there',
			situation: { en: 'You’d like to walk, if it isn’t too far.', fa: 'اگر خیلی دور نباشد، دوست داری پیاده بروی.' },
			tip: { en: '`walk`: the `l` is silent: `WAWK`.', fa: 'در `walk` حرف `l` خوانده نمی‌شود: `WAWK`.' },
			found: said => /\b(?:can|could|should) (?:i|we|you) (?:just )?walk\b|\bwalk there\b/.test(said)
		},
		{
			sentence: 'So I turn left at the second light?',
			shown: 'So I **turn left‿at** the second light?',
			chunk: 'turn left at',
			situation: { en: 'Daniel explains the way. You check it.', fa: 'دنیل راه را توضیح می‌دهد. برایش تکرار می‌کنی تا مطمئن شوی درست فهمیده‌ای.' },
			tip: { en: '`left at` runs together: `LEF-tat`.', fa: '`left at` را پیوسته بگو: `t` به `at` می‌چسبد، یعنی `LEF-tat`.' },
			found: said => /\b(?:turn|take a|make a) (?:left|right)\b/.test(said)
		},
		{
			sentence: 'Sorry, could you say that again a little slower?',
			shown: 'Sorry, could you **say that‿again** a little slower?',
			chunk: 'say that again',
			situation: { en: 'The street is closed for a race. A man at the bus stop explains another way, very fast.', fa: 'خیابان به‌خاطر یک مسابقهٔ دو بسته است. مردی در ایستگاه اتوبوس راه دیگری را خیلی تند توضیح می‌دهد.' },
			tip: { en: '`that again`: the `t` turns soft and quick, like a `d`: `tha-duh-GEN`.', fa: 'در `that again` صدای `t` نرم و سریع می‌شود، شبیه `d`: `tha-duh-GEN`.' },
			found: said => /\bsay (?:that|it|this) (?:again|one more time)\b/.test(said)
		},
		{
			sentence: 'Thanks so much. I really appreciate it.',
			shown: 'Thanks so much. **I really appreciate it**.',
			chunk: 'I really appreciate it',
			situation: { en: 'He says it again, slowly. Now you understand.', fa: 'دوباره و آهسته می‌گوید. حالا می‌فهمی.' },
			tip: { en: '`appreciate`: stress the second part: `uh-PREE-shee-ayt`.', fa: 'در `appreciate` تأکید روی بخش دوم است: `uh-PREE-shee-ayt`.' },
			found: said => /\bappreciate (?:it|that|this|your help|the help|you)\b/.test(said)
		}
	],
	professional: [
		{
			sentence: "Hi, what's the best way to get to the Sunday market from here?",
			shown: "Hi, what's **the best‿way to get to** the Sunday market from here?",
			chunk: 'the best way to get to',
			situation: { en: 'You want to go to the Sunday market in Central Park. You ask at the front desk.', fa: 'می‌خواهی به بازار یکشنبه در Central Park بروی. از پذیرش هتل می‌پرسی.' },
			tip: { en: '`best way`: the `t` almost disappears: `bes-WAY`.', fa: 'در `best way` صدای `t` تقریباً شنیده نمی‌شود: `bes-WAY`.' },
			found: said => /\b(?:best|easiest|quickest|fastest|simplest) way (?:to get|to go|of getting) (?:to|there)\b/.test(said)
		},
		{
			sentence: 'Is it within walking distance, or should I take the bus?',
			shown: 'Is it **within walking distance**, or should I take the bus?',
			chunk: 'within walking distance',
			situation: { en: 'You’d like to walk, but you don’t know how far it is.', fa: 'دوست داری پیاده بروی، ولی نمی‌دانی چقدر راه است.' },
			tip: { en: '`walking`: the `l` is silent: `WAW-king`.', fa: 'در `walking` حرف `l` خوانده نمی‌شود: `WAW-king`.' },
			found: said => /\b(?:within |in )?walking distance\b/.test(said)
		},
		{
			sentence: "So if I've got this right, I go left at the bank and walk two blocks?",
			shown: "So **if I've got this right**, I go left at the bank and walk two blocks?",
			chunk: "if I've got this right",
			situation: { en: 'Daniel explains the way. You say it back to check.', fa: 'دنیل راه را توضیح می‌دهد. آن را برایش تکرار می‌کنی تا مطمئن شوی.' },
			tip: { en: "Stress `got` and `right`: `if I've GOT this RIGHT`.", fa: "روی `got` و `right` تأکید کن: `if I've GOT this RIGHT`." },
			found: said => /\bif i (?:have )?got (?:this|that|it|you|everything) right\b/.test(said)
		},
		{
			sentence: "Sorry, I'm not from around here. Could you slow down a bit?",
			shown: "Sorry, I'm not from around here. Could you **slow down‿a bit**?",
			chunk: 'slow down a bit',
			situation: { en: 'The street is closed for a race. A man at the bus stop explains another way, very fast.', fa: 'خیابان به‌خاطر یک مسابقهٔ دو بسته است. مردی در ایستگاه اتوبوس راه دیگری را خیلی تند توضیح می‌دهد.' },
			tip: { en: '`down a bit` runs together: `dow-nuh-BIT`.', fa: '`down a bit` را پیوسته بگو: `n` به `a` می‌چسبد، یعنی `dow-nuh-BIT`.' },
			found: said => /\bslow (?:it )?down\b/.test(said)
		},
		{
			sentence: "Thanks, that's really kind of you. I hope your bus comes soon!",
			shown: "Thanks, **that's really kind‿of you**. I hope your bus comes soon!",
			chunk: "that's really kind of you",
			situation: { en: 'Now you know the way. His bus is late.', fa: 'حالا راه را بلدی. اتوبوسِ او دیر کرده.' },
			tip: { en: '`kind of you` runs together, with a weak `of`: `KYN-duh-vyoo`.', fa: '`kind of you` را پیوسته بگو و `of` را ضعیف: `KYN-duh-vyoo`.' },
			found: said => /\bkind of you\b/.test(said)
		}
	]
};

/**
 * Persian-speaker traps (docs/english-day-4/phrases-and-messages.md §2). "You" are the learner, on
 * your own day out in Riverton. Six: Day 1's `call-me` (From Day 1, the same object), then five new
 * direction traps. `trapsFor` keeps this order, so `call-me` is first here, not only in the ids.
 * The Intermediate lesson uses five; all six are in the Module lab.
 */
export const TRAPS: Trap[] = [
	reused(DAY_ONE_TRAPS, 'call-me'),
	{
		id: 'turn-left', kind: { en: 'turn left (no “to”)', fa: 'turn left (بدون to)' },
		words: ['So', 'I', 'turn', 'to', 'left', 'at', 'the', 'bank?'], wrong: 3,
		right: 'So I turn left at the bank?',
		why: { en: 'After “turn”, say “left” or “right” with no “to”: “turn left at the bank”.', fa: 'در فارسی می‌گوییم «بپیچ به چپ» و برای همین «to» به ذهنمان می‌رسد. در انگلیسی بعد از «turn» مستقیم «left» یا «right» می‌آید: «turn left at the bank».' },
		accept: [/\bturn(?:s|ed|ing)? (?:left|right)\b/], reject: [/\bturn(?:s|ed|ing)? (?:to|in|into) (?:left|right)\b/],
		alsoGood: { patterns: [/\b(?:take|make) a (?:left|right)\b/, /\bturn(?:s|ed|ing)? to the (?:left|right)\b/], word: 'turn left' }
	},
	{
		// "in front of" is one tap: the mistake is the whole phrase.
		id: 'across-from', kind: { en: 'across from', fa: 'across from (روبه‌روی)' },
		words: ['The', 'museum', 'is', 'in front of', 'the', 'park.'], wrong: 3,
		right: 'The museum is across from the park.',
		why: { en: '“In front of” means right by its front, on the same side of the street. When the street is between them, say “across from.”', fa: 'در فارسی «روبه‌روی پارک» را معمولاً «in front of the park» ترجمه می‌کنیم. ولی «in front of» یعنی درست جلوی خودِ آن، همین طرف خیابان. وقتی خیابان وسطشان است، در انگلیسی «across from» می‌گوییم: «across from the park».' },
		accept: [/\bacross (?:the street |the road )?from\b/], reject: [/\bin front of\b/],
		alsoGood: { patterns: [/\bopposite\b/, /\bon the other side of the (?:street|road)\b/, /\bfacing\b/], word: 'across from' }
	},
	{
		id: 'minutes-away', kind: { en: '… minutes away', fa: 'minutes away (فاصله)' },
		words: ['The', 'park', 'is', 'fifteen', 'minutes', 'far', 'from', 'the', 'hotel.'], wrong: 5,
		right: 'The park is fifteen minutes away from the hotel.',
		why: { en: 'With a time or a distance, say “away”: “fifteen minutes away.” Use “far” without a number: “Is it far?” “It’s not far.”', fa: 'در فارسی می‌گوییم «پونزده دقیقه با هتل فاصله داره» و «فاصله» ما را یاد «far» می‌اندازد. در انگلیسی بعد از زمان یا مسافت «away» می‌آید: «fifteen minutes away» یا «a fifteen-minute walk». «far» بیشتر در سؤال و جملهٔ منفی می‌آید: «Is it far?»، «It’s not far».' },
		accept: [/\b(?:minutes?|mins?|blocks?|miles?|hours?) away\b/, /\b(?:minute|block|mile|hour) (?:walk|drive|ride)\b/], reject: [/\b(?:minutes?|mins?|blocks?|miles?|hours?) far\b/],
		alsoGood: { patterns: [/\b(?:minutes?|blocks?|miles?) from (?:the|here|my|our|your)\b/, /\btakes? (?:about |around )?(?:fifteen|15) minutes\b/], word: 'away' }
	},
	{
		id: 'cross-street', kind: { en: 'cross the street', fa: 'cross (رد شدن از خیابان)' },
		words: ['Can', 'I', 'pass', 'the', 'street', 'here?'], wrong: 2,
		right: 'Can I cross the street here?',
		why: { en: 'To go to the other side of a street, you “cross” it. “Pass” means to go by something: “You’ll pass the library.”', fa: 'در فارسی می‌گوییم «از خیابون رد بشم؟» و «رد شدن» را «pass» ترجمه می‌کنیم. در انگلیسی برای رفتن به آن طرف خیابان «cross» می‌گوییم: «cross the street». «pass» یعنی از کنار چیزی گذشتن: «You’ll pass the library».' },
		accept: [/\bcross(?:es|ed|ing)?\b/], reject: [/\bpass(?:es|ed|ing)? (?:from |through )?(?:the |this |that |main )?(?:street|road)\b/],
		alsoGood: { patterns: [/\b(?:go|get|walk) across\b/, /\bget to the other side\b/], word: 'cross' }
	},
	{
		id: 'go-straight', kind: { en: 'go straight', fa: 'go straight (مستقیم)' },
		words: ['Go', 'direct', 'to', 'the', 'second', 'light.'], wrong: 1,
		right: 'Go straight to the second light.',
		why: { en: 'In directions, “straight” means don’t turn: “Go straight”, “Keep going straight”. “Directly” means without stopping.', fa: 'در فارسی می‌گوییم «مستقیم برو» و چون «مستقیم» را «direct» ترجمه می‌کنیم، «go direct» به ذهنمان می‌رسد. در آدرس دادن، در انگلیسی «straight» می‌گوییم: «Go straight» یا «Keep going straight». «directly» یعنی بدون توقف.' },
		accept: [/\b(?:go|goes|going|went|walk|walking|keep|head|continue|drive) straight\b/, /\bstraight (?:ahead|on|down|along|to)\b/],
		reject: [/\b(?:go|goes|going|walk|walking|keep|head|continue|drive) direct(?:ly)?\b/]
	}
];
/** The five in the Intermediate lesson: Day 1's `call-me` first, then the four in the order you meet them asking the way; not #6 `go-straight` (lab only). */
export const LESSON_TRAP_IDS = ['call-me', 'turn-left', 'across-from', 'minutes-away', 'cross-street'];

/**
 * Say it in English (docs/english-day-4/phrases-and-messages.md §3). Intermediate: four short messages
 * to the front desk, as the learner (Karimi) asking the way to the City Museum. Professional: three
 * longer B1 messages Sara says on Sunday morning; the first is Day 3's `d3-late-checkout` (From Day 3,
 * the same object, with its own `names`). Both sets are used whole in the lesson.
 */
const TO_DESK = { en: 'To the hotel front desk', fa: 'به پذیرش هتل' };
const TO_DANIEL = { en: 'To Daniel at the front desk', fa: 'به دنیل، در پذیرش هتل' };
const TO_BUS_STOP = { en: 'To a man at the bus stop', fa: 'به مردی در ایستگاه اتوبوس' };
const DESK_NAMES = 'Park Hotel, City Museum, Main Street, Karimi.';
const SARA_NAMES = 'Park Hotel, Daniel, Central Park, Main Street, Oak Street, Pine Street, Riverton.';
export const SAY: Record<Track, SayItem[]> = {
	intermediate: [
		{
			id: 'd4-museum-way', to: TO_DESK, names: DESK_NAMES,
			fa: 'ببخشید، از این‌جا چطوری برم موزهٔ شهر؟ پیاده دوره؟',
			points: [{ en: 'you’re asking how to get to the City Museum', fa: 'می‌پرسی چطور به موزهٔ شهر بروی' }, { en: 'you’re asking if it’s far to walk', fa: 'می‌پرسی پیاده دور است یا نه' }],
			models: ["Excuse me, I'd like to go to the City Museum. How do I get there? Is it too far to walk?", 'Hi, how do I get to the City Museum from here? Can I walk there, or is it too far?'],
			hints: [{ en: 'how do I get to…?', fa: 'چطوری برم…؟' }, { en: 'too far to walk', fa: 'پیاده دوره' }]
		},
		{
			id: 'd4-slower', to: TO_DESK, names: DESK_NAMES,
			fa: 'ببخشید، یه کم تند بود. می‌شه دوباره بگید، یه کم آروم‌تر؟',
			points: [{ en: 'it was a little fast for you', fa: 'برایت کمی تند بود' }, { en: 'you’re asking them to say it again, more slowly', fa: 'می‌خواهی دوباره و آهسته‌تر بگویند' }],
			models: ['Sorry, that was a little fast. Could you say that again, more slowly?', "Sorry, I didn't catch all of that. Can you say it again a little slower?"],
			hints: [{ en: 'say that again', fa: 'دوباره بگید' }, { en: 'more slowly', fa: 'آروم‌تر' }]
		},
		{
			id: 'd4-check-way', to: TO_DESK, names: DESK_NAMES,
			fa: 'پس از هتل که اومدم بیرون، می‌پیچم راست. بعد سر چراغ دوم، کنار بانک، می‌پیچم چپ. درسته؟',
			points: [{ en: 'you turn right out of the hotel', fa: 'از هتل که بیرون آمدی، به راست می‌پیچی' }, { en: 'you turn left at the second light, at the bank', fa: 'سر چراغ دوم، کنار بانک، به چپ می‌پیچی' }],
			models: ['So I turn right out of the hotel, and then left at the second light, at the bank. Is that right?', 'Let me check: right out of the hotel, then left at the second traffic light, by the bank?'],
			hints: [{ en: 'right out of the hotel', fa: 'از هتل که اومدم بیرون، راست' }, { en: 'at the second light', fa: 'سر چراغ دوم' }]
		},
		{
			id: 'd4-bus-back', to: TO_DESK, names: DESK_NAMES,
			fa: 'اگه خسته شدم، می‌تونم با اتوبوس برگردم؟ ایستگاهش کجاست؟',
			points: [{ en: 'you’re asking if you can come back by bus if you get tired', fa: 'می‌پرسی اگر خسته شدی، می‌توانی با اتوبوس برگردی یا نه' }, { en: 'you’re asking where the bus stop is', fa: 'می‌پرسی ایستگاه اتوبوس کجاست' }],
			models: ["If I get tired, can I take the bus back? Where's the bus stop?", "Can I come back by bus if I'm tired? Where do I catch it?"],
			hints: [{ en: 'take the bus back', fa: 'با اتوبوس برگردم' }, { en: 'the bus stop', fa: 'ایستگاه اتوبوس' }]
		}
	],
	professional: [
		reused(DAY_THREE_SAY.professional, 'd3-late-checkout'),
		{
			id: 'd4-no-data', to: TO_DANIEL, level: 'B1', names: SARA_NAMES,
			fa: 'می‌خوام پیاده برم بازار یکشنبه توی پارک مرکزی. ولی گوشیم اینترنت نداره و نمی‌تونم نقشه رو ببینم. می‌شه راه رو قدم‌به‌قدم برام توضیح بدید؟',
			points: [{ en: 'you’d like to walk to the Sunday market in Central Park', fa: 'می‌خواهی پیاده به بازار یکشنبه در پارک مرکزی بروی' }, { en: 'your phone has no data, so you can’t use a map, and you’re asking him to explain the way step by step', fa: 'گوشی‌ات اینترنت ندارد و نمی‌توانی نقشه را ببینی، پس از او می‌خواهی راه را قدم‌به‌قدم توضیح بدهد' }],
			models: ["I'd like to walk to the Sunday market in Central Park. I don't have any data on my phone, so could you explain the way step by step?", "What's the best way to get to the Sunday market on foot? My phone has no data, so I can't use a map. Could you walk me through it?"],
			hints: [{ en: 'no data on my phone', fa: 'گوشیم اینترنت نداره' }, { en: 'step by step', fa: 'قدم‌به‌قدم' }]
		},
		{
			id: 'd4-way-around', to: TO_BUS_STOP, level: 'B1', names: SARA_NAMES,
			fa: 'پس اگه درست فهمیده باشم، مستقیم می‌رم تا چراغ بعدی، یعنی خیابون پاین، و می‌پیچم چپ. از کنار کتابخونه رد می‌شم و درِ فرعی پارک سمت چپمه، درسته؟',
			points: [{ en: 'you go straight to the next light, Pine Street, and turn left', fa: 'مستقیم تا چراغ بعدی، یعنی خیابان پاین، می‌روی و به چپ می‌پیچی' }, { en: 'you go past the library, and the park’s side gate is on your left, too', fa: 'از کنار کتابخانه رد می‌شوی و درِ فرعی پارک هم سمت چپت است' }],
			models: ["So if I've got this right, I keep going to the next light, Pine Street, and turn left. Then past the library, and the side gate's on the left?", 'Just to check: I go straight to Pine Street, turn left, walk past the library, and the side gate is on my left, too?'],
			hints: [{ en: 'if I’ve got this right', fa: 'اگه درست فهمیده باشم' }, { en: 'go past the library', fa: 'از کنار کتابخونه رد شم' }]
		}
	]
};
/** Both sets are used whole in the lesson. */
export const LESSON_SAY_IDS: Record<Track, string[] | null> = { intermediate: null, professional: null };

/**
 * Voice messages: two on Sunday morning, on the hotel Wi-Fi (Sara's phone has no mobile data)
 * (docs/english-day-4/phrases-and-messages.md §4). The learner replies as Sara. Daniel and Tom are
 * both Brian (`c`), as on Day 2; each message is its own scene. Both are in the lesson and the lab.
 */
const MESSAGE_NAMES = 'Daniel, Tom, Park Hotel, Main Street, Oak Street, Central Park, Riverton.';
export const MESSAGES: VoiceMessage[] = [
	{
		id: 'd4-daniel', names: MESSAGE_NAMES,
		from: { name: 'Daniel', who: { en: 'the Park Hotel front desk', fa: 'پذیرش هتل پارک' }, voice: 'c' },
		sentences: [
			"Good morning, it's Daniel at the front desk. Good news: your green backpack is here!",
			'The airline dropped it off a few minutes ago. I tried calling your room, but there was no answer.',
			'Would you like to come down and get it, or should I send it up to your room?',
			'Oh, and no rush with our charger. Just bring it back whenever you can.',
			"Are you going out today? I'm happy to suggest a few places.",
			'Have a great Sunday!'
		],
		asks: [
			{ ask: { en: 'Will you come down and get it, or should he send it up?', fa: 'خودت پایین می‌آیی و می‌گیری‌اش، یا دنیل آن را به اتاقت بفرستد؟' }, missed: { en: "You didn't say if you'll come down or if he should send it up.", fa: 'نگفتی خودت پایین می‌آیی یا دنیل آن را به اتاقت بفرستد.' } },
			{ ask: { en: 'Are you going out today?', fa: 'امروز بیرون می‌روی؟' }, missed: { en: "You didn't say if you're going out today.", fa: 'نگفتی امروز بیرون می‌روی یا نه.' } }
		],
		model: "Good morning, Daniel, and thank you! I'll come down and get it in a few minutes, and I'll bring your charger back. I'm going to the Sunday market today. Could you tell me the way later?"
	},
	{
		id: 'd4-tom', names: MESSAGE_NAMES,
		from: { name: 'Tom', who: { en: 'your friend in Riverton', fa: 'دوستت در Riverton' }, voice: 'c' },
		sentences: [
			"Hey, it's Tom! Are we still on for noon at the market?",
			"Let's meet by the fountain. The market's all around it, so you can't miss it.",
			"My car's still at the mechanic, maybe until Monday, so I'm coming by bus.",
			'Do you know how to get there from your hotel?',
			"And what time are you leaving? If you're early, get a coffee and look around.",
			'See you soon!'
		],
		asks: [
			{ ask: { en: 'Do you know how to get to the market from your hotel?', fa: 'می‌دانی از هتلت چطور به بازار بروی؟' }, missed: { en: "You didn't say how you're getting to the market.", fa: 'نگفتی چطور به بازار می‌روی.' } },
			{ ask: { en: 'What time are you leaving?', fa: 'ساعت چند راه می‌افتی؟' }, missed: { en: "You didn't say when you're leaving.", fa: 'نگفتی کی راه می‌افتی.' } }
		],
		model: "Hi Tom! Yes, see you at noon by the fountain. Daniel told me the way: right out of the hotel, then left at the second light. I'm leaving now, so I'll be early!"
	}
];
export const LESSON_MESSAGE_IDS = ['d4-daniel', 'd4-tom'];
/** The Module lab's introduction (the lesson has Mira's own). */
export const MESSAGES_INTRO: DisplayText = {
	en: 'Today, you’re Sara, in room 714 at the Park Hotel. It’s Sunday morning. You’ll get two voice messages: from Daniel at the front desk and your friend Tom. Listen, then reply with a voice message. Make sure you answer their questions.',
	fa: 'امروز جای سارا هستی، در هتل پارک، اتاق ۷۱۴. صبح یکشنبه است. دو پیام صوتی می‌گیری: از دنیل در پذیرش هتل و از دوستت تام. گوش بده و با یک پیام صوتی جواب بده. حواست باشد به سؤال‌هایشان جواب بدهی.'
};
