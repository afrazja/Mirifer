# English Day 2: Sharp ears (Intermediate track, draft)

Status: **draft, for review and owner approval.** Three Module lab modules for the **Intermediate**
track (formerly “Starter”). They use the Day 2 world (`world.md`): the airport, the taxi ride
(`ride-v2.md`), the train and bus info, the Park Hotel, the lost phone and Tom's messages. Each module
is written in its built format (same fields, same counts as its `.ts` file and spec). Only the content
changes. The screens, Mira's lines, scoring and saving stay as built.

All three modules use one fixed voice, **Brian** (`VOICE = 'c'`), as in the code. No speaker is
shown on screen, so a line that Mike, Tom or Sara would say in the story is still read by Brian. The
"Where you'd hear it" columns are for editors only. They are not fields and don't appear in the app.

Persian is informal (تو). English inside Persian is in «», as in Day 1: `label.fa` and `tip.fa` are
rendered through MixedText, which does not strip backticks, so no Persian field may contain a
backtick. Persian sounds are also in «», and stretched sounds are written in Persian letters, like
Day 1's «شیییپ» (here «سیییت», «فووول»).

---

## 1. Minimal pairs duel

Code: `src/lib/practice/minimal-pairs.ts` · Spec: `docs/english-minimal-pairs-spec.md`

**Shape (as built):** `CONTRASTS` has **6** contrasts, each with `label {en, fa}`, `pairs` (**2** word
pairs) and `tip {en, fa}`. That gives 12 duels and 24 fixed words. The voice is Brian, with one
replay. Each pair is written `[side 0, side 1]`.

The sounds were picked because Persian has no matching contrast. Persian has one "i", one "u" and
one long «آ», no "w", and no "th". It also doesn't allow two consonants at the start of a word, so
speakers add a vowel there. Each contrast has at least one word from the Day 2 world, in bold.

