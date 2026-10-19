# English Day 1: Listen and connect, two versions (draft v1)

Status: **draft, for review and owner approval.** Day 1 keeps its one built conversation (Sara at
the baggage desk, `CONVERSATION` in `src/lib/practice/listen-connect.ts`) for both versions. Both
versions hear the same audio; each has its own questions, as on Day 2 (`CONNECT` in
`src/lib/practice/days/day-2.ts`).

- **Professional (B1+):** today's built set, unchanged (`CONNECT`, `CHOICES`, `PARTS`, `QUESTIONS`,
  `MIRA_LINE`, that is `DAY_ONE_SET`).
- **Intermediate (A2):** a new set, below, written field by field in the shape of `ConnectSet`, so
  it can go into the code as `CONNECT.intermediate` for Day 1.

Every fact comes from `world.md`. US English. Voices as built: the agent is Brian (`c`), Sara is
Emma (`d`), Mira is Ava (`b`) only. `MAX_PLAYS` stays 2 per part.

---

## 1. One change to the conversation (both versions hear it)

**Adopted.** Line 6 adds the delivery window, as the reviewers suggested:

| # | Now | New |
|---|---|---|
| 6 | It'll be on the evening flight, so we can bring it to your hotel tomorrow morning. | It'll be on the evening flight, so we can bring it to your hotel tomorrow morning, between eight and ten. |

Why:
- `world.md` says the delivery is "tomorrow morning, between 8 and 10 a.m." and lists it under
  "Facts that must stay true across Days 1–3". Today, Day 1 never says the time.
- Day 2's voice message from the baggage desk (`d2-baggage`) then **confirms** the time ("Our driver
  will come between eight and ten a.m.") instead of telling it for the first time. Day 3's world and
  phrases ("tomorrow between eight and ten (Day 1)") become literally true of Day 1.
- It gives the A2 set a real listening item (two numbers) for "when it comes".

Cost: +4 words (154 → 158; the test allows 120–160) and about 1.5 s of audio. Only line 6's audio
is generated again.

### Today's B1 questions still hold (checked one by one)

| B1 question | Evidence line | Still true? |
|---|---|---|
| Connect 0: wrong flight number → went to Frankfurt | 4 | Line 4 unchanged. |
| Connect 1: evening flight → "It reaches her hotel tomorrow morning." | 6 | Yes: the new line still says "to your hotel tomorrow morning"; the time only adds to it. The test's `toContain('hotel tomorrow')` still matches. |
| Connect 2: medicine → "She buys some at the pharmacy." | 8 | Line 8 unchanged. |
| Plan and reality: "It was supposed to come on Sara's flight." | 4 | Unchanged. |
| Condition: "Keep the receipt." (wrong: "Wait until tomorrow morning.") | 8 | Unchanged; the wrong option is still wrong. |
| Instead: "Don't buy one. Borrow one at the desk." | 10 | Unchanged. |

- No B1 result or option mentions a time, so the new words give nothing away and add no second
  match.
- B1 parts: part 1 (lines 5–6) grows from 24 to 28 words; the parts still cover every line once.
- The link phrases (`in that case`, `as long as`, `instead`) each still occur once; "between eight
  and ten" contains none of them.

If the owner declines the change, see note 3 for the one A2 question that changes.

---

## 2. Listen and connect (Intermediate, A2): the new set

Fact questions an A2 learner can answer after one or two plays: what the missing bag looks like,
where it went, when it comes, what's in it, and what she does about the medicine and the charger.
Same counts as Days 2–3's Intermediate sets: 3 parts, 3 Connect causes with 4 results, 3 choice
questions, 6 points.

### 2.1 `speakers` and `conversation`

As built (`SPEAKERS`, `CONVERSATION`), with the new line 6. 11 lines, 158 words. `#` is the index
that `evidence` uses.

| # | `who` | `text` | Words |
|---|---|---|---|
| 0 | agent | Hello, how can I help? | 5 |
| 1 | sara | Hi. I just landed from Istanbul, but only one of my bags came out. | 14 |
| 2 | agent | Oh, I'm sorry. What does the missing one look like? | 10 |
| 3 | sara | It's a small green backpack. My big gray suitcase is here, that one's fine. | 14 |
| 4 | agent | Let me check... OK. It was supposed to be on your flight, but it went to Frankfurt, because the tag had the wrong flight number. | 25 |
| 5 | sara | Oh no. So when can I get it? | 8 |
| 6 | agent | It'll be on the evening flight, so we can bring it to your hotel tomorrow morning, between eight and ten. | 20 |
| 7 | sara | The thing is, my medicine's in that backpack, and I need it tonight. | 13 |
| 8 | agent | In that case, just buy what you need at the pharmacy here. We'll pay you back, as long as you keep the receipt. | 23 |
| 9 | sara | OK. And my phone charger's in there too. Should I buy one of those too? | 15 |
| 10 | agent | No need. You can borrow one at the information desk instead. | 11 |

