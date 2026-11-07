/**
 * Interview 1, "Tell me about yourself": Natural phrases and Persian-speaker traps. Content only.
 * Phrase checks run on the say-better normalise ("I'm" is "i am", "that's" stays); trap checks on
 * the traps normalise (contractions kept). Every check takes any job: the examples name one, the
 * regexes don't.
 */
import type { Phrase } from '../../phrases';
import type { Trap } from '../../traps';
import type { Track } from '../../day';

/**
 * Natural phrases. A2: arrive → your job → your experience → what you want → a moment to think.
 * B1: now → before → what you enjoy → why this job → a moment to think.
 */
export const PHRASES: Record<Track, Phrase[]> = {
	intermediate: [
		{
			sentence: "Hi, I'm here for an interview with Mark Davis.",
			shown: "Hi, **I'm here for an interview** with Mark Davis.",
			chunk: "i'm here for an interview",
			situation: { en: 'You arrive for your interview. You tell the receptionist why you\'re here.', fa: 'برای مصاحبه می‌رسی و به مسئول پذیرش می‌گویی برای چه آمده‌ای.' },
			tip: { en: '`interview`: stress the first part, `IN-ter-vyoo`. For `v`, your top teeth touch your bottom lip.', fa: 'در `interview` تأکید روی بخش اول است: `IN-ter-vyoo`. برای `v` دندان‌های بالا به لب پایین می‌خورند.' },
			found: said => /\bi am here (?:for|about) (?:an|my|the|a job) interview\b|\bi have (?:an|a job|my) interview\b/.test(said)
		},
		{
			sentence: 'I work as a sales assistant at a big store.',
			shown: 'I **work‿as a** sales assistant at a big store.',
			chunk: 'work as a',
			situation: { en: 'The interviewer asks about your job now.', fa: 'مصاحبه‌کننده می‌پرسد الان چه شغلی داری.' },
			tip: { en: '`as a` runs together: `uh-zuh`. Say `a` before a job (`a nurse`), or `an` before a vowel sound (`an engineer`). Don\'t leave it out.', fa: '`as a` را پیوسته بگو: `uh-zuh`. قبل از اسم شغل `a` می‌آید (`a nurse`)، و قبل از صدای مصوت `an` (`an engineer`). جایش نینداز.' },
			found: said => /\bi (?:currently |now |also |still )?work as (?:a|an|the)\b|\bi am (?:currently |now |also |still )?working as (?:a|an|the)\b/.test(said)
		},
		{
			sentence: 'I have three years of experience in sales.',
			shown: 'I have three **years‿of experience** in sales.',
			chunk: 'years of experience',
			situation: { en: 'You say how long you\'ve done this kind of work.', fa: 'می‌گویی چند سال است این کار را می‌کنی.' },
			tip: { en: '`years of` links: `YEER-zuv`. `of` is just a small `uv`, but keep it.', fa: '`years of` را پیوسته بگو: `YEER-zuv`. `of` فقط یک `uv` کوتاه است، ولی آن را نینداز.' },
			found: said => /\b(?:years?|months?) of (?:\w+ )?experience\b/.test(said)
		},
		{
			sentence: "I'm looking for a job with a bigger team.",
			shown: "**I'm looking for** a job with a bigger team.",
			chunk: "i'm looking for",
			situation: { en: 'The interviewer asks why you want a new job.', fa: 'مصاحبه‌کننده می‌پرسد چرا دنبال کار تازه‌ای هستی.' },
			tip: { en: '`looking` ends in a soft `ng`, with no hard `g` after it: `LOO-king-fer`.', fa: 'آخر `looking` یک `ng` نرم است و بعدش صدای `g` نمی‌آید: `LOO-king-fer`.' },
			found: said => /\bi am (?:now |really |currently |also |still )?looking for\b/.test(said)
		},
		{
			sentence: "That's a good question. Let me think.",
			shown: "That's a good question. **Let me think.**",
			chunk: 'let me think',
			situation: { en: 'The interviewer asks a hard question, and you need a moment.', fa: 'مصاحبه‌کننده سؤال سختی می‌پرسد و یک لحظه وقت لازم داری.' },
			tip: { en: '`Let me` is quick: `LEM-mee`. Then take a short pause. It\'s OK to think for a second.', fa: '`Let me` سریع گفته می‌شود: `LEM-mee`. بعد کمی مکث کن؛ اشکالی ندارد یک لحظه فکر کنی.' },
			found: said => /\blet me (?:think|see)\b|\blet's see\b|\bgive me a (?:second|moment|minute)\b/.test(said)
		}
	],
	professional: [
		{
			sentence: "I'm currently working as a team leader in customer service.",
			shown: "**I'm currently working‿as** a team leader in customer service.",
			chunk: "i'm currently working as",
			situation: { en: 'You start your answer to "Tell me about yourself."', fa: 'جواب «Tell me about yourself» را شروع می‌کنی.' },
			tip: { en: '`currently` has three beats: `KUR-ent-lee`. Stress the first one; the `t` is very light.', fa: '`currently` سه بخش دارد: `KUR-ent-lee`. روی بخش اول تأکید کن؛ `t` خیلی ضعیف گفته می‌شود.' },
			found: said => /\bi am (?:currently|now) working as\b|\bi (?:currently|now) work as\b|\b(?:currently|at the moment|right now) i (?:am working|work) as\b/.test(said)
		},
		{
			sentence: 'Before that, I spent four years in sales.',
			shown: '**Before that,** I spent four years in sales.',
			chunk: 'before that',
			situation: { en: 'You\'ve said what you do now. Now say what you did before.', fa: 'گفتی الان چه کار می‌کنی. حالا بگو قبلش چه می‌کردی.' },
			tip: { en: 'Stress `FORE` in `before`, then pause a little after `that`, so the listener hears a new part of your story.', fa: 'در `before` روی `FORE` تأکید کن و بعد از `that` کمی مکث کن تا شنونده بفهمد بخش تازه‌ای از داستانت شروع می‌شود.' },
			found: said => /\b(?:before|prior to) (?:that|this)\b/.test(said)
		},
		{
			sentence: 'What I enjoy most is solving problems for customers.',
			shown: '**What‿I enjoy most is** solving problems for customers.',
			chunk: 'what i enjoy most is',
			situation: { en: 'The interviewer asks what you like about your work.', fa: 'مصاحبه‌کننده می‌پرسد چه چیزی را در کارت دوست داری.' },
			tip: { en: '`What I` links, and the `t` turns soft, almost a `d`: `wuh-DAI`. Stress `MOST`.', fa: '`What I` را پیوسته بگو؛ `t` نرم و تقریباً `d` می‌شود: `wuh-DAI`. روی `MOST` تأکید کن.' },
			found: said => /\b(?:what|the thing|the part) i (?:really )?(?:enjoy|like|love)(?: the)? most(?: about(?: \w+){1,3})? is\b|\bwhat i (?:really )?(?:enjoy|like|love)(?: about(?: \w+){1,3})? is\b/.test(said)
		},
		{
			sentence: "I want to lead bigger projects. That's why I applied for this job.",
			shown: "I want to lead bigger projects. **That's why I applied** for this job.",
			chunk: "that's why i applied",
			situation: { en: 'You connect your story to this job.', fa: 'داستانت را به همین کار ربط می‌دهی.' },
			tip: { en: '`applied` has two beats and ends in a clear `d`: `uh-PLAID`. No extra beat (`ap-li-ed`).', fa: '`applied` دو بخش دارد و آخرش `d` شنیده می‌شود: `uh-PLAID`. بخش اضافه نساز (`ap-li-ed`).' },
			found: said => /\b(?:that's|thats|that is|this is) (?:also |exactly |really )?(?:why|the reason(?: why)?) i (?:applied|am applying|wanted to apply|want to apply|want this|am interested|am here)\b/.test(said)
		},
		{
			sentence: 'Let me think about that for a second.',
			shown: '**Let me think about that** for a second.',
			chunk: 'let me think about that',
			situation: { en: 'The interviewer asks a question you didn\'t expect.', fa: 'مصاحبه‌کننده سؤالی می‌پرسد که انتظارش را نداشتی.' },
			tip: { en: '`think` starts with your tongue between your teeth: `th`. Not `tink`, not `sink`.', fa: '`think` با زبان بین دندان‌ها شروع می‌شود: `th`. نه `tink`، نه `sink`.' },
			found: said => /\blet me (?:think|see)\b|\bgive me a (?:second|moment|minute|sec)\b/.test(said)
		}
	]
};

/**
 * Persian-speaker traps (both versions): five word traps, then one "which reply?" item (confidence,
 * not taarof). The lesson has four word traps and the reply; `explain-the` is for the Module lab
 * (it fits a later chapter, questions for the interviewer).
 */
export const TRAPS: Trap[] = [
	{
		// "years experience" is one button: the mistake is the missing "of", not one wrong word.
		id: 'years-of', kind: { en: 'years of experience', fa: 'years of experience' },
		words: ['I', 'have', 'five', 'years experience', 'in', 'customer', 'service.'], wrong: 3,
		right: 'I have five years of experience in customer service.',
		why: { en: 'In American English, say “years of experience”: “I have five years of experience.” Don’t drop the “of”.', fa: 'در فارسی می‌گوییم «پنج سال سابقه دارم» و بین «سال» و «سابقه» چیزی نمی‌آید. ولی در انگلیسی آمریکایی بین years و experience کلمهٔ of می‌آید: «five years of experience».' },
		accept: [/\byears? of (?:\w+ )?experience\b/], reject: [/\byears? experience\b/]
	},
	{
		// "am working" is one button: the tense is two words.
		id: 'have-worked-since', kind: { en: 'I’ve worked… since', fa: 'I’ve worked… since' },
		words: ['I', 'am working', 'at', 'a', 'hotel', 'since', '2021.'], wrong: 1,
		right: "I've worked at a hotel since 2021.",
		why: { en: 'For a job you started in the past and still have, say “I’ve worked” or “I’ve been working”: “I’ve worked at a hotel since 2021.”', fa: 'در فارسی می‌گوییم «از ۲۰۲۱ در یک هتل کار می‌کنم» و فعل حال است. ولی در انگلیسی برای کاری که از گذشته شروع شده و هنوز ادامه دارد می‌گوییم «I’ve worked» یا «I’ve been working»: «I’ve worked at a hotel since 2021».' },
		accept: [/\b(?:i've|i have|ive) (?:been working|worked|been) (?:at|in|for|with|there|here)\b/],
		reject: [/\b(?:i'm|i am|im) working (?:at|in|for|here|there)\b(?=.*\bsince\b)/, /\bi work (?:at|in|for|here|there)\b(?=.*\bsince\b)/, /\bi worked (?:at|in|for|here|there)\b(?=.*\bsince\b)/]
	},
	{
		id: 'interested-in', kind: { en: 'interested / interesting', fa: 'interested / interesting' },
		words: ["I'm", 'very', 'interesting', 'in', 'this', 'job.'], wrong: 2,
		right: "I'm very interested in this job.",
		why: { en: '“Interested” is how you feel; “interesting” is what makes you feel it. So say “I’m interested in this job.” “I’m interesting” means “I’m an interesting person”!', fa: '«interested» یعنی «علاقه‌مند» و «interesting» یعنی «جالب». پس بگو «I’m interested in this job»؛ «I’m interesting» یعنی «من آدم جالبی هستم».' },
		accept: [/\b(?:i'm|i am|im) (?:very |really |so |also )?interested in\b/], reject: [/\b(?:i'm|i am|im) (?:very |really |so |also )?interesting\b/]
	},
	{
		id: 'graduated', kind: { en: 'graduated (no “am”)', fa: 'graduated (بدون am)' },
		words: ['I', 'am', 'graduated', 'in', '2019.'], wrong: 1,
		right: 'I graduated in 2019.',
		why: { en: '“Graduate” is a verb, like “finish”: say “I graduated in 2019”, not “I am graduated”.', fa: 'در فارسی می‌گوییم «فارغ‌التحصیل هستم»، ولی در انگلیسی graduate خودش فعل است، مثل finish. پس بگو «I graduated in 2019»، نه «I am graduated».' },
		accept: [/\bi graduated\b/, /\bi finished (?:university|college|school|my degree|my studies)\b/], reject: [/\b(?:i'm|i am|im|i was) graduated\b/, /\bi graduate in\b/],
		alsoGood: { patterns: [/\b(?:i'm|i am|im) a (?:\w+ )?graduate\b/], word: 'graduated' }
	},
	{
		id: 'explain-the', kind: { en: 'explain (no “me”)', fa: 'explain (بدون me)' },
		words: ['Could', 'you', 'explain', 'me', 'the', 'next', 'steps?'], wrong: 3,
		right: 'Could you explain the next steps?',
		why: { en: 'After “explain”, say the thing, not the person: “Could you explain the next steps?” To add “me”, put “to me” at the end.', fa: 'در فارسی می‌گوییم «برام توضیح بدید»، ولی در انگلیسی بعد از explain کلمهٔ me نمی‌آید. بگو «Could you explain the next steps?». اگر «به من» را می‌خواهی، «to me» را آخر جمله بگذار.' },
		accept: [/\bexplain (?:to me |to us )?(?:the|your|this|that|it|how|what|a bit|a little|more)\b/], reject: [/\b(?:explain|describe) me\b/]
	},
	{
		id: 'proud-of', kind: { en: 'confidence, not taarof', fa: 'اعتمادبه‌نفس، نه تعارف' },
		words: [], wrong: -1,
		reply: {
			prompt: { en: 'The interviewer says something nice about your résumé. What do you say?', fa: 'مصاحبه‌کننده از رزومه‌ات تعریف می‌کند. چه می‌گویی؟' },
			line: 'Your résumé looks great.',
			options: ["Oh no, it's nothing special. I'm not very good.", "Thank you! I worked hard, and I'm proud of it.", "Yes, I know. I'm the best!"],
			answer: 1
		},
		right: "Thank you! I worked hard, and I'm proud of it.",
		why: {
			en: 'In Persian, «نه بابا، چیز خاصی نیست» is polite. In an English interview, it can sound like you don\'t believe in yourself, and the interviewer may believe you. Just say thanks, and add one thing you\'re proud of. "I\'m the best!" goes too far. Both ways are polite. The rules are just different.',
			fa: 'در فارسی «نه بابا، چیز خاصی نیست» مؤدبانه است. ولی در مصاحبهٔ انگلیسی ممکن است این‌طور شنیده شود که به خودت اعتماد نداری، و مصاحبه‌کننده هم باورش می‌کند. فقط تشکر کن و یک چیز را که به آن افتخار می‌کنی اضافه کن. «I’m the best!» هم زیاده‌روی است. هر دو روش مؤدبانه است؛ فقط قاعده‌ها فرق دارد.'
		},
		accept: [/^(?:oh |wow )?(?:thank you|thanks)\b/, /\b(?:i'm|i am|im) (?:really |very |so )?proud of\b/],
		reject: [/\bnothing special\b/, /\bit's nothing\b/, /\bnot (?:very |that |so |really )?(?:good|great|special)\b/, /\bnot sure\b/, /\b(?:i'm|i am|im) the best\b/, /\byes i know\b/, /^i know\b/, /^(?:oh )?no\b/]
	}
];
export const LESSON_TRAP_IDS = ['years-of', 'have-worked-since', 'interested-in', 'graduated', 'proud-of'];
