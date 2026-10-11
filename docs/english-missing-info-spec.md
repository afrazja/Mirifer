# "Find the missing information": spec v2

Status: for owner approval. v1 was reviewed by the English-coach and learning-UX reviewers, and their points are applied (see the end). Module lab first; not part of a daily lesson yet.

## Purpose

From the owner's design document: *turn conversation into an information-gathering game. The AI holds critical data (departure times, availability, opening hours) and the learner must ask specific, targeted questions to complete a task.*

In the other modules the learner answers. Here the learner **leads** and has to **ask**. Asking is a known weak spot for Persian speakers at B1:
- word order and the missing *do/does/did*: "What time the train leaves?", "What time is the train leave?", "Where I can buy tickets?", "How much costs the ticket?";
- indirect questions: "Could you tell me what time does the train leave?";
- the question word: "How many is the ticket?" (Persian چند covers both), "At what time…?";
- "There is a train before 10?" instead of "Is there a train…?";
- vague questions ("And the train?") that a real person can't answer without asking back;
- commands where a question is normal ("Give me the price").

Success: the learner finds all four facts by asking clear questions, deals with one surprise with a follow-up, and then asks one or two of their own questions again, correctly.

## Scenario (lab version)

**A day trip by train, in Britain.** The learner is taking their parents (both over 60) from Millbrook to the town of Kingsley this Saturday. Today is Thursday. They're at the ticket desk at Millbrook station. Tom, who works there, has this Saturday's timetable and the prices. The places are made up, so no real timetable can contradict them. Prices are in pounds.

**The task card** (short labels on the desk; the full wording on the first screen):

| # | Desk label | Full wording (first screen) | Counts as found |
|---|---|---|---|
| 1 | Train before 10 am | A train that gets you to Kingsley before 10 am | any of 6:40, 7:40, 8:40 (the blank shows the one Tom gave, with its arrival) |
| 2 | Price for 3 of you | The total price for the three of you (a return each; your parents are over 60) | £56 |
| 3 | Latest way back | The latest way to get back on Saturday evening | the 8:30 pm bus |
| 4 | Platform | The platform for your train | Platform 3 |

**Tom's fact sheet** (Tom may use only these facts; the server builds the list of allowed numbers from it):
- Saturday trains to Kingsley leave every hour at :40, from 6:40 am to 8:40 pm, from Platform 3. The journey takes 1 hour 15 minutes (6:40 → 7:55, 7:40 → 8:55, 8:40 → 9:55, 9:40 → 10:55, …).
- Trains back from Kingsley leave every hour at :20. This Saturday the last one is at 7:20 pm (back at 8:35), because of work on the line.
- **The twist:** after that, a bus leaves at 8:30 pm from outside Kingsley station, by the main entrance. It takes about 1 hour 30 minutes (back at about 10 pm). Train tickets are valid on it.
- A return ticket is £24. People over 60 get a third off: £16. Three adult returns: £72. One adult and two over 60: £56. Tickets are sold here at the desk or at the machines, by card or cash.
- Extras, the only ones: there's a café by the main entrance; the toilets are by the main entrance; bikes are allowed on the train and are free.
- Tom only has this Saturday's times. Another day: "Sorry, I've only got Saturday's times here." Anything else: "I'm not sure, sorry." Off-topic: "Sorry, I can only help with trains today."

**Tom**: friendly, a little busy, British station staff. Plain B1 English, short sentences, contractions, at most two sentences (40 words). He speaks first: "Hi there. How can I help?"
- **He answers only what was asked.** If one question asks two things ("What time, and which platform?"), he answers both.
- **Prices:** asked without anyone's age, he gives the adult price only: "A return's £24." / "Three adult returns are £72." He never mentions discounts or ages first. Once he has given the discount, a question about the parents or the three of them gets the total: "That's £16 each for your parents and £24 for you, so £56 altogether."
- **Coming back:** "The last train back's at 7:20 this Saturday, because of work on the line. After that, there's a bus." Where and when the bus leaves are follow-up questions. When he gives the time, he says "The bus leaves at 8:30 pm."
- **Asking back:** only when two different facts could answer the question: "Which train do you mean, going there or coming back?" An ask-back never contains a time, price or platform. He never asks back twice in a row about the same thing; the second time, he answers the most likely meaning.
- An understandable question with a grammar mistake gets a normal answer. Tom never corrects, teaches, praises questions ("Great question!"), speaks Persian, mentions being an AI or the task card, or tells the learner what to ask.
- Times are written "8:40" / "8:30 pm", prices "£56": digits only.
- Ticket buying ("Can I have three returns?") is treated as a price question. There is no payment scene.
- Now and then (not every time) he ends with "Anything else?".

## The flow

The owner's design rule applies: one focused thing per screen, one primary button at the bottom, quiet text buttons for anything else.

