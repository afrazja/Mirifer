import { describe, it, expect } from 'vitest';
import { TEXTS, asReadRate, emptyReadRate, glossParts, ratingText, summarize, validRating } from './read-rate';

describe('content', () => {
	it('has three texts, each gloss found in its body', () => {
		expect(TEXTS).toHaveLength(3);
		for (const t of TEXTS) for (const g of t.glosses) expect(t.body.join(' '), `${t.id}: ${g.word}`).toContain(g.word);
	});
	it('keeps texts short enough to read on a phone', () => {
		for (const t of TEXTS) expect(t.body.join(' ').split(/\s+/).length, t.id).toBeLessThanOrEqual(95);
	});
});

describe('ratings', () => {
	it('checks stars and choices', () => {
		const [hotel, friend] = TEXTS;
		expect(validRating(hotel, 3)).toBe(true);
		expect(validRating(hotel, 0)).toBe(false);
		expect(validRating(hotel, 6)).toBe(false);
		expect(validRating(friend, 1)).toBe(true);
		expect(validRating(friend, 2)).toBe(false);
		expect(validRating(friend, 0.5)).toBe(false);
	});
	it('puts the rating in words', () => {
		expect(ratingText(TEXTS[0], 4)).toBe('4 of 5 stars');
		expect(ratingText(TEXTS[1], 1)).toBe('Stay');
	});
});

describe('glossParts', () => {
	it('splits a paragraph around glossed words, in order', () => {
		const parts = glossParts('Breakfast was homemade, and the lobby was nice.', TEXTS[0].glosses);
		expect(parts).toEqual([
			{ text: 'Breakfast was ', gloss: null }, { text: 'homemade', gloss: 1 }, { text: ', and the ', gloss: null },
			{ text: 'lobby', gloss: 0 }, { text: ' was nice.', gloss: null }
		]);
	});
	it('rebuilds every paragraph exactly', () => {
		for (const t of TEXTS) for (const p of t.body) expect(glossParts(p, t.glosses).map(x => x.text).join('')).toBe(p);
	});
});

describe('records and summary', () => {
	it('round-trips and rejects bad data', () => {
		const r = emptyReadRate();
		expect(asReadRate(JSON.parse(JSON.stringify(r)))).toEqual(r);
		expect(asReadRate(null)).toBeNull();
		expect(asReadRate({ ...r, texts: [{ ...r.texts[0], step: 'nope' }, r.texts[1], r.texts[2]] })).toBeNull();
		expect(asReadRate({ ...r, texts: [{ ...r.texts[0], rating: 9 }, r.texts[1], r.texts[2]] })).toBeNull();
	});
	it('summarises the replies', () => {
		const r = emptyReadRate();
		r.texts[0].feedback = { onTask: true, facts: [{ said: 'the beach is close', correct: true, fix: '' }, { said: 'bad breakfast', correct: false, fix: 'Breakfast was excellent.' }], reason: true, better: null };
		r.texts[1].feedback = { onTask: true, facts: [], reason: false, better: null };
		expect(summarize(r)).toEqual({ replied: 2, usedText: 1, reasons: 1, wrongFacts: 1 });
	});
});
