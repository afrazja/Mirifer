# Everyday Chapter 1: Natural phrases, Persian-speaker traps, Say it in English, Say it again better

Status: **draft v2, reviews applied** (english-coach and learning-UX reviews, v1).

Every fact comes from `world.md` (brief v2, `README.md`). US English. Each module is written in its
built format: the field names are the ones in its `.ts` file, as in
`docs/english-day-3/phrases-and-messages.md`. What v1 needs from code is in `conversation.md`, "v1
build list"; anything left for later is marked **Later**.

| Module | Set | Track | Code |
|---|---|---|---|
| Natural phrases | A2 (5) | Intermediate | `src/lib/practice/phrases.ts` |
| Natural phrases | B1 (5) | Professional | the same |
| Persian-speaker traps | 3 word traps + 2 "which reply?" | Intermediate | `src/lib/practice/traps.ts` (`Trap.reply`) |
| Say it in English | 3 items (A2) | Intermediate | `src/lib/practice/say-in-english.ts` |
| Say it again, better | one prompt (B1) | Professional | `say-better.ts` (`SAY_PROMPTS`), `server/say-better-ai.ts`, `SayItBetter.svelte` |

**Who "you" are.** The learner, as themselves, with **their own first name** (no "Karimi"). Jake is
"your neighbor upstairs" (4B, one floor up). Personal content (Say it again, better) is only what's
true anywhere.

**Daily lesson subsets.** Everything is in the lesson: all five traps, all three Say-it items
(`LESSON_SAY_IDS` `null`), both phrase sets whole. Ids: traps get new ids (none clash with Days 1–4);
Say-it ids start with `ev1-`.

**Every step intro opens with the same who-and-where clause** (brief, "The five steps"):
"Remember Jake, your neighbor upstairs? Imagine you've just moved into 3C." /
«جیک را یادت هست، همسایهٔ طبقهٔ بالا؟ فرض کن تازه به واحد 3C اسباب‌کشی کرده‌ای.»
(Two exceptions, in `conversation.md`: Mr. Patel's step opens "Imagine you've just moved into 3C at
48 Elm Street.", and the role-play says you meet Jake for the first time.)

**Mira's taarof note** is one text, used wherever it appears in full (Traps item 4; the role-play's
details screen):
- en: In Persian, we often say no first and wait for a second offer. In English, people usually believe the first "no". So if you'd like help, say yes the first time. Both ways are polite. The rules are just different.
- fa: در فارسی معمولاً اول «نه» می‌گوییم و منتظر تعارف دوم می‌مانیم. در انگلیسی معمولاً همان «نه»ی اول را باور می‌کنند. پس اگر کمک می‌خواهی، همان بار اول بگو بله. هر دو روش مؤدبانه است؛ فقط قاعده‌ها فرق دارد.

---

## 1. Natural phrases

