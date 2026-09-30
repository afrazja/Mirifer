/**
 * Lesson Loader — fetches lesson data from Supabase.
 * Replaces the old Vite import.meta.glob approach.
 * Maintains same in-memory cache pattern.
 */

import { getSupabaseBrowserClient } from '$lib/supabase/client';
import type { Lesson, LessonChunk, LessonGoal, LessonParagraph, Sentence } from '$stores/lesson';
import type { Language } from '$stores/preferences';
import { logError, logWarn } from '$utils/error';
import { isUnlocked } from '$services/lesson-access';
import { parseExercises } from '$services/lesson-exercises';
import {
	LessonRowSchema,
	LessonDetailRowSchema,
	SentenceRowSchema,
	GlossaryRowSchema,
	GrammarNoteSchema,
	LessonChunkListSchema,
	LessonGoalListSchema,
	LessonParagraphListSchema
} from '$lib/schemas';

export interface LessonMeta {
	day: number;
	file: string; // kept for compatibility
	title: string;
	titleFa: string;
	group: string;
	difficulty?: string;
}

// Module-level caches (persist for the tab's lifetime)
const lessonCache: Record<number, Lesson> = {};
let indexCache: LessonMeta[] | null = null;
let glossaryCache: Record<string, { en: string; fa: string }> | null = null;

// ─── Offline cache (localStorage) ───────────────────────────────────────────
// Every successful Supabase fetch is mirrored to localStorage so lessons keep
// working offline / after a reload. localStorage is read only as a fallback
// when the network fetch fails — online users always get fresh data.
const LS_INDEX_KEY = 'mirifer_lesson_index';
const LS_GLOSSARY_KEY = 'mirifer_glossary';
const lsLessonKey = (day: number) => `mirifer_lesson_${day}`;

/**
 * Bump when the lesson SHAPE changes, to drop copies cached before it.
 *
 * Without this, a learner holding a pre-migration lesson keeps it: the cache
 * is only refreshed by a successful network read, and changeDay used to
 * prefer the cache over the network entirely. Day 1's warm-up was invisible
 * to exactly the people who had used the app most.
 *
 * 2 = words / collocations / paragraphs added.
 * 3 = goals added.
 */
const LESSON_CACHE_VERSION = 4;
const lsLessonVersionKey = (day: number) => `mirifer_lesson_${day}_v`;

/** A cached lesson is only usable if it was written by this shape. */
function readCachedLesson(day: number): Lesson | null {
	const v = Number(readLS<number>(lsLessonVersionKey(day)));
	if (v !== LESSON_CACHE_VERSION) return null;
	return readLS<Lesson>(lsLessonKey(day));
}

function writeCachedLesson(day: number, lesson: Lesson): void {
	writeLS(lsLessonKey(day), lesson);
	writeLS(lsLessonVersionKey(day), LESSON_CACHE_VERSION);
}

function readLS<T>(key: string): T | null {
	if (typeof localStorage === 'undefined') return null;
	try {
		const raw = localStorage.getItem(key);
		return raw ? (JSON.parse(raw) as T) : null;
	} catch {
		return null;
	}
}

function writeLS(key: string, value: unknown): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch {
		// Quota exceeded or storage unavailable — caching is best-effort.
	}
}

/**
 * Get all available lesson metadata from the lessons table.
 * Now async — fetches from Supabase.
 */
export async function getLessonIndex(): Promise<LessonMeta[]> {
	if (indexCache) return indexCache;

	const sb = getSupabaseBrowserClient();
	const { data, error } = await sb
		.from('lessons')
		.select('day, title, title_fa, group, sort_order, difficulty')
		.order('day', { ascending: true });

	if (error || !data) {
		logError('lesson-loader:getLessonIndex', error?.message ?? 'No data returned');
		// Offline / fetch failed — fall back to the last cached index.
		const cached = readLS<LessonMeta[]>(LS_INDEX_KEY);
		if (cached && cached.length) {
			logWarn('lesson-loader:getLessonIndex', 'Using offline cached lesson index');
			indexCache = cached;
			return cached;
		}
		indexCache = [];
		return [];
	}

	const validated = data
		.map((r, i) => {
			const result = LessonRowSchema.safeParse(r);
			if (!result.success) {
				logWarn(
					'lesson-loader:getLessonIndex',
					`Row ${i} failed validation: ${result.error.message}`
				);
				return null;
			}
			return result.data;
		})
		.filter((r): r is NonNullable<typeof r> => r !== null);

	indexCache = validated.map((r) => ({
		day: r.day,
		file: `day-${r.day}.json`, // backward-compat shim
		title: r.title,
		titleFa: r.title_fa ?? '',
		group: r.group,
		difficulty: r.difficulty ?? undefined
	}));

	writeLS(LS_INDEX_KEY, indexCache); // mirror to offline cache
	return indexCache;
}

