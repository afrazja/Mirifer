/** Course availability is separate from the English/Persian interface language.
 * New courses stay unavailable until their content, audio and progress storage are ready.
 */
export const COURSES = [
	// German is paused (owner's decision) while it is rebuilt with the English course's daily-lesson
	// method. Its content and every learner's progress are kept; set `available` back to true to reopen it.
	{ code: 'de', nativeName: 'Deutsch', name: { en: 'German', fa: 'آلمانی' }, available: false,
		description: { en: 'German is coming back soon, with the same daily speaking lessons as English.', fa: 'آلمانی به‌زودی برمی‌گردد، با همان درس‌های روزانهٔ صحبت کردن که انگلیسی دارد.' } },
	{ code: 'en', nativeName: 'English', name: { en: 'English', fa: 'انگلیسی' }, available: true,
		description: { en: 'Short daily speaking lessons for real situations: travel, work and everyday life.', fa: 'درس‌های کوتاه روزانه برای صحبت کردن در موقعیت‌های واقعی: سفر، کار و زندگی روزمره.' } },
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

/**
 * The one course open right now, or null when there's a choice. While only one is open, there's
 * nothing to pick: the language list steps aside and the app opens straight on that course
 * (owner's decision, to cut taps). It comes back on its own once a second course opens.
 */
export function onlyOpenCourse(): (typeof COURSES)[number]['code'] | null {
	const open = COURSES.filter(course => course.available);
	return open.length === 1 ? open[0].code : null;
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
		.some(route => pathname === route || pathname.startsWith(`${route}/`))) return '/practice/english/progress';
	if ((pathname === '/practice' || pathname.startsWith('/practice/')) && target !== 'en') return '/languages';
	return null;
}
