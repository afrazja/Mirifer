# English Day 2: listening modules (draft)

Status: **draft, for review and owner approval.** Modules: Listen and connect (Intermediate and
Professional questions), Spot the lie, Listen and retell. Every fact comes from `world.md` (new facts
are listed in "Notes for the editor" at the end). US English. Each module is written in the shape of
its built `.ts` file, field by field.

Voices: Mira is Ava (`b`) only. Sara is Emma (`d`), Mike is Andrew (`a`), Tom is Brian (`c`).

---

## 1. Listen and connect (both tracks)

Built in `src/lib/practice/listen-connect.ts`; spec `docs/english-listen-connect-spec.md`. The
conversation, parts and link phrases are shared by both tracks. Each track gets its own question
set: `CONNECT`, `CHOICES`, `QUESTIONS` and `MIRA_LINE`.

### 1.1 Shared by both sets

**`MAX_PLAYS`**: 2 per part (as built).

**`SPEAKERS`**

| Key | `name` | `voice` |
|---|---|---|
| `driver` | Driver | `a` (Andrew; he is Mike in the world) |
| `sara` | Sara | `d` (Emma) |

Neither is Ava, and they don't share a voice.

**`CONVERSATION`**: exactly as in `ride-v2.md` (13 lines, 135 words). `#` is the line index used by
`evidence`.

| # | `who` | `text` |
|---|---|---|
| 0 | driver | Hi there. Where to? |
| 1 | sara | Hi. Could you take me to the Park Hotel, please? It's on Main Street. |
| 2 | driver | Main Street's pretty long. Is the hotel near anything? |
| 3 | sara | It's right across from Central Station. |
| 4 | driver | Oh, OK, I know where that is. |
| 5 | driver | I was going to take the highway, but it's closed because of an accident. So we'll go through downtown. |
| 6 | sara | OK. How long does it take to get there? |
| 7 | driver | About forty minutes, unless the traffic near the station is bad. |
| 8 | sara | Do you take cards, or is it cash only? |
| 9 | driver | Cards are fine. But my card machine is a little slow today, so maybe have some cash ready, just in case. |
| 10 | driver | Here we are, the Park Hotel. |
| 11 | sara | Thanks. Could you drop me off at the entrance? My suitcase is really heavy. |
| 12 | driver | Sure, no problem. That's fifty-five dollars. |

**`PARTS`**

| Part | `from` | `to` | `title.en` | `title.fa` |
|---|---|---|---|---|
| 0 | 0 | 4 | Where to | مقصد |
| 1 | 5 | 7 | The way | مسیر |
| 2 | 8 | 12 | Paying and arriving | کرایه و رسیدن |

**`LINK_PHRASES`**: `because of` (line 5), `unless` (line 7), `just in case` (line 9).

**Mira's listening goal before Play** (the module intro, from `ride-v2.md`, the same for both sets):
- en: "Sara is taking a taxi from the airport to her hotel. Listen for where she's going, what changes on the way, and how she pays."
- fa: سارا با تاکسی از فرودگاه به هتلش می‌رود. گوش بده ببین کجا می‌رود، سر راه چه چیزی عوض می‌شود و کرایه را چطور می‌دهد.

**`STEPS`** (both sets have the same shape): listen 0 → 1 question → listen 1 → 3 questions → listen
2 → 2 questions → end. That is `listen, question, listen, question, question, question, listen,
question, question, end`. Score out of 6 (`TOTAL_POINTS`), with Connect counting 3.

### 1.2 Professional set (B1+)

The v2 set from `ride-v2.md`, with **two small changes** to meet the spec and the built test (marked
⚠ below; the v2 wording is kept in the notes so it can be restored).

**`CONNECT`**

`causes` (in conversation order):

| # | Cause | `answers` (result index) | `evidence` (line) |
|---|---|---|---|
| 0 | The driver doesn't know where the Park Hotel is. | 3 | 3 |
| 1 | There was an accident on the highway. | 0 | 5 |
| 2 | Sara's suitcase is really heavy. | 2 | 11 |

`results` (shuffled once, shown for every cause):

