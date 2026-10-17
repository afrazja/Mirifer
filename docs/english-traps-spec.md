# "Persian-speaker traps" (Module lab): spec v1

Status: **built in the Module lab** (owner-approved in chat: "build persian-speaker traps"). Persian name: «اشتباه‌های آشنا». It is the third of three new module ideas, after "Say it in English" and "Voice messages".

## Purpose

These are the mistakes that come from Persian itself: «او» for both he and she, «موافق هستم» → "I am agree", «سی سال دارم» → "I have thirty years"… Each one is noticed, explained through the Persian that causes it, then said correctly. It's cheap, because it uses no AI, only speech-to-text, and the bank is reusable across themes.

## The flow (two steps per sentence, 8 sentences)

1. **Intro** (Mira, text). Bottom: Start.
2. **Spot:** "Tap the wrong word." The sentence is shown as word buttons.
   - No bottom button while looking: tapping a word is the action. A quiet "Show me the mistake" link sits under the words. The wrong sentence is never read aloud, because that would model the mistake.
   - **A wrong tap:** "Not that one. Try again." After 2 wrong taps, the mistake is shown.
   - **Some other sensible taps are credited** with the sentence they make (tapping "sister": "That works too: 'My brother is a doctor. He works at night.' But the usual mistake is 'He'").
   - **Then a "why" box** (focused) names the word and explains it through Persian. Bottom: "Now say it correctly".
3. **Say:** the sentence with the wrong word struck through.
   - Bottom: mic "Say it correctly"; quiet "Show the correct sentence".
   - Recording stops 3 s after speech ends (12 s cap). "Skip this sentence" is always available, for anyone who can't speak.
   - **Results:**
     - ✓ Right!
     - Not yet + "You said …"
     - "You fixed it yourself. Nice. Now say it once, straight through."
     - "That's good English too. Now try it with 'told'."
   - **After a first miss:** the "why" line again, as a hint. The correct sentence ("Say it like this" + ▶ Hear it, read by Mira) appears only after a second miss, on a right answer (no label), or on request.
   - Self-fixed and alternative-English messages are in a neutral colour (not red).
   - Next becomes the main button after a right answer or a third try.
4. **End:** "You said k of 8 right", then only the sentences not yet said right.
   - Bottom: "Practise the n you missed" (only those, say step only); quiet "Done".
   - If all were right: "Every sentence, said right." Bottom: Done; quiet "Start again".

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
- **Learning UX and accessibility:** reviewed screenshots of every screen (English and Persian). Their must-fixes are in:
  - no "Hear it" as the main action and no audio of the wrong sentence;
  - the answer held back until a second miss;
  - no correction label on a right answer;
  - non-red praise;
  - practise only the missed sentences;
  - the also-OK sentence shown;
  - the second "Not that one" announced;
  - Persian labels read in Persian;
  - Skip always available;
  - a labelled word group;
  - 44 px word buttons;
  - a 3 s auto-stop.

## Future bank

- **Single-tap items:**
  - "married with her" → "married her";
  - "discussed about it" → "discussed it";
  - "a question from you" → "a question for you".
- **Need new modes:**
  - a missing article ("I'm student"): an insert-a-word mode;
  - word order ("a car red", "explain me").
