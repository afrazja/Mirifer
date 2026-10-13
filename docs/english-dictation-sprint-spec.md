# "Dictation sprint" (Module lab): spec v1

Status: **approved by the owner in chat ("I accept your recommendations") and built (Module lab).**

Owner's decisions:
- typing, with the right keyboard for each answer (number keypad, phone keypad, email keyboard);
- one play, plus a second play that's allowed but marked;
- no hard time limit; each answer is timed and the average shown at the end.

## Purpose

Catching exact details by ear, fast: numbers, times, prices, dates, spelled names, email addresses. One wrong digit means a missed train or a wrong phone number, and these are where Persian speakers often slip (-teen/-ty, E/I letter names, B/V, "oh" for zero).

**How it differs:** Shadowing gives back a whole sentence word by word (memory, linked sounds). Listen and connect is about meaning across a talk. Dictation sprint is short bursts where only the key detail counts.

## The flow

1. **Start.** Mira, in one line: "You'll hear ten short messages. Each time, write down just one detail…". Bottom: "Start".
2. **A message** (one screen each, progress strip, "Message 3 of 10").
   - A large ▶ "Listen". No text is shown.
   - After it plays: the question ("What time is the table booked for?"), one answer box with a format hint ("e.g. 9:30") and the right keyboard. Quiet: "▶ Play once more (it will be marked)". Bottom: "Check".
   - English keyboard only; Persian digits are accepted.
   - Quiet: "Finish later".
3. **The check.** ✓ Right / ✗ Not quite (plus "(2 plays)" if used), "You wrote", the correct answer if wrong, "What you heard" (the line, now shown), ▶ Listen again (unlimited), and a one-line tip (with Persian) when wrong or replayed. Bottom: "Next".
4. **Result.** "8 of 10 right", caught on the first listen, average time to answer, and each missed one with its line, the answer, what they wrote and ▶. Bottom: "Done". Quiet: "Try it again".

## The ten messages (US voice "Brian", easier to harder)

| # | Kind | Line | Answer |
|---|---|---|---|
| 1 | Time | Your table is booked for a quarter to eight. | 7:45 |
| 2 | -teen/-ty | The train to Boston leaves from platform fifteen. | 15 |
| 3 | Price | That's four ninety-nine, please. | $4.99 |
| 4 | Quantity | Can you pick up a dozen eggs on your way home? | 12 |
| 5 | Date | Your English course starts on May third. | 3 May |
| 6 | Address | We're at twenty-two B, Park Street. | 22B |
| 7 | Code | Your flight number is B V four one two. | BV412 |
| 8 | Phone | My number is six one seven, five five five, oh one four four. | 617 555 0144 |
| 9 | Spelling | My last name is Rezai. That's R, E, Z, A, I. | REZAI |
| 10 | Email | Send it to sara dot k at gmail dot com. | sara.k@gmail.com |

## Checking (no AI)

Each answer is normalised by kind, then compared with a list of accepted forms:
- **time:** 7:45, 7.45, 19:45, "7:45 pm", "quarter to eight", "seven forty-five";
- **price:** $ and "dollars" ignored, 4.99 or 4,99 (never 499);
- **date:** "3 May", "May 3rd", "the third of May", 3/5 or 5/3;
- **phone:** digits only (spaces, dashes, brackets ignored; a typed letter O counts as zero);
- **spelling:** letters only, any case or separators;
- **email:** case and spaces ignored, but every dot and symbol counts;
- **others:** case, spaces and dashes ignored.

## Audio, data, cost

- A play counts the moment audio starts; a failed play costs nothing. The next line's audio is fetched while the check shows.
- The lines are fixed, so the voice audio is cached; there's no AI and no recording. Cost is close to zero.
- Saved in this browser only: the message number, plays, each answer, whether it was right, and its time.
- **To check before going further:** listen once to the real voice on 7 (B V), 9 (R, E, Z, A, I) and 10 (the email). If the voice reads letters badly, the line changes.
