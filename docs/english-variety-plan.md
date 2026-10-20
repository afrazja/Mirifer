# Making the daily lessons less predictable (plan v1)

Status: **draft for review, then owner approval.** The owner's concern: when every day has the same
five steps, learners know what's coming, get bored and stop coming back. Adding the remaining
module types alone won't fix it, and building many new module types is too costly.

## The principle

**Predictable controls, unpredictable content.** The buttons, the screens and how each module
works stay the same (the owner's rule: one focused thing per screen, nothing to relearn). What
changes is what happens: the story, the people, the situations and the order of the day.

## The five ideas, cheapest first

### 1. A story that continues, with a hook at the end of each day
- Each week is one story ("Your first trip"), and every day ends on a hook for the next day,
  said by Mira on the recap screen in one line. For example, at the end of Day 3: *"Sara's phone
  rings at 6 a.m. It's not the airline."*
- The next day's check-in opens on that hook (the check-in already links back to the story).
- **Cost:** content only, in each day's world.md. One new field per day (the hook line, in
  English and Persian). No new screens.

### 2. Surprises inside the modules
- **Role-play:** each scene gets **three** possible twists (now two, one per run), one picked at
  random for each run. Characters have a mood picked at random (rushed, friendly, a little
  annoyed), which the AI acts out within limits.
- **Voice messages:** now and then, an unexpected sender (a neighbor, a wrong number), still about
  the day's situation.
- **Listening:** the story sometimes has a small twist the questions ask about.
- **Cost:** more versions of content we already write; a random pick in code. No new screens.

### 3. A day plan that changes shape (from Day 4 on)
- Two fixed points: **listening first, the role-play (or the day's main speaking) last.**
- The **three middle steps change** from day to day, chosen from the 17 module types we already
  have (for example, Day 4 "Asking the way" could use Find the missing information; another day,
  Quick-fire questions or Dictation sprint).
- Rules, so it doesn't feel random: the same middle module never three days in a row; at least
  one module the learner hasn't done for a while each day; each new module type is introduced
  with one sentence from Mira the first time.
- **Cost:** the day pack already lists its own modules, so this is mostly content: each day still
  needs its own content for the modules it uses. The modules not in any lesson yet need a
  "reads from the day" step, as the first nine had.

### 4. Lessons built around the learner's own life
- Mira's check-in, Quick-fire questions and Free talk use what the learner has told us: their
  reason for learning, their job or trip, and what they said yesterday.
- **Cost:** mostly AI instructions. It needs a small, private learner memory (a few short facts,
  kept in the learner's account, visible and deletable), and the privacy page must say so.

### 5. A weekly rhythm with one special day
- Days 1–4: normal days. **Day 5: a "mission"**: one longer role-play (about 8 minutes) that
  brings back the week's people, facts and phrases, with a surprise ending.
- Now and then, after a lesson, a **bonus challenge** from Mira (one minute, optional, never
  blocking): "Can you say that in a different way?"
- **Cost:** the mission reuses the role-play module with a bigger scene; the bonus reuses Say it
  again, better.

## What we won't do

- No new module types for now.
- No changes to how the screens and buttons work.
- No randomness that makes a day harder than its level, or that hides what the learner is
  practicing (the day's goal stays on the plan screen).

## Order of work

1. **Ideas 1 and 2** on Days 1–3 (hooks, a third twist per role-play, moods), before Days 2–3
   are released.
2. **Idea 3** from Day 4, "Asking the way".
3. **Idea 5** with the first full week (Day 5).
4. **Idea 4** when the learner memory and its privacy text are designed.

## How we'll know it works

Count, per learner: whether they come back the next day, and on day 7. Today the daily lessons
send no analytics events (only the learner's last finished day is kept), so step 1 also adds
three events: lesson started, lesson finished, next-day return.

## Open questions for the owner

- Mira's hook line: on the recap screen only, or also as a phone notification later?
- Character moods: is "a little annoyed" OK, or only friendly and rushed?
- The weekly mission: Day 5, or the last day of each theme's story?