/**
 * Get the total number of lessons available (from cache).
 */
export function getTotalLessons(): number {
	if (!indexCache) indexCache = readLS<LessonMeta[]>(LS_INDEX_KEY);
	return indexCache?.length ?? 0;
}

/**
 * Load a single lesson by day number. Returns from cache if already loaded.
 */
export async function loadLesson(day: number): Promise<Lesson | null> {
	if (lessonCache[day]) return lessonCache[day];

	// Offline fallback: serve the last cached copy of this lesson if the
	// network fetch can't complete or returns bad data.
	const offlineFallback = (): Lesson | null => {
		const cached = readCachedLesson(day);
		if (cached) {
			logWarn('lesson-loader:loadLesson', `Using offline cached lesson for day ${day}`);
			lessonCache[day] = cached;
			return cached;
		}
		return null;
	};

	const sb = getSupabaseBrowserClient();

	// Fetch lesson metadata. grammar_note is requested opportunistically: on a
	// database where the column has not been added yet, Supabase rejects the
	// whole select, so fall back to the column set that always exists rather
	// than letting an optional feature break lesson loading.
	const BASE_COLS =
		'id, title, title_fa, description, description_fa, grammar_focus, grammar_focus_fa, difficulty';
	// Widest select first, narrowing on error. Optional content columns are
	// added by separate migrations, and Supabase rejects the whole select if
	// one is missing — so an un-migrated database must not lose the lesson.
	const CHUNK_COLS = 'words, collocations, paragraphs';
	let { data: lessonRow, error: lessonErr } = await sb
		.from('lessons')
		.select(`${BASE_COLS}, grammar_note, ${CHUNK_COLS}, goals, exercises`)
		.eq('day', day)
		.maybeSingle();

	if (lessonErr) {
		// No exercises column yet (supabase-lesson-exercises.sql not run): keep the rest.
		({ data: lessonRow, error: lessonErr } = await sb
			.from('lessons')
			.select(`${BASE_COLS}, grammar_note, ${CHUNK_COLS}, goals`)
			.eq('day', day)
			.maybeSingle());
	}

	if (lessonErr) {
		// No goals column yet (supabase-lesson-goals.sql not run): keep the rest.
		({ data: lessonRow, error: lessonErr } = await sb
			.from('lessons')
			.select(`${BASE_COLS}, grammar_note, ${CHUNK_COLS}`)
			.eq('day', day)
			.maybeSingle());
	}

	if (lessonErr) {
		({ data: lessonRow, error: lessonErr } = await sb
			.from('lessons')
			.select(`${BASE_COLS}, grammar_note`)
			.eq('day', day)
			.maybeSingle());
		if (!lessonErr) {
			logWarn(
				'lesson-loader:loadLesson',
				'words/collocations/paragraphs columns missing — run supabase-lesson-chunks.sql to enable the warm-up'
			);
		}
	}

	if (lessonErr) {
		({ data: lessonRow, error: lessonErr } = await sb
			.from('lessons')
			.select(BASE_COLS)
			.eq('day', day)
			.maybeSingle());
		if (!lessonErr) {
			logWarn(
				'lesson-loader:loadLesson',
				'grammar_note column missing — run supabase-grammar-notes.sql to enable grammar moments'
			);
		}
	}

	if (lessonErr || !lessonRow) {
		logWarn('lesson-loader:loadLesson', `No lesson found for day ${day}`);
		return offlineFallback();
	}

	const lessonValidation = LessonDetailRowSchema.safeParse(lessonRow);
	if (!lessonValidation.success) {
		logError(
			'lesson-loader:loadLesson',
			`Lesson row for day ${day} failed validation: ${lessonValidation.error.message}`
		);
		return offlineFallback();
	}
	const validatedLesson = lessonValidation.data;

	// Fetch sentences ordered by sentence_order
	const { data: sentenceRows, error: sentErr } = await sb
		.from('sentences')
		.select('sentence_order, role, audio_text, target_text, translation, translation_fa, hint, hint_fa, difficulty')
		.eq('lesson_id', lessonRow.id)
		.order('sentence_order', { ascending: true });

	if (sentErr) {
		logError('lesson-loader:loadLesson', `Failed to fetch sentences for day ${day}: ${sentErr.message}`);
		return offlineFallback();
	}

	const validatedSentences = (sentenceRows ?? [])
		.map((s, i) => {
			const result = SentenceRowSchema.safeParse(s);
			if (!result.success) {
				logWarn(
					'lesson-loader:loadLesson',
					`Sentence ${i} for day ${day} failed validation: ${result.error.message}`
				);
				return null;
			}
			return result.data;
		})
		.filter((s): s is NonNullable<typeof s> => s !== null);

	// Grammar note is validated on its own so a malformed note degrades to
	// "no grammar moment" instead of taking the whole lesson down.
	let grammarNote: Lesson['grammarNote'];
	if (validatedLesson.grammar_note) {
		const noteResult = GrammarNoteSchema.safeParse(validatedLesson.grammar_note);
		if (noteResult.success) {
			const n = noteResult.data;
			grammarNote = {
				title: n.title,
				titleFa: n.title_fa,
				explanation: n.explanation,
				explanationFa: n.explanation_fa,
				examples: n.examples,
				basicsKey: n.basics_key
			};
		} else {
			logWarn(
				'lesson-loader:loadLesson',
				`Grammar note for day ${day} failed validation: ${noteResult.error.message}`
			);
		}
	}

	// Same treatment as the grammar note: each chunk list validates on its
	// own, so a malformed warm-up drops itself rather than costing the
	// learner the whole lesson.
	const parseChunks = (raw: unknown, field: string): LessonChunk[] | undefined => {
		if (!raw) return undefined;
		const r = LessonChunkListSchema.safeParse(raw);
		if (r.success) return r.data.length ? r.data : undefined;
		logWarn('lesson-loader:loadLesson', `${field} for day ${day} failed validation: ${r.error.message}`);
		return undefined;
	};

	let paragraphs: LessonParagraph[] | undefined;
	if (validatedLesson.paragraphs) {
		const r = LessonParagraphListSchema.safeParse(validatedLesson.paragraphs);
		if (r.success) paragraphs = r.data.length ? r.data : undefined;
		else
			logWarn(
				'lesson-loader:loadLesson',
				`paragraphs for day ${day} failed validation: ${r.error.message}`
			);
	}

	let goals: LessonGoal[] | undefined;
	if (validatedLesson.goals) {
		const r = LessonGoalListSchema.safeParse(validatedLesson.goals);
		if (r.success) goals = r.data.length ? r.data : undefined;
		else
			logWarn('lesson-loader:loadLesson', `goals for day ${day} failed validation: ${r.error.message}`);
	}

	const exercises = parseExercises(validatedLesson.exercises, (message) =>
		logWarn('lesson-loader:loadLesson', `An exercise for day ${day} failed validation: ${message}`)
	);

	const lesson: Lesson = {
		title: validatedLesson.title,
		goals,
		exercises,
		words: parseChunks(validatedLesson.words, 'words'),
		collocations: parseChunks(validatedLesson.collocations, 'collocations'),
		paragraphs,
		titleFa: validatedLesson.title_fa ?? undefined,
		description: validatedLesson.description ?? undefined,
		descriptionFa: validatedLesson.description_fa ?? undefined,
		grammarFocus: validatedLesson.grammar_focus ?? undefined,
		grammarFocusFa: validatedLesson.grammar_focus_fa ?? undefined,
		grammarNote,
		difficulty: validatedLesson.difficulty ?? undefined,
		sentences: validatedSentences.map((s) => ({
			id: s.sentence_order + 1, // 1-based to match original JSON format
			role: s.role,
			audioText: s.audio_text ?? undefined,
			targetText: s.target_text ?? undefined,
			translation: s.translation,
			translationFa: s.translation_fa ?? undefined,
			hint: s.hint ?? undefined,
			hintFa: s.hint_fa ?? undefined,
			difficulty: s.difficulty ?? undefined
		}))
	};

	lessonCache[day] = lesson;
	writeCachedLesson(day, lesson); // mirror to offline cache
	return lesson;
}

