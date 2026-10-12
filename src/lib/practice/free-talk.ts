/**
 * "60-second free talk", the session's boss level (docs/english-free-talk-spec.md).
 * A surprise topic, no preparation, sixty seconds of talk. The feedback is numbers only
 * (words and long pauses, against the learner's own earlier runs): no AI judging.
 */
import type { DisplayText } from './hotel';

export const TALK_SECONDS = 60, COUNTDOWN = 3;
/** Quiet this long (after the first speech) shows the "Keep going" hint. */
export const NUDGE_AFTER = 5;
/** A run stopped before this doesn't count toward "best" or "last time". */
export const FULL_RUN_SECONDS = 50;
/** Less actual speech than this is never sent. */
export const MIN_VOICED_SECONDS = 5;
export const KEEP_RUNS = 20;

export const TOPICS: DisplayText[] = [
	{ en: 'Your favourite season', fa: 'فصلِ موردعلاقه‌ات' },
	{ en: 'Something you bought recently', fa: 'چیزی که اخیراً خریدی' },
	{ en: 'An app you use every day', fa: 'اپلیکیشنی که هر روز از آن استفاده می‌کنی' },
	{ en: 'A food from your childhood', fa: 'غذایی از دوران کودکی‌ات' },
	{ en: 'Your perfect weekend', fa: 'آخر هفتهٔ ایده‌آلت' },
	{ en: 'Something that makes you smile', fa: 'چیزی که لبخند به لبت می‌آورد' },
	{ en: 'A place where you feel calm', fa: 'جایی که در آن آرامش داری' },
	{ en: 'The last film or series you watched', fa: 'آخرین فیلم یا سریالی که دیدی' },
	{ en: 'Your morning routine', fa: 'کارهای هر روز صبحت' },
	{ en: 'Something you’re looking forward to', fa: 'چیزی که منتظرش هستی' },
	{ en: 'How you get around your city', fa: 'چطور در شهرت رفت‌وآمد می‌کنی' },
	{ en: 'A skill you’d love to have', fa: 'مهارتی که دوست داشتی داشته باشی' }
];
/** A random topic, never the same as the last one. */
export function pickTopic(last: number | null, random = Math.random): number {
	const options = TOPICS.map((_, i) => i).filter(i => i !== last);
	return options[Math.floor(random() * options.length)] ?? 0;
}

export interface Run {
	topic: number; words: number; pauses: number; seconds: number; at: number;
	/** False when stopped early: saved, but never "best" or "last time". */
	full: boolean;
}

const FILLERS = new Set(['um', 'uh', 'er', 'erm', 'hmm', 'ah', 'mm', 'umm', 'uhm']);
/**
 * The same rules every time, so runs can be compared: fillers don't count, a word said twice in a
 * row counts once ("I I I" = 1), a contraction or a number is one word.
 */
export function countWords(transcript: string): number {
	const list = transcript.toLowerCase().replace(/[’`]/g, "'").split(/[^\p{L}\p{N}']+/u).filter(w => w && w !== "'" && !FILLERS.has(w));
	return list.filter((w, i) => w !== list[i - 1]).length;
}

/** Full runs only: these are what "last time", "best" and "usual" are made of. */
export const fullRuns = (runs: Run[]) => runs.filter(r => r.full !== false);
export const bestWords = (runs: Run[]) => fullRuns(runs).reduce((best, run) => Math.max(best, run.words), 0);
/** The middle of the last five full runs, shown once there are three; topics differ, so one run is noisy. */
export function usualWords(runs: Run[]): number | null {
	const last = fullRuns(runs).slice(-5).map(r => r.words).sort((a, b) => a - b);
	return last.length >= 3 ? last[Math.floor(last.length / 2)] : null;
}

/** Mira's one line, chosen in code. Fewer pauses is praised only when they didn't simply say less. */
export function resultLine(run: Run, previous: Run | null, bestBefore: number): DisplayText {
	if (!run.full) return { en: 'You stopped early, so this one doesn’t count toward your best.', fa: 'زود تمام کردی، پس این یکی در رکوردت حساب نمی‌شود.' };
	if (!previous) return { en: 'That’s your first score. Next time, see if you can beat it.', fa: 'این اولین امتیاز توست. دفعهٔ بعد ببین می‌توانی از آن بهتر شوی یا نه.' };
	if (run.words > bestBefore) return { en: `New best: ${run.words} words!`, fa: `رکورد تازه: ${run.words.toLocaleString('fa-IR')} کلمه!` };
	const moreWords = run.words > previous.words, heldWords = run.words >= previous.words * 0.9, fewerPauses = run.pauses < previous.pauses;
	if (moreWords && fewerPauses) return { en: 'More words and fewer long pauses than last time. Great run.', fa: 'کلمه‌های بیشتر و مکث‌های طولانیِ کمتر از دفعهٔ قبل. عالی بود.' };
	if (moreWords) return { en: 'You said more than last time. Nice work.', fa: 'بیشتر از دفعهٔ قبل حرف زدی. آفرین.' };
	if (fewerPauses && heldWords) return { en: 'Fewer long pauses than last time. You kept going.', fa: 'مکث‌های طولانی‌ات کمتر از دفعهٔ قبل بود. ادامه دادی.' };
	return { en: 'Some topics are harder than others. Every try makes the next one easier.', fa: 'بعضی موضوع‌ها سخت‌ترند. هر تلاش، دفعهٔ بعد را آسان‌تر می‌کند.' };
}
export const pausesText = (n: number): DisplayText => n === 0 ? { en: 'no long pauses', fa: 'بدون مکث طولانی' } : n === 1 ? { en: '1 long pause', fa: '۱ مکث طولانی' } : { en: `${n} long pauses`, fa: `${n.toLocaleString('fa-IR')} مکث طولانی` };

export interface FreeTalkRecord { runs: Run[]; lastTopic: number | null; lastTranscript: string | null }
export const emptyFreeTalk = (): FreeTalkRecord => ({ runs: [], lastTopic: null, lastTranscript: null });
export function asFreeTalk(value: unknown): FreeTalkRecord | null {
	const r = value as FreeTalkRecord | null;
	if (!r || typeof r !== 'object' || !Array.isArray(r.runs)) return null;
	const runs = r.runs.filter(x => x && typeof x.words === 'number' && typeof x.pauses === 'number' && Number.isInteger(x.topic)).map(x => ({ ...x, full: x.full !== false })).slice(-KEEP_RUNS);
	return { runs, lastTopic: Number.isInteger(r.lastTopic) ? r.lastTopic : null, lastTranscript: typeof r.lastTranscript === 'string' ? r.lastTranscript : null };
}
