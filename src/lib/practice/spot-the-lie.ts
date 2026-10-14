/**
 * "Spot the lie", Module lab (owner-approved in chat): a listening game. A person talks for about
 * half a minute (no text); then Mira reads three statements, audio only. Two are true, usually in
 * different words; one is false, usually reusing the talk's own words with one thing changed. The
 * learner taps the lie. Each talk has one kind of trap. Checked in code, no AI.
 */
import type { DisplayText } from './hotel';

/** The talk plays once, plus one replay. Statements can be replayed freely. */
export const MAX_TALK_PLAYS = 2;
/** Mira reads the statements. */
export const STATEMENT_VOICE = 'b' as const;
export const LETTERS = ['A', 'B', 'C'] as const;

export type Trap = 'used-to' | 'detail' | 'person' | 'negative' | 'maybe';
export const TRAP_LABEL: Record<Trap, DisplayText> = {
	'used-to': { en: 'then (“used to”) or now', fa: 'قبلاً («used to») یا الان' },
	detail: { en: 'a changed detail', fa: 'جزئیات عوض‌شده' },
	person: { en: 'the wrong person', fa: 'آدم اشتباه' },
	negative: { en: 'a flipped “not”', fa: 'مثبت یا منفی («not»)' },
	maybe: { en: 'maybe or for sure', fa: 'شاید یا حتماً' }
};

export interface Talk {
	speaker: string;
	/** The speaker's name in Persian letters, for Persian sentences. */
	speakerFa: string;
	/** The voice that reads the talk (never Mira's). */
	voice: 'a' | 'c' | 'd';
	sentences: string[];
	statements: [string, string, string];
	/** Which statement is the lie. */
	lie: number;
	/** The sentence of the talk that shows it's a lie. */
	proof: number;
	trap: Trap;
	why: DisplayText;
}

export const TALKS: Talk[] = [
	{
		speaker: 'Sara', speakerFa: 'سارا', voice: 'd', trap: 'used-to', lie: 1, proof: 0,
		sentences: [
			'I used to work in a bank, but last year I started teaching English.',
			'I teach in the mornings, and in the afternoons I’m studying for a master’s degree.',
			'Most of my students are adults who need English for work.',
			'It’s harder than my old job, but I enjoy it much more.'
		],
		statements: ['Most of her students need English for their jobs.', 'She still works in a bank.', 'She studies in the afternoons.'],
		why: { en: '“used to” means it was true before, but not now. Sara doesn’t work in a bank anymore.', fa: '«used to» یعنی قبلاً این‌طور بود، ولی الان نیست. سارا دیگر در بانک کار نمی‌کند.' }
	},
	{
		speaker: 'Tom', speakerFa: 'تام', voice: 'a', trap: 'detail', lie: 2, proof: 0,
		sentences: [
			'I usually get up at six thirty, because my train leaves at seven fifteen.',
			'It takes me about forty minutes to get to work.',
			'On Fridays I work from home, so I can sleep a little longer.',
			'I’d love to live closer to the office one day.'
		],
		statements: ['Tom doesn’t go to the office on Fridays.', 'His trip to work is about forty minutes.', 'His train leaves at six thirty.'],
		why: { en: 'The lie used a real time from the talk, but for the wrong thing. Tom gets up at 6:30, and his train leaves at 7:15.', fa: 'جملهٔ دروغ یک ساعتِ واقعی از صحبت را آورد، ولی برای کار دیگری: تام ساعت ۶:۳۰ بیدار می‌شود و قطارش ساعت ۷:۱۵ حرکت می‌کند.' }
	},
	{
		speaker: 'Mike', speakerFa: 'مایک', voice: 'c', trap: 'person', lie: 0, proof: 2,
		sentences: [
			'My sister and I are very different.',
			'She loves cooking, but I can’t even make an omelet.',
			'My brother is the sporty one in our family: he goes running every morning.',
			'I prefer reading, especially on rainy weekends.'
		],
		statements: ['His sister goes running every morning.', 'His sister loves to cook.', 'When it rains on the weekend, he likes to read.'],
		why: { en: 'The lie took a real detail but gave it to the wrong person: it’s Mike’s brother who goes running every morning, not his sister.', fa: 'جملهٔ دروغ یک نکتهٔ درست را به آدمِ اشتباهی نسبت داد: برادرِ مایک است که هر روز صبح می‌دود، نه خواهرش.' }
	},
	{
		speaker: 'Nina', speakerFa: 'نینا', voice: 'd', trap: 'negative', lie: 0, proof: 1,
		sentences: [
			'I moved to Toronto two years ago.',
			'I love the city, but I don’t like the winters at all: they’re long and very cold.',
			'In summer, I go to the lake with friends almost every weekend.',
			'The snow is still hard for me.'
		],
		statements: ['Nina likes the winters in Toronto.', 'She has lived in Toronto for two years.', 'She often spends summer weekends at the lake.'],
		why: { en: 'The lie dropped one small word. Nina said she doesn’t like the winters. Listen for “don’t” and “not”.', fa: 'جملهٔ دروغ یک کلمهٔ کوچک را جا انداخت. نینا گفت زمستان‌ها را دوست ندارد. به «don’t» و «not» دقت کن.' }
	},
	{
		speaker: 'David', speakerFa: 'دیوید', voice: 'a', trap: 'maybe', lie: 1, proof: 0,
		sentences: [
			'My company might open an office in Dubai next year.',
			'If it does, I’d like to work there for a year or two.',
			'My wife is excited about the idea, but our kids aren’t so sure.',
			'We’ll decide when we know more.'
		],
		statements: ['David’s wife likes the idea.', 'His company will open an office in Dubai next year.', 'They’ll decide when they know more.'],
		why: { en: '“might” means maybe, not for sure. The lie said the company will open an office, but David only said it might.', fa: '«might» یعنی شاید، نه حتماً. جملهٔ دروغ می‌گفت شرکت حتماً دفتر باز می‌کند («will»)، ولی دیوید فقط گفت شاید («might»).' }
	}
];

