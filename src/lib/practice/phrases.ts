/**
 * "Natural phrases" (docs/english-shadowing-spec.md, owner-approved v2; the link to the
 * story module is left out for now, by the owner's choice). Five fixed sentences that
 * together tell a short travel story; each carries one B1 chunk and one sound to notice.
 * Written and reviewed by us, never by AI.
 */
import type { DisplayText } from './hotel';
import { normalise } from './say-better';

export const MAX_CLIP_SECONDS = 10;
/** Tries that count for one sentence; the learner may stop sooner. */
export const MAX_TRIES = 2;

export interface Phrase {
	/** What Mira says (plain text, also what the check looks for). */
	sentence: string;
	/**
	 * The sentence as shown: **bold** marks the chunk, ‿ marks a link between words.
	 * Removing the marks gives `sentence` back.
	 */
	shown: string;
	/** The chunk as a learner would name it. */
	chunk: string;
	situation: DisplayText;
	/** One sound to notice. Text in `backticks` is English and is kept left-to-right. */
	tip: DisplayText;
	/** Finds the chunk in a normalised transcript (lower case, contractions spelled out, no punctuation). */
	found: (said: string) => boolean;
}

export const PHRASES: Phrase[] = [
	{
		sentence: "My bag was supposed to arrive with me, but it didn't.",
		shown: "My bag **was supposed to** arrive with me, but it didn't.",
		chunk: 'was supposed to',
		situation: { en: 'At the airport, your bag isn’t there.', fa: 'در فرودگاه، چمدانت نیامده.' },
		tip: { en: '`supposed to` has no “d” sound: `su-POST-ta`.', fa: 'در `supposed to` صدای `d` گفته نمی‌شود؛ این‌طور بگو: `su-POST-ta` (آخرش کوتاه، مثل «تِ»).' },
		found: said => /\b(was|were|is|are|am|it's|that's|he's|she's)( not)?( \w+)? suppose(d)? to\b/.test(said)
	},
	{
		sentence: "It turned out they'd put it on the wrong flight.",
		shown: "**It turned‿out** they'd put it on the wrong flight.",
		chunk: 'it turned out',
		situation: { en: 'The airline calls you back.', fa: 'شرکت هواپیمایی دوباره به تو زنگ می‌زند.' },
		tip: { en: '`turned out`: the d moves to “out”, `turn-DOUT`. Not `turn-ed`.', fa: '`turned out` را پیوسته بگو: `d` به `out` می‌چسبد، یعنی `turn-DOUT`. `-ed` را جدا «اِد» نخوان.' },
		found: said => /\b(turned|turns) out\b(?! the lights?\b)/.test(said) && !/\b(was|were)( it)? turned out\b/.test(said)
	},
	{
		sentence: 'To make things worse, my phone was almost dead.',
		shown: '**To make things worse,** my phone was almost dead.',
		chunk: 'to make things worse',
		situation: { en: 'Then a second problem.', fa: 'بعد هم یک مشکل دیگر.' },
		tip: { en: 'Stress `WORSE`, let your voice go up a little, then pause.', fa: 'روی `WORSE` تأکید کن، صدایت را کمی بالا ببر و بعد مکث کن.' },
		found: said => /\bto make (things|it|matters|everything|the situation) (even )?worse\b/.test(said)
	},
	{
		sentence: 'So I ended up buying some clothes at the airport.',
		shown: 'So I **ended‿up buying** some clothes at the airport.',
		chunk: 'ended up buying',
		situation: { en: 'You needed clothes for the next day.', fa: 'برای روز بعد لباس لازم داشتی.' },
		tip: { en: '`ended up`: say it as one, `en-di-DUP`. The next verb ends in `-ing`.', fa: '`ended up` را یک‌نفس بگو: `en-di-DUP`. فعل بعدش با `-ing` می‌آید.' },
		found: said => /\b(end|ends|ended|ending) up (?!to\b)(\w+ing|in|at|with|on)\b/.test(said)
	},
	{
		sentence: 'In the end, it arrived two days later.',
		shown: '**In the end,** it arrived two days later.',
		chunk: 'in the end',
		situation: { en: 'How it finished.', fa: 'و آخرش…' },
		tip: { en: 'Say `in the end` as one group; stress `END`.', fa: '`in the end` را یک‌نفس بگو و روی `END` تأکید کن.' },
		found: said => /\bin the end\b(?! of\b)/.test(said)
	}
];

/** Did the transcript of a try contain the sentence's chunk? Only the chunk is checked, never the accent. */
export const caught = (phrase: Phrase, transcript: string) => phrase.found(normalise(transcript));

/** Splits a shown sentence into plain and bold parts; `tie` marks a link (‿) between two words. */
export function shownParts(shown: string): { text: string; bold: boolean; tie: boolean }[] {
	return shown.split('**').flatMap((text, index) => text.split(/(‿)/).map(piece => ({ text: piece, bold: index % 2 === 1, tie: piece === '‿' })))
		.filter(part => part.text);
}

/** Splits a tip into plain text and English parts (in backticks). */
export function tipParts(tip: string): { text: string; english: boolean }[] {
	return tip.split('`').map((text, index) => ({ text, english: index % 2 === 1 })).filter(part => part.text);
}

export interface PhraseTry { tries: number; caught: boolean | null }
/** What the module keeps in this browser for the day (reload, Back). Recordings and transcripts are never kept. */
export interface PhraseRecord { index: number; items: PhraseTry[]; done: boolean }

export const emptyPhraseRecord = (): PhraseRecord => ({ index: 0, items: PHRASES.map(() => ({ tries: 0, caught: null })), done: false });

/** Checks a saved record before using it (it comes back from browser storage). */
export function asPhraseRecord(value: unknown): PhraseRecord | null {
	const r = value as PhraseRecord | null;
	if (!r || typeof r !== 'object' || typeof r.done !== 'boolean' || !Number.isInteger(r.index) || r.index < 0 || r.index >= PHRASES.length) return null;
	if (!Array.isArray(r.items) || r.items.length !== PHRASES.length) return null;
	if (!r.items.every(item => item && Number.isInteger(item.tries) && item.tries >= 0 && (item.caught === null || typeof item.caught === 'boolean'))) return null;
	return r;
}
