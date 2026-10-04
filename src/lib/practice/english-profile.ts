/**
 * The English learner's profile from onboarding: the least we keep on our
 * server to fit practice to them. Three answers and when they gave them,
 * nothing typed or spoken.
 *
 * - reason: which situations to practise first, and the gist for the AI coach.
 * - comfort: only a starting point. Difficulty then follows how the learner
 *   actually does, never this answer alone.
 * - minutes: the default session length (the learner can change it each day).
 */
import { z } from 'zod';

export const REASONS = ['travel', 'work', 'exam', 'abroad', 'everyday'] as const;
export const COMFORT = ['hard', 'simple', 'natural'] as const;
export const MINUTES = [15, 20] as const;

export const EnglishProfileSchema = z.object({
	reason: z.enum(REASONS).nullable(),
	comfort: z.enum(COMFORT).nullable(),
	minutes: z.union([z.literal(15), z.literal(20)]),
	skipped: z.boolean(),
	completedAt: z.string().datetime()
}).strict();
export type EnglishProfile = z.infer<typeof EnglishProfileSchema>;

/** What the learner submits; the server adds the time. */
export const EnglishProfileAnswersSchema = EnglishProfileSchema.omit({ completedAt: true }).strict();
export type EnglishProfileAnswers = z.infer<typeof EnglishProfileAnswersSchema>;

export const SKIPPED_PROFILE: EnglishProfileAnswers = { reason: null, comfort: null, minutes: 15, skipped: true };

export function readEnglishProfile(meta: Record<string, unknown> | undefined | null): EnglishProfile | null {
	const parsed = EnglishProfileSchema.safeParse(meta?.english_profile_v1);
	return parsed.success ? parsed.data : null;
}
