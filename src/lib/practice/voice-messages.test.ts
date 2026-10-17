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
