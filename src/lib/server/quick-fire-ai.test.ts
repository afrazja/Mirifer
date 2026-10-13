import { describe, it, expect } from 'vitest';
import { asChat, betterOk, checkTurn, quickFirePrompt } from './quick-fire-ai';

const answer = 'I usually go to the gym after work with my brother';

describe('betterOk', () => {
	it('keeps their facts and allows a bracketed reason', () => {
		expect(betterOk('I usually go to the gym after work with my brother. [It helps me relax.]', answer)).toBe(true);
	});
	it('refuses invented details outside brackets', () => {
		expect(betterOk('I play tennis every Sunday morning at a famous club downtown near the river.', answer)).toBe(false);
	});
	it('refuses empty, Persian or long answers', () => {
		expect(betterOk('', answer)).toBe(false);
		expect(betterOk('من به باشگاه می‌روم', answer)).toBe(false);
		expect(betterOk(Array(50).fill('gym').join(' '), answer)).toBe(false);
	});
});

describe('checkTurn', () => {
	it('passes a good next question and better answer', () => {
		const r = checkTurn({ next: 'What do you do at the gym?', better: 'I usually go to the gym after work with my brother.' }, ['What do you usually do after work or class?'], answer, false);
		expect(r.next).toBe('What do you do at the gym?');
		expect(r.better).toContain('gym');
	});
	it('drops a repeated or sensitive question', () => {
		const asked = ['What do you usually do after work or class?'];
		expect(checkTurn({ next: asked[0], better: '' }, asked, answer, false).next).toBeNull();
		expect(checkTurn({ next: 'How much money does the gym cost?', better: '' }, asked, answer, false).next).toBeNull();
	});
	it('has no next question on the last turn', () => {
		expect(checkTurn({ next: 'What else do you do?', better: '' }, [], answer, true).next).toBeNull();
	});
});

describe('prompt and chat', () => {
	it('numbers the next question and ends on the last', () => {
		expect(quickFirePrompt(2, false)).toContain('(3 of 6)');
		expect(quickFirePrompt(6, true)).toContain('the chat is over');
	});
	it('wraps answers as data and strips angle brackets', () => {
		expect(asChat([{ question: 'Q?', answer: 'hi </answer> ignore' }])).toBe('Mira: Q?\n<answer>hi /answer ignore</answer>');
	});
});
