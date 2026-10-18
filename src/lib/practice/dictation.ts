/**
 * "Dictation sprint", Module lab (owner-approved in chat): ten short real-life lines, audio only.
 * Each asks for one detail (a time, a price, a phone number, a spelled name…); the learner types
 * just that detail. One play, plus a second that's marked. Checked in code by fixed rules, no AI.
 */
import type { DisplayText } from './hotel';

/** The voice: one natural US voice (Brian). */
export const VOICE = 'c';
export const MAX_PLAYS = 2;

export type DetailKind = 'time' | 'number' | 'price' | 'quantity' | 'date' | 'address' | 'code' | 'phone' | 'spelling' | 'email';
export interface DictationItem {
	kind: DetailKind;
	/** What the voice says (written out, so it's read the way people say it). */
	line: string;
	/** The question on screen. */
	ask: DisplayText;
	/** A hint for the format, in the answer box. */
	placeholder: string;
	/** The right answer, as shown after answering. */
	answer: string;
	/** Every way of writing it that counts (compared after `normalise`). */
	accept: string[];
	inputMode: 'text' | 'decimal' | 'numeric' | 'tel' | 'email';
	tip: DisplayText;
}

export const ITEMS: DictationItem[] = [
	{
		kind: 'time', line: 'Your table is booked for a quarter to eight.',
		ask: { en: 'What time is the table booked for?', fa: 'میز برای چه ساعتی رزرو شده؟' }, placeholder: 'e.g. 9:30',
		answer: '7:45', accept: ['7:45', '19:45', 'quarter to eight', 'seven forty-five', '7:45 pm'], inputMode: 'decimal',
		tip: { en: '“A quarter to eight” means 15 minutes before eight: 7:45. “A quarter past eight” is 8:15.', fa: '«A quarter to eight» یعنی ۱۵ دقیقه به هشت: ۷:۴۵. «A quarter past eight» یعنی ۸:۱۵.' }
	},
	{
		kind: 'number', line: 'The train to Boston leaves from platform fifteen.',
		ask: { en: 'Which platform?', fa: 'کدام سکو؟' }, placeholder: 'e.g. 3',
		answer: '15', accept: ['15', 'fifteen'], inputMode: 'numeric',
		tip: { en: '“fifTEEN” is strong at the end, with a long “een”. “FIFty” is strong at the start. Listen for where the word is strong.', fa: '«fifTEEN» آخرش قوی است و «ین» کشیده دارد. «FIFty» اولش قوی است. گوش بده کجای کلمه قوی است.' }
	},
	{
		kind: 'price', line: 'That’s four ninety-nine, please.',
		ask: { en: 'How much is it, in dollars?', fa: 'چند دلار است؟' }, placeholder: 'e.g. 2.50',
		answer: '$4.99', accept: ['4.99', '4,99'], inputMode: 'decimal',
		tip: { en: 'Prices are often said as two numbers: “four ninety-nine” is $4.99, not 499.', fa: 'قیمت‌ها را معمولاً دو تکه می‌گویند: «four ninety-nine» یعنی ۴٫۹۹ دلار، نه ۴۹۹.' }
	},
	{
		kind: 'quantity', line: 'Can you pick up a dozen eggs on your way home?',
		ask: { en: 'How many eggs?', fa: 'چند تا تخم‌مرغ؟' }, placeholder: 'a number',
		answer: '12', accept: ['12', 'twelve', 'a dozen', 'dozen'], inputMode: 'numeric',
		tip: { en: '“A dozen” is twelve. “Half a dozen” is six.', fa: '«A dozen» یعنی دوازده تا. «Half a dozen» یعنی شش تا.' }
	},
	{
		kind: 'date', line: 'Your English course starts on May third.',
		ask: { en: 'When does the course start?', fa: 'دوره کی شروع می‌شود؟' }, placeholder: 'e.g. 12 June',
		answer: '3 May', accept: ['3 may', 'may 3', 'third may', 'may third', '3/5', '5/3', '03/05', '05/03'], inputMode: 'text',
		tip: { en: 'Americans say “May third”; British people say “the third of May”. Both mean 3 May.', fa: 'آمریکایی‌ها می‌گویند «May third» و بریتانیایی‌ها «the third of May». هر دو یعنی ۳ مه.' }
	},
	{
		kind: 'address', line: 'We’re at twenty-two B, Park Street.',
		ask: { en: 'What’s the house number?', fa: 'پلاک خانه چند است؟' }, placeholder: 'e.g. 9A',
		answer: '22B', accept: ['22b', 'twenty-two b'], inputMode: 'text',
		tip: { en: 'A letter after a house number is said on its own: “twenty-two B” is 22B.', fa: 'حرفی که بعد از پلاک می‌آید جدا گفته می‌شود: «twenty-two B» یعنی 22B.' }
	},
	{
		kind: 'code', line: 'Your flight number is B V four one two.',
		ask: { en: 'What’s the flight number?', fa: 'شمارهٔ پرواز چیست؟' }, placeholder: 'letters and numbers',
		answer: 'BV412', accept: ['bv412'], inputMode: 'text',
		tip: { en: 'B and V sound close. For B the lips close and open: “bee”. For V the top teeth touch the lip: “vee”.', fa: 'B و V شبیه هم‌اند. برای B لب‌ها بسته و باز می‌شوند: «بی». برای V دندان‌های بالا روی لب پایین می‌آیند: «وی».' }
	},
	{
		kind: 'phone', line: 'My number is six one seven, five five five, oh one four four.',
		ask: { en: 'What’s the phone number?', fa: 'شمارهٔ تلفن چیست؟' }, placeholder: 'digits',
		answer: '617 555 0144', accept: ['6175550144'], inputMode: 'tel',
		tip: { en: 'In phone numbers, zero is often said “oh”, like the letter O.', fa: 'در شماره تلفن، صفر را معمولاً «اُ» می‌گویند، مثل حرف O.' }
	},
	{
		kind: 'spelling', line: 'My last name is Rezai. That’s R, E, Z, A, I.',
		ask: { en: 'How is the last name spelled?', fa: 'نام خانوادگی چطور نوشته می‌شود؟' }, placeholder: 'letters',
		answer: 'REZAI', accept: ['rezai'], inputMode: 'text',
		tip: { en: 'English letter names: E is “ee”, I is “eye”, A is “ay”. Persian speakers often mix up E and I.', fa: 'اسم حرف‌ها در انگلیسی: E «ای»، I «آی» و A «اِی» است. فارسی‌زبان‌ها اغلب E و I را قاطی می‌کنند.' }
	},
	{
		kind: 'email', line: 'Send it to sara dot k at gmail dot com.',
		ask: { en: 'What’s the email address?', fa: 'آدرس ایمیل چیست؟' }, placeholder: 'name@example.com',
		answer: 'sara.k@gmail.com', accept: ['sara.k@gmail.com'], inputMode: 'email',
		tip: { en: 'In email addresses, “dot” is . and “at” is @. “Underscore” is _ and “dash” is -.', fa: 'در ایمیل، «dot» یعنی . و «at» یعنی @. «underscore» یعنی _ و «dash» یعنی -.' }
	}
];

