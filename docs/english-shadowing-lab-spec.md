# "Shadowing" (Module lab): spec v1

Status: draft for review, then owner approval. It follows the owner's direction:
- audio only, no text while listening;
- intermediate-to-hard sentences;
- the learner may type instead of speaking;
- each sentence can be played only twice.

## Purpose

The owner's design document separates three things:
- **repeat what you heard**: exact sound and articulation;
- **retell the meaning**: gist;
- **real-time shadowing.**

This module is the first, at a harder level. The learner hears a natural sentence at normal speed and must give back **exactly** what was said, by ear alone.

It trains what B1 learners find hardest in real English:
- linking ("an hour" → "anower");
- weak forms ("I would've" → "I'd've");
- contractions ("she'd");
- holding a long sentence in memory long enough to say it.

**How it differs from "Natural phrases"** (daily lesson): that module shows the sentence and checks one chunk. This one never shows the text before you answer. The sentences are longer and faster, and every word counts.

## Sentences (lab set)

Eight sentences, B1+ to B2, each 12–20 words, read by one natural voice at normal speed. Each one carries a listening difficulty, noted here for us and shown to the learner only after they answer.

| # | Sentence | What makes it hard |
|---|---|---|
| 1 | If I'd known the traffic was going to be this bad, I would've left an hour earlier. | *I'd known*, *would've*, *an hour* linked |
| 2 | She said she'd call me back as soon as she got out of the meeting, but she never did. | *she'd*, *got out of* linked |
| 3 | There's no point in waiting for the next bus; it's quicker to walk from here. | *point in*, *next bus* (the t disappears) |
| 4 | I've been meaning to tell you that the restaurant we booked has moved to a new address. | *I've been*, *meaning to* → "meanin' ta" |
| 5 | Could you let me know whether you're coming on Friday, so I can sort out the tickets? | *let me* → "lemme", *sort out* linked |
| 6 | We ended up staying a couple of extra days because the flights were cancelled. | *ended up*, *a couple of* → "a coupla" |
| 7 | He's the kind of person who'd rather do everything himself than ask anyone for help. | *kind of* → "kinda", *who'd rather* |
| 8 | By the time we got to the cinema, the film had already started and there weren't any seats left. | *got to*, *weren't any* linked |

## The flow

The owner's design rule applies: one focused thing per screen, one primary button at the bottom, quiet text buttons for anything else.

**1. Start.**
- Mira, spoken from the tap that opened the module: "You'll hear eight sentences. Each one plays twice at most, and there's no text. Listen carefully, then say exactly what you heard. You can also type it."
- Bottom: "Start".

**2. A sentence** (one screen per sentence).
- "Sentence 3 of 8".
- A large ▶ "Listen" button, with "2 plays left", then "1 play left". After two plays it shows "No more plays". The text is never shown here.
- Once it has played at least once:
  - bottom: the mic, "Say it" (up to 15 s, tap to stop);
  - quiet: "Type it instead", which opens a text box and a "Check" button.
- One answer per sentence. A failed transcription can be tried again, and doesn't count.

**3. The check** (same screen, after answering).
- The sentence is now shown, word by word:
  - words they got: normal;
  - words they missed: highlighted;
  - extra or wrong words aren't shown, to keep it clean.
- "You got 14 of 17 words."
- One line about the hard part, written by us, e.g. *"would've" sounds like "would-uv"*.
- ▶ "Listen again": now unlimited, to learn.
- Bottom: "Next sentence".

**4. Result.**
- "You caught 82% of the words."
- The hardest sentence, with ▶ to hear it once more.
- Bottom: "Done". Quiet: "Try again", which starts the same eight sentences again.

## Checking (no AI)

- **Speaking:** speech-to-text, told to keep exactly what was said. The transcript is compared with the sentence word by word, in order (the longest common sequence), after normalising:
  - case, punctuation and apostrophes;
  - contractions spelled out, so "would've" = "would have";
  - numbers as words.
- **Typing:** the same comparison. A typed word one letter off ("resturant") still counts, because this is a listening task, not spelling.
- **Score:** words matched ÷ words in the sentence.
- Nothing is judged by AI. Cost: up to eight short transcriptions, under 1 cent.
- A near-silent recording is never sent.

## Saved data, reload

- In this browser only (the lab's own key): the sentence number, the plays used per sentence, each answer and its score.
- A reload keeps the play count, so the two-play limit can't be reset by reloading.
- Recordings are never stored.