/**
 * Load multiple lessons at once (for exam/review modes)
 */
export async function loadLessons(days: number[]): Promise<void> {
	await Promise.all(days.map((day) => loadLesson(day)));
}

/**
 * Get a lesson from the cache (must be loaded first)
 */
export function getLesson(day: number): Lesson | null {
	if (lessonCache[day]) return lessonCache[day];
	const cached = readCachedLesson(day);
	if (cached) {
		lessonCache[day] = cached;
		return cached;
	}
	return null;
}

/**
 * Get all currently loaded lessons
 */
export function getAllLoadedLessons(): Record<number, Lesson> {
	return lessonCache;
}

/**
 * Load the glossary from Supabase
 */
export async function loadGlossary(): Promise<Record<string, { en: string; fa: string }>> {
	if (glossaryCache) return glossaryCache;

	const sb = getSupabaseBrowserClient();
	const { data, error } = await sb.from('glossary').select('word, en, fa');

	if (error) {
		logError('lesson-loader:loadGlossary', error.message);
		// Offline fallback: serve the last cached glossary so word tooltips work.
		const cached = readLS<Record<string, { en: string; fa: string }>>(LS_GLOSSARY_KEY);
		if (cached) {
			logWarn('lesson-loader:loadGlossary', 'Using offline cached glossary');
			glossaryCache = cached;
			return cached;
		}
		return {};
	}

	glossaryCache = {};
	for (const row of data ?? []) {
		const result = GlossaryRowSchema.safeParse(row);
		if (!result.success) {
			logWarn(
				'lesson-loader:loadGlossary',
				`Glossary row for word "${(row as { word?: unknown }).word}" failed validation: ${result.error.message}`
			);
			continue;
		}
		glossaryCache[result.data.word] = { en: result.data.en, fa: result.data.fa };
	}

	writeLS(LS_GLOSSARY_KEY, glossaryCache); // mirror to offline cache
	return glossaryCache;
}

