/**
 * Data Layer — Server-first data access with offline fallback.
 * Authenticated: Supabase is source of truth, localStorage is cache.
 * Not authenticated: localStorage only (offline mode).
 * Ported from data-layer.js (window.MiriferData IIFE).
 */

import { getSupabaseBrowserClient } from '$lib/supabase/client';
import { isAuthenticated, getUser, updateDisplayName as authUpdateDisplayName } from './auth';
import { cloudWrite, flushQueue } from './sync-queue';
import { trackObstacle } from './analytics';
import { logError, logWarn } from '$utils/error';
import { getCourse, isAvailableCourse } from '$lib/courses';
export { loadPracticeDraft, savePracticeDraft, clearPracticeDraft } from './practice-draft';
import {
	UserProfileLanguageRowSchema,
	UserProfileVoiceSpeedRowSchema,
	UserProfileRowSchema,
	UserProgressRowSchema,
	UserProgressFullRowSchema,
	CompletedLessonsRowSchema,
	SRCardRowSchema,
	ExamResultRowSchema,
	VocabularyRowSchema
} from '$lib/schemas';

// ========== LANGUAGE ==========

/**
 * Declare the interface language on <html>.
 *
 * Without this the whole app is served as lang="en" even when the UI is
 * Persian, so a screen reader pronounces Persian with English phonetics —
 * unusable for exactly the audience this app targets. `dir` follows, so
 * RTL no longer depends on each component remembering to set it.
 *
 * WCAG 3.1.1 (Language of Page).
 */
/** The language a public page's address sets: /fa and its pages Persian; /, /try English; else null. */
export function urlLanguage(pathname: string): 'en' | 'fa' | null {
	if (pathname === '/fa' || pathname.startsWith('/fa/')) return 'fa';
	return pathname === '/' || pathname === '/try' ? 'en' : null;
}

export function applyDocumentLanguage(lang: string | null | undefined): void {
	if (typeof document === 'undefined') return;
	// The public pages' language is their address's (/fa is Persian), whatever the saved setting.
	const isFa = (urlLanguage(location.pathname) ?? lang) === 'fa';
	document.documentElement.setAttribute('lang', isFa ? 'fa' : 'en');
	document.documentElement.setAttribute('dir', isFa ? 'rtl' : 'ltr');
}

export async function getLanguage(): Promise<string | null> {
	if (await isAuthenticated()) {
		try {
			const user = await getUser();
			if (!user) throw new Error('No user');
			const client = getSupabaseBrowserClient();
			const { data } = await client
				.from('user_profiles')
				.select('language')
				.eq('id', user.id)
				.maybeSingle();
			if (data) {
				const parsed = UserProfileLanguageRowSchema.safeParse(data);
				if (parsed.success && parsed.data.language) {
					localStorage.setItem('mirifer_language', parsed.data.language);
					return parsed.data.language;
				} else if (!parsed.success) {
					logWarn('data-layer:getLanguage', `Profile language row failed validation: ${parsed.error.message}`);
				}
			}
		} catch (e) {
			logError('data-layer:getLanguage', e);
		}
	}
	return localStorage.getItem('mirifer_language') || null;
}

export async function setLanguage(lang: string): Promise<void> {
	localStorage.setItem('mirifer_language', lang);
	// Every language change in the app funnels through here, so this is the
	// one place that keeps <html lang/dir> honest.
	applyDocumentLanguage(lang);
	await cloudWrite('profile_update', 'language', { language: lang });
}

// ========== TARGET LANGUAGE (stored in auth metadata, cached in localStorage) ==========

export async function getTargetLanguage(): Promise<string | null> {
	if (await isAuthenticated()) {
		try {
			// Target language lives in Supabase Auth user metadata
			const { getTargetLanguage: authGetTL } = await import('./auth');
			const tl = await authGetTL();
			if (tl) {
				localStorage.setItem('mirifer_target_language', tl);
				return tl;
			}
			localStorage.removeItem('mirifer_target_language');
			return null;
		} catch (e) {
			logError('data-layer:getTargetLanguage', e);
		}
	}
	return getCourse(localStorage.getItem('mirifer_target_language'))?.code ?? null;
}

