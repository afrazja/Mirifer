import { describe, it, expect } from 'vitest';
import { activeDates, lastSevenDays, localDate, stepsDone, streak, type LessonEventRow } from './learner-stats';

const row = (event_name: string, occurred_at: string, metadata: Record<string, unknown> = {}): LessonEventRow => ({ event_name, occurred_at, metadata });

describe('the learner’s progress numbers', () => {
	it('dates each event on the learner’s own calendar', () => {
		// 22:30 UTC is already the next day in Tehran (+210 minutes).
		expect(localDate(row('lesson_started', '2026-10-20T22:30:00Z', { utc_offset_min: 210 }))).toBe('2026-10-21');
		expect(localDate(row('lesson_started', '2026-10-20T22:30:00Z'))).toBe('2026-10-20');
		expect(localDate(row('lesson_started', 'not a date'))).toBeNull();
	});
	it('counts each active day once, and only the steps done', () => {
		const rows = [
			row('lesson_started', '2026-10-20T08:00:00Z'),
			row('lesson_progress', '2026-10-20T08:05:00Z', { outcome: 'done' }),
			row('lesson_progress', '2026-10-20T08:09:00Z', { outcome: 'skipped' }),
			row('lesson_progress', '2026-10-22T08:05:00Z', { outcome: 'done' })
		];
		expect(activeDates(rows)).toEqual(['2026-10-20', '2026-10-22']);
		expect(stepsDone(rows)).toBe(2);
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
