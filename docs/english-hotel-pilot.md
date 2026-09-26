# English lesson 1: A quieter room

Entry: choose English at `/languages`, then `/practice/english`. English has a single experimental lesson, not a full beginner curriculum. German and the public landing pages remain unchanged.

## Conversation

The lesson is an open role-play with no answer key. The learner is in noisy room 204 and talks to Jamie, the receptionist, in their own words. `src/lib/practice/hotel.ts` holds the scene: a fact sheet (the rooms that are free, what they are like, that moving costs nothing extra tonight, and what Jamie can and cannot do), four goals, the greeting and prepared fallback lines. A replay switches the noisier option between room 310, beside the lift, and room 318, facing the street.

Every learner reply goes to `/api/english/converse` with the conversation so far. The existing Gemini → DeepSeek → OpenAI chain plays Jamie from the fact sheet. Jamie accepts whatever the guest decides: either room, looking first, earplugs, or moving tomorrow. He may mention a downside once but never steers the learner to a particular answer. To get learners speaking at length, he asks open questions and follows up on very short replies. The model also reports which goals the learner has reached and may suggest a corrected sentence with a short English/Persian tip.

The goals are: explain the problem, agree on a solution, find out the cost, and confirm the arrangement. They can be reached in any order and are shown as a checklist beside the conversation. The scene ends when all four are reached and Jamie closes the conversation. A conversation is capped at 16 learner turns.

The server keeps the model in bounds:
- Jamie's line must pass `jamieLineProblem` (at most 60 words, no prices, and no room or other number above 24 that is not on the fact sheet). A failing line gets one rewrite with the reason; only if that fails too is a prepared fallback line used.
- Goals only accumulate, and are returned with an HMAC proof tied to the account and scene variant. The proof is sent back on the next turn and at completion, so no conversation needs to be stored.

Jamie's lines play automatically when voice is on, and each has a replay button. Jamie is voiced by OpenAI `gpt-4o-mini-tts` through `/api/english/voice`, directed to sound like a warm receptionist speaking clearly for a learner. One of four voices (two men, two women) is chosen at random per run. The endpoint accepts only the greeting, the fallback lines, and AI-written lines carrying a server signature from `/api/english/converse`. Responses are cached for a year. If OpenAI fails, Jamie falls back to the free Microsoft voices through `/proxy/tts`, then the browser's voice.

The Record answer button uses browser English speech recognition to fill the answer box; the learner reviews the transcript and sends it. A separate optional practice recorder captures at most 45 seconds for local playback only. Mirifer never uploads, scores or persists raw audio.

## Data and cost boundaries

- **Refresh/resume.** The conversation, goals, goal proof, corrections and voice signatures are kept in account-scoped `sessionStorage` for the current tab. They are removed when completion saves successfully.
- **Completion.** The server requires a verified Supabase user, the active English course, and a valid proof covering all four goals. Only the bounded `user_metadata.english_hotel_v1` value is written: timestamp, variant, number of replies and average words per reply. Completions saved by the earlier guided version (with `hints`) still read correctly. No learner text is submitted with completion.
- **Tracker.** The existing conversation and answer events are used, with allowlisted `course: en` and `scenario: hotel-quiet-room-v1`. `count` on a submitted answer is its word count. `correct` means no correction was suggested; it is not a grade. Raw text and recordings are excluded.
- **AI.**
  - Each learner turn is one provider call, carrying the conversation (replies up to 400 characters) and the scene.
  - The authenticated server allows 40 turns per learner per UTC day, counted with text-free events. A verified admin tester gets 150.
  - The UI distinguishes a reached limit from a provider outage. On failure, the reply stays in the box to retry; there is no offline path.
  - Provider requests incur cost: roughly one small model call per turn, plus one text-to-speech request per new Jamie line.

## Validation

Test both scene variants, different routes through the goals (either room, looking first, earplugs), very short replies, off-topic replies, invented-fact fallbacks, corrections, AI unavailability, the turn limit, forged goal proofs, account checks, save failures and per-account draft isolation. Browser-check a new English selection, a complete run, refresh/resume, failed-save retry, replay, course switching, mobile, Persian/RTL, dark mode and keyboard operation. Verify audio is not uploaded.
