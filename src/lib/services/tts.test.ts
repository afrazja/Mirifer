import { describe, it, expect } from 'vitest';
import { engineRate, paceFor, GERMAN_BASE_RATE, ENGLISH_BASE_RATE } from './tts';

describe('paceFor', () => {
	it('plays German at the base pace at 1×, whatever the lesson', () => {
		expect(paceFor('de', 1)).toBe(GERMAN_BASE_RATE);
		expect(paceFor('de', 1)).toBe(0.9);
	});

	it('multiplies the speed setting on top of the base pace', () => {
		expect(paceFor('de', 0.75)).toBe(0.68);
	});

	it('plays English at its base pace, above the 0.7 that sounded unnatural', () => {
		expect(paceFor('en', 1)).toBe(ENGLISH_BASE_RATE);
		expect(paceFor('en', 1)).toBe(0.8);
		expect(ENGLISH_BASE_RATE).toBeGreaterThan(0.7);
	});

	it('leaves other languages at the voice\'s own speed', () => {
		expect(paceFor('fa', 1)).toBe(1);
	});
});

describe('engineRate', () => {
	it('asks the engine for the base pace at 1×', () => {
		expect(engineRate('de', 1)).toEqual({ engine: 0.9, playback: 1 });
		expect(engineRate('en', 1)).toEqual({ engine: 0.8, playback: 1 });
		expect(engineRate('fa', 1)).toEqual({ engine: 1, playback: 1 });
	});

	it('slows down natively down to the Edge floor', () => {
		expect(engineRate('de', 0.75)).toEqual({ engine: 0.68, playback: 1 });
	});

	it('makes up the rest with playbackRate below the engine floor', () => {
		// Persian has no base pace: 0.35 wants 0.35, and Edge stops at 0.5.
		const slow = engineRate('fa', 0.35);
		expect(slow.engine).toBe(0.5);
		expect(slow.engine * slow.playback).toBeCloseTo(0.35, 5);
	});

	it('caps fast settings at the engine maximum', () => {
		const fast = engineRate('fa', 2);
		expect(fast.engine).toBe(1.5);
		expect(fast.engine * fast.playback).toBeCloseTo(2, 5);
	});
});
