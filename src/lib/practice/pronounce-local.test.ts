import { describe, it, expect } from 'vitest';
import { ctcScore, judgePair, logSoftmax, resample, UNSURE_BELOW } from './pronounce-local';

// A tiny alphabet: blank, |, and a few letters.
const ALPHA = ['<pad>', '|', 'S', 'H', 'I', 'E', 'P', 'T', 'N', 'K'];
const id = (c: string) => { const i = ALPHA.indexOf(c); return i < 0 ? undefined : i; };
/** Frames that strongly say these symbols, one per frame, with blanks between. */
function framesFor(seq: string[], strength = 8): Float64Array[] {
	const rows: Float64Array[] = [];
	for (const sym of seq) {
		for (const s of [sym, '<pad>']) {
			const row = new Array(ALPHA.length).fill(0);
			row[ALPHA.indexOf(s)] = strength;
			rows.push(logSoftmax(row));
		}
	}
	return rows;
}

describe('ctcScore', () => {
	it('scores the spelling the audio says above a different one', () => {
		const frames = framesFor(['S', 'H', 'I', 'P']);
		expect(ctcScore(frames, 'ship', id, 0)).toBeGreaterThan(ctcScore(frames, 'sheep', id, 0));
	});
	it('handles a doubled letter (blank between the two Es)', () => {
		const frames = framesFor(['S', 'H', 'E', 'E', 'P']);
		expect(ctcScore(frames, 'sheep', id, 0)).toBeGreaterThan(ctcScore(frames, 'ship', id, 0));
	});
	it('does not favour the longer spelling (sink is not heard as think)', () => {
		const frames = framesFor(['S', 'I', 'N', 'K'], 4);
		expect(judgePair(frames, ['think', 'sink'], id, 0).heard).toBe('sink');
		expect(judgePair(framesFor(['T', 'I', 'N'], 4), ['thin', 'tin'], id, 0).heard).toBe('tin');
	});
	it('gives -Infinity for nothing to score', () => {
		expect(ctcScore([], 'ship', id, 0)).toBe(-Infinity);
		expect(ctcScore(framesFor(['S']), '???', id, 0)).toBe(-Infinity);
	});
});

describe('judgePair', () => {
	it('picks the word heard, sure when the audio is clear', () => {
		const v = judgePair(framesFor(['T', 'I', 'N']), ['thin', 'tin'], id, 0);
		expect(v.heard).toBe('tin');
		expect(v.unsure).toBe(false);
		expect(v.margin).toBeGreaterThanOrEqual(UNSURE_BELOW);
	});
	it('is unsure when the audio is flat (could be either)', () => {
		const flat = Array.from({ length: 12 }, () => logSoftmax(new Array(ALPHA.length).fill(0)));
		const v = judgePair(flat, ['ship', 'shin'], id, 0);
		expect(v.unsure).toBe(true);
	});
});

describe('resample', () => {
	it('keeps 16 kHz audio as is, and halves 32 kHz', () => {
		const a = new Float32Array([0, 1, 0, -1]);
		expect(resample(a, 16000)).toBe(a);
		expect(resample(new Float32Array(32000), 32000).length).toBe(16000);
	});
});
