import { describe, it, expect } from 'vitest';
import { dashboardGreeting, greetingKind, type DashboardMoment } from './dashboard-greeting';

const base: DashboardMoment = { name: 'John', finished: 2, activeDays: 4, inProgress: false, doneToday: false, caughtUp: false, streak: 0, activeToday: false, daysAway: 3, lessonNumber: 3 };
const at = (extra: Partial<DashboardMoment>) => ({ ...base, ...extra });
const DATES = ['2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'];

describe('Mira’s spoken hello on the dashboard', () => {
	it('picks one moment, a paused lesson first', () => {
		expect(greetingKind(at({ finished: 0, activeDays: 0, lessonNumber: 1 }))).toBe('first');
		expect(greetingKind(at({ inProgress: true, finished: 0, activeDays: 0 }))).toBe('in-progress');
		expect(greetingKind(at({ doneToday: true, streak: 3, activeToday: true }))).toBe('done-today');
		expect(greetingKind(at({ caughtUp: true, streak: 3 }))).toBe('caught-up');
		expect(greetingKind(at({ streak: 3 }))).toBe('streak');
		expect(greetingKind(at({ streak: 1, daysAway: 1 }))).toBe('keep-going');
		expect(greetingKind(at({ streak: 1, activeToday: true, daysAway: 0 }))).toBe('welcome-back');
		expect(greetingKind(at({ daysAway: 9 }))).toBe('long-break');
		expect(greetingKind(at({}))).toBe('welcome-back');
	});
	it('introduces herself the first time and starts lesson one', () => {
		expect(dashboardGreeting(at({ finished: 0, activeDays: 0, lessonNumber: 1 }), DATES[0])).toBe('Hi John, this is Mira, your English coach. Let’s start your first lesson!');
	});
	it('fits the moment: the streak, a long break, the lesson by number', () => {
		for (const date of DATES) {
			expect(dashboardGreeting(at({ streak: 4 }), date)).toMatch(/4 days in a row/);
			expect(dashboardGreeting(at({ daysAway: 12 }), date)).toMatch(/John/);
			expect(dashboardGreeting(at({ inProgress: true }), date)).toMatch(/Day 3/);
		}
		expect(DATES.some(date => /Long time no see/.test(dashboardGreeting(at({ daysAway: 12 }), date)))).toBe(true);
	});
	it('says the same line all day, and not always the same line', () => {
		expect(dashboardGreeting(at({}), DATES[0])).toBe(dashboardGreeting(at({}), DATES[0]));
		expect(new Set(DATES.map(date => dashboardGreeting(at({}), date))).size).toBeGreaterThan(1);
	});
	it('reads cleanly without a name', () => {
		for (const date of DATES) for (const moment of [at({}), at({ inProgress: true }), at({ finished: 0, activeDays: 0 }), at({ doneToday: true }), at({ daysAway: 9 }), at({ streak: 8 })]) {
			const line = dashboardGreeting({ ...moment, name: '' }, date);
			expect(line).not.toMatch(/\{name\}| ,|,!| !|^[!,]/);
		}
	});
});
