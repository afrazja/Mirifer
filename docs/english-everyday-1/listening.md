# Everyday Chapter 1: listening modules

Status: **draft v2, reviews applied** (english-coach and learning-UX reviews, v1). Modules: Listen
and connect (Intermediate) and Listen and retell (Professional). Every fact comes from `world.md`.
US English. Each module is written in the shape of its built `.ts` type, field by field
(`ConnectSet` in `listen-connect.ts`, `RetellPiece` in `retell.ts`), as in
`docs/english-day-3/listening.md`.

**Type check, before the content:**

- **Listen and connect: two parts are valid as built.** `ConnectSet.parts` is a plain `Part[]`. The
  page (`ListenConnect.svelte`) shows "Part n of `parts.length`", and `stepsOf`, `emptyConnectRecord`
  and `asConnectRecord` all follow `parts.length`. The only "three parts" checks are tied to Day 1
  (`STEPS`) and Day 2 (`listen` × 3) in `listen-connect.test.ts`. So no type change is needed. A test
  for this chapter must expect **2** listens, not copy Day 2's 3. (The comment at the top of
  `ListenConnect.svelte` still says "three short parts".)
- **Listen and retell: v1 ships a one-voice narration**, which the type takes today (`text` +
  `voice`). The two-voice version of the meeting (it needs `speakers` and `lines` on `RetellPiece`)
  is kept for later, in the appendix.

Voices: Mira is Ava (`b`) only. Jake is Andrew (`a`), Sara is Emma (`d`). The Professional narrator
is Andrew (`a`). Mr. Patel (Brian, `c`) isn't in these modules.

---

## 1. Listen and connect (Intermediate, A2)

Built in `src/lib/practice/listen-connect.ts`; spec `docs/english-listen-connect-spec.md`. Sara meets
Jake on a Saturday morning at 48 Elm Street (`world.md`, "What happens", steps 1–9). This is **2 parts**
(the brief), 2 Connect causes with 3 results, 4 choice questions, so **6 points**, the same as Days 1–4.

**`MAX_PLAYS`**: 2 per part (as built).

### 1.1 `speakers`

| Key | `name` | `voice` |
|---|---|---|
| `jake` | Jake | `a` (Andrew) |
| `sara` | Sara | `d` (Emma) |

Neither voice is Ava, and the two don't share a voice.

### 1.2 `conversation`

There are 24 lines and 144 words. The built test (Day 2) allows 110 to 160, and the brief says ≤160.
`#` is the line index that `evidence` uses. Each line carries one idea, in short spoken A2 English
with contractions.

| # | `who` | `text` | Words |
|---|---|---|---|
| 0 | jake | Here, let me help you with that. | 7 |
| 1 | sara | Oh, no, it's fine! | 4 |
| 2 | jake | Oh, OK, no problem! Come on, Biscuit, let's go up. | 10 |
| 3 | sara | Whoa! It's falling! | 3 |
| 4 | sara | Actually… yes, please. That'd be great! | 6 |
| 5 | jake | Ha! Sure. Here, I've got it. | 6 |
| 6 | sara | Thanks! I'm Sara. I just moved in. | 7 |
| 7 | jake | Nice to meet you, Sara. I'm Jake, in 4B. | 9 |
| 8 | jake | Shh! That's Biscuit. He's friendly, just loud. | 7 |
| 9 | sara | Hi, Biscuit! | 2 |
| 10 | sara | So, how long have you lived here? | 7 |
| 11 | jake | Six years. You'll love it here. | 6 |
| 12 | jake | Here we are, fourth floor! | 5 |
| 13 | jake | Just so you know, trash goes out Tuesday morning, by eight. | 11 |
| 14 | jake | The truck comes really early. | 5 |
| 15 | sara | Tuesday by eight. Got it, thanks! | 6 |
| 16 | jake | Nice plant! | 2 |
| 17 | sara | Thanks! I love it too. | 5 |
| 18 | jake | Hey, the building's having a barbecue in the backyard. | 9 |
| 19 | sara | Oh, fun! When is it? | 5 |
| 20 | jake | A week from today, Saturday at four. | 7 |
| 21 | jake | Do you want to come? | 5 |
| 22 | sara | I'd love to! Thanks, Jake. | 5 |
| 23 | jake | Great! See you around, Sara! | 5 |

