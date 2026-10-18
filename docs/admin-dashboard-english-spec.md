# Admin dashboard: German and English: spec v2

Status: **v2, for the owner's approval.** v1 was reviewed by the product-growth and system-designer reviewers; their findings are merged here (see "What changed from v1" at the end).

## 1. Where we are (verified in code)

**The dashboard** (`/admin`, admin-only) has these tabs: Overview, Learner journeys, Lessons, Returns, Assessments, Sources, Changes, Obstacles, Data quality. A Users page lists accounts with the German current day. Everything is built from the `events` table (schema v2), written by the browser through `trackEvent()` and filtered by `safeMetadata()`. **Unknown metadata keys or values are dropped when the event is written, and can't be recovered.**

**German** sends a full stream of events. **English** sends almost none:
- the daily lesson sends no events; its progress lives in the account (`english_progress_v1`, `english_day_v1`);
- the Module lab sends none (and is admin-only);
- the hotel conversation sends started/completed;
- the server writes `english_ai_requested`, but it's the **daily-allowance counter**, not a cost log:
  - greeting, retell and review are recorded under the hotel scenario;
  - Quick-fire records once per round;
  - speech-to-text, spoken replies (`/voice`), free talk and phrases record nothing;
  - the provider (Gemini, DeepSeek or OpenAI) isn't recorded.

**Problems in today's German numbers, caused by English:**
- every `english_ai_requested` row has a random session id, so each AI call counts as a German **visit** (and as "a visit missing a start" in Data quality);
- English sign-ups appear in the German funnel as drop-offs.

**Content:** the English daily lesson has **one day** of content (Day 1), and its 20-minute version includes a step that isn't built yet. Any return number measures people repeating Day 1.

## 2. Goals (for this stage: few learners, English pre-launch)

1. **Who is learning, and do they come back?** Plain counts, with every number linking to the learners behind it.
2. **Where do they stop?** From choosing English to the second session.
3. **What breaks?** Mic, audio, speech-to-text and AI failures, by module.
4. **What does AI really cost?** From server records only, by feature and provider.

Not goals: transcripts, recordings or anything learners said or typed; percentages and medians from tiny numbers; analytics on the Module lab. The lab is used only by the team, so its keep/fix/drop decision is the owner's judgement, kept as a decision list, not a chart.

## 3. Design

### 3.1 One dashboard, a course switch

