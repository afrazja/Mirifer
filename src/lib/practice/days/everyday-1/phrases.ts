/**
 * Everyday 1, "Meeting a neighbor": Natural phrases, Persian-speaker traps, Say it in English and the
 * Professional voice message. Written from one world (docs/english-everyday-1/world.md) and reviewed;
 * the source text is docs/english-everyday-1/phrases-and-traps.md and conversation.md §4 (drafts v2,
 * reviews applied). Content only. `{name}` in a model answer is the learner's first name, put in
 * when it is shown or read (see WITHOUT_NAME for the line without it).
 */
import type { Phrase } from '../../phrases';
import type { Trap } from '../../traps';
import type { SayItem } from '../../say-in-english';
import type { VoiceMessage } from '../../voice-messages';
import type { DisplayText } from '../../hotel';
import type { Track } from '../../day';

/** Mira's taarof note, one text wherever it appears in full (Traps item 4; the role-play's details screen). */
export const TAAROF_NOTE: DisplayText = {
	en: 'In Persian, we often say no first and wait for a second offer. In English, people usually believe the first "no". So if you\'d like help, say yes the first time. Both ways are polite. The rules are just different.',
	fa: 'در فارسی معمولاً اول «نه» می‌گوییم و منتظر تعارف دوم می‌مانیم. در انگلیسی معمولاً همان «نه»ی اول را باور می‌کنند. پس اگر کمک می‌خواهی، همان بار اول بگو بله. هر دو روش مؤدبانه است؛ فقط قاعده‌ها فرق دارد.'
};

/** "That'd be great" and friends (A2 #3 and B1 #2), on the say-better normalise ("that'd" is "that would"). */
const THAT_WOULD_BE = /\bthat would be (?:great|nice|wonderful|lovely|amazing|awesome|perfect|really (?:great|nice|helpful)|so (?:great|nice|helpful)|helpful)\b/;

/**
 * Natural phrases. A2: say who you are → ask about him → say yes to help → ask him to repeat → go.
 * B1: say where you live → say yes to help → answer the invitation → step around the rent → go.
 * "3C" is never checked.
 */
