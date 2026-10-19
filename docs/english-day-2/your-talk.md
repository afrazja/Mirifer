# English Day 2: "Your talk" modules (content draft v2)

Status: **draft, for review and owner approval.** All four modules are on the **Professional (B1+)**
track (formerly "Confident"). Every fact comes from `world.md`; anything new is listed in "Notes for
the editor" at the end. US English. In the code, apostrophes are curly (’); they're straight here
for easy reading.

| # | Module | Built in | Spec |
|---|---|---|---|
| 1 | Tell your story ("Say it again, better") | `say-better.ts`, `say-better-lab.ts`, `server/say-better-ai.ts`, `day.ts` | `english-say-it-better-spec.md`, `english-say-better-lab-spec.md` |
| 2 | Speaking card | `speaking-card.ts` | `english-speaking-card-spec.md` |
| 3 | 60-second free talk | `free-talk.ts` | `english-free-talk-spec.md` |
| 4 | Read, rate, respond | `read-rate.ts`, `server/read-rate-ai.ts` | `english-read-rate-spec.md` |

Personal prompts here are about the learner's own life and habits, never about Sara, and never
about health, money amounts, religion, politics, relationships or exactly where they live.

---

## 1. Tell your story ("Say it again, better")

Day 1 asked for a problem on a trip. Day 2 asks for a taxi ride that went wrong, or one that went
surprisingly well. It links back to Sara's ride: the plan changed (the highway was closed).

Everything not listed here stays as built: 1 minute, 10-second minimum, up to 3 fixes, "strong"
at 40+ words, "Tell me a bit more" under 15 words (daily version); 45 s, up to 2 focus fixes
(lab version).

### 1a. Daily-lesson version (`DayModule` in `day.ts` + `server/say-better-ai.ts`)

| Field | en | fa |
|---|---|---|
| `id` | `say-it-better` | – |
| `title` | Tell your story (as Day 1) | داستانت را بگو (as Day 1) |
| `short` | Story (as Day 1) | داستان (as Day 1) |
| `does` | Tell a short story about a taxi ride you remember, then tell it a second time, clearer. | ماجرای کوتاهی از یک سفر با تاکسی که یادت مانده تعریف کن، بعد یک بار دیگر روشن‌تر بگو. |
| `intro` (Mira, spoken) | In today's story, Sara's taxi ride didn't go quite as planned. Now it's your turn. Tell me about a taxi ride that went wrong, or one that went surprisingly well. A ride you booked on an app counts too. You have one minute. Then you'll see how to say it better, and you can try again. | در داستان امروز، سفر سارا با تاکسی دقیقاً طبق برنامه پیش نرفت. حالا نوبت توست. از یک سفر با تاکسی برایم بگو که بد پیش رفت، یا برعکس، خیلی بهتر از انتظارت بود. سفر با تاکسی اینترنتی هم قبول است. یک دقیقه وقت داری. بعد می‌بینی چطور بهترش بگویی و می‌توانی دوباره امتحان کنی. |
| `skill` / `minutes` / `built` | speaking / as Day 1 (`{15: 4, 20: 4}`) / owner's call | – |

**`QUESTION`** (server, English only; also the speech-to-text context `They are answering: "…"`):

> Tell me about a taxi ride that went wrong, or one that went surprisingly well.

**"Need ideas?"** (three prompts; English only in the built component, so no Persian):

1. Where were you going?
2. What happened on the way?
3. How did it end?

**AI brief (feedback prompt).** The built `feedbackPrompt()` stays word for word, except for the
two day-specific parts:

