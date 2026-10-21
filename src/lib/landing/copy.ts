/**
 * The landing page's words, English and Persian (docs/landing-copy.md v2, approved by the owner;
 * shortened for the card layout).
 * Every line must stay true of the app: change the doc and this file together.
 */
export type LandingLang = 'en' | 'fa';

/** A run of text; `en` parts are English words inside Persian text (kept left-to-right). */
export type Rich = (string | { en: string })[];

export interface LandingCopy {
	title: string;
	description: string;
	eyebrow: string;
	h1: string;
	line: string;
	cta: string;
	sample: string;
	small: string;
	signIn: string;
	switchLabel: string;
	figure: { caption: string; mira: string; you: string; promptFa: string; promptEn: string | null; said: string; fixLabel: string; fix: string; tipLabel: string; tip: Rich };
	/** Short facts that float around the phone in the first screen. */
	badges: string[];
	day: { h: string; steps: { title: string; text: string }[]; dayOne: string; need: string };
	practice: { h: string; cards: { title: string; text: string }[]; soon: { title: string; text: string } };
	/** Heading for the privacy-and-questions section (read by screen readers only). */
	trust: string;
	privacy: { h: string; t: string; link: string };
	faq: { h: string; items: { q: string; a: string }[] };
	end: { h: string; t: string };
	footer: { privacy: string; terms: string; trademark: string; nav: string; site: string };
	digits: (n: number) => string;
}

