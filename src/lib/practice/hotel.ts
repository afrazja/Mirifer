/** A finite, authored conversation. AI may classify unmatched replies, but cannot change its path. */
export const HOTEL_ID = 'hotel-quiet-room-v1';
export type DisplayText = { en: string; fa: string };
export type Stage = 'problem' | 'room' | 'offer' | 'alternative' | 'confirm' | 'recall' | 'complete';
export type Variant = 'lift' | 'street';
export interface Turn { speaker: 'reception' | 'learner' | 'coach'; text: string; }
export interface Correction { original: string; improved: string; note: DisplayText; }
export interface HotelState {
	stage: Stage; variant: Variant; turns: Turn[]; trail: string[]; corrections: Correction[];
}
/** `again` is said instead of `reply` when the reply would repeat the speaker's previous line word for word. */
interface Choice { id: string; text: string; aliases: string[]; next: Stage; reply: string; again?: string; }
export const STAGES: Stage[] = ['problem', 'room', 'offer', 'alternative', 'confirm', 'recall'];
const initial = 'Good evening. Welcome to Willow Hotel. How can I help you?';
export function startHotel(variant: Variant = 'lift'): HotelState {
	return { stage: 'problem', variant, turns: [{ speaker: 'reception', text: initial }], trail: [], corrections: [] };
}
const change = ['could i have a quieter room', 'can i have a quieter room', 'could you move me to a quieter room', 'i would like a quieter room', 'i need a quieter room', 'i want a quieter room', 'can i change rooms', 'could i change rooms', 'could you change my room'];
const price = ['is there an extra charge', 'does it cost extra', 'will it cost extra', 'how much does it cost', 'is it free', 'do i have to pay extra', 'is there any extra charge', 'is there an additional charge'];
function choice(id: string, text: string, aliases: string[], next: Stage, reply: string, again?: string): Choice {
	return { id, text, aliases: [text, ...aliases], next, reply, again };
}
function related(next: Stage, reply: string, again?: string): Choice {
	return choice('related', 'Could you clarify that?', [], next, reply, again);
}
export function hotelChoices(state: Pick<HotelState, 'stage' | 'variant'>): Choice[] {
	switch (state.stage) {
		case 'problem': return [
			choice('noise', 'My room is too noisy.', ['my room is noisy', 'it is too noisy in my room', 'there is too much noise', 'i cannot sleep because of the noise', 'i could not sleep because of the noise', 'i did not sleep because of the noise', 'i could not sleep because of the music downstairs', 'the music is too loud', 'i cannot sleep', 'it is too loud', 'my room is very noisy'], 'room', 'I’m sorry about that. What is your room number?'),
			choice('change', 'Could I have a quieter room, please?', change, 'room', 'Of course. Let me check your booking. What is your room number?'),
			related('problem', 'I can help with your stay. Is your room too noisy, or would you like a quieter room?', 'I’d like to help. Is something wrong with your room tonight, or would you like to change rooms?')
		];
		case 'room': return [choice('room204', 'I’m in room 204.', ['204', 'room 204', 'my room number is 204', 'my room is 204', 'it is 204', 'i am in 204', 'two hundred and four', 'two oh four'], 'offer', state.variant === 'lift'
			? 'Thank you. I can offer two rooms: room 310 beside the lift, or room 512 facing the quiet courtyard. Which would you prefer?'
			: 'Thank you. I can offer two rooms: room 318 facing the busy street, or room 512 facing the quiet courtyard. Which would you prefer?'),
			related('room', 'Of course. Could you tell me the room number on your key card?', 'No problem. The number is printed on your key card. Which room are you in?')];
		case 'offer': return [
			choice('quieter', 'Room 512, please.', [...change, '512', 'room 512', 'i would like room 512', 'i will take room 512', 'the courtyard room', 'the quiet room', 'the quieter room', 'no thank you i need a quieter room', 'that sounds noisy', 'no that is too noisy', 'i would prefer a room away from the lift', 'could i have a room away from the lift', 'i would prefer a room away from the street', 'could i have a room away from the street', 'do you have a room away from the lift', 'do you have a room away from the street'], 'alternative', 'Room 512, certainly. It faces the courtyard and should be much quieter. Is there anything you would like to check before I arrange the move?'),
			choice('noisy-room', state.variant === 'lift' ? 'What about room 310?' : 'What about room 318?', state.variant === 'lift'
				? ['room 310', '310', 'i would like room 310', 'i will take room 310']
				: ['room 318', '318', 'i would like room 318', 'i will take room 318'], 'offer', state.variant === 'lift'
				? 'I can hold room 310, but it is beside the lift and may still be noisy. Would you prefer room 512 by the courtyard?'
				: 'I can hold room 318, but it faces the busy street and may still be noisy. Would you prefer room 512 by the courtyard?',
				state.variant === 'lift'
					? 'Room 310 is yours if you really want it, but it’s right next to the lift. Since you came down about the noise, I’d suggest room 512. Which one would you like?'
					: 'Room 318 is yours if you really want it, but it’s on the busy street side. Since you came down about the noise, I’d suggest room 512. Which one would you like?'),
			choice('location', 'Which room is quieter?', ['is it quiet', 'is the room quiet', 'where is it', 'where is the room', 'is it near the lift', 'is it near the street'], 'offer', state.variant === 'lift'
				? 'Room 512 faces the courtyard. Room 310 is beside the lift, where you may hear people coming and going. Which would you prefer?'
				: 'Room 512 faces the courtyard. Room 318 faces the street, where you may hear traffic. Which would you prefer?',
				state.variant === 'lift'
					? 'Room 512 is the quiet one, on the courtyard side. Room 310 is next to the lift. Which one would you like?'
					: 'Room 512 is the quiet one, on the courtyard side. Room 318 is on the street side. Which one would you like?'),
			related('offer', state.variant === 'lift'
				? 'I can help you compare them. Room 310 is beside the lift; room 512 faces the quiet courtyard. Which would you prefer?'
				: 'I can help you compare them. Room 318 faces the street; room 512 faces the quiet courtyard. Which would you prefer?',
				state.variant === 'lift'
					? 'Take your time. Room 512 is the quieter choice, and room 310 is by the lift. Which one would you like?'
					: 'Take your time. Room 512 is the quieter choice, and room 318 is on the street side. Which one would you like?')
		];
		case 'alternative': return [
			choice('price', 'Is there an extra charge?', price, 'confirm', 'There is no extra charge for room 512. Shall I confirm your move?'),
			choice('courtyard', 'What does it face?', ['is it quiet', 'where is the room', 'where is it', 'is it away from the lift'], 'alternative', 'It faces the quiet courtyard and is away from the lift. Is there anything else you would like to ask before I reserve it?', 'It’s on the courtyard side, so it’s much quieter at night. What else would you like to know before I book it?'),
			related('alternative', 'I understand. Room 512 faces the quiet courtyard. Would you like to check whether it costs extra before I arrange the move?', 'Sure. Before I book room 512 for you, is there anything you’d like to ask about it?')
		];
		case 'confirm': return [
			choice('accept', 'Yes, that would be great. Thank you.', ['yes', 'yes please', 'yes thank you', 'that would be great', 'that sounds good', 'i will take it', 'i would like room 512', 'room 512 please', 'yes room 512 please'], 'recall', 'All arranged. Here is your key to room 512, on the fifth floor. I hope you sleep well.'),
			choice('directions', 'How do I get there?', ['where is room 512', 'which floor is it on', 'what floor is it on'], 'confirm', 'Take the lift to the fifth floor and turn left. Shall I arrange the move?', 'It’s on the fifth floor. When you leave the lift, turn left. Would you like me to book it for you now?'),
			choice('decline', 'No, thank you.', ['no', 'i am not sure', 'not yet'], 'alternative', 'No problem. Room 512 is still available. Let’s check what you need to know before deciding.'),
			related('confirm', 'Of course. Shall I confirm your move to room 512?', 'No problem. Would you like me to go ahead and move you to room 512?')
		];
		case 'recall': return [choice('recall-price', 'Does it cost extra?', price, 'complete', 'You asked about an extra charge. Keep that question ready for your next trip.'),
			related('recall', 'Think back to the price question. How would you ask whether the upgrade costs extra?', 'Try starting with “Does it…” or “Is there…”. How would you ask about the cost?')];
		case 'complete': return [];
	}
}
export function normalizeReply(text: string): string {
	return text.normalize('NFKC').toLowerCase().replace(/[’‘]/g, "'")
		.replace(/\bi'm\b/g, 'i am').replace(/\bi'd\b/g, 'i would').replace(/\bi'll\b/g, 'i will')
		.replace(/\bit's\b/g, 'it is').replace(/\bthat's\b/g, 'that is').replace(/\bcan't\b/g, 'cannot')
		.replace(/\bcouldn't\b/g, 'could not').replace(/\bdidn't\b/g, 'did not')
		.replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim()
		.replace(/^(?:hello|hi|good evening|excuse me)\s+/, '').replace(/\s+please$/, '').trim();
}
/** A clear selection of the uniquely described quiet room should not depend on model wording. */
export function explicitQuietRoomChoice(state: Pick<HotelState, 'stage'>, input: string): boolean {
	if (state.stage !== 'offer') return false;
	const value = normalizeReply(input).replace(/-/g, ' ');
	if (/\b(?:not|never|dont|do not|would not|cannot)\b/.test(value)) return false;
	if (/\b(?:310|318|lift|street)\b|\b(?:other than|different from|instead of|rather than|except)\b/.test(value)) return false;
	if (/\b(?:prefer|want|like) to (?:know|ask|check|find out)\b/.test(value)) return false;
	const namesQuietRoom = /\b(?:512|courtyard(?: facing)?|quiet(?:er|est)?(?: room| one| option)?)\b/.test(value);
	const selectsIt = /\b(?:i (?:(?:would|will|really|do) )*(?:prefer|choose|pick|take|want|like)|(?:can|could) i (?:have|get|take)|(?:please )?(?:give|book|reserve) me|(?:let us|lets) (?:take|choose))\b/.test(value);
	return namesQuietRoom && selectsIt;
}
const knownCorrections = [
	{ from: 'my room too noisy', to: 'My room is too noisy.', note: { en: 'Use “is” between “my room” and “too noisy”.', fa: 'بین «my room» و «too noisy» از «is» استفاده کن.' } },
	{ from: 'i did not slept because of the noise', to: 'I did not sleep because of the noise.', note: { en: 'After “did not”, use the base verb “sleep”.', fa: 'بعد از «did not» از شکل سادهٔ فعل، «sleep»، استفاده کن.' } },
	{ from: 'how much it costs', to: 'How much does it cost?', note: { en: 'For this question, use “does” before “it” and the base verb “cost”.', fa: 'در این سؤال، «does» را قبل از «it» بیاور و از شکل سادهٔ فعل، «cost»، استفاده کن.' } },
	{ from: 'is there a extra charge', to: 'Is there an extra charge?', note: { en: 'Use “an” before the vowel sound at the start of “extra”.', fa: 'قبل از صدای مصوت ابتدای «extra» از «an» استفاده کن.' } }
] as const;
export interface HotelReply { state: HotelState; understood: boolean; feedback: DisplayText | null; }
/**
 * Applies only a choice authored for the current stage. Used after server-side AI classification.
 * `jamieLine` replaces the authored reply for a 'related' turn only; the path is unchanged.
 */
export function applyHotelChoice(state: HotelState, id: string, input: string, correction?: { improved: string; note: DisplayText } | null, jamieLine?: string | null): HotelReply {
	if (!input.trim() || input.length > 300) return { state, understood: false, feedback: null };
	const matched = hotelChoices(state).find(option => option.id === id);
	if (!matched) return { state, understood: false, feedback: null };
	const speaker = state.stage === 'recall' ? 'coach' : 'reception';
	const previous = [...state.turns].reverse().find(turn => turn.speaker === speaker)?.text;
	const authored = matched.again && previous === matched.reply ? matched.again : matched.reply;
	const turns: Turn[] = [...state.turns, { speaker: 'learner', text: input.trim() }, { speaker, text: (matched.id === 'related' && jamieLine) || authored }];
	if (matched.id === 'noisy-room' && state.trail.includes('noisy-room')) turns.push({ speaker: 'coach', text: 'Mission tip: you came to reception because of the noise. Choose the quieter room, 512, to continue.' });
	if (matched.next === 'recall') turns.push({ speaker: 'coach', text: 'Quick recall: at a different hotel, you are offered an upgrade. Ask whether it costs extra. Try without the examples first.' });
	return { understood: true, feedback: correction?.note ?? null, state: {
		...state, stage: matched.next, turns, trail: [...state.trail, matched.id],
		corrections: correction ? [...state.corrections, { original: input.trim(), improved: correction.improved, note: correction.note }] : state.corrections
	} };
}

/** Keep clear mission conflicts with the authored coach, without spending an AI call. */
export function isHotelAiEligible(state: HotelState, input: string): boolean {
	const value = normalizeReply(input);
	if (!value || input.length > 300 || state.stage === 'complete') return false;
	if (state.stage === 'room' && /\d/.test(value) && !/\b204\b/.test(value)) return false;
	if (state.stage === 'problem' && /\b(?:not|no|isnt|isn't)\b.*\b(?:noisy|noise|loud)\b/.test(value)) return false;
	if (['offer', 'alternative'].includes(state.stage) && /^(?:yes|yes please|i will take it|that sounds good)$/.test(value)) return false;
	return true;
}
export function replyToHotel(state: HotelState, input: string): HotelReply {
	if (state.stage === 'complete') return { state, understood: false, feedback: null };
	if (!input.trim() || input.length > 300) return { state, understood: false, feedback: { en: 'Write a short reply first (up to 300 characters).', fa: 'اول یک پاسخ کوتاه بنویس (حداکثر ۳۰۰ نویسه).' } };
	const normalized = normalizeReply(input);
	const correction = knownCorrections.find(rule => rule.from === normalized);
	const matched = hotelChoices(state).find(option => option.aliases.some(alias => normalizeReply(alias) === normalizeReply(correction?.to ?? input)))
		?? (explicitQuietRoomChoice(state, input) ? hotelChoices(state).find(option => option.id === 'quieter') : undefined);
	if (!matched) {
		let feedback: DisplayText = { en: 'I couldn’t match that reply in this guided scene. It may still be good English. Try a short reply or open the examples.', fa: 'این پاسخ در گفت‌وگوی هدایت‌شده شناخته نشد؛ ممکن است انگلیسیِ درستی باشد. یک پاسخ کوتاه‌تر بنویس یا مثال‌ها را باز کن.' };
		if (state.stage === 'room' && /\d/.test(input)) feedback = { en: 'For this scene, your room number is 204. Check your room card and try again.', fa: 'در این داستان شمارهٔ اتاقت ۲۰۴ است. کارت اتاق را ببین و دوباره تلاش کن.' };
		if (state.stage === 'offer' && /^(yes|yes please|that sounds good|i will take it)$/.test(normalized)) feedback = { en: 'You can accept, but this room may still be noisy. For this mission, ask for a quieter option.', fa: 'می‌توانی قبول کنی، اما این اتاق هم ممکن است پرسر‌وصدا باشد. برای این مأموریت یک اتاق آرام‌تر بخواه.' };
		if (state.stage === 'alternative' && /^(yes|yes please|i will take it)$/.test(normalized)) feedback = { en: 'Before agreeing, check whether the quieter room costs extra.', fa: 'قبل از قبول کردن، بپرس آیا اتاق آرام‌تر هزینهٔ اضافه دارد.' };
		return { state, understood: false, feedback };
	}
	return applyHotelChoice(state, matched.id, input, correction ? { improved: correction.to, note: correction.note } : null);
}
/** Validate completion without transmitting learner-written text to the server. */
export function completedHotelTrail(variant: Variant, trail: string[]): boolean {
	let state = startHotel(variant);
	for (const id of trail) {
		const option = hotelChoices(state).find(item => item.id === id);
		if (!option) return false;
		state = replyToHotel(state, option.text).state;
	}
	return state.stage === 'complete';
}
export const stageHelp: Record<Stage, DisplayText> = {
	problem: { en: 'Explain the noise or ask for a quieter room.', fa: 'از سروصدای اتاق بگو یا یک اتاق آرام‌تر بخواه.' },
	room: { en: 'Give the room number on your key card: 204.', fa: 'شمارهٔ روی کارت اتاقت را بگو: ۲۰۴.' },
	offer: { en: 'Choose one of Jamie’s rooms, or ask which is quieter.', fa: 'یکی از اتاق‌های پیشنهادی جیمی را انتخاب کن یا بپرس کدام آرام‌تر است.' },
	alternative: { en: 'Ask about room 512’s price or location before confirming.', fa: 'پیش از تأیید اتاق ۵۱۲، دربارهٔ هزینه یا موقعیت آن بپرس.' },
	confirm: { en: 'Agree to the move. You can ask for directions first.', fa: 'با جابه‌جایی موافقت کن. می‌توانی اول مسیر را بپرسی.' },
	recall: { en: 'Ask about an extra charge from memory.', fa: 'از حافظه‌ات کمک بگیر و دربارهٔ هزینهٔ اضافه بپرس.' },
	complete: { en: 'You arranged a quieter room and checked the price.', fa: 'یک اتاق آرام‌تر گرفتی و قیمت را بررسی کردی.' }
};
