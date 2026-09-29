import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/supabase/client', () => ({
	getSupabaseBrowserClient: vi.fn()
}));

import {
	getLessonIndex,
	loadLesson,
	loadLessons,
	getLesson,
	hasLesson,
	invalidateLessonCache,
	loadGlossary,
	getGlossaryMeaning,
	getTotalLessons
} from './lesson-loader';
import { getSupabaseBrowserClient } from '$lib/supabase/client';

/** Build a mock Supabase client where from(table) returns a chainable object
 *  that resolves `result` when the last method in the chain is called. */
function mockSbFor(table: string, result: any) {
	const chain = {
		select: vi.fn().mockReturnThis(),
		eq: vi.fn().mockReturnThis(),
		order: vi.fn().mockResolvedValue(result),
		maybeSingle: vi.fn().mockResolvedValue(result)
	};
	return {
		from: vi.fn((t: string) => (t === table ? chain : chain)),
		_chain: chain
	};
}

/** Build a mock Supabase client that routes different tables to different results. */
function mockSbForTables(map: Record<string, any>) {
	const chains: Record<string, any> = {};
	for (const [table, result] of Object.entries(map)) {
		chains[table] = {
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			order: vi.fn().mockResolvedValue(result),
			maybeSingle: vi.fn().mockResolvedValue(result)
		};
	}
	return { from: vi.fn((t: string) => chains[t] ?? chains['lessons']) };
}

describe('getLessonIndex', () => {
	beforeEach(() => {
		invalidateLessonCache();
		vi.clearAllMocks();
	});

	it('fetches lesson metadata and returns a mapped array', async () => {
		const raw = [
			{ day: 1, title: 'The Café', title_fa: 'کافه', group: 'beginner', sort_order: 1 },
			{ day: 2, title: 'Greetings', title_fa: 'سلام', group: 'beginner', sort_order: 2 }
		];
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(
			mockSbFor('lessons', { data: raw, error: null }) as any
		);

		const index = await getLessonIndex();
		expect(index).toHaveLength(2);
		expect(index[0].day).toBe(1);
		expect(index[0].title).toBe('The Café');
		expect(index[0].titleFa).toBe('کافه');
		expect(index[0].group).toBe('beginner');
	});

	it('generates backward-compatible file field (day-N.json)', async () => {
		const raw = [{ day: 5, title: 'Market', title_fa: '', group: 'intermediate', sort_order: 5 }];
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(
			mockSbFor('lessons', { data: raw, error: null }) as any
		);

		const index = await getLessonIndex();
		expect(index[0].file).toBe('day-5.json');
	});

	it('caches the result so Supabase is only called once', async () => {
		const raw = [{ day: 1, title: 'The Café', title_fa: '', group: 'beginner', sort_order: 1 }];
		const sb = mockSbFor('lessons', { data: raw, error: null });
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);

		await getLessonIndex();
		await getLessonIndex();

		expect(sb.from).toHaveBeenCalledTimes(1);
	});

	it('returns an empty array and caches it on Supabase error', async () => {
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(
			mockSbFor('lessons', { data: null, error: { message: 'DB error' } }) as any
		);

		const index = await getLessonIndex();
		expect(index).toEqual([]);
	});

	it('returns an empty array when data is null with no error', async () => {
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(
			mockSbFor('lessons', { data: null, error: null }) as any
		);

		expect(await getLessonIndex()).toEqual([]);
	});
});

describe('getTotalLessons', () => {
	beforeEach(() => {
		invalidateLessonCache();
		vi.clearAllMocks();
	});

	it('returns 0 before the index is loaded', () => {
		expect(getTotalLessons()).toBe(0);
	});

	it('returns the lesson count after the index is loaded', async () => {
		const raw = [
			{ day: 1, title: 'A', title_fa: '', group: 'g', sort_order: 1 },
			{ day: 2, title: 'B', title_fa: '', group: 'g', sort_order: 2 }
		];
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(
			mockSbFor('lessons', { data: raw, error: null }) as any
		);

		await getLessonIndex();
		expect(getTotalLessons()).toBe(2);
	});
});

