import { describe, it, expect } from 'vitest';
import { ITEMS, asDictation, emptyDictation, isRight, normalise, summarize, type DetailKind } from './dictation';

const item = (kind: DetailKind) => ITEMS.find(i => i.kind === kind)!;
const ok = (kind: DetailKind, ...answers: string[]) => answers.forEach(a => expect(isRight(a, item(kind)), `${kind}: ${a}`).toBe(true));
const no = (kind: DetailKind, ...answers: string[]) => answers.forEach(a => expect(isRight(a, item(kind)), `${kind}: ${a}`).toBe(false));

describe('content', () => {
	it('has ten items, one of each kind, each accepting its own answer', () => {
		expect(ITEMS).toHaveLength(10);
		expect(new Set(ITEMS.map(i => i.kind)).size).toBe(10);
		for (const i of ITEMS) expect(isRight(i.answer, i), i.kind).toBe(true);
	});
});

describe('checking', () => {
	it('times', () => { ok('time', '7:45', '7.45', '19:45', '7:45 pm', 'quarter to eight', 'a quarter to eight', 'Seven forty-five', '۷:۴۵'); no('time', '8:15', '8:45', '7:15', ''); });
	it('-teen and -ty', () => { ok('number', '15', 'Fifteen', ' 15 '); no('number', '50', 'fifty'); });
	it('prices', () => { ok('price', '4.99', '$4.99', '4,99', '4.99 dollars'); no('price', '499', '4.90', '9.99'); });
	it('quantities', () => { ok('quantity', '12', 'twelve', 'a dozen'); no('quantity', '6', '10'); });
	it('dates', () => { ok('date', '3 May', 'May 3', 'May 3rd', 'the third of May', '3rd May', '3/5', '5/3', 'may third'); no('date', '3 March', '30 May', '13 May'); });
	it('house numbers', () => { ok('address', '22B', '22 b', '22-B'); no('address', '22', '22D', '32B'); });
	it('codes', () => { ok('code', 'BV412', 'bv 412', 'B V 4 1 2'); no('code', 'VB412', 'BB412', 'BV421'); });
	it('phone numbers', () => { ok('phone', '617 555 0144', '617-555-0144', '(617) 555-0144', '6175550144', '617555o144'); no('phone', '617 555 144', '617 555 0145'); });
	it('spelling', () => { ok('spelling', 'Rezai', 'R-E-Z-A-I', 'r e z a i'); no('spelling', 'Rizai', 'Rezaei', 'Reza'); });
	it('emails', () => { ok('email', 'sara.k@gmail.com', 'Sara.K@Gmail.com ', 'sara.k @ gmail.com'); no('email', 'sarak@gmail.com', 'sara.k@gmail', 'sara_k@gmail.com'); });
	it('normalises Persian digits', () => { expect(normalise('۱۵', 'number')).toBe('15'); });
});

describe('records and summary', () => {
	it('round-trips and rejects bad data', () => {
		const r = emptyDictation();
		expect(asDictation(JSON.parse(JSON.stringify(r)))).toEqual(r);
		expect(asDictation(null)).toBeNull();
		expect(asDictation({ ...r, plays: [9] })).toBeNull();
		expect(asDictation({ ...r, index: 11 })).toBeNull();
	});
	it('counts right answers, first-listen ones, speed and misses', () => {
		const r = emptyDictation();
		r.answers[0] = { text: '7:45', correct: true, plays: 1, seconds: 4 };
		r.answers[1] = { text: '50', correct: false, plays: 2, seconds: 6 };
		r.answers[2] = { text: '4.99', correct: true, plays: 2, seconds: 8 };
		expect(summarize(r)).toEqual({ right: 2, firstListen: 1, averageSeconds: 6, missed: [1] });
	});
});
