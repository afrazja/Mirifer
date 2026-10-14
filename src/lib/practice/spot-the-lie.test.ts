import { describe, it, expect } from 'vitest';
import { TALKS, asLie, emptyLie, statementLine, summarize, talkText } from './spot-the-lie';

describe('content', () => {
	it('has five talks, one trap each, exactly one lie and a real proof sentence', () => {
		expect(TALKS).toHaveLength(5);
		expect(new Set(TALKS.map(t => t.trap)).size).toBe(5);
		for (const talk of TALKS) {
			expect(talk.statements).toHaveLength(3);
			expect(new Set(talk.statements).size).toBe(3);
			expect(talk.lie).toBeGreaterThanOrEqual(0);
			expect(talk.lie).toBeLessThan(3);
			expect(talk.sentences[talk.proof]).toBeTruthy();
			expect(talk.voice).not.toBe('b'); // Mira's voice is for the statements
		}
	});
	it('does not always put the lie in the same place', () => {
		expect(new Set(TALKS.map(t => t.lie)).size).toBeGreaterThan(1);
	});
	it('never uses the same voice twice in a row', () => {
		TALKS.forEach((t, i) => { if (i) expect(t.voice).not.toBe(TALKS[i - 1].voice); });
	});
	it('reads statements with their letter', () => {
		expect(statementLine(TALKS[0], 1)).toBe('Statement B: She still works in a bank.');
		expect(talkText(TALKS[0])).toContain('used to work in a bank');
	});
});

describe('summary and records', () => {
	it('scores and lists the traps', () => {
		const r = emptyLie();
		r.picks = TALKS.map(t => t.lie);
		r.picks[3] = (TALKS[3].lie + 1) % 3;
		const s = summarize(r);
		expect(s.right).toBe(4);
		expect(s.traps.find(t => !t.caught)).toEqual({ trap: 'negative', caught: false, talk: 3 });
	});
	it('round-trips and rejects bad data', () => {
		const r = emptyLie();
		expect(asLie(JSON.parse(JSON.stringify(r)))).toEqual(r);
		expect(asLie(null)).toBeNull();
		expect(asLie({ ...r, step: 'nope' })).toBeNull();
		expect(asLie({ ...r, heard: [[true]] })).toBeNull();
		expect(asLie({ ...r, plays: [9, 0, 0, 0, 0] })).toBeNull();
	});
});
