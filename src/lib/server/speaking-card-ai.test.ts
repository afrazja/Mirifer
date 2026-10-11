import { describe, it, expect } from 'vitest';
import { RawCoverageSchema, asTalks, checkCoverage, checkOrganisation, coveragePrompt } from './speaking-card-ai';
import { CARDS, ORG_PHRASES, cardShare, chooseJob, choosePhrase, lengthChange } from '$lib/practice/speaking-card';
import { normalise } from '$lib/practice/say-better';

const card = CARDS[1]; // a place in your city
const TALK = 'I want to talk about Laleh Park. It is in the north of Tehran, near my office. It has big trees and a small lake. I go there on Fridays and walk with my sister. I like it because it is quiet and green.';
const point = (covered: boolean, quote = '', unclear = '') => ({ covered, quote, unclear });
const raw = (points = [point(true, 'It is in the north of Tehran'), point(true, 'It has big trees and a small lake'), point(true, 'I go there on Fridays and walk with my sister'), point(true, 'I like it because it is quiet and green')]) =>
	RawCoverageSchema.parse({ talks: [{ points, onTopic: true, mostlyEnglish: true }] });

describe('Speaking card: coverage', () => {
	it('counts a point only when its quote is in the talk', () => {
		const r = checkCoverage(raw(), card, [TALK])!;
		expect(r.problems).toBe(0);
		expect(r.coverage[0].points.every(p => p.covered)).toBe(true);
		const bad = checkCoverage(raw([point(true, 'It is next to the river'), point(false), point(false), point(false)]), card, [TALK])!;
		expect(bad.problems).toBe(1);
		expect(bad.coverage[0].points[0].covered).toBe(false);
	});
	it('reading the card aloud is not covering a point', () => {
		const said = 'I will say what it looks like and what you do there. Laleh Park is nice.';
		expect(cardShare('say what it looks like', card.points[1].en)).toBeGreaterThanOrEqual(0.7);
		const r = checkCoverage(raw([point(false), point(true, 'say what it looks like'), point(false), point(false)]), card, [said])!;
		expect(r.coverage[0].points[1].covered).toBe(false);
	});
	it('one quote cannot cover three points', () => {
		const q = 'It is in the north of Tehran';
		const r = checkCoverage(raw([point(true, q), point(true, q), point(true, q), point(false)]), card, [TALK])!;
		expect(r.coverage[0].points.map(p => p.covered)).toEqual([true, true, false, false]);
	});
	it('keeps an unclear note only if those words were said; judges both talks with one prompt', () => {
		const r = checkCoverage(raw([point(true, 'It is in the north of Tehran', 'near my office'), point(false, '', 'blue horse gate'), point(false), point(false)]), card, [TALK])!;
		expect(r.coverage[0].points[0].unclear).toBe('near my office');
		expect(r.coverage[0].points[1].unclear).toBe('');
		expect(checkCoverage(raw(), card, [TALK, TALK])).toBeNull();
		expect(coveragePrompt(card, [false, true])).toContain('Talk 2 was stopped at the time limit');
		expect(asTalks([{ text: 'a <b>' }, { text: 'c' }])).toBe('<talk n="1">a b</talk>\n<talk n="2">c</talk>');
	});
});

describe('Speaking card: the phrase and the organisation line', () => {
	it('a missing explain point always gets an explain phrase; a phrase already used is never suggested', () => {
		expect(chooseJob([true, true, true, false], 'move')).toBe('explain');
		expect(chooseJob([true, true, true, true], 'move')).toBe('move');
		expect(choosePhrase('move', 'First of all, it is big.', card).id).toBe('after-that');
		expect(choosePhrase('explain', 'nothing', card).id).toBe('like-most');
		expect(choosePhrase('explain', 'nothing', CARDS[4]).id).toBe('like-most');
		expect(choosePhrase('explain', 'What I like most is the lake', card).id).toBe('important-because');
	});
	it('every phrase finds itself in a sentence that uses it', () => {
		for (const p of ORG_PHRASES) expect(p.found(normalise(`${p.text.replace('…', ' the lake')}`)), p.id).toBe(true);
	});
	it('the organisation line: real quotes only, no jargon, English', () => {
		const line = (organisationEn: string) => checkOrganisation({ organisationEn, organisationFa: 'ترتیب خوبی داشت.', job: 'move', whyEn: '', whyFa: '' }, TALK);
		expect(line('You went from where it is to why you like it. That’s easy to follow.')).toMatchObject({ en: expect.stringContaining('easy to follow') });
		expect(line('You said "it has a big pool" first.')).toMatchObject({ problem: expect.any(String) });
		expect(line('Your structure and coherence were good.')).toMatchObject({ problem: expect.any(String) });
	});
	it('a shorter second talk over a minute is never a drop', () => {
		expect(lengthChange(48, 85)).toEqual({ text: '0:48 → 1:25', ok: true, over: true });
		expect(lengthChange(110, 100)).toEqual({ text: '1:50 → 1:40', ok: true, over: true });
		expect(lengthChange(25, 40)).toEqual({ text: '0:25 → 0:40', ok: true, over: false });
		expect(lengthChange(70, 40).ok).toBe(false);
	});
});
