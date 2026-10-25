import { describe, it, expect } from 'vitest';
import { glossFor, hasGlosses, wordKey } from './word-glosses';
import { PHRASES } from './days/day-1/phrases';

describe('tap a word (Day 1 Natural phrases, owner preview)', () => {
	it('has a Persian meaning for every word of every Intermediate sentence', () => {
		for (const phrase of PHRASES.intermediate) {
			expect(hasGlosses(phrase.sentence)).toBe(true);
			for (const word of phrase.sentence.match(/[A-Za-z’']+/g) ?? []) expect(glossFor(phrase.sentence, word), `${word} in “${phrase.sentence}”`).not.toBeNull();
		}
	});
	it('looks words up the way they appear, and gives the meaning in that sentence', () => {
		expect(wordKey('It’s')).toBe("it's");
		expect(glossFor('Hi, only one of my bags came out.', 'came')?.chunk?.en).toBe('came out');
		expect(glossFor('Oh no. So when can I get it back?', 'it')?.fa).toContain('چمدان');
		expect(glossFor('My toothbrush is in there, and I need it tonight.', 'it')?.fa).toContain('مسواک');
		expect(glossFor('Another sentence.', 'another')).toBeNull();
	});
});
