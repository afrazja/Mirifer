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
