# English Day 2: Natural phrases, Say it in English, Voice messages, Persian-speaker traps (draft)

Status: **draft, for review and owner approval.** Every fact comes from `world.md` (and Day 1);
anything new is listed in "Notes for the editor" at the end. US English. Each module is written in
its built format: the field names below are the ones in its `.ts` file.

| Module | Set | Track | Code | Spec |
|---|---|---|---|---|
| Natural phrases | A2 (copied from `ride-v2.md`) | Intermediate (A2) | `src/lib/practice/phrases.ts` | `docs/english-shadowing-spec.md` |
| Natural phrases | B1 (new) | Professional (B1+) | the same | the same |
| Say it in English | Intermediate (copied from `ride-v2.md`) | Intermediate | `src/lib/practice/say-in-english.ts` | `docs/english-say-in-english-spec.md` |
| Say it in English | Professional (new) | Professional | the same | the same |
| Voice messages | one set (A2+) | Both | `src/lib/practice/voice-messages.ts` | `docs/english-voice-messages-spec.md` |
| Persian-speaker traps | one set | Intermediate | `src/lib/practice/traps.ts` | `docs/english-traps-spec.md` |

**Daily lesson subsets.** Some sets are longer than their daily-lesson slot; the rest stays as Module
lab practice. Say it in English (Professional): 3 of 4 items. Voice messages (Intermediate): 2 of 4.
Traps (Intermediate): 5 of 8. Each section says which.

**Who "you" are.** In Say it in English (Professional) and Voice messages, the learner is Sara (the
Voice messages intro says so): Tom is "your friend", the backpack is "your" backpack. Sara isn't
named inside the items. (In the Intermediate Say-it set and the traps, "you" is just a passenger, as
in `ride-v2.md`.)

---

## 1. Natural phrases

Built format (`Phrase`): `sentence` (what Mira says), `shown` (`**bold**` = the chunk, `‿` = a link;
removing the marks gives `sentence`), `chunk`, `situation {en, fa}`, `tip {en, fa}` (English in
`backticks`), `found` (the word check, a regex run on the say-better `normalise()` output: lower
case, contractions spelled out, so "it'll" is "it will" and "don't" is "do not"). The habit each
chunk replaces is a content note, not a code field. Five sentences per set; the voice is Mira's.

### 1a. A2 set (Intermediate): copied from `ride-v2.md` (reviewed)

Order of the ride: **get in → explain where → ask the time → check how to pay → get out.**

| # | `situation` (en / fa) | `shown` (chunk in bold) | Habit it replaces | `tip` (en / fa) |
|---|---|---|---|---|
| 1 | You get into the taxi. / سوار تاکسی می‌شوی. | **Could you take me to** the Park Hotel, please? | "I want go to Park Hotel." / "Please go Park Hotel." | `Could you` runs together: `ku-ja`. / `Could you` را پیوسته بگو: `d` و `y` به هم می‌چسبند و «ج» می‌شوند، یعنی `ku-ja`. |
| 2 | The driver doesn't know your hotel. / راننده هتلت را بلد نیست. | It's **right across from** Central Station. | "It's in front of the station." (from «روبه‌روی») | `across` starts with a weak "uh": `uh-CROSS-frum`. / `across` با یک «اَ»ی خیلی کوتاه شروع می‌شود و تأکید روی `CROSS` است: `uh-CROSS-frum`. |
| 3 | You want to know how long the ride is. / می‌خواهی بدانی تا آن‌جا چقدر طول می‌کشد. | **How long does it take** to get there? | "How much does it take?" (from «چقدر طول می‌کشه») | `does it` runs together: `duh-zit`. / `does it` را پیوسته بگو: `duh-zit`. |
| 4 | Before you arrive, you check how to pay. / قبل از رسیدن، می‌پرسی کرایه را چطور می‌توانی بدهی. | **Do you take cards**, or is it cash only? | "Do you accept card?" (from «کارت قبول می‌کنید؟») | `Do you` is short and quick: `d'ya`. / `Do you` را کوتاه و سریع بگو: `d'ya`. |
| 5 | You've arrived at the hotel. / به هتل رسیده‌ای. | You can **drop me‿off** here, thanks. | "I get down here." (from «پیاده می‌شم») | `drop me‿off`: link them, `drop-mee-YOFF`. / `drop me off` را پیوسته بگو: بین `me` و `off` یک «ی» کوتاه می‌آید و تأکید روی `OFF` است: `drop-mee-YOFF`. |

`sentence` and `chunk` for each (the plain sentence is `shown` without the marks):

| # | `sentence` | `chunk` |
|---|---|---|
| 1 | Could you take me to the Park Hotel, please? | could you take me to |
| 2 | It's right across from Central Station. | right across from |
| 3 | How long does it take to get there? | how long does it take |
| 4 | Do you take cards, or is it cash only? | do you take cards |
| 5 | You can drop me off here, thanks. | drop me off |

