import { describe, it, expect } from 'vitest';
import { hasBatches, buildBatchPlan, midChecksAfter, finalExercises } from './lesson-plan';
import { parseExercises } from './lesson-exercises';

const ex = (id: string, after?: string | number) => ({ id, type: 'fill', de: 'Ich ___ Ali.', options: ['heiße', 'komme'], answer: 0, after });
const exercises = parseExercises([ex('a', 'batch-1'), ex('b', 'batch-2'), ex('c', 12), ex('d'), ex('e', 'batch-1')])!;

const lesson = {
	words: [
		{ de: 'der Beruf', en: 'job', fa: 'شغل', batch: 1 },
		{ de: 'verheiratet', en: 'married', fa: 'متأهل', batch: 1 },
		{ de: 'dreißig', en: 'thirty', fa: 'سی' }
	],
	collocations: [
		{ de: 'Ich heiße …', en: 'My name is …', fa: 'اسم من …', batch: 2 },
		{ de: 'Guten Morgen', en: 'Good morning', fa: 'صبح بخیر' }
	],
	exercises
};

describe('lesson plan', () => {
	it('detects batched content', () => {
		expect(hasBatches(lesson)).toBe(true);
		expect(hasBatches({ words: [{ de: 'a', en: '', fa: '' }] })).toBe(false);
		expect(hasBatches(null)).toBe(false);
	});

	it('builds each batch followed by its quick check', () => {
		const plan = buildBatchPlan(lesson);
		expect(plan.map((b) => b.kind)).toEqual(['teach', 'check', 'teach', 'check']);
		const [t1, c1, t2, c2] = plan;
		expect(t1).toMatchObject({ kind: 'teach', batch: 1, of: 2 });
		expect(t1.kind === 'teach' && t1.items.map((i) => i.de)).toEqual(['der Beruf', 'verheiratet']);
		expect(c1.kind === 'check' && c1.exercises.map((e) => e.id)).toEqual(['a', 'e']);
		expect(t2.kind === 'teach' && t2.items[0]).toMatchObject({ de: 'Ich heiße …', phrase: true });
		expect(c2.kind === 'check' && c2.exercises.map((e) => e.id)).toEqual(['b']);
	});

	it('does not pre-teach unbatched items', () => {
		const all = buildBatchPlan(lesson).flatMap((b) => (b.kind === 'teach' ? b.items.map((i) => i.de) : []));
		expect(all).not.toContain('dreißig');
		expect(all).not.toContain('Guten Morgen');
	});

	it('puts words before phrases inside a batch', () => {
		const mixed = buildBatchPlan({
			words: [{ de: 'der Beruf', en: '', fa: '', batch: 1 }],
			collocations: [{ de: 'von Beruf', en: '', fa: '', batch: 1 }]
		});
		expect(mixed[0].kind === 'teach' && mixed[0].items.map((i) => i.phrase)).toEqual([false, true]);
	});

	it('skips a check when a batch has none', () => {
		const plan = buildBatchPlan({ words: [{ de: 'a', en: '', fa: '', batch: 1 }] });
		expect(plan.map((b) => b.kind)).toEqual(['teach']);
	});

	it('finds mid-dialogue checks by sentence index and leaves the rest for the end', () => {
		expect(midChecksAfter(lesson, 12).map((e) => e.id)).toEqual(['c']);
		expect(midChecksAfter(lesson, 3)).toEqual([]);
		expect(finalExercises(lesson).map((e) => e.id)).toEqual(['d']);
	});
});
