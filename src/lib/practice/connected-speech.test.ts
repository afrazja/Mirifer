import { describe, it, expect } from 'vitest';
import { ITEMS, PATTERNS, asConnected, emptyConnected, fullOf, summarize } from './connected-speech';

describe('content', () => {
	it('has ten items over six patterns, three distinct choices each', () => {
		expect(ITEMS).toHaveLength(10);
		expect(new Set(ITEMS.map(i => i.pattern))).toEqual(new Set(PATTERNS.map((_, i) => i)));
		for (const item of ITEMS) {
			expect(new Set(item.choices).size).toBe(3);
			expect(item.answer).toBeGreaterThanOrEqual(0);
			expect(item.answer).toBeLessThan(3);
		}
	});
	it('never has the same pattern twice in a row', () => {
		ITEMS.forEach((item, i) => { if (i) expect(item.pattern).not.toBe(ITEMS[i - 1].pattern); });
	});
	it('does not always put the right answer in the same place', () => {
		expect(new Set(ITEMS.map(i => i.answer)).size).toBe(3);
	});
	it('gives the full written form', () => {
		expect(fullOf(ITEMS[0])).toBe('I’m going to call her after lunch.');
	});
});

describe('summary and records', () => {
	it('scores per pattern and finds the weakest', () => {
		const r = emptyConnected();
		r.picks = ITEMS.map(i => i.answer);
		const linking = ITEMS.map((item, i) => ({ item, i })).filter(x => x.item.pattern === 2).map(x => x.i);
		for (const i of linking) r.picks[i] = (ITEMS[i].answer + 1) % 3;
		r.picks[ITEMS.findIndex(i => i.pattern === 3)] = null;
		const s = summarize(r);
		expect(s.right).toBe(7);
		expect(s.weakest).toBe(2);
		expect(s.byPattern[2]).toEqual({ pattern: 2, right: 0, total: 2 });
	});
	it('has no weakest pattern when everything is right', () => {
		const r = emptyConnected();
		r.picks = ITEMS.map(i => i.answer);
		expect(summarize(r)).toMatchObject({ right: 10, weakest: null });
	});
	it('round-trips and rejects bad data', () => {
		const r = emptyConnected();
		expect(asConnected(JSON.parse(JSON.stringify(r)))).toEqual(r);
		expect(asConnected(null)).toBeNull();
		expect(asConnected({ ...r, picks: [5] })).toBeNull();
		expect(asConnected({ ...r, index: 99 })).toBeNull();
	});
});
