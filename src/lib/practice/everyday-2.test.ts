import { describe, it, expect } from 'vitest';
import { TRACKS, modulesFor, type DayModule } from './day';
import { EVERYDAY_TWO } from './days/everyday-2/pack';
import * as everydayTwo from './days/everyday-2';
import { partLinesOf, stepsOf, totalPoints, linkParts } from './listen-connect';
import { speakLimit } from './retell';
import { normalise, SAY_PROMPTS, sayPrompt } from './say-better';
import { checkSaid } from './traps';
import { chatSceneFor, phrasesFor, sayItemsFor, trapsFor, voiceMessagesFor, retellPieceFor } from './day-content';
import { BIRTHDAY_A2, BIRTHDAY_B1 } from './chats';
import { chapterModules, releasedChapters } from './path';

const { CONNECT, RETELL, PHRASES, TRAPS, LESSON_TRAP_IDS, SAY, MESSAGES, CHATS, WITHOUT_NAME, CLEAR_NO_NOTE } = everydayTwo;
const words = (text: string) => text.trim().split(/\s+/).length;
const persian = /[؀-ۿ]/;

describe('Everyday 2: the chapter', () => {
	it('is a pilot in the Everyday story after Chapter 1, with five built steps per version, the group chat last', () => {
		expect(EVERYDAY_TWO).toMatchObject({ id: 'everyday-2', number: 102, arc: 'everyday', ready: false, pilot: true, themePhrase: 'making plans', modules: [] });
		const ids = (list: DayModule[]) => list.map(m => m.id);
		expect(ids(EVERYDAY_TWO.tracks!.intermediate)).toEqual(['listen-act', 'phrases', 'traps', 'say-in-english', 'group-chat']);
		expect(ids(EVERYDAY_TWO.tracks!.professional)).toEqual(['listen-retell', 'phrases', 'say-it-better', 'voice-messages', 'group-chat']);
		for (const track of TRACKS) {
			const list = EVERYDAY_TWO.tracks![track];
			for (const m of list) {
				expect(m.built, m.id).toBe(true);
				expect(m.minutes[20], m.id).toBeGreaterThan(0);
				for (const text of [m.title, m.short, m.does, m.intro]) expect(text.fa, m.id).toMatch(persian);
				// Never a date: every invitation is a group's.
				expect(m.intro.en, m.id).not.toMatch(/invites (?:her|you) out\b/);
			}
			// The 15-minute lesson keeps the steps where the learner says no in their own words.
			const fifteen = modulesFor(15, EVERYDAY_TWO, track).map(m => m.id);
			expect(fifteen).toHaveLength(4);
			expect(fifteen).toContain(track === 'intermediate' ? 'say-in-english' : 'voice-messages');
			expect(fifteen).not.toContain(track === 'intermediate' ? 'traps' : 'say-it-better');
			expect(modulesFor(15, EVERYDAY_TWO, track).reduce((sum, m) => sum + m.minutes[15]!, 0) + EVERYDAY_TWO.checkInMinutes + EVERYDAY_TWO.recapMinutes).toBeLessThanOrEqual(21);
			// Steps 2–4 say who (Jake upstairs); the chat says it's your own friends.
			for (const m of list.slice(1, 4)) expect(m.intro.en, m.id).toMatch(/Jake, your neighbor upstairs/);
			expect(list[4].intro.en).toMatch(/^Imagine your friends Maya and Leo/);
			expect(EVERYDAY_TWO.goals?.[track]?.en).toMatch(/^You’ve practiced .*group chat\.$/);
			// The ending never claims a step the 15-minute lesson may leave out, nor the twist.
			expect(EVERYDAY_TWO.goals?.[track]?.en).not.toMatch(/voice message|changing a plan in/);
		}
		expect(EVERYDAY_TWO.tracks!.professional[4].intro.en).toMatch(/Plans can change/);
		expect(EVERYDAY_TWO.checkIn!.story.en).toMatch(/^Remember Sara\?.*a few neighbors\.$/);
	});
	it('comes after Chapter 1 for the test accounts, and not for learners', () => {
		const pilot = releasedChapters('pilot', 'everyday').filter(d => !d.topic).map(d => d.id);
		expect(pilot.indexOf('everyday-2')).toBe(pilot.indexOf('everyday-1') + 1);
		expect(releasedChapters(false, 'everyday').map(d => d.id)).not.toContain('everyday-2');
		expect(chapterModules(EVERYDAY_TWO, 'intermediate')).toHaveLength(5);
	});
	it('the chapter’s content is what its steps get', () => {
		expect(phrasesFor('everyday-2', 'professional')).toBe(PHRASES.professional);
		expect(trapsFor('everyday-2')).toEqual(TRAPS);
		expect(sayItemsFor('everyday-2', 'intermediate')).toBe(SAY.intermediate);
		expect(voiceMessagesFor('everyday-2')).toEqual(MESSAGES);
		expect(retellPieceFor('everyday-2')).toBe(RETELL);
		expect(chatSceneFor('everyday-2', 'intermediate')).toBe(BIRTHDAY_A2);
		expect(chatSceneFor('everyday-2', 'professional')).toBe(BIRTHDAY_B1);
		expect(CHATS.professional).toBe(BIRTHDAY_B1);
		// Leo never sounds like Jake (Andrew) or Mira (Ava).
		expect(BIRTHDAY_B1.members.find(m => m.id === 'leo')!.voice).toBe('c');
	});
});