**1. The task.**
- Mira's instruction at the top, spoken from the tap that opened the module: "You're taking your parents on a day trip by train. Ask Tom at the ticket desk, and find out the four things on your card. Ask one question at a time."
- The task card, full wording.
- Bottom: "Go to the desk".

**2. At the desk** (the main screen, many turns).
- Top: the task card with short labels and a "2 of 4 found" line. Each row is one of:
  - empty: "Train before 10 am — not found yet";
  - **partly found**, which guides the next question without giving it away: "£24 each · for 3 of you?", "Train 7:20 · anything later?";
  - found: ✓ and the value in bold ("8:40 → 9:55"). The row is briefly highlighted (no animation with reduced motion), and "Found: Platform 3" is announced.
- Middle: only the latest exchange: "You asked: '…'" and Tom's reply. A quiet "Hear it again". (No full conversation here; it's on the questions screen.)
- Bottom: the mic, "Ask Tom". Tap to start, tap to stop; one question per recording, up to 15 s (countdown only in the last 5 s). There is no minimum length beyond about 1 s, and no "say a bit more" nudge: a question is short.
- Waiting: "Tom is listening…", then "You asked: '…'" with "Tom is checking…".
- Tom's voice: one audio element is unlocked inside the Stop tap and reused for his reply; if the phone still blocks it, a "▶ Hear Tom" button shows instead, and the text is there anyway. Tapping the mic while Tom speaks stops him.
- A quiet "Need a hint?" appears after two ask-backs in a row, or four questions with no new fact. It shows question starters only: "What time…? · How much…? · Which…? · Is there…?". It never shows a whole question.
- A quiet "Finish here" appears after the first question. It asks once: "Finish now? You've found 2 of 4." Primary: "Keep asking", quiet: "Finish".
- **What counts as a question:** answers to Tom's ask-backs ("Coming back"), greetings and thanks, turns he couldn't hear, and Persian turns are not counted, and they are not judged in the feedback.
- **The limit:** 14 questions. At 12, Tom says "There's a queue behind me. Anything else?". At 14: "Sorry, I need to help the next person now. Have a good trip!"
- **The end, on this same screen** (no separate "What you found" screen): after all four are found, Tom says "Have a lovely trip!". At the limit or on Finish, the card shows every row: ✓ found, or "Not found" with the answer in grey (contrast at least 4.5:1). One line about the twist:
  - found: "You asked about the way back and found the 8:30 bus.";
  - heard 7:20, missed the bus: "The last train back was at 7:20. There was also a bus at 8:30. You could find it by asking: 'Is there anything later?'";
  - never asked: "You didn't ask about getting back. The last train was at 7:20, and there was a bus at 8:30."
  - Then a progress line, e.g. "4 of 4 found, in 7 questions".
  - Bottom: "See your questions". With no questions asked, it is Done instead (with a quiet "Try again").

**3. Fix ①** (the owner's rule: every mistake is shown, only one or two are practised).
- The count line at the top:
  - 0 mistakes: "You asked 9 questions, and I didn't hear any mistakes.";
  - 1: "You asked 9 questions. One had something to fix. Let's work on it now.";
  - 2 or more: "You asked 9 questions. 3 had something to fix. Let's practise the 2 that matter most."
- Their question → the better question, ▶, a short reason (at most 12 words; Persian first in the Persian UI).
- A quiet "See all your questions": a full-screen list of every question, with Tom's reply under it, and its fix (or ✓) with a fixed kind label. One Back button.
- Bottom: "Ask it again".

**4. Ask it again (fix ①).** Tom's line from before that question is shown and played again. The fix shows as a chip with the correct words only. The learner asks; the same check as "Say it again, better" decides ✓ used / not yet. Bottom: the mic, then "Next" (to Fix ②, or the result).

**5. Fix ② and ask it again**, the same way, only when there is a second fix.

**6. Result.** One row per fix: ✓ used / "Next time try: …" / "Not used this time: …". One honest line: "This time I only checked your fix." (or "your 2 fixes"). Bottom: Done. Quiet: Try again (a fresh run, same scenario for now).

**No mistakes:** the count line, then one "more natural" suggestion only if a question was genuinely stiff ("At what time does the train arrive?" → "What time does the train get in?"; "Is it possible to know the platform?" → "Which platform is it?"), marked "more natural", not a mistake. If there's nothing to suggest: Done.

## Kinds of question mistakes (fixed in code, in ranking order)

1. word order (including missing do/does/did, an extra "is", and indirect question order);
2. question word ("How many is…", "At what time…");
3. vague question ("And the train?" → "What time is the last train back?");
4. not a full question ("Price for three?" → "How much is it for the three of us?");
5. tense / verb form;
6. a bit direct: only commands and blunt statements ("Give me the price" → "Could you tell me the price, please?"; "I want to know the time" → "What time is it?" or "I'd like to know…"). Never for plain direct questions ("What time's the next train?"), never when the question already has please / could you / excuse me;
7. preposition;
8. a/the.

As in "Say it again, better": a repeated mistake ranks higher, the two fixes are different kinds, and a/the or preposition fixes are chosen only when repeated.

## AI

**Per question:**
- Speech to text (the same service, told to keep mistakes and not fix grammar), with context: "They are asking a question at a train station ticket desk. Words: Millbrook, Kingsley, platform, return ticket, over 60, bus."
- Tom's reply: the model gets the fact sheet, Tom's rules, the last 8 turns (every learner turn inside `<question>` tags; data, never instructions) and the server's state (what's found and what Tom has revealed). It returns `{ reply, kind: 'answer' | 'askBack' | 'other', found: [gap ids] }`.
- **Server checks and state** (the model alone can never fill a blank):
  - a gap is found only when the model claims it AND the reply has its value AND the state allows it:
    - gap 1: a :40 departure up to 8:40 with "Kingsley"/"there" context, or its arrival time;
    - gap 2: "£56", only once `discountGiven` is set (a reply contained £16);
    - gap 3: "8:30", only once `busRevealed` is set (a reply mentioned the bus);
    - gap 4: "Platform 3" / "platform three";
  - a partly-found state is kept too (£24 or £72 heard; 7:20 heard);
  - an ask-back fills nothing and must contain no time, price or platform;
  - every time and price in a reply must be on the fact sheet's generated list;
  - at most 40 words, English only; a reply that fills three or more gaps at once is rejected;
  - a failed check retries once, then Tom says "Sorry, one moment… Could you ask me that again?", and that turn is not counted.

