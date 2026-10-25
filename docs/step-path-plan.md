# Step-by-step path (plan, before review)

Owner's decisions (2026-10-25):
- Replace the fixed daily lesson with a **path of short steps** that a learner does at their own pace,
  as many as they like. **The app chooses the order**; learners never pick steps.
- **Daily goal: 1 step a day.** The streak counts days with at least one step done.
- **When new steps run out: offer replays** of finished steps.
- Reviewers judge this plan before anything is built.
- Not now: the phrasebook, tap-a-word, exam-style steps.

Design rules that still apply (CLAUDE.md): mobile-first; one focused thing per screen; one primary
button at the bottom; quiet secondary text buttons; no navigation inside a step.

## What we have today

- **Days** (`src/lib/practice/day.ts`): Day 1 Lost luggage, Day 2 Taking a taxi, Day 3 Checking in at
  the hotel (released); Day 4 Asking the way (not released). Each day has two versions
  (Intermediate, Professional) chosen at onboarding, and a 15- or 20-minute set of modules.
- A day's lesson today: the plan screen (list of parts, Start) → 4 modules in order (each opens with
  Mira's note on its own screen where the module is crowded) → recap ("what you did today", next
  time) → done screen. The 15-minute set is the default; the 20-minute set adds one module.
- **Modules** (the future steps), 3–5 min each: Listen and connect, Natural phrases, Persian-speaker
  traps, Say it in English, Voice messages (Intermediate); Listen and retell, Natural phrases, Tell
  your story, Say it in English, Choose and persuade, Role-play call (Professional).
- One saved lesson per learner (`english_day_v1`): its day, steps done and skipped, stage. Finished
  days in `english_progress_v1.finishedDays`. A step's own answers so far are kept in the browser.
- Daily gate: after a day is done, "come back tomorrow"; finished days can be done again.
- Dashboard (`/practice/english/progress`): Today's lesson card (Day N, name, where a paused lesson
  stopped) · This week (streak: days with a finished lesson) · Lessons finished (tap: list, redo) ·
  one button (Start / Resume Day N). Mira greets by voice only, once a day per situation.
- Pause = the back arrow in a lesson; Resume from the dashboard.

Content per version: **3 released chapters × 5 steps = 15 steps (about 55 minutes)**; Day 4 adds 5.

## The new model

**Chapter** = today's day (same story, same two versions). **Step** = one of its modules, in the
chapter's fixed order, using the full (20-minute) set: 5 steps per chapter per version. The recap
becomes a short **chapter ending** after the last step.

### Screens

1. **Dashboard** (first screen of English, no tabs)
   - **Next step card** (top): "Chapter 2 · Taking a taxi" / big "Step 3 of 5" / the step's name
     ("Say it in English") and its minutes. Mira's small voice button stays here.
   - **This week**: today yellow until a step is done, then green; streak line ("3 days in a row").
     The daily goal is shown here in words: "Today's goal: 1 step" → "Today's goal: done ✓".
   - **Steps done** card: "23 steps" → tap opens the **path** (screen 5).
   - **One button**: "Start step" / "Continue" (a step under way) / "Practice again" (all released
     steps done, see Replays).
   - Mira's spoken lines adapt: "Let's do one step today", "Two steps today, nice", etc.

2. **A step**: opens straight into the module (Mira's note first where the module is crowded, as
   now). The back arrow pauses (the step keeps its place). No plan screen any more.

3. **Step finished** (one screen, after the module's own result):
   - A short line from Mira (text + voice): "Step done." The first step of the day adds "That's your
     goal for today ✓" and the week dot turns green.
   - **Primary: "Next step"** (shows its name). **Quiet: "Done for now"** → dashboard.

4. **Chapter ending** (after the 5th step): "Chapter 2 done: Taking a taxi" with a small
   celebration (motion respects reduced-motion), the chapter's steps ticked, then **"Start
   Chapter 3"** (primary) / "Done for now". This replaces today's recap and done screens.

5. **Path** (from Steps done): chapters as sections, each listing its 5 steps: done (tick), next
   (highlighted), locked (grey). Tapping a done step **replays** it (asks first if a step is under
   way, as the finished-lessons list does now). Locked steps can't be opened.

### Rules

- **Order**: chapter by chapter, step by step. The next step is the first one not done.
- **Skip**: "Skip this step" moves on; a skipped step shows in the path as "skipped" and can be done
  later from there. It does not count toward the daily goal.
- **Daily goal**: 1 step done (not skipped) on the learner's calendar day. The streak counts such
  days. A replay counts toward the goal too (so the streak survives when new steps run out).
- **Replays**: when every released step is done, the dashboard says "You've done every step so far.
  A new chapter is coming soon." and the button becomes **"Practice again: <step>"**, the app's
  choice: the step done longest ago (later: the one with the weakest result). Replays never change
  the path's progress.
- **No daily gate**: no "come back tomorrow"; learners go as far as they like.
- **Version change** (onboarding answers edited): steps are keyed by chapter + module, so done steps
  keep counting; the path shows the new version's steps.

### Data (server, user metadata as now)

- New `english_path_v1`: `{ done: string[]; skipped: string[]; current: { step, startedAt } | null;
  lastStepAt; steps: { [day]: number } }` where a step id is `day-2:phrases`. Small, capped.
- **Migration** on first load: each finished day in `english_progress_v1.finishedDays` marks that
  chapter's steps done for the learner's version; a lesson under way (`english_day_v1`) carries its
  done/skipped steps over. The old fields stay readable for the admin and rollback.
- **Events**: `lesson_progress` stays per step (module, outcome, day); add `step_started` and
  `chapter_completed`. The streak reads steps done (not skipped) per local day. The admin "Lessons"
  tab becomes per step: reached, done, skipped, where learners stop.
- **AI cost**: unchanged per step; more steps per day are capped by the existing daily limits.

### What goes away

The plan screen, the daily recap and done screens, "come back tomorrow", the Lessons finished list
(replaced by the path), the 15/20-minute lesson lengths.

## Questions for the reviewers

1. Is "Step finished → Next step / Done for now" the right rhythm, or should the app suggest stopping
   after N steps (fatigue, cost)?
2. Is the chapter ending enough of a reward? What else, within the one-thing-per-screen rule?
3. Should replays count toward the daily goal?
4. Data model and migration: risks (two devices, a step under way during the switch, rollback)?
5. Anything that breaks the story (steps out of context without the plan screen's framing)?
