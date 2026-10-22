# English Day 4: Natural phrases, Persian-speaker traps, Say it in English, Voice messages (draft)

Status: **draft v1, for review and owner approval.** Every fact comes from `world.md` (and Days 1–3);
anything new is listed under "New facts for world.md" near the end. US English. Each module is
written in its built format: the field names below are the ones in its `.ts` file, and the layout
follows `docs/english-day-3/phrases-and-messages.md` and `src/lib/practice/days/day-3/phrases.ts`.

| Module | Set | Track | Code | Spec |
|---|---|---|---|---|
| Natural phrases | A2 | Intermediate (A2) | `src/lib/practice/phrases.ts` | `docs/english-shadowing-spec.md` |
| Natural phrases | B1 | Professional (B1+) | the same | the same |
| Persian-speaker traps | one set | Intermediate | `src/lib/practice/traps.ts` | `docs/english-traps-spec.md` |
| Say it in English | Intermediate (4 items, A2) | Intermediate | `src/lib/practice/say-in-english.ts` | `docs/english-say-in-english-spec.md` |
| Say it in English | Professional (3 items, B1) | Professional | the same | the same |
| Voice messages | one set (A2+) | Intermediate | `src/lib/practice/voice-messages.ts` | `docs/english-voice-messages-spec.md` |