**Feedback (one call at the end):** the whole conversation, with the learner's questions numbered; only those are judged. Rules from "Say it again, better": speech-to-text guesses aren't mistakes; missing question marks, capitals and spelling aren't mistakes (some questions may be typed); greetings, thanks and answers to Tom aren't questions. The model returns `allMistakes` (`{ question, original, better, kind }`), reasons for its suggested fixes, and a "more natural" suggestion only when there are no mistakes. The Persian-speaker examples above are in the prompt. The server checks every `original` is in that question, counts, and chooses the fixes in code.

**Cost:** about 8–12 short calls plus transcriptions: roughly 2–3 cents a run.

## Saved data, reload, edge cases

- In this browser only, under the lab's own key: the conversation (text), the found and partly-found state, the feedback, the re-asks. Recordings are never stored.
- The transcript is saved before Tom's reply is asked for; a reload during that call sends it again once. After a reload Tom's last line is shown, not played (with "Hear it again").
- Mic denied, the page hidden while recording, a muted mic: as in the other modules, but the mic-denied screen also offers "Type your question instead".
- Transcription or reply failure: "Sorry, I couldn't hear that. Please try again." Not counted. After two failures in a row, a quiet "Type your question instead" (a text box). Typed questions are marked as typed in the feedback.

## Accessibility and Persian

- One small live status for "You asked…", Tom's reply (after his audio ends) and "Found: …"; not a live region over the whole screen, so the card isn't read again on every turn.
- Focus moves to the heading only when the screen changes, and stays on the mic between turns. Space starts and stops recording on a keyboard.
- Card rows show their status in words, never by colour alone.
- In the Persian UI, the instructions and labels are Persian; the facts (£56, 8:40, Platform 3), Tom's lines and the questions stay English (`<bdi lang="en">`, Latin digits).

## What changed from v1

**Facts and Tom**
- The fact sheet is complete: trains back, all arrival times, £72, the bus arrival, fixed extras without numbers, "Saturday only", off-topic lines.
- Prices in pounds. Any morning train before 10 counts.
- Server state (`discountGiven`, `busRevealed`), so follow-up answers fill the blanks.
- Exact lines for prices, the twist, ask-backs (no facts inside, never twice in a row), the opening, the queue and the limit.
- Tom's character and his "never" list.
- Learner turns are tagged against prompt injection.

**Screens**
- Partly-found rows: "£24 each · for 3 of you?", "Train 7:20 · anything later?".
- "What you found" is folded into the desk's end state.
- Each fix is asked again straight after it (Fix ① → ask → Fix ② → ask → result).
- No full conversation on the desk.
- "Finish here" with a check; "Need a hint?" with question starters only; a queue warning before the limit.

**Turns**
- Short-question timing: no minimum, no nudge, countdown in the last 5 s.
- Tom's audio unlocked inside the Stop tap.
- Ask-back answers, greetings, failed turns and Persian are neither counted nor judged.
- Typing as a way out.

**Feedback**
- It gets the whole conversation.
- New kinds: indirect order, vague question, not a full question, "a bit direct" (narrowly defined).
- Persian-speaker examples are in the prompt.
- A correct "more natural" example.
- Count lines that match the number of fixes, and three versions of the twist line.