export async function setTargetLanguage(lang: string): Promise<void> {
	if (!isAvailableCourse(lang)) throw new Error('This course is not available yet.');
	const client = getSupabaseBrowserClient();
	const { error } = await client.auth.updateUser({ data: { target_language: lang } });
	if (error) throw error;
	try { localStorage.setItem('mirifer_target_language', lang); } catch { /* Cloud save succeeded. */ }
}

// ========== GOETHE EXAM SETTINGS (auth metadata + localStorage mirror) ==========

export interface ExamSettings {
	/** 'scheduled' = has a booked date, 'planned' = intends to take it, 'none' = casual learning */
	goal: 'scheduled' | 'planned' | 'none';
	/** ISO date (YYYY-MM-DD); only meaningful when goal === 'scheduled' */
	examDate: string | null;
	/** Soft "ready by" date for goal === 'planned' (no booked exam yet). */
	targetDate?: string | null;
}

const EXAM_SETTINGS_LS_KEY = 'mirifer_exam_settings';

function parseExamSettings(raw: unknown): ExamSettings | null {
	if (!raw || typeof raw !== 'object') return null;
	const o = raw as Record<string, unknown>;
	if (o.goal !== 'scheduled' && o.goal !== 'planned' && o.goal !== 'none') return null;
	return {
		goal: o.goal,
		examDate: typeof o.examDate === 'string' ? o.examDate : null,
		targetDate: typeof o.targetDate === 'string' ? o.targetDate : null
	};
}

export async function getExamSettings(): Promise<ExamSettings | null> {
	if (await isAuthenticated()) {
		try {
			const user = await getUser();
			const settings = parseExamSettings(user?.user_metadata?.exam_settings);
			if (settings) {
				localStorage.setItem(EXAM_SETTINGS_LS_KEY, JSON.stringify(settings));
				return settings;
			}
		} catch (e) {
			logError('data-layer:getExamSettings', e);
		}
	}
	try {
		return parseExamSettings(JSON.parse(localStorage.getItem(EXAM_SETTINGS_LS_KEY) || 'null'));
	} catch {
		return null;
	}
}

export async function setExamSettings(settings: ExamSettings): Promise<void> {
	localStorage.setItem(EXAM_SETTINGS_LS_KEY, JSON.stringify(settings));
	try {
		const client = getSupabaseBrowserClient();
		await client.auth.updateUser({ data: { exam_settings: settings } });
	} catch (e) {
		logError('data-layer:setExamSettings', e);
	}
}



/**
 * The user's motivating deadline: the booked exam date, or the soft
 * "ready by" target while they're still planning. Days are whole days
 * (0 = today, negative = past). Null when nothing is set.
 */
export function examDeadline(
	settings: ExamSettings | null
): { days: number; kind: 'exam' | 'target' } | null {
	if (!settings) return null;
	const dateStr =
		settings.goal === 'scheduled'
			? settings.examDate
			: settings.goal === 'planned'
				? settings.targetDate
				: null;
	if (!dateStr) return null;
	const deadline = new Date(dateStr + 'T00:00:00');
	if (isNaN(deadline.getTime())) return null;
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	return {
		days: Math.round((deadline.getTime() - today.getTime()) / 86400000),
		kind: settings.goal === 'scheduled' ? 'exam' : 'target'
	};
}

// ========== VOICE SPEED ==========

export async function getVoiceSpeed(): Promise<number | null> {
	if (await isAuthenticated()) {
		try {
			const user = await getUser();
			if (!user) throw new Error('No user');
			const client = getSupabaseBrowserClient();
			const { data } = await client
				.from('user_profiles')
				.select('voice_speed')
				.eq('id', user.id)
				.maybeSingle();
			if (data) {
				const parsed = UserProfileVoiceSpeedRowSchema.safeParse(data);
				if (parsed.success && parsed.data.voice_speed != null) {
					localStorage.setItem('mirifer_voice_speed', parsed.data.voice_speed.toString());
					return parsed.data.voice_speed;
				} else if (!parsed.success) {
					logWarn('data-layer:getVoiceSpeed', `Profile voice_speed row failed validation: ${parsed.error.message}`);
				}
			}
		} catch (e) {
			logError('data-layer:getVoiceSpeed', e);
		}
	}
	const v = localStorage.getItem('mirifer_voice_speed');
	return v ? parseFloat(v) : null;
}

