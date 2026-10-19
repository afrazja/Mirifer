import { describe, it, expect } from 'vitest';
import { RETELL_PIECES, formatDuration, getPiece, listenSeconds, speakLimit } from './retell';

describe('Listen & retell pieces', () => {
	it('caps speaking at 1:30 for short listening and 2:00 for anything longer', () => {
		expect(speakLimit({ text: 'word '.repeat(150), level: 'B1' })).toBe(90);
		expect(speakLimit({ text: 'word '.repeat(400), level: 'B1' })).toBe(120);
		expect(speakLimit({ text: 'word '.repeat(1000), level: 'B1' })).toBe(120); // about 6 minutes of listening
	});
	it('has unique pieces with key points, and a mix of limits', () => {
		expect(new Set(RETELL_PIECES.map(piece => piece.id)).size).toBe(RETELL_PIECES.length);
		for (const piece of RETELL_PIECES) {
			expect(piece.keyPoints.length).toBeGreaterThanOrEqual(4);
			expect(listenSeconds(piece)).toBeGreaterThan(40);
		}
		expect(new Set(RETELL_PIECES.map(speakLimit))).toEqual(new Set([90, 120]));
		expect(getPiece('lost-phone')?.level).toBe('A2');
		expect(getPiece('nope')).toBeNull();
	});
	it('formats durations as m:ss', () => {
		expect(formatDuration(90)).toBe('1:30');
		expect(formatDuration(5.4)).toBe('0:05');
	});
});

import { asRetellRun, emptyRetellRun, pieceImage } from './retell';
import { ALL_RETELL_PIECES, retellPieceById, retellPieceFor } from './day-content';

describe('Listen and retell in the daily lessons', () => {
	it('Day 2 has Mike’s story: B1, a fixed narrator, six key points, no picture yet', () => {
		const story = retellPieceFor('day-2');
		expect(story?.id).toBe('wedding-cake');
		expect(story?.level).toBe('B1');
		expect(story?.voice).toBe('a');
		expect(story?.keyPoints).toHaveLength(6);
		expect(speakLimit(story!)).toBe(90);
		expect(pieceImage(story!)).toBeNull();
		expect(pieceImage(RETELL_PIECES[0])).toBe('/images/retell/lost-phone.webp');
		expect(retellPieceFor('day-1')).toBeNull();
	});
	it('the server finds every story by its id, and ids are unique', () => {
		expect(new Set(ALL_RETELL_PIECES.map(piece => piece.id)).size).toBe(ALL_RETELL_PIECES.length);
		expect(retellPieceById('wedding-cake')?.title.en).toBe('The cake on the back seat');
		expect(retellPieceById('night-market')?.level).toBe('B1');
		expect(retellPieceById('nope')).toBeNull();
		for (const piece of ALL_RETELL_PIECES) expect(piece.id.length).toBeLessThanOrEqual(40);
	});
	it('a saved run comes back, and a broken one is dropped', () => {
		expect(asRetellRun(emptyRetellRun())).toEqual(emptyRetellRun());
		const result = { transcript: 'Mike drove back', words: 3, seconds: 20, wordsPerMinute: 9, total: 6, covered: [1, 5], inaccuracies: [], upgrades: [{ original: 'a', better: 'b', why: { en: 'x', fa: 'y' } }], feedback: { en: 'Good', fa: 'خوب' } };
		expect(asRetellRun({ listens: 2, textShown: true, result })?.result?.covered).toEqual([1, 5]);
		expect(asRetellRun({ listens: 9, textShown: false, result: null })?.listens).toBe(2);
		expect(asRetellRun({ listens: 1, textShown: false, result: { ...result, covered: 'all' } })).toBeNull();
		expect(asRetellRun({ listens: 1, textShown: false, result: { ...result, feedback: 'nice' } })).toBeNull();
		expect(asRetellRun({ listens: '1', textShown: false })).toBeNull();
		expect(asRetellRun(null)).toBeNull();
	});
});
