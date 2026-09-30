/**
 * Zod schemas for lesson-related Supabase table responses.
 * Applied at the data boundary — before mapping to domain types.
 */

import { z } from 'zod';

// ── lessons table ─────────────────────────────────────────────────────────────

export const LessonRowSchema = z.object({
	day: z.number().int().positive(),
	title: z.string(),
	title_fa: z.string().nullable(),
	group: z.string(),
	sort_order: z.number().int().nullable().optional(),
	difficulty: z.string().nullable().optional()
});

export type LessonRow = z.infer<typeof LessonRowSchema>;

/**
 * The "grammar moment" shown after the last sentence of a lesson —
 * consolidation of the pattern the learner just practised, not a lecture
 * before it. Stored as JSONB on `lessons.grammar_note` (same composite-
 * content approach as `basics_sections`), so adding fields needs no
 * migration. `basics_key` deep-links into an existing Basics category.
 */
export const GrammarNoteSchema = z.object({
	title: z.string(),
	title_fa: z.string().optional(),
	explanation: z.string(),
	explanation_fa: z.string().optional(),
	examples: z
		.array(
			z.object({
				de: z.string(),
				en: z.string().optional(),
				fa: z.string().optional()
			})
		)
		.optional(),
	basics_key: z.string().optional()
});

export type GrammarNoteRow = z.infer<typeof GrammarNoteSchema>;

// Single lesson row (id + title + quality fields, used in loadLesson)
export const LessonDetailRowSchema = z.object({
	id: z.string().uuid(),
	title: z.string(),
	title_fa: z.string().nullable(),
	description: z.string().nullable().optional(),
	description_fa: z.string().nullable().optional(),
	grammar_focus: z.string().nullable().optional(),
	grammar_focus_fa: z.string().nullable().optional(),
	// Unparsed here on purpose: a malformed note must not invalidate the whole
	// lesson row. loadLesson() validates it separately and drops it if bad.
	grammar_note: z.unknown().nullable().optional(),
	// Same treatment as grammar_note: validated separately so one malformed
	// chunk drops itself rather than taking the lesson down.
	words: z.unknown().nullable().optional(),
	collocations: z.unknown().nullable().optional(),
	paragraphs: z.unknown().nullable().optional(),
	// Validated separately too: a malformed goal list drops itself.
	goals: z.unknown().nullable().optional(),
	// Each exercise validates on its own in parseExercises().
	exercises: z.unknown().nullable().optional(),
	difficulty: z.string().nullable().optional()
});

/**
 * One thing the learner can do after the lesson ("Say your age"). `sentences`
 * are the 0-based positions of the lines that practise it; the goal counts as
 * done once the learner has moved past all of them.
 */
export const LessonGoalSchema = z.object({
	id: z.string().min(1),
	en: z.string().min(1),
	fa: z.string().optional().default(''),
	sentences: z.array(z.number().int().nonnegative()).min(1)
});
export const LessonGoalListSchema = z.array(LessonGoalSchema);

/** A pre-taught vocabulary item or a collocation — same shape, different job. */
export const LessonChunkSchema = z.object({
	de: z.string().min(1),
	en: z.string().optional().default(''),
	fa: z.string().optional().default('')
});

export const LessonChunkListSchema = z.array(LessonChunkSchema);

/** A short reading text with its comprehension questions. */
export const LessonParagraphSchema = z.object({
	de: z.string().min(1),
	en: z.string().optional().default(''),
	fa: z.string().optional().default(''),
	questions: z
		.array(
			z.object({
				q: z.string().min(1),
				options: z.array(z.string()).min(2),
				correct: z.number().int().min(0)
			})
		)
		.optional()
		.default([])
});

export const LessonParagraphListSchema = z.array(LessonParagraphSchema);

export type LessonDetailRow = z.infer<typeof LessonDetailRowSchema>;

// ── sentences table ───────────────────────────────────────────────────────────

export const SentenceRowSchema = z.object({
	sentence_order: z.number().int().nonnegative(),
	role: z.enum(['sent', 'received']),
	audio_text: z.string().nullable(),
	target_text: z.string().nullable(),
	translation: z.string(),
	translation_fa: z.string().nullable(),
	hint: z.string().nullable().optional(),
	hint_fa: z.string().nullable().optional(),
	difficulty: z.string().nullable().optional()
});

export type SentenceRow = z.infer<typeof SentenceRowSchema>;

// ── glossary table ────────────────────────────────────────────────────────────

export const GlossaryRowSchema = z.object({
	word: z.string(),
	en: z.string(),
	fa: z.string()
});

export type GlossaryRow = z.infer<typeof GlossaryRowSchema>;
