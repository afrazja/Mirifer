/**
 * Day 4, the listening modules: Listen and connect (Intermediate) and Listen and retell (Professional).
 * Written from one world (docs/english-day-4/world.md) and reviewed; the source text is in
 * docs/english-day-4/listening.md. Content only: the modules that show it are built once.
 */
import type { ConnectSet, Line, Part, Speaker } from '../../listen-connect';
import type { RetellPiece } from '../../retell';
import type { Track } from '../../day';

/**
 * Listen and connect: Sara asks Daniel at the Park Hotel front desk the way to the Sunday market
 * in Central Park (docs/english-day-4/listening.md §1). Daniel gives the normal way and forgets the
 * Fun Run. Intermediate only; the Professional version has no Listen and connect today, so the
 * Module lab falls back to this set.
 */
const WAY_SPEAKERS: Record<string, Speaker> = {
	daniel: { name: 'Daniel', voice: 'c' }, // Brian; never Mira (Ava)
	sara: { name: 'Sara', voice: 'd' } // Emma, as on Days 1–3
};
const ASK_THE_WAY: Line[] = [
	{ who: 'sara', text: 'Hi, Daniel. How do I get to the Sunday market in Central Park?' },
	{ who: 'daniel', text: "It's about fifteen minutes on foot. Or I can call you a taxi." },
	{ who: 'sara', text: "I'll walk. It's a beautiful day." },
	{ who: 'daniel', text: 'OK. Turn right out of the hotel and walk along Main Street, past the post office.' },
	{ who: 'daniel', text: 'Keep going until you get to the second traffic light, at the bank. Turn left there, onto Oak Street.' },
	{ who: 'daniel', text: "Once you're on Oak Street, it's two blocks. The main gate's on your right." },
	{ who: 'daniel', text: "It's across from the City Museum. The market's just inside, around the fountain." },
	{ who: 'sara', text: "Thanks! I won't have a map on my phone, so let me say it back." },
	{ who: 'sara', text: "So I turn right out of the hotel, left at the second light, and the gate's on my left?" },
	{ who: 'daniel', text: "Almost. Actually, it's on your right, across from the museum." },
	{ who: 'sara', text: "On my right. Got it! I'm meeting a friend there at noon." },
	{ who: 'daniel', text: "Nice. There's live music by the fountain at noon. Enjoy!" }
];
const ASK_THE_WAY_PARTS: Part[] = [
	{ from: 0, to: 2, title: { en: 'Walk or taxi', fa: 'پیاده یا تاکسی' } },
	{ from: 3, to: 6, title: { en: 'The way', fa: 'مسیر' } },
	{ from: 7, to: 11, title: { en: 'Saying it back', fa: 'چک کردن مسیر' } }
];
const ASK_THE_WAY_LINKS = ['until', 'once', 'actually'];

export const CONNECT: Partial<Record<Track, ConnectSet>> = {
	intermediate: {
		speakers: WAY_SPEAKERS, conversation: ASK_THE_WAY, parts: ASK_THE_WAY_PARTS, linkPhrases: ASK_THE_WAY_LINKS,
		connect: {
			causes: ["It's a beautiful day.", "Sara won't have a map on her phone.", 'Sara puts the gate on the wrong side.'],
			results: ['Sara checks the way with Daniel.', 'Daniel tells her about the music.', 'Sara decides to walk.', 'Daniel corrects one detail.'],
			answers: [2, 0, 3],
			evidence: [2, 7, 9]
		},
		choices: [
			{ kind: { en: 'How long', fa: 'چقدر طول می‌کشد' }, question: 'How long is the walk to the market?', options: ['About five minutes.', 'About fifteen minutes.', 'About fifty minutes.'], answer: 1, evidence: 1 },
			{ kind: { en: 'Where to turn', fa: 'کجا می‌پیچد' }, question: 'Where does Sara turn left?', options: ['At the post office.', 'At the first traffic light.', 'At the second traffic light.'], answer: 2, evidence: 4 },
			{ kind: { en: 'The market', fa: 'جای بازار' }, question: "Where's the Sunday market?", options: ['Around the fountain.', 'Next to the bank.', 'Inside the City Museum.'], answer: 0, evidence: 6 }
		],
		questions: [
			{ part: 0, kind: 'choice', index: 0 }, { part: 0, kind: 'connect', index: 0 },
			{ part: 1, kind: 'choice', index: 1 }, { part: 1, kind: 'choice', index: 2 },
			{ part: 2, kind: 'connect', index: 1 }, { part: 2, kind: 'connect', index: 2 }
		],
		miraLine: {
			en: 'Daniel used three small words: `until` (up to that point), `once` (as soon as), `actually` (to correct something). Tap a line and listen for them again.',
			fa: 'دنیل سه کلمهٔ کوتاه به کار برد: `until` (تا)، `once` (همین که)، `actually` (در واقع؛ برای اصلاح یک اشتباه). روی یک خط بزن و دوباره به این‌ها گوش بده.'
		}
	}
};

/**
 * Listen and retell (Professional): Sara finds Oak Street closed for the Fun Run and asks Greg at the
 * bus stop for the way around (docs/english-day-4/listening.md §2). B1, 189 words. No picture yet.
 * Andrew narrates (Greg's voice). The learner tells a friend the way, so the key points are directions.
 */
export const RETELL: RetellPiece = {
	id: 'the-way-around',
	title: { en: 'The way around', fa: 'یک راه دیگر' },
	level: 'B1',
	voice: 'a',
	task: { en: 'Now tell a friend the way, from the corner of Main and Oak.', fa: 'حالا راه را از سر خیابان Main و Oak برای یک دوست تعریف کن.' },
	text: 'At about a quarter to eleven, Sara got to the corner of Main and Oak, and stopped. There were police barriers across Oak Street, and hundreds of runners were going past. Daniel hadn’t said anything about a race! Her phone had no data, so she couldn’t check a map. A man was waiting at the bus stop, so she asked him. His name was Greg, and his bus was late because of the Fun Run. “Oak’s closed till one,” he said, and then the directions came so fast that she only caught the word “library.” She smiled and asked him to slow down. “Sorry!” he said. “Don’t turn here. Keep going straight on Main Street to the next traffic light. That’s Pine Street. Turn left there, and you’ll go past the library, on your left. After about five minutes, you’ll see the park’s side gate on your left, too. Inside, follow the signs to the fountain. It’s about three minutes, and the market’s around it.” Sara said the way back to him, and he nodded. “Perfect. And try the coffee stall with the blue umbrella. Best coffee in Riverton!”',
	keyPoints: [
		"Oak Street is closed for the Fun Run, so don't turn onto it.",
		'Keep going straight on Main Street to the next traffic light, at Pine Street.',
		'Turn left onto Pine Street.',
		'Go past the library, which is on your left.',
		"After about five minutes, the park's side gate is on your left, too.",
		'Inside the park, follow the signs to the fountain; the market is around it.'
	]
};