describe('Everyday 2: listening', () => {
	const set = CONNECT.intermediate!;
	it('is one two-voice conversation in two parts, under 160 words', () => {
		expect(set.speakers.jake.voice).toBe('a');
		expect(set.speakers.sara.voice).toBe('d');
		expect(set.parts).toHaveLength(2);
		expect(set.parts.flatMap((_, p) => partLinesOf(set, p))).toEqual(set.conversation);
		for (const line of set.conversation) expect(set.speakers[line.who], line.text).toBeDefined();
		const total = set.conversation.reduce((sum, line) => sum + words(line.text), 0);
		expect(total).toBeGreaterThanOrEqual(110); expect(total).toBeLessThanOrEqual(160);
		for (const part of set.parts) expect(part.title.fa).toMatch(persian);
		// Every invitation is a group plan.
		expect(set.conversation.map(l => l.text).join(' ')).toMatch(/a few of us from the building/);
	});
	it('six points, each question after the part that proves it', () => {
		expect(totalPoints(set)).toBe(6);
		expect(stepsOf(set).map(s => s.kind)).toEqual(['listen', 'question', 'question', 'question', 'listen', 'question', 'question', 'question', 'end']);
		for (const q of set.questions) {
			const evidence = q.kind === 'connect' ? set.connect.evidence[q.index] : set.choices[q.index].evidence;
			expect(evidence).toBeGreaterThanOrEqual(set.parts[q.part].from);
			expect(evidence).toBeLessThanOrEqual(set.parts[q.part].to);
		}
		expect(set.connect.results).toHaveLength(3);
		expect(new Set(set.connect.answers).size).toBe(2);
		for (const option of [...set.connect.results, ...set.choices.flatMap(q => q.options)]) expect(words(option), option).toBeLessThanOrEqual(6);
		for (const q of set.choices) { expect(q.answer).toBeLessThan(q.options.length); expect(q.kind.fa).toMatch(persian); }
		const line = (i: number) => set.conversation[i].text;
		expect(line(set.connect.evidence[0])).toContain('yoga class');
		expect(line(set.connect.evidence[1])).toContain('How about Thursday');
		expect(set.connect.results[set.connect.answers[0]]).toMatch(/can’t come/);
		expect(set.connect.results[set.connect.answers[1]]).toMatch(/another day/);
		expect(line(set.choices[0].evidence)).toContain('Corner Café');
		expect(line(set.choices[1].evidence)).toContain('sister');
		expect(line(set.choices[2].evidence)).toContain('Saturday. Same time, seven');
		expect(line(set.choices[3].evidence)).toContain('bring a jacket');
		expect(set.choices.map(q => q.options[q.answer])).toEqual(['At the Corner Café.', 'His sister is visiting.', 'Saturday at seven.', 'A jacket.']);
	});
	it('each link phrase is said exactly once and stays out of the questions', () => {
		const text = set.conversation.map(l => l.text).join(' ').toLowerCase();
		for (const phrase of set.linkPhrases) expect(text.split(phrase).length - 1, phrase).toBe(1);
		const found = set.conversation.flatMap(l => linkParts(l.text, set.linkPhrases).filter(p => p.link).map(p => p.text.toLowerCase()));
		expect(found.sort()).toEqual([...set.linkPhrases].sort());
		const asked = [...set.choices.flatMap(q => [q.question, ...q.options]), ...set.connect.causes, ...set.connect.results].join(' ').toLowerCase();
		for (const phrase of set.linkPhrases) expect(asked).not.toContain(phrase);
		expect(set.miraLine.fa).toMatch(persian);
	});
	it('the Professional step: the same story, five key points', () => {
		expect(RETELL).toMatchObject({ id: 'the-new-plan', level: 'B1', voice: 'a' });
		expect(words(RETELL.text)).toBeGreaterThanOrEqual(110); expect(words(RETELL.text)).toBeLessThanOrEqual(150);
		expect(RETELL.keyPoints).toHaveLength(5);
		expect(speakLimit(RETELL)).toBe(90);
		expect(RETELL.task?.fa).toMatch(persian);
	});
});

