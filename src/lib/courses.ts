/** Course availability is separate from the English/Persian interface language.
 * New courses stay unavailable until their content, audio and progress storage are ready.
 */
export const COURSES = [
	{ code: 'de', nativeName: 'Deutsch', name: { en: 'German', fa: 'آلمانی' }, available: true,
		description: { en: 'Build everyday conversation skills with listening, speaking and daily lessons.', fa: 'با شنیدن، صحبت کردن و درس‌های روزانه، مکالمه‌های روزمره را تمرین کن.' } },
	{ code: 'en', nativeName: 'English', name: { en: 'English', fa: 'انگلیسی' }, available: true,
		description: { en: 'Try our first guided conversation: arrange a quieter hotel room. One experimental lesson is available.', fa: 'اولین گفت‌وگوی هدایت‌شده را امتحان کن: یک اتاق آرام‌تر در هتل بگیر. فعلاً یک درس آزمایشی آماده است.' } },
	{ code: 'fr', nativeName: 'Français', name: { en: 'French', fa: 'فرانسوی' }, available: false,
		description: { en: 'French is coming to Mirifer. Lessons are not available yet.', fa: 'فرانسوی به میریفر اضافه خواهد شد. درس‌های آن هنوز آماده نیستند.' } }
] as const;

export type TargetLanguage = (typeof COURSES)[number]['code'];

export function getCourse(code: unknown) {
	return COURSES.find(course => course.code === code) ?? null;
}

export function isAvailableCourse(code: unknown): code is TargetLanguage {
	return getCourse(code)?.available === true;
}

/** Learning routes require a selected, available course, including deep links. */
export function needsCourse(pathname: string): boolean {
	return ['/home', '/lesson', '/lessons', '/review', '/vocabulary', '/drill', '/check-in', '/practice']
		.some(route => pathname === route || pathname.startsWith(`${route}/`));
}

/** English's pilot never opens German content or its unscoped progress tools. */
export function courseRedirect(pathname: string, target: unknown): string | null {
	if (needsCourse(pathname) && !isAvailableCourse(target)) return '/languages';
	if (target === 'en' && ['/home', '/lesson', '/lessons', '/review', '/vocabulary', '/drill', '/check-in', '/basics', '/exam', '/progress']
		.some(route => pathname === route || pathname.startsWith(`${route}/`))) return '/practice/english/today';
	if ((pathname === '/practice' || pathname.startsWith('/practice/')) && target !== 'en') return '/languages';
	return null;
}
