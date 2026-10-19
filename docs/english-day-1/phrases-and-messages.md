# English Day 1: Natural phrases, Persian-speaker traps, Say it in English, Voice messages (rebuild, draft v2)

Status: **draft v2 (review v1 applied), for owner approval.** Every fact comes from `world.md`, the
built conversation in `src/lib/practice/listen-connect.ts` and the role-play card in
`conversation.md`; anything new is listed under "New facts for world.md" at the end. US English.
Each module is written in its built format: the field names below are the ones in its `.ts` file,
and the layout follows `docs/english-day-3/phrases-and-messages.md` and
`src/lib/practice/days/day-3/phrases.ts`. Day 1 is every learner's first lesson, so every set here
is the smallest the README allows.

| Module | Set | Track | Code | Spec |
|---|---|---|---|---|
| Natural phrases | A2 (new) | Intermediate (A2) | `src/lib/practice/phrases.ts` | `docs/english-shadowing-spec.md` |
| Natural phrases | B1 (built, kept) | Professional (B1+) | the same (`PHRASES` in `phrases.ts`) | the same |
| Persian-speaker traps | one set of 4 | Intermediate | `src/lib/practice/traps.ts` | `docs/english-traps-spec.md` |
| Say it in English | Intermediate (3 items, A2) | Intermediate | `src/lib/practice/say-in-english.ts` | `docs/english-say-in-english-spec.md` |
| Say it in English | Professional (3 items, B1) | Professional | the same | the same |
| Voice messages | one set of 2 (A2+) | Intermediate | `src/lib/practice/voice-messages.ts` | `docs/english-voice-messages-spec.md` |

**Daily lesson subsets.** Traps (Intermediate): 3 of 4 (without #4 `look-like`, which is the agent's
question, not something the learner says). Voice messages (Intermediate): both of the 2 (the
baggage desk, then your friend Ben). Say it in English: the whole set in both versions (3 and 3), so
`LESSON_SAY_IDS` is `null` for both.

**Who "you" are.** One identity per version after the opening conversation (lead's decision, review
v1).
- **Intermediate, from Natural phrases on (phrases, traps, Say it, Voice messages):** "you" are the
  learner, **Karimi** («کریمی»), as on Day 3, also just landed at Riverton Airport, with your own
  missing bag: **a big, dark blue suitcase, hard plastic, with four wheels and a yellow ribbon on the
  handle** (the role-play card in `conversation.md`). Your other bag came out. You're staying at the
  Park Hotel (Day 3's world). Your toothbrush is in the suitcase (the card's "Tonight you need").
  Sara is only in the opening conversation.
- **Professional:** the built B1 phrases are Sara's story told afterwards; Say it in English (and the
  role-play) are you, Karimi, with the same suitcase.

**The day's goal** (describe your bag and ask when you'll get it back) is in A2 phrases #1–#3, all
three lesson traps, all six Say-it items and both voice messages (each one asks for one half of it).

**Recycling (hear → say → use), Intermediate:** Sara says it in the conversation → you say it after
Mira in Natural phrases → you fix it in a trap → you say it yourself in Say it → you use it freely in
a voice reply. `one of my bags`: Sara's line → phrase 1 → trap `my-bags` → `d1-missing-bag` → Ben's
reply. `get it back`: Sara's "So when can I get it?" → phrase 3 → trap `by-tomorrow` →
`d1-when` → Ben's question and reply. The bag's description: Sara's "It's a small green backpack" →
phrase 2 → `d1-missing-bag` → the baggage desk's question and reply.

---

## 1. Natural phrases

Built format (`Phrase`): `sentence` (what Mira says), `shown` (`**bold**` = the chunk, `‿` = a link;
removing the marks gives `sentence`), `chunk` (shown to the learner, so "I" is a capital), `situation
{en, fa}`, `tip {en, fa}` (English in `backticks`), `found` (the word check, a regex run on the
say-better `normalise()` output: lower case, contractions spelled out, so "I'm" is "i am", "I'll" is
"i will" and "didn't" is "did not"; "it's" stays as it is; a hyphen or a comma becomes a space, so
"medium-sized" is "medium sized"). The habit each chunk replaces is a content note, not a code
field. Five sentences per set; the voice is Mira's.

### 1a. A2 set (Intermediate): new, you at the baggage desk

You (Karimi) at the baggage desk, in order: **only one bag came out → describe it → when do I get it
back → the toothbrush → buy a new one?** The lines have the shape of Sara's lines in the conversation
(quoted below the table), so the learner says, about their own bag, what they've just heard her say.

