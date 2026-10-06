import { describe, it, expect } from 'vitest';
import { decideCase, fixUse, scoreFor, type Fix } from './say-better';

const fix = (original: string, better: string, type: Fix['type'] = 'mistake'): Fix => ({ type, original, better, why: { en: '', fa: '' } });
const LONG = 'we went to the airport and the flight was late so we waited for hours and then the bag did not arrive and I talked to the woman at the desk and she said it was in another city and they sent it the next day to our hotel which was good';

describe('Say it again, better: rules', () => {
	it('decides the case on the server', () => {
		expect(decideCase([fix('I go', 'I went'), fix('very much tired', 'really tired', 'natural')], LONG)).toBe('mistakes');
		expect(decideCase([fix('very much tired', 'really tired', 'natural')], LONG)).toBe('natural');
		expect(decideCase([], LONG)).toBe('strong');
		expect(decideCase([], 'It was fine and nothing went wrong.')).toBe('more'); // too short to pass
	});
	it('counts a fix as used only with context, missed when the mistake returns', () => {
		const tense = fix('I go to airport', 'I went to the airport');
		expect(fixUse(tense, 'Last week I went to the airport very early')).toBe('used');
		expect(fixUse(tense, 'Last week I go to airport very early')).toBe('missed');
		expect(fixUse(tense, 'My flight was cancelled')).toBe('absent');
		// "the" on its own is never enough.
		expect(fixUse(fix('at airport', 'at the'), 'the bag was at the hotel')).toBe('absent');
		expect(fixUse(fix('I waited during two hours', 'for two hours'), 'I waited for two hours')).toBe('used');
		// Contractions count either way.
		expect(fixUse(fix('my bag not arrive', 'my bag didn’t arrive'), 'and my bag did not arrive so')).toBe('used');
	});
	it('scores: strong is a pass; otherwise used out of used + missed', () => {
		expect(scoreFor({ case: 'strong', fixes: [], better: null, praise: null }, [])).toEqual({ correct: 1, total: 1 });
		const fb = { case: 'mistakes' as const, fixes: [], better: 'x', praise: null };
		expect(scoreFor(fb, ['used', 'missed', 'absent'])).toEqual({ correct: 1, total: 2 });
		expect(scoreFor(fb, ['absent'])).toBeUndefined();
	});
});
