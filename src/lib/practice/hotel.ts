/**
 * English lesson 1: an open role-play at a hotel reception desk.
 *
 * There is no answer key. Jamie, the receptionist, is played by AI on every
 * turn (see /api/english/converse) and reacts to whatever the learner says.
 * What keeps him consistent is the fact sheet below: he may only use these
 * facts, so the hotel doesn't change from one reply to the next. The scene
 * ends when the learner has reached the goals, by whatever route they choose.
 */
export const HOTEL_ID = 'hotel-quiet-room-v1';
export type DisplayText = { en: string; fa: string };
export type Variant = 'lift' | 'street';
export interface Turn { speaker: 'reception' | 'learner'; text: string; }
export interface Correction { original: string; improved: string; note: DisplayText; }

export type GoalId = 'problem' | 'solution' | 'cost' | 'confirm';
export const GOALS: { id: GoalId; label: DisplayText; meaning: string }[] = [
	{ id: 'problem', label: { en: 'Explain what’s wrong and how it affects you.', fa: 'توضیح بده چه مشکلی هست و چه اثری روی تو دارد.' },
		meaning: 'the guest has described the problem with their room in their own words' },
	{ id: 'solution', label: { en: 'Agree on a solution you’re happy with.', fa: 'روی راه‌حلی که از آن راضی هستی توافق کن.' },
		meaning: 'the guest has chosen what to do: a particular room, or another option from the fact sheet' },
	{ id: 'cost', label: { en: 'Find out whether it costs anything.', fa: 'بپرس آیا هزینه‌ای دارد.' },
		meaning: 'the guest has asked about the price or an extra charge, and Jamie has answered' },
	{ id: 'confirm', label: { en: 'Confirm the arrangement.', fa: 'هماهنگی نهایی را تأیید کن.' },
		meaning: 'the guest has clearly confirmed the arrangement, knowing what it involves' }
];
export const GOAL_IDS = GOALS.map(goal => goal.id);

/** Everything Jamie is allowed to know. He must not add facts. */
export function hotelFacts(variant: Variant): string {
	const other = variant === 'lift'
		? 'Room 310, third floor, right next to the lift: people come and go until late, so it is only a little quieter than 204.'
		: 'Room 318, third floor, facing the busy main street: traffic and buses until late, so it is only a little quieter than 204.';
	return [
		'Willow Hotel, a mid-sized city hotel. It is about 10 pm. Jamie works alone at the front desk tonight.',
		'The guest is in room 204, second floor, directly above the hotel bar. The bar has live music until midnight (12 am).',
		'The hotel is nearly full. Only two rooms are free tonight:',
		`- ${other}`,
		'- Room 512, fifth floor, facing the inner courtyard: very quiet, same size and type as 204.',
		'Moving to either room costs nothing extra tonight, because of the noise problem.',
		'Jamie can: give the guest the key so they can look at a room before deciding; send a porter to help carry bags (in about 10 minutes); give free earplugs; move the guest tonight or tomorrow morning.',
		'Jamie cannot: stop the music early, offer a discount or refund, or offer any other room.',
		'Breakfast is 7 to 10 am in the ground-floor restaurant. Checkout is at 11 am. From the lift, room 512 is on the left.'
	].join('\n');
}

export const GREETING = 'Good evening, welcome to Willow Hotel. How can I help you tonight?';

/** Said if the AI's line fails the server's checks; one per goal still open. */
export const FALLBACK_LINES: Record<GoalId | 'done', string> = {
	problem: 'I’m sorry, I didn’t quite follow. Could you tell me a bit more about what’s wrong with your room?',
	solution: 'I see. What would you like to do about your room tonight?',
	cost: 'Of course. Is there anything you’d like to know before we decide, for example about the cost?',
	confirm: 'Shall I go ahead and arrange that for you now?',
	done: 'All arranged. Have a good night and sleep well.'
};
export function fallbackLine(goals: readonly string[]): string {
	const open = GOAL_IDS.find(id => !goals.includes(id));
	return FALLBACK_LINES[open ?? 'done'];
}

/** Long enough to practise speaking in full sentences, bounded for cost. */
export const MAX_REPLY = 400;
/** Learner turns per conversation. */
export const MAX_TURNS = 16;

export interface HotelState {
	variant: Variant; turns: Turn[]; goals: GoalId[]; proof: string | null; corrections: Correction[]; done: boolean;
}
export function startHotel(variant: Variant = 'lift'): HotelState {
	return { variant, turns: [{ speaker: 'reception', text: GREETING }], goals: [], proof: null, corrections: [], done: false };
}
export function learnerTurns(state: Pick<HotelState, 'turns'>): string[] {
	return state.turns.filter(turn => turn.speaker === 'learner').map(turn => turn.text);
}
export function wordCount(text: string): number {
	return text.trim().split(/\s+/).filter(Boolean).length;
}
