# "Voice messages" (Module lab): spec v1

Status: **built in the Module lab** (owner-approved in chat: "lets build the next module which is voice message"). It is the second of three new module ideas, after "Say it in English" and before "Persian-speaker traps".

## Purpose

People now use English mostly in short voice messages (WhatsApp, Telegram), not live calls. A voice message is one listen and one reply, so it is less stressful than a live conversation, and it trains both skills: understand what someone asks, then answer it.

## The flow

1. **Intro** (Mira, text): four voice messages from a friend, a colleague, your landlord and a clinic. Listen, reply with a voice message, answer their questions. Bottom: Start.
2. **A message** (chat view): the sender (name and who they are), and their voice bubble with a ▶ button and a waveform that fills as it plays.
   - **First:** "Play the message" (■ Stop while it plays); quiet "Can't listen now? Read it" (for deaf learners or a noisy place: it shows the words and unlocks the reply). The message plays sentence by sentence (one audio request per sentence); it can be replayed any time from the bubble.
   - **After one full listen:** the hint "Reply with a voice message, up to 45 seconds. I'll stop when you finish." Bottom: "Record your reply" (mic); quiet "Show the words" / "Hide the words".
   - **Recording:** a "Recording… I'll stop when you finish." bubble. Bottom: "Send" (send icon); quiet "Cancel" (nothing is sent). It stops by itself after at least 1.5 s of speech and then 4 s of quiet (or 8 s of quiet after a short start), with a 45 s cap.
   - **If the mic fails or nothing was heard:** quiet "Skip this message".
   - One bottom bar whose labels change, so keyboard focus is never lost.
3. **Checking…** The server transcribes the reply (OpenAI) and makes one AI call.
4. **Feedback** under the chat: their reply as a green voice bubble (▶) with "You said …", then:
   - the verdict: ✓ "Good reply. You answered everything." / "Almost." + our own "You didn't say …" lines / ✗ "Not yet. Listen again, then answer their questions." / "Reply in English this time." After Not yet, "Sara asked:" lists the questions in the UI language;
   - a natural reply: their reply with the fewest changes, with a missing answer highlighted on Almost;
   - one tip, and ▶ Hear it.
   - If the AI's version can't be used, the model reply is shown as "Another way to reply", never as their own reply fixed (it may not match their choices).
   - The words hide again when the feedback appears.
   - **Bottom:** as in "Say it in English", and "Next message" becomes the main button after a third try. The best try is kept.
5. **End:** "k answered · m almost" and a list with the natural replies. Bottom: Done; quiet "Start again".

## The 4 messages

| From | Asks | Voice |
|---|---|---|
| Sara, a friend | coffee on Saturday at four? bring Ali's book? | Emma |
| Tom, a colleague | is the new time (11:30) OK? send the report before the meeting? | Brian |
| Mr Brown, the landlord | someone at home Thursday 9–12? a photo of the tap today? | Andrew |
| Green Street Clinic | Tuesday at ten or Wednesday at four? | Emma |

Mira (Ava) reads the natural reply. There are only three other English voices, so the clinic shares Sara's.

## The AI check (`src/lib/server/voice-messages-ai.ts`)

- **Returns:** english, answered (one per question), better, tip, tipFa.
- **Generous:**
  - any clear answer counts, yes or no, including "no" with another suggestion;
  - a time that was never offered, said as if it were, doesn't;
  - days and numbers are read generously because of speech recognition.
- **Better:** the fewest changes; [brackets] only for a missing answer that fits what they said.
- **Code checks:**
  - a Persian-script answer is never English;
  - missing answers count as not answered;
  - "better" must be mostly their words, otherwise the model, marked as ours;
  - a tip needs both languages.
- One unit of the daily AI allowance per reply. The route is owner-only.

## Privacy

Replies go through our server to OpenAI speech-to-text and are discarded. The text goes to the AI providers. Everything stays in the browser. The privacy page says this.

## Reviews

- **English coach:**
  - Tom now asks about the time;
  - simpler landlord and Sara lines;
  - natural "You didn't say if …" lines;
  - fairer judging ("no + suggestion", any offered time);
  - "english" only means the language;
  - a model fallback that never contradicts the learner;
  - tip rules;
  - friendlier "Not yet" and error lines.
- **Persian:**
  - parallel «نگفتی … یا نه» lines;
  - «درمانگاه»;
  - «صاحب‌خانه‌ات»;
  - a softer "Not yet";
  - «گوش بده» throughout;
  - the bubble tails mirrored correctly in RTL;
  - English names in <bdi>.
- **Learning UX and accessibility** reviewed screenshots of every screen (English and Persian). Their must-fixes are in:
  - "Read it" before listening (the two reviewers disagreed; this keeps listening first and lets deaf learners in);
  - the questions shown after Not yet;
  - Cancel and a send icon while recording;
  - auto-stop waits for a real reply;
  - a stop icon;
  - skip on mic errors;
  - one bar (focus kept);
  - readable recording text in dark mode;
  - the time limit said before recording;
  - Next after a third try.
- **Later:** a "Slower" replay.
