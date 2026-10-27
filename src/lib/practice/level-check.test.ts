import { describe, expect, it } from 'vitest';
import { LISTEN_ITEMS, REPEAT_PASS, REPEAT_SENTENCES, combine, englishWords, isNoAnswer, mostlyPersian, repeatScore, talkBand } from './level-check';

describe('level check content', () => {
	it('has two listening items with three options and one answer each, and two sentences to repeat', () => {
		expect(LISTEN_ITEMS).toHaveLength(2);
		for (const item of LISTEN_ITEMS) { expect(item.options).toHaveLength(3); expect(item.options[item.answer]).toBeTruthy(); }
		expect(REPEAT_SENTENCES).toHaveLength(2);
		for (const s of REPEAT_SENTENCES) expect(s).not.toMatch(/\d/); // "2" and "two" would not match
	});
});

describe('repeat score', () => {
	const [s1, s2] = REPEAT_SENTENCES;
	it('is 1 for the sentence said back, and ignores extra words and accent spellings', () => {
		expect(repeatScore(s1, 'My sister works in a hotel near the station.')).toBe(1);
		expect(repeatScore(s1, 'um my sister works in a, in a hotel near the station')).toBe(1);
		expect(repeatScore(s1, 'My sister works in a hotel near the stasion')).toBe(1);
	});
	it('drops for missing and wrong words, and for stopping halfway', () => {
		expect(repeatScore(s2, 'If it is raining tonight we will stay and order pizza')).toBeLessThan(1);
		expect(repeatScore(s2, 'If it’s still raining tonight')).toBeLessThan(REPEAT_PASS);
		expect(repeatScore(s1, 'My sister works in a hotel')).toBeLessThan(REPEAT_PASS);
		expect(repeatScore(s1, '')).toBe(0);
	});
	it('passes a near miss of up to two words in the first sentence', () => {
		expect(repeatScore(s1, 'My sister work in hotel near the station')).toBeGreaterThanOrEqual(REPEAT_PASS);
	});
});

describe('no answer', () => {
	it('catches silence, made-up thanks and copied instructions', () => {
		expect(isNoAnswer('Thank you.', 3)).toBe(true);
		expect(isNoAnswer('My sister works in a hotel.', 1)).toBe(true);
		expect(isNoAnswer('The speaker is a Persian speaker learning English.', 4)).toBe(true);
		expect(isNoAnswer('My sister works in a hotel.', 4)).toBe(false);
	});
	it('tells Persian from English', () => {
		expect(mostlyPersian('من در تهران زندگی می‌کنم')).toBe(true);
		expect(mostlyPersian('I live in Tehran, خیلی خوب')).toBe(false);
		expect(englishWords('من I live in Tehran')).toBe(4);
	});
});

describe('talk band', () => {
	it('never reaches natural without the AI', () => {
		expect(talkBand(null, 80)).toBe('simple');
		expect(talkBand(null, 10)).toBe('hard');
	});
	it('applies the server’s rules on top of the AI', () => {
		expect(talkBand({ english: false, memorised: false, band: 'natural' }, 60)).toBe('hard');
		expect(talkBand({ english: true, memorised: true, band: 'natural' }, 60)).toBe('simple');
		expect(talkBand({ english: true, memorised: false, band: 'natural' }, 30)).toBe('simple');
		expect(talkBand({ english: true, memorised: false, band: 'hard' }, 45)).toBe('simple');
		expect(talkBand({ english: true, memorised: false, band: 'natural' }, 50)).toBe('natural');
	});
});

describe('combining', () => {
	it('follows the table: only the talk reaches natural', () => {
		expect(combine({ listen: 2, repeat: 1, talk: 'natural' })).toBe('natural');
		expect(combine({ listen: 1, repeat: 1, talk: 'natural' })).toBe('simple');
		expect(combine({ listen: 2, repeat: 2, talk: 'simple' })).toBe('simple');
		expect(combine({ listen: 1, repeat: 0, talk: 'simple' })).toBe('hard');
		expect(combine({ listen: 2, repeat: 2, talk: 'hard' })).toBe('simple');
		expect(combine({ listen: 2, repeat: 1, talk: 'hard' })).toBe('hard');
	});
	it('counts a missing task as one point, and handles a missing talk or microphone', () => {
		expect(combine({ listen: null, repeat: 2, talk: 'natural' })).toBe('natural');
		expect(combine({ listen: 2, repeat: 2, talk: null })).toBe('simple');
		expect(combine({ listen: 1, repeat: 0, talk: null })).toBe('hard');
		expect(combine({ listen: 2, repeat: null, talk: null, mic: false })).toBe('simple');
		expect(combine({ listen: 1, repeat: null, talk: null, mic: false })).toBe('hard');
	});
});
