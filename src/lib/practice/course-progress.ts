/** Progress summaries shown on the "My languages" page (see $lib/server/my-languages). */
export interface GermanProgress { code: 'de'; currentDay: number; completed: number; total: number; xp: number }
/**
 * English: only the daily lessons the learner has finished (owner's rule: a learner never sees how many
 * lessons exist, or the ones still ahead).
 */
export interface EnglishProgress { code: 'en'; finished: { number: number; theme: { en: string; fa: string } }[] }
export type CourseProgress = GermanProgress | EnglishProgress;

/** 0–1, for German's progress bar (English has none: it never shows a total). */
export function progressShare(progress: GermanProgress): number {
	return progress.total ? Math.min(1, progress.completed / progress.total) : 0;
}