export const PHRASES: Record<Track, Phrase[]> = {
	intermediate: [
		{
			sentence: "Hi, I just moved in. I'm in 3C.",
			shown: "Hi, **I just moved‿in**. I'm in 3C.",
			chunk: 'i just moved in',
			situation: { en: 'You meet Jake on the stairs.', fa: 'جیک را در راه‌پله می‌بینی.' },
			tip: { en: '`moved in`: link the words and stress `IN`: `moov-DIN`.', fa: '`moved in` را پیوسته بگو و روی `IN` تأکید کن: `moov-DIN`.' },
			found: said => /\bmov(?:ed|ing) in(?:to)?\b/.test(said)
		},
		{
			sentence: 'How long have you lived here?',
			shown: '**How long have you lived** here?',
			chunk: 'how long have you lived',
			situation: { en: 'You want to keep the chat going.', fa: 'می‌خواهی گفت‌وگو را ادامه بدهی.' },
			tip: { en: '`lived` is one beat: `livd`, not `liv-ed`.', fa: '`lived` یک‌بخشی است: `livd`. `-ed` را جدا «اِد» نخوان.' },
			found: said => /\bhow long (?:have|has) (?:you|he|she|they) (?:lived|been living|been)\b/.test(said)
		},
		{
			sentence: "Yes, please, that'd be great!",
			shown: "Yes, please, **that'd be great**!",
			chunk: "that'd be great",
			situation: { en: 'Jake offers to help with your heavy box.', fa: 'جیک پیشنهاد می‌کند در بردن جعبهٔ سنگینت کمکت کند.' },
			tip: { en: '`that\'d` is short: `THAD-ud`. Then stress `GREAT`.', fa: '`that\'d` کوتاه است: `THAD-ud`. بعد روی `GREAT` تأکید کن.' },
			found: said => THAT_WOULD_BE.test(said)
		},
		{
			sentence: 'Sorry, can you say that again?',
			shown: 'Sorry, **can you say that‿again**?',
			chunk: 'can you say that again',
			situation: { en: 'Jake says something fast, and you don\'t catch it.', fa: 'جیک چیزی را تند می‌گوید و متوجه نمی‌شوی.' },
			tip: { en: '`that again` runs together: `tha-duh-GEN`.', fa: '`that again` را پیوسته بگو: `t` نرم می‌شود و به `again` می‌چسبد، یعنی `tha-duh-GEN`.' },
			found: said => /\bsay (?:that|it) (?:again|one more time)\b/.test(said)
		},
		{
			sentence: 'Well, I should go. See you around!',
			shown: 'Well, **I should go**. See you around!',
			chunk: 'i should go',
			situation: { en: 'It\'s time to go, nicely.', fa: 'وقت رفتن است و می‌خواهی مؤدبانه خداحافظی کنی.' },
			tip: { en: '`should`: the `l` is silent. Say `shud`.', fa: 'در `should` حرف `l` خوانده نمی‌شود. بگو `shud`.' },
			found: said => /\bi (?:should|had better|would better|better) (?:go|get going|head (?:out|off|up|upstairs))\b/.test(said)
		}
	],
	professional: [
		{
			sentence: 'I just moved in downstairs, in 3C.',
			shown: 'I just **moved‿in downstairs**, in 3C.',
			chunk: 'moved in downstairs',
			situation: { en: 'You meet Jake on the stairs. He lives one floor up.', fa: 'جیک را در راه‌پله می‌بینی. او یک طبقه بالاتر زندگی می‌کند.' },
			tip: { en: '`downstairs`: stress the second part, `down-STAIRS`.', fa: 'در `downstairs` تأکید روی بخش دوم است: `down-STAIRS`.' },
			found: said => /\bmov(?:ed|ing) in (?:down ?stairs|below|right below)\b/.test(said)
		},
		{
			// The taarof point is in this tip (no separate `note` in v1).
			sentence: "Are you sure? That'd be great, thanks!",
			shown: "Are you sure? **That'd be great**, thanks!",
			chunk: "that'd be great",
			situation: { en: 'Jake offers to carry your box.', fa: 'جیک پیشنهاد می‌کند جعبه‌ات را برایت بالا ببرد.' },
			tip: {
				en: 'In English, people usually believe a first "no", so if you\'d like help, say yes. Your voice goes up on `Are you sure?` and down on `That\'d be great`.',
				fa: 'در انگلیسی معمولاً همان «نه»ی اول را باور می‌کنند؛ پس اگر کمک می‌خواهی، بله بگو. در `Are you sure?` صدایت بالا می‌رود و در `That\'d be great` پایین می‌آید.'
			},
			found: said => THAT_WOULD_BE.test(said)
		},
		{
			sentence: 'Is it OK if I come a little later?',
			shown: '**Is‿it OK if I** come a little later?',
			chunk: 'is it ok if i',
			situation: { en: 'Jake invites you to the barbecue, a week from today at four.', fa: 'جیک تو را به باربیکیوی ساختمان دعوت می‌کند: یک هفتهٔ دیگر، شنبه ساعت چهار.' },
			tip: { en: '`is it` runs together: `I-zit`, then `oh-KAY`.', fa: '`is it` را پیوسته بگو: `I-zit`، بعد `oh-KAY`.' },
			found: said => /\b(?:is it|would it be|will it be) (?:ok|okay|o k|alright|all right|fine) if (?:i|we)\b/.test(said)
		},
		{
			sentence: "Ha, I'd rather not say!",
			shown: "Ha, **I'd rather not say**!",
			chunk: "i'd rather not say",
			situation: { en: 'Jake asks how much you pay for 3C.', fa: 'جیک می‌پرسد اجارهٔ 3C را چقدر می‌دهی.' },
			tip: { en: '`I\'d rather`: keep the small `d` and link it: `ay-DRA-ther`.', fa: 'در `I\'d rather` صدای کوچک `d` را نگه دار و به `rather` بچسبان: `ay-DRA-ther`.' },
			found: said => /\bi would rather not (?:say|tell|talk about it|get into (?:it|that)|share)\b/.test(said)
		},
		{
			sentence: "Anyway, I'll let you go. Nice talking to you!",
			shown: "Anyway, **I'll let‿you go**. Nice talking to you!",
			chunk: "i'll let you go",
			situation: { en: 'You\'ve chatted for a while, and it\'s time to go.', fa: 'مدتی گپ زده‌اید و وقت رفتن است.' },
			tip: { en: '`let you` runs together: `LEH-chuh`.', fa: '`let you` را پیوسته بگو: `t` و `y` با هم «چ» می‌شوند، یعنی `LEH-chuh`.' },
			found: said => /\blet you (?:go|get going|get back to)\b/.test(said)
		}
	]
};

