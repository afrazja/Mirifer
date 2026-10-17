/**
 * "Minimal pairs duel", Module lab (owner-approved in chat): the English sound pairs Persian
 * speakers mix up. One word plays; the learner taps which of the two it was. Twelve duels (six
 * sound pairs × two word pairs), the spoken word picked at random. Checked in code, no AI.
 * Speaking is record-and-compare only (not scored): speech-to-text can't judge these sounds.
 */
import type { DisplayText } from './hotel';

/** The voice: one natural US voice (Brian), as in Shadowing and Dictation sprint. */
export const VOICE = 'c';
export const MAX_REPLAYS = 1;
export const SAY_MAX_SECONDS = 5;

export interface Contrast { label: DisplayText; pairs: [string, string][]; tip: DisplayText }
export const CONTRASTS: Contrast[] = [
	{
		label: { en: 'short i / long ee', fa: 'i کوتاه / ee کشیده' }, pairs: [['ship', 'sheep'], ['live', 'leave']],
		tip: { en: '“ship” is short and relaxed. “sheep” is longer, with a smile: “sheeeep”.', fa: '«ship» کوتاه و شل است. «sheep» کشیده‌تر است، با لبخند: «شیییپ».' }
	},
	{
		label: { en: 'a / e', fa: 'a / e' }, pairs: [['bad', 'bed'], ['man', 'men']],
		tip: { en: 'For “bad”, open your mouth wide, almost like a yawn. For “bed”, open it only a little.', fa: 'برای «bad» دهانت را زیاد باز کن، تقریباً مثل خمیازه. برای «bed» فقط کمی بازش کن.' }
	},
	{
		label: { en: 'v / w', fa: 'v / w' }, pairs: [['vest', 'west'], ['vine', 'wine']],
		tip: { en: 'For “v”, your top teeth touch your bottom lip. For “w”, round your lips like a small “oo”, with no teeth.', fa: 'برای «v» دندان‌های بالا روی لب پایین می‌آیند. برای «w» لب‌ها را مثل «او» گرد کن، بدون دندان.' }
	},
	{
		label: { en: 'b / v', fa: 'b / v' }, pairs: [['berry', 'very'], ['boat', 'vote']],
		tip: { en: 'For “b”, close both lips, then open them. For “v”, your top teeth touch your bottom lip and the air keeps going.', fa: 'برای «b» هر دو لب را ببند و باز کن. برای «v» دندان‌های بالا روی لب پایین می‌آیند و هوا قطع نمی‌شود.' }
	},
	{
		label: { en: 'th / s', fa: 'th / s' }, pairs: [['think', 'sink'], ['mouth', 'mouse']],
		tip: { en: 'For “th”, put your tongue between your teeth and blow gently. For “s”, your tongue stays behind your teeth.', fa: 'برای «th» نوک زبان را بین دندان‌ها بگذار و آرام فوت کن. برای «s» زبان پشت دندان‌ها می‌ماند.' }
	},
	{
		label: { en: 'th / t', fa: 'th / t' }, pairs: [['three', 'tree'], ['thin', 'tin']],
		tip: { en: 'For “th”, your tongue is between your teeth and the air keeps going. For “t”, your tongue taps behind your top teeth and stops the air.', fa: 'برای «th» زبان بین دندان‌هاست و هوا ادامه دارد. برای «t» زبان پشت دندان‌های بالا می‌زند و هوا را قطع می‌کند.' }
	}
];

export type Side = 0 | 1;
export interface Duel { contrast: number; pair: number; target: Side }
export interface PairsRecord {
	duels: Duel[];
	/** Which word they tapped, per duel. */
	picks: (Side | null)[];
	/** Replays used, per duel. */
	replays: number[];
	index: number;
	done: boolean;
	/** A practice round of only the sounds they missed (its score isn't the main one). */
	practice: boolean;
}

export const pairOf = (duel: Duel) => CONTRASTS[duel.contrast].pairs[duel.pair];
export const wordOf = (duel: Duel) => pairOf(duel)[duel.target];

