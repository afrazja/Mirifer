import { describe, it, expect } from 'vitest';
import { ACT_ROUNDS, scoreSteps } from './listen-act';
import { startSession, finishModule, recommend, DaySessionSchema } from './day';

describe('Listen and act', () => {
	it('scores each step by position', () => {
		const round = ACT_ROUNDS[0];
		expect(scoreSteps(round.steps, round.steps)).toMatchObject({ correct: 3, results: [true, true, true] });
		expect(scoreSteps(round.steps, [round.steps[1], round.steps[0], round.steps[2]]).correct).toBe(1);
		expect(scoreSteps(round.steps, []).correct).toBe(0);
		expect(scoreSteps(round.steps, [...round.steps, round.steps[0]]).correct).toBe(3);
	});
	it('every round names real things and places, and its script mentions them', () => {
		for (const round of ACT_ROUNDS) expect(round.steps.length).toBeGreaterThanOrEqual(3);
	});
	it('keeps the score and recommends the module again when it went badly', () => {
		const s = finishModule(startSession(15), 'listen-act', 'done', { correct: 3, total: 10 });
		expect(DaySessionSchema.safeParse(s).success).toBe(true);
		expect(s.scores?.['listen-act']).toEqual({ correct: 3, total: 10 });
		expect(recommend(s).title.en).toContain('Listen and act again');
		expect(recommend(finishModule(startSession(15), 'listen-act', 'done', { correct: 9, total: 10 })).title.en).toContain('new theme');
	});
});