| # | `situation` (en / fa) | `shown` (chunk in bold) | Habit it replaces | `tip` (en / fa) |
|---|---|---|---|---|
| 1 | Only one of your two bags came out on the belt. You go to the baggage desk. / از دو تا بارت فقط یکی روی نوار آمد. به باجهٔ بار گمشده می‌روی. | Hi, only **one‿of my bags** came out. | "One of my bag came out." / "One bag of me didn't come." (the Persian is plural, «یکی از چمدون‌هام», but "one" pulls the English noun to the singular; «یه چمدونم» gives "one bag of me") | `one of` runs together: the `n` moves to `of`, `WUH-nuv`. / `one of` را پیوسته بگو: `n` به `of` می‌چسبد، یعنی `WUH-nuv`. |
| 2 | The agent asks what your missing bag looks like. / کارمند می‌پرسد بارِ گمشده‌ات چه شکلی است. | It's **a big dark blue suitcase**. | "a suitcase big dark blue" / "a dark blue big suitcase" (from «یه چمدون بزرگ سرمه‌ای»: in Persian the describing words come after the noun; in English they come before it, size first, then color) | Say it as one group, with the main stress on `SUIT`: `a big dark blue SUIT-case`. / همه را یک‌جا بگو و تأکید اصلی را روی `SUIT` بگذار: `a big dark blue SUIT-case`. |
| 3 | The agent says your suitcase wasn't on your flight. / کارمند می‌گوید چمدانت با پروازت نیامده. | Oh no. So when can I **get‿it back**? | "When it comes to me?" / "When I can take it?" (from «کِی به دستم می‌رسه؟» / «کِی می‌تونم بگیرمش؟»: statement order, and "take") | `get it`: the `t` turns soft and quick, like a `d`: `geh-dit-BACK`. / در `get it` صدای `t` نرم و سریع می‌شود، شبیه `d`: `geh-dit-BACK`. |
| 4 | Your toothbrush is in the suitcase. / مسواکت توی چمدان است. | My toothbrush is in there, and **I need‿it tonight**. | "I need to it tonight." / "It's necessary for me tonight." (from «امشب بهش احتیاج دارم» / «لازمش دارم») | `need it` runs together: `NEE-dit`. / `need it` را پیوسته بگو: `d` به `it` می‌چسبد، یعنی `NEE-dit`. |
| 5 | You can't wait until the suitcase comes. / نمی‌توانی تا رسیدن چمدان صبر کنی. | So should I **buy a new one**? | "Should I buy new?" / "Should I buy a new?" (from «یکی نو بخرم؟»: English needs `one` after "a new") | Stress `new`, and keep `a` and `one` light: `uh-NOO-wun`. / روی `new` تأکید کن و `a` و `one` را سبک بگو: `uh-NOO-wun`. |

Sara's lines in the conversation they echo: #1 "only one of my bags came out"; #2 "It's a small
green backpack" (answering "What does the missing one look like?"); #3 "So when can I get it?"; #4
"my medicine's in that backpack, and I need it tonight"; #5 "Should I buy one of those too?" #3 adds
"back" and #5 uses "a new one", the chunks Persian speakers drop.

`sentence` and `chunk` for each (the plain sentence is `shown` without the marks):

| # | `sentence` | `chunk` |
|---|---|---|
| 1 | Hi, only one of my bags came out. | one of my bags |
| 2 | It's a big dark blue suitcase. | a big dark blue suitcase |
| 3 | Oh no. So when can I get it back? | get it back |
| 4 | My toothbrush is in there, and I need it tonight. | I need it tonight |
| 5 | So should I buy a new one? | buy a new one |

**Word check** (only the chunk, never the accent), with the `found` regex text (tested against
`normalise()`: each finds its own sentence, ignores the other four sentences of its set, accepts
the variants listed and rejects the habit):

| # | What it listens for | `found` |
|---|---|---|
| 1 | one of my / our / the (two, three) bags (suitcases, backpacks) ("One of my suitcases is missing", "only one of our two bags came out"); "one of my bag", "one of my baggage" and "my one bag" don't count | `/\bone of (?:my\|our\|the) (?:two \|three )?(?:bags\|suitcases\|backpacks)\b/` |
| 2 | size, then (dark, light, navy) color, then (hard, soft, plastic) the bag or "one" ("a big blue suitcase", "a big, dark blue suitcase", "a large navy blue suitcase", "a big dark blue hard suitcase", "a big dark blue one", "a medium-sized black bag"); "a dark blue big suitcase", "a suitcase big dark blue", "it is big and dark blue" and "a big suitcase" don't count | `/\b(?:small\|little\|big\|large\|medium\|medium size\|medium sized) (?:dark \|light \|navy )?(?:green\|gray\|grey\|black\|blue\|navy\|red\|brown\|white\|yellow\|orange\|pink\|purple\|silver) (?:hard \|soft \|plastic \|hard plastic )?(?:backpack\|bag\|suitcase\|one)\b/` |
| 3 | get / have it (them, my bag, the suitcase…) back ("When will I get it back?", "when do I get my suitcase back"); "when it comes to me", "when I can take it" and "when can I get it" (no "back") don't count | `/\b(?:get\|have) (?:it\|them\|my suitcase\|the suitcase\|my bag\|the bag\|my backpack\|the backpack) back\b/` |
| 4 | I / we (will, really, still, do) need it (them, that, my toothbrush) ("I really need it tonight", "I'll need it tonight", "I need my toothbrush tonight"); "I need to it" and "it's necessary for me" don't count | `/\b(?:i\|we) (?:will )?(?:really \|still \|do )?need (?:it\|them\|that\|my toothbrush\|the toothbrush)\b/` |
| 5 | buy / get a new one, another one, a new toothbrush, another toothbrush, one ("Should I buy another one?", "Do I need to get a new toothbrush?", "Should I buy one?"); "buy new" and "buy a new" (no "one") don't count | `/\b(?:buy\|get) (?:a new one\|another one\|a new toothbrush\|another toothbrush\|one)\b/` |

