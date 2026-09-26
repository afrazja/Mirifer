import { z } from 'zod';
import { MAX_TURNS } from './hotel';

/** Small pilot record; deliberately separate from German course tables and XP. `hints` is from the earlier guided version. */
export const HotelCompletionSchema = z.object({
	completedAt: z.string().datetime(), variant: z.enum(['lift', 'street']),
	hints: z.number().int().min(0).max(6).optional(),
	turns: z.number().int().min(1).max(MAX_TURNS).optional(),
	averageWords: z.number().min(0).max(100).optional()
});
export const HotelSubmissionSchema = z.object({
	variant: z.enum(['lift', 'street']),
	goals: z.array(z.string().max(20)).max(4),
	proof: z.string().min(1).max(100),
	turns: z.number().int().min(1).max(MAX_TURNS),
	averageWords: z.number().min(0).max(100)
}).strict();
export type HotelCompletion = z.infer<typeof HotelCompletionSchema>;
