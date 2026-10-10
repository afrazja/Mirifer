# "Say it again, better" (Module lab version): spec v1

Status: draft for review, then owner approval. This is the lab version of the module type described in the owner's design document: a short answer, one or two corrections the learner can act on at once, then a second attempt, with both attempts played back so the improvement can be heard. The daily lesson's "Tell your story" stays as it is (see "Also in Tell your story" at the end).

## Purpose

B1 learners improve fastest when they correct a few things right away and say the answer again while it is still fresh. Feedback that comes much later is easy to forget.

**Owner's rule:** never let a mistake pass as correct. The learner **sees every mistake**, but **practises only the one or two most important** ones, so the second try can really be better.

## Questions (lab set)

Short everyday questions, in the style of IELTS Speaking Part 1 (never presented as a test or a score). One is shown at a time, with a quiet "Another question" link:
1. What do you usually do on weekends?
2. Tell me about a place you'd like to visit, and why.
3. In your opinion, what's the best way to learn a new language?
4. Describe a person who has helped you a lot.
5. What do you like about the city you live in, and what would you change?
6. Tell me about a habit you'd like to change.

Each answer is 20–40 seconds: at least 10 s, and it stops by itself at 45 s.

## The flow

The owner's design rule applies: one focused thing per screen, one primary button at the bottom, and Mira's instruction at the top of the first screen, spoken automatically.

1. **Question.**
   - Mira: "I'll ask you a short question. Answer in about thirty seconds. Then I'll show you what to fix, and you'll say it again, better."
   - Under it, the question in large text. Mira reads the question aloud after her instruction.
   - A quiet "Another question" link.
   - Bottom: mic.
2. **Recording**, with a timer ring that turns amber at 35 s. Bottom: Stop.
3. **What you said.**
   - Mira's praise, quoting the learner's own words.
   - The transcript, with **every** mistake marked.
   - One line: "I found 4 things to fix. Let's work on the 2 most important now. The others are fixed in your better version."
   - With one or no mistakes the line adapts:
     - "I found 1 thing to fix."
     - The "natural" case (no mistakes, only a more natural way to say it).
     - The strong case: "That was clear and correct", with no fixes and a quiet "Say it again anyway".
   - Bottom: "See the fixes".
4. **Fix 1 of 2, Fix 2 of 2**, one screen each: their words → the better words, ▶, and one short reason (Persian first in the Persian UI). These are the **focus fixes**.
5. **Better version.**
   - The whole answer made fully correct, with **every** change highlighted. The focus fixes are marked more strongly.
   - ▶ Mira reads it.
   - A quiet "See all fixes" link opens a plain list of every change (wrong → right), with no reasons.
   - Bottom: Try again.
6. **Second try.** The better version is hidden; the focus fixes show as chips. Same recording limits.
7. **Before and after.**
   - Two equal buttons: "▶ First try" and "▶ Second try". They play the learner's own two recordings, kept in memory on the device for this run only. They are never uploaded for playback and never stored.
   - The focus fixes with ✓ (used) or "Next time try: …" (missed).
   - Bottom: Next question. A quiet "Finish" is also there.

**After a reload** the recordings are gone (they live only in memory). The before-and-after screen then shows the two transcripts instead of the play buttons, with a short note.

## AI (the same check as Tell your story)

- **Speech to text:** the same service, told to keep the learner's mistakes. Audio ≤ 45 s.
- **Feedback:** one call after the first try. It uses the Tell your story prompt, with three changes:
  - the question is the one asked (so being on topic is judged against it);
  - **focus fixes: at most 2**;
  - the server now **returns the full mistake list** (`allMistakes`, which is already checked against the transcript) as well. That is what marks the transcript, highlights the better version and fills "See all fixes".
- **Checks** (already in place):
  - every listed mistake and fix is the learner's own words;
  - the better version contains every correction, and no part that was left out;
  - praise quotes are real;
  - English only.

  If a check fails, it retries once. If it still fails: "Continue without feedback".
- **Count line:** the server counts the real number of mistakes, from the checked `allMistakes`, so the line always matches what is marked.
- **No AI on the second try:** whether each focus fix was used is checked in code, the same way as Tell your story.

## Saved data, review

- In the browser only, for the run: the question, both transcripts and the feedback. Recordings are never stored.
- A reload goes back to the same step, with no repeated AI call.
- It is a lab module: runs are kept under the lab's own browser key, and "Next question" starts a fresh run.

## Cost

Two transcriptions and one feedback call: about 1–2 cents per run.

## Also in Tell your story (daily lesson)

The same two transparency changes are applied there, so it never lets a mistake pass as correct either:
- every mistake is marked in "What you said", with the count line;
- the better version highlights every change, and has the quiet "See all fixes" list.
