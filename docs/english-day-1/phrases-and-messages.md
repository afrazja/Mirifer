# English Day 1: Natural phrases, Persian-speaker traps, Say it in English, Voice messages (rebuild, draft v1)

Status: **draft, for review and owner approval.** Every fact comes from `world.md` (and the built
conversation in `src/lib/practice/listen-connect.ts`); anything new is listed under "New facts for
world.md" at the end. US English. Each module is written in its built format: the field names below
are the ones in its `.ts` file, and the layout follows `docs/english-day-3/phrases-and-messages.md`
and `src/lib/practice/days/day-3/phrases.ts`. Day 1 is every learner's first lesson, so every set
here is the smallest the README allows.

| Module | Set | Track | Code | Spec |
|---|---|---|---|---|
| Natural phrases | A2 (new) | Intermediate (A2) | `src/lib/practice/phrases.ts` | `docs/english-shadowing-spec.md` |
| Natural phrases | B1 (built, kept) | Professional (B1+) | the same (`PHRASES` in `phrases.ts`) | the same |
| Persian-speaker traps | one set of 4 | Intermediate | `src/lib/practice/traps.ts` | `docs/english-traps-spec.md` |
| Say it in English | Intermediate (3 items, A2) | Intermediate | `src/lib/practice/say-in-english.ts` | `docs/english-say-in-english-spec.md` |
| Say it in English | Professional (3 items, B1) | Professional | the same | the same |
| Voice messages | one set of 2 (A2+) | Intermediate | `src/lib/practice/voice-messages.ts` | `docs/english-voice-messages-spec.md` |

**Daily lesson subsets.** Traps (Intermediate): 3 of 4 (without #4 `look-like`, which is the agent's
question, not something the learner says). Voice messages (Intermediate): both of the 2 (Tom and the
airport pharmacy). Say it in English: the whole set in both versions (3 and 3), so `LESSON_SAY_IDS`
is `null` for both.

**Who "you" are.**
- **Natural phrases (both sets) and Voice messages:** Sara's moment at the baggage desk and just
  after it. In the phrases you repeat her lines; in Voice messages, Mira's intro says "you're Sara".
