import { describe, it, expect } from 'vitest';
import { buildEnglishLessonReport, localDay } from './english-lessons-report';
import type { StoredEvent } from './contract';

let n = 0;
function ev(user: string, name: StoredEvent['event_name'], when: string, attempt: string, metadata: Record<string, string | number | boolean> = {}, day = 1): StoredEvent {
	n++;
	return { event_id: `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`, session_id: attempt, attempt_id: attempt, event_name: name, day,
		occurred_at: when, created_at: when, schema_version: 2, user_id: user, metadata: { course: 'en', track: 'intermediate', utc_offset_min: 210, ...metadata } };
}
const A1 = '00000000-0000-4000-8000-aaaaaaaaaaa1', A2 = '00000000-0000-4000-8000-aaaaaaaaaaa2', B1 = '00000000-0000-4000-8000-bbbbbbbbbbb1';
const users = [{ id: 'u1', created_at: '2026-10-01T00:00:00Z', is_admin: false }, { id: 'u2', created_at: '2026-10-01T00:00:00Z', is_admin: false }];

describe('English lessons report', () => {
	// u1 (Tehran, UTC+3:30): Day 1 at 23:00 local on Oct 10, then Day 2 at 08:00 local on Oct 11: the next day.
	// u2: Day 1 on Oct 10, stops after step 2, never comes back.
	const events = [
		ev('u1', 'lesson_started', '2026-10-10T19:30:00Z', A1, { total: 4 }),
		ev('u1', 'lesson_progress', '2026-10-10T19:35:00Z', A1, { module: 'listen-act', outcome: 'done', index: 0 }),
		ev('u1', 'lesson_progress', '2026-10-10T19:40:00Z', A1, { module: 'phrases', outcome: 'skipped', index: 1 }),
		ev('u1', 'lesson_completed', '2026-10-10T19:50:00Z', A1, { done: 3, skipped: 1, total: 4 }),
		ev('u1', 'lesson_started', '2026-10-11T04:30:00Z', A2, { total: 4 }, 2),
		ev('u2', 'lesson_started', '2026-10-10T10:00:00Z', B1, { total: 4 }),
		ev('u2', 'lesson_progress', '2026-10-10T10:05:00Z', B1, { module: 'listen-act', outcome: 'done', index: 0 }),
		ev('u2', 'lesson_progress', '2026-10-10T10:09:00Z', B1, { module: 'phrases', outcome: 'done', index: 1 }),
		// Not the English daily lessons: ignored.
		ev('u2', 'lesson_started', '2026-10-12T10:00:00Z', B1, { course: 'de' })
	];
	const since = Date.parse('2026-10-01T00:00:00Z');

	it('counts days on the learner’s own calendar', () => {
		expect(localDay(events[0])).toBe(localDay(ev('u1', 'lesson_started', '2026-10-10T20:29:00Z', A1)));
		expect(localDay(events[4]) - localDay(events[0])).toBe(1);
	});
	it('reports lessons, steps, where lessons stopped, and returns', () => {
		const r = buildEnglishLessonReport(events, users, since, Date.parse('2026-10-20T00:00:00Z'));
		expect(r.started).toBe(3); expect(r.completed).toBe(1);
		expect(r.days).toEqual([{ day: 1, track: 'intermediate', started: 2, completed: 1 }, { day: 2, track: 'intermediate', started: 1, completed: 0 }]);
		expect(r.steps.find(s => s.module === 'phrases')).toMatchObject({ done: 1, skipped: 1 });
		// u2 stopped at step 3; u1's Day 2 stopped before step 1.
		expect(r.stops).toEqual([{ day: 1, track: 'intermediate', step: 3, atRecap: false, count: 1 }, { day: 2, track: 'intermediate', step: 1, atRecap: false, count: 1 }]);
		expect(r.newLearners).toBe(2);
		expect(r.nextDay).toEqual({ eligible: 2, returned: 1, pending: 0 });
		expect(r.week).toEqual({ eligible: 2, returned: 1, pending: 0 });
	});
	it('waits until a learner’s window has passed, and leaves out learners not in the list', () => {
		const r = buildEnglishLessonReport(events, users.slice(0, 1), since, Date.parse('2026-10-12T00:00:00Z'));
		expect(r.newLearners).toBe(1);
		expect(r.nextDay).toEqual({ eligible: 1, returned: 1, pending: 0 });
		expect(r.week).toEqual({ eligible: 0, returned: 0, pending: 1 });
		// A lesson saved less than a day ago may still go on: not counted as stopped.
		expect(buildEnglishLessonReport(events, users, since, Date.parse('2026-10-10T12:00:00Z')).stops).toEqual([]);
	});
});
