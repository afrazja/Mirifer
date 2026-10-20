import { describe, it, expect } from 'vitest';
import { lessonAttemptId, lessonEvents } from './lesson-events';
import { completeLater, completeSession, finishModule, startSession, DAY_ONE, DAY_TWO, MODULE_IDS, TRACKS } from '$lib/practice/day';
import { UUID, safeMetadata } from '$lib/analytics/contract';

const now = new Date('2026-10-20T08:00:00Z');
const names = (rows: ReturnType<typeof lessonEvents>) => rows.map(r => r.event_name === 'lesson_progress' ? `${r.metadata.module}:${r.metadata.outcome}` : r.event_name);

describe('English lesson events', () => {
	it('a new lesson starts once; each step is counted once; the end once', () => {
		const start = startSession(15, now, DAY_TWO, 'professional');
		const started = lessonEvents('u1', null, start, now, 210);
		expect(names(started)).toEqual(['lesson_started']);
		expect(started[0]).toMatchObject({ day: 2, metadata: { course: 'en', track: 'professional', length: 15, utc_offset_min: 210, total: 4 } });
		// Saving the same checkpoint again adds nothing.
		expect(lessonEvents('u1', start, start, now, 210)).toEqual([]);
		const one = finishModule(start, 'listen-retell', 'done');
		const two = finishModule(one, 'phrases', 'skipped');
		expect(names(lessonEvents('u1', start, two, now, 210))).toEqual(['listen-retell:done', 'phrases:skipped']);
		const step = lessonEvents('u1', one, two, now, 210)[0];
		expect(step.metadata).toMatchObject({ module: 'phrases', outcome: 'skipped', index: 1 });
		// Done later, after a skip: counted as done.
		expect(names(lessonEvents('u1', two, completeLater(two, 'phrases'), now, 210))).toEqual(['phrases:done']);
		const end = completeSession({ ...two, stage: 'recap' });
		expect(names(lessonEvents('u1', two, end, now, 210))).toEqual(['lesson_completed']);
		expect(lessonEvents('u1', end, end, now, 210)).toEqual([]);
	});
	it('a lesson that starts again is a new attempt, with its own stable id', () => {
		const a = startSession(15, new Date('2026-10-19T08:00:00Z'), DAY_ONE, 'intermediate');
		const b = startSession(15, now, DAY_ONE, 'intermediate');
		const rows = lessonEvents('u1', a, b, now, null);
		expect(names(rows)).toEqual(['lesson_started']);
		expect(rows[0].attempt_id).toBe(lessonAttemptId('u1', b.startedAt));
		expect(rows[0].attempt_id).toMatch(UUID);
		expect(rows[0].session_id).toBe(rows[0].attempt_id);
		expect(lessonAttemptId('u1', b.startedAt)).not.toBe(lessonAttemptId('u2', b.startedAt));
		expect(rows[0].metadata).not.toHaveProperty('utc_offset_min');
		// Clearing the lesson adds nothing.
		expect(lessonEvents('u1', b, null, now, 0)).toEqual([]);
	});
	it('carries only ids and counts, which the analytics contract accepts as they are', () => {
		const s = finishModule(startSession(15, now, DAY_ONE, 'professional'), 'listen-act', 'done');
		for (const row of lessonEvents('u1', null, s, now, -300)) expect(safeMetadata(row.metadata)).toEqual(row.metadata);
		// The contract's lists match the course's.
		expect(safeMetadata({ module: 'not-a-module', track: 'expert', utc_offset_min: 2000 })).toEqual({});
		for (const id of MODULE_IDS) expect(safeMetadata({ module: id })).toEqual({ module: id });
		for (const track of TRACKS) expect(safeMetadata({ track })).toEqual({ track });
	});
});