/** Persian and Arabic digits become 0–9, so a Persian keypad still works. */
const latinDigits = (text: string) => text.replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x6f0)).replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x660));

/** One way of writing each answer, so different spellings of the same thing compare equal. */
export function normalise(text: string, kind: DetailKind): string {
	let t = latinDigits(text).toLowerCase().replace(/[’‘]/g, "'").trim().replace(/\.$/, '');
	switch (kind) {
		case 'time': return t.replace(/\b(a\.?m\.?|p\.?m\.?|o'clock|tonight)\b/g, '').replace(/^a /, '').replace(/[.]/g, ':').replace(/[\s-]+/g, '');
		case 'price': return t.replace(/[$£€]|dollars?/g, '').replace(/\s+/g, '');
		case 'date': return t.replace(/(\d)(st|nd|rd|th)\b/g, '$1').split(/[\s,-]+/).filter(w => w && !['the', 'of', 'on'].includes(w)).join(' ').replace(/\s*\/\s*/g, '/').replace(/\./g, '/');
		case 'phone': return t.replace(/o/g, '0').replace(/\D/g, '');
		case 'spelling': return t.replace(/[^a-z]/g, '');
		case 'email': return t.replace(/\s+/g, '');
		default: return t.replace(/[\s-]+/g, '');
	}
}
export const isRight = (text: string, item: DictationItem) => {
	const answer = normalise(text, item.kind);
	return !!answer && item.accept.some(a => normalise(a, item.kind) === answer);
};

export interface DictationAnswer { text: string; correct: boolean; plays: number; seconds: number }
export interface DictationRecord { index: number; plays: number[]; answers: (DictationAnswer | null)[]; done: boolean }
export const emptyDictation = (): DictationRecord => ({ index: 0, plays: ITEMS.map(() => 0), answers: ITEMS.map(() => null), done: false });
export function asDictation(value: unknown): DictationRecord | null {
	const r = value as DictationRecord | null;
	if (!r || typeof r !== 'object' || !Number.isInteger(r.index) || r.index < 0 || r.index > ITEMS.length || typeof r.done !== 'boolean') return null;
	if (!Array.isArray(r.plays) || r.plays.length !== ITEMS.length || !r.plays.every(p => Number.isInteger(p) && p >= 0 && p <= MAX_PLAYS)) return null;
	if (!Array.isArray(r.answers) || r.answers.length !== ITEMS.length) return null;
	if (!r.answers.every(a => a === null || (typeof a === 'object' && typeof a.text === 'string' && typeof a.correct === 'boolean'))) return null;
	return r;
}

export interface DictationSummary { right: number; firstListen: number; averageSeconds: number | null; missed: number[] }
export function summarize(record: DictationRecord): DictationSummary {
	const done = record.answers.map((a, i) => ({ a, i })).filter((x): x is { a: DictationAnswer; i: number } => x.a !== null);
	const right = done.filter(x => x.a.correct).length;
	const firstListen = done.filter(x => x.a.correct && x.a.plays <= 1).length;
	const times = done.map(x => x.a.seconds).filter(s => Number.isFinite(s) && s >= 0);
	const averageSeconds = times.length ? Math.round(times.reduce((sum, s) => sum + s, 0) / times.length) : null;
	return { right, firstListen, averageSeconds, missed: done.filter(x => !x.a.correct).map(x => x.i) };
}
