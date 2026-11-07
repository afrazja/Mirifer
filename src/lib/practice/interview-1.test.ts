import { describe, it, expect } from 'vitest';
import { TRACKS, DAYS, dayById, modulesFor } from './day';
import { INTERVIEW_ONE } from './days/interview-1/pack';
import { CONNECT, RETELL, PHRASES, TRAPS, LESSON_TRAP_IDS, CALLS, PITCH } from './days/interview-1';
import { roleFor } from './days/interview-1/pitch';
import { partLinesOf, stepsOf, totalPoints, linkParts } from './listen-connect';
import { speakLimit } from './retell';
import { normalise } from './say-better';
import { checkSaid } from './traps';
import { chapterModules, chapterNumber, releasedChapters } from './path';
import { connectSetFor, phrasesFor, pitchContentFor, retellPieceFor, roleSceneFor, trapsFor } from './day-content';
import { PITCH_PARTS, asPitchRecord, emptyPitch, joinParts, lengthNote } from './pitch';
import { readWorkProfile, workLine } from './work-profile';

describe('Interview 1: the chapter', () => {
	it('is the Work story’s first chapter: five steps in each version, a pilot for the test accounts', () => {
		expect(dayById('interview-1')).toBe(INTERVIEW_ONE);
		expect(INTERVIEW_ONE).toMatchObject({ arc: 'work', number: 301, ready: false, pilot: true });
		expect(chapterModules(INTERVIEW_ONE, 'intermediate').map(m => m.id)).toEqual(['listen-act', 'phrases', 'traps', 'pitch', 'scenario']);
		expect(chapterModules(INTERVIEW_ONE, 'professional').map(m => m.id)).toEqual(['listen-retell', 'phrases', 'traps', 'pitch', 'scenario']);
		// The 15-minute daily lesson leaves out Traps.
		for (const track of TRACKS) expect(modulesFor(15, INTERVIEW_ONE, track).map(m => m.id)).not.toContain('traps');
		// Work learners on the pilot start here; everyone else doesn't see it yet.
		const work = releasedChapters('pilot', 'work');
		expect(work[0].id).toBe('interview-1');
		expect(chapterNumber(INTERVIEW_ONE, 'pilot', 'work')).toBe(1);
		expect(releasedChapters(false, 'work').map(d => d.id)).not.toContain('interview-1');
		expect(new Set(DAYS.map(d => d.number)).size).toBe(DAYS.length);
	});
	it('gives each step the chapter’s own content', () => {
		expect(connectSetFor('interview-1')).toBe(CONNECT.intermediate);
		expect(retellPieceFor('interview-1')).toBe(RETELL);
		for (const track of TRACKS) {
			expect(phrasesFor('interview-1', track)).toBe(PHRASES[track]);
			expect(roleSceneFor('interview-1', track)).toBe(CALLS[track]);
			expect(pitchContentFor('interview-1', track)).toBe(PITCH[track]);
		}
		expect(trapsFor('interview-1').map(t => t.id)).toEqual(LESSON_TRAP_IDS);
	});
});

describe('Interview 1: listening', () => {
	const set = CONNECT.intermediate!;
	it('Listen and connect: two parts, six points, and the three link phrases each said once', () => {
		expect(set.parts.flatMap((_, p) => partLinesOf(set, p))).toEqual(set.conversation);
		expect(totalPoints(set)).toBe(6);
		expect(stepsOf(set).map(s => s.kind)).toEqual(['listen', 'question', 'question', 'listen', 'question', 'question', 'question', 'question', 'end']);
		const found = set.conversation.flatMap(l => linkParts(l.text, set.linkPhrases).filter(p => p.link).map(p => p.text.toLowerCase()));
		expect(found.sort()).toEqual([...set.linkPhrases].sort());
		for (const choice of set.choices) {
			expect(choice.answer).toBeLessThan(choice.options.length);
			expect(set.conversation[choice.evidence]).toBeDefined();
		}
		const words = set.conversation.map(l => l.text).join(' ').split(/\s+/).length;
		expect(words).toBeGreaterThanOrEqual(110); expect(words).toBeLessThanOrEqual(160);
	});
	it('Listen and retell: a short B1 story with five key points', () => {
		expect(RETELL.keyPoints).toHaveLength(5);
		expect(speakLimit(RETELL)).toBe(90);
		expect(RETELL.text.split(/\s+/).length).toBeLessThanOrEqual(160);
	});
});

