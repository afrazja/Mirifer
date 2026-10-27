# Everyday Chapter 1: listening modules (draft)

Status: **draft v1, for review.** Modules: Listen and connect (Intermediate) and Listen and retell
(Professional). Every fact comes from `world.md`; additions are listed at the end, under "New facts
for world.md". US English. Each module is written in the shape of its built `.ts` type, field by
field (`ConnectSet` in `listen-connect.ts`, `RetellPiece` in `retell.ts`), as in
`docs/english-day-3/listening.md`.

**Type check, before the content:**

- **Listen and connect: two parts are valid as built.** `ConnectSet.parts` is a plain `Part[]`. The
  page (`ListenConnect.svelte`) shows "Part n of `parts.length`", and `stepsOf`, `emptyConnectRecord`
  and `asConnectRecord` all follow `parts.length`. The only "three parts" checks are tied to Day 1
  (`STEPS`) and Day 2 (`listen` × 3) in `listen-connect.test.ts`. So no type change is needed. A test
  for this chapter must expect **2** listens, not copy Day 2's 3. (The comment at the top of
  `ListenConnect.svelte` still says "three short parts".)
- **Listen and retell: the type has one voice.** `RetellPiece` has one `text` and one `voice`, and
  the page plays it as one recording (`/api/english/voice?voice=…&piece=…`). The brief wants "the same
  conversation at natural speed", which needs two voices (Jake `a`, Sara `d`). Today it can't be
  played as a dialogue. **Proposed engineering need (add to README's list as 9):** add two optional
  fields to `RetellPiece`, `speakers: Record<string, Speaker>` and `lines: Line[]` (the same types as
  `ConnectSet`). When `lines` is set, the page plays the lines in their voices, as Listen and connect
  does. `text` stays the transcript, for the text view and the AI check. Section 2 is written in this
  shape. If engineering says no, the fallback that is valid today is a one-voice narration of the
  meeting (as on Day 3). I haven't written one; I can on request.

Voices: Mira is Ava (`b`) only. Jake is Andrew (`a`), Sara is Emma (`d`). Mr. Patel (Brian, `c`)
isn't in these modules.

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
| 3 | sara | Whoa! It's slipping! | 3 |
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
- The taarof moment is as in `world.md`: Jake takes her first no (line 2), the box slips (line 3),
  and Sara accepts (line 4). There's no second offer from Jake.
- There's no sound effect for the barking, because the player only plays voices. "Shh!" (line 8)
  tells the listener that Biscuit is barking.
- Line 10–11 (Sara asks how long he's lived here) isn't in `world.md`'s list of what happens, but
  its fact (six years) is. It models the can-do "ask a question back" and one of the A2 Natural
  phrases. See "New facts".
- In the `.ts` file, the apostrophes are straight, in double-quoted strings, as in Day 3's
  `listening.ts`. Line 4 uses the ellipsis character (…).

### 1.3 `parts`

| Part | `from` | `to` | `title.en` | `title.fa` | Words |
|---|---|---|---|---|---|
| 0 | 0 | 11 | At the door | دمِ در | 74 |
| 1 | 12 | 23 | Upstairs | طبقهٔ بالا | 70 |

At a slow A2 pace with short gaps between lines, each part should be about 35–45 seconds. The real
audio still has to be timed.

### 1.4 `linkPhrases`

`actually` (line 4), `just so you know` (line 13), `see you around` (line 23).

- Each phrase occurs once. `linkParts` matches without word boundaries, so I checked that none of
  them appears inside another word or phrase. Line 8's "just loud" isn't a match, because the phrase
  is the whole of "just so you know".
- These aren't logical links like Day 3's. They are the small social phrases this chapter is about:
  changing your mind (the taarof turn), giving useful information, and a friendly goodbye. See Open
  question 3.

### 1.5 Mira's listening goal before Play

This is the module `intro`, the same text as in section 3. It opens with the chapter's opening line
from the brief, then gives the listening goal, which matches the five questions.

- en: This is Sara. She came to Riverton on a trip, and now she lives here. She's just moved into a new apartment, and today she meets her neighbor. Listen for the dog's name, what happens with her box, trash day, what Sara says to a compliment, and when the barbecue is.
- fa: این ساراست. برای سفر به ریورتون آمد و حالا همین‌جا زندگی می‌کند. تازه به یک آپارتمان جدید اسباب‌کشی کرده و امروز همسایه‌اش را می‌بیند. گوش بده ببین اسم سگ چیست، با جعبه‌اش چه اتفاقی می‌افتد، زباله را کِی باید بیرون گذاشت، سارا در جواب تعریف چه می‌گوید و باربیکیو کِی است.

### 1.6 `connect`

The brief asks for one Connect question in part 1: what happened when Sara said "it's fine". I
added a second cause, the box slipping, for two reasons:
- With one cause, the Connect screen would have only 2 results (the convention, tested on Day 2, is
  causes + 1). That's a coin toss.
- The second cause completes the taarof turn: her first no, then a yes.

The total is still 6 points (see Open question 1).

`causes` (in conversation order):

| # | Cause | `answers` (result index) | `evidence` (line) |
|---|---|---|---|
| 0 | Sara says, "It's fine!" | 2 | 2 |
| 1 | The box starts to slip. | 0 | 4 |

`results` (shuffled once, shown for every cause):

| # | Result | Words |
|---|---|---|
| 0 | Sara says yes to his help. | 6 |
| 1 | Jake says the dog is friendly. *(the extra result: true (line 8), but its cause, the barking, isn't listed)* | 6 |
| 2 | Jake believes her and goes upstairs. | 6 |

**Second-match check** (every cause against every result):
- Cause 0 ("It's fine!"): her yes (result 0) comes after the box slips, not because she said it was
  fine. The dog (result 1) has nothing to do with it. Only result 2 matches.
- Cause 1 (the box slips): Jake going upstairs (result 2) came before the slip. He comes back to
  help, so it isn't a result of it. Only result 0 matches.

The right answers use other words than the conversation:
- "believes her and goes upstairs" for "Oh, OK, no problem! … let's go up";
- "says yes to his help" for "Actually… yes, please".

"Believes her" also prepares Mira's taarof note in the Traps step ("people often believe the first
'no'").

### 1.7 `choices`

| # | `kind.en` / `kind.fa` | `question` | `options` (the answer in bold) | `answer` | `evidence` |
|---|---|---|---|---|---|
| 0 | The dog's name / اسم سگ | What's the dog's name? | Max. / **Biscuit.** / Buddy. | 1 | 8 |
| 1 | Trash day / روز زباله | When does the trash go out? | **Tuesday by eight.** / Thursday by eight. / Monday by ten. | 0 | 13 |
| 2 | A compliment / جواب تعریف | Jake says, "Nice plant!" What does Sara say? | She says it's nothing. / She offers it to Jake. / **She says thank you.** | 2 | 17 |
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
| 3 | 0 | connect | 1 | The box slips → ? | saying yes to help |
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

Built in `src/lib/practice/retell.ts`; page `ListenRetell.svelte`. It is the same meeting, heard as
a two-voice conversation at natural speed and a little richer than the A2 version:
- Jake makes two small jokes ("bricks?", "Best gym in town!");
- Sara's plant "survived the move";
- Jake says "You should come."

Sara says "Oh, no, it's fine!" first, as in `world.md` ("Are you sure? That'd be great" is a
Natural phrase for later, not here). The learner then retells what happened in 3–4 sentences.

**This needs the proposed `speakers` and `lines` fields** (see "Type check" at the top). Every other
field is as built.

| Field | Value |
|---|---|
| `id` | `the-last-box` (kebab-case, 12 characters, unique among the retell ids so far: `lost-phone`, `four-day-week`, `night-market`, `wedding-cake`, `wrong-park-hotel`, `the-way-around`) |
| `title` | en: The last box · fa: آخرین جعبه |
| `level` | `B1` |
| `voice` | `a` (as built; unused when `lines` is set) |
| `speakers` *(proposed)* | `jake`: Jake, `a` (Andrew) · `sara`: Sara, `d` (Emma), the same as section 1.1 |
| `task` | en: Now tell what happened, in three or four sentences. · fa: حالا در سه یا چهار جمله تعریف کن چه اتفاقی افتاد. |
| `imageAlt` | none (no picture yet) |
| Words | 186 in the lines; 203 in `text` with the speaker names |
| Listening (`listenSeconds`) | ≈ 1:00 (57 s from the lines, 62 s from `text`, plus the gaps between lines) |
| Speaking limit (`speakLimit`) | 1:30. At its written pace it is 67–73 s, which is under 90 s. That's plenty for 3–4 sentences. |

### 2.1 `lines` *(proposed field)*

| # | `who` | `text` | Words |
|---|---|---|---|
| 0 | jake | Here, let me help you with that. | 7 |
| 1 | sara | Oh, no, it's fine! I've got it. | 7 |
| 2 | jake | Oh, OK, no problem! Come on, Biscuit, up we go. | 10 |
| 3 | sara | Whoa, whoa… it's slipping! Actually… yes, please. That'd be great! | 10 |
| 4 | jake | Ha! Sure. Here, give it to me. Wow, what's in here, bricks? | 12 |
| 5 | sara | Books, mostly. Sorry! I'm Sara, by the way. I just moved in. | 12 |
| 6 | jake | Nice to meet you, Sara. I'm Jake, in 4B. Shh, buddy! That's Biscuit. He's friendly, just loud. | 17 |
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

### 2.2 `text`

The transcript, built from the lines with the speaker names (for "Show the text" and the AI check):

> Jake: Here, let me help you with that. Sara: Oh, no, it's fine! I've got it. Jake: Oh, OK, no problem! Come on, Biscuit, up we go. Sara: Whoa, whoa… it's slipping! Actually… yes, please. That'd be great! Jake: Ha! Sure. Here, give it to me. Wow, what's in here, bricks? Sara: Books, mostly. Sorry! I'm Sara, by the way. I just moved in. Jake: Nice to meet you, Sara. I'm Jake, in 4B. Shh, buddy! That's Biscuit. He's friendly, just loud. Sara: Hi, Biscuit! So there's no elevator, huh? Jake: Nope. I've been doing these stairs for six years. Best gym in town! Jake: Here we are, fourth floor. Oh, and just so you know, trash goes out Tuesday morning, by eight. The truck comes really early. Sara: Tuesday by eight. Good to know, thanks. Jake: Hey, nice plant! Sara: Thanks! I love it too. It survived the move, so that's something. Jake: Ha! Listen, the building's having a barbecue in the backyard a week from today, Saturday at four. You should come. It's a good way to meet everyone. Sara: Oh, I'd love to! Thanks, Jake. Jake: Great! Well, I'll let you unpack. See you around, Sara! Sara: See you around!

In the `.ts` file, use curly apostrophes as Days 2–3's retell pieces do (it’s, I’ve, That’d). The
text view could show one line per speaker turn; that's for the engineer.

### 2.3 `keyPoints`

There are 5, in plain English. The built test needs at least 4. Day 2's test pins its own piece at 6.
Five fit a 3–4 sentence retell; Day 3's six were for a longer story.

1. Sara was carrying a heavy box into her new building when her neighbor, Jake, offered to help.
2. She said it was fine, so Jake took her at her word and started up the stairs.
3. When the box started to slip, she changed her mind and said yes, and Jake carried it up for her.
4. Upstairs, Jake told her that trash goes out on Tuesday morning, by eight.
5. He invited her to the building barbecue in the backyard, a week from today at four, and she said she'd love to come.

A model retell (4 sentences, covers all 5 points): "Sara was carrying a big box into her new
building, and her neighbor Jake offered to help, but she said it was fine. So he went upstairs, but
then the box started to slip and she said yes, please. Upstairs, he told her that trash goes out on
Tuesday morning by eight. He also invited her to a barbecue next Saturday at four, and she said she'd
love to come."

The dog, the jokes and the plant aren't key points. A retell that mentions them isn't marked down.

### 2.4 Level notes

- **B1 grammar:** the present perfect continuous (`I've been doing these stairs for six years`), the
  present continuous for a plan (`the building's having a barbecue`), and `I'll let you unpack`.
- **B1 chunks:**
  - `up we go`, `give it to me`, `by the way`, `just so you know`, `good to know`;
  - `it survived the move`, `so that's something`, `a good way to meet everyone`;
  - `I'll let you …` (it echoes the B1 Natural phrase "Anyway, I'll let you go").
- **Natural speed:** the turns are longer than in A2 and carry two or three ideas each. Line 9 has
  three.
- **What to retell:** the key points are the story's turning point (the first no, then a yes) and
  the two facts the learner meets again in Mr. Patel's voice message and the role-play (trash, the
  barbecue).

---

## 3. Mira's module instructions (for the chapter's tracks in `day.ts`)

| Track | Module | `title` / `short` | `does` (en / fa) | `intro` (en / fa) |
|---|---|---|---|---|
| Intermediate | `listen-act` | As on Days 2–3: Listen and connect / گوش بده و وصل کن · Listen / گوش دادن | Hear Sara meet Jake, her new neighbor, then answer a few questions about it. / آشنایی سارا با جیک، همسایهٔ جدیدش، را بشنو و به چند سؤال درباره‌اش جواب بده. | As in 1.5. |
| Professional | `listen-retell` | As on Days 2–3: Listen and retell / گوش بده و بازگو کن · Retell / بازگویی | Hear Sara meet her new neighbor at natural speed, then tell what happened. / آشنایی سارا با همسایهٔ جدیدش را با سرعت طبیعی بشنو و بعد تعریف کن چه اتفاقی افتاد. | This is Sara. She came to Riverton on a trip, and now she lives here. She's just moved into a new apartment, and today she meets her neighbor. Listen to them at natural speed, then tell what happened in three or four sentences. / این ساراست. برای سفر به ریورتون آمد و حالا همین‌جا زندگی می‌کند. تازه به یک آپارتمان جدید اسباب‌کشی کرده و امروز همسایه‌اش را می‌بیند. به حرف‌هایشان با سرعت طبیعی گوش بده و بعد در سه یا چهار جمله تعریف کن چه اتفاقی افتاد. |

The minutes are as on Days 2–3, `{ 15: 4, 20: 4 }`, unless the chapter's plan says otherwise. Both
intros open with the brief's opening line, because step 1 is the chapter's first screen. The "Remember
Jake…" clause is for steps 2–5. In Persian lines, the names are in Persian script (سارا، جیک), as Day 3
writes دنیل.

---

## Notes for the editor

### (a) Open questions

1. **Connect has two causes, not one.** The brief lists one Connect question ("it's fine"). I added
   "The box starts to slip" (see 1.6). This keeps 6 points and three results, and avoids a 50/50
   screen. If the owner wants exactly the brief's five questions, the closest valid shape is 1 cause
   with 3 results and 4 choices (5 points). But it breaks the causes + 1 convention, and the extra
   result has to be weaker.
2. **The A2 listening tells the trash rule before the A2 role-play twist.** The twist plays Jake's
   trash line fast and expects the learner to ask him to repeat it. A learner who remembers "Tuesday
   by eight" from step 1 may just say "OK, thanks", which doesn't count. That isn't a problem with
   this file, but `conversation.md` should make the goal card ask for the repeat, or accept "Tuesday
   by eight, right?" (a check, which the brief's counts list already allows as "Did you say
   Tuesday?").
3. **The link phrases are social phrases, not logical links.** The spec's rule 3 asks for at least
   four logical links and rotating link types. This conversation is too simple for that at A2, and
   its point is the social turn. I chose `actually`, `just so you know` and `see you around`.
   - Echoes of the Natural phrases: the A2 list echoes "that'd be great", "How long have you lived
     here?" and "See you around!". The spec says to echo at most one, but here the brief puts these
     lines in the scene on purpose. Confirm that the rule doesn't apply to this chapter.
4. **Jake "comes out" with Biscuit, then "starts up the stairs"** (`world.md`, steps 1 and 3). These
   only fit if he is coming back in. I suggest `world.md` step 1 reads "Jake and Biscuit come back
   from a walk, and he holds the door." The conversation works either way.
5. **The no-listening test.**
   - The plant question can be guessed by a learner who already knows English manners. That is part
     of the point: a Persian speaker may pick the taarof replies.
   - Connect 0 may be guessed the "Persian way" ("Sara says yes"), which is the mistake the chapter
     teaches.
   - Everything else needs the audio.
6. **Things to check in the audio.** When the TTS is generated, check how it reads:
   - "4B" (it should be "four-B");
   - "Shh!";
   - "Whoa!";
   - the ellipsis pauses in "Actually… yes, please".

   Also time each A2 part (aim for about 35–45 s).
7. **Persian review.** Send all the Persian, written with informal تو, to the Persian reviewer. In
   particular, check:
   - «جواب تعریف» as a question kind;
   - «می‌بینمت؛ یک خداحافظی دوستانه» for `see you around`;
   - «محض اطلاعت» for `just so you know`;
   - «آخرین جعبه» as the title.

### (b) Checks done

- **Word counts** (counted with a script, `split(/\s+/)` as in the tests):
  - A2 conversation: 144 words (110–160), 24 lines. The parts are 74 and 70 words.
  - Results and options: 1–6 words (≤8).
  - B1 lines: 186 words (203 with the speaker names). `listenSeconds` is 57–62 and `speakLimit` is
    90.
  - Key points: 13–23 words each.
- **Voices:** Jake is `a` and Sara is `d`. They are different, and neither is Ava (`b`).
- **Nothing contradicts `world.md`:**
  - 48 Elm Street, stairs, no elevator, Saturday morning;
  - Jake: 4B, six years in the building, dog Biscuit (friendly, just loud);
  - Sara is on the fourth floor;
  - trash: Tuesday morning, by 8 ("the truck comes really early");
  - the barbecue: in the backyard, a week from today (Saturday) at four;
  - Sara says yes only after her first "it's fine", and says "Thanks!" to the compliment.
- **Facts left out:** Jake being a nurse is in `world.md` but is used in the role-play and Traps,
  not here. The learner (3C) and Mr. Patel aren't in these modules.
- **Spelling and safety:** US spelling (neighbor, trash, backyard). No real brands or places, no
  prices.

---

## New facts for world.md

- **A2 conversation, an added beat** (between "What happens" steps 5 and 6): Sara asks Jake how long
  he's lived here: "Six years. You'll love it here." There is no new fact; this is the scene.
- **B1 conversation only:**
  - Sara's box is full of books, mostly ("What's in here, bricks?").
  - Jake jokes that six years of stairs are the "best gym in town".
  - Sara's plant survived the move.
- **Optional fix** (Open question 4): Jake and Biscuit are coming back from a walk when he holds the
  door.
