/**
 * Day 2, "Taking a taxi": the day's content, one block per module, per version.
 * Written from one world (docs/english-day-2/world.md) and reviewed; the source text is in
 * docs/english-day-2/. Content only: the modules that show it are built once.
 */
import type { Phrase } from '../phrases';
import type { ConnectSet, Line, Part, Speaker } from '../listen-connect';
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
