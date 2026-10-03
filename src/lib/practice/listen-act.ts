/**
 * "Listen and act": the learner hears a short set of instructions, then does
 * what they say by moving things to places, in order. No speaking, no AI,
 * nothing typed: it tests whether the details were understood.
 *
 * Each round has its own level and a script written for it. The script is
 * only revealed after the learner answers.
 */
import type { DisplayText } from './hotel';

export type ThingId = 'passport' | 'phone' | 'ticket' | 'wallet' | 'umbrella' | 'bottle';
export type PlaceId = 'desk' | 'blue-bag' | 'red-bag' | 'table' | 'agent';

export const THINGS: Record<ThingId, { icon: string; label: DisplayText }> = {
	passport: { icon: '🛂', label: { en: 'passport', fa: 'پاسپورت' } },
	phone: { icon: '📱', label: { en: 'phone', fa: 'گوشی' } },
	ticket: { icon: '🎫', label: { en: 'ticket', fa: 'بلیت' } },
	wallet: { icon: '👛', label: { en: 'wallet', fa: 'کیف پول' } },
	umbrella: { icon: '☂️', label: { en: 'umbrella', fa: 'چتر' } },
	bottle: { icon: '🧴', label: { en: 'water bottle', fa: 'بطری آب' } }
};
export const PLACES: Record<PlaceId, { icon: string; label: DisplayText }> = {
	desk: { icon: '🗄️', label: { en: 'the desk', fa: 'میز پذیرش' } },
	'blue-bag': { icon: '🟦', label: { en: 'the blue bag', fa: 'کیف آبی' } },
	'red-bag': { icon: '🟥', label: { en: 'the red bag', fa: 'کیف قرمز' } },
	table: { icon: '🪑', label: { en: 'the table', fa: 'میز' } },
	agent: { icon: '🧑‍💼', label: { en: 'the agent', fa: 'مأمور' } }
};

export interface Step { thing: ThingId; place: PlaceId }
export interface ActRound {
	id: string;
	level: 'A2' | 'B1';
	/** Read aloud once or twice; shown only after the answer. */
	script: string;
	/** The correct steps, in the order they were said to be done. */
	steps: Step[];
	/** Words that carried the answer, for the review. */
	listenFor: DisplayText;
}

export const ACT_ROUNDS: ActRound[] = [
	{
		id: 'a2-desk', level: 'A2',
		script: 'You are at the airport. Please put your passport on the desk. Then put your phone in the blue bag. Last, give your ticket to the agent.',
		steps: [{ thing: 'passport', place: 'desk' }, { thing: 'phone', place: 'blue-bag' }, { thing: 'ticket', place: 'agent' }],
		listenFor: { en: 'Three actions, joined by “then” and “last”.', fa: 'سه کار، که با «then» و «last» به هم وصل شده‌اند.' }
	},
	{
		id: 'a2-bags', level: 'A2',
		script: 'Your suitcase is open. Put the umbrella in the red bag. After that, put your wallet in the blue bag. Then put the water bottle on the table.',
		steps: [{ thing: 'umbrella', place: 'red-bag' }, { thing: 'wallet', place: 'blue-bag' }, { thing: 'bottle', place: 'table' }],
		listenFor: { en: 'Colours of the bags, and “after that”.', fa: 'رنگ کیف‌ها و عبارت «after that».' }
	},
	{
		id: 'b1-lost', level: 'B1',
		script: 'Before you give your passport to the agent, put your phone in the red bag. Don’t put your wallet in the blue bag. Put it on the desk instead. Finally, give the agent your ticket.',
		steps: [{ thing: 'phone', place: 'red-bag' }, { thing: 'passport', place: 'agent' }, { thing: 'wallet', place: 'desk' }, { thing: 'ticket', place: 'agent' }],
		listenFor: { en: '“Before” changes the order. “Don’t… instead” means the second place is the right one.', fa: '«Before» ترتیب را عوض می‌کند. «Don’t… instead» یعنی مکان دوم درست است.' }
	}
];

export const MAX_PLAYS = 2;
export const PLAYBACK_RATE: Record<ActRound['level'], number> = { A2: 0.85, B1: 0.9 };

/** Step-by-step: step i is right only if the learner's i-th step equals the expected i-th step. Extra steps are not rewarded. */
export function scoreSteps(expected: Step[], given: Step[]): { results: boolean[]; correct: number } {
	const results = expected.map((step, index) => given[index]?.thing === step.thing && given[index]?.place === step.place);
	return { results, correct: results.filter(Boolean).length };
}

/** What a finished module keeps for Back: the learner's steps and how each was marked, per round. */
export interface ActRecord { rounds: { id: string; steps: Step[]; results: boolean[] }[] }

const THING_IDS = Object.keys(THINGS), PLACE_IDS = Object.keys(PLACES);
/** Checks a saved record, since it comes back from storage the learner (or a bug) could have changed. */
export function asActRecord(value: unknown): ActRecord | null {
	const rounds = (value as ActRecord | null)?.rounds;
	if (!Array.isArray(rounds) || rounds.length > ACT_ROUNDS.length) return null;
	for (const round of rounds) {
		if (!ACT_ROUNDS.some(known => known.id === round?.id) || !Array.isArray(round.steps) || round.steps.length > 8 || !Array.isArray(round.results)) return null;
		if (!round.steps.every(step => THING_IDS.includes(step?.thing) && PLACE_IDS.includes(step?.place))) return null;
	}
	return { rounds };
}
