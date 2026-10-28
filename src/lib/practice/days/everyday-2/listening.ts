/**
 * Everyday 2, the listening modules: Listen and connect (Intermediate) and Listen and retell
 * (Professional). Source: docs/english-everyday-2/README.md (v2, english-coach and learning-UX
 * reviews applied). Content only.
 */
import type { ConnectSet, Line, Part, Speaker } from '../../listen-connect';
import type { RetellPiece } from '../../retell';
import type { Track } from '../../day';

/**
 * Listen and connect: Jake invites Sara to trivia night with a few neighbors; she can't on
 * Wednesday; then Jake calls to move pizza to Saturday. Two parts, 2 Connect causes with 3 results
 * and 4 choice questions: 6 points.
 */
const SPEAKERS: Record<string, Speaker> = {
	jake: { name: 'Jake', voice: 'a' }, // Andrew, as in Chapter 1
	sara: { name: 'Sara', voice: 'd' } // Emma
};
const PLANS: Line[] = [
	{ who: 'jake', text: 'Hey, Sara! Thanks for coming to the barbecue.' },
	{ who: 'sara', text: 'Hi, Jake! It was so much fun.' },
	{ who: 'jake', text: 'So, a few of us from the building do trivia at the Corner Café.' },
	{ who: 'sara', text: 'Trivia? Like a quiz?' },
	{ who: 'jake', text: 'Yeah! Fun questions, in teams.' },
	{ who: 'jake', text: 'We go on Wednesdays at seven. Do you want to come?' },
	{ who: 'sara', text: "Oh, I'd love to, but I can't on Wednesday. I have a yoga class." },
	{ who: 'jake', text: 'No problem! How about Thursday? A few of us are getting pizza at Tony’s.' },
	{ who: 'sara', text: 'Thursday works! What time?' },
	{ who: 'jake', text: 'Around seven?' },
	{ who: 'sara', text: 'Seven is perfect. See you then!' },
	{ who: 'jake', text: "Hi, Sara, it's Jake." },
	{ who: 'jake', text: "Listen, I'm really sorry. My sister's visiting on Thursday." },
	{ who: 'jake', text: "So we're moving pizza to Saturday. Same time, seven. Can you still come?" },
	{ who: 'sara', text: 'Oh, no worries! Saturday works for me.' },
	{ who: 'jake', text: "Great! Oh, and bring a jacket. We'll sit outside." },
	{ who: 'sara', text: 'Good idea. See you Saturday!' }
];
const PARTS: Part[] = [
	{ from: 0, to: 10, title: { en: 'In the hallway', fa: 'در راهرو' } },
	{ from: 11, to: 16, title: { en: 'Jake calls', fa: 'جیک زنگ می‌زند' } }
];
/** A kind no, another idea, it's OK. */
const LINKS = ["i'd love to, but", 'how about', 'no worries'];

export const CONNECT: Partial<Record<Track, ConnectSet>> = {
	intermediate: {
		speakers: SPEAKERS, conversation: PLANS, parts: PARTS, linkPhrases: LINKS,
		connect: {
			causes: ['Sara has a yoga class on Wednesday.', 'Sara says no, kindly and clearly.'],
			results: ['Jake suggests another day.', 'Jake is upset.', 'She says she can’t come.'],
			answers: [2, 0],
			evidence: [6, 7]
		},
		choices: [
			{ kind: { en: 'Where trivia is', fa: 'جای مسابقه' }, question: 'Where is trivia night?', options: ['At the Corner Café.', 'At Tony’s.', 'In the backyard.'], answer: 0, evidence: 2 },
			{ kind: { en: 'Why Jake calls', fa: 'چرا جیک زنگ می‌زند' }, question: 'Why does Jake call?', options: ['He has to work.', 'His sister is visiting.', 'He’s sick.'], answer: 1, evidence: 12 },
			{ kind: { en: 'The new plan', fa: 'برنامهٔ تازه' }, question: 'What’s the new day and time?', options: ['Thursday at seven.', 'Saturday at six.', 'Saturday at seven.'], answer: 2, evidence: 13 },
			{ kind: { en: 'What to bring', fa: 'چه چیزی بیاورد' }, question: 'What should Sara bring?', options: ['A pizza.', 'A jacket.', 'Her yoga mat.'], answer: 1, evidence: 15 }
		],
		questions: [
			{ part: 0, kind: 'choice', index: 0 }, { part: 0, kind: 'connect', index: 0 }, { part: 0, kind: 'connect', index: 1 },
			{ part: 1, kind: 'choice', index: 1 }, { part: 1, kind: 'choice', index: 2 }, { part: 1, kind: 'choice', index: 3 }
		],
		miraLine: {
			en: 'Sara and Jake used three small phrases: `I\'d love to, but…` (a kind no), `How about…?` (another idea), `no worries` (it\'s OK). Tap a line and listen for them again.',
			fa: 'سارا و جیک سه عبارت کوتاه به کار بردند: `I\'d love to, but…` (یک «نه»ی مهربان)، `How about…?` (یک پیشنهاد دیگر)، `no worries` (اشکالی ندارد). روی یک خط بزن و دوباره به این‌ها گوش بده.'
		}
	}
};

/** Listen and retell (Professional): the same story, told by Andrew at natural B1 speed. */
export const RETELL: RetellPiece = {
	id: 'the-new-plan',
	title: { en: 'The new plan', fa: 'برنامهٔ تازه' },
	level: 'B1',
	voice: 'a',
	task: { en: 'Now tell me what happened, in three or four sentences.', fa: 'حالا در سه یا چهار جمله برایم تعریف کن چه اتفاقی افتاد.' },
	text: 'On Monday evening, Sara ran into her neighbor Jake in the hallway. He thanked her for coming to the building barbecue. Then he invited her to trivia night, a quiz game that a few neighbors play at the Corner Café every Wednesday at seven. Sara said she’d love to, but she couldn’t on Wednesday, because she has a yoga class. So Jake suggested Thursday instead: a few of them were getting pizza at Tony’s, at seven. Sara said Thursday worked for her. But on Wednesday, Jake called. He was really sorry: his sister was visiting on Thursday, so they were moving pizza to Saturday, same time. “No worries!” Sara said. “Saturday works for me.” Jake told her to bring a jacket, because they’d be sitting outside.',
	keyPoints: [
		'Jake invited Sara to trivia night with a few neighbors, at the Corner Café on Wednesday at seven (a quiz, or "a café", counts).',
		'She said she’d love to, but she couldn’t on Wednesday because of her yoga class.',
		'Jake suggested pizza on Thursday at seven instead (Tony’s, "a pizza place" or "a restaurant" counts), and she said yes.',
		'On Wednesday, Jake called: his sister was visiting, so they moved pizza to Saturday, same time.',
		'Sara said no worries, and Jake told her to bring a jacket because they’d sit outside.'
	]
};
