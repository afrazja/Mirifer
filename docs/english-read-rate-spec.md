# "Read, rate, respond" (Module lab): spec v1

Status: **approved by the owner in chat ("build as your recommendations") and built (Module lab).** Reviewed by the English-coach and Persian-localization reviewers.

Owner's decisions (as recommended): AI feedback that checks the reply against the text; respond by speaking only; three texts.

## Purpose

The module with reading, linking reading to speaking, like everyday life: read something short, form an opinion, reply. The reply has to **use facts from the text**, so it checks understanding as well as speaking. The other speaking modules are about the learner; this one is about what they read.

## The texts

| Text | Rate | Respond (speak) |
|---|---|---|
| A hotel review (good and bad points) | ★ 1–5: "How good is this hotel?" | A friend wants to book it: should they, and why? Use details from the review. |
| A message from a friend, Leila (a job in Dubai: better pay and English, but far from family) | "Take the job" / "Stay" | A voice message with your advice and at least one reason from her message. |
| A gym ad (cheap offer, but a 12-month contract, paid parking) | ★ 1–5: "Is it a good deal?" | Would you sign up? Say why, using two details from the ad. |

Each text has 2–3 harder words, dotted; tapping one shows it in Persian.

## The flow (one thing per screen)

1. **Read.** The text, and tap a dotted word for Persian. Bottom: "I've read it".
2. **Rate.** Five stars or two choices. Quiet: "Read it again". Bottom: "Next".
3. **Respond.** The task, "Your rating: ★★★★☆", a folded "See the text" (open it if you need it), and the mic (up to 45 s; tap to stop). Very short, silent or interrupted recordings don't count.
4. **I heard.** The transcript. Quiet: "Say it again". Bottom: "Get feedback". (Feedback costs an AI call, so a misheard reply can be redone first.)
5. **Feedback.**
   - "You said".
   - ✓/✗ Used details from the text: each fact they used, ✓ or ✗; a wrong one shows what the text really says.
   - ✓/✗ Gave a reason.
   - "A better reply", with anything added from the text [highlighted].
   - Off-task reply: "That doesn't really answer the task…".
   - Quiet: "Try this one again". Bottom: "Next text".
6. **Result.** Replies that used details from the text, and replies with a reason, out of three, plus one tip. Bottom: "Done". Quiet: "Try it again".

## AI and checks

- One call per reply ("Get feedback"): `onTopic`, `facts` (at most 4: said, correct, fix), `reason`, `better`. The text is ours; the reply is wrapped as data.
- Checks: a fact needs what was said, and a fix if it's wrong; no Persian; the better reply is at most 60 words, and outside brackets most of its words come from the reply or the text, so it can't invent facts.
- If the AI fails: "Mira couldn't check it just now", and the learner can try again (nothing is lost).

## Data and cost

- Speech-to-text per reply, plus one AI call per feedback: about 1–2 cents a round. One allowance unit per feedback.
- Recordings are never stored. The replies and feedback stay only in this browser.
