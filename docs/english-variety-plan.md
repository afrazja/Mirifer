# Making the daily lessons less predictable (plan v2)

Status: **v2, approved by the owner (decisions at the end of the file).** Reviewed by product
growth, learning UX and system design. The owner's concern: when every day has the same five steps, learners
know what's coming, get bored and stop coming back. Building many new module types is too costly.

## The principle (all three reviewers agree)

**Predictable controls, unpredictable content.** The buttons, screens and how each module works stay
the same: a fixed routine costs an A2 learner no effort. What changes is what happens: the story,
the people, their mood, and (later) some steps of the day. Never a surprise about **what to do,
how it's scored, or how hard it is.**

## What the reviews added

Predictability is a real risk, but mostly from **week 2–3**. The code shows bigger reasons to quit
**today**:
1. **Learners can only do Day 1.** Days 2–3 aren't released, so the next day is Day 1 again: the
   most predictable thing in the app.
2. **Sessions run longer than promised.** Every lesson is meant to be 15 minutes; Day 1 took
   18–23 and Days 2–3 about 22–25.
3. **Nothing brings learners back** (no reminder) and **nothing shows progress** (no week view).
4. **We can't see where learners stop**: the daily lessons send no lesson or step events.
5. **No review of earlier days**: yesterday's phrases never come back.

## The plan, in order

### Step 1: groundwork (before any variety)
- **Release Days 2–3** after the owner's phone test.
- **Measure:** the server records `lesson_started`, one `lesson_progress` per step (done or
  skipped) and `lesson_completed`, with day, version and length. Next-day and day-7 return are
  worked out from these in a report. Collect 1–2 weeks of data as a baseline.
- **Shorter lessons:** one middle step fewer (owner's decision below; done).

### Step 2: the story hook (small)
- Every day ends on one line from Mira about tomorrow ("Sara's phone rings at 6 a.m. It's not the
  airline."). It goes on the **done screen**, in place of "Come back tomorrow", with tap-to-hear:
  one thing on the screen. The next day's check-in opens on it.
- Shown only when the next day is open for this learner (no promises about days that don't exist).
- Later, the same line is the text of a reminder.

### Step 3: surprises inside the modules
- **Mira's question uses what the learner already told us** (their reason for learning: travel,
  work, exam, moving abroad). No new storage.
- **Role-play (Professional):** a third twist per scene, never the same twist twice in a row; the
  easiest one on the first run. A **mood** for the character (friendly, busy, mildly impatient),
  named on the scene card ("Ryan is very busy today"). Mood changes only tone: never speed,
  vocabulary or sentence length, never aimed at the learner, and never "impatient" on Day 1.
- **Voice messages (Intermediate, where most learners are):** a pool per day, so the senders and
  messages change between learners and replays; Mira's intro always names who is calling.
- **Earlier days come back:** one item from an earlier day inside Say it in English or Traps
  ("From Day 1"). This is real learning and less predictable.
- Dropped for now: twists in the listening story (a whole second listening set per day).

### Step 4: a week strip and visible progress
- The plan screen shows "Your first trip · Day 2 of 7" and the week's can-do goals, ticked as they
  are reached.

### Step 5: changing middle steps (from Day 4, only if the data shows week-2 boredom)
- **Written into each day, per version, not picked by code at random**, so every day is reviewed
  and saved sessions stay valid. A test checks the rules.
- Rotate **within a slot**: the listening step and Natural phrases never rotate. Slots: notice
  and fix (Traps, Spot the lie, Connected speech, Dictation sprint); guided use (Say it in
  English, Find the missing information, Quick-fire questions).
- At most **one** module the learner hasn't met per day; it comes back within 2–3 days; its first
  time has a short demo and an unscored first item, and the plan screen marks it "New".
- Each newly used module needs code work to read from the day (about as much as the first nine
  had), so the cheap ones come first.

### Step 6: the week's mission (with the first full week)
- On the **last day of each theme's week** (merged with the themes plan's "big day").
- **Three short scenes of 2–3 minutes**, each saved, with the week's people and phrases, and a
  surprise ending to listen to. Intermediate gets guided tasks, not a free role-play.

### Later: Mira remembers (needs an owner decision on privacy)
- A few short facts the learner **confirms** ("Mira will remember: you're a nurse. Keep / Don't"),
  in their account, visible and deletable, at most 5. No stored chats or audio.
- This changes today's rule that nothing typed or said is kept; job and moving-abroad plans are
  sensitive for learners in Iran, and the facts would reach the AI providers.

## How we'll know it works

Next-day and day-7 return per learner, step-by-step completion, and skip rate by step. With few
learners these numbers are signals, not proof: read them with what learners tell us.

## The owner's decisions

1. **Order:** groundwork first (release Days 2–3, measure, keep to the chosen length), then the
   hook and the surprises; changing middle steps only if the data shows week-2 boredom.
2. **Session length:** learners don't choose a length (onboarding stopped asking; every lesson is
   15 minutes). So **every lesson drops one middle step**: Intermediate leaves out Persian-speaker
   traps, Professional leaves out Say it in English. Lessons now take about 16–21 minutes, and
   onboarding says "about 15 to 20 minutes". (Done.)
3. **Intermediate role-play:** only in the week's mission (guided and short); daily Intermediate
   lessons stay without one.
4. **Mira remembers:** later, with a privacy design. For now Mira uses only what onboarding asks
   (the learner's reason for learning).
5. Still open: the conflicts with the themes plan (v3.2: six merged modules; the big day on Day 7).
   This plan uses the existing module types and the last day of each week.