### 2.2 `parts` (A2's own)

| Part | `from` | `to` | `title.en` | `title.fa` | Words |
|---|---|---|---|---|---|
| 0 | 0 | 3 | The missing bag | بارِ گم‌شده | 43 |
| 1 | 4 | 6 | Where it went, when it comes | کجا رفته، کِی می‌رسد | 53 |
| 2 | 7 | 10 | The medicine and the charger | دارو و شارژر | 62 |

The B1 parts are 0–4, 5–6, 7–10 (68, 28, 62 words). For A2 the first part ends after Sara's
description, so every learner's first-ever listen is short (43 words, about 15 s) and asks one
thing. Day 2's two versions share their parts; here they differ, which the code allows (`parts`
is per set). If the editor prefers shared parts, see note 4.

### 2.3 `linkPhrases`

Today's three, reused: `in that case` (line 8), `as long as` (line 8), `instead` (line 10). Each
occurs once. They are highlighted on the last screen only; the A2 questions test the facts they
carry (buy the medicine; borrow the charger), not the phrases.

### 2.4 Mira's listening goal before Play (`intro`)

The same text as in section 3.

- en: Sara is at the airport, and one of her bags is missing. Listen for what it looks like, where it went, when it comes, and what’s inside.
- fa: سارا در فرودگاه است و یکی از کیف‌هایش نیامده. گوش بده ببین چه شکلی است، کجا رفته، کِی می‌رسد و داخلش چه چیزهایی هست.

It names the four things the questions ask, in the order they come.

### 2.5 `connect`

`causes` (in conversation order):

| # | Cause | `answers` (result index) | `evidence` (line) | Part |
|---|---|---|---|---|
| 0 | The tag had the wrong flight number. | 1 | 4 | 1 |
| 1 | Her medicine is in the backpack. | 3 | 8 | 2 |
| 2 | Her phone charger is in the backpack. | 0 | 10 | 2 |

`results` (shuffled once, shown for every cause):

| # | Result | Words |
|---|---|---|
| 0 | She can borrow one at the airport. | 7 |
| 1 | The backpack went to Frankfurt. | 5 |
| 2 | Her gray suitcase is fine. *(the fourth result: true (line 3), but its cause isn't listed)* | 5 |
| 3 | She buys some at the pharmacy. | 6 |

Causes 1 and 2 are written the same way on purpose ("… is in the backpack"): the learner has to
remember which thing she **buys** and which she **borrows**, the one contrast A2 needs from part 2.

**Second-match check** (every cause against every result):
- Cause 0 (the wrong tag): the tag was the backpack's, so it has nothing to do with the suitcase
  (result 2). The pharmacy and the charger don't follow from it.
- Cause 1 (the medicine): "borrow one" doesn't fit medicine (you don't borrow medicine, and "one"
  is a countable thing). Frankfurt isn't caused by what's inside the bag.
- Cause 2 (the charger): "buys some" doesn't fit a charger ("one", not "some"), and the agent
  says she doesn't need to buy one (line 10). Again, the bag's contents don't send it to Frankfurt.
