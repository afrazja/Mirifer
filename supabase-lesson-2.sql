-- ============================================================
-- MIRIFER: Lesson 2, taught the same way as Lesson 1
-- Run in the Supabase SQL Editor after supabase-lesson-exercises.sql.
-- Safe to run more than once.
-- ============================================================
--
-- Scenario: an online language-exchange chat with Maria (Berlin) while you
-- live in Munich. About the same age, so du. Lesson 1 was the formal
-- encounter (Sie); this is the informal one (du).
--
-- Sentences 0-11 are untouched: 198 review cards from 23 learners are keyed by
-- day + position, so the order and meaning of those lines must not change.
-- Two closing lines are appended (12, 13); the lesson had no goodbye.
--
-- Dialogue (0-11 existing, 12-13 new):
--    0 R  Hallo! Ich bin Maria. Ich komme aus Berlin.
--    1 S  Hallo Maria! Ich bin Reza. Ich komme aus Teheran.
--    2 R  Wie alt bist du, Reza?
--    3 S  Ich bin fünfundzwanzig Jahre alt. Und du?
--    4 R  Ich bin dreißig. Was machst du beruflich?
--    5 S  Ich bin Student. Ich studiere Informatik.
--    6 R  Interessant! Ich bin Lehrerin.
--    7 S  Wo wohnst du in Berlin?
--    8 R  Ich wohne in Kreuzberg. Und wo wohnst du?
--    9 S  Ich wohne in München. Die Stadt ist sehr schön.
--   10 R  Sprichst du Englisch?
--   11 S  Ja, ich spreche Englisch und Persisch.
--   12 R  Freut mich, Reza! Bis bald!
--   13 S  Freut mich auch, Maria! Tschüss!
--
-- Sequencing, as in Lesson 1: `batch` items are pre-taught one card at a time,
-- each batch followed by its quick check; `after` places an exercise ("batch-N"
-- or a 0-based line index); no `after` means the closing set.
--   batch 1  asking a friend:   Wie alt bist du? / Was machst du beruflich? / Und du?
--   batch 2  where and what:    Wo wohnst du? / Ich wohne in … / Ich spreche …
--   check    after line 5 (age and job), closing set of five
-- Words and the other phrases are met in the dialogue only.
-- ============================================================

begin;

insert into public.sentences
  (lesson_id, sentence_order, role, audio_text, target_text, translation, translation_fa, difficulty, day)
select l.id, v.o, v.r, v.a, v.t, v.en, v.fa, 'A1', 2
from public.lessons l,
  (values
    (12, 'received', 'Freut mich, Reza! Bis bald!',              null::text, 'Nice to meet you, Reza! See you soon!', 'خوشبختم رضا! به زودی می‌بینمت!'),
    (13, 'sent',     null::text, 'Freut mich auch, Maria! Tschüss!',          'Nice to meet you too, Maria! Bye!',     'من هم خوشبختم ماریا! خداحافظ!')
  ) as v(o, r, a, t, en, fa)
where l.day = 2
  and not exists (select 1 from public.sentences s where s.lesson_id = l.id and s.sentence_order = v.o);