/**
 * Persian-speaker traps (Intermediate): three word traps (tap the mistake, then say it right) and two
 * "which reply?" items (taarof, a compliment). All five are in the lesson. The brief's spare,
 * "Hi, Mr. Jake" (`hi-mr-jake`), is left for later.
 */
export const TRAPS: Trap[] = [
	{
		// A word-order mistake has no single wrong word: "you are" is one button.
		id: 'where-from', kind: { en: 'word order in questions', fa: 'ترتیب کلمه‌ها در سؤال' },
		words: ['Nice', 'to', 'meet', 'you.', 'Where', 'you are', 'from?'], wrong: 5,
		right: 'Nice to meet you. Where are you from?',
		why: { en: 'In a question, the verb comes before “you”: “Where are you from?”', fa: 'در فارسی ترتیب کلمه‌ها در سؤال عوض نمی‌شود: «اهل کجایی؟». ولی در انگلیسی در سؤال، فعل قبل از you می‌آید: «Where are you from».' },
		accept: [/\bwhere are you from\b/, /\bwhere're you from\b/], reject: [/\bwhere you are from\b/],
		alsoGood: { patterns: [/\bwhere do you come from\b/, /\bwhere (?:are|were) you born\b/], word: 'are' }
	},
	{
		// The brief's sentence had two errors; this one keeps "for", so only the tense is wrong.
		id: 'has-lived', kind: { en: 'has lived (how long)', fa: 'has lived (چند وقت)' },
		words: ['My', 'neighbor', 'lives', 'here', 'for', 'six', 'years.'], wrong: 2,
		right: 'My neighbor has lived here for six years.',
		why: { en: 'For something that started in the past and is still true, say “has lived”: “He has lived here for six years.”', fa: 'در فارسی می‌گوییم «شش سال است این‌جا زندگی می‌کند» و فعل حال است. در انگلیسی برای کاری که از گذشته شروع شده و هنوز ادامه دارد «has lived» می‌گوییم: «He has lived here for six years».' },
		accept: [/(?:\bhas|'s) (?:lived|been living|been) here (?:for )?(?:six|6) years\b/], reject: [/\b(?:lives|is living|live) here\b/]
	},
	{
		id: 'jake-he', kind: { en: 'he / she', fa: 'he / she' },
		words: ['Jake', 'is', 'a', 'nurse.', 'She', 'works', 'at', 'night.'], wrong: 4,
		right: 'Jake is a nurse. He works at night.',
		why: { en: 'In Persian, «او» means both he and she. Jake is a man, so say “he”.', fa: 'در فارسی «او» هم برای مرد است هم برای زن. جیک مرد است، پس در انگلیسی «he» می‌گوییم.' },
		accept: [/\bhe(?: works|'s working| is working)\b/], reject: [/\bshe(?: works|'s working| is working)\b/]
	},
	{
		id: 'yes-first-time', kind: { en: 'saying yes to help', fa: 'قبول کردن کمک' },
		words: [], wrong: -1,
		reply: {
			prompt: { en: 'Your hands are full, and you\'d like help. What do you say?', fa: 'دستت پر است و کمک می‌خواهی. چه می‌گویی؟' },
			line: 'Here, let me help you with that.',
			options: ["Oh, no, no. It's fine.", 'Yes, please! Thank you.', "Please, don't trouble yourself."],
			answer: 1
		},
		right: 'Yes, please! Thank you.',
		why: TAAROF_NOTE,
		// A thanks on its own is a yes.
		accept: [/\byes please\b/, /\b(?:yes|yeah|sure|oh yes) (?:thank you|thanks)\b/, /\bthat(?:'d| would) be (?:great|nice|lovely|amazing|awesome|helpful)\b/, /^(?:oh )?(?:ok |okay )?(?:thank you|thanks)(?: so much| very much| a lot)?\b/],
		reject: [/\bit's fine\b/, /\bno no\b/, /\btrouble yourself\b/, /^(?:oh )?no\b(?! problem)/]
	},
	{
		id: 'just-thanks', kind: { en: 'taking a compliment', fa: 'جواب دادن به تعریف' },
		words: [], wrong: -1,
		reply: {
			prompt: { en: 'Jake sees the plant you\'re carrying. What do you say?', fa: 'جیک گلدانی را که دستت است می‌بیند. چه می‌گویی؟' },
			line: 'Nice plant!',
			options: ["Oh, it's nothing.", "Take it, it's yours!", 'Thanks! I love it too.'],
			answer: 2
		},
		right: 'Thanks! I love it too.',
		why: {
			en: 'To a compliment, just say "Thanks!" You can add one thing: "I love it too." "It\'s nothing" is a reply to "Thank you", not to a compliment. And in English, "Take it!" sounds like a real offer.',
			fa: 'در جواب تعریف، فقط بگو «Thanks!». می‌توانی یک چیز هم اضافه کنی: «I love it too.» جملهٔ «It\'s nothing» جواب «Thank you» است، نه جواب تعریف. و در انگلیسی «Take it!» مثل «قابل نداره» نیست؛ یعنی واقعاً داری آن را به او می‌دهی.'
		},
		accept: [/\bthanks\b/, /\bthank you\b/], reject: [/\bit's nothing\b/, /\btake it\b/, /\bit's yours\b/]
	}
];
export const LESSON_TRAP_IDS = ['where-from', 'has-lived', 'jake-he', 'yes-first-time', 'just-thanks'];

/**
 * Say it in English (Intermediate): three messages to Jake, in the order of the meeting (his offer,
 * names, goodbye), all in the lesson. Persian uses «شما» (a neighbor you've just met). The checks
 * the AI makes are in the `points` wording (a hidden per-item `check` is for later).
 */
const TO_JAKE = { en: 'To Jake, your neighbor upstairs', fa: 'به جیک، همسایهٔ طبقهٔ بالا' };
const NAMES = 'Jake, Biscuit, 3C, Elm Street, Riverton.';
export const SAY: Partial<Record<Track, SayItem[]>> = {
	intermediate: [
		{
			id: 'ev1-yes-help', to: TO_JAKE, names: NAMES,
			fa: 'آره، ممنون می‌شم! این جعبه خیلی سنگینه.',
			points: [{ en: 'you say yes to his help, the first time', fa: 'همان بار اول کمکش را قبول می‌کنی' }, { en: 'you say the box is really heavy', fa: 'می‌گویی جعبه خیلی سنگین است' }],
			models: ['Yes, please! Thank you. This box is really heavy.', "Oh, yes, please, that'd be great! It's so heavy."],
			hints: [{ en: 'Yes, please', fa: 'آره، لطفاً' }, { en: 'heavy', fa: 'سنگین' }]
		},
		{
			id: 'ev1-hi', to: TO_JAKE, names: NAMES,
			fa: 'سلام! من (اسم خودت) هستم، تازه به واحد 3C اسباب‌کشی کردم. شما چند وقته این‌جا زندگی می‌کنید؟',
			points: [{ en: 'you say your name, and that you\'re in 3C', fa: 'اسمت را می‌گویی و این‌که در واحد 3C هستی' }, { en: 'you ask how long he\'s lived here', fa: 'می‌پرسی چند وقت است این‌جا زندگی می‌کند' }],
			models: ["Hi! I'm {name}. I just moved into 3C. How long have you lived here?", "Hi, I'm {name}, in 3C. I just moved in. So how long have you been here?"],
			hints: [{ en: 'I just moved in', fa: 'تازه اسباب‌کشی کردم' }, { en: 'How long have you lived…?', fa: 'چند وقته… زندگی می‌کنید؟' }]
		},
		{
			id: 'ev1-go', to: TO_JAKE, names: NAMES,
			fa: 'خب، دیگه من برم. از آشنایی‌تون خوشحال شدم. فعلاً!',
			points: [{ en: 'you say you should go, nicely', fa: 'مؤدبانه می‌گویی که باید بروی' }, { en: 'you say it was nice to meet him', fa: 'می‌گویی از آشنایی با او خوشحال شدی' }],
			models: ['Well, I should go. Nice meeting you! See you around!', 'OK, I should get going. It was nice meeting you, Jake. See you!'],
			hints: [{ en: 'I should go', fa: 'دیگه من برم' }, { en: 'Nice meeting you', fa: 'از آشنایی‌تون خوشحال شدم' }]
		}
	]
};
/** All three are in the lesson. */
export const LESSON_SAY_IDS: Partial<Record<Track, string[] | null>> = { intermediate: null };

/**
 * Voice message (Professional): Mr. Patel, the building manager, welcomes you on moving day
 * (conversation.md §4), so "a week from today" is the same Saturday as Jake's barbecue. One message.
 */
export const MESSAGES: VoiceMessage[] = [
	{
		id: 'e1-patel', names: 'Mr. Patel, 48 Elm Street, Riverton, Jake, 3C.',
		from: { name: 'Mr. Patel', who: { en: 'the building manager', fa: 'مدیر ساختمان' }, voice: 'c' },
		sentences: [
			'Hello, this is Mr. Patel, the building manager. Welcome to 48 Elm Street!',
			'Just so you know, packages go to my office, on the ground floor.',
			'Also, we’re having a barbecue in the backyard a week from today, on Saturday at four.',
			'It’s a nice way to meet the neighbors. Will you be able to join us?',
			'If you can come, could you bring something small to eat or drink?',
			'Thanks, and let me know if you need anything.'
		],
		asks: [
			{ ask: { en: 'Thank him for the welcome.', fa: 'بابت خوشامدگویی از او تشکر کن.' }, missed: { en: 'You didn\'t thank him for the welcome.', fa: 'بابت خوشامدگویی تشکر نکردی.' } },
			{ ask: { en: 'Will you come to the barbecue on Saturday?', fa: 'شنبه به باربیکیو می‌آیی؟' }, missed: { en: 'You didn\'t say if you\'ll come to the barbecue.', fa: 'نگفتی به باربیکیو می‌آیی یا نه.' } },
			{ ask: { en: 'Can you bring something to eat or drink? What?', fa: 'می‌توانی چیزی برای خوردن یا نوشیدن بیاوری؟ چه چیزی؟' }, missed: { en: 'You didn\'t say what you\'ll bring to eat or drink.', fa: 'نگفتی چه چیزی برای خوردن یا نوشیدن می‌آوری.' } }
		],
		model: 'Hi Mr. Patel, this is {name} from 3C. Thanks so much for the welcome! I’d love to come to the barbecue on Saturday. Sure, I’ll bring some fruit and something cold to drink. See you then!'
	}
];
export const LESSON_MESSAGE_IDS = ['e1-patel'];
/** The Module lab's introduction: the same as the step's intro. */
export const MESSAGES_INTRO: DisplayText = {
	en: 'Imagine you\'ve just moved into 3C at 48 Elm Street. Mr. Patel, the building manager, sends you a voice message. Listen, then reply with a short voice message. Make sure you answer his questions.',
	fa: 'فرض کن تازه به واحد 3C در 48 Elm Street اسباب‌کشی کرده‌ای. آقای پاتل، مدیر ساختمان، برایت یک پیام صوتی می‌فرستد. گوش بده و با یک پیام صوتی کوتاه جواب بده. حواست باشد به سؤال‌هایش جواب بدهی.'
};

/**
 * A model answer when the learner's first name isn't known, where the docs give one (the line drops
 * the name). The other models with `{name}` have none written yet.
 */
export const WITHOUT_NAME: Record<string, string> = {
	"Hi! I'm {name}. I just moved into 3C. How long have you lived here?": 'Hi! I just moved into 3C. How long have you lived here?',
	'Hi Mr. Patel, this is {name} from 3C. Thanks so much for the welcome! I’d love to come to the barbecue on Saturday. Sure, I’ll bring some fruit and something cold to drink. See you then!':
		'Hi Mr. Patel, it’s your new neighbor in 3C. Thanks so much for the welcome! I’d love to come to the barbecue on Saturday. Sure, I’ll bring some fruit and something cold to drink. See you then!'
};