describe('loadLesson', () => {
	beforeEach(() => {
		invalidateLessonCache();
		vi.clearAllMocks();
	});

	function setupTwoTableMock(lessonRow: any, sentenceRows: any[]) {
		const sb = mockSbForTables({
			lessons: { data: lessonRow, error: null },
			sentences: { data: sentenceRows, error: null }
		});
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);
		return sb;
	}

	it('loads lesson metadata and sentences', async () => {
		const lessonRow = { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', title: 'The Café', title_fa: 'کافه' };
		const sentenceRows = [
			{
				sentence_order: 0,
				role: 'received',
				audio_text: 'Hallo!',
				target_text: null,
				translation: 'Hello!',
				translation_fa: 'سلام!'
			},
			{
				sentence_order: 1,
				role: 'sent',
				audio_text: null,
				target_text: 'Guten Morgen',
				translation: 'Good morning',
				translation_fa: 'صبح بخیر'
			}
		];
		setupTwoTableMock(lessonRow, sentenceRows);

		const lesson = await loadLesson(1);

		expect(lesson).not.toBeNull();
		expect(lesson!.title).toBe('The Café');
		expect(lesson!.titleFa).toBe('کافه');
		expect(lesson!.sentences).toHaveLength(2);
		expect(lesson!.sentences[0].role).toBe('received');
		expect(lesson!.sentences[0].audioText).toBe('Hallo!');
		expect(lesson!.sentences[1].role).toBe('sent');
		expect(lesson!.sentences[1].targetText).toBe('Guten Morgen');
	});

	it('loads a lesson\'s goals, and drops a malformed list instead of the lesson', async () => {
		const id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
		const goals = [{ id: 'name', en: 'Say your name', fa: 'اسمتان را بگویید', sentences: [5] }];
		setupTwoTableMock({ id, title: 'Intro', title_fa: null, goals }, []);
		expect((await loadLesson(1))!.goals).toEqual(goals);

		invalidateLessonCache();
		setupTwoTableMock({ id, title: 'Intro', title_fa: null, goals: [{ nope: true }] }, []);
		const lesson = await loadLesson(1);
		expect(lesson!.title).toBe('Intro');
		expect(lesson!.goals).toBeUndefined();
	});

	it('assigns 1-based sentence IDs from sentence_order', async () => {
		const lessonRow = { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', title: 'Test', title_fa: '' };
		const sentenceRows = [
			{ sentence_order: 0, role: 'received', audio_text: 'Hi', target_text: null, translation: 'Hi', translation_fa: '' },
			{ sentence_order: 1, role: 'sent', audio_text: null, target_text: 'Tschüss', translation: 'Bye', translation_fa: '' }
		];
		setupTwoTableMock(lessonRow, sentenceRows);

		const lesson = await loadLesson(1);
		expect(lesson!.sentences[0].id).toBe(1);
		expect(lesson!.sentences[1].id).toBe(2);
	});

	it('returns null when the lesson is not found', async () => {
		const sb = mockSbForTables({ lessons: { data: null, error: null } });
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);

		expect(await loadLesson(999)).toBeNull();
	});

	it('caches the lesson after the first load', async () => {
		const sb = setupTwoTableMock({ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', title: 'The Café', title_fa: '' }, []);

		await loadLesson(1);
		await loadLesson(1);

		// First load: from('lessons') + from('sentences') = 2 calls
		expect(sb.from).toHaveBeenCalledTimes(2);
	});

	it('handles an empty sentence list', async () => {
		setupTwoTableMock({ id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', title: 'Empty', title_fa: '' }, []);

		const lesson = await loadLesson(1);
		expect(lesson!.sentences).toHaveLength(0);
	});
});

describe('loadLessons', () => {
	beforeEach(() => {
		invalidateLessonCache();
		vi.clearAllMocks();
	});

	it('loads multiple lessons in parallel', async () => {
		let callCount = 0;
		const sb = {
			from: vi.fn().mockImplementation(() => {
				callCount++;
				return {
					select: vi.fn().mockReturnThis(),
					eq: vi.fn().mockReturnThis(),
					order: vi.fn().mockResolvedValue({ data: [], error: null }),
					maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
				};
			})
		};
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);

		await loadLessons([1, 2, 3]);
		// Each loadLesson calls from() twice (lessons + sentences), but only when not cached.
		// Since they all return null (no lesson found), they each call from('lessons') once.
		expect(sb.from).toHaveBeenCalledTimes(3);
	});
});

describe('getLesson (sync cache read)', () => {
	beforeEach(() => {
		invalidateLessonCache();
	});

	it('returns null if the lesson has not been loaded yet', () => {
		expect(getLesson(1)).toBeNull();
	});
});

describe('hasLesson', () => {
	beforeEach(() => {
		invalidateLessonCache();
		vi.clearAllMocks();
	});

	it('returns false before the index is loaded', () => {
		expect(hasLesson(1)).toBe(false);
	});

	it('returns true for a day present in the index', async () => {
		const raw = [{ day: 3, title: 'Day 3', title_fa: '', group: 'g', sort_order: 3 }];
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(
			mockSbFor('lessons', { data: raw, error: null }) as any
		);

		await getLessonIndex();
		expect(hasLesson(3)).toBe(true);
	});

	it('returns false for a day not in the index', async () => {
		const raw = [{ day: 1, title: 'Day 1', title_fa: '', group: 'g', sort_order: 1 }];
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(
			mockSbFor('lessons', { data: raw, error: null }) as any
		);

		await getLessonIndex();
		expect(hasLesson(99)).toBe(false);
	});
});

describe('invalidateLessonCache', () => {
	beforeEach(() => {
		invalidateLessonCache();
		vi.clearAllMocks();
	});

	it('removes a specific day from the lesson cache', async () => {
		const sb = mockSbForTables({
			lessons: { data: { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', title: 'The Café', title_fa: '' }, error: null },
			sentences: { data: [], error: null }
		});
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);

		await loadLesson(1);
		expect(getLesson(1)).not.toBeNull();

		invalidateLessonCache(1);
		expect(getLesson(1)).toBeNull();
	});

	it('clears all caches when called with no argument', async () => {
		const raw = [{ day: 1, title: 'Day 1', title_fa: '', group: 'g', sort_order: 1 }];
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(
			mockSbFor('lessons', { data: raw, error: null }) as any
		);

		await getLessonIndex();
		invalidateLessonCache();

		// Index is cleared so hasLesson returns false
		expect(hasLesson(1)).toBe(false);
	});
});

describe('loadGlossary', () => {
	beforeEach(() => {
		invalidateLessonCache();
		vi.clearAllMocks();
	});

	it('fetches and maps glossary rows', async () => {
		const raw = [
			{ word: 'hallo', en: 'hello', fa: 'سلام' },
			{ word: 'danke', en: 'thank you', fa: 'ممنون' }
		];
		const chain = {
			select: vi.fn().mockResolvedValue({ data: raw, error: null })
		};
		vi.mocked(getSupabaseBrowserClient).mockReturnValue({ from: vi.fn(() => chain) } as any);

		const glossary = await loadGlossary();
		expect(glossary['hallo']).toEqual({ en: 'hello', fa: 'سلام' });
		expect(glossary['danke']).toEqual({ en: 'thank you', fa: 'ممنون' });
	});

	it('returns an empty object on error', async () => {
		const chain = {
			select: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } })
		};
		vi.mocked(getSupabaseBrowserClient).mockReturnValue({ from: vi.fn(() => chain) } as any);

		const glossary = await loadGlossary();
		expect(glossary).toEqual({});
	});
});

describe('offline caching (localStorage)', () => {
	beforeEach(() => {
		invalidateLessonCache();
		vi.clearAllMocks();
	});

	it('mirrors the lesson index to localStorage on a successful fetch', async () => {
		const raw = [{ day: 1, title: 'The Café', title_fa: 'کافه', group: 'beginner', sort_order: 1 }];
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(
			mockSbFor('lessons', { data: raw, error: null }) as any
		);

		await getLessonIndex();

		const stored = JSON.parse(localStorage.getItem('mirifer_lesson_index')!);
		expect(stored).toHaveLength(1);
		expect(stored[0].title).toBe('The Café');
	});

	it('falls back to the cached index when Supabase fails (offline)', async () => {
		// Seed a prior offline cache, then simulate an offline fetch failure.
		const cached = [{ day: 1, file: 'day-1.json', title: 'Cached Café', titleFa: '', group: 'beginner' }];
		localStorage.setItem('mirifer_lesson_index', JSON.stringify(cached));
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(
			mockSbFor('lessons', { data: null, error: { message: 'network down' } }) as any
		);

		const index = await getLessonIndex();
		expect(index).toHaveLength(1);
		expect(index[0].title).toBe('Cached Café');
	});

	it('mirrors a loaded lesson to localStorage on a successful fetch', async () => {
		const sb = mockSbForTables({
			lessons: { data: { id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', title: 'The Café', title_fa: '' }, error: null },
			sentences: { data: [{ sentence_order: 0, role: 'received', audio_text: 'Hallo', target_text: null, translation: 'Hello', translation_fa: '' }], error: null }
		});
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);

		await loadLesson(7);

		const stored = JSON.parse(localStorage.getItem('mirifer_lesson_7')!);
		expect(stored.title).toBe('The Café');
		expect(stored.sentences).toHaveLength(1);
	});

	it('falls back to the cached lesson when Supabase fails (offline)', async () => {
		const cachedLesson = { title: 'Offline Café', sentences: [{ id: 1, role: 'received', translation: 'Hi' }] };
		localStorage.setItem('mirifer_lesson_3', JSON.stringify(cachedLesson));
		localStorage.setItem('mirifer_lesson_3_v', '3');
		const sb = mockSbForTables({ lessons: { data: null, error: { message: 'network down' } } });
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);

		const lesson = await loadLesson(3);
		expect(lesson).not.toBeNull();
		expect(lesson!.title).toBe('Offline Café');
	});

	it('getLesson reads from localStorage when not in the in-memory cache', () => {
		const cachedLesson = { title: 'Synced Café', sentences: [] };
		localStorage.setItem('mirifer_lesson_9', JSON.stringify(cachedLesson));
		localStorage.setItem('mirifer_lesson_9_v', '3');

		expect(getLesson(9)!.title).toBe('Synced Café');
	});

	// A copy cached before a content migration must not be served as if it
	// were current — that is how Day 1's warm-up stayed invisible to everyone
	// who had already opened Day 1.
	it('ignores a cached lesson written by an older shape', () => {
		localStorage.setItem('mirifer_lesson_11', JSON.stringify({ title: 'Stale', sentences: [] }));
		expect(getLesson(11)).toBeNull();

		localStorage.setItem('mirifer_lesson_11_v', '1');
		expect(getLesson(11)).toBeNull();

		// Version 2 predates goals: a Day 1 cached then would never show them.
		localStorage.setItem('mirifer_lesson_11_v', '2');
		expect(getLesson(11)).toBeNull();
	});

	it('invalidateLessonCache clears the localStorage copies too', async () => {
		const raw = [{ day: 1, title: 'Day 1', title_fa: '', group: 'g', sort_order: 1 }];
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(
			mockSbFor('lessons', { data: raw, error: null }) as any
		);
		await getLessonIndex();
		expect(localStorage.getItem('mirifer_lesson_index')).not.toBeNull();

		invalidateLessonCache();
		expect(localStorage.getItem('mirifer_lesson_index')).toBeNull();
	});
});

describe('getGlossaryMeaning', () => {
	beforeEach(() => {
		invalidateLessonCache();
		vi.clearAllMocks();
	});

	it('returns null if glossary has not been loaded', () => {
		expect(getGlossaryMeaning('hallo', 'en')).toBeNull();
	});

	it('returns the English meaning when language is en', async () => {
		const raw = [{ word: 'hallo', en: 'hello', fa: 'سلام' }];
		const chain = { select: vi.fn().mockResolvedValue({ data: raw, error: null }) };
		vi.mocked(getSupabaseBrowserClient).mockReturnValue({ from: vi.fn(() => chain) } as any);

		await loadGlossary();
		expect(getGlossaryMeaning('hallo', 'en')).toBe('hello');
	});

	it('returns the Farsi meaning when language is fa', async () => {
		const raw = [{ word: 'hallo', en: 'hello', fa: 'سلام' }];
		const chain = { select: vi.fn().mockResolvedValue({ data: raw, error: null }) };
		vi.mocked(getSupabaseBrowserClient).mockReturnValue({ from: vi.fn(() => chain) } as any);

		await loadGlossary();
		expect(getGlossaryMeaning('hallo', 'fa')).toBe('سلام');
	});

	it('returns null for an unknown word', async () => {
		const chain = { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
		vi.mocked(getSupabaseBrowserClient).mockReturnValue({ from: vi.fn(() => chain) } as any);

		await loadGlossary();
		expect(getGlossaryMeaning('unbekannt', 'en')).toBeNull();
	});

	it('looks up words case-insensitively', async () => {
		const raw = [{ word: 'hallo', en: 'hello', fa: 'سلام' }];
		const chain = { select: vi.fn().mockResolvedValue({ data: raw, error: null }) };
		vi.mocked(getSupabaseBrowserClient).mockReturnValue({ from: vi.fn(() => chain) } as any);

		await loadGlossary();
		expect(getGlossaryMeaning('Hallo', 'en')).toBe('hello');
	});
});