**Word check** (copied from `ride-v2.md`; only the chunk, never the accent), with the `found` regex
text for it (tested against `normalise()`: each finds its own sentence, ignores the other nine
sentences of both sets, and rejects its habit):

| # | What it listens for (reviewed) | `found` (proposed) |
|---|---|---|
| 1 | could / can / would you (please) take me to | `/\b(could\|can\|would) you (please )?take (me\|us) to\b/` |
| 2 | across from (with or without "right"); "in front of" doesn't count | `/\bacross from\b/` |
| 3 | how long does / will / would / is / 's it (or the ride) (going to) take; "how much does it take" doesn't count | `/\bhow long('s\| does\| will\| would\| is) (it\|the ride) (usually \|normally \|going to )?take\b/` |
| 4 | do you take (credit / debit) card(s); "accept" doesn't count | `/\bdo you take (credit \|debit )?cards?\b/` |
| 5 | drop me / us off; "drop off me" doesn't count | `/\bdrop (me\|us) off\b/` |

### 1b. B1 set (Professional): new

The same five steps of the ride, one B1 chunk each, so the set still tells one short story. Each
chunk replaces a habit learners have (most come from Persian; #1 and #3 are English
overgeneralisations), and each tip has one sound feature only.

| # | `situation` (en / fa) | `shown` (chunk in bold) | Habit it replaces | `tip` (en / fa) |
|---|---|---|---|---|
| 1 | You get into a taxi with a heavy suitcase. / با یک چمدانِ سنگین در فرودگاه سوار تاکسی می‌شوی. | **Would you mind helping** me with my suitcase? | "Do you mind to help me…?" (an English overgeneralisation from "want to" / "like to", not from Persian) | In `mind helping`, the `d` almost disappears: `mine-HEL-ping`. / در `mind helping` صدای `d` تقریباً گفته نمی‌شود: `mine-HEL-ping`. |
| 2 | The driver doesn't seem to know your hotel. / راننده انگار هتلت را نمی‌شناسد. | It's pretty new. **Have you heard‿of‿it**? | "Have you heard it?" / "Did you hear its name?" (from «اسمش رو شنیدید؟») | `heard of it` runs together like one word: `HER-duh-vit`. / `heard of it` را پیوسته و مثل یک کلمه بگو: `HER-duh-vit`. |
| 3 | The highway is closed, so you go through downtown. / بزرگراه بسته است و از مرکز شهر می‌روید. | With all this traffic, **how long do you think it'll take**? | "Do you think how long it takes?" (from «فکر می‌کنید چقدر طول می‌کشه؟») / "How long do you think will it take?" (an English overgeneralisation of question order, not from Persian) | `it'll` is quick: `ID-ul`, not `it will`. / `it'll` را سریع بگو: `ID-ul`، نه `it will`. |
| 4 | The driver says to have some cash ready. / راننده می‌گوید بهتر است کمی پول نقد آماده داشته باشی. | I **don't have much cash‿on me**, so I'll pay by card. | "I don't have cash with me." (from «پول نقد همراهم نیست»): fine, but "on me" is the more natural spoken chunk | `cash on me`: link them, `CA-shon-mee`. / `cash on me` را پیوسته بگو: `sh` به `on` می‌چسبد، یعنی `CA-shon-mee`. |
| 5 | You've paid, and you're getting out. / کرایه را داده‌ای و داری پیاده می‌شوی. | Thanks for the ride. **Have a good one!** | "Good luck!" / "Don't be tired!" (from «موفق باشید» / «خسته نباشید») | `one` starts with a `w` sound, not `v`: `GOOD-wun`. / `one` با صدای `w` شروع می‌شود، نه `v`: لب‌هایت را گرد کن و بگو `GOOD-wun`. |

| # | `sentence` | `chunk` |
|---|---|---|
| 1 | Would you mind helping me with my suitcase? | would you mind helping |
| 2 | It's pretty new. Have you heard of it? | have you heard of it |
| 3 | With all this traffic, how long do you think it'll take? | how long do you think it'll take |
| 4 | I don't have much cash on me, so I'll pay by card. | don't have much cash on me |
| 5 | Thanks for the ride. Have a good one! | have a good one |

**Word check** (only the chunk; tested as above):

