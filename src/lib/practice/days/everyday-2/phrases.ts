/**
 * Everyday 2, "Making plans": Natural phrases, Persian-speaker traps, Say it in English and the
 * Professional voice message. Source: docs/english-everyday-2/README.md (v2, reviews applied).
 * Content only. Phrase checks run on the say-better normalise ("I'd" is "i would", "can't" is
 * "can not"); trap checks on the traps normalise (contractions kept).
 */
import type { Phrase } from '../../phrases';
import type { Trap } from '../../traps';
import type { SayItem } from '../../say-in-english';
import type { VoiceMessage } from '../../voice-messages';
import type { DisplayText } from '../../hotel';
import type { Track } from '../../day';

/**
 * Natural phrases. A2: invite → say yes → say no with another day → choose a time → offer to bring
 * something (the chat's third goal). B1: no, kindly → another day → offer to do something → move a
 * plan → when someone else moves it.
 */
export const PHRASES: Record<Track, Phrase[]> = {
	intermediate: [
		{
			sentence: "We're getting pizza on Friday. Do you want to come?",
			shown: "We're getting pizza on Friday. **Do you want to come?**",
			chunk: 'do you want to come',
			situation: { en: 'Some neighbors are getting pizza, and you want to invite Jake.', fa: 'چند تا از همسایه‌ها می‌خواهند پیتزا بخورند و می‌خواهی جیک را هم دعوت کنی.' },
			tip: { en: '`Do you` is quick: `d\'yuh`. `want to` often sounds like `WAN-nuh`. Your voice goes up on `come?`', fa: '`Do you` سریع گفته می‌شود: `d\'yuh`. `want to` در گفتار اغلب `WAN-nuh` شنیده می‌شود. آخر جمله، روی `come?`، صدایت بالا می‌رود.' },
			found: said => /\b(?:want to|wanna) (?:come|join (?:us|me))\b|\bwould you like to (?:come|join)\b/.test(said)
		},
		{
			sentence: "I'd love to!",
			shown: "**I'd love to**!",
			chunk: "i'd love to",
			situation: { en: 'Jake invites you to pizza with some neighbors.', fa: 'جیک تو را دعوت می‌کند با چند تا از همسایه‌ها پیتزا بخورید.' },
			tip: { en: 'Keep the small `d` in `I\'d`: `ayd-LUV-tuh`. Without it, `I love to` means something you always like doing.', fa: 'صدای کوچک `d` در `I\'d` را نگه دار: `ayd-LUV-tuh`. بدون آن، `I love to` یعنی کاری که همیشه دوست داری.' },
			found: said => /\bi would (?:really |so )?love (?:to|that)\b/.test(said) && !/\bbut\b/.test(said)
		},
		{
			sentence: "Sorry, I can't on Wednesday. How about Thursday?",
			shown: "Sorry, I can't on Wednesday. **How about** Thursday?",
			chunk: 'how about',
			situation: { en: 'Jake invites you for Wednesday, but you can\'t go.', fa: 'جیک برای چهارشنبه دعوتت می‌کند، ولی نمی‌توانی بروی.' },
			tip: { en: '`Wednesday` has two beats: `WENZ-day`. The first `d` is silent.', fa: '`Wednesday` دو بخش دارد: `WENZ-day`. `d` اول خوانده نمی‌شود.' },
			found: said => /\b(?:how|what) about\b/.test(said)
		},
		{
			sentence: 'What time works for you?',
			shown: '**What time works** for you?',
			chunk: 'what time works',
			situation: { en: 'You want to choose a time together.', fa: 'می‌خواهید با هم یک ساعت انتخاب کنید.' },
			tip: { en: '`works`: round your lips for `w` (not `v`), and keep the `ks`: `wurks-fer-yuh`.', fa: 'در `works` لب‌ها را برای `w` گرد کن (نه `v`)، و `ks` آخر را نینداز: `wurks-fer-yuh`.' },
			found: said => /\b(?:what|which) (?:time|day) (?:works|would work|is good|is best)\b/.test(said)
		},
		{
			sentence: 'Sounds great! I can bring dessert.',
			shown: 'Sounds great! **I can bring** dessert.',
			chunk: 'i can bring',
			situation: { en: 'Your friends are sharing jobs for a party.', fa: 'دوست‌هایت کارهای یک مهمانی را بین خودشان تقسیم می‌کنند.' },
			tip: { en: '`can` is short here: `I kn BRING`. Stress the thing you\'ll do: `BRING`, `deSSERT`.', fa: 'این‌جا `can` کوتاه است: `I kn BRING`. روی کاری که انجام می‌دهی تأکید کن: `BRING`، `deSSERT`.' },
			found: said => /\bi (?:can|will|could) (?:bring|make|get|buy|do)\b/.test(said)
		}
	],
	professional: [
		{
			sentence: "I'd love to, but I can't on Wednesday.",
			shown: "**I'd love to, but** I can't on Wednesday.",
			chunk: "i'd love to, but",
			situation: { en: 'Jake invites you to trivia on Wednesday, and you can\'t go.', fa: 'جیک تو را برای چهارشنبه به شب مسابقه دعوت می‌کند و نمی‌توانی بروی.' },
			tip: { en: 'In US English, `can\'t` is long and stressed: `I KANT`. `can` is short: `I kn go`. The `t` is soft, so the stress shows which one you mean.', fa: 'در انگلیسی آمریکایی `can\'t` کشیده و با تأکید گفته می‌شود: `I KANT`؛ `can` کوتاه است: `I kn go`. صدای `t` ضعیف است، پس همین تأکید نشان می‌دهد کدام را می‌گویی.' },
			found: said => /\bi would (?:really |so )?love to(?: \w+){0,2} but\b/.test(said)
		},
		{
			sentence: 'Could we do Thursday instead?',
			shown: '**Could we do** Thursday instead?',
			chunk: 'could we do',
			situation: { en: 'You want to suggest another day.', fa: 'می‌خواهی یک روز دیگر پیشنهاد بدهی.' },
			tip: { en: '`could we`: the `l` is silent, and `we` starts with round lips (`w`, not `v`): `kud-wee`.', fa: 'در `could` حرف `l` خوانده نمی‌شود، و `we` با لب‌های گرد شروع می‌شود (`w`، نه `v`): `kud-wee`.' },
			found: said => /\b(?:could|can) we (?:do|make it|try)\b/.test(said)
		},
		{
			sentence: "I'll take care of dessert.",
			shown: "**I'll take care of** dessert.",
			chunk: "i'll take care of",
			situation: { en: 'Your friends are sharing jobs for a party.', fa: 'دوست‌هایت کارهای یک مهمانی را بین خودشان تقسیم می‌کنند.' },
			tip: { en: '`take care of` runs together: `TAY-kair-uv`. `of` is just a small `uv`.', fa: '`take care of` را پیوسته بگو: `TAY-kair-uv`. `of` فقط یک `uv` کوتاه است.' },
			found: said => /\b(?:i will|i can|let me) (?:take care of|handle|sort out)\b|\bleave (?:it|that|the \w+) to me\b/.test(said)
		},
		{
			sentence: 'Sorry, something came up. Can we move it to Saturday?',
			shown: 'Sorry, **something came‿up**. Can we move it to Saturday?',
			chunk: 'something came up',
			situation: { en: 'You can\'t go on Thursday anymore.', fa: 'دیگر نمی‌توانی پنج‌شنبه بروی.' },
			tip: { en: '`came up` runs together: `kay-MUP`.', fa: '`came up` را پیوسته بگو: `kay-MUP`.' },
			found: said => /\bsomething (?:just )?(?:came|has come|has just come) up\b|\bsomething's (?:just )?come up\b/.test(said)
		},
		{
			sentence: 'No worries! Saturday works for me.',
			shown: 'No worries! Saturday **works for me**.',
			chunk: 'works for me',
			situation: { en: 'A friend has to move your plan to another day.', fa: 'دوستت مجبور است برنامه‌تان را به یک روز دیگر بیندازد.' },
			tip: { en: '`works for me`: keep the `s` and link it: `WURK-sfer-mee`. Round your lips for `w`.', fa: '`works for me` را پیوسته بگو و `s` را نینداز: `WURK-sfer-mee`. برای `w` لب‌ها را گرد کن.' },
			found: said => /\b(?:works|would work) for me\b/.test(said)
		}
	]
};

