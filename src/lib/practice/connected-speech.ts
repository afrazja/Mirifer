/**
 * "Connected speech", Module lab (owner-approved in chat): how words join, shrink and lose sounds
 * in natural English. One short sentence plays at natural speed (no text); the learner taps which
 * written sentence they heard, out of three that differ only in the reduced part. Then they see how
 * it sounds next to how it's written. Checked in code, no AI. Content is per item, so daily sets
 * can be added later with the same screens.
 */
import type { DisplayText } from './hotel';

/** The voice: one natural US voice (Brian), as in the other listening modules. */
export const VOICE = 'c';
export const MAX_REPLAYS = 1;
/**
 * App-level rates. English voices are slowed to 0.8 of their own speed for learners (tts.ts), so
 * 1.3 here is the voice's real, native speed (≈1.04), where the reductions happen; the slow
 * version is careful (≈0.72).
 */
export const NATURAL_RATE = 1.3;
export const SLOW_RATE = 0.9;

export interface Pattern { label: DisplayText; tip: DisplayText }
export const PATTERNS: Pattern[] = [
	{
		label: { en: 'gonna · wanna · gotta', fa: 'gonna · wanna · gotta' },
		tip: { en: 'In fast speech, “going to” becomes “gonna”, “want to” becomes “wanna” and “got to” becomes “gotta”. Use “gonna” only before a verb: “I’m gonna call”, never “I’m gonna the shop”.', fa: 'در گفتار سریع، «going to» می‌شود «gonna»، «want to» می‌شود «wanna» و «got to» می‌شود «gotta».' }
	},
	{
		label: { en: '“you” joining in', fa: 'چسبیدن «you»' },
		tip: { en: '“you” gets short (“ya”) and joins the word before it: “did you” sounds like “didja”, “what do you” like “whaddaya”.', fa: '«you» به کلمهٔ قبلش می‌چسبد: «what do you» مثل «وادایا» و «did you» مثل «دیجا» شنیده می‌شود.' }
	},
	{
		label: { en: 'linking into a vowel', fa: 'وصل شدن به حرف صدادار' },
		tip: { en: 'A word ending in a consonant joins the next word if that word starts with a vowel sound: “turn it off” sounds like “tur-ni-doff” (in American English, a t between vowels sounds like a quick d). “Hour” starts with a vowel sound: the h is silent.', fa: 'کلمه‌ای که با صامت تمام می‌شود به کلمهٔ بعدی که با صدادار شروع می‌شود وصل می‌شود: «turn it off» مثل «تِر-نی-تاف» شنیده می‌شود.' }
	},
	{
		label: { en: 'should’ve · could’ve', fa: 'should’ve · could’ve' },
		tip: { en: '“have” after should, could or would shrinks to “’ve”, which sounds like “uv”: “should’ve” sounds like “should-uv”. It sounds like “should of”, but we write “should have” or “should’ve”.', fa: '«have» بعد از should، could یا would کوتاه می‌شود و مثل «اِو» شنیده می‌شود: «should’ve» مثل «شودِو».' }
	},
	{
		label: { en: 'dropped t and d', fa: 't و d حذف‌شده' },
		tip: { en: 'A t or d between two consonants often disappears: “next week” sounds like “nex’ week”, and “don’t know” like “dunno”.', fa: 't یا d بین دو صامت اغلب شنیده نمی‌شود: «next week» مثل «نِکس ویک» و «don’t know» مثل «دانو».' }
	},
	{
		label: { en: 'tiny “of” and “and”', fa: '«of» و «and» ریز' },
		tip: { en: 'Small words get very short: “of” sounds like “uh” and “and” like “n”. “a cup of coffee” sounds like “a cuppa coffee”.', fa: 'کلمه‌های کوچک خیلی کوتاه می‌شوند: «of» مثل «اِ»، «and» مثل «ن» و «to» مثل «تِ». «a cup of coffee» مثل «اِ کاپِ کافی».' }
	}
];

export interface ConnectedItem {
	pattern: number;
	/** What the voice reads at natural speed (spelled so it reduces). */
	spoken: string;
	/** How it sounds, for the learner. */
	soundsLike: string;
	/** Three written sentences; `answer` is the right one. */
	choices: [string, string, string];
	answer: number;
}

