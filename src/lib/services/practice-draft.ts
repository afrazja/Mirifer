import { z } from 'zod';
import { applyHotelChoice, replyToHotel, startHotel, STAGES, type Stage } from '$lib/practice/hotel';

const Draft = z.object({ variant: z.enum(['lift', 'street']), replies: z.array(z.string().min(1).max(300)).max(40), resolved: z.array(z.string().nullable()).max(40).optional(), hints: z.array(z.enum(['problem', 'room', 'offer', 'alternative', 'confirm', 'recall'])).max(6) });
export type PracticeDraft = z.infer<typeof Draft>;
const key = (userId: string) => `mirifer_practice:${encodeURIComponent(userId)}:en:hotel-v1`;

/** Tab-local, account-scoped. Learner text is never part of a server save. */
export function loadPracticeDraft(userId: string): PracticeDraft | null {
	try {
		const parsed = Draft.safeParse(JSON.parse(sessionStorage.getItem(key(userId)) ?? 'null'));
		if (!parsed.success) return null;
		let state = startHotel(parsed.data.variant);
		for (const [index, reply] of parsed.data.replies.entries()) {
			const choiceId = parsed.data.resolved?.[index];
			const result = choiceId ? applyHotelChoice(state, choiceId, reply) : replyToHotel(state, reply);
			if (!result.understood) return null;
			state = result.state;
		}
		return parsed.data;
	} catch { return null; }
}
export function savePracticeDraft(userId: string, variant: 'lift' | 'street', replies: string[], hints: Stage[], resolved: (string | null)[] = []): void {
	try { sessionStorage.setItem(key(userId), JSON.stringify(Draft.parse({ variant, replies, resolved, hints: hints.filter(stage => STAGES.includes(stage)) }))); } catch { /* The current session still works when storage is unavailable. */ }
}
export function clearPracticeDraft(userId: string): void {
	try { sessionStorage.removeItem(key(userId)); } catch { /* unavailable */ }
}
