# The pivot: a path of steps that starts from the learner's goal

Owner's direction (2026-10-27): the app becomes step-based, and each learner's journey starts from
their goal. This builds on `docs/step-path-plan.md` (the step path, reviewed and partly built) and adds
goals and story arcs on top.

## The idea in one line

**Goal → Arc → Chapter → Step.** The learner's goal picks which story comes first; the app then leads
them step by step, one step a day as the goal, with replays when new steps run out.

| Level | What it is | Example |
|---|---|---|
| Goal | What the learner wants English for (onboarding) | Everyday confidence |
| Arc | A short story for one goal: 4 chapters | Everyday: life in the new city |
| Chapter | One situation in that story (today's "day") | Calling to book an appointment |
| Step | One module of the chapter, 3–5 minutes | Natural phrases |

What stays the same for everyone: the step types (listen, phrases, traps, say it in English, the call
with a twist, and so on). They train speaking for any goal. Only the setting and the story change, so
content grows with the number of arcs (about 4), not with the number of learners, and no content is
generated per learner.

## Goals and arcs

| Goal (onboarding) | Arc | Chapters (draft) | Status |
|---|---|---|---|
| Travel | **Travel**: Sara's trip | Lost luggage · Taxi · Hotel check-in · Asking the way | 3 released, Day 4 waits for the owner's phone test |
| Everyday confidence | **Everyday**: small talk and errands | Meeting a neighbour · Booking by phone · A café or shop problem · Making plans with a friend | To build first (most chosen goal) |
| Living abroad | **Life abroad**: settling in | Renting a flat · The doctor · Opening a bank account · A problem with the landlord | Second |
| Work and interviews | **Work**: getting the job | The job interview · First day · A team meeting · A call with a client | Third |
| A speaking exam | Not a story: exam-style speaking (timed answers) | Later, a separate track | Not now (owner's earlier decision) |
| Skipped the question | The first arc that is built for "everyday"; Travel until then | | |

**One character across arcs:** Sara travels, then settles in the city, makes friends, then finds a
job. A learner who keeps going gets one continuing story. Every arc's first chapter stands on its own
(one line of set-up from Mira), because many learners start there.

**Order:** the learner's goal arc first, then the others in a set order (Everyday, Life abroad,
Travel, Work), leaving out arcs not built yet. Within an arc, chapters in order, steps in order. The
app chooses; learners never pick steps (owner's rule).

**Until an arc exists:** a learner whose goal has no arc yet starts with Travel. Onboarding says so
honestly ("Your first chapters are Sara's trip. Everyday chapters are coming."). Today it promises
everyday conversations it doesn't have; that copy is fixed in the first build step.

**Changing the goal:** in Settings. Done steps stay done; the next new step comes from the new goal's
arc.

## What the learner sees

1. **Onboarding** (two questions, as now): Mira asks "What do you want English for?" by voice, five
   choices plus "I'm not sure" (counts as Everyday). Then the level question. Then "Your journey
   starts with: <arc>" and one button.
2. **Dashboard** (owner's layout kept): the Next step card on top (arc and chapter, "Step 3 of 5", the
   step's name and minutes), This week with "Today's goal: 1 step", Steps done (tap: your path), one
   button. A quiet line under the card names the goal: "Your goal: Everyday confidence".
3. **A step**: opens straight into the module; the eyebrow reads "BOOKING BY PHONE · STEP 3 OF 5";
   step 1 of a chapter opens with Mira's one-line set-up. Back arrow pauses.
4. **Step finished**: Mira's line ("That's your goal for today"), primary "Next: <step> · 3 min",
   quiet "Done for now". Skipped steps come back once before the chapter ending.
5. **Chapter ending**: one Mira line from the chapter's goal ("Now you can book an appointment by
   phone."), then "Next chapter" / "Done for now". **Arc ending**: the same, naming the next arc.
6. **Your path**: arcs as sections, your goal's arc first; done steps can be replayed; locked steps
   grey; arcs not built yet don't show.
7. **Nothing new left**: "Practice again: <step>" (skipped first, then the step done longest ago).

## What changes in the code

- **Chapters get an arc** (`arc: 'travel' | 'everyday' | 'abroad' | 'work'`). Existing chapter ids
  stay (`day-1` … `day-4`) so saved progress keeps working; new chapters get ids like `everyday-1`.
  "Day N" disappears from the screens; chapters are named by their situation.
- **`path.ts`**: `releasedChapters()` becomes `journeyFor(goal, preview)`: arcs ordered by the goal,
  each up to its first chapter not ready. Everything else built in #223 stays (steps, next step,
  replays, reading older records, one-step saves).
- **Profile**: goal as now (`reason`), plus "not sure"; editable in Settings.
- **Content per chapter**: the same pipeline as Days 1–4 (a `docs/english-<arc>-<n>/` folder, two
  versions × 5 modules, reviewed by the english-coach and Persian reviewers, the owner's phone test).
  Content is the slow part, not the code.
- **Admin**: the funnel and the Learners table split by goal and arc; steps per arc; where learners
  stop.

## Build order (each ships on its own)

1. **Honest onboarding + arcs in code.** Fix the onboarding promises; add `arc` to chapters and
   `journeyFor`; Travel is the only arc, so nothing else changes for learners. (S)
2. **Both records in step.** The current daily lesson also saves the step path. (S)
3. **Streak from steps; admin reads old and new events.** (M)
4. **The switch to steps:** step screen, Step finished, chapter ending, the dashboard's Next step card,
   intros rewritten for steps done on their own. Owner first, then everyone. (L)
5. **Your path** with replays. (M)
6. **Goal in Settings; Mira asks the goal by voice in onboarding.** (S)
7. **Everyday arc, chapter 1** → released alone as soon as it passes review; chapters 2–4 follow. (Content)
8. **Life abroad**, then **Work**. (Content)
9. **Cleanup** of the daily-lesson code after 2–4 weeks. (S)

Steps 1–6 are code; 7–8 are content and can start in parallel once the owner approves the chapter list.

## Decisions for the owner

1. Next arc after Travel: **Everyday** (recommended: the most chosen goal; nobody has chosen Work yet).
2. **One character (Sara) across all arcs**, or a new main character per arc? Recommended: Sara.
3. Learners who skip the goal question: **Everyday** once it exists (recommended), Travel until then.
4. The Everyday chapter list above: keep, or change?
5. Release Day 4 (Asking the way) now, so Travel has its four chapters?

## Learner numbers behind this (2026-10-26)

Of 14 learners who did onboarding: 6 skipped the goal question, 4 chose Everyday, 2 Travel, 1 Living
abroad, 1 a speaking exam, 0 Work. A small sample, but it points to Everyday first and to making the
goal question harder to skip.