/**
 * Get glossary meaning for a word based on current language.
 * Tries exact match first, then strips common German suffixes
 * to find base forms (e.g. "arbeitet" → "arbeiten").
 */
export function getGlossaryMeaning(word: string, language: Language): string | null {
	if (!glossaryCache) return null;

	const key = word.toLowerCase();
	const pick = (e: { en: string; fa: string } | string) =>
		typeof e === 'string' ? e : language === 'fa' ? e.fa : e.en;

	// 1. Exact match
	const exact = glossaryCache[key];
	if (exact) return pick(exact);

	// 2. Suffix stripping — try removing common German inflections
	const suffixes = ['en', 'st', 'est', 'et', 'te', 'tet', 'er', 'es', 'em', 'e', 'n', 't', 's'];
	for (const suf of suffixes) {
		if (key.length > suf.length + 2) {
			const stem = key.slice(0, -suf.length);
			// Check stem directly
			if (glossaryCache[stem]) return pick(glossaryCache[stem]);
			// Check stem + common infinitive endings
			if (glossaryCache[stem + 'en']) return pick(glossaryCache[stem + 'en']);
			if (glossaryCache[stem + 'e']) return pick(glossaryCache[stem + 'e']);
			if (glossaryCache[stem + 'n']) return pick(glossaryCache[stem + 'n']);
		}
	}

	return null;
}

/**
 * Check if a day number has a lesson available (sync, uses cache).
 * Returns false if the index has not been loaded yet.
 */
