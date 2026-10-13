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
