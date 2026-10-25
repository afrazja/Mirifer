/**
 * Tap a word (owner preview): the meaning of each word in a lesson sentence, in Persian, as it is
 * used in that sentence. Written by hand for Day 1's Natural phrases (Intermediate) to try the idea;
 * the plan for every other sentence is an AI meaning written once on the first tap, then kept for
 * everyone.
 */

export interface WordGloss {
	/** The Persian meaning in this sentence. */
	fa: string;
	/** The group of words it belongs to here, when that changes the meaning ("came out"). */
	chunk?: { en: string; fa: string };
}

/** Lower case, curly apostrophes made straight, no punctuation: the key a tapped word is looked up by. */
export const wordKey = (word: string) => word.toLowerCase().replace(/’/g, "'").replace(/[^a-z']/g, '');

const CAME_OUT = { en: 'came out', fa: 'بیرون آمد؛ این‌جا یعنی روی نوار بار آمد' };
const ONE_OF = { en: 'one of my bags', fa: 'یکی از بارهایم' };
const GET_IT_BACK = { en: 'get it back', fa: 'پسش بگیرم' };
const IN_THERE = { en: 'in there', fa: 'آن تو، داخل آن (چمدان)' };
const A_NEW_ONE = { en: 'a new one', fa: 'یکی نو؛ یک مسواک تازه' };
const OH_NO = { en: 'Oh no', fa: 'ای وای' };

/** By sentence (exactly as Mira says it), then by word. */
const GLOSSES: Record<string, Record<string, WordGloss>> = {
	'Hi, only one of my bags came out.': {
		hi: { fa: 'سلام' },
		only: { fa: 'فقط' },
		one: { fa: 'یکی', chunk: ONE_OF },
		of: { fa: 'از', chunk: ONE_OF },
		my: { fa: 'ـَم، مالِ من', chunk: ONE_OF },
		bags: { fa: 'کیف‌ها؛ این‌جا یعنی بارها، چمدان‌ها', chunk: ONE_OF },
		came: { fa: 'آمد (گذشتهٔ come)', chunk: CAME_OUT },
		out: { fa: 'بیرون', chunk: CAME_OUT }
	},
	"It's a big dark blue suitcase.": {
		"it's": { fa: 'این … است (کوتاه‌شدهٔ it is)' },
		a: { fa: 'یک' },
		big: { fa: 'بزرگ' },
		dark: { fa: 'تیره؛ dark blue یعنی آبیِ تیره، سرمه‌ای' },
		blue: { fa: 'آبی' },
		suitcase: { fa: 'چمدان' }
	},
	'Oh no. So when can I get it back?': {
		oh: { fa: 'آه، وای', chunk: OH_NO },
		no: { fa: 'نه', chunk: OH_NO },
		so: { fa: 'خب، پس' },
		when: { fa: 'کِی؟ چه وقت؟' },
		can: { fa: 'می‌توانم' },
		i: { fa: 'من' },
		get: { fa: 'گرفتن', chunk: GET_IT_BACK },
		it: { fa: 'آن؛ این‌جا یعنی چمدان', chunk: GET_IT_BACK },
		back: { fa: 'پس، برگشت', chunk: GET_IT_BACK }
	},
	'My toothbrush is in there, and I need it tonight.': {
		my: { fa: 'ـَم، مالِ من' },
		toothbrush: { fa: 'مسواک' },
		is: { fa: 'است' },
		in: { fa: 'در، داخل', chunk: IN_THERE },
		there: { fa: 'آن‌جا', chunk: IN_THERE },
		and: { fa: 'و' },
		i: { fa: 'من' },
		need: { fa: 'لازم داشتن، احتیاج داشتن' },
		it: { fa: 'آن؛ این‌جا یعنی مسواک' },
		tonight: { fa: 'امشب' }
	},
	'So should I buy a new one?': {
		so: { fa: 'خب، پس' },
		should: { fa: 'باید؛ برای پرسیدن نظر: «…بخرم؟»' },
		i: { fa: 'من' },
		buy: { fa: 'خریدن' },
		a: { fa: 'یک', chunk: A_NEW_ONE },
		new: { fa: 'نو، تازه', chunk: A_NEW_ONE },
		one: { fa: 'یکی؛ این‌جا یعنی یک مسواک', chunk: A_NEW_ONE }
	}
};

/** Whether a sentence has meanings to tap. */
export const hasGlosses = (sentence: string) => sentence in GLOSSES;

/** The meaning of a word in this sentence, or null. */
export function glossFor(sentence: string, word: string): WordGloss | null {
	return GLOSSES[sentence]?.[wordKey(word)] ?? null;
}
