import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/supabase/client', () => ({
	getSupabaseBrowserClient: vi.fn()
}));

import { resolveResumePoint, invalidateLessonCache } from './lesson-loader';

/**
 * resolveResumePoint decides where every single learner lands when they
 * open the app, and it had no tests at all until placement was built on
 * top of it. Placement has since been removed; these stay, because the
 * function underneath is still the one deciding where everybody starts.
 *
 * hasLesson/getTotalLessons read an in-memory cache that falls back to
 * localStorage, so seeding the key and invalidating is enough — no
 * Supabase involved.
 */
const LS_INDEX_KEY = 'mirifer_lesson_index';

function seedIndex(days: number[]) {
	// Invalidate FIRST. invalidateLessonCache() with no argument deletes the
	// index key from localStorage as well as clearing the in-memory cache,
	// so seeding before invalidating wipes what was just written — which is
	// exactly the mistake the first version of this file made.
	invalidateLessonCache();
	localStorage.setItem(LS_INDEX_KEY, JSON.stringify(days.map((day) => ({ day, title: `Day ${day}` }))));
}

/** Completed-set helper. */
const done = (days: number[]) => Object.fromEntries(days.map((d) => [d, { at: 1 }]));

const ALL = Array.from({ length: 100 }, (_, i) => i + 1);

beforeEach(() => {
	localStorage.clear();
	seedIndex(ALL);
});

describe('resolveResumePoint', () => {
	it('starts a brand new learner on day 1', () => {
		expect(resolveResumePoint(null, {})).toEqual({ day: 1, sentenceIndex: 0, allDone: false });
	});

	it('goes to the lowest uncompleted day', () => {
		expect(resolveResumePoint(null, done([1, 2, 3]))).toMatchObject({ day: 4, sentenceIndex: 0 });
	});

	it('fills a gap rather than running to the frontier', () => {
		// Completed 1,2,4 — day 3 is the next thing to do.
		expect(resolveResumePoint(null, done([1, 2, 4]))).toMatchObject({ day: 3 });
	});

	it('resumes mid-lesson over the frontier', () => {
		const r = resolveResumePoint({ currentDay: 7, currentSentenceIndex: 4 }, done([1, 2]));
		expect(r).toEqual({ day: 7, sentenceIndex: 4, allDone: false });
	});

	it('ignores saved progress for a lesson already completed', () => {
		const r = resolveResumePoint({ currentDay: 2, currentSentenceIndex: 5 }, done([1, 2]));
		expect(r).toMatchObject({ day: 3, sentenceIndex: 0 });
	});

	it('reaches a day numbered far above the lesson count', () => {
		// The scan used to be bounded by getTotalLessons()+10 — a count
		// standing in for a maximum day number — so a sparse index could
		// never reach day 50. Independent of placement, which is why it
		// survives placement's removal.
		seedIndex([1, 2, 3, 50, 51, 52]);
		expect(resolveResumePoint(null, done([1, 2, 3]))).toMatchObject({ day: 50 });
	});

	it('reports allDone once every lesson is finished', () => {
		const r = resolveResumePoint(null, done(ALL));
		expect(r).toEqual({ day: 100, sentenceIndex: 0, allDone: true });
	});
});

describe('lesson links from the learning path', () => {
 it('opens a completed day for replay from the beginning', () => {
  expect(resolveResumePoint({currentDay:3,currentSentenceIndex:4}, done([1,2]), 1)).toEqual({day:1,sentenceIndex:0,allDone:false});
 });
 it('opens the unlocked next day', () => {
  expect(resolveResumePoint(null, done([1,2]), 3)).toEqual({day:3,sentenceIndex:0,allDone:false});
 });
 it('keeps progress when selecting the lesson already in progress', () => {
  expect(resolveResumePoint({currentDay:3,currentSentenceIndex:4}, done([1,2]), 3)).toEqual({day:3,sentenceIndex:4,allDone:false});
 });
 it.each([4, 100, 999, 0, -1, 1.5, NaN, Infinity])('ignores locked, missing or invalid day %s', day => {
  expect(resolveResumePoint(null, done([1,2]), day)).toEqual({day:3,sentenceIndex:0,allDone:false});
 });
 it('allows replay after finishing the entire course', () => {
  expect(resolveResumePoint(null, done(ALL), 100)).toEqual({day:100,sentenceIndex:0,allDone:false});
 });
});

describe('resolveResumePoint: a requested day (a refresh inside a lesson)', () => {
	it('stays in a completed lesson that is being revisited, at the saved line', () => {
		const r = resolveResumePoint({ currentDay: 1, currentSentenceIndex: 6 }, done([1, 2, 3]), 1);
		expect(r).toEqual({ day: 1, sentenceIndex: 6, allDone: false });
	});

	it('starts a revisited lesson from the top when the saved progress is for another day', () => {
		const r = resolveResumePoint({ currentDay: 48, currentSentenceIndex: 3 }, done([1, 2, 3]), 1);
		expect(r).toEqual({ day: 1, sentenceIndex: 0, allDone: false });
	});

	it('still refuses a day that is not unlocked yet', () => {
		const r = resolveResumePoint(null, done([1, 2, 3]), 50);
		expect(r.day).toBe(4);
	});
});
