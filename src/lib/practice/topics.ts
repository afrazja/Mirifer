/**
 * Topic steps (docs/english-topic-steps.md, owner's decision 2026-10-30): short Quick chats about
 * the learner's own life, between the story chapters on the path. Each topic is a small chapter
 * of one step (day.ts, `topicPack`); the path puts one after each story chapter (path.ts).
 * Easiest first, matched loosely to the chapters around them. True anywhere: nothing assumes the
 * learner lives abroad, works, travels, or can spend money; no politics, religion, money,
 * relationships, health or age.
 */
import type { DisplayText } from './hotel';
import type { Opener } from './quick-fire';

export type TopicLevelId = 'a2' | 'b1';
export interface TopicLevel {
	/** Mira's first question. */
	opener: string;
	/** Ready-made follow-ups, in order, for when the AI is slow or unsure (they fit any answer). */
	followUps: string[];
	/** Idea words under the first question (Intermediate only): plain text, not buttons. */
	ideas?: DisplayText[];
	/** For the AI: what sides of the topic to explore, and what to avoid. */
	focus: string;
}
export interface Topic {
	id: string;
	title: DisplayText;
	/** For Mira's intro: "Let's chat about {about}". */
	about: DisplayText;
	a2: TopicLevel;
	b1: TopicLevel;
}

/** Questions in one chat: four at Intermediate, six at Professional. */
export const chatQuestions = (level: TopicLevelId) => (level === 'a2' ? 4 : 6);
/** Minutes a topic step takes, about. */
export const chatMinutes = (level: TopicLevelId) => (level === 'a2' ? 3 : 4);

export const TOPIC_IDS = ['food', 'morning', 'where-you-live', 'free-time', 'weekend', 'weather', 'shopping', 'getting-around', 'trips', 'learning-english'] as const;
export type TopicId = (typeof TOPIC_IDS)[number];

