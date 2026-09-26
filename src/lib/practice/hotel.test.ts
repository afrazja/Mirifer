import { describe, it, expect } from 'vitest';
import { GOAL_IDS, fallbackLine, hotelFacts, learnerTurns, startHotel, wordCount } from './hotel';

describe('open hotel role-play', () => {
	it('starts with Jamie’s greeting and no goals', () => {
		const state = startHotel('street');
		expect(state).toMatchObject({ variant: 'street', goals: [], proof: null, done: false });
		expect(state.turns).toEqual([{ speaker: 'reception', text: expect.stringContaining('How can I help') }]);
	});
	it('gives each variant its own noisy room, and both a no-charge quiet room', () => {
		expect(hotelFacts('lift')).toContain('Room 310');
		expect(hotelFacts('lift')).not.toContain('318');
		expect(hotelFacts('street')).toContain('Room 318');
		for (const variant of ['lift', 'street'] as const) {
			expect(hotelFacts(variant)).toContain('Room 512');
			expect(hotelFacts(variant)).toContain('costs nothing extra');
		}
	});
	it('falls back to a line about the first goal still open', () => {
		expect(fallbackLine([])).toContain('what’s wrong');
		expect(fallbackLine(['problem'])).toContain('What would you like to do');
		expect(fallbackLine(['problem', 'solution', 'confirm'])).toContain('cost');
		expect(fallbackLine(GOAL_IDS)).toContain('All arranged');
	});
	it('counts learner turns and words', () => {
		const state = startHotel();
		state.turns.push({ speaker: 'learner', text: 'The music downstairs is very loud.' }, { speaker: 'reception', text: 'I’m sorry.' });
		expect(learnerTurns(state)).toEqual(['The music downstairs is very loud.']);
		expect(wordCount('  The music   is loud. ')).toBe(4);
	});
});
