import { describe, it, expect } from 'vitest';
import { TRACKS, type DayModule } from './day';
import { EVERYDAY_ONE } from './days/everyday-1/pack';
import * as everydayOne from './days/everyday-1';
import { partLinesOf, stepsOf, totalPoints, linkParts } from './listen-connect';
import { speakLimit } from './retell';
import { normalise } from './say-better';
import { checkSaid } from './traps';
import { SAY_PROMPTS } from './say-better';
import { fallbackFor, goalIdsOf, missedGoals, preparedLines, resultNote, twistWithLead } from './roleplay';
import { sceneLineProblem } from '$lib/server/jamie-line';
import { REPLY_VOICE } from './voice-messages';

const { CONNECT, RETELL, PHRASES, TRAPS, LESSON_TRAP_IDS, SAY, MESSAGES, LESSON_MESSAGE_IDS, CALLS, trashCheck, rentCheck, WITHOUT_NAME } = everydayOne;
const words = (text: string) => text.trim().split(/\s+/).length;
const persian = /[؀-ۿ]/;
const a2 = CALLS.intermediate!;
const b1 = CALLS.professional!;

describe('Everyday 1: the chapter', () => {
	it('is a pilot in the Everyday story, not ready for learners, with five built steps per version', () => {
		expect(EVERYDAY_ONE).toMatchObject({ id: 'everyday-1', number: 101, arc: 'everyday', ready: false, pilot: true, themePhrase: 'meeting a neighbor', modules: [] });
		const ids = (list: DayModule[]) => list.map(m => m.id);
		expect(ids(EVERYDAY_ONE.tracks!.intermediate)).toEqual(['listen-act', 'phrases', 'traps', 'say-in-english', 'scenario']);
		expect(ids(EVERYDAY_ONE.tracks!.professional)).toEqual(['listen-retell', 'phrases', 'say-it-better', 'voice-messages', 'scenario']);
		for (const track of TRACKS) {
			const list = EVERYDAY_ONE.tracks![track];
			for (const m of list) {
				expect(m.built, m.id).toBe(true);
				expect(m.minutes[20], m.id).toBeGreaterThan(0);
				for (const text of [m.title, m.short, m.does, m.intro]) expect(text.fa, m.id).toMatch(persian);
			}
			// The 15-minute lesson leaves out one middle step and stays within the shell's limit.
			const fifteen = list.filter(m => m.minutes[15] !== undefined);
			expect(fifteen).toHaveLength(4);
			expect(fifteen.reduce((sum, m) => sum + m.minutes[15]!, 0) + EVERYDAY_ONE.checkInMinutes + EVERYDAY_ONE.recapMinutes).toBeLessThanOrEqual(21);
			// Steps 2–5 say who and where (the role-play and Mr. Patel open with "Imagine…").
			for (const m of list.slice(1)) expect(m.intro.en, m.id).toMatch(/Remember Jake, your neighbor upstairs\? Imagine you’ve just moved into 3C\.|^Imagine you’ve just moved into 3C/);
			expect(EVERYDAY_ONE.goals?.[track]?.en).toMatch(/^You’ve practiced/);
		}
		expect(EVERYDAY_ONE.tracks!.professional.find(m => m.id === 'say-it-better')?.sayPrompt).toBe('about-you');
		expect(SAY_PROMPTS['about-you']).toBeDefined();
		// The opening line is only in the check-in story.
		expect(EVERYDAY_ONE.checkIn!.story.en).toMatch(/^This is Sara\./);
		for (const track of TRACKS) for (const m of EVERYDAY_ONE.tracks![track]) expect(m.intro.en).not.toContain('This is Sara');
	});
});

