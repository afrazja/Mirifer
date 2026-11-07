/**
 * The learner's work, for the interview path (owner's decision 2026-11-07): their field and where
 * they are in their career, asked in onboarding only when the goal is "Work and interviews", both
 * optional. Kept apart from `english_profile_v1` (a strict schema older code reads), in
 * `english_work_v1`: two choices from fixed lists, nothing typed, so it is safe to put in a prompt.
 */
import { z } from 'zod';
import type { DisplayText } from './hotel';

/** Eight common fields and "something else" (learning-UX review: a list that fits on a phone). */
export const FIELDS = ['it', 'engineering', 'healthcare', 'finance', 'sales', 'education', 'admin', 'hospitality', 'other'] as const;
export type Field = (typeof FIELDS)[number];
export const SENIORITY = ['student', 'junior', 'mid', 'senior'] as const;
export type Seniority = (typeof SENIORITY)[number];

export const WorkProfileSchema = z.object({
	field: z.enum(FIELDS).nullable(),
	seniority: z.enum(SENIORITY).nullable(),
	updatedAt: z.string().datetime()
}).strip();
export type WorkProfile = z.infer<typeof WorkProfileSchema>;
export const WorkAnswersSchema = WorkProfileSchema.omit({ updatedAt: true }).strict();
export type WorkAnswers = z.infer<typeof WorkAnswersSchema>;

export function readWorkProfile(meta: Record<string, unknown> | null | undefined): WorkProfile | null {
	const parsed = WorkProfileSchema.safeParse(meta?.english_work_v1);
	return parsed.success ? parsed.data : null;
}

/** For the learner. */
export const FIELD_LABELS: Record<Field, { icon: string; label: DisplayText }> = {
	it: { icon: '💻', label: { en: 'IT and software', fa: 'آی‌تی و نرم‌افزار' } },
	engineering: { icon: '🛠️', label: { en: 'Engineering', fa: 'مهندسی' } },
	healthcare: { icon: '🩺', label: { en: 'Healthcare', fa: 'پزشکی و درمان' } },
	finance: { icon: '📊', label: { en: 'Finance and accounting', fa: 'مالی و حسابداری' } },
	sales: { icon: '🤝', label: { en: 'Sales and marketing', fa: 'فروش و بازاریابی' } },
	education: { icon: '📚', label: { en: 'Teaching and education', fa: 'تدریس و آموزش' } },
	admin: { icon: '🗂️', label: { en: 'Office and admin', fa: 'کارهای اداری و دفتری' } },
	hospitality: { icon: '🍽️', label: { en: 'Hotels and restaurants', fa: 'هتل و رستوران' } },
	other: { icon: '✨', label: { en: 'Something else', fa: 'زمینهٔ دیگر' } }
};
export const SENIORITY_LABELS: Record<Seniority, DisplayText> = {
	student: { en: 'Student or first job', fa: 'دانشجو یا اولین کار' },
	junior: { en: 'Early in my career (1–3 years)', fa: 'اوایل کار (۱ تا ۳ سال)' },
	mid: { en: 'Mid-level (3–8 years)', fa: 'سطح میانی (۳ تا ۸ سال)' },
	senior: { en: 'Senior (8+ years)', fa: 'ارشد (بیش از ۸ سال)' }
};

/** For the AI: the role the learner is interviewing for, in plain words ("the open role" when unknown). */
const ROLE_WORDS: Record<Field, string> = {
	it: 'a role in IT or software', engineering: 'an engineering role', healthcare: 'a role in healthcare', finance: 'a role in finance or accounting',
	sales: 'a role in sales or marketing', education: 'a teaching or education role', admin: 'an office or admin role',
	hospitality: 'a role in a hotel or restaurant', other: 'the open role'
};
const LEVEL_WORDS: Record<Seniority, string> = {
	student: 'a student or looking for their first job', junior: 'early in their career (1–3 years)', mid: 'mid-level (3–8 years of experience)', senior: 'senior (8+ years of experience)'
};
export interface LearnerWork { field: Field | null; seniority: Seniority | null }
export const roleWords = (work: LearnerWork | null | undefined) => (work?.field ? ROLE_WORDS[work.field] : 'the open role');
export const levelWords = (work: LearnerWork | null | undefined) => (work?.seniority ? LEVEL_WORDS[work.seniority] : null);
/** One line for a prompt: what we know about the learner's work, or that we don't. */
export function workLine(work: LearnerWork | null | undefined): string {
	if (!work?.field && !work?.seniority) return 'We don’t know the learner’s field or experience: keep everything general, true for any job or a student.';
	return `The learner is interviewing for ${roleWords(work)}${work.seniority ? `, and is ${LEVEL_WORDS[work.seniority]}` : ''}. Never assume more than this (no employer names, years, degrees or achievements they haven’t said).`;
}
