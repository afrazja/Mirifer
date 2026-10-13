import { describe, it, expect } from 'vitest';
import { OPENERS, QUESTIONS_PER_ROUND, asQuickFire, emptyQuickFire, fallbackQuestion, gaveReason, questionOk, summarize, type Turn } from './quick-fire';

const turn = (answer: string | null, startMs: number | null = 1000): Turn => ({ question: 'Q?', answer, better: null, startMs });

describe('questionOk', () => {
	it('accepts a short everyday question', () => {
		expect(questionOk('What do you usually cook at the weekend?', [])).toBe(true);
	});
	it('refuses non-questions, long or short ones, Persian and repeats', () => {
		expect(questionOk('Tell me about your weekend.', [])).toBe(false);
		expect(questionOk('Why?', [])).toBe(false);
		expect(questionOk('What is the one thing that you would really like to change about the place where you live now?', [])).toBe(false);
		expect(questionOk('What do you like about تهران?', [])).toBe(false);
		expect(questionOk('What kind of food do you like?', ['What kind of food do you LIKE?'])).toBe(false);
	});
	it('refuses sensitive topics', () => {
		expect(questionOk('How much money do you earn?', [])).toBe(false);
		expect(questionOk('Are you married?', [])).toBe(false);
		expect(questionOk('What do you think of the government?', [])).toBe(false);
	});
});

describe('fallbackQuestion', () => {
	it('gives the next follow-up not yet asked', () => {
		const o = OPENERS[0];
		expect(fallbackQuestion(0, [o.question])).toBe(o.followUps[0]);
		expect(fallbackQuestion(0, [o.question, o.followUps[0]])).toBe(o.followUps[1]);
	});
	it('moves to another opener when all are used', () => {
		const o = OPENERS[2];
		expect(fallbackQuestion(2, [o.question, ...o.followUps])).toBe(OPENERS[0].question);
	});
});

describe('summarize', () => {
	it('counts quick starts, reasons and longer answers', () => {
		const s = summarize([
			turn('I usually cook because it helps me relax after a long day.', 900),
			turn('Pizza.', 4000),
			turn(null, null)
		]);
		expect(s).toMatchObject({ quick: 1, reasons: 1, extended: 1, answered: 2, tip: 'reason' });
	});
	it('says great when everything is there', () => {
		const a = 'I like it a lot because it is quiet and close to my work.';
		expect(summarize(Array.from({ length: QUESTIONS_PER_ROUND }, () => turn(a, 500))).tip).toBe('great');
	});
	it('tips a quicker start when only that is missing', () => {
		const a = 'I like it a lot because it is quiet and close to my work.';
		expect(summarize(Array.from({ length: 4 }, () => turn(a, 5000))).tip).toBe('start');
	});
	it('spots reasons in natural answers', () => {
		expect(gaveReason("It's nice, so I go there a lot")).toBe(true);
		expect(gaveReason('I go to the park')).toBe(false);
	});
});

describe('records', () => {
	it('starts with the opener and survives a round trip', () => {
		const r = emptyQuickFire(1);
		expect(r.turns[0].question).toBe(OPENERS[1].question);
		expect(asQuickFire(JSON.parse(JSON.stringify(r)))).toEqual(r);
	});
	it('rejects bad data', () => {
		expect(asQuickFire(null)).toBeNull();
		expect(asQuickFire({ opener: 9, turns: [{ question: 'Q?', answer: null }], done: false })).toBeNull();
		expect(asQuickFire({ opener: 0, turns: [], done: false })).toBeNull();
	});
});
