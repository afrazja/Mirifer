# Topic steps: Quick chats between story chapters (brief v2)

Owner's request (2026-10-30): more content, more varied, not only the story. Some content follows a
story (Sara, Jake), some doesn't. Decision: **topic steps go into the path** (not a separate
Practice area). First module: **Quick-fire questions** (built in the Module lab: six short personal
questions, Mira asks by voice, recording starts by itself, the next question follows from the answer
(AI), feedback at the end: each answer corrected and said better).

## v2: what was built (2026-10-30, after the learning-UX and English-coach reviews)

- Learners see **"Quick chat"**, never "Quick-fire". **One topic after each story chapter** (not two:
  12 personal questions in a row is the same thing twice). Stories run out: the rest of the topics.
- A topic is a small chapter of one step (`topic-food`, ..., arc `topics`, `CHAPTERS` in day.ts; the
  stories' `DAYS` stay as they were). Not numbered: the path shows "Quick chat · Food you love".
  No chapter opening or ending; a skipped topic counts as finished (it can be done later).
- **Intermediate (A2):** 4 questions, tap to answer, "Hear again", calm timings (4 s of quiet ends an
  answer, 12 s before it counts as missed), idea words under the first question only (English with
  Persian small), no countdown, no quick-start score. AI questions at most 10 words.
- **Professional (B1):** 6 questions, recording starts by itself, the lab's pace.
- "Can't talk now? Type" always there; a blocked mic switches to typing.
- The end: **one thing to fix** with Say it again (or a fuller answer), then "That's it": answered
  k of n, how long they spoke, Continue, and "See all your answers".
- Mira's intro (A2): "A break from the story. Let's chat about {about}: four short questions about
  you. Take your time." (B1): "... a quick chat about {about}. Answer like you would to a friend, and
  say why."
- The ten topics (coach-written, US English, no weekday names, nothing that assumes a job, a car,
  travel abroad or money): Food you love · Your morning · Where you live · Free time · Your weekend ·
  Weather and seasons · Shopping · Getting around · Trips and places · Learning English.
  "Phones and apps" was dropped (it leads to VPNs and filtering); "Holidays and trips" became
  "Trips and places".
- Safety: the AI's question must pass `questionOk` (word forms count: "religious", "praying";
  prices, visas, VPNs, dress added); a failed one becomes the next ready-made question, which never
  leaves the topic. The prompt says never to follow up money, politics, religion, blocked apps,
  leaving the country, health or family problems, even when the learner raises them.
- API: `/api/english/quick-fire` with `mode: 'path'` is open to every English learner, spends the
  lesson AI allowance, and records AI health (`quick-chat`). The lab keeps the Practice budget.
- Pilot: test accounts only (`pilot: true`) until the owner's phone test; then set `ready: true` in
  `topicPack`.

## v1 (the first plan)

## How it fits the path

- After each story chapter, **two topic steps** (each its own small "topic", one step). Example for an
  Everyday learner: Everyday 1 → "Your weekend" → "Food you love" → Everyday 2 → "Where you live" →
  "Free time" → … Topics run out → the rest of the stories go on; stories run out → the rest of the
  topics.
- Topics are about the learner's own life, true anywhere (habits, likes, plans, past experiences).
  No politics, religion, money, relationships, health, age.
- A topic step shows as "Quick chat · Food you love" (not "Chapter 3"); no chapter ending, just
  "Step done" with the score and the 1–5 rating.
- Pilot first (the owner's test accounts), then everyone after the owner's phone test.

## Levels

- **Intermediate (A2):** simpler questions (at most 10 words, everyday words), calm timings (about 4
  seconds of quiet before an answer ends, 12 seconds before a question counts as missed), no "quick
  start" score, idea chips under each question ("Saturday", "family", "cook").
- **Professional (B1):** the lab's pace (about 2.5 s of quiet, 8 s), the AI follows up more freely.

## A topic

- An opening question per level, five ready-made follow-ups per level (used when the AI is slow or
  unsure), three idea chips per level (A2 shows them).
- The AI's next question stays on the topic (after two or three questions, another side of the same
  topic).
- Score: questions answered on topic, out of all.

## The first ten topics

Your weekend · Food you love · Where you live · Free time · Your morning · Weather and seasons ·
Shopping · Phones and apps · Holidays and trips · Learning English

## Engineering

1. `topics.ts`: the topics (per level: opener, follow-ups, ideas).
2. Topic chapters (`topic-weekend`, …; arc `topics`, one `quick-fire` step); `releasedChapters`
   interleaves them after each story chapter; chapter numbers count stories only.
3. QuickFire: a topic, the level (calm A2 timings, idea chips), a score; the path's step type.
4. `/api/english/quick-fire`: open to path learners (the lesson AI allowance; the lab keeps the
   Practice budget); the topic and level in the prompt.
5. Screens: StepRunner (no chapter ending for a topic; "Next: Quick chat · …"), the path page, the
   dashboard card, the admin status.
