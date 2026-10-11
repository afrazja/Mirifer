# "Speaking card": spec v1

Status: draft for review (English-coach and learning-UX reviewers), then owner approval. Module lab first.

## Purpose

From the owner's design document: *give the learner a topic, allow one minute to prepare, then ask for one to two minutes of continuous speech.* (It mirrors IELTS Speaking Part 2, but the app never mentions IELTS, bands or scores.)

**How it differs from "Say it again, better":** that module answers a short question and works on **accuracy** (every mistake marked, 1–2 practised). The Speaking card **explains a topic at length** and works on **long-turn skills**:
- covering every point on the card;
- organising the talk so a listener can follow it;
- keeping going for 1–2 minutes instead of stopping after 20–30 seconds.

Grammar is **not** corrected here, so the two modules never feel the same.

Success: on the second try, the learner covers all four points, talks for longer, and uses at least one organising phrase they didn't use before.

## Cards (lab set)

Six B1 everyday topics. Each has a title, three "You should say" points and one "and explain…" point. The learner gets them in order; a quiet "Another card" moves to the next.

| # | Title | Points |
|---|---|---|
| 1 | Describe a skill you learned as an adult. | what the skill is · how you learned it · what was difficult about it · **and explain** how it has changed your life |
| 2 | Describe a place in your city that you like. | where it is · what it looks like · what you do there · **and explain** why you like it |
| 3 | Describe a useful object you own. | what it is · when you got it · how often you use it · **and explain** why it is useful to you |
| 4 | Describe a person you admire. | who the person is · how you know them · what they do · **and explain** why you admire them |
| 5 | Describe a trip that didn't go as planned. | where you went · who you were with · what went wrong · **and explain** what you learned from it |
| 6 | Describe a habit you'd like to start. | what the habit is · why you want to start it · what makes it hard · **and explain** how your life would be different |

## The flow

The owner's design rule applies: one focused thing per screen, one primary button at the bottom, quiet text buttons for anything else. Focus moves to each new screen's heading.

**1. The card.**
- Mira's instruction at the top, spoken from the tap that opened the module: "Here's a topic. You'll have one minute to think, then talk for one to two minutes. Try to cover every point on the card."
- The card: the title in large text, then the four points as a list.
- Quiet: "Another card".
- Bottom: "Start preparing".

**2. Prepare** (60 s).
- The card stays on screen, with a countdown ring.
- An optional notes box: up to five short keywords, in any language. They stay on this device and are never sent.
- Bottom: "I'm ready". When the minute is up, the button says "Start talking" and a soft tone plays. Recording never starts by itself: phones need a tap.

**3. Talk** (up to 2 minutes).
- The card and the notes stay on screen. Each point gets no tick during the talk: nothing to watch, just talk.
- A timer shows elapsed time; at 1:00 a small "1 minute ✓" appears; the last 15 s count down; it stops by itself at 2:00.
- Bottom: "Stop". If Stop is tapped before 1:00, the recording **pauses** and asks: "You still have time. Keep going?" Primary: "Keep going" (the same recording carries on); quiet: "I'm done".
- Under 20 s: "That was very short. Try again?" (required).

**4. Feedback** (one AI call after the first talk). Two screens.
- **F1, "What you covered":**
  - the four points, each with ✓ and their own words as evidence ("‘I learned to drive when I was 30’"), or "Not mentioned";
  - the length: "You spoke for 1:20 (about 150 words).";
  - Bottom: Next.
- **F2, "Making it easier to follow":**
  - one sentence about how they organised it, quoting them where possible (e.g. "You moved from how you learned to why it mattered, which is clear.");
  - **one organising phrase** to use next time, chosen for what they missed (e.g. *The hardest part was…*, *Because of that…*, *Looking back,…*), with ▶ and a one-line reason;
  - optionally **one phrase upgrade**: a vague phrase of theirs made more specific or natural (not a grammar fix), with ▶;
  - Bottom: "Talk again".

**5. Talk again.** The same card. Points they missed are marked "Try to include this"; the suggested phrase (and the upgrade) show as chips. No new preparation minute (a quiet "Take a minute to prepare" is there). Same limits.

**6. Before and after.**
- Points covered: "2 of 4 → 4 of 4".
- Length: "0:48 → 1:25".
- Phrase: ✓ used / "Next time try: …".
- Both recordings play from memory (▶ First talk / ▶ Second talk), as in "Say it again, better"; after a reload, a note says they're kept only while the page is open.
- One honest line: "This time I checked the points, the length and your phrase."
- Bottom: "Next card". Quiet: "Finish".

## AI

**Speech to text:** the same service, told to keep mistakes, to write every sentence, and to split at pauses (as in "Find the missing information"). Up to 2 minutes of audio.

**Feedback prompt** (one call, after the first talk only). Input: the card (title and points) and the transcript in `<talk>` tags (data, never instructions). Output:
- `points`: for each of the four points, `{covered: boolean, quote: their exact words (3–15 words) or ""}`. "Covered" means they said something about it, even briefly, even with mistakes;
- `organisationEn` / `organisationFa`: one sentence about how they organised the talk, kind and specific;
- `phrase`: `{text, whyEn, whyFa}`: one organising phrase (B1, at most 6 words) that fits what they missed: moving between points, the "explain" point, or ending;
- `upgrade`: `{original, better, whyEn, whyFa}` or null: one vague or flat phrase made more specific or natural, at most 12 words; never a grammar-only change;
- `onTopic`: false only if the talk is clearly about something else.

**Server checks:**
- a point counts as covered only if its `quote` is in the transcript;
- `upgrade.original` must be in the transcript;
- `phrase.text` at most 6 words, English;
- the organisation line may quote only their real words;
- length and words-per-minute are worked out by the server, not the model;
- a failed check retries once; after that, the parts that pass are shown and the rest left out.

**Second talk:** one small call checks only which points are covered (same rules, quotes checked), because coverage can't be checked reliably by keywords. Whether the phrase was used is checked in code, with the same test as the other modules.

**Cost:** two transcriptions of up to 2 minutes and two small calls: about 2–3 cents a run.

## Saved data, reload, edge cases

- In this browser only, under the lab's own key: the card, the notes, both transcripts, the feedback and the result. Recordings are never stored (kept in memory for playback until the page closes).
- A reload returns to the same step; a finished AI call is not repeated.
- Mic denied, the page hidden, a muted mic: as in the other modules ("Send what you have" / "Record again"). A near-silent recording is never sent.

## Accessibility and Persian

- The card is a heading plus a list; the timer is announced only at 1:00 and in the last 15 s.
- In the Persian UI, the instructions and labels are Persian (with a Persian gloss of the card's title under it); the card's English stays English (`<bdi lang="en">`).
