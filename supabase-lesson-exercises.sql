-- ============================================================
-- MIRIFER: lesson exercises + the richer Lesson 1
-- Run in the Supabase SQL Editor. Safe to run more than once.
-- ============================================================
--
-- The daily lesson now has three parts:
--
--   1. Warm-up      `words` and `collocations`: the building blocks of the
--                   topic, heard and tapped before the dialogue starts.
--                   (Columns already exist; see supabase-lesson-chunks.sql.)
--   2. Dialogue     `sentences`, as before.
--   3. Exercises    `exercises`: a short check after the grammar moment.
--
-- `lessons.exercises` is a JSON array; the app validates each item on its own
-- and drops a malformed one. Four kinds:
--
--   listen  {id, type, de, options[{en,fa}], answer, explain}
--           the learner hears `de` and picks its meaning
--   choice  {id, type, prompt{en,fa}, de?, options[string | {en,fa}], answer, explain}
--   fill    {id, type, de "with ___", prompt?, options[string], answer, explain}
--   order   {id, type, de, prompt{en,fa}, explain?}
--           the learner puts the shuffled words of `de` in order
--
-- `answer` is the 0-based index into `options`.
--
-- Rules for the content (learned on Day 1):
--   * every word and collocation must occur in the dialogue
--   * a warm-up item is a word, a collocation or a frame ("Ich heiße ..."),
--     never a whole line of the dialogue
--   * a wrong option must be wrong, not just less likely ("Ich bin Ali" is
--     fine German, so it is not used against "Ich heiße Ali")
-- ============================================================

begin;

alter table public.lessons add column if not exists exercises jsonb;