**Daily lesson subsets.** Traps (Intermediate): 5 of 6: four new direction traps and Day 1's
`call-me` (**From Day 1**, the owner's "one item from an earlier day"); left out: #6 `go-straight`,
lab only. Voice messages (Intermediate): both of the 2 (Daniel and Tom); there are no lab-only
messages. Say it in English: the whole set in both versions (4 and 3), so `LESSON_SAY_IDS` is `null`
for both; the Professional set's first item is Day 3's `d3-late-checkout` (**From Day 3**). Each
section says which.

**From an earlier day (owner's decision).** Two items come back word for word, with the same id,
text and checks, and are marked "From Day N" here and in Mira's intro:
- Intermediate traps: **`call-me`**, from `src/lib/practice/days/day-1/phrases.ts` (see §2, #5).
- Professional Say it: **`d3-late-checkout`**, from `src/lib/practice/days/day-3/phrases.ts` (see §3b,
  #1).

Neither has a code field that says "From Day N"; Mira's module intro says it (§5). The builder
should reuse the objects by reference, not copy them (see "Notes for reviewers", code).

**Who "you" are.** One name for the learner everywhere: **Karimi** («کریمی»), as on Day 3.
- **Natural phrases (both sets), Say it in English (Professional) and Voice messages:** these are
  Sara's Sunday morning. In the phrases you repeat her lines (to Daniel at the desk, then to Greg at
  the bus stop); in Say it (Professional) and Voice messages, Mira's intro says "you're Sara".
- **Traps and Say it in English (Intermediate):** "you" are the learner, also staying at the Park
  Hotel, on your own day out in Riverton (`world.md`). Your own booking (under Karimi) never comes
  up today. You ask the front desk the way to the City Museum.

**The day's goal** (ask how to get somewhere, understand the answer, check it by saying it back, and
ask for a repeat or slower speech) is in both phrase sets (A2 #1 ask, #3 check, #4 repeat; B1 #1
ask, #3 check, #4 slow down), in four lesson traps (`turn-left`, `across-from`, `minutes-away`,
`cross-street`), in all four Intermediate Say-it items (`d4-museum-way`, `d4-slower`,
`d4-check-way`, `d4-bus-back`), in two of the three Professional ones (`d4-no-data`,
`d4-way-around`) and in Tom's message (he asks if she knows the way).

---

## 1. Natural phrases

Built format (`Phrase`): `sentence` (what Mira says), `shown` (`**bold**` = the chunk, `‿` = a link;
removing the marks gives `sentence`), `chunk`, `situation {en, fa}`, `tip {en, fa}` (English in
`backticks`), `found` (the word check, a regex run on the say-better `normalise()` output: lower
case, contractions spelled out, so "I'm" is "i am", "I've" is "i have" and "I'd" is "i would";
"it's", "what's" and "that's" stay as they are; a hyphen becomes a space). The habit each chunk
replaces is a content note, not a code field. Five sentences per set; the voice is Mira's.

### 1a. A2 set (Intermediate)

Order of Sara's morning: **ask the way (Daniel) → can I walk? → check it back → ask for a repeat,
slower (Greg) → thanks.**

| # | `situation` (en / fa) | `shown` (chunk in bold) | Habit it replaces | `tip` (en / fa) |
|---|---|---|---|---|
| 1 | You want to go to the Sunday market. You ask at the front desk. / می‌خواهی به بازار یکشنبه بروی. از پذیرش هتل می‌پرسی. | Excuse me, **how do I get‿to** the Sunday market? | "How can I go to the market?" (from «چطوری برم بازار؟») | `get to`: say the `t` only once, soft and quick: `GEH-tuh`. / در `get to` صدای `t` را فقط یک بار بگو، نرم و سریع: `GEH-tuh`. |
| 2 | You'd like to walk, if it isn't too far. / اگر خیلی دور نباشد، دوست داری پیاده بروی. | **Can I walk there**, or is it too far? | "Can I go by walk?" (from «پیاده می‌شه رفت؟») | `walk`: the `l` is silent: `WAWK`. / در `walk` حرف `l` خوانده نمی‌شود: `WAWK`. |
| 3 | Daniel explains the way. You check it. / دنیل راه را توضیح می‌دهد. برایش تکرار می‌کنی تا مطمئن شوی درست فهمیده‌ای. | So I **turn left‿at** the second light? | "So I turn to left?" / "I go to left?" (from «بپیچم به چپ؟») | `left at` runs together: `LEF-tat`. / `left at` را پیوسته بگو: `t` به `at` می‌چسبد، یعنی `LEF-tat`. |
| 4 | The street is closed for a race. A man at the bus stop explains another way, very fast. / خیابان به‌خاطر یک مسابقهٔ دو بسته است. مردی در ایستگاه اتوبوس راه دیگری را خیلی تند توضیح می‌دهد. | Sorry, could you **say that‿again** a little slower? | "Please repeat again." / "Can you speak more slow?" (from «دوباره تکرار کنید» / «یواش‌تر بگید») | `that again`: the `t` turns soft and quick, like a `d`: `tha-duh-GEN`. / در `that again` صدای `t` نرم و سریع می‌شود، شبیه `d`: `tha-duh-GEN`. |
| 5 | He says it again, slowly. Now you understand. / دوباره و آهسته می‌گوید. حالا می‌فهمی. | Thanks so much. **I really appreciate it**. | "I'm very thankful from you." (from «خیلی ازتون ممنونم») | `appreciate`: stress the second part: `uh-PREE-shee-ayt`. / در `appreciate` تأکید روی بخش دوم است: `uh-PREE-shee-ayt`. |

`sentence` and `chunk` for each (the plain sentence is `shown` without the marks):

| # | `sentence` | `chunk` |
|---|---|---|
| 1 | Excuse me, how do I get to the Sunday market? | how do I get to |
| 2 | Can I walk there, or is it too far? | can I walk there |
| 3 | So I turn left at the second light? | turn left at |
| 4 | Sorry, could you say that again a little slower? | say that again |
| 5 | Thanks so much. I really appreciate it. | I really appreciate it |

**Word check** (only the chunk, never the accent), with the `found` regex text (tested against
`normalise()`: each finds its own sentence, ignores the other nine sentences of both sets, accepts
the variants listed and rejects the habit):

| # | What it listens for | `found` |
|---|---|---|
| 1 | how do / can / could I (we) get to / get there ("How can I get to the market?", "How do we get there?"); "How can I go to…", "How do I go to…" and "What is the way to…" don't count | `/\bhow (?:do\|can\|could\|would\|should) (?:i\|we\|you) get (?:to\|there)\b/` |
| 2 | can / could / should I (we) walk, walk there ("Could I walk there?", "Can we walk?", "Is it OK to walk there?"); "go by walk", "go there on foot" (fine English, not the chunk) and "far by walk" don't count | `/\b(?:can\|could\|should) (?:i\|we\|you) (?:just )?walk\b\|\bwalk there\b/` |
| 3 | turn / take a / make a left (right) ("So I take a left at the second light?", "turn left on Oak Street"); "turn to left", "go to left" and "turn to the left" don't count | `/\b(?:turn\|take a\|make a) (?:left\|right)\b/` |
| 4 | say that / it / this again, or one more time ("Can you say it again, please?"); "repeat again" and "speak more slow" don't count | `/\bsay (?:that\|it\|this) (?:again\|one more time)\b/` |
| 5 | appreciate it / that / this / your help / you ("I appreciate your help", "Thanks, I appreciate that."); "thankful from you" and "I thank you very much" don't count | `/\bappreciate (?:it\|that\|this\|your help\|the help\|you)\b/` |

### 1b. B1 set (Professional)

The same five steps, one B1 chunk each, so the set still tells Sara's morning in order: **ask the
best way (Daniel) → is it walking distance? → check it back → ask the man at the bus stop to slow
down (Greg) → thanks.** Each tip has one sound feature only.

| # | `situation` (en / fa) | `shown` (chunk in bold) | Habit it replaces | `tip` (en / fa) |
|---|---|---|---|---|
| 1 | You want to go to the Sunday market in Central Park. You ask at the front desk. / می‌خواهی به بازار یکشنبه در پارک مرکزی بروی. از پذیرش هتل می‌پرسی. | Hi, what's **the best‿way to get to** the Sunday market from here? | "What is the best way for going to…?" / "Which way is better for going…?" (from «بهترین راه برای رفتن به … چیه؟») | `best way`: the `t` almost disappears: `bes-WAY`. / در `best way` صدای `t` تقریباً شنیده نمی‌شود: `bes-WAY`. |
| 2 | You'd like to walk, but you don't know how far it is. / دوست داری پیاده بروی، ولی نمی‌دانی چقدر راه است. | Is it **within walking distance**, or should I take the bus? | "Can I go there by walk?" / "Is it near for walking?" (from «پیاده می‌شه رفت؟ نزدیکه؟») | `walking`: the `l` is silent: `WAW-king`. / در `walking` حرف `l` خوانده نمی‌شود: `WAW-king`. |
| 3 | Daniel explains the way. You say it back to check. / دنیل راه را توضیح می‌دهد. آن را برایش تکرار می‌کنی تا مطمئن شوی. | So **if I've got this right**, I go left at the bank and walk two blocks? | "Did I understand correct?" (from «درست فهمیدم؟») | Stress `got` and `right`: `if I've GOT this RIGHT`. / روی `got` و `right` تأکید کن: `if I've GOT this RIGHT`. |
| 4 | The street is closed for a race. A man at the bus stop explains another way, very fast. / خیابان به‌خاطر یک مسابقهٔ دو بسته است. مردی در ایستگاه اتوبوس راه دیگری را خیلی تند توضیح می‌دهد. | Sorry, I'm not from around here. Could you **slow down‿a bit**? | "Can you speak more slow?" (from «آروم‌تر صحبت کنید») | `down a bit` runs together: `dow-nuh-BIT`. / `down a bit` را پیوسته بگو: `n` به `a` می‌چسبد، یعنی `dow-nuh-BIT`. |
| 5 | Now you know the way. His bus is late. / حالا راه را بلدی. اتوبوسِ او دیر کرده. | Thanks, **that's really kind‿of you**. I hope your bus comes soon! | "That's very kind from you." (from «خیلی لطف کردید» / «از لطفتون») | `kind of you` runs together, with a weak `of`: `KYN-duh-vyoo`. / `kind of you` را پیوسته بگو و `of` را ضعیف: `KYN-duh-vyoo`. |

| # | `sentence` | `chunk` |
|---|---|---|
| 1 | Hi, what's the best way to get to the Sunday market from here? | the best way to get to |
| 2 | Is it within walking distance, or should I take the bus? | within walking distance |
| 3 | So if I've got this right, I go left at the bank and walk two blocks? | if I've got this right |
| 4 | Sorry, I'm not from around here. Could you slow down a bit? | slow down a bit |
| 5 | Thanks, that's really kind of you. I hope your bus comes soon! | that's really kind of you |

**Word check** (only the chunk; tested as above):

| # | What it listens for | `found` |
|---|---|---|
| 1 | the best / easiest / quickest / fastest / simplest way to get (to go, of getting) to / there ("What's the easiest way to get there?", "the quickest way to go to the park"); "best way for going" and "which way is better for going" don't count | `/\b(?:best\|easiest\|quickest\|fastest\|simplest) way (?:to get\|to go\|of getting) (?:to\|there)\b/` |
| 2 | (within / in) walking distance ("Is it walking distance?"); "by walk", "walkable" and "near for walking" don't count | `/\b(?:within \|in )?walking distance\b/` |
| 3 | if I('ve) got this / that / it / you / everything right ("If I've got it right…", "if I got that right"); "Did I understand correct?" doesn't count; "If I understood correctly" is fine English but isn't the chunk, so it doesn't count either | `/\bif i (?:have )?got (?:this\|that\|it\|you\|everything) right\b/` |
| 4 | slow (it) down ("Could you slow it down a little?"); "speak more slow", "speak slowly" and "speak more slowly" (fine English, not the chunk) don't count | `/\bslow (?:it )?down\b/` |
| 5 | kind of you ("That's so kind of you", "It's very kind of you"); "kind from you", "You are very kind" and "It's kind of far" don't count | `/\bkind of you\b/` |

**Where the chunks come back:** A2 #1 `how do I get to` is in Say-it `d4-museum-way`; A2 #3 `turn
left at` is in trap `turn-left` and Say-it `d4-check-way`; A2 #4 `say that again` is in Say-it
`d4-slower`. B1 #3 `if I've got this right` is used again in Say it (Professional) `d4-way-around`,
and B1 #1 `the best way to get to` in `d4-no-data`'s second model, for transfer (as Day 3 reused
`would it be possible to`).

---

## 2. Persian-speaker traps (Intermediate)

Built format (`Trap`): `id`, `kind {en, fa}`, `words` (the sentence with the mistake, word by word),
`wrong` (index of the word to tap), optional `alsoOk` (`{index, sentence}`), `right`, `why {en, fa}`,
`accept` and `reject` (regex text, run on the traps `normalise()`: lower case, plain quotes, no
punctuation, so a hyphen becomes a space; contractions are **not** spelled out here), optional
`alsoGood {patterns, word}`. Six traps: five new ones about directions and one from Day 1. None of
the new ones is in the Module lab set (he-she, agree, said-told, age, since-for, than, afraid-of,
bored), Day 1's (my-bags, by-tomorrow, call-me, look-like), Day 2's (been-waiting, to-not-until,
near-of, how-long, bad-traffic, on-the-bus, get-out, help-with) or Day 3's (under-name,
on-the-floor, password-for, phone-dead, lend-me, im-staying); their ids are new. `why.fa` has no
backticks: English goes in «».

All six were run through a copy of the code's check (`checkSaid` with the traps `normalise()`):
`right` passes, the sentence with the mistake fails, and the extra forms listed get the result
shown.

**Daily lesson:** the Intermediate lesson uses 5 of the 6. First the four new ones, in the order
you meet them when you ask the way (which way to turn → where it is → how far → on the way), then
the one from Day 1 as a review: `turn-left`, `across-from`, `minutes-away`, `cross-street`,
`call-me`. Left out: #6 `go-straight` (lab only, as Day 3's `phone-dead`; the same idea "straight
on Main Street" is in the listening and the Say-it models). All six stay defined in `TRAPS`.

`LESSON_TRAP_IDS = ['turn-left', 'across-from', 'minutes-away', 'cross-street', 'call-me']`

**1. `id`: `turn-left`** · `kind`: turn left (no “to”) / turn left (بدون to)
- `words`: `["So", "I", "turn", "to", "left", "at", "the", "bank?"]` · `wrong`: 3 (`to`)
- `right`: So I turn left at the bank?
- `why` en: After “turn”, say “left” or “right” with no “to”: “turn left at the bank”.
- `why` fa: در فارسی می‌گوییم «بپیچ به چپ» و برای همین «to» به ذهنمان می‌رسد. در انگلیسی بعد از «turn» مستقیم «left» یا «right» می‌آید: «turn left at the bank».
- `accept`: `/\bturn(?:s|ed|ing)? (?:left|right)\b/`
- `reject`: `/\bturn(?:s|ed|ing)? (?:to|in|into) (?:left|right)\b/`
- `alsoGood`: patterns `/\b(?:take|make) a (?:left|right)\b/`, `/\bturn(?:s|ed|ing)? to the (?:left|right)\b/` · word "turn left"
- Also passes: "So I turn left at the bank, right?", "I turn left at the second light." "So I take a left at the bank?" and "So I turn to the left at the bank?" get "also good". ("I go to left at the bank" and "turn to right" fail; "So I turn to left, sorry, turn left…" is self-fixed.)
- From the map: the normal way turns left at the second light, at the bank (world). The check-back part of the day's goal; phrase A2 #3.

**2. `id`: `across-from`** · `kind`: across from / across from (روبه‌روی)
- `words`: `["The", "museum", "is", "in front of", "the", "park."]` · `wrong`: 3 (`in front of`, one tap: see below)
- `right`: The museum is across from the park.
- `why` en: “In front of” means on the same side, right before something. When the street is between them, say “across from”.
- `why` fa: در فارسی «روبه‌روی پارک» را معمولاً «in front of the park» ترجمه می‌کنیم. ولی «in front of» یعنی همین طرف خیابان، درست جلوی چیزی. وقتی خیابان وسطشان است، در انگلیسی «across from» می‌گوییم: «across from the park».
- `accept`: `/\bacross (?:the street |the road )?from\b/`
- `reject`: `/\bin front of\b/`
- `alsoGood`: patterns `/\bopposite\b/`, `/\bon the other side of the (?:street|road)\b/`, `/\bfacing\b/` · word "across from"
- Also passes: "The museum's across the street from the park.", "The City Museum is right across from Central Park." "The museum is opposite the park" and "…on the other side of the street" get "also good". ("The museum is in front of the park" fails; "…in front of, I mean across from the park" is self-fixed.)
- From the map: the City Museum is on Oak Street, across from Central Park's main gate (world, Day 2). Day 2's Say-it `d2-museum` taught "across from" as a hint; this makes it a trap.
- **One word, three words:** "in front of" is one tap target (one entry in `words`). The mistake is the whole phrase, and splitting it would make "in", "front" and "of" three different taps for one mistake. The code allows it (`words` are strings; `Traps.svelte` shows each as one button and strikes it through); it's the first multi-word entry, so see "Notes for reviewers".

**3. `id`: `minutes-away`** · `kind`: … minutes away / … minutes away (فاصله)
- `words`: `["The", "park", "is", "fifteen", "minutes", "far", "from", "the", "hotel."]` · `wrong`: 5 (`far`)
- `right`: The park is fifteen minutes away from the hotel.
- `why` en: After a time or a distance, say “away”: “fifteen minutes away”, or “a fifteen-minute walk”. “Far” is for questions and “not far”: “Is it far?”
- `why` fa: در فارسی می‌گوییم «پونزده دقیقه راهه» یا «پونزده دقیقه فاصله داره» و چون فاصله را با «دور» یکی می‌گیریم، «far» به ذهنمان می‌رسد. در انگلیسی بعد از زمان یا مسافت «away» می‌آید: «fifteen minutes away» یا «a fifteen-minute walk». «far» بیشتر در سؤال و جملهٔ منفی می‌آید: «Is it far?»، «It’s not far».
- `accept`: `/\b(?:minutes?|mins?|blocks?|miles?|hours?) away\b/`, `/\b(?:minute|block|mile|hour) (?:walk|drive|ride)\b/`
- `reject`: `/\b(?:minutes?|mins?|blocks?|miles?|hours?) far\b/`
- `alsoGood`: patterns `/\b(?:minutes?|blocks?|miles?) from (?:the|here|my|our|your)\b/`, `/\btakes? (?:about |around )?(?:fifteen|15) minutes\b/` · word "away"
- Also passes: "The park is 15 minutes away.", "It's a fifteen-minute walk from the hotel.", "The park's about fifteen minutes away from the hotel." "The park is fifteen minutes from the hotel" and "It takes about fifteen minutes" are good English, so they get "also good" and are asked for "away". ("The park is 15 minutes far", "The park is far from the hotel" and "It's not far" fail: the last two don't give the time.)
- From the map: the park's main gate is about 15 minutes from the hotel on foot, the normal way (world). The "understand the answer" part of the day's goal.

**4. `id`: `cross-street`** · `kind`: cross the street / cross (رد شدن از خیابان)
- `words`: `["Can", "I", "pass", "the", "street", "here?"]` · `wrong`: 2 (`pass`)
- `right`: Can I cross the street here?
- `why` en: To go to the other side of a street, you “cross” it. “Pass” means to go by something: “You’ll pass the library.”
- `why` fa: در فارسی می‌گوییم «از خیابون رد بشم؟» و «رد شدن» را «pass» ترجمه می‌کنیم. در انگلیسی برای رفتن به آن طرف خیابان «cross» می‌گوییم: «cross the street». «pass» یعنی از کنار چیزی گذشتن: «You’ll pass the library».
- `accept`: `/\bcross(?:es|ed|ing)?\b/`
- `reject`: `/\bpass(?:es|ed|ing)? (?:from |through )?(?:the |this |that |main )?(?:street|road)\b/`
- `alsoGood`: patterns `/\b(?:go|get|walk) across\b/`, `/\bget to the other side\b/` · word "cross"
- Also passes: "Can I cross here?", "Is it OK to cross the street here?", "Can I cross Main Street here?" "Can I go across the street here?" gets "also good". ("Can I pass from the street here?" and "Can I pass Main Street here?" fail; "Can I pass the street, I mean cross…" is self-fixed.) "pass the library" isn't rejected (only "pass + street / road" is), so the `why`'s own example stays right.
- From the map: you cross Main Street to reach Bus 4 and the Riverwalk (world); the way around goes past the library (world), which is the `why`'s "pass" example. The sentence itself is true anywhere, so it names no corner.

**5. `id`: `call-me`** · **From Day 1**, reused word for word (owner's decision) · `kind`: call (no “to”) / call (بدون to)
- `words`: `["Please", "call", "to", "me", "when", "you", "find", "it."]` · `wrong`: 2 (`to`)
- `right`: Please call me when you find it.
- `why` en: You “call” someone, with no “to”: “call me”, “call the hotel”.
- `why` fa: در فارسی می‌گوییم «به من زنگ بزنید» و برای همین «call to me» به ذهنمان می‌رسد. ولی بعد از «call» حرف اضافه نمی‌آید: «call me»، «call the hotel».
- `accept`: `/\bcall me\b/`, `/\bgive me a call\b/`
- `reject`: `/\bcall (?:to|for) me\b/`
- `alsoGood`: patterns `/\b(?:text|email|contact|phone) me\b/`, `/\blet me know\b/` · word "call"
- Copied exactly from `src/lib/practice/days/day-1/phrases.ts` (`TRAPS`, id `call-me`); not rewritten. Also passes (as on Day 1): "Could you call me when you find it?", "Please give me a call when you find it." "Please let me know…" gets "also good". ("Please call for me…" fails.)
- **Why this one:** the owner's example, and it fits Sunday morning: Daniel calls Sara's room at about 8:50, as he promised on Day 3 (world, step 2), and in Daniel's voice message he says he tried calling her room. It was in Day 1's Intermediate lesson (`LESSON_TRAP_IDS = ['my-bags', 'by-tomorrow', 'call-me']`), so for lesson learners it truly comes back after three days. It also gives the set one item that isn't a preposition of place, so the five don't all feel the same. Its sentence ("…when you find it") is from Day 1's lost bag; as a marked review, that's fine.
- **Considered and not chosen:** Day 2's `how-long` ("How much does it take to get there?") fits the theme best, but it was lab only on Day 2, so lesson learners never had it as a trap (it wouldn't "come back"). Day 2's `near-of` ("Is the hotel near of Central Station?") was in Day 2's lesson and fits directions; it's the best alternative if the owner prefers the theme over this morning's story moment (see "Notes for reviewers").

**6. `id`: `go-straight`** (lab only) · `kind`: go straight / go straight (مستقیم)
- `words`: `["Go", "direct", "to", "the", "second", "light."]` · `wrong`: 1 (`direct`)
- `right`: Go straight to the second light.
- `why` en: In directions, “straight” means don’t turn: “Go straight”, “Keep going straight”. “Directly” means without stopping.
- `why` fa: در فارسی می‌گوییم «مستقیم برو» و چون «مستقیم» را «direct» ترجمه می‌کنیم، «go direct» به ذهنمان می‌رسد. در آدرس دادن، در انگلیسی «straight» می‌گوییم: «Go straight» یا «Keep going straight». «directly» یعنی بدون توقف.
- `accept`: `/\b(?:go|goes|going|went|walk|walking|keep|head|continue|drive) straight\b/`, `/\bstraight (?:ahead|on|down|along|to)\b/`
- `reject`: `/\b(?:go|goes|going|walk|walking|keep|head|continue|drive) direct(?:ly)?\b/`
- Also passes: "Keep going straight to the second light.", "Walk straight down Main Street to the second light", "Go straight ahead until the second light". ("Go directly to the second light" fails; "Go direct, sorry, go straight…" is self-fixed.)
- From the map: straight along Main Street to the second light (world). Lab only: the lesson already has four direction traps, and "go directly" isn't always wrong ("go directly to the hotel" = without stopping), so it's the least clear-cut of the five.

**Candidates left out**
- "How can I go to…?" for "How do I get to…?": "How can I go to the market?" is grammatical and
  understood, so there's no wrong word to tap without teaching a false rule. It's taught as a habit
  in phrase A2 #1 and Say-it `d4-museum-way` instead.
- "near to the station" for "near the station": too close to Day 2's `near-of`, and "near to" is
  heard in British English, so it isn't clearly wrong.
- "I lost my way" for "I'm lost": "I lost my way" is good (if a little formal) English, so it isn't a
  mistake; nobody in today's story is lost in a way that needs it, either.

---

## 3. Say it in English

Built format (`SayItem`): `id`, `to {en, fa}`, `fa` (the message in spoken Persian), `points` (2,
each `{en, fa}`), `models` (2 natural versions; A2 25 words or fewer, B1 30 or fewer, the code's test
limits), `hints` (2, each `{en, fa}`), `level` (`'B1'` for the Professional set), `names` (one string
per set, to help speech-to-text). New ids start with `d4-` (unique across days); the reused item
keeps its `d3-` id. `fa`, points and hints are plain text, so they hold no English except names.

### 3a. Intermediate set (A2): four items, all in the lesson

All four `to`: **To the hotel front desk / به پذیرش هتل** (the same `TO_DESK` as Day 3). "You" are
the learner (Karimi), on your own day out, asking the desk the way to the City Museum. In the order
of asking the way: ask → it was too fast → check it back → a way back.

| # | `id` | `fa` | `points` (en / fa) | `models` | `hints` (en / fa) |
|---|---|---|---|---|---|
| 1 | `d4-museum-way` | ببخشید، از این‌جا چطوری برم موزهٔ شهر؟ پیاده دوره؟ | you're asking how to get to the City Museum / می‌پرسی چطور به موزهٔ شهر بروی · you're asking if it's far to walk / می‌پرسی پیاده دور است یا نه | "Excuse me, I'd like to go to the City Museum. How do I get there? Is it far to walk?" · "Hi, how do I get to the City Museum from here? Can I walk there, or is it too far?" | how do I get to…? / چطوری برم…؟ · far to walk / پیاده دوره |
| 2 | `d4-slower` | ببخشید، یه کم تند بود. می‌شه دوباره بگید، یه کم آروم‌تر؟ | it was a little fast for you / برایت کمی تند بود · you're asking them to say it again, more slowly / می‌خواهی دوباره و آهسته‌تر بگویند | "Sorry, that was a little fast. Could you say that again, more slowly?" · "Sorry, I didn't catch all of that. Can you say it again a little slower?" | say that again / دوباره بگید · more slowly / آروم‌تر |
| 3 | `d4-check-way` | پس از هتل که اومدم بیرون، می‌پیچم راست. بعد سر چراغ دوم، کنار بانک، می‌پیچم چپ. درسته؟ | you turn right out of the hotel / از هتل که بیرون آمدی، به راست می‌پیچی · you turn left at the second light, at the bank / سر چراغ دوم، کنار بانک، به چپ می‌پیچی | "So I turn right out of the hotel, and then left at the second light, at the bank. Is that right?" · "Let me check: right out of the hotel, then left at the second traffic light, by the bank?" | right out of the hotel / از هتل که اومدم بیرون، راست · at the second light / سر چراغ دوم |
| 4 | `d4-bus-back` | اگه خسته شدم، می‌تونم با اتوبوس برگردم؟ ایستگاهش کجاست؟ | you're asking if you can come back by bus if you get tired / می‌پرسی اگر خسته شدی، می‌توانی با اتوبوس برگردی یا نه · you're asking where the bus stop is / می‌پرسی ایستگاه اتوبوس کجاست | "If I get tired, can I take the bus back? Where's the bus stop?" · "Can I come back by bus if I'm tired? Where do I catch it?" | take the bus back / با اتوبوس برگردم · the bus stop / ایستگاه اتوبوس |

- Traps on purpose: «چطوری برم» is "How do I get to…", not "How can I go to…" (phrase A2 #1);
  «پیاده دوره؟» is "Is it far to walk?" or "Can I walk there?", not "Is it far by walk?" (phrase A2
  #2); «دوباره بگید» is "say that again", not "repeat again" (phrase A2 #4); «آروم‌تر» here is
  "more slowly" or "slower", not "more quietly" («آروم» means both slow and quiet in Persian); «می‌پیچم
  چپ» is "turn left", not "turn to left" (trap `turn-left`); «سر چراغ» is "at the light", not "on
  the light"; «خسته شدم» is "if I get tired", not "if I became tired"; «ایستگاهش» is "the bus stop",
  not "the station" (a station is for trains; Central Station is one).
- Word counts: 20, 20 · 13, 15 · 21, 18 · 14, 14 (all within 25).
- Facts: the City Museum is on Oak Street, across from Central Park's main gate; the normal way is
  right out of the hotel, left at the second traffic light (the bank) onto Oak Street, about 15
  minutes on foot (world). `d4-check-way` says back only the two turns of the normal way, which
  is the map's own fact. The item never says when Karimi goes, and the desk's answer isn't part of
  any item, so Oak Street's closure (9 a.m. to 1 p.m.) doesn't come up; the museum is open Sunday
  10 to 5 (world), so any afternoon visit works. Bus 4: its Central Park stop is at the main gate,
  across from the museum, and it goes back along Oak Street and Main Street to Central Station,
  across from the hotel (world); the item only asks, so its times and fare aren't needed.
- `NAMES`: "Park Hotel, City Museum, Main Street, Karimi."

### 3b. Professional set (B1): three items, all in the lesson

Three longer messages Sara says on Sunday morning. Each needs a B1 move: a request with a condition
("if it costs extra"), a reason ("I don't have any data, so…"), or checking you've understood ("if
I've got this right"). Item 1 is Day 3's, reused word for word; item 3 reuses B1 phrase #3 for
transfer.

`level`: `'B1'` for all three. In the lesson, in this order:

**1. `id`: `d3-late-checkout`** · **From Day 3**, reused word for word (owner's decision)
- `to`: To Daniel at the front desk / به دنیل، در پذیرش هتل (Day 3's `TO_DANIEL`)
- `fa`: امکانش هست سه‌شنبه یه کم دیرتر اتاق رو تحویل بدم، مثلاً ساعت یک؟ اگه هزینهٔ اضافه داره، ترجیح می‌دم همون ساعت یازده برم.
- `points`:
  1. you'd like a late check-out on Tuesday, at about one / می‌خواهی سه‌شنبه دیرتر، حدود ساعت یک، اتاق را تحویل بدهی
  2. if it costs extra, you'd rather leave at eleven / اگر هزینهٔ اضافه دارد، ترجیح می‌دهی همان ساعت یازده بروی
- `models`:
  - "Would it be possible to get a late check-out on Tuesday, around one? If it costs extra, I'll just leave at eleven." (22 words)
  - "Could I check out a bit later on Tuesday, say at one? If there's an extra charge, eleven is fine." (20 words)
- `hints`: a late check-out / دیرتر تحویل دادن اتاق · if it costs extra / اگه هزینهٔ اضافه داره
- `names`: "Park Hotel, Daniel, Demir, Riverton." (Day 3's `DANIEL_NAMES`, kept with the item)
- Copied exactly from `src/lib/practice/days/day-3/phrases.ts` (`SAY.professional`, id
  `d3-late-checkout`); not rewritten.
- **Why this one:** of the seven Professional items on Days 2–3, it's the only one whose every word
  is still true on Sunday: same listener (Daniel), same desk, and Tuesday's check-out is still ahead
  (check-out Tuesday by 11; late check-out until 1 p.m. is free if asked the day before, Day 3
  world). It was in Day 3's Professional lesson, so it truly comes back, a day later, with two B1
  moves ("Would it be possible to…", "If it costs extra…"). The others don't fit: `d3-hold` and
  `d3-backpack-desk` are about Saturday's check-in and Sunday's delivery, which has happened;
  `d2-pay-tip`, `d2-hotel-bags` and `d2-tom-dinner` ("Seven's perfect!") are Saturday's; and
  `d2-ridenow-pickup` (the nearest to directions) was lab only on Day 2, and Sara takes no ride
  today.
- **Story:** Sara asked this at check-in on Saturday (Day 3, new fact 8 there). On Day 4 it's a
  marked review ("From Day 3: say it again"), not a new event on Sunday, so the two days don't
  disagree. Mira's intro says so (§5).

**2. `id`: `d4-no-data`**
- `to`: To Daniel at the front desk / به دنیل، در پذیرش هتل
- `fa`: می‌خوام پیاده برم بازار یکشنبه توی پارک مرکزی. ولی گوشیم اینترنت نداره و نمی‌تونم نقشه رو ببینم. می‌شه راه رو قدم‌به‌قدم برام توضیح بدید؟
- `points`:
  1. you'd like to walk to the Sunday market in Central Park / می‌خواهی پیاده به بازار یکشنبه در پارک مرکزی بروی
  2. your phone has no data, so you can't use a map, and you're asking him to explain the way step by step / گوشی‌ات اینترنت ندارد و نمی‌توانی نقشه را ببینی، پس از او می‌خواهی راه را قدم‌به‌قدم توضیح بدهد
- `models`:
  - "I'd like to walk to the Sunday market in Central Park. I don't have any data on my phone, so could you explain the way step by step?" (28 words)
  - "What's the best way to get to the Sunday market on foot? My phone has no data, so I can't use a map. Could you walk me through it?" (29 words)
- `hints`: no data on my phone / گوشیم اینترنت نداره · step by step / قدم‌به‌قدم
- Main trap: «اینترنت نداره» → "My phone has no internet" (understood, but on a phone people say "no data", "I don't have any data"); «برام توضیح بدید» → "Can you explain me the way?" (natural: "explain the way", "explain it to me", "walk me through it"); «نقشه رو ببینم» → "see the map" (natural: "use a map").
- Facts: Sara has no mobile data in the US, so no maps outside the hotel's Wi-Fi; Daniel explains things step by step; she asks him the way at about 10:30 (world, step 3). His answer (the normal way, about 15 minutes) isn't part of the item.

**3. `id`: `d4-way-around`**
- `to`: To a man at the bus stop / به مردی در ایستگاه اتوبوس
- `fa`: پس اگه درست فهمیده باشم، مستقیم می‌رم تا چراغ بعدی، یعنی خیابون پاین، و می‌پیچم چپ. از کنار کتابخونه رد می‌شم و در کناری پارک سمت راستمه، درسته؟
- `points`:
  1. you go straight to the next light, Pine Street, and turn left / مستقیم تا چراغ بعدی، یعنی خیابان پاین، می‌روی و به چپ می‌پیچی
  2. you go past the library, and the park's side gate is on your right / از کنار کتابخانه رد می‌شوی و در کناری پارک سمت راستت است
- `models`:
  - "So if I've got this right, I keep going to the next light, Pine Street, and turn left. Then past the library, and the side gate's on the right?" (29 words)
  - "Just to check: I go straight to Pine Street, turn left, walk past the library, and the side gate is on my right?" (23 words)
- `hints`: if I've got this right / اگه درست فهمیده باشم · go past the library / از کنار کتابخونه رد شم
- Main trap: «اگه درست فهمیده باشم» → "If I understood correct" (natural: "If I've got this right"); «از کنار … رد می‌شم» → "pass from beside the library" (natural: "go past the library"); «سمت راستمه» → "it's in my right" (natural: "on my right"); «در کناری» → "the side door" (for a park: "the side gate").
- Facts: Oak Street is closed for the Fun Run; the way around is straight on Main Street to the next (third) light, Pine Street, left, past the library (on the left), and after about five minutes the side gate is on the right (world). Greg gives it, fast at first; Sara says it back to him (world, step 4). Sara doesn't know his name, so `to` doesn't use it.

- `NAMES` (items 2 and 3): "Park Hotel, Daniel, Central Park, Main Street, Oak Street, Pine Street, Riverton." (Item 1 keeps Day 3's string, so the set has two `names` strings; the field is per item, so that's fine.)
- `LESSON_SAY_IDS`: `{ intermediate: null, professional: null }` (both sets are used whole).

---

## 4. Voice messages (Intermediate, A2+)

Built format (`VoiceMessage`): `id`, `from {name, who {en, fa}, voice}`, `sentences` (one audio
request each; 120 characters or fewer, the code's test limit; the longest here is 97), `asks` (each
`{ask {en, fa}, missed {en, fa}}`), `model` (a natural reply, 40 words or fewer), `names`. Two
messages, each with 2 asks. The natural reply is read by Mira (Ava, `b`). Voices: both `c` Brian
(see "Two messages, one voice" below); never `b`. Ids start with `d4-`.

Timeline: Sunday morning. Sara's phone works again (her charger came with the backpack) but has no
mobile data, so both messages reach her on the hotel Wi-Fi, and she replies from the hotel. The
learner is Sara (the intros say so, and give the room number).

**Daily lesson:** the Intermediate lesson uses both: Daniel (`d4-daniel`), then Tom (`d4-tom`).
There are no lab-only messages, so the Module lab has the same two.

`LESSON_MESSAGE_IDS = ['d4-daniel', 'd4-tom']`

**`MESSAGES_INTRO`** (the Module lab's introduction):
- en: "Today, you’re Sara, in room 714 at the Park Hotel. It’s Sunday morning. You’ll get two voice messages: from Daniel at the front desk and your friend Tom. Listen, then reply with a voice message. Make sure you answer their questions."
- fa: امروز جای سارا هستی، در اتاق ۷۱۴ هتل پارک. صبح یکشنبه است. دو پیام صوتی می‌گیری: از دنیل در پذیرش هتل و از دوستت تام. گوش بده و با یک پیام صوتی جواب بده. حواست باشد به سؤال‌هایشان جواب بدهی.

`NAMES` (both): "Daniel, Tom, Park Hotel, Main Street, Oak Street, Central Park, Riverton."

**Two messages, one voice.** Daniel and Tom are both Brian (`c`), as `world.md` gives them. This is
valid: the code only forbids Mira's voice (`from.voice` must not be `REPLY_VOICE`, `b`), and the
world's rule is about one scene; each voice message is its own scene, and Tom and Daniel are never in
one. Day 2 shipped the same pair in one lesson: `d2-tom` (`c`) and `d2-hotel` (Daniel, `c`), with
`LESSON_MESSAGE_IDS = ['d2-tom', 'd2-hotel']`. Day 3 used Tom (`c`) and the baggage desk (`a`). The
sender's name and `who` are shown on each message, and the two sound different in content (a desk
clerk's "Good morning, it's Daniel at the front desk" against a friend's "Hey, it's Tom!"). No fix is
needed. If the owner wants two voices anyway, the only free one is Andrew (`a`), who is Greg and the
baggage desk today; giving it to Daniel would break Daniel's voice across Days 2–4, so it's better
left as it is.

### Message 1. `id`: `d4-daniel` (Sunday, about 8:50: the backpack is here)

- `from`: name **Daniel** · who: the Park Hotel front desk / پذیرش هتل پارک · voice `c` (Brian)
- `sentences`:
  1. Good morning, it's Daniel at the front desk. Good news: your green backpack is here!
  2. The airline dropped it off a few minutes ago. I tried calling your room, but there was no answer.
  3. Would you like to come down and get it, or should I send it up to your room?
  4. Oh, and no rush with our charger. Just bring it back whenever it's convenient.
  5. Are you going out today? I'm happy to suggest a few places.
  6. Have a great Sunday!
- `asks`:
  1. ask: Will you come down and get it, or should he send it up? / خودت پایین می‌آیی و می‌گیری‌اش، یا آن را به اتاقت بفرستد؟ · missed: You didn't say if you'll come down or if he should send it up. / نگفتی خودت پایین می‌آیی یا آن را به اتاقت بفرستد.
  2. ask: Are you going out today? / امروز بیرون می‌روی؟ · missed: You didn't say if you're going out today. / نگفتی امروز بیرون می‌روی یا نه.
- `model`: "Good morning, Daniel, and thank you! I'll come down and get it in a few minutes, and I'll bring your charger back. I'm going to the Sunday market today. Could you tell me the way later?" (36 words)
- Facts: the airline's van brings the green backpack at about 8:50; Daniel calls room 714, as he promised on Day 3; Sara picks it up at the desk and gives back the hotel's charger; at about 10:30 she asks him the way to the Sunday market (world, steps 2–3). "Small green backpack" (Days 1–3). The hotel has Sara's number (Daniel sent her a voice message on Day 2, `d2-hotel`). New: nobody answers the room phone, so he leaves this message; "no rush with our charger"; his offer to suggest places (see New facts). The second ask leads to the 10:30 conversation, which the model reply sets up ("Could you tell me the way later?").

### Message 2. `id`: `d4-tom` (Sunday, about 10:35: just after Sara asked Daniel the way)

- `from`: name **Tom** · who: your friend in Riverton / دوستت در ریورتون · voice `c` (Brian; Daniel isn't in this message)
- `sentences`:
  1. Hey, it's Tom! Are we still on for noon at the market?
  2. Let's meet by the fountain. The market's all around it, so you can't miss it.
  3. My car's still at the mechanic, maybe until Monday, so I'm coming by bus.
  4. Do you know how to get there from your hotel?
  5. And what time are you leaving? If you're early, get a coffee and look around.
  6. See you soon!
- `asks`:
  1. ask: Do you know how to get to the market from your hotel? / می‌دانی از هتلت چطور به بازار بروی؟ · missed: You didn't say how you're getting to the market. / نگفتی چطور به بازار می‌روی.
  2. ask: What time are you leaving? / ساعت چند راه می‌افتی؟ · missed: You didn't say when you're leaving. / نگفتی کی راه می‌افتی.
- `model`: "Hi Tom! Yes, see you at noon by the fountain. Daniel told me the way: right out of the hotel, then left at the second light. I'm leaving now, so I'll be early!" (33 words)
- Facts: Tom meets Sara at the market, by the fountain, at noon; the market is around the fountain; his car is still at the mechanic (maybe Monday now); he comes by bus (world). The model gives Daniel's normal way exactly (right out of the hotel, left at the second light), which Sara believes at 10:35; she finds Oak Street closed at 10:45 (world, step 4), so the reply is true for what she knows. She leaves at about 10:38 (the bank corner is about 7 minutes away), so "I'm leaving now" and "I'll be early" match the world (she's at the side gate at about 11:00, early for noon). The coffee tip matches step 5 (she buys a coffee). His first ask needs directions in the reply, his second a time. Tom never mentions the Fun Run (he doesn't know about it; Greg knows only because his own bus is late).

---

## 5. Mira's module instructions

In the style of `DAY_TWO` and `DAY_THREE` in `src/lib/practice/day.ts`: `does` is one line for the
session list; `intro` is what Mira says (shown and read aloud). Titles and `short` stay as on Days
2–3. The "From Day N" items are named in the intros, since neither `Trap` nor `SayItem` has a field
for it.

### Intermediate

**Natural phrases** (`phrases`)
- `does`: Hear five sentences from Sara’s walk to the Sunday market, and say each one after Mira. / پنج جمله از مسیر سارا تا بازار یکشنبه بشنو و هر کدام را بعد از میرا تکرار کن.
- `intro`: Here are five sentences from Sara’s Sunday morning, as she asks the way to the market. Listen, then say each one after me. Notice the phrases in bold. / این پنج جمله از صبح یکشنبهٔ سارا است، وقتی راه بازار را می‌پرسد. گوش بده و هر جمله را بعد از من تکرار کن. به عبارت‌های پررنگ دقت کن.

**Persian-speaker traps** (`traps`)
- `does`: Find the mistake Persian speakers often make when they ask the way, then say the sentence right. / اشتباهی را که فارسی‌زبان‌ها موقع پرسیدن راه زیاد می‌کنند پیدا کن، بعد جمله را درست بگو.
- `intro`: Each sentence has one mistake that Persian speakers often make with directions. The last one is from Day 1: let’s see if you remember it. Tap the mistake, then say the sentence the right way. / هر جمله یک اشتباه دارد که فارسی‌زبان‌ها در آدرس پرسیدن زیاد می‌کنند. جملهٔ آخر از روز اول است؛ ببینیم یادت مانده یا نه. روی اشتباه بزن، بعد جمله را درست بگو.

**Say it in English** (`say-in-english`)
- `does`: Read what you want to ask the front desk in Persian, and say it in English. / چیزی را که می‌خواهی از پذیرش هتل بپرسی به فارسی می‌خوانی و به انگلیسی می‌گویی.
- `intro`: Now it’s your turn. You want to go to the City Museum today, so you ask the front desk the way. I’ll show you what you want to say, in Persian. Say it in English, the way you’d really say it. / حالا نوبت خودت است. امروز می‌خواهی به موزهٔ شهر بروی و راهش را از پذیرش هتل می‌پرسی. چیزی را که می‌خواهی بگویی به فارسی نشانت می‌دهم. همان را به انگلیسی بگو، همان‌طور که واقعاً می‌گفتی.

**Voice messages** (`voice-messages`)
- `does`: Hear two voice messages, from Daniel and from Tom, and reply to each one. / دو پیام صوتی بشنو، از دنیل و از تام، و به هر کدام جواب بده.
- `intro`: Today, you’re Sara, in room 714. It’s Sunday morning, and your phone is on the hotel Wi-Fi. Two voice messages come in. Listen, then reply with a short voice message of your own. Make sure you answer their questions. / امروز جای سارا هستی، در اتاق ۷۱۴. صبح یکشنبه است و گوشی‌ات به وای‌فای هتل وصل است. دو پیام صوتی برایت می‌آید. گوش بده و با یک پیام صوتی کوتاه جواب بده. حواست باشد به سؤال‌هایشان جواب بدهی.

### Professional

**Natural phrases** (`phrases`)
- `does`: Hear five natural phrases for asking the way, and say each one after Mira. / پنج عبارت طبیعی برای پرسیدن راه بشنو و هر کدام را بعد از میرا تکرار کن.
- `intro`: Here are five phrases from Sara’s Sunday morning, on her way to the market. You’ll need them later today, too. Listen, then say each one after me. / این پنج عبارت از صبح یکشنبهٔ سارا است، در راه بازار. امروز بعداً خودت هم به کارشان می‌بری. گوش بده و هر کدام را بعد از من تکرار کن.

**Say it in English** (`say-in-english`)
- `does`: Read three things Sara wants to say, in Persian, and say each one in English. / سه چیزی را که سارا می‌خواهد بگوید به فارسی می‌خوانی و هر کدام را به انگلیسی می‌گویی.
- `intro`: Today, you’re Sara again. The first one is from Day 3, at check-in: let’s see if you can still say it. Then two things she says this morning, on her way to the market. Say each one in English, the way you’d really say it. / امروز هم جای سارا هستی. اولی از روز سوم است، از پذیرش هتل؛ ببینیم هنوز می‌توانی بگویی‌اش یا نه. بعد دو چیزی که امروز صبح، در راه بازار، می‌گوید. هر کدام را به انگلیسی بگو، همان‌طور که واقعاً می‌گفتی.

---

## New facts for world.md

1. **Daniel's 8:50 call gets no answer.** He calls room 714 as promised, nobody answers, so he
   leaves Sara a voice message on her phone (the hotel has her number, Day 2): the backpack is at
   the desk; should she come down or should he send it up; no rush with the hotel's charger; is she
   going out today (he's happy to suggest places). Sara replies that she'll come down in a few
   minutes, bring the charger back, and is going to the Sunday market; she'll ask him the way later
   (which she does at 10:30, step 3).
2. **Tom's voice message at about 10:35,** just after Sara asks Daniel the way, while she's still in
   the hotel (on its Wi-Fi): "Are we still on for noon?" (the plan was made earlier; `world.md`
   doesn't say when); meet by the fountain; his car is at the mechanic, maybe until Monday; he's
   coming by bus; does she know the way, and what time is she leaving? Sara replies with Daniel's
   normal way and says she's leaving now. Tom doesn't know about the Fun Run.
3. **Sara leaves the hotel at about 10:38** (the bank corner is about 7 minutes away, and she's
   there at about 10:45, step 4).
4. **Sara tells Daniel she has no data and asks him to explain the way step by step** (Say it,
   Professional `d4-no-data`; consistent with her row and Daniel's in `world.md`).
5. **The learner (Karimi) asks the front desk the way to the City Museum** on their own day out
   (Intermediate Say it): asks how to get there and if it's far to walk, asks the clerk to say it
   again more slowly, says the two turns back, and asks about a bus back. No time of day is said.
6. **`d3-late-checkout` on Day 4 is a review, not an event:** Sara doesn't ask again on Sunday; the
   item is Saturday's question, practised again ("From Day 3").

---

## Checks

- **Regexes**, run in Node (`/tmp/claude-0/…/scratchpad/check.mjs`) with copies of both `normalise()`
  functions (say-better for `found`, traps for `accept`/`reject`, and a copy of `checkSaid`); 0
  failures:
  - each `found` matches its own sentence and **none of the other nine** sentences in either set
    (stricter than Day 3, which had one harmless cross-set match), so a Day 4 test in the style of
    Day 2's ("each check finds its own sentence only", both sets) passes;
  - each accepts the variants listed in its table ("How can I get to the market?", "Could I walk
    there?", "So I take a left at the second light?", "Can you say it again, please?", "I appreciate
    your help", "What's the easiest way to get there?", "Is it walking distance?", "if I got that
    right", "Could you slow it down a little?", "That's so kind of you");
  - each rejects its habit ("How can I go to the market?", "Can I go by walk?", "So I turn to left
    at the second light?", "Please repeat again.", "I'm very thankful from you.", "What is the best
    way for going to the market?", "Can I go there by walk?", "Did I understand correct?", "Can you
    speak more slow?", "That's very kind from you.", "It's kind of far").
  - Each trap: `right` gives "right", `words.join(' ')` (the sentence with the mistake) gives
    "wrong", and every extra form listed gives the result shown (right, also good, wrong or
    self-fixed): 6 traps, 37 sentences. `call-me` was re-run unchanged and still gives Day 1's
    results.
- **Shapes:** each `shown` minus `**` and with `‿` as a space equals its `sentence`; every bold part
  has two or more words; every Persian field has Persian letters; no `why.fa` has a backtick; every
  `wrong` index is inside `words` (and #2's is the one-entry phrase "in front of").
- **Counts:** phrases 5 + 5; traps 6 defined, 5 in the lesson (4 new + `call-me`); Say it 4
  (Intermediate) + 3 (Professional, one of them `d3-late-checkout`), each with 2 points, 2 models
  and 2 hints; voice messages 2, both in the lesson, each with 2 asks. The same as Day 3.
- **Limits:** A2 models 13–21 words (limit 25); B1 models 20–29 (limit 30); message sentences 13–97
  characters (limit 120); model replies 36 and 33 words (limit 40). Voices `c` and `c`, never `b`.
- **Ids:** new trap ids (`turn-left`, `across-from`, `minutes-away`, `cross-street`, `go-straight`)
  don't clash with the Module lab, Day 1, Day 2 or Day 3; new Say-it and message ids start with
  `d4-`. The two reused ids (`call-me`, `d3-late-checkout`) are kept on purpose.
- **Reused items checked against the code, character for character:** `call-me` against
  `src/lib/practice/days/day-1/phrases.ts` and `d3-late-checkout` against
  `src/lib/practice/days/day-3/phrases.ts` (including `kind`, `why`, regexes, `to`, `names`).
- **Each trap's `right` is natural US English:** "So I turn left at the bank?", "The museum is across
  from the park.", "The park is fifteen minutes away from the hotel.", "Can I cross the street
  here?", "Please call me when you find it.", "Go straight to the second light."
- **Directions match the map:** right out of the hotel; past the post office; left at the second
  light (the bank) onto Oak Street; two blocks; main gate on the right, across from the City Museum;
  about 15 minutes (phrases A2 #3, B1 #3; traps `turn-left`, `across-from`, `minutes-away`,
  `go-straight`; Say-it `d4-check-way`; Tom's model). The way around: straight to the third light,
  Pine Street; left; past the library; side gate on the right (Say-it `d4-way-around`). Nothing
  says the library is on the right or names a light number other than second (Oak) and third / next
  (Pine).
- **No contradictions found with Days 1–3:** the backpack is small and green and comes this morning
  (Days 1–3); the hotel's charger was lent on Day 3; Daniel promised to call room 714 (Day 3); the
  hotel has Sara's number (Day 2's `d2-hotel`); Tom's car is still not fixed (Days 2–3); Sara's
  check-out is Tuesday (Day 3); nothing names Karimi's room or dates. No real places or brands
  (no map app is named); no religion, politics or alcohol; the Fun Run is a charity race.
- **Persian half-spaces:** every «می‌» / «نمی‌» verb, «این‌جا», «به‌خاطر», «قدم‌به‌قدم»,
  «سؤال‌هایشان», «فارسی‌زبان‌ها», «گوشی‌ات», «فهمیده‌ای», «آروم‌تر», «یواش‌تر» and «همان‌طور» use U+200C;
  checked with a search for a space after «می» / «نمی».

---

## Notes for reviewers

### Choices to check

1. **The reused trap (`call-me`).** Chosen as the owner suggested, for this morning's story (Daniel
   calls room 714) and because it was in Day 1's lesson. The best alternative is Day 2's `near-of`
   (in Day 2's lesson, and about directions); `how-long` fits the theme best but was lab only on
   Day 2. Swapping is one id in `LESSON_TRAP_IDS` and one entry in `TRAPS`, and the Mira intro's
   "from Day 1" becomes "from Day 2".
2. **The reused Say-it item (`d3-late-checkout`).** The only Day 2–3 Professional item still true on
   Sunday; it is Saturday's question practised again, not a second request (Mira says "from Day 3,
   at check-in"). It isn't about directions; none of the Day 2–3 Professional items is, apart from
   `d2-ridenow-pickup`, which was lab only on Day 2 and has a ride Sara doesn't take today.
3. **`across-from` taps a three-word entry** ("in front of"). It's the first multi-word entry in any
   `words` list. Alternative if the UX reviewer prefers one word per button: split it and make
   `wrong` the index of "front", adding `alsoOk` for "in" and "of" (but `alsoOk` is meant for a
   different fix with its own sentence, so it would show the same sentence twice).
4. **A sixth, lab-only trap (`go-straight`)** keeps Day 3's shape (six defined, five in the lesson).
   If the owner wants exactly five, drop it; nothing else depends on it.
5. **Same voice for Daniel and Tom** (both `c`), back to back in the lesson: valid, and Day 2 did the
   same (see §4). If the UX reviewer finds them hard to tell apart, a short Mira line between them
   ("Now a message from your friend Tom") fixes it without a code change to voices.
6. **Intermediate Say it is about the City Museum,** not the market, so the learner's day stays
   their own (Sara has the market). Its directions are the normal way; the items never give a time,
   so Oak Street's closure never makes them false. Professional's Choose and persuade is also about
   the museum (on foot along the Riverwalk, or by bus); the two tracks never see each other's
   module, and nothing here contradicts it (no Riverwalk, no bus times).
7. **Tom's model reply gives the normal way,** which is closed when Sara gets there. That's on
   purpose (she learns it at 10:45), and the AI check only asks whether the reply answers "how" and
   "when". A learner who says "by Pine Street" is also answered.

### Code (not edited; for the builder)

- **Reuse by reference, not by copy:** in `days/day-4`, take `call-me` from Day 1's `TRAPS` and
  `d3-late-checkout` from Day 3's `SAY.professional` (for example `dayOne.TRAPS.find(t => t.id ===
  'call-me')!`), so the text and checks can't drift apart.
- **Unique-id tests:** `sayItemById('d3-late-checkout')` keeps returning the Day 3 object (it finds the
  first), which is the same object, so the server checks it the same way. But a test in the style
  of Day 2's "ids no other day uses", run over every day's items, would see `d3-late-checkout` twice;
  Day 4's test should de-duplicate by object or skip the reused item. Trap ids are never looked up
  across days, so `call-me` appearing in Day 1's and Day 4's `TRAPS` is harmless.
- **Day 4 needs** a `day-4` entry in `DAY_CONTENT` and `DAY_IDS`, a `DAY_FOUR` pack in `day.ts`,
  and its own tests (6 traps, 5 in the lesson; Say it 4 and 3, `LESSON_SAY_IDS` null; 2 messages,
  both in the lesson; `voiceMessagesFor('day-4', true)` returns the same two).
- **"From Day N"** has no field in `Trap` or `SayItem`; Mira's intro carries it. A small badge on the
  card would need a new optional field (for example `from?: string`) and a line in `Traps.svelte`
  and the Say-it component; the owner decides.

### Open questions

1. **Speech-to-text risk:** "Pine Street" may come out as "pine" or "Spine Street"; "Oak Street" as
   "oak"; no regex depends on names. "fifteen" may come out as "15"; `minutes-away` and its
   alsoGood accept both. As on Days 2–3, record each wrong trap sentence with a Persian accent before
   these ship ("turn to left" and "pass the street" may be quietly fixed by speech-to-text into
   "turn left" or "past the street"; the second would fail both checks, which is safe).
2. **The voice-messages AI tone rule** may need "To the hotel desk and a friend: friendly and
   simple" for Day 4.
3. **Day 1's `call-me` sentence** ("…when you find it") belongs to a lost bag. If reviewers find it
   confusing on a directions day, that's an argument for `near-of` (choice 1), since the owner wants
   the reused item word for word, not rewritten.