/** Written with the English coach review (2026-10-30). Ready-made follow-ups stand on their own (no "that" pointing back). */
export const TOPICS: Topic[] = [
	{ id: 'food', title: { en: 'Food you love', fa: 'غذاهایی که دوست داری' }, about: { en: 'food', fa: 'غذا' },
		a2: { opener: 'What’s your favorite food, and why?',
			followUps: ['What did you eat yesterday?', 'Do you like cooking?', 'Is there a food you don’t like?', 'What did you like to eat as a child?', 'What new food would you like to try?'],
			ideas: [{ en: 'pasta', fa: 'ماکارونی' }, { en: 'home cooking', fa: 'غذای خانگی' }, { en: 'tasty', fa: 'خوشمزه' }],
			focus: 'Sides: favorite dishes, yesterday’s food, cooking, food they don’t like, childhood food, a new food to try. Persian dish names are fine. Don’t assume they eat meat; no diets, weight, fasting, or the cost of food or eating out.' },
		b1: { opener: 'What kind of food do you enjoy most, and why?',
			followUps: ['What’s the best meal you’ve had recently?', 'How often do you cook, and what do you usually make?', 'Which food from your childhood do you still enjoy?', 'Do you think people cook less now than in the past?', 'Is there a dish you’d like to learn to make?'],
			focus: 'Sides: favorite food and why, a recent good meal, cooking habits, childhood food, how eating habits change, a dish to learn. Persian dish names are fine. Don’t assume meat; no diets, weight, fasting, prices or food shortages.' } },
	{ id: 'morning', title: { en: 'Your morning', fa: 'صبح‌هایت' }, about: { en: 'your mornings', fa: 'صبح‌هایت' },
		a2: { opener: 'What do you usually do in the morning?',
			followUps: ['What time did you get up today?', 'What do you usually have for breakfast?', 'Which do you like more, mornings or evenings?', 'Do you check your phone in the morning?', 'What do you want to change about your mornings?'],
			ideas: [{ en: 'breakfast', fa: 'صبحانه' }, { en: 'tea', fa: 'چای' }, { en: 'get up', fa: 'بیدار شدن' }],
			focus: 'Sides: getting up, breakfast, morning habits, mornings or evenings, a small change. Don’t assume work or class; no prayer, medicine, sleep problems or exercise for health.' },
		b1: { opener: 'How do you usually start your day?',
			followUps: ['What was the first thing you did this morning?', 'Are you a morning person or a night owl?', 'Has your morning routine changed over the years?', 'Is it a good idea to check your phone first thing?', 'Is there anything you’d like to change about your mornings?'],
			focus: 'Sides: routine, this morning, morning person or night owl, how the routine changed, phone habits, a change. Don’t assume work or class; no prayer, medicine, sleep problems or health.' } },
	{ id: 'where-you-live', title: { en: 'Where you live', fa: 'جایی که زندگی می‌کنی' }, about: { en: 'where you live', fa: 'جایی که زندگی می‌کنی' },
		a2: { opener: 'Do you live in a big city or a town?',
			followUps: ['What do you like about your neighborhood?', 'How long have you lived in your home?', 'Is it quiet or noisy where you live?', 'How do you usually go to the store?', 'What’s a nice place near your home?'],
			ideas: [{ en: 'big city', fa: 'شهر بزرگ' }, { en: 'quiet', fa: 'آرام' }, { en: 'busy', fa: 'شلوغ' }],
			focus: 'Sides: city or town, the neighborhood, quiet or noisy, places nearby, how long they’ve lived there. Never ask the name of their city, area or street; no rent or house prices, who they live with, or moving to another country. Don’t assume they live in Iran.' },
		b1: { opener: 'How would you describe the area where you live?',
			followUps: ['What do you like most about your neighborhood?', 'What do you remember about the place where you grew up?', 'Is it easy to get around where you live?', 'Is life better in a city or in the countryside?', 'What would you show a visitor in your area?'],
			focus: 'Sides: the area, its best parts, where they grew up, getting around, city vs countryside, showing a visitor around. Never ask for the city, area or street; no rent, prices, who they live with, what has got worse, or moving abroad.' } },
	{ id: 'free-time', title: { en: 'Free time', fa: 'وقت آزاد' }, about: { en: 'your free time', fa: 'وقت آزادت' },
		a2: { opener: 'What do you like to do in your free time?',
			followUps: ['What did you do in your free time yesterday?', 'Do you like sports, or something quieter?', 'Do you watch movies or TV shows?', 'What did you love doing as a child?', 'What new hobby would you like to try?'],
			ideas: [{ en: 'walking', fa: 'پیاده‌روی' }, { en: 'movies', fa: 'فیلم دیدن' }, { en: 'reading', fa: 'کتاب خواندن' }],
			focus: 'Sides: hobbies, yesterday’s free time, sports, movies and TV, childhood hobbies, a new hobby. Don’t assume a job or lots of free time; no rules about music, movies, sports or clothing.' },
		b1: { opener: 'How do you like to spend your free time these days?',
			followUps: ['How did you get into your favorite hobby?', 'Do you prefer relaxing at home or doing something active?', 'Do you think every adult needs a hobby?', 'Is there a hobby you’ve always wanted to try?', 'What are you planning to do in your free time this week?'],
			focus: 'Sides: hobbies now, how one started, relaxing vs active, why hobbies matter, something to try, this week. Don’t assume a job; no rules about music, movies, sports or clothing.' } },
	{ id: 'weekend', title: { en: 'Your weekend', fa: 'آخر هفته‌ات' }, about: { en: 'your weekend', fa: 'آخر هفته‌ات' },
		a2: { opener: 'What do you usually do on the weekend?',
			followUps: ['What did you do last weekend?', 'Do you like to stay home or go out?', 'What time do you get up on the weekend?', 'Is your weekend usually busy or quiet?', 'What would you like to do next weekend?'],
			ideas: [{ en: 'relax', fa: 'استراحت' }, { en: 'go out', fa: 'بیرون رفتن' }, { en: 'visit family', fa: 'دیدن خانواده' }],
			focus: 'Sides: usual weekend, last weekend, staying home or going out, getting up, next weekend. Never name weekend days (they differ by country); don’t assume a job.' },
		b1: { opener: 'What does a typical weekend look like for you?',
			followUps: ['What did you do last weekend that you really enjoyed?', 'Do you prefer a busy weekend or a quiet one?', 'How are your weekends different from your weekdays?', 'Is it better to plan your weekend or just see what happens?', 'What are you hoping to do next weekend?'],
			focus: 'Sides: weekend routine, a recent weekend, busy or quiet, weekends vs weekdays, planning vs going with the flow, plans. Never name weekend days or discuss how long the work week should be; don’t assume a job.' } },
	{ id: 'weather', title: { en: 'Weather and seasons', fa: 'آب‌وهوا و فصل‌ها' }, about: { en: 'the weather', fa: 'آب‌وهوا' },
		a2: { opener: 'What’s your favorite season, and why?',
			followUps: ['What’s the weather like today?', 'What do you do on very hot days?', 'Do you like rainy days?', 'What was the weather like last weekend?', 'Do you check the weather before you go out?'],
			ideas: [{ en: 'spring', fa: 'بهار' }, { en: 'warm', fa: 'گرم' }, { en: 'snow', fa: 'برف' }],
			focus: 'Sides: seasons, today’s weather, hot, cold and rainy days, checking the weather. No air pollution, drought, water or power cuts, climate politics or what people wear; don’t name a holiday.' },
		b1: { opener: 'What kind of weather do you enjoy most, and why?',
			followUps: ['What’s the weather usually like where you live?', 'Can you remember a day when the weather surprised you?', 'Does the weather often change your plans?', 'Do you think the weather affects how people feel?', 'Which season are you looking forward to, and why?'],
			focus: 'Sides: favorite weather, local weather, a memorable weather day, weather and plans, weather and mood, the next season. No pollution, drought, water or power cuts, climate politics or clothing; don’t name a holiday.' } },
	{ id: 'shopping', title: { en: 'Shopping', fa: 'خرید کردن' }, about: { en: 'shopping', fa: 'خرید' },
		a2: { opener: 'Where do you like to go shopping?',
			followUps: ['What did you buy last week?', 'Do you like shopping online or in stores?', 'Do you go shopping alone or with someone?', 'Do you make a shopping list?', 'What do you need to buy this week?'],
			ideas: [{ en: 'market', fa: 'بازار' }, { en: 'online', fa: 'اینترنتی' }, { en: 'the mall', fa: 'پاساژ' }],
			focus: 'Sides: where they shop (markets, stores, online), what they buy (food, books, gifts), alone or with someone, lists. Never ask about prices, costs, spending or brands; avoid clothes and dress.' },
		b1: { opener: 'Do you enjoy shopping, or is it a chore for you?',
			followUps: ['What’s something useful you bought recently?', 'Do you prefer shopping online or in person? Why?', 'Do you usually plan your shopping, or just see what you find?', 'Do you think traditional markets are still important today?', 'What’s the best gift you’ve ever bought for someone?'],
			focus: 'Sides: enjoying it or not, a recent useful buy, online vs in person, planning vs impulse, markets vs malls, gifts. Never ask about prices, costs, discounts, brands or the economy; avoid clothes and dress.' } },
	{ id: 'getting-around', title: { en: 'Getting around', fa: 'رفت‌وآمد در شهر' }, about: { en: 'getting around', fa: 'رفت‌وآمد' },
		a2: { opener: 'Do you usually walk, take a bus, or a taxi?',
			followUps: ['How did you get home yesterday?', 'Do you like walking where you live?', 'Is there a bus stop near your home?', 'What do you do on the bus or metro?', 'What’s the fastest way to get around where you live?'],
			ideas: [{ en: 'metro', fa: 'مترو' }, { en: 'fast', fa: 'سریع' }, { en: 'near', fa: 'نزدیک' }],
			focus: 'Sides: walking, buses, metro, taxis, what they do on the way, the fastest way. Don’t assume a car; no cycling or motorbikes, fuel, fares, traffic police or accidents; never ask for their area or street.' },
		b1: { opener: 'What’s the easiest way to get around where you live?',
			followUps: ['How did you travel the last time you went somewhere new?', 'What do you usually do while you’re on the bus or metro?', 'Do you prefer walking or public transportation? Why?', 'Is your town easy to get around on foot?', 'How would you get around if you visited a new city?'],
			focus: 'Sides: everyday transportation, a recent trip across town, time on the way, walking vs transit, how walkable their town is, a new city. Don’t assume a car; no cycling or motorbikes, fuel, fares, traffic police or accidents.' } },
	{ id: 'trips', title: { en: 'Trips and places', fa: 'سفر و جاهای دیدنی' }, about: { en: 'trips and places', fa: 'سفر و جاهای دیدنی' },
		a2: { opener: 'What’s a beautiful place you know?',
			followUps: ['Where do you like to go for a day trip?', 'Which do you like more, mountains or the sea?', 'What’s a nice place you visited as a child?', 'Do you like taking photos of places?', 'What’s a place you’d like to see one day?'],
			ideas: [{ en: 'mountains', fa: 'کوه' }, { en: 'the sea', fa: 'دریا' }, { en: 'a park', fa: 'پارک' }],
			focus: 'Sides: beautiful places they know, day trips, nature, childhood places, a place to see one day. Never assume they can travel or go abroad; no visas, passports, flights, costs, which countries, pilgrimages or holiday celebrations.' },
		b1: { opener: 'What’s a place you’ve visited that you’d happily go back to?',
			followUps: ['Do you prefer trips to cities or to nature? Why?', 'Do you like to plan a trip, or just go?', 'What makes a place worth visiting, in your opinion?', 'Is there a place near you that visitors should see?', 'Where would you love to go one day, and why?'],
			focus: 'Sides: a place they’d revisit, cities vs nature, planning, what makes a place good, places near them, a dream place. Never assume travel abroad or money; no visas, passports, flights, costs, travel rules, pilgrimages or holiday celebrations.' } },
	{ id: 'learning-english', title: { en: 'Learning English', fa: 'یادگیری انگلیسی' }, about: { en: 'learning English', fa: 'یادگیری انگلیسی' },
		a2: { opener: 'When did you start learning English?',
			followUps: ['What’s easy for you in English?', 'What’s hard for you in English?', 'Where do you use English?', 'Do you like English songs or movies?', 'What would you like to do in English one day?'],
			ideas: [{ en: 'at school', fa: 'در مدرسه' }, { en: 'last year', fa: 'پارسال' }, { en: 'as a child', fa: 'بچه که بودم' }],
			focus: 'Sides: when they started, what’s easy or hard, where they use English, songs and movies, a goal. Don’t ask why they’re learning or about moving abroad, exam scores or class costs; never judge their level or promise progress.' },
		b1: { opener: 'How do you usually practice your English?',
			followUps: ['What do you remember about your first English lessons?', 'Which is harder for you, speaking or listening?', 'What’s an English word or phrase you really like?', 'Is it better to learn with a teacher or on your own?', 'What’s your next goal in English?'],
			focus: 'Sides: how they practice, first lessons, speaking vs listening, favorite words, teacher vs self-study, next goal. Don’t ask why they’re learning or about moving abroad, exam scores or costs; never judge their level or promise progress or an exam result.' } }
];

export const topicById = (id: string | null | undefined): Topic | null => TOPICS.find(topic => topic.id === id) ?? null;

/** The topic's questions for one level, as the Quick chat's one opener (its follow-ups never leave the topic). */
export const topicOpeners = (topic: Topic, level: TopicLevelId): Opener[] => [{ question: topic[level].opener, followUps: topic[level].followUps }];
/** The level of a version: Intermediate is A2, Professional B1. */
export const topicLevel = (track: string): TopicLevelId => (track === 'intermediate' ? 'a2' : 'b1');