update public.lessons
set words = $json$[
  {"de": "der Beruf",       "en": "job, occupation",         "fa": "شغل، حرفه"},
  {"de": "der Ingenieur",   "en": "engineer",                "fa": "مهندس"},
  {"de": "verheiratet",     "en": "married",                 "fa": "متأهل"},
  {"de": "der Abschluss",   "en": "degree, qualification",   "fa": "مدرک تحصیلی"},
  {"de": "der Master",      "en": "master's degree",         "fa": "کارشناسی ارشد"},
  {"de": "dreißig",         "en": "thirty",                  "fa": "سی"}
]$json$::jsonb,
collocations = $json$[
  {"de": "Guten Morgen",        "en": "Good morning",            "fa": "صبح بخیر"},
  {"de": "Wie geht es Ihnen?",  "en": "How are you? (formal)",   "fa": "حال شما چطور است؟"},
  {"de": "Freut mich",          "en": "Pleased to meet you",     "fa": "خوشبختم"},
  {"de": "Ich heiße …",         "en": "My name is …",            "fa": "اسم من … است"},
  {"de": "Ich komme aus …",     "en": "I come from …",           "fa": "من اهل … هستم"},
  {"de": "… Jahre alt",         "en": "… years old",             "fa": "… ساله"},
  {"de": "von Beruf",           "en": "by profession",           "fa": "از نظر شغل"},
  {"de": "Auf Wiedersehen",     "en": "Goodbye",                 "fa": "خداحافظ"}
]$json$::jsonb,
exercises = $json$[
  {"id": "age-listen", "type": "listen", "de": "Wie alt sind Sie?",
   "options": [{"en": "What is your name?", "fa": "اسم شما چیست؟"}, {"en": "How old are you?", "fa": "چند سالتان است؟"}, {"en": "Where are you from?", "fa": "اهل کجا هستید؟"}],
   "answer": 1,
   "explain": {"en": "Wie alt … = how old. You will hear it in every first conversation.", "fa": "Wie alt … یعنی «چند ساله». در هر گفتگوی اول می‌شنوی‌اش."}},

  {"id": "job-listen", "type": "listen", "de": "Und was sind Sie von Beruf?",
   "options": [{"en": "What do you do for a living?", "fa": "شغل شما چیست؟"}, {"en": "Are you married?", "fa": "آیا متأهل هستید؟"}, {"en": "Where are you from?", "fa": "اهل کجا هستید؟"}],
   "answer": 0,
   "explain": {"en": "Der Beruf is your job, so von Beruf means by profession.", "fa": "Beruf یعنی شغل؛ von Beruf یعنی «از نظر شغل»."}},

  {"id": "name-fill", "type": "fill", "de": "Ich ___ Ali.",
   "prompt": {"en": "Say your name.", "fa": "اسمت را بگو."},
   "options": ["komme", "heiße", "habe"], "answer": 1,
   "explain": {"en": "Ich heiße … is how you give your name.", "fa": "برای گفتن اسم می‌گوییم Ich heiße …"}},

  {"id": "age-fill", "type": "fill", "de": "Ich ___ dreißig Jahre alt.",
   "prompt": {"en": "Say your age.", "fa": "سنت را بگو."},
   "options": ["habe", "heiße", "bin"], "answer": 2,
   "explain": {"en": "In German you are old: Ich bin … Jahre alt. Not “I have”.", "fa": "در آلمانی «هستی» ساله: Ich bin … Jahre alt؛ نه «دارم»."}},

  {"id": "origin-fill", "type": "fill", "de": "Woher ___ Sie?",
   "prompt": {"en": "Ask where someone is from.", "fa": "بپرس اهل کجاست."},
   "options": ["heißen", "kommen", "verheiratet"], "answer": 1,
   "explain": {"en": "Woher kommen Sie? = Where do you come from?", "fa": "Woher kommen Sie? یعنی «اهل کجا هستید؟»"}},

  {"id": "job-question", "type": "choice",
   "prompt": {"en": "Which question asks about someone’s job?", "fa": "کدام سؤال دربارهٔ شغل است؟"},
   "options": ["Woher kommen Sie?", "Was sind Sie von Beruf?", "Sind Sie verheiratet?"], "answer": 1,
   "explain": {"en": "Was sind Sie von Beruf? = What do you do for a living?", "fa": "Was sind Sie von Beruf? یعنی «شغل شما چیست؟»"}},

  {"id": "job-answer", "type": "choice",
   "prompt": {"en": "How do you say “I am an engineer”?", "fa": "«من مهندس هستم» را چطور می‌گویی؟"},
   "options": ["Ich habe Ingenieur.", "Ich heiße Ingenieur.", "Ich bin Ingenieur."], "answer": 2,
   "explain": {"en": "Your job comes after Ich bin, with no “a” in front.", "fa": "بعد از Ich bin شغل می‌آید، بدون حرف تعریف."}},

  {"id": "degree-question", "type": "choice", "de": "Welchen Abschluss haben Sie?",
   "prompt": {"en": "What is Anna asking?", "fa": "آنا چه می‌پرسد؟"},
   "options": [{"en": "What is your name?", "fa": "اسم شما چیست؟"}, {"en": "What degree do you have?", "fa": "چه مدرکی دارید؟"}, {"en": "Where do you live?", "fa": "کجا زندگی می‌کنید؟"}],
   "answer": 1,
   "explain": {"en": "Der Abschluss is a degree or qualification.", "fa": "Abschluss یعنی مدرک تحصیلی."}},

  {"id": "degree-order", "type": "order", "de": "Ich habe einen Master in Elektrotechnik.",
   "prompt": {"en": "I have a master’s degree in electrical engineering.", "fa": "من کارشناسی ارشد مهندسی برق دارم."},
   "explain": {"en": "For a degree you say Ich habe …", "fa": "برای مدرک می‌گوییم Ich habe …"}},

  {"id": "origin-order", "type": "order", "de": "Ich komme aus dem Iran.",
   "prompt": {"en": "I come from Iran.", "fa": "من اهل ایران هستم."}}
]$json$::jsonb
where day = 1;

commit;

-- Check: expect 6 words, 8 collocations, 10 exercises, 19 sentences.
--   select jsonb_array_length(words), jsonb_array_length(collocations),
--          jsonb_array_length(exercises),
--          (select count(*) from sentences s where s.lesson_id = l.id)
--   from lessons l where day = 1;
