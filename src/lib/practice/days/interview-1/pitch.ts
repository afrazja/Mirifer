/**
 * Interview 1, step 4: "Tell me about yourself" in three parts (pitch.ts; english-coach review
 * 2026-11-07), and how Erin names the role in the role-play (roleFor). Content only.
 */
import type { Track } from '../../day';
import type { PitchContent } from '../../pitch';

const NOW = { en: 'Now', fa: 'الان' }, BEFORE = { en: 'Before', fa: 'قبلاً' }, NEXT = { en: 'Next', fa: 'بعد' };

export const PITCH: Record<Track, PitchContent> = {
	intermediate: { parts: [
		{ id: 'now', keyword: NOW, question: 'What do you do now?', questionFa: 'الان چه کار می‌کنی؟',
			starters: ['Right now, I work as a …', 'I’m a student. I study …', 'At the moment, I’m looking for a job in …'] },
		{ id: 'before', keyword: BEFORE, question: 'What did you do before?', questionFa: 'قبلاً چه کار می‌کردی؟',
			starters: ['Before that, I worked at … for … years.', 'I studied … at …', 'In my last job, I …'] },
		{ id: 'next', keyword: NEXT, question: 'Why do you want this job?', questionFa: 'چرا این کار را می‌خواهی؟',
			starters: ['I want this job because I like …', 'I’m good at …, and I’d like to do that here.', 'I’d like to learn more about …'] }
	] },
	professional: { parts: [
		{ id: 'now', keyword: NOW, question: 'What do you do now?', questionFa: 'الان چه کار می‌کنی؟',
			starters: ['At the moment, I’m a … at …, where I …', 'I’m currently studying …, and I’m especially interested in …', 'Right now I’m between jobs, and I’m using the time to …'] },
		{ id: 'before', keyword: BEFORE, question: 'What’s one thing from your experience?', questionFa: 'یک چیز از تجربه‌هایت بگو.',
			starters: ['Before that, I spent … years at …, where I learned to …', 'In my last role, I was responsible for …', 'During my studies, I worked on a project where I …'] },
		{ id: 'next', keyword: NEXT, question: 'Why this job?', questionFa: 'چرا این شغل؟',
			starters: ['I’m applying for this role because I’d like to …', 'I’m looking for a place where I can …', 'What I like about this job is …'] }
	] }
};

/** The learner's work (work-profile.ts). Only known ids are used: raw text never reaches a prompt. */
export interface LearnerProfile { field: string | null; seniority: string | null }
const FIELD_ROLE: Record<string, string> = {
	it: 'IT role', engineering: 'engineering role', healthcare: 'healthcare role', finance: 'finance role', sales: 'sales and marketing role',
	education: 'teaching role', admin: 'office admin role', hospitality: 'hotel and restaurant role'
};
const SENIORITY_WORD: Record<string, string> = { student: 'entry-level', junior: 'junior', mid: '', senior: 'senior' };
const own = (o: object, key: string) => Object.prototype.hasOwnProperty.call(o, key);

/** "this junior IT role" / "a junior IT role"; "this role" / "an open role" when the field is unknown or 'other'. */
export function roleFor(learner?: LearnerProfile | null): { role: string; aRole: string; field: boolean; seniority: string | null } {
	const fieldWords = learner?.field && own(FIELD_ROLE, learner.field) ? FIELD_ROLE[learner.field] : null;
	const seniority = learner?.seniority && own(SENIORITY_WORD, learner.seniority) ? learner.seniority : null;
	const level = seniority ? SENIORITY_WORD[seniority] : '';
	const words = fieldWords ? `${level ? `${level} ` : ''}${fieldWords}` : level ? `${level} role` : null;
	if (!words) return { role: 'this role', aRole: 'an open role', field: false, seniority };
	return { role: `this ${words}`, aRole: `${/^[aeiou]/i.test(words) ? 'an' : 'a'} ${words}`, field: !!fieldWords, seniority };
}
