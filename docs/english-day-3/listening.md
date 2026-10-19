# English Day 3: listening modules (draft)

Status: **draft, for review and owner approval.** Modules: Listen and connect (Intermediate set) and
Listen and retell (Professional). Every fact comes from `world.md`. The new facts are listed at the
end, under "New facts for world.md". US English. Each module is written in the shape of its built
`.ts` file, field by field (`ConnectSet` in `listen-connect.ts`, `RetellPiece` in `retell.ts`), so
it can go into `src/lib/practice/days/day-3.ts` as `CONNECT.intermediate` and `RETELL`.

Voices: Mira is Ava (`b`) only. Sara is Emma (`d`), Daniel is Brian (`c`), and Andrew (`a`) narrates
the retell.

---

## 1. Listen and connect (Intermediate, A2)

Built in `src/lib/practice/listen-connect.ts`; spec `docs/english-listen-connect-spec.md`. Sara checks
in with Daniel at the Park Hotel front desk at about 5:15 p.m. (`world.md`, "What happens", steps
1–8). It has the same counts as Day 2's Intermediate set: 3 parts, 3 Connect causes with 4 results,
3 choice questions, 6 points.

**`MAX_PLAYS`**: 2 per part (as built).

### 1.1 `speakers`

| Key | `name` | `voice` |
|---|---|---|
| `daniel` | Daniel | `c` (Brian) |
| `sara` | Sara | `d` (Emma) |

Neither voice is Ava, and the two don't share a voice. Tom (also Brian) isn't in this scene.

### 1.2 `conversation`

There are 15 lines and 148 words; the built test allows 110 to 160. `#` is the line index that
`evidence` uses. Each line carries one idea, in short spoken A2 English with contractions.

| # | `who` | `text` | Words |
|---|---|---|---|
| 0 | daniel | Hi, welcome back! You left your suitcase with me, right? | 10 |
| 1 | sara | Yes, that's me. I have a booking under Demir. | 9 |
| 2 | daniel | Sorry, how do you spell that? | 6 |
| 3 | sara | D-E-M-I-R. Sara Demir. | 3 |
| 4 | daniel | Here it is, three nights. Can I see your passport and a credit card, please? | 15 |
| 5 | daniel | Thanks. Here are your key cards. You're in room 714, on the seventh floor. | 14 |
| 6 | sara | Great. Is the Wi-Fi free? | 5 |
| 7 | daniel | Yes. The network is ParkHotel-Guest, and the password is mainstreet210. | 10 |
| 8 | daniel | It's also on your key-card holder. That way, you don't have to remember it. | 14 |
| 9 | sara | And is breakfast included? | 4 |
| 10 | daniel | Yes. Tomorrow it's from seven to ten-thirty, in The Corner Café. | 11 |
| 11 | sara | Oh, by the way, my phone's dead, and my charger's in my backpack. | 13 |
| 12 | daniel | No problem. You can borrow one of our chargers. | 9 |
| 13 | sara | Thanks! The airline's bringing my backpack tomorrow morning. Could you keep it for me? | 14 |
| 14 | daniel | Sure. I'll call your room as soon as it gets here. | 11 |

### 1.3 `parts`

| Part | `from` | `to` | `title.en` | `title.fa` | Words |
|---|---|---|---|---|---|
| 0 | 0 | 4 | The booking | رزرو | 43 |
| 1 | 5 | 10 | Room, Wi-Fi, breakfast | اتاق، وای‌فای، صبحانه | 58 |
| 2 | 11 | 14 | The phone and the backpack | گوشی و کوله‌پشتی | 47 |

### 1.4 `linkPhrases`

`that way` (line 8), `by the way` (line 11), `as soon as` (line 14).

