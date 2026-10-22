import { describe, it, expect } from 'vitest';
import { completeLater, moduleBefore, LENGTHS, agendaFor, agendaMinutes, completeSession, currentModule, finishModule, modulesFor, recommend, sessionProgress, startSession, DaySessionSchema, DAYS, DAY_ONE, DAY_TWO, dayById, nextDay, TRACKS, trackFor } from './day';

describe('English day shell', () => {
	// Day 1 has two versions: Intermediate is the lightest lesson, Professional a little longer. Every lesson
	// is 15 minutes (owner's decision), which leaves out one middle step; 20 keeps all five.
	it('Day 1 stays the lightest day', () => {
		expect(agendaMinutes(15)).toBe(16); expect(agendaMinutes(15, DAY_ONE, 'professional')).toBe(20);
		expect(agendaMinutes(20)).toBe(18); expect(agendaMinutes(20, DAY_ONE, 'professional')).toBe(23);
		for (const day of DAYS) for (const track of TRACKS) expect(agendaMinutes(15, day, track), `${day.id} ${track}`).toBeLessThanOrEqual(21);
	});
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
		expect(moduleBefore(15, 'say-in-english')?.id).toBe('phrases');
		expect(moduleBefore(20, 'traps')?.id).toBe('phrases');
		expect(moduleBefore(15, null)?.id).toBe('voice-messages');
		expect(moduleBefore(15, 'say-it-better', DAY_ONE, 'professional')?.id).toBe('phrases');
		expect(moduleBefore(20, 'say-in-english', DAY_ONE, 'professional')?.id).toBe('say-it-better');
		expect(moduleBefore(15, 'scenario', DAY_ONE, 'professional')?.id).toBe('say-it-better');
		expect(moduleBefore(20, null, DAY_ONE, 'professional')?.id).toBe('scenario');
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
		for (const day of DAYS.filter(d => !d.tracks)) for (const length of LENGTHS) {
			expect(agendaMinutes(length, day), `${day.id} ${length}`).toBe(length);
			const ids = agendaFor(length, day).map(item => item.id);
			expect(ids[0]).toBe('check-in'); expect(ids.at(-1)).toBe('recap');
		}
		// A day with two versions: five modules at 20 minutes, four at 15 (one middle step left out); check-in first and recap last.
		for (const day of DAYS.filter(d => d.tracks)) for (const track of TRACKS) for (const [length, count] of [[15, 6], [20, 7]] as const) {
			const ids = agendaFor(length, day, track).map(item => item.id);
			expect(ids, `${day.id} ${track} ${length}`).toHaveLength(count);
			expect(ids[0]).toBe('check-in'); expect(ids.at(-1)).toBe('recap');
			expect(new Set(ids).size).toBe(ids.length);
		}
		expect(new Set(DAYS.map(d => d.id)).size).toBe(DAYS.length);
		expect(DAYS.map(d => d.number)).toEqual(DAYS.map((_, i) => i + 1));
	});
	it('a day-2 session runs on its version’s modules and validates', () => {
		for (const track of TRACKS) {
			let s = startSession(15, new Date('2026-01-02T10:00:00Z'), DAY_TWO, track);
			expect(s).toMatchObject({ day: 'day-2', track });
			expect(DaySessionSchema.safeParse(s).success).toBe(true);
			const ids = modulesFor(15, DAY_TWO, track).map(m => m.id);
			for (const id of ids) { expect(currentModule(s)?.id).toBe(id); s = finishModule(s, id, 'done'); }
			expect(s.stage).toBe('recap');
			expect(moduleBefore(15, null, DAY_TWO, track)?.id).toBe(ids.at(-1));
			expect(sessionProgress(completeSession(s))).toBe(1);
		}
		expect(modulesFor(20, DAY_TWO, 'intermediate').map(m => m.id)).toEqual(['listen-act', 'phrases', 'traps', 'say-in-english', 'voice-messages']);
		expect(modulesFor(20, DAY_TWO, 'professional').map(m => m.id)).toEqual(['listen-retell', 'phrases', 'say-in-english', 'choose-persuade', 'scenario']);
		expect(modulesFor(15, DAY_TWO, 'intermediate').map(m => m.id)).toEqual(['listen-act', 'phrases', 'say-in-english', 'voice-messages']);
		expect(modulesFor(15, DAY_TWO, 'professional').map(m => m.id)).toEqual(['listen-retell', 'phrases', 'choose-persuade', 'scenario']);
		// Day 1 has two versions too (rebuilt): its session keeps its version.
		expect(startSession(15, new Date(), DAY_ONE, 'professional').track).toBe('professional');
		expect(modulesFor(15, DAY_ONE, 'professional').map(m => m.id)).toEqual(['listen-act', 'phrases', 'say-it-better', 'scenario']);
		expect(DaySessionSchema.safeParse({ ...startSession(15, new Date(), DAY_TWO), day: 'day-9' }).success).toBe(false);
		expect(DaySessionSchema.safeParse({ ...startSession(15, new Date(), DAY_TWO), track: 'expert' }).success).toBe(false);
	});
	it('picks a learner’s version from their onboarding answer', () => {
		expect(trackFor({ comfort: 'natural' })).toBe('professional');
		expect(trackFor({ comfort: 'simple' })).toBe('intermediate');
		expect(trackFor({ comfort: 'hard' })).toBe('intermediate');
		expect(trackFor({ comfort: null })).toBe('intermediate');
		expect(trackFor(null)).toBe('intermediate');
	});
	it('the next day follows the last finished one; a day that isn’t ready is only for the owner', () => {
		expect(nextDay(null).id).toBe('day-1');
		// Days 1–3 are released (owner, 2026-10-21); Day 4 waits for the owner's phone test.
		for (const day of DAYS) expect(day.ready, day.id).toBe(day.id !== 'day-4');
		expect(nextDay('day-1').id).toBe('day-2');
		expect(nextDay('day-2').id).toBe('day-3');
		// Not ready: learners stay on the last ready day; the owner goes on.
		const two = DAY_TWO as { ready: boolean };
		two.ready = false;
		try {
			expect(nextDay('day-1').id).toBe('day-1');
			expect(nextDay('day-1', true).id).toBe('day-2');
		} finally { two.ready = true; }
		// Learners stay on Day 3 until Day 4 is released; the owner goes on to it.
		expect(nextDay('day-3').id).toBe('day-3');
		expect(nextDay('day-3', true).id).toBe('day-4');
		// After the last day: the last one again.
		expect(nextDay('day-4', true).id).toBe('day-4');
		expect(nextDay('unknown').id).toBe('day-1');
		expect(dayById('day-2')).toBe(DAY_TWO);
		expect(dayById('nope')).toBeNull();
	});
	it('gives every day after the first a check-in that links back and warms up', () => {
		for (const day of DAYS.slice(1)) {
			expect(day.checkIn, day.id).toBeDefined();
			// Her question on screen is the one the AI is told she asked.
			expect(day.checkIn!.question.en).toBe(day.question);
			expect(day.question.match(/\?/g)?.length).toBe(2);
			for (const line of [day.checkIn!.story, day.checkIn!.question, day.checkIn!.reply]) expect(line.fa).toMatch(/[\u0600-\u06FF]/);
		}
		expect(DAY_ONE.checkIn).toBeUndefined();
	});
	it('names the next day in the recap suggestion', () => {
		expect(recommend(startSession(15), DAY_TWO).title.en).toBe('Next time: Day 2, Taking a taxi');
		expect(recommend(startSession(15), DAY_ONE).title.en).toBe('Next time: Day 1 again');
	});
});

describe('skipping a step', () => {
	it('moves on to the next day when some steps were done; the same day comes back only when every step was skipped', async () => {
		const { completeSession: complete, recommend: rec, startSession: start, DAY_TWO: two } = await import('./day');
		const some = complete({ ...start(15, new Date(), DAY_ONE, 'professional'), stage: 'recap', done: ['listen-act', 'phrases'], skipped: ['say-it-better'] } as never);
		const next = rec(some, two);
		expect(next.title.en).toBe('Next time: Day 2, Taking a taxi');
		expect(next.why.en).toContain('You skipped Tell your story today');
		const all = complete({ ...start(15, new Date(), DAY_ONE, 'professional'), stage: 'recap', done: [], skipped: ['listen-act', 'phrases', 'say-it-better', 'say-in-english', 'scenario'] } as never);
		expect(rec(all, two).title.en).toBe('Next time: Listen and connect');
	});
});
