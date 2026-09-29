import { describe, it, expect } from 'vitest';
import { engineRate } from './tts';

describe('engineRate', () => {
	it('maps 1.0× to the voice\'s own speed, whatever the lesson', () => {
		expect(engineRate(1)).toEqual({ engine: 1, playback: 1 });
	});

	it('slows down natively down to the Edge floor', () => {
		expect(engineRate(0.75)).toEqual({ engine: 0.75, playback: 1 });
	});

	it('makes up the rest with playbackRate below the engine floor', () => {
		const slow = engineRate(0.35);
		expect(slow.engine).toBe(0.5);
		expect(slow.engine * slow.playback).toBeCloseTo(0.35, 5);
	});

	it('caps fast settings at the engine maximum', () => {
		const fast = engineRate(2);
		expect(fast.engine).toBe(1.5);
		expect(fast.engine * fast.playback).toBeCloseTo(2, 5);
	});
});
