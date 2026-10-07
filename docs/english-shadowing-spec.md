# "Natural phrases" (shadowing): spec v2

Status: **approved by the owner, built without the story link.** The owner asked to keep this module
separate for now, to judge its quality on its own. Not built yet: the "Plan your story" screen, the
link to "Say it again, better" (its intro line, the "Today's phrases" group, detection, the AI phrase
suggestion and the recap line). They stay below for later. Built: the intro, the five sentence screens,
the word check and read-only review.

Status before approval: for owner approval. v1 was reviewed by the English-coach and learning-UX reviewers, and their
points are applied (see "What changed from v1" at the end).

Owner's decisions:
- The learners are not beginners: B1 learners who already know most words. Every sentence must
  have a purpose.
- This module comes before the story (Say it again, better). It gives a few chunks the learner is
  invited, never forced, to use in their own story.
- The sentences are written by us, reviewed, and fixed per day. AI never writes them live.
- Time is not a design constraint for now. Minutes are rebalanced after approval.

New module of the English session, placed right before "Say it again, better". Adult Persian speakers,
A2–B1, mobile-first. Owner's design rule: one focused thing per screen, step by step, one primary button
at the bottom (CLAUDE.md). The UI never uses the word "shadowing".

## Purpose

B1 learners understand far more than they can say. Under pressure they fall back on simple sentences
translated from Persian ("finally I had to go and buy some clothes", "at the end…"). This module makes
five natural story chunks automatic, in the rhythm a fluent speaker uses, so the learner can use them
a few minutes later in their own story.

**Success is not repeating well; it is using a chunk in the story.** That is measured in the next module,
in code. It is the module's only progress measure.

## How every sentence is chosen (four tests)

1. **It serves the day's goal** (Day 1: tell what went wrong on a trip).
2. **It carries one B1 chunk** that learners understand but rarely produce. Each chunk replaces a
   typical Persian-speaker workaround.
3. **It has one sound feature** to notice, and only one.
4. **The chunk fits any story of this kind.** Chunks are chosen by their job in a story, not by its
   topic, so the learner adapts the chunk instead of copying the sentence.

The five sentences together tell one short story and follow the steps of any problem story:
**plan → surprise → second problem → what I did → how it ended.** The set itself shows the learner how
to build their own.

## Day 1 set (travel problems)

| # | Situation line | Sentence (chunk in bold) | The Persian-speaker habit it replaces | Sound tip (one feature) |
|---|---|---|---|---|
| 1 | At the airport, your bag isn't there. | My bag **was supposed to** arrive with me, but it didn't. | "should arrive" / "must arrive" | *supposed to* has no "d" sound: *su-POST-ta*. |
| 2 | The airline calls you back. | **It turned out** they'd put it on the wrong flight. | "I understood that…" | *turned‿out*: the d moves to *out*, *turn-DOUT*. Not *turn-ed*. |
| 3 | Then a second problem. | **To make things worse,** my phone was almost dead. | "and also…" | Stress **WORSE**, let your voice go up a little, then pause. |
| 4 | You needed clothes for the next day. | So I **ended up buying** some clothes at the airport. | "finally I had to buy" / "ended up to buy" | *ended‿up*: say it as one, *en-di-DUP*. The next verb ends in *-ing*. |
| 5 | How it finished. | **In the end,** it arrived two days later. | "finally" / "at the end" | *in the end* is one group; stress **END**. |

- The ‿ link marks are shown on the sentence itself.
- Respellings are short, with the stress in capitals, and isolated LTR inside the Persian UI.
- Persian UI: the situation line and the tip are in Persian; respellings and the chunk stay in English.
  The Persian text is checked by the Persian-localization reviewer before build.

"I was wondering if you could…" moves to the start of the scene module, where a request is actually
needed. It is not part of this module.

## Screens

Page chrome: on sentence screens Mira's box is hidden and the step counter becomes "STEP n OF m · 2/5"
in the eyebrow. There is no second counter.

