import { describe, it, expect } from 'vitest';
import { latinRuns } from './bidi';

describe('latinRuns', () => {
	it('isolates each English run in Persian text', () => {
		expect(latinRuns('بعد از «should»، «could» یا «would»')).toEqual([
			{ text: 'بعد از «', latin: false }, { text: 'should', latin: true }, { text: '»، «', latin: false },
			{ text: 'could', latin: true }, { text: '» یا «', latin: false }, { text: 'would', latin: true }, { text: '»', latin: false }
		]);
	});
	it('keeps phrases, contractions and single letters together', () => {
		expect(latinRuns('«I’m gonna call» و t یا d').filter(p => p.latin).map(p => p.text)).toEqual(['I’m gonna call', 't', 'd']);
	});
	it('leaves plain Persian alone', () => {
		expect(latinRuns('همه را گرفتی.')).toEqual([{ text: 'همه را گرفتی.', latin: false }]);
	});
});

describe('latinRuns: an English question inside Persian', () => {
	it('keeps the English ? with its words, but not a full stop', () => {
		expect(latinRuns('بگو «What do you call this?» یا «How do you say this?»')).toEqual([
			{ text: 'بگو «', latin: false }, { text: 'What do you call this?', latin: true }, { text: '» یا «', latin: false },
			{ text: 'How do you say this?', latin: true }, { text: '»', latin: false }
		]);
		expect(latinRuns('بگو today.')).toEqual([{ text: 'بگو ', latin: false }, { text: 'today', latin: true }, { text: '.', latin: false }]);
	});
});