- **Traps and Say it in English (both versions):** "you" are the learner, also just landed at
  Riverton Airport, with your own missing bag. When the learner gives a name, it's **Karimi**
  («کریمی»), as on Day 3. The learner is staying at the Park Hotel (Day 3's world says so).

**The day's goal** (describe your bag and check what happens next) is in A2 phrases #1–#3, all three
lesson traps, and all six Say-it items.

---

## 1. Natural phrases

Built format (`Phrase`): `sentence` (what Mira says), `shown` (`**bold**` = the chunk, `‿` = a link;
removing the marks gives `sentence`), `chunk`, `situation {en, fa}`, `tip {en, fa}` (English in
`backticks`), `found` (the word check, a regex run on the say-better `normalise()` output: lower
case, contractions spelled out, so "I'm" is "i am" and "didn't" is "did not"; "it's" and
"medicine's" stay as they are; a hyphen becomes a space, so "medium-sized" is "medium sized"). The
habit each chunk replaces is a content note, not a code field. Five sentences per set; the voice is
Mira's.

### 1a. A2 set (Intermediate): new

Sara at the baggage desk, in order: **only one bag came out → describe it → when do I get it → the
medicine → the charger.** The lines follow the built conversation (Sara's own words there are quoted
below the table), kept short.

| # | `situation` (en / fa) | `shown` (chunk in bold) | Habit it replaces | `tip` (en / fa) |
|---|---|---|---|---|
| 1 | Only one of your two bags came out on the belt. You go to the baggage desk. / از دو تا بارت فقط یکی روی نوار آمد. می‌روی سراغ بخش بار گمشده. | Hi, only **one‿of my bags** came out. | "One of my bag came." / "One bag of me didn't come." (in Persian the noun stays singular after a number: «دو تا چمدون») | `one of` runs together: the `n` moves to `of`, `WUH-nuv`. / `one of` را پیوسته بگو: `n` به `of` می‌چسبد، یعنی `WUH-nuv`. |
| 2 | The agent asks what the missing bag looks like. / کارمند می‌پرسد بارِ گمشده‌ات چه شکلی است. | The missing one is **a small green backpack**. | "a backpack small green" / "a green small backpack" (from «یه کوله‌پشتی کوچیک سبز»: in Persian the describing words come after the noun) | `backpack`: stress the first part, `BACK-pack`. / در `backpack` تأکید روی بخش اول است: `BACK-pack`. |
| 3 | The agent says your backpack went to Frankfurt by mistake. / کارمند می‌گوید کوله‌پشتی‌ات اشتباهی به فرانکفورت رفته. | Oh no. So when can I **get‿it back**? | "When it comes to me?" / "When I can take it?" (from «کِی به دستم می‌رسه؟» / «کِی می‌تونم بگیرمش؟»: statement order, and "take") | `get it`: the `t` turns soft and quick, like a `d`: `geh-dit-BACK`. / در `get it` صدای `t` نرم و سریع می‌شود، شبیه `d`: `geh-dit-BACK`. |
| 4 | Your medicine is in the backpack. / داروهایت توی کوله‌پشتی است. | My medicine's in there, and **I need‿it tonight**. | "I need to it tonight." / "It's necessary for me tonight." (from «امشب بهش احتیاج دارم» / «لازمش دارم») | `need it` runs together: `NEE-dit`. / `need it` را پیوسته بگو: `d` به `it` می‌چسبد، یعنی `NEE-dit`. |
| 5 | Your phone charger is in the backpack, too. / شارژر گوشی‌ات هم توی کوله‌پشتی است. | My charger's in there too. Should I **buy a new one**? | "Should I buy new?" / "Should I buy a new?" (from «یکی نو بخرم؟»: English needs `one` after "a new") | Stress `new`, and keep `a` and `one` light: `uh-NOO-wun`. / روی `new` تأکید کن و `a` و `one` را سبک بگو: `uh-NOO-wun`. |

Conversation lines they come from: #1 "only one of my bags came out"; #2 "It's a small green
backpack" (answering "What does the missing one look like?"); #3 "So when can I get it?"; #4 "my
medicine's in that backpack, and I need it tonight"; #5 "my phone charger's in there too. Should I
buy one of those too?" #5 uses "a new one" so the A2 chunk is the one Persian speakers drop.

`sentence` and `chunk` for each (the plain sentence is `shown` without the marks):

| # | `sentence` | `chunk` |
|---|---|---|
| 1 | Hi, only one of my bags came out. | one of my bags |
| 2 | The missing one is a small green backpack. | a small green backpack |
| 3 | Oh no. So when can I get it back? | get it back |
| 4 | My medicine's in there, and I need it tonight. | i need it tonight |
| 5 | My charger's in there too. Should I buy a new one? | buy a new one |

**Word check** (only the chunk, never the accent), with the `found` regex text (tested against
`normalise()`: each finds its own sentence, ignores the other four sentences of its set, accepts
the variants listed and rejects the habit):

| # | What it listens for | `found` |
|---|---|---|
| 1 | one of my / our / the bags (suitcases, backpacks) ("One of my suitcases is missing", "only one of our bags came out"); "one of my bag", "one of my baggage" and "my one bag" don't count | `/\bone of (?:my\|our\|the) (?:bags\|suitcases\|backpacks)\b/` |
| 2 | size, then color, then the bag ("a little green bag", "a big dark blue suitcase", "a medium-sized black suitcase"); "a green small backpack", "a backpack small and green" and "it is small and green" don't count | `/\b(?:small\|little\|big\|large\|medium\|medium size\|medium sized) (?:dark \|light )?(?:green\|gray\|grey\|black\|blue\|red\|brown\|white\|yellow\|orange\|pink\|purple\|silver) (?:backpack\|bag\|suitcase)\b/` |
| 3 | get / have it (them, my bag, the backpack, the suitcase) back ("When will I get it back?", "when do I get my bag back"); "when it comes to me", "when I can take it" and "when can I get it" (no "back") don't count | `/\b(?:get\|have) (?:it\|them\|my backpack\|the backpack\|my bag\|the bag\|my suitcase\|the suitcase) back\b/` |
| 4 | I / we (really, still, do) need it (them, that, my medicine) ("I really need it tonight", "I need my medicine tonight"); "I need to it" and "it's necessary for me" don't count | `/\b(?:i\|we) (?:really \|still \|do )?need (?:it\|them\|that\|my medicine\|the medicine)\b/` |
| 5 | buy / get a new one, another one, a new charger, another charger, one ("Should I buy another one?", "Do I need to get a new charger?", "Should I buy one?"); "buy new" and "buy a new" (no "one") don't count | `/\b(?:buy\|get) (?:a new one\|another one\|a new charger\|another charger\|one)\b/` |

**Where the A2 chunks come back:** #1 `one of my bags` is the fix in trap `my-bags` and in Say-it
`d1-missing-bag`; #3 `get it back` is in trap `by-tomorrow` and a hint in `d1-when`; #2's order
(size, then color) is in `d1-missing-bag` ("a big blue suitcase").

### 1b. B1 set (Professional): built, kept

The built `PHRASES` in `src/lib/practice/phrases.ts` stay as they are and become the Professional
set: "My bag **was supposed to** arrive with me…", "**It turned out** they'd put it on the wrong
flight.", "**To make things worse,** my phone was almost dead.", "So I **ended up buying** my
medicine at the airport.", "**In the end,** they brought it to my hotel the next morning." They are
Sara's moment at the desk told afterwards, as a story, which is why the new Professional intro (section
5) says "the way she tells it later". Nothing in them is changed here.

---

## 2. Persian-speaker traps (Intermediate)

Built format (`Trap`): `id`, `kind {en, fa}`, `words` (the sentence with the mistake, word by word),
`wrong` (index of the word to tap), optional `alsoOk` (`{index, sentence}`), `right`, `why {en, fa}`,
`accept` and `reject` (regex text, run on the traps `normalise()`: lower case, plain quotes, no
punctuation; contractions are **not** spelled out here), optional `alsoGood {patterns, word}`. Four
traps, none of the old Day 1 lab set (he/she, agree, say/tell, age, since/for, than, afraid of,
bored), Day 2's (been-waiting, to-not-until, near-of, how-long, bad-traffic, on-the-bus, get-out,
help-with) or Day 3's (under-name, on-the-floor, password-for, phone-dead, lend-me, im-staying); the
ids are new. `why.fa` has no backticks: English goes in «». "You" are the learner, at the baggage
desk with your own missing bag.