| # | What it listens for | `found` |
|---|---|---|
| 1 | would / do you mind + an -ing verb ("would you mind helping", "do you mind taking"); "mind to help" doesn't count | `/\b(would\|do) you mind (please )?\w+ing\b/` |
| 2 | heard of / heard about ("have you heard of it", "you might not have heard of it"); "have you heard it" and "did you hear it" don't count | `/\bheard (of\|about)\b/` |
| 3 | how long do you think it / the ride / this / that (will / would / 's going to) take(s); "do you think will it take" and "do you think how long it takes" don't count | `/\bhow long do you think (?:it\|the ride\|this\|that)(?: will\| would\|'s going to\|'s gonna\| is going to\| is gonna)? takes?\b/` |
| 4 | cash / money on me; "with me" is fine English but isn't the chunk, so it doesn't count | `/\b(cash\|money) on me\b/` |
| 5 | have a good / nice / great one / day / night; "good luck" doesn't count | `/\bhave a (good\|nice\|great) (one\|day\|night\|evening\|trip)\b/` |

**Where the B1 chunks are heard:** in the module itself, which plays each sentence before the
learner says it (the ride conversation in `ride-v2.md` stays as reviewed).

---

## 2. Say it in English

Built format (`SayItem`): `id`, `to {en, fa}`, `fa` (the message in spoken Persian), `points` (2,
each `{en, fa}`), `models` (natural versions; 2 here, each 25 words or fewer, the code's test
limit), `hints` (2, each `{en, fa}`). Plus one `NAMES` string per set (to help speech-to-text).
Four items per set. `fa`, points and hints are shown as plain text (no backticks are rendered there),
so they hold no English except names.

### 2a. Intermediate set: copied from `ride-v2.md` (reviewed)

All four `to`: **To the taxi driver / به رانندهٔ تاکسی.** (The `id`s are new; the rest is copied.)

| # | `id` | `fa` | `points` (en / fa) | `models` | `hints` (en / fa) |
|---|---|---|---|---|---|
| 1 | `trunk` | می‌شه چمدونم رو بذارید صندوق عقب؟ یه کم سنگینه. | you'd like help putting your suitcase in the trunk / می‌خواهی چمدانت را در صندوق عقب بگذارد · it's a little heavy / چمدانت کمی سنگین است | "Could you put my suitcase in the trunk, please? It's a little heavy." · "Can you help me with my suitcase? It's kind of heavy." | trunk / صندوق عقب · heavy / سنگینه |
| 2 | `museum` | می‌خوام برم موزهٔ شهر. روبه‌روی پارک مرکزیه. | you want to go to the City Museum / می‌خواهی به موزهٔ شهر بروی · it's across from Central Park / موزه روبه‌روی پارک مرکزی است | "Could you take me to the City Museum? It's right across from Central Park." · "The City Museum, please. It's across from Central Park." | take me to / من رو ببرید… · across from / روبه‌روی |
| 3 | `atm` | می‌شه سر راه جلوی یه خودپرداز نگه دارید؟ می‌خوام محض احتیاط یه کم پول نقد بگیرم. | you'd like to stop at an ATM on the way / می‌خواهی سرِ راه جلوی یک خودپرداز نگه دارد · you want some cash, just in case / می‌خواهی محض احتیاط کمی پول نقد بگیری | "Could we stop at an ATM on the way? I'd like some cash, just in case." · "Can you stop at an ATM on the way, please? I want to get some cash, just in case." | on the way / سرِ راه · just in case / محض احتیاط |
| 4 | `receipt` | همین‌جا پیاده می‌شم، ممنون. می‌شه یه رسید هم بدید؟ | you'd like to get out here / می‌خواهی همین‌جا پیاده شوی · you're asking for a receipt / رسید می‌خواهی | "You can drop me off here, thanks. Could I get a receipt?" · "Here's fine, thanks. Can I have a receipt, please?" | drop me off / پیاده می‌شم · a receipt / رسید |

- Traps on purpose: «صندوق عقب» is "trunk" (US), not "back box"; «روبه‌روی» is "across from", not
  "in front of"; #3 is where the learner says a link phrase (`just in case`) themselves.
- `NAMES`: "Park Hotel, Main Street, Central Station, City Museum, Central Park."

### 2b. Professional set: new

Four longer messages to people in Sara's day, in timeline order: paying the taxi, arriving at the
hotel, Tom about dinner, the RideNow driver that evening. Each needs a B1 move: a reason ("because,
so"), a condition ("if"), or a request about something that hasn't happened yet. Item 1 reuses B1
natural phrase #4 (`cash on me`, paying by card) for transfer.

**Daily lesson:** the Professional daily lesson uses 3 items: `pay-tip`, `hotel-bags`, `tom-dinner`.
`ridenow-pickup` (it overlaps Voice message 4) stays as lab practice.

**1. `id`: `pay-tip`**
- `to`: To the taxi driver / به رانندهٔ تاکسی
- `fa`: با کارت حساب می‌کنم، آخه پول نقد زیادی همراهم نیست. ده دلار هم انعام بذارید روش، که بشه شصت‌وپنج.
- `points`:
  1. you'll pay by card, because you don't have much cash on you / با کارت حساب می‌کنی، چون پول نقد زیادی همراهت نیست
  2. you want to add a ten-dollar tip, so it comes to sixty-five dollars / می‌خواهی ده دلار انعام اضافه کنی، که روی هم شصت‌وپنج دلار شود
- `models`:
  - "I'll pay by card, if that's OK. I don't have much cash on me. Could you make it sixty-five, with the tip?"
  - "Can I pay by card? I don't have much cash on me. Please add a ten-dollar tip. Let's make it sixty-five."
- `hints`: cash on me / پول نقد همراهم · make it sixty-five / بشه شصت‌وپنج
- Main trap: «همراهم نیست» → "with me"; «انعام بذارید روش» → "put the tip on it" (natural: "make it sixty-five", "add a tip").
- Facts: the fare is $55 (world); $10 is about 18%, inside the usual 15–20%.

**2. `id`: `hotel-bags`**
- `to`: To the hotel front desk / به پذیرش هتل
- `fa`: اتاقم تا ساعت سه آماده نمی‌شه، درسته؟ پس چمدونم رو این‌جا می‌ذارم و بعداً برمی‌گردم. راستی، فردا صبح شرکت هواپیمایی کوله‌پشتیم رو میاره این‌جا؛ اگه نبودم، می‌شه تحویلش بگیرید؟
- `points`:
  1. you want to leave your suitcase here until your room is ready / می‌خواهی تا آماده شدن اتاق، چمدانت را همین‌جا بگذاری
  2. the airline is bringing your backpack tomorrow morning, and you'd like them to take it if you're out / شرکت هواپیمایی فردا صبح کوله‌پشتی‌ات را می‌آورد و می‌خواهی اگر نبودی، آن را تحویل بگیرند
- `models`:
  - "Can I leave my suitcase here until three? Also, the airline's bringing my backpack tomorrow morning. Could you keep it for me if I'm out?"
  - "I'll leave my suitcase with you, then. The airline's dropping off my backpack tomorrow morning. Could you take it if I'm out?"
- `hints`: leave my suitcase with you / چمدونم رو این‌جا می‌ذارم · if I'm out / اگه نبودم
- Main trap: «تحویلش بگیرید» → "receive it" (stiff; natural: "take it", "keep it for me"); «اگه نبودم» → "if I wasn't" (natural: "if I'm out").
- Facts: check-in from 3 p.m., bags can be left at the desk (world); the backpack comes to the hotel tomorrow morning (Day 1).

**3. `id`: `tom-dinner`**
- `to`: To Tom, your friend in Riverton / به تام، دوستت در ریورتون
- `fa`: ساعت هفت عالیه! ماشینت که هنوز خرابه، پس نگران من نباش؛ خودم یه جوری میام رستوران. آدرس رو برام می‌فرستی؟
- `points`:
  1. he doesn't need to worry: you'll get to the restaurant on your own / لازم نیست نگران باشد؛ خودت به رستوران می‌روی
  2. you're asking him to send you the address / از او می‌خواهی آدرس را برایت بفرستد
- `models`:
  - "Seven's perfect! Your car's still broken, right? So don't worry about me. I'll get there on my own. Can you send me the address?"
  - "Seven works for me. Since your car's still in the shop, I'll find my own way there. Could you text me the address?"
- `hints`: on my own / خودم · text me the address / آدرس رو برام بفرست
- Main trap: «خودم میام» → "I come myself" (natural: "I'll get there on my own").
- Facts: dinner at 7 (world); Tom's car is still broken tonight (new, see notes). The restaurant isn't named, so nothing new is fixed about it.

**4. `id`: `ridenow-pickup`**
- `to`: To your RideNow driver / به رانندهٔ RideNow
- `fa`: سلام، من جلوی در اصلی هتل منتظرم. اگه این‌جا نمی‌تونید نگه دارید، اشکالی نداره؛ می‌تونم بیام اون طرف خیابون، جلوی ایستگاه.
- `points`:
  1. you're waiting at the hotel's main entrance / جلوی در اصلی هتل منتظر هستی
  2. if he can't stop there, you can cross the street to the station / اگر نتواند آن‌جا نگه دارد، می‌توانی به آن طرف خیابان، جلوی ایستگاه بروی
- `models`:
  - "Hi, I'm waiting at the main entrance of the hotel. If you can't stop here, no problem. I can cross the street to the station."
  - "Hi, I'm by the hotel's front door. If it's hard to pull over here, I can meet you across the street, at the station."
- `hints`: the main entrance / در اصلی · pull over / نگه دارید
- Main trap: «نگه دارید» → "keep here" / "hold here" (natural: "stop", "pull over"); «اون طرف خیابون» → "the other side of the street" is fine, "across the street" is shorter.
- Facts: the hotel is right across from Central Station; traffic near the station is bad today (world). Sara takes a RideNow to dinner (new, see notes).

- `NAMES`: "Park Hotel, Central Station, Tom, Riverton, RideNow."

---

## 3. Voice messages (both tracks, A2+)

Built format (`VoiceMessage`): `id`, `from {name, who {en, fa}, voice}`, `sentences` (one audio
request each; 120 characters or fewer, the code's test limit), `asks` (each `{ask {en, fa}, missed
{en, fa}}`), `model` (a natural reply, 40 words or fewer). Four messages; like Day 1, three have 2
asks and the last has 1. The natural reply is read by Mira (Ava, `b`). Voices: `a` Andrew, `c` Brian.
Timeline order: on the plane → after landing → in the taxi → that evening.

**Intro** (the built intro names Day 1's senders, so Day 2 needs its own; it's a constant in
`VoiceMessages.svelte`, not in the `.ts` file):
- en: "Today you're in Sara's place. You'll get four voice messages: from your friend Tom, the
  airline, the Park Hotel and your RideNow driver. Listen, then reply with a voice message. Make sure
  you answer their questions."
- fa: امروز جای سارا هستی. چهار پیام صوتی می‌گیری: از دوستت تام، شرکت هواپیمایی، هتل پارک و رانندهٔ تاکسی اینترنتی‌ات. گوش بده و با یک پیام صوتی جواب بده. حواست باشد به سؤال‌هایشان جواب بدهی.

### Message 1. `id`: `tom` (on the plane, before landing)

- `from`: name **Tom** · who: your friend in Riverton / دوستت در ریورتون · voice `c` (Brian)
- `sentences`:
  1. Hey, it's Tom. Bad news, I'm afraid.
  2. My car broke down this morning, so I can't pick you up at the airport.
  3. The easiest way is the Airport Express. Just follow the green signs, and it takes you to Central Station.
  4. Your hotel's right across from the station.
  5. Or take a taxi, if you're too tired. Let me know which one!
  6. And let's have dinner at seven tonight. Does that work for you?
- `asks`:
  1. ask: Will you take the train or a taxi? / با قطار می‌روی یا با تاکسی؟ · missed: You didn't say if you'll take the train or a taxi. / نگفتی با قطار می‌روی یا با تاکسی.
  2. ask: Is dinner at seven OK? / شام ساعت هفت برایت خوب است؟ · missed: You didn't say if dinner at seven is OK. / نگفتی شام ساعت هفت برایت خوب است یا نه.
- `model`: "Hi Tom, sorry about your car! My suitcase is really heavy and I'm tired, so I'll take a taxi. Dinner at seven sounds great. See you then!" (27 words; matches Sara's choice)

### Message 2. `id`: `baggage` (after landing)

- `from`: name **Baggage desk** · who: the airline / شرکت هواپیمایی · voice `a` (Andrew; Mike isn't in this scene)
- `sentences`:
  1. Hello, this is the airline's baggage desk at Riverton Airport, about your small green backpack.
  2. It's coming on the evening flight, so we can bring it to your hotel tomorrow morning.
  3. We have the Park Hotel on Main Street. Is that right?
  4. Our driver will come between eight and ten.
  5. Will you be there then, or should we leave it at the front desk?
  6. Thank you, and sorry again.
- `asks`:
  1. ask: Is the Park Hotel the right hotel? / هتل پارک درست است؟ · missed: You didn't say if the Park Hotel is right. / نگفتی هتل پارک درست است یا نه.
  2. ask: Will you be there between eight and ten, or should they leave it at the front desk? / ساعت هشت تا ده آن‌جا هستی، یا کوله‌پشتی را به پذیرش هتل بدهند؟ · missed: You didn't say if you'll be there or if they should leave it at the front desk. / نگفتی آن‌جا هستی یا کوله‌پشتی را به پذیرش بدهند.
- `model`: "Hi, thanks for your message. Yes, it's the Park Hotel on Main Street. I'm not sure I'll be there, so please leave it at the front desk." (27 words)

### Message 3. `id`: `hotel` (in the taxi)

- `from`: name **Park Hotel** · who: your hotel / هتلت · voice `c` (Brian; Tom isn't in this scene)
- `sentences`:
  1. Hi, this is Daniel at the front desk of the Park Hotel.
  2. Just so you know, check-in is at three, so your room won't be ready before then.
  3. But you can leave your bags with us and come back later.
  4. What time do you think you'll get here?
  5. And will you need any help with your bags when you arrive?
  6. See you soon!
- `asks`:
  1. ask: What time will you get to the hotel? / چه ساعتی به هتل می‌رسی؟ · missed: You didn't say when you'll get there. / نگفتی چه ساعتی به هتل می‌رسی.
  2. ask: Do you need help with your bags? / برای بردن وسایلت کمک لازم داری؟ · missed: You didn't say if you need help with your bags. / نگفتی برای بردن وسایلت کمک لازم داری یا نه.
- `model`: "Hi Daniel, thanks. I'm in a taxi now, so I'll be there in about forty minutes. And yes, please. My suitcase is really heavy." (24 words)

### Message 4. `id`: `ridenow` (that evening, going to dinner)

- `from`: name **Carlos** · who: your RideNow driver / رانندهٔ تاکسی اینترنتی‌ات · voice `c` (Brian; Tom isn't in this scene)
- `sentences`:
  1. Hi, this is Carlos, your RideNow driver.
  2. I'm on Main Street, but the traffic by the station is really bad, so I can't stop at your hotel door.
  3. Right now I'm across the street, in front of Central Station. It's a white car.
  4. Can you cross the street and meet me here?
  5. Or I can drive around to the hotel door, but that's about ten minutes.
  6. Just let me know. Thanks!
- `asks`:
  1. ask: Will you cross the street, or should he come to the hotel door? / از خیابان رد می‌شوی و پیشش می‌روی، یا او دور بزند و جلوی در هتل بیاید؟ · missed: You didn't say if you'll cross the street or if he should come to the hotel door. / نگفتی از خیابان رد می‌شوی یا او بیاید جلوی در هتل.
- `model`: "Hi Carlos, no problem. I'll cross the street and meet you in front of the station. I'll be there in two minutes." (22 words)

- `NAMES`: "Tom, Airport Express, Central Station, Riverton, Park Hotel, Main Street, Daniel, Carlos, RideNow."

---

## 4. Persian-speaker traps (Starter)

Built format (`Trap`): `id`, `kind {en, fa}`, `words` (the sentence with the mistake, word by word),
`wrong` (index of the word to tap), optional `alsoOk` (`{index, sentence}`), `right`, `why {en, fa}`,
`accept` and `reject` (regex text, run on the traps `normalise()`: lower case, plain quotes, no
punctuation; contractions are **not** spelled out here), optional `alsoGood {patterns, word}`. Eight
traps, none of Day 1's (he/she, agree, say/tell, age, since/for, than, afraid of, bored). Following
the built ones and the code's test, `why.fa` has no backticks: English goes in «», and the screen
keeps its direction.

All eight were run through the code's checks: `right` passes, the sentence with the mistake fails,
and the extra forms listed pass.

**1. `id`: `been-waiting`** · `kind`: I've been waiting / I’ve been waiting
- `words`: `["I'm", "waiting", "here", "for", "twenty", "minutes.", "Where's", "the", "bus?"]` · `wrong`: 0 (`I'm`)
- `right`: I've been waiting here for twenty minutes. Where's the bus?
- `why` en: For something that started earlier and is still going on, say “I’ve been waiting”, not “I’m waiting”.
- `why` fa: در فارسی می‌گوییم «بیست دقیقه است منتظرم». در انگلیسی برای کاری که قبلاً شروع شده و هنوز ادامه دارد، «I’ve been waiting» می‌گوییم، نه «I’m waiting».
- `accept`: `/\b(?:i've|i have|ive) been waiting\b/`
- `reject`: `/\b(?:i'm|i am|im) waiting\b/`
- `alsoGood`: patterns `/\b(?:i've|i have|ive) waited\b/` · word "been waiting"
- From this trip: Bus 7 comes every 30 minutes (world).

**2. `id`: `to-not-until`** · `kind`: to (a place) / to (مقصد)
- `words`: `["How", "much", "is", "it", "until", "the", "Park", "Hotel?"]` · `wrong`: 4 (`until`)
- `right`: How much is it to the Park Hotel?
- `why` en: “Until” is for time (until three). For the place you’re going to, use “to”.
- `why` fa: «تا» در فارسی هم برای زمان است هم برای مکان. در انگلیسی «until» فقط برای زمان است (until three). برای مقصد «to» می‌گوییم: «to the Park Hotel».
- `accept`: `/\bto (?:the )?park hotel\b/`
- `reject`: `/\b(?:until|till|til) (?:the )?park hotel\b/`
- Also passes: "How much to the Park Hotel?"

**3. `id`: `near-of`** · `kind`: near (no “of”) / near (بدون of)
- `words`: `["Is", "the", "hotel", "near", "of", "Central", "Station?"]` · `wrong`: 4 (`of`)
- `right`: Is the hotel near Central Station?
- `why` en: “Near” doesn’t need “of”. Say “near the station”.
- `why` fa: در فارسی می‌گوییم «نزدیکِ ایستگاه» و همین کسره باعث می‌شود «of» اضافه کنیم. ولی «near» خودش کافی است: «near the station».
- `accept`: `/\bnear (?:the )?central station\b/`
- `reject`: `/\bnear of\b/`
- `alsoGood`: patterns `/\b(?:close to|next to|across from) (?:the )?central station\b/` · word "near"

**4. `id`: `how-long`** · `kind`: how long (time) / how long (زمان)
- `words`: `["How", "much", "does", "it", "take", "to", "get", "there?"]` · `wrong`: 1 (`much`)
- `right`: How long does it take to get there?
- `why` en: “How much” asks about money or amounts. For time, ask “How long”.
- `why` fa: در فارسی می‌گوییم «چقدر طول می‌کشد»، ولی «how much» در انگلیسی برای پول و مقدار است. برای زمان «how long» می‌گوییم.
- `accept`: `/\bhow long(?:'s| does| will| would| is| do you think)\b/`
- `reject`: `/\bhow much (?:does|will|would|is) it (?:going to )?take\b/`
- `alsoGood`: patterns `/\bhow much time\b/` · word "long"
- Also passes: "How long will it take?", "How long's it going to take?"

**5. `id`: `bad-traffic`** · `kind`: bad traffic / bad traffic
- `words`: `["The", "traffic", "is", "very", "much", "today."]` · `wrong`: 4 (`much`)
- `right`: The traffic is very bad today.
- `why` en: In English, traffic is “bad” or “heavy”, not “much”.
- `why` fa: در فارسی می‌گوییم «ترافیک خیلی زیاد است»، ولی در انگلیسی ترافیک «bad» یا «heavy» است، نه «much».
- `accept`: `/\btraffic(?: is|'s) (?:really |very |so |pretty )?(?:bad|heavy|terrible|awful)\b/`
- `reject`: `/\btraffic(?: is|'s) (?:very |so |too )?much\b/`
- `alsoGood`: patterns `/\b(?:a lot of|lots of|so much|too much) traffic\b/` · word "bad"
- From this trip: the highway is closed, and the traffic near the station is bad (world).

**6. `id`: `by-card`** · `kind`: pay by card / pay by card
- `words`: `["Can", "I", "pay", "with", "card?"]` · `wrong`: 3 (`with`)
- `alsoOk`: index 4 (`card?`), sentence "Can I pay with a card?"
- `right`: Can I pay by card?
- `why` en: Say “pay by card” or “pay with a card”, not “with card”.
- `why` fa: در فارسی می‌گوییم «با کارت»، بدون هیچ کلمهٔ دیگری. در انگلیسی یا «by card» می‌گوییم، یا «with a card».
- `accept`: `/\bpay (?:by|with (?:a|my|your|the)) (?:credit |debit )?card\b/`
- `reject`: `/\bpay with (?:credit |debit )?card\b/`
- Also passes: "Can I pay with a card?", "Can I pay with my credit card?"

**7. `id`: `get-out`** · `kind`: get out (of a car) / get out (از ماشین)
- `words`: `["I'll", "get", "down", "here,", "thanks."]` · `wrong`: 2 (`down`)
- `right`: I'll get out here, thanks.
- `why` en: You “get out of” a car or a taxi, and “get off” a bus or a train. “Get down” means to go lower, like off a chair.
- `why` fa: در فارسی از ماشین و اتوبوس هر دو «پیاده می‌شویم». در انگلیسی از ماشین و تاکسی «get out» و از اتوبوس و قطار «get off». «get down» یعنی پایین آمدن، مثلاً از صندلی.
- `accept`: `/\bget out\b/`
- `reject`: `/\bget down\b/`
- `alsoGood`: patterns `/\bdrop (?:me|us) off\b/`, `/\bhere(?:'s| is) fine\b/` · word "out"

**8. `id`: `help-with`** · `kind`: help with / help with
- `words`: `["Can", "you", "help", "me", "for", "my", "suitcase?"]` · `wrong`: 4 (`for`)
- `right`: Can you help me with my suitcase?
- `why` en: You help someone “with” something, not “for” it.
- `why` fa: در فارسی می‌گوییم «برای چمدانم کمکم کن»، ولی در انگلیسی بعد از «help me» کلمهٔ «with» می‌آید، نه «for».
- `accept`: `/\bhelp me with\b/`
- `reject`: `/\bhelp me for\b/`
- `alsoGood`: patterns `/\bhelp me (?:carry|take|lift|get)\b/`, `/\bgive me a hand\b/` · word "with"
- From this trip: Sara's big gray suitcase is heavy (world).

**Candidates left out**
- "I want go to…": the mistake is a missing word ("to"). The built module only taps a wrong word; the
  spec puts missing words in a later "insert a word" mode.
- "The bus is more cheap": Persian makes comparatives with «‑تر», like English "-er", so this isn't a
  mistake that comes from Persian. (Day 1 also has a comparative trap, "taller from".)
- "in front of" for "across from": three words, so there's no single word to tap, and "The hotel is in
  front of the station" isn't wrong without the story. It's taught in Natural phrases A2 #2 instead.
- "Do you accept card?": "accept" is fine English, so the only mistake is the missing "s", which is
  close to the "with card" trap. It's taught in Natural phrases A2 #4 instead.

---

## Notes for the editor

### (a) New facts to add to `world.md`

1. **The airline's baggage desk** (voice Andrew; a new character, never in a scene with Mike) sends a
   voice message after Sara lands: the backpack is on the evening flight (Day 1) and will be
   delivered to the Park Hotel **tomorrow between 8 and 10 a.m.**, or left at the front desk.
2. **The front desk's message reaches Sara during the taxi ride** (Daniel: check-in at 3, leave your
   bags, "What time do you think you'll get here?", help with bags). `world.md` step 5 puts "the
   front desk's message" at the hotel; this makes it a voice message sent before she arrives.
3. **Tom's car is still at the garage tonight**, so Sara gets to dinner on her own and asks Tom for
   the restaurant's address (the restaurant isn't named).