describe('Everyday 1: listening', () => {
	const set = CONNECT.intermediate!;
	it('is one two-voice conversation in two parts, with Jake and Sara never sounding like Mira or each other', () => {
		expect(set.speakers.jake.voice).toBe('a');
		expect(set.speakers.sara.voice).toBe('d');
		expect(set.parts).toHaveLength(2);
		expect(set.parts.flatMap((_, p) => partLinesOf(set, p))).toEqual(set.conversation);
		for (const line of set.conversation) expect(set.speakers[line.who], line.text).toBeDefined();
		const total = set.conversation.reduce((sum, line) => sum + words(line.text), 0);
		expect(total).toBe(144);
		expect(total).toBeGreaterThanOrEqual(110); expect(total).toBeLessThanOrEqual(160);
		expect(partLinesOf(set, 0).reduce((sum, l) => sum + words(l.text), 0)).toBe(74);
		expect(partLinesOf(set, 1).reduce((sum, l) => sum + words(l.text), 0)).toBe(70);
		for (const part of set.parts) expect(part.title.fa).toMatch(persian);
	});
	it('six points: the dog first, every question after the part that proves it, three results for two causes', () => {
		expect(totalPoints(set)).toBe(6);
		expect(set.questions).toHaveLength(6);
		expect(set.questions[0]).toEqual({ part: 0, kind: 'choice', index: 0 });
		const steps = stepsOf(set).map(s => s.kind);
		expect(steps).toEqual(['listen', 'question', 'question', 'question', 'listen', 'question', 'question', 'question', 'end']);
		for (const q of set.questions) {
			const evidence = q.kind === 'connect' ? set.connect.evidence[q.index] : set.choices[q.index].evidence;
			expect(evidence).toBeGreaterThanOrEqual(set.parts[q.part].from);
			expect(evidence).toBeLessThanOrEqual(set.parts[q.part].to);
		}
		expect(set.connect.results).toHaveLength(set.connect.causes.length + 1);
		expect(new Set(set.connect.answers).size).toBe(set.connect.causes.length);
		for (const option of [...set.connect.results, ...set.choices.flatMap(q => q.options)]) expect(words(option), option).toBeLessThanOrEqual(6);
		for (const q of set.choices) { expect(q.answer).toBeLessThan(q.options.length); expect(q.kind.fa).toMatch(persian); expect(q.question).not.toContain('*'); }
		expect(set.choices.map(q => q.answer)).toEqual([1, 0, 2, 1]);
		const line = (i: number) => set.conversation[i].text;
		expect(line(set.connect.evidence[0])).toContain('no problem');
		expect(line(set.connect.evidence[1])).toContain('Actually… yes, please');
		expect(line(set.choices[0].evidence)).toContain("That's Biscuit");
		expect(line(set.choices[1].evidence)).toContain('Tuesday morning, by eight');
		expect(line(set.choices[2].evidence)).toContain('Thanks! I love it too');
		expect(line(set.choices[3].evidence)).toContain('A week from today, Saturday at four');
	});
	it('each link phrase is said exactly once, never inside another word, and stays out of the questions', () => {
		const text = set.conversation.map(l => l.text).join(' ');
		for (const phrase of set.linkPhrases) expect(text.toLowerCase().split(phrase).length - 1, phrase).toBe(1);
		const found = set.conversation.flatMap(l => linkParts(l.text, set.linkPhrases).filter(p => p.link).map(p => p.text.toLowerCase()));
		expect(found.sort()).toEqual([...set.linkPhrases].sort());
		const asked = [...set.choices.flatMap(q => [q.question, ...q.options]), ...set.connect.causes, ...set.connect.results].join(' ').toLowerCase();
		for (const phrase of set.linkPhrases) expect(asked).not.toContain(phrase);
		expect(set.miraLine.fa).toMatch(persian);
	});
	it('the Professional step: one voice, the same meeting, five key points, 90 seconds to speak', () => {
		expect(RETELL.id).toBe('the-last-box');
		expect(RETELL.level).toBe('B1');
		expect(RETELL.voice).toBe('a');
		expect(words(RETELL.text)).toBe(126);
		expect(RETELL.keyPoints).toHaveLength(5);
		expect(speakLimit(RETELL)).toBe(90);
		expect(RETELL.task?.fa).toMatch(persian);
		expect(RETELL.imageAlt).toBeUndefined();
	});
});

