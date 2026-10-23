/**
 * The learner's own progress page: numbers worked out from their daily-lesson events (the server's
 * `lesson_started`, `lesson_progress` and `lesson_completed` rows; learners may read their own).
 * Only what they did: never a total, never the lessons ahead, never a level.
 */

/** One stored event, as the progress page reads it. */
export interface LessonEventRow {
	event_name: string;
	occurred_at: string;
	metadata: Record<string, unknown> | null;
}

/** The learner's calendar date for an event: UTC time plus their offset (minutes east of UTC). */
export function localDate(row: Pick<LessonEventRow, 'occurred_at' | 'metadata'>): string | null {
	const at = Date.parse(row.occurred_at);
	if (Number.isNaN(at)) return null;
	const offset = typeof row.metadata?.utc_offset_min === 'number' && Math.abs(row.metadata.utc_offset_min) <= 840 ? row.metadata.utc_offset_min : 0;
	return new Date(at + offset * 60_000).toISOString().slice(0, 10);
}

/**
 * The days the learner finished a lesson, oldest first, each once (owner's rule: a day counts only
 * once a lesson is finished on it, not when one is started or paused; a lesson with every step
 * skipped doesn't count).
 */
export function lessonDates(rows: LessonEventRow[]): string[] {
	const dates = new Set<string>();
	for (const row of rows) {
		if (row.event_name !== 'lesson_completed') continue;
		if (typeof row.metadata?.done === 'number' && row.metadata.done < 1) continue;
		const date = localDate(row);
		if (date) dates.add(date);
	}
	return [...dates].sort();
}

const dayBefore = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/**
 * Days in a row, ending today, or yesterday when today has nothing yet (the streak isn't lost until
 * a whole day passes without a lesson).
 */
export function streak(dates: string[], today: string): number {
	const set = new Set(dates);
	let day = set.has(today) ? today : dayBefore(today);
	let count = 0;
	while (set.has(day)) { count++; day = dayBefore(day); }
	return count;
}

/** The last seven days, oldest first, each marked active or not (for the week strip). */
export function lastSevenDays(dates: string[], today: string): { date: string; active: boolean }[] {
	const set = new Set(dates);
	const days: string[] = [today];
	while (days.length < 7) days.unshift(dayBefore(days[0]));
	return days.map(date => ({ date, active: set.has(date) }));
}
