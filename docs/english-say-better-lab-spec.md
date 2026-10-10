# "Say it again, better" (Module lab version): spec v2

Status: **approved by the owner and built (Module lab).** v1 was reviewed by the English-coach and learning-UX reviewers, and their points are applied (see the end).

This is the lab version of the module type in the owner's design document: a short answer, one or two corrections the learner can act on at once, then a second attempt, with both attempts played back so the improvement can be heard. The daily lesson's "Tell your story" gets the same transparency changes (see the end).

## Purpose and the owner's rule

B1 learners improve fastest when they correct a few things right away and say the answer again while it's fresh.

**Owner's rule:** never let a mistake pass as correct. The learner **sees every mistake**, but **practises only the one or two most important ones**, so the second try can really be better. Wherever a check covers only part of the answer, the screen says so.

## Questions (lab set)

Each question practises a different form. In the app it is never presented as a test, and no learner-facing text says "IELTS".

| # | Question | Topic (for the on-topic check) | Usually needs |
|---|---|---|---|
| 1 | What do you usually do on weekends? | their usual weekends | present simple (habits) |
| 2 | Tell me about a place you'd like to visit, and why. | a place they'd like to visit | would like to + because |
| 3 | Tell me about a good day you had recently. | a good day they had recently | past simple |
| 4 | Tell me about someone who's helped you a lot. | a person who helped them | he/she, past and present |
| 5 | What do you like about where you live? Is there anything you don't like? | where they live | present simple, there is/are |
| 6 | Tell me about a habit you'd like to change. | a habit they'd like to change | would like to, trying to |

The browser sends a question id (1–6), never the question text. The server reads the question from this list.

## The flow

The owner's design rule applies: one focused thing per screen, one primary button at the bottom (in thumb reach), quiet text buttons for anything else. Focus moves to each new screen's heading.

1. **Question.**
   - Mira's instruction at the top: "I'll ask you a question. Answer in about thirty seconds. Then we'll look at your answer together, and you'll say it again, better."
   - The question in large text under it.
   - Mira says both as **one** spoken line (instruction, a short pause, then the question). Later questions read only the question, inside the tap. A small ▶ replays the question, because phones may block sound on a page that has only just opened.
   - A quiet "Another question" link.
   - Bottom: mic ("Tap to start").
