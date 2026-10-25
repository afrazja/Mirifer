import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/supabase/client', () => ({
	getSupabaseBrowserClient: vi.fn()
}));

vi.mock('./auth', () => ({
	isAuthenticated: vi.fn(),
	getUser: vi.fn(),
	updateDisplayName: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('./me', () => ({ fetchMe: vi.fn().mockResolvedValue(null) }));
vi.mock('./sync-queue', () => ({
	cloudWrite: vi.fn().mockResolvedValue(undefined),
	flushQueue: vi.fn().mockResolvedValue(undefined)
}));

import {
	getLanguage,
	setLanguage,
	getVoiceSpeed,
	setVoiceSpeed,
	getProgress,
	saveProgress,
	getCompletedLessons,
	saveCompletedLessons,
	loadSRData,
	saveSRData,
	getDisplayName,
	setDisplayName,
	getAvatarUrl,
	setAvatarUrl,
	clearAllLocal,
	getExamResults,
	saveExamResult
} from './data-layer';
import { getSupabaseBrowserClient } from '$lib/supabase/client';
import { isAuthenticated, getUser } from './auth';
import { cloudWrite } from './sync-queue';
import { fetchMe } from './me';

// ─── Offline mode (no auth) ──────────────────────────────────────────────────

describe('offline mode (not authenticated)', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(isAuthenticated).mockResolvedValue(false);
	});

	// ── Language ──────────────────────────────────────────────────────────────

	describe('getLanguage', () => {
		it('returns null when nothing is stored', async () => {
			expect(await getLanguage()).toBeNull();
		});

		it('returns the stored language from localStorage', async () => {
			localStorage.setItem('mirifer_language', 'fa');
			expect(await getLanguage()).toBe('fa');
		});
	});

	describe('setLanguage', () => {
		it('writes the language to localStorage', async () => {
			await setLanguage('en');
			expect(localStorage.getItem('mirifer_language')).toBe('en');
		});

		it('calls cloudWrite with the new language', async () => {
			await setLanguage('fa');
			expect(cloudWrite).toHaveBeenCalledWith('profile_update', 'language', { language: 'fa' });
		});
	});

	// ── Voice speed ───────────────────────────────────────────────────────────

	describe('getVoiceSpeed', () => {
		it('returns null when nothing is stored', async () => {
			expect(await getVoiceSpeed()).toBeNull();
		});

		it('parses and returns a float from localStorage', async () => {
			localStorage.setItem('mirifer_voice_speed', '0.75');
			expect(await getVoiceSpeed()).toBe(0.75);
		});
	});

	describe('setVoiceSpeed', () => {
		it('stores the speed as a string in localStorage', async () => {
			await setVoiceSpeed(1.25);
			expect(localStorage.getItem('mirifer_voice_speed')).toBe('1.25');
		});
	});

	// ── Progress ──────────────────────────────────────────────────────────────

	describe('getProgress', () => {
		it('returns null when nothing is stored', async () => {
			expect(await getProgress()).toBeNull();
		});

		it('returns parsed progress from localStorage', async () => {
			const progress = { currentDay: 3, currentSentenceIndex: 2, lastSaved: 12345 };
			localStorage.setItem('mirifer_progress', JSON.stringify(progress));
			expect(await getProgress()).toEqual(progress);
		});

		it('returns null when localStorage contains corrupted JSON', async () => {
			localStorage.setItem('mirifer_progress', 'not-json');
			expect(await getProgress()).toBeNull();
		});
	});

	describe('saveProgress', () => {
		it('writes progress to localStorage with a lastSaved timestamp', async () => {
			const before = Date.now();
			await saveProgress(5, 3);
			const stored = JSON.parse(localStorage.getItem('mirifer_progress')!);
			expect(stored.currentDay).toBe(5);
			expect(stored.currentSentenceIndex).toBe(3);
			expect(stored.lastSaved).toBeGreaterThanOrEqual(before);
		});

		it('calls cloudWrite with the correct progress fields', async () => {
			await saveProgress(5, 3);
			expect(cloudWrite).toHaveBeenCalledWith(
				'progress_upsert',
				'progress',
				expect.objectContaining({ current_day: 5, current_sentence_index: 3 })
			);
		});
	});

	// ── Completed lessons ─────────────────────────────────────────────────────

	describe('getCompletedLessons', () => {
		it('returns an empty object when nothing is stored', async () => {
			expect(await getCompletedLessons()).toEqual({});
		});

		it('returns the parsed completed lessons map', async () => {
			const data = { 1: { completedAt: 123, sentenceCount: 5 } };
			localStorage.setItem('mirifer_completed_lessons', JSON.stringify(data));
			expect(await getCompletedLessons()).toEqual(data);
		});

		it('returns an empty object on corrupted JSON', async () => {
			localStorage.setItem('mirifer_completed_lessons', 'bad json');
			expect(await getCompletedLessons()).toEqual({});
		});
	});

	describe('saveCompletedLessons', () => {
		it('persists the map to localStorage', async () => {
			const data = { 1: { completedAt: 999, sentenceCount: 4 } };
			await saveCompletedLessons(data);
			expect(JSON.parse(localStorage.getItem('mirifer_completed_lessons')!)).toEqual(data);
		});
	});

	// ── Spaced repetition ─────────────────────────────────────────────────────

	describe('loadSRData', () => {
		it('returns an empty object when nothing is stored', async () => {
			expect(await loadSRData()).toEqual({});
		});

		it('returns parsed SR data from localStorage', async () => {
			const srData = {
				'1:1': { ease: 2.5, interval: 3, nextReview: 999, attempts: 2, successes: 1 }
			};
			localStorage.setItem('mirifer_sr_data', JSON.stringify(srData));
			expect(await loadSRData()).toEqual(srData);
		});

		it('returns an empty object on corrupted JSON', async () => {
			localStorage.setItem('mirifer_sr_data', 'bad json');
			expect(await loadSRData()).toEqual({});
		});
	});

	describe('saveSRData', () => {
		it('writes SR data to localStorage', async () => {
			const srData = {
				'1:1': { ease: 2.5, interval: 3, nextReview: 999, attempts: 2, successes: 1, lastReview: null }
			};
			await saveSRData(srData);
			expect(JSON.parse(localStorage.getItem('mirifer_sr_data')!)).toEqual(srData);
		});

		it('calls cloudWrite with the correct rows when data is non-empty', async () => {
			const srData = {
				'2:3': { ease: 2.0, interval: 5, nextReview: 888, attempts: 3, successes: 2, lastReview: null }
			};
			await saveSRData(srData);
			expect(cloudWrite).toHaveBeenCalledWith(
				'sr_upsert',
				'sr_bulk',
				expect.objectContaining({
					rows: expect.arrayContaining([expect.objectContaining({ day: 2, sentence_id: 3 })])
				})
			);
		});

		it('does not call cloudWrite when SR data is empty', async () => {
			await saveSRData({});
			expect(cloudWrite).not.toHaveBeenCalled();
		});
	});

	// ── Display name ──────────────────────────────────────────────────────────

	describe('getDisplayName', () => {
		it('returns null when nothing is stored', () => {
			expect(getDisplayName()).toBeNull();
		});

		it('returns the stored display name', () => {
			localStorage.setItem('mirifer_display_name', 'Alice');
			expect(getDisplayName()).toBe('Alice');
		});
	});

	describe('setDisplayName', () => {
		it('writes the display name to localStorage', async () => {
			await setDisplayName('Bob');
			expect(localStorage.getItem('mirifer_display_name')).toBe('Bob');
		});
	});

	// ── Avatar URL ────────────────────────────────────────────────────────────

	describe('getAvatarUrl / setAvatarUrl', () => {
		it('returns null when nothing is stored', () => {
			expect(getAvatarUrl()).toBeNull();
		});

		it('stores and retrieves an avatar URL', () => {
			setAvatarUrl('https://example.com/avatar.png');
			expect(getAvatarUrl()).toBe('https://example.com/avatar.png');
		});

		it('removes the key when null is passed', () => {
			localStorage.setItem('mirifer_avatar_url', 'https://example.com/avatar.png');
			setAvatarUrl(null);
			expect(getAvatarUrl()).toBeNull();
		});
	});

	// ── Exam results ──────────────────────────────────────────────────────────

	describe('saveExamResult', () => {
		it('writes a new exam result to localStorage', async () => {
			const result = { score: 18, total: 20, percentage: 90, date: 12345, wrongAnswers: [] };
			await saveExamResult('week_1', result);
			const stored = JSON.parse(localStorage.getItem('mirifer_exam_results')!);
			expect(stored['week_1']).toEqual(result);
		});

		it('merges with existing results without overwriting them', async () => {
			const existing = {
				week_1: { score: 15, total: 20, percentage: 75, date: 111, wrongAnswers: [] }
			};
			localStorage.setItem('mirifer_exam_results', JSON.stringify(existing));

			await saveExamResult('week_2', { score: 18, total: 20, percentage: 90, date: 222, wrongAnswers: [] });

			const stored = JSON.parse(localStorage.getItem('mirifer_exam_results')!);
			expect(stored['week_1']).toBeDefined();
			expect(stored['week_2']).toBeDefined();
		});

		it('calls cloudWrite with the correct week number', async () => {
			await saveExamResult('week_3', {
				score: 20,
				total: 20,
				percentage: 100,
				date: 333,
				wrongAnswers: []
			});
			expect(cloudWrite).toHaveBeenCalledWith(
				'exam_upsert',
				'exam_week_3',
				expect.objectContaining({ week_number: 3, score: 20 })
			);
		});
	});

	describe('getExamResults', () => {
		it('returns an empty object when nothing is stored', async () => {
			expect(await getExamResults()).toEqual({});
		});

		it('returns parsed exam results from localStorage', async () => {
			const data = {
				week_1: { score: 18, total: 20, percentage: 90, date: 12345, wrongAnswers: [] }
			};
			localStorage.setItem('mirifer_exam_results', JSON.stringify(data));
			expect(await getExamResults()).toEqual(data);
		});
	});

	// ── Clear all local ───────────────────────────────────────────────────────

	describe('clearAllLocal', () => {
		it('removes all mirifer-prefixed keys from localStorage', () => {
			localStorage.setItem('mirifer_progress', '{}');
			localStorage.setItem('mirifer_language', 'en');
			localStorage.setItem('mirifer_display_name', 'Alice');
			localStorage.setItem('mirifer_sr_data', '{}');
			localStorage.setItem('other_key', 'keep_me');

			clearAllLocal();

			expect(localStorage.getItem('mirifer_progress')).toBeNull();
			expect(localStorage.getItem('mirifer_language')).toBeNull();
			expect(localStorage.getItem('mirifer_display_name')).toBeNull();
			expect(localStorage.getItem('mirifer_sr_data')).toBeNull();
			// Non-mirifer keys are preserved
			expect(localStorage.getItem('other_key')).toBe('keep_me');
		});

		// These were all missed by the previous hardcoded list, which left
		// personal data on the device after sign-out and would have made
		// account deletion incomplete.
		it.each([
			'mirifer_placement',
			'mirifer_placement_probes',
			'mirifer_pending_placement',
			'mirifer_exam_settings',
			'mirifer_target_language',
			'mirifer_drill_stats',
			'mirifer_lesson_index',
			'mirifer_lesson_7',
			'mirifer_glossary',
			'mirifer_vocabulary',
			'mirifer_bookmarks',
			'mirifer_sync_queue'
		])('removes %s', (key) => {
			localStorage.setItem(key, 'x');

			clearAllLocal();

			expect(localStorage.getItem(key)).toBeNull();
		});

		it('leaves the theme alone — a device preference, not account data', () => {
			localStorage.setItem('mirifer_theme', 'dark');
			localStorage.setItem('mirifer_progress', '{}');

			clearAllLocal();

			expect(localStorage.getItem('mirifer_theme')).toBe('dark');
			expect(localStorage.getItem('mirifer_progress')).toBeNull();
		});

		it('clears every mirifer key when many are present at once', () => {
			const keys = [
				'mirifer_progress',
				'mirifer_placement',
				'mirifer_lesson_1',
				'mirifer_lesson_2',
				'mirifer_vocabulary',
				'mirifer_drill_stats'
			];
			for (const k of keys) localStorage.setItem(k, 'x');
			localStorage.setItem('mirifer_theme', 'light');
			localStorage.setItem('unrelated', 'y');

			clearAllLocal();

			// Removing while iterating would skip keys — none may survive.
			for (const k of keys) expect(localStorage.getItem(k)).toBeNull();
			expect(localStorage.getItem('mirifer_theme')).toBe('light');
			expect(localStorage.getItem('unrelated')).toBe('y');
		});
	});
});