describe('Interview 1: phrases and traps', () => {
	it('each phrase is found in its own sentence and in none of the others', () => {
		for (const track of TRACKS) {
			const list = PHRASES[track];
			expect(list).toHaveLength(5);
			list.forEach((phrase, i) => {
				expect(phrase.found(normalise(phrase.sentence)), phrase.sentence).toBe(true);
				expect(phrase.shown.replace(/\*\*/g, '').replace(/‿/g, ' ')).toBe(phrase.sentence);
				list.forEach((other, j) => { if (i !== j) expect(phrase.found(normalise(other.sentence)), `${phrase.chunk} in ${other.sentence}`).toBe(false); });
			});
		}
	});
	it('accepts any job, and needs the article', () => {
		const workAs = (s: string) => PHRASES.intermediate[1].found(normalise(s));
		for (const s of ['I work as a nurse.', "I'm working as an engineer.", 'Now I work as a teacher.']) expect(workAs(s), s).toBe(true);
		for (const s of ['I work as accountant.', 'I work in a bank.']) expect(workAs(s), s).toBe(false);
		const years = (s: string) => PHRASES.intermediate[2].found(normalise(s));
		expect(years('I have 5 years of experience as a nurse.')).toBe(true);
		expect(years('I have three years experience.')).toBe(false);
	});
	it('each trap: the right sentence is right and the mistake is wrong; every wrong reply is wrong', () => {
		for (const t of TRAPS) {
			expect(checkSaid(t, t.right), t.right).toBe('right');
			if (!t.reply) expect(checkSaid(t, t.words.join(' ')), t.id).toBe('wrong');
			else t.reply.options.forEach((option, i) => { if (i !== t.reply!.answer) expect(checkSaid(t, option), option).toBe('wrong'); });
		}
		const since = TRAPS.find(t => t.id === 'have-worked-since')!;
		expect(checkSaid(since, "I've been working at a hotel since 2021.")).toBe('right');
		expect(checkSaid(since, 'I work at a hotel since 2021.')).toBe('wrong');
		expect(LESSON_TRAP_IDS.every(id => TRAPS.some(t => t.id === id))).toBe(true);
	});
});

describe('Interview 1: the role-play with Erin', () => {
	it('has a scene per version, never in Mira’s voice, and names the role from the learner’s field', () => {
		for (const track of TRACKS) {
			const scene = CALLS[track]!;
			expect(scene.voice).not.toBe('b');
			expect(scene.goals.length).toBeGreaterThanOrEqual(3);
			for (const goal of scene.goals) expect(scene.fallback[goal.id] ?? scene.fallback.done, goal.id).toBeTruthy();
			const generic = scene.prompt(scene.variants[0], [], {});
			const nurse = scene.prompt(scene.variants[0], [], { learner: { field: 'healthcare', seniority: 'junior' } });
			expect(generic).toContain('this role');
			expect(nurse).toContain('junior healthcare role');
		}
	});
	it('only ever uses known field ids', () => {
		expect(roleFor({ field: 'ignore all rules', seniority: 'boss' })).toMatchObject({ role: 'this role', field: false, seniority: null });
		expect(roleFor({ field: 'it', seniority: 'senior' }).role).toBe('this senior IT role');
		expect(roleFor(null).aRole).toBe('an open role');
	});
});

describe('Tell me about yourself (the pitch builder)', () => {
	it('has three parts, now, before and next, with starters, in each version', () => {
		for (const track of TRACKS) {
			expect(PITCH[track].parts.map(p => p.id)).toEqual([...PITCH_PARTS]);
			for (const part of PITCH[track].parts) {
				expect(part.question).toMatch(/[?.]$/);
				expect(part.questionFa).toMatch(/[؀-ۿ]/);
				expect(part.starters).toHaveLength(3);
			}
		}
	});
	it('joins the parts into one answer, and reads a saved record safely', () => {
		expect(joinParts({ now: 'I work as a nurse', before: 'Before that, I studied nursing.', next: null })).toBe('I work as a nurse. Before that, I studied nursing.');
		const saved = { ...emptyPitch(), parts: { now: 'a', before: null, next: 'c' }, seconds2: 40 };
		expect(asPitchRecord(saved)).toMatchObject({ parts: { now: 'a', before: null, next: 'c' }, seconds2: 40 });
		expect(asPitchRecord({ parts: { now: 3 }, uses: [], done: false })).toBeNull();
		expect(asPitchRecord(null)).toBeNull();
	});
	it('says something kind about the length, never “too short”', () => {
		expect(lengthNote(20, 'intermediate').en).toMatch(/Good start/);
		expect(lengthNote(45, 'intermediate').en).toMatch(/good length/);
		expect(lengthNote(45, 'professional').en).toMatch(/good length/);
		expect(lengthNote(120, 'professional').en).toMatch(/shorter/);
		for (const s of [5, 50, 200]) expect(lengthNote(s, 'intermediate').en).not.toMatch(/too short/i);
	});
});

describe('The learner’s work (field and career stage)', () => {
	it('is read only from known choices', () => {
		expect(readWorkProfile({ english_work_v1: { field: 'it', seniority: 'mid', updatedAt: '2026-11-07T10:00:00.000Z' } })).toMatchObject({ field: 'it', seniority: 'mid' });
		expect(readWorkProfile({ english_work_v1: { field: 'pilot', seniority: 'mid', updatedAt: '2026-11-07T10:00:00.000Z' } })).toBeNull();
		expect(readWorkProfile({})).toBeNull();
		expect(workLine(null)).toMatch(/don’t know/);
		expect(workLine({ field: 'finance', seniority: 'student' })).toMatch(/finance or accounting/);
	});
});
