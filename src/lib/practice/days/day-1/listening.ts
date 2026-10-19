/**
 * Day 1, the listening module: Listen and connect, in two versions.
 * Both hear the one built conversation (Sara at the baggage desk, `CONVERSATION` in
 * listen-connect.ts); each has its own questions. The source text is in
 * docs/english-day-1/listening.md. Content only: the module that shows it is built once.
 */
import { CONVERSATION, DAY_ONE_SET, LINK_PHRASES, SPEAKERS } from '../../listen-connect';
import type { ConnectSet } from '../../listen-connect';
import type { Track } from '../../day';

export const CONNECT: Partial<Record<Track, ConnectSet>> = {
	/** Intermediate (A2): fact questions about the missing bag (docs/english-day-1/listening.md §2). */
	intermediate: {
		speakers: SPEAKERS, conversation: CONVERSATION, linkPhrases: LINK_PHRASES,
		parts: [
			{ from: 0, to: 3, title: { en: 'The missing bag', fa: 'بارِ گمشده' } },
			{ from: 4, to: 6, title: { en: 'Where it went, when it comes', fa: 'کجا رفته، کِی می‌رسد' } },
			{ from: 7, to: 10, title: { en: 'The medicine and the charger', fa: 'دارو و شارژر' } }
		],
		connect: {
			causes: ['The tag had the wrong flight number.', 'Her medicine is in the backpack.', 'Her phone charger is in the backpack.'],
			results: ['She can borrow one at the information desk.', 'The backpack went to Frankfurt.', 'Her gray suitcase is fine.', 'She buys some at the pharmacy.'],
			answers: [1, 3, 0],
			evidence: [4, 8, 10]
		},
		choices: [
			{ kind: { en: 'What it looks like', fa: 'چه شکلی است' }, question: 'What does the missing bag look like?', options: ['A small green backpack.', 'A big gray suitcase.', 'A small gray backpack.'], answer: 0, evidence: 3 },
			{ kind: { en: 'When', fa: 'کِی' }, question: 'When will the backpack get to her hotel?', options: ['Tonight, on the evening flight.', 'Tomorrow morning, between nine and eleven.', 'Tomorrow morning, between eight and ten.'], answer: 2, evidence: 6 },
			{ kind: { en: "What's in it", fa: 'داخلش چیست' }, question: 'What else is in the backpack?', options: ['Her phone.', 'Her phone charger.', 'Her passport.'], answer: 1, evidence: 9 }
		],
		questions: [
			{ part: 0, kind: 'choice', index: 0 },
			{ part: 1, kind: 'connect', index: 0 }, { part: 1, kind: 'choice', index: 1 },
			{ part: 2, kind: 'connect', index: 1 }, { part: 2, kind: 'choice', index: 2 }, { part: 2, kind: 'connect', index: 2 }
		],
		miraLine: {
			en: 'The agent used three small phrases: `in that case` (then do this), `as long as` (only if), `instead` (not that, this). Tap a line and listen for them again.',
			fa: 'کارمند فرودگاه سه عبارت کوتاه به کار برد: `in that case` (در این صورت)، `as long as` (به شرطی که)، `instead` (به‌جایش). روی یک خط بزن و دوباره به این‌ها گوش بده.'
		}
	},
	/** Professional (B1+): the built set, unchanged. */
	professional: DAY_ONE_SET
};
