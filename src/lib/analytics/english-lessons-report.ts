/**
 * The English daily lessons, from the events the today page's save action writes
 * (src/lib/server/lesson-events.ts): how many lessons start and finish, where learners stop, and
 * whether they come back. "Days" are the learner's own calendar days (their UTC offset is sent
 * with each save; Iran is UTC+3:30), so a lesson at 11 p.m. and one at 8 a.m. are two days.
 *
 * - Next-day return: a lesson started on the calendar day after the learner's first lesson.
 * - Week return: a lesson started on any of the 7 calendar days after the first.
 * A learner counts towards a return rate only once its whole window has passed.
 */
import { DAY_MS, type StoredEvent } from './contract';

/** An account, as the lesson report needs it. */
export interface AnalyticsUser { id: string; created_at: string; is_admin: boolean; }

const at = (e: StoredEvent) => Date.parse(e.occurred_at);
/** The learner's calendar day of an event, as a day number (days since 1970 in their time zone). */
export function localDay(e: StoredEvent): number {
	const offset = typeof e.metadata.utc_offset_min === 'number' ? e.metadata.utc_offset_min : 0;
	return Math.floor((at(e) + offset * 60_000) / DAY_MS);
}
/** When a local calendar day ends, in UTC milliseconds. */
const dayEnds = (day: number, offsetMin: number) => (day + 1) * DAY_MS - offsetMin * 60_000;

/** An event from the English daily lessons (written by the server, with the lesson's id as its session). */
export const englishLessonEvent = (e: StoredEvent) => e.metadata.course === 'en' && ['lesson_started', 'lesson_progress', 'lesson_completed'].includes(e.event_name);
const isLesson = englishLessonEvent;

export function buildEnglishLessonReport(events: StoredEvent[], users: AnalyticsUser[], since: number, now: number) {
	const allowed = new Set(users.map(u => u.id));
	const rows = events.filter(e => allowed.has(e.user_id) && isLesson(e) && at(e) <= now);
	const inPeriod = rows.filter(e => at(e) >= since);

	// Lessons started and finished, per day and version.
	const key = (e: StoredEvent) => `${e.day ?? 0}|${String(e.metadata.track ?? 'intermediate')}`;
	const groups = new Map<string, { day: number; track: string; started: Set<string>; completed: Set<string> }>();
	for (const e of inPeriod) {
		const group = groups.get(key(e)) ?? { day: e.day ?? 0, track: String(e.metadata.track ?? 'intermediate'), started: new Set(), completed: new Set() };
		if (e.event_name === 'lesson_started' && e.attempt_id) group.started.add(e.attempt_id);
		if (e.event_name === 'lesson_completed' && e.attempt_id) group.completed.add(e.attempt_id);
		groups.set(key(e), group);
	}
	const days = [...groups.values()].sort((a, b) => a.day - b.day || a.track.localeCompare(b.track))
		.map(g => ({ day: g.day, track: g.track, started: g.started.size, completed: [...g.completed].filter(id => g.started.has(id)).length }));

	// Steps: done and skipped, and where unfinished lessons stopped (the step after the last one reached).
	const attempts = new Map<string, { day: number; track: string; reached: number; total: number; completed: boolean; last: number }>();
	for (const e of inPeriod) {
		if (!e.attempt_id) continue;
		const a = attempts.get(e.attempt_id) ?? { day: e.day ?? 0, track: String(e.metadata.track ?? 'intermediate'), reached: 0, total: 0, completed: false, last: 0 };
		if (e.event_name === 'lesson_started' && typeof e.metadata.total === 'number') a.total = e.metadata.total;
		if (e.event_name === 'lesson_progress' && typeof e.metadata.index === 'number') a.reached = Math.max(a.reached, e.metadata.index + 1);
		if (e.event_name === 'lesson_completed') a.completed = true;
		a.last = Math.max(a.last, at(e));
		attempts.set(e.attempt_id, a);
	}
	const steps = new Map<string, { day: number; track: string; module: string; index: number; done: number; skipped: number }>();
	for (const e of inPeriod) {
		if (e.event_name !== 'lesson_progress' || typeof e.metadata.module !== 'string') continue;
		const k = `${e.day}|${e.metadata.track}|${e.metadata.module}`;
		const s = steps.get(k) ?? { day: e.day ?? 0, track: String(e.metadata.track ?? 'intermediate'), module: e.metadata.module, index: Number(e.metadata.index ?? 0), done: 0, skipped: 0 };
		if (e.metadata.outcome === 'skipped') s.skipped++; else s.done++;
		steps.set(k, s);
	}
	// A lesson counts as stopped once a day has passed without a save; newer ones may still go on.
	const stopped = [...attempts.values()].filter(a => !a.completed && now - a.last > DAY_MS);
	const stoppedAt = new Map<string, number>();
	for (const a of stopped) {
		const k = `${a.day}|${a.track}|${a.reached}|${a.total}`;
		stoppedAt.set(k, (stoppedAt.get(k) ?? 0) + 1);
	}
	// `step` is the step they didn't finish (1-based); past the last step, it's the recap.
	const stops = [...stoppedAt.entries()].map(([k, count]) => {
		const [day, track, reached, total] = k.split('|');
		return { day: Number(day), track, step: Number(reached) + 1, atRecap: Number(total) > 0 && Number(reached) >= Number(total), count };
	}).sort((a, b) => a.day - b.day || a.track.localeCompare(b.track) || a.step - b.step);

	// Returns, from each learner's first lesson (ever, not just in the period).
	const starts = rows.filter(e => e.event_name === 'lesson_started');
	const byUser = new Map<string, StoredEvent[]>();
	for (const e of starts) byUser.set(e.user_id, [...(byUser.get(e.user_id) ?? []), e]);
	const learners = [...byUser.entries()].map(([id, list]) => {
		list.sort((a, b) => at(a) - at(b));
		const first = list[0], firstDay = localDay(first);
		const offset = typeof first.metadata.utc_offset_min === 'number' ? first.metadata.utc_offset_min : 0;
		const days = new Set(list.map(localDay));
		return {
			id, first: at(first), inPeriod: at(first) >= since,
			nextDay: { eligible: now >= dayEnds(firstDay + 1, offset), returned: days.has(firstDay + 1) },
			week: { eligible: now >= dayEnds(firstDay + 7, offset), returned: [1, 2, 3, 4, 5, 6, 7].some(n => days.has(firstDay + n)) },
			lessonDays: days.size
		};
	}).filter(l => l.inPeriod);
	const rate = (pick: (l: (typeof learners)[number]) => { eligible: boolean; returned: boolean }) => {
		const eligible = learners.filter(l => pick(l).eligible);
		return { eligible: eligible.length, returned: eligible.filter(l => pick(l).returned).length, pending: learners.length - eligible.length };
	};
	return {
		started: days.reduce((sum, d) => sum + d.started, 0),
		completed: days.reduce((sum, d) => sum + d.completed, 0),
		days,
		steps: [...steps.values()].sort((a, b) => a.day - b.day || a.track.localeCompare(b.track) || a.index - b.index),
		stops,
		newLearners: learners.length,
		nextDay: rate(l => l.nextDay),
		week: rate(l => l.week)
	};
}
export type EnglishLessonReport = ReturnType<typeof buildEnglishLessonReport>;
