/**
 * How long a lesson actually takes, derived from what is in it.
 *
 * The dashboard used to print a hardcoded "~5–10 minutes" on every lesson,
 * A1 and B1 alike. The number is a promise about effort, so it has to come
 * from the content — add two paragraphs and it should move by itself,
 * without anyone remembering to edit a field.
 *
 * The per-item costs are calibrated against the seeded content: a lesson of
 * 10.8 sentences split evenly sent/received plus one grammar moment comes out
 * at ~7 minutes, which matches what those lessons really are. They are still
 * estimates — recordLessonDuration() logs the real thing so they can be
 * corrected from data rather than argued about.
 *
 * Pure functions on plain counts: no storage, no clock, no DOM.
 */

/** Seconds per item in this app's lesson flow. */
export const ITEM_SECONDS = {
	/** Hear it, repeat it. Beginner scaffolding, gone by A2. */
	word: 14,
	/** Hear it, build it from two tiles, say it. */
	collocation: 22,
	/** The other speaker's line: audio, read, continue. */
	received: 18,
	/** The learner's line: audio, tap-to-build, speak, feedback. */
	sent: 50,
	/** Short text plus its comprehension checks. */
	paragraph: 100,
	/** One rule at the end of the lesson. */
	grammarMoment: 40,
	/** One end-of-lesson exercise: read, answer, see the result. */
	exercise: 20
} as const;

export interface LessonContentCounts {
	words?: number;
	collocations?: number;
	received: number;
	sent: number;
	paragraphs?: number;
	exercises?: number;
	hasGrammarMoment?: boolean;
}

/** Total seconds a lesson's content is expected to take. */
export function estimateSeconds(c: LessonContentCounts): number {
	const n = (v: number | undefined) => (typeof v === 'number' && v > 0 ? v : 0);
	return (
		n(c.words) * ITEM_SECONDS.word +
		n(c.collocations) * ITEM_SECONDS.collocation +
		n(c.received) * ITEM_SECONDS.received +
		n(c.sent) * ITEM_SECONDS.sent +
		n(c.paragraphs) * ITEM_SECONDS.paragraph +
		n(c.exercises) * ITEM_SECONDS.exercise +
		(c.hasGrammarMoment ? ITEM_SECONDS.grammarMoment : 0)
	);
}

/**
 * Whole minutes, rounded, never zero for a lesson that has content — "0 min"
 * reads as broken, and a one-item lesson still costs the learner something.
 */
export function estimateMinutes(c: LessonContentCounts): number {
	const secs = estimateSeconds(c);
	return secs === 0 ? 0 : Math.max(1, Math.round(secs / 60));
}

/** The shape this reads off a loaded lesson. Kept loose so it does not
 *  depend on the lesson store's type and drag its imports along. */
interface LessonLike {
	sentences?: Array<{ role?: string }> | null;
	grammarNote?: unknown;
	/** Not in the data yet — the content work that adds them lands later. */
	words?: Array<{ batch?: number }> | null;
	collocations?: Array<{ batch?: number }> | null;
	paragraphs?: unknown[] | null;
	exercises?: unknown[] | null;
}

/** Count a real lesson's items. Absent fields simply count zero. */
export function countLessonContent(lesson: LessonLike | null | undefined): LessonContentCounts {
	const sentences = lesson?.sentences ?? [];
	let received = 0;
	let sent = 0;
	for (const s of sentences) {
		if (s?.role === 'received') received += 1;
		else sent += 1;
	}
	// A lesson with batched items pre-teaches only those; the rest are met in
	// the dialogue. Without batches every item is on the warm-up screen.
	const batched = [...(lesson?.words ?? []), ...(lesson?.collocations ?? [])].some((c) => c.batch !== undefined);
	const taught = (items: Array<{ batch?: number }> | null | undefined) =>
		batched ? (items ?? []).filter((c) => c.batch !== undefined).length : (items?.length ?? 0);
	return {
		words: taught(lesson?.words),
		collocations: taught(lesson?.collocations),
		received,
		sent,
		paragraphs: lesson?.paragraphs?.length ?? 0,
		exercises: lesson?.exercises?.length ?? 0,
		hasGrammarMoment: !!lesson?.grammarNote
	};
}

/** Convenience: minutes straight from a loaded lesson. */
export function lessonMinutes(lesson: LessonLike | null | undefined): number {
	return estimateMinutes(countLessonContent(lesson));
}
