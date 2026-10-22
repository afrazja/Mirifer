# English Day 4: listening modules (draft)

Status: **draft, for review and owner approval.** Modules: Listen and connect (Intermediate set) and
Listen and retell (Professional). Every fact comes from `world.md`. The few new facts are listed at
the end, under "New facts for world.md". US English. Each module is written in the shape of its
built `.ts` file, field by field (`ConnectSet` in `listen-connect.ts`, `RetellPiece` in `retell.ts`),
so it can go into `src/lib/practice/days/day-4/listening.ts` as `CONNECT.intermediate` and `RETELL`,
the same way as Day 3.

Voices: Mira is Ava (`b`) only. Sara is Emma (`d`), Daniel is Brian (`c`), and Andrew (`a`) narrates
the retell and so also speaks Greg's lines (Greg is Andrew in `world.md`).

---

## 1. Listen and connect (Intermediate, A2)

Built in `src/lib/practice/listen-connect.ts`; spec `docs/english-listen-connect-spec.md`. Sara asks
Daniel at the Park Hotel front desk how to get to the Sunday market in Central Park, at about 10:30
a.m. (`world.md`, "What happens", step 3). Daniel gives the normal way and forgets the Fun Run;
nobody mentions it. It has the same counts as Days 2–3's Intermediate sets: 3 parts, 3 Connect
causes with 4 results, 3 choice questions, 6 points.

**`MAX_PLAYS`**: 2 per part (as built).

### 1.1 `speakers`

| Key | `name` | `voice` |
|---|---|---|
| `daniel` | Daniel | `c` (Brian) |
| `sara` | Sara | `d` (Emma) |

Neither voice is Ava, and the two don't share a voice. Tom (also Brian) isn't in this scene. The
same keys and voices as Day 3, so `CHECK_IN_SPEAKERS` can be reused or copied.

### 1.2 `conversation`

There are 12 lines and 156 words; the built test allows 110 to 160. `#` is the line index that
`evidence` uses. Each line carries one idea, in short spoken A2 English with contractions.

| # | `who` | `text` | Words |
|---|---|---|---|
| 0 | sara | Hi, Daniel. How do I get to the Sunday market in Central Park? | 13 |
| 1 | daniel | It's about fifteen minutes on foot. Or I can call you a taxi. | 13 |
| 2 | sara | I'll walk. It's a beautiful day. | 6 |
| 3 | daniel | OK. Turn right out of the hotel and walk along Main Street, past the post office. | 16 |
| 4 | daniel | Keep going until the second traffic light, at the bank. Turn left there, onto Oak Street. | 16 |
| 5 | daniel | Once you're on Oak Street, it's two blocks. The main gate's on your right. | 14 |
| 6 | daniel | It's across from the City Museum. The market's just inside, around the fountain. | 13 |
| 7 | sara | Thanks! I won't have maps on my phone, so let me say it back. | 14 |
| 8 | sara | So I turn right out of the hotel, left at the second light, and the gate's on my left? | 19 |
| 9 | daniel | Almost. Actually, it's on your right, across from the museum. | 10 |
| 10 | sara | On my right. Got it! I'm meeting a friend there at noon. | 12 |
| 11 | daniel | Nice. There's live music by the fountain at noon. Enjoy! | 10 |

Daniel's way is the world's normal way, step by step: right out of the hotel (line 3), along Main
Street past the post office (3), left at the second traffic light, at the bank, onto Oak Street (4),
two blocks (5), the main gate on the right (5), across from the City Museum (6), the market around
the fountain just inside (6), about fifteen minutes (1).

Sara's check-back (line 8) gets one detail wrong on purpose: she puts the gate on her left. Daniel
confirms the rest ("Almost") and corrects that one detail (line 9). This is the day's goal, checking
the way by saying it back, and it makes left and right a real listening point.

### 1.3 `parts`

| Part | `from` | `to` | `title.en` | `title.fa` | Words |
|---|---|---|---|---|---|
| 0 | 0 | 2 | Walk or taxi | پیاده یا تاکسی | 32 |
| 1 | 3 | 6 | The way | مسیر | 59 |
| 2 | 7 | 11 | Saying it back | تکرار مسیر | 65 |

### 1.4 `linkPhrases`

