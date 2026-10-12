import { describe, it, expect } from 'vitest';
import { TOPICS, bestWords, countWords, pausesText, pickTopic, resultLine, usualWords, type Run } from './free-talk';

const run = (words: number, pauses: number, full = true): Run => ({ topic: 0, words, pauses, seconds: full ? 60 : 30, at: 0, full });

describe('60-second free talk', () => {
	it('counts words by fixed rules: no fillers, a word said twice in a row counts once', () => {
		expect(countWords('Um, I I I like the summer, uh, because it’s warm and and sunny.')).toBe(9);
		expect(countWords("I don't know, maybe 20 minutes.")).toBe(6);
		expect(countWords('')).toBe(0);
	});
	it('never repeats the last topic', () => {
		for (let i = 0; i < 50; i++) expect(pickTopic(3)).not.toBe(3);
		expect(pickTopic(null, () => 0.999)).toBe(TOPICS.length - 1);
	});
	it('early-stopped runs never count toward best or usual', () => {
		const runs = [run(80, 3), run(150, 0, false), run(90, 2), run(100, 1)];
		expect(bestWords(runs)).toBe(100);
		expect(usualWords(runs)).toBe(90);
		expect(usualWords(runs.slice(0, 2))).toBeNull();
	});
	it('Mira’s line: never praises fewer pauses when they simply said less, never claims progress from one run', () => {
		expect(resultLine(run(80, 3), null, 0).en).toContain('first score');
		expect(resultLine(run(120, 2), run(100, 3), 110).en).toBe('New best: 120 words!');
		expect(resultLine(run(105, 2), run(100, 3), 110).en).toContain('More words and fewer long pauses');
		expect(resultLine(run(95, 1), run(100, 3), 110).en).toContain('Fewer long pauses');
		expect(resultLine(run(40, 0), run(100, 3), 110).en).toContain('Some topics are harder');
		expect(resultLine(run(40, 0, false), run(100, 3), 110).en).toContain('stopped early');
		expect(resultLine(run(105, 4), run(100, 3), 110).en).not.toContain('progress');
	});
	it('pause wording handles zero and one', () => {
		expect(pausesText(0).en).toBe('no long pauses');
		expect(pausesText(1).en).toBe('1 long pause');
		expect(pausesText(3).en).toBe('3 long pauses');
	});
});