Each phrase occurs once. `linkParts` matches without word boundaries, so I checked that none of the
three appears inside another word or phrase ("that way" isn't part of "by the way").

The link types change from day to day. Day 1 used a consequence, a condition and an alternative (`in
that case`, `as long as`, `instead`). Day 2 used a reason, a condition and a precaution (`because
of`, `unless`, `just in case`). Day 3 uses a purpose (`that way`), a topic change (`by the way`) and
a time (`as soon as`).

### 1.5 Mira's listening goal before Play

This is the module `intro`, the same text as in section 3.

- en: Sara is checking in at the Park Hotel. Listen for her room number, the Wi-Fi password, the breakfast time, and how Daniel helps her.
- fa: سارا در پذیرش Park Hotel است و می‌خواهد اتاقش را تحویل بگیرد. گوش بده ببین شمارهٔ اتاقش چند است، رمز وای‌فای چیست، صبحانه چه ساعتی است و دنیل چطور کمکش می‌کند.

### 1.6 `connect`

`causes` (in conversation order):

| # | Cause | `answers` (result index) | `evidence` (line) |
|---|---|---|---|
| 0 | Daniel isn't sure how to spell Demir. | 1 | 3 |
| 1 | Sara's phone is dead. | 3 | 12 |
| 2 | The backpack arrives at the hotel. | 0 | 14 |

`results` (shuffled once, shown for every cause):

| # | Result | Words |
|---|---|---|
| 0 | Daniel calls to say it's here. | 6 |
| 1 | Sara spells her last name. | 5 |
| 2 | Daniel gives her the key cards. *(the fourth result: true (line 5), but its cause isn't listed)* | 6 |
| 3 | Daniel lends her a charger. | 5 |

**Second-match check** (every cause against every result):
- Cause 0 (the spelling): Daniel finds the booking and only then gives the key cards. That is a
  chain of events, not a result of the spelling, so result 2 doesn't match.
- Cause 1 (the dead phone): result 0 is now "Daniel calls to say it's here". "It" can only be
  something that arrives, so the old reading "her phone is dead, so he calls the room phone" no
  longer fits, and result 3 is said almost word for word (line 12).
- Cause 2 (the backpack arrives): the charger is lent tonight, before the backpack comes. Its
  arrival tomorrow doesn't cause the loan. I wrote this cause as an arrival ("arrives at the hotel")
  and not "comes tomorrow" for that reason.

The two right answers about Daniel use other words than the conversation: "lends her a charger" for
"You can borrow one of our chargers", and "calls to say it's here" for "I'll call your room as soon
as it gets here".

### 1.7 `choices`

| # | `kind.en` / `kind.fa` | `question` | `options` (the answer in bold) | `answer` | `evidence` |
|---|---|---|---|---|---|
| 0 | Room number / شمارهٔ اتاق | What's Sara's room number? | Room 740. / **Room 714.** / Room 417. | 1 | 5 |
| 1 | Wi-Fi password / رمز وای‌فای | What's the Wi-Fi password? | **mainstreet210** / ParkHotel-Guest / mainstreet120 | 0 | 7 |
| 2 | What time / چه ساعتی | When is breakfast tomorrow? | From six-thirty to ten. / From seven to eleven. / **From seven to ten-thirty.** | 2 | 10 |

The password options have no full stop, because a full stop would look like part of the password.

Where the wrong options come from:
- **Question 0:** "740" is the -teen / -ty trap ("seven-fourteen" or "seven-forty"), the same kind
  as Day 2's "fourteen". "417" has the same digits in a different order. Neither number is said.
  - I deliberately used no real number from the conversation here. "Room 210" would hint at the
    password on the next screen.
- **Question 1:** "ParkHotel-Guest" is the network name: a real detail, linked to the wrong thing.
  "mainstreet120" isn't said, and it tests the number: "one-twenty" sounds clearly different from
  "two-ten" (or "two-one-oh"), unlike the first draft's "mainstreet201" ("two-oh-one"), which was
  too close by ear.
  - I left out "mainstreet714" on purpose. Once Question 0 has shown that 714 is the room, the
    learner could rule it out without listening.
- **Question 2:** "From six-thirty to ten" is the world's weekday time. It isn't said, and it is
  true on weekdays, not tomorrow (Sunday). "From seven to eleven" isn't said either; 11 a.m. is
  check-out in the world, but this conversation doesn't mention it.

### 1.8 `questions` (order)

| Step | `part` | `kind` | `index` | What it asks | Day goal |
|---|---|---|---|---|---|
| 1 | 0 | connect | 0 | Daniel can't spell Demir → ? | the booking name |
| 2 | 1 | choice | 0 | The room number | the room |
| 3 | 1 | choice | 1 | The Wi-Fi password | the Wi-Fi |
| 4 | 1 | choice | 2 | When breakfast is tomorrow | breakfast |
| 5 | 2 | connect | 1 | The dead phone → ? | the charger |
| 6 | 2 | connect | 2 | The backpack arrives → ? | the backpack |

`stepsOf` gives `listen, question, listen, question, question, question, listen, question, question,
end`. That is the same shape as Day 2: 1, 3 and 2 questions per part. The order of question types
inside the parts is different. On Day 2, part 1 was choice, connect, choice and part 2 was connect,
choice. Here, part 1 is three choice questions and part 2 is two Connect questions.

### 1.9 `miraLine`

This is the line Mira says at the end, shown with the full conversation.

- en: Daniel and Sara used three small phrases: `that way` (so that), `by the way` (a new topic), `as soon as` (right when). Tap a line and listen for them again.
- fa: دنیل و سارا سه عبارت کوتاه به کار بردند: `that way` (این‌طوری)، `by the way` (راستی)، `as soon as` (به محض اینکه). روی یک خط بزن و دوباره به این‌ها گوش بده.

### 1.10 Rule checks

- Every `evidence` line is inside the part its question follows: 3 is in part 0; 5, 7 and 10 are
  in part 1; 12 and 14 are in part 2. Each part has at least one question.
- Every result and option has 6 words or fewer. The test allows 8 and the spec 7.
- `answers` has three different results (1, 3, 0). There are four results, the fourth one true but
  unmatched. The choice answers fall at positions 1, 0 and 2.
- No result is about a number, a time or the password. So no Connect screen gives away a choice
  answer, and no choice option gives away a Connect answer.
- No link phrase is in bold in the questions or options. Each link phrase is in the conversation
  exactly once.
- The right answer is never the only option that uses the conversation's exact words. The one
  exception is the number questions: in Question 0 only 714 is said (see the notes).
- Every question's answer is in the conversation:
  - line 3 has the spelling;
  - line 5 has room 714;
  - line 7 has mainstreet210;
  - line 10 has "seven to ten-thirty" for tomorrow;
  - line 12 has the charger;
  - line 14 has "I'll call your room as soon as it gets here".
- The questions and options are English only, as on Days 1–2. The spec says questions, options and
  the conversation stay English and left-to-right inside the Persian page. Persian is given for every
  field that has one in `ConnectSet`: the part titles, the question kinds and `miraLine`.
- Not done yet: the spec's no-listening test, and timing the real audio.

---

## 2. Listen and retell (Professional, B1)

Built in `src/lib/practice/retell.ts`; page `src/routes/practice/english/retell`. This is one new
`RetellPiece`, the same shape as Day 2's `wedding-cake`. It is a story Daniel likes to tell about a
guest, written as third-person narration and read by Andrew (not Daniel's voice).

| Field | Value |
|---|---|
| `id` | `wrong-park-hotel` |
| `title` | en: The wrong Park Hotel · fa: هتل پارکِ اشتباهی |
| `level` | `B1` |
| `voice` | `a` (Andrew narrates) |
| `imageAlt` | none (no picture yet) |
| Words | 187 |
| Listening (`listenSeconds`) | ≈ 0:57 (187 ÷ (3.1 × 1.06)) |
| Speaking limit (`speakLimit`) | 1:30 (about 67 s at its written pace, 187 ÷ (3.1 × 0.9), so it is under 90 s) |

**`text`**

> Daniel has worked at the front desk of the Park Hotel since it opened last year, and his favorite story is from its very first week. It was almost midnight when a tired man walked in with a big suitcase. He said he had a booking under the name Walker. Daniel couldn't find it, so he asked the man to spell it. Then Daniel tried every spelling he could think of. Nothing. The man was getting upset, so he showed Daniel the email. It turned out that his booking was at the Parkside Hotel, near the airport, twenty miles away. He had forgotten the full name, so in the taxi he asked for “the Park Hotel,” and the driver brought him downtown. It was too late to go back, but luckily, there was one room left. So he ended up staying, and Daniel called the Parkside to cancel his booking for him. The man liked the hotel so much that he has stayed there on every trip to Riverton ever since. And when he checks in, he always says, “Walker. And yes, I'm sure it's this one.”

(In the `.ts` file, use curly apostrophes as Day 2 does: couldn’t, I’m, it’s.)

**`keyPoints`** (6, plain English)
1. In the hotel's first week, late at night, a tired man said he had a booking under the name Walker, but Daniel couldn't find it.
2. Daniel tried every spelling he could think of, and the upset man showed him his booking email.
3. The booking was at the Parkside Hotel, near the airport, twenty miles away.
4. He had forgotten the full name, so he asked the taxi driver for "the Park Hotel" and ended up downtown.
5. It was too late to go back, so he took the last room, and Daniel canceled the other booking for him.
6. He has stayed at the Park Hotel on every trip since, and jokes that he's sure it's the right one.

Level notes:
- **B1 tenses:** the present perfect (`has worked … since`, `has stayed … ever since`), the past
  continuous (`was getting upset`) and the past perfect (`had forgotten`).
- **B1 chunks:** `it turned out that`, `too late to go back`, `ended up staying`, `ever since`, and
  also `every spelling he could think of`.
- **The link to the day:** the story turns on a booking name and spelling it, which is the day's
  goal. The last line is a small joke.
- **Spelling and style:** US spelling ("favorite", "canceled"), and US punctuation, with the comma
  inside the quotation marks.

---

## 3. Mira's module instructions (for `DAY_THREE` tracks in `day.ts`)

| Track | Module | `title` / `short` | `does` (en / fa) | `intro` (en / fa) |
|---|---|---|---|---|
| Intermediate | `listen-act` | As on Day 2: Listen and connect / گوش بده و وصل کن · Listen / گوش دادن | Hear Sara check in with Daniel at the front desk, then show how the facts connect. / گفت‌وگوی سارا و دنیل را در پذیرش هتل بشنو و نشان بده اتفاق‌هایش چطور به هم ربط دارند. | Sara is checking in at the Park Hotel. Listen for her room number, the Wi-Fi password, the breakfast time, and how Daniel helps her. / سارا در پذیرش Park Hotel است و می‌خواهد اتاقش را تحویل بگیرد. گوش بده ببین شمارهٔ اتاقش چند است، رمز وای‌فای چیست، صبحانه چه ساعتی است و دنیل چطور کمکش می‌کند. |
| Professional | `listen-retell` | As on Day 2: Listen and retell / گوش بده و بازگو کن · Retell / بازگویی | Hear Daniel's favorite check-in story, then tell it in your own words. / ماجرای موردعلاقهٔ دنیل در پذیرش هتل را بشنو و بعد با کلمات خودت تعریفش کن. | Daniel at the front desk has a favorite story about a guest. Listen, then tell it in your own words. / دنیل، مسئول پذیرش هتل، ماجرایی دربارهٔ یکی از مهمان‌هایش دارد که عاشق تعریف کردنش است. گوش بده و بعد با کلمات خودت تعریفش کن. |

The minutes are as on Day 2: `{ 15: 4, 20: 4 }`. In Persian lines, the hotel's name is written in
Latin letters, `Park Hotel` (as in the Intermediate intro), with one exception: the retell title
«هتل پارکِ اشتباهی».

---

## Notes for the editor

### (a) Open questions

1. **What I left out of the check-in.** I kept the conversation within 15 lines and 160 words, so
   four things from `world.md` are missing:
   - the $50-a-night hold (step 3): Daniel only asks for the passport and a credit card;
   - the elevators behind the desk (step 4);
   - check-out on Tuesday (step 2): only "three nights" is said;
   - Daniel bringing out the suitcase (step 9).

   None of them is tested. If the owner wants the hold, line 4 could become "…a credit card, please?
   It's just for extras, like the minibar." That makes 156 words. Its fact (a card "for
   incidentals") is already in `world.md`.
2. **Question order inside the parts.** The counts per part are the same as Day 2 (1, 3, 2), but the
   order is different: part 1 is three choice questions and part 2 is two Connect questions. The
   other way to cover all six topics was 1, 2, 3 per part, which needs shorter parts. Confirm.
3. **`by the way` is a topic marker, not a logical link.** Sara uses it to change topic (Persian
   «راستی»), and it isn't tested. The spec asks for "at least four links" and for rotating link
   types. The only links tested here are as soon as (the backpack) and the spelling (a request and
   its answer). `that way` isn't tested, as Day 2's `unless` wasn't in the Intermediate set.
   - If a reviewer wants a third logical link instead, `before` is the most natural choice: "Just
     bring it back before you check out" (the charger).
4. **The dead phone and "Daniel calls her room".** Resolved in review v1: result 0 is now "Daniel
   calls to say it's here", which can't be read as a result of the dead phone.
5. **Spec rule 5 on number options.** In "What's Sara's room number?" only 714 is in the
   conversation. This is the same exception as Day 2's "About forty minutes". With numbers, the
   learner can't tell which option is the said one without listening, and I avoided real numbers
   on purpose (see 1.7).
6. **The no-listening test.**
   - Connect 0 (the spelling) is easy to guess, like Day 2's "Sara says it's across from Central
     Station".
   - In the password question, a Day 2 learner knows the hotel is on Main Street, so they could rule
     out "ParkHotel-Guest". "mainstreet120" keeps it a real listening item (two-ten or one-twenty).
7. **Things to check in the audio.** When the TTS is generated, check how it reads:
   - "714": it should be "seven-fourteen", not "seven hundred fourteen";
   - "mainstreet210": "main street two-ten" or "two-one-oh". If the TTS reads it badly, write the
     line as "the password is mainstreet two-ten, all one word" and keep the options as written;
   - "D-E-M-I-R": letter by letter;
   - "ParkHotel-Guest";
   - "The Corner Café".
8. **The retell narrator.** Andrew also voices Mike and the airline's baggage desk. This is
   narration, as on Day 2, so the narrator isn't a character in the story.
   - The taxi driver in the story has no name and isn't Mike. Mike didn't know the new hotel, and
     this driver did; that fits Day 2, which says *some* drivers don't know it.
9. **Persian review.** All the Persian is written with informal تو and should go to the Persian
   reviewer. In particular, check «هتل پارکِ اشتباهی» as the title (the hotel is real; it was the
   wrong one for him). Also check `that way` glossed as «این‌طوری».
10. **The Day 1 charger.** On Day 1 (Day 2's world), Sara can borrow a charger at the airport
    information desk. Day 3's `world.md` already says her phone is dead because her charger is in
    the backpack, so she didn't. This isn't a contradiction, but a reviewer may ask about it.

### (b) Checks done

- **Word counts** (counted with a script, `split(/\s+/)` as in the tests):
  - the conversation is 148 words, within the test's 110–160;
  - the parts are 43, 58 and 47 words, and there are 15 lines;
  - results and options have 1–6 words, under the test's 8;
  - the retell is 187 words, within 160–190, with `listenSeconds` 57 and `speakLimit` 90.
- **Voices:** Daniel is `c` and Sara is `d`. They are different, and neither is Ava (`b`). The
  retell narrator is `a`.
- **The retell id:** `wrong-park-hotel` is kebab-case, 16 characters (40 or fewer) and unique among
  `RETELL_PIECES` and Day 2 (`lost-phone`, `four-day-week`, `night-market`, `wedding-cake`).
- **Every answer has a line that proves it.** The table in 1.10 lists the line for each of the six
  questions.
- **Nothing contradicts Days 1–2 or `world.md`:**
  - Sara left her suitcase with Daniel before 3 p.m. (Day 2).
  - The booking is under Sara Demir, for three nights.
  - She is in room 714, on the seventh floor.
  - The Wi-Fi is free: ParkHotel-Guest, password mainstreet210, also written on the key-card
    holder.
  - Breakfast is included tomorrow (Sunday), 7 to 10:30, at The Corner Café.
  - The desk lends chargers.
  - The airline is bringing the backpack tomorrow morning (Days 1–2), and the desk calls the room
    when it arrives.
  - Daniel already knows Sara (his Day 2 voice message).
  - The Intermediate content never mentions the lost phone or Mike. "My phone's dead" is a
    `world.md` fact.
- **No real brands or places, and no prices.** The retell has no money in it, and the conversation
  doesn't mention the $50 hold. US spelling throughout.

### (c) Review v1 applied

Applied (English, Persian and learning-UX reviews):
- **Line 8:** "That way, you won't forget it." became "That way, you don't have to remember it." The
  conversation is now 148 words (part 1: 58).
- **Connect:** cause 0 is "Daniel isn't sure how to spell Demir."; result 0 is "Daniel calls to say
  it's here." (6 words). This also closes open question 4 (the dead phone).
- **Password distractor:** "mainstreet201" became "mainstreet120". "One-twenty" is clearly different
  from "two-ten" when heard; "two-oh-one" was too close.
- **Intermediate intro (1.5 and section 3):** en now lists the room number, the Wi-Fi password, the
  breakfast time and how Daniel helps, matching the three choice questions and the Connect. The fa
  line says the same, with the hotel as Latin `Park Hotel`.
- **Retell text:** "and he tried every spelling" became "Then Daniel tried every spelling" (it was
  unclear who "he" was). "One free room left" became "one room left" ("free" already means "no
  cost" in the Wi-Fi line). Now 187 words; `listenSeconds` and `speakLimit` don't change.
- **Retell key points:** the first point (Daniel's job since the opening) is folded into the second
  ("In the hotel's first week, late at night…"). To keep the six points the test expects, the old
  point 4 is split in two (the Parkside booking; the forgotten name and the taxi).
- **Retell `does`:** "funniest" became "favorite", as in the text; fa «ماجرای موردعلاقهٔ دنیل…».
- **Retell intro:** en "Daniel at the front desk has a favorite story about a guest. Listen, then
  tell it in your own words."; fa as the Persian reviewer wrote it.
- **Hotel name in Persian:** Latin `Park Hotel` in Persian lines, except the retell title «هتل پارکِ
  اشتباهی». The note under section 3 now says so.

Declined or not for this file:
- The learner's name (Karimi) doesn't appear in the listening modules, so nothing changed.
- "Is the Wi-Fi free?" (line 6) stays: there "free" means "no cost", the only sense left in this
  file.
- The other review points (role-play prompt, twists, goals, Persuade, Say it, traps, world.md's goal
  line) concern other files.

---

## New facts for world.md

These come from the retell only. The conversation uses only facts already in `world.md`.

### Other hotels, near the airport

- **The Parkside Hotel**: a different, fictional hotel near Riverton Airport, twenty miles from
  downtown. It appears only in the retell (the wrong hotel), never in Choose and persuade.

### Daniel's favorite story (the retell)

- It comes from the hotel's very first week, last year. A tired man named **Walker** came in at
  almost midnight with a big suitcase and a booking Daniel couldn't find. His booking was at the
  **Parkside Hotel**. He had forgotten the full name, so he asked his taxi driver for "the Park
  Hotel". The Park Hotel had one room left, so he stayed, and Daniel canceled the Parkside booking
  for him.
- Since then, Walker has stayed at the Park Hotel on every trip to Riverton. His joke at check-in
  is "Walker. And yes, I'm sure it's this one."
- The twenty miles agree with Day 2's world (the airport is about 20 miles from downtown). The first
  week fits Day 2's opening date (March 13 last year).