export async function setVoiceSpeed(speed: number): Promise<void> {
	localStorage.setItem('mirifer_voice_speed', speed.toString());
	await cloudWrite('profile_update', 'voice_speed', { voice_speed: speed });
}

// ========== PROGRESS ==========

export interface Progress {
	currentDay: number;
	currentSentenceIndex: number;
	lastSaved: number;
	xp: number;
	achievements: string[];
}

export async function getProgress(): Promise<Progress | null> {
	if (await isAuthenticated()) {
		try {
			const user = await getUser();
			if (!user) throw new Error('No user');
			const client = getSupabaseBrowserClient();
			const { data } = await client
				.from('user_progress')
				.select('current_day, current_sentence_index, last_saved, xp, achievements')
				.eq('user_id', user.id)
				.maybeSingle();
			if (data) {
				const parsed = UserProgressRowSchema.safeParse(data);
				if (parsed.success) {
					const progress: Progress = {
						currentDay: parsed.data.current_day,
						currentSentenceIndex: parsed.data.current_sentence_index,
						lastSaved: parsed.data.last_saved ?? 0,
						xp: parsed.data.xp ?? 0,
						achievements: parsed.data.achievements ?? []
					};
					localStorage.setItem('mirifer_progress', JSON.stringify(progress));
					return progress;
				} else {
					logWarn('data-layer:getProgress', `Progress row failed validation: ${parsed.error.message}`);
				}
			}
		} catch (e) {
			logError('data-layer:getProgress', e);
		}
	}
	const raw = localStorage.getItem('mirifer_progress');
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch (e) {
		logWarn('data-layer:getProgress', 'Corrupted progress data in localStorage — clearing');
		return null;
	}
}

export async function saveProgress(currentDay: number, currentSentenceIndex: number, xp: number = 0, achievements: string[] = []): Promise<void> {
	const data = {
		currentDay,
		currentSentenceIndex,
		lastSaved: Date.now(),
		xp,
		achievements
	};
	try { localStorage.setItem('mirifer_progress', JSON.stringify(data)); } catch (error) {
		trackObstacle('progress_save_failed');
		throw error;
	}
	await cloudWrite('progress_upsert', 'progress', {
		current_day: currentDay,
		current_sentence_index: currentSentenceIndex,
		last_saved: data.lastSaved,
		xp: data.xp,
		achievements: data.achievements
	});
}

// ========== COMPLETED LESSONS ==========

export async function getCompletedLessons(): Promise<Record<number, any>> {
	if (await isAuthenticated()) {
		try {
			const user = await getUser();
			if (!user) throw new Error('No user');
			const client = getSupabaseBrowserClient();
			const { data } = await client
				.from('user_progress')
				.select('completed_lessons')
				.eq('user_id', user.id)
				.maybeSingle();
			if (data) {
				const parsed = CompletedLessonsRowSchema.safeParse(data);
				if (parsed.success && parsed.data.completed_lessons) {
					localStorage.setItem('mirifer_completed_lessons', JSON.stringify(parsed.data.completed_lessons));
					return parsed.data.completed_lessons;
				} else if (!parsed.success) {
					logWarn('data-layer:getCompletedLessons', `Completed lessons row failed validation: ${parsed.error.message}`);
				}
			}
		} catch (e) {
			logError('data-layer:getCompletedLessons', e);
		}
	}
	const raw = localStorage.getItem('mirifer_completed_lessons');
	if (!raw) return {};
	try {
		return JSON.parse(raw);
	} catch (e) {
		logWarn('data-layer:getCompletedLessons', 'Corrupted completed lessons in localStorage — clearing');
		return {};
	}
}

export async function saveCompletedLessons(completedLessons: Record<number, any>): Promise<void> {
	try { localStorage.setItem('mirifer_completed_lessons', JSON.stringify(completedLessons || {})); } catch (error) {
		trackObstacle('progress_save_failed');
		throw error;
	}
	await cloudWrite('progress_upsert', 'completed_lessons', {
		completed_lessons: completedLessons || {}
	});
}

// ========== SPACED REPETITION ==========