- The question it quotes: `The learner answered: "Tell me about a taxi ride that went wrong, or one that went surprisingly well."`
- The on-topic line:
  > "onTopic": true only if the answer, in English, tells about a ride in a taxi, a car booked on an app, or another ride where someone else drove (a shuttle, a bus, a friend's car), whether it went wrong or went surprisingly well.

The built mistake order ("past tense kept steady through the story" first) already suits a story.

What this prompt tends to bring out (for the English-coach reviewer): past tense held through the
story; "get out of the taxi" (not "get off/down the taxi", from «پیاده شدن»); "I told him" or "I
said to him" (not "I said him"); "I left my phone in the taxi" (not "my phone remained in the
taxi", from «جا ماندن»); "the driver didn't know the way"; "on the way". "Take a taxi", "catch a
taxi/cab" and "ride in a taxi" are all correct English: the AI never marks them as mistakes.

### 1b. Module lab version (`LabQuestion` in `say-better-lab.ts`)

| Field | Value |
|---|---|
| `id` | next free id (7), or 1 in a Day 2 list |
| `text` | Tell me about a taxi ride that went wrong, or one that went surprisingly well. |
| `topic` (on-topic check) | a ride in a taxi, a car booked on an app, or another ride where someone else drove, that went wrong or went surprisingly well |
| `tense` ("it usually needs the …") | past simple |

The lab's own instruction ("I'll ask you a question. Answer in about thirty seconds…") is fixed in
the built screen and doesn't change.

---

## 2. Speaking card

One card about getting around: taxis, ride apps, or buses and trains, from the learner's own
experience. It's about habits (present tense), so it doesn't overlap Tell your story (one past
ride). Built shape: three "You should say" points and one "and explain…" point; `past: false` (so
the past-only phrases "The hardest part was…" and "Looking back,…" aren't offered).

| Field | en | fa |
|---|---|---|
| `id` | next free id (7), or 1 in a Day 2 list | – |
| `past` | `false` | – |
| `title` | Describe how you usually get around your city: taxis, ride apps, or buses and trains. | تعریف کن معمولاً در شهرت چطور رفت‌وآمد می‌کنی: با تاکسی، تاکسی اینترنتی یا اتوبوس و مترو. |
| `points[0]` | which one you use most | از کدام بیشتر استفاده می‌کنی |
| `points[1]` | what a usual trip is like | یک رفت‌وآمد معمولی‌ات چطور است |
| `points[2]` | when you choose something else (for example, late at night or with heavy bags) | کی سراغ یک گزینهٔ دیگر می‌روی (مثلاً آخر شب یا وقتی چمدان سنگین داری) |
| `points[3]` | and explain why it's the best choice for you | و توضیح بده چرا برای تو بهترین انتخاب است |

**Checked against the code's "reading the card aloud" rule** (`cardShare`: a quote is rejected if
70% or more of its content words come from the point). The options (taxi, app, bus, train) are in
the title, not the points, so a natural answer still counts:
- "I use the metro most" → 2 of 3 words from point 1 (67%): counts.
- "A usual trip takes twenty minutes" → 2 of 5 (40%): counts.
- "Late at night I take a taxi" → 2 of 4 (50%): counts. (Point 3 says "choose", not "take", on purpose: with "take" this answer would be 75% and rejected.)
- "Because it's cheap and fast" → 0%: counts.

No AI text is card-specific: the coverage and feedback prompts build themselves from the card, and
speech-to-text gets the title. Mira's instruction is fixed in the built screen.

---

## 3. 60-second free talk

A surprise topic, no preparation, 60 seconds. Built shape: each topic is one `DisplayText`. The
spec says a run never repeats the previous topic, so a Day 2 set needs at least two topics; here
are three. **Topic 1 is the main one** (from the world's personal topics); 2 and 3 are for
"Another topic".

| # | `en` | `fa` | From the world |
|---|---|---|---|
| 1 | When people tip where you live | جایی که زندگی می‌کنی، مردم کی انعام می‌دهند | "Tipping: what's normal where you live?" |
| 2 | Getting home from the airport | برگشتن از فرودگاه به خانه | "How you usually get from the airport to your hotel or home" |
| 3 | What makes a good taxi driver | رانندهٔ تاکسیِ خوب از نظر تو | "What makes a good taxi driver" (Mike is kind and talkative, but doesn't know the new hotel) |

All three are light and need no preparation at B1. Topic 1 asks when people tip (in a taxi, at a
restaurant, and so on), so it stays on the custom and never goes to money amounts. No AI judging:
the only text the server uses is the topic, as speech-to-text context (`They are talking for a
minute about: "…"`).

---

## 4. Read, rate, respond

The built module runs as a round of **three texts** (the result screen counts "out of three"), so
Day 2 has three short real-life texts from the world: **the RideNow reviews (timeline step 8, the
main one)**, the airport's travel update (step 2), and the Park Hotel's "Getting here" page. Each
has a different task, so the three replies don't all say "train or taxi".

Built shape per text: `id`, `kind` (en/fa), `title` (English), `body` (paragraphs, English only),
`glosses` (2–3 harder words, each exactly as written in the body, with Persian), `rate` (stars, or
two choices with en/fa), `task` (en/fa). New for Day 2: `fixStart` (English only), the opening
words of the AI's fix for that text (see "AI brief" below).

**English inside Persian:** the read-rate components don't parse backticks (they would show on
screen), so English in a Persian line is written bare (names: RideNow, Park Hotel) or in «»
(a word being explained: «way»), as Day 1's read-rate does with «pretty».

### Text 1: RideNow reviews (Sara reads these before dinner)

| Field | Value |
|---|---|
| `id` | `ridenow-reviews` |
| `kind` | en: App reviews · fa: نظر مسافرها دربارهٔ یک اپ تاکسی اینترنتی |
| `title` | RideNow in Riverton · Reviews |
| `fixStart` | The reviews say |

`body` (three paragraphs, about 105 words):

1. Jen K. (5 stars): So easy from the airport! The pickup zone is on level 2 of the parking garage, and my driver got there in five minutes. It was $38 to downtown, way cheaper than a taxi.
2. Omar R. (2 stars): Be careful on Friday and Saturday nights. I booked a ride to a restaurant downtown at 7 p.m., and the price was almost double because of surge pricing. And you can only pay in the app, so you need data on your phone.
3. Lisa M. (4 stars): The drivers are friendly, and the cars are clean. One driver canceled on me, but I got another one in a few minutes. At busy times, book a little early, just in case.

`glosses`:

| `word` | `fa` |
|---|---|
| way cheaper | خیلی ارزان‌تر (اینجا «way» یعنی «خیلی») |
| surge pricing | گران شدن کرایه در ساعت‌های شلوغ (همان «ضریب») |
| canceled on me | سفرم را لغو کرد |

| Field | en | fa |
|---|---|---|
| `rate` | kind: `stars` · ask: How good is RideNow? | به نظرت RideNow چقدر خوب است؟ |
| `task` | It's Saturday, and you need a ride to a restaurant downtown at 7 tonight. Would you use RideNow? Tell a friend why or why not. Use two details from the reviews. | امروز شنبه است و امشب ساعت ۷ باید به رستورانی در مرکز شهر بروی. با RideNow می‌روی یا نه؟ به یک دوست بگو چرا. از دو نکتهٔ همین نظرها استفاده کن. |

Details a reply can use: the pickup zone on level 2; a driver in five minutes; $38, cheaper than a
taxi; nearly double at 7 p.m. on weekend nights (surge); pay in the app only; you need data;
friendly drivers, clean cars; a driver may cancel; book early at busy times.

### Text 2: Travel update at the airport (what Sara sees when she lands)

| Field | Value |
|---|---|
| `id` | `airport-notice` |
| `kind` | en: A notice at the airport · fa: اطلاعیهٔ فرودگاه |
| `title` | Riverton Airport · Travel update |
| `fixStart` | The notice says |

`body` (three paragraphs, about 60 words):

1. Route 9, the highway to downtown, is closed today because of an accident. Cars and buses are going through downtown streets instead.
2. Expect delays of 10 minutes or more, and heavy traffic near Central Station.
3. The Airport Express is running normally: trains every 15 minutes, and 25 minutes to Central Station. Follow the green signs.

`glosses`:

| `word` | `fa` |
|---|---|
| instead | به‌جایش |
| Expect delays | احتمال تأخیر هست |
| running normally | طبق روال عادی حرکت می‌کند |

| Field | en | fa |
|---|---|---|
| `rate` | kind: `choice` · ask: What should your friend take today? | دوستت امروز با کدام برود؟ |
| `rate.options` | The train · A taxi | با قطار · با تاکسی |
| `task` | A friend has just landed in Riverton and is going downtown. Leave them a voice message: should they take the train or a taxi today? Tell them why, and mention one thing from the notice. | یکی از دوستانت تازه به فرودگاه ریورتون رسیده و می‌خواهد به مرکز شهر برود. برایش یک پیام صوتی بفرست: امروز با قطار برود یا با تاکسی؟ بگو چرا، و به یک نکته از همین اطلاعیه هم اشاره کن. |

Both answers can be argued: the train is on time today, but a taxi is door to door (the learner's
own reason, which the AI never marks wrong).

### Text 3: The Park Hotel's "Getting here" page

| Field | Value |
|---|---|
| `id` | `hotel-getting-here` |
| `kind` | en: A hotel web page · fa: صفحهٔ سایت یک هتل |
| `title` | The Park Hotel · Getting here |
| `fixStart` | The page says |

`body` (three paragraphs, about 100 words):

1. We're at 210 Main Street, downtown, right across from Central Station. We opened last year, so some taxi drivers don't know us yet. Just tell them we're across from the station.
2. By train: take the Airport Express from under the terminal (follow the green signs). Trains leave every 15 minutes, and the trip to Central Station takes 25 minutes. Then just cross the street. The last train is at 11:30 p.m.
3. By taxi: it's 30 to 40 minutes, depending on traffic, and about $55, plus a tip. Check-in is from 3 p.m., but you can leave your bags at the front desk before that.

`glosses`:

| `word` | `fa` |
|---|---|
| right across from | درست روبه‌روی |
| plus a tip | به‌اضافهٔ انعام |
| leave your bags | چمدان‌هایت را بسپاری |

| Field | en | fa |
|---|---|---|
| `rate` | kind: `stars` · ask: How helpful is this page? | این صفحه چقدر مفید است؟ |
| `task` | A friend is staying at the Park Hotel. Send them this page with a short voice message: say what's useful in it, and one thing it doesn't tell them. | یکی از دوستانت در Park Hotel می‌ماند. این صفحه را با یک پیام صوتی کوتاه برایش بفرست: بگو چه چیزی در آن به دردش می‌خورد، و یک چیز را که این صفحه به او نمی‌گوید. |

### AI brief and speech-to-text for these texts

The built `readRatePrompt()` is shared by every text and stays as it is, with **one line changed**:
the fix's first words come from the text's own `fixStart` field (the built line hard-codes the lab
texts' "The review says", "Leila says" and "The ad says"):

> "fix": if false, one short sentence starting "{fixStart}" (e.g. "The reviews say you can only pay in the app.", "The page says the taxi takes 30 to 40 minutes."); otherwise "".

The user message (`readRateUser`) builds itself from the text, task and rating: no change.

Speech-to-text context (the route's line): `They are giving their opinion about a short text they
just read: a review, a notice or a web page.` Names that may come up (`NAMES` in the route):

| Text | Names |
|---|---|
| `ridenow-reviews` | RideNow, Jen, Omar, Lisa. |
| `airport-notice` | Riverton, Route 9, Airport Express, Central Station. |
| `hotel-getting-here` | Park Hotel, Main Street, Central Station, Airport Express. |

---

## Notes for the editor

**(a) New facts, to add to `world.md`:**

1. **RideNow reviewers:** Jen K. (5 stars), Omar R. (2 stars), Lisa M. (4 stars). The world has
   their main facts ($38, a driver in 5 minutes, almost double at 7 p.m. on weekend nights, some
   cancellations); not yet Lisa's "friendly drivers, clean cars; another driver comes in a few
   minutes; book early at busy times".
2. **The Park Hotel's "Getting here" page** doesn't mention Bus 7 or RideNow (a reply to Text 3 can
   name either as "one thing it doesn't tell them").
3. **Track name:** `world.md` still calls the B1+ track "Confident"; `README.md` and this file say
   "Professional".

**(b) Still open:**

1. **How many items per module.** Each item matches its built shape and counts (4 card points, 2–3
   glosses, 2 rate options, 3 ideas, and so on). But the lab sets hold 6 questions, 6 cards and 12
   topics, while Day 2 gives 1, 1 and 3. If "Day 2 chosen" in the lab must replace a whole set,
   "Another question" and "Another card" will have nothing new to show. Read, rate, respond has its
   full three texts.
2. **Read, rate, respond needs small code changes:** a `fixStart` field per text (the prompt's fix
   starts are hard-coded for the lab texts), and the speech-to-text line ("a review, a message or
   an ad") and `NAMES` are hard-coded too. The Day 2 texts can't run as specified until those take
   the wording above.
3. **Overlap.** The speaking card overlaps the lab's free-talk topic "How you get around your city"
   and, a little, the check-in question. Free-talk topic 2 is close to the check-in question
   (airport → home, not → hotel). Tell your story may bring back the learner's Day 1 story if it
   was a taxi problem. Other files (Choose and persuade, Quick-fire) may also use the world's
   personal topics.
4. **Tell your story isn't in the Professional daily lesson** (`README.md`). The daily-lesson
   fields (`does`, `intro`) are written anyway, in case the owner adds it.
5. **Card point 3** is longer than the built cards' points, because of the example in brackets.
   It's there to set up the comparison without repeating the words of the title.