describe('Everyday 2: natural phrases', () => {
	it('each phrase finds its own sentence and none of the other four', () => {
		for (const track of TRACKS) {
			const set = PHRASES[track];
			expect(set).toHaveLength(5);
			set.forEach((phrase, i) => {
				expect(phrase.shown.replace(/\*\*/g, '').replace(/‿/g, ' ')).toBe(phrase.sentence);
				expect(phrase.found(normalise(phrase.sentence)), phrase.sentence).toBe(true);
				set.forEach((other, j) => { if (i !== j) expect(phrase.found(normalise(other.sentence)), `${phrase.chunk} in ${other.sentence}`).toBe(false); });
				expect(phrase.tip.fa).toMatch(persian); expect(phrase.situation.fa).toMatch(persian);
			});
		}
	});
	it('takes the variants and turns down the habits', () => {
		const [invite, love, howAbout, time, bring] = PHRASES.intermediate.map(p => (s: string) => p.found(normalise(s)));
		for (const s of ['Do you wanna come?', 'Would you like to come?', 'Want to join us?']) expect(invite(s), s).toBe(true);
		for (const s of ['Do you come?', 'You come with us?']) expect(invite(s), s).toBe(false);
		for (const s of ["I'd really love to!", 'I would love that!']) expect(love(s), s).toBe(true);
		for (const s of ['I love to!', 'I like to']) expect(love(s), s).toBe(false);
		for (const s of ['What about Friday?', 'How about Thursday instead?']) expect(howAbout(s), s).toBe(true);
		for (const s of ['Maybe Thursday?', 'Thursday is better']) expect(howAbout(s), s).toBe(false);
		for (const s of ['Which day works for you?', 'What time is good for you?']) expect(time(s), s).toBe(true);
		for (const s of ['When we meet?', 'What time we meet?']) expect(time(s), s).toBe(false);
		for (const s of ["I'll bring the cake", 'I can make dessert', 'I could get balloons']) expect(bring(s), s).toBe(true);
		for (const s of ['I bring cake', 'Maybe cake?']) expect(bring(s), s).toBe(false);
		const [noBut, couldWe, takeCare, cameUp, worksForMe] = PHRASES.professional.map(p => (s: string) => p.found(normalise(s)));
		for (const s of ["I'd love to, but I'm busy", 'I would really love to, but I can not']) expect(noBut(s), s).toBe(true);
		for (const s of ['I love to but I can not', 'Maybe, I will see']) expect(noBut(s), s).toBe(false);
		for (const s of ['Can we do Friday?', 'Could we make it Sunday?']) expect(couldWe(s), s).toBe(true);
		for (const s of ['We can do Friday', 'Is Friday possible?']) expect(couldWe(s), s).toBe(false);
		for (const s of ["I'll handle the cake", 'Leave the decorations to me!', 'Let me take care of it']) expect(takeCare(s), s).toBe(true);
		for (const s of ['I take care of dessert', 'Someone should bring cake']) expect(takeCare(s), s).toBe(false);
		for (const s of ["Something's come up", 'Something just came up']) expect(cameUp(s), s).toBe(true);
		for (const s of ['Something come up', 'I have a problem']) expect(cameUp(s), s).toBe(false);
		for (const s of ['Saturday would work for me', 'That works for me']) expect(worksForMe(s), s).toBe(true);
		for (const s of ['Saturday is work for me', 'It is good for me']) expect(worksForMe(s), s).toBe(false);
	});
});

