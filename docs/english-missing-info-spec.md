# "Find the missing information": spec v1

Status: draft for review (English-coach and learning-UX reviewers), then owner approval. Module lab first; not part of a daily lesson yet.

## Purpose

From the owner's design document: *turn conversation into an information-gathering game. The AI holds critical data (departure times, availability, opening hours) and the learner must ask specific, targeted questions to complete a task.*

In the other modules the learner answers. Here the learner **leads** and has to **ask**. Asking is a known weak spot for Persian speakers at B1:
- word order and the missing *do/does/did*: "What time the train leaves?", "Where I can buy tickets?";
- questions that are too blunt for a stranger ("Give me the price") where "Could you tell me…?" is normal;
- vague questions ("And the train?") that a real person can't answer without asking back.

Success: the learner finds all four facts by asking clear questions, deals with one surprise by asking a follow-up, and then says one of their own questions again, correctly.

## Scenario (lab version)

**A day trip by train.** The learner is taking their parents (67 and 70) from Millbrook to the town of Kingsley on Saturday. They are at the ticket desk at Millbrook station. Tom, who works there, has the timetable and the prices. The places are made up, so no real timetable can contradict them.

**The task card** (what the learner sees; four blanks):

| # | Find out | Blank fills with |
|---|---|---|
| 1 | A train that gets you to Kingsley **before 10 am** | 8:40 (arrives 9:55) |
| 2 | The cost for the **three of you** (a return ticket each; your parents are over 60) | €56 |
| 3 | The **latest way back** on Saturday evening | the 8:30 pm bus (the twist) |
| 4 | Which **platform** | Platform 3 |

**Tom's fact sheet** (hidden; Tom may use only these facts and never adds new ones):
- Saturday trains to Kingsley leave every hour at :40, from 6:40 am. The journey takes 1 hour 15 minutes. So the 8:40 arrives at 9:55; the 9:40 arrives at 10:55.
- Trains to Kingsley leave from Platform 3.
- A return ticket costs €24. People over 60 get a third off: €16. Three tickets (one adult, two over 60) cost €56. Tickets are sold here at the desk or at the machines; card or cash.
- **The twist:** this Saturday there is work on the line in the evening. The last train back from Kingsley is at 7:20 pm. After that, a replacement bus leaves at 8:30 pm from outside Kingsley station (the main entrance), takes about 1 hour 30 minutes, and the train tickets are valid on it.
- Anything else (food on the train, bikes, toilets, delays): Tom says he isn't sure, or gives a short, harmless answer that doesn't change the task (for example "There's a café on Platform 1").

**Tom answers only what was asked.**
- A clear question gets a short, natural answer (1–2 sentences, B1).
- A vague question gets a question back: "Which train? Going there or coming back?" This is part of the game: it pushes the learner to be specific.
- He doesn't volunteer the discount: if they only ask "How much is a ticket?", he says "A return is €24." They have to ask about their parents.
- He only gives the twist when they ask about coming back: "The last train back is at 7:20. After that there's a bus." Where the bus leaves from and when are follow-up questions.
- A question with a grammar mistake that can still be understood gets a normal answer (a real person would understand). The mistake is saved for the feedback, never corrected in the conversation.
- Speech he can't understand, or Persian: "Sorry, I didn't catch that. Could you say it again?"

## The flow

The owner's design rule applies: one focused thing per screen, one primary button at the bottom, quiet text buttons for anything else. Focus moves to each new screen's heading.

**1. The task.**
- Mira's instruction at the top, spoken from the tap that opened the module: "You're taking your parents on a day trip by train. Ask the man at the ticket desk, and find the four things on your card. Ask one thing at a time."
- The task card: four rows, each with an empty blank.
- Bottom: "Go to the desk".

