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
-- Sequencing (the lesson is taught a few items at a time, not as one list):
--   * `words` / `collocations` items with a "batch": 1, 2, ... are pre-taught,
--     one card at a time, before the dialogue. Items without a batch are met
--     in the dialogue only. A lesson with no batches keeps the one-screen
--     warm-up.
--   * an exercise with "after": "batch-2" is asked right after that batch;
--     "after": 12 is asked right after the dialogue line with that 0-based
--     index; with no "after" it is part of the closing set at the end.
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
  {"de": "der Beruf", "en": "job, occupation", "fa": "شغل، حرفه", "batch": 2},
  {"de": "der Ingenieur", "en": "engineer", "fa": "مهندس"},
  {"de": "verheiratet", "en": "married", "fa": "متأهل", "batch": 2},
  {"de": "der Abschluss", "en": "degree, qualification", "fa": "مدرک تحصیلی"},
  {"de": "der Master", "en": "master's degree", "fa": "کارشناسی ارشد"},
  {"de": "dreißig", "en": "thirty", "fa": "سی"}
]$json$::jsonb,
collocations = $json$[
  {"de": "Guten Morgen", "en": "Good morning", "fa": "صبح بخیر"},
  {"de": "Wie geht es Ihnen?", "en": "How are you? (formal)", "fa": "حال شما چطور است؟", "batch": 1},
  {"de": "Freut mich", "en": "Pleased to meet you", "fa": "خوشبختم"},
  {"de": "Ich heiße …", "en": "My name is …", "fa": "اسم من … است", "batch": 1},
  {"de": "Ich komme aus …", "en": "I come from …", "fa": "من اهل … هستم", "batch": 1},
  {"de": "Ich bin … Jahre alt", "en": "I am … years old", "fa": "من … ساله هستم", "batch": 2},
  {"de": "von Beruf", "en": "by profession", "fa": "از نظر شغلی"},
  {"de": "Auf Wiedersehen", "en": "Goodbye", "fa": "خداحافظ"}
]$json$::jsonb,
exercises = $json$[
  {"id": "name-fill", "type": "fill", "de": "Ich ___ Ali.", "after": "batch-1", "prompt": {"en": "Choose the word for giving your name.", "fa": "کلمهٔ درست برای گفتن اسمت را انتخاب کن."}, "options": ["komme", "heiße", "habe"], "answer": 1, "explain": {"en": "Ich heiße … is how you give your name.", "fa": "برای گفتن اسم می‌گوییم: \u2066Ich heiße Ali\u2069"}},
  {"id": "komme-fill", "type": "fill", "de": "Ich ___ aus dem Iran.", "after": "batch-1", "prompt": {"en": "Choose the word for saying where you are from.", "fa": "کلمهٔ درست برای گفتن اینکه اهل کجایی را انتخاب کن."}, "options": ["komme", "heiße", "habe"], "answer": 0, "explain": {"en": "Ich komme aus … = I come from …", "fa": "برای گفتن اینکه اهل کجایی: \u2066Ich komme aus dem Iran\u2069"}},
  {"id": "word-listen", "type": "listen", "de": "verheiratet", "after": "batch-2", "options": [{"en": "engineer", "fa": "مهندس"}, {"en": "married", "fa": "متأهل"}, {"en": "job", "fa": "شغل"}], "answer": 1, "explain": {"en": "verheiratet = married. You will use it in a few minutes.", "fa": "\u2066verheiratet\u2069 یعنی «متأهل». چند دقیقهٔ دیگر از آن استفاده می‌کنی."}},
  {"id": "age-fill", "type": "fill", "de": "Ich ___ dreißig Jahre alt.", "after": "batch-2", "prompt": {"en": "Choose the word for saying your age.", "fa": "کلمهٔ درست برای گفتن سنت را انتخاب کن."}, "options": ["habe", "heiße", "bin"], "answer": 2, "explain": {"en": "In German you are old: Ich bin … Jahre alt, not “I have”.", "fa": "در فارسی «سی سال دارم» می‌گوییم، اما آلمانی از «بودن» استفاده می‌کند: \u2066Ich bin dreißig Jahre alt\u2069 (نه \u2066Ich habe\u2069)."}},
  {"id": "job-question", "type": "choice", "after": 12, "prompt": {"en": "Which question asks about someone’s job?", "fa": "کدام سؤال دربارهٔ شغل است؟"}, "options": ["Woher kommen Sie?", "Was sind Sie von Beruf?", "Sind Sie verheiratet?"], "answer": 1, "explain": {"en": "Was sind Sie von Beruf? = What do you do for a living?", "fa": "\u2066Was sind Sie von Beruf?\u2069 یعنی «شغل شما چیست؟»"}},
  {"id": "origin-fill", "type": "fill", "de": "Woher ___ Sie?", "after": 12, "prompt": {"en": "Choose the word that completes the question.", "fa": "کلمهٔ درست را برای کامل کردن این سؤال انتخاب کن."}, "options": ["heiße", "kommen", "komme"], "answer": 1, "explain": {"en": "With Sie the verb ends in -en: Woher kommen Sie? The ich form is komme.", "fa": "با \u2066Sie\u2069 فعل به «\u2066en\u2069» ختم می‌شود (\u2066kommen Sie\u2069) و با \u2066ich\u2069 به «e» (\u2066ich komme\u2069)."}},
  {"id": "greet-listen", "type": "listen", "de": "Wie geht es Ihnen?", "options": [{"en": "What is your name?", "fa": "اسم شما چیست؟"}, {"en": "How are you? (formal)", "fa": "حال شما چطور است؟"}, {"en": "Where are you from?", "fa": "اهل کجا هستید؟"}], "answer": 1, "explain": {"en": "Ihnen is the formal you, so this is how you ask a stranger how they are.", "fa": "\u2066Ihnen\u2069 شکل رسمی «شما» است؛ با غریبه‌ها این‌طور احوال می‌پرسیم."}},
  {"id": "job-answer", "type": "choice", "prompt": {"en": "How do you say “I am an engineer”?", "fa": "«من مهندس هستم» را به آلمانی چطور می‌گویی؟"}, "options": ["Ich habe Ingenieur.", "Ich heiße Ingenieur.", "Ich bin Ingenieur."], "answer": 2, "explain": {"en": "Your job comes after Ich bin, with no “a” in front.", "fa": "بعد از \u2066Ich bin\u2069 شغل می‌آید، بدون \u2066ein.\u2069"}},
  {"id": "married-answer", "type": "choice", "prompt": {"en": "Anna asks “Sind Sie verheiratet?” You are married. What do you say?", "fa": "آنا می‌پرسد: «\u2066Sind Sie verheiratet?\u2069» تو متأهل هستی. چه می‌گویی؟"}, "options": ["Ja, ich bin verheiratet.", "Ja, ich habe verheiratet.", "Ja, ich heiße verheiratet."], "answer": 0, "explain": {"en": "Married is something you are: ich bin verheiratet.", "fa": "«متأهل» را با «هستم» می‌گوییم، نه «دارم»: \u2066ich bin verheiratet\u2069"}},
  {"id": "degree-question", "type": "choice", "de": "Welchen Abschluss haben Sie?", "prompt": {"en": "What is Anna asking?", "fa": "آنا چه می‌پرسد؟"}, "options": [{"en": "What is your name?", "fa": "اسم شما چیست؟"}, {"en": "What degree do you have?", "fa": "چه مدرکی دارید؟"}, {"en": "Where do you live?", "fa": "کجا زندگی می‌کنید؟"}], "answer": 1, "explain": {"en": "Der Abschluss is a degree or qualification.", "fa": "\u2066Abschluss\u2069 یعنی مدرک تحصیلی."}},
  {"id": "age-order", "type": "order", "de": "Ich bin dreißig Jahre alt.", "prompt": {"en": "I am thirty years old.", "fa": "من سی ساله هستم."}, "explain": {"en": "Ich bin … Jahre alt: in German you are old.", "fa": "یادت باشد: سن را با «هستم» (\u2066bin\u2069) می‌گوییم، نه «دارم» (\u2066habe\u2069)."}}
]$json$::jsonb
where day = 1;

commit;

-- Check: expect 6 words, 8 collocations, 11 exercises, 19 sentences.
--   select jsonb_array_length(words), jsonb_array_length(collocations),
--          jsonb_array_length(exercises),
--          (select count(*) from sentences s where s.lesson_id = l.id)
--   from lessons l where day = 1;
