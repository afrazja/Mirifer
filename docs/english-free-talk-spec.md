# "60-second free talk": spec v1

Status: the owner asked for it to be built. The reviewers' must-fix points are applied before shipping. Module lab first. In the daily lesson it will be the last step before the recap (owner's decision).

## Purpose

From the owner's design document: the **"Session Boss Level"**. *Conclude a practice session with an unexpected topic prompt where the learner speaks continuously for 60 seconds. This creates an exciting session climax while yielding concrete data on total word count and pause frequency.*

How it differs from the other speaking modules:
- **No preparation.** The topic is a surprise.
- **Exactly 60 seconds.**
- **It trains fluency**: starting at once and keeping going without freezing.
- **The feedback is numbers.** It counts words and long pauses and compares them with the learner's own earlier runs. There is no grammar or content judging.
- **No AI judging.** Only speech-to-text is used, so a run costs under a cent.

## Topics (lab set)

Twelve light, everyday topics anyone can talk about at B1 without preparing. A run never repeats the previous topic.
1. Your favourite time of day
2. Something you bought recently
3. The best advice someone gave you
4. A food from your childhood
5. Your perfect weekend
6. Something that always makes you laugh
7. A place where you feel calm
8. The last film or series you watched
9. Your morning routine
10. Something you're looking forward to
11. A rule you'd change in your city
12. A skill you'd love to have

## The flow

The owner's design rule applies: one focused thing per screen, and one primary button at the bottom.

**1. Ready.**
- Mira, spoken from the tap that opened the module: "Boss level! When you tap Start, you'll see a surprise topic. Talk about it for sixty seconds, and try not to stop."
- If there are earlier runs: "Your best so far: 112 words."
- Bottom: "Start". That tap asks for the microphone.

**2. The topic and 3-2-1.**
- The topic appears in large text, with a big countdown: 3, 2, 1.
- Recording then starts by itself; the microphone was already allowed in the Start tap.

**3. Talking** (60 s).
- The topic stays on screen. A ring fills over 60 s, and the last 10 s are counted down.
- After 3 s of quiet, a gentle visual "Keep going!" appears. Nothing makes a sound.
- It stops by itself at 60 s. A quiet "Stop" is there for emergencies.

**4. Result.**
- Two big numbers: **words** and **long pauses** (a pause is long at 2 seconds or more, counted only between the first and last words).
- The comparison:
  - "Last time: 85 words, 6 pauses";
  - "New best!" when the word count beats every earlier run.
- One line from Mira, chosen in code by the outcome, for example:
  - more words than last time: "You said more than last time. That's real progress.";
  - fewer pauses: "Fewer long pauses than last time. You kept it flowing.";
  - a first run: "That's your first score. Next time, try to beat it.";
  - otherwise: "Every minute of talking makes the next one easier."
- A quiet "What I heard" shows the transcript.
- Bottom: "Another topic". Quiet: "Finish".

## Data and checks

- **Words:** counted in code from the transcript, which is English only.
- **Long pauses:** counted in the browser from the microphone level, the same measurement the other modules use for silence.
- **Silence:** a run with less than 5 s of actual speech is never sent: "I could hardly hear you. Check your microphone, then try again."
- **Interruptions:** the page hidden, a muted mic or mic denied work as in the other modules.
- **Saved in this browser** (the lab's own key): the last 20 runs (topic, words, pauses, seconds). Never the recording.
- **Server:** one route that only transcribes (up to 70 s of audio). There is no AI call.

## Reviewers' points applied (v1.1, built)

**Topics**
- "A rule you'd change in your city" is replaced by "How you get around your city": the old topic invited politics, which feels unsafe for a recorded Iranian learner.
- Favourite time of day → favourite season.
- Best advice → an app you use every day.
- Makes you laugh → makes you smile.

**Mira's line:** "Final challenge! When you tap Start, you'll see a surprise topic. Talk about it for one minute and just keep going. Mistakes are fine. Recording starts by itself."

**The Start tap**, in this order:
1. stops Mira;
2. asks for the microphone (the topic never shows behind the permission prompt);
3. creates and resumes the level meter (needed on iPhones);
4. shows the topic.
The same stream then records after 3-2-1. A page hidden during the countdown goes back to Ready.

**While recording**
- Nothing is announced to screen readers, since the mic would record it.
- The screen shows "● Recording".
- The hint "Keep going! Say why, or give an example." appears only after the learner has started talking, at 5 s of quiet, and stays at least 1.5 s.

**Counting**
- Words are counted by fixed rules: fillers (um, uh…) are removed, and a word said twice in a row counts once.
- A run stopped before 50 s is saved, but never counts as "best" or "last time".

**Result**
- Two numbers, with "last time" under each.
- One line from Mira, chosen in code:
  - "New best" only when the run beats every earlier full run;
  - fewer pauses is praised only if the word count held at 90% or more of last time;
  - no claims of "progress" from a single run.
- The meaning of the numbers is shown on the first run, then behind "What do the numbers mean?".
- "What I heard" carries a note that speech-to-text isn't perfect.
- "Your usual" (the median of the last five full runs) shows on Ready from the third run.

**Daily lesson (later):** the last step before the recap, with a quiet "Not now" on Ready and "Continue" as the primary button.
