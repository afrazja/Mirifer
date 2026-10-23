# Landing page copy (v2, English and Persian)

> **Card layout (2026-10-21, owner's request):** the page became five card sections (yellow at first; since 2026-10-22 a green first screen on a white page). The problem section was dropped, the step texts and Day 1 line were shortened, Practice became four cards plus a "Coming soon" card (adding "Common mistakes"), and three short badges sit around the phone. The live words are in `src/lib/landing/copy.ts`.

> **Practice off for learners (2026-10-23, owner's decision):** the daily lesson is the one way to learn for now, so the page no longer offers extra practice. The Practice section describes what learners practice inside the lessons, and exams are named only in general words (no "IELTS"), with exam-style speaking listed as coming soon. The tables below are updated to match.

Status: **v2, approved by the owner (2026-10-21)** after review (product growth, English coach,
Persian localization, accessibility, learning UX). Plan: `docs/landing-plan.md`. Every line must be
true of the app today. Exams in general words only (no exam named), no exam logos, no score or
band promises, no affiliation claims. US English. `/` English, `/fa` Persian (written for Persian readers); a visitor
whose browser is in Persian is offered `/fa`, never redirected.

**One primary button: "Start free" / «رایگان شروع کن».** It stays at the bottom of the screen
while the visitor scrolls (only one is ever visible; it hides while the hero's or the final
button is on screen). Quiet text links: the sample, sign in, the language switch.

---

## 1. Hero

| | English | فارسی |
|---|---|---|
| Eyebrow | ENGLISH SPEAKING PRACTICE WITH AN AI COACH | تمرین مکالمهٔ انگلیسی با مربی هوش مصنوعی |
| Headline | You know English. Now speak it. | انگلیسی بلدی. حالا وقت حرف زدن است |
| Line | Short daily speaking lessons with Mira, your AI coach, for travel and everyday life. | درس‌های کوتاه روزانهٔ مکالمه با میرا، مربی هوش مصنوعی‌ات؛ برای سفر و زندگی روزمره. |
| Button | Start free | رایگان شروع کن |
| Quiet link | Try a 2-minute sample (no sign-up) | یک نمونهٔ دودقیقه‌ای امتحان کن (بدون ثبت‌نام) |
| Small print | Free for now · No payment details · Nothing to install | فعلاً رایگان، بدون پرداخت، بدون نصب |

**The picture** (a labelled figure, from Day 1's "Say it in English"; screen readers get "Mira:"
and "You:" labels and a caption):

| | English page | Persian page |
|---|---|---|
| Mira ▶ | Tell the agent one of your bags didn't arrive. (with the Persian prompt above it: «به کارمند بگو یکی از چمدان‌هایت نیامده.») | «به کارمند بگو یکی از چمدان‌هایت نیامده.» |
| You 🎤 | Hi, one of my bag didn't come. | Hi, one of my bag didn't come. |
| A natural way to say it | Hi, one of my bags didn't come. | شکل طبیعی‌تر: Hi, one of my bags didn't come. |
| Tip | After "one of my", say bags, not bag. | نکته: بعد از one of my اسم جمع می‌آید: bags، نه bag. |

## 2. The problem

| | English | فارسی |
|---|---|---|
| Heading | You know the words. But when you need to speak, they don't come. | کلمه‌ها را بلدی، ولی موقع حرف زدن به زبانت نمی‌آیند |
| Text | Most of us learned English from books. But speaking is a different skill. You build it by speaking a little every day and hearing how to say it better. | بیشترِ ما انگلیسی را از کتاب یاد گرفته‌ایم. ولی حرف زدن مهارت دیگری است و راهش این است که هر روز کمی حرف بزنی و بشنوی چطور می‌شود بهتر گفت. |

## 3. How a day works

Heading: **About 15 minutes a day** / **روزی حدود ۱۵ دقیقه**

| Step | English | فارسی |
|---|---|---|
| 1 | **Listen.** Hear a real-life conversation: at the airport, in a taxi, at a hotel desk. | **گوش بده.** یک گفت‌وگوی روزمره بشنو: در فرودگاه، در تاکسی، در پذیرش هتل. |
| 2 | **Say it.** Say what you need in English. Mira shows you a natural way to say it, with a short tip when it helps. | **بگو.** حرفت را به انگلیسی بزن. میرا شکل طبیعی‌ترش را نشانت می‌دهد و هر جا لازم باشد یک نکتهٔ کوتاه هم می‌گوید. |
| 3 | **Talk.** Reply to voice messages. At the Professional level, you also talk to an AI character who has a surprise for you. | **گفت‌وگو کن.** به پیام‌های صوتی جواب بده. در سطح «حرفه‌ای» با یک شخصیت هوش مصنوعی هم حرف می‌زنی که قرار است غافلگیرت کند. |
| Day 1 | Day 1: your suitcase didn't arrive. You describe it and ask when you'll get it back. Each day continues the story, and new days are on the way. | روز اول: چمدانت نرسیده. آن را توصیف می‌کنی و می‌پرسی کِی پسش می‌گیری. هر روز ادامهٔ همان ماجراست و روزهای تازه در راه است. |
| What you need | You need a microphone and a quiet place. You can stop between steps and come back later. | یک میکروفون و جایی آرام لازم داری. بین بخش‌ها می‌توانی دست نگه داری و بعداً ادامه بدهی. |

## 4. Practice

| | English | فارسی |
|---|---|---|
| Heading | What you practice in the lessons | در درس‌ها چه تمرین می‌کنی |
| Card 1 | **Speak your mind:** tell a short story from your life, then tell it again, clearer. Or choose for a friend, and say why. | **نظرت را بگو:** ماجرای کوتاهی از زندگی‌ات تعریف کن و بعد یک بار دیگر روشن‌تر بگو. یا برای یک دوست انتخاب کن و بگو چرا. |
| Card 2 | **Natural phrases:** hear useful sentences for each situation, and say each one after Mira. | **عبارت‌های طبیعی:** جمله‌های کاربردی هر موقعیت را بشنو و هر کدام را بعد از میرا تکرار کن. |
| Card 3 | **Listening:** hear a conversation or a story, then show what you caught, or retell it in your own words. | **تمرین شنیداری:** یک گفت‌وگو یا داستان بشنو، بعد نشان بده چه فهمیدی، یا با کلمات خودت تعریفش کن. |
| Card 4 | **Common mistakes:** find the small mistakes that are easy to make, and say the sentence the right way. | **اشتباه‌های رایج:** اشتباه‌های کوچکی را که زیاد پیش می‌آید پیدا کن و جمله را درست بگو. |
| Coming soon | Exam-style speaking, job interviews and presentations. | اسپیکینگ به سبک آزمون، مصاحبهٔ کاری و ارائه. |

(Section 5, "Made for Persian speakers", was removed from the page by the owner on 2026-10-21.)

## 6. Privacy

| | English | فارسی |
|---|---|---|
| Heading | Your voice stays yours | صدایت مال خودت است |
| Text | To understand you, your recording is sent to an AI service that turns it into text. Then it's deleted. Mirifer keeps no recordings, and never sells or shows what you say to anyone. | برای اینکه حرفت فهمیده شود، صدای ضبط‌شده‌ات به یک سرویس هوش مصنوعی فرستاده می‌شود تا به متن تبدیل شود و بعد پاک می‌شود. میریفر هیچ فایل صوتی نگه نمی‌دارد و حرف‌هایت را به کسی نمی‌فروشد و نشان نمی‌دهد. |
| Link | How we handle your data | با اطلاعاتت چه می‌کنیم |

## 7. Questions

Heading: **Questions** / **سؤال‌های رایج**

| English | فارسی |
|---|---|
| **What level do I need?** If you can understand simple English but find speaking hard, start with Intermediate. When you start, one question helps you choose. | **چه سطحی باید داشته باشم؟** اگر انگلیسی ساده را می‌فهمی ولی حرف زدن برایت سخت است، با «متوسط» شروع کن. اول کار یک سؤال کمکت می‌کند انتخاب کنی. |
| **How long does it take?** About 15 minutes a day, one lesson at a time. | **چقدر وقت می‌گیرد؟** روزی حدود ۱۵ دقیقه، هر بار یک درس. |
| **Is it free?** Yes, for now, with no payment details. We're early, and we're learning from our first learners. If that changes, we'll tell you long before it happens. | **رایگان است؟** بله، فعلاً رایگان است و پرداختی لازم نیست. تازه راه افتاده‌ایم و از اولین کاربرانمان یاد می‌گیریم. اگر روزی تغییر کند، خیلی پیش از آن خبرت می‌کنیم. |
| **Does it help with speaking exams?** It builds the everyday speaking that every speaking exam needs, but it isn't an exam course, and it can't predict your result. Exam-style practice will come to the lessons later. | **برای آزمون‌های اسپیکینگ هم کمک می‌کند؟** همان حرف زدن روزمره‌ای را تقویت می‌کند که هر آزمون اسپیکینگی لازم دارد، ولی دورهٔ آمادگی آزمون نیست و نتیجهٔ آزمون را پیش‌بینی نمی‌کند. تمرین به سبک آزمون بعداً به درس‌ها اضافه می‌شود. |
| **Does it work on iPhone?** Yes. It works in the browser on iPhone and Android, with your microphone. Nothing to install. | **روی آیفون کار می‌کند؟** بله. در مرورگرِ آیفون و اندروید با میکروفون کار می‌کند. لازم نیست چیزی نصب کنی. |
| **Is there a daily limit?** Mira's feedback has a daily limit, set so your daily lesson always fits. | **محدودیت روزانه دارد؟** بازخورد میرا سقف روزانه دارد، ولی طوری تنظیم شده که درس روزانه‌ات همیشه جا شود. |

## 8. Final call

| | English | فارسی |
|---|---|---|
| Heading | Start your first lesson today. | همین امروز اولین درست را شروع کن |
| Line | It takes about 15 minutes. | حدود ۱۵ دقیقه طول می‌کشد. |
| Button | Start free | رایگان شروع کن |
| Footer | Privacy · Terms · Mirifer is not affiliated with any exam board. | حریم خصوصی، شرایط استفاده. میریفر وابسته به هیچ نهاد برگزارکنندهٔ آزمون نیست. |

## Page details

- **Title:** "Mirifer: English speaking practice with an AI coach" / «میریفر | تمرین مکالمهٔ انگلیسی با مربی هوش مصنوعی»
- **Description:** "Practice speaking English out loud with Mira, your AI coach: short daily lessons for travel and everyday life, with feedback. Free for now." / «با میرا، مربی هوش مصنوعی‌ات، انگلیسی را بلند تمرین کن: درس‌های کوتاه روزانه برای سفر و زندگی روزمره، با بازخورد. فعلاً رایگان.»
- **hreflang** en, fa and x-default.
- **Gone from the page:** the German demo and grammar links, "120 lessons", spaced repetition.

## What the build must also do (from the reviews)

- **Page language from the URL**, not from the learner's saved setting: `/` is `lang="en"`,
  `/fa` is `lang="fa" dir="rtl"`. Use `lang`/`hreflang` on the switch links, `<bdi lang="en">` for
  English words inside Persian text, and the real titles.
- **The hero picture as a labelled figure**, with "Mira:" and "You:" labels for screen readers
  and the avatars hidden from them.
- **Tap targets:** at least 44px for every link, the FAQ questions, the language switch and the
  footer.
- **Focus:** a high-contrast focus ring (`--accent-deep`, 3px).
- **Persian layout:** no overflow at 200% text, using the self-hosted Vazirmatn.
- **The bottom bar:** room for it (`scroll-padding`); hidden (`inert`) while another "Start
  free" is on screen.
- **Onboarding:** its summaries must not promise what the first lesson isn't. "Work and
  interviews" currently says the course will start with work situations, but every learner starts
  with Day 1 at the airport. Say "We'll start with a travel story; IELTS-style practice is in
  Practice". (Superseded 2026-10-23: Practice is off for learners and no exam is named; the
  exam answer now says exam-style practice will come to the lessons later.)
- **Events:** landing viewed, sample started, sample finished, sign-up clicked, tagged with the
  page language, followed by the lesson events that already exist.
- **Check from Iran:** whether the page, sign-up (including Google sign-in) and the app load from
  an Iranian connection without a VPN. If not, add a FAQ answer.

## The 2-minute sample (step 3), screen by screen

There is no AI and no account. Sounds start only from a tap, and nothing is recorded or sent.
Every screen has one button at the bottom, five progress dots and a ✕.

1. **Listen.** Mira: "Sara has just landed. One of her bags is missing. Listen: what does it look like?" ▶ plays the first lines of Day 1's baggage-desk conversation. A quiet "Show the words" link is available.
2. **One question.** "What does the missing bag look like?" The three choices come from Day 1. A wrong answer is explained, and the learner can try again.
3. **Say it.** "Now it's you at the desk": "Hi, only one of my bags came out." ▶ Hear Mira, then 🎤 Say it. The recording stays on the phone.
4. **Hear yourself.** ▶ Compare plays Mira, then you. The screen says plainly: "In the app, Mira checks what you say. Here, just compare." Nothing is checked.
5. **Example feedback.** Labelled "Example": the hero's example, with its tip, in Persian on `/fa`.
6. **Hand-over.** "That was the start of Day 1. The full lesson is about 15 minutes, and Mira checks what you say." Button: **Start Day 1 free**.
