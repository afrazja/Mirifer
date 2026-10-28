import { describe, expect, it } from 'vitest';
import { RATINGS, isRating, phraseScore, scoreLine, summarizeRatings } from './step-feedback';

describe('the end of a step', () => {
	it('says the learner’s result in the step’s own words', () => {
		expect(scoreLine('scenario', { correct: 2, total: 3 })).toMatchObject({ value: '2/3', label: { en: 'goals reached' } });
		expect(scoreLine('listen-act', { correct: 9, total: 6 })?.value).toBe('6/6');
		expect(scoreLine('phrases', null)).toBeNull();
		expect(scoreLine('phrases', { correct: 0, total: 0 })).toBeNull();
	});
	it('counts the phrases caught', () => {
		expect(phraseScore({ items: [{ caught: true }, { caught: false }, { caught: null }] })).toEqual({ correct: 1, total: 3 });
		expect(phraseScore(null)).toBeNull();
	});
	it('has five ratings, and only 1–5 count', () => {
		expect(RATINGS.map(r => r.value)).toEqual([1, 2, 3, 4, 5]);
		expect([0, 1, 5, 6, 2.5, '3'].map(isRating)).toEqual([false, true, true, false, false, false]);
	});
	it('counts each learner’s latest rating once, per chapter, version and step, lowest first', () => {
		const row = (user: string, rating: number, at: string, module = 'traps') => ({ user_id: user, day: 101, occurred_at: at, metadata: { module, track: 'intermediate', rating } });
		const summary = summarizeRatings([
			row('a', 1, '2026-10-28T10:00:00Z'), row('a', 4, '2026-10-28T10:05:00Z'), row('b', 2, '2026-10-28T11:00:00Z'),
			row('a', 5, '2026-10-28T12:00:00Z', 'scenario'), row('c', 9, '2026-10-28T12:00:00Z', 'scenario')
		]);
		expect(summary).toEqual([
			{ day: 101, track: 'intermediate', module: 'traps', counts: [0, 1, 0, 1, 0], count: 2, average: 3 },
			{ day: 101, track: 'intermediate', module: 'scenario', counts: [0, 0, 0, 0, 1], count: 1, average: 5 }
		]);
	});
});
