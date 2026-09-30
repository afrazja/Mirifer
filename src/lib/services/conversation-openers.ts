/**
 * The question that starts the free-response turn.
 *
 * It has to be German the learner can already read, and it has to follow
 * from the lesson they just did — asking about the weather straight after a
 * café dialogue tells them the app was not listening.
 *
 * A tiny hand-written table rather than a generated opener, for two
 * reasons. The model would cost a second call before the learner has said
 * anything, and an opener is the one line that absolutely must be
 * understandable — it is the whole invitation. Authoring one line per day
 * is cheap; a confusing opener kills the feature.
 *
 * The fallback works on any day of the course, so a lesson without an entry
 * still gets a usable turn. Adding a day is one line here and nothing else.
 */

export interface Opener {
	/** German. Must be answerable by someone who just did this lesson. */
	de: string;
	en: string;
	fa: string;
}

/**
 * Universal fallback. Answerable at A1 from day one, and open enough that
 * nobody is stuck for something to say.
 */
export const DEFAULT_OPENER: Opener = {
	de: 'Erzählen Sie mir etwas über sich.',
	en: 'Tell me something about yourself.',
	fa: 'کمی دربارهٔ خودتان بگویید.'
};

const OPENERS: Record<number, Opener> = {
	1: {
		de: 'Und was machen Sie in Deutschland?',
		en: 'And what do you do in Germany?',
		fa: 'و در آلمان چه کار می‌کنید؟'
	},
	2: {
		// Day 2 is the informal (du) lesson, so its opener is too.
		de: 'Und wo wohnst du jetzt?',
		en: 'And where do you live now?',
		fa: 'و الان کجا زندگی می‌کنی؟'
	},
	3: {
		de: 'Was möchten Sie bestellen?',
		en: 'What would you like to order?',
		fa: 'چه چیزی می‌خواهید سفارش دهید؟'
	},
	4: {
		de: 'Wie schreibt man Ihren Namen?',
		en: 'How do you spell your name?',
		fa: 'نامتان را چطور می‌نویسند؟'
	},
	5: {
		de: 'Was trinken Sie gern?',
		en: 'What do you like to drink?',
		fa: 'دوست دارید چه بنوشید؟'
	},
	6: {
		de: 'Erzählen Sie mir von Ihrer Familie.',
		en: 'Tell me about your family.',
		fa: 'دربارهٔ خانواده‌تان بگویید.'
	},
	7: {
		de: 'Was machen Sie am Wochenende?',
		en: 'What do you do at the weekend?',
		fa: 'آخر هفته چه کار می‌کنید؟'
	},
	8: {
		de: 'Welche Farbe mögen Sie?',
		en: 'Which colour do you like?',
		fa: 'چه رنگی دوست دارید؟'
	},
	9: {
		de: 'Was machen Sie heute noch?',
		en: 'What else are you doing today?',
		fa: 'امروز دیگر چه کار می‌کنید؟'
	},
	10: {
		de: 'Was sehen Sie in Ihrem Zimmer?',
		en: 'What can you see in your room?',
		fa: 'در اتاقتان چه می‌بینید؟'
	}
};

/** The opener for a day, falling back to one that works anywhere. */
export function openerForDay(day: number): Opener {
	return OPENERS[day] ?? DEFAULT_OPENER;
}

/** Days with a hand-written opener — the rollout list. */
export function daysWithOpener(): number[] {
	return Object.keys(OPENERS)
		.map(Number)
		.sort((a, b) => a - b);
}
