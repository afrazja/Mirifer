/**
 * Analytics for the English daily lessons, worked out on the server from each saved checkpoint
 * (the today page's save action): `lesson_started` when a new session begins, one
 * `lesson_progress` per step done or skipped, and `lesson_completed` when it ends. Only ids and
 * counts: never anything the learner said or typed. Return visits are worked out from these in
 * the admin report (src/lib/analytics/english-lessons-report.ts).
 */
import { createHash, randomUUID } from 'node:crypto';
import { SCHEMA_VERSION, safeMetadata, type AnalyticsRecord } from '$lib/analytics/contract';
import { dayOf, sessionModules, type DaySession } from '$lib/practice/day';

/** A stable id for one session (one learner, one start time): the event's attempt and session id. */
export function lessonAttemptId(userId: string, startedAt: string): string {
	const hex = createHash('sha256').update(`english-lesson|${userId}|${startedAt}`).digest('hex');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/** The events one save adds: compares the stored checkpoint with the new one. */
export function lessonEvents(userId: string, stored: DaySession | null, next: DaySession | null, now: Date, utcOffsetMin: number | null): AnalyticsRecord[] {
	if (!next) return [];
	const day = dayOf(next);
	const same = stored?.startedAt === next.startedAt ? stored : null;
	const attempt = lessonAttemptId(userId, next.startedAt);
	const base = { course: 'en', track: next.track ?? 'intermediate', length: next.length, ...(utcOffsetMin === null ? {} : { utc_offset_min: utcOffsetMin }) };
	const event = (event_name: AnalyticsRecord['event_name'], metadata: Record<string, unknown>): AnalyticsRecord => ({
		event_id: randomUUID(), session_id: attempt, attempt_id: attempt, event_name, day: day.number,
		occurred_at: now.toISOString(), schema_version: SCHEMA_VERSION, metadata: safeMetadata({ ...base, ...metadata })
	});
	const rows: AnalyticsRecord[] = [];
	if (!same) rows.push(event('lesson_started', { total: sessionModules(next).length }));
	const modules = sessionModules(next).map(module => module.id);
	for (const [outcome, ids] of [['done', next.done], ['skipped', next.skipped]] as const) {
		for (const id of ids) {
			if ((outcome === 'done' ? same?.done : same?.skipped)?.includes(id)) continue;
			rows.push(event('lesson_progress', { module: id, outcome, index: Math.max(0, modules.indexOf(id)) }));
		}
	}
	if (next.stage === 'done' && same?.stage !== 'done') rows.push(event('lesson_completed', { done: next.done.length, skipped: next.skipped.length, total: modules.length }));
	return rows;
}