function shuffle<T>(list: T[], rand: () => number): T[] {
	const out = [...list];
	for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
	return out;
}
/** Shuffled, but never the same sound pair twice in a row when that can be avoided. */
function spread(duels: Duel[], rand: () => number): Duel[] {
	let best = shuffle(duels, rand);
	for (let tries = 0; tries < 30 && best.some((d, i) => i > 0 && best[i - 1].contrast === d.contrast); tries++) best = shuffle(duels, rand);
	return best;
}
const fresh = (duels: Duel[], practice: boolean): PairsRecord => ({ duels, picks: duels.map(() => null), replays: duels.map(() => 0), index: 0, done: false, practice });

/** Twelve duels: every word pair once, the spoken word at random. */
export function newRound(rand: () => number = Math.random): PairsRecord {
	const duels = CONTRASTS.flatMap((c, contrast) => c.pairs.map((_, pair) => ({ contrast, pair, target: (rand() < 0.5 ? 0 : 1) as Side })));
	return fresh(spread(duels, rand), false);
}
/** Only the sound pairs they missed: each word pair, each word once. */
export function practiceRound(missed: number[], rand: () => number = Math.random): PairsRecord {
	const duels = missed.flatMap(contrast => CONTRASTS[contrast].pairs.flatMap((_, pair) => ([0, 1] as Side[]).map(target => ({ contrast, pair, target }))));
	return fresh(spread(duels, rand), true);
}

export function asPairsRecord(value: unknown): PairsRecord | null {
	const r = value as PairsRecord | null;
	if (!r || typeof r !== 'object' || !Array.isArray(r.duels) || !r.duels.length || typeof r.done !== 'boolean') return null;
	if (!r.duels.every(d => d && CONTRASTS[d.contrast]?.pairs[d.pair] && (d.target === 0 || d.target === 1))) return null;
	const n = r.duels.length;
	if (!Array.isArray(r.picks) || r.picks.length !== n || !r.picks.every(p => p === null || p === 0 || p === 1)) return null;
	if (!Array.isArray(r.replays) || r.replays.length !== n || !Number.isInteger(r.index) || r.index < 0 || r.index > n) return null;
	return { ...r, practice: r.practice === true };
}

export interface PairsSummary {
	right: number;
	total: number;
	/** Per sound pair in this round: right of total. */
	byContrast: { contrast: number; right: number; total: number }[];
	/** The sound pair with the most misses (earliest on a tie); null if none were missed. */
	weakest: number | null;
	missed: number[];
}
export function summarize(record: PairsRecord): PairsSummary {
	const byContrast: PairsSummary['byContrast'] = [];
	record.duels.forEach((duel, i) => {
		let row = byContrast.find(r => r.contrast === duel.contrast);
		if (!row) { row = { contrast: duel.contrast, right: 0, total: 0 }; byContrast.push(row); }
		row.total++;
		if (record.picks[i] === duel.target) row.right++;
	});
	byContrast.sort((a, b) => a.contrast - b.contrast);
	const missed = byContrast.filter(r => r.right < r.total);
	const weakest = missed.length ? missed.reduce((w, r) => (r.total - r.right > w.total - w.right ? r : w)).contrast : null;
	const right = byContrast.reduce((sum, r) => sum + r.right, 0);
	return { right, total: record.duels.length, byContrast, weakest, missed: missed.map(r => r.contrast) };
}

/** A word to say in the on-device pronunciation check (Module lab experiment). */
export interface CheckWord { contrast: number; pair: [string, string]; target: Side }
/** With a perfect ear: one word per sound pair, the side Persian speakers usually find harder. */
const PERFECT_EAR: [number, number, Side][] = [[0, 0, 0], [1, 0, 0], [2, 0, 1], [3, 1, 1], [4, 0, 0], [5, 0, 0]];
/** The words to say: every word of their hardest sound pair, or one from each pair. */
export function checkList(weakest: number | null): CheckWord[] {
	if (weakest !== null && CONTRASTS[weakest]) return CONTRASTS[weakest].pairs.flatMap(pair => ([0, 1] as Side[]).map(target => ({ contrast: weakest, pair, target })));
	return PERFECT_EAR.map(([contrast, pair, target]) => ({ contrast, pair: CONTRASTS[contrast].pairs[pair], target }));
}