export interface SRCard {
	ease: number;
	interval: number;
	nextReview: number;
	attempts: number;
	successes: number;
	lastReview?: number | null;
}

export async function loadSRData(): Promise<Record<string, SRCard>> {
	if (await isAuthenticated()) {
		try {
			const user = await getUser();
			if (!user) throw new Error('No user');
			const client = getSupabaseBrowserClient();
			const { data: cloudCards } = await client
				.from('spaced_repetition')
				.select('*')
				.eq('user_id', user.id);
			if (cloudCards && cloudCards.length > 0) {
				const srMap: Record<string, SRCard> = {};
				for (const c of cloudCards) {
					const parsed = SRCardRowSchema.safeParse(c);
					if (!parsed.success) {
						logWarn('data-layer:loadSRData', `SR card failed validation: ${parsed.error.message}`);
						continue;
					}
					srMap[`${parsed.data.day}:${parsed.data.sentence_id}`] = {
						ease: parsed.data.ease,
						interval: parsed.data.interval_days,
						nextReview: parsed.data.next_review,
						attempts: parsed.data.attempts,
						successes: parsed.data.successes,
						lastReview: parsed.data.last_review
					};
				}
				localStorage.setItem('mirifer_sr_data', JSON.stringify(srMap));
				return srMap;
			}
		} catch (e) {
			logError('data-layer:loadSRData', e);
		}
	}
	try {
		const data = localStorage.getItem('mirifer_sr_data');
		return data ? JSON.parse(data) : {};
	} catch (e) {
		logWarn('data-layer:loadSRData', 'Corrupted SR data in localStorage — clearing');
		return {};
	}
}

export async function saveSRData(srData: Record<string, SRCard>): Promise<void> {
	localStorage.setItem('mirifer_sr_data', JSON.stringify(srData));
	const rows = Object.entries(srData).map(([key, card]) => {
		const [day, sentenceId] = key.split(':').map(Number);
		return {
			day,
			sentence_id: sentenceId,
			ease: card.ease,
			interval_days: card.interval,
			next_review: card.nextReview,
			attempts: card.attempts,
			successes: card.successes,
			last_review: card.lastReview || null
		};
	});
	if (rows.length > 0) {
		await cloudWrite('sr_upsert', 'sr_bulk', { rows });
	}
}

export async function recordSRAttempt(
	day: number,
	sentenceId: number,
	card: SRCard
): Promise<void> {
	await cloudWrite('sr_single', `sr_${day}_${sentenceId}`, {
		day,
		sentence_id: sentenceId,
		ease: card.ease,
		interval_days: card.interval,
		next_review: card.nextReview,
		attempts: card.attempts,
		successes: card.successes,
		last_review: card.lastReview || null
	});
}

export async function deleteSRCard(day: number, sentenceId: number): Promise<void> {
	// Remove from localStorage
	try {
		const data = localStorage.getItem('mirifer_sr_data');
		if (data) {
			const srData = JSON.parse(data);
			delete srData[`${day}:${sentenceId}`];
			localStorage.setItem('mirifer_sr_data', JSON.stringify(srData));
		}
	} catch {
		/* ignore */
	}
	// Queue cloud delete
	await cloudWrite('sr_delete', `sr_del_${day}_${sentenceId}`, { day, sentence_id: sentenceId });
}

// ========== DISPLAY NAME ==========

export function getDisplayName(): string | null {
	return localStorage.getItem('mirifer_display_name') || null;
}

export async function setDisplayName(name: string): Promise<void> {
	localStorage.setItem('mirifer_display_name', name);
	try {
		await authUpdateDisplayName(name);
	} catch (e) {
		logError('data-layer:setDisplayName', e);
	}
}

// ========== AVATAR ==========

export function getAvatarUrl(): string | null {
	return localStorage.getItem('mirifer_avatar_url') || null;
}

export function setAvatarUrl(url: string | null): void {
	if (url) {
		localStorage.setItem('mirifer_avatar_url', url);
	} else {
		localStorage.removeItem('mirifer_avatar_url');
	}
}

// ========== EXAM RESULTS ==========

export interface ExamResultData {
	score: number;
	total: number;
	percentage: number;
	date: number;
	wrongAnswers: any[];
}

