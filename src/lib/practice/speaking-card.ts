/**
 * "Speaking card", Module lab (docs/english-speaking-card-spec.md, owner-approved v2).
 * A topic card with four points, a minute to prepare, then one to two minutes of talk.
 * It works on long-turn skills (covering the points, organising, keeping going), never
 * grammar. The organising phrases are a fixed list written by us; the AI only picks a job.
 */
import type { DisplayText } from './hotel';
import { normalise, words } from './say-better';

export const PREP_SECONDS = 60, TALK_MAX_SECONDS = 120, TALK_MIN_SECONDS = 20, TALK_TARGET_SECONDS = 60;
/** An early Stop between these pauses the talk once and asks for more. */
export const PAUSE_FROM = 20, PAUSE_UNTIL = 50;
/** Less actual speech than this is never sent (silence doesn’t count as talking). Speech has gaps between words, so this stays low. */
export const MIN_VOICED_SECONDS = 5;
/** Quiet this long mid-talk shows "Stuck? Try the next point." */
export const STUCK_AFTER_SECONDS = 10;

export interface Card { id: number; title: DisplayText; points: DisplayText[]; past: boolean }
export const CARDS: Card[] = [
	{ id: 1, past: false, title: { en: 'Describe something you’re good at.', fa: 'چیزی را که در آن خوبی توصیف کن.' }, points: [
		{ en: 'what it is', fa: 'آن چیست' }, { en: 'how you learned it', fa: 'چطور یادش گرفتی' }, { en: 'how often you do it', fa: 'هر چند وقت یک بار انجامش می‌دهی' },
		{ en: 'and explain why it’s useful or important to you', fa: 'و توضیح بده چرا برایت مفید یا مهم است' }] },
	{ id: 2, past: false, title: { en: 'Describe a place in your city that you like.', fa: 'جایی در شهرت را که دوست داری توصیف کن.' }, points: [
		{ en: 'where it is', fa: 'کجاست' }, { en: 'what it looks like', fa: 'چه شکلی است' }, { en: 'what you do there', fa: 'آنجا چه کار می‌کنی' },
		{ en: 'and explain why you like it', fa: 'و توضیح بده چرا دوستش داری' }] },
	{ id: 3, past: false, title: { en: 'Describe a useful object you own.', fa: 'وسیلهٔ مفیدی را که داری توصیف کن.' }, points: [
		{ en: 'what it is', fa: 'آن چیست' }, { en: 'when you got it', fa: 'کی آن را گرفتی' }, { en: 'how you use it', fa: 'چطور از آن استفاده می‌کنی' },
		{ en: 'and explain why it’s useful to you', fa: 'و توضیح بده چرا برایت مفید است' }] },
	{ id: 4, past: false, title: { en: 'Describe a person you admire.', fa: 'کسی را که تحسینش می‌کنی توصیف کن.' }, points: [
		{ en: 'who the person is', fa: 'او کیست' }, { en: 'how you know them, or know about them', fa: 'چطور او را می‌شناسی یا درباره‌اش می‌دانی' }, { en: 'what they do', fa: 'چه کار می‌کند' },
		{ en: 'and explain why you admire them', fa: 'و توضیح بده چرا تحسینش می‌کنی' }] },
	{ id: 5, past: true, title: { en: 'Describe a trip that didn’t go as planned.', fa: 'سفری را توصیف کن که طبق برنامه پیش نرفت.' }, points: [
		{ en: 'where you went', fa: 'کجا رفتی' }, { en: 'what you’d planned to do', fa: 'چه برنامه‌ای داشتی' }, { en: 'what went wrong', fa: 'چه چیزی خراب شد' },
		{ en: 'and explain what you learned from it', fa: 'و توضیح بده چه چیزی از آن یاد گرفتی' }] },
	{ id: 6, past: false, title: { en: 'Describe a celebration you enjoy.', fa: 'جشنی را که دوست داری توصیف کن.' }, points: [
		{ en: 'what it is', fa: 'آن چیست' }, { en: 'when it happens', fa: 'کی برگزار می‌شود' }, { en: 'what people do', fa: 'مردم چه کار می‌کنند' },
		{ en: 'and explain why you enjoy it', fa: 'و توضیح بده چرا از آن لذت می‌بری' }] }
];
export const cardById = (id: number) => CARDS.find(c => c.id === id) ?? null;

