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

import { SAY as DAY_TWO_SAY } from './days/day-2';
import { sayItemById, sayItemsFor } from './day-content';
import { checkSay, sayPrompt } from '$lib/server/say-in-english-ai';

describe('Say it in English, Day 2', () => {
	const all = [...DAY_TWO_SAY.intermediate, ...DAY_TWO_SAY.professional];
	it('has four messages per version, each with two points, two natural versions and two hints, in Persian too', () => {
		for (const set of [DAY_TWO_SAY.intermediate, DAY_TWO_SAY.professional]) {
			expect(set).toHaveLength(4);
			for (const item of set) {
				expect(item.points).toHaveLength(2); expect(item.models).toHaveLength(2); expect(item.hints).toHaveLength(2);
				expect(item.fa).toMatch(/[؀-ۿ]/); expect(item.to.fa).toMatch(/[؀-ۿ]/);
				for (const p of [...item.points, ...item.hints]) expect(p.fa, item.id).toMatch(/[؀-ۿ]/);
				for (const m of item.models) expect(m.split(/\s+/).length, m).toBeLessThanOrEqual(item.level === 'B1' ? 30 : 25);
			}
		}
		for (const item of DAY_TWO_SAY.professional) expect(item.level).toBe('B1');
	});
	it('has ids no other day uses, so the server finds the right message', () => {
		const ids = [...ITEMS, ...all].map(item => item.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const item of all) expect(sayItemById(item.id)).toBe(item);
		expect(sayItemById('taxi')).toBe(ITEMS[0]);
		expect(sayItemById('nope')).toBeNull();
	});
	it('the Professional lesson uses three; the lab gets all four', () => {
		expect(sayItemsFor('day-2', 'professional').map(i => i.id)).toEqual(['d2-pay-tip', 'd2-hotel-bags', 'd2-tom-dinner']);
		expect(sayItemsFor('day-2', 'professional', true)).toHaveLength(4);
		expect(sayItemsFor('day-2', 'intermediate')).toHaveLength(4);
		expect(sayItemsFor('day-1')).toBe(ITEMS);
		expect(summarize(emptySayRecord(sayItemsFor('day-2', 'professional'))).total).toBe(3);
	});
	it('coaches a B1 message at B1, with room for a longer natural version', () => {
		expect(sayPrompt('B1')).toContain('(B1 level, at most 35 words');
		expect(sayPrompt()).toContain('(A2 level, at most 25 words');
		const item = DAY_TWO_SAY.professional[1];
		const said = "Can I leave my suitcase here until three? Also the airline is bringing my backpack tomorrow morning, can you keep it for me if I am out of the hotel then?";
		const out = checkSay({ english: true, points: [true, true], better: said, tip: '', tipFa: '' }, item, said);
		expect(out.better).toBe(said);
	});
});