export async function getExamResults(): Promise<Record<string, ExamResultData>> {
	if (await isAuthenticated()) {
		try {
			const user = await getUser();
			if (!user) throw new Error('No user');
			const client = getSupabaseBrowserClient();
			const { data: cloudExams } = await client
				.from('exam_results')
				.select('*')
				.eq('user_id', user.id);
			if (cloudExams && cloudExams.length > 0) {
				const examsMap: Record<string, ExamResultData> = {};
				for (const c of cloudExams) {
					const parsed = ExamResultRowSchema.safeParse(c);
					if (!parsed.success) {
						logWarn('data-layer:getExamResults', `Exam result row failed validation: ${parsed.error.message}`);
						continue;
					}
					examsMap[`week_${parsed.data.week_number}`] = {
						score: parsed.data.score,
						total: parsed.data.total,
						percentage: parsed.data.percentage,
						date: parsed.data.taken_at,
						wrongAnswers: parsed.data.wrong_answers ?? []
					};
				}
				localStorage.setItem('mirifer_exam_results', JSON.stringify(examsMap));
				return examsMap;
			}
		} catch (e) {
			logError('data-layer:getExamResults', e);
		}
	}
	try {
		const data = localStorage.getItem('mirifer_exam_results');
		return data ? JSON.parse(data) : {};
	} catch (e) {
		logWarn('data-layer:getExamResults', 'Corrupted exam results in localStorage — clearing');
		return {};
	}
}

export async function saveExamResult(weekKey: string, resultData: ExamResultData): Promise<void> {
	let all: Record<string, ExamResultData> = {};
	try {
		const raw = localStorage.getItem('mirifer_exam_results');
		all = raw ? JSON.parse(raw) : {};
	} catch (e) {
		logWarn('data-layer:saveExamResult', 'Corrupted exam results in localStorage — resetting before save');
		all = {};
	}
	all[weekKey] = resultData;
	localStorage.setItem('mirifer_exam_results', JSON.stringify(all));

	const weekNum = parseInt(weekKey.replace('week_', ''), 10);
	await cloudWrite('exam_upsert', `exam_${weekKey}`, {
		week_number: weekNum,
		score: resultData.score,
		total: resultData.total,
		percentage: resultData.percentage,
		wrong_answers: resultData.wrongAnswers || [],
		taken_at: resultData.date
	});
}

// ========== VOCABULARY ==========

export interface SavedWord {
	word: string;
	meaningEn: string;
	meaningFa: string;
	savedAt: number;
	known: boolean;
}

const VOCAB_LS_KEY = 'mirifer_vocabulary';

