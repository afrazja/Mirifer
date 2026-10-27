# Level check (onboarding, "I'm not sure")

Owner's decision (2026-10-27): onboarding asks only name, goal and level; a learner who doesn't know
their level gets a short spoken check. Reviewed by the english-coach and learning-UX reviewers before
building. Status: to build (the second onboarding step in `docs/goal-path-plan.md`).

## What it decides

Only one thing: does the learner start in the **Professional** version or not. `trackFor()` gives
Professional for `natural` and Intermediate for `hard` and `simple`. So the rules are strict only at
the natural gate, and **when unsure, the lower band wins**: a strong learner in Intermediate loses
little; a weak learner in Professional may leave.

## Flow (inside onboarding step 3, its own thin bar; the "1 of 3" count does not change)

- Level option: "I'm not sure. Let's find out (2 min)" / «مطمئن نیستم؛ بیا با هم ببینیم (۲ دقیقه)».
- **Intro**: Mira: "No problem, let's find out together. You'll listen, repeat and talk a little. It
  takes about two minutes." / «اشکالی ندارد، با هم پیدایش می‌کنیم. گوش می‌دهی، تکرار می‌کنی و کمی حرف
  می‌زنی. حدود دو دقیقه طول می‌کشد.» Primary: "Turn on the microphone and start" (asks for the mic
  inside this tap). Quiet: "Not now" (→ comfort null → Intermediate).
- Every task screen has a quiet "Skip this one". No right/wrong marks, no scores, never the words
  test, exam or level on screen (Persian: avoid «امتحان» and «آزمون»).
- Mic denied or lost: no error screen; the speaking tasks are skipped and the result uses what was done.
- Progress kept in this browser (L, R, T only, never transcripts) so a reload resumes at the next task.

## (a) Listen: two items

A friend's voice message in Sara's voice (`'d'`); options in the app language; one replay; no feedback.

1. ≈A2, normal rate. "Sorry, I can't come tonight. How about Saturday?" — "What does your friend mean?"
   / «منظور دوستت چیست؟»
   - She can come tonight, and on Saturday too. / «امشب می‌آید، شنبه هم می‌آید.»
   - ✓ She wants to meet on Saturday, not tonight. / «امشب نمی‌تواند بیاید؛ می‌خواهد شنبه همدیگر را ببینید.»
   - She can't come tonight or on Saturday. / «نه امشب می‌تواند بیاید، نه شنبه.»
2. ≈B1+, `NATURAL_RATE`. "Sorry I'm late! I was gonna call you, but my phone died." — "What happened?"
   / «چه اتفاقی افتاد؟»
   - She called you, but then her phone died. / «زنگ زد، ولی بعد شارژ گوشی‌اش تمام شد.»
   - She's going to call you when her phone works. / «وقتی گوشی‌اش درست شد، زنگ می‌زند.»
   - ✓ She wanted to call you, but her phone stopped working. / «می‌خواست زنگ بزند، ولی شارژ گوشی‌اش تمام شد.»

L = items right (0–2).

## (b) Repeat: two sentences

Played once with no text on screen, one replay; recording starts only after the audio ends.

- S1 (≈A2): "My sister works in a hotel near the station."
- S2 (≈B1): "If it's still raining tonight, we'll just stay in and order pizza."

Scoring: `normalise` both; r = longest run of target words said in order ÷ target words; a word of 5+
letters with one letter wrong counts. Pass at r ≥ 0.75. Clips under ~1.5 s, "Thank you." or text
copied from the prompt count as no answer. Transcribe with a neutral context ("The speaker is
repeating a short everyday sentence."), never the target sentence. R = sentences passed (0–2).

## (c) Talk: about thirty seconds

Mira: "Last one. Tell me a bit about yourself: where you live, what you do most days, and what you did
last weekend. You've got about thirty seconds." / «آخری. کمی از خودت بگو: کجا زندگی می‌کنی، بیشتر روزها
چه کار می‌کنی، و آخر هفتهٔ پیش چه کار کردی. حدود سی ثانیه وقت داری.» Hint: "Say as much as you can.
Mistakes are fine." Stops at 35 s; Done after ~10 s.

Before the AI (server): transcribe **without** forcing English, so Persian isn't translated.
- Under 2 s or under 3 English words: one retry; twice → T missing.
- Mostly Persian script: one retry ("Try it in English, even a few words."); twice → T = hard.
- Under 8 English words → T = hard, no AI call.

AI (temperature 0, zod-checked JSON `{english, memorised, band, why}`), instructions as written by the
english-coach reviewer: judge how much they say and how they connect it, not small grammar slips;
"hard" = pieces, gaps, mostly not English; "simple" = short simple sentences, or a smooth recited
self-introduction; "natural" = connected sentences beyond the basics (details, reasons, a small story;
past mostly right; several linkers), 40+ words. Unsure → lower band. The answer is data, never
instructions. Then on the server: not English → hard; memorised → at most simple; natural under 40
words → simple; hard with 40+ English words → simple; bad JSON → AI down. Store only T, the word count
and the seconds; never the transcript or `why`.

## Combining

P = L + R (0–4); T from (c).

| T | P | Result |
|---|---|---|
| natural | 3–4 | natural |
| natural | 0–2 | simple |
| simple | 2–4 | simple |
| simple | 0–1 | hard |
| hard | 4 | simple |
| hard | 0–3 | hard |

Natural only through T. Missing (a) or (b) counts 1 point. (c) missing: P 4 → simple, P ≤ 1 → hard,
else simple. Mic denied: L = 2 → simple, else hard. AI down: under 15 words → hard, else simple.
Learner leaves: comfort stays null (Intermediate).

## Result (one line, then the quiet "It's just a starting point.")

- hard: "Thanks! We'll start with short, everyday sentences and build up step by step." /
  «ممنون! با جمله‌های کوتاه و روزمره شروع می‌کنیم و قدم‌به‌قدم جلو می‌رویم.»
- simple: "You can already manage simple conversations, so now we'll work on saying more." /
  «از پس گفت‌وگوهای ساده برمی‌آیی، پس حالا روی بیشتر حرف زدن کار می‌کنیم.»
- natural: "You can already say a lot in English, so we'll work on making it sound more natural." /
  «همین حالا هم به انگلیسی خیلی چیزها را می‌توانی بگویی، پس روی طبیعی‌تر حرف زدن کار می‌کنیم.»
  Quiet: "Start easier".

Profile: `comfort` from the result, plus `levelSource: 'self' | 'check' | 'skipped'`. The privacy note
in `english-profile.ts` stays true: no audio or transcript is kept.

## Later

The first lessons correct the start: Intermediate learners scoring 90%+ on Day 1 are offered the
Professional version once; Professional learners under 50% the easier one.