`until` (line 4), `once` (line 5), `actually` (line 9).

Each phrase occurs once. `linkParts` matches without word boundaries, so I checked that none of the
three appears inside another word in the conversation (no "concert", "untill", etc.).

The link types change from day to day. Day 1 used a consequence, a condition and an alternative (`in
that case`, `as long as`, `instead`). Day 2 used a reason, a condition and a precaution (`because
of`, `unless`, `just in case`). Day 3 used a purpose, a topic change and a time (`that way`, `by the
way`, `as soon as`). Day 4 uses a limit (`until`: up to that point), a sequence (`once`: as soon as
you're there) and a correction (`actually`). All three are the words people really use when they
give and check directions.

### 1.5 Mira's listening goal before Play

This is the module `intro`, the same text as in section 3.

- en: Sara wants to go to the Sunday market in Central Park. Listen for how long it takes, where she turns left, where the market is, and how Sara checks the way.
- fa: سارا می‌خواهد به بازار یکشنبه در Central Park برود. گوش بده ببین راه چقدر طول می‌کشد، کجا باید به چپ بپیچد، بازار کجاست و سارا چطور مطمئن می‌شود راه را درست فهمیده.

### 1.6 `connect`

`causes` (in conversation order):

| # | Cause | `answers` (result index) | `evidence` (line) |
|---|---|---|---|
| 0 | It's a beautiful day. | 2 | 2 |
| 1 | Sara won't have maps on her phone. | 0 | 7 |
| 2 | Sara puts the gate on the wrong side. | 3 | 9 |

`results` (shuffled once, shown for every cause):

| # | Result | Words |
|---|---|---|
| 0 | Sara checks the way with Daniel. | 6 |
| 1 | Daniel tells her about the music. *(the fourth result: true (line 11), but its cause, meeting a friend at noon, isn't listed)* | 6 |
| 2 | Sara decides to walk. | 4 |
| 3 | Daniel corrects one detail. | 4 |

**Second-match check** (every cause against every result):
- Cause 0 (the beautiful day): it leads only to the walk. The music, the check-back and the
  correction have nothing to do with the weather.
- Cause 1 (no maps): if anything, having no maps is a reason *not* to walk, so result 2 doesn't
  match. Sara says it herself: "I won't have maps on my phone, so let me say it back" (line 7). The
  correction (result 3) follows her mistake, not the missing maps.
- Cause 2 (the gate on the wrong side): her mistake is *part of* her check-back, but it doesn't
  cause it; she has already started checking (line 8) before the mistake. So result 0 doesn't
  match, and only the correction does. I wrote this cause as "puts the gate on the wrong side" and
  not "says the gate is on her left" for that reason: "says" would read like a part of "checks the
  way".
- The fourth result (the music) has no listed cause: Daniel mentions it because Sara is meeting a
  friend at noon (line 10).

The right answers use other words than the conversation: "checks the way with Daniel" for "let me
say it back", "corrects one detail" for "Almost. Actually, it's on your right", and "decides to
walk" for "I'll walk".

### 1.7 `choices`

| # | `kind.en` / `kind.fa` | `question` | `options` (the answer in bold) | `answer` | `evidence` |
|---|---|---|---|---|---|
| 0 | How long / چقدر طول می‌کشد | How long is the walk to the market? | About five minutes. / **About fifteen minutes.** / About fifty minutes. | 1 | 1 |
| 1 | Where to turn / کجا بپیچد | Where does Sara turn left? | At the post office. / At the first traffic light. / **At the second traffic light.** | 2 | 4 |
| 2 | The market / جای بازار | Where's the Sunday market? | **Around the fountain.** / Next to the bank. / Inside the City Museum. | 0 | 6 |

Where the wrong options come from:
- **Question 0:** "fifty" is the -teen / -ty trap ("fifteen" or "fifty"), as on Days 2–3. "Five"
  is the same number root, short and plausible for a nearby market. Neither is said.
  - I used no real number from the conversation here. "Two" (two blocks) would make an odd option
    ("About two minutes"), and "twenty" (the way around) belongs to the Professional story.
- **Question 1:** "the post office" is a real detail (Sara walks *past* it, line 3), linked to the
  wrong thing. "The first traffic light" isn't said; it tests the ordinal, the most common mistake
  when people follow directions. "The second traffic light" isn't the only option with the
  conversation's words: "post office" and "traffic light" are both said.
- **Question 2:** "the bank" is on the corner where she turns (line 4). "The City Museum" is across
  from the gate (line 6); "Inside" makes it clearly wrong.
  - I left out "Across from the City Museum" on purpose. The market is just inside the gate, and the
    gate is across from the museum, so a learner could fairly argue that the option is true.

### 1.8 `questions` (order)

| Step | `part` | `kind` | `index` | What it asks | Day goal |
|---|---|---|---|---|---|
| 1 | 0 | choice | 0 | How long the walk is | understand the answer |
| 2 | 0 | connect | 0 | The beautiful day → ? | (the walk) |
| 3 | 1 | choice | 1 | Where Sara turns left | understand the answer |
| 4 | 1 | choice | 2 | Where the market is | understand the answer |
| 5 | 2 | connect | 1 | No maps → ? | check it by saying it back |
| 6 | 2 | connect | 2 | The gate on the wrong side → ? | check it by saying it back |

`stepsOf` gives `listen, question, question, listen, question, question, listen, question, question,
end`: 2, 2 and 2 questions per part. Day 1 was 2, 1, 3; Days 2–3 were 1, 3, 2. Part 0 asks the
choice question first because its evidence (line 1) comes before the Connect's (line 2).

### 1.9 `miraLine`

This is the line Mira says at the end, shown with the full conversation.

- en: Daniel used three small words: `until` (up to that point), `once` (as soon as), `actually` (to correct something). Tap a line and listen for them again.
- fa: دنیل سه کلمهٔ کوتاه به کار برد: `until` (تا)، `once` (همین که)، `actually` (در واقع؛ برای اصلاح یک اشتباه). روی یک خط بزن و دوباره به این‌ها گوش بده.

All three words are Daniel's, so the line names only him (Day 3's named both speakers).

### 1.10 Rule checks

- Every `evidence` line is inside the part its question follows: 1 and 2 are in part 0; 4 and 6
  are in part 1; 7 and 9 are in part 2. Each part has at least one question.
- Every result and option has 6 words or fewer. The test allows 8 and the spec 7.
- `answers` has three different results (2, 0, 3). There are four results, the fourth one true but
  unmatched. The choice answers fall at positions 1, 2 and 0.
- No result is about a time, a turn or a place. So no Connect screen gives away a choice answer,
  and no choice option gives away a Connect answer. The Connect cause "Sara puts the gate on the
  wrong side" is first shown in part 2, after every choice question, and no choice asks about the
  gate's side.
- No link phrase is in bold in the questions or options. Each link phrase is in the conversation
  exactly once.
- The right answer is never the only option that uses the conversation's exact words. The one
  exception is the number question: in Question 0 only "fifteen" is said (see the notes).
- Every question's answer is in the conversation:
  - line 1 has "about fifteen minutes on foot";
  - line 2 has "I'll walk. It's a beautiful day.";
  - line 4 has "the second traffic light … Turn left there";
  - line 6 has "around the fountain";
  - line 7 has "I won't have maps on my phone, so let me say it back";
  - line 9 has "Almost. Actually, it's on your right".
- The questions and options are English only, as on Days 1–3. Persian is given for every field that
  has one in `ConnectSet`: the part titles, the question kinds and `miraLine`.
- Not done yet: the spec's no-listening test, and timing the real audio.

---

## 2. Listen and retell (Professional, B1)

Built in `src/lib/practice/retell.ts`; page `src/routes/practice/english/retell`. This is one new
`RetellPiece`, the same shape as Day 2's `wedding-cake` and Day 3's `wrong-park-hotel`. A
`RetellPiece` has one `text` and one `voice`, so the scene is written as a third-person narration
read by Andrew, with Greg's words quoted and Sara's reported (see the notes). It covers `world.md`,
"What happens", step 4: at about 10:45, at the corner of Main and Oak, Sara finds Oak Street closed
for the Riverton Fun Run and asks Greg at the bus stop. He speaks fast, she asks him to slow down,
he gives the way around, and she says it back to him.

**The learner's task** (in the module `intro`, section 3): retell the way, as if telling a friend
how to get to the market from the corner of Main and Oak. The key points are therefore the
directions, written to a friend ("you"); the story around them (the barriers, Greg's fast talk) is
context, not scored.

| Field | Value |
|---|---|
| `id` | `the-way-around` |
| `title` | en: The way around · fa: یک راه دیگر |
| `level` | `B1` |
| `voice` | `a` (Andrew narrates; Greg is Andrew in `world.md`) |
| `imageAlt` | none (no picture yet) |
| Words | 189 |
| Listening (`listenSeconds`) | ≈ 0:58 (189 ÷ (3.1 × 1.06)) |
| Speaking limit (`speakLimit`) | 1:30 (about 68 s at its written pace, 189 ÷ (3.1 × 0.9), so it is under 90 s) |

**`text`**

> At about a quarter to eleven, Sara got to the corner of Main and Oak, and stopped. There were police barriers across Oak Street, and hundreds of runners were going past. Daniel hadn’t said anything about a race! Her phone had no data, so she couldn’t check a map. A man was waiting at the bus stop, so she asked him. His name was Greg, and his bus was late because of the Riverton Fun Run. “Oak’s closed till one,” he said, and then the directions came so fast that she only caught the word “library.” She smiled and asked him to slow down. “Sorry! Don’t turn here. Keep going straight on Main Street to the next traffic light. That’s Pine Street. Turn left there, and you’ll go past the library, on your left. After about five minutes, you’ll see the park’s side gate on your right. Inside, just follow the signs to the fountain. It’s about three minutes, and the market’s all around it.” Sara said the way back to him, and he nodded. “Perfect. And try the coffee stall with the blue umbrella. Best coffee in Riverton!”

(Written with curly apostrophes and quotation marks, as the `.ts` files use: hadn’t, couldn’t,
Oak’s, “library.”)

**`keyPoints`** (6, plain English, as directions to a friend)
1. Oak Street is closed until 1 p.m. for the Fun Run, so don't turn left onto it at the corner.
2. Keep going straight on Main Street to the next traffic light, at Pine Street.
3. Turn left onto Pine Street.
4. Go past the library, which is on your left.
5. After about five minutes, the park's side gate is on your right.
6. Inside the park, follow the signs to the fountain, about three minutes; the market is all around it.

Greg's coffee tip (the stall with the blue umbrella) is in the text but isn't a key point: it isn't
part of the way. A learner who adds it loses nothing.

Level notes:
- **B1 tenses:** the past continuous (`were going past`, `was waiting`), the past perfect (`Daniel
  hadn’t said anything`) and `will` for what you'll find on the way (`you’ll go past`, `you’ll
  see`).
- **B1 chunks:** `so fast that`, `only caught the word`, `because of`, `keep going straight`,
  `follow the signs`, `all around it`.
- **The link to the day:** the story turns on the two skills of the day besides asking: asking
  someone to slow down, and saying the way back to check it. The learner's retelling is itself a
  set of directions, which is the day's goal from the other side.
- **Spelling and style:** US spelling and punctuation (the comma and the full stop inside the
  quotation marks). "Till" is Greg's fast, spoken form; the key point says "until 1 p.m.".

---

## 3. Mira's module instructions (for `DAY_FOUR` tracks in `day.ts`)

| Track | Module | `title` / `short` | `does` (en / fa) | `intro` (en / fa) |
|---|---|---|---|---|
| Intermediate | `listen-act` | As on Days 2–3: Listen and connect / گوش بده و وصل کن · Listen / گوش دادن | Hear Sara ask Daniel the way to the Sunday market, then show how the facts connect. / بشنو سارا چطور راه بازار یکشنبه را از دنیل می‌پرسد و بعد نشان بده اتفاق‌هایش چطور به هم ربط دارند. | Sara wants to go to the Sunday market in Central Park. Listen for how long it takes, where she turns left, where the market is, and how Sara checks the way. / سارا می‌خواهد به بازار یکشنبه در Central Park برود. گوش بده ببین راه چقدر طول می‌کشد، کجا باید به چپ بپیچد، بازار کجاست و سارا چطور مطمئن می‌شود راه را درست فهمیده. |
| Professional | `listen-retell` | As on Days 2–3: Listen and retell / گوش بده و بازگو کن · Retell / بازگویی | Hear how Sara finds another way to the market, then tell a friend the way. / بشنو سارا چطور از راه دیگری به بازار می‌رسد و بعد راه را با کلمات خودت برای یک دوست توضیح بده. | Oak Street is closed, so Sara asks a man at the bus stop for another way to the market. Listen, then tell a friend how to get there from the corner of Main and Oak, in your own words. / خیابان Oak بسته است و سارا از مردی در ایستگاه اتوبوس راه دیگری به بازار می‌پرسد. گوش بده و بعد با کلمات خودت به یک دوست بگو از سرِ چهارراه Main و Oak چطور به بازار برسد. |

The minutes are as on Days 2–3: `{ 15: 4, 20: 4 }`. In Persian lines, street and place names are
written in Latin letters (`Central Park`, `Oak`, `Main`), as the README's check-in story does, and
each Persian sentence starts with a Persian word so the mixed-direction line renders cleanly.

---

## New facts for world.md

The conversation and the retell use only facts already in `world.md`, plus these details of how the
two scenes go.

### Sara and Daniel (Listen and connect)

- Daniel offers to **call Sara a taxi**; she says she'll walk, because it's a beautiful day. (The
  front desk calls taxis for guests. No price is given; taxi prices stay in Choose and persuade.)
- In her check-back, Sara first puts the main gate **on her left**; Daniel corrects her ("Almost.
  Actually, it's on your right, across from the museum."). `world.md` quotes only the first half
  of her check ("So right out of the hotel, then left at the second light?"), which stays true.
- Sara tells Daniel she's meeting a friend there at noon; Daniel mentions the live music by the
  fountain at noon. (Both already in `world.md`; only the exchange is new.)

### Sara and Greg (Listen and retell)

- Greg first says "Oak's closed till one", then gives the way so fast that Sara only catches the
  word "library". She asks him to slow down, and he gives it again, slowly.
- Sara says the way back to him, and he says "Perfect", then gives his coffee tip (already in
  `world.md`).
- The runners Sara sees at the corner at 10:45 are "hundreds" (`world.md`: about 2,000 runners,
  passing the bank corner between 10 and 11:30).

---

## Checks

**Facts against `world.md`**
- The normal way (Daniel): right out of the hotel; along Main Street; past the post office; left at
  the **second** traffic light, at the bank, onto Oak Street; **two blocks**; the main gate **on
  the right**, **across from the City Museum**; the market around the fountain, just inside; about
  **15 minutes** on foot. All match "The normal way" and the map table.
- The way around (Greg), from the corner of Main and Oak: straight on Main Street to the **next**
  traffic light (the third from the hotel), **Pine Street**; **left**; **past the library on the
  left**; the **side gate on the right** after **about five minutes**; signs to the fountain,
  **about 3 minutes**. All match "The way around". Greg doesn't give the 20-minute total, because
  he starts from the corner, not the hotel.
- Oak Street closed **9 a.m. to 1 p.m.** for the **Riverton Fun Run**; police barriers at the
  corner of Main and Oak; Greg's bus is late because of it. Daniel never mentions the run.
- Times: Sara asks Daniel at about 10:30 (not said in the conversation); she reaches the corner at
  "about a quarter to eleven" (`world.md`: about 10:45). The market is open (9 to 2); live music at
  noon by the fountain; Sara meets her friend (Tom) there at noon.
- Sara has **no mobile data**, so no maps outside the hotel (line 7; the retell's "Her phone had no
  data"). Today is Sunday; it's a beautiful day (`world.md`: sunny, warm).
- Greg's tip: "the stall with the blue umbrella, best coffee in Riverton".
- Nothing contradicts Days 1–3: Daniel already knows Sara; the Park Hotel is on Main Street; the City
  Museum is across from Central Park's main gate (Day 2).
- No real places, brands or companies; no money amounts at all; nothing about religion, politics or
  alcohol. US spelling and US words ("block", "traffic light").

**Voices**
- Listen and connect: Daniel `c` (Brian), Sara `d` (Emma). Different, and neither is Ava (`b`).
- Retell: one narrator, `a` (Andrew), which is also Greg's voice in `world.md`. Not Ava.

**Counts against the code and the Day 3 doc**

| What | Limit (where) | Day 4 |
|---|---|---|
| Conversation words | 110–160 (`listen-connect.test.ts`) | 156 |
| Lines | – (Day 3 had 15) | 12 |
| Parts, covering every line once | 3 (`stepsOf`: 3 listens) | 3: 0–2, 3–6, 7–11 |
| Connect causes / results | results = causes + 1 | 3 / 4 |
| Connect answers | all different | 2, 0, 3 |
| Choice questions | 3, each with 3 options | 3 |
| Questions in `questions` | = points = 6 | 6 |
| Every part has a question; every evidence line in its part | test | yes (2, 2, 2) |
| Words per result or option | ≤ 8 (test), ≤ 7 (spec) | 3–6 |
| Link phrases in the conversation | each present (test) | each exactly once |
| Persian in kinds, part titles, `miraLine` | must contain Persian (test) | yes |
| Retell `keyPoints` | ≥ 4 (test); 6 on Days 2–3 | 6 |
| Retell `listenSeconds` | > 40 (test) | 58 |
| Retell `speakLimit` | 90 for a piece ≤ 90 s at written pace | 90 (68 s) |
| Retell words | 160–190 (Days 2–3 docs) | 189 |
| Retell `id` | kebab-case, ≤ 40 characters, unique | `the-way-around`, 14; not `lost-phone`, `four-day-week`, `night-market`, `wedding-cake`, `wrong-park-hotel` |

Word counts were made with a script, `split(/\s+/)` as in the tests.

---

## Notes for reviewers

1. **The retell is one voice.** `RetellPiece` has one `text` and one `voice`, and the server narrates
   the whole text in that voice, so a two-voice Sara-and-Greg scene can't be built without a code
   change. I wrote it as narration read by Andrew: Greg's lines are quoted (Andrew is Greg's voice
   anyway), and Sara's lines are reported ("asked him to slow down", "said the way back to him").
   If the owner wants the scene as a real dialogue (Greg in Andrew, Sara in Emma, Greg's first try
   faster), `RetellPiece` needs a `lines` field like `ConnectSet`'s; the text and key points would
   stay the same.
2. **The retell screen says "Now tell the story in your own words."** That heading is fixed in
   `ListenRetell.svelte`. The "tell a friend the way" task lives only in Mira's `intro`. The key
   points are written as directions, so a learner who retells it as Sara's story still gets them
   all. If the owner wants the task on the speaking screen too, a per-piece task line is a small
   code change.
3. **`until` and spec rule 3.** The spec says every "until" needs an earlier plan to contrast with.
   That rule is about time ("wait until…"); here `until` marks a place ("keep going until the second
   traffic light"), which has no plan to contrast with. Confirm, or swap it for `after` ("after the
   post office").
4. **The no-listening test.** Connect 0 (the beautiful day → the walk) and Connect 2 (the wrong side
   → the correction) are easy to guess, like Day 3's spelling. Connect 1 (no maps → checking the way)
   and all three choices need the audio. Question 1's "first traffic light" is the real test of the
   ordinal.
5. **Things to check in the audio.** "fifteen" must be clearly "fif-TEEN" (against "fifty"); "Oak's
   closed till one" should not swallow "Oak's"; "a quarter to eleven"; "Main and Oak". Check that
   "Actually," at the start of line 9 gets its own small stress.
6. **Persian review.** All Persian uses informal تو. Please check «تکرار مسیر» as the part title,
   «جای بازار» as a question kind, the glosses `once` = «همین که» and `actually` = «در واقع؛ برای
   اصلاح یک اشتباه», and the retell title «یک راه دیگر».
7. **Overlap with other Day 4 modules.** The role-play with a twist has the learner ask a stranger
   the way, and the Intermediate voice messages have Tom meeting Sara at the fountain. Neither
   repeats these scenes' lines, but the writers of `conversation.md` and
   `phrases-and-messages.md` may want to reuse "Actually, it's on your right" or "let me say it back"
   as chunks.
8. **Professional has no Listen and connect today**, as on Day 3, so `connectSetFor('day-4',
   'professional')` should fall back to the Intermediate set in the Module lab.
