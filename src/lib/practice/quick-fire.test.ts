import { describe, it, expect } from 'vitest';
import { OPENERS, QUESTIONS_PER_ROUND, asQuickFire, changedParts, emptyQuickFire, fallbackQuestion, gaveReason, newTurn, questionOk, sameAnswer, summarize, type Turn } from './quick-fire';

const turn = (answer: string | null, startMs: number | null = 1000, offTopic = false): Turn => ({ ...newTurn('Q?'), answer, startMs, offTopic });

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
	it('tips answering the question first when one was off topic', () => {
		const a = 'I like it a lot because it is quiet and close to my work.';
		const s = summarize([turn(a, 500), turn('My cat is orange and very big and sleeps all day long.', 500, true)]);
		expect(s).toMatchObject({ offTopic: 1, tip: 'topic' });
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
	it('upgrades a record saved before corrections existed', () => {
		const old = { opener: 0, turns: [{ question: 'Q?', answer: 'Yes', better: null, startMs: 500 }], done: true };
		expect(asQuickFire(old)?.turns[0]).toMatchObject({ answer: 'Yes', fixed: null, offTopic: false, retried: false });
	});
	it('rejects bad data', () => {
		expect(asQuickFire(null)).toBeNull();
		expect(asQuickFire({ opener: 9, turns: [{ question: 'Q?', answer: null }], done: false })).toBeNull();
		expect(asQuickFire({ opener: 0, turns: [], done: false })).toBeNull();
	});
});

describe('corrections', () => {
	it('marks only the changed words', () => {
		const parts = changedParts('I go gym after work yesterday', 'I went to the gym after work yesterday.');
		expect(parts).toEqual([
			{ text: 'I', changed: false }, { text: 'went to the', changed: true }, { text: 'gym after work yesterday.', changed: false }
		]);
	});
	it('knows when nothing changed', () => {
		expect(sameAnswer('I usually cook at home.', 'i usually cook at home')).toBe(true);
		expect(sameAnswer('I usually cook at home.', 'I usually cooks at home')).toBe(false);
	});
});
