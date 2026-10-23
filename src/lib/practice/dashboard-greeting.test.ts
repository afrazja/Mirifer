import { describe, it, expect } from 'vitest';
import { dashboardGreeting, greetingKind, type DashboardMoment } from './dashboard-greeting';

const base: DashboardMoment = { name: 'John', finished: 2, activeDays: 4, inProgress: false, doneToday: false, caughtUp: false, streak: 0, activeToday: false, daysAway: 3, lessonNumber: 3 };
const at = (extra: Partial<DashboardMoment>) => ({ ...base, ...extra });

describe('Mira’s greeting on the dashboard', () => {
	it('picks one moment, the lesson under way first', () => {
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
	it('welcomes a returning learner by name, and names the button and the lesson', () => {
		const line = dashboardGreeting(at({ inProgress: true }));
		expect(line.en).toMatch(/John/);
		expect(line.en).toContain('Continue Day 3');
		expect(line.fa).toContain('ادامهٔ روز ۳');
		expect(dashboardGreeting(at({ streak: 4 })).en).toMatch(/4 days in a row/);
	});
	it('tells a first-time learner who Mira is and what to tap', () => {
		const line = dashboardGreeting(at({ finished: 0, activeDays: 0, lessonNumber: 1 }));
		expect(line.en).toMatch(/I’m Mira/);
		expect(line.en).toContain('Start Day 1');
		expect(line.fa).toContain('شروع روز ۱');
	});
	it('reads cleanly without a name, and isolates a Latin name in Persian', () => {
		for (const moment of [at({}), at({ inProgress: true }), at({ finished: 0, activeDays: 0 }), at({ doneToday: true }), at({ daysAway: 9 })]) {
			const line = dashboardGreeting({ ...moment, name: '' });
			expect(line.en).not.toMatch(/\{name\}| ,|,!| !/);
			expect(line.fa).not.toMatch(/\{name\}/);
		}
		expect(dashboardGreeting(at({})).fa).toContain('⁨John⁩');
	});
});
