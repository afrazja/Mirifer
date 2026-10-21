# New landing page for the English pivot (plan v1)

Status: **approved direction (owner, 2026-10-21); copy and mock-up next.** Mirifer is now an English
course: practice speaking and listening with an AI coach, for real situations, real challenges
(interviews, presenting, persuading, describing) and IELTS-style speaking tests. German is paused
(`src/lib/courses.ts`), but the landing page, the guest demo (`/try`) and `/basics` are still German.

## The owner's decisions

1. **Test practice is opened to learners before the new page launches**, so the page promises only
   what learners can use.
2. **"IELTS-style" wording**: no exam logos, no score or band promises, no partner claims (as the
   module specs already say).
3. **A 2-minute sample with no AI** for visitors (no cost, nothing to abuse), in place of the German
   `/try`.
4. **Language by browser**: `/` English and `/fa` Persian; a visitor whose browser is in Persian is
   offered the Persian page, with a switch on both.

## Who it's for, and the promise

Adult Persian speakers who understand English but freeze when they have to speak: for travel,
work, moving abroad or a speaking test. **"Speak English with confidence: daily practice with an AI
coach, for real situations and international speaking tests."**

## The page (mobile-first, one primary button "Start free", at the bottom in thumb reach)

1. **Hero:** the promise, a short clip or animation of Mira and a learner talking, "Start free"; a
   quiet "Try a 2-minute sample".
2. **The problem:** "You know the words, but they don't come out when you need them."
3. **How a day works:** listen to a real conversation → say it yourself → talk to an AI character
   with a twist. About 15–20 minutes. Screenshots.
4. **Three ways to practice:**
   - Everyday situations (travel, hotels, airports, work): the daily lessons.
   - Real challenges: persuading and telling a story today; interviews and presenting marked as
     coming.
   - IELTS-style speaking: a 2-minute talk from a topic card, quick questions, giving your
     opinion, plus listening practice.
5. **Feedback that helps:** a real example: what you said, a more natural way to say it, one tip
   in Persian.
6. **Made for Persian speakers:** the whole app in Persian, the mistakes Persian speakers often make,
   two levels.
7. **Privacy:** recordings are turned into text and deleted; nothing you say is kept.
8. **FAQ:** level, time, price, "does it replace an IELTS class?", iPhone.
9. **Final call to action.**

## The order of work

1. **Practice area for learners** (prerequisite; **done**: `/practice/english/practice`, seven modules,
   Choose and persuade held back until it has sets of its own; cost controls in #178): the IELTS-style and challenge modules that are
   built in the Module lab (Speaking card, Quick-fire questions, Read-rate-respond, 60-second free
   talk, Listen and retell, Dictation sprint, Choose and persuade, Say it again, better) open to
   learners, behind a quiet "Practice" link next to today's lesson. Reviewed for quality, cost
   (daily AI allowance and clip budget) and abuse before it opens.
2. **Copy and mock-up** for `/` and `/fa`, reviewed by product growth, English coach, Persian
   localization, accessibility and learning UX; the owner approves.
3. **The 2-minute English sample** (no AI, no account): from Day 1's baggage-desk conversation.
4. **Build** `/` and `/fa`: titles and descriptions, sitemap, the browser-language suggestion, and
   three events (landing viewed, sample started, sign-up clicked). `/basics` comes off the page but
   stays online; the German `/try` is replaced.