| # | Result |
|---|---|
| 0 | They go through downtown. |
| 1 | ⚠ The ride costs fifty-five dollars. *(the fourth result: true, but none of the three causes leads to it)* |
| 2 | The driver stops at the entrance. |
| 3 | Sara tells him it's across from Central Station. |

⚠ v2's fourth result was "Sara should have some cash ready." It is visible on the Connect screens in
parts 1 and 2, so it gives away the answer to the "Just in case" question in part 3 (spec rule 4:
no option on one screen gives away another screen's answer). "The ride costs fifty-five dollars."
is true (line 12), and it isn't tested anywhere else. It names the fare, not what Sara pays (she
pays $55 plus a $10 tip).

**`CHOICES`**

| # | `kind.en` / `kind.fa` | `question` | `options` (the answer in bold) | `answer` | `evidence` |
|---|---|---|---|---|---|
| 0 | Plan and reality / برنامه و واقعیت | What was the driver going to do? | Go through downtown. / **Take the highway.** / Wait until the highway opens. | 1 | 5 |
| 1 | Condition / شرط | When will the ride take more than forty minutes? | **If the traffic near the station is bad.** / If the card machine is slow. / If the highway is open. | 0 | 7 |
| 2 | Just in case / محض احتیاط | Can Sara pay by card? | No, it's cash only. / ⚠ **Yes, but she should have cash ready.** / ⚠ No, his card machine is broken. | 1 | 9 |

⚠ In v2 the right answer was "Yes, but she should have some cash ready too." That is 9 words: the
built test allows at most 8 (the spec says 7), and it was twice as long as the other two options,
which a guesser would spot. The v2 wrong option "Only at the hotel." could be read as true (you pay
when you arrive at the hotel). It is replaced by "No, his card machine is broken.", which is a real
detail from line 9, bent the wrong way.

**`QUESTIONS`** (order; the plan comes before the change, as in v2)

| Step | `part` | `kind` | `index` | What it asks |
|---|---|---|---|---|
| 1 | 0 | connect | 0 | The driver doesn't know the hotel → ? |
| 2 | 1 | choice | 0 | Plan and reality |
| 3 | 1 | connect | 1 | The accident → ? |
| 4 | 1 | choice | 1 | Condition |
| 5 | 2 | choice | 2 | Just in case |
| 6 | 2 | connect | 2 | The heavy suitcase → ? |

**`MIRA_LINE`** (from v2; the Persian is reworded)
- en: The driver used three small phrases: `because of` (the reason), `unless` (except if), `just in case` (to be ready if something goes wrong). They go by fast, so listen out for them.
- fa: حرف‌های راننده به سه عبارت کوتاه بند بود: `because of` (به خاطرِ)، `unless` (مگر اینکه)، `just in case` (محض احتیاط). این‌ها تند گفته می‌شوند، پس حواست به آن‌ها باشد.

### 1.3 Intermediate set (A1–A2)

The same format and conversation, but easier. Causes are short and close to what is said. Two of
the three choice questions ask about one literal fact (a reason, a time). The options use A2 words.
There is still exactly one right answer, and every wrong option is a detail from the ride linked to
the wrong thing (except one, noted).

**`CONNECT`**

`causes` (in conversation order):

| # | Cause | `answers` (result index) | `evidence` (line) |
|---|---|---|---|
| 0 | The driver doesn't know the Park Hotel. | 2 | 3 |
| 1 | The highway is closed. | 1 | 5 |
| 2 | The card machine is slow. | 3 | 9 |

`results` (shuffled once, shown for every cause):