- I avoided two tempting fourth results: "It comes to her hotel tomorrow" (true of the charger
  too, since it's inside the backpack) and "The airline pays her back" (a chain from the medicine).
  "Her gray suitcase is fine" is caused by none of the three.

The right answers use other words than the audio: "She buys some" for "just buy what you need",
"She can borrow one at the airport" for "You can borrow one at the information desk". "Went to
Frankfurt" is said almost word for word, as in the B1 set.

### 2.6 `choices`

| # | `kind.en` / `kind.fa` | `question` | `options` (the answer in bold) | `answer` | `evidence` | Part |
|---|---|---|---|---|---|---|
| 0 | What it looks like / چه شکلی است | What does the missing bag look like? | **A small green backpack.** / A big gray suitcase. / A small gray backpack. | 0 | 3 | 0 |
| 1 | When / کِی | When will the backpack get to her hotel? | Tonight, on the evening flight. / Tomorrow morning, between nine and eleven. / **Tomorrow morning, between eight and ten.** | 2 | 6 | 1 |
| 2 | What's in it / داخلش چیست | What else is in the backpack? | Her phone. / **Her phone charger.** / Her passport. | 1 | 9 | 2 |

Where the wrong options come from:
- **Question 0:** "A big gray suitcase" is the real other bag (line 3). "A small gray backpack" mixes
  the two bags: the A2 ear has to separate "green" and "gray". The question echoes the agent's own
  "What does the missing one look like?" (line 2).
- **Question 1:** "Tonight, on the evening flight" is a real detail linked to the wrong thing: the
  backpack reaches the airport tonight, but the hotel tomorrow. "Between nine and eleven" isn't
  said; it tests the two numbers. Neither wrong option contradicts the audio.
- **Question 2:** "Else" follows the Connect screen just before it, which names the medicine.
  "Her phone" is a real word from line 9 ("my **phone** charger's in there"), the natural A2 slip;
  she has her phone with her (it dies later, Day 2). "Her passport" isn't said, and is realistic. I
  avoided "a sweater" and "a book": `world.md` says they **are** in the backpack, though the audio
  doesn't.

### 2.7 `questions` (order)

| Step | `part` | `kind` | `index` | What it asks |
|---|---|---|---|---|
| 1 | 0 | choice | 0 | What the missing bag looks like |
| 2 | 1 | connect | 0 | The wrong tag → where it went |
| 3 | 1 | choice | 1 | When it gets to her hotel |
| 4 | 2 | connect | 1 | The medicine → she buys some |
| 5 | 2 | choice | 2 | What else is in it (the charger) |
| 6 | 2 | connect | 2 | The charger → she can borrow one |

`stepsOf` gives `listen, question, listen, question, question, listen, question, question, question,
end`: 1, 2 and 3 questions per part (B1 today: 2, 1, 3; Days 2–3: 1, 3, 2).

Order inside part 2 matters: Connect 1's cause names only the medicine, so Question 2 ("What else")
comes next, and Connect 2's cause, which names the charger, comes after it.

### 2.8 `miraLine`

- en: The agent used three small phrases: `in that case` (then do this), `as long as` (only if), `instead` (not that, this). Tap a line and listen for them again.
- fa: کارمند فرودگاه سه عبارت کوتاه به کار برد: `in that case` (در این صورت)، `as long as` (به شرطی که)، `instead` (به‌جایش). روی یک خط بزن و دوباره به این‌ها گوش بده.

It ends like Days 2–3's Intermediate lines ("Tap a line…"). The Persian glosses are today's B1 ones,
so the two versions teach the phrases the same way.

### 2.9 Rule checks

- Every `evidence` line is in the part its question follows: 3 is in part 0; 4 and 6 in part 1; 8,
  9 and 10 in part 2. Each part has at least one question.
- `answers` has three different results (1, 3, 0); four results, the fourth true but unmatched.
  Choice answers fall at positions 0, 2 and 1.
- Results and options have 2–7 words (the test allows 8, the spec 7); questions have 6–8 words.
- No result is about a time or the bags' looks, so no Connect screen gives away a choice answer.
  The results shown in part 1 ("She can borrow one…", "She buys some…") don't name the medicine or
  the charger, so they don't give away Question 2. No choice option gives away a Connect answer.
- No link phrase is in the questions or options, and nothing is in bold.
- The right answer is never the only option with the audio's exact words (Q0: "big gray suitcase";
  Q1: "tonight", "evening flight"; Q2: "phone").
- Questions, options and the conversation are English and left-to-right, as the spec says and as on
  Days 2–3. Persian is given for every field `ConnectSet` has for it (part titles, question kinds,
  `miraLine`) and for Mira's `intro` and `does`.

---

## 3. Mira's module instructions (for Day 1's tracks in `day.ts`)

| Track | Module | `title` / `short` | `does` (en / fa) | `intro` (en / fa) |
|---|---|---|---|---|
| Intermediate | `listen-act` | As built: Listen and connect / گوش بده و وصل کن · Listen / گوش دادن | Hear Sara at the airport baggage desk, then show what you caught about her missing bag. / گفت‌وگوی سارا و کارمند فرودگاه را دربارهٔ بارِ گم‌شده‌اش بشنو و نشان بده چه چیزهایی را گرفتی. | Sara is at the airport, and one of her bags is missing. Listen for what it looks like, where it went, when it comes, and what’s inside. / سارا در فرودگاه است و یکی از کیف‌هایش نیامده. گوش بده ببین چه شکلی است، کجا رفته، کِی می‌رسد و داخلش چه چیزهایی هست. |
| Professional | `listen-act` | As built | Hear Sara at the airport baggage desk, then show how the facts connect. / گفت‌وگوی سارا و کارمند فرودگاه را دربارهٔ بارِ گم‌شده‌اش بشنو و نشان بده اتفاق‌هایش چطور به هم ربط دارند. | Kept as built: Sara has a problem at the airport. Listen for what went wrong, and what the airline will do about it. / سارا در فرودگاه به مشکل خورده. گوش بده ببین چه مشکلی پیش آمده و شرکت هواپیمایی قرار است برایش چه کار کند. |

- The built `does` ("Hear a real conversation, then show how its facts connect.") is generic. Days
  2–3 name the scene, so I propose the Professional line above; the built one is still acceptable.
- The Intermediate `does` says "what you caught" instead of "how the facts connect", because half
  its questions are plain facts (looks, time, contents). If the owner wants one wording for both,
  use the Professional line.
