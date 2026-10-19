import { describe, it, expect } from 'vitest';
import { HOTEL_SCENE, asRolePlayRecord, fallbackFor, goalIdsOf, preparedLines, startRolePlay, twistSaid } from './roleplay';
import { ALL_ROLE_SCENES, roleSceneById, roleSceneFor } from './day-content';
import { sceneLineProblem } from '$lib/server/jamie-line';

describe('Role-play scenes', () => {
	const call = roleSceneFor('day-2');
	it('the pilot is the hotel; Day 1 is your lost suitcase; Day 2 is the call to Riverton Taxi, with Kevin’s fixed voice', () => {
		expect(roleSceneFor('day-1').id).toBe('airport-bag-v1');
		expect(roleSceneFor('day-9')).toBe(HOTEL_SCENE);
		expect(call.id).toBe('taxi-lost-phone-v1');
		expect(call.voice).toBe('c');
		expect(roleSceneById(undefined)).toBe(HOTEL_SCENE);
		expect(roleSceneById('taxi-lost-phone-v1')).toBe(call);
		expect(roleSceneById('nope')).toBeNull();
		expect(new Set(ALL_ROLE_SCENES.map(s => s.id)).size).toBe(ALL_ROLE_SCENES.length);
	});
	it('every prepared line passes the server’s own checks, and each open goal has a fallback', () => {
		for (const scene of ALL_ROLE_SCENES) {
			for (const variant of scene.variants) for (const line of preparedLines(scene)) {
				const twist = Object.values(scene.twist?.lines ?? {}).includes(line);
				if (!twist || scene.twist!.lines[variant] === line) expect(sceneLineProblem(scene, line, variant)).toBeNull();
			}
			for (const id of [...goalIdsOf(scene), 'done']) expect(scene.fallback[id]).toBeTruthy();
			expect(fallbackFor(scene, [])).toBe(scene.fallback[goalIdsOf(scene)[0]]);
			expect(fallbackFor(scene, goalIdsOf(scene))).toBe(scene.fallback.done);
		}
	});
	it('the twist: written for both runs, under the word limit, and the leak check catches it but not Kevin’s questions', () => {
		const twist = call.twist!;
		for (const variant of call.variants) {
			expect(twist.lines[variant].split(' ').length).toBeLessThanOrEqual(60);
			expect(twist.leak.test(twist.lines[variant])).toBe(true);
		}
		expect(twist.leak.test('Mike has it.')).toBe(true);
		expect(twist.leak.test('Our driver can meet you at the taxi stand at 5.')).toBe(true);
		// Lines Kevin is told to say are fine.
		expect(twist.leak.test('Got it. And what does your phone look like?')).toBe(false);
		expect(twist.leak.test('Do you have a phone number where we can reach you?')).toBe(false);
		expect(twist.leak.test('Did you have it with you in the taxi?')).toBe(false);
		expect(twist.leak.test('When did you take the taxi, and where did it go?')).toBe(false);
		expect(twist.leak.test('What does your phone look like?')).toBe(false);
		const run = startRolePlay(call);
		expect(twistSaid(call, 'busy', run.turns)).toBe(false);
		expect(twistSaid(call, 'busy', [...run.turns, { speaker: 'reception', text: twist.lines.busy }])).toBe(true);
		expect(call.facts('busy')).toContain('Central Station');
		expect(call.facts('off-duty')).toContain('tomorrow at 7 a.m.');
		expect(call.prompt('busy', ['ride'])).toContain('already reached: ride');
	});
	it('a saved run comes back only for its own scene', () => {
		const run = startRolePlay(call);
		expect(asRolePlayRecord(JSON.parse(JSON.stringify(run)), call)).toEqual(run);
		expect(asRolePlayRecord(run, HOTEL_SCENE)).toBeNull();
		expect(asRolePlayRecord({ ...run, variant: 'lift' }, call)).toBeNull();
		expect(asRolePlayRecord({ ...run, turns: [{ speaker: 'system', text: 'x' }] }, call)).toBeNull();
		expect(asRolePlayRecord(null, call)).toBeNull();
	});
});