describe('Everyday 1: natural phrases', () => {
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
		const [hi, howLong, great, again, go] = PHRASES.intermediate.map(p => (s: string) => p.found(normalise(s)));
		for (const s of ["I've just moved in", "I'm moving in today", 'I just moved into 3C']) expect(hi(s), s).toBe(true);
		for (const s of ['I came to this building', 'I just moved here']) expect(hi(s), s).toBe(false);
		for (const s of ["How long've you been here?", 'How long have you been living here?']) expect(howLong(s), s).toBe(true);
		for (const s of ['How long do you live here?', 'Since when you live here?']) expect(howLong(s), s).toBe(false);
		for (const s of ['That would be really nice', "that'd be awesome"]) expect(great(s), s).toBe(true);
		for (const s of ["it's fine", "don't trouble yourself", 'Yes please, thank you']) expect(great(s), s).toBe(false);
		for (const s of ['Could you say it again?', 'say that one more time']) expect(again(s), s).toBe(true);
		for (const s of ['What?', 'Again, please', 'Can you repeat that?']) expect(again(s), s).toBe(false);
		for (const s of ["I'd better go", 'I should get going', 'I better go']) expect(go(s), s).toBe(true);
		for (const s of ['I must go now', 'I have to go now']) expect(go(s), s).toBe(false);
		const [downstairs, sure, later, rather, letGo] = PHRASES.professional.map(p => (s: string) => p.found(normalise(s)));
		for (const s of ["I've just moved in down stairs", 'I moved in right below you']) expect(downstairs(s), s).toBe(true);
		for (const s of ['I live in the floor under you', 'I just moved in']) expect(downstairs(s), s).toBe(false);
		expect(sure('Are you sure? That would be really helpful')).toBe(true);
		for (const s of ["No, no, it's fine", 'Are you sure? Thanks!']) expect(sure(s), s).toBe(false);
		for (const s of ['Would it be okay if I came a bit later?', 'Is it all right if I come at five?']) expect(later(s), s).toBe(true);
		for (const s of ['Is it possible I come late?', 'Can I come later?']) expect(later(s), s).toBe(false);
		expect(rather("I'd rather not get into that")).toBe(true);
		for (const s of ["It's private", 'I prefer not to say']) expect(rather(s), s).toBe(false);
		for (const s of ["I'll let you get going", "I'm gonna let you go"]) expect(letGo(s), s).toBe(true);
		for (const s of ['I must go', 'I should go']) expect(letGo(s), s).toBe(false);
	});
});

describe('Everyday 1: traps', () => {
	const trap = (id: string) => TRAPS.find(t => t.id === id)!;
	it('five in the lesson: three word traps with one tap target each, then two "which reply?" items', () => {
		expect(TRAPS.map(t => t.id)).toEqual(LESSON_TRAP_IDS);
		expect(TRAPS.slice(0, 3).every(t => !t.reply && t.wrong >= 0 && t.wrong < t.words.length)).toBe(true);
		for (const t of TRAPS.slice(3)) {
			expect(t.reply).toBeDefined();
			expect(t.words).toEqual([]);
			expect(t.wrong).toBe(-1);
			expect(t.reply!.options).toHaveLength(3);
			expect(t.reply!.options[t.reply!.answer]).toBe(t.right);
			expect(t.reply!.prompt.fa).toMatch(persian);
		}
		for (const t of TRAPS) { expect(t.why.fa).toMatch(persian); expect(t.kind.fa).toBeTruthy(); }
		expect(trap('where-from').words[trap('where-from').wrong]).toBe('you are');
		expect(trap('has-lived').words[trap('has-lived').wrong]).toBe('lives');
		expect(trap('jake-he').words[trap('jake-he').wrong]).toBe('She');
	});
	it('each word trap takes its fix and turns down the mistake', () => {
		for (const t of TRAPS.slice(0, 3)) {
			expect(checkSaid(t, t.right), t.right).toBe('right');
			expect(checkSaid(t, t.words.join(' ')), t.id).toBe('wrong');
		}
		for (const s of ["My neighbor's lived here for 6 years.", "He's been living here for six years.", 'My neighbor has been here six years.']) expect(checkSaid(trap('has-lived'), s), s).toBe('right');
		for (const s of ['My neighbor has lived here since six years.', 'My neighbor lived here for six years.']) expect(checkSaid(trap('has-lived'), s), s).toBe('wrong');
		expect(checkSaid(trap('where-from'), 'Where do you come from?')).toBe('alsoGood');
	});
	it('"which reply?": a first-time yes and a plain thanks', () => {
		const yes = trap('yes-first-time'), thanks = trap('just-thanks');
		for (const s of ['Yes, please! Thank you.', 'Oh, thank you so much!', 'Thanks!', 'OK, thank you', 'Sure, thanks!', "Oh, yes please, that'd be great!"]) expect(checkSaid(yes, s), s).toBe('right');
		for (const s of ["Oh, no, no. It's fine.", 'No, thank you.', "No, no, it's fine. Yes, please!", "Please, don't trouble yourself."]) expect(checkSaid(yes, s), s).toBe('wrong');
		for (const s of ['Thanks! I love it too.', 'Thank you!', 'Thanks']) expect(checkSaid(thanks, s), s).toBe('right');
		for (const s of ["Oh, it's nothing.", "Take it, it's yours!", 'Thanks, take it!']) expect(checkSaid(thanks, s), s).toBe('wrong');
		// The wrong options are wrong when said, too.
		for (const t of [yes, thanks]) t.reply!.options.forEach((option, i) => { if (i !== t.reply!.answer) expect(checkSaid(t, option), option).toBe('wrong'); });
		expect(yes.why).toBe(everydayOne.TAAROF_NOTE);
	});
});

