/**
 * "Shadowing", Module lab (docs/english-shadowing-lab-spec.md, owner-approved v2).
 * Audio only: each sentence plays at most twice, then the learner says or types exactly what
 * they heard. Checked word by word in code (no AI): homophones, the sentence's own contractions,
 * spoken reductions and spelling variants are accepted; a play counts only when audio starts.
 */
import type { DisplayText } from './hotel';

export const MAX_PLAYS = 2, ANSWER_MAX_SECONDS = 15, ANSWER_MIN_SECONDS = 1;
export const VOICE = 'c' as const; // Brian (US)

export interface LabSentence {
	text: string;
	/** Short form → the full form this sentence accepts (no global guess: 'd can be "had" or "would"). */
	contractions: Record<string, string>;
	tip: DisplayText;
}

export const SENTENCES: LabSentence[] = [
	{ text: 'We ended up staying a couple of extra days because the flights were canceled.', contractions: {},
		tip: { en: '“a couple of” sounds like “a coupla”. After it, English needs a plural: “days”, not “day”. “were” tells you there’s more than one flight.', fa: '«a couple of» شبیه «a coupla» شنیده می‌شود. بعدش انگلیسی جمع لازم دارد: «days» نه «day». «were» نشان می‌دهد بیش از یک پرواز بوده.' } },
	{ text: 'They’ve moved the meeting from the thirteenth to the thirtieth, so we’ve got a bit more time.', contractions: { "they've": 'they have', "we've": 'we have' },
		tip: { en: '“thirteenth” is strong at the end: thir-TEENTH. “thirtieth” is strong at the start: THIR-tieth. Listen for where the word is strong.', fa: 'در «thirteenth» تأکید آخر کلمه است: thir-TEENTH. در «thirtieth» تأکید اول است: THIR-tieth. گوش بده کجای کلمه قوی است.' } },
	{ text: 'Could you let me know whether you’re coming on Friday, so I can sort out the tickets?', contractions: { "you're": 'you are' },
		tip: { en: '“let me” can sound like “lemme”, and “Could you” like “couldja”. “whether” and “weather” sound the same. Here it means “if”.', fa: '«let me» می‌تواند شبیه «lemme» و «Could you» شبیه «couldja» شنیده شود. «whether» و «weather» یک‌جور تلفظ می‌شوند؛ اینجا یعنی «آیا».' } },
	{ text: 'She said she’d call me back as soon as she got out of the meeting, but she never did.', contractions: { "she'd": 'she would' },
		tip: { en: 'In “she’d call”, the d almost disappears, but it changes the meaning, so listen for it. “got out of” runs together like one word.', fa: 'در «she’d call» صدای d تقریباً گم می‌شود، اما معنی را عوض می‌کند؛ پس دنبالش گوش بده. «got out of» مثل یک کلمه به هم چسبیده.' } },
	{ text: 'I’ve been meaning to tell you that the restaurant we booked has moved to a new address.', contractions: { "i've": 'i have' },
		tip: { en: '“I’ve been” often sounds like “I been”. The v is very small. “booked” ends in a t sound, “bookt”, with no extra vowel.', fa: '«I’ve been» اغلب شبیه «I been» شنیده می‌شود؛ صدای v خیلی کوچک است. «booked» با صدای t تمام می‌شود («بوکت»)، بدون مصوت اضافه.' } },
	{ text: 'He’s the kind of person who’d rather do everything himself than ask anyone for help.', contractions: { "he's": 'he is', "who'd": 'who would' },
		tip: { en: '“kind of” sounds like “kinda”, and “who’d” (who would) sounds like “hood”. Persian has one word for he and she, so listen for “he” and “himself”.', fa: '«kind of» شبیه «kinda» و «who’d» (who would) شبیه «hood» شنیده می‌شود. فارسی برای he و she یک کلمه دارد؛ پس دنبال «he» و «himself» گوش بده.' } },
	{ text: 'By the time we got to the movie theater, the movie had already started and there weren’t any seats left.', contractions: { "weren't": 'were not' },
		tip: { en: 'In “weren’t any”, the t is almost silent, but it makes the sentence negative. “movie had” runs together.', fa: 'در «weren’t any» صدای t تقریباً شنیده نمی‌شود، اما جمله را منفی می‌کند. «movie had» به هم چسبیده.' } },
	{ text: 'If I’d known the traffic was going to be this bad, I would’ve left an hour earlier.', contractions: { "i'd": 'i had', "would've": 'would have' },
		tip: { en: '“I’d known” means “I had known”. “would’ve” sounds like “would-uv”, and “an hour” sounds like “a-nower”. The h in “hour” is silent.', fa: '«I’d known» یعنی «I had known». «would’ve» شبیه «would-uv» و «an hour» شبیه «a-nower» شنیده می‌شود. h در «hour» تلفظ نمی‌شود.' } }
];

