# English lesson 1: A quieter room

Entry: choose English at `/languages`, then `/practice/english`. English has a single experimental lesson, not a full beginner curriculum. German and the public landing pages remain unchanged.

## Conversation

The authored engine in `src/lib/practice/hotel.ts` runs entirely in the browser. Stages: explain the noise, identify room 204, reject/check a noisy alternative, ask about the cost of room 512, confirm the move, and recall the price question in a second situation. A replay switches the first offer between a room beside the lift and one facing the street. Optional clarification and directions follow prepared branches.

Matching first uses an explicit list of phrases with case, punctuation and contraction normalization. Known full-phrase errors have reviewed explanations. A valid but unmatched short reply can be classified by the existing Gemini → DeepSeek → OpenAI chain. The model can only select an authored choice for the current step and may give one brief correction; it cannot invent a new receptionist turn or skip a goal. Clear mission conflicts stay with the authored coach. If AI is unavailable, the prepared examples remain available. Completion records a successfully navigated authored path, not language proficiency or pronunciation accuracy.

Optional audio playback only uses an English browser voice with `localService: true`. If none is available, the listen button is omitted. Microphone practice records at most 45 seconds for local playback. Tracks stop on stop, closing the voice panel, timeout, turn change and component disposal. A pending permission request cannot start recording after the panel closes. Audio is never uploaded, transcribed, scored or persisted. Typing and example selection work without microphone permission or speech support.

## Data and cost boundaries

- Refresh/resume: accepted replies, AI-resolved choice IDs and used hint stages in account-scoped `sessionStorage`, keyed by course and scenario. The draft is validated by replaying the engine; corrupt/out-of-order drafts are discarded. It is removed when completion saves successfully. It lasts only in the current tab session.
- Completion: verified Supabase user, active English course, validated branch-ID trail, timestamp, scenario variant and number of hint stages. Only the bounded `user_metadata.english_hotel_v1` value is written. No learner-written text is submitted with completion, no SQL migration is needed, and German progress/XP are never read or written by the pilot.
- Tracker: existing conversation/answer/hint events, with allowlisted `course: en`, `scenario: hotel-quiet-room-v1`, `page: practice` and `ai_rescued` on submitted answers. No lesson day/attempt is attached. Here `correct` means a supported reply was understood; it is not a grammar grade. Raw text and recordings are excluded. The existing lesson funnel is still for German; no new course-level admin reporting is claimed.
- AI: only unmatched text (300 characters maximum), the current step and scenario branch go to the existing provider chain. The authenticated server limits attempts to 12 per learner per UTC day using text-free events. AI responses are schema-checked and constrained to current authored choices. No new SQL or environment variables are needed. Provider requests may incur cost.

## Validation

Test both scene variants, normal paraphrases, AI-rescued paraphrases, common corrections, negated/out-of-context input, wrong room number, premature acceptance, AI unavailability, recall, tampered completion trails, account checks, save failures and per-account draft isolation. Browser-check a new English selection, a complete run, refresh/resume, failed-save retry, replay, course switching, mobile, Persian/RTL, dark mode and keyboard operation. Verify audio is not uploaded.
