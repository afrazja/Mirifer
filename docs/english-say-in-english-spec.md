# "Say it in English" (Module lab): spec v1

Status: **built in the Module lab** (owner-approved in chat: "I like all your 3 suggestions… first do the say in English, come up with 4 sentences"). It is one of three new module ideas; the other two are Voice messages and Persian-speaker traps.

## Purpose

Every other module starts from English. This one starts from what the learner wants to say, in Persian, and trains the real-life step: turning it into English that a listener understands, without translating word for word. It's well suited to a bilingual app.

## The flow (one thing per screen)

1. **Intro** (Mira): "I'll show you a short message in Persian and who it's for. Say it in English, the way you'd really say it to them…". Bottom: Start.
2. **A message** (4 in a round): who it's for, then the Persian message in a box.
   - Bottom: mic "Say it in English"; quiet "Show a hint" (key English words with Persian), which then becomes "Skip this one".
   - Recording stops by itself 2.5 s after they stop speaking (20 s cap), or on Stop.
3. **Checking…** The server transcribes the recording (OpenAI) and makes one AI call.
4. **Verdict:**
   - ✓ Clear / ≈ Almost ("They wouldn't know that …", built from our own meaning points) / ✗ Not yet / "Say it in English this time" (they spoke Persian);
   - then "You said …", a natural way to say it (missing points highlighted), ▶ Hear it / ▶ My voice, and one tip (in Persian in the Persian UI).
   - Bottom: after ✓, "Next" (quiet "Say it again"); otherwise "Try again" (quiet "Next").
5. **End:** "k of 4 clear" and a list of each Persian message with the English version and its mark. Bottom: Done; quiet "Start again".

## The 4 messages (a short trip)

| To | Persian message | Meaning points | Main trap |
|---|---|---|---|
| A taxi driver | لطفاً من رو ببرید هتل پارک. چقدر طول می‌کشه؟ | go to the Park Hotel; how long it takes | «چقدر» → "How much?" (asks the price) |
| The hotel receptionist | سلام، یه اتاق به اسم رضایی رزرو کردم. می‌شه زودتر اتاق رو تحویل بگیرم؟ | a booking under Rezaei; check in early | «تحویل گرفتن» → "receive the room" |
| A waiter | ببخشید، من گوشت نمی‌خورم. این غذا گوشت داره؟ | doesn't eat meat; does this dish have meat | "I am not eat", "This food has meat?" |
| A friend at the airport | پروازم تأخیر داره. حدود ساعت نه می‌رسم. | the flight is delayed; arriving at about nine | "My flight has delay" |

The messages are in spoken Persian, because they're quoted speech; the rest of the UI is standard written Persian with «تو».

## The AI check (`src/lib/server/say-in-english-ai.ts`)

- **Returns:** english, points (one per meaning point), better, tip, tipFa.
- **Generous:** the goal is to be understood. "How much?" without "time" counts as asking the price, so it's false. Persian written in Latin letters is not English.
- **better:** the fewest changes to their sentence; [brackets] only for a missing meaning point.
- **Code checks:**
  - a Persian-script answer is never "English";
  - missing points count as not understood;
  - "better" must be mostly their words (no long or invented sentence), otherwise a model answer;
  - a tip needs both an English and a Persian version.
- One unit of the daily AI allowance per try. The route is owner-only (404 for others).

## Privacy

Recordings go through our server to OpenAI speech-to-text and are discarded. The text goes to the AI providers. Tries stay only in the browser. The privacy page says this.

## Reviews

- **English coach:**
  - the "How much" trap and Finglish in the prompt;
  - "better" kept close to their words;
  - limits on tips;
  - "Not yet…" wording;
  - 2.5 s auto-stop.
- **Persian:**
  - the messages in spoken Persian;
  - the "Almost" sentence;
  - «واضح»;
  - more natural lines;
  - tips in «تو» with «» quotes.
- **Learning UX and accessibility** reviewed screenshots of every screen (English and Persian).

## Next

One set of messages per daily theme (about 4–5 per lesson). If it works, it becomes a seventh module of the daily lessons.