function readVocabLocal(): SavedWord[] {
	try {
		const raw = localStorage.getItem(VOCAB_LS_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

function writeVocabLocal(words: SavedWord[]): void {
	localStorage.setItem(VOCAB_LS_KEY, JSON.stringify(words));
}

export async function getVocabulary(): Promise<SavedWord[]> {
	if (await isAuthenticated()) {
		try {
			const user = await getUser();
			if (!user) throw new Error('No user');
			const client = getSupabaseBrowserClient();
			const { data } = await client
				.from('user_vocabulary')
				.select('word, meaning_en, meaning_fa, saved_at, known')
				.eq('user_id', user.id)
				.order('saved_at', { ascending: false });
			if (data && data.length > 0) {
				const words: SavedWord[] = [];
				for (const row of data) {
					const parsed = VocabularyRowSchema.safeParse(row);
					if (!parsed.success) {
						logWarn('data-layer:getVocabulary', `Row failed validation: ${parsed.error.message}`);
						continue;
					}
					words.push({
						word: parsed.data.word,
						meaningEn: parsed.data.meaning_en,
						meaningFa: parsed.data.meaning_fa,
						savedAt: parsed.data.saved_at,
						known: parsed.data.known
					});
				}
				writeVocabLocal(words);
				return words;
			}
		} catch (e) {
			logError('data-layer:getVocabulary', e);
		}
	}
	return readVocabLocal();
}

export async function saveWord(word: string, meaningEn: string, meaningFa: string): Promise<void> {
	const words = readVocabLocal();
	const existing = words.findIndex((w) => w.word === word);
	const entry: SavedWord = { word, meaningEn, meaningFa, savedAt: Date.now(), known: false };
	if (existing >= 0) {
		words[existing] = entry;
	} else {
		words.unshift(entry);
	}
	writeVocabLocal(words);

	await cloudWrite('vocab_upsert', `vocab_${word}`, {
		word,
		meaning_en: meaningEn,
		meaning_fa: meaningFa,
		saved_at: entry.savedAt,
		known: false
	});
}

export async function removeWord(word: string): Promise<void> {
	const words = readVocabLocal().filter((w) => w.word !== word);
	writeVocabLocal(words);

	await cloudWrite('vocab_delete', `vocab_${word}`, { word });
}

export async function updateWordKnown(word: string, known: boolean): Promise<void> {
	const words = readVocabLocal();
	const idx = words.findIndex((w) => w.word === word);
	if (idx >= 0) {
		words[idx].known = known;
		writeVocabLocal(words);
	}

	await cloudWrite('vocab_update_known', `vocab_${word}`, { word, known });
}

export function getVocabularyCount(): number {
	return readVocabLocal().length;
}

// ========== STATS & AGGREGATIONS ==========

export async function getLearnedSentenceBreakdown(): Promise<Record<string, number>> {
	try {
		const srData = await loadSRData();
		const learnedKeys = Object.keys(srData).filter((key) => srData[key].successes > 0);

		if (learnedKeys.length === 0) return { A1: 0, A2: 0, B1: 0 };

		const learnedDays = [...new Set(learnedKeys.map((key) => parseInt(key.split(':')[0])))];

		// Fetch all sentences for these days
		const client = getSupabaseBrowserClient();
		const { data: sentences, error } = await client
			.from('sentences')
			.select(`
				sentence_order,
				difficulty,
				lessons!inner(day)
			`)
			.in('lessons.day', learnedDays);

		if (error || !sentences) {
			logError('data-layer:getLearnedSentenceBreakdown', error?.message || 'No data');
			return { A1: 0, A2: 0, B1: 0 };
		}

		const breakdown: Record<string, number> = { A1: 0, A2: 0, B1: 0 };

		for (const s of sentences) {
			const day = (s.lessons as any).day;
			const sentenceId = s.sentence_order + 1;
			const key = `${day}:${sentenceId}`;

			if (learnedKeys.includes(key)) {
				const diff = s.difficulty || 'A1';
				breakdown[diff] = (breakdown[diff] || 0) + 1;
			}
		}

		return breakdown;
	} catch (e) {
		logError('data-layer:getLearnedSentenceBreakdown', e);
		return { A1: 0, A2: 0, B1: 0 };
	}
}

// ========== SENTENCE BOOKMARKS ==========

const BOOKMARKS_LS_KEY = 'mirifer_bookmarks';

export function getBookmarks(): Set<string> {
	try {
		const raw = localStorage.getItem(BOOKMARKS_LS_KEY);
		return new Set(raw ? JSON.parse(raw) : []);
	} catch {
		return new Set();
	}
}

export function addBookmark(day: number, sentenceId: number): void {
	const key = `${day}:${sentenceId}`;
	const bookmarks = getBookmarks();
	bookmarks.add(key);
	localStorage.setItem(BOOKMARKS_LS_KEY, JSON.stringify([...bookmarks]));
}

export function removeBookmark(day: number, sentenceId: number): void {
	const key = `${day}:${sentenceId}`;
	const bookmarks = getBookmarks();
	bookmarks.delete(key);
	localStorage.setItem(BOOKMARKS_LS_KEY, JSON.stringify([...bookmarks]));
}

// ========== BASICS TOPIC PROGRESS ==========

// Local-only for now, like bookmarks above: there is no Supabase column for
// it yet. Routed through here anyway so the pages never touch storage
// directly and adding the cloud write later is a change in one file.
const BASICS_DONE_LS_KEY = 'mirifer_basics_done';

/** Category key → when the learner finished its closing checks. */
export function getBasicsCompleted(): Record<string, number> {
	try {
		const raw = localStorage.getItem(BASICS_DONE_LS_KEY);
		const parsed = raw ? JSON.parse(raw) : {};
		return parsed && typeof parsed === 'object' ? parsed : {};
	} catch {
		return {};
	}
}

export function markBasicsCompleted(categoryKey: string, at: number = Date.now()): void {
	try {
		const all = getBasicsCompleted();
		all[categoryKey] = at;
		localStorage.setItem(BASICS_DONE_LS_KEY, JSON.stringify(all));
	} catch {
		/* storage unavailable — progress just is not remembered */
	}
}

// ========== WORD-LEVEL STRENGTH ==========

// Local-only for now, like bookmarks and Basics progress above. Kept behind
// data-layer so the pages never touch storage and adding the cloud write
// later is a change in one file.

// ========== SEEN EXAM ITEMS ==========

// Ids of generated exam items already served, so a retake draws fresh ones.
// Capped: past a few sittings the oldest ids no longer need avoiding, and an
// unbounded list would grow with every question ever answered.
const SEEN_ITEMS_LS_KEY = 'mirifer_seen_exam_items';
const SEEN_ITEMS_MAX = 120;

export function getSeenExamItems(): string[] {
	try {
		const raw = JSON.parse(localStorage.getItem(SEEN_ITEMS_LS_KEY) || '[]');
		return Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : [];
	} catch {
		return [];
	}
}

export function addSeenExamItems(ids: string[]): void {
	if (!ids.length) return;
	try {
		const merged = [...ids, ...getSeenExamItems().filter((x) => !ids.includes(x))];
		localStorage.setItem(SEEN_ITEMS_LS_KEY, JSON.stringify(merged.slice(0, SEEN_ITEMS_MAX)));
	} catch {
		/* storage unavailable — retakes may repeat an item, which is survivable */
	}
}

// ========== CHECKPOINTS TAKEN ==========

// Which level checkpoints the learner has already sat, e.g. ['A1-1','A1-2'].
const CHECKPOINTS_LS_KEY = 'mirifer_checkpoints_done';

export function getCheckpointsDone(): string[] {
	try {
		const raw = JSON.parse(localStorage.getItem(CHECKPOINTS_LS_KEY) || '[]');
		return Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : [];
	} catch {
		return [];
	}
}

export function markCheckpointDone(key: string): void {
	if (!key) return;
	try {
		const all = getCheckpointsDone();
		if (!all.includes(key)) {
			localStorage.setItem(CHECKPOINTS_LS_KEY, JSON.stringify([...all, key]));
		}
	} catch {
		/* storage unavailable — the checkpoint stays offered, which is the
		   safe direction to fail */
	}
}

// ========== CLEAR ALL LOCAL DATA ==========

/** Device preferences rather than account data. Wiping these would reset the
 *  app's appearance for whoever uses this browser next, which is not what
 *  signing out or deleting an account is asking for. */
const LOCAL_KEEP = new Set(['mirifer_theme']);

/**
 * Remove every `mirifer_`-prefixed key except {@link LOCAL_KEEP}.
 *
 * Swept by prefix rather than listed: a hardcoded list silently missed
 * `mirifer_placement`, `mirifer_placement_probes`, `mirifer_pending_placement`,
 * `mirifer_exam_settings`, `mirifer_drill_stats`, `mirifer_target_language` and
 * the per-lesson `mirifer_lesson_*` caches, which left personal data behind on
 * sign-out and would have made account deletion incomplete. A prefix sweep
 * cannot fall behind as keys are added.
 */
export function clearAllLocal(): void {
	try {
		// Collect first: removing while iterating shifts the indices underneath.
		const doomed: string[] = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (key && key.startsWith('mirifer_') && !LOCAL_KEEP.has(key)) doomed.push(key);
		}
		for (const key of doomed) localStorage.removeItem(key);
	} catch {
		/* storage unavailable — there is nothing cached to clear */
	}
}

// ========== SYNC ON LOGIN ==========

export async function syncOnLogin(): Promise<void> {
	const user = await getUser();
	const uid = user?.id;
	if (!uid) return;

	try {
		const client = getSupabaseBrowserClient();

		// Pull profile prefs
		const { data: profile } = await client
			.from('user_profiles')
			.select('*')
			.eq('id', uid)
			.maybeSingle();
		if (profile) {
			const profileParsed = UserProfileRowSchema.safeParse(profile);
			if (!profileParsed.success) {
				logWarn('data-layer:syncOnLogin', `User profile row failed validation: ${profileParsed.error.message}`);
			} else {
				const p = profileParsed.data;
				if (p.language) localStorage.setItem('mirifer_language', p.language);
				if (p.voice_speed)
					localStorage.setItem('mirifer_voice_speed', p.voice_speed.toString());
				if (p.display_name)
					localStorage.setItem('mirifer_display_name', p.display_name);
				if (p.avatar_url) {
					localStorage.setItem('mirifer_avatar_url', p.avatar_url);
				} else {
					localStorage.removeItem('mirifer_avatar_url');
				}
			}
		}

		// Pull progress
		const { data: progress } = await client
			.from('user_progress')
			.select('*')
			.eq('user_id', uid)
			.maybeSingle();
		if (progress) {
			const progressParsed = UserProgressFullRowSchema.safeParse(progress);
			if (!progressParsed.success) {
				logWarn('data-layer:syncOnLogin', `User progress row failed validation: ${progressParsed.error.message}`);
			} else {
				const p = progressParsed.data;
				localStorage.setItem(
					'mirifer_progress',
					JSON.stringify({
						currentDay: p.current_day,
						currentSentenceIndex: p.current_sentence_index,
						lastSaved: p.last_saved ?? 0,
						xp: p.xp ?? 0,
						achievements: p.achievements ?? []
					})
				);
				if (p.completed_lessons) {
					localStorage.setItem(
						'mirifer_completed_lessons',
						JSON.stringify(p.completed_lessons)
					);
				}
			}
		}

		// Pull SR data
		const { data: srCards } = await client
			.from('spaced_repetition')
			.select('*')
			.eq('user_id', uid);
		if (srCards && srCards.length > 0) {
			const srMap: Record<string, SRCard> = {};
			for (const c of srCards) {
				const parsed = SRCardRowSchema.safeParse(c);
				if (!parsed.success) {
					logWarn('data-layer:syncOnLogin', `SR card row failed validation: ${parsed.error.message}`);
					continue;
				}
				srMap[`${parsed.data.day}:${parsed.data.sentence_id}`] = {
					ease: parsed.data.ease,
					interval: parsed.data.interval_days,
					nextReview: parsed.data.next_review,
					attempts: parsed.data.attempts,
					successes: parsed.data.successes,
					lastReview: parsed.data.last_review
				};
			}
			localStorage.setItem('mirifer_sr_data', JSON.stringify(srMap));
		}

		// Pull exam results
		const { data: exams } = await client
			.from('exam_results')
			.select('*')
			.eq('user_id', uid);
		if (exams && exams.length > 0) {
			const examsMap: Record<string, ExamResultData> = {};
			for (const c of exams) {
				const parsed = ExamResultRowSchema.safeParse(c);
				if (!parsed.success) {
					logWarn('data-layer:syncOnLogin', `Exam result row failed validation: ${parsed.error.message}`);
					continue;
				}
				examsMap[`week_${parsed.data.week_number}`] = {
					score: parsed.data.score,
					total: parsed.data.total,
					percentage: parsed.data.percentage,
					date: parsed.data.taken_at,
					wrongAnswers: parsed.data.wrong_answers ?? []
				};
			}
			localStorage.setItem('mirifer_exam_results', JSON.stringify(examsMap));
		}

		// Pull vocabulary
		const { data: vocabRows } = await client
			.from('user_vocabulary')
			.select('word, meaning_en, meaning_fa, saved_at, known')
			.eq('user_id', uid)
			.order('saved_at', { ascending: false });
		if (vocabRows && vocabRows.length > 0) {
			const words: SavedWord[] = [];
			for (const row of vocabRows) {
				const parsed = VocabularyRowSchema.safeParse(row);
				if (!parsed.success) {
					logWarn('data-layer:syncOnLogin', `Vocab row failed validation: ${parsed.error.message}`);
					continue;
				}
				words.push({
					word: parsed.data.word,
					meaningEn: parsed.data.meaning_en,
					meaningFa: parsed.data.meaning_fa,
					savedAt: parsed.data.saved_at,
					known: parsed.data.known
				});
			}
			writeVocabLocal(words);
		}

		// Flush pending writes
		await flushQueue();
	} catch (e) {
		logError('data-layer:syncOnLogin', e);
	}
}
