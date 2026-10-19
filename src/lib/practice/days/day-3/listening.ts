/**
 * Day 3, the listening modules: Listen and connect (Intermediate) and Listen and retell (Professional).
 * Written from one world (docs/english-day-3/world.md) and reviewed; the source text is in
 * docs/english-day-3/listening.md. Content only: the modules that show it are built once.
 */
import type { ConnectSet, Line, Part, Speaker } from '../../listen-connect';
import type { RetellPiece } from '../../retell';
import type { Track } from '../../day';

/**
 * Listen and connect: Sara checks in with Daniel at the Park Hotel front desk
 * (docs/english-day-3/listening.md §1). Intermediate only; the Professional version has no
 * Listen and connect today, so the Module lab falls back to this set.
 */
const CHECK_IN_SPEAKERS: Record<string, Speaker> = {
	daniel: { name: 'Daniel', voice: 'c' }, // Brian; never Mira (Ava)
	sara: { name: 'Sara', voice: 'd' } // Emma, as on Days 1–2
};
const CHECK_IN: Line[] = [
	{ who: 'daniel', text: 'Hi, welcome back! You left your suitcase with me, right?' },
	{ who: 'sara', text: "Yes, that's me. I have a booking under Demir." },
	{ who: 'daniel', text: 'Sorry, how do you spell that?' },
	{ who: 'sara', text: 'D-E-M-I-R. Sara Demir.' },
	{ who: 'daniel', text: 'Here it is, three nights. Can I see your passport and a credit card, please?' },
	{ who: 'daniel', text: "Thanks. Here are your key cards. You're in room 714, on the seventh floor." },
	{ who: 'sara', text: 'Great. Is the Wi-Fi free?' },
	{ who: 'daniel', text: 'Yes. The network is ParkHotel-Guest, and the password is mainstreet210.' },
	{ who: 'daniel', text: "It's also on your key-card holder. That way, you don't have to remember it." },
	{ who: 'sara', text: 'And is breakfast included?' },
	{ who: 'daniel', text: "Yes. Tomorrow it's from seven to ten-thirty, in The Corner Café." },
	{ who: 'sara', text: "Oh, by the way, my phone's dead, and my charger's in my backpack." },
	{ who: 'daniel', text: 'No problem. You can borrow one of our chargers.' },
	{ who: 'sara', text: "Thanks! The airline's bringing my backpack tomorrow morning. Could you keep it for me?" },
	{ who: 'daniel', text: "Sure. I'll call your room as soon as it gets here." }
];
const CHECK_IN_PARTS: Part[] = [
	{ from: 0, to: 4, title: { en: 'The booking', fa: 'رزرو' } },
	{ from: 5, to: 10, title: { en: 'Room, Wi-Fi, breakfast', fa: 'اتاق، وای‌فای، صبحانه' } },
	{ from: 11, to: 14, title: { en: 'The phone and the backpack', fa: 'گوشی و کوله‌پشتی' } }
];
const CHECK_IN_LINKS = ['that way', 'by the way', 'as soon as'];

export const CONNECT: Partial<Record<Track, ConnectSet>> = {
	intermediate: {
		speakers: CHECK_IN_SPEAKERS, conversation: CHECK_IN, parts: CHECK_IN_PARTS, linkPhrases: CHECK_IN_LINKS,
		connect: {
			causes: ["Daniel isn't sure how to spell Demir.", "Sara's phone is dead.", 'The backpack arrives at the hotel.'],
			results: ["Daniel calls to say it's here.", 'Sara spells her last name.', 'Daniel gives her the key cards.', 'Daniel lends her a charger.'],
			answers: [1, 3, 0],
			evidence: [3, 12, 14]
		},
		choices: [
			{ kind: { en: 'Room number', fa: 'شمارهٔ اتاق' }, question: "What's Sara's room number?", options: ['Room 740.', 'Room 714.', 'Room 417.'], answer: 1, evidence: 5 },
			{ kind: { en: 'Wi-Fi password', fa: 'رمز وای‌فای' }, question: "What's the Wi-Fi password?", options: ['mainstreet210', 'ParkHotel-Guest', 'mainstreet120'], answer: 0, evidence: 7 },
			{ kind: { en: 'What time', fa: 'چه ساعتی' }, question: 'When is breakfast tomorrow?', options: ['From six-thirty to ten.', 'From seven to eleven.', 'From seven to ten-thirty.'], answer: 2, evidence: 10 }
		],
		questions: [
			{ part: 0, kind: 'connect', index: 0 },
			{ part: 1, kind: 'choice', index: 0 }, { part: 1, kind: 'choice', index: 1 }, { part: 1, kind: 'choice', index: 2 },
			{ part: 2, kind: 'connect', index: 1 }, { part: 2, kind: 'connect', index: 2 }
		],
		miraLine: {
			en: 'Daniel and Sara used three small phrases: `that way` (so that), `by the way` (a new topic), `as soon as` (right when). Tap a line and listen for them again.',
			fa: 'دنیل و سارا سه عبارت کوتاه به کار بردند: `that way` (این‌طوری)، `by the way` (راستی)، `as soon as` (به محض اینکه). روی یک خط بزن و دوباره به این‌ها گوش بده.'
		}
	}
};

/**
 * Listen and retell (Professional): Daniel's favorite check-in story (docs/english-day-3/listening.md §2).
 * B1, 187 words. No picture yet. Andrew narrates (not Daniel's voice).
 */
export const RETELL: RetellPiece = {
	id: 'wrong-park-hotel',
	title: { en: 'The wrong Park Hotel', fa: 'هتل پارکِ اشتباهی' },
	level: 'B1',
	voice: 'a',
	text: 'Daniel has worked at the front desk of the Park Hotel since it opened last year, and his favorite story is from its very first week. It was almost midnight when a tired man walked in with a big suitcase. He said he had a booking under the name Walker. Daniel couldn’t find it, so he asked the man to spell it. Then Daniel tried every spelling he could think of. Nothing. The man was getting upset, so he showed Daniel the email. It turned out that his booking was at the Parkside Hotel, near the airport, twenty miles away. He had forgotten the full name, so in the taxi he asked for “the Park Hotel,” and the driver brought him downtown. It was too late to go back, but luckily, there was one room left. So he ended up staying, and Daniel called the Parkside to cancel his booking for him. The man liked the hotel so much that he has stayed there on every trip to Riverton ever since. And when he checks in, he always says, “Walker. And yes, I’m sure it’s this one.”',
	keyPoints: [
		'In the hotel’s first week, late at night, a tired man said he had a booking under the name Walker, but Daniel couldn’t find it.',
		'Daniel tried every spelling he could think of, and the upset man showed him his booking email.',
		'The booking was at the Parkside Hotel, near the airport, twenty miles away.',
		'He had forgotten the full name, so he asked the taxi driver for “the Park Hotel” and ended up downtown.',
		'It was too late to go back, so he took the last room, and Daniel canceled the other booking for him.',
		'He has stayed at the Park Hotel on every trip since, and jokes that he’s sure it’s the right one.'
	]
};