export const ITEMS: ConnectedItem[] = [
	{ pattern: 0, spoken: 'I’m gonna call her after lunch.', soundsLike: 'I’m gonna call ’er after lunch.', choices: ['I’m going to call her after lunch.', 'I want to call her after lunch.', 'I have to call her after lunch.'], answer: 0 },
	{ pattern: 1, spoken: 'What do ya want for dinner?', soundsLike: 'Whaddaya want for dinner?', choices: ['What did you want for dinner?', 'What do you want for dinner?', 'What are you having for dinner?'], answer: 1 },
	{ pattern: 2, spoken: 'Can you turn it off, please?', soundsLike: 'Can ya tur-ni-doff, please?', choices: ['Can you turn it on, please?', 'Can you turn them off, please?', 'Can you turn it off, please?'], answer: 2 },
	{ pattern: 3, spoken: 'I should’ve called you.', soundsLike: 'I should-uv called you.', choices: ['I should have called you.', 'I should call you.', 'I shouldn’t have called you.'], answer: 0 },
	{ pattern: 4, spoken: 'I dunno, maybe next week.', soundsLike: 'I dunno, maybe nex’ week.', choices: ['I don’t mind, maybe next week.', 'I don’t know, maybe last week.', 'I don’t know, maybe next week.'], answer: 2 },
	{ pattern: 5, spoken: 'Can I get a cup of coffee and a muffin?', soundsLike: 'Can I get a cuppa coffee ’n a muffin?', choices: ['Can I get a cup of coffee or a muffin?', 'Can I get a cup of coffee and a muffin?', 'Can I get some coffee and a muffin?'], answer: 1 },
	{ pattern: 0, spoken: 'I’ve gotta leave at six.', soundsLike: 'I’ve godda leave at six.', choices: ['I’ve got to leave at six.', 'I want to leave at six.', 'I’m going to leave at six.'], answer: 0 },
	{ pattern: 1, spoken: 'Did ya finish the report?', soundsLike: 'Didja finish the report?', choices: ['Did he finish the report?', 'Would you finish the report?', 'Did you finish the report?'], answer: 2 },
	{ pattern: 2, spoken: 'I’ll be back in an hour.', soundsLike: 'I’ll be back i-na-nour.', choices: ['I’ll be back in half an hour.', 'I’ll be back in an hour.', 'I’ll be back at noon.'], answer: 1 },
	{ pattern: 3, spoken: 'We could’ve taken a taxi.', soundsLike: 'We could-uv taken a taxi.', choices: ['We could have taken a taxi.', 'We could take a taxi.', 'We couldn’t take a taxi.'], answer: 0 }
];
/** The written (careful) form: the right choice. */
export const fullOf = (item: ConnectedItem) => item.choices[item.answer];

export interface ConnectedRecord { picks: (number | null)[]; replays: number[]; index: number; done: boolean }
export const emptyConnected = (): ConnectedRecord => ({ picks: ITEMS.map(() => null), replays: ITEMS.map(() => 0), index: 0, done: false });
export function asConnected(value: unknown): ConnectedRecord | null {
	const r = value as ConnectedRecord | null;
	if (!r || typeof r !== 'object' || typeof r.done !== 'boolean' || !Number.isInteger(r.index) || r.index < 0 || r.index > ITEMS.length) return null;
	if (!Array.isArray(r.picks) || r.picks.length !== ITEMS.length || !r.picks.every(p => p === null || (Number.isInteger(p) && p >= 0 && p < 3))) return null;
	if (!Array.isArray(r.replays) || r.replays.length !== ITEMS.length || !r.replays.every(n => Number.isInteger(n) && n >= 0)) return null;
	return r;
}

export interface ConnectedSummary {
	right: number;
	byPattern: { pattern: number; right: number; total: number }[];
	/** The pattern with the most misses (earliest on a tie); null if none were missed. */
	weakest: number | null;
}
export function summarize(record: ConnectedRecord): ConnectedSummary {
	const byPattern = PATTERNS.map((_, pattern) => ({ pattern, right: 0, total: 0 }));
	ITEMS.forEach((item, i) => {
		const row = byPattern[item.pattern];
		row.total++;
		if (record.picks[i] === item.answer) row.right++;
	});
	const missed = byPattern.filter(r => r.right < r.total);
	const weakest = missed.length ? missed.reduce((w, r) => (r.total - r.right > w.total - w.right ? r : w)).pattern : null;
	return { right: byPattern.reduce((sum, r) => sum + r.right, 0), byPattern, weakest };
}