2. **Recording.** The ring fills over 45 s and turns amber at 35 s; the last 10 s count down. It stops by itself at 45 s. Bottom: Stop.
   - Stopped under 15 s: a quiet "Say a bit more?" offers to record again (under 10 s it's required).
3. **What you said.**
   - Mira's praise. It quotes only the learner's correct words, never words that contain a mistake.
   - The transcript, with **only the changed words marked**:
     - other mistakes get a dotted underline;
     - the **focus fixes** get a filled highlight, bold, and ① ②;
     - every mark has hidden screen-reader text ("mistake", "fix 1").
   - The count line, just above the button (mistakes only; "more natural" suggestions are never counted as mistakes):
     - 0, nothing to suggest: "I didn't hear any mistakes there. That was clear." Then a quiet "Say it again anyway", and the bottom button is Next.
     - 0, but one more natural way: "No mistakes there. Here's one way to make it sound more natural."
     - 1: "There's one thing to fix. Let's work on it now."
     - 2: "There are two things to fix. Let's work on both now."
     - 3–5: "There are 4 things to fix. Let's practise the 2 that matter most. You'll see the rest in your better version."
     - 6 or more: "There are 8 things to fix. Let's not try to fix everything at once. We'll practise 2 now, and you'll see the rest in your better version."
   - Bottom: "See the fixes".
4. **Fix ① and Fix ②**, one screen each. A single fix has no counter. Each shows the learner's words → the better words, ▶, and one short reason (at most 12 words; Persian first in the Persian UI).
5. **Better version** ("Your answer, a bit better").
   - The whole answer made fully correct.
   - Changed words are marked the same way as on screen 3, and a part that was left out shows as a small "…".
   - ▶ Mira reads it.
   - If more than about 20% of the words changed: "Your better version has quite a few changes. Listen once before you try again."
   - A quiet "See all fixes" link opens a **full-screen list** with a single Back button. One line per change, with a fixed label written in code: `in the weekend → on weekends · preposition`; `"…" → (left out) · unclear`.
   - Bottom: Try again.
6. **Second try.** The better version is hidden. The focus fixes show as chips with the **correct words only**, so the learner says the right form, not the mistake again. Same limits as the first try.
7. **Before and after.**
   - Two full-width rows: "▶ First try 0:32" and "▶ Second try 0:29". Only one plays at a time; tapping one stops the other and stops Mira, and playback pauses if the page is hidden.
   - The recordings were sent only to turn speech into text. They are never stored; for playback the browser keeps them in memory until the page closes.
   - The focus fixes:
     - ✓ used;
     - "Next time try: …" (missed);
     - "Not used this time: …" (didn't come up). This is not counted as a miss.
   - One honest line: "This time I only checked your 2 fixes." (One fix: "your fix".)
   - Quiet: "See all fixes".
   - Bottom: Next question. A quiet "Finish" is also there.
   - **After a reload** the recordings are gone. The screen shows the fix list, the note "Recordings are kept only while this page is open.", and a quiet "Show both answers".

## Choosing the focus fixes (in code, not by the model)

- Every item in `allMistakes` has a fixed `kind`: tense, verb form, he/she, plural/agreement, missing word, preposition, a/the, word order, word choice, unclear.
- The server ranks the items by kind, in this order:
  1. unclear or wrong word that changes the meaning;
  2. tense or verb form that fits the question (including third-person -s and "I am go");
  3. he/she;
  4. missing subject or "it/there", and plural/agreement;
  5. preposition;
  6. word order;
  7. a/the.
- A mistake the learner repeated ranks higher.
- The two focus fixes must be **different kinds**, never two a/the.
- An article fix is chosen only if that mistake appears twice or more.
- A "natural" fix is used only when there are **no** mistakes. With one mistake, only that one is practised.
- The focus fixes are taken from `allMistakes`, so they always match what is marked and counted. The model's reason (`why`) for each is kept.

## AI (one call after the first try; none for the second)

- **Speech to text:** the same service, told to keep the learner's mistakes, with the question as context. Audio ≤ 45 s.
- **Feedback prompt:** Tell your story's prompt, with these changes (exact wording from the English-coach review):
  - the question comes from the list, with "it usually needs the {tense}";
  - every `allMistakes` item carries its `kind`, is listed once, and items never overlap;
  - "Judge tense against the question";
  - "speech-to-text guesses are not the learner's mistakes: don't list a word only because it looks misheard";
  - if the recording was stopped at the time limit, ignore an unfinished last sentence;
  - fixes: at most 2, from `allMistakes`, chosen in the order above, never two of the same kind;
  - praise never quotes words that belong to an `allMistakes` item;
  - "onTopic": false only if the answer is clearly about something other than the question's topic.
- **Server checks:**
  - `allMistakes` is cut to 20 items rather than rejected when longer;
  - overlapping items are merged (an item inside another one is dropped);
  - an item whose words are not in the transcript makes the call **retry once** rather than vanishing;
  - for every item, the server works out the exact changed-word positions, both in the transcript and in the better version, and returns them with the count. The page only draws what the server worked out, so the marks and the count always agree;
  - the better version must contain every correction and none of the left-out parts;
  - praise quotes must be real, and none may overlap a mistake;
  - English only.

  If a check fails, it retries once. If the second try also fails, the learner sees their transcript and can move on: "Another question" is the primary button, so the answer is never lost.
- **Short or off-topic answers** ("Tell me a bit more"): the question is repeated, with a quiet "Another question". This screen never says anything was good or correct.

## Saved data, reload, edge cases

- In the browser only, under the lab's own key: the question id, the step, both transcripts, the feedback, and the second-try result. Recordings are never stored.
- A reload returns to the same step. A finished AI call is not repeated. If the reload happens while Mira is thinking, the saved transcript is sent again **once**.
- Mic denied, and leaving the page while recording, work as in Tell your story. A muted microphone (for example during a phone call) also stops the recording.
- "Another question" doesn't let the learner skip without limit: after an answer, the next question is simply the next one in the list.

## Cost

Two transcriptions and one feedback call: about 1–2 cents per run.

## Also in Tell your story (daily lesson)

It gets the same transparency changes:
- the server-worked-out marks and the count line on "What you said";
- changed words marked in the better version;
- "See all fixes", with the kind labels.

Its own content (the trip story, 1 minute, up to 3 fixes) stays as it is.

## What changed from v1

**Honesty**
- The result screen now says what was and wasn't checked.
- Praise never quotes a mistake.
- "No mistakes" says "I didn't hear any", since speech-to-text tidies some mistakes away.
- The count, the marks and the focus fixes all come from one server list, so they can't disagree.
- A missing item retries instead of vanishing.

**Focus fixes:** chosen in code by kind and repetition, of different kinds, with natural fixes only when there are no mistakes.

**Questions:** a past-tense story added, the abstract question removed, overlaps fixed, and a fixed id per question.

**Screens**
- Only changed words are marked, with an underline for the others and a filled highlight plus ① ② for the focus fixes.
- "See all fixes" is a full-screen list with kind labels.
- The before-and-after screen has stacked rows and keeps the recordings in memory, with an "absent" state and a reload view.
- The mic is at the bottom; one combined spoken line; 45 s with the last 10 s counted down.

**Edge cases**
- Ways out of the "more" screen and the AI-failure screen that keep the answer.
- The step is saved.
- An unfinished last sentence is ignored when the time limit cut it off.
