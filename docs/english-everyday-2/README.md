# Everyday, Chapter 2: "Making plans" (brief and drafts)

Status: **v2, built as a pilot for the owner's test accounts** (`src/lib/practice/days/everyday-2/`).
Owner's request (2026-10-28): build Everyday Chapter 2 with the group chat in it. The text below is
v1; the content in code is v2, with the reviews applied (next section). Try any step in the Module
lab → Chapters → Everyday 2.

## What the reviews changed (v1 → v2)

- **Never a date:** every invitation is a group's ("a few of us from the building"); Mira: "invites
  her to a game night with a few neighbors". Part 2: Jake says "we're moving pizza to Saturday… Can
  you still come?". Sara checks "Trivia? Like a quiz?" (trivia is above A2).
- **Offering is taught before the chat** (its third goal): A2 phrase "Sounds great! I can bring
  dessert."; B1 phrase "I'll take care of dessert." (instead of "Let me check and get back to you",
  a hedge the chapter argues against).
- **A2 phrase 1 is the invitation:** "We're getting pizza on Friday. Do you want to come?"
- **Traps:** "I am agree" (stiff: nobody answers a plan with "I agree") became "Do you come?" →
  "Do you want to come?"; "See you in Saturday" became "Let's meet in Saturday at seven" (needs
  "on"; "Saturday at seven" alone is fine); "which reply?" options now include "I'll try to come!"
  and "Both are fine, you choose!".
- **B1 step 3** (Say it again, better, `weekend-plans`): Jake asks "Want to get pizza this weekend?";
  tell him your plans, say which day doesn't work, and suggest one that does.
- **The 15-minute lessons keep the steps where the learner says no in their own words:** they leave
  out Traps (A2) and Say it again, better (B1).
- **Voice message:** a clear no is required ("maybe"/"I'll try" don't count); pizza is on Friday, so
  the learner's Saturday stays free for Nina's party; "Imagine you're busy on Wednesday" is in the
  intro.
- **Endings** claim only what every version practiced (no voice message, no twist).
- **Leo's voice is Brian (c)**, not Andrew (Jake's).
- The connect items no longer overlap; distractor "Jake is upset." (the fear a clear no offends).

## Still open

- A2 never says "no + another time" live: a card for the chat ("Imagine you're busy on Saturday
  until 5") would check it (the chat spec's "Next").
- The chapter ending screen repeats the last step's score (learning-UX, should).

The second chapter of the **Everyday** arc (`docs/goal-path-plan.md`). Skills and checks from
`docs/goal-content-framework.md`, Goal 1: "Invite, accept, decline and suggest another time, without
taarof". US English. The live step is the **group chat** (`docs/english-group-chat-spec.md` v2,
built and in the Module lab).

## The situation

**When:** about two weeks after Chapter 1 (after the building barbecue). A Monday evening, in spring.
**Where:** 48 Elm Street, Riverton (the hallway; then a phone call).

**The story line:** Jake invites Sara to the trivia night he goes to with a few neighbors. Sara can't
go on Wednesday, says so kindly and suggests another day. They agree on Thursday at seven, at Tony's
Pizza. Then, on Wednesday, Jake calls: his sister is visiting on Thursday. They move it to Saturday.

**People:** Sara (Emma, d) and Jake (Andrew, a), as in Chapter 1. In step 5, the learner's own
friends **Maya** (Emma, d) and **Leo** (Andrew, a) in a group chat. The learner: "Imagine…", their own
first name.

**Facts (world.md for this chapter):**

| | |
|---|---|
| Trivia night | **The Corner Café**, on **Wednesdays at 7**; a few neighbors from the building go |
| Sara on Wednesdays | A **yoga class** |
| The new plan | **Thursday at 7**, pizza at **Tony's**, on Main Street |
| Jake's call (Wednesday) | His **sister is visiting** on Thursday |
| The final plan | **Saturday at 7**, Tony's. "Bring a jacket, we'll sit outside." |
| Step 5 (the chat) | Nina's 30th (the chat's own facts, `src/lib/practice/chats/birthday.ts`) |

## Can-do lines, and how each is checked

| Can-do | Checked in | How |
|---|---|---|
| Say yes to an invitation, warmly | Phrases, Say it in English | The phrase's pattern; the AI points |
| Say no kindly and clearly, and suggest another time (no vague "maybe") | Traps ("which reply?"), Say it in English (A2); Voice message (B1) | The reply chosen; the AI points ("you say you can't on Wednesday", "you suggest another day") |
| Agree on a day and time | Group chat | Goal "time", with the learner's own words as evidence |
| Make your own choice when friends ask (no "whatever you want") | Traps, group chat | "Which reply?"; goal "place" |
| Offer to do something | Group chat | Goal "task" |
| When a plan changes, sort out a new time (B1) | Group chat twist | The time agreed again after Leo's news |

