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
interface Choice { id: string; text: string; aliases: string[]; next: Stage; reply: string; }
export const STAGES: Stage[] = ['problem', 'room', 'offer', 'alternative', 'confirm', 'recall'];
const initial = 'Good evening. Welcome to Willow Hotel. How can I help you?';
export function startHotel(variant: Variant = 'lift'): HotelState {
	return { stage: 'problem', variant, turns: [{ speaker: 'reception', text: initial }], trail: [], corrections: [] };
}
const change = ['could i have a quieter room', 'can i have a quieter room', 'could you move me to a quieter room', 'i would like a quieter room', 'i need a quieter room', 'i want a quieter room', 'can i change rooms', 'could i change rooms', 'could you change my room'];
const price = ['is there an extra charge', 'does it cost extra', 'will it cost extra', 'how much does it cost', 'is it free', 'do i have to pay extra', 'is there any extra charge', 'is there an additional charge'];
function choice(id: string, text: string, aliases: string[], next: Stage, reply: string): Choice {
	return { id, text, aliases: [text, ...aliases], next, reply };
}
export function hotelChoices(state: Pick<HotelState, 'stage' | 'variant'>): Choice[] {
	switch (state.stage) {
		case 'problem': return [
			choice('noise', 'My room is too noisy.', ['my room is noisy', 'it is too noisy in my room', 'there is too much noise', 'i cannot sleep because of the noise', 'i could not sleep because of the noise', 'i did not sleep because of the noise', 'i could not sleep because of the music downstairs', 'the music is too loud', 'i cannot sleep', 'it is too loud', 'my room is very noisy'], 'room', 'I’m sorry about that. What is your room number?'),
			choice('change', 'Could I have a quieter room, please?', change, 'room', 'Of course. Let me check your booking. What is your room number?')
		];
		case 'room': return [choice('room204', 'I’m in room 204.', ['204', 'room 204', 'my room number is 204', 'my room is 204', 'it is 204', 'i am in 204', 'two hundred and four', 'two oh four'], 'offer', state.variant === 'lift'
			? 'Thank you. I can offer room 310. It is next to the lift. Would that work for you?'
			: 'Thank you. I can offer room 318. It faces the busy main street. Would that work for you?')];
		case 'offer': return [
			choice('quieter', 'Could I have a quieter room, please?', [...change, 'no thank you i need a quieter room', 'that sounds noisy', 'no that is too noisy', 'i would prefer a room away from the lift', 'could i have a room away from the lift', 'i would prefer a room away from the street', 'could i have a room away from the street', 'do you have a room away from the lift', 'do you have a room away from the street'], 'alternative', 'Let me check again. Room 512 faces the courtyard and is away from the lift. It should be quieter. What would you like to know before we arrange the move?'),
			choice('location', 'Is it quiet?', ['is the room quiet', 'where is it', 'where is the room', 'is it near the lift', 'is it near the street'], 'offer', state.variant === 'lift'
				? 'Room 310 is beside the lift, so you may hear people coming and going. You can ask me for a quieter option.'
				: 'Room 318 faces the main street, so you may hear traffic. You can ask me for a quieter option.')
		];
		case 'alternative': return [
			choice('price', 'Is there an extra charge?', price, 'confirm', 'There is no extra charge. Shall I arrange the move to room 512?'),
			choice('courtyard', 'What does it face?', ['is it quiet', 'where is the room', 'where is it', 'is it away from the lift'], 'alternative', 'It faces the quiet courtyard and is away from the lift. Before you agree, you can ask about the price.')
		];
		case 'confirm': return [
			choice('accept', 'Yes, that would be great. Thank you.', ['yes', 'yes please', 'yes thank you', 'that would be great', 'that sounds good', 'i will take it', 'i would like room 512', 'room 512 please', 'yes room 512 please'], 'recall', 'All arranged. Here is your key to room 512, on the fifth floor. I hope you sleep well.'),
			choice('directions', 'How do I get there?', ['where is room 512', 'which floor is it on', 'what floor is it on'], 'confirm', 'Take the lift to the fifth floor and turn left. Shall I arrange the move?'),
			choice('decline', 'No, thank you.', ['no', 'i am not sure', 'not yet'], 'alternative', 'No problem. Room 512 is still available. Let’s check what you need to know before deciding.')
		];
		case 'recall': return [choice('recall-price', 'Does it cost extra?', price, 'complete', 'You asked about an extra charge. Keep that question ready for your next trip.')];
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
const knownCorrections = [
	{ from: 'my room too noisy', to: 'My room is too noisy.', note: { en: 'Use “is” between “my room” and “too noisy”.', fa: 'بین «my room» و «too noisy» از «is» استفاده کن.' } },
	{ from: 'i did not slept because of the noise', to: 'I did not sleep because of the noise.', note: { en: 'After “did not”, use the base verb “sleep”.', fa: 'بعد از «did not» از شکل سادهٔ فعل، «sleep»، استفاده کن.' } },
	{ from: 'how much it costs', to: 'How much does it cost?', note: { en: 'For this question, use “does” before “it” and the base verb “cost”.', fa: 'در این سؤال، «does» را قبل از «it» بیاور و از شکل سادهٔ فعل، «cost»، استفاده کن.' } },
	{ from: 'is there a extra charge', to: 'Is there an extra charge?', note: { en: 'Use “an” before the vowel sound at the start of “extra”.', fa: 'قبل از صدای مصوت ابتدای «extra» از «an» استفاده کن.' } }
] as const;
export interface HotelReply { state: HotelState; understood: boolean; feedback: DisplayText | null; }
/** Applies only a choice authored for the current stage. Used after server-side AI classification. */
export function applyHotelChoice(state: HotelState, id: string, input: string, correction?: { improved: string; note: DisplayText } | null): HotelReply {
	if (!input.trim() || input.length > 300) return { state, understood: false, feedback: null };
	const matched = hotelChoices(state).find(option => option.id === id);
	if (!matched) return { state, understood: false, feedback: null };
	const turns: Turn[] = [...state.turns, { speaker: 'learner', text: input.trim() }, { speaker: state.stage === 'recall' ? 'coach' : 'reception', text: matched.reply }];
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
	const matched = hotelChoices(state).find(option => option.aliases.some(alias => normalizeReply(alias) === normalizeReply(correction?.to ?? input)));
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
	offer: { en: 'Check the location, then ask for a quieter option.', fa: 'موقعیت اتاق را بررسی کن، بعد یک گزینهٔ آرام‌تر بخواه.' },
	alternative: { en: 'Check whether room 512 costs extra.', fa: 'بپرس آیا اتاق ۵۱۲ هزینهٔ اضافه دارد.' },
	confirm: { en: 'Agree to the move. You can ask for directions first.', fa: 'با جابه‌جایی موافقت کن. می‌توانی اول مسیر را بپرسی.' },
	recall: { en: 'Ask about an extra charge from memory.', fa: 'از حافظه‌ات کمک بگیر و دربارهٔ هزینهٔ اضافه بپرس.' },
	complete: { en: 'You arranged a quieter room and checked the price.', fa: 'یک اتاق آرام‌تر گرفتی و قیمت را بررسی کردی.' }
};