export type Job = 'start' | 'move' | 'reason' | 'explain' | 'end';
export const JOBS: Job[] = ['start', 'move', 'reason', 'explain', 'end'];
export interface OrgPhrase { id: string; job: Job; text: string; pastOnly?: boolean; found: (said: string) => boolean }
/** Matchers run on a normalised transcript (lower case, no punctuation, "I'd" → "i would"). */
export const ORG_PHRASES: OrgPhrase[] = [
	{ id: 'like-to-talk', job: 'start', text: 'I’d like to talk about…', found: s => /\bi would like to (talk|tell you) about\b/.test(s) },
	{ id: 'going-to-tell', job: 'start', text: 'I’m going to tell you about…', found: s => /\bi am going to (tell you|talk) about\b/.test(s) },
	{ id: 'chosen', job: 'start', text: 'I’ve chosen…', found: s => /\bi have chosen\b/.test(s) },
	{ id: 'first-of-all', job: 'move', text: 'First of all,…', found: s => /\bfirst of all\b/.test(s) },
	{ id: 'after-that', job: 'move', text: 'After that,…', found: s => /\bafter that\b/.test(s) },
	{ id: 'another-thing', job: 'move', text: 'Another thing is…', found: s => /\banother thing (is|was)\b/.test(s) },
	{ id: 'as-for', job: 'move', text: 'As for…', found: s => /\bas for\b/.test(s) },
	{ id: 'next-thing', job: 'move', text: 'The next thing is…', found: s => /\bthe next thing (is|was)\b/.test(s) },
	{ id: 'thats-because', job: 'reason', text: 'That’s because…', found: s => /\b(that's|that is|it's|it is) because\b/.test(s) },
	{ id: 'main-reason', job: 'reason', text: 'The main reason is…', found: s => /\bthe main reason (is|was)\b/.test(s) },
	{ id: 'for-example', job: 'reason', text: 'For example,…', found: s => /\bfor (example|instance)\b/.test(s) },
	{ id: 'because-of-that', job: 'reason', text: 'Because of that,…', found: s => /\bbecause of (that|this)\b/.test(s) },
	{ id: 'thats-why', job: 'reason', text: 'That’s why…', found: s => /\b(that's|that is) why\b/.test(s) },
	{ id: 'like-most', job: 'explain', text: 'What I like most is…', found: s => /\bwhat i (like|love|enjoy) (most|the most|best)\b/.test(s) },
	{ id: 'important-because', job: 'explain', text: 'It’s important to me because…', found: s => /\b(it's|it is|that's|that is) important to me because\b/.test(s) },
	{ id: 'hardest-part', job: 'explain', text: 'The hardest part was…', pastOnly: true, found: s => /\bthe hardest part (was|is)\b/.test(s) },
	{ id: 'looking-back', job: 'explain', text: 'Looking back,…', pastOnly: true, found: s => /\blooking back\b/.test(s) },
	{ id: 'best-thing', job: 'explain', text: 'The best thing about it is…', found: s => /\bthe best thing about (it|this|that|her|him|them)\b/.test(s) },
	{ id: 'so-thats-why', job: 'end', text: 'So, that’s why…', found: s => /\bso (that's|that is) why\b/.test(s) },
	{ id: 'so-overall', job: 'end', text: 'So overall,…', found: s => /\b(so )?overall\b/.test(s) },
	{ id: 'thats-about-it', job: 'end', text: 'That’s about it, really.', found: s => /\b(that's|that is) (about )?it\b/.test(s) }
];
export const phraseById = (id: string) => ORG_PHRASES.find(p => p.id === id) ?? null;
export const JOB_WHY: Record<Job, DisplayText> = {
	start: { en: 'It tells your listener what you’ll talk about.', fa: 'به شنونده می‌گوید درباره‌ی چه حرف می‌زنی.' },
	move: { en: 'It shows you’re moving to the next point.', fa: 'نشان می‌دهد سراغ نکتهٔ بعدی می‌روی.' },
	reason: { en: 'It joins a point to its reason or example.', fa: 'هر نکته را به دلیل یا مثالش وصل می‌کند.' },
	explain: { en: 'It helps you explain why it matters to you.', fa: 'کمک می‌کند توضیح بدهی چرا برایت مهم است.' },
	end: { en: 'It gives your talk a clear ending.', fa: 'به صحبتت یک پایان روشن می‌دهد.' }
};

/** Which job the talk needs: a missing "explain" point always wins; otherwise the model's view. */
export const chooseJob = (covered: boolean[], suggested: Job): Job => (!covered[3] ? 'explain' : suggested);
/** A phrase for that job that the learner didn't already use (then the other jobs, in order). */
export function choosePhrase(job: Job, said: string, card: Card): OrgPhrase {
	const s = normalise(said);
	const fits = (p: OrgPhrase) => (!p.pastOnly || card.past) && !p.found(s);
	for (const j of [job, ...JOBS.filter(x => x !== job)]) {
		const p = ORG_PHRASES.find(x => x.job === j && fits(x));
		if (p) return p;
	}
	return ORG_PHRASES.find(p => p.job === job)!;
}

/** Content words: what a quote is about, without the small words. */
const SMALL = new Set(['the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'at', 'for', 'is', 'are', 'was', 'were', 'it', 'its', "it's", 'i', 'my', 'me', 'you', 'your', 'do', 'did', 'does', 'have', 'has', 'had', 'that', 'this', 'what', 'how', 'why', 'when', 'where', 'who', 'with', 'about', 'be', 'so', 'but', 'they', 'them', 'their', 'he', 'she', 'him', 'her', 'we', 'our', 'not', 'very', 'really', 'there', 'would', 'will', 'can', 'am']);
const FRAME_WORDS = ['say', 'talk', 'tell', 'describe', 'explain', 'want', 'going', 'should', 'point', 'card', 'topic'];
export const contentWords = (text: string) => words(text).filter(w => w.length > 1 && !SMALL.has(w));
/** Share of a quote's content words that come from the point's own wording (reading the card aloud isn't covering it). */
export function cardShare(quote: string, point: string): number {
	// Words like "say" and "talk" come from reading the card's frame ("You should say…"), not from a detail.
	const q = contentWords(quote), p = new Set([...contentWords(point), ...FRAME_WORDS]);
	return q.length ? q.filter(w => p.has(w)).length / q.length : 1;
}
export const inTalk = (talk: string, quote: string) => !!normalise(quote) && ` ${normalise(talk)} `.includes(` ${normalise(quote)} `);

export interface PointResult { covered: boolean; quote: string; unclear: string }
export interface Coverage { points: PointResult[]; onTopic: boolean; mostlyEnglish: boolean }
export interface CardFeedback { organisation: DisplayText | null; phrase: string; why: DisplayText }
export interface Talk { text: string; seconds: number; cutOff: boolean }

export type CardStep = 'card' | 'covered' | 'follow' | 'ready2' | 'result';
export interface CardRecord {
	card: number; step: CardStep;
	prepStartedAt: number | null; notes: string;
	talk1: Talk | null; coverage1: Coverage | null; feedback: CardFeedback | null;
	talk2: Talk | null;
	/** The second coverage call judges both talks again, so before and after compare like with like. */
	coverage2: { first: Coverage; second: Coverage } | null;
	/** Set while a talk is being recorded, so a reload can say the recording stopped. */
	talking?: boolean;
	done: boolean;
}
export const emptyCardRecord = (card = 1): CardRecord => ({ card, step: 'card', prepStartedAt: null, notes: '', talk1: null, coverage1: null, feedback: null, talk2: null, coverage2: null, done: false });
export function asCardRecord(value: unknown): CardRecord | null {
	const r = value as CardRecord | null;
	if (!r || typeof r !== 'object' || typeof r.done !== 'boolean' || !cardById(r.card)) return null;
	if (!['card', 'covered', 'follow', 'ready2', 'result'].includes(r.step) || typeof r.notes !== 'string') return null;
	for (const t of [r.talk1, r.talk2]) if (t !== null && (typeof t !== 'object' || typeof t.text !== 'string' || typeof t.seconds !== 'number')) return null;
	for (const c of [r.coverage1, r.coverage2?.first, r.coverage2?.second]) if (c && !Array.isArray(c.points)) return null;
	return r;
}
export const coveredCount = (c: Coverage | null | undefined) => c?.points.filter(p => p.covered).length ?? 0;
export const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
/** The length line for "before and after": a shorter second talk over a minute is never shown as a drop. */
export function lengthChange(first: number, second: number): { text: string; ok: boolean; over: boolean } {
	const over = second >= TALK_TARGET_SECONDS;
	return { text: `${clock(first)} → ${clock(second)}`, ok: over || (first < TALK_TARGET_SECONDS && second > first), over };
}
