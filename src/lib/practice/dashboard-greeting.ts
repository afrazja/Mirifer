/**
 * Mira's spoken hello on the learner's dashboard (owner's decision: voice only, no text on screen).
 * One short English line that fits the moment: the first visit, a lesson paused, a streak, a long
 * break, a lesson done today, every lesson done. Each moment has a few lines and the day picks one,
 * so she doesn't say the same thing every day. Rules only (no AI, nothing to pay for).
 */
export interface DashboardMoment {
	/** The learner's name, or '' (the line then reads without it). */
	name: string;
	/** Lessons finished so far. */
	finished: number;
	/** Days with any lesson activity, ever. */
	activeDays: number;
	/** A lesson started and not finished. */
	inProgress: boolean;
	/** Today's lesson is already done (on the learner's calendar). */
	doneToday: boolean;
	/** Every released lesson is done. */
	caughtUp: boolean;
	/** Days in a row, ending today or yesterday. */
	streak: number;
	/** Whether the streak includes today. */
	activeToday: boolean;
	/** Days since the last day with a lesson, or null if none. */
	daysAway: number | null;
	/** The lesson the button opens. */
	lessonNumber: number;
}

export type GreetingKind = 'first' | 'in-progress' | 'done-today' | 'caught-up' | 'streak' | 'keep-going' | 'long-break' | 'welcome-back';

export function greetingKind(m: DashboardMoment): GreetingKind {
	if (m.inProgress) return 'in-progress';
	if (m.finished === 0 && m.activeDays === 0) return 'first';
	if (m.doneToday) return 'done-today';
	if (m.caughtUp) return 'caught-up';
	if (m.streak >= 2) return 'streak';
	if (m.streak === 1 && !m.activeToday) return 'keep-going';
	if (m.daysAway !== null && m.daysAway >= 7) return 'long-break';
	return 'welcome-back';
}

/** Puts the name in, or drops it cleanly ("Welcome back, Sam!" / "Welcome back!"). */
const named = (line: string, name: string) => (name ? line.replaceAll('{name}', name) : line.replace(/,? ?\{name\}/g, ''));

/** The day's pick from a moment's lines (the same all day, a different one most days). */
function pick(lines: string[], date: string): string {
	let hash = 0;
	for (const char of date) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	return lines[hash % lines.length];
}

/** Mira's line for the moment, in English (she says it; nothing is shown). */
export function dashboardGreeting(m: DashboardMoment, date: string): string {
	const n = m.lessonNumber;
	const lines: Record<GreetingKind, string[]> = {
		first: [`Hi {name}, this is Mira, your English coach. Let’s start your first lesson!`],
		'in-progress': [
			`Welcome back, {name}! Day ${n} is waiting right where you left it.`,
			`Hey {name}! Let’s finish Day ${n}. You’re almost there.`,
			`There you are, {name}! Ready to pick up Day ${n}?`
		],
		'done-today': m.caughtUp
			? [`Great job today, {name}! New lessons are on the way.`, `You did it, {name}! I’m getting the next lesson ready for you.`]
			: [`You did it today, {name}! High five! See you tomorrow for Day ${n}.`, `Nice work today, {name}! Day ${n} opens tomorrow.`],
		'caught-up': [
			`Hey {name}! You’ve done every lesson so far. Want to try Day ${n} again while I get the next one ready?`,
			`Welcome back, {name}! New lessons are coming soon. Day ${n} again, just for fun?`
		],
		streak: m.streak >= 7
			? [`${m.streak} days in a row, {name}! That’s amazing. Let’s keep it going!`, `Wow, {name}, ${m.streak} days in a row! You’re unstoppable. Day ${n} is next.`]
			: [`${m.streak} days in a row, {name}! You’re on fire. Let’s keep it going with Day ${n}.`, `Look at you, {name}! ${m.streak} days in a row. Let’s make it ${m.streak + 1}!`],
		'keep-going': [
			`Welcome back, {name}! Let’s make it two days in a row with Day ${n}.`,
			`Hi again, {name}! You practiced yesterday. One more today, and that’s a streak!`
		],
		'long-break': [
			`Long time no see, {name}! I missed you. Let’s jump back in with Day ${n}.`,
			`Hey {name}! It’s so good to see you again. Let’s start with Day ${n}.`
		],
		'welcome-back': [
			`Welcome back, {name}! Ready for Day ${n}? Let’s go!`,
			`Hi {name}! Day ${n} is ready for you. Shall we?`,
			`Good to see you, {name}! Let’s start Day ${n}.`
		]
	};
	return named(pick(lines[greetingKind(m)], date), m.name);
}
