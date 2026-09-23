# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Commands

```bash
# Development
npm run dev           # Start Vite dev server (localhost:5173)
npm run build         # Production build (Vercel adapter)
npm run preview       # Preview production build locally

# Type checking
npm run check         # svelte-check — catches Svelte + TypeScript errors

# Testing
npm run test          # Vitest in watch mode
npm run test:run      # Run tests once (CI)
npm run test:coverage # Coverage report (v8)

# Run a single test file
npx vitest run src/lib/services/data-layer.test.ts
```

Environment variables required (see `.env.example`):
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`

---

## Architecture

### Route Structure

| Route | Purpose |
|---|---|
| `/` | Marketing landing page (guests) |
| `/home` | App home: language selector + nav cards to Daily Lessons / Basics |
| `/lesson` | Main lesson interface (WhatsApp-style chat + voice) |
| `/basics` | German grammar reference |
| `/settings` | User profile, avatar, display name |
| `/admin/*` | Content management (lessons, basics, glossary) |
| `/proxy` | Local proxy utility for development |

### Data Flow

```
Supabase (source of truth)
    ↕  (sync-queue retries on failure)
localStorage (offline cache)
    ↕
data-layer.ts  ←→  Svelte stores  →  components
```

**`data-layer.ts`** is the single entry point for all read/write operations. When authenticated, Supabase is always written first; localStorage is the fallback for reads and the sole store when offline. Never read from Supabase or localStorage directly in components — always go through data-layer.

**`sync-queue.ts`** persists failed cloud writes to `mirifer_sync_queue` in localStorage and retries them (max 5, 10s delay). It deduplicates by operation type + key.

### Lesson Flow

**`lesson-controller.ts`** is a callback-based state machine (not a Svelte store). It receives a `LessonCallbacks` object and drives the lesson by calling them:

```
initLesson() → teach step (TTS plays) → user speaks → evaluateVoiceInput()
    → correct/incorrect → next sentence → … → completion card
    ↳ exam mode: cycles through ExamQuestion list instead
```

The `sessionID` pattern in `appStore` prevents stale async operations: every async chain captures the current session ID at start and aborts if it has changed by the time it resolves.

### Supabase Integration

Server-side auth is handled in `hooks.server.ts` — it creates a Supabase server client, refreshes the cookie-based session, and exposes `locals.supabase`, `locals.session`, and `locals.user` to all routes.

`src/lib/supabase/client.ts` exports a singleton browser client. Import it as `import { supabase } from '$lib/supabase/client'`.

All Supabase responses are validated with Zod schemas before use. Schemas live in `src/lib/schemas/` and are the canonical definition of database shapes — update them when the DB schema changes.

### Svelte Version & Reactivity

This project uses **Svelte 5** with runes syntax:
- `$state()` for reactive variables
- `$derived()` for computed values
- `$effect()` for side effects (prefer `onMount` for one-time init)
- Traditional `writable` stores are still used in `src/lib/stores/` for cross-component state

### Path Aliases

| Alias | Resolves to |
|---|---|
| `$components` | `src/lib/components` |
| `$services` | `src/lib/services` |
| `$stores` | `src/lib/stores` |
| `$data` | `src/lib/data` |
| `$utils` | `src/lib/utils` |

### Bilingual Support (English / Persian)

- `Language` type is `'en' | 'fa'` — stored in `preferencesStore` and persisted via `data-layer.setLanguage()`
- Persian is RTL. Use `$utils/i18n` helpers: `getTextDirection()`, `getTranslation()`, `getTranslationLang()`
- Every user-facing string that needs translation should have both a plain field (`translation`) and a `translationFa` field

### Spaced Repetition

`spaced-repetition.ts` implements SM-2. Cards are stored in Supabase (`sr_cards` table) and locally. Key constraint: ease factor is clamped between **1.3 and 5.0**. Call `recordSRAttempt(day, sentenceId, wasCorrect)` after every lesson sentence — this is the only write path into the SR system.

### Styling

- **No CSS framework** — all styles are scoped `<style>` blocks per component
- Global base styles and CSS custom properties are in `src/app.css`
- Color palette: dark navy background (`#1a1a2e → #16213e → #0f3460`), accent red (`#e94560`, `#ff6b6b`), success green (`#2ecc71`), blue (`#3498db`)
- The lesson page uses a WhatsApp-inspired theme: `#075e54` (header), `#dcf8c6` (sent messages), `#e5ddd5` (chat background)
- Responsive breakpoints at 960px and 640px

### Testing

Tests use **Vitest + jsdom**. The setup file (`src/test/setup.ts`) stubs `SpeechRecognition` and clears localStorage before each test. Supabase calls should be mocked — see `src/test/env.mock.ts` for the env mock pattern.

---

## Deployment

Deployed to **Vercel** via GitHub (`main` branch). The Vercel adapter is configured in `svelte.config.js`.

**How to deploy:**
1. Read `AGENTS.md` and `PROJECT_STATUS.md`, then inspect the current branch, working tree, and remote.
2. Commit intended changes on a working branch and integrate them into `main` after verification.
3. Push `main` to `https://github.com/afrazja/Mirifer.git` to trigger Vercel, then confirm the deployment succeeds.

The shared integration branch is `main` on `origin`; do not assume another laptop has the same local branch or directory name.