/** The "which reply?" note on a clear no (Traps item 4): one text wherever it appears in full. */
export const CLEAR_NO_NOTE: DisplayText = {
	en: 'In Persian, «ببینم چی می‌شه» or «سعی می‌کنم بیام» can be a soft no. In English, "maybe" and "I\'ll try" sound like a real maybe, so your friend keeps waiting. A kind, clear no with another day is friendlier. Both ways are polite. The rules are just different.',
	fa: 'در فارسی «ببینم چی می‌شه» یا «سعی می‌کنم بیام» می‌تواند یک «نه»ی مؤدبانه باشد. در انگلیسی «maybe» و «I\'ll try» یعنی واقعاً شاید؛ پس دوستت منتظر جواب می‌ماند. یک «نه»ی مهربان و روشن، همراه با یک روز دیگر، دوستانه‌تر است. هر دو روش مؤدبانه است؛ فقط قاعده‌ها فرق دارد.'
};

/**
 * Persian-speaker traps (Intermediate): three word traps, then two "which reply?" items (a clear no,
 * your own choice). All five are in the lesson (the 20-minute one; the 15-minute lesson leaves Traps out).
 */
export const TRAPS: Trap[] = [
	{
		// "we meet" is one button: the mistake is the missing helper word, not one wrong word.
		id: 'what-time', kind: { en: 'questions: what time…?', fa: 'سؤال با what time' },
		words: ['Sounds', 'good!', 'What', 'time', 'we meet?'], wrong: 4,
		right: 'Sounds good! What time should we meet?',
		why: { en: 'In a question, a helper word comes before “we”: “What time should we meet?”', fa: 'در فارسی می‌گوییم «ساعت چند همدیگه رو ببینیم؟» و ترتیب کلمه‌ها عوض نمی‌شود. ولی در انگلیسی در سؤال یک فعل کمکی مثل should یا do قبل از we می‌آید: «What time should we meet?».' },
		accept: [/\bwhat time (?:should|shall|do|can|could) we meet\b/, /\bwhat time are we meeting\b/], reject: [/\bwhat time we (?:meet|are meeting|should meet)\b/]
	},
	{
		id: 'want-to-come', kind: { en: 'inviting someone', fa: 'دعوت کردن' },
		words: ["We're", 'getting', 'pizza', 'on', 'Friday.', 'Do you come?'], wrong: 5,
		right: "We're getting pizza on Friday. Do you want to come?",
		why: { en: '“Do you come?” asks about a habit, like “Do you come here often?” To invite someone, say “Do you want to come?”', fa: 'در فارسی «میای؟» یعنی دعوت. ولی در انگلیسی «Do you come?» یعنی «معمولاً می‌آیی؟». برای دعوت بگو «Do you want to come?».' },
		accept: [/\b(?:want to|wanna) come\b/, /\bwould you like to come\b/, /\bcan you come\b/, /\bare you coming\b/], reject: [/\bdo you come\b/, /\bwant come\b/]
	},
	{
		id: 'on-saturday', kind: { en: 'on + day, at + time', fa: 'on + روز، at + ساعت' },
		words: ["Let's", 'meet', 'in', 'Saturday', 'at', 'seven.'], wrong: 2,
		right: "Let's meet on Saturday at seven.",
		why: { en: 'Use “on” with days and “at” with times: “on Saturday at seven.” You can also just say “Saturday at seven.”', fa: 'در انگلیسی با روزها on می‌آید و با ساعت at: «on Saturday at seven». بدون on هم درست است: «Saturday at seven»، ولی in نه.' },
		accept: [/(?<!\b(?:in|at) )\bsaturday at (?:seven|7)\b/], reject: [/\b(?:in|at) saturday\b/, /\b(?:in|on) (?:seven|7)\b/]
	},
	{
		id: 'clear-no', kind: { en: 'saying no kindly', fa: 'مهربانانه نه گفتن' },
		words: [], wrong: -1,
		reply: {
			prompt: { en: 'Jake invites you to trivia on Wednesday. You can\'t go. What do you say?', fa: 'جیک تو را برای چهارشنبه به شب مسابقه دعوت می‌کند. نمی‌توانی بروی. چه می‌گویی؟' },
			line: 'Do you want to come to trivia on Wednesday?',
			options: ['Maybe… I\'ll see.', 'I\'ll try to come!', "Sorry, I can't on Wednesday. How about Thursday?"],
			answer: 2
		},
		right: "Sorry, I can't on Wednesday. How about Thursday?",
		why: CLEAR_NO_NOTE,
		accept: [/^(?=.*\b(?:can't|cannot|can not|won't be able to|not free|busy)\b)(?=.*(?:\b(?:mon|tues|wednes|thurs|fri|satur|sun)day\b.*\b(?:mon|tues|wednes|thurs|fri|satur|sun)day\b|\bnext week\b|\b(?:how|what) about\b|\b(?:could|can) we\b))/],
		reject: [/\bi'll (?:see|try)\b/, /\bwe'll see\b/, /\bi'm not sure\b/, /^maybe\b/]
	},
	{
		id: 'your-choice', kind: { en: 'making your own choice', fa: 'انتخاب خودت' },
		words: [], wrong: -1,
		reply: {
			prompt: { en: 'Your friend Maya is planning a birthday party. She asks what you think.', fa: 'دوستت مایا دارد یک جشن تولد برنامه‌ریزی می‌کند و نظرت را می‌پرسد.' },
			line: 'The restaurant or a picnic in the park? What do you think?',
			options: ['A picnic sounds fun!', 'Whatever you want. You know better.', 'Both are fine, you choose!'],
			answer: 0
		},
		right: 'A picnic sounds fun!',
		why: {
			en: 'In Persian, «هرچی تو بگی» is polite. In English, friends really want your choice, so pick one: "A picnic sounds fun!" Both ways are kind. The rules are just different.',
			fa: 'در فارسی «هرچی تو بگی» مؤدبانه است. در انگلیسی دوست‌ها واقعاً انتخاب تو را می‌خواهند؛ پس یکی را انتخاب کن: «A picnic sounds fun!». هر دو روش مهربانانه است؛ فقط قاعده‌ها فرق دارد.'
		},
		accept: [/\bsounds? (?:great|good|fun|nice|perfect)\b/, /\bi(?:'d| would) (?:prefer|like|go with|say|vote for|choose)\b/, /\blet's (?:do|go with|go to|have)\b/, /^(?:the )?(?:restaurant|picnic|park)\b/],
		reject: [/\bwhatever\b/, /\byou (?:choose|pick|decide)\b/, /\byou know better\b/, /\bboth are (?:fine|good|great)\b/, /\bi don't know\b/, /\banything is fine\b/]
	}
];
export const LESSON_TRAP_IDS = ['what-time', 'want-to-come', 'on-saturday', 'clear-no', 'your-choice'];

/**
 * Say it in English (Intermediate): three messages to Jake (Persian «تو»: a neighbor you know now):
 * a kind no with another day, yes to a time, an invitation. All in the lesson.
 */
const TO_JAKE = { en: 'To Jake, your neighbor upstairs', fa: 'به جیک، همسایهٔ طبقهٔ بالا' };
const NAMES = 'Jake, Corner Café, Tony’s, Riverton.';
export const SAY: Partial<Record<Track, SayItem[]>> = {
	intermediate: [
		{
			id: 'ev2-no-thursday', to: TO_JAKE, names: NAMES,
			fa: 'ببخشید، چهارشنبه نمی‌تونم. پنج‌شنبه چطوره؟',
			points: [{ en: 'you say clearly that you can\'t on Wednesday ("maybe" or "I\'ll try" doesn\'t count)', fa: 'واضح می‌گویی که چهارشنبه نمی‌توانی («maybe» یا «I\'ll try» حساب نمی‌شود)' }, { en: 'you suggest Thursday', fa: 'پنج‌شنبه را پیشنهاد می‌دهی' }],
			models: ["Sorry, I can't on Wednesday. How about Thursday?", "I'd love to, but I can't on Wednesday. What about Thursday?"],
			hints: [{ en: "I can't on…", fa: '… نمی‌تونم' }, { en: 'How about…?', fa: '… چطوره؟' }]
		},
		{
			id: 'ev2-seven', to: TO_JAKE, names: NAMES,
			fa: 'عالیه! ساعت هفت برام خوبه. می‌بینمت!',
			points: [{ en: 'you say seven is good for you', fa: 'می‌گویی ساعت هفت برایت خوب است' }, { en: 'you say goodbye ("See you then!")', fa: 'خداحافظی می‌کنی ("See you then!")' }],
			models: ['Great! Seven works for me. See you then!', 'Perfect! Seven is good for me. See you!'],
			hints: [{ en: 'works for me', fa: 'برام خوبه' }, { en: 'See you then!', fa: 'می‌بینمت!' }]
		},
		{
			id: 'ev2-invite', to: TO_JAKE, names: NAMES,
			fa: 'یکشنبه با چند تا از دوستام می‌ریم پارک. تو هم میای؟',
			points: [{ en: 'you say you\'re going to the park on Sunday with some friends', fa: 'می‌گویی یکشنبه با چند تا از دوستانت به پارک می‌روی' }, { en: 'you invite him ("Do you want to come?", not "Do you come?")', fa: 'دعوتش می‌کنی ("Do you want to come?"، نه "Do you come?")' }],
			models: ['Some friends and I are going to the park on Sunday. Do you want to come too?', "I'm going to the park with some friends on Sunday. Want to come?"],
			hints: [{ en: 'Some friends and I are going…', fa: 'با چند تا از دوستام می‌ریم…' }, { en: 'Do you want to come?', fa: 'تو هم میای؟' }]
		}
	]
};
/** All three are in the lesson. */
export const LESSON_SAY_IDS: Partial<Record<Track, string[] | null>> = { intermediate: null };

/**
 * Voice message (Professional): Jake invites you to trivia on Wednesday; the intro says you're busy
 * then. The reply: thanks, a clear no, and yes to Friday or another day. Pizza is on Friday here, so
 * the learner's Saturday stays free for Nina's party (step 5).
 */
export const MESSAGES: VoiceMessage[] = [
	{
		id: 'e2-jake', names: 'Jake, Corner Café, Tony’s, Riverton.',
		from: { name: 'Jake', who: { en: 'your neighbor upstairs', fa: 'همسایهٔ طبقهٔ بالا' }, voice: 'a' },
		sentences: [
			"Hey, it's Jake, from upstairs.",
			'So, a few of us from the building do trivia at the Corner Café on Wednesday, at seven.',
			"It's a quiz night, in teams. Do you want to come?",
			"It's really fun, and nobody takes it too seriously.",
			"If Wednesday's no good, we're also getting pizza at Tony’s on Friday.",
			'Let me know!'
		],
		asks: [
			{ ask: { en: 'Thank him for the invitation.', fa: 'بابت دعوت از او تشکر کن.' }, missed: { en: 'You didn\'t thank him for the invitation.', fa: 'بابت دعوت تشکر نکردی.' } },
			{ ask: { en: 'Say clearly that you can\'t come on Wednesday ("maybe" or "I\'ll try" doesn\'t count).', fa: 'واضح بگو که چهارشنبه نمی‌توانی بیایی («maybe» یا «I\'ll try» حساب نمی‌شود).' }, missed: { en: 'You didn\'t say clearly that you can\'t come on Wednesday.', fa: 'واضح نگفتی که چهارشنبه نمی‌توانی بیایی.' } },
			{ ask: { en: 'Say yes to pizza on Friday, or suggest another day.', fa: 'به پیتزای جمعه بله بگو، یا یک روز دیگر پیشنهاد بده.' }, missed: { en: 'You didn\'t say yes to Friday or suggest another day.', fa: 'نه به جمعه بله گفتی، نه روز دیگری پیشنهاد دادی.' } }
		],
		model: "Hey Jake, it's {name}. Thanks so much for the invite! I'd love to, but I can't on Wednesday. I already have plans. Friday sounds great, though. What time are you meeting?"
	}
];
export const LESSON_MESSAGE_IDS = ['e2-jake'];
/** The Module lab's introduction: the same as the step's intro. */
export const MESSAGES_INTRO: DisplayText = {
	en: 'Jake, your neighbor upstairs, sends you a voice message. Imagine you\'re busy on Wednesday. Reply with a short voice message, and answer everything he asks.',
	fa: 'جیک، همسایهٔ طبقهٔ بالا، برایت یک پیام صوتی می‌فرستد. فرض کن چهارشنبه کار داری. با یک پیام صوتی کوتاه جواب بده و به همهٔ سؤال‌هایش جواب بده.'
};

/** The model answer when the learner's first name isn't known. */
export const WITHOUT_NAME: Record<string, string> = {
	"Hey Jake, it's {name}. Thanks so much for the invite! I'd love to, but I can't on Wednesday. I already have plans. Friday sounds great, though. What time are you meeting?":
		"Hey Jake! Thanks so much for the invite! I'd love to, but I can't on Wednesday. I already have plans. Friday sounds great, though. What time are you meeting?"
};
