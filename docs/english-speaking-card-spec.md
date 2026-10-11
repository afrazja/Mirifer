# "Speaking card": spec v2

Status: **approved by the owner and built (Module lab).** v1 was reviewed by the English-coach and learning-UX reviewers, and their points are applied (see the end). Module lab first.

## Purpose

From the owner's design document: *give the learner a topic, allow one minute to prepare, then ask for one to two minutes of continuous speech.* It mirrors IELTS Speaking Part 2, but the app never mentions IELTS, bands or scores.

**How it differs from "Say it again, better":** that module *answers a question* and works on **accuracy**. The Speaking card *explains a topic* and works on **long-turn skills**:
- covering every point on the card;
- organising the talk so a listener can follow it;
- keeping going for at least a minute.

Grammar is **not** corrected here. Following the owner's rule (no mistake may look approved), the screens say so plainly.

Success on the second talk:
- all four points covered;
- at least 1:00, or longer than the first talk if that was under a minute;
- the suggested organising phrase used.

## Cards (lab set)

Six B1 everyday topics. Each card has three "You should say" points and one "and explain…" point. The cards come in this order; a quiet "Another card" moves to the next one.

| # | Title | Points |
|---|---|---|
| 1 | Describe something you're good at. | what it is · how you learned it · how often you do it · **and explain** why it's useful or important to you |
| 2 | Describe a place in your city that you like. | where it is · what it looks like · what you do there · **and explain** why you like it |
| 3 | Describe a useful object you own. | what it is · when you got it · how you use it · **and explain** why it's useful to you |
| 4 | Describe a person you admire. | who the person is · how you know them, or know about them · what they do · **and explain** why you admire them |
| 5 | Describe a trip that didn't go as planned. | where you went · what you'd planned to do · what went wrong · **and explain** what you learned from it |
| 6 | Describe a celebration you enjoy. | what it is · when it happens · what people do · **and explain** why you enjoy it |

## Organising phrases (fixed list, in code)

Each phrase has an id, a job, a matcher (a pattern on the normalised transcript) and a Persian reason. The AI never writes a phrase; it only chooses one from this list.
- **Starting:** I'd like to talk about… · I'm going to tell you about… · I've chosen…
- **Moving on:** First of all,… · After that,… · Another thing is… · As for… · The next thing is…
- **Reasons and examples:** That's because… · The main reason is… · For example,… · Because of that,… · That's why…
- **The "explain" point:** What I like most is… · It's important to me because… · The hardest part was… · Looking back,… (past cards only) · The best thing about it is…
- **Ending:** So, that's why… · So overall,… · That's about it, really.

**How the job is chosen (in code, from the coverage result):**
- the "explain" point is missing or thin → a reason or "explain" phrase;
- no signposting between points → a moving-on phrase;
- the talk stopped abruptly → an ending phrase;
- otherwise → a starting phrase.

Within that job, the code picks a phrase the learner **didn't** already use.

## The flow

The owner's design rule applies: one focused thing per screen, one primary button at the bottom, quiet text buttons for anything else. Focus moves to each new screen's heading, and to Stop while recording.

**1. The card and preparing** (one layout; the card stays put).
- Mira's instruction at the top, spoken from the tap that opened the module: "Here's your topic. You've got a minute to think first. Then talk for one to two minutes, and try to cover all four points." On later cards, only: "Here's your next topic."
- The card: the title in large text and the four points as a list (in the Persian UI, a quiet "Show in Persian" toggle for the points).
- Quiet: "Another card".
- Bottom: "Start preparing". That tap also unlocks audio and asks for the microphone (then releases it), so the permission prompt never eats talk time.
- **Preparing:** a small countdown ring appears beside the title (60 s). A quiet "Write a few keywords" opens a notes box (placeholder: "Keywords, in English or Persian"). It's never focused automatically, and while the keyboard is open the card shrinks to title and points. The notes stay on this device and are never sent.
- The bottom button is **"Start talking"** throughout: it starts recording in that same tap. When the minute is up, a soft tone plays (before recording starts, never during) and the ring shows "Time's up".

**2. Talk** (up to 2:00).
- The card and the notes stay visible as a reference; there's nothing to tick or watch.
- A small elapsed clock beside Stop (no big ring). At 1:00 a quiet "1 minute ✓" appears. In the last 15 s: "Finish your sentence…". It stops by itself at 2:00.
- **Nothing makes a sound while recording.** There are no tones and no Mira, and screen readers get only "One minute" and, once, "15 seconds left".
- **Early Stop (between 0:20 and 0:50):** the recording pauses, and the heading becomes "Paused", with the card still visible: "You've still got time. Is there a point you haven't talked about yet?" Primary: "Keep going", which carries on with the same recording; quiet: "I'm done". This is asked only once per talk, and paused time doesn't count. Where the browser can't pause a recording, the fallback is the "Say a bit more?" pattern from "Say it again, better".
- **Under 20 s:** "That was too short for me to give you feedback. Try again, and aim for about a minute." Button: "Try again".
- **Long silence:** after about 10 s of quiet, a silent visual hint appears: "Stuck? Try the next point." A take with less than about 15 s of actual speech is never sent.

**3. What you covered.**
- The four points, each with ✓ and "You said: '…'" (the ✓ is on the point, never on their words), or "You didn't talk about this."
- If one part blocked the meaning, a line under that point: "I wasn't sure what you meant by '…'."
- The length:
  - "You spoke for 1:20.";
  - or "You spoke for 0:48. Next time, try to keep going past a minute."
