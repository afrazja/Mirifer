/**
 * Interview 1, "Tell me about yourself", the listening modules: Listen and connect (Intermediate) and
 * Listen and retell (Professional). Elena, another candidate, arrives at Greenway Foods in Riverton,
 * chats with Mark, the hiring manager, and answers "Tell me about yourself" in three parts: now, before,
 * what she wants next. Content only.
 */
import type { ConnectSet, Line, Part, Speaker } from '../../listen-connect';
import type { RetellPiece } from '../../retell';
import type { Track } from '../../day';

/**
 * Listen and connect: at reception (small talk, she's a little nervous), then her answer. Two parts,
 * 2 Connect causes with 3 results and 4 choice questions: 6 points (2 after part 1, 4 after part 2).
 */
const SPEAKERS: Record<string, Speaker> = {
	mark: { name: 'Mark', voice: 'c' }, // Brian
	elena: { name: 'Elena', voice: 'd' } // Emma; Mira is Ava ('b')
};
const INTERVIEW: Line[] = [
	{ who: 'mark', text: "Hi, you must be Elena. I'm Mark, the hiring manager." },
	{ who: 'elena', text: 'Hi, Mark. Nice to meet you.' },
	{ who: 'mark', text: 'You too. Did you find us OK?' },
	{ who: 'elena', text: 'Yes, thanks. I came by bus, and it stops right outside.' },
	{ who: 'mark', text: 'Great. Can I get you some water?' },
	{ who: 'elena', text: "Yes, please. Sorry, I'm a little nervous." },
	{ who: 'mark', text: "That's OK, everybody is. Come with me." },
	{ who: 'mark', text: 'So, Elena, tell me about yourself.' },
	{ who: 'elena', text: 'Sure. Right now, I work as an event planner at the Park Hotel.' },
	{ who: 'elena', text: 'I plan meetings and parties, and I make sure everything is ready on time.' },
	{ who: 'elena', text: 'Before that, I worked in a busy restaurant for three years.' },
	{ who: 'elena', text: "So I'm good at working fast and staying calm." },
	{ who: 'elena', text: "And now I'm looking for a job with bigger projects and a bigger team." },
	{ who: 'mark', text: 'I see. And why Greenway Foods?' },
	{ who: 'elena', text: 'Hmm, good question. Well, I buy your soups every week!' },
	{ who: 'elena', text: 'And I like that you work with farms near Riverton.' },
	{ who: 'mark', text: "Good answer! OK, let's talk about the job." }
];
const PARTS: Part[] = [
	{ from: 0, to: 6, title: { en: 'At reception', fa: 'در پذیرش' } },
	{ from: 7, to: 16, title: { en: 'Tell me about yourself', fa: 'از خودتان بگویید' } }
];
/** The three parts of a good answer: now, before, next. */
const LINKS = ['right now', 'before that', "i'm looking for"];

export const CONNECT: Partial<Record<Track, ConnectSet>> = {
	intermediate: {
		speakers: SPEAKERS, conversation: INTERVIEW, parts: PARTS, linkPhrases: LINKS,
		connect: {
			causes: ['Elena is a little nervous.', 'Elena worked in a busy restaurant.'],
			results: ['She’s good at working fast.', 'Mark gives her more time.', 'Mark says it’s OK.'],
			answers: [2, 0],
			evidence: [6, 11]
		},
		choices: [
			{ kind: { en: 'Getting there', fa: 'چطور آمد' }, question: 'How did Elena get here?', options: ['By bus.', 'By car.', 'On foot.'], answer: 0, evidence: 3 },
			{ kind: { en: 'Her job now', fa: 'کار فعلی‌اش' }, question: 'What’s Elena’s job now?', options: ['She cooks in a restaurant.', 'She plans events at a hotel.', 'She works at Greenway Foods.'], answer: 1, evidence: 8 },
			{ kind: { en: 'What she wants', fa: 'چه می‌خواهد' }, question: 'What does Elena want next?', options: ['A job with shorter hours.', 'Bigger projects and a bigger team.', 'A job in a restaurant.'], answer: 1, evidence: 12 },
			{ kind: { en: 'Why this company', fa: 'چرا این شرکت' }, question: 'Why does Elena like Greenway Foods?', options: ['It’s near her home.', 'She buys its soups every week.', 'It has a nice office.'], answer: 1, evidence: 14 }
		],
		questions: [
			{ part: 0, kind: 'choice', index: 0 }, { part: 0, kind: 'connect', index: 0 },
			{ part: 1, kind: 'choice', index: 1 }, { part: 1, kind: 'connect', index: 1 }, { part: 1, kind: 'choice', index: 2 }, { part: 1, kind: 'choice', index: 3 }
		],
		miraLine: {
			en: 'Elena\'s answer had three parts: `Right now…` (her job today), `Before that…` (her last job), `I\'m looking for…` (what she wants next). Tap a line and listen for them again. Soon you\'ll use the same three parts for your own answer.',
			fa: 'جواب النا سه بخش داشت: `Right now…` (کار فعلی‌اش)، `Before that…` (کار قبلی‌اش)، `I\'m looking for…` (چیزی که حالا دنبالش است). روی یک خط بزن و دوباره به این‌ها گوش بده. به‌زودی با همین سه بخش جواب خودت را می‌سازی.'
		}
	}
};

/** Listen and retell (Professional): the same scene, told by Andrew at natural B1 speed. */
export const RETELL: RetellPiece = {
	id: 'interview-first-meeting',
	title: { en: 'Elena’s interview', fa: 'مصاحبهٔ النا' },
	level: 'B1',
	voice: 'a',
	task: { en: 'Now tell me how Elena’s interview started, and what she said about herself.', fa: 'حالا برایم تعریف کن مصاحبهٔ النا چطور شروع شد و او دربارهٔ خودش چه گفت.' },
	text: 'On Tuesday, Elena had a job interview at Greenway Foods, a food company in Riverton. She came by bus, and it stops right outside, so the office was easy to find. Mark, the hiring manager, met her at reception and offered her some water. She said yes, please, and told him she was a little nervous. “That’s OK,” Mark said. “Everybody is.” Then he asked her to tell him about herself. First, she talked about her job now: she works as an event planner at the Park Hotel, where she plans meetings and big parties. Before that, she worked in a busy restaurant for three years, so she’s good at working fast and staying calm. Now she’s looking for bigger projects and a bigger team. When Mark asked, “Why Greenway?”, she said she buys their soups every week, and she likes that they work with local farms.',
	keyPoints: [
		'Elena had a job interview at Greenway Foods, and Mark, the hiring manager, met her at reception ("a food company" or "the manager" counts; the bus and the water are extra).',
		'She said she was a little nervous, and Mark said that was OK, everybody is ("it’s normal" counts).',
		'Now she works as an event planner at the Park Hotel ("at a hotel" or "she plans events" counts).',
		'Before that, she worked in a busy restaurant for three years, so she’s good at working fast and staying calm (either one counts).',
		'She wants bigger projects and a bigger team, and she likes Greenway because she buys their soups or because they work with local farms (either reason counts).'
	]
};