// ─── Authenticated mode ──────────────────────────────────────────────────────

describe('authenticated mode', () => {
	const mockUser = { id: 'user-123' };

	function setupAuthMock(table: string, data: any) {
		vi.mocked(isAuthenticated).mockResolvedValue(true);
		vi.mocked(getUser).mockResolvedValue(mockUser as any);

		const chain = {
			select: vi.fn().mockReturnThis(),
			eq: vi.fn().mockReturnThis(),
			maybeSingle: vi.fn().mockResolvedValue({ data, error: null })
		};
		vi.mocked(getSupabaseBrowserClient).mockReturnValue({ from: vi.fn(() => chain) } as any);
		return chain;
	}

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getLanguage', () => {
		it('reads the language through our server and caches it in localStorage', async () => {
			setupAuthMock('user_profiles', null);
			vi.mocked(fetchMe).mockResolvedValueOnce({ language: 'fa', voiceSpeed: null, displayName: null, avatarUrl: null });

			expect(await getLanguage()).toBe('fa');
			expect(localStorage.getItem('mirifer_language')).toBe('fa');
		});

		it('falls back to localStorage when our server has no answer', async () => {
			localStorage.setItem('mirifer_language', 'en');
			setupAuthMock('user_profiles', null);

			expect(await getLanguage()).toBe('en');
		});

		it('falls back to localStorage when the profile has no language field', async () => {
			localStorage.setItem('mirifer_language', 'fa');
			setupAuthMock('user_profiles', { language: null });

			expect(await getLanguage()).toBe('fa');
		});
	});

	describe('getVoiceSpeed', () => {
		it('reads the voice speed through our server and caches it in localStorage', async () => {
			setupAuthMock('user_profiles', null);
			vi.mocked(fetchMe).mockResolvedValueOnce({ language: null, voiceSpeed: 1.5, displayName: null, avatarUrl: null });

			expect(await getVoiceSpeed()).toBe(1.5);
			expect(localStorage.getItem('mirifer_voice_speed')).toBe('1.5');
		});

		it('falls back to localStorage when our server has no answer', async () => {
			localStorage.setItem('mirifer_voice_speed', '0.8');
			setupAuthMock('user_profiles', null);

			expect(await getVoiceSpeed()).toBe(0.8);
		});
	});

	describe('getProgress', () => {
		it('fetches progress from Supabase and caches it in localStorage', async () => {
			setupAuthMock('user_progress', {
				current_day: 5,
				current_sentence_index: 2,
				last_saved: 99999
			});

			const progress = await getProgress();
			expect(progress).toEqual({
				currentDay: 5,
				currentSentenceIndex: 2,
				lastSaved: 99999,
				xp: 0,
				achievements: []
			});
			expect(JSON.parse(localStorage.getItem('mirifer_progress')!)).toEqual(progress);
		});

		it('falls back to localStorage when Supabase returns no progress row', async () => {
			const cached = { currentDay: 3, currentSentenceIndex: 1, lastSaved: 55555 };
			localStorage.setItem('mirifer_progress', JSON.stringify(cached));
			setupAuthMock('user_progress', null);

			expect(await getProgress()).toEqual(cached);
		});
	});

	describe('loadSRData', () => {
		it('fetches SR cards from Supabase and caches them in localStorage', async () => {
			vi.mocked(isAuthenticated).mockResolvedValue(true);
			vi.mocked(getUser).mockResolvedValue(mockUser as any);

			const cloudCards = [
				{
					day: 1,
					sentence_id: 1,
					ease: 2.5,
					interval_days: 3,
					next_review: 999,
					attempts: 2,
					successes: 1,
					last_review: null
				}
			];
			const chain = {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockResolvedValue({ data: cloudCards, error: null })
			};
			vi.mocked(getSupabaseBrowserClient).mockReturnValue({ from: vi.fn(() => chain) } as any);

			const srData = await loadSRData();
			expect(srData['1:1']).toEqual({
				ease: 2.5,
				interval: 3,
				nextReview: 999,
				attempts: 2,
				successes: 1,
				lastReview: null
			});
		});

		it('falls back to localStorage when Supabase returns empty cloud data', async () => {
			vi.mocked(isAuthenticated).mockResolvedValue(true);
			vi.mocked(getUser).mockResolvedValue(mockUser as any);

			const cached = {
				'2:3': { ease: 1.8, interval: 2, nextReview: 777, attempts: 3, successes: 2 }
			};
			localStorage.setItem('mirifer_sr_data', JSON.stringify(cached));

			const chain = {
				select: vi.fn().mockReturnThis(),
				eq: vi.fn().mockResolvedValue({ data: [], error: null })
			};
			vi.mocked(getSupabaseBrowserClient).mockReturnValue({ from: vi.fn(() => chain) } as any);

			expect(await loadSRData()).toEqual(cached);
		});
	});
});
