# Everyday Chapter 1: Natural phrases, Persian-speaker traps, Say it in English, Say it again better

Status: draft v1, for review.

Every fact comes from `world.md` (brief v2, `README.md`); anything new is under "New facts for
world.md" at the end. US English. Each module is written in its built format: the field names are
the ones in its `.ts` file, as in `docs/english-day-3/phrases-and-messages.md`. Anything the current
code can't take yet is marked **NEW** and listed again under "Open questions".

| Module | Set | Track | Code |
|---|---|---|---|
| Natural phrases | A2 (5) | Intermediate | `src/lib/practice/phrases.ts` |
| Natural phrases | B1 (5) | Professional | the same |
| Persian-speaker traps | 3 word traps + 2 **NEW** "which reply?" | Intermediate | `src/lib/practice/traps.ts` |
| Say it in English | 4 items (A2) | Intermediate | `src/lib/practice/say-in-english.ts` |
| Say it again, better | one prompt (B1) | Professional | `say-better.ts`, `server/say-better-ai.ts`, `SayItBetter.svelte` |

**Who "you" are.** The learner, as themselves, with **their own first name** (no "Karimi"). Every
intro says "**Imagine** you've just moved into 3C" (owner's decision 3). Jake is "your neighbor
upstairs" (4B, one floor up). Personal content (Say it again, better) is only what's true anywhere.

**Daily lesson subsets.** Everything is in the lesson: all five traps, all four Say-it items
(`LESSON_SAY_IDS` `null`), both phrase sets whole. Ids: traps get new ids (none clash with Days 1–4);
Say-it ids start with `ev1-`.

**Every step intro opens with the who-and-where clause** (brief, "The five steps"):
"Remember Jake, your neighbor upstairs? Imagine you've just moved into 3C." /
«جیک یادت هست، همسایهٔ طبقهٔ بالا؟ تصور کن تازه به آپارتمان 3C اسباب‌کشی کرده‌ای.»

---

## 1. Natural phrases

Built format (`Phrase`): `sentence`, `shown` (`**bold**` = the chunk, `‿` = a link), `chunk`,
`situation {en, fa}`, `tip {en, fa}` (English in `backticks`), `found` (regex on the say-better
`normalise()`: lower case, contractions spelled out, so "I'm" is "i am", "that'd" is "that would",
"I'll" is "i will"). One sound feature per tip. "3C" is never checked.

**NEW (small):** B1 #2 carries Mira's taarof note. `Phrase` has no field for it; proposed
`note?: DisplayText`, shown once under the sentence after the tries (or, without code, the note
moves into the step intro).

### 1a. A2 set (Intermediate)

In the brief's order: say who you are → ask about him → say yes to help → ask him to repeat → go.

- `intro` en: Remember Jake, your neighbor upstairs? Imagine you've just moved into 3C. Here are five things you can say to him. Listen, then say each one after me. I only check the phrase in bold, not your accent.
- `intro` fa: جیک یادت هست، همسایهٔ طبقهٔ بالا؟ تصور کن تازه به آپارتمان 3C اسباب‌کشی کرده‌ای. این پنج جمله را می‌توانی به او بگویی. گوش بده و هر جمله را بعد از من تکرار کن. من فقط عبارت پررنگ را بررسی می‌کنم، نه لهجه‌ات را.

| # | `situation` (en / fa) | `shown` | Habit it replaces | `tip` (en / fa) |
|---|---|---|---|---|
| 1 | You meet Jake on the stairs. / جیک را در راه‌پله می‌بینی. | Hi, **I just moved‿in**. I'm in 3C. | "I came to this building." / "I'm new in this building." (from «تازه اومدم این ساختمون») | `moved in`: link the words and stress `IN`: `moov-DIN`. / `moved in` را پیوسته بگو و روی `IN` تأکید کن: `moov-DIN`. |
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
the "say yes to help" goal; phrase 2 is trap `has-lived` and Say-it `ev1-how-long`.

### 1b. B1 set (Professional)

- `intro` en: Remember Jake, your neighbor upstairs? Imagine you've just moved into 3C. Here are five natural phrases for your first chat with him. You'll need them later, too. Listen, then say each one after me.
- `intro` fa: جیک یادت هست، همسایهٔ طبقهٔ بالا؟ تصور کن تازه به آپارتمان 3C اسباب‌کشی کرده‌ای. این پنج عبارت طبیعی برای اولین گپ با اوست. بعداً خودت هم به کارشان می‌بری. گوش بده و هر کدام را بعد از من تکرار کن.

| # | `situation` (en / fa) | `shown` | Habit it replaces | `tip` (en / fa) |
|---|---|---|---|---|
| 1 | You meet Jake on the stairs. He lives one floor up. / جیک را در راه‌پله می‌بینی. او یک طبقه بالاتر زندگی می‌کند. | I just **moved‿in downstairs**, in 3C. | "I'm your neighbor from the lower floor." / "I live in the floor under you." (from «همسایهٔ طبقهٔ پایینم») | `downstairs`: stress the second part, `down-STAIRS`. / در `downstairs` تأکید روی بخش دوم است: `down-STAIRS`. |
| 2 | Jake offers to carry your box. / جیک پیشنهاد می‌کند جعبه‌ات را برایت بیاورد. | Are you sure? **That'd be great**, thanks! | "No, no, please, don't trouble yourself." (taarof: a first no, from «نه، تو رو خدا، زحمت نکشید») | Your voice goes up on `Are you sure?` and down on `That'd be great`. / در `Are you sure?` صدایت بالا می‌رود و در `That'd be great` پایین می‌آید. |
| 3 | Jake invites you to the barbecue, a week from today at four. / جیک تو را به باربیکیوی ساختمان دعوت می‌کند: یک هفتهٔ دیگر، شنبه ساعت چهار. | **Is‿it OK if I** come a little later? | "Is it possible I come late?" / "I come a bit late, no problem?" (from «اشکال نداره یه کم دیرتر بیام؟») | `is it` runs together: `I-zit`, then `oh-KAY`. / `is it` را پیوسته بگو: `I-zit`، بعد `oh-KAY`. |
| 4 | Jake asks how much you pay for 3C. / جیک می‌پرسد اجارهٔ 3C را چقدر می‌دهی. | Ha, **I'd rather not say**! | "It's private." / "Why do you ask?" (from «خصوصیه» / «چرا می‌پرسی؟»), or a long exact answer | `I'd rather`: keep the small `d` and link it: `ay-DRA-ther`. / در `I'd rather` صدای کوچک `d` را نگه دار و به `rather` بچسبان: `ay-DRA-ther`. |
| 5 | You've chatted for a while, and it's time to go. / مدتی گپ زده‌اید و وقت رفتن است. | Anyway, **I'll let‿you go**. Nice talking to you! | "I don't take more of your time." / "OK, I must go. Bye." (from «دیگه وقتتون رو نمی‌گیرم») | `let you` runs together: `LEH-chuh`. / `let you` را پیوسته بگو: `t` و `y` با هم «چ» می‌شوند، یعنی `LEH-chuh`. |

**B1 #2 `note` (NEW field), Mira's taarof note:**
- en: In Persian, it's polite to say no first and wait for a second offer. In English, people often believe the first no. "Are you sure?" is a friendly way to check, and then you say yes. Both ways are polite. The rules are just different.
- fa: در فارسی ادب این است که اول «نه» بگوییم و منتظر تعارف دوم بمانیم. در انگلیسی معمولاً همان «نه»ی اول را باور می‌کنند. «Are you sure?» راه دوستانه‌ای است برای این‌که مطمئن شوی، و بعد بله می‌گویی. هر دو روش مؤدبانه است؛ فقط قاعده‌ها فرق دارد.

| # | `sentence` | `chunk` | `found` | Counts / doesn't |
|---|---|---|---|---|
| 1 | I just moved in downstairs, in 3C. | moved in downstairs | `/\bmov(?:ed\|ing) in (?:down ?stairs\|below\|right below)\b/` | "I've just moved in down stairs", "I moved in right below you" · not "I live in the floor under you", "I just moved in" alone |
| 2 | Are you sure? That'd be great, thanks! | that'd be great | the same as A2 #3 | "Are you sure? That would be really helpful" · not "No, no, it's fine", "Are you sure? Thanks!" |
| 3 | Is it OK if I come a little later? | is it ok if i | `/\b(?:is it\|would it be\|will it be) (?:ok\|okay\|o k\|alright\|all right\|fine) if (?:i\|we)\b/` | "Would it be okay if I came a bit later?", "Is it all right if I come at five?" · not "Is it possible I come late?", "Can I come later?" (fine, not the chunk) |
| 4 | Ha, I'd rather not say! | i'd rather not say | `/\bi would rather not (?:say\|tell\|talk about it\|get into (?:it\|that)\|share)\b/` | "I'd rather not get into that" · not "It's private", "I prefer not to say" |
| 5 | Anyway, I'll let you go. Nice talking to you! | i'll let you go | `/\blet you (?:go\|get going\|get back to)\b/` | "I'll let you get going", "I'm gonna let you go" · not "I must go", "I should go" |

B1 #3 is the Professional role-play's invitation goal ("accepts with a time"); B1 #4 is its nosy-question
twist (the model redirect starts "Ha, I'd rather not say!").

---

## 2. Persian-speaker traps (Intermediate)

- `intro` en: Remember Jake, your neighbor upstairs? Imagine you've just moved into 3C. Here are five things Persian speakers often get wrong with a new neighbor. Find each one, then say it the right way.
- `intro` fa: جیک یادت هست، همسایهٔ طبقهٔ بالا؟ تصور کن تازه به آپارتمان 3C اسباب‌کشی کرده‌ای. این پنج مورد را فارسی‌زبان‌ها با همسایهٔ تازه زیاد اشتباه می‌گویند. هر کدام را پیدا کن، بعد درستش را بگو.

`LESSON_TRAP_IDS = ['where-from', 'has-lived', 'jake-he', 'yes-first-time', 'just-thanks']`

### 2a. Word traps (existing type, "tap the wrong word, then say it right")

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

### 2b. NEW ITEM TYPE: "which reply?" (items 4 and 5)

Today `Trap` only has "tap the one wrong word". Proposed shape, in the same Traps step and the same two
stages (pick, then say), so `TrapState` can be reused (`wrongTaps` = wrong option indexes):

```ts
export interface ReplyTrap {
	id: string;
	type: 'reply';                       // word traps get type?: 'word' (the default)
	kind: DisplayText;
	situation: DisplayText;              // one line, shown above Jake's line
	line: { who: string; voice: 'a'; text: string }; // shown and played (Jake = Andrew, a)
	ask: DisplayText;                    // the question under the line
	options: string[];                   // replies as buttons, A–D, in this order; never read aloud
	answer: number;                      // index of the best reply
	optionNotes?: { index: number; note: DisplayText }[]; // shown when that wrong reply is picked
	note: DisplayText;                   // Mira's note, after the right reply is picked or shown
	right: string;                       // then said aloud, checked as a word trap
	accept: RegExp[]; reject: RegExp[];
}
```

Flow: on-screen line "Pick the best reply." / «بهترین جواب را انتخاب کن.» A wrong pick shows its
`optionNotes` line (else "Not that one. Try again."); after two wrong picks the answer is shown. Then
the `note` box; bottom "Now say it". Then say `right` (same `checkSaid`). The ✓ "Right!" wording stays.

**4. `id`: `yes-first-time`** · `kind`: saying yes to help / قبول کردن کمک
- `situation`: Your hands are full. Jake says: / دستت پر است. جیک می‌گوید:
- `line`: Jake (a): "Here, let me help you with that."
- `ask`: You'd like help. What do you say? / کمک می‌خواهی. چه می‌گویی؟
- `options`: A "Oh, no, no. It's fine." · **B "Yes, please! Thank you."** · C "No, I can't let you." · D "Please, don't trouble yourself." · `answer`: 1
- `optionNotes`:
  - A: Jake will believe you and go upstairs. If you'd like help, say yes. / جیک حرفت را باور می‌کند و می‌رود بالا. اگر کمک می‌خواهی، بگو بله.
  - C: In English, this is a clear no. Jake won't ask again. / در انگلیسی این یک «نه»ی واضح است. جیک دوباره نمی‌پرسد.
  - D: In English, this is a polite no, so Jake will stop offering. / در انگلیسی این یک «نه»ی مؤدبانه است، پس جیک دیگر اصرار نمی‌کند.
- `note` en: In Persian, it's polite to say no first and wait for a second offer. In English, people often believe the first "no". So if you'd like help, say yes the first time. Both ways are polite. The rules are just different.
- `note` fa: در فارسی ادب این است که اول «نه» بگوییم و منتظر تعارف دوم بمانیم. در انگلیسی معمولاً همان «نه»ی اول را باور می‌کنند. پس اگر کمک می‌خواهی، همان بار اول بگو بله. هر دو روش مؤدبانه است؛ فقط قاعده‌ها فرق دارد.
- `right`: Yes, please! Thank you.
- `accept`: `/\byes please\b/`, `/\b(?:yes|yeah|sure|oh yes) (?:thank you|thanks)\b/`, `/\bthat(?:'d| would) be (?:great|nice|lovely|amazing|awesome|helpful)\b/`
- `reject`: `/\bit's fine\b/`, `/\bno no\b/`, `/\btrouble yourself\b/`, `/\bcan't let you\b/`
- Also passes: "Oh, yes please, that'd be great!" Fails: "Thank you so much" alone (no yes). "No, no, it's fine. Yes, please!" gives "self-fixed".

**5. `id`: `just-thanks`** · `kind`: taking a compliment / جواب تعریف
- `situation`: Jake sees the plant you're carrying. / جیک گلدانی را که دستت است می‌بیند.
- `line`: Jake (a): "Nice plant!"
- `ask`: What do you say? / چه می‌گویی؟
- `options`: **A "Thanks!"** · B "Oh, it's nothing." · C "It's not good. It was cheap." · D "Take it, it's yours!" · `answer`: 0
- `optionNotes`:
  - B: In English, "It's nothing" can sound like you don't agree with him. Just say "Thanks!" / در انگلیسی «It's nothing» ممکن است این‌طور به نظر برسد که با تعریفش موافق نیستی. فقط بگو «Thanks!».
  - C: That sounds like you don't like your own plant. A simple "Thanks!" is enough. / این‌طور به نظر می‌رسد که گلدان خودت را دوست نداری. یک «Thanks!» ساده کافی است.
  - D (the brief's): In Persian, «قابل نداره» is a warm thing to say. In English, "Take it!" sounds like a real offer. Just say "Thanks!" / در فارسی «قابل نداره» حرف گرم و مهربانی است. ولی در انگلیسی «Take it!» یعنی واقعاً داری آن را به او می‌دهی. فقط بگو «Thanks!».
- `note` en: In English, the easy answer to a compliment is "Thanks!" You can add one more thing: "Thanks! I love it too."
- `note` fa: در انگلیسی جواب ساده به تعریف «Thanks!» است. می‌توانی یک چیز هم اضافه کنی: «Thanks! I love it too.»
- `right`: Thanks!
- `accept`: `/\bthanks?\b/`, `/\bthank you\b/` · `reject`: `/\bit's nothing\b/`, `/\btake it\b/`, `/\bit's not good\b/`, `/\bit was cheap\b/`, `/\bit's yours\b/`
- Also passes: "Thank you!", "Thanks! I love it too." Fails: "Oh, it's nothing."
- The note echoes Sara's line in the listening ("Thanks! I love it too.").

**Spare** (brief, "if there's room later"): `hi-mr-jake` · `words` `["Hi,", "Mr.", "Jake!"]` · `wrong` 1
· `right` "Hi, Jake!" · `accept` `/\bhi jake\b/` · `reject` `/\bmr jake\b/`, `/\bmister jake\b/`. `why` en: In
Persian we say «آقا جیک». In English, “Mr.” goes only with a last name. With a first name, just say
“Jake”. `why` fa: در فارسی می‌گوییم «آقا جیک»، ولی در انگلیسی «Mr.» فقط با نام خانوادگی می‌آید. با
اسم کوچک فقط بگو «Jake».

---

## 3. Say it in English (Intermediate, A2): four items, all in the lesson

Built format (`SayItem`): `id`, `to`, `fa` (spoken Persian), `points` (2), `models` (2, ≤25 words),
`hints` (2), `names`. All four `to`: **To Jake, your neighbor upstairs / به جیک، همسایهٔ طبقهٔ بالا.**
Persian uses «شما» (a neighbor you've just met).

- `intro` en: Remember Jake, your neighbor upstairs? Imagine you've just moved into 3C. I'll show you what you want to tell him, in Persian. Say it in English, the way you'd really say it on the stairs. Use your own name.
- `intro` fa: جیک یادت هست، همسایهٔ طبقهٔ بالا؟ تصور کن تازه به آپارتمان 3C اسباب‌کشی کرده‌ای. چیزی را که می‌خواهی به او بگویی به فارسی نشانت می‌دهم. همان را به انگلیسی بگو، همان‌طور که واقعاً در راه‌پله می‌گفتی. اسم خودت را بگو.

| # | `id` | `fa` | `points` (en / fa) | `models` | `hints` (en / fa) |
|---|---|---|---|---|---|
| 1 | `ev1-hi` | سلام! من (اسم خودت) هستم. تازه اسباب‌کشی کردم، واحد 3C. | you say your name / اسمت را می‌گویی · you've just moved in, to 3C / تازه به واحد 3C آمده‌ای | "Hi! I'm {name}. I just moved in. I'm in 3C." · "Hi, I'm {name}. I'm new here. I just moved into 3C." | I just moved in / تازه اسباب‌کشی کردم · I'm in 3C / واحد 3C هستم |
| 2 | `ev1-how-long` | شما چند وقته این‌جا زندگی می‌کنید؟ محلهٔ خوبیه؟ | you ask how long he's lived here / می‌پرسی چند وقت است این‌جا زندگی می‌کند · you ask if it's a nice neighborhood / می‌پرسی محلهٔ خوبی است یا نه | "How long have you lived here? Is it a nice neighborhood?" · "So how long have you been here? Do you like the neighborhood?" | How long have you lived…? / چند وقته… زندگی می‌کنید؟ · neighborhood / محله |
| 3 | `ev1-yes-help` | بله، لطفاً! خیلی ممنون. این جعبه خیلی سنگینه. | you say yes to his help, the first time / همان بار اول کمکش را قبول می‌کنی · you say the box is really heavy / می‌گویی جعبه خیلی سنگین است | "Yes, please! Thank you. This box is really heavy." · "Oh, yes, please, that'd be great! It's so heavy." | Yes, please / بله، لطفاً · heavy / سنگین |
| 4 | `ev1-go` | خب، دیگه من برم. از آشنایی‌تون خوشحال شدم. می‌بینمتون! | you say you should go, nicely / مؤدبانه می‌گویی که باید بروی · you say it was nice to meet him / می‌گویی از آشنایی با او خوشحال شدی | "Well, I should go. Nice to meet you! See you around!" · "OK, I should get going. It was nice meeting you, Jake. See you!" | I should go / دیگه من برم · Nice to meet you / از آشنایی‌تون خوشحال شدم |

What counts (the AI's meaning check, per point):
- `ev1-hi`: **any** name counts (never a particular one); the apartment counts as "3C", "3 see",
  "three sea", "3-C", "apartment three C". "I came to this building" gets the point (meaning is
  clear) and the natural version shows "I just moved in".
- `ev1-how-long`: "How long do you live here?" gets the point (the meaning is clear); the natural
  version gives "have you lived" (trap `has-lived`). Jake's answer isn't part of the item.
- `ev1-yes-help`: point 1 needs a **yes in the first sentence**; a reply that opens with "No, it's
  fine" doesn't get it, even if a yes follows (the brief's taarof check).
- `ev1-go`: "I must go" gets the point; the natural version gives "I should go". «می‌بینمتون» →
  "See you around!", not "I see you".
- Traps on purpose: «اسباب‌کشی کردم» → "I moved" (natural: "I just moved in"); «چند وقته… زندگی
  می‌کنید» → present tense; «دیگه من برم» → "I must go".
- Word counts: 9, 11 · 10, 12 · 9, 9 · 10, 12 (all ≤25).
- `NAMES`: "Jake, Biscuit, 3C, Elm Street, Riverton."

**NEW (small):** `{name}` in `models` is the learner's first name (engineering need 6), replaced
before the model is shown or read; with no name, the line drops it ("Hi! I just moved in. I'm in
3C."). The four "what counts" notes need a place the AI sees but the learner doesn't: proposed
`check?: string` on `SayItem`.

---

## 4. Say it again, better (Professional, B1)

### What Mira says

- `title`: About you / از خودت بگو · `short`: About you / از خودت (Day 1's "Tell your story" doesn't fit)
- `does`: Tell a new neighbor a little about yourself, then say it again, better. / کمی از خودت به یک همسایهٔ تازه بگو، بعد دوباره و بهتر بگو.
- `intro` en: Remember Jake, your neighbor upstairs? Imagine you've just moved into 3C. Tell your new neighbor a little about yourself: where you're from, what you do, and one thing you like doing. Share only what you're happy to share. Talk for about half a minute. Then you'll see one or two things to say better, and you can try again.
- `intro` fa: جیک یادت هست، همسایهٔ طبقهٔ بالا؟ تصور کن تازه به آپارتمان 3C اسباب‌کشی کرده‌ای. کمی از خودت به همسایهٔ تازه‌ات بگو: اهل کجایی، به چه کاری مشغولی، و یک کاری که دوست داری انجام بدهی. فقط چیزهایی را بگو که دوست داری بگویی. حدود نیم دقیقه حرف بزن. بعد یکی دو چیز را می‌بینی که می‌شود بهتر گفت، و دوباره امتحان می‌کنی.

### The prompt and the check

- **`question`** (AI prompt and transcription hint): "Tell your new neighbor a little about yourself: where you're from, what you do, and one thing you like doing."
- **`topic`** (replaces "onTopic" line 21): true only if the answer, in English, tells about the
  learner themselves: at least one of where they're from, what they do, what they like doing. It
  doesn't have to be true. Any place, job or situation counts: student, retired, looking for work,
  at home with children.
- **`points`** (AI marks each; NEW, optional): where you're from / اهل کجایی · what you do / به چه
  کاری مشغولی · one thing you like doing / یک کاری که دوست داری. A missing point never fails the
  module: it shows as one chip on the second try ("Add: what you like doing" / «اضافه کن: کاری که
  دوست داری»).
- **`priorities`** (replaces the "past tense kept steady through the story…" order, line 16):
  a/an with jobs ("I'm an engineer", not "I'm engineer") · present simple for facts and habits ("I
  work at…", "I live…") · has/have + past participle for how long ("I've lived here for two years",
  not "I live here since two years") · like + -ing or to ("I like walking", not "I like walk") ·
  prepositions (from, in, at, for) · he/she · word order.
- **Extra rules for this topic:** ignore how names of people, cities and countries are spelled in
  the transcript, and never "fix" them; never comment on where the learner is from, their job, or
  why they moved; only the English. Praise rules stay as they are.
- **Top fixes: at most 2** (the brief: "the top one or two fixes only"). Every mistake is still
  corrected in the better version (spec v3).
- **Timing:** first talk 30–45 s: cap **45 s** (auto-stop), amber from 35 s, minimum 10 s. Second
  try "about 30 seconds": same 45 s cap, so nobody is cut off mid-sentence; the screen says "about
  30 seconds".
- **Cases:** strong ≥ **35** words (40 is a lot for 30 s); "tell me a bit more" under 15 words,
  off-topic or mostly Persian (as today).
- **`ideas`** ("Need ideas?"): "I'm from…" · "I work as… / I'm a student. / I'm retired." · "In my
  free time, I like…"
- **`more`** line: Tell me a bit more: where you're from, what you do, or what you like doing. / کمی
  بیشتر بگو: اهل کجایی، به چه کاری مشغولی، یا دوست داری چه کار کنی.
- **`betterLabel`**: You, a bit better / حرف‌هایت، کمی بهتر (for "Your story, a bit better").
- **Retry lines:** "Say it again in your own words. Try to use these:" / «دوباره با کلمات خودت بگو.
  سعی کن از این‌ها استفاده کنی:» (today «تعریف کن», which means telling a story).

### What the current module would need to become per-chapter

Today everything is Day 1's trip story, in constants and markup. The fields, by place:

| Where | Today (Day 1) | Becomes |
|---|---|---|
| `server/say-better-ai.ts` `QUESTION` (l. 9) | "Tell me about a problem you had on a trip." | `question` per prompt |
| `say-better-ai.ts` prompt l. 16 | mistake order "past tense kept steady through the story, he/she, articles…" | `priorities` |
| `say-better-ai.ts` prompt l. 21 | onTopic "a problem they had while traveling" | `topic` |
| `say-better-ai.ts` l. 18 and `checkFeedback` l. 77 | `MAX_FIXES` (3) and a hard-coded `slice(0, 3)` | `maxFixes` (2 here) |
| `say-better-ai.ts` schema | no points | optional `points` → `covered: boolean[]` |
| `+server.ts` `FeedbackRequest` | `{kind, transcript}` only | adds `prompt` (an id such as `everyday-1`, looked up on the server; prompt text is never taken from the browser) |
| `+server.ts` l. 44 transcription hint | `QUESTION` | `question` of that id (the multipart form also sends `prompt`) |
| `+server.ts` l. 41 | `MAX_SECONDS + 10` | that prompt's `maxSeconds + 10` |
| `+server.ts` l. 66 | `'say-it-better-v1'` | per prompt, for the admin numbers |
| `say-better.ts` | `MAX_SECONDS` 60, `MIN_SECONDS` 10, `STRONG_MIN_WORDS` 40, `TOO_SHORT_WORDS` 15, `clampSeconds` | `maxSeconds` 45, `minSeconds` 10, `strongMinWords` 35, `tooShortWords` 15 |
| `SayItBetter.svelte` l. 185 | ideas "Where were you? What went wrong? What did you do?" | `ideas` |
| `SayItBetter.svelte` l. 187, 194, 191 | "Start talking · 1 minute", "stops by itself at 1:00", amber at 50 | from `maxSeconds`, `amberAt` (35), plus `secondTryLabel` ("about 30 seconds") |
| `SayItBetter.svelte` l. 225 | "Tell me a bit more: what happened, and what did you do?" | `more` |
| `SayItBetter.svelte` l. 251 | "Your story, a bit better" | `betterLabel` |
| `SayItBetter.svelte` l. 179, 182 | «تعریف کن» | neutral "Say it again" lines |
| `SayItBetter.svelte` l. 120 | fetch body without an id | sends `prompt` |
| `day.ts` module | title "Tell your story", `does`, `intro` | per chapter (already per day pack) |

The Module lab's `LabQuestion {id, text, topic, tense}` and its 45 s / 2-focus limits
(`say-better-lab.ts`) are close to this already; the per-chapter prompt could reuse that shape.

---

## New facts for world.md

1. **The learner carries a plant** (Traps `just-thanks`: Jake says "Nice plant!" to the learner, as he
   did to Sara). In the role-play the compliment stays "Nice jacket!".
2. **The learner is the one who asks "Is it a nice neighborhood?"** (Say-it `ev1-how-long`); nothing
   about the neighborhood is stated.
3. **The learner's box is heavy** (Say-it `ev1-yes-help`, matching the role-play's goal card).

---

## Open questions

1. **`where-from` as one two-word button** ("you are"): fine with the owner, or should word-order
   items wait for another type? The on-screen line "Tap the wrong word" would read better as "Tap
   the mistake" for this one.
2. **`has-lived`:** the brief's two-error sentence became a one-error one (tap `lives`, "for" kept).
   OK? The other single-tap version (tap `since`) repeats Day 1's `since-for`.
3. **Engineering beyond the brief's list:** `Phrase.note` (B1 #2 taarof note); `SayItem.check` and
   `{name}` in models; `ReplyTrap` with `optionNotes` (the brief's need 2). Add to "Engineering needs"?
4. **"Which reply?" say step:** "Thanks!" is one short word for speech-to-text (12 s cap, 0.6 s
   minimum: should work, but test it). "Thanks, it was cheap" comes out "self-fixed", which reads
   oddly; for reply items, maybe only right / not yet.
5. **Second-try length:** 45 s cap with an "about 30 seconds" label, or a hard 30 s cap?
6. **"3C" inside Persian text** (intros, Say-it prompts): needs bidi isolation in the UI; Persian
   reviewer to check «واحد 3C» and «آپارتمان 3C» reading order on iPhone.
7. **Speech-to-text risk:** record "Where you are from?" and "My neighbor lives here for six years"
   with a Persian accent before shipping (they may be quietly fixed), as on Day 3.
8. **Regexes** were run in Node against copies of both `normalise()` functions: each `found` matches
   its own sentence and none of the other four in its set, takes the variants listed and rejects
   the habits; each trap's `right`, wrong sentence and extra forms give the results shown (0 failures).
