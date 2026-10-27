/**
 * Everyday 1, the listening modules: Listen and connect (Intermediate) and Listen and retell
 * (Professional). Written from one world (docs/english-everyday-1/world.md) and reviewed; the source
 * text is docs/english-everyday-1/listening.md (draft v2, reviews applied). Content only.
 */
import type { ConnectSet, Line, Part, Speaker } from '../../listen-connect';
import type { RetellPiece } from '../../retell';
import type { Track } from '../../day';

/**
 * Listen and connect: Sara meets Jake at 48 Elm Street on a Saturday morning (listening.md §1).
 * Two parts (at the door, upstairs), 2 Connect causes with 3 results and 4 choice questions: 6 points.
 * Intermediate only; the Professional version hears the meeting as a narration (RETELL).
 */
const MEETING_SPEAKERS: Record<string, Speaker> = {
	jake: { name: 'Jake', voice: 'a' }, // Andrew; never Mira (Ava)
	sara: { name: 'Sara', voice: 'd' } // Emma, as in the Travel chapters
};
const MEETING: Line[] = [
	{ who: 'jake', text: 'Here, let me help you with that.' },
	{ who: 'sara', text: "Oh, no, it's fine!" },
	{ who: 'jake', text: "Oh, OK, no problem! Come on, Biscuit, let's go up." },
	{ who: 'sara', text: "Whoa! It's falling!" },
	{ who: 'sara', text: "Actually… yes, please. That'd be great!" },
	{ who: 'jake', text: "Ha! Sure. Here, I've got it." },
	{ who: 'sara', text: "Thanks! I'm Sara. I just moved in." },
	{ who: 'jake', text: "Nice to meet you, Sara. I'm Jake, in 4B." },
	{ who: 'jake', text: "Shh! That's Biscuit. He's friendly, just loud." },
	{ who: 'sara', text: 'Hi, Biscuit!' },
	{ who: 'sara', text: 'So, how long have you lived here?' },
	{ who: 'jake', text: "Six years. You'll love it here." },
	{ who: 'jake', text: 'Here we are, fourth floor!' },
	{ who: 'jake', text: 'Just so you know, trash goes out Tuesday morning, by eight.' },
	{ who: 'jake', text: 'The truck comes really early.' },
	{ who: 'sara', text: 'Tuesday by eight. Got it, thanks!' },
	{ who: 'jake', text: 'Nice plant!' },
	{ who: 'sara', text: 'Thanks! I love it too.' },
	{ who: 'jake', text: "Hey, the building's having a barbecue in the backyard." },
	{ who: 'sara', text: 'Oh, fun! When is it?' },
	{ who: 'jake', text: 'A week from today, Saturday at four.' },
	{ who: 'jake', text: 'Do you want to come?' },
	{ who: 'sara', text: "I'd love to! Thanks, Jake." },
	{ who: 'jake', text: 'Great! See you around, Sara!' }
];
const MEETING_PARTS: Part[] = [
	{ from: 0, to: 11, title: { en: 'At the door', fa: 'دم در' } },
	{ from: 12, to: 23, title: { en: 'Upstairs', fa: 'طبقهٔ بالا' } }
];
/** Small social phrases, not logical links: changing your mind, useful information, a friendly goodbye. */
const MEETING_LINKS = ['actually', 'just so you know', 'see you around'];

export const CONNECT: Partial<Record<Track, ConnectSet>> = {
	intermediate: {
		speakers: MEETING_SPEAKERS, conversation: MEETING, parts: MEETING_PARTS, linkPhrases: MEETING_LINKS,
		connect: {
			causes: ['Sara says, "It\'s fine!"', 'The box starts to fall.'],
			results: ['Sara says yes to his help.', 'Jake says the dog is friendly.', 'Jake believes her and goes upstairs.'],
			answers: [2, 0],
			evidence: [2, 4]
		},
		choices: [
			{ kind: { en: 'The dog\'s name', fa: 'اسم سگ' }, question: "What's the dog's name?", options: ['Max.', 'Biscuit.', 'Buddy.'], answer: 1, evidence: 8 },
			{ kind: { en: 'Trash day', fa: 'روز زباله' }, question: 'When does the trash go out?', options: ['Tuesday by eight.', 'Thursday by eight.', 'Monday by ten.'], answer: 0, evidence: 13 },
			{ kind: { en: 'Taking a compliment', fa: 'جواب دادن به تعریف' }, question: 'Jake says, "Nice plant!" What does Sara say?', options: ["She says it's nothing.", 'She offers it to Jake.', 'She says thank you.'], answer: 2, evidence: 17 },
			{ kind: { en: 'The barbecue', fa: 'باربیکیو' }, question: 'When is the barbecue?', options: ['Today at four.', 'Next Saturday at four.', 'Tomorrow at two.'], answer: 1, evidence: 20 }
		],
		questions: [
			{ part: 0, kind: 'choice', index: 0 }, { part: 0, kind: 'connect', index: 0 }, { part: 0, kind: 'connect', index: 1 },
			{ part: 1, kind: 'choice', index: 1 }, { part: 1, kind: 'choice', index: 2 }, { part: 1, kind: 'choice', index: 3 }
		],
		miraLine: {
			en: 'Sara and Jake used three small phrases: `actually` (I\'ve changed my mind), `just so you know` (here\'s something useful), `see you around` (a friendly goodbye). Tap a line and listen for them again.',
			fa: 'سارا و جیک سه عبارت کوتاه به کار بردند: `actually` (راستش، نظرم عوض شد)، `just so you know` (محض اطلاعت)، `see you around` (می‌بینمت؛ یک خداحافظی دوستانه). روی یک خط بزن و دوباره به این‌ها گوش بده.'
		}
	}
};

/**
 * Listen and retell (Professional): the same meeting, told by Andrew at natural B1 speed
 * (listening.md §2). v1 is one voice; the two-voice version waits for `speakers` and `lines` on
 * RetellPiece. 126 words, no picture yet.
 */
export const RETELL: RetellPiece = {
	id: 'the-last-box',
	title: { en: 'The last box', fa: 'آخرین جعبه' },
	level: 'B1',
	voice: 'a',
	task: { en: 'Now tell me what happened, in three or four sentences.', fa: 'حالا در سه یا چهار جمله برایم تعریف کن چه اتفاقی افتاد.' },
	text: 'On Saturday morning, Sara was carrying the last box into her new building. It was full of books, and it was heavy. At the door, she met her neighbor, Jake, and his dog, Biscuit. Jake offered to help, but Sara said, “Oh, no, it’s fine!” So Jake took her at her word and started up the stairs. Then the box started to fall. “Actually… yes, please!” Sara said, and Jake carried it up for her. Biscuit barked all the way. “Shh! Sorry, that’s Biscuit,” Jake said. “He’s friendly, just loud.” Upstairs, he told her that trash goes out on Tuesday morning, by eight. Then he invited her to the building barbecue in the backyard, a week from today at four. Sara said she’d love to come.',
	keyPoints: [
		'Sara was carrying a heavy box into her new building when her neighbor, Jake, offered to help.',
		'She said it was fine, so Jake took her at her word and started up the stairs.',
		'When the box started to fall, she changed her mind and said yes, and Jake carried it up for her.',
		'Upstairs, Jake told her that trash goes out on Tuesday morning, by eight.',
		'He invited her to the building barbecue in the backyard, a week from today at four, and she said she\'d love to come.'
	]
};
