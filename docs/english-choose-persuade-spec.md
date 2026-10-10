# "Choose and persuade": spec v2

Status: **approved by the owner and built (Module lab).** v1 was reviewed by the English-coach and learning-UX reviewers; their points are applied (see the end). It is a Module lab module, built and judged on its own, and not yet part of a daily lesson.

## Purpose

B1 learners can describe things. What they struggle with is **arguing**: giving reasons, comparing two options, and keeping their position (or giving way politely) when someone disagrees. That is everyday life (choosing a home, a job, a plan with friends), and it is IELTS-style Speaking Part 3 practice. In the app we never imply a band or a score.

Success means two clear reasons, then an answer to one objection. Agreeing with part of the objection and still keeping the choice is a good answer. So is changing your mind *with a reason*.

## Content (lab version)

American spelling throughout ("apartment", "elevator", "center", "meters"). Prices in euros.

The choice is a real trade-off: the center is cheaper and close but cramped; the suburbs give space but cost more and take longer. Each apartment has three pros and two cons, one point per line.

| | **A: Studio in the city center** | **B: Garden apartment in the suburbs** |
|---|---|---|
| Rent | €800 a month, bills included | €950 a month, plus bills |
| Size | 30 m², one room | 75 m², two bedrooms |
| To work | 5-minute walk | 45 minutes by bus |
| Building | 7th floor, no elevator, great view | Quiet street, shared garden |
| Minus | Noisy street at night | Old kitchen |

Photos: `static/images/lab/flat-a.webp` and `flat-b.webp`. They are AI-generated and illustrative only. Every fact is text, so the task never depends on reading a photo.
- Alt text A: "A small, bright studio with a balcony over a busy city street."
- Alt text B: "A warm dining room with a wooden table and a bay window onto a green garden."
- Note: photo B is warmer and could pull learners towards B. The prices now favour A, which balances it. We'll watch which flat people choose in the lab, and restyle a photo if the choice is lopsided.

**Objections** (written by us; the server picks one and never makes one up). Each one ends in a question, so the learner knows a reply is needed.
- **A**, in this order:
  - noise: "But the street's noisy at night. How are you going to sleep?"
  - size: "It's only 30 square meters. Where will you put all your things?"
  - stairs: "Seven floors and no elevator? How will you carry your shopping up every day?"
- **B**, in this order:
  - commute: "It's 45 minutes each way, so an hour and a half on the bus every day. Won't that get tiring?"
  - price: "It's €150 more a month, and that's before bills. Is the extra space really worth it?"
  - kitchen: "The kitchen's really old. Are you happy cooking in it every day?"

**Picking the objection (no AI).**
- The first transcript is normalised: lower case, no punctuation, and number words turned into digits.
- The server takes the first objection for the chosen apartment whose key words the learner did **not** use:
  - noise: noise, noisy, loud, quiet, street, earplugs
  - size: small, size, space, tiny, square, meters, big
  - stairs: stairs, elevator, lift, floor, 7, seventh, climb
  - commute: bus, commute, travel, far, 45, hour
  - price: price, euro, euros, expensive, cheap, money, cost, pay, bills, 950, 150
  - kitchen: kitchen, cook, cooking
- If the learner covered every point, Mira uses a second form of the least-mentioned objection, so she never sounds as if she wasn't listening:
  - noise: "You said it's noisy, but every night? How are you going to sleep?"
  - size: "You mentioned the size, but 30 square meters is really small. Where will your things go?"
  - stairs: "You talked about the stairs, but seven floors, every single day? Is that really OK?"
  - commute: "You said it's far, but an hour and a half every day? Won't that get tiring?"
  - price: "You mentioned the price, but €150 more every month? Is it really worth it?"
  - kitchen: "You said the kitchen's old, but every day? Are you sure you'll be happy cooking there?"

## The flow

The owner's design rule applies: one focused thing per screen, one primary button at the bottom, and quiet text buttons for anything else. Mira's instruction sits at the top of the first screen and is spoken automatically. Focus moves to the heading on every new screen.

**1. Choose** (one screen, no scrolling at 390 px).
- Mira: "You're moving to a new city for work, and you can rent one of these two apartments. Look at both, and pick one. Then tell me why, and I'll try to change your mind."
- Two photo thumbnails side by side, labelled "A · Studio" and "B · Garden apartment". Under them, a comparison table with matching rows: Rent, Size, To work, Building, Minus.
- Tapping a column or its photo selects it, shown with a check mark and the word "Selected" (never by colour alone). A quiet "See the photo" link opens it large.
- Bottom: "I'd take Apartment A" (or B). It is disabled until one is picked.
- Each column is one control (`aria-pressed`) named "Apartment A, studio in the city center, €800 a month". The table uses `<th scope>`.
- In the Persian UI, the facts stay English (LTR, `<bdi>`), and the A/B labels keep the columns clear in RTL.

**2. Your reasons** (record 15–60 s).
- Mira: "Why this one? Give me two reasons, and say why they matter to you." This line is meant to stop learners just reading the facts aloud.
- A collapsed "Compare again" opens the same compact table, both apartments, so the learner can make comparisons ("it's €150 cheaper").
- A quiet "Need words?" link shows four phrases, each with a Persian gloss. When opened, they stay visible while recording:
  - *The main reason is that…*
  - *Another thing is…*
  - *Even though it's smaller, I…* (without "but", the common Persian-speaker error)
  - *For me, being close to work matters more than space.*
