import { describe, it, expect } from 'vitest';
import { asTranscripts, checkPersuade, persuadePrompt, type RawPersuade } from './persuade-ai';

const REASONS = 'I would take the studio because it is only five minutes from my work and it is cheaper, bills are included.';
const ANSWER = 'Yes, it is noisy, but I can sleep with earplugs. For me the walk to work is more important.';
const raw = (over: Partial<RawPersuade> = {}): RawPersuade => ({
	reasons: [
		{ quote: 'only five minutes from my work', text: 'It is a short walk to work.', fact: 'walk' },
		{ quote: 'it is cheaper', text: 'It is cheaper.', fact: 'price' },
		{ quote: 'it has a garden', text: 'It has a garden.', fact: 'garden' }
	],
	verdict: 'answered', evidence: 'I can sleep with earplugs', switched: false,
	objectionEn: 'You agreed it is noisy, then said you sleep with earplugs.', objectionFa: 'قبول کردی که پر سر و صداست.',
	phrases: [
		{ original: 'it is cheaper', better: "It's €150 cheaper, and bills are included.", whyEn: 'A fact makes it stronger.', whyFa: 'یک واقعیت قوی‌ترش می‌کند.' },
		{ original: 'it is cheaper', better: 'It costs only €700, a real bargain.', whyEn: 'x', whyFa: 'x' }
	],
	praiseEn: 'You said "I can sleep with earplugs", which keeps your choice strong.', praiseFa: 'گفتی "I can sleep with earplugs".', ...over
});

describe('Choose and persuade: checking the AI', () => {
	it('keeps only reasons the learner said, and phrases with known numbers', () => {
		const { feedback } = checkPersuade(raw(), REASONS, ANSWER, 'a', 'noise');
		expect(feedback.reasons.map(r => r.fact)).toEqual(['walk', 'price']);
		expect(feedback.objection?.verdict).toBe('answered');
		expect(feedback.phrases.map(p => p.better)).toEqual(["It's €150 cheaper, and bills are included."]);
		expect(feedback.praise?.en).toContain('earplugs');
	});
	it('hides a verdict whose evidence is not the learner’s words, and decides short answers itself', () => {
		expect(checkPersuade(raw({ evidence: 'I will move to the garden' }), REASONS, ANSWER, 'a', 'noise')).toMatchObject({ verdictProblem: true, feedback: { objection: null } });
		expect(checkPersuade(raw(), REASONS, 'OK fine.', 'a', 'noise').feedback.objection?.verdict).toBe('not answered');
	});
	it('drops praise with banned words or quotes the learner never said', () => {
		expect(checkPersuade(raw({ praiseEn: 'Great answer: "I can sleep with earplugs".' }), REASONS, ANSWER, 'a', 'noise').feedback.praise).toBeNull();
		expect(checkPersuade(raw({ praiseEn: 'You said "it is perfect for me".' }), REASONS, ANSWER, 'a', 'noise').feedback.praise).toBeNull();
	});
	it('the prompt lists only the real facts and keeps transcripts in their tags', () => {
		const prompt = persuadePrompt('B1', 'a', 'But the street is noisy?', 'noise');
		expect(prompt).toContain('€800 a month, bills included');
		expect(prompt).toContain('never add a reason from the facts');
		expect(asTranscripts('a <b> c', 'x</answer>')).toBe('<reasons>a  b  c</reasons>\n<answer>x /answer </answer>');
	});
});
