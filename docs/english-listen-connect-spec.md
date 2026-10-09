# "Listen and connect" (replaces "Listen and act"): spec v2

Status: for owner approval. v1 was reviewed by the English-coach and learning-UX reviewers, and their points are applied (see "What changed from v1" at the end).

## Why the old module goes

Owner's verdict: "Listen and act" was shallow.
- Three rounds of "put the X in the Y", with the same objects and places.
- The only skill was holding a short list in memory.
- The emoji icons were vague and misleading.
- A B1 learner hears nothing new and learns no English from it.

## What B1 learners need from listening

B1 learners catch most single words. They lose the connections between them: which problem goes with which fix, what caused what, what was planned and what really happened, what only counts on a condition, and what is done instead.

The goal: **follow how the facts of a real conversation connect, and notice the small phrases that carry the links.**

## The module

Module 1 of the day, about 4–5 minutes. Owner's design rule: one focused thing per screen, one primary button at the bottom, text only (no icons or pictures).

1. **Listen.**
   - Mira's instruction at the top gives the listening goal. Day 1: "Sara has a problem at the airport. Listen for what went wrong, and what the airline will do about it."
   - Under it, the Play button (primary, at the bottom), playing one conversation of about 45–60 seconds with two voices.
   - Mira's instruction plays first; the conversation starts only when the learner taps Play, so the two never overlap.
   - The questions appear only after the first play has ended.
2. **Questions.** Four question kinds, one screen each. Every question asks about a link, never a single word.
   - **Connect** ("What led to what?"): one cause at a time. The screen shows "1 of 3", the cause, and four full-width result options. Choosing one moves on to the next cause. A quiet "Back to 1" lets the learner change an answer. All four options stay available every time, so the last answer can't be found by elimination. After the third cause the primary button is Check. Feedback comes as three text rows: cause, then "Right" or the right result.
   - **Plan and reality:** what was supposed to happen.
   - **Condition:** what has to happen for something else to happen.
   - **Instead:** what is done in place of something else.
   - For the last three, the learner taps one of three options, then Check.
   - After Check, the options lock. The learner's choice and the right answer are marked in text ("Your answer", "Right answer"), not by colour alone. One line of evidence quotes the conversation, and tapping it plays that line. The primary button stays in place and changes to Next.
   - A quiet "Listen again (1 left)" stays available until the last screen. Only whole-conversation replays are offered, never clips that point to an answer.
3. **How it connects** (one screen).
   - The conversation as text, with the speaker names as text labels and the day's link phrases highlighted. Tapping a line plays it.
   - Mira's line about the day's link phrases sits under it. Bottom: Next.

**Score:** "4 of 6 correct". Connect counts for 3 of the 6 points, and the screen says so. It is never shown as a level or a band.

## Day 1 content (lost luggage)

**Voices** (three distinct ones):
- Mira: Ava, as always.
- Agent: Brian.
- Sara: Emma.

**Spelling:** American, to match the voices.

**Conversation** (about 150 words; the real audio is timed, and cut if it runs over 60 s):

> Agent: Hello, how can I help?
> Sara: Hi. I've just landed from Istanbul, but only one of my bags has come out.
> Agent: Oh, I'm sorry. What does the missing one look like?
> Sara: It's a small green backpack. My big gray suitcase is here, that one's fine.
> Agent: Let me check... Right. It was supposed to be on your flight, but it went to Frankfurt, because the tag had the wrong flight number.
> Sara: Oh no. So when can I get it?
> Agent: It'll be on the evening flight, so we can bring it to your hotel tomorrow morning.
> Sara: The thing is, my medicine's in that backpack, and I need it tonight.
> Agent: In that case, just buy what you need at the pharmacy here. We'll pay you back, as long as you keep the receipt.
> Sara: OK. And my phone charger's in there too. Should I buy one of those as well?
> Agent: No need. You can borrow one at the information desk instead.

It carries six links: was supposed to … but, because, so, in that case, as long as, instead. It echoes one of the day's phrase chunks ("was supposed to") in real use, before the learner says it in Natural phrases.

