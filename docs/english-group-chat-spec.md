# Group chat: plan something with friends, the way people really text (spec v2)

Owner's idea (2026-10-28): a module where the learner chats about a situation the way they do on
WhatsApp or Telegram, with AI friends: for example, coordinating a surprise birthday for a mutual
friend. Status: **v2, after the learning-UX and english-coach reviews; built and in the Module lab
(`/practice/english/lab/group-chat`). It joins the step path with Everyday Chapter 2 ("invite,
decline, reschedule").**

## Why it earns its place

- Texting and voice notes are where most adults use English every day (friends abroad, colleagues,
  class groups), and Iranians already send a lot of voice notes.
- It trains what a role-play can't: reacting in a group, agreeing on details across several
  messages, and the register of friends ("I'm in!", "Works for me", "How about 5?"), which Persian
  speakers often make too formal ("Dear friends, I want to inform you…") or hide behind taarof
  ("Whatever you say, you know better").

## What the reviews changed (v1 → v2)

- **A voice-note chat, not a texting lesson with a mic.** The mic is the one main button: tap to
  record, tap to stop, check the words we heard, Send (or Record again). Typing is the quiet way out
  ("Can't talk now? Type"), and counts 0 talk time. If the mic is blocked or unavailable, the chat
  switches to typing with one line saying why.
- **Teach phrases that work spoken and typed.** "lol", "👍" and lowercase are the friends' style;
  the learner is never asked for them, and the review never "fixes" texting style.
- **Goals need evidence.** The AI returns, for each goal, the learner's message number and their own
  words; the server checks the words are really in that message. A friend's line or a bare "ok" to
  a friend's plan never reaches a goal. The friends offer choices and never choose for the learner.
- **The twist only when it clashes.** The AI also returns the plan agreed so far; Leo's news ("Nina
  just told me she's working Saturday till 6 😬") comes only when the time and one more goal are
  agreed and the plan is Saturday before 7. The time must then be agreed again, from a message after
  the news (↺ on the goals chip). No clash: no twist, and nothing is lost.
- **Server-checked limits on the friends:** one or two messages a round; one question at most, in
  the last message; A2 12 / B1 15 words a message; one emoji; only the friends played (Nina never
  writes); only the fact sheet's numbers and prices; never "Dear" or alcohol; at A2 no abbreviations.
- **Lengths:** A2 at most 8 learner messages, B1 12; typed messages A2 200 / B1 300 characters;
  voice notes 30 seconds. The chat closes warmly when every goal is agreed, or at the cap.
- **The end is a sequence:** the result and Mira's one note; then at most two of the learner's
  messages, one per screen ("You said → Friends would say → why"), each with Hear it / Say it; shown
  whether or not every goal was reached. No "words per reply" stat.
- **"Sam" became Nina:** Persian speakers read سام as a man's name. "A week from Saturday" became
  "this Saturday".
- **A2 keeps two friends:** Maya leads (played by the AI); Leo only reacts, with scripted lines when
  the learner reaches a goal ("Works for me! 👍"), so it stays a group chat.

## The screens (one focused thing at a time)

1. **Situation:** the group's name, one line of situation, the three goals, the AI disclosure
   (once). Button: "Open the chat".
2. **The chat:** a one-row header (group, members, the "Goals · 1 of 3" chip, which opens a bottom
   sheet); bubbles with the friend's name in their colour on every bubble; "Maya is typing…" before
   each message (not announced to screen readers; still dots with reduced motion); friends' voice
   notes play only on a tap, with "Show text"; new messages scroll into view only if the learner is
   at the bottom (else "New message ↓"). The composer is the bottom bar.
3. **Result:** "Done." or "You reached N of 3 goals.", and one note from Mira (the first that
   applies: twist missed, a goal missed, taarof, too formal, too long, twist solved, done).
4. **Your message, a bit better** (at most two screens), then Continue.

## The first chat: "Nina's 30th 🤫🎂"

- **A2:** Maya (played) and Leo (scripted reactions). **B1:** both played, and Leo's twist.
- **Facts:** Riverton, Monday evening. Nina turns 30 this Saturday and doesn't know. Rosa's (Italian,
  Elm Street) or a picnic in Riverside Park; the replay: Taco Loco (Main Street) or Lake Park. Maya's
  ideas: Saturday at 4 or 5. Jobs: the cake, the decorations, getting Nina there. B1: a gift together,
  about $20 each. After the twist (B1): Saturday at 7 or later, or Sunday.
- **Goals:** agree on a day and time · choose the place · offer to do one thing.
- **Can-do (A2):** make a plan with friends in a chat: agree on a time and place, and offer to do
  something. **B1, also:** when a plan changes, sort out a new time.

## Engine

- `src/lib/practice/group-chat.ts`: the model (scenes, records, evidence check, Mira's note).
- `src/lib/practice/chats/`: the scenes (`birthday.ts`).
- `POST /api/english/chat`: one round (the checks above, one rewrite, then a fallback line; signed
  goals; the twist; done/settled). `POST /api/english/chat/review`: the end review (at most two
  rewrites, never longer than the message, no new names or times, A2 no slang).
- `GroupChat.svelte`: the screens; `/api/english/listen` takes `group-chat` voice notes;
  `/api/english/voice` plays the friends' voice notes.

## Next

- Wire it into the step path as a step type with Everyday Chapter 2.
- A2 option from the coach: a card "On Saturday you work until 3", so the learner practises
  declining and suggesting another time.
- Reuse the phrases each learner actually sent ("I'm in!", "How about 7?") in the next chapter's
  warm-up.