export const talkText = (talk: Talk) => talk.sentences.join(' ');
/** What Mira reads for one statement ("Statement A: …", so the letter is never heard as the word "a"). */
export const statementLine = (talk: Talk, i: number) => `Statement ${LETTERS[i]}: ${talk.statements[i]}`;

export type Step = 'listen' | 'choose' | 'reveal';
export interface LieRecord {
	index: number;
	step: Step;
	/** Talk plays used, per talk. */
	plays: number[];
	/** Which statements they've heard, per talk. */
	heard: boolean[][];
	picks: (number | null)[];
	done: boolean;
}
export const emptyLie = (): LieRecord => ({ index: 0, step: 'listen', plays: TALKS.map(() => 0), heard: TALKS.map(() => [false, false, false]), picks: TALKS.map(() => null), done: false });
export function asLie(value: unknown): LieRecord | null {
	const r = value as LieRecord | null;
	const n = TALKS.length;
	if (!r || typeof r !== 'object' || typeof r.done !== 'boolean' || !Number.isInteger(r.index) || r.index < 0 || r.index > n) return null;
	if (!['listen', 'choose', 'reveal'].includes(r.step)) return null;
	if (!Array.isArray(r.plays) || r.plays.length !== n || !r.plays.every(p => Number.isInteger(p) && p >= 0 && p <= MAX_TALK_PLAYS)) return null;
	if (!Array.isArray(r.heard) || r.heard.length !== n || !r.heard.every(h => Array.isArray(h) && h.length === 3 && h.every(b => typeof b === 'boolean'))) return null;
	if (!Array.isArray(r.picks) || r.picks.length !== n || !r.picks.every(p => p === null || (Number.isInteger(p) && p >= 0 && p < 3))) return null;
	return r;
}

export interface LieSummary { right: number; traps: { trap: Trap; caught: boolean; talk: number }[] }
export function summarize(record: LieRecord): LieSummary {
	const traps = TALKS.map((talk, i) => ({ trap: talk.trap, caught: record.picks[i] === talk.lie, talk: i }));
	return { right: traps.filter(t => t.caught).length, traps };
}
