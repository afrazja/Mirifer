/**
 * The end of a step (owner's request, 2026-10-28): the learner's own result as a score, and one tap
 * on how much they liked the step, so we learn which steps are worth keeping. The rating is optional,
 * can be changed, and is stored as a `step_rated` event (ids and numbers only).
 */
import type { DisplayText } from './hotel';
import type { ModuleId } from './day';

export interface StepScore { correct: number; total: number }

/** What the score counts, per step type ("4 of 5 questions right"). */
const COUNTS: Partial<Record<ModuleId, DisplayText>> = {
	'listen-act': { en: 'questions right', fa: 'سؤال را درست جواب دادی' },
	'listen-retell': { en: 'key points told', fa: 'نکتهٔ اصلی را گفتی' },
	phrases: { en: 'phrases said clearly', fa: 'عبارت را واضح گفتی' },
	traps: { en: 'sentences said right', fa: 'جمله را درست گفتی' },
	'say-in-english': { en: 'messages said clearly', fa: 'پیام را واضح گفتی' },
	'say-it-better': { en: 'fixes used on your second try', fa: 'اصلاح را در بار دوم به کار بردی' },
	'voice-messages': { en: 'questions answered', fa: 'سؤال را جواب دادی' },
	'choose-persuade': { en: 'points made', fa: 'نکته را گفتی' },
	scenario: { en: 'goals reached', fa: 'هدف رسیدی' },
	'group-chat': { en: 'goals reached', fa: 'هدف رسیدی' }
};

/** The score line for a step, or null when the step gives no score. */
export function scoreLine(module: ModuleId, score: StepScore | null | undefined): { value: string; valueFa: string; label: DisplayText } | null {
	if (!score || score.total <= 0) return null;
	const correct = Math.max(0, Math.min(score.correct, score.total));
	const label = COUNTS[module] ?? { en: 'right', fa: 'درست' };
	return { value: `${correct}/${score.total}`, valueFa: `${correct.toLocaleString('fa-IR')} از ${score.total.toLocaleString('fa-IR')}`, label };
}

/** Natural phrases gives no score of its own: the phrases caught, out of all. */
export function phraseScore(record: unknown): StepScore | null {
	const items = (record as { items?: { caught: boolean | null }[] } | null)?.items;
	if (!Array.isArray(items) || !items.length) return null;
	return { correct: items.filter(item => item?.caught === true).length, total: items.length };
}

/** Five faces, least to most liked. */
export const RATINGS: { value: 1 | 2 | 3 | 4 | 5; face: string; label: DisplayText }[] = [
	{ value: 1, face: '😞', label: { en: 'Not at all', fa: 'اصلاً' } },
	{ value: 2, face: '🙁', label: { en: 'Not much', fa: 'نه زیاد' } },
	{ value: 3, face: '😐', label: { en: 'It was OK', fa: 'معمولی' } },
	{ value: 4, face: '🙂', label: { en: 'I liked it', fa: 'خوشم آمد' } },
	{ value: 5, face: '😍', label: { en: 'I loved it', fa: 'خیلی دوستش داشتم' } }
];
export const isRating = (value: unknown): value is 1 | 2 | 3 | 4 | 5 => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 5;

export interface RatingRow { user_id: string; day: number | null; occurred_at: string; metadata: Record<string, unknown> }
/**
 * How learners rate each step, for the admin: per chapter, version and step type, each learner's
 * latest rating counted once.
 */
export function summarizeRatings(rows: RatingRow[]) {
	const latest = new Map<string, RatingRow>();
	for (const row of rows) {
		if (!isRating(row.metadata.rating) || typeof row.metadata.module !== 'string') continue;
		const key = `${row.user_id}|${row.day}|${row.metadata.track}|${row.metadata.module}`;
		const seen = latest.get(key);
		if (!seen || Date.parse(row.occurred_at) > Date.parse(seen.occurred_at)) latest.set(key, row);
	}
	const groups = new Map<string, { day: number; track: string; module: string; counts: number[] }>();
	for (const row of latest.values()) {
		const track = String(row.metadata.track ?? 'intermediate'), module = String(row.metadata.module);
		const key = `${row.day}|${track}|${module}`;
		const group = groups.get(key) ?? { day: row.day ?? 0, track, module, counts: [0, 0, 0, 0, 0] };
		group.counts[(row.metadata.rating as number) - 1]++;
		groups.set(key, group);
	}
	return [...groups.values()].map(group => {
		const count = group.counts.reduce((a, b) => a + b, 0);
		const average = group.counts.reduce((sum, n, i) => sum + n * (i + 1), 0) / count;
		return { ...group, count, average: Math.round(average * 10) / 10 };
	}).sort((a, b) => a.average - b.average || b.count - a.count);
}
