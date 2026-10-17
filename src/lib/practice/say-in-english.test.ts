import { describe, it, expect } from 'vitest';
import { ITEMS, asSayRecord, betterParts, emptySayRecord, plain, summarize, verdictOf, type SayFeedback } from './say-in-english';

const fb = (points: boolean[], english = true): SayFeedback => ({ english, points, better: 'x', tip: null });

describe('Say it in English content', () => {
	it('has four messages, each with two meaning points, models and hints', () => {
		expect(ITEMS).toHaveLength(4);
		for (const item of ITEMS) {
			expect(item.points).toHaveLength(2);
			expect(item.models.length).toBeGreaterThan(0);
			expect(item.hints.length).toBeGreaterThan(0);
			expect(/[؀-ۿ]/.test(item.fa)).toBe(true);
			for (const m of item.models) expect(m.split(/\s+/).length).toBeLessThanOrEqual(25);
		}
		expect(new Set(ITEMS.map(i => i.id)).size).toBe(ITEMS.length);
	});
});

describe('verdictOf', () => {
	it('is clear when every point came across, almost for some, different for none', () => {
		expect(verdictOf(fb([true, true]))).toBe('clear');
		expect(verdictOf(fb([true, false]))).toBe('almost');
		expect(verdictOf(fb([false, false]))).toBe('different');
		expect(verdictOf(fb([true, true], false))).toBe('notEnglish');
	});
});

describe('records', () => {
	it('summarizes the clear ones', () => {
		const r = emptySayRecord();
		r.tries[0] = { transcript: 'a', feedback: fb([true, true]) };
		r.tries[1] = { transcript: 'b', feedback: fb([true, false]) };
		expect(summarize(r)).toEqual({ clear: 1, total: 4, verdicts: ['clear', 'almost', null, null] });
	});
	it('accepts a saved run and rejects a broken one', () => {
		const r = emptySayRecord();
		expect(asSayRecord(JSON.parse(JSON.stringify(r)))).toEqual(r);
		expect(asSayRecord({ ...r, tries: [null] })).toBeNull();
		expect(asSayRecord({ ...r, tries: [{ transcript: 1 }, null, null, null] })).toBeNull();
		expect(asSayRecord('x')).toBeNull();
	});
});

describe('the natural version', () => {
	it('splits out the added parts, and reads plainly', () => {
		expect(betterParts('The Park Hotel, please. [How long will it take?]')).toEqual([{ text: 'The Park Hotel, please. ', added: false }, { text: 'How long will it take?', added: true }]);
		expect(plain('The Park Hotel, please. [How long will it take?]')).toBe('The Park Hotel, please. How long will it take?');
	});
});