1. **Intro** (Mira's voice and text, full on this screen only):
   "In this part, you'll hear five short sentences. Together they tell a travel story. Listen, then say
   each one after me. Notice the phrases in bold: you can use them in your own story next."
   Bottom: Start. Tapping it plays sentence 1, inside the tap, so phones allow the sound.
2. **Sentence** (one screen per sentence, moving through states; the sentence stays in view):
   - Above: the situation line, small and grey. Then the sentence large, with the chunk in bold and the
     ‿ marks. Under it, the one-line tip and one quiet row: "▶ Again · Slower" (0.85).
   - **Listen**: Mira says it at natural speed. Connected speech is the point, so we don't slow it by
     default.
   - **Your turn**: bottom button = mic. Tapping it stops Mira's audio first, so she is never recorded.
   - **Recording**: bottom button = Stop. Auto-stop at 10 s.
   - **Result** (inline, under the sentence):
     - Quiet "▶ Hear yourself". The learner's recording plays from memory and is never uploaded for
       playback or stored.
     - The word-check line: "Checking…", then the result.
     - The bottom button becomes **Next**. It never waits for the check. Quiet: "Try again".
3. Next plays the next sentence inside the tap.
4. **Plan your story** (the step where the learner fits the chunks to their own trip):
   - Mira: "Now think of your own trip. Try to use one of these phrases, but tell your story, not
     mine."
   - The chunks as frames, each with ▶:
     - "… was supposed to …, but …"
     - "It turned out …"
     - "To make things worse, …"
     - "I ended up …-ing"
     - "In the end, …"
   - Bottom: Next (module done).

**Mic denied or no MediaRecorder** (found on the first mic tap):
- One line: "Your mic is off: say it aloud, then tap Next."
- The rest of the module runs without the mic: the bottom button is Next after listening, with no word
  check.

## Word check (honest, chunk-focused, not a score)

- Each recording is transcribed with the same speech-to-text as Say it again, better. The prompt is
  generic and does **not** contain the target sentence, otherwise the model would "hear" it.
- Only the **chunk** is checked, tolerantly: the same detection patterns as the story (below), plus the
  reduced forms the tips teach ("suppose to" counts). At most one other content word may be missing.
- Wording:
  - "✓ Got it", or "I didn't catch: *turned out*. Try again if you like."
  - Never "you missed", never a score, never "accent".
- The check is shown to the learner, but it is not a progress measure: speech-to-text tidies speech, so
  nearly everyone passes.
- Failure or offline: "I couldn't check this one." Next works anyway.
- Practice clips (≤ 10 s, ≤ 300 KB) are refused once the day's AI allowance is used up, but never
  spend it, so practice can never use up the story's feedback. A separate rate limit (20 a minute)
  applies.

## Link to "Say it again, better"

- **The task screen adds no new spoken line.** The plan screen just gave the instruction, so we don't
  repeat it. If the module was done (not skipped), the existing quiet "Need ideas?" area also shows a
  separate small group, "Today's phrases" (the five frames, LTR).
- **Detection in code** (no AI), on both attempts:
  - It runs on a normalised transcript: lower case, ’ = ', contractions expanded.
  - Patterns:
    - `(was|were|wasn't|weren't|was not|were not|is|are|'s|'re) [one optional word] suppos(ed)? to`.
      A form of *be* is required, so "I suppose" doesn't count.
    - `(it )?(turned|turns) out`, not followed by "the light(s)" and not preceded by was/were.
    - `to make (things|it|matters|everything|the situation) (even )?worse`, only at the start of a
      clause (after punctuation, or after and/but/so/then).
    - `(end|ends|ended|ending) up` + (an -ing word | in | at | with | on), never "up to".
    - `in the end`, not followed by "of".
- **"What you said" screen:** if a chunk was used, one line before the fixes: ✓ You used "ended up
  buying". It rewards and never penalises.
- **AI feedback:** a separate optional `phrase` field, kept out of the case decision and the 3-fix limit
  (details below). On screen it shows as "One phrase to try: …" after the fixes, on the strong path too.
  It is never a fix chip and is never marked "missed".
- **Recap:** "Phrases you used today" lists any chunk found in either attempt. It is hidden when empty.
  This is the module's progress measure (phrases used / 1 = the day's goal is one).

