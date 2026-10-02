# English listening and speaking practice: architecture and plan

Status: proposal, 2 October 2026. Written from the product owner's structure document ("Architecting Active Language Practice") and a system-design review of the code. **V** = verified in code by the reviewer, **R** = reasoning or estimate. Nothing here has been measured. The German course is frozen and out of scope; its engine is reused as a pattern only.

## 1. Product in one paragraph
A premium, personalised practice ground for English **listening and speaking** for Persian-speaking learners (reading third, writing fourth). A daily session built around one theme and goal ("Today you handle a travel problem"): check-in, listen-and-act, scenario with a surprise twist, read-rate-respond, personal story with a second attempt ("Say it again, better"), recap. Each module is a saved checkpoint. Two progress bars (listening, speaking). Marketed as "IELTS-style speaking and listening practice", never as an official partner or with score claims.

## 2. What exists today (V)
- **Conversation**: `/practice/english`, hotel scene with an AI receptionist bounded by a fact sheet, goals, per-turn corrections, end review, drafts, 16 turns max.
- **Listen & retell**: `/practice/english/retell`, 3 pieces (A2, B1), key points checked by an LLM after OpenAI transcription.
- **AI routes** `src/routes/api/english/{converse,retell,review,voice}`: same-origin, sign-in, English course, server-written ledger row, 40 units/day shared (admin 150), 400 characters per reply, 4 MB audio.
- Speaking today is browser Web Speech filling a text box; only Retell records audio. No voice-activity detection, no pause data. `/proxy/stt` and `/proxy/pronounce` are German-only.
- Progress lives in `auth.user_metadata` (client-writable, carried in the session cookie), so it cannot hold session history.
- `PROJECT_STATUS.md` is stale for English; `docs/english-hotel-pilot.md` is the reliable one.

## 3. Requirements
**Functional.** Session with agenda, 15/30/40-minute variants, per-module checkpoints (a partial session counts), resume; six module types plus listening games; two skill bars; word rescue; second-attempt comparison.

**Non-functional.**
- A spoken turn: p50 ≤ 2.5 s, p90 ≤ 4 s from end of speech to first reply audio. Today it is serial and non-streaming; expected 4–8 s (R).
- Poor networks: prefetch each module's authored audio, queue results, a text fallback for every voice step. The service worker caches no audio (V).
- Accessibility: transcripts, replay, 44 px targets, typed alternative, no blocking timers. English stays left-to-right inside the Persian UI.

**Data and legal.**
- Audio stays on the device (for side-by-side playback); server speech-to-text discards it.
- Transcripts are not stored by default; optional 30-day opt-in.
- Paid vendors with data-processing terms only. Reported: session-replay (Clarity) loads on every page and may capture on-screen transcripts; some learner text goes to free-tier or non-EU AI vendors. Both contradict the privacy page and need a decision.
- Every new table `ON DELETE CASCADE` (`delete-account.ts` relies on it). Age gate 16+ (voice plus GDPR). "IELTS-style" only: no branding, score claims or real exam items.

**Content and team.** Authored, level-tagged, Persian glosses, native review, audio frozen by content hash. One developer, a native English reviewer, a Persian reviewer, a weekly pack cadence; reviewer agents pre-filter, humans approve.

## 4. Engines
| Engine | Job | Type | Lives in | Effort |
|---|---|---|---|---|
| Planner / orchestrator | pack + minutes → ordered modules, timer, checkpoints, resume | deterministic | client state machine (pattern: `lesson-controller.ts`), pure `plan.ts` | M |
| Day-pack engine | schema, loader, variants | deterministic | JSON in git first, database later | M |
| Speech pipeline | mic, voice-activity detection, clip upload, STT, WPM and pause measurement | deterministic + vendor | client + `/api/english/stt` | L |
| TTS | pre-rendered audio, dynamic lines, cache | vendor | build script + route | S–M |
| Conversation | fact sheet, twist at turn N, one objection, goals, caps | LLM + guards | generalise `converse` / `jamie-line` | M |
| Feedback | key points with quoted evidence, paraphrase, 1–2 fixes, attempt-2 delta | LLM + checks | from `retell` | M |
| Listening games | normalise and match, minimal pairs, spot-the-lie, connected speech | deterministic, no LLM | client | M |
| Reading | text, 1-tap rating, task | deterministic | client | S |
| Word bank / rescue | flag words, spaced review on string ids | deterministic | client + table (reuse the maths, not `sr_cards`) | M |
| Levels + metrics | level per skill from the last N results; aggregates | deterministic | server, rebuildable | M |
| Analytics | `en_*` events (contract is closed: extend `EVENT_NAMES`, allow-lists, tests) | deterministic | existing | S |
| Quota governor | weighted unit ledger via atomic database function; auth on proxies | deterministic | Supabase + routes | M |
| Content pipeline | AI draft → reviewer agents → human sign-off → CI gates | mixed | repo + CI | M |
| Eval harness | goldens, injection, regression | mixed | Vitest + nightly | M |

Known weaknesses today (V): count-then-insert quota is racy, the ledger sits in the analytics events table, retell trusts the client's `seconds`, `/proxy/tts|stt|pronounce` need no login and have no limit, and the English TTS fallback is an unofficial scrape.

## 5. Data model (proposed; own-row RLS, Zod schemas in `src/lib/schemas/`)
`en_sessions` (pack_id, pack_v, planned_min, status) · `en_module_results` (session_id, kind, status, active_s, metrics jsonb, unique idempotency key) · `en_attempts` (attempt_no, words, speech_ms, pause count and total, wpm, points_hit, confidence; **no text**) · `en_skill_state` (skill, level; cache of a pure function) · `en_words` (word_id, spaced-review fields, source) · `en_usage` (day, units; spent by function).
Migration: backfill one result per metadata record, read through for one release, then stop writing metadata.

