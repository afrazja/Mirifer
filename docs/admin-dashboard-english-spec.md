# Admin dashboard: German and English: spec v1 (draft for review)

Status: **draft.** The owner asked for an admin dashboard that tracks both courses. This spec goes to the product-growth and system-designer reviewers before anything is built.

## 1. Where we are (verified in code)

**The dashboard today** (`/admin`, admin-only) is one page of tabs: Overview, Learner journeys, Lessons, Returns, Assessments, Sources, Changes, Obstacles, Data quality. A Users page (`/admin/users`) lists accounts with the German `current_day`. Content tabs (Lessons, Basics, Glossary) edit German content.

The report (`src/lib/analytics/report.ts`, loaded by `learner-insights.ts`) is built from the `events` table (schema version 2), written by the browser through `trackEvent()` (`src/lib/services/analytics.ts`). Metadata is filtered by `safeMetadata()` in `src/lib/analytics/contract.ts`: only listed keys and listed string values survive.

**German** sends a full stream: lesson started/begun/resumed/progress, every answer, hints, reveals, replays, lesson active time, mic, obstacles, audio fallback, free turns, exam, review.

**English** sends almost nothing:
- the hotel conversation sends `conversation_started` / `conversation_completed`;
- the server writes `english_ai_requested` for every AI call (to count the daily allowance), with a `scenario` such as `quick-fire-v1`. The report's metadata filter only knows `hotel-quiet-room-v1`, so the module is dropped when the report reads these rows;
- the **daily lesson** (`/practice/english/today`) sends no events. Its progress lives in the account (`user_metadata.english_progress_v1`: sessions completed, last result, recent listening/speaking tallies; `english_day_v1`: today's session);
- the **Module lab** (15 modules) sends no events; results stay in the browser.

The database has no list of allowed event names (`events` only checks `auth.uid() = user_id`), so new English events need no migration.

## 2. Goals

The owner wants to see, for each course, without leaving one dashboard:
1. **Are people learning?** Learners, sessions started and completed, return after 7 days.
2. **Where do they stop?** The step or module where a session ends.
3. **What works?** For each English module: completion, score band, time, failures. This also feeds the owner's keep/fix/drop review of the 15 lab modules.
4. **What does it cost?** AI calls per day and per module, estimated spend, learners who hit the daily limit.
5. **What breaks?** Mic blocked, audio didn't play, speech-to-text failed, AI failed, by module and browser.

Non-goals: no transcripts, recordings or anything the learner said or typed; no per-learner profiling beyond what the German report already shows; no change to German screens.

## 3. Design

### 3.1 One dashboard, a course switch

A switch at the top: **German | English** (kept in the URL, `?course=de|en`, default `de`, so today's links still work).

| Tab | German | English |
|---|---|---|
| Overview | as today | English version (3.3) |
| Learner journeys | as today | same view, English events |
| Lessons | sentences, as today | **Daily lesson funnel** (3.3) |
| Modules | (none) | **new** (3.3) |
| Returns | as today | same logic, English activity |
| AI cost | (none) | **new** (3.3) |
| Assessments | as today | hidden (German only) |
| Sources, Changes | shared (not per course) | shared |
| Obstacles | as today | English obstacles |
| Data quality | as today | plus English event coverage |

Which course a learner belongs to: the course of the event (`metadata.course`, new on English events), falling back to the account's `target_language`. A learner who switches courses counts in each course for the activity they did there.

### 3.2 English events (new)

Sent through the existing `trackEvent()` (queue, retries, test-account exclusion and privacy rules all reused). Every English event carries `course: 'en'`. New metadata keys and values are added to `safeMetadata()`; unknown values are still dropped.

| Event | When | Metadata |
|---|---|---|
| `en_session_started` | The daily lesson's first module opens (not on page load) | `day` (lesson day number), `length` (15/20), `resumed` |
| `en_module_started` | A module opens, in the daily lesson or the lab | `module` (id from a fixed list), `place` (`day` or `lab`) |
| `en_module_completed` | A module reaches its result screen | `module`, `place`, `outcome` (`done` or `skipped`), `score` (0–100, when the module has one), `actualSeconds` |
| `en_session_completed` | The recap is reached | `day`, `length`, `result` (`strong`/`ok`/`hard`), `actualSeconds` |
| `obstacle` (existing) | Mic blocked, audio failed, transcription failed, AI failed, recording silent | `code` (new English codes), `module` |

The server already writes `english_ai_requested` per AI call; the report learns its `scenario` values (one per module) so cost can be split by module. A list maps each scenario to a module and an estimated cost per call (an editable constant, not live billing).

Privacy: no text, no audio, no transcript, no answer content. Scores are numbers; outcomes are fixed words. The privacy page gets one line about English practice analytics.

### 3.3 English tabs

**Overview.** English learners in the period, daily lessons started and completed, completion rate, 7-day return (the German definition, using English learning activity: a completed module), lab use (admins only, shown separately so it never mixes with learners).

**Daily lesson funnel.** For each step of the day (check-in → each module in order → recap): how many learners reached it, how many finished it, and where the last event was. Split by session length (15/20).

**Modules.** One row per module (daily lesson and lab, kept apart): starts, completions, completion rate, skip rate, median score, median time, obstacle rate (with the top obstacle). Sorted by starts. This is the keep/fix/drop table.

**AI cost.** AI calls per day (chart), per module, per learner (median and highest), estimated spend for the period, learners who hit the daily limit (a `limit_reached` obstacle, sent by the browser when the server answers 429).

**Obstacles, Journeys, Returns, Data quality.** Reuse the German views, filtered to English events; Data quality adds "English events received" and "English learners with no events".

### 3.4 Users page

Add a **Course** column. For English learners: sessions completed, last session date and result (from `english_progress_v1`), instead of the German current day. A filter: All / German / English.

## 4. Build order

1. **English events** (3.2), with tests for the metadata filter. Ship it first: the tabs need data to show, and data only accumulates from the day the events go live.
2. **Course switch, English Overview and Modules** (the most useful views).
3. **Daily lesson funnel and AI cost.**
4. **Users page.**

Each step: tests, svelte-check, a browser check of the admin page with sample events, then the usual PR, CI, merge and deploy.

## 5. Open questions for the reviewers

1. Are these the right numbers for an owner deciding what to build next and which modules to keep? Anything missing or not worth showing?
2. Event design: names, the `place` split (daily lesson vs lab), session/module boundaries, and whether `score` should be a band instead of 0–100.
3. Learners can insert their own events (row-level security only checks the user id), as with German today. Is that acceptable for an internal dashboard, or should English counts that matter (sessions, AI cost) come from server-side data only (`english_progress_v1`, `english_ai_requested`)?
4. Cost: the report reads every event into memory (`readAll`, capped at 100,000 rows). With English events added, when does this need database-side aggregation?