Notes on the lines:
- The taarof moment is as in `world.md`: Jake takes her first no (line 2), the box starts to fall
  (line 3), and Sara accepts (line 4). There's no second offer from Jake.
- There's no sound effect for the barking, because the player only plays voices. "Shh!" (line 8)
  tells the listener that Biscuit is barking.
- Lines 10–11 (Sara asks how long he's lived here) are in `world.md` ("What happens", step 5). They
  model the can-do "ask a question back" and one of the A2 Natural phrases.
- In the `.ts` file, the apostrophes are straight, in double-quoted strings, as in Day 3's
  `listening.ts`. Line 4 uses the ellipsis character (…).

### 1.3 `parts`

| Part | `from` | `to` | `title.en` | `title.fa` | Words |
|---|---|---|---|---|---|
| 0 | 0 | 11 | At the door | دم در | 74 |
| 1 | 12 | 23 | Upstairs | طبقهٔ بالا | 70 |

At a slow A2 pace with short gaps between lines, each part should be about 35–45 seconds. The real
audio still has to be timed.

### 1.4 `linkPhrases`

`actually` (line 4), `just so you know` (line 13), `see you around` (line 23).

- Each phrase occurs once. `linkParts` matches without word boundaries, so I checked that none of
  them appears inside another word or phrase. Line 8's "just loud" isn't a match, because the phrase
  is the whole of "just so you know".
- These aren't logical links like Day 3's. They are the small social phrases this chapter is about:
  changing your mind (the taarof turn), giving useful information, and a friendly goodbye.

### 1.5 Mira's listening goal before Play (the module `intro`)

The chapter's opening line ("This is Sara…") is **only** in the chapter's `checkIn.story` (Mira's
story line, section 3), so it isn't said twice. The intro is just the listening goal, the one thing
to listen for first:

- en: Listen for what happens with Sara's box.
- fa: گوش بده ببین با جعبهٔ سارا چه اتفاقی می‌افتد.

### 1.6 `connect`

The brief asks for one Connect question in part 1: what happened when Sara said "it's fine". I
added a second cause, the box starting to fall, for two reasons:
- With one cause, the Connect screen would have only 2 results (the convention, tested on Day 2, is
  causes + 1). That's a coin toss.
- The second cause completes the taarof turn: her first no, then a yes.

The total is still 6 points (see open question 1).

`causes` (in conversation order):

| # | Cause | `answers` (result index) | `evidence` (line) |
|---|---|---|---|
| 0 | Sara says, "It's fine!" | 2 | 2 |
| 1 | The box starts to fall. | 0 | 4 |

`results` (shuffled once, shown for every cause):

| # | Result | Words |
|---|---|---|
| 0 | Sara says yes to his help. | 6 |
| 1 | Jake says the dog is friendly. *(the extra result: true (line 8), but its cause, the barking, isn't listed)* | 6 |
| 2 | Jake believes her and goes upstairs. | 6 |

**Second-match check** (every cause against every result):
- Cause 0 ("It's fine!"): her yes (result 0) comes after the box starts to fall, not because she said
  it was fine. The dog (result 1) has nothing to do with it. Only result 2 matches.
- Cause 1 (the box starts to fall): Jake going upstairs (result 2) came before it. He comes back to
  help, so it isn't a result of it. Only result 0 matches.

The right answers use other words than the conversation:
- "believes her and goes upstairs" for "Oh, OK, no problem! … let's go up";
- "says yes to his help" for "Actually… yes, please".

"Believes her" also prepares Mira's taarof note in the Traps step ("people usually believe the first
'no'").

### 1.7 `choices`

| # | `kind.en` / `kind.fa` | `question` | `options` (the answer in bold) | `answer` | `evidence` |
|---|---|---|---|---|---|
| 0 | The dog's name / اسم سگ | What's the dog's name? | Max. / **Biscuit.** / Buddy. | 1 | 8 |
| 1 | Trash day / روز زباله | When does the trash go out? | **Tuesday by eight.** / Thursday by eight. / Monday by ten. | 0 | 13 |
| 2 | Taking a compliment / جواب دادن به تعریف | Jake says, "Nice plant!" What does Sara say? | She says it's nothing. / She offers it to Jake. / **She says thank you.** | 2 | 17 |
| 3 | The barbecue / باربیکیو | When is the barbecue? | Today at four. / **Next Saturday at four.** / Tomorrow at two. | 1 | 20 |

Where the wrong options come from:
- **Question 0 (the easy first win):** "Max" and "Buddy" are common dog names that are never said.
  "Biscuit" is said twice (lines 2 and 8), and Sara says it again (line 9).
- **Question 1:** "Thursday" is the Tuesday/Thursday trap, a real listening point. "Monday by ten"
  isn't said. I left out "Tuesday by ten" on purpose. With it, the right answer would be the only
  option that shares a part with both others, so a test-wise learner could pick it without
  listening.
- **Question 2:** the two wrong options are the taarof replies from Traps item 5 ("Oh, it's
  nothing", "Take it, it's yours!"), told in reported speech. The options are reported, not quoted,
  so the right answer isn't the only one in the conversation's exact words.
- **Question 3:**
  - "Today at four" tests catching "a week from today". Today is Saturday, but the learner doesn't
    need to know that.
  - "Tomorrow at two" isn't said. It shares nothing with the answer, so the answer isn't the "hub"
    option.
  - I didn't use "Tuesday at eight". Question 1 has just shown it's the trash time, so it could be
    ruled out without listening. (Day 3 left out "mainstreet714" for the same reason.)

### 1.8 `questions` (order)

| Step | `part` | `kind` | `index` | What it asks | Chapter goal |
|---|---|---|---|---|---|
| 1 | 0 | choice | 0 | The dog's name | the easy first win |
| 2 | 0 | connect | 0 | "It's fine!" → ? | the first no (taarof) |
| 3 | 0 | connect | 1 | The box starts to fall → ? | saying yes to help |
| 4 | 1 | choice | 1 | When the trash goes out | trash day (also the role-play twist) |
| 5 | 1 | choice | 2 | What Sara says to "Nice plant!" | accepting a compliment |
| 6 | 1 | choice | 3 | When the barbecue is | the invitation |

`stepsOf` gives `listen, question, question, question, listen, question, question, question, end`.
Each part has three questions.

### 1.9 `miraLine`

This is the line Mira says at the end, shown with the full conversation.

- en: Sara and Jake used three small phrases: `actually` (I've changed my mind), `just so you know` (here's something useful), `see you around` (a friendly goodbye). Tap a line and listen for them again.
- fa: سارا و جیک سه عبارت کوتاه به کار بردند: `actually` (راستش، نظرم عوض شد)، `just so you know` (محض اطلاعت)، `see you around` (می‌بینمت؛ یک خداحافظی دوستانه). روی یک خط بزن و دوباره به این‌ها گوش بده.

### 1.10 Rule checks

- **Evidence is in the right part.** Every `evidence` line is inside the part its question follows:
  2, 4 and 8 are in part 0 (lines 0–11); 13, 17 and 20 are in part 1 (lines 12–23). Each part has
  three questions.
- **Options are short.** Every result and option has 6 words or fewer. The test allows 8 and the
  spec 7.
- **Connect answers.** `answers` has two different results (2, 0). There are three results, and the
  extra one is true but has no listed cause.
- **Answer positions.** The choice answers fall at positions 1, 0, 2 and 1.
- **No giveaways.**
  - No Connect result names the dog or gives a day or time, so no Connect screen gives away a choice
    answer.
  - The barbecue options don't reuse the trash time.
- **Link phrases.** No link phrase is in bold, or even appears, in the questions or options. Each one
  is in the conversation exactly once.
- **Every answer is in the conversation:**
  - line 2 has "Oh, OK, no problem! … let's go up";
  - line 4 has "Actually… yes, please";
  - line 8 has "That's Biscuit";
  - line 13 has "Tuesday morning, by eight" (and Sara says it back in line 15);
  - line 17 has "Thanks! I love it too";
  - line 20 has "A week from today, Saturday at four".
- **Language of each field.** Questions and options are English only, as on Days 1–4. Persian is
  given for every field of `ConnectSet` that has it: the part titles, the question kinds and
  `miraLine`.
- **Not done yet:** the spec's no-listening test, and timing the real audio.

---

## 2. Listen and retell (Professional, B1+)

Built in `src/lib/practice/retell.ts`; page `ListenRetell.svelte`. **v1 is a one-voice narration**
of the same meeting (valid with the type as built), told by Andrew (`a`) at natural B1 speed. The
learner then retells what happened in 3–4 sentences. The key points are the same as for the
two-voice version (appendix), so either can be swapped in later without changing the check.

| Field | Value |
|---|---|
| `id` | `the-last-box` (kebab-case, unique among the retell ids so far: `lost-phone`, `four-day-week`, `night-market`, `wedding-cake`, `wrong-park-hotel`, `the-way-around`) |
| `title` | en: The last box · fa: آخرین جعبه |
| `level` | `B1` |
| `voice` | `a` (Andrew) |
| `task` | en: Now tell me what happened, in three or four sentences. · fa: حالا در سه یا چهار جمله برایم تعریف کن چه اتفاقی افتاد. |
| `imageAlt` | none (no picture yet) |
| Words | 126 |
| Listening (`listenSeconds`) | 38 s by the built formula (126 ÷ (3.1 × 1.06)); expect about 45–50 s of real audio with the quotes' pauses. Time it. |
| Speaking limit (`speakLimit`) | 1:30 (the piece is 45 s at its written pace, well under 90 s). Plenty for 3–4 sentences. |

### 2.1 `text`

> On Saturday morning, Sara was carrying the last box into her new building. It was full of books, and it was heavy. At the door, she met her neighbor, Jake, and his dog, Biscuit. Jake offered to help, but Sara said, “Oh, no, it’s fine!” So Jake took her at her word and started up the stairs. Then the box started to fall. “Actually… yes, please!” Sara said, and Jake carried it up for her. Biscuit barked all the way. “Shh! Sorry, that’s Biscuit,” Jake said. “He’s friendly, just loud.” Upstairs, he told her that trash goes out on Tuesday morning, by eight. Then he invited her to the building barbecue in the backyard, a week from today at four. Sara said she’d love to come.

Curly apostrophes and quotes, as in Days 2–3's retell pieces.

### 2.2 `keyPoints`

There are 5, in plain English. The built test needs at least 4. Day 2's test pins its own piece at 6.
Five fit a 3–4 sentence retell.

1. Sara was carrying a heavy box into her new building when her neighbor, Jake, offered to help.
2. She said it was fine, so Jake took her at her word and started up the stairs.
3. When the box started to fall, she changed her mind and said yes, and Jake carried it up for her.
4. Upstairs, Jake told her that trash goes out on Tuesday morning, by eight.
5. He invited her to the building barbecue in the backyard, a week from today at four, and she said she'd love to come.

A model retell (4 sentences, covers all 5 points): "Sara was carrying a big box into her new
building, and her neighbor Jake offered to help, but she said it was fine. So he went upstairs, but
then the box started to fall and she said yes, please. Upstairs, he told her that trash goes out on
Tuesday morning by eight. He also invited her to a barbecue next Saturday at four, and she said she'd
love to come."

The dog and the books aren't key points. A retell that mentions them isn't marked down.

### 2.3 Level notes

- **B1 grammar:** the past continuous for the scene (`was carrying`), narrative past simple, reported
  speech (`he told her that trash goes out…`, `she said she'd love to come`).
- **B1 chunks:** `take someone at their word`, `start up the stairs`, `change your mind` (in the key
  points), `a week from today`.
- **What to retell:** the story's turning point (the first no, then a yes) and the two facts the
  learner meets again in Mr. Patel's voice message and the role-play (trash, the barbecue).

---

## 3. Mira's module instructions (for the chapter's tracks in `day.ts`)

**The chapter's opening line goes only in `checkIn.story`** (Mira's story line on the step 1
screen), for both tracks:

- en: This is Sara. She came to Riverton on a trip, and now she lives here. She's just moved into a new apartment, and today she meets her neighbor.
- fa: این ساراست. برای سفر به ریورتون آمد و حالا همین‌جا زندگی می‌کند. تازه به یک آپارتمان جدید اسباب‌کشی کرده و امروز همسایه‌اش را می‌بیند.

The module intros below don't repeat it.

| Track | Module | `title` / `short` | `does` (en / fa) | `intro` (en / fa) |
|---|---|---|---|---|
| Intermediate | `listen-act` | As on Days 2–3: Listen and connect / گوش بده و وصل کن · Listen / گوش دادن | Hear Sara meet Jake, her new neighbor, then answer a few questions. / گوش بده سارا چطور با جیک، همسایهٔ تازه‌اش، آشنا می‌شود و بعد به چند سؤال جواب بده. | As in 1.5: Listen for what happens with Sara's box. / گوش بده ببین با جعبهٔ سارا چه اتفاقی می‌افتد. |
| Professional | `listen-retell` | As on Days 2–3: Listen and retell / گوش بده و بازگو کن · Retell / بازگویی | Hear how Sara meets her new neighbor, then tell what happened. / گوش بده سارا چطور با همسایهٔ تازه‌اش آشنا می‌شود و بعد تعریف کن چه اتفاقی افتاد. | Listen for what happens with Sara's box, then tell me the story. / گوش بده ببین با جعبهٔ سارا چه اتفاقی می‌افتد، بعد ماجرا را برایم تعریف کن. |

The minutes are as on Days 2–3, `{ 15: 4, 20: 4 }`, unless the chapter's plan says otherwise. In
Persian lines, the names are in Persian script (سارا، جیک), as Day 3 writes دنیل.

---

## Notes for the editor

### (a) Open questions

1. **Connect has two causes, not one.** The brief lists one Connect question ("it's fine"). I added
   "The box starts to fall" (see 1.6). This keeps 6 points and three results, and avoids a 50/50
   screen. If the owner wants exactly the brief's five questions, the closest valid shape is 1 cause
   with 3 results and 4 choices (5 points). But it breaks the causes + 1 convention, and the extra
   result has to be weaker.
2. **The link phrases are social phrases, not logical links.** The spec's rule 3 asks for at least
   four logical links and rotating link types. This conversation is too simple for that at A2, and
   its point is the social turn. The A2 list also echoes three Natural phrases ("that'd be great",
   "How long have you lived here?", "See you around!") on purpose; the spec says to echo at most one.
   Confirm that the rule doesn't apply to this chapter.
3. **Things to check in the audio.** When the TTS is generated, check how it reads "4B" (it should be
   "four-B"), "Shh!", "Whoa!" and the ellipsis pauses in "Actually… yes, please". Time each A2 part
   (aim for about 35–45 s) and the B1 narration.
4. **Persian review.** All the Persian uses informal تو. Still to check: «می‌بینمت؛ یک خداحافظی
   دوستانه» for `see you around`, and «محض اطلاعت» for `just so you know`.

Settled since v1: the A2 role-play now counts "Tuesday?" or "Tuesday by eight" (a check back) as
asking (see `conversation.md`), so a learner who remembers the trash rule from this step isn't
marked down; Jake and Biscuit come back from a walk (`world.md`); the B1 step plays one voice in v1.

### (b) Checks done

- **Word counts** (counted with a script, `split(/\s+/)` as in the tests):
  - A2 conversation: 144 words (110–160), 24 lines. The parts are 74 and 70 words.
  - Results and options: 1–6 words (≤8).
  - B1 narration: 126 words. Key points: 13–23 words each.
- **Voices:** Jake is `a` and Sara is `d` (A2). The B1 narrator is `a`. None is Ava (`b`).
- **Nothing contradicts `world.md`:**
  - 48 Elm Street, stairs, no elevator, Saturday morning;
  - Jake: 4B, six years in the building, dog Biscuit (friendly, just loud);
  - Sara is on the fourth floor;
  - trash: Tuesday morning, by 8 ("the truck comes really early");
  - the barbecue: in the backyard, a week from today (Saturday) at four;
  - Sara says yes only after her first "it's fine", and says "Thanks!" to the compliment.
- **Spelling and safety:** US spelling (neighbor, trash, backyard). No real brands or places, no
  prices.

---

## Appendix (later): Listen and retell with two voices

For when `RetellPiece` takes optional `speakers: Record<string, Speaker>` and `lines: Line[]` (the
same types as `ConnectSet`); the page then plays the lines in their voices, and `text` stays the
transcript for the text view and the AI check. Same `id`, `title`, `task` and `keyPoints` as
section 2. It is the same meeting, a little richer than A2: Jake makes two small jokes ("bricks?",
"Best gym in town!"), Sara's plant "survived the move", and Jake says "You should come."

- `speakers`: `jake`: Jake, `a` (Andrew) · `sara`: Sara, `d` (Emma).
- Words: 186 in the lines; 203 in `text` with the speaker names.
- Listening: **about 75–90 s** of real audio (two voices, the gaps between turns, natural pace). The
  built `listenSeconds` formula gives 57–62 s, because it doesn't count the gaps; set the shown time
  from the real audio.
- Speaking limit: 1:30.

| # | `who` | `text` | Words |
|---|---|---|---|
| 0 | jake | Here, let me help you with that. | 7 |
| 1 | sara | Oh, no, it's fine! I've got it. | 7 |
| 2 | jake | Oh, OK, no problem! Come on, Biscuit, up we go. | 10 |
| 3 | sara | Whoa, whoa… it's falling! Actually… yes, please. That'd be great! | 10 |
| 4 | jake | Ha! Sure. Here, give it to me. Wow, what's in here, bricks? | 12 |
| 5 | sara | Books, mostly. Sorry! I'm Sara, by the way. I just moved in. | 12 |
| 6 | jake | Nice to meet you, Sara. I'm Jake, in 4B. Shh! Sorry, that's Biscuit. He's friendly, just loud. | 17 |
| 7 | sara | Hi, Biscuit! So there's no elevator, huh? | 7 |
| 8 | jake | Nope. I've been doing these stairs for six years. Best gym in town! | 13 |
| 9 | jake | Here we are, fourth floor. Oh, and just so you know, trash goes out Tuesday morning, by eight. The truck comes really early. | 23 |
| 10 | sara | Tuesday by eight. Good to know, thanks. | 7 |
| 11 | jake | Hey, nice plant! | 3 |
| 12 | sara | Thanks! I love it too. It survived the move, so that's something. | 12 |
| 13 | jake | Ha! Listen, the building's having a barbecue in the backyard a week from today, Saturday at four. You should come. It's a good way to meet everyone. | 27 |
| 14 | sara | Oh, I'd love to! Thanks, Jake. | 6 |
| 15 | jake | Great! Well, I'll let you unpack. See you around, Sara! | 10 |
| 16 | sara | See you around! | 3 |

`text` (the transcript):

> Jake: Here, let me help you with that. Sara: Oh, no, it's fine! I've got it. Jake: Oh, OK, no problem! Come on, Biscuit, up we go. Sara: Whoa, whoa… it's falling! Actually… yes, please. That'd be great! Jake: Ha! Sure. Here, give it to me. Wow, what's in here, bricks? Sara: Books, mostly. Sorry! I'm Sara, by the way. I just moved in. Jake: Nice to meet you, Sara. I'm Jake, in 4B. Shh! Sorry, that's Biscuit. He's friendly, just loud. Sara: Hi, Biscuit! So there's no elevator, huh? Jake: Nope. I've been doing these stairs for six years. Best gym in town! Jake: Here we are, fourth floor. Oh, and just so you know, trash goes out Tuesday morning, by eight. The truck comes really early. Sara: Tuesday by eight. Good to know, thanks. Jake: Hey, nice plant! Sara: Thanks! I love it too. It survived the move, so that's something. Jake: Ha! Listen, the building's having a barbecue in the backyard a week from today, Saturday at four. You should come. It's a good way to meet everyone. Sara: Oh, I'd love to! Thanks, Jake. Jake: Great! Well, I'll let you unpack. See you around, Sara! Sara: See you around!

B1 level notes for this version: the present perfect continuous (`I've been doing these stairs for
six years`), the present continuous for a plan (`the building's having a barbecue`), `I'll let you
unpack` (it echoes the B1 Natural phrase "Anyway, I'll let you go"); chunks `up we go`, `give it to
me`, `by the way`, `just so you know`, `good to know`, `it survived the move`, `a good way to meet
everyone`. Facts only this version uses (already in `world.md`'s story): the box is mostly books;
no elevator ("best gym in town"); the plant survived the move.