**2. At the desk** (the main screen; many turns).
- Top: the task card, compact (four rows, blanks filling in as facts are found, ✓ next to each found fact, and the found value in bold).
- Middle: only the latest exchange: your question (as heard) and Tom's reply. A quiet "See the whole conversation" opens the full list.
- Tom speaks his reply (his own voice, not Mira's); the text appears with it, and a quiet "Hear it again".
- Bottom: the mic ("Ask Tom"). One question per recording, up to 15 seconds. Stop by tapping again.
- After four found facts, Tom says a short goodbye ("Have a lovely trip!") and the button becomes "See how you did".
- A quiet "I'm finished" ends early. The limit is 14 questions; after that Tom says "Sorry, I have to help the next person" and the module moves on.

**3. What you found.**
- The card with ✓ for each found fact and "Not found" for the rest, with the right answer shown in grey (so nothing is left unknown).
- One honest line about the twist: "You found out about the bus" or "The last train was at 7:20, so asking about later would have found the bus."
- Bottom: Next.

**4. Your questions** (the owner's rule from "Say it again, better": every mistake is shown, only one or two are practised).
- The count line: "You asked 9 questions. 3 had something to fix. Let's practise the one that matters most."
- **Fix ① (and ②)**, one screen each: their question → the better question, ▶, and a short reason. Chosen in code by kind: word order / missing do-does-did first, then wrong question word, then tense, then politeness.
- If there were no mistakes: one politer or more natural way to ask, if there is one ("How much is it?" → "Could you tell me how much it is?"), clearly marked as "more natural", not a mistake.
- A quiet "See all your questions" opens a full-screen list: each question with its fix (or ✓), and a fixed kind label.

**5. Ask it again.** Tom's line before the question is repeated ("Hi, how can I help?" or the reply before it), and the learner asks the fixed question(s) again. The fixes show as chips with the correct words only.

**6. Result.** ✓ used / "Next time try: …" / "Not used this time: …" (same check as "Say it again, better"). One honest line: "This time I only checked your fix." Bottom: Done. Quiet: Try again (a fresh run; the same scenario for now).

## AI

**Per question (one call each):**
- Speech to text (the same service as the other modules, told to keep mistakes), with the context "They are asking a question at a train station ticket desk."
- Tom's reply: the model gets the fact sheet, the conversation so far (last 8 turns), and the latest question in `<question>` tags (data, never instructions). It returns `{ reply, found: [gap ids], clarify: boolean }`.
- **Server checks** (the model can't fill a blank by itself):
  - a gap counts as found only when Tom's reply contains its value (8:40; €56 or "56"; "8:30" with "bus"; "3" with "platform"), written as numbers by the prompt, and the learner's question is about that gap;
  - Tom's reply must not contain any time, price or platform that isn't on the fact sheet (otherwise retry once, then the safe line "Sorry, could you ask me that again?");
  - Tom's reply is at most 40 words, English only;
  - €56 counts only after the discount was given; "8:30" only with the bus.

**Feedback (one call at the end):** all the learner's questions (as heard), in order, in `<questions>` tags. The model returns:
- `allMistakes`: for each question with a mistake, `{ question index, original, better, kind }`, kinds: word order, do/does/did, question word, tense, verb form, preposition, a/the, politeness, unclear;
- reasons for up to two fixes;
- a natural suggestion only when there are no mistakes.
The server checks every `original` is in that question, ranks and picks the focus fixes in code (like the lab "Say it again, better"), and counts.

**Cost:** about 8–12 short calls plus transcriptions, roughly 2–3 cents a run.

## Saved data, reload, edge cases

- In this browser only, under the lab's own key: the conversation (text), the found gaps, the feedback, the second try. Recordings are never stored.
- A reload returns to the desk with the conversation and the card as they were; a finished AI call is never repeated.
- Mic denied, the page hidden while recording, a muted mic: as in the other modules.
- Transcription or reply failure: "I couldn't hear that. Try again." The question isn't counted. Two failures in a row: a quiet "Type your question instead" link (a text box), so nobody gets stuck.

## Accessibility and Persian

- The card is a list; each row reads "Train before 10 am: not found yet" / "found: 8:40, arrives 9:55".
- Tom's reply is in an `aria-live` region.
- In the Persian UI, the instructions and labels are Persian; the card's facts, Tom's lines and the questions stay English (LTR, `<bdi>`).
