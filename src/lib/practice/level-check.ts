/**
 * The level check in onboarding, for a learner who answers "I'm not sure" about their level
 * (docs/english-level-check-spec.md, reviewed by the english-coach and learning-UX reviewers).
 * About two minutes by voice: listen (two items), repeat (two sentences), talk (about 30 seconds).
 *
 * It decides one thing: whether the learner starts in the Professional version (`natural`) or not.
 * So it is strict only there, and when unsure the lower band wins. Nothing the learner says is kept:
 * only the three numbers below, in the browser while the check runs, and the band in their profile.
 */
import type { DisplayText } from './hotel';
import { normalise } from './say-better';

export type Band = 'hard' | 'simple' | 'natural';

export interface ListenItem {
	/** What Sara says in her voice message. */
	audio: string;
	/** Played at the natural rate (the harder item). */
	fast: boolean;
	question: DisplayText;
	options: DisplayText[];
	answer: number;
}
export const LISTEN_ITEMS: ListenItem[] = [
	{
		audio: 'Sorry, I can’t come tonight. How about Saturday?',
		fast: false,
		question: { en: 'What does your friend mean?', fa: 'منظور دوستت چیست؟' },
		options: [
			{ en: 'She can come tonight, and on Saturday too.', fa: 'امشب می‌آید، شنبه هم می‌آید.' },
			{ en: 'She wants to meet on Saturday, not tonight.', fa: 'امشب نمی‌تواند بیاید؛ می‌خواهد شنبه همدیگر را ببینید.' },
			{ en: 'She can’t come tonight or on Saturday.', fa: 'نه امشب می‌تواند بیاید، نه شنبه.' }
		],
		answer: 1
	},
	{
		audio: 'Sorry I’m late! I was gonna call you, but my phone died.',
		fast: true,
		question: { en: 'What happened?', fa: 'چه اتفاقی افتاد؟' },
		options: [
			{ en: 'She called you, but then her phone died.', fa: 'زنگ زد، ولی بعد شارژ گوشی‌اش تمام شد.' },
			{ en: 'She’s going to call you when her phone works.', fa: 'وقتی گوشی‌اش درست شد، زنگ می‌زند.' },
			{ en: 'She wanted to call you, but her phone stopped working.', fa: 'می‌خواست زنگ بزند، ولی شارژ گوشی‌اش تمام شد.' }
		],
		answer: 2
	}
];

/** Said once with no text on screen (one replay); the second is longer, with connected speech. */
export const REPEAT_SENTENCES = [
	'My sister works in a hotel near the station.',
	'If it’s still raining tonight, we’ll just stay in and order pizza.'
] as const;

export const TALK_PROMPT: DisplayText = {
	en: 'Last one. Tell me a bit about yourself: where you live, what you do most days, and what you did last weekend. You’ve got about thirty seconds.',
	fa: 'آخری. کمی از خودت بگو: کجا زندگی می‌کنی، بیشتر روزها چه کار می‌کنی، و آخر هفتهٔ پیش چه کار کردی. حدود سی ثانیه وقت داری.'
};
/** The English question as the AI sees it. */
export const TALK_QUESTION = 'Tell me about yourself: where you live, what you do most days, and what you did last weekend.';

/** Recording limits, in seconds. */
export const REPEAT_MAX_SECONDS = 12;
export const TALK_MAX_SECONDS = 35;
/** The talk's Done button comes after this. */
export const TALK_DONE_AFTER = 10;
/** A repeated sentence passes when this share of its words is said, in order. */
export const REPEAT_PASS = 0.75;

const words = (text: string) => normalise(text).split(' ').filter(Boolean);

/** One letter wrong is fine in a word of 5+ letters (accents, speech-recognition spelling). */
function sameWord(target: string, said: string): boolean {
	if (target === said) return true;
	if (target.length < 5 || Math.abs(target.length - said.length) > 1) return false;
	// Edit distance of at most 1.
	let i = 0, j = 0, edits = 0;
	while (i < target.length && j < said.length) {
		if (target[i] === said[j]) { i++; j++; continue; }
		if (++edits > 1) return false;
		if (target.length > said.length) i++;
		else if (target.length < said.length) j++;
		else { i++; j++; }
	}
	return edits + (target.length - i) + (said.length - j) <= 1;
}