4. **Sara takes a RideNow to dinner.** Carlos, in a white car, can't stop at the hotel door because of
   the traffic by the station; he waits across the street in front of Central Station, and she
   crosses.
5. **Sara pays Mike by card and adds a $10 tip ($65 in all).**
6. In Say it in English (Confident) and Voice messages, **the learner stands in Sara's place** and
   isn't named.
7. Traps #1: a generic wait of twenty minutes for the bus (not Sara's).

### (b) Couldn't fit or unsure

1. **Sara's phone in the evening.** She leaves her phone in the taxi when she reaches the hotel, but
   Say-it #3–4 and Voice message 4 need it that evening. `world.md` step 7 (Tom texts, Sara reads
   RideNow reviews) already assumes she has it back. The role-play file (`conversation.md`) should say
   how she gets it back, for example Mike brings it to the hotel.
2. **B1 chunk choices.** Of the five candidates, "right across from" and "drop me off" are already the
   A2 set's chunks (#2, #5), and "across from" is A2. I replaced them with "Have you heard of it?" and
   "Have a good one!" ("Good luck" and "Don't be tired" are real Persian-speaker goodbyes). If you'd
   rather keep the owner's two, either fits in place of #2 or #5. "drop me off" is still heard in the
   conversation.
3. **No B1 chunk is in the conversation yet.** The changes are in the table in section 1b: lines 2,
   7, 8 and 11 change and line 13 is new (about +30 words, so about 170). All A2 chunks stay, but A2
   #5 would be heard as "dropping me off". The ride-v2 automatic check "every phrase chunk appears in
   the conversation" then needs to allow "-ing" forms. B1 #3 is only heard as "I think it'll take"
   (line 7) and as "What time do you think you'll get here?" (Daniel). Putting the full question in
   Sara's line 6 would remove A2 #3 ("How long does it take").
