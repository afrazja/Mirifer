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
