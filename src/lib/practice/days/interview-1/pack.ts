/**
 * Work, Interview 1: "Tell me about yourself" (owner's decision 2026-11-07; english-coach,
 * learning-UX and system-design reviews). The first story of the Work goal: the learner has applied
 * for a job at Crestview Group in Riverton. Step 1: Elena, another candidate, at Greenway Foods; steps
 * 2–3: phrases and traps for talking about your work; step 4: build your own answer in three parts
 * (now, before, next); step 5: the first minutes of your interview with Erin, the hiring manager.
 * Not ready for learners; a pilot for the owner's test accounts.
 */
import type { DayPack } from '../../day';

export const INTERVIEW_ONE: DayPack = {
	id: 'interview-1',
	number: 301,
	arc: 'work',
	ready: false,
	pilot: true,
	theme: { en: 'Tell me about yourself', fa: 'از خودت بگو' },
	themePhrase: 'job interview',
	question: 'And you? When someone says “Tell me about yourself,” what do you usually say first?',
	goal: {
		en: 'You’ve practiced small talk before an interview and answering “Tell me about yourself” in three parts: now, before, and why this job.',
		fa: 'تمرین کردی قبل از مصاحبه گپ کوتاه بزنی و به «Tell me about yourself» در سه بخش جواب بدهی: الان، قبلاً، و چرا این کار.'
	},
	goals: {
		intermediate: {
			en: 'You’ve practiced answering small talk before an interview, telling someone about yourself in three short parts, and asking someone to say something again.',
			fa: 'تمرین کردی قبل از مصاحبه به گپ‌های کوتاه جواب بدهی، در سه بخش کوتاه از خودت بگویی، و از کسی بخواهی حرفش را دوباره بگوید.'
		},
		professional: {
			en: 'You’ve practiced small talk before an interview, answering “Tell me about yourself” in three clear parts, backing up a strength with an example, and staying positive with a tricky question.',
			fa: 'تمرین کردی قبل از مصاحبه گپ کوتاه بزنی، به «Tell me about yourself» در سه بخش روشن جواب بدهی، برای نقطهٔ قوتت مثال بیاوری، و جلوی یک سؤال سخت مثبت بمانی.'
		}
	},
	checkIn: {
		story: {
			en: 'This is a new story: work. Imagine you’ve applied for a job at Crestview Group, a company in Riverton. Today is the first interview, and it starts with a question many people hear: “Tell me about yourself.”',
			fa: 'این یک داستان تازه است: کار. فرض کن برای یک شغل در Crestview Group، شرکتی در ریورتون، درخواست داده‌ای. امروز اولین مصاحبه است و با سؤالی شروع می‌شود که خیلی‌ها می‌شنوند: «Tell me about yourself.»'
		},
		question: {
			en: 'And you? When someone says “Tell me about yourself,” what do you usually say first?',
			fa: 'و تو؟ وقتی کسی می‌گوید «Tell me about yourself»، معمولاً اول چه می‌گویی؟'
		},
		reply: {
			en: 'Thanks for telling me. Today you’ll build your own answer, step by step, and then try it in an interview.',
			fa: 'ممنون که گفتی. امروز قدم‌به‌قدم جواب خودت را می‌سازی و بعد آن را در یک مصاحبه امتحان می‌کنی.'
		}
	},
	tracks: {
		intermediate: [
			{ id: 'listen-act', title: { en: 'Listen and connect', fa: 'گوش بده و وصل کن' }, short: { en: 'Listen', fa: 'گوش دادن' }, skill: 'listening', minutes: { 15: 4, 20: 4 }, built: true,
				does: { en: 'Hear another candidate’s first minutes in a job interview, then answer a few questions.', fa: 'اولین دقیقه‌های مصاحبهٔ کاری یک متقاضی دیگر را بشنو و بعد به چند سؤال جواب بده.' },
				intro: { en: 'Elena, another candidate, has an interview at Greenway Foods. Listen for the three parts of her answer to “Tell me about yourself”: what she does now, what she did before, and what she wants next.', fa: 'النا، یک متقاضی دیگر، در Greenway Foods مصاحبه دارد. به سه بخش جوابش به «Tell me about yourself» گوش بده: الان چه کار می‌کند، قبلاً چه کار می‌کرد، و حالا دنبال چه چیزی است.' } },
			{ id: 'phrases', title: { en: 'Natural phrases', fa: 'عبارت‌های طبیعی' }, short: { en: 'Phrases', fa: 'عبارت‌ها' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				does: { en: 'Hear five things you can say in the first minutes of an interview, and say each one after Mira.', fa: 'پنج جمله بشنو که می‌توانی در دقیقه‌های اول مصاحبه بگویی، و هر کدام را بعد از میرا تکرار کن.' },
				intro: { en: 'Imagine you have an interview at Crestview Group today. Here are five things you can say in the first few minutes. Listen, then say each one after me. I only check the phrase in bold.', fa: 'فرض کن امروز در Crestview Group مصاحبه داری. این پنج جمله را می‌توانی در همان چند دقیقهٔ اول بگویی. گوش بده و هر جمله را بعد از من تکرار کن. من فقط عبارت پررنگ را بررسی می‌کنم.' } },
			{ id: 'traps', title: { en: 'Persian-speaker traps', fa: 'اشتباه‌های آشنا' }, short: { en: 'Traps', fa: 'اشتباه‌ها' }, skill: 'speaking', minutes: { 20: 3 }, built: true,
				does: { en: 'Find the mistakes Persian speakers often make when they talk about their work, and pick the best reply.', fa: 'اشتباه‌هایی را که فارسی‌زبان‌ها موقع حرف زدن دربارهٔ کارشان زیاد می‌کنند پیدا کن و بهترین جواب را انتخاب کن.' },
				intro: { en: 'Imagine you have an interview at Crestview Group today. Here are four small mistakes Persian speakers often make when they talk about their work or studies, and one reply to choose. Spot each mistake, then say it the right way.', fa: 'فرض کن امروز در Crestview Group مصاحبه داری. این‌ها چهار اشتباه کوچک است که فارسی‌زبان‌ها موقع حرف زدن دربارهٔ کار یا درسشان زیاد می‌کنند، و یک جواب که باید انتخاب کنی. هر اشتباه را پیدا کن، بعد درستش را بگو.' } },
			{ id: 'pitch', title: { en: 'Tell me about yourself', fa: 'از خودت بگو' }, short: { en: 'About you', fa: 'از خودت' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				does: { en: 'Build your answer to “Tell me about yourself” in three short parts, then say it all at once.', fa: 'جوابت به «Tell me about yourself» را در سه بخش کوتاه بساز و بعد همه‌اش را یک‌جا بگو.' },
				intro: { en: 'Imagine you have an interview at Crestview Group today. Many interviews start with “Tell me about yourself.” Let’s build your answer together, in three short parts: now, before, and why this job. Use your real story, or make one up. It’s just practice.', fa: 'فرض کن امروز در Crestview Group مصاحبه داری. خیلی از مصاحبه‌ها با «Tell me about yourself» شروع می‌شوند. بیا با هم جوابت را در سه بخش کوتاه بسازیم: الان، قبلاً، و چرا این کار. می‌توانی داستان واقعی خودت را بگویی یا یکی بسازی؛ فقط تمرین است.' } },
			{ id: 'scenario', title: { en: 'Your first interview, with a twist', fa: 'اولین مصاحبه، با یک اتفاق غیرمنتظره' }, short: { en: 'Interview', fa: 'مصاحبه' }, skill: 'speaking', minutes: { 15: 5, 20: 5 }, built: true,
				does: { en: 'Meet Erin, the hiring manager, answer her questions, and handle a surprise.', fa: 'با ارین، مدیر استخدام، آشنا شو و به سؤال‌هایش جواب بده؛ وسط کار هم یک اتفاق غیرمنتظره می‌افتد.' },
				intro: { en: 'Imagine it’s your interview at Crestview Group. Erin, the hiring manager, meets you in her office. Talk to her in your own words; the answer you built earlier can help. Something unexpected will happen, so listen carefully.', fa: 'فرض کن امروز روز مصاحبه‌ات در Crestview Group است. ارین، مدیر استخدام، در دفترش تو را می‌بیند. با کلمات خودت با او حرف بزن؛ جوابی که قبلاً ساختی کمکت می‌کند. یک اتفاق غیرمنتظره هم می‌افتد، پس خوب گوش بده.' } }
		],
		professional: [
			{ id: 'listen-retell', title: { en: 'Listen and retell', fa: 'گوش بده و بازگو کن' }, short: { en: 'Retell', fa: 'بازگویی' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				does: { en: 'Hear another candidate’s first minutes in a job interview, then tell how they answered.', fa: 'اولین دقیقه‌های مصاحبهٔ کاری یک متقاضی دیگر را بشنو و بعد تعریف کن چطور جواب داد.' },
				intro: { en: 'Elena, another candidate, has an interview at Greenway Foods. Listen to how her interview starts and what she says about herself. Then tell me the story.', fa: 'النا، یک متقاضی دیگر، در Greenway Foods مصاحبه دارد. گوش بده مصاحبه‌اش چطور شروع می‌شود و دربارهٔ خودش چه می‌گوید. بعد ماجرا را برایم تعریف کن.' } },
			{ id: 'phrases', title: { en: 'Natural phrases', fa: 'عبارت‌های طبیعی' }, short: { en: 'Phrases', fa: 'عبارت‌ها' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				does: { en: 'Hear five natural phrases for the start of an interview, and say each one after Mira.', fa: 'پنج عبارت طبیعی برای شروع مصاحبه بشنو و هر کدام را بعد از میرا تکرار کن.' },
				intro: { en: 'Imagine you have an interview at Crestview Group today. Here are five natural phrases for the first few minutes. Listen, then say each one after me.', fa: 'فرض کن امروز در Crestview Group مصاحبه داری. این پنج عبارت طبیعی برای همان چند دقیقهٔ اول است. گوش بده و هر کدام را بعد از من تکرار کن.' } },
			{ id: 'traps', title: { en: 'Persian-speaker traps', fa: 'اشتباه‌های آشنا' }, short: { en: 'Traps', fa: 'اشتباه‌ها' }, skill: 'speaking', minutes: { 20: 3 }, built: true,
				does: { en: 'Find the mistakes Persian speakers often make when they talk about their experience, and pick the best reply.', fa: 'اشتباه‌هایی را که فارسی‌زبان‌ها موقع حرف زدن دربارهٔ تجربه‌هایشان زیاد می‌کنند پیدا کن و بهترین جواب را انتخاب کن.' },
				intro: { en: 'Imagine you have an interview at Crestview Group today. Here are four small mistakes Persian speakers often make when they talk about their experience, and one reply to choose. Spot each mistake, then say it the right way.', fa: 'فرض کن امروز در Crestview Group مصاحبه داری. این‌ها چهار اشتباه کوچک است که فارسی‌زبان‌ها موقع حرف زدن دربارهٔ تجربه‌هایشان زیاد می‌کنند، و یک جواب که باید انتخاب کنی. هر اشتباه را پیدا کن، بعد درستش را بگو.' } },
			{ id: 'pitch', title: { en: 'Tell me about yourself', fa: 'از خودت بگو' }, short: { en: 'About you', fa: 'از خودت' }, skill: 'speaking', minutes: { 15: 4, 20: 4 }, built: true,
				does: { en: 'Build a clear answer to “Tell me about yourself”: now, before, and why this job. Then say it all at once.', fa: 'یک جواب روشن به «Tell me about yourself» بساز: الان، قبلاً، و چرا این شغل. بعد همه‌اش را یک‌جا بگو.' },
				intro: { en: 'Imagine you have an interview at Crestview Group today. “Tell me about yourself” is often the first real question. Let’s build a clear answer in three parts: now, before, and why this job. Aim for about a minute. Use your real story, or make one up.', fa: 'فرض کن امروز در Crestview Group مصاحبه داری. «Tell me about yourself» اغلب اولین سؤال جدی مصاحبه است. بیا یک جواب روشن در سه بخش بسازیم: الان، قبلاً، و چرا این شغل. سعی کن حدود یک دقیقه شود. می‌توانی داستان واقعی خودت را بگویی یا یکی بسازی.' } },
			{ id: 'scenario', title: { en: 'Your first interview, with a twist', fa: 'اولین مصاحبه، با یک اتفاق غیرمنتظره' }, short: { en: 'Interview', fa: 'مصاحبه' }, skill: 'speaking', minutes: { 15: 5, 20: 5 }, built: true,
				does: { en: 'Meet Erin, the hiring manager, tell her about yourself, and handle a tricky question.', fa: 'با ارین، مدیر استخدام، آشنا شو، از خودت بگو و از پس یک سؤال سخت بربیا.' },
				intro: { en: 'Imagine it’s your interview at Crestview Group. Erin, the hiring manager, meets you in her office. Tell her about yourself, your way; the answer you built earlier can help. She may ask you something tricky, so stay calm and keep it positive.', fa: 'فرض کن امروز روز مصاحبه‌ات در Crestview Group است. ارین، مدیر استخدام، در دفترش تو را می‌بیند. به روش خودت از خودت بگو؛ جوابی که قبلاً ساختی کمکت می‌کند. ممکن است سؤال سختی بپرسد؛ آرام بمان و مثبت جواب بده.' } }
		]
	},
	checkInMinutes: 2,
	recapMinutes: 2,
	// The 15-minute lesson leaves out Traps: the learner still builds and uses their own answer.
	modules: []
};
