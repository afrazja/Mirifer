import { describe, it, expect } from 'vitest';
import { MESSAGES, asVoiceRecord, emptyVoiceRecord, summarize, verdictOf, type ReplyFeedback } from './voice-messages';

const fb = (answered: boolean[], english = true): ReplyFeedback => ({ english, answered, better: 'x', tip: null });

describe('Voice messages content', () => {
	it('has four messages, each short enough per sentence, with questions and a model reply', () => {
		expect(MESSAGES).toHaveLength(4);
		for (const m of MESSAGES) {
			expect(m.asks.length).toBeGreaterThan(0);
			// One sentence per voice request: keep each well under the voice service's limit.
			for (const s of m.sentences) expect(s.length).toBeLessThanOrEqual(120);
			expect(m.model.split(/\s+/).length).toBeLessThanOrEqual(40);
			for (const a of m.asks) { expect(/[؀-ۿ]/.test(a.ask.fa)).toBe(true); expect(/[؀-ۿ]/.test(a.missed.fa)).toBe(true); }
		}
		expect(new Set(MESSAGES.map(m => m.id)).size).toBe(MESSAGES.length);
	});
});

describe('verdictOf', () => {
	it('answered, almost, not yet, not English', () => {
		expect(verdictOf(fb([true, true]))).toBe('answered');
		expect(verdictOf(fb([true]))).toBe('answered');
		expect(verdictOf(fb([false, true]))).toBe('almost');
		expect(verdictOf(fb([false, false]))).toBe('notYet');
		expect(verdictOf(fb([true, true], false))).toBe('notEnglish');
	});
});

describe('records', () => {
	it('summarizes, and accepts a saved run but not a broken one', () => {
		const r = emptyVoiceRecord();
		r.tries[0] = { transcript: 'a', feedback: fb([true, true]) };
		r.tries[1] = { transcript: 'b', feedback: fb([true, false]) };
		expect(summarize(r)).toEqual({ answered: 1, almost: 1, total: 4, verdicts: ['answered', 'almost', null, null] });
		expect(asVoiceRecord(JSON.parse(JSON.stringify(r)))).toEqual(r);
		expect(asVoiceRecord({ ...r, listened: [true] })).toBeNull();
		expect(asVoiceRecord({ ...r, tries: [null] })).toBeNull();
		expect(asVoiceRecord(null)).toBeNull();
	});
});

import { MESSAGES as DAY_TWO_MESSAGES, LESSON_MESSAGE_IDS } from './days/day-2';
import { voiceMessageById, voiceMessagesFor, voiceMessagesIntro } from './day-content';
import { MESSAGES as DAY_ONE_MESSAGES, REPLY_VOICE, emptyVoiceRecord as emptyRecord, asVoiceRecord as asRecord, summarize as summary } from './voice-messages';

describe('Voice messages, Day 2', () => {
	it('four messages from Sara’s day: short sentences, Persian asks, a short model reply, never Mira’s voice', () => {
		expect(DAY_TWO_MESSAGES).toHaveLength(4);
		for (const m of DAY_TWO_MESSAGES) {
			expect(m.from.voice).not.toBe(REPLY_VOICE);
			for (const s of m.sentences) expect(s.length, s).toBeLessThanOrEqual(120);
			expect(m.asks.length).toBeGreaterThan(0);
			for (const a of m.asks) { expect(a.ask.fa).toMatch(/[؀-ۿ]/); expect(a.missed.fa).toMatch(/[؀-ۿ]/); }
			expect(m.model.split(/\s+/).length).toBeLessThanOrEqual(40);
			expect(m.from.who.fa).toMatch(/[؀-ۿ]/);
		}
	});
	it('has ids no other day uses, so the server finds the right message', () => {
		const ids = [...DAY_ONE_MESSAGES, ...DAY_TWO_MESSAGES].map(m => m.id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const m of DAY_TWO_MESSAGES) expect(voiceMessageById(m.id)).toBe(m);
		expect(voiceMessageById('friend')).toBe(DAY_ONE_MESSAGES[0]);
		expect(voiceMessageById('nope')).toBeNull();
	});
	it('the Intermediate lesson uses Tom and the hotel; the lab gets all four with Day 2’s intro', () => {
		expect(voiceMessagesFor('day-2').map(m => m.id)).toEqual(LESSON_MESSAGE_IDS);
		expect(voiceMessagesFor('day-2', true)).toBe(DAY_TWO_MESSAGES);
		expect(voiceMessagesFor('day-1')).toBe(DAY_ONE_MESSAGES);
		expect(voiceMessagesIntro('day-2')?.en).toContain('you’re Sara');
		expect(voiceMessagesIntro('day-1')).toBeNull();
		const r = emptyRecord(voiceMessagesFor('day-2'));
		expect(summary(r).total).toBe(2);
		expect(asRecord(r, voiceMessagesFor('day-2'))).not.toBeNull();
	});
});
