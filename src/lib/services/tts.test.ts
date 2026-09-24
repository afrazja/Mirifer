import { describe, it, expect } from 'vitest';
import { engineRate, BASE_PACE } from './tts';

describe('engineRate', () => {
	it('maps 1.0× to the calmer base pace, not the engine default', () => {
		expect(engineRate('de', 1)).toEqual({ engine: BASE_PACE.de, playback: 1 });
		expect(engineRate('en', 1)).toEqual({ engine: BASE_PACE.en, playback: 1 });
	});

	it('leaves languages without a base pace at the engine default', () => {
		expect(engineRate('fa', 1)).toEqual({ engine: 1, playback: 1 });
	});

	it('lets the voice slow down natively as far as each engine allows', () => {
		// English (Edge) reaches 0.5 natively, no stretching.
		const en = engineRate('en', 0.75);
		expect(en.engine * en.playback).toBeCloseTo(0.525, 5);
		expect(Math.abs(en.playback - 1)).toBeLessThan(0.02); // only rounding left over
	});

	it('makes up the rest with playbackRate below the engine floor', () => {
		// German at 0.5× wants 0.4; ElevenLabs stops at 0.7.
		const de = engineRate('de', 0.5);
		expect(de.engine).toBe(0.7);
		expect(de.engine * de.playback).toBeCloseTo(0.4, 5);
	});

	it('caps fast settings at the engine maximum', () => {
		const de = engineRate('de', 2);
		expect(de.engine).toBe(1.2);
		expect(de.engine * de.playback).toBeCloseTo(1.6, 5);
	});
});
