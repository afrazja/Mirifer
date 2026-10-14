import { describe, it, expect } from 'vitest';
import { CONTRASTS, asPairsRecord, newRound, practiceRound, summarize, wordOf, type PairsRecord } from './minimal-pairs';

// A fixed "random" so rounds are repeatable in tests.
const seeded = (seed = 1) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

describe('rounds', () => {
	it('has twelve duels, every word pair once, no sound pair twice in a row', () => {
		const r = newRound(seeded());
		expect(r.duels).toHaveLength(12);
		expect(new Set(r.duels.map(d => `${d.contrast}-${d.pair}`)).size).toBe(12);
		r.duels.forEach((d, i) => { if (i) expect(d.contrast).not.toBe(r.duels[i - 1].contrast); });
		expect(r.duels.every(d => CONTRASTS[d.contrast].pairs[d.pair].includes(wordOf(d)))).toBe(true);
	});
	it('practice has only the missed sounds, every word once', () => {
		const r = practiceRound([2, 4], seeded(7));
		expect(r.practice).toBe(true);
		expect(r.duels).toHaveLength(8);
		expect(new Set(r.duels.map(d => d.contrast))).toEqual(new Set([2, 4]));
		expect(new Set(r.duels.map(wordOf)).size).toBe(8);
	});
});

describe('summary', () => {
	const played = (picksRight: boolean[]): PairsRecord => {
		const r = newRound(seeded(3));
		r.picks = r.duels.map((d, i) => (picksRight[i] ? d.target : (1 - d.target) as 0 | 1));
		return r;
	};
	it('scores and finds the weakest sound', () => {
		const r = played(Array(12).fill(true));
		const wrong = r.duels.map((d, i) => ({ d, i })).filter(x => x.d.contrast === 4).map(x => x.i);
		const other = r.duels.findIndex(d => d.contrast === 1);
		for (const i of [...wrong, other]) r.picks[i] = (1 - r.duels[i].target) as 0 | 1;
		const s = summarize(r);
		expect(s.right).toBe(9);
		expect(s.weakest).toBe(4);
		expect(s.missed).toEqual([1, 4]);
		expect(s.byContrast.find(c => c.contrast === 4)).toEqual({ contrast: 4, right: 0, total: 2 });
	});
	it('has no weakest sound when all are right', () => {
		expect(summarize(played(Array(12).fill(true)))).toMatchObject({ right: 12, weakest: null, missed: [] });
	});
});

describe('records', () => {
	it('round-trips and rejects bad data', () => {
		const r = newRound(seeded());
		expect(asPairsRecord(JSON.parse(JSON.stringify(r)))).toEqual(r);
		expect(asPairsRecord(null)).toBeNull();
		expect(asPairsRecord({ ...r, duels: [{ contrast: 9, pair: 0, target: 0 }] })).toBeNull();
		expect(asPairsRecord({ ...r, picks: [2] })).toBeNull();
	});
});
