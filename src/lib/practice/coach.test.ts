import { describe, it, expect } from 'vitest';
import { daysSince, firstSentence, greetingMode, isFirstSentenceAttempt, loadGreeting, localDate, saveGreeting, scriptedOpening, scriptedReply } from './coach';
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
	it('builds the first sentence from the onboarding reason', () => {
		expect(firstSentence('Sam', 'work')).toBe('Hi, I’m Sam, and I’m learning English for work.'.replace(/’/g, "'"));
		expect(firstSentence('', null)).toBe("Hi, I'm learning English.");
		expect(firstSentence('Sara', 'abroad')).toBe("Hi, I'm Sara, and I'm learning English to live abroad.");
	});
	it('accepts any attempt of three words', () => {
		expect(isFirstSentenceAttempt('hi I am')).toBe(true);
		expect(isFirstSentenceAttempt('hello')).toBe(false);
	});
	it('writes scripted lines with one question at most and no name gaps', () => {
		const q = 'Has anything ever gone wrong for you on a trip?';
		expect(scriptedOpening('returning', 'Sam', 1, q).en).toBe(`Welcome back, Sam. ${q}`);
		expect(scriptedOpening('returning', '', 9, q).en).toBe(`Good to see you again. We’ll start with something easy. ${q}`);
		expect(scriptedOpening('again-today', 'Sam', 0, q).en).toBe('Back for more, Sam? Let’s go.');
		expect(scriptedOpening('returning', '', 1, q).fa).toBe('خوش برگشتی.');
		expect(scriptedReply('', false).en).toBe('Okay, let’s start today’s practice.');
		for (const line of [scriptedOpening('returning', 'Sam', 2, q).en, scriptedOpening('returning', 'Sam', 30, q).en]) expect(line.split('?').length - 1).toBe(1);
	});
	it('keeps the day’s greeting for that day only', () => {
		const record = { date: '2026-10-05', mode: 'first' as const, opening: { en: 'Hi', fa: 'سلام' }, answer: 'Hi I am Sam', typed: false, reply: null, improved: null, noteEn: null, noteFa: null };
		saveGreeting(record);
		expect(loadGreeting('2026-10-05')).toEqual(record);
		expect(loadGreeting('2026-10-06')).toBeNull();
		expect(localDate(at('2026-10-05T12:00:00'))).toBe('2026-10-05');
	});
});
