import { describe, it, expect } from 'vitest';
import { engineRate, basePace, GERMAN_PACE } from './tts';

describe('basePace', () => {
	it('keeps German at the learner pace for the first five lessons', () => {
		for (const day of [1, 3, 5]) expect(basePace('de', day)).toBe(GERMAN_PACE.start);
	});

	it('speeds German up in steps after that', () => {
		const paces = [5, 10, 15, 20, 25].map((d) => basePace('de', d));
		for (let i = 1; i < paces.length; i++) expect(paces[i]).toBeGreaterThanOrEqual(paces[i - 1]);
		expect(paces.at(-1)!).toBeGreaterThan(paces[0]);
		expect(paces.at(-1)!).toBeLessThan(GERMAN_PACE.native);
	});

	it('reaches native German pace by lesson 30 and stays there', () => {
		expect(basePace('de', 30)).toBe(GERMAN_PACE.native);
		expect(basePace('de', 120)).toBe(GERMAN_PACE.native);
	});

	it('keeps English slow everywhere, whatever the lesson', () => {
		expect(basePace('en', 1)).toBe(0.7);
		expect(basePace('en', 120)).toBe(0.7);
	});

	it('leaves other languages at the engine default', () => {
		expect(basePace('fa', 1)).toBe(1);
	});
});

describe('engineRate', () => {
	it('maps 1.0× to the base pace for the lesson', () => {
		expect(engineRate('de', 1, 1)).toEqual({ engine: 1, playback: 1 });
		expect(engineRate('de', 1, 40)).toEqual({ engine: 1.2, playback: 1 });
		expect(engineRate('en', 1, 40)).toEqual({ engine: 0.7, playback: 1 });
	});

	it('slows down natively down to the Edge floor', () => {
		const de = engineRate('de', 0.75, 1);
		expect(de).toEqual({ engine: 0.75, playback: 1 });
		const en = engineRate('en', 0.75, 1);
		expect(en.engine * en.playback).toBeCloseTo(0.525, 5);
		expect(Math.abs(en.playback - 1)).toBeLessThan(0.02); // only rounding left over
	});

	it('makes up the rest with playbackRate below the engine floor', () => {
		// English at 0.5× wants 0.35; Edge stops at 0.5.
		const en = engineRate('en', 0.5, 1);
		expect(en.engine).toBe(0.5);
		expect(en.engine * en.playback).toBeCloseTo(0.35, 5);
	});

	it('caps fast settings at the engine maximum', () => {
		const de = engineRate('de', 2, 40);
		expect(de.engine).toBe(1.5);
		expect(de.engine * de.playback).toBeCloseTo(2.4, 5);
	});
});
