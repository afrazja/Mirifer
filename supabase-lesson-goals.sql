-- ============================================================
-- MIRIFER: lesson goals + the Lesson 1 rewrite
-- Run in the Supabase SQL Editor. Safe to run once; see the notes below.
-- ============================================================
--
-- 1. `lessons.goals` (jsonb, optional): what the learner will be able to do
--    after the lesson, shown on the start screen, ticked off in the Script
--    drop-down and listed on the completion card.
--
--      [{"id": "name", "en": "Say your name", "fa": "...", "sentences": [5]}]
--
--    `sentences` are 0-based sentence_order values. A goal is done once the
--    learner has moved past all of them. The app works without the column.
--
-- 2. Day 1 now covers a full introduction: hello, name, where you come from,
--    age, job, marital status, degree, goodbye.
--
--    Sentences 0-8 are untouched, so their review cards (spaced_repetition,
--    keyed by day + sentence_order + 1) stay valid. The new lines take
--    orders 9-16. The two closing lines move from 9 and 10 to 17 and 18, and
--    their review cards move with them (sentence_id 10, 11 -> 18, 19), after
--    the orphaned cards for positions that no longer exist are removed.
--
-- BACKUP of Day 1 as it was before this file (orders 0-10):
--    0  R  Hallo! Guten Morgen.
--    1  S  Guten Morgen! Wie geht es Ihnen?
--    2  R  Mir geht es gut, danke. Und Ihnen?
--    3  S  Auch gut, danke.
--    4  R  Ich heiße Anna. Wie heißen Sie?
--    5  S  Ich heiße Ali. Freut mich!
--    6  R  Freut mich auch! Woher kommen Sie?
--    7  S  Ich komme aus dem Iran.
--    8  R  Oh, interessant! Willkommen in Deutschland.
--    9  R  Interessant! Viel Erfolg beim Deutschlernen!
--    10 S  Danke schön! Auf Wiedersehen.
--    description:  You meet someone for the first time. Greet them politely,
--                  exchange names, say where you are from, and say goodbye.
--    grammar_focus: Basic greetings: Hallo, Guten Tag, Tschüss
-- ============================================================

begin;

alter table public.lessons add column if not exists goals jsonb;

-- The two closing lines move to the end.
update public.sentences
set sentence_order = sentence_order + 8,
    difficulty = 'A1',
    day = 1
where lesson_id = (select id from public.lessons where day = 1)
  and sentence_order in (9, 10);

-- Review cards for Day 1 lines past the current last one (sentence_id 12-14,
-- 10 cards with 1-2 attempts) belong to an older, longer Day 1 and point at
-- nothing today. Left alone they would attach to the new lines at those
-- positions, so remove them first.
delete from public.spaced_repetition
where day = 1
  and sentence_id > 11;

-- Their review cards follow them.
update public.spaced_repetition
set sentence_id = sentence_id + 8
where day = 1
  and sentence_id in (10, 11);

-- The new lines. Heard lines use audio_text, spoken lines use target_text.
insert into public.sentences
  (lesson_id, sentence_order, role, audio_text, target_text, translation, translation_fa, difficulty, day)
select l.id, v.o, v.r, v.a, v.t, v.en, v.fa, 'A1', 1
from public.lessons l,
  (values
    (9,  'received', 'Wie alt sind Sie?',                     null::text, 'How old are you?',                          'چند سالتان است؟'),
    (10, 'sent',     null::text, 'Ich bin dreißig Jahre alt.',            'I am thirty years old.',                    'من سی سال دارم.'),
    (11, 'received', 'Und was sind Sie von Beruf?',           null::text, 'And what do you do for a living?',          'و شغل شما چیست؟'),
    (12, 'sent',     null::text, 'Ich bin Ingenieur.',                    'I am an engineer.',                         'من مهندس هستم.'),
    (13, 'received', 'Sind Sie verheiratet?',                 null::text, 'Are you married?',                          'آیا متأهل هستید؟'),
    (14, 'sent',     null::text, 'Ja, ich bin verheiratet.',              'Yes, I am married.',                        'بله، متأهل هستم.'),
    (15, 'received', 'Welchen Abschluss haben Sie?',          null::text, 'What degree do you have?',                  'چه مدرکی دارید؟'),
    (16, 'sent',     null::text, 'Ich habe einen Master in Elektrotechnik.', 'I have a master''s degree in electrical engineering.', 'من کارشناسی ارشد مهندسی برق دارم.')
  ) as v(o, r, a, t, en, fa)
where l.day = 1;

update public.lessons
set description = 'You are registering for a German course at a language school in Berlin. The receptionist, Anna, greets you and asks a few questions. Greet her, tell her your name, where you come from, how old you are, what you do, whether you are married and what you studied, then thank her and say goodbye.',
    description_fa = 'برای ثبت‌نام در یک دورهٔ زبان آلمانی به آموزشگاهی در برلین رفته‌اید. آنا، مسئول پذیرش، به شما سلام می‌کند و چند سؤال می‌پرسد. سلام کنید، اسم و کشورتان، سن، شغل، وضعیت تأهل و تحصیلاتتان را بگویید و در پایان تشکر و خداحافظی کنید.',
    grammar_focus = 'Introducing yourself: Ich heiße…, Ich bin…, Ich komme aus…, Ich habe…',
    grammar_focus_fa = 'معرفی خود: Ich heiße…، Ich bin…، Ich komme aus…، Ich habe…',
    goals = '[
      {"id": "greet",     "en": "Greet someone politely and ask how they are", "fa": "مؤدبانه سلام و احوال‌پرسی کنید", "sentences": [1, 3]},
      {"id": "name",      "en": "Say your name",                               "fa": "اسمتان را بگویید",               "sentences": [5]},
      {"id": "origin",    "en": "Say where you come from",                     "fa": "بگویید اهل کجا هستید",           "sentences": [7]},
      {"id": "age",       "en": "Say how old you are",                         "fa": "سنتان را بگویید",                "sentences": [10]},
      {"id": "job",       "en": "Say what you do for work",                    "fa": "شغلتان را بگویید",               "sentences": [12]},
      {"id": "marital",   "en": "Say whether you are married",                 "fa": "وضعیت تأهلتان را بگویید",        "sentences": [14]},
      {"id": "education", "en": "Say what degree you have",                    "fa": "مدرک تحصیلی‌تان را بگویید",      "sentences": [16]},
      {"id": "goodbye",   "en": "Thank them and say goodbye",                  "fa": "تشکر کنید و خداحافظی کنید",      "sentences": [18]}
    ]'::jsonb
where day = 1;

commit;

-- Check: expect 19 sentences (0-18) with the closing lines at 17 and 18.
--   select sentence_order, role, coalesce(audio_text, target_text)
--   from sentences where lesson_id = (select id from lessons where day = 1)
--   order by sentence_order;
