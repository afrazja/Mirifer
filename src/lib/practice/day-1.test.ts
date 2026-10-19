import { describe, it, expect } from 'vitest';
import { DAY_ONE, agendaMinutes, allModules, modulesFor } from './day';
import { connectSetFor, phrasesFor, roleSceneById, roleSceneFor, sayItemById, sayItemsFor, trapsFor, voiceMessageById, voiceMessagesFor } from './day-content';
import { DAY_ONE_SET } from './listen-connect';
import { PHRASES as B1_PHRASES } from './phrases';
import * as dayOne from './days/day-1';
import { LAB_SETS, labModule } from './lab-sets';

describe('Day 1, rebuilt in two versions', () => {
	it('stays live, opens with Sara at the baggage desk in both versions, and is the lightest day', () => {
		expect(DAY_ONE.ready).toBe(true);
		expect(modulesFor(15, DAY_ONE, 'intermediate').map(m => m.id)).toEqual(['listen-act', 'phrases', 'traps', 'say-in-english', 'voice-messages']);
		expect(modulesFor(15, DAY_ONE, 'professional').map(m => m.id)).toEqual(['listen-act', 'phrases', 'say-it-better', 'say-in-english', 'scenario']);
		expect(allModules(DAY_ONE).every(m => m.built)).toBe(true);
		expect(agendaMinutes(15, DAY_ONE, 'intermediate')).toBeLessThan(agendaMinutes(15, DAY_ONE, 'professional'));
		expect(DAY_ONE.goal.en).toContain('describe your bag');
	});
	it('both versions hear the same conversation; Professional keeps the built B1 questions and phrases', () => {
		expect(connectSetFor('day-1', 'professional')).toBe(DAY_ONE_SET);
		expect(connectSetFor('day-1', 'intermediate').conversation).toBe(DAY_ONE_SET.conversation);
		expect(DAY_ONE_SET.conversation.some(line => line.text.includes('between eight and ten'))).toBe(true);
		expect(phrasesFor('day-1', 'professional')).toBe(B1_PHRASES);
		expect(phrasesFor('day-1', 'intermediate')).toBe(dayOne.PHRASES.intermediate);
	});
	it('Intermediate is the learner’s own bag after the conversation; the lesson has 3 traps, 3 items and 2 messages', () => {
		expect(trapsFor('day-1')).toHaveLength(3);
		expect(sayItemsFor('day-1', 'intermediate')).toHaveLength(3);
		expect(sayItemsFor('day-1', 'professional')).toHaveLength(3);
		expect(voiceMessagesFor('day-1').map(m => m.id)).toEqual(['d1-desk', 'd1-ben']);
		for (const item of [...dayOne.SAY.intermediate, ...dayOne.SAY.professional]) expect(sayItemById(item.id)).toBe(item);
		for (const message of dayOne.MESSAGES) expect(voiceMessageById(message.id)).toBe(message);
	});
	it('the role-play is your own suitcase, with three goals and the twist after the description', () => {
		const scene = roleSceneFor('day-1');
		expect(scene.id).toBe('airport-bag-v1');
		expect(roleSceneById('airport-bag-v1')).toBe(scene);
		expect(scene.goals.map(g => g.id)).toEqual(['bag', 'details', 'plan']);
		expect(scene.twist?.after).toEqual(['bag']);
		expect(scene.screen.start?.en).toBe('Start the conversation');
	});
	it('the Module lab has both Day 1 versions', () => {
		expect(LAB_SETS.map(s => s.id)).toEqual(expect.arrayContaining(['day-1', 'day-1-professional']));
		expect(labModule(LAB_SETS.find(s => s.id === 'day-1-professional')!, 'scenario')?.title.en).toBe('A lost bag with a twist');
		expect(labModule(LAB_SETS[0], 'say-it-better')?.title.en).toBe('Tell your story');
	});
});