### Prompt addition (say-it-better feedback; the chunk list is a server constant)

```
Today the learner practised these phrases. Each has one job in a story:
- "was/were supposed to": a plan or expectation that didn't happen.
- "it turned out (that)": something the speaker found out later.
- "to make things worse": a second problem on top of a first one.
- "ended up + verb-ing": what the speaker finally did, often not the plan.
- "in the end": how the story finished.
If the learner tried one of these phrases with a mistake (for example "ended up to buy", "it was turned
out", "at the end" for "in the end"), that is a "mistake" fix like any other.
If the learner used none of them, you may return one "phrase" suggestion: a 2–8 word part of their
answer, copied exactly, rewritten with one phrase. Only do this where their sentence already does that
phrase's job and the meaning stays exactly the same. Change as few words as possible. If no sentence
fits, return "phrase": null. That is a good result. Never add a new idea or a new sentence to fit a
phrase in.
If you return a phrase suggestion, the "better" version includes it word for word. The "better" version
contains no other phrase from this list that the learner didn't say.
Don't mention these phrases in the praise; the app already shows them.
```

JSON adds `phrase: null | {original, better, whyEn, whyFa}`.

Server checks:
- `original` occurs in the transcript.
- `better` is ≤ 12 words and contains exactly one chunk (by the patterns above).
- The whole better version contains `phrase.better`.
- The better version uses no other chunk that the learner didn't say.

If any check fails, the phrase is dropped. The rest of the feedback is kept.

## Saved data, review, reload

- In the browser for the day only:
  - per sentence `{ tries, caught: boolean | null }`;
  - the sentence index reached.
- Recordings and transcripts are not kept.
- Reload: back on the same sentence, in the Listen state, and the sound waits for a tap. A recording lost
  on reload doesn't count as a try.
- Back from a later module: a read-only list of the five sentences, with the chunks in bold and ▶ Mira.
  Learners may go back here mid-story to look at the phrases. Nothing can be redone.

## Audio, cost, privacy

- Mira's sentences use the coach voice, generated once and cached. They play instantly, and the same
  sentence always sounds the same.
- Transcription: ≤ 10 short clips per session, about 0.5 cent.
- Privacy page: the practice clips go to OpenAI for speech-to-text and are discarded. Playback of the
  learner's own voice happens on the device only.

## Later (not in v1)

- Variants of the same chunks per onboarding reason (travel, work, exam, abroad).
- A real pronunciation score (e.g. Azure pronunciation assessment): a cost decision for later.
- A new chunk set per day and theme. AI may help draft sets offline; each set is reviewed by the
  English-coach reviewer and the owner before it ships.

## What changed from v1

- The 5th sentence is now "In the end", so the set forms a story arc.
  - "I was wondering if you could" had no use before the story, so it moves to the scene module.
- Sentence changes:
  - "Frankfurt" became "the wrong flight": a proper noun can trip speech-to-text.
  - "some clothes" instead of "clothes".
  - The situation line for sentence 3 no longer gives away the content.
- One sound feature per tip, aimed at the -ed ending Persian speakers struggle with. ‿ marks on the
  sentence.
- Fewer screens:
  - The result shows inline on the sentence screen, which halves the screen count.
  - Mira's box and the second counter are hidden on sentence screens.
  - One "Hear yourself" button, since "Again" already replays Mira.
- The word check covers the chunk only and is tolerant of the taught reductions. It says "I didn't
  catch", and is not a progress measure.
- Shadowing clips get their own allowance, so they can never use up the story's feedback.
- "You *can* use them", never "you'll use them". The instruction is said once, on the plan screen. The
  story task adds no second line.
- The AI phrase suggestion is a separate, unscored field. It no longer changes the strong/mistakes
  decision or counts as a missed fix.
- Detection patterns were tightened against false positives ("I suppose", "turned out the lights",
  "in the end of").
