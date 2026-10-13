import { describe, it, expect } from 'vitest';
import { asChat, betterOk, checkTurn, fixedOk, quickFirePrompt } from './quick-fire-ai';

const answer = 'I usually go to the gym after work with my brother';
const raw = (next: string, better = '', fixed = answer, onTopic = true) => ({ onTopic, next, fixed, better });

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
		expect(betterOk(Array(55).fill('gym').join(' '), answer)).toBe(false);
	});
});

describe('fixedOk', () => {
	it('accepts small corrections of their own words', () => {
		expect(fixedOk('I went to the gym after work yesterday.', 'I go gym after work yesterday')).toBe(true);
	});
	it('refuses a rewrite that is no longer their answer', () => {
		expect(fixedOk('Every evening my brother and I enjoy a relaxing swim at the local sports centre near our house.', 'I go gym')).toBe(false);
		expect(fixedOk('', 'I go gym')).toBe(false);
	});
});

describe('checkTurn', () => {
	it('passes a good next question and better answer', () => {
		const r = checkTurn(raw('What do you do at the gym?', 'I usually go to the gym after work with my brother.'), ['What do you usually do after work or class?'], answer, false);
		expect(r.next).toBe('What do you do at the gym?');
		expect(r.better).toContain('gym');
		expect(r.fixed).toBe(answer);
		expect(r.onTopic).toBe(true);
	});
	it('passes on an off-topic verdict with a bracketed model answer', () => {
		const r = checkTurn(raw('What do you cook?', '[I usually cook rice and chicken. It is quick and easy.]', 'My cat is orange.', false), [], 'my cat is orange', false);
		expect(r).toMatchObject({ onTopic: false, better: '[I usually cook rice and chicken. It is quick and easy.]', fixed: 'My cat is orange.' });
	});
	it('drops a repeated or sensitive question', () => {
		const asked = ['What do you usually do after work or class?'];
		expect(checkTurn(raw(asked[0]), asked, answer, false).next).toBeNull();
		expect(checkTurn(raw('How much money does the gym cost?'), asked, answer, false).next).toBeNull();
	});
	it('has no next question on the last turn', () => {
		expect(checkTurn(raw('What else do you do?'), [], answer, true).next).toBeNull();
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
