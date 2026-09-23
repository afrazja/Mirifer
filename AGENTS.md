# Mirifer project instructions

## Shared context

This project is developed on two laptops; the other laptop may be off. GitHub
is the shared source for code and handoff notes. Local conversations are not a
shared memory. Read `PROJECT_STATUS.md` before making changes, including in a
resumed conversation after the user switches laptops. Open this repository's
root as the Codex project so these instructions are discovered.

- Repository: https://github.com/afrazja/Mirifer.git
- Website: https://www.mirifer.com/
- Shared integration branch: `main` on `origin`.
- Vercel watches `main`; pushing there can publish a new site deployment.

## Starting or resuming work

1. Read this file and `PROJECT_STATUS.md`; inspect `git status`, the current
   branch, and the configured remote. Do not assume both laptops use the same
   directory or branch name.
2. Fetch from `origin` and inspect changes against `origin/main` and any active
   handoff branch. Fetching alone does not update the working files.
3. For a clean checkout that is behind its intended branch, fast-forward it.
   If there are local changes or divergent commits, preserve them, inspect the
   differences, and integrate deliberately. Do not reset, clean, force-push,
   or overwrite work to make the laptops match. Ask only when intent cannot
   be resolved from the available history and notes.
4. Re-read the updated handoff and relevant feature documentation. Treat
   claims from an older conversation as historical; check the current code.
   If GitHub cannot be reached, report that synchronization is unverified.

## Keeping the next laptop informed

Update `PROJECT_STATUS.md` after substantial work and whenever the user says
"save a handoff", "switching laptops", or an equivalent request. Record:

- Date, relevant branch and commits, completed changes and their purpose.
- Durable product decisions, unfinished work, blockers, and precise next steps.
- Validation actually performed and any checks still needed.
- Whether work is local, pushed to a branch, merged to `main`, or confirmed live.

Keep notes concise and replace stale status. Link to detailed documents rather
than copying a transcript. Do not include secrets, credentials, account data,
or raw learner data.

A request to save a handoff includes committing the intended code and notes
and pushing them to GitHub. Inspect the diff and stage intended files only.
Use a named working branch for unfinished work; saving a handoff does not by
itself authorize publishing unfinished features to `main`. Fetch again before
pushing to avoid overwriting work from the other laptop. Verify the remote
commit, then tell the user the branch to resume. Never say the other laptop
is synchronized until it has fetched and integrated those changes itself.

## Implementation guidance

- The app uses SvelteKit, Svelte 5, TypeScript, Supabase, and Vercel. Use existing
  service boundaries and Svelte runes; no CSS framework is configured.
- For learner data in UI components, use `src/lib/services/data-layer.ts` and
  the existing storage services. Follow existing authenticated server patterns
  for server actions. Validate external data with the existing Zod schemas.
- English/Persian interface language and the selected learning course are
  different settings. Preserve Persian RTL support; admin stays English/LTR.
- Use the current tokens in `src/app.css` and shared components for branding.
  Both public landing pages stay light; the app retains its theme preference.
- Consult `docs/language-choice.md` and `docs/english-hotel-pilot.md` before
  changing course routing or the English pilot. Keep English and German
  progress isolated. French is unavailable until its implementation is ready.
- `README.md` contains legacy prototype instructions. `CLAUDE.md` contains
  useful architecture notes but some palette and worktree details are outdated.
  Use current source and actual Git state instead of those obsolete assumptions.

## Validation and environment

- Install dependencies with `npm ci` when needed; use `npm run dev` locally.
- For code changes, run `npm run check` and relevant tests via
  `npm run test:run -- <test files>`. Verify changed user flows in a browser.
- For documentation-only changes, check accuracy, links, and `git diff --check`;
  application tests are unnecessary unless application code also changed.
- Each laptop needs its own ignored environment files and authenticated tools.
  Use `.env.example` for required configuration; never commit real credentials.
- A Git push is not proof of a successful deployment. Check deployment status
  and the live result before describing a website change as published.