**German | English** at the top (`?course=de|en`, default `de`; today's links still work).

- **The German views get only German events**, and stay exactly as they are (a regression test checks this).
- **Server-only events** such as `english_ai_requested` are never counted as visits.
- A learner's course comes from `metadata.course` on the event, or for sign-up cohorts from `target_language` / `learning` in the account. A learner who learns both counts in both courses.

### 3.2 Numbers we show

- Counts are shown as **"k of n"**.
- A percentage appears only when n ≥ 20, and a median only when n ≥ 5.
- Every number links to the list of learners behind it.

### 3.3 English events (new)

The four events go through the existing `trackEvent()` (queue, retries, test-account exclusion, privacy rules). `course: 'en'` is added to every event from English pages.

| Event | When (choke point in `today/+page.svelte`) | Metadata |
|---|---|---|
| `en_session_started` | The check-in (greeting) screen shows, in `begin()` | `sessionNumber`, `length` (15 or 20), `resumed` |
| `en_module_started` | A module opens (`brief()`, sent once per session and module) | `module` |
| `en_module_ended` | A module ends: `finish()`, `finishLater()` (`later: true`) or skip | `module`, `outcome` (`done`/`skipped`), `later`, `percentage` (0–100) and `total` when the module has a score, `actualSeconds` (wall time, dropped over 3,600) |
| `en_session_completed` | The recap is reached (`finishRecap()`) | `sessionNumber`, `length`, `result` (`strong`/`ok`/`hard`), `actualSeconds` |
| `obstacle` (existing) | Mic blocked or unavailable, audio failed, speech-to-text failed, AI failed, silent recording | `code`; `module` from a practice context (below) |

- **Session id.** Each daily session gets an id (`DaySession.id`, a UUID set in `startSession()`), sent as the event's `attempt_id`. A session resumed after a reload, or the next day, stays one session.
- **Practice context.** `setPracticeContext({ course, module, attemptId })` / `clearPracticeContext()`, so obstacles reported by the shared audio and speech services carry the module.
- **One list of module ids** (`EN_MODULES` in `contract.ts`), shared by the daily lesson and the lab. The daily `listen-act` and the lab `listen-connect` become one id; a test checks that every module id in the code is on the list.
- **Contract.** The new event names, keys and values are added to `safeMetadata()`:
  - `module` and `result` are fixed lists;
  - `length` is only 15 or 20;
  - `percentage` is an integer from 0 to 100;
  - `later` is a true/false value;
  - the new obstacle codes are `ai_failed` and `recording_silent`.
- **Quit** = a module started with no `en_module_ended` in the same session.
- **The Module lab sends nothing** for now.

### 3.4 AI cost (server records only)

- **Now:** `spendAllowance()` / `recordAllowance()` take a **required, typed scenario**, one per route, so the allowance counter is labelled correctly. In the dashboard it's called "AI allowance units", not cost.
- **Real cost: a new server-only table, `ai_usage`.** Learners can't write to it. It's written from:
  - the AI provider call: provider, model, input and output tokens;
  - `transcribe()`: audio seconds;
  - `/voice`: characters.

  Each row has the route or module, the kind (`llm`, `stt` or `tts`) and whether the call succeeded. The row is deleted with the account. No text and no audio are stored.
- **Cost** = usage × a price table per provider and model (an editable constant). Shown by feature and provider for the period; the Data quality tab compares it with the provider bills.
- **Daily limit reached:** counted from the allowance rows on the server (UTC day, admins excluded). No browser event is used.
- **Hardening:** `/api/analytics` silently drops browser-sent `english_ai_requested` events.

### 3.5 English tabs

- **Overview:** English learners in the period, plus:
  - **Activated:** reached the recap of the first session within 48 hours of choosing English;
  - **Came back:** started a daily session on another calendar day, 1–7 days after activation;
  - **Second session completed**, shown separately.

  All as "k of n". A note says there is only Day 1 content.
- **Funnel:** chose English → onboarding done → check-in shown → first module done → each module → recap reached → second session started. The steps before the session come from account data that already exists.
- **Journeys:** one row per learner, with a timeline of sessions, modules (done, skipped or quit, with score) and obstacles. The most useful view at this size.
- **Obstacles:** English obstacles by module (browser split later, at about 50 learners).
- **Modules:** for the daily-lesson modules only, per module:
  - starts, done, skipped, quit;
  - position in the session;
  - the score as correct/total;
  - obstacles.
- **AI cost:** from `ai_usage` (3.4).
- **Data quality:** English events received. It also compares event-based completed sessions with `english_progress_v1` (both written by the browser; a mismatch shows lost events).

### 3.6 Users page

- A **Course** column (separate from the interface-language column), and a filter: All / German / English.
- For English learners: sessions completed and **last completed** date and result, from `english_progress_v1`. This works on day one, with no new events.

### 3.7 Admin page size

Today the whole report, including every event row in the period, is sent to the browser, which breaks before the 100,000-row limit does.
- Visits are sent as counts, and one learner's journey loads on demand.
- English events are loaded with their own query: course plus a time bound, with an index.
- Paging switches to keyset (`id > last`).
- Data quality shows the event count against the limit, with a warning at about 60%.

## 4. Integrity

- **Browser-written data** (events, `english_progress_v1` in `user_metadata`) is fine for behaviour: funnel, modules, obstacles, returns. It's an internal dashboard and the user base is small; lost events are a bigger risk than fakes.
- **Cost and limit numbers** come only from server-written data (`ai_usage`, allowance rows).

## 5. Privacy

The privacy page gets updated **in the same release as the first new events**:
- English practice events (module, outcome, a numeric score, time, obstacle type);
- AI usage counts per feature (provider, tokens or seconds; no content).

The page has no Persian version and states no retention period for events; both are flagged for a later decision.

## 6. Build order

0. **Foundations** (no visible change):
   - the contract (module list, keys, codes) with tests;
   - scenario labels on every AI route;
   - German views filtered to German, with server-only events excluded from visits (this fixes today's inflated visits);
   - a regression test that German numbers don't change.
1. **English events** (3.3) in the daily lesson, with the privacy page update.
2. **Users page** (3.6), **English Overview, Journeys and Obstacles**, and the payload fix (3.7).
3. **Funnel and Modules.**
4. **AI cost**: the `ai_usage` table (a migration), writes from the AI, speech-to-text and voice calls, the price table, and the tab.

Migrations: the course index (step 2) and `ai_usage` (step 4), in the repo's idempotent `supabase-*.sql` style, applied in Supabase by the owner (or with the owner's go-ahead).

## What changed from v1

- **Product review:**
  - plain counts and learner lists instead of rates;
  - activation and return redefined (another calendar day, not "a completed module");
  - the funnel starts at "chose English", and the session starts at check-in;
  - the lab is out of the analytics;
  - one module id list;
  - Users page and Journeys moved earlier;
  - Modules and cost moved later.
- **System review:**
  - metadata is now explicit in the contract (otherwise lost at write time);
  - a session id instead of the 30-minute visit;
  - `finishLater` is covered;
  - German views are filtered so English can't distort them (it already does today);
  - `english_ai_requested` is treated as an allowance counter, with real cost from a server-only `ai_usage` table;
  - `english_progress_v1` is browser-writable, so it's a cross-check, not the truth;
  - the admin page payload fix;
  - the privacy update ships with the events;
  - the tests and migrations are listed.