- One line: "I checked what you talked about, not your grammar. For grammar, try 'Say it again, better'."
- Bottom: Next.

**4. Making it easier to follow.**
- One organisation line (at most 25 words), e.g. "You went from how you learned it to why it matters. That's easy to follow." or "You started with why you like it, then said where it is. Next time, try following the card's order."
- **One organising phrase** from the list, with ▶ and a short reason (Persian first in the Persian UI).
- Bottom: "Talk again".

**5. Talk again** (a ready state first).
- The same card. Points they missed carry "Don't forget this one"; the phrase shows as one chip.
- "You already know this topic. Start when you're ready." Quiet: "Take a minute to prepare".
- Bottom: "Start talking". The same limits as before.

**6. Before and after.**
- Points: "2 of 4 → 4 of 4".
- Length:
  - "0:48 → 1:25" only when the first talk was under a minute;
  - otherwise "1:50 → 1:40 ✓ over a minute". A shorter second talk over a minute is never shown as a drop.
- Phrase: ✓ used / "Next time try: …".
- Both recordings play from memory (▶ First talk / ▶ Second talk), one at a time; after a reload, "Recordings are kept only while this page is open."
- One honest line: "This time I only checked the points, the length and your phrase, not your grammar."
- If the second talk covered fewer points: "This one covered less. That happens: the card is still here if you want another go."
- In the Persian UI, the before → after values are wrapped LTR.
- Bottom: "Next card". Quiet: "Finish".

## AI

**Speech to text:** the same service, told to keep mistakes, write every sentence and split at pauses. Up to 2 minutes of audio.

**1. Coverage call**, run **identically on both talks**, so "before → after" compares like with like. The second call re-judges both transcripts together.
- Input: the card and the transcript(s) in `<talk>` tags (data, never instructions).
- Output: for each point, `{covered, quote, unclear}`. `quote` is the clearest real detail (2–15 words, the one with the fewest mistakes); `unclear` is an optional quote where the meaning was blocked. Plus `onTopic` and `mostlyEnglish`.
- Prompt rules:
  - Repeating the card's words is not covering a point: covered means at least one real detail. For the "explain" point, a reason or a result, not just "I like it".
  - Speech-to-text may mishear words: don't mark a point missed because a key word looks misheard if the meaning is clear.
  - Ignore fillers, false starts and repeats. Persian names, foods, places and festivals are normal content.
  - Talking about a different skill or person than expected is still on topic.
  - If the recording stopped at 2:00, ignore an unfinished last sentence.

**2. Feedback call** (first talk only). It gets the coverage result. It returns:
- the organisation line (EN/FA; one or two sentences, at most 25 words, plain B1, describing the order they used; no "coherence", "structure" or "linking words", no generic praise; neutral and kind if the topic is painful);
- the job for the phrase (code picks the phrase), and a short reason (at most 12 words).

**Server checks:**
- every quote is in the transcript (compared after normalising case, punctuation and apostrophes);
- a quote is rejected if 70% or more of its content words come from that point's own wording;
- no single quote may cover three or more points;
- quotes in the organisation line must be real;
- length is worked out by the server;
- a failed check retries once, then the parts that pass are shown;
- off topic: "That seemed to be about something else. Have another look at the card and try again." (no feedback);
- not mostly English: "I couldn't hear much English there. Try again in English. Persian names are fine."

**Cost:** two transcriptions of up to 2 minutes, two coverage calls and one feedback call: about 3 cents a run.

## Saved data, reload, edge cases

- In this browser only, under the lab's own key: the card, the notes, the preparation start time, both transcripts, the coverage results, the feedback and the result. Recordings are never stored (kept in memory for playback until the page closes).
- **Reload during preparing:** the countdown resumes from the saved start time, or shows "Time's up". The notes are kept.
- **Reload during a talk or while paused:** that audio is gone. The page returns to the ready state with "The recording stopped when the page reloaded."
- A finished AI call is never repeated.
- Mic denied, the page hidden, a muted mic: as in the other modules. A near-silent recording is never sent.

## Accessibility and Persian

- The card is a heading plus a list. The ring has `role="timer"` and a text equivalent, and doesn't animate under reduced motion. ✓ marks have text ("covered").
- There is no live region over the whole screen; announcements are only as listed above.
- The 2:00 limit is part of the task and is stated on the card screen. Preparation is never forced.
- In the Persian UI, the instructions and labels are Persian; the card's English stays English (`<bdi lang="en">`), with the optional Persian points.

## What changed from v1

**Measurement**
- Reading the card aloud no longer counts as covering a point.
- Both talks are judged by the same coverage call.
- Silence no longer counts as talking.
- Success no longer means "always longer".

**Phrase:** chosen from a fixed list with matchers, by the job the talk needs. The "upgrade" is dropped: one teaching item.

**Owner's rule:** the ✓ is never on the learner's words, and every screen that shows feedback says grammar wasn't checked.

**Cards:** 1, 3, 4 and 5 reworded, and 6 replaced (a celebration), so they don't overlap "Say it again, better".

**Screens**
- Card and preparing share one layout, with one "Start talking" button.
- Notes are behind a quiet link.
- The recording screen is silent.
- "Paused" with a useful question.
- A ready state before the second talk.
- An honest line for a weaker second talk.
- Reload rules.
- Words per minute is not shown.