/**
 * Resolve which day/sentence a returning user should be dropped into.
 * Requires the lesson index cache to be populated (await getLessonIndex()).
 *
 * Rule: saved progress wins ONLY while it points at a genuinely unfinished
 * lesson (mid-sentence and not completed). Otherwise the frontier wins — the
 * lowest existing day that isn't completed yet. This stops a revisit to an
 * old day (or a stale saved index) from hijacking "today's lesson" while the
 * progress bar says something like 45/100.
 *
 * Lives here (not lesson-controller) so light pages like /home can use it
 * without dragging the whole controller module graph into their bundle.
 */
export function resolveResumePoint(
	savedProgress: { currentDay: number; currentSentenceIndex: number } | null,
	completedLessons: Record<string | number, unknown> | null | undefined,
	requestedDay?: number
): { day: number; sentenceIndex: number; allDone: boolean } {
	const completed = completedLessons || {};
	// A path link may select an earned lesson, never bypass the unlock rule.
	if (requestedDay !== undefined && Number.isInteger(requestedDay) && requestedDay > 0 && hasLesson(requestedDay) && isUnlocked(requestedDay, completed)) {
		// Refreshing a lesson must keep the learner in it, where they were: the
		// saved position counts whether or not the lesson was completed before
		// (a revisit is saved like any other). A finished revisit, whose saved
		// position is the end, starts again from the top.
		const saved = savedProgress?.currentDay === requestedDay ? (savedProgress.currentSentenceIndex ?? 0) : 0;
		const length = getLesson(requestedDay)?.sentences.length;
		const sentenceIndex = completed[requestedDay] && length !== undefined && saved >= length ? 0 : saved;
		return { day: requestedDay, sentenceIndex, allDone: false };
	}

	if (savedProgress && hasLesson(savedProgress.currentDay)) {
		const d = savedProgress.currentDay;
		const midLesson = (savedProgress.currentSentenceIndex ?? 0) > 0 && !completed[d];
		if (midLesson) {
			return { day: d, sentenceIndex: savedProgress.currentSentenceIndex, allDone: false };
		}
	}

	// Walk the index's real day numbers rather than counting up to a guessed
	// bound. This used to scan 1..getTotalLessons()+10 — a COUNT standing in
	// for a maximum day number — so an index of [1,2,3,50,51,52] bounded the
	// scan at 16 and could never see day 50. Dense 1..100 numbering hid it.
	// The bug has nothing to do with placement; it just took a placement
	// floor above the count to expose it, and it outlives that feature.
	const days = indexDays();
	if (days.length === 0) return { day: 1, sentenceIndex: 0, allDone: true };

	for (const d of days) {
		if (!completed[d]) return { day: d, sentenceIndex: 0, allDone: false };
	}

	// Every existing lesson is completed — park on the last one.
	return { day: days[days.length - 1], sentenceIndex: 0, allDone: true };
}

/** Every day number in the index, ascending. Empty when nothing is cached. */
function indexDays(): number[] {
	if (!indexCache) indexCache = readLS<LessonMeta[]>(LS_INDEX_KEY);
	return (indexCache ?? []).map((m) => m.day).sort((a, b) => a - b);
}

export function hasLesson(day: number): boolean {
	if (!indexCache) indexCache = readLS<LessonMeta[]>(LS_INDEX_KEY);
	if (!indexCache) return false;
	return indexCache.some((m) => m.day === day);
}

/**
 * Invalidate all caches (useful after admin edits)
 */
export function invalidateLessonCache(day?: number): void {
	if (day !== undefined) {
		delete lessonCache[day];
		if (typeof localStorage !== 'undefined') {
			try {
				localStorage.removeItem(lsLessonKey(day));
			} catch {
				/* ignore */
			}
		}
	} else {
		Object.keys(lessonCache).forEach((k) => delete lessonCache[+k]);
		indexCache = null;
		glossaryCache = null;
		if (typeof localStorage !== 'undefined') {
			try {
				// Remove every cached lesson plus the index and glossary.
				for (const key of Object.keys(localStorage)) {
					if (key.startsWith('mirifer_lesson_')) localStorage.removeItem(key);
				}
				localStorage.removeItem(LS_INDEX_KEY);
				localStorage.removeItem(LS_GLOSSARY_KEY);
			} catch {
				/* ignore */
			}
		}
	}
}
