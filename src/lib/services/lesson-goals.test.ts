import { describe, it, expect } from 'vitest';
import { goalProgress, goalText, goalsDone } from './lesson-goals';
import type { LessonGoal } from '$stores/lesson';

const goals: LessonGoal[] = [
	{ id: 'greet', en: 'Greet someone', fa: 'سلام کنید', sentences: [1, 3] },
	{ id: 'name', en: 'Say your name', fa: '', sentences: [5] }
];

describe('goalProgress', () => {
	it('has nothing done at the start', () => {
		expect(goalProgress(goals, 0, false).map((p) => p.done)).toEqual([false, false]);
	});

	it('ticks a goal only after the learner has moved past all of its lines', () => {
		// On line 3 the second greeting line is still being taught.
		expect(goalProgress(goals, 3, false)[0].done).toBe(false);
		expect(goalProgress(goals, 4, false)[0].done).toBe(true);
		expect(goalProgress(goals, 4, false)[1].done).toBe(false);
		expect(goalsDone(goalProgress(goals, 6, false))).toBe(2);
	});

	it('has every goal done once the lesson is finished', () => {
		expect(goalProgress(goals, 0, true).every((p) => p.done)).toBe(true);
	});

	it('has no progress for a lesson without goals', () => {
		expect(goalProgress(undefined, 5, false)).toEqual([]);
	});
});

describe('goalText', () => {
	it('uses Persian when asked and available, English otherwise', () => {
		expect(goalText(goals[0], 'fa')).toBe('سلام کنید');
		expect(goalText(goals[1], 'fa')).toBe('Say your name');
		expect(goalText(goals[0], 'en')).toBe('Say your name'.replace('Say your name', 'Greet someone'));
	});
});
