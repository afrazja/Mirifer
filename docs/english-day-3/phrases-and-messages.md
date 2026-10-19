# English Day 3: Natural phrases, Persian-speaker traps, Say it in English, Voice messages (draft)

Status: **draft, for review and owner approval.** Every fact comes from `world.md` (and Days 1–2);
anything new is listed under "New facts for world.md" at the end. US English. Each module is written
in its built format: the field names below are the ones in its `.ts` file, and the layout follows
`docs/english-day-2/phrases-and-messages.md` and `src/lib/practice/days/day-2.ts`.

| Module | Set | Track | Code | Spec |
|---|---|---|---|---|
| Natural phrases | A2 | Intermediate (A2) | `src/lib/practice/phrases.ts` | `docs/english-shadowing-spec.md` |
| Natural phrases | B1 | Professional (B1+) | the same | the same |
| Persian-speaker traps | one set | Intermediate | `src/lib/practice/traps.ts` | `docs/english-traps-spec.md` |
| Say it in English | Intermediate (4 items, A2) | Intermediate | `src/lib/practice/say-in-english.ts` | `docs/english-say-in-english-spec.md` |
| Say it in English | Professional (3 items, B1) | Professional | the same | the same |
| Voice messages | one set (A2+) | Intermediate | `src/lib/practice/voice-messages.ts` | `docs/english-voice-messages-spec.md` |

**Daily lesson subsets.** Traps (Intermediate): 5 of 6 (without #4 `phone-dead`, so the lesson
practises the dates with `im-staying`). Voice messages (Intermediate): both of the 2 (Tom and the
baggage desk); there are no lab-only messages. Say it in English: the whole set in both versions (4
and 3), so `LESSON_SAY_IDS` is `null` for both. Each section says which.

**Who "you" are.** One name for the learner everywhere: **Karimi** («کریمی»). Sara stays Demir only
where the item is Sara's check-in.
- **Natural phrases (both sets), Say it in English (Professional) and Voice messages:** these are
  Sara's check-in and Sara's evening. In the phrases you repeat her lines, so you say her name
  (Demir), as Day 2's phrases followed Sara's ride; in Say it (Professional) and Voice messages,
  Mira's intro says "you're Sara".
