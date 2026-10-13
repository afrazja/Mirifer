# "Shadowing" (Module lab): spec v2

Status: **approved by the owner and built (Module lab).** v1 was reviewed by the English-coach and learning-UX reviewers, and their points are applied (see the end).

Owner's fixed decisions:
- audio only, never the text while listening;
- intermediate-to-hard sentences;
- the learner may type instead of speaking;
- each sentence plays at most twice.

## Purpose

The owner's design document separates three things: "repeat what you heard" (exact sound), "retell the meaning" (gist) and real-time shadowing. This module is the first, at a harder level. The learner hears a natural sentence at normal speed and must give back **exactly** what was said, by ear alone.

It trains what B1 learners find hardest in real English:
- linking ("an hour" → "a-nower");
- weak forms ("would have" → "would-uv", "to" → "tuh", "for" → "fer");
- contractions ('d, 've);
- small words and endings (the, a, -s, -ed);
- number stress (thirTEENth / THIRtieth);
- holding a long sentence in memory.

**How it differs from "Natural phrases"** (daily lesson): that module shows the sentence and checks one chunk. This one never shows the text before you answer. The sentences are longer and faster, and every word counts.

## Sentences (lab set)

There are eight sentences, B1+ to B2, from shorter to longer. They are read by one natural US voice (Brian) at normal speed. American spelling throughout ("canceled", "movie theater").

| # | Sentence | Contractions accepted in full |
|---|---|---|
| 1 | We ended up staying a couple of extra days because the flights were canceled. | – |
| 2 | They've moved the meeting from the thirteenth to the thirtieth, so we've got a bit more time. | They've = they have, we've = we have |
| 3 | Could you let me know whether you're coming on Friday, so I can sort out the tickets? | you're = you are |
| 4 | She said she'd call me back as soon as she got out of the meeting, but she never did. | she'd = she would |
| 5 | I've been meaning to tell you that the restaurant we booked has moved to a new address. | I've = I have |
| 6 | He's the kind of person who'd rather do everything himself than ask anyone for help. | He's = he is, who'd = who would |
| 7 | By the time we got to the movie theater, the movie had already started and there weren't any seats left. | weren't = were not |
| 8 | If I'd known the traffic was going to be this bad, I would've left an hour earlier. | I'd = I had, would've = would have |

**Tips** (shown only after answering, with a Persian version). They're written for what the voice actually says, and checked against the generated audio before shipping; a tip about a sound the voice doesn't make is changed.
1. "'a couple of' sounds like 'a coupla'. After it, English needs a plural: 'days', not 'day'. 'were' tells you there's more than one flight."
2. "'thirteenth' is strong at the end: thir-TEENTH. 'thirtieth' is strong at the start: THIR-tieth. Listen for where the word is strong."
3. "'let me' can sound like 'lemme', and 'Could you' like 'couldja'. 'whether' and 'weather' sound the same. Here it means 'if'."
4. "In 'she'd call', the d almost disappears, but it changes the meaning, so listen for it. 'got out of' runs together like one word."
5. "'I've been' often sounds like 'I been'. The v is very small. 'booked' ends in a t sound, 'bookt', with no extra vowel."
6. "'kind of' sounds like 'kinda', and 'who'd' (who would) sounds like 'hood'. Persian has one word for he and she, so listen for 'he' and 'himself'."
7. "In 'weren't any', the t is almost silent, but it makes the sentence negative. 'movie had' runs together."
8. "'I'd known' means 'I had known'. 'would've' sounds like 'would-uv', and 'an hour' sounds like 'a-nower'. The h in 'hour' is silent."

## The flow

The owner's design rule applies: one focused thing per screen, one primary button at the bottom, quiet text buttons for anything else.

**1. Start.**
- Mira, spoken from the tap that opened the module: "You'll hear eight sentences, with no text. You can play each one twice. Listen, then say exactly what you heard, or type it if you like. Every word counts, even small ones like 'the' and 'a'."
- Bottom: "Start".

**2. A sentence** (one screen each).
- "Sentence 3 of 8".
- A large ▶ button labelled "Listen · 2 plays left", then "1 play left", then "No more plays". The text is never shown.
- Once it has played at least once, the bottom bar is **either** the mic **or** typing, never both:
  - **Speaking:** "Say it" (up to 15 s, tap to stop; countdown in the last 5 s). Quiet: "Type it instead".
  - **Typing:** the bottom bar becomes a 2–3 line text box with "Check" (a `<form>`, so Return submits). Quiet: "Say it instead".
    - It's English only. If Persian letters appear: "Switch to an English keyboard."
    - The box is locked while the sentence is playing, so typing stays a memory task.
- Quiet: "Finish later" (progress is kept).