// Normalising, the same on both sides
const REDUCTIONS: [RegExp, string][] = [
	[/\bgonna\b/g, 'going to'], [/\bwanna\b/g, 'want to'], [/\bgotta\b/g, 'got to'], [/\blemme\b/g, 'let me'], [/\bkinda\b/g, 'kind of'],
	[/\bcoupla\b/g, 'couple of'], [/\b(cause|cos|cuz)\b/g, 'because'], [/\bany one\b/g, 'anyone'], [/\bevery thing\b/g, 'everything'], [/\bhim self\b/g, 'himself'],
	[/\b13th\b/g, 'thirteenth'], [/\b30th\b/g, 'thirtieth'], [/\b(would|could|should|must|might) of\b/g, '$1 have']
];
/** Words that sound the same map to one key (a listening task: the ear can't tell them apart). */
const SAME_SOUND: Record<string, string> = {
	know: 'no', four: 'for', hear: 'here', knew: 'new', too: 'to', two: 'to', weather: 'whether', your: "you're",
	then: 'than', buy: 'by', bye: 'by', their: 'there', "they're": 'there', cancelled: 'canceled', theatre: 'theater', ok: 'okay'
};
const lower = (text: string) => text.toLowerCase().replace(/[’‘`]/g, "'");
const rawWords = (text: string) => lower(text).replace(/[^\p{L}\p{N}' ]+/gu, ' ').split(/\s+/).map(w => w.replace(/^'+|'+$/g, '')).filter(Boolean);

/** The sentence as the learner is scored on it: one entry per printed word (a contraction is one word). */
export function referenceWords(sentence: LabSentence): string[] {
	return sentence.text.split(/\s+/).map(w => w.replace(/[^\p{L}\p{N}'’]/gu, '')).filter(Boolean);
}
/** One printed word → the units it's checked as (its full form, after the same-sound keys). */
function refUnits(word: string, sentence: LabSentence): string[] {
	const w = lower(word);
	const full = sentence.contractions[w] ?? w;
	return full.split(' ').map(u => SAME_SOUND[u] ?? u);
}
/** An answer → units: reductions spelled out, the sentence's own contractions spelled out, same-sound keys. */
export function answerUnits(answer: string, sentence: LabSentence): string[] {
	let text = lower(answer);
	for (const [pattern, full] of REDUCTIONS) text = text.replace(pattern, full);
	// Phone keyboards often drop the apostrophe ("theyve"): the sentence's own short forms count without it.
	const bare = new Map(Object.keys(sentence.contractions).map(k => [k.replace(/'/g, ''), k]));
	return rawWords(text).flatMap(w => {
		const keyed = SAME_SOUND[w] ?? bare.get(w) ?? w;
		const full = sentence.contractions[keyed] ?? keyed;
		return full.split(' ').map(u => SAME_SOUND[u] ?? u);
	});
}

/** Typed only: a one-letter slip in a long word counts, unless it changes an ending (-s, -ed, -d) or makes another word of the sentence. */
function typoMatch(said: string, target: string, sentenceWords: Set<string>): boolean {
	if (target.length < 6 || said === target || sentenceWords.has(said)) return false;
	for (const end of ['s', 'ed', 'd']) if (said + end === target || target + end === said) return false;
	return editDistance(said, target) === 1;
}
function editDistance(a: string, b: string): number {
	const row = Array.from({ length: b.length + 1 }, (_, j) => j);
	for (let i = 1; i <= a.length; i++) {
		let prev = row[0]; row[0] = i;
		for (let j = 1; j <= b.length; j++) { const keep = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = keep; }
	}
	return row[b.length];
}

export interface Check { matched: boolean[]; got: number; total: number }
/** Word by word, in order (longest common sequence of units); a printed word counts when all its units matched. */
export function checkAnswer(answer: string, sentence: LabSentence, typed: boolean): Check {
	const words = referenceWords(sentence);
	const units: { unit: string; word: number }[] = words.flatMap((w, i) => refUnits(w, sentence).map(unit => ({ unit, word: i })));
	const said = answerUnits(answer, sentence);
	const vocabulary = new Set(units.map(u => u.unit));
	const same = (a: string, b: string) => a === b || (typed && typoMatch(a, b, vocabulary));
	const n = units.length, m = said.length;
	const table = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
	for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
		table[i][j] = same(said[j], units[i].unit) ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
	const hit = new Array<boolean>(n).fill(false);
	for (let i = 0, j = 0; i < n && j < m;) {
		if (same(said[j], units[i].unit)) { hit[i] = true; i++; j++; }
		else if (table[i + 1][j] >= table[i][j + 1]) i++; else j++;
	}
	const matched = words.map((_, w) => units.every((u, k) => u.word !== w || hit[k]));
	return { matched, got: matched.filter(Boolean).length, total: words.length };
}

/** The kinds of miss the result screen can name (only when one happened 3 or more times). */
const SMALL = new Set(['the', 'a', 'an', 'of', 'to', 'for', 'in', 'on', 'at', 'and', 'so', 'but', 'as', 'by', 'from']);
export type MissKind = 'small' | 'ending' | 'short';
export function missKinds(sentence: LabSentence, check: Check): MissKind[] {
	return referenceWords(sentence).flatMap((word, i) => {
		if (check.matched[i]) return [];
		const w = lower(word);
		if (/'/.test(w)) return ['short' as const];
		if (SMALL.has(w)) return ['small' as const];
		if (/(s|ed)$/.test(w) && w.length > 4) return ['ending' as const];
		return [];
	});
}
export const PATTERN_LINE: Record<MissKind, DisplayText> = {
	small: { en: 'Small words like “the” and “a” are quick and quiet. They’re easy to miss.', fa: 'کلمه‌های کوچکی مثل «the» و «a» سریع و آرام گفته می‌شوند. راحت از دست می‌روند.' },
	ending: { en: 'Word endings like -s and -ed were hard. Listen to the end of each word.', fa: 'پایانهٔ کلمه‌ها مثل -s و -ed سخت بود. به آخر هر کلمه گوش بده.' },
	short: { en: 'Short forms like ’d and ’ve were hard.', fa: 'شکل‌های کوتاه مثل ’d و ’ve سخت بود.' }
};

export interface Answer { text: string; typed: boolean; got: number; total: number; matched: boolean[] }
export interface ShadowRecord {
	index: number;
	/** Plays used per sentence: saved the moment audio starts, so a reload can't reset it. */
	plays: number[];
	answers: (Answer | null)[];
	done: boolean;
}
export const emptyShadowRecord = (): ShadowRecord => ({ index: 0, plays: SENTENCES.map(() => 0), answers: SENTENCES.map(() => null), done: false });
export function asShadowRecord(value: unknown): ShadowRecord | null {
	const r = value as ShadowRecord | null;
	if (!r || typeof r !== 'object' || typeof r.done !== 'boolean' || !Number.isInteger(r.index) || r.index < 0 || r.index > SENTENCES.length) return null;
	if (!Array.isArray(r.plays) || r.plays.length !== SENTENCES.length || !Array.isArray(r.answers) || r.answers.length !== SENTENCES.length) return null;
	return r;
}
/** The share of all words caught, over the answered sentences. */
export function caught(record: ShadowRecord): number {
	const answered = record.answers.filter((a): a is Answer => !!a);
	const total = answered.reduce((n, a) => n + a.total, 0);
	return total ? Math.round((answered.reduce((n, a) => n + a.got, 0) / total) * 100) : 0;
}
/** The pattern line, when one kind of miss happened 3 or more times. */
export function patternOf(record: ShadowRecord): MissKind | null {
	const counts = new Map<MissKind, number>();
	record.answers.forEach((a, i) => { if (a) for (const k of missKinds(SENTENCES[i], { matched: a.matched, got: a.got, total: a.total })) counts.set(k, (counts.get(k) ?? 0) + 1); });
	const top = [...counts].sort((x, y) => y[1] - x[1])[0];
	return top && top[1] >= 3 ? top[0] : null;
}
/** The hardest sentence: the lowest score, the earlier one on a tie; none if everything was 100%. */
export function hardest(record: ShadowRecord): number | null {
	let worst: number | null = null;
	record.answers.forEach((a, i) => { if (a && a.got < a.total && (worst === null || a.got / a.total < record.answers[worst]!.got / record.answers[worst]!.total)) worst = i; });
	return worst;
}
