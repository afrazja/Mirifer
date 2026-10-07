import { describe, it, expect } from 'vitest';
import { PHRASES, asPhraseRecord, caught, emptyPhraseRecord, shownParts, tipParts } from './phrases';

const [supposed, turned, worse, ended, inTheEnd] = PHRASES;

describe('Natural phrases', () => {
	it('the shown sentence is the spoken sentence with marks, and the chunk is in bold', () => {
		for (const phrase of PHRASES) {
			expect(phrase.shown.replace(/\*\*/g, '').replace(/‿/g, ' ')).toBe(phrase.sentence);
			const bold = shownParts(phrase.shown).filter(part => part.bold).map(part => (part.tie ? ' ' : part.text)).join('').replace(/[,.]$/, '').toLowerCase();
			expect(phrase.chunk).toContain(bold.replace(/^it /, '').split(' ')[0]);
			expect(bold.split(' ').length).toBeGreaterThanOrEqual(2);
			expect(caught(phrase, phrase.sentence)).toBe(true);
		}
	});
	it('accepts the chunk in reduced or slightly different forms', () => {
		expect(caught(supposed, 'my bag was suppose to arrive with me')).toBe(true);
		expect(caught(supposed, "the bus wasn't supposed to leave")).toBe(true);
		expect(caught(turned, 'turns out they put it on the wrong flight')).toBe(true);
		expect(caught(worse, 'to make it even worse my phone died')).toBe(true);
		expect(caught(ended, 'we ended up in a small hotel')).toBe(true);
		expect(caught(inTheEnd, 'In the end it came.')).toBe(true);
	});
	it('does not accept the habits the chunks replace', () => {
		expect(caught(supposed, 'I suppose to arrive')).toBe(false);
		expect(caught(turned, 'it was turned out they had put it')).toBe(false);
		expect(caught(turned, 'he turned out the lights')).toBe(false);
		expect(caught(ended, 'I ended up to buy clothes')).toBe(false);
		expect(caught(inTheEnd, 'in the end of the trip')).toBe(false);
		expect(caught(inTheEnd, 'at the end it arrived')).toBe(false);
	});
	it('marks English inside tips, so it stays left-to-right in Persian', () => {
		expect(tipParts(turned.tip.fa).filter(part => part.english).map(part => part.text)).toEqual(['turned out', 'd', 'out', 'turn-DOUT', '-ed']);
	});
	it('checks a saved record', () => {
		expect(asPhraseRecord(emptyPhraseRecord())).not.toBeNull();
		expect(asPhraseRecord({ ...emptyPhraseRecord(), index: 9 })).toBeNull();
		expect(asPhraseRecord({ ...emptyPhraseRecord(), items: [] })).toBeNull();
		expect(asPhraseRecord('x')).toBeNull();
	});
});
