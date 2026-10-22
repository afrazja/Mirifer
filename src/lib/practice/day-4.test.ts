import { describe, it, expect } from 'vitest';
import { DAY_FOUR, allModules, dayById, modulesFor } from './day';
import {
	ALL_RETELL_PIECES, ALL_ROLE_SCENES, connectSetFor, persuadeSetById, persuadeSetFor, phrasesFor, retellPieceById, retellPieceFor,
	roleSceneById, roleSceneFor, sayItemById, sayItemsFor, trapsFor, voiceMessageById, voiceMessagesFor
} from './day-content';
import * as dayOne from './days/day-1';
import * as dayThree from './days/day-3';
import * as dayFour from './days/day-4';
import { labModule, LAB_SETS } from './lab-sets';

describe('Day 4: asking the way', () => {
	it('both versions have their five parts, all built; only the owner gets it until the phone test', () => {
		expect(dayById('day-4')).toBe(DAY_FOUR);
		expect(DAY_FOUR.ready).toBe(false);
		expect(modulesFor(20, DAY_FOUR, 'intermediate').map(m => m.id)).toEqual(['listen-act', 'phrases', 'traps', 'say-in-english', 'voice-messages']);
		expect(modulesFor(20, DAY_FOUR, 'professional').map(m => m.id)).toEqual(['listen-retell', 'phrases', 'say-in-english', 'choose-persuade', 'scenario']);
		// The 15-minute lesson keeps the step with the item from an earlier day (owner's decision).
		expect(modulesFor(15, DAY_FOUR, 'intermediate').map(m => m.id)).toEqual(['listen-act', 'phrases', 'traps', 'voice-messages']);
		expect(modulesFor(15, DAY_FOUR, 'professional').map(m => m.id)).toEqual(['listen-retell', 'phrases', 'say-in-english', 'scenario']);
		expect(allModules(DAY_FOUR).every(m => m.built)).toBe(true);
	});
	it('every module reads Day 4’s own content', () => {
		expect(phrasesFor('day-4', 'professional')).toBe(dayFour.PHRASES.professional);
		expect(connectSetFor('day-4')).toBe(dayFour.CONNECT.intermediate);
		expect(trapsFor('day-4').map(t => t.id)).toEqual(['call-me', 'turn-left', 'across-from', 'minutes-away', 'cross-street']);
		expect(trapsFor('day-4', true)).toHaveLength(6);
		expect(sayItemsFor('day-4', 'intermediate')).toHaveLength(4);
		expect(sayItemsFor('day-4', 'professional').map(s => s.id)[0]).toBe('d3-late-checkout');
		expect(sayItemsFor('day-4', 'professional')).toHaveLength(3);
		expect(voiceMessagesFor('day-4').map(m => m.id)).toEqual(['d4-daniel', 'd4-tom']);
		expect(retellPieceFor('day-4')?.id).toBe('the-way-around');
		expect(persuadeSetFor('day-4').id).toBe('d4-museum');
		expect(roleSceneFor('day-4').id).toBe('ask-the-way-v1');
	});
	it('the items from earlier days come back first, unchanged (the same objects)', () => {
		expect(trapsFor('day-4')[0]).toBe(dayOne.TRAPS?.find(t => t.id === 'call-me') ?? trapsFor('day-1').find(t => t.id === 'call-me'));
		expect(sayItemsFor('day-4', 'professional')[0]).toBe(dayThree.SAY.professional.find(s => s.id === 'd3-late-checkout'));
	});
	it('the retell asks to tell a friend the way, on the speaking screen too', () => {
		expect(dayFour.RETELL.task?.en).toBe('Now tell a friend the way, from the corner of Main and Oak.');
		expect(dayFour.RETELL.task?.fa.length).toBeGreaterThan(0);
	});
	it('the server finds Day 4’s items by id, and ids stay unique across days', () => {
		for (const item of [...dayFour.SAY.intermediate, ...dayFour.SAY.professional]) expect(sayItemById(item.id)).toBe(item);
		for (const message of dayFour.MESSAGES) expect(voiceMessageById(message.id)).toBe(message);
		expect(retellPieceById('the-way-around')).toBe(dayFour.RETELL);
		expect(persuadeSetById('d4-museum')).toBe(dayFour.PERSUADE);
		expect(roleSceneById('ask-the-way-v1')).toBe(dayFour.CALL);
		expect(new Set(ALL_RETELL_PIECES.map(p => p.id)).size).toBe(ALL_RETELL_PIECES.length);
		expect(new Set(ALL_ROLE_SCENES.map(s => s.id)).size).toBe(ALL_ROLE_SCENES.length);
	});
	it('the role-play: Paul, a fixed voice; the real surprise first, the way around as the replay', () => {
		const scene = dayFour.CALL;
		expect(scene.voice).toBe('c');
		expect(scene.variants).toEqual(['new-here', 'around']);
		expect(scene.goals.map(g => g.id)).toEqual(expect.arrayContaining(['ask', 'check', 'time', 'landmark']));
	});
	it('the Module lab has both Day 4 versions', () => {
		const ids = LAB_SETS.map(set => set.id);
		expect(ids).toContain('day-4-intermediate');
		expect(ids).toContain('day-4-professional');
		expect(labModule(LAB_SETS.find(s => s.id === 'day-4-professional')!, 'scenario')?.title.en).toBe('Asking the way with a twist');
	});
});
