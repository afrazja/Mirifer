/**
 * The step path (docs/goal-path-plan.md) on the server: who has it yet, and the events a step adds.
 *
 * Rolled out to the owner's test accounts first; everyone else keeps the daily lessons until the
 * owner has tried it on a phone. Events keep the names the admin reports already read: a chapter is
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

export const usesStepPath = (user: Pick<User, 'email' | 'email_confirmed_at'> | null | undefined): boolean => canResetEnglish(user);

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
}

export function stepEvents(userId: string, input: StepEventInput, now: Date, utcOffsetMin: number | null): AnalyticsRecord[] {
	// One attempt per chapter and version, so the admin groups a chapter's steps together.
	const attempt = lessonAttemptId(userId, `path|${input.day.id}|${input.track}`);
	const base = { course: 'en', track: input.track, ...(utcOffsetMin === null ? {} : { utc_offset_min: utcOffsetMin }) };
	const event = (event_name: AnalyticsRecord['event_name'], metadata: Record<string, unknown>): AnalyticsRecord => ({
		event_id: randomUUID(), session_id: attempt, attempt_id: attempt, event_name, day: input.day.number,
		occurred_at: now.toISOString(), schema_version: SCHEMA_VERSION, metadata: safeMetadata({ ...base, ...metadata })
	});
	const rows: AnalyticsRecord[] = [];
	if (input.chapterStarted && !input.replay) rows.push(event('lesson_started', { total: input.total }));
	const percentage = input.score && input.score.total > 0 ? Math.round(Math.min(input.score.correct, input.score.total) / input.score.total * 100) : null;
	rows.push(event('lesson_progress', { module: input.module, outcome: input.outcome, index: input.index, ...(input.replay ? { replay: true } : {}), ...(percentage === null ? {} : { percentage }) }));
	if (input.chapterCompleted) rows.push(event('lesson_completed', { ...input.chapterCompleted, total: input.total }));
	return rows;
}

/** One learner's rating of a step they did (1–5, how much they liked it). */
export function ratingEvent(userId: string, day: DayPack, track: Track, module: ModuleId, rating: number, now: Date): AnalyticsRecord {
	const attempt = lessonAttemptId(userId, `path|${day.id}|${track}`);
	return {
		event_id: randomUUID(), session_id: attempt, attempt_id: attempt, event_name: 'step_rated', day: day.number,
		occurred_at: now.toISOString(), schema_version: SCHEMA_VERSION, metadata: safeMetadata({ course: 'en', track, module, rating })
	};
}
