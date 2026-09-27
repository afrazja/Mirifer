import { describe, it, expect, vi } from 'vitest';
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
	it('counts English progress from the saved completion records', async () => {
		const [english] = await myLanguages(db(null), user({
			target_language: 'en',
			english_hotel_v1: { completedAt: '2026-09-26T10:00:00.000Z', variant: 'lift', turns: 7 },
			english_retell_v1: { 'lost-phone': { completedAt: '2026-09-26T10:00:00.000Z', points: 4, total: 5, textShown: false } }
		}));
		expect(english).toEqual({ code: 'en', conversationDone: true, retellDone: 1, retellTotal: 3 });
		expect(progressShare(english)).toBe(0.5);
	});
	it('finds courses started before the list existed, and ignores a German row with nothing done', async () => {
		expect((await myLanguages(db({ current_day: 4, completed_lessons: {}, xp: 0 }), user({ target_language: 'en' }))).map(item => item.code)).toEqual(['en', 'de']);
		expect((await myLanguages(db({ current_day: 1, completed_lessons: {}, xp: 0 }), user({ target_language: 'en' }))).map(item => item.code)).toEqual(['en']);
		expect((await myLanguages(db(null), user({ english_retell_v1: { 'night-market': { completedAt: '2026-09-26T10:00:00.000Z', points: 2, total: 7, textShown: true } } }))).map(item => item.code)).toEqual(['en']);
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
