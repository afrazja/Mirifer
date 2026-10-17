# "Persian-speaker traps" (Module lab): spec v1

Status: **built in the Module lab** (owner-approved in chat: "build persian-speaker traps"). Persian name: «اشتباه‌های آشنا». It is the third of three new module ideas, after "Say it in English" and "Voice messages".

## Purpose

These are the mistakes that come from Persian itself: «او» for both he and she, «موافق هستم» → "I am agree", «سی سال دارم» → "I have thirty years"… Each one is noticed, explained through the Persian that causes it, then said correctly. It's cheap, because it uses no AI, only speech-to-text, and the bank is reusable across themes.

## The flow (two steps per sentence, 8 sentences)

1. **Intro** (Mira, text). Bottom: Start.
2. **Spot:** "Tap the wrong word." The sentence is shown as word buttons.
   - Bottom: "Hear it" (the wrong sentence, in a non-Mira voice); quiet "Show me the mistake".
   - **A wrong tap:** "Not that one. Try again." After 2 wrong taps, the mistake is shown.
   - **Some other sensible taps are credited** (tapping "sister" in "My sister… He works"): "That works too. But the usual mistake is this one:".
   - **Then a "why" box** (focused) explains it through Persian. Bottom: "Now say it correctly".
3. **Say:** the sentence with the wrong word struck through.
   - Bottom: mic "Say it correctly"; quiet "Show the correct sentence".
   - Recording stops 2.5 s after speech ends (12 s cap).
   - **Results:**
     - ✓ Right!
     - Not yet + "You said …"
     - "You fixed it yourself. Nice. Now say it once, straight through."
     - "That's good English too. Now try it with 'told'."
   - Then "Say it like this" + the right sentence + ▶ Hear it (Mira). Next becomes the main button after a right answer or a third try.
4. **End:** "You said k of 8 right" and a list (right sentence, its trap type, ✓ or "Practise again").

## The 8 traps

| Trap | Wrong → right | From Persian |
|---|---|---|
| he / she | My sister is a doctor. **He** works… → **She** | «او» |
| agree | I **am** agree → I agree | «موافق هستم» |
| say / tell | He **said** me → He **told** me | «گفت» for both |
| age | I **have** thirty years old → I'm thirty | «سی سال دارم» |
| since / for | **since** two years → **for** two years | «از دو سال پیش» |
| than | taller **from** me → taller **than** me | «از من بلندتر» |
| afraid of | afraid **from** dogs → afraid **of** dogs | «از سگ می‌ترسد» |
| bored | I'm so **boring** → **bored** | «حوصله‌ام سر رفته» |

## The check (`src/lib/practice/traps.ts`)

- The transcript is normalised (lower case, plain quotes, no punctuation).
- **Right:** an `accept` pattern matches and no `reject` pattern (the mistake) matches.
- **Self-fixed:** both match.
- **Also good:** good alternative English (e.g. "gave me the answer").
- **The transcription route** (`/api/english/traps`) is never given the sentence or its words, and is asked to keep mistakes. It checks the allowance but doesn't spend it, and is owner-only.

**Risk:** speech-to-text may quietly fix a mistake (for example "I'm agree" written as "I agree"). That makes a wrong answer pass; it never fails a right one. Before this goes into a daily lesson, record each wrong sentence a few times with a Persian accent, and drop or reword any item where the wrong version passes.

## Privacy

The recording goes through our server to OpenAI speech-to-text and is discarded. The check runs on the device, and the results stay in the browser. The privacy page says this.

## Reviews

- **English coach:**
  - "How do you call this?" and "close the light" replaced (not Persian traps) with "taller from" and "afraid from";
  - "going to home" replaced with the age trap;
  - "also OK" taps;
  - wider accepted answers;
  - self-fix and alternative-English messages;
  - rewritten "why" lines;
  - the he/she sentence changed to "doctor", so "She works" isn't blurred by "nurse".
- **Persian:**
  - "why" lines tied to the Persian;
  - since/for corrected;
  - the name «اشتباه‌های آشنا»;
  - shorter intro;
  - an English ?/! now stays with its words in mixed text (shared fix in `bidi.ts`).
- **Learning UX and accessibility:** reviewed screenshots of every screen (English and Persian).

## Future bank

- **Single-tap items:**
  - "married with her" → "married her";
  - "discussed about it" → "discussed it";
  - "a question from you" → "a question for you".
- **Need new modes:**
  - a missing article ("I'm student"): an insert-a-word mode;
  - word order ("a car red", "explain me").
