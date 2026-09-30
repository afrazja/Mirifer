-- ============================================================
-- MIRIFER: Lesson 1 fixes from the German and Persian content reviews
-- Run in the Supabase SQL Editor after supabase-lesson-exercises.sql.
-- Safe to run more than once. Order and meaning of every dialogue line
-- stay the same, so learners' review cards keep pointing at the same lines.
-- ============================================================
--
-- Before (for reference):
--   8   Oh, interessant! Willkommen in Deutschland.
--   9   Wie alt sind Sie?
--   13  fa: آیا متأهل هستید؟
--   16  fa: من کارشناسی ارشد مهندسی برق دارم.
--   17  Interessant! Viel Erfolg beim Deutschlernen!
--
-- Why:
--   8, 9   the learner is already in Berlin, and a receptionist does not
--          jump to age without a reason ("a few more questions")
--   17     "Interessant!" repeated line 8; "Sehr gut!" fits a degree
--   13, 16 spoken Persian drops "آیا"; "مدرک" makes the degree explicit
--   note   "older people" oversimplified Sie, and "capitalised" did not say
--          that lowercase sie means she/they
-- ============================================================

begin;

update public.sentences s
set audio_text = v.audio_text, translation = v.en, translation_fa = v.fa
from (values
  (8,  'Oh, interessant! Willkommen in Berlin.',                 'Oh, interesting! Welcome to Berlin.',                'اوه، جالب! به برلین خوش آمدید.'),
  (9,  'Noch ein paar Fragen: Wie alt sind Sie?',                'A few more questions: how old are you?',             'چند سؤال دیگر: چند سالتان است؟'),
  (17, 'Sehr gut! Viel Erfolg beim Deutschlernen!',              'Very good! Good luck with your German!',             'خیلی خوب! در یادگیری آلمانی موفق باشید!')
) as v(o, audio_text, en, fa)
where s.lesson_id = (select id from public.lessons where day = 1) and s.sentence_order = v.o;

update public.sentences
set translation_fa = 'متأهل هستید؟'
where lesson_id = (select id from public.lessons where day = 1) and sentence_order = 13;

update public.sentences
set translation_fa = 'من مدرک کارشناسی ارشد مهندسی برق دارم.'
where lesson_id = (select id from public.lessons where day = 1) and sentence_order = 16;

update public.lessons
set grammar_note = $json${
  "title": "du or Sie — two ways to say you",
  "title_fa": "«تو» یا «شما»: du یا Sie",
  "explanation": "German has an informal you (du) for friends, family and children, and a formal you (Sie) for adults you do not know well and for official situations. The formal Sie, Ihnen and Ihr are always written with a capital letter; lowercase sie means she or they.",
  "explanation_fa": "آلمانی دو شکل «تو» دارد: du برای دوستان، خانواده و بچه‌ها، و Sie برای بزرگسالانی که خوب نمی‌شناسی و موقعیت‌های رسمی. Sie و Ihnen و Ihr همیشه با حرف بزرگ نوشته می‌شوند؛ sie با حرف کوچک یعنی «او (زن)» یا «آن‌ها».",
  "basics_key": "pronounsAndSein",
  "examples": [
    {"de": "Wie heißt du?",         "en": "What is your name? (informal)", "fa": "اسمت چیه؟ (خودمانی)"},
    {"de": "Wie heißen Sie?",       "en": "What is your name? (formal)",   "fa": "اسم شما چیست؟ (رسمی)"},
    {"de": "Wie geht es dir?",      "en": "How are you? (informal)",       "fa": "حالت چطوره؟ (خودمانی)"},
    {"de": "Wie geht es Ihnen?",    "en": "How are you? (formal)",         "fa": "حال شما چطور است؟ (رسمی)"}
  ]
}$json$::jsonb
where day = 1;

commit;

-- Check: line 9 and 17 texts, and 4 grammar examples.
--   select sentence_order, audio_text from sentences
--   where lesson_id = (select id from lessons where day = 1) and sentence_order in (8, 9, 17);
--   select jsonb_array_length(grammar_note->'examples') from lessons where day = 1;