/**
 * How much of the sentence they said, 0–1: the target words said in order (extra words, "um" and
 * self-corrections don't count against them) over the target's words.
 */
export function repeatScore(target: string, transcript: string): number {
	const a = words(target), b = words(transcript);
	if (!a.length) return 0;
	// Longest common subsequence, with near-matches allowed.
	const row = new Array<number>(b.length + 1).fill(0);
	for (let i = 1; i <= a.length; i++) {
		let diagonal = 0;
		for (let j = 1; j <= b.length; j++) {
			const above = row[j];
			row[j] = sameWord(a[i - 1], b[j - 1]) ? diagonal + 1 : Math.max(row[j], row[j - 1]);
			diagonal = above;
		}
	}
	return row[b.length] / a.length;
}

/**
 * Speech recognition can write something for silence ("Thank you.") or copy its own instructions:
 * those, and very short clips, are no answer.
 */
export function isNoAnswer(transcript: string, seconds: number): boolean {
	const text = normalise(transcript);
	if (seconds < 1.5 || !text) return true;
	if (/^(thank you|thanks|thanks for watching|bye|you)$/.test(text)) return true;
	return /persian speaker|word for word|grammar mistakes|everyday sentence/.test(text);
}

const PERSIAN = /[؀-ۿ]/g;
/** Whether most of the letters are in Persian script. */
export function mostlyPersian(text: string): boolean {
	const letters = text.match(/\p{L}/gu)?.length ?? 0;
	return letters > 0 && (text.match(PERSIAN)?.length ?? 0) / letters > 0.5;
}
/** English words (Latin letters) in a transcript. */
export const englishWords = (text: string) => words(text.replace(PERSIAN, ' ')).filter(word => /[a-z]/.test(word)).length;

/** The AI's reading of the talk, before the server's own rules. */
export interface TalkJudgement { english: boolean; memorised: boolean; band: Band }
/** The server's rules on top of the AI: it can only lower the band, never raise it past what the words show. */
export function talkBand(judgement: TalkJudgement | null, englishWordCount: number): Band {
	if (!judgement) return englishWordCount < 15 ? 'hard' : 'simple'; // AI down: never natural
	if (!judgement.english) return 'hard';
	let band = judgement.band;
	if (judgement.memorised && band === 'natural') band = 'simple';
	if (band === 'natural' && englishWordCount < 40) band = 'simple';
	if (band === 'hard' && englishWordCount >= 40) band = 'simple';
	return band;
}

/**
 * The result from the three tasks. `listen` and `repeat` are 0–2 each, null when that task didn't
 * happen; `talk` is null when it didn't. `mic` is false when the microphone was refused or failed
 * (so repeat and talk couldn't run). Only the talk can reach natural; the others confirm or lower.
 */
export function combine({ listen, repeat, talk, mic = true }: { listen: number | null; repeat: number | null; talk: Band | null; mic?: boolean }): Band {
	if (!mic) return listen === 2 ? 'simple' : 'hard';
	const points = (listen ?? 1) + (repeat ?? 1);
	if (talk === null) return points >= 4 ? 'simple' : points <= 1 ? 'hard' : 'simple';
	if (talk === 'natural') return points >= 3 ? 'natural' : 'simple';
	if (talk === 'simple') return points <= 1 ? 'hard' : 'simple';
	return points === 4 ? 'simple' : 'hard';
}

/** The one line the learner sees, then "It's just a starting point." No levels, no scores. */
export const RESULT_LINES: Record<Band, DisplayText> = {
	hard: { en: 'Thanks! We’ll start with short, everyday sentences and build up step by step.', fa: 'ممنون! با جمله‌های کوتاه و روزمره شروع می‌کنیم و قدم‌به‌قدم جلو می‌رویم.' },
	simple: { en: 'You can already manage simple conversations, so now we’ll work on saying more.', fa: 'از پس گفت‌وگوهای ساده برمی‌آیی، پس حالا روی بیشتر حرف زدن کار می‌کنیم.' },
	natural: { en: 'You can already say a lot in English, so we’ll work on making it sound more natural.', fa: 'همین حالا هم به انگلیسی خیلی چیزها را می‌توانی بگویی، پس روی طبیعی‌تر حرف زدن کار می‌کنیم.' }
};