| # | Result |
|---|---|
| 0 | The driver stops at the entrance. *(the fourth result: true, but its cause, the heavy suitcase, isn't listed)* |
| 1 | They go through downtown. |
| 2 | Sara says it's across from Central Station. |
| 3 | Sara should have some cash ready. |

Second-match check: no cause leads to a second result. The hotel is downtown, but they go through
downtown *because the highway is closed*, not because the driver doesn't know the hotel.

**`CHOICES`**

| # | `kind.en` / `kind.fa` | `question` | `options` (the answer in bold) | `answer` | `evidence` |
|---|---|---|---|---|---|
| 0 | Because of / دلیل | Why is the highway closed? | Because of the traffic. / **Because of an accident.** / Because of bad weather. | 1 | 5 |
| 1 | How long / چقدر طول می‌کشد | How long does the ride take? | About fourteen minutes. / About fifty-five minutes. / **About forty minutes.** | 2 | 7 |
| 2 | Why / چرا | Why does Sara ask the driver to stop at the entrance? | **Her suitcase is very heavy.** / The hotel is hard to find. / She wants to pay in cash. | 0 | 11 |

Where the wrong options come from:
- Question 0: "the traffic" (line 7). "Bad weather" isn't in the ride. It is realistic and
  contradicts nothing, which the spec allows when a ride detail doesn't fit.
- Question 1: "fifty-five" (line 12, the fare). "Fourteen" is the classic -teen / -ty trap; it
  isn't said.
- Question 2: the hotel was hard to find for the driver (lines 2–4); cash (lines 8–9).

**`QUESTIONS`** (order)

| Step | `part` | `kind` | `index` | What it asks |
|---|---|---|---|---|
| 1 | 0 | connect | 0 | The driver doesn't know the hotel → ? |
| 2 | 1 | choice | 0 | Because of: why the highway is closed |
| 3 | 1 | connect | 1 | The highway is closed → ? |
| 4 | 1 | choice | 1 | How long |
| 5 | 2 | connect | 2 | The slow card machine → ? |
| 6 | 2 | choice | 2 | Why: the entrance |

Question 0 and connect 1 share line 5, but they test different links: the accident → the closed
highway, then the closed highway → downtown.

**`MIRA_LINE`** (simpler than the Professional one)
- en: The driver used three small phrases: `because of` (why), `unless` (except if), `just in case` (to be ready). Tap a line and listen for them again.
- fa: راننده سه عبارت کوتاه به کار برد: `because of` (به خاطرِ)، `unless` (مگر اینکه)، `just in case` (محض احتیاط). روی یک خط بزن و دوباره به این‌ها گوش بده.

### 1.4 Rule checks (both sets)

- Every `evidence` line is inside the part its question follows; each part has at least one question.
- Every option and result is 8 words or fewer (the built test's limit). Two have exactly 8 words, one
  more than the spec's 7: "If the traffic near the station is bad." and "Sara tells him it's across
  from Central Station." Both are v2 wording, kept.
- No link phrase is in bold in questions or options. Each link phrase is in the conversation.
- The right answer is never the only option that uses the conversation's exact words.
- `answers` has three different results per set, and the fourth result is true but unmatched.
- Not done yet: the spec's no-listening test (someone answers without the audio) and timing the real
  audio.

---

## 2. Spot the lie (both tracks, aim A2+)

Built in `src/lib/practice/spot-the-lie.ts`; spec `docs/english-spot-the-lie-spec.md`. Kept as
built: `MAX_TALK_PLAYS` = 2, `STATEMENT_VOICE` = `b` (Mira reads "Statement A: …"), `LETTERS`,
`TRAP_LABEL`. There are five talks, each with 4 sentences and 3 statements. Each talk uses a
different trap, and the lie sits at a different position from talk to talk. At least one true
statement in each talk keeps a phrase from the talk. The lie reuses the talk's own words with one
thing changed.

Day 2 talks are in timeline order: Tom's message on the plane, Sara at the airport, Mike on his job,
Sara at the hotel, Mike after the ride. Only three character voices exist, so Sara and Mike each
talk twice. Daniel and Carlos would share Brian with Tom. Voices never repeat back to back: `c, d,
a, d, a`.

### Overview

| # | `speaker` / `speakerFa` | `voice` | `trap` | `lie` | `proof` | Words |
|---|---|---|---|---|---|---|
| 0 | Tom / تام | `c` (Brian) | maybe | 1 | 2 | 59 |
| 1 | Sara / سارا | `d` (Emma) | detail | 2 | 0 | 61 |
| 2 | Mike / مایک | `a` (Andrew) | used-to | 0 | 1 | 60 |
| 3 | Sara / سارا | `d` (Emma) | negative | 1 | 3 | 56 |
| 4 | Mike / مایک | `a` (Andrew) | person | 0 | 1 | 65 |

(Day 1-style talks are 52–60 words; these run about 20–25 seconds.)

### Talk 0: Tom (trap: maybe or for sure)

`sentences`
0. Hi Sara, it's Tom. I'm really sorry, but my car broke down this morning.
1. So I can't pick you up. Take the Airport Express, it's easy, or a taxi if you're too tired.
2. The mechanic says my car might be ready tomorrow, so maybe I can drive you around the city then.
3. And let's have dinner tonight at seven!

`statements`
- A: Tom's car stopped working this morning. *(true, other words)*
- B: **Tom's car will be ready tomorrow.** *(the lie)*
- C: Tom wants to have dinner with Sara at seven. *(true, keeps "have dinner … at seven")*

`lie`: 1 · `proof`: 2

`why`
- en: “might” means maybe, not for sure. The lie said Tom’s car will be ready tomorrow, but the mechanic only said it might be.
- fa: «might» یعنی شاید، نه حتماً. جملهٔ دروغ گفت ماشینِ تام فردا حتماً آماده است («will»)، ولی مکانیک فقط گفته شاید آماده باشد.

### Talk 1: Sara at the airport (trap: a changed detail)

`sentences`
0. The Airport Express is only nine dollars, and it gets to Central Station in twenty-five minutes.
1. My hotel is right across from the station, so that's really easy.
2. But my suitcase is so heavy, and I'm really tired after my long flight.
3. So I'm going to take a taxi. It's about fifty-five dollars, but it takes me right to the door.

`statements`
- A: The Airport Express takes less than half an hour. *(true, other words)*
- B: Her hotel is right across from the station. *(true, keeps the phrase)*
- C: **The Airport Express is fifty-five dollars.** *(the lie)*

`lie`: 2 · `proof`: 0

`why`
- en: The lie used a real price from the talk, but for the wrong thing. The Airport Express is nine dollars; the taxi is about fifty-five.
- fa: جملهٔ دروغ یک قیمتِ واقعی از حرف‌های سارا را آورد، ولی برای چیز دیگری: قطارِ «Airport Express» ۹ دلار است و تاکسی حدود ۵۵ دلار.

### Talk 2: Mike on his job (trap: then, "used to", or now)

`sentences`
0. I've driven a taxi here in Riverton for twenty years.
1. I used to know every hotel in the city, but there are so many new ones now.
2. So when I don't know a place, I ask if it's near anything, like a station or a park.
3. I still love this job, because I meet people from all over the world.

`statements`
- A: **He still knows every hotel in the city.** *(the lie)*
- B: He has been a taxi driver for twenty years. *(true, keeps "for twenty years")*
- C: He still enjoys his work. *(true, other words. It also has "still", so "still" alone doesn't give the lie away)*

`lie`: 0 · `proof`: 1

`why`
- en: “used to” means it was true before, but not now. Mike doesn’t know every hotel anymore: there are so many new ones.
- fa: «used to» یعنی قبلاً این‌طور بود، ولی الان نیست. مایک دیگر همهٔ هتل‌های شهر را نمی‌شناسد، چون هتل‌های جدید خیلی زیاد شده‌اند.

### Talk 3: Sara at the hotel (trap: a flipped "not")

`sentences`
0. I finally got to the Park Hotel, but I can't check in until three p.m.
1. The man at the front desk was really nice, though.
2. He said I can leave my big suitcase with him and come back later.
3. So I don't have to carry it around with me, and that's great, because it's really heavy.

`statements`
- A: The man at the front desk was friendly. *(true, keeps "the man at the front desk")*
- B: **She has to carry her suitcase around with her.** *(the lie)*
- C: Check-in starts at three in the afternoon. *(true, other words)*

`lie`: 1 · `proof`: 3

`why`
- en: The lie dropped one small word. Sara said she doesn’t have to carry her suitcase around: she can leave it at the front desk. Listen for “don’t” and “not”.
- fa: جملهٔ دروغ یک کلمهٔ کوچک را جا انداخت. سارا گفت لازم نیست چمدانش را همه‌جا با خودش ببرد («don’t have to»)، چون می‌تواند آن را به پذیرش بسپارد. به «don’t» و «not» دقت کن.

### Talk 4: Mike after the ride (trap: the wrong person)

`sentences`
0. One of my passengers today was a woman from Istanbul, on her first trip to Riverton.
1. A friend was going to pick her up at the airport, but his car broke down this morning.
2. Her suitcase was really heavy, so I dropped her off right at the entrance.
3. I told her my wedding cake story, and later I found her phone on the back seat!

`statements`
- A: **Mike's car broke down this morning.** *(the lie)*
- B: It was the woman's first time in Riverton. *(true, other words)*
- C: He dropped her off right at the entrance. *(true, keeps the phrase)*

`lie`: 0 · `proof`: 1

`why`
- en: The lie took a real detail but gave it to the wrong person: it was her friend’s car that broke down, not Mike’s.
- fa: جملهٔ دروغ یک نکتهٔ درست را به آدمِ اشتباهی نسبت داد: ماشینِ دوستِ آن خانم خراب شده بود، نه ماشینِ مایک.

### Rule checks

- Five talks, five different traps, one lie each. The lie positions are 1, 2, 0, 1, 0. No voice
  appears twice in a row, and none is Ava.
- Every `proof` sentence is in the talk and shows the lie on its own.
- Each true statement is clearly true from the audio, with no inference beyond the words. For talk 3
  C: "can't check in until three p.m." = check-in starts at three.
- In talk 3 a true statement (A) and the talk itself contain negatives. Talk 2 uses "still" in a
  true statement and in the lie. So no single word marks the lie.
- Talk 4 links back to talk 0 (Tom's car), forward to the retell (the wedding cake) and to the
  day's surprise (Mike finds Sara's phone on his back seat, as in the world), so the world holds
  together. Mike mentions the phone in passing; no statement is about it.

---

## 3. Listen and retell (Professional)

Built in `src/lib/practice/retell.ts`; page `src/routes/practice/english/retell`. One new
`RetellPiece`, the same shape as the built B1 piece "A shorter working week" (158 words, 6 key
points). This one is 185 words. It is a third-person narration, like the built pieces.

| Field | Value |
|---|---|
| `id` | `wedding-cake` |
| `title` | en: The cake on the back seat · fa: کیکِ روی صندلی عقب |
| `level` | `B1` |
| Listening (`listenSeconds`) | ≈ 0:56 |
| Speaking limit (`speakLimit`) | 1:30 (the piece is under 90 s at its written pace) |

**`text`**

> Mike has driven a taxi in Riverton for twenty years, and his favorite story is about his strangest passenger. One Saturday, he picked up a man at the airport. The man was carrying a big white box. He was the bride's uncle, and inside the box was the wedding cake. He wanted to stop at his hotel first to change, and then go to the wedding at a restaurant on the other side of the city. At the hotel, he was in such a hurry that he grabbed his suitcase and ran inside. Twenty minutes later, Mike looked in the mirror and saw the white box. The cake was still on the back seat! He didn't have the man's phone number, but he remembered the name of the restaurant. So he turned around and drove all the way back across the city. He got there just in time, a few minutes before dinner, while the uncle was looking everywhere for the cake. The family was so happy that they invited Mike to stay for dinner. He says it was the best tip he's ever gotten.

**`keyPoints`** (6, plain English)
1. Mike, a taxi driver for twenty years, once picked up a man at the airport with a big box.
2. The man was the bride's uncle, and the box had the wedding cake in it.
3. He stopped at his hotel first, and in his hurry he left the cake on the back seat.
4. Mike saw the cake later; he didn't have the man's number, but he remembered the restaurant.
5. Mike drove back across the city and got there just in time, before dinner.
6. The family invited Mike to stay for dinner, and he calls it his best tip ever.

**`imageAlt`** (for `/images/retell/wedding-cake.webp` and `wedding-cake-sm.webp`, still to be made)
- en: A smiling taxi driver carries a big white cake box into a restaurant full of wedding guests, while a man in a suit hurries toward him.
- fa: رانندهٔ تاکسی با لبخند یک جعبهٔ بزرگ و سفیدِ کیک را به رستورانی پر از مهمان‌های عروسی می‌برد و مردی کت‌وشلواری با عجله به طرفش می‌آید.

Level notes: B1 tenses (present perfect, past simple and continuous) and B1 chunks (`in such a
hurry that`, `just in time`, `all the way back`, `turned around`). "The best tip he's ever gotten"
is a small joke that links to the day's tipping topic. US spelling ("favorite").

---

## Notes for the editor

Only what is still open.

### (a) New facts to add to `world.md`

- **Tom:** the mechanic says his car *might* be ready tomorrow; if so, Tom may drive Sara around the
  city then. The world has "maybe tomorrow"; the drive around the city is new. (Spot the lie, talk 0)
- **Mike** loves his job because he meets people from all over the world. (Talk 2)
- **At the hotel:** the man at the front desk (Daniel) was nice. (Talk 3)
- **Sara's flight** is called a "long flight" (Day 1 and the world say "a long day"). (Talk 1)
- **The wedding cake story**, details the world doesn't have yet (retell):
  - The cake was in a big white box.
  - The uncle stopped at his hotel to change, and grabbed his suitcase in a hurry.
  - Mike saw the box in the mirror about 20 minutes later. He didn't have the man's phone number.
  - He arrived a few minutes before dinner, while the uncle was looking everywhere for the cake.

### (b) Open questions

1. **Professional set, two changes from v2** (marked ⚠ in 1.2). Revert if the owner prefers v2
   exactly. The v2 wording was:
   - question 2: "Yes, but she should have some cash ready too." (9 words, over the built 8-word
     limit) / "Only at the hotel." (could be read as true);
   - the fourth Connect result: "Sara should have some cash ready." (it gave away question 2).
2. **Code changes needed before this can be built** (not made):
   - `listen-connect.ts` holds one question set; two tracks need a set per track.
   - `SPEAKERS` uses the key `agent` (Brian); Day 2 needs `driver` (Andrew).
   - `listen-connect.test.ts` hard-codes Day 1's `STEPS` shape and evidence strings. Day 2's shape is
     `listen, q, listen, q, q, q, listen, q, q, end`.
3. **Speaker label:** v2 calls the driver "Driver", and it is kept. Spot the lie and the retell call
   him "Mike". Labeling him "Mike" in Listen and connect would tie the modules together, but it
   changes reviewed content.
4. **Spec vs. code on option length:** the spec says 7 words or fewer, the test allows 8. Two v2
   strings have 8 words.
5. **Intermediate set:** it doesn't test `unless` (on purpose; it uses more literal facts), and one
   wrong option ("Because of bad weather.") isn't from the ride, which the spec allows. Confirm.
6. **Spot the lie voices:** the built Day 1 content and the spec table have Tom = Andrew and Mike =
   Brian, which contradicts the world. Day 2 follows the world (Tom = Brian, Mike = Andrew), so Sara
   and Mike each talk twice and Daniel and Carlos aren't used.
7. **Spot the lie track:** this file tags it for both tracks (aim A2+), but `README.md` lists it under
   Intermediate only.
8. **Spot the lie talk 4 and the surprise:** Mike now says he found Sara's phone on the back seat.
   If a learner meets this before the role-play "The phone in the taxi", it gives away the twist.
   If that order is possible, set the talk before he finds the phone instead.
9. **Retell voice:** the page picks a random narrator from all four voices, including Ava (Mira) and
    Andrew (Mike). The owner may want it pinned (a code change).
11. **Retell overlap:** the built A2 piece "The phone in the taxi" (Maria leaves her phone in a taxi)
    is close to Day 2's surprise, so the two may feel repetitive side by side.
12. **Retell image:** `/images/retell/wedding-cake.webp` and `-sm.webp` still need to be made.
13. **Not done yet:** the spec's no-listening test for Listen and connect, and timing all the audio
    with the real voices.
