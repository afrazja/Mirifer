# "Phrases for your story" (shadowing): spec v1

Status: draft for review, then owner approval. Owner's decisions so far:
- The learners are not beginners: B1 learners who already know most words. Every sentence must
  have a purpose.
- Shadowing comes before the story (Say it again, better). It gives a few chunks the learner is
  invited, never forced, to use in their own story.
- The sentences are written by us, reviewed, and fixed per day. AI never writes them live.
- Time is not a design constraint for now. Minutes are rebalanced after approval.

New module of the English session, placed right before "Say it again, better". Adult Persian speakers,
A2–B1, mobile-first. Owner's design rule: one focused thing per screen, step by step, one primary button
at the bottom (CLAUDE.md).

## Purpose

B1 learners understand far more than they can say. Under pressure they fall back on simple sentences
translated from Persian ("finally I had to go and buy some clothes"). This module makes a few
natural chunks automatic, in the rhythm a fluent speaker uses, so the learner can use them a few
minutes later in their own story.

**Success is not repeating well; it is using a chunk in the story.** That is measured in the next
module, in code.

## How every sentence is chosen (four tests)

1. **It serves the day's goal** (Day 1: explain a problem, say what went wrong, ask for help).
2. **It carries one B1 chunk** that learners understand but rarely produce.
3. **It has one sound feature to notice**: linking, a weak form, stress that carries meaning, or
   polite intonation.
4. **The chunk fits any story of this kind.** Chunks are chosen by their job in a story, not by its
   topic. The sentence around a chunk is just one example, so the learner adapts the chunk instead of
   copying the sentence.

## Day 1 set (travel problems)

Situation line, sentence (chunk in bold), sound tip:

1. *At the airport, your bag isn't on the belt.*
   "My bag **was supposed to** arrive with me, but it didn't."
   Tip: "supposed to" sounds like one soft word, *s'pose-tuh*; the stress goes on **didn't**.
2. *The airline calls you back.*
   "**It turned out** they'd put it on a flight to Frankfurt."
   Tip: link it: *tur-n-dout*; "they'd" is short.
3. *Your phone was nearly dead, too.*
   "**To make things worse,** my phone was almost dead."
   Tip: your voice goes up on "worse", then a short pause.
4. *You needed clothes for the next day.*
   "So I **ended up buying** clothes at the airport."
   Tip: link it: *en-di-dup*; "ended up" + a verb with *-ing*.
5. *At the desk, asking for help.*
   "**I was wondering if you could** call me when it arrives."
   Tip: soft and polite, with your voice falling at the end. Not a demand.

Chunks 1–4 are narrative, for the story. Chunk 5 is for asking for help (useful in the scene module
and in real life). The end screen lists chunks 1–4 as "Phrases for your story".

## Screens (one focus each; primary button pinned at the bottom)

1. **Intro** (Mira's voice and text, full on this screen only):
   "These phrases make a story sound natural. Listen to me, then say each sentence straight after me.
   Keep them in mind, because you'll use them in your story next."
   Bottom: Start.
2. **Sentence N of 5**:
   - A small situation line, then the sentence large, with the chunk highlighted.
   - The one-line sound tip.
   - Mira says the sentence once, automatically, at natural speed. Connected speech is the point, so
     we don't slow it by default. Quiet buttons: "Again" and "Slower" (0.85).
   - Bottom: mic, "Your turn". Recording stops when the learner taps or at 10 s. Mira's audio is
     stopped first, so it is never recorded.
3. **Compare** (same sentence):
   - Two equal play buttons: "Mira" and "You". The learner's recording plays from memory; it is
     never uploaded for playback and never stored.
   - Word check: "You said it all ✓", or the sentence with any missing chunk words softly marked.
     Never a score and never "accent".
   - Bottom: Next. Quiet: "Try again" (record again, at most 2 tries counted).
4. Repeat 2–3 for each sentence.
5. **Your phrases for the story**: the four story chunks as a short list, each with ▶. Mira: "Try to
   use one of these in your story." Bottom: Next (module done).

Mic denied: the sentence screens still work. The learner listens and says it aloud, and the bottom
button becomes "Next". There is no word check and no score.

## Word check (no score of pronunciation)

- Each recording is transcribed with the same speech-to-text as Say it again, better. The prompt is
  generic: it does **not** contain the target sentence, otherwise the model would "hear" it.
- "Said it all" means every content word and every chunk word of the target appears in the transcript,
  in order, ignoring case, punctuation and contractions ("they'd" = "they had"/"they would").
- We say plainly that this checks the words, not the accent. Speech-to-text also tidies grammar, so we
  never claim a grammar check here.
- Transcription fails or is offline: "I couldn't check this one", and the compare buttons still work.
  The failure never blocks Next.

## Link to "Say it again, better"

- **Task screen:** Mira's intro gains one sentence: "Try to use one of today's phrases." The existing
  quiet "Need ideas?" sheet also lists the four story chunks. There is no new button.
- **Detection in code (no AI), on the first and second attempt:**
  - *was/were supposed to*
  - *it turned out* / *turned out (that)*
  - *to make things/it/matters worse*
  - *end/ended/ending up + verb-ing*
  - *wondering if you could*
- **On "What you said":** if a chunk was used, one line with a check mark, e.g.
  ✓ You used "ended up buying". This comes before the fixes.
- **AI feedback prompt:** gets the chunk list. If the learner used none, the better version **may**
  use at most one, only where it replaces the learner's own clumsier wording ("finally I had to buy"
  → "I ended up buying"). Never one bolted on.
  - The server checks that the better version uses at most one chunk the learner didn't use. If it
    uses more, the server treats it as a failed check (retry, then continue without feedback, as now).
  - The chunk is highlighted in the better version and joins the chips on the second attempt.
- **Recap / progress:** "Phrases you used today" lists any chunk found in either attempt. This is the
  module's real success measure.

## Saved data, review, reload

- In the browser for the day only, like the other modules: per sentence `{ tries, saidAll | null }`,
  plus the index reached. Recordings and transcripts are not kept.
- Reload: back on the same sentence's listen screen.
- Back from a later module: read-only list of the five sentences with ▶ Mira and ✓ where all words
  were said. Nothing can be redone.
- Server progress (speaking): sentences with "said it all" / sentences checked. Sentences with no
  check (mic denied, failure) are not counted.

## Audio, cost, privacy

- Mira's sentences use the coach voice, generated once and cached. They play instantly, and the same
  sentence always sounds the same.
- Transcription: ~5 short clips (≤ 10 s) per learner, about 0.5 cent per session. It shares the
  daily allowance and rate limit with Say it again, better. Audio ≤ 10 s and ≤ 300 KB per clip.
- Privacy page: the shadowing clips go to OpenAI for speech-to-text and are discarded. Playback of the
  learner's own voice happens on the device only.

## Later (not in v1)

- Variants of the same chunks per onboarding reason (travel, work, exam, abroad), chosen by profile.
- A real pronunciation score needs a separate service (e.g. Azure pronunciation assessment). That is a
  cost decision for later.
- A new chunk set per day and theme. AI may help draft sets offline; each set is reviewed by the
  English-coach reviewer and the owner before it ships.
