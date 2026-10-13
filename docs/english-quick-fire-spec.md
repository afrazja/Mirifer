# "Quick-fire questions" (Module lab): spec v2

Status: **approved by the owner in chat and built (Module lab).**

Owner's decisions:
- a chain of related questions: each next question follows from the learner's last answer, or stays on the same subject;
- the next question is AI-generated and must come fast, so the learner doesn't get bored.

## Purpose

Short, personal everyday questions, like IELTS Speaking Part 1, answered straight away. It trains starting quickly and giving a full answer (answer, then a reason, then maybe an example).

**How it differs from "60-second free talk":** free talk is one long turn on one topic, with no AI. Quick-fire is six short turns in a real back-and-forth.

## The flow

1. **Start.** Mira explains in one line. Bottom: "Start" (asks for the microphone, which stays open for the chat).
2. **A question** (six in a round). "Question 2 of 6", a progress strip, the question in large text.
   - Mira speaks it; recording starts by itself when she finishes.
   - Recording ends by itself after 2.5 s of quiet once they've spoken, or at 20 s. Bottom: "Done".
   - Nothing said for 8 s: "I didn't hear an answer." Bottom: "Try again". Quiet: "Skip this question".
   - While waiting: their words ("…") and "Mira is thinking of a question…".
3. **The next question.** One small AI call with the chat so far. It also judges whether the answer really answers the question. If not, Mira says "Hmm, that doesn't really answer my question. Listen again." (also shown on screen) and asks the same question once more; a second off-topic answer is accepted and marked. If it takes more than 4 s, fails, or the question fails our checks, Mira asks a ready-made follow-up on the same opener instead.
4. **Result** (no feedback during the chat, to keep the pace).
   - Quick starts (speech within 3 s) and answers with a reason or example, out of six.
   - One tip for the weakest skill.
   - Each question with:
     - "You said" (marked "didn't answer the question" if it was off topic);
     - "Corrected": their own answer with only the mistakes fixed, the changed words in bold; or "✓ No mistakes";
     - "A fuller answer" (answer, reason, example); anything the AI added is in [brackets] and highlighted. For an off-topic answer it's "An answer to this question", a short model answer.
     - If the AI never replied for an answer: "No feedback for this answer: Mira didn't reply in time."
   - The tip asks them to answer the question directly first when any answer was off topic.
   - Bottom: "Another round" (next opener). Quiet: "Finish".

## Openers (three, each with five ready-made follow-ups)

After work or class · food · where you live.

## Checks on AI output

- **Question:** ends with "?", 3–15 words, English, not asked before (skipped ones included), and no sensitive topic (politics, religion, money, relationships, health, age…).
- **Correction:** English, at most 1.5× the answer's length + 5 words, and at least half its words are the learner's own.
- **Fuller answer:** at most 50 words, English, and outside the brackets at least 35% of its content words come from the learner's own answer, so it never invents their life.

## Cost and data

- One transcription per answer, one short AI call per answer (about 1 cent a round); one allowance unit per round.
- Recordings are never stored. The chat text stays only in this browser.

## Owner test (v1 → v2)

The owner found no corrections, no feedback, and that any answer was accepted, even one unrelated to the question. In v1 the fuller-answer check was strict (half its words from the answer), so most were likely dropped silently, and nothing checked relevance. v2 adds the topic check with one re-ask, a minimal correction of each answer, a looser fuller-answer check, and an honest line when feedback didn't arrive.
