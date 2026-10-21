/**
 * Photos for the landing page. The owner is choosing real photos; until one is set, its place
 * shows a quiet pattern. To add one: put the file in static/images/landing/ (WebP, about
 * 1600px wide) and fill in its entry below, with a short description for screen readers.
 */
export interface LandingPhoto {
	src: string;
	alt: { en: string; fa: string };
}

export const LANDING_PHOTOS: Record<'hero' | 'practice' | 'end', LandingPhoto | null> = {
	/** First screen: the tilted card beside the lesson phone. Portrait, about 3:4. */
	hero: null,
	/** The "Coming soon" card in Practice. Landscape, about 16:9. */
	practice: null,
	/** The closing card. Portrait or square. */
	end: null
};
