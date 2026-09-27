/**
 * The "My languages" main page: which courses a learner has started and how
 * far they are in each.
 *
 * Courses a learner has started are kept in `user_metadata.learning`. Older
 * accounts predate that list, so a course also counts as started when it is
 * the active course or has saved progress.
 */

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { COURSES, isAvailableCourse } from '$lib/courses';
import { TOTAL_DAYS } from '$services/curriculum';
import { HotelCompletionSchema, RetellRecordSchema } from '$lib/practice/progress';
import { RETELL_PIECES } from '$lib/practice/retell';
import type { CourseProgress, EnglishProgress, GermanProgress } from '$lib/practice/course-progress';

export type CourseCode = (typeof COURSES)[number]['code'];
export type { CourseProgress } from '$lib/practice/course-progress';

export function learningList(value: unknown): CourseCode[] {
	return Array.isArray(value) ? COURSES.map(course => course.code).filter(code => value.includes(code)) : [];
}

function englishProgress(user: User): EnglishProgress {
	const hotel = HotelCompletionSchema.safeParse(user.user_metadata?.english_hotel_v1);
	const retell = RetellRecordSchema.safeParse(user.user_metadata?.english_retell_v1);
	const done = retell.success ? RETELL_PIECES.filter(piece => retell.data[piece.id]).length : 0;
	return { code: 'en', conversationDone: hotel.success, retellDone: done, retellTotal: RETELL_PIECES.length };
}

async function germanProgress(supabase: SupabaseClient, userId: string): Promise<GermanProgress | null> {
	const { data, error } = await supabase.from('user_progress')
		.select('current_day, completed_lessons, xp').eq('user_id', userId).maybeSingle();
	if (error || !data) return null;
	const completed = data.completed_lessons && typeof data.completed_lessons === 'object' ? Object.keys(data.completed_lessons).length : 0;
	const currentDay = Number.isInteger(data.current_day) && data.current_day > 0 ? data.current_day : 1;
	return { code: 'de', currentDay, completed: Math.min(completed, TOTAL_DAYS), total: TOTAL_DAYS, xp: typeof data.xp === 'number' ? data.xp : 0 };
}

/** The courses this learner has started, active one first, with their progress. */
export async function myLanguages(supabase: SupabaseClient, user: User): Promise<CourseProgress[]> {
	const meta = user.user_metadata ?? {};
	const started = new Set<CourseCode>(learningList(meta.learning));
	const active = isAvailableCourse(meta.target_language) ? (meta.target_language as CourseCode) : null;
	if (active) started.add(active);

	const english = englishProgress(user);
	if (english.conversationDone || english.retellDone) started.add('en');
	let german: GermanProgress | null = null;
	try { german = await germanProgress(supabase, user.id); } catch { german = null; }
	// A German progress row exists from the first lesson; day 1 with nothing done is not "started".
	if (german && (german.completed > 0 || german.currentDay > 1)) started.add('de');

	const order = [...started].filter(code => isAvailableCourse(code)).sort((a, b) => (a === active ? -1 : b === active ? 1 : 0));
	return order.map(code => code === 'en' ? english : german ?? { code: 'de', currentDay: 1, completed: 0, total: TOTAL_DAYS, xp: 0 });
}
