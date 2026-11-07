# Work, Interview 1: "Tell me about yourself" (brief v1, 2026-11-07)

Owner's request: modules for the interview goal; add the field question and build Interview 1.
Reviewed before building by the learning-UX, system-design and English-coach reviewers.

## The learner's work (onboarding)
- After the goal "Work and interviews" (and the level), two tap-to-answer questions, each skippable:
  "What's your field?" (8 fields + "Something else") and "Where are you in your career?"
  (student or first job, 1–3, 3–8, 8+ years).
- Kept in `english_work_v1` (work-profile.ts), not in `english_profile_v1`, whose strict schema
  older code reads. Only enum values: safe in a prompt. Cleared when the goal changes; reset with
  the test accounts. The role-play (converse route) passes it to the scene as `turn.learner`.
- The learning-UX review preferred asking at the first interview step; the owner chose onboarding.

## The chapter (arc `work`, number 301, pilot for the test accounts)
1. Listening: Elena, another candidate, at Greenway Foods with Mark Davis (Listen and connect /
   Listen and retell). Her answer has three parts: now, before, next.
2. Natural phrases (5 per version) for introducing yourself professionally.
3. Persian-speaker traps: years of experience, I've worked… since, interested/interesting,
   graduated, and a "which reply?" item on confident thanks instead of taarof modesty.
4. **Tell me about yourself** (new step, `pitch`): three parts, one screen each (Now, Before, Next),
   spoken or typed, with "I heard…" and Say it again; then the "Say it again, better" engine
   (prompt `interview-pitch`) checks the joined answer: at most two fixes, one per screen, each with
   Say it; then the answer a bit better (blue card, Hear it); then the whole answer once more with
   only the keywords (timed: A2 30–60 s, B1 45–90 s; never "too short"). Score: fixes used.
   Nothing is saved to the account (the system-design review: not in user_metadata; a saved pitch
   needs the owner's privacy decision first).
5. Role-play: the first minutes of the learner's own interview at Crestview Group with Erin Walsh
   (A2: small talk, about you, a follow-up, and a fast line to ask about; B1: a tough question to
   answer positively). Erin names the role from the learner's field when known.

## Safety and reliability (system-design review)
- The saved path now drops unknown step ids instead of failing (shipped first, PR #248).
- The final 100 s answer is recorded at 32 kbps with a longer wait for slow connections.
- Chapter names in admin come from one helper (`chapterLabel`): "Interview 1".
