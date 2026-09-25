import { describe, it, expect } from 'vitest';
import { startHotel, replyToHotel, applyHotelChoice, isHotelAiEligible, completedHotelTrail, hotelChoices, type HotelState } from './hotel';

function say(state: HotelState, input: string) {
	const result = replyToHotel(state, input);
	expect(result.understood, input).toBe(true);
	return result.state;
}
describe('authored hotel conversation', () => {
	it.each(['lift', 'street'] as const)('completes the %s scene with clarification, price, confirmation and independent recall', variant => {
		let state = startHotel(variant);
		for (const line of ['Excuse me, my room is too noisy!', 'I’m in room 204.', 'Is it quiet?', 'Could I have a quieter room, please?', 'Is there an extra charge?', 'How do I get there?', 'Yes, thank you.', 'How much does it cost?']) state = say(state, line);
		expect(state.stage).toBe('complete');
		expect(state.turns.some(turn => turn.text.includes(variant === 'lift' ? '310' : '318'))).toBe(true);
		expect(completedHotelTrail(variant, state.trail)).toBe(true);
		expect(completedHotelTrail(variant, state.trail.slice(0, -1))).toBe(false);
	});
	it('keeps misunderstood, contradictory and out-of-context replies out of the success path', () => {
		for (const input of ['My room is not noisy.', 'I do not want a quieter room.', 'It sounds like a nightclub in here.', 'yes', '<script>alert(1)</script>']) {
			const state = startHotel(); const result = replyToHotel(state, input);
			expect(result.state).toBe(state); expect(result.understood).toBe(false);
			expect(result.feedback?.en).toContain('may still be good English');
		}
	});
	it('offers targeted corrections without changing unrelated or already-correct English', () => {
		let state = say(startHotel(), 'My room too noisy.');
		expect(state.corrections[0].improved).toBe('My room is too noisy.');
		state = say(state, '204'); state = say(state, 'I would like a quieter room');
		state = say(state, 'How much it costs?');
		expect(state.corrections[1].improved).toBe('How much does it cost?');
		expect(replyToHotel(startHotel(), 'My room is very noisy.').state.corrections).toEqual([]);
		expect(replyToHotel(startHotel(), 'My room too noisy and I do not want to move.').understood).toBe(false);
	});
	it('asks the learner to check a noisy offer and verify the price before accepting', () => {
		let state = say(startHotel(), 'Can I change rooms?');
		const wrongRoom = replyToHotel(state, '999'); expect(wrongRoom.state).toBe(state); expect(wrongRoom.feedback?.en).toContain('204');
		state = say(state, 'room 204');
		expect(replyToHotel(state, 'yes').feedback?.en).toContain('quieter option');
		state = say(state, 'I need a quieter room');
		expect(replyToHotel(state, 'yes').feedback?.en).toContain('costs extra');
		state = say(state, 'Is it free?'); state = say(state, 'No, thank you.');
		expect(state.stage).toBe('alternative');
	});
	it.each([['lift', '310'], ['street', '318']] as const)('offers two rooms and confirms the learner’s choice in the %s scene', (variant, noisyRoom) => {
		let state = say(startHotel(variant), 'My room is too noisy.');
		state = say(state, '204');
		expect(state.turns.at(-1)?.text).toContain(`room ${noisyRoom}`);
		expect(state.turns.at(-1)?.text).toContain('512');
		state = say(state, `What about room ${noisyRoom}?`);
		expect(state.stage).toBe('offer');
		expect(state.turns.at(-1)?.text).toContain('may still be noisy');
		state = say(state, 'Room 512, please.');
		expect(state.turns.at(-1)?.text).toContain('Room 512, certainly');
		state = say(state, 'Does it cost extra?');
		expect(state.turns.at(-1)?.text).toContain('no extra charge');
		state = say(state, 'Yes, thank you.');
		expect(state.turns.at(-2)?.text).toContain('All arranged');
	});
	it('every displayed example works at its reachable stage', () => {
		for (const variant of ['lift', 'street'] as const) {
			let state = startHotel(variant);
			while (state.stage !== 'complete') {
				for (const option of hotelChoices(state)) expect(replyToHotel(state, option.text).understood).toBe(true);
				state = say(state, hotelChoices(state)[0].text);
			}
		}
	});
	it('rejects fabricated completion paths and oversized replies', () => {
		expect(completedHotelTrail('lift', ['accept', 'recall-price'])).toBe(false);
		expect(completedHotelTrail('lift', ['noise', 'room204', 'quieter', 'price', 'accept', 'recall-price', 'recall-price'])).toBe(false);
		expect(replyToHotel(startHotel(), 'a'.repeat(301)).understood).toBe(false);
	});
	it('lets AI select a current intent or acknowledge a relevant question without skipping goals', () => {
		const state = startHotel();
		const accepted = applyHotelChoice(state, 'noise', 'The music kept me awake all night.');
		expect(accepted.understood).toBe(true);
		expect(accepted.state.stage).toBe('room');
		expect(accepted.state.turns[1].text).toBe('The music kept me awake all night.');
		const related = applyHotelChoice(accepted.state, 'related', 'Where is my key card?');
		expect(related.understood).toBe(true);
		expect(related.state.stage).toBe('room');
		expect(related.state.turns.at(-1)?.text).toContain('room number');
		expect(completedHotelTrail('lift', [...related.state.trail, 'quieter'])).toBe(false);
		expect(applyHotelChoice(state, 'accept', 'yes').understood).toBe(false);
		expect(isHotelAiEligible(state, 'My room is not noisy.')).toBe(false);
		expect(isHotelAiEligible(accepted.state, '999')).toBe(false);
	});
});
