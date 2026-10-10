import { describe, it, expect } from 'vitest';
import { RawLabSchema, checkLabFeedback, labPrompt } from './say-better-lab-ai';
import { LAB_QUESTIONS, chooseFocus, countLine, markParts, type LabFeedback } from '$lib/practice/say-better-lab';

const T = 'On weekends I usually wake up late and in the weekend I go to park with my brother. He like football so we play with his friends, and in the weekend evening we watch a film together at home.';
const BETTER = 'On weekends I usually wake up late, and on weekends I go to the park with my brother. He likes football, so we play with his friends, and on weekend evenings we watch a film together at home.';
const raw = (over: object = {}) => RawLabSchema.parse({
	onTopic: true,
	allMistakes: [
		{ original: 'in the weekend I', better: 'on weekends I', kind: 'preposition' },
		{ original: 'go to park', better: 'go to the park', kind: 'a/the' },
		{ original: 'He like football', better: 'He likes football', kind: 'verb form' },
		{ original: 'in the weekend evening', better: 'on weekend evenings', kind: 'preposition' }
	],
	fixes: [{ original: 'He like football', whyEn: 'With he, add -s: likes.', whyFa: 'با he فعل s می‌گیرد.' }],
	natural: null, better: BETTER,
	praiseEn: 'You said "we watch a film together at home", which is clear.', praiseFa: 'گفتی "we watch a film together at home" که روشن است.', ...over
});
const ok = (r: ReturnType<typeof checkLabFeedback>): LabFeedback => { if ('problem' in r) throw new Error(r.problem); return r.feedback; };

describe('Say it again, better (lab): checking the AI', () => {
	it('finds every mistake, marks only the changed words, and counts them all', () => {
		const f = ok(checkLabFeedback(raw(), T));
		expect(f.case).toBe('mistakes');
		expect(f.mistakes).toHaveLength(4);
		const marked = f.mistakes.map(m => T.slice(...m.at));
		expect(marked).toEqual(['in the weekend', 'to park', 'like', 'in the weekend evening']);
		expect(f.mistakes.map(m => BETTER.slice(...m.inBetter!))).toEqual(['on weekends', 'to the park', 'likes', 'on weekend evenings']);
	});
	it('chooses the focus fixes in code: two different kinds, never a single a/the', () => {
		const f = ok(checkLabFeedback(raw(), T));
		expect(f.fixes.map(x => x.better)).toEqual(['He likes football', 'on weekends I']);
		expect(f.mistakes.filter(m => m.focus).map(m => [m.kind, m.focus])).toEqual([['preposition', 2], ['verb form', 1]]);
		expect(f.fixes[0].why.en).toBe('With he, add -s: likes.');
		expect(f.fixes[1].why.en).toContain('small word');
	});
	it('a mistake the learner never said makes the call retry', () => {
		expect(checkLabFeedback(raw({ allMistakes: [{ original: 'I goed home', better: 'I went home', kind: 'tense' }] }), T)).toEqual({ problem: expect.stringContaining('not in the transcript') });
	});
	it('the better version must carry every correction, not only the focus fixes', () => {
		expect(checkLabFeedback(raw({ better: BETTER.replace('the park', 'park') }), T)).toEqual({ problem: expect.stringContaining('go to the park') });
	});
	it('an item inside another is dropped, so the same words are not counted twice', () => {
		const list = [...raw().allMistakes, { original: 'He like', better: 'He likes', kind: 'verb form' }];
		expect(ok(checkLabFeedback(raw({ allMistakes: list }), T)).mistakes).toHaveLength(4);
	});
	it('two items that share words are merged into one, still corrected and counted once', () => {
		const list = [{ original: 'in the weekend I go', better: 'on weekends I go', kind: 'preposition' }, { original: 'I go to park', better: 'I go to the park', kind: 'a/the' }, ...raw().allMistakes.slice(2)];
		const f = ok(checkLabFeedback(raw({ allMistakes: list }), T));
		expect(f.mistakes).toHaveLength(3);
		expect(f.mistakes[0]).toMatchObject({ original: 'in the weekend I go to park', better: 'on weekends I go to the park', kind: 'preposition' });
		expect(T.slice(...f.mistakes[0].at)).toBe('in the weekend I go to');
	});
	it('a left-out part is listed and counted but never practised', () => {
		const said = 'I would like to change my habit of using my phone late at night because it is bad for my sleep and the blue gate is mostly horse and I want to read a book.';
		const better = 'I would like to change my habit of using my phone late at night because it is bad for my sleep, and I want to read a book.';
		const f = ok(checkLabFeedback(raw({ allMistakes: [{ original: 'the blue gate is mostly horse', better: '', kind: 'unclear' }], fixes: [], better, praiseEn: null }), said));
		expect(f).toMatchObject({ case: 'mistakes', fixes: [], mistakes: [{ kind: 'unclear', inBetter: null, focus: 0 }] });
		expect(checkLabFeedback(raw({ allMistakes: [{ original: 'the blue gate is mostly horse', better: '', kind: 'unclear' }], fixes: [], better: said }), said)).toEqual({ problem: expect.stringContaining('left out') });
	});
	it('praise never quotes a mistake', () => {
		expect(ok(checkLabFeedback(raw({ praiseEn: 'You said "He like football" clearly.' }), T)).praise).toBeNull();
		expect(ok(checkLabFeedback(raw(), T)).praise?.en).toContain('watch a film');
	});
	it('no mistakes: strong for a real answer, more natural when there is one suggestion, more for a short one', () => {
		const clean = 'On weekends I usually sleep late, then I meet my friends in a café near my flat. In the afternoon we often walk by the river, and in the evening I cook dinner for my family.';
		expect(ok(checkLabFeedback(raw({ allMistakes: [], fixes: [], better: null, praiseEn: null }), clean)).case).toBe('strong');
		const nat = ok(checkLabFeedback(raw({ allMistakes: [], fixes: [], better: null, praiseEn: null, natural: { original: 'I usually sleep late', better: 'I usually sleep in', whyEn: 'We say sleep in.', whyFa: 'می‌گوییم sleep in.' } }), clean));
		expect(nat).toMatchObject({ case: 'natural', fixes: [{ type: 'natural', better: 'I usually sleep in' }] });
		expect(clean.slice(...nat.natural!.at)).toBe('late');
		expect(nat.better!.slice(...nat.natural!.inBetter!)).toBe('in');
		expect(ok(checkLabFeedback(raw({ onTopic: false }), T))).toMatchObject({ case: 'more', praise: null, mistakes: [] });
		expect(ok(checkLabFeedback(raw(), 'I like weekends very much.')).case).toBe('more');
	});
	it('cuts a long list to 20 rather than rejecting it', () => {
		const many = Array.from({ length: 30 }, () => ({ original: 'x y', better: 'x z', kind: 'tense' }));
		expect(RawLabSchema.parse({ ...raw(), allMistakes: many }).allMistakes).toHaveLength(20);
	});
	it('the prompt carries the question, its tense and the rules', () => {
		const p = labPrompt('B1', LAB_QUESTIONS[2], true);
		expect(p).toContain('Tell me about a good day you had recently.');
		expect(p).toContain('past simple');
		expect(p).toContain('ignore an unfinished last sentence');
		expect(p).toContain('Never quote words that belong to an "allMistakes" item');
		expect(labPrompt('B1', LAB_QUESTIONS[0], false)).not.toContain('unfinished');
	});
});