export const LANDING: Record<LandingLang, LandingCopy> = {
	en: {
		title: 'Mirifer: English speaking practice with an AI coach',
		description: 'Practice speaking English out loud with Mira, your AI coach: short daily lessons for travel, everyday life and IELTS-style speaking, with feedback. Free for now.',
		eyebrow: 'ENGLISH SPEAKING PRACTICE WITH AN AI COACH',
		h1: 'You know English. Now speak it.',
		line: 'Short daily speaking lessons with Mira, your AI coach. For travel, everyday life, and IELTS-style speaking practice.',
		cta: 'Start free',
		sample: 'Try a 2-minute sample (no sign-up)',
		small: 'Free for now · No payment details · Nothing to install',
		signIn: 'Sign in',
		switchLabel: 'فارسی',
		badges: ['15 min a day', 'IELTS-style speaking', 'Free for now'],
		figure: {
			caption: 'Example from Day 1: Mira gives you something to say, you say it, and she shows a natural way to say it.',
			mira: 'Mira:', you: 'You:',
			promptFa: 'به کارمند بگو یکی از چمدان‌هایت نیامده.', promptEn: 'Tell the agent one of your bags didn’t arrive.',
			said: 'Hi, one of my bag didn’t come.', fixLabel: 'A natural way to say it', fix: 'Hi, one of my bags didn’t come.',
			tipLabel: 'Tip', tip: ['After ', { en: '“one of my”' }, ', say ', { en: 'bags' }, ', not ', { en: 'bag' }, '.']
		},
		day: {
			h: 'About 15 minutes a day',
			steps: [
				{ title: 'Listen', text: 'Hear a real-life conversation: at the airport, in a taxi, at a hotel desk.' },
				{ title: 'Say it', text: 'Say what you need in English. Mira shows you a natural way to say it.' },
				{ title: 'Talk', text: 'Reply to voice messages. At the Professional level, you also talk to an AI character.' }
			],
			dayOne: 'Day 1: your bag didn’t arrive. Each day continues the story.',
			need: 'You need a microphone and a quiet place. You can stop between steps and come back later.'
		},
		practice: {
			h: 'More practice, whenever you want',
			cards: [
				{ title: 'IELTS-style speaking', text: 'Talk for two minutes from a topic card, and answer quick questions.' },
				{ title: 'Speak your mind', text: 'Give your opinion, describe something, and say your answer again, better.' },
				{ title: 'Listening', text: 'Hear a story and retell it, or write down what you hear.' },
				{ title: 'Common mistakes', text: 'Find the small mistakes that are easy to make, and say the sentence the right way.' }
			],
			soon: { title: 'Coming soon', text: 'Job interviews and presentations.' }
		},
		trust: 'Privacy and questions',
		privacy: {
			h: 'Your voice stays yours',
			t: 'To understand you, your recording is sent to an AI service that turns it into text. Then it’s deleted. Mirifer keeps no recordings, and never sells or shows what you say to anyone.',
			link: 'How we handle your data'
		},
		faq: {
			h: 'Questions',
			items: [
				{ q: 'What level do I need?', a: 'If you can understand simple English but find speaking hard, start with Intermediate. When you start, one question helps you choose.' },
				{ q: 'How long does it take?', a: 'About 15 minutes a day. Extra practice is there whenever you want it.' },
				{ q: 'Is it free?', a: 'Yes, for now, with no payment details. We’re early, and we’re learning from our first learners. If that changes, we’ll tell you long before it happens.' },
				{ q: 'Does it replace an IELTS class?', a: 'No. It gives you daily speaking practice in the style of the test, with feedback. Mirifer isn’t affiliated with or endorsed by IELTS, and it can’t predict your score.' },
				{ q: 'Does it work on iPhone?', a: 'Yes. It works in the browser on iPhone and Android, with your microphone. Nothing to install.' },
				{ q: 'Is there a daily limit?', a: 'Your daily lesson always fits. Extra practice has a daily limit; if you reach it, carry on tomorrow.' }
			]
		},
		end: { h: 'Start your first lesson today.', t: 'It takes about 15 minutes.' },
		footer: { privacy: 'Privacy', terms: 'Terms', trademark: 'IELTS is a registered trademark of its owners. Mirifer is not affiliated with IELTS.', nav: 'Footer', site: 'Site' },
		digits: n => String(n)
	},
	fa: {
		title: 'میریفر | تمرین مکالمهٔ انگلیسی با مربی هوش مصنوعی',
		description: 'با میرا، مربی هوش مصنوعی‌ات، انگلیسی را بلند تمرین کن: درس‌های کوتاه روزانه برای سفر، زندگی روزمره و تمرین اسپیکینگ به سبک آیلتس، با بازخورد. فعلاً رایگان.',
		eyebrow: 'تمرین مکالمهٔ انگلیسی با مربی هوش مصنوعی',
		h1: 'انگلیسی بلدی. حالا وقت حرف زدن است',
		line: 'درس‌های کوتاه روزانهٔ مکالمه با میرا، مربی هوش مصنوعی‌ات؛ برای سفر، زندگی روزمره و تمرین اسپیکینگ به سبک آیلتس.',
		cta: 'رایگان شروع کن',
		sample: 'یک نمونهٔ دودقیقه‌ای امتحان کن (بدون ثبت‌نام)',
		small: 'فعلاً رایگان، بدون پرداخت، بدون نصب',
		signIn: 'ورود',
		switchLabel: 'English',
		badges: ['روزی ۱۵ دقیقه', 'اسپیکینگ به سبک آیلتس', 'فعلاً رایگان'],
		figure: {
			caption: 'نمونه‌ای از روز اول: میرا می‌گوید چه بگویی، تو می‌گویی و او شکل طبیعی‌ترش را نشانت می‌دهد.',
			mira: 'میرا:', you: 'تو:',
			promptFa: 'به کارمند بگو یکی از چمدان‌هایت نیامده.', promptEn: null,
			said: 'Hi, one of my bag didn’t come.', fixLabel: 'شکل طبیعی‌تر', fix: 'Hi, one of my bags didn’t come.',
			tipLabel: 'نکته', tip: ['بعد از ', { en: 'one of my' }, ' اسم جمع می‌آید: ', { en: 'bags' }, '، نه\u00a0', { en: 'bag' }, '.']
		},
		day: {
			h: 'روزی حدود ۱۵ دقیقه',
			steps: [
				{ title: 'گوش بده', text: 'یک گفت‌وگوی روزمره بشنو: در فرودگاه، در تاکسی، در پذیرش هتل.' },
				{ title: 'بگو', text: 'حرفت را به انگلیسی بزن. میرا شکل طبیعی‌ترش را نشانت می‌دهد.' },
				{ title: 'گفت‌وگو کن', text: 'به پیام‌های صوتی جواب بده. در سطح «حرفه‌ای» با یک شخصیت هوش مصنوعی هم حرف می‌زنی.' }
			],
			dayOne: 'روز اول: چمدانت نرسیده. درسِ هر روز ادامهٔ همان ماجراست.',
			need: 'یک میکروفون و جایی آرام لازم داری. بین بخش‌ها می‌توانی دست نگه داری و بعداً ادامه بدهی.'
		},
		practice: {
			h: 'تمرین بیشتر، هر وقت خواستی',
			cards: [
				{ title: 'اسپیکینگ به سبک آیلتس', text: 'از روی کیوکارت دو دقیقه حرف بزن و به سؤال‌های سریع جواب بده.' },
				{ title: 'نظرت را بگو', text: 'نظر بده، چیزی را توصیف کن و جوابت را یک بار دیگر بهتر بگو.' },
				{ title: 'تمرین شنیداری', text: 'یک داستان بشنو و دوباره تعریفش کن، یا هر چه می‌شنوی بنویس.' },
				{ title: 'اشتباه‌های رایج', text: 'اشتباه‌های کوچکی را که زیاد پیش می‌آید پیدا کن و جمله را درست بگو.' }
			],
			soon: { title: 'به‌زودی', text: 'مصاحبهٔ کاری و ارائه.' }
		},
		trust: 'حریم خصوصی و سؤال‌ها',
		privacy: {
			h: 'صدایت مال خودت است',
			t: 'برای اینکه حرفت فهمیده شود، صدای ضبط‌شده‌ات به یک سرویس هوش مصنوعی فرستاده می‌شود تا به متن تبدیل شود و بعد پاک می‌شود. میریفر هیچ فایل صوتی نگه نمی‌دارد و حرف‌هایت را به کسی نمی‌فروشد و نشان نمی‌دهد.',
			link: 'با اطلاعاتت چه می‌کنیم'
		},
		faq: {
			h: 'سؤال‌های رایج',
			items: [
				{ q: 'چه سطحی باید داشته باشم؟', a: 'اگر انگلیسی ساده را می‌فهمی ولی حرف زدن برایت سخت است، با «متوسط» شروع کن. اول کار یک سؤال کمکت می‌کند انتخاب کنی.' },
				{ q: 'چقدر وقت می‌گیرد؟', a: 'روزی حدود ۱۵ دقیقه. بخش تمرین اختیاری است؛ هر وقت خواستی سراغش برو.' },
				{ q: 'رایگان است؟', a: 'بله، فعلاً رایگان است و پرداختی لازم نیست. تازه راه افتاده‌ایم و از اولین کاربرانمان یاد می‌گیریم. اگر روزی تغییر کند، خیلی پیش از آن خبرت می‌کنیم.' },
				{ q: 'جای کلاس آیلتس را می‌گیرد؟', a: 'نه. هر روز تمرین اسپیکینگ به سبک آزمون و بازخورد می‌دهد. میریفر هیچ ارتباط رسمی با آیلتس ندارد و نمرهٔ آزمون را پیش‌بینی نمی‌کند.' },
				{ q: 'روی آیفون کار می‌کند؟', a: 'بله. در مرورگرِ آیفون و اندروید با میکروفون کار می‌کند. لازم نیست چیزی نصب کنی.' },
				{ q: 'محدودیت روزانه دارد؟', a: 'درس روزانه هیچ‌وقت به سقف نمی‌خورد. تمرین‌های اضافه سقف روزانه دارند؛ اگر به سقف رسیدی، فردا ادامه بده.' }
			]
		},
		end: { h: 'همین امروز اولین درس را شروع کن', t: 'حدود ۱۵ دقیقه طول می‌کشد.' },
		footer: { privacy: 'حریم خصوصی', terms: 'شرایط استفاده', trademark: 'آیلتس نشان تجاری ثبت‌شدهٔ صاحبانش است و میریفر وابسته به آن نیست.', nav: 'پانویس', site: 'سایت' },
		digits: n => n.toLocaleString('fa-IR')
	}
};
