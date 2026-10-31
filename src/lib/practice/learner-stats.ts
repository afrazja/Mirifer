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

/**
 * The days the learner did a step, oldest first, each once: the step path's daily goal is one step
 * done (not skipped). Lessons finished before the path count too, so no streak resets on the switch.
 */
export function stepDates(rows: LessonEventRow[]): string[] {
	const dates = new Set<string>();
	for (const row of rows) {
		const step = row.event_name === 'lesson_progress' && row.metadata?.outcome === 'done';
		const lesson = row.event_name === 'lesson_completed' && !(typeof row.metadata?.done === 'number' && row.metadata.done < 1);
		if (!step && !lesson) continue;
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

const dayAfter = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

/**
 * This calendar week, for the week strip: seven days from the week's first day (0 Sunday … 6
 * Saturday; Iran's week starts on Saturday), each marked active or not, and the days still to come.
 * A new week starts empty (owner's phone test: a rolling "last seven days" never started a new week).
 */
export function calendarWeek(dates: string[], today: string, firstDay = 1): { date: string; active: boolean; future: boolean }[] {
	const set = new Set(dates);
	let start = today;
	while (new Date(`${start}T00:00:00Z`).getUTCDay() !== ((firstDay % 7) + 7) % 7) start = dayBefore(start);
	const days = [start];
	while (days.length < 7) days.push(dayAfter(days[days.length - 1]));
	return days.map(date => ({ date, active: set.has(date), future: date > today }));
}

/**
 * The first day of the learner's week (0 Sunday … 6 Saturday): Saturday in Iran, else the device's
 * locale (Monday when it can't tell).
 */
export function weekStartDay(timeZone?: string, locale?: string): number {
	if (timeZone === 'Asia/Tehran') return 6;
	try {
		const loc = new Intl.Locale(locale ?? 'en-US') as Intl.Locale & { getWeekInfo?: () => { firstDay: number }; weekInfo?: { firstDay: number } };
		const first = loc.getWeekInfo?.().firstDay ?? loc.weekInfo?.firstDay;
		if (typeof first === 'number' && first >= 1 && first <= 7) return first % 7;
	} catch { /* older browsers */ }
	return 1;
}
