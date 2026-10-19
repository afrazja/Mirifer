import { describe, it, expect } from 'vitest';
import { FLATS, OBJECTIONS, ROWS, asPersuadeRecord, emptyPersuadeRecord, normaliseSaid, pickObjection, tooLittle } from './persuade';

describe('Choose and persuade: content and objection picking', () => {
	it('both apartments have one fact per row, and every objection ends in a question', () => {
		for (const flat of Object.values(FLATS)) expect(flat.facts).toHaveLength(ROWS.length);
		for (const o of [...OBJECTIONS.a, ...OBJECTIONS.b]) { expect(o.line.trim().endsWith('?')).toBe(true); expect(o.again.trim().endsWith('?')).toBe(true); }
	});
	it('turns number words into digits', () => {
		expect(normaliseSaid('It is forty-five minutes on the seventh floor.')).toContain(' 45 ');
		expect(normaliseSaid('the seventh floor')).toContain(' 7 ');
	});
	it('objects to the first point the learner did not mention', () => {
		expect(pickObjection('a', 'It is cheap and very close to my office, I can walk.').point).toBe('noise');
		expect(pickObjection('a', 'It is quiet enough for me and close to work.').point).toBe('size');
		expect(pickObjection('b', 'It has a big garden and two bedrooms for my family, and the bus is fine.').point).toBe('price');
		expect(pickObjection('b', 'I like the garden.').line).toBe(OBJECTIONS.b[0].line);
	});
	it('when every point was covered, uses the second form of the least-mentioned one', () => {
		const all = 'The street is noisy but I have earplugs, the space is small, the elevator is missing and the seventh floor is fine, the noise again.';
		const picked = pickObjection('a', all);
		expect(OBJECTIONS.a.map(o => o.again)).toContain(picked.line);
	});
	it('asks for more when the reasons are too short or mostly Persian', () => {
		expect(tooLittle('I like it because it is near.')).toBe(true);
		expect(tooLittle('من این را دوست دارم چون نزدیک است و ارزان است و خیلی خوب است و')).toBe(true);
		expect(tooLittle('The main reason is that it is only a five minute walk to work and it is cheaper than the other one.')).toBe(false);
	});
	it('checks a saved record', () => {
		expect(asPersuadeRecord(emptyPersuadeRecord())).not.toBeNull();
		expect(asPersuadeRecord({ ...emptyPersuadeRecord(), flat: 'c' })).toBeNull();
		expect(asPersuadeRecord(null)).toBeNull();
	});
});

import { APARTMENTS } from './persuade';
import { persuadeSetById, persuadeSetFor } from './day-content';

describe('Choose and persuade: each day brings its own choice', () => {
	const ride = persuadeSetFor('day-2');
	it('Day 1 keeps the apartments; Day 2 is the train or a taxi; the server finds both by id', () => {
		expect(persuadeSetFor('day-1')).toBe(APARTMENTS);
		expect(ride.id).toBe('d2-ride');
		expect(persuadeSetById('d2-ride')).toBe(ride);
		expect(persuadeSetById(undefined)).toBe(APARTMENTS);
		expect(persuadeSetById('nope')).toBeNull();
	});
	it('every set has one fact per row, objections that end in a question, and phrases in both languages', () => {
		for (const set of [APARTMENTS, ride]) {
			for (const option of Object.values(set.options)) expect(option.facts).toHaveLength(set.rows.length);
			for (const o of [...set.objections.a, ...set.objections.b]) { expect(o.line.trim().endsWith('?')).toBe(true); expect(o.again.trim().endsWith('?')).toBe(true); }
			for (const phrase of [...set.reasonPhrases, ...set.answerPhrases]) expect(phrase.fa.length).toBeGreaterThan(0);
			expect(set.factIds.at(-1)).toBe('personal');
			expect(set.ai.better).toHaveLength(4);
		}
	});
	it('Day 2: Mira objects to what the learner left out, and hears number words', () => {
		expect(pickObjection('a', 'The train is only nine dollars and she is paying herself.', ride).point).toBe('wait');
		expect(pickObjection('a', 'A train comes every fifteen minutes, and she can use the elevators with her suitcase.', ride).point).toBe('find');
		expect(pickObjection('b', 'It is door to door, so she will not carry her suitcase.', ride).point).toBe('price');
		expect(pickObjection('b', 'It costs fifty-five dollars but it is door to door.', ride).point).toBe('time');
		expect(normaliseSaid('twenty-five minutes', ride.numbers)).toContain(' 25 ');
	});
});