4. **The lost-phone item was left out of Say it in English (Confident) on purpose.** In the Confident
   lesson, Say it comes right before the role-play, so the item would give away the role-play's
   surprise. A spare, if the surprise is something else:
   - `id` `lost-phone` · `to` To Riverton Taxi / به تاکسی ریورتون
   - `fa`: سلام، امروز با یکی از تاکسی‌هاتون از فرودگاه اومدم هتل پارک و گوشیم رو تو ماشین جا گذاشتم. می‌شه از راننده بپرسید؟
   - `points`: you left your phone in one of their taxis (airport → Park Hotel) / گوشی‌ات را در یکی از تاکسی‌هایشان جا گذاشته‌ای (از فرودگاه تا هتل پارک) · you're asking them to check with the driver / از آن‌ها می‌خواهی از راننده بپرسند
   - `models`: "Hi, I left my phone in one of your taxis today, from the airport to the Park Hotel. Could you check with the driver?" · "I think I left my phone in one of your taxis. It took me from the airport to the Park Hotel. Can you check?"
   - `hints`: I left my phone / گوشیم رو جا گذاشتم · check with the driver / از راننده بپرسید
5. **Three of the four voice messages use Brian** (Tom, Daniel, Carlos). Each is its own scene, as in
   Day 1, where the clinic shares Sara's voice. The airline uses Andrew so that two Brian messages
   never come one after the other at the start.