describe('Say it again, better (lab): shared rules', () => {
	it('chooseFocus: kind order, repeats first, different kinds, a/the only when repeated', () => {
		expect(chooseFocus([{ kind: 'a/the' }, { kind: 'preposition' }, { kind: 'tense' }])).toEqual([2, 1]);
		expect(chooseFocus([{ kind: 'tense' }, { kind: 'tense' }, { kind: 'preposition' }])).toEqual([0, 2]);
		expect(chooseFocus([{ kind: 'a/the' }, { kind: 'a/the' }])).toEqual([0]);
		expect(chooseFocus([{ kind: 'a/the' }])).toEqual([0]);
		expect(chooseFocus([{ kind: 'unclear', better: '' }, { kind: 'preposition', better: 'on' }])).toEqual([1]);
	});
	it('countLine counts mistakes and says what is practised', () => {
		expect(countLine('mistakes', 4, 2).en).toBe('There are 4 things to fix. Let’s practise the 2 that matter most. You’ll see the rest in your better version.');
		expect(countLine('mistakes', 8, 2).en).toContain('Let’s not try to fix everything at once');
		expect(countLine('mistakes', 2, 2).en).toBe('There are two things to fix. Let’s work on both now.');
		expect(countLine('mistakes', 1, 1).en).toBe('There’s one thing to fix. Let’s work on it now.');
		expect(countLine('strong', 0, 0).en).toContain('I didn’t hear any mistakes');
	});
	it('markParts splits text by spans', () => {
		expect(markParts('a bc d', [{ at: [2, 4], focus: 1 }])).toEqual([{ text: 'a ', focus: null }, { text: 'bc', focus: 1 }, { text: ' d', focus: null }]);
	});
});