## 6. Day pack and daily lesson design
```
{ id, v, theme, goal{en,fa}, level{listening,speaking},
  modules[{ kind, audio, transcript, keyPoints[], expectedActions[{id,paraphrases}],
            factSheet, twists[], objections[], task{purpose} }],
  words[], review{who,date} }
```
- **Variants:** 15 min = check-in 1 + listen-act 5 + story 7 + recap 2. 30 = 2+6+10+9+3 (drop reading). 40 = the 35 plus 5 of games and word rescue.
- **Calendar:** a theme family per week; days 1–3 easy, day 4 harder, day 7 boss level; +1 level per two weeks; words return on days +1, +3, +7. First 30 days: 24 packs plus 6 review days.
- **Twist:** the engine triggers authored text at turn N; the model must not invent it.

## 7. Cost per full session (R, verify price pages)
Assuming 12 min of learner audio, 20–25 small-model calls and 3 min of dynamic TTS: speech-to-text about $0.04, LLM $0.02–0.05, TTS about $0.05; total about **$0.10–0.15 per session**, $3–4.50 a month for a daily learner. A frontier model for the scenario is about 5×. Replace request counts with weighted units (one session ≈ 25 requests).

## 8. Testing and observability
Unit tests on the pure engines. Content gates in CI: schema, glosses and audio present, spot-the-lie has exactly one false statement, paraphrase lists non-empty, banned claim words. LLM goldens: 40+ transcripts per feature (accented, silent, off-topic, Persian reply, injection); a covered key point must quote evidence. Log the provider per call. Per call: feature, provider, latency, units, outcome. Client: end-of-speech to first audio, STT failures by browser, module funnel, daily spend alert.

## 9. Roadmap
- **P0 (S–M)** authenticate and cap every proxy, unit ledger, privacy and session-replay fixes, vendor choice.
- **P1 (M)** speech pipeline and "Say it again, better".
- **P2 (M)** planner, checkpoints, 15-minute variant, 7 packs, content tests, first golden set.
- **P3 (M)** listening games, word rescue.
- **P4 (L)** scenario with twist, read-rate-respond, 30/40-minute variants, 30 packs.
- **P5** adaptive levels, paywall.

**Build first (about two weeks):** "Say it again, better" with five prompts on the Retell plumbing, about $0.02 per run. It tests the core claim. Measure second-attempt rate, words-per-minute and key-point delta, day-1/3/7 return, 15 vs 35 minutes.

## 10. Risks and cuts to the original plan
- **35 minutes vs the retention data** (eight sessions fell to one by day six): make 15 minutes the default, 35 opt-in; keep story plus second attempt in every variant; drop reading first, scenario second.
- **Dictation needs typing on a phone** and tests spelling: use tap-to-pick or three-choice gap-fill, typing optional.
- **"Repeat exactly" auto-scoring:** speech recognition repairs accents, so it can't judge articulation. Use listen-record-compare; real pronunciation assessment later.
- **Pauses and words per minute:** transcripts drop fillers and timings. Measure from browser voice-activity detection; define a pause (about 400 ms) and check on 20 recordings.
- **About 15 of 35 minutes are AI-bound:** script the check-in with one LLM acknowledgement.
- **"Personalised" is undefined.** Concretely: an onboarding goal, a level per skill, the learner's own error tags (a fixed list of about 15) and flagged words feeding the next packs. Don't store free-text life details from chat.
- **Level bars from sparse data are noisy:** coarse bands that move after three consistent results.
- **Minimal pairs and "gonna/whaddaya" audio:** TTS can botch them; listen once, then freeze the files.
- "Fastest rate understood" needs multi-speed items: defer.

## 11. Decisions the owner must make (ranked, with a recommended default)
| # | Question | Default |
|---|---|---|
| 1 | Market and payments | Persian speakers outside Iran first; Iran "if reachable", no promises |
| 2 | Business model and price | 7-day trial, then a monthly plan; test price after day-7 data |
| 3 | Voice-data policy | Audio on device, no training, transcripts opt-in for 30 days |
| 4 | Vendors | Paid OpenAI or Azure for learner content; drop free-tier and non-EU AI and the unofficial TTS paths |
| 5 | Levels and exams | A2–B2, IELTS-style Parts 1–3, no band claims |
| 6 | Success metrics | day-7 return, sessions per week, module completion, second-attempt rate, cost per session |
| 7 | What "premium" means | replies under 3 s, natural voice, visible improvement, human-reviewed content |
| 8 | Reviewers | one native English and one Persian reviewer, paid per pack |
| 9 | Content rights | the company owns the packs; human-edited AI drafts; disclaimer |
| 10 | Minors | 16+ gate |
| 11 | Support | Persian channel, a "report this feedback" button, a refund rule |
| 12 | Launch | invite 30–50 German-course learners, then a waitlist |

## 12. Verdict
Feasible for a small team if scoped to a 15-minute checkpointed loop and 30 packs rather than the full 35-minute shell, in roughly 3–4 months (R). The hotel and retell routes already give a working guardrail pattern (fact sheet, line checks, signed proofs), so the new risks are audio, content volume and unit economics, not engineering novelty. What can hurt: unauthenticated proxies, unofficial or free-tier vendor paths in a paid product, pack QA time, and payment and network access for Persian speakers.