- **Traps and Say it in English (Intermediate):** "you" are the learner, on your own trip at the
  Park Hotel (`world.md`: "with their own booking"). Your booking is under **Karimi** (a Persian
  name, like Day 1's Rezaei), the same name as in the role-play.

**The day's goal** (give your booking name and ask about the Wi-Fi; the dates and breakfast too) is
in both phrase sets (A2 #1–#4; B1 #1–#3), in three lesson traps (`under-name`, `im-staying`,
`password-for`) and in all four Intermediate Say-it items (`d3-checkin`, `d3-dates`, `d3-wifi`,
`d3-breakfast`).

---

## 1. Natural phrases

Built format (`Phrase`): `sentence` (what Mira says), `shown` (`**bold**` = the chunk, `‿` = a link;
removing the marks gives `sentence`), `chunk`, `situation {en, fa}`, `tip {en, fa}` (English in
`backticks`), `found` (the word check, a regex run on the say-better `normalise()` output: lower
case, contractions spelled out, so "I'm" is "i am" and "I'd" is "i would"; "it's" and "name's" stay
as they are; a hyphen becomes a space, so "Wi-Fi" is "wi fi" and "double-check" is "double check").
The habit each chunk replaces is a content note, not a code field. Five sentences per set; the voice
is Mira's.

### 1a. A2 set (Intermediate)

Order of the check-in: **arrive and give the name → the booking → Wi-Fi → breakfast → the backpack.**

| # | `situation` (en / fa) | `shown` (chunk in bold) | Habit it replaces | `tip` (en / fa) |
|---|---|---|---|---|
| 1 | You get to the front desk. / به پذیرش هتل می‌رسی. | Hi, **I'm here to check‿in**. It's under Demir. | "I came to take my room." / "I want to receive my room." (from «اومدم اتاقم رو تحویل بگیرم») | `check in`: link the words and stress `IN`: `che-KIN`. / `check in` را پیوسته بگو و روی `IN` تأکید کن: `che-KIN`. |
| 2 | The receptionist asks how long you're staying. / مسئول پذیرش می‌پرسد چند شب می‌مانی. | **I'm staying for** three nights, until Tuesday. | "I stay three nights." (from «سه شب می‌مونم») | `for` is short and weak: `fer`, so `STAY-ing-fer`. / `for` را کوتاه و ضعیف بگو، مثل `fer`: `STAY-ing-fer`. |
| 3 | You want to get online in your room. / می‌خواهی در اتاقت به اینترنت وصل شوی. | How do I **connect‿to the Wi-Fi**? | "How can I connect the Wi-Fi?" / "How do I enter the Wi-Fi?" (from «چطوری به وای‌فای وصل شم؟») | `connect to`: say the `t` only once: `kuh-NEK-tuh`. / در `connect to` صدای `t` را فقط یک بار بگو: `kuh-NEK-tuh`. |
| 4 | You want to know if you pay extra for breakfast. / می‌خواهی بدانی صبحانه پول جدا دارد یا نه. | **Is breakfast included**, or is it extra? | "Breakfast is free?" (from «صبحونه مجانیه؟»: statement order and "free") | `included`: stress the middle, `in-CLOO-did`. / در `included` تأکید روی بخش وسط است: `in-CLOO-did`. |
| 5 | Your backpack is coming tomorrow morning. / کوله‌پشتی‌ات فردا صبح می‌رسد. | Could you call my room **when‿it arrives**? | "…when it will arrive" / "When it arrived, call me." (from «وقتی رسید زنگ بزنید»: Persian uses the past here) | `when it` runs together: `weh-nit`. / `when it` را پیوسته بگو: `n` به `it` می‌چسبد، یعنی `weh-nit`. |

`sentence` and `chunk` for each (the plain sentence is `shown` without the marks):

| # | `sentence` | `chunk` |
|---|---|---|
| 1 | Hi, I'm here to check in. It's under Demir. | i'm here to check in |
| 2 | I'm staying for three nights, until Tuesday. | i'm staying for |
| 3 | How do I connect to the Wi-Fi? | connect to the wi-fi |
| 4 | Is breakfast included, or is it extra? | is breakfast included |
| 5 | Could you call my room when it arrives? | when it arrives |

**Word check** (only the chunk, never the accent), with the `found` regex text (tested against
`normalise()`: each finds its own sentence, ignores the other nine sentences of both sets, accepts
the variants listed and rejects the habit):

| # | What it listens for | `found` |
|---|---|---|
| 1 | check in / checking in ("I'm here to check in", "I'd like to check in", "I'm checking in"); "take my room" doesn't count | `/\bcheck(?:ing)? in\b/` |
| 2 | I'm / we're / I'll be staying ("I'm staying three nights", "I'll be staying for two nights"); "I stay" and "I will stay" don't count | `/\b(?:i am\|we are\|i will be\|we will be) staying\b/` |
| 3 | connect / connecting to, join, get on / log on to / log into the Wi-Fi (or the internet, the network) ("How do I join the WiFi?", "I'm having trouble connecting to the Wi-Fi"); "connect the Wi-Fi" and "enter the Wi-Fi" don't count | `/\b(?:connect(?:ed\|ing)? to\|join\|get on\|get onto\|log on to\|log onto\|log into\|log in to) (?:the )?(?:wi ?fi\|internet\|network)\b/` |
| 4 | is (the) breakfast included / does it (the room, the price) include breakfast / does the room come with breakfast; "breakfast is free?", "breakfast is included?" and "is breakfast free?" don't count | `/\bis (?:the )?breakfast included\b\|\bincludes? breakfast\b\|\bcomes? with breakfast\b/` |
| 5 | when / once / as soon as it (the backpack, the bag) arrives / gets here / comes / is here; "when it will arrive", "when it arrived" and "when it come" don't count | `/\b(?:when\|once\|as soon as) (?:it\|the backpack\|my backpack\|the bag\|my bag\|the package)(?: arrives\| gets here\| comes\| comes in\|'s here\| is here)\b/` |

### 1b. B1 set (Professional)

The same five steps, one B1 chunk each, so the set still tells Sara's check-in in order: **give the
name → check the booking → the Wi-Fi password → a request (late check-out) → the backpack.** Each tip
has one sound feature only.

| # | `situation` (en / fa) | `shown` (chunk in bold) | Habit it replaces | `tip` (en / fa) |
|---|---|---|---|---|
| 1 | You get to the front desk after a long day. / بعد از یک روز طولانی به پذیرش هتل می‌رسی. | Hi, **there should be a reservation‿under** Demir. | "I reserved on the name of Demir." / "I have a reservation with the name Demir." (from «به اسم دمیر رزرو کردم») | `reservation under`: the `n` moves to `under`: `rez-er-VAY-shuh-NUN-der`. / در `reservation under` صدای `n` به `under` می‌چسبد: `rez-er-VAY-shuh-NUN-der`. |
| 2 | The receptionist finds your booking. / مسئول پذیرش رزروت را پیدا می‌کند. | **Just to double-check**, I'm checking out on Tuesday, right? | "I want to control it." / "Just for checking…" (from «فقط برای اینکه مطمئن بشم» and «کنترل کنم») | `double-check`: stress `CHECK`, not `double`: `dub-ul-CHECK`. / در `double-check` تأکید روی `CHECK` است، نه `double`: `dub-ul-CHECK`. |
| 3 | The receptionist says the Wi-Fi password very fast. / مسئول پذیرش رمز وای‌فای را خیلی تند می‌گوید. | Sorry, is the Wi-Fi password **all‿one word**? | "Is it attached?" / "Is it together or separate?" (from «سرهمه؟» / «چسبیده‌ست؟») | `all one word`: say it as one group, `aw-lwun-WURD`. / `all one word` را یک‌نفس بگو: `l` به `one` می‌چسبد، یعنی `aw-lwun-WURD`. |
| 4 | You'd like to leave a little later on Tuesday. / می‌خواهی سه‌شنبه کمی دیرتر از هتل بروی. | **Would‿it be possible to** get a late check-out on Tuesday? | "Is it possible that I go later?" (from «امکانش هست که دیرتر برم؟») | `would it` runs together, quick and soft: `wu-dit-be-POSS-uh-bul`. / `would it` را پیوسته، سریع و نرم بگو: `wu-dit-be-POSS-uh-bul`. |
| 5 | Your backpack arrives tomorrow morning, and you might not be in your room. / کوله‌پشتی‌ات فردا صبح می‌رسد و شاید آن موقع در اتاقت نباشی. | My backpack's coming tomorrow. Could you **hold‿on to it** for me? | "Can you receive it?" / "Can you take it and keep?" (from «تحویلش بگیرید» / «نگهش دارید») | `hold on`: the `d` moves to `on`: `hol-DON`. / در `hold on` صدای `d` به `on` می‌چسبد: `hol-DON`. |

| # | `sentence` | `chunk` |
|---|---|---|
| 1 | Hi, there should be a reservation under Demir. | there should be a reservation under |
| 2 | Just to double-check, I'm checking out on Tuesday, right? | just to double-check |
| 3 | Sorry, is the Wi-Fi password all one word? | all one word |
| 4 | Would it be possible to get a late check-out on Tuesday? | would it be possible to |
| 5 | My backpack's coming tomorrow. Could you hold on to it for me? | hold on to it |

**Word check** (only the chunk; tested as above):

| # | What it listens for | `found` |
|---|---|---|
| 1 | a reservation / booking / room under, booked under, it's / it should be under ("I have a booking under the name Demir", "It's under Demir", "I booked under Demir"); "on the name of", "with the name" don't count; "in the name of" is fine English but isn't the chunk, so it doesn't count either | `/\b(?:reservations?\|bookings?\|room\|booked\|it\|it's\|it is\|that's\|that is\|should be) under\b/` |
| 2 | double-check / double-checking ("just to double-check", "let me double-check", "I'm just double-checking"); "control" and "just for checking" don't count | `/\bdouble check(?:ing\|ed)?\b/` |
| 3 | (all) one word ("is it all one word?", "is it one word?"); "attached" and "together" don't count | `/\b(?:all )?one word\b/` |
| 4 | would / will it be possible to, is it possible to (for me / us); "is it possible that I…" doesn't count | `/\b(?:would it be\|will it be\|is it) possible (?:for (?:me\|us) )?to\b/` |
| 5 | hold / hang on to (onto) it / my backpack / the bag; "receive it" and "hold it for me" don't count | `/\b(?:hold\|hang) (?:on to\|onto) (?:it\|that\|my backpack\|the backpack\|my bag\|the bag\|them)\b/` |

**Where the B1 chunks come back:** #4 `would it be possible to` and #5 `hold on to it` are used again in
Say it in English (Professional) items 2 and 3, for transfer (as Day 2 reused `cash on me`).

---

## 2. Persian-speaker traps (Intermediate)

Built format (`Trap`): `id`, `kind {en, fa}`, `words` (the sentence with the mistake, word by word),
`wrong` (index of the word to tap), optional `alsoOk` (`{index, sentence}`), `right`, `why {en, fa}`,
`accept` and `reject` (regex text, run on the traps `normalise()`: lower case, plain quotes, no
punctuation, so "Wi-Fi" is "wi fi"; contractions are **not** spelled out here), optional
`alsoGood {patterns, word}`. Six traps, none of Day 1's (he/she, agree, say/tell, age, since/for,
than, afraid of, bored) or Day 2's (been-waiting, to-not-until, near-of, how-long, bad-traffic,
on-the-bus, get-out, help-with); the ids are new. `why.fa` has no backticks: English goes in «».

All six were run through the code's check (`checkSaid`): `right` passes, the sentence with the
mistake fails, and the extra forms listed get the result shown.

**Daily lesson:** the Intermediate lesson uses 5 of the 6, in the order of a check-in:
`under-name`, `im-staying`, `on-the-floor`, `password-for`, `lend-me`. `im-staying` is in on purpose:
with phrase A2 #2 and Say-it `d3-dates`, the lesson practises the dates three ways. Left out: #4
`phone-dead` (the charger is already in `lend-me` and Tom's message); it stays as lab practice. All
six stay defined in `TRAPS`.

`LESSON_TRAP_IDS = ['under-name', 'im-staying', 'on-the-floor', 'password-for', 'lend-me']`

**1. `id`: `under-name`** · `kind`: under (a name) / under (به اسمِ)
- `words`: `["I", "have", "a", "reservation", "on", "the", "name", "Karimi."]` · `wrong`: 4 (`on`)
- `right`: I have a reservation under the name Karimi.
- `why` en: A booking is “under” a name: “a reservation under the name Karimi”, or just “under Karimi”.
- `why` fa: در فارسی می‌گوییم «به اسمِ کریمی» و برای همین «on the name» یا «with the name» به ذهنمان می‌رسد. در انگلیسی رزرو را «under» یک اسم می‌گویند: «under the name Karimi» یا خیلی ساده «under Karimi».
- `accept`: `/\b(?:reservation|booking|room|booked|it's|it is) under\b/`, `/\bunder (?:the|my) name\b/`
- `reject`: `/\b(?:on|with|by|to) (?:the|my) name\b/`
- `alsoGood`: patterns `/\bin (?:the|my) name\b/` · word "under"
- Also passes: "It's under Karimi.", "I have a booking under my name.", "I booked a room under Karimi." "I have a reservation in the name of Karimi" is good English, so it gets "also good" and is asked for "under".
- The goal of the day (give your booking name).

**2. `id`: `on-the-floor`** · `kind`: on the … floor / on the … floor (طبقه)
- `words`: `["The", "gym", "is", "in", "the", "second", "floor."]` · `wrong`: 3 (`in`)
- `right`: The gym is on the second floor.
- `why` en: Floors take “on”: “on the second floor”, “on the ground floor”.
- `why` fa: در فارسی می‌گوییم «باشگاه تو طبقهٔ دومه» و برای همین «in» به ذهنمان می‌رسد. ولی در انگلیسی برای طبقه «on» می‌گوییم: «on the second floor».
- `accept`: `/\bon the (?:second|2nd|2) floor\b/`, `/\bon floor (?:two|2)\b/`
- `reject`: `/\b(?:in|at) the (?:second|2nd|2) floor\b/`, `/\b(?:in|at) floor (?:two|2)\b/`
- Also passes: "The gym's on the 2nd floor.", "The gym is on floor two." ("at the second floor" and "in floor two" fail.)
- From this trip: the gym is on the second floor (world). It was "My room is on the seventh floor" in the draft, but the learner's room is 908 or 412 in the role-play (not the seventh floor), so the sentence now uses a hotel fact that's true for everyone.

**3. `id`: `password-for`** · `kind`: the password for / the password for (رمزِ)
- `words`: `["What's", "the", "password", "of", "the", "Wi-Fi?"]` · `wrong`: 3 (`of`)
- `right`: What's the password for the Wi-Fi?
- `why` en: Say “the password for the Wi-Fi”, or just “the Wi-Fi password”, not “of”.
- `why` fa: در فارسی می‌گوییم «رمزِ وای‌فای» و همین کسره باعث می‌شود «of» بگوییم. در انگلیسی «the password for the Wi-Fi» یا خیلی ساده «the Wi-Fi password» می‌گوییم.
- `accept`: `/\bpassword (?:for|to) (?:the )?wi ?fi\b/`, `/\bwi ?fi password\b/`
- `reject`: `/\b(?:password|code) of (?:the )?wi ?fi\b/`
- Also passes: "What's the WiFi password?", "What's the password to the Wi-Fi?" ("the code of the Wi-Fi" fails.)
- The goal of the day (ask about the Wi-Fi).

**4. `id`: `phone-dead`** (lab only) · `kind`: a dead phone / a dead phone (گوشی بی‌شارژ)
- `words`: `["My", "phone", "battery", "is", "finished."]` · `wrong`: 4 (`finished.`)
- `right`: My phone battery is dead.
- `why` en: A phone or battery with no charge left is “dead”, not “finished”. You can also say “My phone died.”
- `why` fa: در فارسی می‌گوییم «شارژ گوشیم تموم شده» و برای همین «finished» به ذهنمان می‌رسد. در انگلیسی گوشی یا باتری‌ای که شارژ ندارد «dead» است: «My phone is dead» یا «My phone died».
- `accept`: `/\b(?:phone|battery)(?: is|'s) (?:\w+ )?dead\b/`, `/\b(?:phone|battery)(?: has| just|'s)* died\b/`
- `reject`: `/\b(?:phone|battery|charge)(?: is|'s) (?:\w+ )?finished\b/`
- `alsoGood`: patterns `/\bout of (?:battery|charge|power)\b/`, `/\bneeds? (?:to be )?charg/` · word "dead"
- Also passes: "My phone's dead.", "My phone is completely dead.", "My phone died.", "My phone just died.", "My battery has died." "My phone ran out of battery", "My phone is out of charge" and "My phone needs charging" get "also good".
- From this trip: Sara's phone is dead (world); Day 1's phrase "my phone was almost dead".

**5. `id`: `lend-me`** · `kind`: lend / borrow / lend / borrow
- `words`: `["Can", "you", "borrow", "me", "a", "charger?"]` · `wrong`: 2 (`borrow`)
- `right`: Can you lend me a charger?
- `why` en: You “borrow” something from someone; they “lend” it to you. So: “Can you lend me…?” or “Can I borrow…?”
- `why` fa: در فارسی هر دو را با «قرض» می‌گوییم: قرض دادن و قرض گرفتن. در انگلیسی کسی که می‌دهد «lend» می‌گوید و کسی که می‌گیرد «borrow». پس بگو «Can you lend me a charger» یا «Can I borrow a charger».
- `accept`: `/\b(?:lend|loan) me\b/`, `/\b(?:can|could|may) i borrow\b/`
- `reject`: `/\bborrow me\b/`
- `alsoGood`: patterns `/\b(?:can|could|may) i (?:have|get|use)\b/`, `/\bdo you have a (?:phone )?charger\b/` · word "lend"
- Also passes: "Could I borrow a charger?" "Can I have a charger?" and "Do you have a charger?" get "also good".
- From this trip: the desk lends chargers (world).

**6. `id`: `im-staying`** (in the lesson, second) · `kind`: I’m staying (plans) / I’m staying (برنامه)
- `words`: `["I", "stay", "here", "for", "four", "nights."]` · `wrong`: 1 (`stay`)
- `right`: I'm staying here for four nights.
- `why` en: For your plans on this trip, say “I’m staying”. “I stay” sounds like something you always do.
- `why` fa: در فارسی می‌گوییم «چهار شب این‌جا می‌مونم». در انگلیسی برای برنامهٔ همین سفر «I’m staying» می‌گوییم. «I stay» یعنی کاری که همیشه انجام می‌دهی.
- `accept`: `/\b(?:i'm|i am|im|i'll be|i will be) staying\b/`
- `reject`: `/\bi stay\b/`
- `alsoGood`: patterns `/\b(?:i'll|i will) stay\b/`, `/\b(?:i'm|i am|im) here for\b/` · word "staying"
- Also passes: "I'll be staying for four nights." "I'll stay here for four nights" and "I'm here for four nights" get "also good". ("I stayed here…" fails.)
- From this trip: your booking (the role-play's) is four nights, until Wednesday. The dates part of the day's goal, and what the role-play's `booking` goal asks you to say.

**Candidates left out**
- "Breakfast is free?" for "Is breakfast included?": the mistake is word order (and "free" isn't
  wrong), so there's no single word to tap. It's taught in phrase A2 #4 and Say-it `d3-breakfast`.
- "Give me the Wi-Fi password, please.": grammatical, only too direct. A politeness point, not a
  wrong word; better in Say it, where the model reply shows "Could I get…".
- "Can I stay one night more?" (for "one more night"): a good Persian-speaker trap («یه شب بیشتر»),
  but nobody extends a stay in today's story. A spare if the owner wants it:
  `words` `["Can", "I", "stay", "one", "night", "more?"]`, `wrong` 5, `alsoOk` index 4, `right`
  "Can I stay one more night?", `accept` `/\b(?:one more|another|an extra) night\b/`, `reject`
  `/\bone night more\b/`.
- "the Wi-Fi's password": the same point as `password-for`, so one of them is enough.

---

## 3. Say it in English

Built format (`SayItem`): `id`, `to {en, fa}`, `fa` (the message in spoken Persian), `points` (2,
each `{en, fa}`), `models` (2 natural versions; A2 25 words or fewer, B1 30 or fewer, the code's test
limits), `hints` (2, each `{en, fa}`), `level` (`'B1'` for the Professional set), `names` (one string
per set, to help speech-to-text). Ids start with `d3-` (unique across days). `fa`, points and hints
are plain text, so they hold no English except names.

### 3a. Intermediate set (A2): four items, all in the lesson

All four `to`: **To the hotel front desk / به پذیرش هتل.** "You" are the learner, checking in at the
Park Hotel under the name Karimi. In check-in order.

| # | `id` | `fa` | `points` (en / fa) | `models` | `hints` (en / fa) |
|---|---|---|---|---|---|
| 1 | `d3-checkin` | سلام، اومدم اتاقم رو تحویل بگیرم. رزرو به اسم کریمیه. | you're here to check in / آمده‌ای اتاقت را تحویل بگیری · the reservation is under Karimi / رزرو به اسم کریمی است | "Hi, I'm here to check in. The reservation is under Karimi." · "Hi, I'd like to check in, please. It's under Karimi." | check in / تحویل گرفتن اتاق · under… / به اسمِ… |
| 2 | `d3-dates` | فقط برای این‌که مطمئن بشم: چهار شب می‌مونم، تا چهارشنبه، درسته؟ چهارشنبه ساعت چند باید اتاق رو تحویل بدم؟ | you're checking that you're staying four nights, until Wednesday / می‌خواهی مطمئن شوی که چهار شب، تا چهارشنبه، می‌مانی · you're asking what time you have to check out on Wednesday / می‌پرسی چهارشنبه ساعت چند باید اتاق را تحویل بدهی | "Just to check, I'm staying for four nights, until Wednesday, right? And what time is check-out?" · "So that's four nights, until Wednesday? What time do I have to check out?" | I'm staying for… / … می‌مونم · check out / تحویل دادن اتاق |
| 3 | `d3-wifi` | ببخشید، وای‌فای مجانیه؟ رمزش چیه؟ | you're asking if the Wi-Fi is free / می‌پرسی وای‌فای مجانی است یا نه · you're asking for the password / رمز وای‌فای را می‌خواهی | "Excuse me, is the Wi-Fi free? What's the password?" · "Is the Wi-Fi free? And could I get the password, please?" | free / مجانی · the Wi-Fi password / رمز وای‌فای |
| 4 | `d3-breakfast` | صبحونه هم جزو قیمت اتاقه؟ فردا از ساعت چند شروع می‌شه؟ | you're asking if breakfast is included / می‌پرسی صبحانه جزو قیمت اتاق است یا نه · you're asking what time it starts tomorrow / می‌پرسی فردا صبحانه از ساعت چند شروع می‌شود | "Is breakfast included? What time does it start tomorrow?" · "Is breakfast included in the price? And what time is it tomorrow?" | included / جزو قیمت · What time does it start? / از ساعت چند…؟ |

- Traps on purpose: «تحویل بگیرم» is "check in", not "receive my room"; «به اسمِ» is "under", not
  "on the name of" (trap `under-name`); «چهار شب می‌مونم» is "I'm staying for four nights", not "I
  stay four nights" (trap `im-staying`, phrase A2 #2); «اتاق رو تحویل بدم» is "check out", not
  "give back the room"; «رمزش» is "the password", not "its code" (trap `password-for`); «جزو قیمت»
  is "included", not "part of the price".
- `d3-dates` uses the dates freely (the lesson's phrase A2 #2 only has them repeated after Mira).
  The charger item it replaces is gone, so the charger comes up only in trap `lend-me` and Tom's
  message.
- Word counts: 11, 10 · 16, 14 · 9, 11 · 9, 12 (all within 25).
- Facts: the learner's booking is the role-play's: under Karimi, four nights, until Wednesday,
  check-out by 11 a.m. (`conversation.md`; new fact 4). Wi-Fi free with a password; breakfast
  included, from 7 tomorrow (Sunday) (world). `d3-dates` practises exactly what the role-play's
  `booking` goal asks for ("four nights, until Wednesday"). The desk's answer (eleven) isn't part of
  the item.
- `NAMES`: "Park Hotel, Karimi."

### 3b. Professional set (B1): three items, all in the lesson

Three longer messages Sara says to Daniel at the front desk, in the order of her check-in. Each needs
a B1 move: checking you've understood ("just to double-check"), a possibility ("I might be at
breakfast"), or a condition ("if it costs extra"). Items 2 and 3 reuse B1 phrases #5 and #4 for
transfer. ("Hold it for me" or "keep it for me" is natural too; the AI check never calls it wrong.)

All three `to`: **To Daniel at the front desk / به دنیل، در پذیرش هتل.** `level`: `'B1'`.

**1. `id`: `d3-hold`**
- `fa`: فقط می‌خوام مطمئن بشم: این شبی پنجاه دلار که روی کارتم بلوکه می‌کنید از حسابم کم نمی‌شه، درسته؟ کی آزاد می‌شه؟
- `points`:
  1. you want to make sure the fifty dollars a night is only a hold, not a charge / می‌خواهی مطمئن شوی شبی پنجاه دلار فقط روی کارتت بلوکه می‌شود و از حسابت کم نمی‌شود
  2. you're asking when you'll get it back / می‌پرسی کی آزاد می‌شود
- `models`:
  - "Just to double-check, the fifty dollars a night is only a hold, not a charge, right? When do I get it back?" (22 words)
  - "So it's just a hold on my card, and you won't actually charge it, right? When will it be released?" (20 words)
- `hints`: just to double-check / فقط برای این‌که مطمئن بشم · a hold, not a charge / بلوکه کردن، نه برداشت
- Main trap: «بلوکه می‌کنید» → "you block" (natural in the US: "a hold", "you put a hold on my card"); «آزاد می‌شه» → "when is it free?" (natural: "when will it be released", "when do I get it back"); «از حسابم کم نمی‌شه» → "it doesn't decrease from my account" (natural: "you won't charge it").
- Facts: a $50-a-night hold for incidentals, given back after check-out; nothing is charged unless she uses something (world, step 3).

**2. `id`: `d3-backpack-desk`**
- `fa`: فردا صبح بین هشت تا ده، شرکت هواپیمایی کوله‌پشتیم رو میاره. شاید اون موقع سر صبحونه باشم. می‌شه نگهش دارید تا بعد از صبحونه بیام بگیرمش؟
- `points`:
  1. the airline is bringing your backpack tomorrow between eight and ten, and you might be at breakfast then / شرکت هواپیمایی فردا بین هشت تا ده کوله‌پشتی‌ات را می‌آورد و شاید آن موقع سر صبحانه باشی
  2. you'd like them to keep it until you pick it up after breakfast / می‌خواهی آن را نگه دارند تا بعد از صبحانه بیایی و بگیری
- `models`:
  - "The airline's bringing my backpack tomorrow between eight and ten. I might be at breakfast, so could you hold on to it? I'll pick it up after." (27 words)
  - "My backpack should get here tomorrow, between eight and ten. If I'm at breakfast, would you mind keeping it at the desk? I'll come get it after that." (28 words)
- `hints`: I might be at breakfast / شاید سر صبحونه باشم · hold on to it / نگهش دارید
- Main trap: «سر صبحونه» → "on breakfast" (natural: "at breakfast"); «بیام بگیرمش» → "come and take it" (natural: "pick it up", "come get it").
- Facts: delivery tomorrow 8–10 a.m.; the desk keeps deliveries (world, step 8); breakfast is 7–10:30 on weekends, so she could be there. She no longer asks for a call to her room here, since she may be at breakfast (Persian review); world step 8's call to room 714 still happens in the conversation. "Might be at breakfast" is new (see notes).

**3. `id`: `d3-late-checkout`**
- `fa`: امکانش هست سه‌شنبه یه کم دیرتر اتاق رو تحویل بدم، مثلاً ساعت یک؟ اگه هزینهٔ اضافه داره، ترجیح می‌دم همون ساعت یازده برم.
- `points`:
  1. you'd like a late check-out on Tuesday, at about one / می‌خواهی سه‌شنبه دیرتر، حدود ساعت یک، اتاق را تحویل بدهی
  2. if it costs extra, you'd rather leave at eleven / اگر هزینهٔ اضافه دارد، ترجیح می‌دهی همان ساعت یازده بروی
- `models`:
  - "Would it be possible to get a late check-out on Tuesday, around one? If it costs extra, I'll just leave at eleven." (22 words)
  - "Could I check out a bit later on Tuesday, say at one? If there's an extra charge, eleven is fine." (20 words)
- `hints`: a late check-out / دیرتر تحویل دادن اتاق · if it costs extra / اگه هزینهٔ اضافه داره
- Main trap: «اتاق رو تحویل بدم» → "give back the room" / "deliver the room" (natural: "check out"); «ترجیح می‌دم… برم» → "I prefer to go at eleven" (natural: "I'll just leave at eleven", "eleven is fine").
- Facts: check-out Tuesday by 11; late check-out until 1 p.m. is free if you ask the day before (world). Sara asking for it is new (see notes).

- `NAMES`: "Park Hotel, Daniel, Demir, Riverton."
- `LESSON_SAY_IDS`: `{ intermediate: null, professional: null }` (both sets are used whole).

---

## 4. Voice messages (Intermediate, A2+)

Built format (`VoiceMessage`): `id`, `from {name, who {en, fa}, voice}`, `sentences` (one audio
request each; 120 characters or fewer, the code's test limit; the longest here is 101), `asks` (each
`{ask {en, fa}, missed {en, fa}}`), `model` (a natural reply, 40 words or fewer), `names`. Two
messages, each with 2 asks. The natural reply is read by Mira (Ava, `b`). Voices: `a` Andrew, `c`
Brian; never `b`. Ids start with `d3-`.

Timeline: Sara has charged her phone in room 714 (Saturday, after 5:15 p.m.) → that evening. The
learner is Sara (the intros say so, and give the room number, which the baggage desk asks for).

**Daily lesson:** the Intermediate lesson uses both: Tom (`d3-tom`) and the baggage desk
(`d3-baggage`). There are no lab-only messages (the two drafted ones, from Daniel and from the
desk on Sunday morning, were dropped in review v1), so the Module lab has the same two.

`LESSON_MESSAGE_IDS = ['d3-tom', 'd3-baggage']`

**`MESSAGES_INTRO`** (the Module lab's introduction):
- en: "Today, you’re Sara, in room 714 at the Park Hotel. You’ll get two voice messages: from your friend Tom and the airline. Listen, then reply with a voice message. Make sure you answer their questions."
- fa: امروز جای سارا هستی، در اتاق ۷۱۴ هتل پارک. دو پیام صوتی می‌گیری: از دوستت تام و از شرکت هواپیمایی. گوش بده و با یک پیام صوتی جواب بده. حواست باشد به سؤال‌هایشان جواب بدهی.

`NAMES` (both): "Tom, Rosa's, Elm Street, Riverton, Park Hotel, Main Street, Daniel, RideNow."

### Message 1. `id`: `d3-tom` (Saturday, about 5:30: her phone is back on)

- `from`: name **Tom** · who: your friend in Riverton / دوستت در ریورتون · voice `c` (Brian; Daniel isn't in this message)
- `sentences`:
  1. Hey, it's Tom. I tried to call you, but it went straight to voicemail. Is everything OK?
  2. Anyway, dinner's at seven, at Rosa's. It's on Elm Street, about ten minutes from your hotel by car.
  3. I'll get there a little early and get us a table.
  4. So how are you getting there?
  5. Let me know. See you soon!
- `asks`:
  1. ask: Is everything OK? Why couldn't he call you? / همه‌چیز روبه‌راه است؟ چرا نتوانست به تو زنگ بزند؟ · missed: You didn't say why he couldn't call you. / نگفتی چرا نتوانست به تو زنگ بزند.
  2. ask: How are you getting to Rosa's? / چطور به رستوران رزا می‌روی؟ · missed: You didn't say how you're getting to Rosa's. / نگفتی چطور به رستوران رزا می‌روی.
- `model`: "Hi Tom! Sorry, my phone battery was dead, but the hotel lent me a charger. I'm taking a RideNow at six forty. See you at Rosa's!" (26 words)
- Facts: dinner at 7; Rosa's on Elm Street, ten minutes by car, Tom's choice (new fact 1); Tom's car still broken (so he doesn't offer a ride); her phone was dead; the desk lent a charger; RideNow at 6:40 (world). Tom's call and the table are new (see notes).

### Message 2. `id`: `d3-baggage` (Saturday evening)

- `from`: name **Baggage desk** · who: the airline / شرکت هواپیمایی · voice `a` (Andrew)
- `sentences`:
  1. Hello, this is the airline's baggage desk at Riverton Airport. It's about your small green backpack.
  2. Our driver will bring it to the Park Hotel tomorrow morning, between eight and ten.
  3. Could you tell us your room number, please?
  4. And will you be in your room then, or should we leave it at the front desk?
  5. Thanks, and have a good evening.
- `asks`:
  1. ask: What's your room number? / شمارهٔ اتاقت چند است؟ · missed: You didn't say your room number. / نگفتی شمارهٔ اتاقت چند است.
  2. ask: Will you be in your room, or should they leave it at the front desk? / آن موقع در اتاقت هستی، یا کوله‌پشتی را تحویل پذیرش بدهند؟ · missed: You didn't say if you'll be in your room or if they should leave it at the front desk. / نگفتی در اتاقت هستی یا کوله‌پشتی را تحویل پذیرش بدهند.
- `model`: "Hi, thanks for calling. My room number is 714. I might be at breakfast then, so please leave it at the front desk. They'll keep it for me. Thanks!" (29 words)
- Facts: small green backpack, delivered tomorrow 8–10 a.m.; room 714; the desk keeps deliveries (world). The call itself is new (see notes); its second question is the one Day 2's lab message `d2-baggage` asked, which Intermediate learners didn't have in their Day 2 lesson.

---

## 5. Mira's module instructions

In the style of `DAY_TWO` in `src/lib/practice/day.ts`: `does` is one line for the session list;
`intro` is what Mira says (shown and read aloud). Titles and `short` stay as on Day 2.

### Intermediate

**Natural phrases** (`phrases`)
- `does`: Hear five sentences from Sara’s check-in, and say each one after Mira. / پنج جمله از ورود سارا به هتل بشنو و هر کدام را بعد از میرا تکرار کن.
- `intro`: Here are five sentences from Sara’s check-in at the Park Hotel, in order. Listen, then say each one after me. Notice the phrases in bold. / این پنج جمله از ورود سارا به هتل پارک است، به همان ترتیب. گوش بده و هر جمله را بعد از من تکرار کن. به عبارت‌های پررنگ دقت کن.

**Persian-speaker traps** (`traps`)
- `does`: Find the mistake Persian speakers often make at a hotel desk, then say the sentence right. / اشتباهی را که فارسی‌زبان‌ها در پذیرش هتل زیاد می‌کنند پیدا کن، بعد جمله را درست بگو.
- `intro`: Each sentence has one mistake that Persian speakers often make when they check in. Tap the wrong word, then say the sentence the right way. / هر جمله یک اشتباه دارد که فارسی‌زبان‌ها موقع ورود به هتل زیاد می‌کنند. روی کلمهٔ اشتباه بزن، بعد جمله را درست بگو.

**Say it in English** (`say-in-english`)
- `does`: Read what you want to tell the front desk in Persian, and say it in English. / چیزی را که می‌خواهی به پذیرش هتل بگویی به فارسی می‌خوانی و به انگلیسی می‌گویی.
- `intro`: Now it’s your turn to check in. I’ll show you what you want to say, in Persian. Say it in English, the way you’d really say it at the desk. / حالا نوبت خودت است که وارد هتل شوی. چیزی را که می‌خواهی بگویی به فارسی نشانت می‌دهم. همان را به انگلیسی بگو، همان‌طور که واقعاً در پذیرش می‌گفتی.

**Voice messages** (`voice-messages`)
- `does`: Hear two voice messages, from Tom and from the airline, and reply to each one. / دو پیام صوتی بشنو، از تام و از شرکت هواپیمایی، و به هر کدام جواب بده.
- `intro`: Today, you’re Sara, in room 714. Your phone is charging, and two voice messages come in. Listen, then reply with a short voice message of your own. / امروز جای سارا هستی، در اتاق ۷۱۴. گوشی‌ات را زده‌ای به شارژ و دو پیام صوتی برایت آمده. گوش بده و با یک پیام صوتی کوتاه جواب بده.

### Professional

**Natural phrases** (`phrases`)
- `does`: Hear five natural phrases for checking in, and say each one after Mira. / پنج عبارت طبیعی برای ورود به هتل بشنو و هر کدام را بعد از میرا تکرار کن.
- `intro`: Here are five phrases that sound natural at a hotel front desk, and that you’ll use today. Listen, then say each one after me. / این پنج عبارت در پذیرش هتل طبیعی است و امروز به کارشان می‌بری. گوش بده و هر کدام را بعد از من تکرار کن.

**Say it in English** (`say-in-english`)
- `does`: Read three things Sara wants to ask the front desk, in Persian, and say each one in English. / سه چیزی را که سارا می‌خواهد از پذیرش هتل بپرسد به فارسی می‌خوانی و هر کدام را به انگلیسی می‌گویی.
- `intro`: Today, you’re Sara again. I’ll show you three things she wants to ask Daniel at the front desk, in Persian. Say each one in English, the way you’d really say it. / امروز هم جای سارا هستی. سه چیزی را که می‌خواهد از دنیل در پذیرش هتل بپرسد به فارسی نشانت می‌دهم. هر کدام را به انگلیسی بگو، همان‌طور که واقعاً می‌گفتی.

---

## New facts for world.md

1. **Tom's message (about 5:30 p.m.):** he tried to call Sara, but her phone was off (dead); he
   names the restaurant, Rosa's on Elm Street, and says he'll get there a little early to get a
   table. (`world.md` gives Rosa's only as Daniel's tip; see (b) 1.)
2. **The baggage desk calls again on Saturday evening** to confirm tomorrow's 8–10 a.m. delivery and
   ask for Sara's room number; Sara asks them to leave the backpack at the front desk because she
   might be at breakfast.
3. **Daniel's message (about 6 p.m., lab):** he forgot to give the check-out time, offers a late
   check-out (ask by Monday) and asks if the charger fits her phone. **Sara asks for a late
   check-out until 1 p.m. on Tuesday** (here and in Say it, Professional). The desk has two kinds of
   charger (world: iPhone and USB-C; the content names no brand).
4. **Sunday morning (lab):** the backpack arrives while Sara is at breakfast in The Corner Café; the
   front desk calls her room, gets no answer, leaves a message and offers to bring it up; she
   collects it on her way back. A front-desk voice other than Daniel's (Emma).
5. **Sara checks the incidentals hold** with Daniel ("only a hold, not a charge?"): Say it,
   Professional.
6. **The learner's own booking** (Intermediate traps and Say it): under the name **Karimi**; room on
   the seventh floor, like Sara's (trap `on-the-floor`). `world.md` describes "you" only as staying at
   the Park Hotel with their own booking.
7. **In Natural phrases (both sets) the learner speaks as Sara** (says "Demir").

---

## Notes for the editor

### (a) Checks done

- **Regexes**, run in Node with copies of both `normalise()` functions (say-better for `found`,
  traps for `accept`/`reject`):
  - each `found` matches its own sentence and none of the other nine;
  - each accepts the variants listed in its table ("I'd like to check in", "How do I get on the
    WiFi?", "does the room include breakfast", "call me as soon as it arrives", "It's under Demir",
    "let me double-check", "is it one word", "is it possible to check out late", "hang on to it");
  - each rejects its habit ("I want to take my room", "I stay three nights", "connect the wifi",
    "breakfast is free?", "when it will arrive", "on the name of Demir", "is it possible that I go
    later", "can you receive it").
  - Each trap: `right` gives "right", the wrong sentence gives "wrong", and every extra form listed
    gives the result shown (right, also good, or self-fixed).
- **Shapes:** each `shown` minus `**` and with `‿` as a space equals its `sentence`; every bold part
  has two or more words; every Persian field has Persian letters; no `why.fa` has a backtick.
- **Limits:** A2 models 9–15 words (limit 25); B1 models 20–26 (limit 30); message sentences 99
  characters or fewer (limit 120); model replies 25–28 words (limit 40). Ids are new: trap ids don't
  clash with Day 1 or Day 2; Say-it and message ids start with `d3-`.
- **Each trap's `right` is natural US English:** "I have a reservation under the name Karimi.", "My
  room is on the seventh floor.", "What's the password for the Wi-Fi?", "My phone battery is dead.",
  "Can you lend me a charger?", "I'm staying here for three nights."
- **No contradictions found with Days 1–2:** the backpack is small and green and comes tomorrow 8–10
  (Days 1–2); Tom's car is still broken, so his message doesn't offer a ride; Day 2's `d2-tom-dinner`
  had Sara ask for the address, and Tom now names Rosa's; Day 2's RideNow pickup stays as it was (the
  reply only says "a RideNow at six forty"). Day 1's phrase "my phone was almost dead" leads into
  `phone-dead`. Intermediate content never mentions the lost phone or Mike.
- **No real brands** (the chargers aren't named); only `world.md` prices ($50 a night).

### (b) Open questions

1. **Rosa's: Tom's choice or Daniel's tip?** `world.md` lists Rosa's as "Daniel's tip for dinner",
   but the brief has Tom naming it. If Daniel recommends it at check-in, Tom's message reads oddly.
   Suggest rewording the world line to "Daniel knows Rosa's: ten minutes away by car."
2. **Voice for Message 4 (`d3-backpack`).** Emma is Sara's voice in the other Day 3 modules. Sara
   never speaks in Voice messages, and Day 1 used Emma for two senders, but a learner might hear it
   as Sara. Options: keep Emma, or make it Daniel (Brian), which needs "Daniel works Sunday
   morning". Message 4 also moves into Sunday morning, so drop it if Day 4 tells the backpack's
   arrival.
3. **Who says "Demir".** In Natural phrases the learner says Sara's name. In the Intermediate traps
   and Say it, "you" are Karimi. If that mix is confusing, A2 phrase #1 could be "Hi, I'm here to
   check in. The name's Karimi." (the regex doesn't depend on the name).
4. **Overlap with Day 1:** Day 1's Say-it item `hotel` is also "a booking under the name Rezaei".
   `d3-checkin` adds "I'm here to check in" and is the day's theme, so it's kept.
5. **Professional Say it has no lab spare** (3 items, all in the lesson). A spare, if wanted (it
   doesn't move Sara, so room 714 stays true):
   - `id` `d3-quiet-room` · `to` To Daniel at the front desk / به دنیل، در پذیرش هتل
   - `fa`: اتاقم رو به خیابون اصلیه و یه کم سر و صدا داره. اگه امشب اتاقی سمت حیاط خالی باشه، می‌شه عوضش کنم؟ اگه نه، اشکالی نداره.
   - `points`: your room faces Main Street and it's a little noisy / اتاقت رو به خیابان اصلی است و کمی سر و صدا دارد · if a courtyard room is free tonight, you'd like to move, but it's OK if not / اگر امشب اتاقی سمت حیاط خالی باشد، می‌خواهی جابه‌جا شوی، ولی اگر نباشد اشکالی ندارد
   - `models`: "My room's on the Main Street side, and it's a little noisy. If there's a courtyard room free tonight, could I switch? If not, that's fine." · "Would it be possible to move to the courtyard side tonight? My room's a bit noisy. No problem if you're full, though."
   - `hints`: on the Main Street side / رو به خیابون اصلی · switch rooms / اتاق عوض کردن
6. **Speech-to-text risk:** "Demir" and "Karimi" may come out wrong; no regex depends on them. "Wi-Fi"
   may be written "WiFi", "wifi" or "Wi-Fi"; every regex accepts all three (`wi ?fi`). "714" may
   come out as "seven fourteen"; the voice-message check is AI, so either works. As on Day 2, record
   each wrong trap sentence with a Persian accent before these ship ("in the seventh floor" may be
   quietly fixed).
7. **Code outside the content arrays** (not edited): `day-content.ts` needs `day-3` branches;
   `DAY_IDS` and a `DAY_THREE` pack in `day.ts`; the Day 2 tests check Day 2's counts (Day 3 has 6
   traps, a Professional Say-it set of 3, and voice messages only in Intermediate), so Day 3 needs its
   own tests; the voice-messages AI tone rule may need "To a friend, the airline and the hotel:
   polite but simple".
