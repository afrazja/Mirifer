# English Day 4: "Asking the way" (draft v2, after review)

Status: **writing, then review, then owner approval.** Theme 1.14 in `docs/english-themes-plan.md`
(week 1, "Your first trip"). The owner's choices for Day 4 (in chat, 2026-10-22): asking the way;
**the same five modules per version as Days 2–3**; **no end-of-day teaser**; **one item from an
earlier day** inside the lesson.

- `world.md`: the shared world. Every module's content comes from it.
- `listening.md`: Listen and connect (Intermediate), Listen and retell (Professional).
- `phrases-and-messages.md`: Natural phrases (A2 and B1 sets), Persian-speaker traps, Say it in
  English (both sets), Voice messages.
- `conversation.md`: Role-play with a twist (the learner asks a stranger the way), Choose and persuade.

## The two daily lessons

| | Intermediate (A2) | Professional (B1+) |
|---|---|---|
| Check-in | Mira's hello and casual question | The same |
| 1 | Listen and connect: Sara asks Daniel the way to the market | Listen and retell: Greg's way around the closed street; retell it |
| 2 | Natural phrases: A2 set | Natural phrases: B1 set |
| 3 | Persian-speaker traps: 5 (the first is from Day 1) | Say it in English: Professional set, 3 items (the first is from Day 3) |
| 4 | Say it in English: Intermediate set, 4 items | Choose and persuade: to the City Museum on foot along the Riverwalk, or by bus? |
| 5 | Voice messages: Daniel (the backpack is here) and Tom (meet at the fountain) | Role-play with a twist: you ask Paul the way (first run: he's new here; replay: the way around) |
| Recap | Built | Built |

Both follow **hear → say → use**, as on Days 2–3.

## The day's own text (for `day.ts`)

- **Title:** Asking the way · fa: «پرسیدن راه»
- **themePhrase** (Mira says "Today is about …"): asking the way
- **Goal:** By the end, you can ask how to get somewhere, understand the answer, and check it by
  saying it back. · fa: در پایان می‌توانی راه جایی را بپرسی، جواب را بفهمی و با تکرارش مطمئن شوی
  درست شنیده‌ای.
- **Check-in story** (after Mira's hello; true to Day 3): "It's Sunday morning in Riverton. Sara's
  backpack finally arrived, and she wants to walk to the Sunday market in Central Park. But her phone
  has no data, so she can't use a map." · fa: «یکشنبه صبح در Riverton. کوله‌پشتی سارا بالاخره رسیده
  و می‌خواهد پیاده تا بازار یکشنبه در Central Park برود. ولی گوشی‌اش اینترنت ندارد و نمی‌تواند
  نقشه ببیند.»
- **Mira's casual question:** "And you? In a new city, do you ask people for directions, or use a map
  on your phone?" · fa: «و تو؟ در یک شهر تازه، راه را از مردم می‌پرسی یا با نقشهٔ گوشی‌ات پیدا
  می‌کنی؟»
- **Mira's reply when the AI can't answer:** "Thanks for telling me. Today you'll practice asking
  the way, and understanding the answer." · fa: «ممنون که گفتی. امروز پرسیدن راه و فهمیدن جوابش را
  تمرین می‌کنی.»

## Review v1 (English coach, Persian, learning UX), the lead's decisions

- **Map fix:** the park lies between Oak Street and Pine Street, so the Pine Street side gate is on
  your **left** (after the library, also on the left). Fixed everywhere.
- **Earlier-day items go first**, right after Mira's intro mentions them (Traps: Day 1's `call-me`;
  Professional Say it in English: Day 3's `d3-late-checkout`).
- **Role-play:** Paul opens with a plain "Oh, hi there." (no offer of help), so the learner opens the
  request. The `ask` goal needs a full-sentence request, not a polite word. The runs are swapped:
  `new-here` first (the real surprise), `around` as the replay.
- **Choose and persuade:** the friend is tired after his flight (no sore knee) and meets his sister
  at 2:45, so both ways are on time and the choice is tiredness against photos.
- **Retell:** a per-piece task line on the speaking screen ("Now tell a friend the way, from the
  corner of Main and Oak.") is a small code change at build time.
- **Persian:** Latin names in Mira's intros and on cards ("Central Park", «خیابان Oak», Paul); Persian
  script in spoken prompts; the bidi fix for "…" and "/" in trap kinds goes into `latinRuns` at build
  time (it also fixes two Day 3 kinds).