describe('Everyday 1: Say it in English and the voice message', () => {
	it('three messages to Jake, each with two points, two short models and two hints', () => {
		const items = SAY.intermediate!;
		expect(items.map(i => i.id)).toEqual(['ev1-yes-help', 'ev1-hi', 'ev1-go']);
		expect(SAY.professional).toBeUndefined();
		expect(everydayOne.LESSON_SAY_IDS.intermediate).toBeNull();
		for (const item of items) {
			expect(item.points).toHaveLength(2); expect(item.models).toHaveLength(2); expect(item.hints).toHaveLength(2);
			expect(item.fa).toMatch(persian); expect(item.to.fa).toMatch(persian);
			for (const p of [...item.points, ...item.hints]) expect(p.fa, item.id).toMatch(persian);
			for (const m of item.models) expect(words(m), m).toBeLessThanOrEqual(25);
		}
		// The learner's own name goes in at display time.
		expect(items[1].models.every(m => m.includes('{name}'))).toBe(true);
		expect(items.flatMap(i => i.models).join(' ')).not.toContain('Karimi');
	});
	it('Mr. Patel: short sentences, three asks in Persian too, a short model reply, never Mira’s voice', () => {
		expect(MESSAGES.map(m => m.id)).toEqual(LESSON_MESSAGE_IDS);
		const [patel] = MESSAGES;
		expect(patel.from.voice).toBe('c');
		expect(patel.from.voice).not.toBe(REPLY_VOICE);
		for (const s of patel.sentences) expect(s.length, s).toBeLessThanOrEqual(120);
		expect(patel.asks).toHaveLength(3);
		for (const a of patel.asks) { expect(a.ask.fa).toMatch(persian); expect(a.missed.fa).toMatch(persian); }
		expect(words(patel.model)).toBe(36);
		expect(patel.model).toContain('{name}');
		for (const [withName, without] of Object.entries(WITHOUT_NAME)) { expect(withName).toContain('{name}'); expect(without).not.toContain('{name}'); expect(words(without)).toBeLessThanOrEqual(40); }
	});
});

