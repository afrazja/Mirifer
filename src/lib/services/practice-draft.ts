import { z } from 'zod';
import { GOAL_IDS, MAX_REPLY, MAX_TURNS } from '$lib/practice/hotel';

const Text = { en: z.string().max(300), fa: z.string().max(300) };
const Draft = z.object({
	variant: z.enum(['lift', 'street']),
	turns: z.array(z.object({ speaker: z.enum(['reception', 'learner']), text: z.string().min(1).max(Math.max(MAX_REPLY, 400)) })).min(1).max(MAX_TURNS * 2 + 1),
	goals: z.array(z.enum(GOAL_IDS as [string, ...string[]])).max(GOAL_IDS.length),
	proof: z.string().max(100).nullable(),
	corrections: z.array(z.object({ original: z.string().max(MAX_REPLY), improved: z.string().max(MAX_REPLY + 100), note: z.object(Text) })).max(MAX_TURNS),
	/** Voice signatures for Jamie's AI-written lines, keyed by line. */
	voice: z.record(z.string().max(400), z.string().max(100)).optional(),
	done: z.boolean().optional()
});
export type PracticeDraft = z.infer<typeof Draft>;
const key = (userId: string) => `mirifer_practice:${encodeURIComponent(userId)}:en:hotel-v2`;

/** Tab-local, account-scoped. Learner text is never part of a server save. */
export function loadPracticeDraft(userId: string): PracticeDraft | null {
	try {
		const parsed = Draft.safeParse(JSON.parse(sessionStorage.getItem(key(userId)) ?? 'null'));
		return parsed.success ? parsed.data : null;
	} catch { return null; }
}
export function savePracticeDraft(userId: string, draft: PracticeDraft): void {
	try { sessionStorage.setItem(key(userId), JSON.stringify(Draft.parse(draft))); } catch { /* The current session still works when storage is unavailable. */ }
}
export function clearPracticeDraft(userId: string): void {
	try { sessionStorage.removeItem(key(userId)); } catch { /* unavailable */ }
}
