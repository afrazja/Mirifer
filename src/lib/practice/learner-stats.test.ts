import { describe, it, expect } from 'vitest';
import { lastSevenDays, lessonDates, stepDates, localDate, streak, type LessonEventRow } from './learner-stats';

const row = (event_name: string, occurred_at: string, metadata: Record<string, unknown> = {}): LessonEventRow => ({ event_name, occurred_at, metadata });

describe('the learner’s progress numbers', () => {
	it('dates each event on the learner’s own calendar', () => {
		// 22:30 UTC is already the next day in Tehran (+210 minutes).
		expect(localDate(row('lesson_started', '2026-10-20T22:30:00Z', { utc_offset_min: 210 }))).toBe('2026-10-21');
		expect(localDate(row('lesson_started', '2026-10-20T22:30:00Z'))).toBe('2026-10-20');
		expect(localDate(row('lesson_started', 'not a date'))).toBeNull();
	});
	it('counts a day only once a lesson is finished on it, each day once', () => {
		const rows = [
			row('lesson_started', '2026-10-19T08:00:00Z'),
			row('lesson_progress', '2026-10-19T08:05:00Z', { outcome: 'done' }),
			row('lesson_completed', '2026-10-20T08:20:00Z', { done: 4, skipped: 0 }),
			row('lesson_completed', '2026-10-20T18:20:00Z', { done: 3, skipped: 1 }),
			// Every step skipped: not a finished lesson.
			row('lesson_completed', '2026-10-21T08:20:00Z', { done: 0, skipped: 4 }),
			row('lesson_completed', '2026-10-22T08:20:00Z', { done: 2, skipped: 2 })
		];
		expect(lessonDates(rows)).toEqual(['2026-10-20', '2026-10-22']);
	});
	it('counts days in a row, ending today or (if nothing yet today) yesterday', () => {
		const dates = ['2026-10-18', '2026-10-20', '2026-10-21', '2026-10-22'];
		expect(streak(dates, '2026-10-22')).toBe(3);
		expect(streak(dates, '2026-10-23')).toBe(3);
		expect(streak(dates, '2026-10-24')).toBe(0);
		expect(streak([], '2026-10-24')).toBe(0);
	});
	it('marks the last seven days, oldest first', () => {
		const week = lastSevenDays(['2026-10-20', '2026-10-22'], '2026-10-22');
		expect(week).toHaveLength(7);
		expect(week[0].date).toBe('2026-10-16');
		expect(week.at(-1)).toEqual({ date: '2026-10-22', active: true });
		expect(week.filter(d => d.active).map(d => d.date)).toEqual(['2026-10-20', '2026-10-22']);
	});
});

describe('stepDates', () => {
	it('counts days with a step done or a lesson finished, never a skip', () => {
		expect(stepDates([
			{ event_name: 'lesson_progress', occurred_at: '2026-10-25T22:00:00Z', metadata: { outcome: 'done', utc_offset_min: 210 } },
			{ event_name: 'lesson_progress', occurred_at: '2026-10-24T10:00:00Z', metadata: { outcome: 'skipped' } },
			{ event_name: 'lesson_completed', occurred_at: '2026-10-20T10:00:00Z', metadata: { done: 0 } },
			{ event_name: 'lesson_completed', occurred_at: '2026-10-21T10:00:00Z', metadata: { done: 2 } }
		])).toEqual(['2026-10-21', '2026-10-26']);
	});
});