describe('Everyday 1: the role-plays', () => {
	it('one scene per version, face to face with Jake, opening on the goals', () => {
		expect(a2.id).toBe('neighbor-stairs-a2-v1');
		expect(b1.id).toBe('neighbor-stairs-b1-v1');
		for (const scene of [a2, b1]) {
			expect(scene.voice).toBe('a');
			expect(scene.screen.character).toBe('Jake');
			expect(scene.screen.skipMission).toBe(true);
			expect(scene.screen.start?.en).toBe('Start the conversation');
			expect(scene.screen.hint).toBeUndefined();
			expect(scene.labels).toEqual({ learner: 'New neighbor', character: 'Jake' });
			expect(scene.screen.card[0].value.en).toContain('Your own first name');
			expect(scene.twist?.lead).toBe(true);
			expect(scene.twist?.after).toEqual(['help', 'intro']);
		}
		expect(goalIdsOf(a2)).toEqual(['help', 'intro', 'ask']);
		expect(goalIdsOf(b1)).toEqual(['help', 'intro', 'barbecue']);
		expect(a2.twist?.audioOnly).toBe(true);
		expect(b1.twist?.audioOnly).toBeFalsy();
		expect(b1.twist?.unlocks).toEqual(['barbecue']);
		expect(b1.screen.card).toHaveLength(4);
	});
	it('every fixed line passes the server’s line check (and B1’s ban), and each open goal has a fallback', () => {
		for (const scene of [a2, b1]) {
			for (const variant of scene.variants) for (const line of preparedLines(scene)) {
				const twist = Object.values(scene.twist?.lines ?? {}).includes(line);
				if (!twist || scene.twist!.lines[variant] === line) expect(sceneLineProblem(scene, line, variant), line).toBeNull();
				if (scene.banned) expect(scene.banned.pattern.test(line), line).toBe(false);
				expect(words(line), line).toBeLessThanOrEqual(25);
			}
			for (const id of [...goalIdsOf(scene), 'done']) expect(scene.fallback[id]).toBeTruthy();
			expect(fallbackFor(scene, [])).toBe(scene.fallback.help);
			expect(fallbackFor(scene, goalIdsOf(scene))).toBe(scene.fallback.done);
			// A missed `help` is skipped: never offer again after a no.
			expect(fallbackFor(scene, ['help'])).toBe(scene.fallback.intro);
			expect(twistWithLead('Nice to meet you, Ali! What do you do?', scene.twist!.lines.first, false)).toBe(`Nice to meet you, Ali! ${scene.twist!.lines.first}`);
		}
		// The facts sheet has the numbers Jake may say; a made-up one is refused.
		expect(sceneLineProblem(a2, 'I live in 4B, and trash goes out at 8.', 'first')).toBeNull();
		expect(sceneLineProblem(b1, 'I pay 1500 for 4B.', 'first')).toMatch(/1500/);
	});
	it('the leak checks catch the twist and none of Jake’s own lines', () => {
		for (const scene of [a2, b1]) {
			const leak = scene.twist!.leak;
			for (const variant of scene.variants) expect(leak.test(scene.twist!.lines[variant]), variant).toBe(true);
			for (const line of [scene.greeting, ...Object.values(scene.fallback)]) expect(leak.test(line), line).toBe(false);
		}
		expect(a2.twist!.leak.test(a2.twist!.replies!.asked)).toBe(true);
		expect(b1.twist!.leak.test(b1.twist!.replies!.repeat)).toBe(true);
	});
	it('a first no misses `help` for this run; "Are you sure?" and a yes do not', () => {
		const help = a2.firstTry!.help;
		for (const s of ["Oh, no, it's fine!", 'No, thanks', "I'm OK", "Don't worry", "It's OK, I've got it", "Nah, I'm good", "Oh, thank you, I'm OK", "No, it's fine. Actually, yes please"]) expect(missedGoals(a2, [], [s]), s).toEqual(['help']);
		for (const s of ['Yes, please!', 'Are you sure?', 'Really?', 'Thanks!', 'OK, thank you', 'Oh, thank you so much!', "Oh no, it's heavy! Yes, please!", 'No problem, thank you!', "Hi! I'm Ali, I live in 3C"]) expect(missedGoals(a2, [], [s]), s).toEqual([]);
		expect(help.test("oh, no, it's fine!")).toBe(true);
		expect(missedGoals(a2, ['help'], ['No, it’s fine'])).toEqual([]);
		expect(b1.firstTry!.help).toBe(help);
	});
	it('A2 twist: asking or checking counts, "What?" counts with a note, catching it is not a fail', () => {
		const cases: Record<string, string[]> = {
			asked: ['Sorry?', 'Pardon?', 'Can you say that again?', 'Can you speak slower?', 'What time?', 'I didn’t catch that', "I don't understand"],
			checked: ['Tuesday?', 'Tuesday', 'Did you say Tuesday?', 'Tuesday at eight, right?', 'By eight?', 'The truck?'],
			what: ['What?', 'Huh?'],
			caught: ['OK, Tuesday by eight. Got it, thanks!'],
			no: ['OK', 'Yes', 'Thanks', 'What do you do?']
		};
		for (const [outcome, replies] of Object.entries(cases)) for (const reply of replies) expect(trashCheck(reply), reply).toBe(outcome);
		expect(a2.twist!.check).toBe(trashCheck);
		expect(a2.twist!.replies).toEqual({ asked: 'Sorry! Trash day is Tuesday. Put it out by eight a.m.', what: 'Sorry! Trash day is Tuesday. Put it out by eight a.m.', checked: 'Yep! Tuesday morning, by eight.' });
		for (const outcome of Object.keys(cases)) expect(a2.notes!.twist![outcome], outcome).toBeDefined();
	});
	it('B1 twist: short, redirect and long are fine; a sharp answer is not; not understanding gets a simpler question', () => {
		const cases: Record<string, string[]> = {
			repeat: ['Sorry?', 'What do you mean?'],
			short: ['About the same as you, probably!', 'Not too bad, actually.', 'About fifteen hundred. And you?', 'Nice dog! How old is he?'],
			redirect: ["Ha, I'd rather not say! But I really like the place. So how long have you been here?", "Ha, that's a secret!", 'I prefer not to say, sorry!'],
			long: ['Well, it is about fifteen hundred a month, plus a deposit, and water is included but not the electricity, and honestly I think it is a lot for such a small place.'],
			sharp: ['None of your business.', 'I don’t want to tell you.', "It's private.", 'Why do you ask?']
		};
		for (const [outcome, replies] of Object.entries(cases)) for (const reply of replies) expect(rentCheck(reply), reply).toBe(outcome);
		expect(b1.twist!.check).toBe(rentCheck);
		for (const outcome of ['short', 'redirect', 'long', 'sharp']) expect(b1.notes!.twist![outcome], outcome).toBeDefined();
	});
	it('B1 bans amounts in words, so "fifteen hundred" never gets through', () => {
		const ban = b1.banned!.pattern;
		for (const s of ['About fifteen hundred a month.', 'Two thousand, maybe.', 'Like two grand!', 'Around 2k.']) expect(ban.test(s), s).toBe(true);
		for (const s of ['Ha, fair enough!', 'See you Saturday at four!', 'Biscuit is a good boy.']) expect(ban.test(s), s).toBe(false);
		expect(a2.banned).toBeUndefined();
	});
	it('one note on the result: a missed `help` first, then the twist', () => {
		expect(resultNote(a2, { missed: ['help'], twistOutcome: 'asked' })?.en).toMatch(/^Jake took your first "no"/);
		expect(resultNote(a2, { missed: [], twistOutcome: 'no' })?.en).toMatch(/^Jake said that fast/);
		expect(resultNote(b1, { missed: [], twistOutcome: 'sharp' })?.en).toMatch(/a bit cold/);
		expect(everydayOne.NOTES_NOT_MET.intermediate.ask.en).toContain('How long have you lived here?');
		expect(everydayOne.NOTES_NOT_MET.professional.barbecue.en).toContain("I'd love to come!");
	});
	it('Jake’s instructions: his facts, the goals reached and missed, and the twist turn only when it is due', () => {
		const base = a2.prompt('first', ['help']);
		expect(base).toContain('around A2 level');
		expect(base).toContain('already reached: help; missed for good: none');
		expect(base).toContain('Trash: it goes out on Tuesday morning, by 8 a.m.');
		expect(base).not.toContain('THIS TURN');
		expect(base).toContain('- ask: the neighbor has asked Jake a real question');
		const due = (a2.prompt as (v: string, m: readonly string[], t: everydayOne.JakeTurn) => string)('first', [], { missed: ['help'], twistDue: true });
		expect(due).toContain('missed for good: help');
		expect(due).toContain('THIS TURN: reply with ONE short sentence');
		const pro = b1.prompt('replay', []);
		expect(pro).toContain('around B1 level');
		expect(pro).toContain('invite them to the building barbecue');
		expect(pro).toContain('Jake thinks he pays too much for 4B');
		expect(pro).not.toContain("Don't bring up the barbecue");
		expect(a2.facts('first')).not.toContain('pays too much');
		expect(b1.facts('first')).toContain('something small to eat or drink');
		expect(b1.voiceDirection).not.toContain('short pauses');
		expect(a2.voiceDirection).toContain('short pauses');
	});
});
