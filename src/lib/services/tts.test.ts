import { describe, it, expect } from 'vitest';
import { engineRate, paceFor, GERMAN_BASE_RATE } from './tts';

describe('paceFor', () => {
	it('plays German at the base pace at 1×, whatever the lesson', () => {
		expect(paceFor('de', 1)).toBe(GERMAN_BASE_RATE);
		expect(paceFor('de', 1)).toBe(0.9);
	});

	it('multiplies the speed setting on top of the base pace', () => {
		expect(paceFor('de', 0.75)).toBe(0.68);
	});

	it('leaves other languages at the voice\'s own speed', () => {
		expect(paceFor('en', 1)).toBe(1);
		expect(paceFor('fa', 1)).toBe(1);
	});
});

describe('engineRate', () => {
	it('asks the engine for the base pace at 1×', () => {
		expect(engineRate('de', 1)).toEqual({ engine: 0.9, playback: 1 });
		expect(engineRate('en', 1)).toEqual({ engine: 1, playback: 1 });
	});

	it('slows down natively down to the Edge floor', () => {
		expect(engineRate('de', 0.75)).toEqual({ engine: 0.68, playback: 1 });
	});

	it('makes up the rest with playbackRate below the engine floor', () => {
		const slow = engineRate('en', 0.35);
		expect(slow.engine).toBe(0.5);
		expect(slow.engine * slow.playback).toBeCloseTo(0.35, 5);
	});

	it('caps fast settings at the engine maximum', () => {
		const fast = engineRate('en', 2);
		expect(fast.engine).toBe(1.5);
		expect(fast.engine * fast.playback).toBeCloseTo(2, 5);
	});
});