6. **Code and prompts outside the content arrays** (not edited):
   - the Voice messages intro is a constant in `VoiceMessages.svelte`; the Day 2 version is above;
   - `src/lib/server/voice-messages-ai.ts` names "Mr Brown and the clinic" in its tone rule, which
     needs to become per-day (for example "To the hotel, the airline and a driver: polite but
     simple");
   - `say-in-english.ts` and its AI prompt say A2. The Confident models are B1, so the "better"
     version may need a B1 level for that set.
7. **Formatting of Persian text.** Backticks are rendered only in Natural phrases tips, so they're
   used there. Say-it and Voice-message Persian is plain text (no backticks are rendered), and
   `why.fa` in traps must not contain backticks (a code test). In those fields, English names stay
   plain or go in «».
   - One place keeps "RideNow" in Latin script inside Persian: the Say-it #4 `to`, «به رانندهٔ
     RideNow». Elsewhere it's «تاکسی اینترنتی». The Persian reviewer should check this.
8. **Speech-to-text risk for the traps** (as the spec says): it may quietly fix "near of", "with
   card" or "how much does it take". Record each wrong sentence with a Persian accent before these
   ship.
9. **The A2 `found` regexes are mine**, not reviewed. `ride-v2.md` gives the word check only in prose.
10. **Voice message 1's model has Sara take a taxi**, as in the story. The AI accepts either choice.
