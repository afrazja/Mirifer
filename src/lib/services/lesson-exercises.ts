/**
 * The end-of-lesson exercises: a short check that the learner understood the
 * topic, not a test with consequences.
 *
 * Four kinds, all answerable without typing:
 *   listen  hear a German line, pick what it means
 *   choice  a question with options (meaning, or which German line fits)
 *   fill    a German sentence with a gap, pick the word that fits
 *   order   put the tiles of a German sentence in order
 *
 * Stored on `lessons.exercises` as JSON. Each exercise validates on its own,
 * so one malformed item drops itself rather than the whole set.
 */
import { z } from 'zod';
import { tokenizeForBuild, shuffleTiles, isBuildCorrect } from '$services/sentence-build';

/** An option is German text, or a meaning that needs both languages. */
const OptionSchema = z.union([
	z.string().min(1),
	z.object({ en: z.string().min(1), fa: z.string().optional().default('') })
]);

const TextSchema = z.object({ en: z.string().min(1), fa: z.string().optional().default('') });

const ExerciseSchema = z
	.object({
		id: z.string().min(1),
		type: z.enum(['listen', 'choice', 'fill', 'order']),
		/** German text: what is heard (listen), the gapped sentence (fill), the sentence to build (order). */
		de: z.string().optional(),
		/** The question or the meaning to build, in both languages. */
		prompt: TextSchema.optional(),
		options: z.array(OptionSchema).min(2).optional(),
		/** Index into options. */
		answer: z.number().int().nonnegative().optional(),
		/** Shown after answering, right or wrong. */
		explain: TextSchema.optional(),
		/**
		 * When it is asked: "batch-2" right after the second pre-teaching batch,
		 * or a 0-based sentence index for a check right after that line. Left
		 * out, it belongs to the closing set at the end of the lesson.
		 */
		after: z.union([z.string().regex(/^batch-[1-9][0-9]*$/), z.number().int().nonnegative()]).optional()
	})
	.superRefine((ex, ctx) => {
		const need = (ok: boolean, message: string) => {
			if (!ok) ctx.addIssue({ code: 'custom', message });
		};
		if (ex.type === 'order') {
			need(!!ex.de && tokenizeForBuild(ex.de).length >= 2, 'order needs a sentence of two or more words');
			return;
		}
		need(!!ex.options && ex.answer !== undefined && ex.answer < ex.options.length, 'needs options and a valid answer');
		if (ex.type === 'listen') need(!!ex.de, 'listen needs the German line');
		if (ex.type === 'fill') need(!!ex.de && ex.de.includes('___'), 'fill needs a sentence with ___');
		if (ex.type === 'choice') need(!!ex.prompt, 'choice needs a question');
	});

export type LessonExercise = z.infer<typeof ExerciseSchema>;
export type ExerciseOption = z.infer<typeof OptionSchema>;

/** Keep every exercise that validates. Returns undefined when none do. */
export function parseExercises(raw: unknown, onDrop?: (message: string) => void): LessonExercise[] | undefined {
	if (!Array.isArray(raw)) return undefined;
	const kept: LessonExercise[] = [];
	for (const item of raw) {
		const r = ExerciseSchema.safeParse(item);
		if (r.success) kept.push(r.data);
		else onDrop?.(r.error.message);
	}
	return kept.length ? kept : undefined;
}

/** The text of an option in the learner's language. */
export function optionText(option: ExerciseOption, lang: 'en' | 'fa'): string {
	if (typeof option === 'string') return option;
	return (lang === 'fa' && option.fa) || option.en;
}

/** A localized line, falling back to English. */
export function localized(text: { en: string; fa?: string } | undefined, lang: 'en' | 'fa'): string {
	if (!text) return '';
	return (lang === 'fa' && text.fa) || text.en;
}

/** Whether the chosen option is the answer. */
export function isOptionCorrect(ex: LessonExercise, index: number): boolean {
	return ex.answer === index;
}

/** The German sentence around the gap of a fill exercise. */
export function fillParts(ex: LessonExercise): [string, string] {
	const [before = '', ...rest] = (ex.de ?? '').split('___');
	return [before, rest.join('___')];
}

/** The tiles for an order exercise, shuffled. */
export function orderTiles(ex: LessonExercise, rand?: () => number): string[] {
	return shuffleTiles(tokenizeForBuild(ex.de ?? ''), rand);
}

export function isOrderCorrect(ex: LessonExercise, attempt: string[]): boolean {
	return isBuildCorrect(attempt, tokenizeForBuild(ex.de ?? ''));
}

/**
 * The German to speak aloud for an exercise, if any. A fill exercise is
 * spoken complete (with the right word in the gap), so it is only played once
 * the learner has answered.
 */
export function exerciseAudio(ex: LessonExercise): string | null {
	if (ex.type === 'listen' || ex.type === 'order') return ex.de ?? null;
	if (ex.type === 'fill') {
		const answer = ex.options?.[ex.answer ?? -1];
		return typeof answer === 'string' && ex.de ? ex.de.replace('___', answer) : null;
	}
	return null;
}