| # | `label.en` | `label.fa` | `pairs` | From the world |
|---|---|---|---|---|
| 0 | short i / long ee | «i» کوتاه / «ee» کشیده | sit / **seat** · fill / feel | the back **seat** (Mike found Sara's phone on it) |
| 1 | ah / uh | «ah» / «uh» | boss / **bus** · lock / luck | **Bus** 7 |
| 2 | short u / long oo | «u» کوتاه / «oo» کشیده | **full** / fool · pull / pool | Bus 7 has little space for bags; it's often **full** |
| 3 | v / w | «v» / «w» | vet / wet · vent / **went** | "we **went** through downtown" |
| 4 | th / t | «th» / «t» | **thanks** / tanks · **through** / true | "**Thanks.** Could you drop me off…"; "we'll go **through** downtown" |
| 5 | two consonants / extra vowel | دو صامت پشت هم / مصوت اضافه | **train** / terrain · blow / below | the Airport Express **train**; "the last **train** leaves at 11:30" |

"terrain" is above the level. It is only there to be heard and tapped in the duel, where only the
sound counts.

**Tips** (one line each, shown after a wrong answer and on the result screen):

| # | `tip.en` | `tip.fa` |
|---|---|---|
| 0 | “sit” is short and relaxed. “seat” is longer, with a smile: “seeeat”. | «sit» کوتاه و شل است، چیزی بین «اِ» و «ای». «seat» کشیده‌تر است، با لبخند: «سیییت». |
| 1 | For “boss”, open your mouth wide, like the “aah” you say at the doctor’s. For “bus”, keep it short and relaxed, with your mouth half open: “uh”. | برای «boss» دهانت را زیاد باز کن، مثل «آ»یی که پیش دکتر می‌گویی. برای «bus» صدا کوتاه و شل است و دهانت نیمه‌باز، چیزی بین «اَ» و «آ». |
| 2 | “full” is short and relaxed, with your lips only a little round. “fool” is longer, with your lips round and pushed forward: “foool”. | «full» کوتاه و شل است، بین «اُ» و «او»، و لب‌ها فقط کمی گرد می‌شوند. «fool» کشیده است و لب‌ها گرد می‌شوند و جلو می‌آیند: «فووول». |
| 3 | For “v”, your top teeth touch your bottom lip. For “w”, round your lips like a small “oo”, with no teeth: “went”, “wait”, “where”. | برای «v» دندان‌های بالا روی لب پایین می‌آیند. برای «w» لب‌ها را مثل «او» گرد کن، بدون دندان: «went»، «wait»، «where». |
| 4 | For “th”, put your tongue between your teeth and let the air keep going. For “t”, your tongue taps behind your top teeth and stops the air. | برای «th» نوک زبانت را بین دندان‌ها بگذار و بگذار هوا ادامه پیدا کند. برای «t» زبان پشت دندان‌های بالا می‌زند و هوا را قطع می‌کند. |
| 5 | In “train” and “blow”, the first two sounds go together, with no vowel between them. With an extra vowel (“te-rain”), “train” sounds like “terrain”. | در «train» و «blow» دو صدای اول بدون مصوت پشت هم می‌آیند. اگر بینشان مصوت بگذاری، مثل «ترن» در فارسی، «train» به گوش «terrain» می‌آید. |

**`PERFECT_EAR`** (the on-device check after a perfect round: one word per contrast, on the side
Persian speakers usually find harder). Format: `[contrast, pair, side]`.

| Contrast | Entry | Word |
|---|---|---|
| 0 | `[0, 0, 0]` | sit |
| 1 | `[1, 0, 1]` | bus |
| 2 | `[2, 0, 0]` | full |
| 3 | `[3, 1, 1]` | went |
| 4 | `[4, 1, 0]` | through |
| 5 | `[5, 0, 0]` | train |

**The 24 words to check in Brian's voice** (spec: isolated words can be read oddly): sit, seat, fill,
feel, boss, bus, lock, luck, full, fool, pull, pool, vet, wet, vent, went, thanks, tanks, through,
true, train, terrain, blow, below. "terrain" and "below" must be read with a weak first vowel
(te-RAIN, be-LOW), not a stressed one; that is what makes them sound close to "train" and "blow".

---

## 2. Connected speech

Code: `src/lib/practice/connected-speech.ts` · Spec: `docs/english-connected-speech-spec.md`

**Shape (as built):** `PATTERNS` has **6** patterns, each with `label {en, fa}` and `tip {en, fa}`.
`ITEMS` has **10** items, each with `pattern`, `spoken`, `soundsLike`, `choices` (**3**) and `answer`
(0–2). The voice is Brian at natural rate 1.3 and slow rate 0.9, with one replay.

The six built pattern groups are kept, because the spec says the groups come back across days. The
tips are rewritten with Day 2 examples. If `PATTERNS` stays one shared constant, keep the built tips
and use only the items below.

### Patterns

| # | `label.en` | `label.fa` | `tip.en` | `tip.fa` |
|---|---|---|---|---|
| 0 | gonna · wanna · gotta | «gonna» · «wanna» · «gotta» | In fast speech, “going to” becomes “gonna”, “got to” becomes “gotta” and “want to” becomes “wanna”: “I was gonna take the highway.” Use “gonna” only before a verb. | در گفتار سریع، «going to» می‌شود «gonna»، «got to» می‌شود «gotta» و «want to» می‌شود «wanna»: «I was gonna take the highway». «gonna» را فقط قبل از فعل به کار ببر. |
| 1 | “you” joining in | چسبیدن «you» | “you” gets short (“ya”) and joins the word before it: “do you” sounds like “d’ya”, and “did you” like “didja”. | «you» کوتاه می‌شود («ya») و به کلمهٔ قبلش می‌چسبد: «do you» مثل «d’ya» و «did you» مثل «didja» شنیده می‌شود. |
| 2 | linking into a vowel | وصل شدن به مصوت | When the next word starts with a vowel sound, the words join. A consonant moves over to the next word: “about an hour” sounds like “a-bou-da-nour” (in American English, a t between vowels sounds like a quick d, and the h in “hour” is silent). After “ee”, a small “y” joins the words: “drop me off” sounds like “drop-mee-yoff”. | وقتی کلمهٔ بعدی با صدای مصوت شروع شود، دو کلمه به هم وصل می‌شوند. صامتِ آخر کلمهٔ اول به کلمهٔ بعدی می‌چسبد: «about an hour» مثل «a-bou-da-nour» شنیده می‌شود (در انگلیسی آمریکایی، «t» بین دو مصوت شبیه یک «d» سریع است و «h» در «hour» خوانده نمی‌شود). بعد از صدای «ای»، یک «ی» کوتاه دو کلمه را وصل می‌کند: «drop me off» مثل «drop-mee-yoff». |
| 3 | should’ve · could’ve | «should’ve» · «could’ve» | “have” after should, could or would shrinks to “’ve”, which sounds like “uv”: “should’ve” sounds like “should-uv”. It sounds like “should of”, but we write “should have” or “should’ve”. | «have» بعد از «should»، «could» یا «would» کوتاه می‌شود و مثل «uv» شنیده می‌شود: «should’ve» مثل «should-uv». به گوش «should of» می‌آید، ولی می‌نویسیم «should have» یا «should’ve». |
| 4 | dropped t and d | حذف «t» و «d» | A t or d between two consonants often disappears: “last train” sounds like “las’ train”, and “next stop” like “nex’ stop”. | «t» یا «d» بین دو صامت اغلب شنیده نمی‌شود: «last train» مثل «las’ train» و «next stop» مثل «nex’ stop». |
| 5 | tiny “of” and “and” | کوتاه شدن «of» و «and» | Small words get very short: “of” sounds like “uh” and “and” like “n”. “a lot of traffic” sounds like “a lodda traffic”, and the Airport Express is “fast and cheap”, which sounds like “fast ’n cheap”. | کلمه‌های کوچک خیلی کوتاه می‌شوند: «of» مثل «uh» و «and» مثل «n» شنیده می‌شود. «a lot of traffic» مثل «a lodda traffic» شنیده می‌شود، و قطار فرودگاه «fast and cheap» است که مثل «fast ’n cheap» شنیده می‌شود. |

### Items (in story order)

The pattern order is 4, 2, 1, 0, 5, 2, 1, 3, 0, 3, so the same pattern never comes twice in a row.
The pattern counts are 0×2, 1×2, 2×2, 3×2, 4×1 and 5×1, as in the built set. The answers fall in
positions 1, 2, 0, 2, 0, 2, 1, 0, 1, 0: position 0 four times, 1 and 2 three times each, as in the
built set.

| # | `pattern` | `spoken` (what Brian reads) | `soundsLike` | `choices` (0 / 1 / 2) | `answer` | Where you'd hear it (editors only) |
|---|---|---|---|---|---|---|
| 1 | 4 | The last train leaves at eleven thirty. | The las’ train leaves at eleven thirty. | The next train leaves at eleven thirty. / **The last train leaves at eleven thirty.** / The fast train leaves at eleven thirty. | 1 | Airport announcement (last Airport Express 11:30 p.m.) |
| 2 | 2 | The bus takes about an hour. | The bus takes a-bou-da-nour. | The bus takes about half an hour. / The bus takes about two hours. / **The bus takes about an hour.** | 2 | Bus 7 info |
| 3 | 1 | Do ya take cards? | D’ya take cards? | **Do you take cards?** / Do they take cards? / Does it take cards? | 0 | Sara to Mike (ride line 8) |
| 4 | 0 | I was gonna take the highway. | I wuz gonna take the highway. | I wanted to take the highway. / I’m going to take the highway. / **I was going to take the highway.** | 2 | Mike (ride line 5) |
| 5 | 5 | There’s a lot of traffic near the station. | There’s a lodda traffic near the station. | **There’s a lot of traffic near the station.** / There’s a little traffic near the station. / There’s lots of traffic near the station. | 0 | Mike, downtown |
| 6 | 2 | You can drop me off here. | You can drop-mee-yoff here. | You can drop us off here. / You can drop me here. / **You can drop me off here.** | 2 | Sara at the hotel (Natural phrases #5) |
| 7 | 1 | Did ya leave it in the taxi? | Didja leave it in the taxi? | Did he leave it in the taxi? / **Did you leave it in the taxi?** / Did I leave it in the taxi? | 1 | The front desk, about Sara's phone |
| 8 | 3 | I should’ve checked the back seat. | I should-uv checked the back seat. | **I should have checked the back seat.** / I should check the back seat. / I could have checked the back seat. | 0 | Sara, after she finds the phone is gone |
| 9 | 0 | With RideNow, you gotta pay in the app. | With RideNow, ya godda pay in the app. | With RideNow, you want to pay in the app. / **With RideNow, you’ve got to pay in the app.** / With RideNow, you’re going to pay in the app. | 1 | Tom, about getting to dinner |
| 10 | 3 | You could’ve taken the train. | You could-uv taken the train. | **You could have taken the train.** / You couldn’t have taken the train. / You should have taken the train. | 0 | Tom at dinner |

Notes on the choices (spec: they differ only in the reduced part, all are natural, and none is ruled
out by grammar or meaning alone):
- #3: "Does it take cards?" is what you'd ask about a card machine, so it's natural too.
- #4: the line stops before "but it's closed". With that clause, "I'm going to take the highway"
  would be ruled out by meaning.
- #6: "drop me here" is natural, and the only difference is the linked "off". That is the point of
  the item.
- #10: all three choices keep "have taken", so none is ruled out by the heard "taken".

---

## 3. Dictation sprint

Code: `src/lib/practice/dictation.ts` · Spec: `docs/english-dictation-sprint-spec.md`

**Shape (as built):** `ITEMS` has **10** items, **one of each `kind`** (time, number, price,
quantity, date, address, code, phone, spelling, email). Each item has `kind`, `line`, `ask {en, fa}`,
`placeholder`, `answer`, `accept[]`, `inputMode` and `tip {en, fa}`. The voice is Brian, with up to 2
plays (the second is marked). The items go from easier to harder, in the same kind order as the
built set.

### Items

| # | `kind` | `line` (what Brian reads) | `ask.en` | `ask.fa` | `placeholder` | `answer` | `inputMode` | Where it comes from |
|---|---|---|---|---|---|---|---|---|
| 1 | time | The last Airport Express train leaves at eleven thirty p.m. | What time is the last train? | آخرین قطار ساعت چند حرکت می‌کند؟ | e.g. 9:30 | 11:30 | decimal | Airport announcement; last train 11:30 p.m. |
| 2 | number | Today the taxi takes about forty minutes. | How many minutes does the taxi take today? | امروز با تاکسی چند دقیقه طول می‌کشد؟ | a number | 40 | numeric | The ride: highway closed, about 40 minutes |
| 3 | price | Bus seven costs three fifty. | How much is Bus 7, in dollars? | کرایهٔ اتوبوس شمارهٔ ۷ چند دلار است؟ | e.g. 2.50 | $3.50 | decimal | Bus 7 info: $3.50 |
| 4 | quantity | Bus seven comes every half hour. | How often does Bus 7 come, in minutes? | اتوبوس شمارهٔ ۷ هر چند دقیقه یک بار می‌آید؟ | a number | 30 | numeric | Bus 7 info: every 30 minutes |
| 5 | date | The Park Hotel opened on March thirteenth last year. | When did the hotel open? (day and month) | هتل چه تاریخی افتتاح شد؟ (روز و ماه) | e.g. June 5 | March 13 | text | The hotel's welcome message (world: opened on March 13 last year) |
| 6 | address | The Park Hotel is at two ten Main Street. | What’s the hotel’s street number? | پلاک هتل چند است؟ | a number | 210 | numeric | 210 Main Street |
| 7 | code | Mike’s taxi number is G J seven four one. | What’s Mike’s taxi number? | شمارهٔ تاکسی مایک چیست؟ | letters and numbers | GJ741 | text | Riverton Taxi, about the lost phone (world: car GJ741) |
| 8 | phone | The number for Riverton Taxi is four oh two, five five five, oh one seven three. | What’s the phone number? | شمارهٔ تلفن چند است؟ | digits | 402 555 0173 | tel | Sara calls Riverton Taxi from the front desk (world: (402) 555-0173) |
| 9 | spelling | Ask for Daniel at the front desk. That’s D, A, N, I, E, L. | How is his name spelled? | اسمش چطور نوشته می‌شود؟ | letters | DANIEL | text | Daniel, the front desk |
| 10 | email | The hotel’s email is desk at park dash riverton dot com. | What’s the hotel’s email address? | آدرس ایمیل هتل چیست؟ | name@example.com | desk@park-riverton.com | email | The hotel's message (world: desk@park-riverton.com) |

#4 is a quantity in the same way as the built "a dozen" (a phrase that stands for a number), so the
ten kinds stay one each.

### What counts (`accept`) and what must not

Each answer is compared after the built `normalise` for its kind. Every `answer` passes its own
`accept` list.

| # | `accept` | Must be rejected (for the tests) |
|---|---|---|
| 1 | `11:30`, `23:30`, `eleven thirty`, `11:30 pm`, `11:30pm`, `half past eleven` (11.30 and "11:30 p.m." normalise to these; `11:30pm` is listed because the normaliser strips "pm" only after a space) | 11:13, 12:30, 1:30 |
| 2 | `40`, `forty` | 14, fourteen |
| 3 | `3.50`, `3,50`, `3.5`, `3,5` ($ and "dollars" ignored) | 350, 3.15, 13.50 |
| 4 | `30`, `thirty`, `half an hour`, `half hour`, `30 minutes`, `every 30 minutes` | 13, thirteen, 15, 60 |
| 5 | `march 13`, `13 march`, `march thirteenth`, `thirteenth march`, `3/13`, `03/13` (also covers "March 13th" and "the thirteenth of March") | March 30, March 3, May 13 |
| 6 | `210`, `two ten`, `two-ten`, `two hundred ten`, `two hundred and ten`, `210 main street`, `210 main st` | 2010, 200, 21 |
| 7 | `gj741` (spaces and dashes ignored) | JG741, GG741, GJ714 |
| 8 | `4025550173` (digits only; a letter O counts as zero) | 402 555 173, 402 555 0137 |
| 9 | `daniel` (letters only) | Daneil, Danial, Danielle |
| 10 | `desk@park-riverton.com` (case and spaces ignored) | desk@parkriverton.com, desk@park_riverton.com, desk@park-riverton |

### Tips (one line, shown when the answer is wrong or was replayed)

| # | `tip.en` | `tip.fa` |
|---|---|---|
| 1 | “Eleven thirty” is 11:30: first the hour, then the minutes. Americans say times this way much more than “half past eleven”. | «eleven thirty» یعنی ۱۱:۳۰: اول ساعت، بعد دقیقه. آمریکایی‌ها زمان را بیشتر این‌طور می‌گویند تا «half past eleven». |
| 2 | “FORty” is strong at the start. “fourTEEN” is strong at the end, with a long “een”. Listen for where the word is strong. | «FORty» اولش قوی است. «fourTEEN» آخرش قوی است و «teen» کشیده است. گوش بده کجای کلمه قوی است. |
| 3 | Prices are often said as two numbers: “three fifty” is $3.50, not 350. | قیمت‌ها را معمولاً دو تکه می‌گویند: «three fifty» یعنی ۳٫۵۰ دلار، نه ۳۵۰. |
| 4 | Half an hour is 30 minutes. | «half an hour» یعنی ۳۰ دقیقه. |
| 5 | “Thirteenth” (13th) is strong at the end: “thir-TEENTH”. “Thirtieth” (30th) is strong at the start. Americans write the month first: 3/13. | «thirteenth» (سیزدهم) آخرش قوی است: «thir-TEENTH». «thirtieth» (سی‌ام) اولش قوی است. آمریکایی‌ها اول ماه را می‌نویسند: «3/13». |
| 6 | US street numbers are often said in two parts: “two ten” is 210, and “fourteen fifty” is 1450. | پلاک خانه در آمریکا اغلب دو تکه گفته می‌شود: «two ten» یعنی ۲۱۰ و «fourteen fifty» یعنی ۱۴۵۰. |
| 7 | G and J sound close. G is “jee” and J is “jay”. | «G» و «J» شبیه هم‌اند. «G» را «جی» می‌گویند و «J» را «جِی». |
| 8 | In phone numbers, zero is often said “oh”, like the letter O. US numbers come in three groups: 3, 3 and 4 digits. | در شمارهٔ تلفن، صفر را معمولاً «اُو» می‌گویند، مثل حرف «O». شماره‌های آمریکا سه تکه‌اند: ۳، ۳ و ۴ رقم. |
| 9 | English letter names: A is “ay”, E is “ee” and I is “eye”. In “Daniel”, the I comes before the E. | اسم حرف‌ها در انگلیسی: «A» «اِی»، «E» «ای» و «I» «آی» است. در «Daniel» اول «I» می‌آید، بعد «E». |
| 10 | In email addresses, “at” is @, “dot” is . and “dash” is -. | در ایمیل، «at» یعنی «@»، «dot» یعنی نقطه (.) و «dash» یعنی خط تیره (-). |

Stress is «قوی» in every Persian tip here, as in Day 1's Dictation sprint (the other two modules
don't mention stress in Persian).

**To check in Brian's voice before going further** (the spec asks for the letter items): #6 "two
ten" (it must not sound like "two to ten" or "two, ten"), #7 "G J", #9 "D, A, N, I, E, L" and #10
"park dash riverton". If any of these is read badly, change the line.

---

## Automatic checks this file must pass (once it's code)

- Minimal pairs: 6 contrasts × 2 pairs; 12 distinct word pairs and 24 distinct words; a
  `PERFECT_EAR` entry for every contrast, each pointing to an existing word.
- Connected speech: 10 items covering all 6 patterns; 3 distinct choices each; no pattern twice in
  a row; answers in all three positions; `fullOf(ITEMS[0])` is now "The last train leaves at eleven
  thirty." (the built test checks the lab sentence, so update it).
- Dictation: 10 items, one of each kind; `isRight(answer)` is true for every item; the "must be
  rejected" column above becomes the `no(...)` cases. The built tests check lab answers such as
  7:45 and BV412, so update them for this set.
- Every Persian field is Persian, every English string is English, and every half-space is in place.
- No `label.fa`, `tip.fa` or `ask.fa` contains a backtick; English inside Persian is in «».

---

## Notes for the editor (still open)

1. **Track names in `world.md`.** It still says "Starter (A1–A2)" and "Confident (B1+)". Rename
   them to Intermediate and Professional there (outside this file), and confirm the level range for
   Intermediate.
2. **Lines put in someone's mouth** (no new facts, but not in `world.md`): Tom says "With RideNow,
   you gotta pay in the app" and, at dinner, "You could've taken the train"; the front desk asks
   "Did you leave it in the taxi?"; Sara says "I should've checked the back seat". The owner should
   confirm them.
3. **The hotel's email domain.** Before shipping, check that park-riverton.com isn't a real
   business's domain.
4. **Partner words above the level:** vent, tanks, fool, pool, lock, terrain. Acceptable in a duel,
   where only the sound counts, but a reviewer should look at them.
5. **Contrast numbers across days.** Only v/w and th/t match lab contrasts. If the result screen or
   progress compares sounds across days by index, contrast numbers no longer mean the same sound
   from one day to the next.
6. **The on-device pronunciation check** judges by spelling. "through" (silent gh) and "train" vs
   "terrain" may be judged less reliably than the lab words. Test them before the owner relies on it.
7. **Connected speech patterns are one shared constant in code.** If the tips must stay shared
   across days, use the built tips; the items still fit them.
8. **Sound-alikes in Persian tips.** Stretched sounds are now in Persian letters («سیییت»,
   «فووول»). Other sound-alikes («didja», «should-uv», «las’ train», «drop-mee-yoff») stay in
   English in «», because Persian spelling of a consonant cluster (train as «ترین») would teach the
   extra vowel. Day 1 writes some in Persian letters («دیجا», «اِو»); the owner should pick one rule.
9. **Should've and could've** (Connected speech #8 and #10) are B1 grammar, here only for
   recognition, as in the lab set. Confirm they suit the Intermediate track.
10. **-teen/-ty appears twice in Dictation** (#2 forty, #5 thirteenth). The date item could use a
    plain date instead, if the owner prefers.
11. **Dictation #5 date format.** The accept list is US month-first only for numbers (3/13); 13/3
    is not accepted, though it can't be misread. The owner may want to accept it.
12. **The hotel's opening date is trivia.** A more useful date (for example, Sara's check-out) would
    fix today's date in the world. The owner may prefer that.
