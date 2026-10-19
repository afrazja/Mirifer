import { describe, it, expect } from 'vitest';
import { CHOICES, CONNECT, CONVERSATION, LINK_PHRASES, PARTS, QUESTIONS, SPEAKERS, STEPS, TOTAL_POINTS, emptyConnectRecord, linkParts, partLines, scoreConnect } from './listen-connect';
import { COACH_VOICE } from './coach';

const words = (text: string) => text.split(/\s+/).filter(Boolean).length;

describe('Listen and connect: Day 1 content follows the rules', () => {
	it('is a short two-voice conversation, and Sara never sounds like Mira', () => {
		const total = CONVERSATION.reduce((sum, line) => sum + words(line.text), 0);
		expect(total).toBeGreaterThanOrEqual(120);
		expect(total).toBeLessThanOrEqual(160);
		expect(SPEAKERS.agent.voice).not.toBe(SPEAKERS.sara.voice);
		expect([SPEAKERS.agent.voice, SPEAKERS.sara.voice]).not.toContain(COACH_VOICE);
	});
	it('every link phrase is in the conversation, and each evidence line proves its answer', () => {
		const text = CONVERSATION.map(line => line.text.toLowerCase()).join(' ');
		for (const phrase of LINK_PHRASES) expect(text).toContain(phrase);
		expect(CONVERSATION[CHOICES[0].evidence].text).toContain('supposed to be on your flight');
		expect(CONVERSATION[CHOICES[1].evidence].text).toContain('keep the receipt');
		expect(CONVERSATION[CHOICES[2].evidence].text).toContain('instead');
	});
	it('options are short, and questions never show a link phrase in bold', () => {
		for (const option of [...CONNECT.results, ...CHOICES.flatMap(q => q.options)]) expect(words(option)).toBeLessThanOrEqual(8);
		for (const q of CHOICES) expect(q.question).not.toContain('*');
		expect(new Set(CONNECT.answers).size).toBe(CONNECT.causes.length);
	});
	it('scores six points, Connect counting once per pair', () => {
		expect(TOTAL_POINTS).toBe(6);
		const all = { ...emptyConnectRecord(), connect: [...CONNECT.answers], choices: CHOICES.map(q => q.answer) };
		expect(scoreConnect(all)).toEqual({ correct: 6, total: 6 });
		expect(scoreConnect({ ...all, connect: [CONNECT.answers[0], 1, 1] }).correct).toBe(4);
	});
	it('highlights the link phrases in a line', () => {
		expect(linkParts('In that case, just buy it.').filter(p => p.link).map(p => p.text)).toEqual(['In that case']);
	});
	it('is heard in three parts that cover every line once, each followed by questions about that part only', () => {
		expect(PARTS.flatMap((_, p) => partLines(p))).toEqual(CONVERSATION);
		for (const q of QUESTIONS) {
			const evidence = q.kind === 'connect' ? CONNECT.evidence[q.index] : CHOICES[q.index].evidence;
			expect(evidence).toBeGreaterThanOrEqual(PARTS[q.part].from);
			expect(evidence).toBeLessThanOrEqual(PARTS[q.part].to);
		}
		expect(QUESTIONS).toHaveLength(TOTAL_POINTS);
		expect(STEPS.map(s => s.kind)).toEqual(['listen', 'question', 'question', 'listen', 'question', 'listen', 'question', 'question', 'question', 'end']);
		expect(CONVERSATION[CONNECT.evidence[0]].text).toContain('wrong flight number');
		expect(CONVERSATION[CONNECT.evidence[1]].text).toContain('hotel tomorrow');
		expect(CONVERSATION[CONNECT.evidence[2]].text).toContain('pharmacy');
	});
});

import { CONNECT as DAY_TWO_CONNECT } from './days/day-2';
import { connectSetFor } from './day-content';
import { DAY_ONE_SET, asConnectRecord as asRecord, emptyConnectRecord as emptyRecord, partLinesOf, scoreConnect as score, stepsOf, totalPoints } from './listen-connect';

describe('Listen and connect, Day 2 (both versions)', () => {
	const sets = [DAY_TWO_CONNECT.intermediate, DAY_TWO_CONNECT.professional];
	const words = (text: string) => text.trim().split(/\s+/).length;
	it('one conversation for both, in parts that cover it, with voices that are not Mira and not each other', () => {
		for (const set of sets) {
			expect(set.parts.flatMap((_, p) => partLinesOf(set, p))).toEqual(set.conversation);
			const voices = Object.values(set.speakers).map(s => s.voice);
			expect(new Set(voices).size).toBe(voices.length);
			expect(voices).not.toContain(COACH_VOICE);
			for (const line of set.conversation) expect(set.speakers[line.who], line.text).toBeDefined();
			const text = set.conversation.map(line => line.text.toLowerCase()).join(' ');
			for (const phrase of set.linkPhrases) expect(text).toContain(phrase);
			const total = set.conversation.reduce((sum, line) => sum + words(line.text), 0);
			expect(total).toBeGreaterThanOrEqual(110); expect(total).toBeLessThanOrEqual(160);
		}
		expect(DAY_TWO_CONNECT.intermediate.conversation).toBe(DAY_TWO_CONNECT.professional.conversation);
	});
	it('every question follows the part that proves it; every part has one; answers are fair', () => {
		for (const set of sets) {
			expect(totalPoints(set)).toBe(6);
			expect(set.questions).toHaveLength(6);
			for (const q of set.questions) {
				const evidence = q.kind === 'connect' ? set.connect.evidence[q.index] : set.choices[q.index].evidence;
				expect(evidence).toBeGreaterThanOrEqual(set.parts[q.part].from);
				expect(evidence).toBeLessThanOrEqual(set.parts[q.part].to);
			}
			for (let p = 0; p < set.parts.length; p++) expect(set.questions.some(q => q.part === p)).toBe(true);
			expect(new Set(set.connect.answers).size).toBe(set.connect.causes.length);
			expect(set.connect.results.length).toBe(set.connect.causes.length + 1);
			for (const option of [...set.connect.results, ...set.choices.flatMap(q => q.options)]) expect(words(option), option).toBeLessThanOrEqual(8);
			for (const q of set.choices) { expect(q.answer).toBeLessThan(q.options.length); expect(q.kind.fa).toMatch(/[؀-ۿ]/); }
			expect(set.miraLine.fa).toMatch(/[؀-ۿ]/);
			for (const part of set.parts) expect(part.title.fa).toMatch(/[؀-ۿ]/);
			const steps = stepsOf(set).map(s => s.kind);
			expect(steps.at(-1)).toBe('end'); expect(steps.filter(k => k === 'listen')).toHaveLength(3);
		}
	});
	it('keeps and scores a record against its own set', () => {
		for (const set of sets) {
			const all = { ...emptyRecord(set), connect: [...set.connect.answers], choices: set.choices.map(q => q.answer) };
			expect(score(all, set)).toEqual({ correct: 6, total: 6 });
			expect(asRecord(emptyRecord(set), set)).not.toBeNull();
		}
		expect(connectSetFor('day-1')).toBe(DAY_ONE_SET);
		expect(connectSetFor('day-2', 'professional')).toBe(DAY_TWO_CONNECT.professional);
	});
});
