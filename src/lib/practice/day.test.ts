import { describe, it, expect } from 'vitest';
import { completeLater, moduleBefore, LENGTHS, agendaFor, agendaMinutes, completeSession, currentModule, finishModule, modulesFor, recommend, sessionProgress, startSession, DaySessionSchema } from './day';

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
		expect(recommend(s).title.en).toContain('Listen and act');
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
		expect(moduleBefore(15, 'say-it-better')?.id).toBe('listen-act');
		expect(moduleBefore(15, null)?.id).toBe('say-it-better');
		expect(moduleBefore(20, 'say-it-better')?.id).toBe('scenario');
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
