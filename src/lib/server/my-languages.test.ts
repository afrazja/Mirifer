import { describe, it, expect, vi } from 'vitest';
// German is paused (src/lib/courses.ts). These tests cover its flows for when it comes back, so they
// run with German switched on; src/lib/courses.test.ts covers the paused state.
vi.mock('$lib/courses', async importOriginal => {
	const real = await importOriginal<typeof import('$lib/courses')>();
	(real.COURSES.find(course => course.code === 'de') as { available: boolean }).available = true;
	return real;
});
import { myLanguages, learningList } from './my-languages';
import { progressShare } from '$lib/practice/course-progress';
import { TOTAL_DAYS } from '$services/curriculum';

function db(row: unknown, error: unknown = null) {
	const query: any = { select: () => query, eq: () => query, maybeSingle: vi.fn().mockResolvedValue({ data: row, error }) };
	return { from: vi.fn(() => query) } as any;
}
const user = (meta: Record<string, unknown>) => ({ id: 'u1', user_metadata: meta }) as any;

describe('My languages', () => {
	it('lists the active course first, with German lesson progress', async () => {
		const list = await myLanguages(db({ current_day: 12, completed_lessons: { 1: {}, 2: {}, 3: {} }, xp: 340 }), user({ target_language: 'en', learning: ['de', 'en'] }));
		expect(list.map(item => item.code)).toEqual(['en', 'de']);
		expect(list[1]).toEqual({ code: 'de', currentDay: 12, completed: 3, total: TOTAL_DAYS, xp: 340 });
	});
	it('shows only the English lessons finished, never how many there are', async () => {
		const progress = (finishedDays?: string[], lastThemeId: string | null = null) => ({ sessionsCompleted: 1, lastCompletedAt: null, lastThemeId, lastResult: null, recent: [], ...(finishedDays ? { finishedDays } : {}) });
		const [english] = await myLanguages(db(null), user({ target_language: 'en', english_progress_v1: progress(['day-1', 'day-2']) }));
		expect(english).toEqual({ code: 'en', finished: [{ number: 1, theme: expect.any(Object) }, { number: 2, theme: expect.any(Object) }] });
		// An older record kept only the last lesson: every lesson up to it counts.
		const [older] = await myLanguages(db(null), user({ target_language: 'en', english_progress_v1: progress(undefined, 'day-2') }));
		expect(older).toEqual({ code: 'en', finished: [{ number: 1, theme: expect.any(Object) }, { number: 2, theme: expect.any(Object) }] });
		const [none] = await myLanguages(db(null), user({ target_language: 'en' }));
		expect(none).toEqual({ code: 'en', finished: [] });
	});
	it('German keeps its progress bar', () => {
		expect(progressShare({ code: 'de', currentDay: 3, completed: 1, total: 4, xp: 0 })).toBe(0.25);
	});
	it('finds courses started before the list existed, and ignores a German row with nothing done', async () => {
		expect((await myLanguages(db({ current_day: 4, completed_lessons: {}, xp: 0 }), user({ target_language: 'en' }))).map(item => item.code)).toEqual(['en', 'de']);
		expect((await myLanguages(db({ current_day: 1, completed_lessons: {}, xp: 0 }), user({ target_language: 'en' }))).map(item => item.code)).toEqual(['en']);
		expect((await myLanguages(db(null), user({ english_progress_v1: { sessionsCompleted: 1, lastCompletedAt: null, lastThemeId: 'day-1', lastResult: null, recent: [] } }))).map(item => item.code)).toEqual(['en']);
	});
	it('shows nothing for a new learner, and survives a progress read failure', async () => {
		expect(await myLanguages(db(null), user({}))).toEqual([]);
		const list = await myLanguages(db(null, { message: 'down' }), user({ target_language: 'de' }));
		expect(list).toEqual([{ code: 'de', currentDay: 1, completed: 0, total: TOTAL_DAYS, xp: 0 }]);
	});
	it('drops unknown or unavailable codes from the saved list', () => {
		expect(learningList(['en', 'xx', 'fr', 'de'])).toEqual(['de', 'en', 'fr']);
		expect(learningList('de')).toEqual([]);
	});
});
