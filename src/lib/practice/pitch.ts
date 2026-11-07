/**
 * "Tell me about yourself" (the interview path's pitch builder; learning-UX and system-design reviews,
 * 2026-11-07). The learner says their answer in three short parts, one screen each: now, before,
 * next. The parts are joined and checked by the "Say it again, better" engine (say-better.ts, prompt
 * 'interview-pitch'): at most two fixes, one per screen, then the whole answer a bit better; then
 * they say it all once more, with only the three keywords to lean on. Kept in this browser for the
 * step only (like every step's answers): nothing is saved to the account.
 */
import type { DisplayText } from './hotel';
import type { Feedback, FixUse } from './say-better';
import type { Track } from './day';

export const PITCH_PARTS = ['now', 'before', 'next'] as const;
export type PitchPartId = (typeof PITCH_PARTS)[number];
export interface PitchPart {
	id: PitchPartId;
	/** The keyword chip ("Now"), also shown on the last try. */
	keyword: DisplayText;
	/** What Mira asks (said aloud, shown in English). */
	question: string;
	/** The same question in Persian, small under it. */
	questionFa: string;
	/** Sentence starters that work for any job, a student, or someone between jobs. */
	starters: string[];
}
export interface PitchContent { parts: PitchPart[] }

const KEYWORDS: Record<PitchPartId, DisplayText> = { now: { en: 'Now', fa: 'الان' }, before: { en: 'Before', fa: 'قبلاً' }, next: { en: 'Next', fa: 'بعد' } };
/** The parts when a chapter brings none of its own (the Module lab). */
export const DEFAULT_PITCH: Record<Track, PitchContent> = {
	intermediate: { parts: [
		{ id: 'now', keyword: KEYWORDS.now, question: 'What do you do now?', questionFa: 'الان چه کار می‌کنی؟', starters: ['Right now, I work as', 'I’m a student at', 'At the moment, I’m looking for'] },
		{ id: 'before', keyword: KEYWORDS.before, question: 'What did you do before?', questionFa: 'قبلاً چه کار می‌کردی؟', starters: ['Before that, I worked at', 'I studied', 'I have two years of experience in'] },
		{ id: 'next', keyword: KEYWORDS.next, question: 'Why do you want this job?', questionFa: 'چرا این کار را می‌خواهی؟', starters: ['Now I’m looking for', 'I’d like to', 'I want this job because'] }
	] },
	professional: { parts: [
		{ id: 'now', keyword: KEYWORDS.now, question: 'What do you do at the moment?', questionFa: 'در حال حاضر چه کار می‌کنی؟', starters: ['I’m currently working as', 'At the moment, I’m studying', 'Right now, I’m between jobs, and'] },
		{ id: 'before', keyword: KEYWORDS.before, question: 'What experience do you have?', questionFa: 'چه تجربه‌ای داری؟', starters: ['Before that, I spent', 'I’ve worked in', 'During my studies, I'] },
		{ id: 'next', keyword: KEYWORDS.next, question: 'Why are you interested in this job?', questionFa: 'چرا به این کار علاقه داری؟', starters: ['That’s why I applied for', 'What I’m looking for now is', 'I’d love to'] }
	] }
};

/** Fixes shown in this step (learning-UX review: at most two in the whole answer). */
export const PITCH_FIXES = 2;
/** Each part's text, at most (the three together must fit the feedback call). */
export const PART_MAX_CHARS = 600;
/** How long the whole answer should take, in seconds, by level (said once at the end). */
export const PITCH_TARGET: Record<Track, { min: number; max: number }> = { intermediate: { min: 30, max: 60 }, professional: { min: 45, max: 90 } };

export interface PitchRecord {
	parts: Record<PitchPartId, string | null>;
	/** Seconds spoken across the three parts. */
	talkSeconds: number;
	feedback: Feedback | null;
	/** The whole answer, said once more at the end. */
	transcript2: string | null;
	seconds2: number;
	uses: FixUse[];
	done: boolean;
}
export const emptyPitch = (): PitchRecord => ({ parts: { now: null, before: null, next: null }, talkSeconds: 0, feedback: null, transcript2: null, seconds2: 0, uses: [], done: false });

/** The three parts as one answer, for the feedback engine. */
export function joinParts(parts: PitchRecord['parts']): string {
	return PITCH_PARTS.map(id => (parts[id] ?? '').trim()).filter(Boolean)
		.map(part => (/[.!?]$/.test(part) ? part : `${part}.`)).join(' ');
}

/** A saved record (it comes back from browser storage), checked before use. */
export function asPitchRecord(value: unknown): PitchRecord | null {
	const r = value as Partial<PitchRecord> | null;
	if (!r || typeof r !== 'object' || typeof r.done !== 'boolean' || !r.parts || typeof r.parts !== 'object' || !Array.isArray(r.uses)) return null;
	if (!PITCH_PARTS.every(id => r.parts![id] === null || typeof r.parts![id] === 'string')) return null;
	const f = r.feedback;
	if (f !== null && f !== undefined && (typeof f !== 'object' || !Array.isArray(f.fixes))) return null;
	return {
		parts: { now: r.parts.now ?? null, before: r.parts.before ?? null, next: r.parts.next ?? null },
		talkSeconds: typeof r.talkSeconds === 'number' ? r.talkSeconds : 0, feedback: f ?? null,
		transcript2: typeof r.transcript2 === 'string' ? r.transcript2 : null, seconds2: typeof r.seconds2 === 'number' ? r.seconds2 : 0,
		uses: r.uses, done: r.done
	};
}

/** What the end screen says about the length of the whole answer. Never "too short". */
export function lengthNote(seconds: number, track: Track): DisplayText {
	const { min, max } = PITCH_TARGET[track];
	if (seconds < min) return { en: 'Good start. Next time, add one more detail.', fa: 'شروع خوبی بود. دفعهٔ بعد یک جزئیات دیگر هم اضافه کن.' };
	if (seconds > max) return { en: 'Lots to say! Next time, try to keep it a little shorter.', fa: 'حرف زیادی برای گفتن داشتی! دفعهٔ بعد سعی کن کمی کوتاه‌ترش کنی.' };
	return { en: 'That’s a good length for an interview.', fa: 'این طول برای مصاحبه خوب است.' };
}
