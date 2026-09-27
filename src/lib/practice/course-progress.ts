/** Progress summaries shown on the "My languages" page (see $lib/server/my-languages). */
export interface GermanProgress { code: 'de'; currentDay: number; completed: number; total: number; xp: number }
export interface EnglishProgress { code: 'en'; conversationDone: boolean; retellDone: number; retellTotal: number }
export type CourseProgress = GermanProgress | EnglishProgress;

/** 0–1, for the progress bar. */
export function progressShare(progress: CourseProgress): number {
	if (progress.code === 'de') return progress.total ? Math.min(1, progress.completed / progress.total) : 0;
	const total = 1 + progress.retellTotal;
	return ((progress.conversationDone ? 1 : 0) + progress.retellDone) / total;
}