update public.lessons
set title = '2: Getting to Know Someone',
    title_fa = 'آشنایی با یک دوست تازه',
    description = 'You are chatting with Maria on a language-exchange app. She is from Berlin; you live in Munich. You are about the same age, so you say du. Introduce yourself, ask how old she is, talk about what you do and where you live, say which languages you speak, then say goodbye.',
    description_fa = 'در یک برنامهٔ تبادل زبان با ماریا گپ می‌زنید. او اهل برلین است و شما در مونیخ زندگی می‌کنید. چون هم‌سن‌وسالید، به هم «تو» (du) می‌گویید. خودت را معرفی کن، سن و شغل و محل زندگی را بپرس و بگو، بگو چه زبان‌هایی بلدی و خداحافظی کن.',
    grammar_focus = 'Informal you: Wie alt bist du? Wo wohnst du? Sprichst du …?',
    grammar_focus_fa = '«تو» (du): Wie alt bist du؟ Wo wohnst du؟ Sprichst du …؟',
    goals = $json$[
  {"id": "greet", "en": "Greet someone your age and say your name and where you are from", "fa": "سلام و معرفی خود به یک دوست هم‌سن‌وسال", "sentences": [1]},
  {"id": "age", "en": "Ask how old someone is and say your age", "fa": "پرسیدن سن دیگری و گفتن سن خود", "sentences": [2, 3]},
  {"id": "job", "en": "Say what you study or do", "fa": "گفتن شغل یا رشتهٔ تحصیلی", "sentences": [4, 5]},
  {"id": "live", "en": "Ask and say where you live", "fa": "پرسیدن و گفتن محل زندگی", "sentences": [7, 9]},
  {"id": "langs", "en": "Say which languages you speak", "fa": "گفتن اینکه به چه زبان‌هایی حرف می‌زنی", "sentences": [11]},
  {"id": "bye", "en": "Say goodbye in a friendly way", "fa": "خداحافظی دوستانه", "sentences": [13]}
]$json$::jsonb,
    grammar_note = $json${
  "title": "Verbs with du",
  "title_fa": "فعل‌ها با «تو» (du)",
  "explanation": "With du, most verbs end in -st: du wohnst, du machst, du kommst. Two in this lesson are special: du bist (sein) and du sprichst (sprechen: the e becomes i).",
  "explanation_fa": "با \u2066du\u2069 بیشتر فعل‌ها به -\u2066st\u2069 ختم می‌شوند: \u2066du wohnst\u2069، \u2066du machst\u2069، \u2066du kommst\u2069. دو فعل در این درس خاص‌اند: \u2066du bist\u2069 (\u2066sein\u2069) و \u2066du sprichst\u2069 (\u2066sprechen\u2069: e به i تبدیل می‌شود).",
  "basics_key": "pronounsAndSein",
  "examples": [
    {
      "de": "Wo wohnst du?",
      "en": "Where do you live?",
      "fa": "کجا زندگی می‌کنی؟"
    },
    {
      "de": "Was machst du beruflich?",
      "en": "What do you do for a living?",
      "fa": "شغلت چیه؟"
    },
    {
      "de": "Wie alt bist du?",
      "en": "How old are you?",
      "fa": "چند سالته؟"
    },
    {
      "de": "Sprichst du Englisch?",
      "en": "Do you speak English?",
      "fa": "انگلیسی صحبت می‌کنی؟"
    }
  ]
}$json$::jsonb,
    words = $json$[
  {"de": "der Student", "en": "student", "fa": "دانشجو"},
  {"de": "die Lehrerin", "en": "teacher (female)", "fa": "معلم (زن)"},
  {"de": "die Informatik", "en": "computer science", "fa": "علوم کامپیوتر"},
  {"de": "Englisch", "en": "English", "fa": "انگلیسی"},
  {"de": "Persisch", "en": "Persian", "fa": "فارسی"},
  {"de": "die Stadt", "en": "city", "fa": "شهر"}
]$json$::jsonb,
    collocations = $json$[
  {"de": "Wie alt bist du?", "en": "How old are you?", "fa": "چند سالته؟", "batch": 1},
  {"de": "Was machst du beruflich?", "en": "What do you do for a living?", "fa": "شغلت چیه؟", "batch": 1},
  {"de": "Und du?", "en": "And you?", "fa": "تو چی؟", "batch": 1},
  {"de": "Wo wohnst du?", "en": "Where do you live?", "fa": "کجا زندگی می‌کنی؟", "batch": 2},
  {"de": "Ich wohne in …", "en": "I live in …", "fa": "من در … زندگی می‌کنم", "batch": 2},
  {"de": "Ich spreche …", "en": "I speak …", "fa": "من … حرف می‌زنم", "batch": 2},
  {"de": "Sprichst du …?", "en": "Do you speak …?", "fa": "… حرف می‌زنی؟"},
  {"de": "Freut mich", "en": "Pleased to meet you", "fa": "خوشبختم"}
]$json$::jsonb,
    exercises = $json$[
  {"id": "b1-listen", "type": "listen", "de": "Wie alt bist du?", "after": "batch-1", "options": [{"en": "What is your name?", "fa": "اسمت چیه؟"}, {"en": "How old are you?", "fa": "چند سالته؟"}, {"en": "Where do you live?", "fa": "کجا زندگی می‌کنی؟"}], "answer": 1, "explain": {"en": "Wie alt bist du? = How old are you? (to a friend)", "fa": "\u2066Wie alt bist du\u2069؟ یعنی «چند سالته؟» (به یک دوست)"}},
  {"id": "b1-fill", "type": "fill", "de": "Was ___ du beruflich?", "after": "batch-1", "prompt": {"en": "Choose the word that completes the question.", "fa": "کلمهٔ درست را برای تکمیل این سؤال انتخاب کن."}, "options": ["wohnst", "machst", "sprichst"], "answer": 1, "explain": {"en": "Was machst du beruflich? = What do you do for a living?", "fa": "\u2066Was machst du beruflich\u2069؟ یعنی «شغلت چیه؟»"}},
  {"id": "b2-fill", "type": "fill", "de": "Ich ___ in München.", "after": "batch-2", "prompt": {"en": "Choose the word for saying where you live.", "fa": "کلمهٔ درست برای گفتن محل زندگی‌ات را انتخاب کن."}, "options": ["heiße", "komme", "wohne"], "answer": 2, "explain": {"en": "Ich wohne in … = I live in …", "fa": "برای گفتن محل زندگی: \u2066Ich wohne in München\u2069"}},
  {"id": "b2-listen", "type": "listen", "de": "Ich spreche Englisch.", "after": "batch-2", "options": [{"en": "I am English.", "fa": "من انگلیسی هستم."}, {"en": "I speak English.", "fa": "من انگلیسی حرف می‌زنم."}, {"en": "I live in England.", "fa": "من در انگلیس زندگی می‌کنم."}], "answer": 1, "explain": {"en": "Ich spreche … = I speak … (a language)", "fa": "\u2066Ich spreche …\u2069 یعنی «من … حرف می‌زنم» (یک زبان)"}},
  {"id": "m-age", "type": "fill", "de": "Ich ___ fünfundzwanzig Jahre alt.", "after": 5, "prompt": {"en": "Choose the word for saying your age.", "fa": "کلمهٔ درست برای گفتن سنت را انتخاب کن."}, "options": ["habe", "bin", "heiße"], "answer": 1, "explain": {"en": "In German you are old: Ich bin … Jahre alt, not “I have”.", "fa": "در فارسی «سی سال دارم» می‌گوییم، اما آلمانی از «بودن» استفاده می‌کند: \u2066Ich bin fünfundzwanzig Jahre alt\u2069 (نه \u2066Ich habe\u2069)."}},
  {"id": "m-job", "type": "choice", "after": 5, "prompt": {"en": "You ask a friend your own age what they do for a living. Which question is right?", "fa": "از یک دوست هم‌سن‌وسالت می‌پرسی شغلش چیست. کدام سؤال درست است؟"}, "options": ["Was machen Sie beruflich?", "Was machst du beruflich?", "Wie heißt du beruflich?"], "answer": 1, "explain": {"en": "With a friend you use du: Was machst du beruflich? Was machen Sie …? is for strangers.", "fa": "با دوست از \u2066du\u2069 استفاده می‌کنیم: \u2066Was machst du beruflich\u2069؟ شکل \u2066Was machen Sie …\u2069؟ برای غریبه‌هاست."}},
  {"id": "c-listen", "type": "listen", "de": "Ich wohne in Kreuzberg. Und wo wohnst du?", "options": [{"en": "I come from Kreuzberg. And where are you from?", "fa": "من اهل کرویتسبرگ هستم. تو اهل کجایی؟"}, {"en": "I live in Kreuzberg. And where do you live?", "fa": "من در کرویتسبرگ زندگی می‌کنم. تو کجا زندگی می‌کنی؟"}, {"en": "I work in Kreuzberg. And you?", "fa": "من در کرویتسبرگ کار می‌کنم. تو چی؟"}], "answer": 1, "explain": {"en": "Wohnen = to live. Wo wohnst du? = Where do you live?", "fa": "\u2066Wohnen\u2069 یعنی «زندگی کردن». \u2066Wo wohnst du\u2069؟ یعنی «کجا زندگی می‌کنی؟»"}},
  {"id": "c-du", "type": "choice", "prompt": {"en": "Which question is the informal (du) one?", "fa": "کدام سؤال غیررسمی (\u2066du\u2069) است؟"}, "options": ["Wie alt sind Sie?", "Wie alt ist er?", "Wie alt bist du?"], "answer": 2, "explain": {"en": "Du goes with bist; Sie goes with sind.", "fa": "با \u2066du\u2069 فعل \u2066bist\u2069 می‌آید و با \u2066Sie\u2069 فعل \u2066sind\u2069."}},
  {"id": "c-lang", "type": "choice", "prompt": {"en": "A friend asks “Sprichst du Englisch?” You speak English and Persian. What do you say?", "fa": "دوستت می‌پرسد: «\u2066Sprichst du Englisch?\u2069» تو انگلیسی و فارسی حرف می‌زنی. چه می‌گویی؟"}, "options": ["Ja, ich bin Englisch und Persisch.", "Ja, ich wohne Englisch und Persisch.", "Ja, ich spreche Englisch und Persisch."], "answer": 2, "explain": {"en": "You speak a language: ich spreche …", "fa": "زبان را «صحبت می‌کنیم»: \u2066ich spreche …\u2069"}},
  {"id": "c-fill", "type": "fill", "de": "Und wo ___ du?", "prompt": {"en": "Choose the word that completes the question.", "fa": "کلمهٔ درست را برای تکمیل این سؤال انتخاب کن."}, "options": ["wohne", "wohnst", "wohnt"], "answer": 1, "explain": {"en": "With du the verb ends in -st: du wohnst.", "fa": "با \u2066du\u2069 فعل به «\u2066st\u2069» ختم می‌شود: \u2066du wohnst\u2069."}},
  {"id": "c-order", "type": "order", "de": "Was machst du beruflich?", "prompt": {"en": "What do you do for a living?", "fa": "شغلت چیه؟"}, "explain": {"en": "A question starts with the question word, then the verb: Was machst …", "fa": "سؤال با کلمهٔ پرسشی شروع می‌شود و بعد فعل می‌آید: \u2066Was machst …\u2069"}}
]$json$::jsonb
where day = 2;

commit;

-- Check: expect 14 sentences, 6 words, 8 collocations (6 batched), 11 exercises.
--   select (select count(*) from sentences s where s.lesson_id = l.id),
--          jsonb_array_length(words), jsonb_array_length(collocations), jsonb_array_length(exercises)
--   from lessons l where day = 2;