**Chapter ending** (from `goal`, "You've practiced…" as in Chapter 1):
- Intermediate: "You've practiced saying yes to an invitation, saying no kindly with another day,
  and making a plan with friends in a chat."
- Professional: "You've practiced saying no clearly and suggesting another time, answering a voice
  message, and changing a plan in a group chat."

## The five steps

Steps 2–5 open with one "who and where" clause (steps are often done on different days).

| | Intermediate (A2) | Professional (B1+) |
|---|---|---|
| 1 Understand | **Listen and connect**, two parts (in the hallway; Jake's call) | **Listen and retell**: the same story at natural speed, then retell it in 3–4 sentences |
| 2 Borrow | **Natural phrases** (A2, five) | **Natural phrases** (B1, five) |
| 3 Fix / Try → fix | **Persian-speaker traps** (five) | **Say it again, better**: your plans for the weekend, and invite a friend to one thing (30–45 s) |
| 4 Say it yourself | **Say it in English** (three, Persian prompts) | **Voice messages**: Jake invites you to trivia on Wednesday; you can't |
| 5 Handle it live | **Group chat** (A2): Nina's 30th, Maya leads, Leo reacts | **Group chat** (B1): Nina's 30th, with Leo's twist |

The 15-minute lesson leaves out one middle step, as in Chapter 1: Say it in English (Intermediate),
Voice messages (Professional).

## Mira's check-in (step 1)

- Story: "Remember Sara? She's been in her new apartment for two weeks now. Today, her neighbor Jake
  invites her out." · fa: «سارا را یادت هست؟ حالا دو هفته است در آپارتمان تازه‌اش زندگی می‌کند.
  امروز همسایه‌اش جیک او را به بیرون رفتن دعوت می‌کند.»
- Question: "And you? When a friend invites you and you can't go, what do you usually say?" · fa:
  «و تو؟ وقتی دوستی دعوتت می‌کند و نمی‌توانی بروی، معمولاً چه می‌گویی؟»
- Reply: "Thanks for telling me. Today you'll practice making plans: saying yes, saying no kindly,
  and finding another time." · fa: «ممنون که گفتی. امروز برنامه‌ریزی را تمرین می‌کنی: بله گفتن، نه
  گفتنِ مهربان، و پیدا کردن یک وقت دیگر.»

## 1. Listening

### The conversation (A2, two parts; Sara: Emma, Jake: Andrew)

**Part 1, in the hallway (Monday evening):**
1. Jake: "Hey, Sara! Thanks for coming to the barbecue."
2. Sara: "Hi, Jake! It was so much fun."
3. Jake: "So, a few of us from the building play trivia at the Corner Café."
4. Jake: "We go on Wednesdays at seven. Do you want to come?"
5. Sara: "Oh, I'd love to, but I can't on Wednesday. I have a yoga class."
6. Jake: "No problem! How about Thursday? We're getting pizza at Tony's."
7. Sara: "Thursday works! What time?"
8. Jake: "Seven?"
9. Sara: "Seven is perfect. See you then!"

**Part 2, Jake calls (Wednesday):**
10. Jake: "Hi, Sara, it's Jake."
11. Jake: "Listen, I'm so sorry. My sister is visiting on Thursday."
12. Jake: "Can we move pizza to Saturday? Same time, seven?"
13. Sara: "Oh, no worries! Saturday works for me."
14. Jake: "Great! Oh, and bring a jacket. We'll sit outside."
15. Sara: "Good idea. See you Saturday!"

**Questions (6 points):**
- Part 1:
  - Choice (easy first win): "Where does Jake play trivia?" The Corner Café ✓ · Tony's · The park. (line 3)
  - Connect: cause "Sara has a yoga class on Wednesday." → result "She says she can't come on Wednesday." (line 5)
  - Connect: cause "Sara can't come on Wednesday." → result "Jake suggests Thursday." (line 6); distractor result: "Jake is angry."
- Part 2:
  - Choice: "Why does Jake call?" His sister is visiting ✓ · He has to work · He is sick. (line 11)
  - Choice: "When is pizza now?" Saturday at seven ✓ · Thursday at seven · Saturday at six. (line 12)
  - Choice: "What should Sara bring?" A jacket ✓ · A pizza · Her yoga mat. (line 14)
- Link phrases (Mira at the end): `I'd love to, but…` (a kind no), `How about…?` (another idea),
  `no worries` (it's OK).

### Listen and retell (B1, one voice: Andrew, natural speed, ~120 words)

"On Monday evening, Sara met her neighbor Jake in the hallway. He thanked her for coming to the
building barbecue. Then he invited her to trivia night at the Corner Café, where a few neighbors go
every Wednesday at seven. Sara said she'd love to, but she couldn't on Wednesday, because she has a
yoga class. So Jake suggested Thursday instead: pizza at Tony's, at seven. Sara said Thursday worked
for her. But on Wednesday, Jake called. He was really sorry: his sister was visiting on Thursday. He
asked if they could move pizza to Saturday, same time. Sara said, "No worries! Saturday works for me."
Jake told her to bring a jacket, because they'd sit outside."

Key points: invited to trivia on Wednesday · she said no kindly, because of yoga · Jake suggested
Thursday at Tony's at seven · Jake called: his sister was visiting · moved to Saturday at seven,
bring a jacket.

## 2. Natural phrases

**A2 (five):**
1. "Are you free on Thursday?" (chunk: are you free) · situation: you want to invite a friend.
2. "I'd love to!" (chunk: I'd love to) · a friend invites you to pizza. Tip: `I'd` keeps a small d.
3. "Sorry, I can't on Wednesday. How about Thursday?" (chunk: how about) · you can't go on Wednesday.
4. "What time works for you?" (chunk: what time works) · you want to choose a time together.
5. "Sounds good! See you then." (chunk: see you then) · you agree on the plan.

**B1 (five):**
1. "I'd love to, but I can't on Wednesday." (chunk: I'd love to, but) · Jake invites you to trivia.
2. "Could we do Thursday instead?" (chunk: could we do) · you suggest another day.
3. "Let me check and get back to you." (chunk: get back to you) · you're not sure yet. Mira's note:
   "Only if you will really get back to them: in English, this isn't a polite no."
4. "Something came up. Can we move it to Saturday?" (chunk: something came up) · you have to change a plan.
5. "No worries! Saturday works for me." (chunk: works for me) · a friend changes the plan.

## 3. Persian-speaker traps (A2, five)

1. Word order: "What time **we meet**?" → "What time **do we** meet?" (Persian keeps the order.)
2. "Saturday is good. I **am** agree." → "I agree." («موافقم» is one verb; no "am".)
3. "See you **in** Saturday!" → "See you **on** Saturday!" (on + day, at + time.)
4. **Which reply?** Jake: "Do you want to come to trivia on Wednesday?" You can't go.
   A "Maybe… I'll see." · **B "Sorry, I can't on Wednesday. How about Thursday?"** · C "No."
   Mira: "In Persian, «ببینم چی می‌شه» can be a soft no. In English, 'maybe' sounds like a real maybe,
   so your friend waits for an answer. A kind, clear no with another day is friendlier."
5. **Which reply?** Maya: "Pizza or Thai food, what do you think?"
   A "Whatever you want, you know better." · **B "Pizza sounds great!"** · C "I don't know."
   Mira: "In Persian, «هر چی شما بگید» is polite. In English, friends really want your choice."

## 4. Say it in English (A2, three; to Jake; Persian «تو», a neighbor you know now)

1. «ببخشید، چهارشنبه نمی‌تونم. پنجشنبه چطوره؟» → "Sorry, I can't on Wednesday. How about Thursday?"
   Points: you say you can't on Wednesday · you suggest Thursday.
2. «عالیه! ساعت هفت برام خوبه. می‌بینمت!» → "Great! Seven works for me. See you then!"
   Points: you say seven is good for you · you say see you.
3. «یکشنبه با چند تا از دوستام می‌ریم پارک. تو هم میای؟» → "Some friends and I are going to the park
   on Sunday. Do you want to come?" Points: you say you're going to the park on Sunday with friends ·
   you invite him.

## 4. Voice message (B1; from Jake, Andrew)

"Hey, it's Jake from 4B. So, a few of us are doing trivia at the Corner Café on Wednesday at seven.
Do you want to come? It's really fun, and nobody takes it too seriously. If Wednesday's no good,
we're also getting pizza at Tony's on Friday. Let me know!"

Asks (the reply must):
1. Thank him for the invitation.
2. Say you can't come on Wednesday. (Card: "Imagine you have plans on Wednesday.")
3. Say yes to Friday, or suggest another day.

Model: "Hey Jake, it's {name}. Thanks so much for the invite! I'd love to, but I can't on Wednesday,
I already have plans. Friday sounds great, though. What time are you meeting?"

## 3. Say it again, better (B1)

Question: "Tell a friend what you're doing this weekend, and invite them to join you for one thing."
Ideas: What are you doing on Saturday? · And on Sunday? · What do you want your friend to join?
On topic: talks about their weekend plans (any plans) or invites someone to something.
Fix priorities: present continuous / "going to" for plans ("I'm meeting…", not "I meet…"), "on
Saturday" / "at 7", the invitation question ("Do you want to come?", not "You want come?"), word order.

## 5. Group chat

- Intermediate: `birthday-a2`. Intro: "Imagine your friends Maya and Leo are planning a surprise for
  your friend Nina's 30th birthday. Plan it with them in your group chat. Voice notes are best!"
- Professional: `birthday-b1`. Intro: the same, plus "Plans can change, so keep an eye on the chat."

## Engineering

1. A `group-chat` step type (MODULE_IDS, the analytics contract, StepRunner, `CHATS` per version in
   day-content).
2. A new Say it again prompt, `weekend-plans`.
3. The chapter pack (`everyday-2`, number 102, arc everyday, pilot), its content files, tests.