describe('Everyday 2: traps', () => {
	const trap = (id: string) => TRAPS.find(t => t.id === id)!;
	it('five in the lesson: three word traps, then two "which reply?" items', () => {
		expect(TRAPS.map(t => t.id)).toEqual(LESSON_TRAP_IDS);
		expect(TRAPS.slice(0, 3).every(t => !t.reply && t.wrong >= 0 && t.wrong < t.words.length)).toBe(true);
		for (const t of TRAPS.slice(3)) {
			expect(t.reply!.options).toHaveLength(3);
			expect(t.reply!.options[t.reply!.answer]).toBe(t.right);
			expect(t.reply!.prompt.fa).toMatch(persian);
		}
		for (const t of TRAPS) expect(t.why.fa).toMatch(persian);
		expect(trap('clear-no').why).toBe(CLEAR_NO_NOTE);
	});
	it('each word trap takes its fix and turns down the mistake', () => {
		for (const t of TRAPS.slice(0, 3)) {
			expect(checkSaid(t, t.right), t.right).toBe('right');
			expect(checkSaid(t, t.words.join(' ')), t.id).toBe('wrong');
		}
		for (const s of ['What time do we meet?', 'What time are we meeting?']) expect(checkSaid(trap('what-time'), s), s).toBe('right');
		for (const s of ['Would you like to come?', 'Do you wanna come?', 'Can you come?']) expect(checkSaid(trap('want-to-come'), s), s).toBe('right');
		for (const s of ['See you Saturday at 7', "Let's meet Saturday at seven."]) expect(checkSaid(trap('on-saturday'), s), s).toBe('right');
		for (const s of ["Let's meet at Saturday at seven.", "Let's meet on Saturday in seven."]) expect(checkSaid(trap('on-saturday'), s), s).toBe('wrong');
	});
	it('"which reply?": a clear no with another day, and your own choice', () => {
		const no = trap('clear-no'), choice = trap('your-choice');
		for (const s of ["Sorry, I can't on Wednesday. How about Thursday?", "I'd love to, but I can't on Wednesday. What about Friday?", "I can't on Wednesday, but Thursday works.", "Sorry, I'm busy. Could we do next week?"]) expect(checkSaid(no, s), s).toBe('right');
		for (const s of ["Maybe… I'll see.", "I'll try to come!", "I can't.", "I'm not sure. I can't on Wednesday, how about Thursday?"]) expect(checkSaid(no, s), s).toBe('wrong');
		for (const s of ['A picnic sounds fun!', "I'd prefer the restaurant.", "Let's do the picnic!", 'The park, for sure!']) expect(checkSaid(choice, s), s).toBe('right');
		for (const s of ['Whatever you want. You know better.', 'Both are fine, you choose!', "I don't know."]) expect(checkSaid(choice, s), s).toBe('wrong');
		for (const t of [no, choice]) t.reply!.options.forEach((option, i) => { if (i !== t.reply!.answer) expect(checkSaid(t, option), option).toBe('wrong'); });
	});
});

describe('Everyday 2: Say it in English, the weekend and the voice message', () => {
	it('three messages to Jake, each with two points, two short models and two hints', () => {
		const items = SAY.intermediate!;
		expect(items.map(i => i.id)).toEqual(['ev2-no-thursday', 'ev2-seven', 'ev2-invite']);
		for (const item of items) {
			expect(item.points).toHaveLength(2); expect(item.models).toHaveLength(2); expect(item.hints).toHaveLength(2);
			expect(item.fa).toMatch(persian);
			for (const p of [...item.points, ...item.hints]) expect(p.fa, item.id).toMatch(persian);
			for (const m of item.models) expect(words(m), m).toBeLessThanOrEqual(25);
		}
		// "پنج‌شنبه" keeps its zero-width joiner.
		expect(items[0].fa).toContain('پنج‌شنبه');
	});
	it('the weekend question practises a clear no with another day', () => {
		const prompt = sayPrompt('weekend-plans');
		expect(prompt).toBe(SAY_PROMPTS['weekend-plans']);
		expect(prompt.question).toMatch(/which day doesn't work, and suggest one that does/);
		expect(prompt.ideas).toHaveLength(3);
		expect(EVERYDAY_TWO.tracks!.professional.find(m => m.id === 'say-it-better')?.sayPrompt).toBe('weekend-plans');
	});
	it('one voice message from Jake: three asks, a clear no required, pizza on Friday (Saturday is Nina’s)', () => {
		expect(MESSAGES).toHaveLength(1);
		const [message] = MESSAGES;
		expect(message.from.voice).toBe('a');
		expect(message.asks).toHaveLength(3);
		expect(message.asks[1].ask.en).toMatch(/clearly.*"maybe"/);
		expect(message.sentences.join(' ')).toMatch(/on Friday/);
		expect(message.sentences.join(' ')).not.toMatch(/Saturday/);
		for (const [withName, without] of Object.entries(WITHOUT_NAME)) { expect(withName).toContain('{name}'); expect(without).not.toContain('{name}'); }
		expect(Object.keys(WITHOUT_NAME)).toContain(message.model);
	});
});
