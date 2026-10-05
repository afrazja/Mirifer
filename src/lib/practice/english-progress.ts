/**
 * English progress kept on our server: the least the coach needs to talk
 * truthfully about the learner. Numbers, bands and dates only; nothing the
 * learner typed or said.
 *
 * Updated once, by the server, when a daily session is finished.
 */
import { z } from 'zod';
import type { ModuleSkill } from './day';

const Tally = z.object({ correct: z.number().int().min(0).max(1000), total: z.number().int().min(0).max(1000) }).strict();
const SessionTally = z.object({ listening: Tally, speaking: Tally }).strict();
type SessionTally = z.infer<typeof SessionTally>;

/** Sessions kept for the skill picture: recent form, not all-time. */
export const RECENT_SESSIONS = 10;

export const EnglishProgressSchema = z.object({
	sessionsCompleted: z.number().int().min(0).max(100000),
	lastCompletedAt: z.string().datetime().nullable(),
	lastThemeId: z.string().max(40).nullable(),
	lastResult: z.enum(['strong', 'ok', 'hard']).nullable(),
	recent: z.array(SessionTally).max(RECENT_SESSIONS)
}).strict();
export type EnglishProgress = z.infer<typeof EnglishProgressSchema>;

export const EMPTY_PROGRESS: EnglishProgress = { sessionsCompleted: 0, lastCompletedAt: null, lastThemeId: null, lastResult: null, recent: [] };

export function readEnglishProgress(meta: Record<string, unknown> | undefined | null): EnglishProgress {
	const parsed = EnglishProgressSchema.safeParse(meta?.english_progress_v1);
	return parsed.success ? parsed.data : EMPTY_PROGRESS;
}

/** strong >= 80%, ok >= 50%, else hard; null when nothing was scored. */
export function resultBand(correct: number, total: number): EnglishProgress['lastResult'] {
	if (total <= 0) return null;
	const share = correct / total;
	return share >= 0.8 ? 'strong' : share >= 0.5 ? 'ok' : 'hard';
}

export interface FinishedModule { skill: ModuleSkill; correct: number; total: number }

/** Adds one finished session. */
export function recordSession(progress: EnglishProgress, themeId: string, modules: FinishedModule[], now = new Date()): EnglishProgress {
	const tally: SessionTally = { listening: { correct: 0, total: 0 }, speaking: { correct: 0, total: 0 } };
	for (const module of modules) {
		tally[module.skill].correct += module.correct;
		tally[module.skill].total += module.total;
	}
	const correct = tally.listening.correct + tally.speaking.correct, total = tally.listening.total + tally.speaking.total;
	return {
		sessionsCompleted: progress.sessionsCompleted + 1,
		lastCompletedAt: now.toISOString(),
		lastThemeId: themeId,
		lastResult: resultBand(correct, total),
		recent: [...progress.recent, tally].slice(-RECENT_SESSIONS)
	};
}

/** Sum of the recent sessions for one skill. */
export function skillTotal(progress: EnglishProgress, skill: ModuleSkill) {
	return progress.recent.reduce((sum, item) => ({ correct: sum.correct + item[skill].correct, total: sum.total + item[skill].total }), { correct: 0, total: 0 });
}

/**
 * The clearly stronger skill, or null. Only when both skills have enough
 * answers (10+) and the gap is real (15+ points), so the coach never
 * praises noise.
 */
export function strongerSkill(progress: EnglishProgress): ModuleSkill | null {
	const listening = skillTotal(progress, 'listening'), speaking = skillTotal(progress, 'speaking');
	if (listening.total < 10 || speaking.total < 10) return null;
	const gap = listening.correct / listening.total - speaking.correct / speaking.total;
	return gap >= 0.15 ? 'listening' : gap <= -0.15 ? 'speaking' : null;
}