All four were run through a copy of the code's check (`checkSaid` with the traps `normalise()`):
`right` passes, the sentence with the mistake fails, and the extra forms listed get the result shown.

**Daily lesson:** the Intermediate lesson uses 3 of the 4, in the order of a baggage-desk visit
(what's missing → when → how to reach you): `my-bags`, `by-tomorrow`, `call-me`. Each one is a fix
the learner needs again a minute later in Say it (`d1-missing-bag`, `d1-when`, `d1-call-me`). Left
out: #4 `look-like` (the agent's question, not the learner's line); it stays as lab practice. All
four stay defined in `TRAPS`.

`LESSON_TRAP_IDS = ['my-bags', 'by-tomorrow', 'call-me']`

**1. `id`: `my-bags`** · `kind`: bags / luggage / bags / luggage (بار)
- `words`: `["One", "of", "my", "baggages", "is", "missing."]` · `wrong`: 3 (`baggages`)
- `right`: One of my bags is missing.
- `why` en: “Baggage” and “luggage” have no plural: “my luggage”. For one piece, say “one of my bags” or “one of my suitcases”.
- `why` fa: در فارسی می‌گوییم «بارهام» یا «چمدون‌هام» و برای همین «baggages» به ذهنمان می‌رسد. ولی «baggage» و «luggage» در انگلیسی جمع بسته نمی‌شوند. برای یکی از آن‌ها بگو «one of my bags» یا «one of my suitcases».
- `accept`: `/\bone of (?:my|our|the) (?:bags|suitcases)\b/`
- `reject`: `/\b(?:baggages|luggages)\b/`, `/\bone of (?:my|our|the) (?:baggage|luggage|bag|suitcase)\b/`
- `alsoGood`: patterns `/\b(?:my|our) (?:luggage|baggage) (?:is|isn't|didn't|hasn't)\b/`, `/\b(?:my|a) (?:bag|suitcase) is missing\b/` · word "bags"
- Also passes: "One of my suitcases is missing.", "One of my bags didn't come out." "My luggage is missing", "My luggage didn't come" and "My suitcase is missing" get "also good". ("One of my baggage is missing" and "One of my bag is missing" fail; "One of my baggages, sorry, one of my bags…" is self-fixed.)
- The goal of the day (describe your bag); phrase A2 #1.

**2. `id`: `by-tomorrow`** · `kind`: by (a time) / by (مهلت)
- `words`: `["Can", "I", "get", "it", "back", "until", "tomorrow?"]` · `wrong`: 5 (`until`)
- `right`: Can I get it back by tomorrow?
- `why` en: “By tomorrow” means “tomorrow or sooner”. “Until” is for something that goes on up to a time: “I’ll wait until five.”
- `why` fa: در فارسی می‌گوییم «تا فردا به دستم می‌رسه؟» و برای همین «until» به ذهنمان می‌رسد. ولی برای مهلت، یعنی «حداکثر تا فردا»، در انگلیسی «by» می‌گوییم: «by tomorrow». «until» برای کاری است که تا یک زمان ادامه دارد، مثل «I’ll wait until five».
- `accept`: `/\bby (?:tomorrow|tonight|the morning)\b/`
- `reject`: `/\b(?:until|till|til) (?:tomorrow|tonight)\b/`
- `alsoGood`: patterns `/\b(?:back|it) tomorrow\b/` · word "by"
- Also passes: "Will I get it back by tomorrow morning?", "Can I have it by tonight?" "Can I get it back tomorrow?" gets "also good". ("…till tomorrow?" fails; "…before tomorrow?" fails too, since it means today.)
- The goal of the day (check what happens next). It fits with Day 2's `to-not-until` («تا» for a place is "to"): Day 2's `why` says "until" is for time, and this one adds that a deadline is "by".

**3. `id`: `call-me`** · `kind`: call (no “to”) / call (بدون to)
- `words`: `["Please", "call", "to", "me", "when", "you", "find", "it."]` · `wrong`: 2 (`to`)
- `right`: Please call me when you find it.
- `why` en: You “call” someone, with no “to”: “call me”, “call the hotel”.
- `why` fa: در فارسی می‌گوییم «به من زنگ بزنید» و برای همین «call to me» به ذهنمان می‌رسد. ولی بعد از «call» حرف اضافه نمی‌آید: «call me»، «call the hotel».
- `accept`: `/\bcall me\b/`, `/\bgive me a call\b/`
- `reject`: `/\bcall (?:to|for) me\b/`
- `alsoGood`: patterns `/\b(?:text|email|contact|phone) me\b/`, `/\blet me know\b/` · word "call"
- Also passes: "Could you call me when you find it?", "Please give me a call when you find it." "Please let me know…" and "Please text me…" get "also good". ("Please call for me…" fails.)
- From this trip: the agent fills in a report with a phone number (world, "The paperwork").

**4. `id`: `look-like`** (lab only) · `kind`: What … look like? / What … look like? (چه شکلیه؟)
- `words`: `["How", "does", "your", "bag", "look", "like?"]` · `wrong`: 0 (`How`)
- `right`: What does your bag look like?
- `why` en: With “look like”, ask “What”: “What does it look like?”
- `why` fa: در فارسی می‌پرسیم «چه شکلیه؟» یا «چطوریه؟» و برای همین «How» به ذهنمان می‌رسد. ولی با «look like» در انگلیسی «What» می‌گوییم: «What does it look like?».
- `accept`: `/\bwhat (?:does|do|did) (?:\w+ ){1,3}look like\b/`
- `reject`: `/\bhow (?:\w+ ){1,4}looks? like\b/`
- `alsoGood`: patterns `/\bcan you describe\b/`, `/\bwhat colou?r is\b/` · word "What"
- Also passes: "What does it look like?", "What does the missing one look like?", "What does your suitcase look like?" "Can you describe your bag?" and "What color is your bag?" get "also good". ("How your bag looks like?" fails.)
- From this trip: the agent asks Sara "What does the missing one look like?" (the built conversation). No `alsoOk`: "How does your bag look?" is good English but asks something else (is it nice?).

**Candidates left out**
- "in the airport" for "at the airport": "I'm in the airport" is fine English (inside the building),
  so "in" isn't clearly wrong and the drill would teach a false rule.
- "My bag didn't come" for "came out": not a mistake; "didn't come" is fine. "Come out" is in phrase
  A2 #1's sentence and the Say-it models instead.
- "I need it until tonight" for "by tonight": "I need it until tonight" is grammatical with another
  meaning, so the trap is "Can I get it back until tomorrow?", where "until" is clearly wrong.
- "Can you explain me…": the traps spec lists it as a word-order item that needs a new mode.
- "a medicine" («یه دارو»): "medicine" can be countable ("two medicines"), so it isn't clearly
  wrong.

---

## 3. Say it in English

Built format (`SayItem`): `id`, `to {en, fa}`, `fa` (the message in spoken Persian), `points` (2,
each `{en, fa}`), `models` (2 natural versions; A2 25 words or fewer, B1 30 or fewer, the code's test
limits), `hints` (2, each `{en, fa}`), `level` (`'B1'` for the Professional set), `names` (one string
per set, to help speech-to-text). Ids start with `d1-` (unique across days; the analytics
`lesson_version` values that start `d1-` are a 16-hex hash, a different namespace). `fa`, points
and hints are plain text, so they hold no English except names.

"You" are the learner (Karimi), just landed at Riverton Airport, at the baggage desk with your own
missing bag: **a big blue suitcase with a yellow ribbon on the handle** (new fact 3). You're
staying at the Park Hotel.

All six `to`: **To the agent at the baggage desk / به کارمند بخش بار گمشده.**

### 3a. Intermediate set (A2): three items, all in the lesson

In the order of the visit: what's missing → when → how to reach you.

| # | `id` | `fa` | `points` (en / fa) | `models` | `hints` (en / fa) |
|---|---|---|---|---|---|
| 1 | `d1-missing-bag` | سلام، یکی از چمدون‌هام نیومد بیرون. یه چمدون بزرگ آبیه، با یه روبان زرد روش. | one of your bags didn't come out / یکی از چمدان‌هایت بیرون نیامد · it's a big blue suitcase with a yellow ribbon / یک چمدان بزرگ آبی است، با یک روبان زرد | "Hi, one of my bags didn't come out. It's a big blue suitcase with a yellow ribbon." · "Hi, one of my suitcases is missing. It's big and blue, with a yellow ribbon on it." | one of my bags / یکی از چمدون‌هام · a big blue suitcase / یه چمدون بزرگ آبی |
| 2 | `d1-when` | کِی به دستم می‌رسه؟ باید تا فردا صبح دستم باشه. | you're asking when you'll get it / می‌پرسی کِی به دستت می‌رسد · you need it by tomorrow morning / باید تا فردا صبح به دستت برسد | "When will I get it? I need it by tomorrow morning." · "When can I get it back? I need it by tomorrow morning." | get it back / به دستم برسه · by tomorrow morning / تا فردا صبح |
| 3 | `d1-call-me` | اسمم کریمیه و هتل پارک هستم. لطفاً هر وقت پیداش کردید به من زنگ بزنید. | your name is Karimi and you're staying at the Park Hotel / اسمت کریمی است و در هتل پارک اقامت داری · they should call you when they find it / وقتی پیدایش کردند به تو زنگ بزنند | "My name's Karimi, and I'm staying at the Park Hotel. Please call me when you find it." · "I'm Karimi, at the Park Hotel. Could you call me when you find it?" | I'm staying at… / … اقامت دارم · call me / به من زنگ بزنید |

- Traps on purpose: «چمدون‌هام» is "my bags", not "my baggages" (trap `my-bags`); «چمدون بزرگ آبی»
  is "a big blue suitcase", not "a suitcase big blue" (phrase A2 #2); «نیومد بیرون» is "didn't come
  out", not "didn't come outside"; «کِی به دستم می‌رسه؟» is "When will I get it?", not "When it
  comes to me?" (phrase A2 #3); «تا فردا صبح» is "by tomorrow morning", not "until" (trap
  `by-tomorrow`); «هتل پارک هستم» is "I'm staying at the Park Hotel", not "I'm Park Hotel"; «به من
  زنگ بزنید» is "call me", not "call to me" (trap `call-me`).
- `d1-when`'s Persian says «باید تا فردا صبح دستم باشه», not «تا فردا صبح لازمش دارم», because the
  second can also mean "I need it until tomorrow morning".
- Word counts: 17, 17 · 11, 12 · 17, 14 (all within 25).
- Facts: the learner has more than one bag, and the big blue suitcase didn't come out (new fact 3);
  staying at the Park Hotel (Day 3's world); the desk takes a phone number (world, "The
  paperwork"). Why they need it by tomorrow morning isn't said in A2 (the B1 item says: all their
  clothes are in it).
- `NAMES`: "Riverton Airport, Park Hotel, Karimi."

### 3b. Professional set (B1): three items, all in the lesson

The same visit with B1 moves: a result ("so it's easy to spot"), a condition and a request ("If
it's late, can I…"), a plan for when you're out and "keep me posted". Item 2 is the learner's own
version of what the agent tells Sara (buy what you need; the airline pays you back). `level`:
`'B1'`.

**1. `id`: `d1-suitcase`**
- `fa`: چمدون بزرگ آبی‌م نیومد بیرون. یه روبان زرد به دسته‌ش بستم که راحت پیدا بشه.
- `points`:
  1. your big blue suitcase didn't come out / چمدان بزرگ آبی‌ات بیرون نیامد
  2. it has a yellow ribbon on the handle, so it's easy to find / یک روبان زرد به دسته‌اش بسته‌ای که راحت پیدا شود
- `models`:
  - "My big blue suitcase didn't come out. I tied a yellow ribbon to the handle, so it's easy to spot." (20 words)
  - "My suitcase never came out. It's big and blue, with a yellow ribbon on the handle, so you can't miss it." (21 words)
- `hints`: so it's easy to spot / که راحت پیدا بشه · on the handle / به دسته‌ش
- Main trap: «بستم» → "I closed a ribbon" (natural: "tied"); «که راحت پیدا بشه» → "for finding it easy" / "that it finds easily" (natural: "so it's easy to spot", "so you can't miss it").

**2. `id`: `d1-clothes`**
- `fa`: همهٔ لباس‌هام توشه، پس حتماً تا فردا صبح لازمش دارم. اگه دیر برسه، می‌تونم چند تا چیز ضروری بخرم و پولش رو پس بگیرم؟
- `points`:
  1. all your clothes are in it, so you need it by tomorrow morning / همهٔ لباس‌هایت در آن است و تا فردا صبح حتماً لازمش داری
  2. if it's late, you're asking if you can buy a few things and get the money back / می‌پرسی اگر دیر برسد، می‌توانی چند چیز ضروری بخری و پولش را پس بگیری یا نه
- `models`:
  - "All my clothes are in there, so I really need it by tomorrow morning. If it's late, can I buy a few things and get the money back?" (28 words)
  - "All my clothes are in that suitcase. If it's not here by tomorrow morning, will you pay for the basics I buy?" (22 words)
- `hints`: by tomorrow morning / تا فردا صبح · get the money back / پولش رو پس بگیرم
- Main trap: «تا فردا صبح» → "until tomorrow morning" (trap `by-tomorrow`); «پولش رو پس بگیرم» → "take back my money" (natural: "get the money back", "pay me back"); «چیزهای ضروری» → "necessary things" (natural: "a few things", "the basics").
- Facts: the airline pays for what you need if you keep the receipt (world: what the agent tells Sara). The agent's answer isn't part of the item.

**3. `id`: `d1-delivery`**
- `fa`: می‌شه بیاریدش هتل پارک؟ اگه نبودم، تحویل پذیرش بدید. هر خبری شد، در جریانم بذارید.
- `points`:
  1. they should bring it to the Park Hotel, and leave it at the front desk if you're out / آن را به هتل پارک بیاورند و اگر نبودی، تحویل پذیرش بدهند
  2. they should keep you posted / هر خبری شد، در جریانت بگذارند
- `models`:
  - "Could you bring it to the Park Hotel? If I'm out, just leave it at the front desk. And please text me as soon as you hear anything." (28 words)
  - "Please send it to the Park Hotel. If I'm not there, the front desk can take it. Could you keep me posted?" (22 words)
- `hints`: if I'm out / اگه نبودم · keep me posted / در جریانم بذارید
- Main trap: «اگه نبودم» → "if I wasn't there" / "if I won't be there" (natural: "if I'm out": English uses the present after "if" for the future); «تحویل پذیرش بدید» → "deliver it to the reception" (natural: "leave it at the front desk"); «در جریانم بذارید» → "put me in the current" (natural: "keep me posted", "let me know").
- Facts: the airline delivers to hotels for free (world, Sara's backpack); the Park Hotel desk keeps deliveries for guests (Day 3's world).

- `NAMES`: "Riverton Airport, Park Hotel, Karimi."
- `LESSON_SAY_IDS`: `{ intermediate: null, professional: null }` (both sets are used whole).

---

## 4. Voice messages (Intermediate, A2+)

Built format (`VoiceMessage`): `id`, `from {name, who {en, fa}, voice}`, `sentences` (one audio
request each; 120 characters or fewer, the code's test limit; the longest here is 80), `asks` (each
`{ask {en, fa}, missed {en, fa}}`), `model` (a natural reply, 40 words or fewer), `names`. Two
messages, each with 2 asks. The natural reply is read by Mira (Ava, `b`). Voices: `c` Brian (Tom),
`a` Andrew (the pharmacy); never `b` (Mira) or `d` (Emma, who is Sara). Ids start with `d1-`.

Timeline: Saturday, about 1 p.m. Sara has just left the baggage desk; her taxi leaves at about 1:30
(Day 2). The learner is Sara (the intros say so). Neither message repeats Day 2's: Tom says nothing
about his car or picking her up (Day 2's `d2-tom`), and nobody confirms the 8–10 a.m. delivery (Day
2's `d2-baggage`) or the room (Day 2's `d2-hotel`).

**Daily lesson:** the Intermediate lesson uses both: Tom (`d1-tom`) and the airport pharmacy
(`d1-pharmacy`). There are no lab-only messages, so the Module lab has the same two.

`LESSON_MESSAGE_IDS = ['d1-tom', 'd1-pharmacy']`

**`MESSAGES_INTRO`** (the Module lab's introduction):
- en: "Today, you’re Sara, at Riverton Airport. You’ve just left the baggage desk. You’ll get two voice messages: from your friend Tom and the airport pharmacy. Listen, then reply with a voice message. Make sure you answer their questions."
- fa: امروز جای سارا هستی، در فرودگاه ریورتون. تازه از بخش بار گمشده بیرون آمده‌ای. دو پیام صوتی می‌گیری: از دوستت تام و از داروخانهٔ فرودگاه. گوش بده و با یک پیام صوتی جواب بده. حواست باشد به سؤال‌هایشان جواب بدهی.

`NAMES` (both): "Tom, Sara, Istanbul, Frankfurt, Riverton Airport."

### Message 1. `id`: `d1-tom` (Saturday, about 1 p.m.)

- `from`: name **Tom** · who: your friend in Riverton / دوستت در ریورتون · voice `c` (Brian; the agent, also Brian, isn't in this scene)
- `sentences`:
  1. Hey Sara, it's Tom! Did you land OK?
  2. Istanbul, then Frankfurt, then Riverton. That's a long trip! How was the flight?
  3. And did both your bags come out OK?
  4. Send me a message when you can. Talk soon!
- `asks`:
  1. ask: How was the flight? / پروازت چطور بود؟ · missed: You didn't say how the flight was. / نگفتی پروازت چطور بود.
  2. ask: Did both your bags come out? / هر دو بارت رسید؟ · missed: You didn't say if your bags came out. / نگفتی بارهایت رسید یا نه.
- `model`: "Hi Tom! Yes, I landed OK, but it was a long flight. Only my suitcase came out. My backpack went to Frankfurt, but they'll bring it to my hotel tomorrow." (30 words)
- Facts: Istanbul → Frankfurt → Riverton; a long flight; the big gray suitcase came out, the small green backpack went to Frankfurt and comes to her hotel tomorrow morning (world). The message itself is new (new fact 1).

### Message 2. `id`: `d1-pharmacy` (Saturday, about 1:10 p.m.)

- `from`: name **Airport pharmacy** · who: the pharmacy in the arrivals hall / داروخانهٔ سالن ورودی فرودگاه · voice `a` (Andrew)
- `sentences`:
  1. Hello, this is the pharmacy in the arrivals hall, at Riverton Airport.
  2. Your medicine is ready now. You can pick it up at the counter.
  3. When do you think you can come and get it?
  4. Oh, and you said the airline is paying you back. Do you need a receipt?
  5. Thanks, see you soon.
- `asks`:
  1. ask: When can you come and get your medicine? / کِی می‌توانی بیایی و داروهایت را بگیری؟ · missed: You didn't say when you can come. / نگفتی کِی می‌آیی.
  2. ask: Do you need a receipt? / رسید لازم داری؟ · missed: You didn't say if you need a receipt. / نگفتی رسید لازم داری یا نه.
- `model`: "Hi, thank you! I'm still at the airport, so I can come in about ten minutes. And yes, please, I need a receipt for the airline." (26 words)
- Facts: the pharmacy is in the arrivals hall, open until 10 p.m.; the airline pays her back as long as she keeps the receipt (world). That they needed a few minutes to get it ready and called her is new (new fact 2). The second ask is the conversation's key condition (keep the receipt), heard again from someone else.

---

## 5. Mira's module instructions

In the style of `DAY_TWO` in `src/lib/practice/day.ts`: `does` is one line for the session list;
`intro` is what Mira says (shown and read aloud). Titles and `short` stay as on Day 2. Listen and
connect, Tell your story, Role-play and the check-in aren't in this file.

### Intermediate

**Natural phrases** (`phrases`)
- `does`: Hear five sentences from Sara at the baggage desk, and say each one after Mira. / پنج جمله از حرف‌های سارا در بخش بار گمشده بشنو و هر کدام را بعد از میرا تکرار کن.
- `intro`: Here are five sentences from Sara at the baggage desk, in order. Listen, then say each one after me. I only check the phrase in bold, not your accent. / این پنج جمله از حرف‌های سارا در بخش بار گمشده است، به همان ترتیب. گوش بده و هر جمله را بعد از من تکرار کن. من فقط عبارت پررنگ را چک می‌کنم، نه لهجه‌ات را.

**Persian-speaker traps** (`traps`)
- `does`: Find the mistake Persian speakers often make at the airport, then say the sentence right. / اشتباهی را که فارسی‌زبان‌ها در فرودگاه زیاد می‌کنند پیدا کن، بعد جمله را درست بگو.
- `intro`: Here are three things you might say at the baggage desk. Each one has a mistake that Persian speakers often make. Tap the wrong word, then say the sentence the right way. / این سه جمله را ممکن است در بخش بار گمشده بگویی. هر کدام یک اشتباه دارد که فارسی‌زبان‌ها زیاد می‌کنند. روی کلمهٔ اشتباه بزن، بعد جمله را درست بگو.

**Say it in English** (`say-in-english`)
- `does`: Read what you want to tell the baggage desk in Persian, and say it in English. / چیزی را که می‌خواهی به بخش بار گمشده بگویی به فارسی می‌خوانی و به انگلیسی می‌گویی.
- `intro`: Now it’s your turn. You’ve just landed too, and one of your bags didn’t come out. Here, your name is Karimi. I’ll show you what you want to say, in Persian. Say it in English, the way you’d really say it at the desk. / حالا نوبت خودت است. تو هم تازه رسیده‌ای و یکی از چمدان‌هایت بیرون نیامده. این‌جا اسمت کریمی است. چیزی را که می‌خواهی بگویی به فارسی نشانت می‌دهم. همان را به انگلیسی بگو، همان‌طور که واقعاً در بخش بار گمشده می‌گفتی.

**Voice messages** (`voice-messages`)
- `does`: Hear two voice messages, from Tom and from the airport pharmacy, and reply to each one. / دو پیام صوتی بشنو، از تام و از داروخانهٔ فرودگاه، و به هر کدام جواب بده.
- `intro`: Now you’re Sara. You’ve just left the baggage desk, and two voice messages come in. Listen, then reply with a short voice message of your own. Make sure you answer their questions. / حالا جای سارا هستی. تازه از بخش بار گمشده بیرون آمده‌ای و دو پیام صوتی برایت رسیده. گوش بده و با یک پیام صوتی کوتاه جواب بده. حواست باشد به سؤال‌هایشان جواب بدهی.

### Professional

**Natural phrases** (`phrases`, the built B1 set)
- `does`: Hear five natural phrases from Sara’s story at the baggage desk, and say each one after Mira. / پنج عبارت طبیعی از ماجرای سارا در بخش بار گمشده بشنو و هر کدام را بعد از میرا تکرار کن.
- `intro`: These five sentences tell what happened to Sara at the baggage desk, the way she tells it later. Listen, then say each one after me. You’ll use these phrases in your own story today. / این پنج جمله ماجرای سارا در بخش بار گمشده را تعریف می‌کنند، همان‌طور که خودش بعداً تعریفش می‌کند. گوش بده و هر کدام را بعد از من تکرار کن. امروز در داستان خودت هم به کارشان می‌بری.

**Say it in English** (`say-in-english`)
- `does`: Read three things you want to tell the baggage desk, in Persian, and say each one in English. / سه چیزی را که می‌خواهی به بخش بار گمشده بگویی به فارسی می‌خوانی و هر کدام را به انگلیسی می‌گویی.
- `intro`: Now it’s your turn at the baggage desk. Here, your name is Karimi, and your suitcase didn’t come out. I’ll show you three things you want to say, in Persian. Say each one in English, the way you’d really say it. / حالا نوبت خودت است که به بخش بار گمشده بروی. این‌جا اسمت کریمی است و چمدانت بیرون نیامده. سه چیزی را که می‌خواهی بگویی به فارسی نشانت می‌دهم. هر کدام را به انگلیسی بگو، همان‌طور که واقعاً می‌گفتی.

---

## New facts for world.md

1. **Tom's message after the baggage desk (Saturday, about 1 p.m.):** he asks if she landed OK, how
   the flight was (Istanbul, then Frankfurt, then Riverton: a long trip) and whether both her bags
   came out. He says nothing about his car or picking her up (that's Day 2's message). Sara replies
   that only her suitcase came out and the backpack comes to her hotel tomorrow.
2. **The airport pharmacy:** Sara asked for her medicine; it took a few minutes to get it ready, so
   she left her number and the pharmacy left her a voice message (about 1:10 p.m.; voice Andrew, no
   name). It asks when she can come and whether she needs a receipt; she says she's coming in about
   ten minutes and needs a receipt for the airline.
3. **The learner's own lost bag** (Say it, both versions): Karimi has more than one bag; **a big
   blue suitcase with a yellow ribbon on the handle** didn't come out; all their clothes are in it,
   so they need it by tomorrow (Sunday) morning; they're staying at the Park Hotel; they ask the
   desk to call them, to deliver it to the hotel (the front desk if they're out), and whether they
   can buy a few things and get the money back. `world.md`'s learner row should add the suitcase.
4. **In Natural phrases (A2) the learner repeats Sara's lines** at the desk; in the Professional set
   (built) Sara tells the story afterwards.

---

## Notes for the editor

### (a) Checks done

- **Regexes**, run in Node with copies of both `normalise()` functions (say-better for `found`,
  traps for `accept`/`reject`) and of `checkSaid`; 0 failures:
  - each `found` matches its own sentence and none of the other four in its set;
  - each accepts the variants listed in its table ("One of my suitcases is missing", "a big dark
    blue suitcase", "a medium-sized black suitcase", "When will I get it back?", "I need my medicine
    tonight", "Do I need to get a new charger?");
  - each rejects its habit ("one of my bag came", "one of my baggage", "a green small backpack", "a
    backpack small and green", "When I can take it?", "when can I get it", "I need to it tonight",
    "Should I buy new?", "Should I buy a new?").
  - Each trap: `right` gives "right", the sentence with the mistake gives "wrong", and every extra
    form listed gives the result shown (right, also good, wrong or self-fixed), including "One of my
    baggage is missing" (wrong), "My luggage is missing" (also good), "Can I get it back tomorrow?"
    (also good), "…before tomorrow?" (wrong), "Please call for me…" (wrong), "Can you describe your
    bag?" (also good).
- **Shapes:** each `shown` minus `**` and with `‿` as a space equals its `sentence`; every bold part
  has two or more words; every Persian field has Persian letters; no `why.fa` has a backtick.
- **Limits:** A2 models 11–17 words (limit 25); B1 models 20–28 (limit 30); message sentences 80
  characters or fewer (limit 120); model replies 30 and 26 words (limit 40). Trap ids don't clash
  with the old Day 1 lab set, Day 2 or Day 3; Say-it and message ids start with `d1-` and are new.
- **Each trap's `right` is natural US English:** "One of my bags is missing.", "Can I get it back by
  tomorrow?", "Please call me when you find it.", "What does your bag look like?"
- **Against Days 1–3:** the backpack is small and green, went to Frankfurt (wrong flight number on
  the tag), comes on the evening flight and is delivered tomorrow morning; the suitcase is big and
  gray; the medicine is bought at the arrivals-hall pharmacy with a receipt; the charger is in the
  backpack. Nothing here says whether the information desk had a charger. Voices: Tom is Brian and
  never with the agent (Brian); the pharmacy is Andrew, a different scene from Andrew's baggage-desk
  calls on Days 2–3; no Emma or Ava. No real brands and no prices.
- **Light day:** 5 phrases, 3 lesson traps, 3 + 3 Say-it items, 2 messages, every sentence short;
  the A2 phrases intro adds one reassuring line for a first lesson ("I only check the phrase in
  bold, not your accent"), which is true of the check (`caught` only looks for the chunk).

### (b) Open questions

1. **The role-play (`conversation.md`, being written alongside):** both Say-it sets give Karimi a
   big blue suitcase with a yellow ribbon, need-by tomorrow morning, and the Park Hotel. The
   role-play should use the same bag, or the editor should align this file to it.
2. **Tom's timing:** Day 2's `d2-tom` (car broke down, can't pick her up) was sent before landing,
   so in the story Sara gets it first; Day 1's Tom message doesn't mention it on purpose, because
   Intermediate learners only hear it on Day 2. If that feels odd, Tom could add nothing more than
   "Sorry again about this morning", but that would hint at news they haven't heard.
3. **Professional B1 set ("my phone was almost dead"):** at the desk, about 12:45, her phone still
   works (she gets these messages at 1 p.m.); world says it's almost dead "by the afternoon". The
   B1 line is Sara's story told later, so it reads as true; left as built.
4. **Speech-to-text risk** (as on Days 2–3, record each wrong trap sentence with a Persian accent
   before these ship): the weak "to" in "call to me" may be dropped, so the mistake passes; "one of
   my baggages" may come out as "one of my baggage is" (still fails, by the second `reject`); "until"
   may come out as "till" (in `reject`). "Karimi" may come out wrong; no regex depends on it.
5. **The traps intro says "three things you might say"**, true for the lesson's three; the Module
   lab's fourth (`look-like`) is the agent's question. If the lab reuses Mira's lesson intro, say
   "Here are some sentences from the baggage desk" instead.
6. **Code outside the content arrays** (not edited): a `days/day-1/` content file (or branches in
   `day-content.ts`) with `PHRASES { intermediate: new A2 set, professional: PHRASES from
   phrases.ts }`, `TRAPS`, `LESSON_TRAP_IDS`, `SAY`, `LESSON_SAY_IDS`, `MESSAGES`,
   `LESSON_MESSAGE_IDS` and `MESSAGES_INTRO`; a `tracks` list in `DAY_ONE` in `day.ts` with the
   intros above; the old Day 1 lab arrays (`TRAPS` in `traps.ts`, `ITEMS` in `say-in-english.ts`,
   `MESSAGES` in `voice-messages.ts`) stay for learners who started Day 1 on the old list.
