# "Choose and persuade": spec v1

Status: draft for review, then owner approval. A Module lab module (built and judged on its own, not yet part of a daily lesson).

## Purpose

B1 learners can describe things. They struggle to **argue**: give reasons, compare, and hold their position, or give way politely, when someone pushes back. That is everyday life (choosing a flat, a job, a plan with friends) and IELTS Speaking Part 3.

Success is giving two clear reasons, then answering one objection without freezing: defending the choice, or conceding part of the objection and keeping the choice.

## The flow

The owner's design rule applies: one focused thing per screen, one primary button at the bottom, Mira's instruction at the top of the first screen, spoken automatically.

1. **The choice.**
   - Mira: "You're moving to a new city for work, and you can rent one of these two flats. Look at both, pick one, and tell me why. Then I'll push back once."
   - Two flat cards, one above the other. Each has a photo and five short facts as text.
   - Tapping a card opens it full-width, with the facts larger. The button on it reads "I'd take this one". Back returns to both cards.
2. **Your reasons** (record up to 60 s, at least 15 s).
   - Mira: "Why this one? Give me at least two reasons."
   - The chosen flat's facts stay visible as a small strip.
   - A quiet "Need words?" link shows four phrases: *The main reason is…*, *It makes more sense for me because…*, *Even though …, …*, *For me, … matters more than …*.
3. **Mira pushes back.**
   - Mira says one objection, spoken and shown as text. It is about a weak point of the chosen flat that the learner didn't mention.
   - Bottom: mic, "Answer her" (record up to 45 s).
4. **Feedback** (one screen).
   - "Your reasons": the reasons the learner gave, as short lines (up to 3).
   - "Her objection": answered / partly / not answered, with one line on what they did ("You agreed it's noisy, then said you sleep with earplugs. That's a good way to keep your choice.").
   - One or two **phrases to sound more persuasive**, taken from their own words → better (for example "I think it's good because it's near" → "The main reason is that it's only five minutes from work").
   - Bottom: Done.

## Content (lab version)

Spelling is American; currency is euros (neutral for Persian learners abroad).

**Flat A: city-center studio** (photo `flat-a`)
- **€950 a month**
- 28 m², one room
- 5 minutes' walk to work
- 7th floor, bright, small balcony
- Street noise at night

**Flat B: garden flat in the suburbs** (photo `flat-b`)
- **€780 a month**
- 75 m², two bedrooms
- 45 minutes to work by bus
- Quiet, big window onto a garden
- Old kitchen

**Objections** (written by us; the server picks one, it never makes one up):
- Flat A:
  - noise: "But the street is noisy at night. How are you going to sleep?"
  - size: "It's only 28 square meters. Where will you put all your things?"
  - price: "It's €170 more than the other flat. Is it really worth that every month?"
- Flat B:
  - commute: "It's 45 minutes by bus each way. That's an hour and a half every day."
  - kitchen: "The kitchen is really old. Won't that drive you crazy?"
  - location: "It's far from the center. What will you do in the evenings?"

**How the objection is chosen** (no AI): each objection has key words (noise: noisy, noise, loud, quiet, sleep). The server takes the first objection for the chosen flat whose key words the learner did **not** use in their reasons. If they covered all of them, it takes the first one.

## AI (one call, after the second recording)

- Speech to text: both recordings, using the same service as Tell your story (it keeps the learner's mistakes).
- The feedback call gets the two flats' facts, the chosen flat, the objection, and both transcripts inside data tags. It returns:
  - `reasons`: up to 3, each `{ text, fact }`, where `fact` names which listed fact it uses ("price", "distance", …) or "personal".
  - `objection`: `answered` | `partly` | `not answered`, plus one short line in English and Persian.
  - `phrases`: up to 2, each `{ original, better, whyEn, whyFa }`. `original` is copied from a transcript; `better` is at most 14 words and at B1.
  - `praise`: quotes the learner's own words, as in Tell your story.
- Server checks:
  - every `original` and every quote is in a transcript;
  - "answered" requires a transcript-2 quote as evidence;
  - every `fact` is from the listed facts.

  If a check fails, it retries once, then shows the feedback without the phrases.
- Cost: about 1–2 cents per run.

## Saved data, review, reload

- Browser only, for the day: the choice, both transcripts, the objection and the feedback. Recordings are never stored.
- Reload returns to the same step, with no new AI call.
- Back is read-only.

## Pictures

- They live in `static/images/lab/`: a full-size and a 640-px version of each, as WebP.
- They are AI-generated and illustrative only. The facts are always text, so the task never depends on reading a photo.
- Alt text describes the photo, for example "A small bright studio with a balcony over a busy city street".
