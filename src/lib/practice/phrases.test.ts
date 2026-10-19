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

import { PHRASES as DAY_TWO_PHRASES } from './days/day-2';
import { phrasesFor } from './day-content';

describe('Natural phrases, Day 2 (both versions)', () => {
	const sets = [DAY_TWO_PHRASES.intermediate, DAY_TWO_PHRASES.professional];
	it('has five sentences per version; each shown sentence is its spoken sentence with marks; each check finds its own sentence only', () => {
		for (const set of sets) {
			expect(set).toHaveLength(5);
			for (const phrase of set) {
				expect(phrase.shown.replace(/\*\*/g, '').replace(/‿/g, ' ')).toBe(phrase.sentence);
				expect(shownParts(phrase.shown).some(part => part.bold)).toBe(true);
				expect(caught(phrase, phrase.sentence), phrase.sentence).toBe(true);
				for (const other of [...sets[0], ...sets[1]]) if (other !== phrase) expect(caught(phrase, other.sentence), `${phrase.chunk} / ${other.sentence}`).toBe(false);
				for (const line of [phrase.situation.fa, phrase.tip.fa]) expect(line).toMatch(/[؀-ۿ]/);
			}
		}
	});
	it('does not accept the habits the chunks replace', () => {
		const [takeMe, across, howLong, cards, dropOff] = DAY_TWO_PHRASES.intermediate;
		expect(caught(takeMe, 'I want go to the Park Hotel')).toBe(false);
		expect(caught(across, "it's in front of the station")).toBe(false);
		expect(caught(howLong, 'how much does it take')).toBe(false);
		expect(caught(cards, 'do you accept card')).toBe(false);
		expect(caught(dropOff, 'drop off me here')).toBe(false);
		const [mind, heard, think, cash, goodOne] = DAY_TWO_PHRASES.professional;
		expect(caught(mind, 'do you mind to help me')).toBe(false);
		expect(caught(heard, 'have you heard it')).toBe(false);
		expect(caught(think, 'how long do you think will it take')).toBe(false);
		expect(caught(think, 'do you think how long it takes')).toBe(false);
		expect(caught(cash, "I don't have cash with me")).toBe(false);
		expect(caught(goodOne, 'good luck')).toBe(false);
	});
	it('accepts natural variants', () => {
		const [takeMe, , howLong, cards] = DAY_TWO_PHRASES.intermediate;
		expect(caught(takeMe, 'can you please take me to the hotel')).toBe(true);
		expect(caught(howLong, 'how long will it take')).toBe(true);
		expect(caught(cards, 'do you take credit cards')).toBe(true);
		const [mind, , think, cash, goodOne] = DAY_TWO_PHRASES.professional;
		expect(caught(mind, 'do you mind taking my bag')).toBe(true);
		expect(caught(think, "how long do you think it's going to take")).toBe(true);
		expect(caught(cash, "I don't have money on me")).toBe(true);
		expect(caught(goodOne, 'have a nice day')).toBe(true);
	});
	it('gives each day and version its own sentences', () => {
		expect(phrasesFor('day-1', 'professional')).toBe(PHRASES);
		expect(phrasesFor('day-1')[0].sentence).toBe('Hi, only one of my bags came out.');
		expect(phrasesFor('day-2', 'intermediate')).toBe(DAY_TWO_PHRASES.intermediate);
		expect(phrasesFor('day-2', 'professional')).toBe(DAY_TWO_PHRASES.professional);
		const record = emptyPhraseRecord(DAY_TWO_PHRASES.professional);
		expect(asPhraseRecord(record, DAY_TWO_PHRASES.professional)).not.toBeNull();
	});
});
