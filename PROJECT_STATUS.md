# Mirifer handoff

Updated: 2026-09-25.

## Latest work (2026-09-25): English conversation and voice follow-up

- Branch `codex/english-conversation-voice` is pushed to GitHub
  and proposed in ready-for-review [PR #22](https://github.com/afrazja/Mirifer/pull/22).
  Vercel preview `6BVrGQnt3VZctJSiWir7EAoofMtW` is Ready; all four PR checks
  passed. This change is not on `main` or live at `www.mirifer.com`.
- In the hotel pilot, Jamie now presents two room options, responds to the
  learner's choice, invites a question and confirms the move one turn at a
  time. The visible Record answer control uses browser English speech
  recognition to fill editable text; the learner sends it explicitly. Jamie's
  lines use browser speech synthesis, with automatic playback and per-line
  replay. The separate local practice clip remains optional and is not sent.
- Validation: `npm run check` had 0 errors/warnings; 21 focused tests passed;
  preview privacy disclosure loaded. Signed-in preview browser QA covered the
  complete room-choice path through the confirmation prompt, the Persian RTL
  interface, and a phone-width layout without horizontal overflow. Jamie's
  replay control clicked without a browser error. With user consent, Record
  answer started and stopped, then showed the expected no-speech message;
  actual speech transcription and audible output still need a person to test.
  No SQL or new env vars. PR remains unmerged, so the new flow is not live.
- The local untracked `docs/design/` icon drafts were not touched.

## Latest work (2026-09-25): English hotel AI fallback

- PR #21 merged into `main` as `80660d5` on 2026-09-25. The English hotel
  pilot now uses its authored matcher first and
  asks the existing Gemini → DeepSeek → OpenAI chain only for unmatched short
  replies. The model can select only a choice from the current authored step;
  known mission conflicts and completion checks stay deterministic.
- AI-resolved choice IDs survive tab refresh, while no raw learner text is
  stored in server analytics. A verified English-course account may make up to
  12 fallback requests per UTC day. Answer events include an `ai_rescued`
  flag. No SQL migration or new environment variables are required.
- English/Persian help and the privacy policy disclose AI processing; the
  English pilot guide documents the new behavior and cost boundary.
- [PR #21](https://github.com/afrazja/Mirifer/pull/21) passed all four checks.
  Vercel's production deployment `J4jNv4Wq5M97hyjKJ1JHJF5u1398` is Ready
  for `80660d5`, with `www.mirifer.com` assigned. The live privacy page shows
  the new AI disclosure.
- Validation: `npm run check` passed; 19 focused tests passed. The hosted preview
  and live privacy page loaded in the browser. The authenticated production
  English practice flow still needs browser verification; the current browser
  session was redirected to sign-in. The new deployment had zero Error/Fatal
  runtime log entries in the first 30-minute view, with existing Supabase
  `getSession()` warnings. Windows blocked the Vercel adapter's symlink during
  final local packaging; this laptop lacks local Supabase public settings.
- The local `docs/design/` icon drafts remain untracked and were not changed.

## Latest work (2026-09-23): GitHub repository rename

- The repository is now `afrazja/Mirifer`: https://github.com/afrazja/Mirifer.git.
  This checkout's `origin` fetch and push URLs were changed to that address and
  verified against GitHub. Its clean `main` fast-forwarded to `053c7cf` before
  this documentation update. Local Git remotes are per laptop; the other laptop
  must update its own remote and fetch.
- Shared project instructions and deployment notes now use the renamed repo.
  No application behavior changed in this update.

## Earlier work (2026-09-23): conversation provider chain

- `/proxy/converse` now tries Gemini → DeepSeek → OpenAI instead of OpenAI
  only. Drafted as `b93f184` on the home machine (which could not push),
  then rebuilt and reviewed in a Claude Code session and merged as pull
  request #15 into `main` at `053c7cf`. Client contract unchanged: same request shape,
  same reply JSON, same 503/502 meaning.
- Every provider's reply is validated with zod. Gemini gets a response
  schema, and DeepSeek (json_object only) gets the exact key list in its
  prompt, so neither silently falls through to the paid OpenAI leg.
- A refused key on every provider returns 503 and hides the card, as the
  OpenAI-only version did. A network failure during the availability probe
  is not cached.
- OpenAI now defaults to `gpt-4o-mini` (was `gpt-4o`).
- Model IDs verified: `gemini-2.5-flash`, `deepseek-flash` (the old
  `deepseek-chat` id was retired). Production env vars are set in Vercel:
  `GEMINI_API_KEY`, `DEEPSEEK_API_KEY`, `GEMINI_MODEL`, `DEEPSEEK_MODEL`,
  `OPENAI_MODEL`. Check Vercel's current deployment before assuming the change is live.
- Privacy: learner sentences now go to Google (Gemini free tier may be used
  to improve Google's products) and DeepSeek (servers in China). The privacy
  page should say so.

## Earlier handoff (2026-09-09, work laptop)

## Where to resume

- Shared repository: https://github.com/afrazja/Mirifer.git
- Integration branch: `origin/main`.
- The earlier handoff branch `codex/project-handoff` has been integrated into
  `main`. Fetch GitHub and inspect the actual branch history before starting.
- Application baseline reviewed for this handoff: `a675e4e` (English hotel
  pilot). This laptop was fast-forwarded from `954da80` to that baseline.
- Current task: establish shared project instructions and this handoff file.
  No application behavior is changed by this documentation task. Its commit
  can be found with `git log -1 -- AGENTS.md PROJECT_STATUS.md`.

The home laptop has not been inspected or updated from this session. Its next
session should preserve any local work, fetch GitHub, integrate the intended
branch, and read these notes before editing.

## Latest work from GitHub

- `a675e4e`: English hotel conversation pilot at `/practice/english`. One
  experimental authored lesson, not a full English curriculum. It uses a
  deterministic conversation engine, optional local audio recording/playback,
  a tab-local draft, and a separate completion record. It does not transcribe
  or grade pronunciation, call an LLM, or share German progress/XP.
- `a7f833e` and `3df6413`: learning-language chooser at `/languages`, with
  course switching from the app. German is available, English opens the pilot,
  and French remains coming soon. Learning course is separate from the
  English/Persian interface setting.
- See [course selection](docs/language-choice.md) and
  [English pilot](docs/english-hotel-pilot.md) for boundaries and validation
  scenarios. These changes were inspected in Git/code for this handoff; their
  live behavior and tests were not re-verified in this documentation session.

## Product decisions and earlier completed work

- Approved colorful Mirifer logo is shared by landing and app. Its outer
  background blends into the page; the M tile stays green.
- The public hero uses the approved café conversation photo. The earlier app
  preview belongs in "What the app actually is".
- Public English `/` and Persian `/fa` landing pages always use the light
  cream palette, regardless of saved/system dark mode. Entering the app
  restores its saved theme. Implemented in `954da80` and verified live.
- Landing copy must not promise a placement test, exam-date-driven planning,
  half-speed playback, or fixed lesson duration. The statistics strip was
  removed. Lesson duration has not been decided. Do not reintroduce these
  promises without an explicit new product decision.
- Streak displays and word-tile exercises were removed from the app. Grammar
  questions and speaking practice remain, along with XP, badges, and the
  practice calendar. These changes and landing-copy cleanup (`0fb4f6e`) were
  verified live. Playback functionality itself was not removed.
- The in-app install button was removed. Settings and sign-out live in the
  responsive side menu. Admin remains English/LTR regardless of learner
  interface language.
- Home has a focused today-lesson shortcut. The full German learning path is
  `/lessons`, linked as All lessons / Browse all lessons. Locked days remain
  inaccessible, including through direct lesson-day links.
- Private learner insights and tracking were integrated before the latest
  course work (`bec1ce5` through `fe8add2`). Do not assume the German lesson
  analytics funnel already measures the English pilot as a full course.

## Validation history and limits

- Landing light-mode change: 5 theme tests passed, Svelte check had 0 errors
  and 0 warnings, local English/Persian browser checks passed, navigation back
  into the app restored dark mode, and production deployment was verified.
- Streak/tile/copy cleanup: 83 targeted tests passed, Svelte check had 0 errors
  and 0 warnings, and the remaining grammar-to-speaking practice flow was
  browser-checked. English/Persian live copy was checked.
- These are historical results for their respective commits, not a claim
  that all subsequent code has passed the same checks.
- On this Windows machine, a previous local production build encountered a
  Vercel-adapter/symlink issue; the remote Vercel build succeeded. Do not assume
  this limitation applies to the other laptop.

## Open work

- No further feature implementation is assigned by the current handoff request.
- A prior audit noted an internal A1 readiness-day boundary mismatch (60 versus
  curriculum days 1-30). It was outside the approved cleanup and remains a
  follow-up to investigate, not a verified current defect or an instruction
  to change scoring automatically.
- Full additional courses require course-scoped data, caches, assessments, and
  analytics. Do not enable French or expand English by flipping a flag alone.

## Switching laptops

Before leaving, say: **"Save a handoff for my other laptop."** Codex should
update these notes, commit intended work, push it to the appropriate branch,
and identify that branch. Unfinished work should stay off production `main`.

On the other laptop, open its local Mirifer repository folder as the Codex project and
say: **"Check for local changes, safely sync Mirifer from GitHub, and read
AGENTS.md and PROJECT_STATUS.md before continuing."**

GitHub transfers committed code and notes. It does not transfer chat history,
ignored `.env` files, local credentials, browser logins, dependencies, running
servers, or uncommitted files. Each laptop keeps its own local setup.