Built format (`Phrase`): `sentence`, `shown` (`**bold**` = the chunk, `‿` = a link), `chunk`,
`situation {en, fa}`, `tip {en, fa}` (English in `backticks`), `found` (regex on the say-better
`normalise()`: lower case, contractions spelled out, so "I'm" is "i am", "that'd" is "that would",
"I'll" is "i will"). One sound feature per tip (B1 #2 adds one taarof line). "3C" is never checked.

### 1a. A2 set (Intermediate)

In the brief's order: say who you are → ask about him → say yes to help → ask him to repeat → go.

- `intro` en: Remember Jake, your neighbor upstairs? Imagine you've just moved into 3C. Here are five things to say to him. Listen, then say each one after me. I only check the phrase in bold.
- `intro` fa: جیک را یادت هست، همسایهٔ طبقهٔ بالا؟ فرض کن تازه به واحد 3C اسباب‌کشی کرده‌ای. این پنج جمله را می‌توانی به او بگویی. گوش بده و هر جمله را بعد از من تکرار کن. من فقط عبارت پررنگ را بررسی می‌کنم.

| # | `situation` (en / fa) | `shown` | Habit it replaces | `tip` (en / fa) |
|---|---|---|---|---|
| 1 | You meet Jake on the stairs. / جیک را در راه‌پله می‌بینی. | Hi, **I just moved‿in**. I'm in 3C. | "I came to this building." (from «تازه اومدم این ساختمون») | `moved in`: link the words and stress `IN`: `moov-DIN`. / `moved in` را پیوسته بگو و روی `IN` تأکید کن: `moov-DIN`. |
| 2 | You want to keep the chat going. / می‌خواهی گفت‌وگو را ادامه بدهی. | **How long have you lived** here? | "How long do you live here?" / "Since when you live here?" (from «چند وقته این‌جا زندگی می‌کنید؟», present tense) | `lived` is one beat: `livd`, not `liv-ed`. / `lived` یک‌بخشی است: `livd`. `-ed` را جدا «اِد» نخوان. |
| 3 | Jake offers to help with your heavy box. / جیک پیشنهاد می‌کند در بردن جعبهٔ سنگینت کمکت کند. | Yes, please, **that'd be great**! | "No, no, it's fine." (a first no, from «نه، زحمت نکشید») | `that'd` is short: `THAD-ud`. Then stress `GREAT`. / `that'd` کوتاه است: `THAD-ud`. بعد روی `GREAT` تأکید کن. |
| 4 | Jake says something fast, and you don't catch it. / جیک چیزی را تند می‌گوید و متوجه نمی‌شوی. | Sorry, **can you say that‿again**? | "What?" / "Again, please." / "Repeat!" (from «چی؟» / «دوباره بگو») | `that again` runs together: `tha-duh-GEN`. / `that again` را پیوسته بگو: `t` نرم می‌شود و به `again` می‌چسبد، یعنی `tha-duh-GEN`. |
| 5 | It's time to go, nicely. / وقت رفتن است و می‌خواهی مؤدبانه خداحافظی کنی. | Well, **I should go**. See you around! | "I must go now." / "Goodbye, I go." (from «من دیگه باید برم») | `should`: the `l` is silent. Say `shud`. / در `should` حرف `l` خوانده نمی‌شود. بگو `shud`. |

| # | `sentence` | `chunk` | `found` | Counts / doesn't |
|---|---|---|---|---|
| 1 | Hi, I just moved in. I'm in 3C. | i just moved in | `/\bmov(?:ed\|ing) in(?:to)?\b/` | "I've just moved in", "I'm moving in today", "I just moved into 3C" · not "I came to this building", "I just moved here" |
| 2 | How long have you lived here? | how long have you lived | `/\bhow long (?:have\|has) (?:you\|he\|she\|they) (?:lived\|been living\|been)\b/` | "How long've you been here?", "…been living here" · not "How long do you live here?", "Since when you live here?" |
| 3 | Yes, please, that'd be great! | that'd be great | `/\bthat would be (?:great\|nice\|wonderful\|lovely\|amazing\|awesome\|perfect\|really (?:great\|nice\|helpful)\|so (?:great\|nice\|helpful)\|helpful)\b/` | "That would be really nice", "that'd be awesome" · not "it's fine", "don't trouble yourself", "Yes please, thank you" (good, but not the chunk) |
| 4 | Sorry, can you say that again? | can you say that again | `/\bsay (?:that\|it) (?:again\|one more time)\b/` | "Could you say it again?", "say that one more time" · not "What?", "Again, please", "Can you repeat that?" (good, not the chunk) |
| 5 | Well, I should go. See you around! | i should go | `/\bi (?:should\|had better\|would better\|better) (?:go\|get going\|head (?:out\|off\|up\|upstairs))\b/` | "I'd better go", "I should get going", "I better go" · not "I must go now", "I have to go now" |

Phrase 4 is what the Intermediate role-play twist (the trash line, audio only) asks for; phrase 3 is
the "say yes to help" goal; phrase 2 is trap `has-lived` and Say-it `ev1-hi`.

### 1b. B1 set (Professional)

- `intro` en: Remember Jake, your neighbor upstairs? Imagine you've just moved into 3C. Here are five natural phrases for your first chat with him. Listen, then say each one after me.
- `intro` fa: جیک را یادت هست، همسایهٔ طبقهٔ بالا؟ فرض کن تازه به واحد 3C اسباب‌کشی کرده‌ای. این پنج عبارت طبیعی برای اولین گپ با اوست. گوش بده و هر کدام را بعد از من تکرار کن.

| # | `situation` (en / fa) | `shown` | Habit it replaces | `tip` (en / fa) |
|---|---|---|---|---|
| 1 | You meet Jake on the stairs. He lives one floor up. / جیک را در راه‌پله می‌بینی. او یک طبقه بالاتر زندگی می‌کند. | I just **moved‿in downstairs**, in 3C. | "I'm your neighbor from the lower floor." / "I live in the floor under you." (from «همسایهٔ طبقهٔ پایینم») | `downstairs`: stress the second part, `down-STAIRS`. / در `downstairs` تأکید روی بخش دوم است: `down-STAIRS`. |
| 2 | Jake offers to carry your box. / جیک پیشنهاد می‌کند جعبه‌ات را برایت بالا ببرد. | Are you sure? **That'd be great**, thanks! | "No, no, please, don't trouble yourself." (taarof: a first no, from «نه، تو رو خدا، زحمت نکشید») | In English, people usually believe a first "no", so if you'd like help, say yes. Your voice goes up on `Are you sure?` and down on `That'd be great`. / در انگلیسی معمولاً همان «نه»ی اول را باور می‌کنند؛ پس اگر کمک می‌خواهی، بله بگو. در `Are you sure?` صدایت بالا می‌رود و در `That'd be great` پایین می‌آید. |
| 3 | Jake invites you to the barbecue, a week from today at four. / جیک تو را به باربیکیوی ساختمان دعوت می‌کند: یک هفتهٔ دیگر، شنبه ساعت چهار. | **Is‿it OK if I** come a little later? | "Is it possible I come late?" / "I come a bit late, no problem?" (from «اشکال نداره یه کم دیرتر بیام؟») | `is it` runs together: `I-zit`, then `oh-KAY`. / `is it` را پیوسته بگو: `I-zit`، بعد `oh-KAY`. |
| 4 | Jake asks how much you pay for 3C. / جیک می‌پرسد اجارهٔ 3C را چقدر می‌دهی. | Ha, **I'd rather not say**! | "It's private." / "Why do you ask?" (from «خصوصیه» / «چرا می‌پرسی؟»), or a long exact answer | `I'd rather`: keep the small `d` and link it: `ay-DRA-ther`. / در `I'd rather` صدای کوچک `d` را نگه دار و به `rather` بچسبان: `ay-DRA-ther`. |
| 5 | You've chatted for a while, and it's time to go. / مدتی گپ زده‌اید و وقت رفتن است. | Anyway, **I'll let‿you go**. Nice talking to you! | "I don't take more of your time." / "OK, I must go. Bye." (from «دیگه وقتتون رو نمی‌گیرم») | `let you` runs together: `LEH-chuh`. / `let you` را پیوسته بگو: `t` و `y` با هم «چ» می‌شوند، یعنی `LEH-chuh`. |

B1 #2's tip carries the taarof point in one line (no new `note` field in v1). "Are you sure?" is a
friendly check, not a no: Jake answers "Of course! Here." (`conversation.md`).

| # | `sentence` | `chunk` | `found` | Counts / doesn't |
|---|---|---|---|---|
| 1 | I just moved in downstairs, in 3C. | moved in downstairs | `/\bmov(?:ed\|ing) in (?:down ?stairs\|below\|right below)\b/` | "I've just moved in down stairs", "I moved in right below you" · not "I live in the floor under you", "I just moved in" alone |
| 2 | Are you sure? That'd be great, thanks! | that'd be great | the same as A2 #3 | "Are you sure? That would be really helpful" · not "No, no, it's fine", "Are you sure? Thanks!" |
| 3 | Is it OK if I come a little later? | is it ok if i | `/\b(?:is it\|would it be\|will it be) (?:ok\|okay\|o k\|alright\|all right\|fine) if (?:i\|we)\b/` | "Would it be okay if I came a bit later?", "Is it all right if I come at five?" · not "Is it possible I come late?", "Can I come later?" (fine, not the chunk) |
| 4 | Ha, I'd rather not say! | i'd rather not say | `/\bi would rather not (?:say\|tell\|talk about it\|get into (?:it\|that)\|share)\b/` | "I'd rather not get into that" · not "It's private", "I prefer not to say" |
| 5 | Anyway, I'll let you go. Nice talking to you! | i'll let you go | `/\blet you (?:go\|get going\|get back to)\b/` | "I'll let you get going", "I'm gonna let you go" · not "I must go", "I should go" |

B1 #3 is the Professional role-play's invitation goal ("accepts with a time"); B1 #4 is its
nosy-question twist (the model redirect starts "Ha, I'd rather not say!").

---

## 2. Persian-speaker traps (Intermediate)

- `intro` en: Remember Jake, your neighbor upstairs? Imagine you've just moved into 3C. Here are five small mistakes Persian speakers often make with a new neighbor. Spot each one, then say it the right way.
- `intro` fa: جیک را یادت هست، همسایهٔ طبقهٔ بالا؟ فرض کن تازه به واحد 3C اسباب‌کشی کرده‌ای. این‌ها پنج اشتباه کوچک است که فارسی‌زبان‌ها با همسایهٔ تازه زیاد می‌کنند. هر کدام را پیدا کن، بعد درستش را بگو.

`LESSON_TRAP_IDS = ['where-from', 'has-lived', 'jake-he', 'yes-first-time', 'just-thanks']`

### 2a. Word traps (heading "Tap the mistake.", as built)

Built format (`Trap`), regexes on the traps `normalise()` (contractions **not** spelled out). Each has
exactly one tap target.

**1. `id`: `where-from`** · `kind`: word order in questions / ترتیب کلمه‌ها در سؤال
- `words`: `["Nice", "to", "meet", "you.", "Where", "you are", "from?"]` · `wrong`: 5 (`you are`)
- **One tap, two words:** a word-order mistake has no single wrong word. `"you are"` is one button (the
  code only renders the strings in `words`, so no change is needed). The opener "Nice to meet you."
  adds tap targets and puts it on the stairs.
- `right`: Nice to meet you. Where are you from?
- `why` en: In a question, the verb comes before “you”: “Where are you from?”
- `why` fa: در فارسی ترتیب کلمه‌ها در سؤال عوض نمی‌شود: «اهل کجایی؟». ولی در انگلیسی در سؤال، فعل قبل از you می‌آید: «Where are you from».
- `accept`: `/\bwhere are you from\b/`, `/\bwhere're you from\b/` · `reject`: `/\bwhere you are from\b/`
- `alsoGood`: patterns `/\bwhere do you come from\b/`, `/\bwhere (?:are|were) you born\b/` · word "are"

**2. `id`: `has-lived`** · `kind`: has lived (how long) / has lived (چند وقت)
- The brief's "My neighbor lives here since six years." has **two** errors (`lives`, `since`).
  Single-tap version: keep "for", so the only error is the tense. ("…has lived here since six years",
  tap `since`, would be Day 1's `since-for` again.)
- `words`: `["My", "neighbor", "lives", "here", "for", "six", "years."]` · `wrong`: 2 (`lives`)
- `right`: My neighbor has lived here for six years.
- `why` en: For something that started in the past and is still true, say “has lived”: “He has lived here for six years.”
- `why` fa: در فارسی می‌گوییم «شش سال است این‌جا زندگی می‌کند» و فعل حال است. در انگلیسی برای کاری که از گذشته شروع شده و هنوز ادامه دارد «has lived» می‌گوییم: «He has lived here for six years».
- `accept`: `/(?:\bhas|'s) (?:lived|been living|been) here (?:for )?(?:six|6) years\b/` · `reject`: `/\b(?:lives|is living|live) here\b/`
- Also passes: "My neighbor's lived here for 6 years.", "He's been living here for six years.", "My neighbor has been here six years." Fails: "…has lived here since six years", "…lived here for six years".
- Fact: Jake, six years in the building (world). Ties to phrase A2 #2.

**3. `id`: `jake-he`** · `kind`: he / she
- `words`: `["Jake", "is", "a", "nurse.", "She", "works", "at", "night."]` · `wrong`: 4 (`She`) · no `alsoOk`
- `right`: Jake is a nurse. He works at night.
- `why` en: In Persian, «او» means both he and she. Jake is a man, so say “he”.
- `why` fa: در فارسی «او» هم برای مرد است هم برای زن. جیک مرد است، پس در انگلیسی «he» می‌گوییم.
- `accept`: `/\bhe(?: works|'s working| is working)\b/` · `reject`: `/\bshe(?: works|'s working| is working)\b/`
- Fact: Jake is a nurse; some weeks he works nights (world).

### 2b. "Which reply?" items (4 and 5), built as `Trap.reply`

Built shape: `reply: { prompt, line, options, answer }`, with `words: []` and `wrong` unused. The
learner hears Jake's line (Andrew, `a`), picks the best of **three** replies, reads Mira's note
(`why`), then says `right`. A wrong pick shows "Not that one." and the learner picks again; after
two wrong picks the answer is shown. **No per-option notes in v1**: Mira's one note covers the
wrong replies. The say step is **right / not yet** only (no "fixed it yourself"): a reply that starts
with the habit and then switches counts as not yet.

**4. `id`: `yes-first-time`** · `kind`: saying yes to help / قبول کردن کمک
- `reply.prompt`: Your hands are full, and you'd like help. What do you say? / دستت پر است و کمک می‌خواهی. چه می‌گویی؟
- `reply.line`: "Here, let me help you with that."
- `reply.options`: "Oh, no, no. It's fine." · **"Yes, please! Thank you."** · "Please, don't trouble yourself." · `answer`: 1
- `why`: Mira's taarof note (top of this file), en and fa.
- `right`: Yes, please! Thank you.
- `accept`: `/\byes please\b/`, `/\b(?:yes|yeah|sure|oh yes) (?:thank you|thanks)\b/`, `/\bthat(?:'d| would) be (?:great|nice|lovely|amazing|awesome|helpful)\b/`, `/^(?:oh )?(?:ok |okay )?(?:thank you|thanks)(?: so much| very much| a lot)?\b/`
- `reject`: `/\bit's fine\b/`, `/\bno no\b/`, `/\btrouble yourself\b/`, `/^(?:oh )?no\b(?! problem)/`
- Right: "Yes, please! Thank you.", "Oh, thank you so much!", "Thanks!", "OK, thank you", "Sure, thanks!", "Oh, yes please, that'd be great!" (a thanks on its own is a yes). Not yet: "Oh, no, no. It's fine.", "No, thank you.", "No, no, it's fine. Yes, please!", "Please, don't trouble yourself."

**5. `id`: `just-thanks`** · `kind`: taking a compliment / جواب دادن به تعریف
- `reply.prompt`: Jake sees the plant you're carrying. What do you say? / جیک گلدانی را که دستت است می‌بیند. چه می‌گویی؟
- `reply.line`: "Nice plant!"
- `reply.options`: "Oh, it's nothing." · "Take it, it's yours!" · **"Thanks! I love it too."** · `answer`: 2
- `why` en: To a compliment, just say "Thanks!" You can add one thing: "I love it too." "It's nothing" is a reply to "Thank you", not to a compliment. And in English, "Take it!" sounds like a real offer.
- `why` fa: در جواب تعریف، فقط بگو «Thanks!». می‌توانی یک چیز هم اضافه کنی: «I love it too.» جملهٔ «It's nothing» جواب «Thank you» است، نه جواب تعریف. و در انگلیسی «Take it!» مثل «قابل نداره» نیست؛ یعنی واقعاً داری آن را به او می‌دهی.
- `right`: Thanks! I love it too.
- `accept`: `/\bthanks\b/`, `/\bthank you\b/` · `reject`: `/\bit's nothing\b/`, `/\btake it\b/`, `/\bit's yours\b/`
- Right: "Thanks! I love it too.", "Thank you!", "Thanks". Not yet: "Oh, it's nothing.", "Take it, it's yours!", "Thanks, take it!"
- `right` is Sara's line in the listening ("Thanks! I love it too.").

**Spare** (brief, "if there's room later"): `hi-mr-jake` · `words` `["Hi,", "Mr.", "Jake!"]` · `wrong` 1
· `right` "Hi, Jake!" · `accept` `/\bhi jake\b/` · `reject` `/\bmr jake\b/`, `/\bmister jake\b/`. `why` en: In
Persian we say «آقا جیک». In English, “Mr.” goes only with a last name. With a first name, just say
“Jake”. `why` fa: در فارسی می‌گوییم «آقا جیک»، ولی در انگلیسی «Mr.» فقط با نام خانوادگی می‌آید. با
اسم کوچک فقط بگو «Jake».

---

## 3. Say it in English (Intermediate, A2): three items, all in the lesson

**Three items, not four**, so step 4 stays within about 3 minutes. The four checks are all still
covered: "how long have you lived" joins the introduction (item 2), and only the neighborhood
question is dropped. Items follow the meeting: Jake's offer, then names, then goodbye.

Built format (`SayItem`): `id`, `to`, `fa` (spoken Persian), `points` (2), `models` (2, ≤25 words),
`hints` (2), `names`. All three `to`: **To Jake, your neighbor upstairs / به جیک، همسایهٔ طبقهٔ بالا.**
Persian uses «شما» (a neighbor you've just met).

- `intro` en: Remember Jake, your neighbor upstairs? Imagine you've just moved into 3C. I'll show you in Persian what you want to tell him. Say it in English, in your own words, with your own name.
- `intro` fa: جیک را یادت هست، همسایهٔ طبقهٔ بالا؟ فرض کن تازه به واحد 3C اسباب‌کشی کرده‌ای. چیزی را که می‌خواهی به او بگویی به فارسی نشانت می‌دهم. همان را با کلمات خودت به انگلیسی بگو، با اسم خودت.

| # | `id` | `fa` | `points` (en / fa) | `models` | `hints` (en / fa) |
|---|---|---|---|---|---|
| 1 | `ev1-yes-help` | آره، ممنون می‌شم! این جعبه خیلی سنگینه. | you say yes to his help, the first time / همان بار اول کمکش را قبول می‌کنی · you say the box is really heavy / می‌گویی جعبه خیلی سنگین است | "Yes, please! Thank you. This box is really heavy." · "Oh, yes, please, that'd be great! It's so heavy." | Yes, please / آره، لطفاً · heavy / سنگین |
| 2 | `ev1-hi` | سلام! من (اسم خودت) هستم، تازه به واحد 3C اسباب‌کشی کردم. شما چند وقته این‌جا زندگی می‌کنید؟ | you say your name, and that you're in 3C / اسمت را می‌گویی و این‌که در واحد 3C هستی · you ask how long he's lived here / می‌پرسی چند وقت است این‌جا زندگی می‌کند | "Hi! I'm {name}. I just moved into 3C. How long have you lived here?" · "Hi, I'm {name}, in 3C. I just moved in. So how long have you been here?" | I just moved in / تازه اسباب‌کشی کردم · How long have you lived…? / چند وقته… زندگی می‌کنید؟ |
| 3 | `ev1-go` | خب، دیگه من برم. از آشنایی‌تون خوشحال شدم. فعلاً! | you say you should go, nicely / مؤدبانه می‌گویی که باید بروی · you say it was nice to meet him / می‌گویی از آشنایی با او خوشحال شدی | "Well, I should go. Nice meeting you! See you around!" · "OK, I should get going. It was nice meeting you, Jake. See you!" | I should go / دیگه من برم · Nice meeting you / از آشنایی‌تون خوشحال شدم |

"Nice meeting you" (not "Nice to meet you") is what people say when they leave.

What counts (the AI's meaning check, per point; v1 reads these from the `points` wording):
- `ev1-yes-help`: point 1 needs a **yes in the first sentence**; "Thanks" or "Thank you" on its own
  is a yes. A reply that opens with "No, it's fine" doesn't get it, even if a yes follows.
- `ev1-hi`: **any** name counts (never a particular one); the apartment counts as "3C", "3 see",
  "three sea", "3-C", "apartment three C". "I came to this building" gets the point (the meaning is
  clear) and the natural version shows "I just moved in". "How long do you live here?" gets point 2;
  the natural version gives "have you lived" (trap `has-lived`). Jake's answer isn't part of the item.
- `ev1-go`: "I must go" gets the point; the natural version gives "I should go". «فعلاً!» → "See you
  around!" or "See you!", not "I see you".
- Traps on purpose: «اسباب‌کشی کردم» → "I moved" (natural: "I just moved in"); «چند وقته… زندگی
  می‌کنید» → present tense; «دیگه من برم» → "I must go".
- Word counts: 9, 9 · 14, 16 · 10, 13 (all ≤25).
- `NAMES`: "Jake, Biscuit, 3C, Elm Street, Riverton."

`{name}` in `models` is the learner's first name, put in before the model is shown or read; with no
name, the line drops it ("Hi! I just moved into 3C. How long have you lived here?"). This is a v1
build item (`conversation.md`). **Later:** a hidden per-item `check` the AI sees but the learner
doesn't (for the notes above), if the `points` wording proves not enough.

---

## 4. Say it again, better (Professional, B1)

### What Mira says

- `title`: About you / از خودت بگو · `short`: About you / از خودت (Day 1's "Tell your story" doesn't fit)
- `does`: Tell a new neighbor a little about yourself, then say it again, better. / کمی از خودت به یک همسایهٔ تازه بگو، بعد دوباره و بهتر بگو.
- `intro` en: Remember Jake, your neighbor upstairs? Imagine you've just moved into 3C. Tell Jake a little about yourself: where you're from, what you do, and one thing you like doing. Share only what you're happy to share.
- `intro` fa: جیک را یادت هست، همسایهٔ طبقهٔ بالا؟ فرض کن تازه به واحد 3C اسباب‌کشی کرده‌ای. کمی از خودت به جیک بگو: اهل کجایی، چه کار می‌کنی، و یک کاری که دوست داری انجام بدهی. فقط چیزهایی را بگو که دوست داری بگویی.

### The prompt and the check (v1: `SAY_PROMPTS['about-you']`)

- **`question`** (AI prompt and transcription hint): "Tell your new neighbor a little about yourself: where you're from, what you do, and one thing you like doing."
- **`onTopic`**: true only if the answer, in English, tells about the learner themselves: at least
  one of where they're from, what they do, what they like doing. It doesn't have to be true. Any
  place, job or situation counts: student, retired, looking for work, at home with children.
- **`priorities`** (the mistakes to teach first, in order): no "am" before a verb ("I work at…", not
  "I am work at…") · a/an with jobs ("I'm an engineer", not "I'm engineer") · present simple for
  facts and habits ("I live…", "I like…") · has/have + past participle for how long ("I've lived
  here for two years", not "I live here since two years") · like + -ing or to ("I like walking", not
  "I like walk") · prepositions (from, in, at, for) · he/she · word order.
- **`rules`**: ignore how names of people, cities and countries are spelled in the transcript, and
  never "fix" them; never comment on where the learner is from, their job, or why they moved; only
  the English. Praise rules stay as they are.
- **Top fixes:** the brief says "the top one or two"; v1 keeps the built limit unless `maxFixes: 2`
  is a one-line change. Every mistake is still corrected in the better version (spec v3).
- **Timing (v1):** as built: **60 s cap** (auto-stop), minimum 10 s, the second try the same. The
  intro asks for no length; the screen shows the cap.
- **Cases:** as built (strong ≥ 40 words; "tell me a bit more" under 15 words, off-topic or mostly
  Persian).
- **`ideas`** ("Need ideas?"): "I'm from…" · "I work as… / I'm a student. / I'm retired." · "In my
  free time, I like…"
- **`more`** line: Tell me a bit more: where you're from, what you do, or what you like doing. / کمی
  بیشتر بگو: اهل کجایی، چه کار می‌کنی، یا دوست داری چه کار کنی.
- **`betterLabel`**: What you said, a bit better / حرف‌هایت، کمی بهتر (for "Your story, a bit better").
- **Retry lines:** "Say it again in your own words. Try to use these:" / «دوباره با کلمات خودت بگو.
  سعی کن از این‌ها استفاده کنی:» (today «تعریف کن», which means telling a story).

### Later (not v1)

- A 45 s cap with amber at 35 s, a second try labelled "about 30 seconds", strong from 35 words.
- `points` the AI marks (where you're from · what you do · one thing you like doing), shown as one
  chip on the second try ("Add: what you like doing" / «اضافه کن: کاری که دوست داری»); a missing point
  never fails the module.

---

## Open questions

1. **`where-from` as one two-word button** ("you are"): fine with the owner, or should word-order
   items wait for another type?
2. **`has-lived`:** the brief's two-error sentence became a one-error one (tap `lives`, "for" kept).
   OK? The other single-tap version (tap `since`) repeats Day 1's `since-for`.
3. **"Which reply?" say step:** "Thanks!" is one short word for speech-to-text (12 s cap, 0.6 s
   minimum: should work, but test it).
4. **"3C" inside Persian text** (intros, Say-it prompts): needs bidi isolation in the UI; Persian
   reviewer to check «واحد 3C» reading order on iPhone.
5. **Speech-to-text risk:** record "Where you are from?" and "My neighbor lives here for six years"
   with a Persian accent before shipping (they may be quietly fixed), as on Day 3.

Regexes were run in Node against copies of both `normalise()` functions: each `found` matches its own
sentence and none of the other four in its set, takes the variants listed and rejects the habits;
each trap's `right`, wrong sentence and extra forms give the results shown (0 failures).
