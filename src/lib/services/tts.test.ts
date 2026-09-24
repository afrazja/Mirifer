import { describe, it, expect } from 'vitest';
import { engineRate, basePace, GERMAN_PACE } from './tts';

describe('basePace', () => {
	it('keeps German slow for the first five lessons', () => {
		for (const day of [1, 3, 5]) expect(basePace('de', day)).toBe(GERMAN_PACE.start);
	});

	it('speeds German up a little each lesson after that', () => {
		const paces = [5, 10, 15, 20, 25].map((d) => basePace('de', d));
		for (let i = 1; i < paces.length; i++) expect(paces[i]).toBeGreaterThanOrEqual(paces[i - 1]);
		expect(paces.at(-1)!).toBeGreaterThan(paces[0]);
		expect(paces.at(-1)!).toBeLessThan(1);
	});

	it('reaches native German pace by lesson 30 and stays there', () => {
		expect(basePace('de', 30)).toBe(1);
		expect(basePace('de', 120)).toBe(1);
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
		expect(engineRate('de', 1, 1)).toEqual({ engine: 0.8, playback: 1 });
		expect(engineRate('de', 1, 40)).toEqual({ engine: 1, playback: 1 });
		expect(engineRate('en', 1, 40)).toEqual({ engine: 0.7, playback: 1 });
	});

	it('lets English slow down natively to the Edge floor', () => {
		const en = engineRate('en', 0.75, 1);
		expect(en.engine * en.playback).toBeCloseTo(0.525, 5);
		expect(Math.abs(en.playback - 1)).toBeLessThan(0.02); // only rounding left over
	});

	it('makes up the rest with playbackRate below the German engine floor', () => {
		// 0.5× in lesson 1 wants 0.4; ElevenLabs stops at 0.7.
		const de = engineRate('de', 0.5, 1);
		expect(de.engine).toBe(0.7);
		expect(de.engine * de.playback).toBeCloseTo(0.4, 5);
	});

	it('caps fast settings at the engine maximum', () => {
		const de = engineRate('de', 2, 40);
		expect(de.engine).toBe(1.2);
		expect(de.engine * de.playback).toBeCloseTo(2, 5);
	});
});
