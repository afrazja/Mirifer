import { describe, it, expect } from 'vitest';
import { DAY_THREE, allModules, dayById, modulesFor } from './day';
import {
	ALL_RETELL_PIECES, ALL_ROLE_SCENES, connectSetFor, persuadeSetById, persuadeSetFor, phrasesFor, retellPieceById, retellPieceFor,
	roleSceneById, roleSceneFor, sayItemById, sayItemsFor, trapsFor, voiceMessageById, voiceMessagesFor
} from './day-content';
import * as dayThree from './days/day-3';
import { labModule, LAB_SETS } from './lab-sets';

describe('Day 3: checking in at the hotel', () => {
	it('both versions have their five parts, all built; only the owner gets it until it is ready', () => {
		expect(dayById('day-3')).toBe(DAY_THREE);
		expect(DAY_THREE.ready).toBe(false);
		expect(modulesFor(20, DAY_THREE, 'intermediate').map(m => m.id)).toEqual(['listen-act', 'phrases', 'traps', 'say-in-english', 'voice-messages']);
		expect(modulesFor(20, DAY_THREE, 'professional').map(m => m.id)).toEqual(['listen-retell', 'phrases', 'say-in-english', 'choose-persuade', 'scenario']);
		expect(modulesFor(15, DAY_THREE, 'intermediate').map(m => m.id)).toEqual(['listen-act', 'phrases', 'say-in-english', 'voice-messages']);
		expect(modulesFor(15, DAY_THREE, 'professional').map(m => m.id)).toEqual(['listen-retell', 'phrases', 'choose-persuade', 'scenario']);
		expect(allModules(DAY_THREE).every(m => m.built)).toBe(true);
	});
	it('every module reads Day 3’s own content', () => {
		expect(phrasesFor('day-3', 'intermediate')[0].sentence).toContain('Demir');
		expect(phrasesFor('day-3', 'professional')).toBe(dayThree.PHRASES.professional);
		expect(connectSetFor('day-3')).toBe(dayThree.CONNECT.intermediate);
		// Professional has no Listen and connect on Day 3: the lab shows the intermediate set.
		expect(connectSetFor('day-3', 'professional')).toBe(dayThree.CONNECT.intermediate);
		expect(trapsFor('day-3').map(t => t.id)).toEqual(dayThree.TRAPS.filter(t => dayThree.LESSON_TRAP_IDS.includes(t.id)).map(t => t.id));
		expect(trapsFor('day-3')).toHaveLength(5);
		expect(trapsFor('day-3', true)).toHaveLength(6);
		expect(sayItemsFor('day-3', 'intermediate')).toHaveLength(4);
		expect(sayItemsFor('day-3', 'professional')).toHaveLength(3);
		expect(voiceMessagesFor('day-3').map(m => m.id)).toEqual(['d3-tom', 'd3-baggage']);
		expect(retellPieceFor('day-3')?.id).toBe('wrong-park-hotel');
		expect(persuadeSetFor('day-3').id).toBe('d3-hotel');
		expect(roleSceneFor('day-3').id).toBe('hotel-checkin-v1');
	});
	it('the server finds Day 3’s items by id, and ids stay unique across days', () => {
		for (const item of [...dayThree.SAY.intermediate, ...dayThree.SAY.professional]) expect(sayItemById(item.id)).toBe(item);
		for (const message of dayThree.MESSAGES) expect(voiceMessageById(message.id)).toBe(message);
		expect(retellPieceById('wrong-park-hotel')).toBe(dayThree.RETELL);
		expect(persuadeSetById('d3-hotel')).toBe(dayThree.PERSUADE);
		expect(roleSceneById('hotel-checkin-v1')).toBe(dayThree.CALL);
		expect(new Set(ALL_RETELL_PIECES.map(p => p.id)).size).toBe(ALL_RETELL_PIECES.length);
		expect(new Set(ALL_ROLE_SCENES.map(s => s.id)).size).toBe(ALL_ROLE_SCENES.length);
	});
	it('the check-in is face to face, with a fixed voice and its own button', () => {
		const scene = dayThree.CALL;
		expect(scene.voice).toBe('c');
		expect(scene.screen.start?.en).toBe('Start the conversation');
		expect(scene.twist?.after.length).toBeGreaterThan(0);
		expect(scene.goals.map(g => g.id)).toContain('breakfast');
	});
	it('the Module lab has both Day 3 versions', () => {
		const ids = LAB_SETS.map(set => set.id);
		expect(ids).toContain('day-3-intermediate');
		expect(ids).toContain('day-3-professional');
		expect(labModule(LAB_SETS.find(s => s.id === 'day-3-professional')!, 'scenario')?.title.en).toBe('A check-in with a twist');
	});
});
