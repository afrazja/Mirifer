import { describe, it, expect } from 'vitest';
import { TRAPS, asTrapsRecord, checkSaid, emptyTrapsRecord, missedOf, normalise, saidRight, summarize } from './traps';

describe('Persian-speaker traps content', () => {
	it('has 8 traps; each wrong word is in the sentence, and the right sentence passes its own check', () => {
		expect(TRAPS).toHaveLength(8);
		for (const t of TRAPS) {
			expect(t.wrong).toBeGreaterThanOrEqual(0);
			expect(t.wrong).toBeLessThan(t.words.length);
			expect(saidRight(t, t.right), t.id).toBe(true);
			// The sentence with the mistake must fail.
			expect(saidRight(t, t.words.join(' ')), t.id).toBe(false);
			expect(/[؀-ۿ]/.test(t.why.fa)).toBe(true);
			expect(t.why.fa).not.toContain('`');
			for (const a of t.alsoOk ?? []) { expect(a.index).not.toBe(t.wrong); expect(a.index).toBeLessThan(t.words.length); }
		}
		expect(new Set(TRAPS.map(t => t.id)).size).toBe(TRAPS.length);
	});
});

describe('saidRight', () => {
	const by = (id: string) => TRAPS.find(t => t.id === id)!;
	it('accepts the fix in other natural words, and numbers as digits', () => {
		expect(saidRight(by('since-for'), "I've lived here for 2 years.")).toBe(true);
		expect(saidRight(by('since-for'), "I've been living here for two years")).toBe(true);
		expect(saidRight(by('age'), 'I am 30 years old')).toBe(true);
		expect(saidRight(by('afraid-of'), 'My son is scared of dogs')).toBe(true);
		expect(saidRight(by('agree'), 'I really agree with you')).toBe(true);
		expect(saidRight(by('he-she'), 'She is working at night')).toBe(true);
		expect(saidRight(by('bored'), "I am really bored today, let's go out")).toBe(true);
		expect(saidRight(by('he-she'), 'She works at night.')).toBe(true);
	});
	it('rejects the mistake, even when the fix is also said', () => {
		expect(saidRight(by('agree'), "I'm agree with you")).toBe(false);
		expect(saidRight(by('than'), 'My brother is taller from me')).toBe(false);
		expect(saidRight(by('age'), 'I have thirty years old')).toBe(false);
		expect(saidRight(by('said-told'), 'He said me, sorry, he told me the answer')).toBe(false);
		expect(saidRight(by('he-she'), 'My sister is a nurse he works at night')).toBe(false);
		expect(saidRight(by('bored'), "I'm so boring today")).toBe(false);
	});
	it('tells a self-fix and good alternative English apart from a mistake', () => {
		expect(checkSaid(by('said-told'), 'He said me, sorry, he told me the answer')).toBe('selfFixed');
		expect(checkSaid(by('said-told'), 'He gave me the answer')).toBe('alsoGood');
		expect(checkSaid(by('said-told'), 'He said me the answer')).toBe('wrong');
	});
	it('normalises quotes, case and punctuation', () => {
		expect(normalise('I’M  Going HOME, now!')).toBe("i'm going home now");
	});
});

describe('records', () => {
	it('summarizes, and accepts a saved run but not a broken one', () => {
		const r = emptyTrapsRecord();
		r.traps[0] = { ...r.traps[0], found: true, saidRight: true, said: true, transcript: 'x' };
		r.traps[1] = { ...r.traps[1], found: false };
		expect(summarize(r)).toEqual({ found: 1, said: 1, total: 8 });
		expect(missedOf(r)).toEqual([1, 2, 3, 4, 5, 6, 7]);
		expect(asTrapsRecord({ ...r, retry: [1, 3] })?.retry).toEqual([1, 3]);
		expect(asTrapsRecord({ ...r, retry: [99] })?.retry).toBeNull();
		expect(asTrapsRecord(JSON.parse(JSON.stringify(r)))).toEqual(r);
		expect(asTrapsRecord({ ...r, step: 'other' })).toBeNull();
		expect(asTrapsRecord({ ...r, traps: [] })).toBeNull();
	});
});
