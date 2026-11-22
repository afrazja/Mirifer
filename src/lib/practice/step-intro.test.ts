import { describe, it, expect } from 'vitest';
import { INTRO_ICONS, MODULE_ICON, NOTE_MAX_WORDS, STEP_FLOW, wordCount } from './step-intro';
import { DAYS, MODULE_IDS, dayById } from './day';
import { chapterModules } from './path';

describe('step intro (short, visual instructions)', () => {
	it('gives every kind of step an icon and a three-part flow, in English and Persian', () => {
		for (const id of MODULE_IDS) {
			expect(INTRO_ICONS).toContain(MODULE_ICON[id]);
			expect(STEP_FLOW[id]).toHaveLength(3);
			for (const part of STEP_FLOW[id]) {
				expect(INTRO_ICONS).toContain(part.icon);
				expect(part.label.en.split(' ').length, `${id}: ${part.label.en}`).toBeLessThanOrEqual(3);
				expect(part.label.fa.trim()).not.toBe('');
			}
		}
	});
	it('never ends a flow with a filler "Done"', () => {
		for (const id of MODULE_IDS) expect(STEP_FLOW[id][2].label.en).not.toBe('Done');
	});
	it('counts words as a learner reads them', () => {
		expect(wordCount('Listen to Elena, another candidate. Find the three parts of her answer.')).toBe(12);
		expect(wordCount('Check in — then you’re done.')).toBe(5);
	});
	it('keeps cues short and drawable on every module that has them', () => {
		for (const day of DAYS) for (const track of ['intermediate', 'professional'] as const) for (const mod of chapterModules(day, track)) {
			for (const cue of mod.cues ?? []) {
				expect(INTRO_ICONS).toContain(cue.icon);
				expect(cue.label.en.split(' ').length).toBeLessThanOrEqual(3);
			}
			// The rule binds every note once it is rewritten; a module with cues has been.
			if (mod.cues) expect(wordCount(mod.intro.en), `${day.id} ${mod.id}`).toBeLessThanOrEqual(NOTE_MAX_WORDS);
		}
	});
	it('shows Interview 1’s first step as a short line and three cues', () => {
		const day = dayById('interview-1')!;
		const first = chapterModules(day, 'intermediate')[0];
		expect(first.cues?.map(cue => cue.label.en)).toEqual(['Now', 'Before', 'Goal']);
		expect(wordCount(first.intro.en)).toBeLessThanOrEqual(NOTE_MAX_WORDS);
		expect(day.checkIn?.storyLine?.en).toBe('Crestview Group · Your first interview');
	});
});
