/**
 * Photos for the landing page. The owner is choosing real photos; until one is set, its place
 * shows a quiet pattern. To add one: put the file in static/images/landing/ (WebP, about
 * 1600px wide) and fill in its entry below, with a short description for screen readers.
 */
export interface LandingPhoto {
	src: string;
	alt: { en: string; fa: string };
	/** Which part of the photo stays in view when its place crops it (CSS object-position), per page direction. */
	focus?: { ltr: string; rtl: string };
}

export const LANDING_PHOTOS: Record<'hero' | 'practice' | 'end', LandingPhoto | null> = {
	/** First screen: the tilted card beside the lesson phone. Portrait, about 3:4 (here 600×855). */
	hero: {
		src: '/images/landing/airport.webp',
		alt: { en: 'A smiling traveller with a backpack and a suitcase in an airport.', fa: 'مسافری خندان با کوله‌پشتی و چمدان در فرودگاه.' },
		// The phone covers the inner side of this card: keep her face on the outer side.
		focus: { ltr: '15% 25%', rtl: '72% 25%' }
	},
	/** The "Coming soon" card in Practice. Landscape (here 800×599); it is shown as a wide strip. */
	practice: {
		src: '/images/landing/interview.webp',
		alt: { en: 'A woman answering a question in a job interview.', fa: 'زنی در مصاحبهٔ کاری به یک سؤال جواب می‌دهد.' },
		focus: { ltr: '50% 22%', rtl: '50% 22%' }
	},
	/** The closing card. Portrait or square. */
	end: null
};
