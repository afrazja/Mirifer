/**
 * Day 2, "Taking a taxi": the day's content, one block per module, per version.
 * Written from one world (docs/english-day-2/world.md) and reviewed; the source text is in
 * docs/english-day-2/. Content only: the modules that show it are built once.
 */
import type { Phrase } from '../phrases';
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