**3. The check** (same screen, after answering; focus moves to the score).
1. "You got 14 of 17 words."
2. The sentence, word by word. Missed words are marked with an underline and a light highlight, plus hidden "missed" text for screen readers; never colour alone.
3. One tip line.
4. A quiet "You said: …" or "You wrote: …". For spoken answers it adds "Speech-to-text isn't perfect."
5. A quiet ▶ "Listen again" by the sentence, unlimited now.
6. Bottom: "Next sentence".

**4. Result.**
- "You caught 82% of the words."
- One pattern line, when the same kind of miss happened 3 or more times:
  - "Small words like 'the' and 'a' are quick and quiet. They're easy to miss.";
  - "Word endings like -s and -ed were hard. Listen to the end of each word.";
  - "Short forms like 'd and 've were hard."
- The hardest sentence (lowest score, earliest on a tie; left out if everything was 100%) with ▶.
- Bottom: "Done". Quiet: "Try the same sentences again". The second round's score is never shown as progress, since the learner has now seen the text.

## Audio and the two plays

- Each sentence is played from our neural voice (the same TTS service, US voice "Brian"). There is **no fallback** to the browser's robotic voice.
- **A play counts the moment the audio actually starts**, and it's saved then. Stopping it early still counts.
- If the audio fails or is blocked: "Couldn't play. This didn't use a play." Button: "Try again".
- A reload keeps the play count, so reloading can't reset it. A reload during a play counts that play.
- The next sentence's audio is fetched while the check is showing.

## Checking (no AI judging)

- **Speech to text:** the same service. It is **never given the sentence or any of its words**; its only context is the shared "write exactly what they say" instruction. The score is "words caught", not pronunciation. Spoken and typed scores are not compared.
- **Comparison:** word by word, in order (longest common sequence), against the sentence's own words. A contraction is one word, so #8 has 17 words. Both sides are normalised first:
  - **case and punctuation;**
  - **contractions:** the short or full form, as listed for each sentence (no global guess: 'd can be "had" or "would");
  - **spoken reductions:** gonna = going to, wanna = want to, gotta = got to, lemme = let me, kinda = kind of, coupla = couple of, 'cause/cos = because;
  - **"of" for "have":** "would of" = "would have", only after would, could, should, must or might;
  - **homophones**, from one shared table: no/know, for/four, here/hear, its/it's, new/knew, to/too/two, whether/weather, you're/your, than/then, by/buy/bye, there/their/they're (but never a word that changes the meaning, such as weren't/won't);
  - **spelling variants:** cancelled/canceled, theatre/theater, ok/okay, anyone/any one, everything/every thing, himself/him self;
  - **numbers:** 13th = thirteenth, 30th = thirtieth.
- **Typing tolerance:** a typed word one letter off counts only if:
  - the word has 6 or more letters;
  - the typo isn't another real word;
  - the difference isn't a missing or extra -s, -ed or -d ending.
  So "resturant" counts, and "he"/"she", "day"/"days" don't.
- **A failed attempt,** which doesn't use the answer, is one of: a network error, a near-silent recording, an interrupted recording (page hidden or mic muted), or a recording under 1 s. A transcript that comes back wrong counts as the answer.
- **Cost:** about 1 cent at most per run (eight short transcriptions).

## Saved data, reload

- In this browser only (the lab's own key): the sentence number, plays used per sentence, each answer (text), how it was given (spoken or typed) and its score. Recordings are never stored.
- A reload on the check screen returns to the check without playing anything.
- A reload during speech-to-text loses that answer but keeps the play count.

## Accessibility

- Nothing is announced and focus doesn't move while a sentence plays. "1 play left" is announced after the audio ends.
- The play count is in the Listen button's label.
- This module needs hearing; it is never required for progress.

## What changed from v1

**Fairness**
- A play counts when audio starts; a failed play costs nothing; no robotic fallback voice.
- The sentence is never sent to speech-to-text.
- Homophones, per-sentence contractions, reductions and spelling variants are accepted.
- Typing tolerance is limited to long words and never forgives endings.

**Content**
- The easiest sentence was replaced by a number-stress sentence (thirteenth/thirtieth).
- The sentences are ordered from short to long.
- A US voice with American wording.
- Corrected and learner-facing tips.

**Screens**
- Mic or typing in the bottom bar, never both, and typing is locked during playback.
- The check has a fixed order, with "You said / You wrote".
- A pattern line on the result screen.
- "Finish later".
- Screen-reader rules.

## Owner test: a garbled transcript

The owner said the sentence and got back "We will be office I English Arash is a funny". Two changes:
- **Transcription:** a short answer is no longer split at pauses. It now gets a neutral hint ("They are repeating one everyday English sentence they just heard.") that still never contains the sentence or its words.
- **"I heard: …" before anything is revealed.** After speaking, the learner first sees what speech-to-text heard:
  - "Check it" scores it;
  - "That's not what I said: type it instead" throws it away and opens typing. The sentence is still hidden, so typing stays fair, and plays are unchanged.
- **Later:** Azure pronunciation assessment, which scores the audio against the sentence, would be far more reliable here. It needs AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in Vercel, and is dormant until then.