- Minutes: the README gives 3 for both versions. The built `{ 15: 3, 20: 5 }` can stay.
- In `day.ts`, use the curly apostrophe (what’s), as Days 2–3 do.
- No English appears in these Persian lines, so they need no «…».

---

## Notes for the editor

### (a) Open questions

1. **Guessing without listening.** Connect 1 (medicine → pharmacy) is easy to guess from world
   knowledge, like Day 3's spelling item. Connect 2 needs the buy/borrow contrast, but "borrow one"
   is guessable too once the medicine is placed. The real listening load is in the three choice
   questions (green/gray, eight and ten, "phone charger"). The spec's no-listening test isn't done
   yet.
2. **"At the airport" in Connect 2.** I wrote "She can borrow one at the airport." (7 words) to stay
   within the spec's 7 and to avoid "the desk" (she's already at the baggage desk). "She can borrow
   one at the information desk." is 8 words: the test allows it, and the built B1 option "Don't buy
   one. Borrow one at the desk." is 8 too. Owner's choice. Either way it says "can", not "borrows":
   in `world.md` the desk had no charger that fit (Day 2).
3. **If the line 6 change is declined,** only Question 1 changes: options "Tonight, on the evening
   flight." / "Tomorrow evening." / **"Tomorrow morning."** (answer 2), evidence 6. Everything else
   holds, but Day 2's call then gives the time for the first time.
4. **Shared parts.** If the editor wants Day 2's pattern (one `PARTS` for both versions), the A2
   questions also fit the B1 parts (0–4, 5–6, 7–10): Question 0 and Connect 0 after part 0, Question
   1 after part 1, part 2 as written (2, 1, 3 per part). The cost is a 68-word first listen.
5. **Saved records.** The A2 set has the same shape as the B1 set (3 parts, 3 causes, 4 results, 3
   choices), so `asConnectRecord` would accept a record saved under the old Day 1 set as an A2
   record, with the old answers. The README says learners who started Day 1 before the change
   finish on the old list, so make sure they keep the B1 set (or the record is dropped).
6. **Code.** Day 1 now has one set (`DAY_ONE_SET`), and `listen-connect.test.ts` checks that
   `connectSetFor('day-1')` is `DAY_ONE_SET` and hard-codes its `STEPS` shape. Adding the A2 set
   means a `Record<Track, ConnectSet>` for Day 1, as on Day 2, with `professional` = today's set.
   The test's evidence check for line 6 (`'hotel tomorrow'`) still passes with the new line.
7. **Audio.** Regenerate line 6 only; listen that "between eight and ten" isn't swallowed at the end
   of a 20-word line, and that the whole conversation stays under 60 s.
8. **Persian review.** Check «بارِ گم‌شده» (part title, and in `does`), «کیف‌هایش» in the intro
   (Sara's bags: a suitcase and a backpack), and «داخلش چیست» as a question kind.

### (b) Checks done

- **Every answer is in the audio:**
  - Question 0: line 3, "It's a small green backpack."
  - Connect 0: line 4, "it went to Frankfurt, because the tag had the wrong flight number."
  - Question 1: line 6 (new), "to your hotel tomorrow morning, between eight and ten."
  - Connect 1: lines 7–8, medicine in the backpack → "just buy what you need at the pharmacy here."
  - Question 2: line 9, "And my phone charger's in there too."
  - Connect 2: lines 9–10, "You can borrow one at the information desk instead."
  - The fourth result: line 3, "My big gray suitcase is here, that one's fine."
- **Word counts** (a script, `split(/\s+/)` as in the tests): conversation 158 (test 120–160); A2
  parts 43, 53, 62; results 5–7; options 2–6; causes 6–7; questions 6–8; intro (en) 27.
- **Link phrases:** `in that case`, `as long as` and `instead` each occur once in the new
  conversation.
- **Voices:** unchanged (agent `c`, Sara `d`; neither is Ava `b`).
- **Nothing contradicts `world.md` or Days 2–3:**
  - Sara flew from Istanbul; her small green backpack went to Frankfurt because of the wrong flight
    number on the tag; her big gray suitcase is with her.
  - It comes on the evening flight and reaches her hotel tomorrow morning, between 8 and 10 a.m.
    (Day 2's call: "between eight and ten a.m."; Days 2–3's worlds; Day 3's phrases).
  - Her medicine and charger are in it; she buys medicine at the pharmacy and keeps the receipt
    (not tested at A2; still said in line 8).
  - The charger result says she **can** borrow one, not that she did: the desk had none that fit,
    and her phone is dead by Day 3.
  - The distractors "her phone" and "her passport" aren't in the backpack in any day's world; the
    sweater and the book, which are, are not used.
  - No Day 1 module in `src` other than Listen and connect quotes line 6, so the change touches no
    other content.