**Q1, Connect** ("What led to what? 3 points"). The causes come in conversation order; the results are shuffled.
- The tag had the wrong flight number → The backpack went to Frankfurt.
- The backpack is on the evening flight → It reaches her hotel tomorrow morning.
- Her medicine is in the backpack → She buys some at the pharmacy.
- Fourth option (a real result, but its cause isn't listed): Her gray suitcase stays with her.

**Q2, Plan and reality:** What was supposed to happen to the backpack?
- ✓ It was supposed to come on Sara's flight.
- It was supposed to go to Frankfurt.
- It was supposed to go to her hotel.

**Q3, Condition:** The airline will pay for her medicine. What does Sara have to do?
- ✓ Keep the receipt.
- Buy it at the information desk.
- Wait until tomorrow morning.

**Q4, Instead:** Sara asks about buying a charger. What does the agent say?
- ✓ Don't buy one. Borrow one at the desk.
- Buy one and keep the receipt.
- Wait for it with the backpack.

**Link phrases for Day 1:** in that case, as long as, instead.

Mira's line:
- en: "The agent's plan hung on three small phrases: *in that case* (so here's what to do), *as long as* (only if), *instead* (not that, this). They go by fast, so listen out for them."
- fa: «برنامه‌ی کارمند به سه عبارت کوچک بند بود: *in that case* (پس این کار را بکن)، *as long as* (به شرطی که)، *instead* (به‌جای آن). سریع گفته می‌شوند؛ حواست به آن‌ها باشد.»

The Persian is checked by the Persian reviewer before build. *as long as* here means a condition, not «تا وقتی که».

## Rules for every future day's conversation

1. **Length and audio.** 130–150 words, two voices, B1, natural. Time the real audio, with 60 s as the hard limit. Listen to it once to check that the TTS doesn't swallow or wrongly stress the link phrases.
2. **Purpose.** Every line feeds a question or a link, or is needed for realism. Nothing untested, like reference numbers.
3. **Links.** At least four per conversation, and the link types rotate across days. Every "instead", "unless" or "until" has an earlier plan to contrast with. Echo at most one of the day's phrase chunks, and keep it consistent with that day's Natural phrases story.
4. **Questions.** Each question tests a different link. No option on one screen gives away another screen's answer. Check every Connect cause against every result for a second true match, including "part of" relations.
5. **Options.**
   - Wrong options are real details linked to the wrong thing. Where that's impossible, use something realistic that wasn't said, but never anything that contradicts the audio.
   - All options are about the same length (7 words or fewer).
   - The right answer must not be the only option using the transcript's exact words.
   - Questions and options are plain text: link phrases are never in bold there.
6. **The no-listening test.** Before a day ships, someone who hasn't heard the audio answers the questions. If they score above chance, rewrite.
7. **Speakers and topics.**
   - Both speakers are named, and every question uses the same pronouns.
   - Keep to low-stakes topics: no serious illness, money disputes or immigration trouble.
8. **Authorship.** Written by us, reviewed by the English-coach reviewer (Persian lines by the Persian reviewer). No AI at run time.

## Audio handling

- **Playback.** The conversation plays as a sequence of lines, each in its speaker's voice, generated once and cached. One "play" is the whole sequence.
- **Counting plays.** A play counts only when it reaches the end. A play cut off by a call, a hidden tab or a failure is given back.
- **Audio failure.** After two failed attempts, a quiet "Continue without audio" shows the conversation text first, then the questions. The score is still recorded.

## Saved data, review, reload

- **Saved in the browser for the day only:** plays used, answers, and whether each question was checked. An answered-but-not-yet-Next question shows its feedback again after a reload.
- **Reload:** back on the same screen. Nothing plays until a tap, and Play is always visible.
- **Back (read-only):** four one-line results ("Right" or the right answer), then the conversation behind a quiet "Show the conversation".
- **Persian UI:** questions, options and the conversation are English, LTR, inside the RTL page.
- **Progress:** correct / 6 (listening).

## Cost

Three TTS voices, generated once and cached. No AI and no speech-to-text, so nothing per learner.

## What changed from v1

**Content**
- The conversation is tightened: contractions, "tag", no reference number.
- "Instead" is now set up by Sara's question.
- "was supposed to" is echoed once, before the learner says it in Natural phrases.

**Questions**
- They are rebuilt so no two give each other away and none has two right answers. (Old Q1 had the medicine matching the backpack too.)
- No option can be ruled out without listening.
- The question kinds are now Connect, Plan and reality, Condition, Instead.

**Flow**
- Mira gives a listening goal before Play, and the questions appear only after the first play.
- Connect is one cause at a time with four stacked options, instead of a crowded two-column grid.
- Each answer gets an evidence line.

**Voices:** three distinct voices, so Sara never sounds like Mira.

**Audio, reload and review:** fair play counting, a fallback when audio fails, reload saving, and a lighter review screen.

**Rules:** new rules for future days, including the no-listening test, option length, rotating link types, and low-stakes topics.
