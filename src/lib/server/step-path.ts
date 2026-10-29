/**
 * The step path (docs/goal-path-plan.md) on the server: who has it yet, and the events a step adds.
 *
 * On for everyone since 2026-10-28 (the owner's test accounts had it first; they also see pilot chapters). Events keep the names the admin reports already read: a chapter is
 * a "lesson" (`lesson_started` at its first step, `lesson_completed` when it ends) and each step is a
 * `lesson_progress` row, now with `replay` for a step done again.
 */
import { randomUUID } from 'node:crypto';
import type { User } from '@supabase/supabase-js';
import { SCHEMA_VERSION, safeMetadata, type AnalyticsRecord } from '$lib/analytics/contract';
import { canResetEnglish } from '$lib/server/test-accounts';
import { lessonAttemptId } from '$lib/server/lesson-events';
import type { DayPack, ModuleId, Track } from '$lib/practice/day';
import type { Preview } from '$lib/practice/path';

/**
 * The step path is for everyone (owner, 2026-10-28). Set this to false to bring back the daily
 * lessons for everyone but the test accounts (a rollback: the old progress records are still kept).
 */
export const STEP_PATH_FOR_EVERYONE = true;
export const usesStepPath = (user: Pick<User, 'email' | 'email_confirmed_at'> | null | undefined): boolean => STEP_PATH_FOR_EVERYONE || canResetEnglish(user);

/** Which unreleased chapters a learner sees: the owner's tools show them all; the test accounts see pilots. */
export const previewFor = (user: Pick<User, 'email' | 'email_confirmed_at'> | null | undefined, ownerTools: boolean): Preview =>
	ownerTools ? true : canResetEnglish(user) ? 'pilot' : false;

export interface StepEventInput {
	day: DayPack; track: Track; module: ModuleId; index: number; total: number;
	outcome: 'done' | 'skipped'; replay: boolean;
	/** The step's result, when it gives one (as a percentage on the event). */
	score?: { correct: number; total: number } | null;
	/** The chapter's first step, done or skipped for the first time. */
	chapterStarted: boolean;
	/** The chapter just finished with this step: its done and skipped counts. */
	chapterCompleted: { done: number; skipped: number } | null;
	/** Seconds from opening the step to this result, when it was opened in one sitting (MAX_STEP_SECONDS). */
	seconds?: number | null;
}

/** Longer than this from opening to the result isn't one sitting (a step left open for days): no time is kept. */
export const MAX_STEP_SECONDS = 30 * 60;
/** Seconds from the step's start to now, or null if it wasn't opened in one sitting. */
export function stepSeconds(startedAt: string | null | undefined, now: Date): number | null {
	const start = startedAt ? Date.parse(startedAt) : NaN;
	if (!Number.isFinite(start)) return null;
	const seconds = Math.round((now.getTime() - start) / 1000);
	return seconds >= 0 && seconds <= MAX_STEP_SECONDS ? seconds : null;
}

export function stepEvents(userId: string, input: StepEventInput, now: Date, utcOffsetMin: number | null): AnalyticsRecord[] {
	// One attempt per chapter and version, so the admin groups a chapter's steps together.
	const attempt = lessonAttemptId(userId, `path|${input.day.id}|${input.track}`);
	const base = { course: 'en', flow: 'path', track: input.track, ...(utcOffsetMin === null ? {} : { utc_offset_min: utcOffsetMin }) };
	const event = (event_name: AnalyticsRecord['event_name'], metadata: Record<string, unknown>): AnalyticsRecord => ({
		event_id: randomUUID(), session_id: attempt, attempt_id: attempt, event_name, day: input.day.number,
		occurred_at: now.toISOString(), schema_version: SCHEMA_VERSION, metadata: safeMetadata({ ...base, ...metadata })
	});
	const rows: AnalyticsRecord[] = [];
	if (input.chapterStarted && !input.replay) rows.push(event('lesson_started', { total: input.total }));
	const percentage = input.score && input.score.total > 0 ? Math.round(Math.min(input.score.correct, input.score.total) / input.score.total * 100) : null;
	rows.push(event('lesson_progress', { module: input.module, outcome: input.outcome, index: input.index, ...(input.replay ? { replay: true } : {}), ...(percentage === null ? {} : { percentage }), ...(typeof input.seconds === 'number' ? { seconds: input.seconds } : {}) }));
	if (input.chapterCompleted) rows.push(event('lesson_completed', { ...input.chapterCompleted, total: input.total }));
	return rows;
}

/** A step opened (it became the one under way): with the results, it shows the steps learners leave. */
export function openedEvent(userId: string, day: DayPack, track: Track, module: ModuleId, index: number, replay: boolean, now: Date, utcOffsetMin: number | null): AnalyticsRecord {
	const attempt = lessonAttemptId(userId, `path|${day.id}|${track}`);
	return {
		event_id: randomUUID(), session_id: attempt, attempt_id: attempt, event_name: 'step_opened', day: day.number,
		occurred_at: now.toISOString(), schema_version: SCHEMA_VERSION,
		metadata: safeMetadata({ course: 'en', flow: 'path', track, module, index, ...(replay ? { replay: true } : {}), ...(utcOffsetMin === null ? {} : { utc_offset_min: utcOffsetMin }) })
	};
}

/** One learner's rating of a step they did (1–5, how much they liked it). */
export function ratingEvent(userId: string, day: DayPack, track: Track, module: ModuleId, rating: number, now: Date): AnalyticsRecord {
	const attempt = lessonAttemptId(userId, `path|${day.id}|${track}`);
	return {
		event_id: randomUUID(), session_id: attempt, attempt_id: attempt, event_name: 'step_rated', day: day.number,
		occurred_at: now.toISOString(), schema_version: SCHEMA_VERSION, metadata: safeMetadata({ course: 'en', flow: 'path', track, module, rating })
	};
}
