/**
 * How a lesson is sequenced around its dialogue.
 *
 * Pre-teaching happens in small batches, one item at a time, each batch
 * followed by a quick check. Short checks are asked mid-dialogue, right after
 * the line they test. The closing set comes at the very end.
 *
 * Content drives it: an item joins a batch through `batch` on its words or
 * collocations entry, and an exercise is placed through `after`. A lesson
 * with no batched items keeps the older one-screen warm-up.
 *
 * Pure functions on the lesson data: no store, no DOM.
 */
import type { LessonChunk } from '$stores/lesson';
import type { LessonExercise } from './lesson-exercises';

export interface TeachItem {
	de: string;
	en: string;
	fa: string;
	/** A phrase or frame to learn whole, as opposed to a single word. */
	phrase: boolean;
}

export type PracticeBlock =
	| { kind: 'teach'; batch: number; of: number; items: TeachItem[] }
	| { kind: 'check'; stage: 'batch' | 'mid'; exercises: LessonExercise[] };

interface PlanInput {
	words?: LessonChunk[];
	collocations?: LessonChunk[];
	exercises?: LessonExercise[];
}

/** True when any word or phrase is assigned to a batch. */
export function hasBatches(lesson: PlanInput | null | undefined): boolean {
	return [...(lesson?.words ?? []), ...(lesson?.collocations ?? [])].some((c) => c.batch !== undefined);
}

/** The pre-dialogue blocks, in order: each batch, then its quick check. */
export function buildBatchPlan(lesson: PlanInput): PracticeBlock[] {
	const tagged: Array<TeachItem & { batch: number }> = [];
	for (const w of lesson.words ?? []) if (w.batch !== undefined) tagged.push({ de: w.de, en: w.en, fa: w.fa, phrase: false, batch: w.batch });
	for (const c of lesson.collocations ?? []) if (c.batch !== undefined) tagged.push({ de: c.de, en: c.en, fa: c.fa, phrase: true, batch: c.batch });

	const numbers = [...new Set(tagged.map((t) => t.batch))].sort((a, b) => a - b);
	const blocks: PracticeBlock[] = [];
	for (const n of numbers) {
		// Words first, then phrases, each keeping the order the content gives.
		const items = tagged.filter((t) => t.batch === n).map(({ batch: _b, ...item }) => item);
		items.sort((a, b) => Number(a.phrase) - Number(b.phrase));
		blocks.push({ kind: 'teach', batch: n, of: numbers.length, items });
		const check = (lesson.exercises ?? []).filter((e) => e.after === `batch-${n}`);
		if (check.length) blocks.push({ kind: 'check', stage: 'batch', exercises: check });
	}
	return blocks;
}

/** Exercises to ask right after the sentence at `index` (0-based). */
export function midChecksAfter(lesson: PlanInput, index: number): LessonExercise[] {
	return (lesson.exercises ?? []).filter((e) => e.after === index);
}

/** The closing set: every exercise not placed earlier. */
export function finalExercises(lesson: PlanInput): LessonExercise[] {
	return (lesson.exercises ?? []).filter((e) => e.after === undefined);
}
