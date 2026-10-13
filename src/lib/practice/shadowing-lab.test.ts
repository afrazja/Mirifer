import { describe, it, expect } from 'vitest';
import { SENTENCES, checkAnswer, referenceWords, caught, hardest, patternOf, emptyShadowRecord } from './shadowing-lab';

const s = (i: number) => SENTENCES[i - 1];

describe('Shadowing lab: checking', () => {
	it('counts printed words, a contraction as one word', () => {
		expect(referenceWords(s(8))).toHaveLength(17);
		expect(checkAnswer(s(8).text, s(8), false)).toMatchObject({ got: 17, total: 17 });
	});
	it('accepts the sentence’s own full forms, not a wrong guess', () => {
		expect(checkAnswer('If I had known the traffic was going to be this bad I would have left an hour earlier', s(8), false).got).toBe(17);
		expect(checkAnswer('If I would known the traffic was going to be this bad I would of left an hour earlier', s(8), false).got).toBe(16);
	});
	it('accepts homophones, reductions and spelling variants', () => {
		expect(checkAnswer('could you lemme no weather your coming on friday so I can sort out the tickets', s(3), false).got).toBe(17);
		expect(checkAnswer('he is the kinda person who would rather do everything him self then ask any one for help', s(6), false).got).toBe(15);
		expect(checkAnswer('we ended up staying a coupla extra days cause the flights were cancelled', s(1), false).got).toBe(14);
		expect(checkAnswer('Theyve moved the meeting from the 13th to the thirtyeth so weve got a bit more time', s(2), true).got).toBe(17);
		expect(checkAnswer('They have moved the meeting from the 13th to the 30th so we have got a bit more time', s(2), false).got).toBe(17);
	});
	it('marks the missed words: small words and endings count', () => {
		const r = checkAnswer('We ended up staying couple of extra day because flights were canceled', s(1), false);
		expect(referenceWords(s(1)).filter((_, i) => !r.matched[i])).toEqual(['a', 'days', 'the']);
	});
	it('typed: a one-letter slip counts only in long words, never on endings or he/she', () => {
		expect(checkAnswer('Ive been meaning to tell you that the resturant we booked has moved to a new adress', s(5), true).got).toBe(17);
		expect(checkAnswer('Ive been meaning to tell you that the resturant we booked has moved to a new adress', s(5), false).got).toBe(15);
		expect(checkAnswer('She said he would call me back as soon as she got out of the meeting but she never did', s(4), true)).toMatchObject({ got: 18, total: 19 });
		expect(checkAnswer('We ended up staying a couple of extra day because the flight were canceled', s(1), true).got).toBe(12);
	});
});

describe('Shadowing lab: the result', () => {
	it('percentage, hardest sentence and the pattern line', () => {
		const r = emptyShadowRecord();
		const add = (i: number, text: string) => { const c = checkAnswer(text, s(i), false); r.answers[i - 1] = { text, typed: false, ...c }; };
		add(1, 'We ended up staying couple of extra days because flights were canceled');
		add(4, 'She said she would call me back as soon as she got out meeting but she never did');
		add(7, 'By time we got to movie theater the movie had already started and there weren’t any seats left');
		expect(caught(r)).toBeGreaterThan(80);
		expect(hardest(r)).toBe(0);
		expect(patternOf(r)).toBe('small');
	});
});