**Where the A2 chunks come back** (see "Recycling" above): #1 `one of my bags` in trap `my-bags`,
`d1-missing-bag` and Ben's reply; #2's order (size, then color) in `d1-missing-bag` ("a big dark blue
suitcase") and the desk's reply; #3 `get it back` in trap `by-tomorrow`, `d1-when` and Ben's
message; #4 `I need it` in `d1-when` ("I need it by tomorrow morning").

### 1b. B1 set (Professional): built, kept

The built `PHRASES` in `src/lib/practice/phrases.ts` stay as they are and become the Professional
set: "My bag **was supposed to** arrive with me…", "**It turned out** they'd put it on the wrong
flight.", "**To make things worse,** my phone was almost dead.", "So I **ended up buying** my
medicine at the airport.", "**In the end,** they brought it to my hotel the next morning." They are
Sara's moment at the desk told afterwards, as a story, which is why the Professional intro (section
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
- `why` fa: در فارسی می‌گوییم «بارهام» یا «چمدون‌هام» و برای همین «baggages» به ذهنمان می‌رسد. ولی «baggage» و «luggage» در انگلیسی جمع بسته نمی‌شوند. برای یکی از بارهایت بگو «one of my bags» یا «one of my suitcases».
- `accept`: `/\bone of (?:my|our|the) (?:two |three )?(?:bags|suitcases)\b/`
- `reject`: `/\b(?:baggages|luggages)\b/`, `/\bone of (?:my|our|the) (?:baggage|luggage|bag|suitcase)\b/`
- `alsoGood`: patterns `/\b(?:my|our) (?:luggage|baggage) (?:is|isn't|didn't|hasn't)\b/`, `/\b(?:my|a) (?:bag|suitcase) is missing\b/` · word "bags"
- Also passes: "One of my suitcases is missing.", "One of my bags didn't come out.", "One of my two bags is missing." "My luggage is missing", "My luggage didn't come" and "My suitcase is missing" get "also good". ("One of my baggage is missing" and "One of my bag is missing" fail; "One of my baggages, sorry, one of my bags…" is self-fixed.)
- The goal of the day (describe your bag); phrase A2 #1.

**2. `id`: `by-tomorrow`** · `kind`: by (a time) / by (مهلت)
- `words`: `["Can", "I", "get", "it", "back", "until", "tomorrow?"]` · `wrong`: 5 (`until`)
- `right`: Can I get it back by tomorrow?
- `why` en: “By tomorrow” means “tomorrow or sooner”. “Until” is for something that goes on up to a time: “I’ll wait until five.”
- `why` fa: در فارسی می‌گوییم «تا فردا به دستم می‌رسه؟» و برای همین «until» به ذهنمان می‌رسد. ولی برای مهلت، یعنی «حداکثر تا فردا»، در انگلیسی «by» می‌گوییم: «by tomorrow». «until» برای کاری است که تا یک زمان ادامه دارد، مثل «I’ll wait until five».
- `accept`: `/\bby (?:tomorrow|tonight|the morning|sunday)\b/`
- `reject`: `/\b(?:until|till|til) (?:tomorrow|tonight|sunday)\b/`
- `alsoGood`: patterns `/\b(?:back|it) (?:on )?(?:tomorrow|sunday)\b/` · word "by"
- Also passes: "Will I get it back by tomorrow morning?", "Can I have it by tonight?", "Can I get it back by Sunday morning?" "Can I get it back tomorrow?" and "Can I get it back on Sunday?" get "also good". ("…till tomorrow?" and "…until Sunday?" fail; "…before tomorrow?" fails too, since it means today.)
- The goal of the day (ask when you'll get it back). It fits with Day 2's `to-not-until` («تا» for a place is "to"): Day 2's `why` says "until" is for time, and this one adds that a deadline is "by".

**3. `id`: `call-me`** · `kind`: call (no “to”) / call (بدون to)
- `words`: `["Please", "call", "to", "me", "when", "you", "find", "it."]` · `wrong`: 2 (`to`)
- `right`: Please call me when you find it.
- `why` en: You “call” someone, with no “to”: “call me”, “call the hotel”.
- `why` fa: در فارسی می‌گوییم «به من زنگ بزنید» و برای همین «call to me» به ذهنمان می‌رسد. ولی بعد از «call» حرف اضافه نمی‌آید: «call me»، «call the hotel».
- `accept`: `/\bcall me\b/`, `/\bgive me a call\b/`
- `reject`: `/\bcall (?:to|for) me\b/`
- `alsoGood`: patterns `/\b(?:text|email|contact|phone) me\b/`, `/\blet me know\b/` · word "call"
- Also passes: "Could you call me when you find it?", "Please give me a call when you find it." "Please let me know…" and "Please text me…" get "also good". ("Please call for me…" fails.)
- From this trip: the agent fills in a report with a phone number (world, "The paperwork"); the desk's voice message asks how to reach you, and the model reply says "Please call me".

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
and hints are plain text, so they hold no English except names. In Mira's text (points, hints) the
hotel is written «Park Hotel», in Latin letters; only the spoken prompt (`fa`) says «هتل پارک».

"You" are the learner (Karimi), just landed at Riverton Airport, at the baggage desk with your own
missing bag: **a big, dark blue suitcase, hard plastic, with four wheels and a yellow ribbon on the
handle** (the role-play card in `conversation.md`; new fact 4). You're staying at the Park Hotel.

All six `to`: **To the agent at the baggage desk / به کارمند باجهٔ بار گمشده.**

### 3a. Intermediate set (A2): three items, all in the lesson

In the order of the visit: what's missing → when → how to reach you.

| # | `id` | `fa` | `points` (en / fa) | `models` | `hints` (en / fa) |
|---|---|---|---|---|---|
| 1 | `d1-missing-bag` | سلام، یکی از چمدون‌هام نیومد بیرون. یه چمدون بزرگ سرمه‌ایه، با یه روبان زرد روی دسته‌ش. | one of your bags didn't come out / یکی از چمدان‌هایت بیرون نیامد · it's a big dark blue suitcase with a yellow ribbon on the handle / یک چمدان بزرگ سرمه‌ای است، با یک روبان زرد روی دسته‌اش | "Hi, one of my bags didn't come out. It's a big dark blue suitcase with a yellow ribbon on the handle." · "Hi, one of my suitcases is missing. It's big and dark blue, with a yellow ribbon on the handle." | one of my bags / یکی از چمدون‌هام · a big dark blue suitcase / یه چمدون بزرگ سرمه‌ای |
| 2 | `d1-when` | کِی به دستم می‌رسه؟ باید تا فردا صبح دستم باشه. | you're asking when you'll get it / می‌پرسی کِی به دستت می‌رسد · you need it by tomorrow morning / باید تا فردا صبح به دستت برسد | "When will I get it? I need it by tomorrow morning." · "When can I get it back? I need it by tomorrow morning." | get it back / به دستم برسه · by tomorrow morning / تا فردا صبح |
| 3 | `d1-call-me` | اسمم کریمیه و توی هتل پارک هستم. لطفاً هر وقت پیداش کردید به من زنگ بزنید. | your name is Karimi and you're staying at the Park Hotel / اسمت کریمی است و در Park Hotel اقامت داری · they should call you when they find it / وقتی پیدایش کردند به تو زنگ بزنند | "My name's Karimi, and I'm staying at the Park Hotel. Please call me when you find it." · "I'm Karimi, at the Park Hotel. Could you call me when you find it?" | I'm staying at… / توی … هستم · call me / به من زنگ بزنید |

- Traps on purpose: «چمدون‌هام» is "my bags", not "my baggages" (trap `my-bags`); «چمدون بزرگ
  سرمه‌ای» is "a big dark blue suitcase", not "a suitcase big dark blue" (phrase A2 #2); «نیومد
  بیرون» is "didn't come out", not "didn't come outside"; «روی دسته‌ش» is "on the handle"; «کِی به
  دستم می‌رسه؟» is "When will I get it?", not "When it comes to me?" (phrase A2 #3); «تا فردا صبح»
  is "by tomorrow morning", not "until" (trap `by-tomorrow`); «توی هتل پارک هستم» is "I'm staying
  at the Park Hotel", not "I'm in Park Hotel"; «به من زنگ بزنید» is "call me", not "call to me"
  (trap `call-me`).
- `d1-when`'s Persian says «باید تا فردا صبح دستم باشه», not «تا فردا صبح لازمش دارم», because the
  second can also mean "I need it until tomorrow morning".
- Word counts: 21, 19 · 11, 12 · 17, 14 (all within 25).
- Facts: the learner has two bags and the big dark blue suitcase didn't come out (new fact 4);
  staying at the Park Hotel (Day 3's world); the desk takes a phone number (world, "The
  paperwork"). Why they need it by tomorrow morning isn't said in A2 (the B1 item says: all their
  clothes are in it). At the desk the bag isn't found yet ("call me when you find it"); the desk's
  voice message brings the news.
- `NAMES`: "Riverton Airport, Park Hotel, Karimi."

### 3b. Professional set (B1): three items, all in the lesson

The same visit with B1 moves: a result ("so it's easy to spot"), a condition and a request ("If
it's late, can I…"), asking what happens next, and a plan for when you're out. Item 2 is the
learner's own version of what the agent tells Sara (buy what you need; the airline pays you back).
`level`: `'B1'`.

**1. `id`: `d1-suitcase`**
- `fa`: چمدون بزرگ سرمه‌ای‌م نیومد بیرون. یه روبان زرد به دسته‌ش بستم که راحت پیدا بشه.
- `points`:
  1. your big dark blue suitcase didn't come out / چمدان بزرگ سرمه‌ای‌ات بیرون نیامد
  2. it has a yellow ribbon on the handle, so it's easy to find / یک روبان زرد به دسته‌اش بسته‌ای که راحت پیدا شود
- `models`:
  - "My big dark blue suitcase didn't come out. I tied a yellow ribbon to the handle, so it's easy to spot." (21 words)
  - "My suitcase never came out. It's big and dark blue, with a yellow ribbon on the handle, so you can't miss it." (22 words)
- `hints`: so it's easy to spot / که راحت پیدا بشه · on the handle / به دسته‌ش
- Main trap: «بستم» → "I closed a ribbon" (natural: "tied"); «که راحت پیدا بشه» → "for finding it easy" / "that it finds easily" (natural: "so it's easy to spot", "so you can't miss it").

**2. `id`: `d1-clothes`**
- `fa`: همهٔ لباس‌هام توشه، پس حتماً باید تا فردا صبح دستم باشه. اگه دیر برسه، می‌تونم چند تا چیز ضروری بخرم و پولش رو پس بگیرم؟
- `points`:
  1. all your clothes are in it, so you need it by tomorrow morning / همهٔ لباس‌هایت در آن است و حتماً باید تا فردا صبح به دستت برسد
  2. if it's late, you're asking if you can buy a few things and get the money back / می‌پرسی اگر دیر برسد، می‌توانی چند چیز ضروری بخری و پولش را پس بگیری یا نه
- `models`:
  - "All my clothes are in there, so I really need it by tomorrow morning. If it's late, can I buy a few things and get the money back?" (28 words)
  - "All my clothes are in that suitcase. If it's not here by tomorrow morning, will you pay for the basics I buy?" (22 words)
- `hints`: by tomorrow morning / تا فردا صبح · get the money back / پولش رو پس بگیرم
- Main trap: «تا فردا صبح» → "until tomorrow morning" (trap `by-tomorrow`); «پولش رو پس بگیرم» → "take back my money" (natural: "get the money back", "pay me back"); «چند تا چیز ضروری» → "some necessary things" (natural: "a few things", "the basics").
- Facts: the airline pays for what you need if you keep the receipt (world: what the agent tells Sara). The agent's answer isn't part of the item.

**3. `id`: `d1-delivery`**
- `fa`: خب، حالا چی می‌شه؟ وقتی پیداش کردید، می‌شه بیاریدش هتل پارک؟ اگه نبودم، تحویل پذیرش بدید.
- `points`:
  1. you're asking what happens next / می‌پرسی حالا چه می‌شود و قدم بعدی چیست
  2. when they find it, they should bring it to the Park Hotel, and leave it at the front desk if you're out / وقتی پیدایش کردند، آن را به Park Hotel بیاورند و اگر نبودی، تحویل پذیرش بدهند
- `models`:
  - "So what happens next? When you find it, could you bring it to the Park Hotel? If I'm out, just leave it at the front desk." (26 words)
  - "What's the next step? Once you find it, please send it to the Park Hotel. If I'm not there, the front desk can take it." (25 words)
- `hints`: what happens next / حالا چی می‌شه · if I'm out / اگه نبودم
- Main trap: «حالا چی می‌شه؟» → "What will be now?" / "What becomes now?" (natural: "What happens next?", "What's the next step?"); «اگه نبودم» → "if I wasn't there" / "if I won't be there" (natural: "if I'm out": English uses the present after "if" for the future); «تحویل پذیرش بدید» → "deliver it to the reception" (natural: "leave it at the front desk").
- The day's goal in Professional (ux review 6): this item makes the learner ask what happens next before the role-play, where Ryan's news answers it.
- Facts: the airline delivers to hotels for free (world, Sara's backpack; the role-play's two ways); the Park Hotel desk keeps deliveries for guests (Day 3's world), and the role-play's driver leaves the bag at the front desk if the passenger is out.

- `NAMES`: "Riverton Airport, Park Hotel, Karimi."
- `LESSON_SAY_IDS`: `{ intermediate: null, professional: null }` (both sets are used whole).

---

## 4. Voice messages (Intermediate, A2+)

Built format (`VoiceMessage`): `id`, `from {name, who {en, fa}, voice}`, `sentences` (one audio
request each; 120 characters or fewer, the code's test limit), `asks` (each `{ask {en, fa}, missed
{en, fa}}`), `model` (a natural reply, 40 words or fewer), `names`. Two messages, each with 2 asks.
The natural reply is read by Mira (Ava, `b`). Voices: `a` Andrew (the baggage desk on the phone, as
on Days 2–3), `c` Brian (Ben); never `b` (Mira) or `d` (Emma, who is Sara). Brian is also Marcus and
Ryan, the agents at the desk, who aren't in these messages. Ids start with `d1-`.

"You" are the learner, Karimi, not Sara (lead's decision, review v1). Timeline: Saturday, late
afternoon. You've just left the baggage desk; your big dark blue suitcase wasn't found yet, and you
asked them to call you. The desk calls first (about 5 p.m.) with the news; then your friend Ben
(about 5:15). The order matters: the desk's news (it comes tomorrow) is what you need to answer
Ben's "When do you get it back?", so the first message is heard and then used in the second reply.
The news fits the role-play's first run (it comes tomorrow; the airline brings it to your hotel; the
driver calls first).

**Daily lesson:** the Intermediate lesson uses both: the baggage desk (`d1-desk`), then Ben
(`d1-ben`). There are no lab-only messages, so the Module lab has the same two.

`LESSON_MESSAGE_IDS = ['d1-desk', 'd1-ben']`

**`MESSAGES_INTRO`** (the Module lab's introduction):
- en: "Today, you’re Karimi, at Riverton Airport. One of your bags didn’t come out, and you’ve just left the baggage desk. You’ll get two voice messages: from the baggage desk and your friend Ben. Listen, then reply with a voice message. Make sure you answer their questions."
- fa: امروز اسمت کریمی است و در فرودگاه Riverton هستی. یکی از بارهایت بیرون نیامده و همین حالا از باجهٔ بار گمشده می‌آیی. دو پیام صوتی می‌گیری: از باجهٔ بار گمشده و از دوستت بن. گوش بده و با یک پیام صوتی جواب بده. حواست باشد به سؤال‌هایشان جواب بدهی.

`NAMES` (both): "Ben, Karimi, Riverton Airport, Park Hotel."

### Message 1. `id`: `d1-desk` (Saturday, about 5 p.m.)

- `from`: name **Baggage desk** · who: the baggage desk at Riverton Airport / باجهٔ بار گمشدهٔ فرودگاه Riverton · voice `a` (Andrew)
- `sentences`:
  1. Hello, this is the baggage desk at Riverton Airport.
  2. Good news: I think we found your suitcase.
  3. Can you tell me one more thing about it, so we know it's yours?
  4. If it's yours, it comes tomorrow, and our driver can bring it to your hotel.
  5. How can the driver reach you before the delivery?
  6. Thanks, and sorry again about your bag.
- `asks`:
  1. ask: Can you tell them one more thing about your suitcase? / یک چیز دیگر دربارهٔ چمدانت می‌گویی؟ · missed: You didn't tell them anything more about your suitcase. / چیز دیگری دربارهٔ چمدانت نگفتی.
  2. ask: How can the driver reach you? / راننده چطور با تو تماس بگیرد؟ · missed: You didn't say how the driver can reach you. / نگفتی راننده چطور با تو تماس بگیرد.
- `model`: "Hi, thank you so much! Yes, it has a yellow ribbon on the handle. Please call me at this number before the delivery." (23 words)
- Facts: the suitcase (the role-play card: the ribbon, four wheels, hard plastic; any one of them, or the size and color, answers the first ask); it comes tomorrow and the airline brings it to the hotel, the driver calling first (the role-play's first run). The call itself is new (new fact 2). The first ask is the day's goal (describe your bag) again, to a new listener; the model reply uses `call me` (trap `call-me`).

### Message 2. `id`: `d1-ben` (Saturday, about 5:15 p.m.)

- `from`: name **Ben** · who: your friend / دوستت · voice `c` (Brian)
- `sentences`:
  1. Hey, it's Ben! Did you land OK?
  2. So, did both your bags come out?
  3. If one is missing, when do you get it back?
  4. Send me a message when you're at your hotel. Talk soon!
- `asks`:
  1. ask: Did both your bags come out? / هر دو بارَت سالم رسید؟ · missed: You didn't say if your bags came out. / نگفتی بارهایت رسید یا نه.
  2. ask: When do you get it back? / کِی پسش می‌گیری؟ · missed: You didn't say when you get it back. / نگفتی کِی پسش می‌گیری.
- `model`: "Hi Ben! Yes, I landed OK, but only one of my bags came out. They found my suitcase, and I get it back tomorrow. They're bringing it to my hotel." (30 words)
- Facts: two bags, the suitcase missing (new fact 4); it comes tomorrow, to the hotel (the desk's message). Ben is the learner's friend, not Tom (Sara's friend); he says nothing about where the learner flew from. The message is new (new fact 3). The second ask is the day's goal (ask when you'll get it back), turned round: now you're the one who answers it.

---

## 5. Mira's module instructions

In the style of `DAY_TWO` in `src/lib/practice/day.ts`: `does` is one line for the session list;
`intro` is what Mira says (shown and read aloud). Titles and `short` stay as on Day 2. Listen and
connect, Tell your story, Role-play and the check-in aren't in this file. Place names in Mira's
Persian lines are in Latin letters («فرودگاه Riverton»).

### Intermediate

**Natural phrases** (`phrases`)
- `does`: Hear five sentences you can say at the baggage desk, and say each one after Mira. / پنج جمله بشنو که می‌توانی جلوی باجهٔ بار گمشده بگویی، و هر کدام را بعد از میرا تکرار کن.
- `intro`: Now it’s your turn at the baggage desk. Here, your name is Karimi, and one of your bags didn’t come out. Listen, then say each sentence after me. I only check the phrase in bold, not your accent. / حالا نوبت خودت است که به باجهٔ بار گمشده بروی. این‌جا اسمت کریمی است و یکی از بارهایت بیرون نیامده. گوش بده و هر جمله را بعد از من تکرار کن. من فقط عبارت پررنگ را چک می‌کنم، نه لهجه‌ات را.

**Persian-speaker traps** (`traps`)
- `does`: Find the mistake Persian speakers often make at the airport, then say the sentence right. / اشتباهی را که فارسی‌زبان‌ها در فرودگاه زیاد می‌کنند پیدا کن، بعد جمله را درست بگو.
- `intro`: Here are three things you might say at the baggage desk. Each one has a mistake that Persian speakers often make. Tap the wrong word, then say the sentence the right way. / این سه جمله را ممکن است جلوی باجهٔ بار گمشده بگویی. هر کدام یک اشتباه دارد که فارسی‌زبان‌ها زیاد می‌کنند. روی کلمهٔ اشتباه بزن، بعد جمله را درست بگو.

**Say it in English** (`say-in-english`)
- `does`: Read what you want to tell the baggage desk in Persian, and say it in English. / چیزی را که می‌خواهی به باجهٔ بار گمشده بگویی به فارسی می‌خوانی و به انگلیسی می‌گویی.
- `intro`: Now say it your own way. I’ll show you what you want to tell the desk, in Persian. Say it in English, the way you’d really say it at the desk. / حالا با کلمات خودت بگو. چیزی را که می‌خواهی به باجه بگویی به فارسی نشانت می‌دهم. به انگلیسی بگو، همان‌طور که واقعاً جلوی باجه می‌گفتی.

**Voice messages** (`voice-messages`)
- `does`: Hear two voice messages, from the baggage desk and your friend Ben, and reply to each one. / دو پیام صوتی بشنو، از باجهٔ بار گمشده و از دوستت بن، و به هر کدام جواب بده.
- `intro`: You’ve just left the baggage desk, and two voice messages come in: first from the desk, then from your friend Ben. Listen, then reply with a short voice message of your own. Make sure you answer their questions. / تازه از باجهٔ بار گمشده آمده‌ای و دو پیام صوتی برایت رسیده: اول از باجه، بعد از دوستت بن. گوش بده و با یک پیام صوتی کوتاه جواب بده. حواست باشد به سؤال‌هایشان جواب بدهی.

### Professional

**Natural phrases** (`phrases`, the built B1 set)
- `does`: Hear five natural phrases from Sara’s story at the baggage desk, and say each one after Mira. / پنج عبارت طبیعی از ماجرای سارا در باجهٔ بار گمشده بشنو و هر کدام را بعد از میرا تکرار کن.
- `intro`: These five sentences tell what happened to Sara at the baggage desk, the way she tells it later. Listen, then say each one after me. You’ll use these phrases in your own story today. / این پنج جمله ماجرای سارا در باجهٔ بار گمشده را تعریف می‌کنند، همان‌طور که خودش بعداً تعریفش می‌کند. گوش بده و هر کدام را بعد از من تکرار کن. امروز در داستان خودت هم به کارشان می‌بری.

**Say it in English** (`say-in-english`)
- `does`: Read three things you want to tell the baggage desk, in Persian, and say each one in English. / سه چیزی را که می‌خواهی به باجهٔ بار گمشده بگویی به فارسی می‌خوانی و هر کدام را به انگلیسی می‌گویی.
- `intro`: Now it’s your turn at the baggage desk. Here, your name is Karimi, and your suitcase didn’t come out. I’ll show you three things you want to say, in Persian. Say each one in English, the way you’d really say it. / حالا نوبت خودت است که به باجهٔ بار گمشده بروی. این‌جا اسمت کریمی است و چمدانت بیرون نیامده. سه چیزی را که می‌خواهی بگویی به فارسی نشانت می‌دهم. هر کدام را به انگلیسی بگو، همان‌طور که واقعاً جلوی باجه می‌گفتی.

---

## New facts for world.md

1. **Intermediate's learner from Natural phrases on** is Karimi at the baggage desk (Saturday, late
   afternoon, after Sara): only one of two bags came out; the missing one is the big dark blue
   suitcase; it wasn't on their flight and isn't found yet at the desk; their toothbrush is in it
   and they need it tonight, so they ask whether to buy a new one; they ask the desk to call them.
   (In the Professional set, the built B1 phrases are still Sara telling her story afterwards.)
2. **The baggage desk's call to the learner** (Saturday, about 5 p.m.; voice Andrew, no name): they
   think they've found the suitcase; they ask for one more thing about it, so they know it's the
   learner's; it comes tomorrow and the driver can bring it to the hotel; they ask how the driver
   can reach the learner. The learner: a yellow ribbon on the handle; "call me at this number". This
   matches the role-play's first run (it comes tomorrow; delivery to the hotel; the driver calls
   about 30 minutes before). Intermediate's desk call and Professional's Ryan are different versions
   of the same afternoon; neither version meets both.
3. **Ben**, the learner's friend (Brian, `c`): a new character, never Sara's friend and never in a
   scene with Marcus or Ryan. His message (about 5:15 p.m.) asks if the learner landed OK, whether
   both bags came out and, if one is missing, when they get it back. The learner: only one came
   out; they found the suitcase; it comes back tomorrow, to the hotel.
4. **The learner's own lost bag** (Intermediate and Professional): as on the role-play card, **a
   big, dark blue suitcase, hard plastic, with four wheels and a yellow ribbon on the handle**; their
   other bag came out; all their clothes and their toothbrush are in it; they'd like it by tomorrow
   (Sunday) morning; they're staying at the Park Hotel; they ask the desk to call them, what happens
   next, to deliver it to the hotel (the front desk if they're out), and whether they can buy a few
   things and get the money back. `world.md`'s learner row should add the suitcase.

---

## Notes for the editor

### (a) Checks done (re-run for draft v2)

- **Regexes**, run in Node with copies of both `normalise()` functions (say-better for `found`,
  traps for `accept`/`reject`) and of `checkSaid`; 0 failures:
  - each `found` matches its own sentence and none of the other four in its set;
  - each accepts its listed variants ("only one of our two bags came out", "a big, dark blue
    suitcase", "a large navy blue suitcase", "a big dark blue hard suitcase", "a big dark blue one",
    "a medium-sized black bag", "When will I get it back?", "when do I get my suitcase back", "I'll
    need it tonight", "I need my toothbrush tonight", "Do I need to get a new toothbrush?", "Should I
    buy one?");
  - each rejects its habit ("One of my bag came out", "one of my baggage", "my one bag", "a dark
    blue big suitcase", "a suitcase big dark blue", "it is big and dark blue", "a big suitcase",
    "When I can take it?", "when can I get it", "I need to it tonight", "It's necessary for me
    tonight", "Should I buy new?", "Should I buy a new?").
  - Each trap: `right` gives "right", the sentence with the mistake gives "wrong", and every extra
    form listed gives the result shown, including "One of my two bags is missing" (right), "One of
    my baggage is missing" (wrong), "My luggage is missing" (also good), "Can I get it back by
    Sunday morning?" (right), "…until Sunday?" (wrong), "Can I get it back tomorrow?" and "…on
    Sunday?" (also good),
    "…before tomorrow?" (wrong), "Please call for me…" (wrong), "Can you describe your bag?" (also
    good).
- **Shapes:** each `shown` minus `**` and with `‿` as a space equals its `sentence`; every bold part
  has two or more words; every Persian field has Persian letters; no `why.fa` has a backtick.
- **Limits:** A2 models 11–21 words (limit 25); B1 models 21–28 (limit 30); message sentences 76
  characters or fewer (limit 120); model replies 23 and 30 words (limit 40). Trap ids don't clash
  with the old Day 1 lab set, Day 2 or Day 3; Say-it and message ids start with `d1-` and are new.
- **Each trap's `right` is natural US English:** "One of my bags is missing.", "Can I get it back by
  tomorrow?", "Please call me when you find it.", "What does your bag look like?"
- **Against Days 1–3 and the role-play:** Sara's backpack is small and green, went to Frankfurt,
  comes on the evening flight and is delivered tomorrow morning (only in the conversation and the
  B1 phrases now); the learner's suitcase matches the role-play card word for word (big, dark blue,
  hard plastic, four wheels, yellow ribbon on the handle); the desk's news matches the role-play's
  first run; the learner's charger is in their carry-on (role-play), so no learner line needs one.
  Voices: Ben is Brian and never with Marcus or Ryan (Brian); the desk on the phone is Andrew, as on
  Days 2–3; no Emma or Ava. No real brands and no prices.
- **Light day:** 5 phrases, 3 lesson traps, 3 + 3 Say-it items, 2 messages, every sentence short.

### (b) Review v1 applied

Changes (reviews `ux.md`, `en.md`, `fa.md`; LEAD decisions first):
- **One identity in Intermediate (ux 1, LEAD):** the A2 phrases are now you (Karimi) at the desk:
  #2 describes your suitcase ("It's a big dark blue suitcase"), #4–#5 are about your toothbrush
  (the card's "Tonight you need"), because your charger is in your carry-on and you have no
  medicine. The chunks are the same five, each echoing Sara's line (hear → say → use). The two
  messages are replaced: the baggage desk (Andrew: one more thing about the suitcase; how the
  driver can reach you) and your friend Ben (Brian: did both bags come out; when do you get it
  back). The pharmacy message and Tom are gone. `MESSAGES_INTRO`, the lesson intro and `does` say
  you're Karimi; "Who you are" and the new facts are rewritten.
- **The bag** is the role-play card's, in every Say-it item (both sets): "big dark blue suitcase"
  («سرمه‌ای»), the ribbon "on the handle".
- **Asking what happens next in Professional (ux 6):** `d1-delivery` now opens with «خب، حالا چی
  می‌شه؟» ("So what happens next?" / "What's the next step?"); "keep me posted" made room for it.
- **en 7:** `d1-clothes` Persian «پس حتماً باید تا فردا صبح دستم باشه».
- **en 9:** `found` #1 allows "two / three"; #2 allows "one" (and "navy", "hard / soft / plastic",
  for the card's bag); #4 allows "will" ("I'll need it"); trap `by-tomorrow` accepts, rejects and
  (also good) allows "Sunday" and "back on Sunday"; trap `my-bags` also allows "two / three".
- **en 10:** #2 is plain "It's a…"; #1's habit note is fixed (the Persian is plural; "one" pulls the
  noun to the singular); the chunk is "I need it tonight", with a capital.
- **fa 1:** «باجهٔ بار گمشده» everywhere, one spelling «گمشده». **fa 4:** `d1-call-me` «…توی هتل
  پارک هستم», hint «توی … هستم». **fa 5:** `my-bags` «برای یکی از بارهایت بگو…». **fa 9:**
  «فرودگاه Riverton» and «Park Hotel» in Latin in Mira's lines; «هتل پارک» only in spoken prompts.
  **fa 10:** Ben's ask «هر دو بارَت سالم رسید؟»; Say-it intro «…همان‌طور که واقعاً جلوی باجه
  می‌گفتی.» **fa note:** B1 #2's trap quotes «چند تا چیز ضروری».
- **en 5:** no Sara-side reply is left in this file, so "went to Frankfurt" isn't said by anyone
  here.

Declined or changed, and why:
- **Message order (ux 1 lists Ben first):** the lesson plays the desk first, then Ben. At the desk
  the bag isn't found yet ("call me when you find it"), so Ben's "When do you get it back?" can only
  be answered after the desk's news. With the desk first, the learner hears "it comes tomorrow" and
  then uses it in the reply to Ben. Ben's message and asks are as the lead wrote them.
- **The desk asks "how can the driver reach you", not "where to deliver" (ux 1):** the desk already
  has the hotel from the report (`d1-call-me`), and two asks is the limit; the model reply says
  "call me at this number" (trap `call-me`).
- **Not in this file** (left for `conversation.md`, `listening.md`, the README or `day.ts`): ux 2–5;
  en 1–4, 8, 11–13; fa 2, 3, 6, 7, 8 and fa 10's `conversation.md` item.

### (c) Open questions

1. **Professional B1 set ("my phone was almost dead"):** at the desk, about 12:45, Sara's phone
   still works; world says it's almost dead "by the afternoon". The B1 line is Sara's story told
   later, so it reads as true; left as built.
2. **Speech-to-text risk** (as on Days 2–3, record each wrong trap sentence with a Persian accent
   before these ship): the weak "to" in "call to me" may be dropped, so the mistake passes; "one of
   my baggages" may come out as "one of my baggage is" (still fails, by the second `reject`); "until"
   may come out as "till" (in `reject`). "Karimi" may come out wrong; no regex depends on it.
3. **The traps intro says "three things you might say"**, true for the lesson's three; the Module
   lab's fourth (`look-like`) is the agent's question. If the lab reuses Mira's lesson intro, say
   "Here are some sentences from the baggage desk" instead.
4. **"I need it by tomorrow morning" (`d1-when`) and "it comes tomorrow"** (the desk): the desk
   doesn't say when tomorrow, so the learner's wish isn't contradicted in Intermediate; in
   Professional, Ryan's news (tomorrow afternoon, or Monday) is the twist that breaks it, which is
   the point of `d1-clothes`'s "If it's late…".
5. **Code outside the content arrays** (not edited): a `days/day-1/` content file (or branches in
   `day-content.ts`) with `PHRASES { intermediate: new A2 set, professional: PHRASES from
   phrases.ts }`, `TRAPS`, `LESSON_TRAP_IDS`, `SAY`, `LESSON_SAY_IDS`, `MESSAGES` (`d1-desk`,
   `d1-ben`), `LESSON_MESSAGE_IDS` and `MESSAGES_INTRO`; a `tracks` list in `DAY_ONE` in `day.ts`
   with the intros above; the old Day 1 lab arrays (`TRAPS` in `traps.ts`, `ITEMS` in
   `say-in-english.ts`, `MESSAGES` in `voice-messages.ts`) stay for learners who started Day 1 on the
   old list.
