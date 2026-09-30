import { describe, it, expect } from 'vitest';
import {
	ITEM_SECONDS,
	countLessonContent,
	estimateMinutes,
	estimateSeconds,
	lessonMinutes
} from './lesson-duration';

const sentences = (received: number, sent: number) => [
	...Array.from({ length: received }, () => ({ role: 'received' })),
	...Array.from({ length: sent }, () => ({ role: 'sent' }))
];

describe('estimateSeconds', () => {
	it('adds up the items it is given', () => {
		expect(estimateSeconds({ received: 2, sent: 3 })).toBe(
			2 * ITEM_SECONDS.received + 3 * ITEM_SECONDS.sent
		);
	});

	it('charges for the grammar moment only when there is one', () => {
		const base = { received: 1, sent: 1 };
		expect(estimateSeconds({ ...base, hasGrammarMoment: true })).toBe(
			estimateSeconds(base) + ITEM_SECONDS.grammarMoment
		);
	});

	it('treats missing and negative counts as zero', () => {
		expect(estimateSeconds({ received: 0, sent: 0 })).toBe(0);
		expect(estimateSeconds({ received: 0, sent: 0, words: -5, paragraphs: undefined })).toBe(0);
	});

	// A learner's own line costs far more than the other speaker's — build
	// plus speak plus feedback against a single tap.
	it('prices a spoken line above a heard one', () => {
		expect(ITEM_SECONDS.sent).toBeGreaterThan(ITEM_SECONDS.received * 2);
	});
});

describe('estimateMinutes', () => {
	// Calibration: the seeded content is ~10.8 sentences split evenly plus a
	// grammar moment, and those lessons really are about seven minutes.
	it('puts a typical seeded lesson at about seven minutes', () => {
		// 1082 sentences over 100 lessons = 10.8 per lesson, split evenly.
		// Either way round an 11-sentence lesson lands on 7.
		expect(estimateMinutes({ received: 6, sent: 5, hasGrammarMoment: true })).toBe(7);
		expect(estimateMinutes({ received: 5, sent: 6, hasGrammarMoment: true })).toBe(7);
	});

	it('lands each tier of the content recipe inside its budget', () => {
		// A1 beginner — target 10 min
		expect(
			estimateMinutes({ words: 6, collocations: 4, received: 5, sent: 5, hasGrammarMoment: true })
		).toBeLessThanOrEqual(10);
		// A2 top — target 22 min
		expect(
			estimateMinutes({
				collocations: 8,
				received: 8,
				sent: 14,
				paragraphs: 2,
				hasGrammarMoment: true
			})
		).toBeLessThanOrEqual(22);
		// B1 top — target 30 min
		expect(
			estimateMinutes({
				collocations: 10,
				received: 10,
				sent: 16,
				paragraphs: 4,
				hasGrammarMoment: true
			})
		).toBeLessThanOrEqual(30);
	});

	it('is 0 for an empty lesson but never rounds real content down to 0', () => {
		expect(estimateMinutes({ received: 0, sent: 0 })).toBe(0);
		expect(estimateMinutes({ received: 1, sent: 0 })).toBe(1);
	});
});

describe('countLessonContent', () => {
	it('splits sentences by role', () => {
		expect(countLessonContent({ sentences: sentences(4, 6) })).toMatchObject({
			received: 4,
			sent: 6
		});
	});

	it('counts a sentence with no role as the learner speaking', () => {
		expect(countLessonContent({ sentences: [{}] })).toMatchObject({ received: 0, sent: 1 });
	});

	it('notices the grammar moment', () => {
		expect(countLessonContent({ sentences: [], grammarNote: { title: 'x' } }).hasGrammarMoment).toBe(
			true
		);
		expect(countLessonContent({ sentences: [] }).hasGrammarMoment).toBe(false);
	});

	// Collocations and paragraphs are not in the data yet; the estimate has to
	// stay correct in the meantime rather than blow up or guess.
	it('reads zero for content types the data does not carry yet', () => {
		expect(countLessonContent({ sentences: sentences(1, 1) })).toMatchObject({
			words: 0,
			collocations: 0,
			paragraphs: 0
		});
	});

	it('picks them up once they exist', () => {
		const c = countLessonContent({
			sentences: sentences(2, 2),
			collocations: [{}, {}, {}],
			paragraphs: [{}]
		});
		expect(c).toMatchObject({ collocations: 3, paragraphs: 1 });
	});

	it('survives a missing lesson', () => {
		expect(countLessonContent(null)).toMatchObject({ received: 0, sent: 0 });
		expect(lessonMinutes(null)).toBe(0);
	});
});

describe('batched lessons', () => {
	it('count only the items that are pre-taught', () => {
		const counts = countLessonContent({
			sentences: [{ role: 'received' }, { role: 'sent' }],
			words: [{ batch: 1 }, {}],
			collocations: [{ batch: 2 }, {}, {}]
		});
		expect(counts.words).toBe(1);
		expect(counts.collocations).toBe(1);
	});

	it('count every item when nothing is batched', () => {
		const counts = countLessonContent({ words: [{}, {}], collocations: [{}] });
		expect(counts.words).toBe(2);
		expect(counts.collocations).toBe(1);
	});
});
