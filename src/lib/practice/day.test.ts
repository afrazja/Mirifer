import { describe, it, expect } from 'vitest';
import { completeLater, moduleBefore, LENGTHS, agendaFor, agendaMinutes, completeSession, currentModule, finishModule, modulesFor, recommend, sessionProgress, startSession, DaySessionSchema, DAYS, DAY_ONE, DAY_TWO, dayById, nextDay } from './day';

describe('English day shell', () => {
	it('fills each session length exactly', () => { for (const length of LENGTHS) expect(agendaMinutes(length)).toBe(length); });
	it('puts check-in first and recap last', () => {
		const ids = agendaFor(15).map(item => item.id);
		expect(ids[0]).toBe('check-in'); expect(ids.at(-1)).toBe('recap');
	});
	it('moves through modules, then recap, then done', () => {
		let s = startSession(15, new Date('2026-01-01T10:00:00Z'));
		for (const m of modulesFor(15)) { expect(currentModule(s)?.id).toBe(m.id); s = finishModule(s, m.id as never, 'done'); }
		expect(s.stage).toBe('recap'); expect(currentModule(s)).toBeNull();
		expect(sessionProgress(s)).toBeLessThan(1);
		s = completeSession(s); expect(s.stage).toBe('done'); expect(sessionProgress(s)).toBe(1);
	});
	it('ignores repeated or out-of-stage finishes', () => {
		const s = finishModule(startSession(15), 'listen-act', 'done');
		expect(finishModule(s, 'listen-act', 'skipped')).toBe(s);
	});
	it('recommends a skipped module first', () => {
		let s = startSession(15);
		s = finishModule(s, 'listen-act', 'skipped');
		expect(recommend(s).title.en).toContain('Listen and connect');
		expect(recommend(startSession(15)).title.en).toContain('new theme');
	});
	it('validates saved checkpoints strictly', () => {
		expect(DaySessionSchema.safeParse(startSession(20)).success).toBe(true);
		expect(DaySessionSchema.safeParse({ ...startSession(20), answer: 'text' }).success).toBe(false);
		expect(DaySessionSchema.safeParse({ ...startSession(20), done: ['nope'] }).success).toBe(false);
		expect(DaySessionSchema.safeParse({ ...startSession(20), length: 35 }).success).toBe(false);
	});
	it('finds the module before another, or before the recap', () => {
		expect(moduleBefore(15, 'listen-act')).toBeNull();
		expect(moduleBefore(15, 'phrases')?.id).toBe('listen-act');
		expect(moduleBefore(15, 'say-it-better')?.id).toBe('phrases');
		expect(moduleBefore(15, null)?.id).toBe('say-it-better');
		expect(moduleBefore(20, 'phrases')?.id).toBe('scenario');
		expect(moduleBefore(20, 'say-it-better')?.id).toBe('phrases');
		expect(moduleBefore(20, null)?.id).toBe('say-it-better');
	});
	it('lets a skipped module be done later, keeping the score', () => {
		let s = finishModule(startSession(15), 'listen-act', 'skipped');
		s = completeLater(s, 'listen-act', { correct: 7, total: 10 });
		expect(s.skipped).toEqual([]); expect(s.done).toEqual(['listen-act']); expect(s.scores?.['listen-act']).toEqual({ correct: 7, total: 10 });
		expect(DaySessionSchema.safeParse(s).success).toBe(true);
		expect(completeLater(s, 'listen-act')).toBe(s); // not skipped any more
		expect(recommend(s).title.en).not.toContain('Listen and act');
	});
});

describe('more than one day', () => {
	it('every day fills each session length exactly, check-in first and recap last', () => {
		for (const day of DAYS) for (const length of LENGTHS) {
			expect(agendaMinutes(length, day), `${day.id} ${length}`).toBe(length);
			const ids = agendaFor(length, day).map(item => item.id);
			expect(ids[0]).toBe('check-in'); expect(ids.at(-1)).toBe('recap');
		}
		expect(new Set(DAYS.map(d => d.id)).size).toBe(DAYS.length);
		expect(DAYS.map(d => d.number)).toEqual(DAYS.map((_, i) => i + 1));
	});
	it('a day-2 session runs on day 2’s modules and validates', () => {
		let s = startSession(15, new Date('2026-01-02T10:00:00Z'), DAY_TWO);
		expect(s.day).toBe('day-2');
		expect(DaySessionSchema.safeParse(s).success).toBe(true);
		const ids = modulesFor(15, DAY_TWO).map(m => m.id);
		expect(ids).toEqual(['listen-act', 'phrases', 'say-in-english']);
		for (const id of ids) { expect(currentModule(s)?.id).toBe(id); s = finishModule(s, id, 'done'); }
		expect(s.stage).toBe('recap');
		expect(modulesFor(20, DAY_TWO).map(m => m.id)).toEqual(['listen-act', 'phrases', 'say-in-english', 'scenario']);
		expect(moduleBefore(20, null, DAY_TWO)?.id).toBe('scenario');
		expect(DaySessionSchema.safeParse({ ...s, day: 'day-9' }).success).toBe(false);
	});
	it('the next day follows the last finished one; a day that isn’t ready is only for the owner', () => {
		expect(nextDay(null).id).toBe('day-1');
		expect(nextDay('day-1', true).id).toBe('day-2');
		// Not ready: learners stay on the last ready day.
		expect(DAY_TWO.ready).toBe(false);
		expect(nextDay('day-1').id).toBe('day-1');
		// After the last day: the last one again.
		expect(nextDay('day-2', true).id).toBe('day-2');
		expect(nextDay('unknown').id).toBe('day-1');
		expect(dayById('day-2')).toBe(DAY_TWO);
		expect(dayById('nope')).toBeNull();
	});
	it('names the next day in the recap suggestion', () => {
		expect(recommend(startSession(15), DAY_TWO).title.en).toBe('Next time: Day 2, Taking a taxi');
		expect(recommend(startSession(15), DAY_ONE).title.en).toContain('new theme');
	});
});
