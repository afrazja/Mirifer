import { describe, it, expect } from 'vitest';
import { TOPICS, TOPIC_IDS, chatQuestions, topicById, topicLevel, topicOpeners } from './topics';
import { DAY_IDS, TOPIC_PACKS, DAYS, dayById, isTopic } from './day';
import { questionOk, fallbackQuestion, asQuickChat, emptyQuickFire, quickFireScore, newTurn } from './quick-fire';
import { chapterFinished, chapterNumber, chapterModules, recordStep, releasedChapters, EMPTY_PATH } from './path';
import { EMPTY_PROGRESS } from './english-progress';
import { words } from './say-better';

const count = (text: string) => text.trim().split(/\s+/).length;
const LEVELS = ['a2', 'b1'] as const;

describe('topics', () => {
	it('has the ten topics, in order, each a small chapter of one Quick chat', () => {
		expect(TOPICS.map(t => t.id)).toEqual([...TOPIC_IDS]);
		expect(TOPIC_PACKS.map(d => d.id)).toEqual(TOPIC_IDS.map(id => `topic-${id}`));
		for (const pack of TOPIC_PACKS) {
			expect(DAY_IDS).toContain(pack.id);
			expect(dayById(pack.id)).toBe(pack);
			expect(isTopic(pack)).toBe(true);
			expect(pack).toMatchObject({ arc: 'topics', ready: false, pilot: true });
			expect(chapterModules(pack, 'intermediate').map(m => m.id)).toEqual(['quick-fire']);
			expect(chapterModules(pack, 'professional').map(m => m.id)).toEqual(['quick-fire']);
			expect(chapterModules(pack, 'intermediate')[0].intro.en).toMatch(/four short questions/);
		}
		// The stories' list (the daily lessons, the old pages) never gets the topic steps.
		expect(DAYS.some(isTopic)).toBe(false);
	});
	it('asks short, safe questions that stand on their own, in US English', () => {
		for (const topic of TOPICS) for (const level of LEVELS) {
			const t = topic[level];
			expect(t.followUps, `${topic.id} ${level}`).toHaveLength(5);
			expect(count(t.opener), `${topic.id} ${level} opener`).toBeLessThanOrEqual(level === 'a2' ? 10 : 12);
			for (const q of [t.opener, ...t.followUps]) {
				expect(q, topic.id).toMatch(/\?$/);
				// The same checks as the AI's questions (the sensitive-word filter included).
				expect(questionOk(q, [], 15), `${topic.id}: ${q}`).toBe(true);
				// No weekday names (weekends differ by country), no UK spelling, nothing pointing back.
				expect(q).not.toMatch(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|favourite|colour|neighbour)\b/i);
				expect(q).not.toMatch(/\b(doing that|about that|there)\?$/i);
			}
			expect(t.focus.length).toBeGreaterThan(40);
			if (level === 'a2') expect(t.ideas).toHaveLength(3);
		}
	});
	it('never leaves the topic when the ready-made questions are used', () => {
		for (const topic of TOPICS) for (const level of LEVELS) {
			const openers = topicOpeners(topic, level);
			const asked = [topic[level].opener];
			for (let i = 1; i < chatQuestions(level); i++) asked.push(fallbackQuestion(0, asked, openers));
			expect(new Set(asked.map(q => words(q).join(' '))).size).toBe(chatQuestions(level));
			expect(asked.slice(1)).toEqual(topic[level].followUps.slice(0, chatQuestions(level) - 1));
		}
	});
	it('maps a version to its level, and reads a saved chat back safely', () => {
		expect([topicLevel('intermediate'), topicLevel('professional')]).toEqual(['a2', 'b1']);
		expect(topicById('nope')).toBeNull();
		const openers = topicOpeners(topicById('food')!, 'a2');
		const saved = { ...emptyQuickFire(0, openers), talkSeconds: 42, reviewed: true };
		expect(asQuickChat(saved, openers)).toMatchObject({ talkSeconds: 42, reviewed: true });
		expect(asQuickChat({ ...saved, talkSeconds: -3, reviewed: 'yes' }, openers)).toMatchObject({ talkSeconds: 0, reviewed: false });
		expect(asQuickChat({ opener: 4, turns: [], done: false }, openers)).toBeNull();
		expect(quickFireScore([{ ...newTurn('Q?'), answer: 'A' }, newTurn('Q2?')])).toEqual({ correct: 1, total: 2 });
	});
});

describe('the sensitive-word filter', () => {
	it('catches word forms and the topics’ risky subjects', () => {
		for (const q of ['Is religion important in your city?', 'Do you pray every morning?', 'What do you think about politics?', 'Are prices high where you live?',
			'Do you use a VPN on your phone?', 'Would you like to move abroad one day?', 'Is your husband a good cook?', 'What do you wear in the hijab?'])
			expect(questionOk(q, []), q).toBe(false);
		for (const q of ['How do you spend your weekend?', 'What did you like to eat as a child?', 'Do you go out with friends?', 'What will you do next weekend?'])
			expect(questionOk(q, []), q).toBe(true);
	});
});

describe('topic steps on the path', () => {
	it('puts one after each story chapter, for the test accounts only (a pilot)', () => {
		expect(releasedChapters(false).some(isTopic)).toBe(false);
		const pilot = releasedChapters('pilot', 'travel');
		const stories = pilot.filter(day => !isTopic(day));
		pilot.forEach((day, i) => { if (isTopic(day) && i < stories.length * 2) expect(isTopic(pilot[i - 1])).toBe(false); });
		expect(pilot.filter(isTopic).map(d => d.id)).toEqual(TOPIC_PACKS.map(d => d.id));
		expect(pilot[0].id).toBe('day-1');
		expect(pilot[1].id).toBe('topic-food');
	});
	it('numbers the story chapters only', () => {
		const pilot = releasedChapters('pilot', 'travel');
		expect(chapterNumber(pilot[2], 'pilot', 'travel')).toBe(2);
		// A topic step counts as the chapter after it (Mira's greeting).
		expect(chapterNumber(pilot[1], 'pilot', 'travel')).toBe(2);
	});
	it('a topic step is finished when done or skipped', () => {
		const food = TOPIC_PACKS[0], step = 'topic-food:quick-fire' as const;
		expect(chapterFinished(EMPTY_PATH, food, 'intermediate')).toBe(false);
		expect(chapterFinished({ ...EMPTY_PATH, skipped: [step] }, food, 'intermediate')).toBe(true);
		expect(chapterFinished({ ...EMPTY_PATH, done: { [step]: ['i', 3] } }, food, 'intermediate')).toBe(true);
	});
	it('a topic step keeps the story’s place in the old progress record', () => {
		const before = { ...EMPTY_PROGRESS, lastThemeId: 'day-1', finishedDays: ['day-1'] };
		const after = recordStep(before, null, { skill: 'speaking', correct: 3, total: 4 }, false);
		expect(after).toMatchObject({ sessionsCompleted: 1, lastThemeId: 'day-1', finishedDays: ['day-1'] });
	});
});