- A quiet "Choose the other one" link is available before recording.
- After Stop, the recording is transcribed ("Mira is listening…"). Then there is a content check:
  - under 15 words, or mostly Persian: "Tell me a bit more: why this one?" and record again;
  - two transcription failures: Mira uses the apartment's first objection and goes on. The learner is never stuck.

**3. Mira tries to change your mind** (record 10–45 s).
- Mira says "Okay. But…" and then the objection. The text appears when the audio ends, with a quiet "Hear it again".
- Earlier taps already unlocked the app's audio player (the same mechanism the other modules use), so phones allow it. If the sound is blocked anyway, the text appears straight away.
- The "Compare again" table and its own "Need words?" link are on this screen too. These are phrases for agreeing in part, with Persian glosses:
  - *That's true, but…*
  - *You have a point, but…*
  - *It's not a big problem for me, because…*
  - *I can always…* (for example, "I can always buy earplugs.")
- The objection is saved as soon as it is picked, so a reload brings back the same one.

**4. Feedback**, two screens, then a second try.
- **F1, "How you argued":**
  - Mira's praise, which quotes the learner's own words.
  - "Your reasons": up to 3 short lines, each tagged with the fact it used.
  - "My question": the objection, their answer as a quote, then one kind sentence. For example: "You agreed it's noisy, then said you sleep with earplugs. That keeps your choice strong." The verdict is shown in words ("You answered it", "You partly answered it", "Not answered yet"), never as a bare label.
  - Bottom: Next.
- **F2, "Phrase 1 of 2":**
  - their words (struck through), then the better phrase, ▶ to hear it, and why.
  - Bottom: "Next phrase", then "Answer me again" on the last phrase. A quiet "Finish" is also available.
- **F3, answer again** (10–45 s): Mira repeats the objection, and the better phrases stay visible as chips.
- **Result:** ✓ next to each phrase they used (same check as Tell your story's second try). Bottom: Done.
- If there are no phrases, F2 is skipped, and F1's button is "Answer me again" with a quiet "Finish".

**Changing your mind:** if the answer switches apartment *with a reason*, that counts as answered. F1 then says, for example: "You changed your mind because of the bus ride. That's a fair reason."

## AI (two transcriptions, one feedback call)

- **Speech to text:** the same service as Tell your story (it keeps the learner's mistakes), with its own small rate limit. The audio is never stored.
- **Feedback:** one call after recording 3. The two transcripts go inside `<reasons>` and `<answer>` tags, with `<` and `>` stripped. The prompt follows the English-coach reviewer's text:
  - **reasons:** up to 3, each `{ quote, text, fact }`, where `fact` is from a fixed id list (price, size, walk, floor, view, noise, bedrooms, commute, garden, quiet, kitchen, personal). Only reasons the learner actually said, never ones taken from the facts.
  - **objection:**
    - "answered": they talk about the point *and* give a reason or solution. Agreeing first is fine; switching with a reason counts.
    - "partly": they mention the point but give no reason or solution.
    - "not answered": otherwise.
    - It comes with `evidence` (their exact words) and one sentence each in English and Persian.
  - **phrases:** at most 2, each at most 14 words at B1. A phrase does one job: makes a reason specific with a fact, compares, agrees and keeps the choice, or says what matters more. Grammar is fixed only inside a phrase chosen for one of those jobs. No "Furthermore"/"Moreover".
  - **praise:** quotes their own words; no banned words.
- **Server checks**, each with its own fallback:
  - a reason's `quote` isn't in transcript 1 → drop that reason;
  - `evidence` isn't in transcript 2 (required for answered and partly), after one retry → hide the verdict line;
  - transcript 2 under 5 words or mostly Persian → "not answered", set by the server;
  - a phrase's `original` isn't in a transcript, or any number in `better` appears in neither the facts nor the transcripts → drop that phrase;
  - praise fails the quote or banned-word check → no praise.
- **Network or AI failure:** "Try again". After 2 failures, "Continue without feedback".
- **Cost:** about 1–2 cents per run.

## Saved data, review, reload

- **In this browser for the day:** the choice, both transcripts, the objection, the feedback and the second try. Recordings are never stored.
- **Reload:** back to the same step. An AI call that already finished is not repeated. If the transcripts are saved but the feedback isn't, the call runs again. A reload during a recording returns to that step's mic.
- **Back:** read-only.
- **Interruptions:** a hidden tab or a call stops the recording, offering "Send what you have" or "Record again", as in Tell your story.
- **Mic denied:** the same screen as Tell your story.
- **Reuse:** the recording pieces become shared with Tell your story, with the time limit as a setting (60 / 45 s), not hard-coded "1 minute" text.

## What changed from v1

**Content**
- The apartments are rebalanced: a real trade-off, one point per line, American "apartment".
- Every objection ends in a question and is about a listed fact.
- Key words are less common, numbers are normalised, and there is a second form of each objection for when every point was covered.

**Flow**
- The choice is a side-by-side comparison table with one bottom button.
- The transcription step before the objection is spelled out, with fallbacks.
- There are phrases for agreeing in part on the objection step.
- The feedback is split, with a second try added.
- Changing your mind with a reason counts as an answer.

**AI**
- Quotes are required for reasons.
- Evidence is required for "partly" too.
- Every check has its own fallback.
- Grammar fixes are kept to persuasive phrases.

**Accessibility and Persian**
- Alt text for both photos, one control per column, focus moves to each new heading.
- English facts are isolated inside the Persian UI.
