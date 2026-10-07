import { describe, it, expect } from 'vitest';
import { MIRA_LINES, daysSince, greetingMode, isMicAttempt, loadGreeting, localDate, micSentence, opening, saveGreeting } from './coach';
import { EMPTY_PROGRESS } from './english-progress';

const at = (iso: string) => new Date(iso);

describe('Mira the coach', () => {
	it('counts calendar days in local time', () => {
		const now = new Date(2026, 9, 5, 9, 0);
		expect(daysSince(null, now)).toBeNull();
		expect(daysSince(new Date(2026, 9, 5, 1, 0).toISOString(), now)).toBe(0);
		expect(daysSince(new Date(2026, 9, 4, 23, 30).toISOString(), now)).toBe(1);
		expect(daysSince(new Date(2026, 8, 25, 12, 0).toISOString(), now)).toBe(10);
	});
	it('picks the greeting', () => {
		const now = new Date(2026, 9, 5, 9, 0);
		expect(greetingMode(EMPTY_PROGRESS, now)).toBe('first');
		const p = { ...EMPTY_PROGRESS, sessionsCompleted: 2, lastCompletedAt: new Date(2026, 9, 5, 8, 0).toISOString() };
		expect(greetingMode(p, now)).toBe('again-today');
		expect(greetingMode({ ...p, lastCompletedAt: new Date(2026, 9, 3).toISOString() }, now)).toBe('returning');
	});
	it('builds the mic-check sentence without the name', () => {
		expect(micSentence(true, 'work')).toBe("I'm learning English for work.");
		expect(micSentence(true, null)).toBe("I'm learning English.");
		expect(micSentence(false, 'abroad')).toBe("I'm ready for today's practice.");
	});
	it('accepts any attempt of three words', () => {
		expect(isMicAttempt('I am learning')).toBe(true);
		expect(isMicAttempt('hello')).toBe(false);
	});
	it('says hello once, with the name once and no question', () => {
		expect(opening('first', 'Sam', null)).toEqual(MIRA_LINES.welcome('Sam'));
		expect(opening('returning', 'Sam', 1).en).toBe('Welcome back, Sam. Good to see you again.');
		expect(opening('returning', '', 9).en).toBe('Good to see you again. We’ll start with something easy.');
		expect(opening('again-today', 'Sam', 0).en).toBe('Back for more, Sam? Let’s go.');
		expect(opening('returning', '', 1).fa).toBe('خوش برگشتی. خوشحالم دوباره می‌بینمت.');
		for (const mode of ['first', 'returning'] as const) {
			const line = opening(mode, 'Sam', 2).en;
			expect(line.split('Sam').length - 1).toBe(1);
			expect(line).not.toContain('?');
		}
	});
	it('keeps the day’s greeting for that day only', () => {
		const record = { date: '2026-10-05', mode: 'first' as const, opening: { en: 'Hi', fa: 'سلام' }, answer: 'Hi I am Sam', typed: false, reply: null, done: true, improved: null, noteEn: null, noteFa: null };
		saveGreeting(record);
		expect(loadGreeting('2026-10-05')).toEqual(record);
		expect(loadGreeting('2026-10-06')).toBeNull();
		expect(localDate(at('2026-10-05T12:00:00'))).toBe('2026-10-05');
	});
});

import { planLine } from './coach';
describe('Mira reads the plan', () => {
	it('numbers the parts in order', () => {
		const line = planLine([{ en: 'Listen and act', fa: 'گوش بده و عمل کن' }, { en: 'Say it again, better', fa: 'دوباره بگو، بهتر' }, { en: 'A short recap', fa: 'یک مرور کوتاه' }]);
		expect(line.en).toBe('Today we have three parts. One: Listen and act. Two: Say it again, better. Three: A short recap.');
		expect(line.fa).toBe('امروز سه بخش داریم. یک: گوش بده و عمل کن. دو: دوباره بگو، بهتر. سه: یک مرور کوتاه.');
	});
});
