import { describe, it, expect } from 'vitest';
import { EMPTY_PROGRESS, EnglishProgressSchema, RECENT_SESSIONS, readEnglishProgress, recordSession, resultBand, skillTotal, strongerSkill } from './english-progress';

describe('English progress', () => {
	it('bands a result', () => {
		expect(resultBand(8, 10)).toBe('strong'); expect(resultBand(5, 10)).toBe('ok'); expect(resultBand(4, 10)).toBe('hard'); expect(resultBand(0, 0)).toBeNull();
	});
	it('records a session and keeps only recent ones', () => {
		let p = EMPTY_PROGRESS;
		for (let i = 0; i < RECENT_SESSIONS + 3; i++) p = recordSession(p, 'day-1', [{ skill: 'listening', correct: 9, total: 10 }], new Date('2026-10-01T10:00:00Z'));
		expect(p.sessionsCompleted).toBe(RECENT_SESSIONS + 3);
		expect(p.recent).toHaveLength(RECENT_SESSIONS);
		expect(p.lastResult).toBe('strong'); expect(p.lastThemeId).toBe('day-1');
		expect(EnglishProgressSchema.safeParse(p).success).toBe(true);
		expect(skillTotal(p, 'listening')).toEqual({ correct: 90, total: 100 });
	});
	it('a session with no scored module has no result', () => {
		expect(recordSession(EMPTY_PROGRESS, 'day-1', []).lastResult).toBeNull();
	});
	it('names a stronger skill only with enough answers and a real gap', () => {
		let p = recordSession(EMPTY_PROGRESS, 'd', [{ skill: 'listening', correct: 9, total: 10 }, { skill: 'speaking', correct: 3, total: 5 }]);
		expect(strongerSkill(p)).toBeNull(); // speaking has fewer than 10
		p = recordSession(p, 'd', [{ skill: 'speaking', correct: 3, total: 5 }]);
		expect(strongerSkill(p)).toBe('listening');
		const close = recordSession(EMPTY_PROGRESS, 'd', [{ skill: 'listening', correct: 8, total: 10 }, { skill: 'speaking', correct: 7, total: 10 }]);
		expect(strongerSkill(close)).toBeNull();
	});
	it('reads damaged data as empty', () => {
		expect(readEnglishProgress({ english_progress_v1: { sessionsCompleted: 'x' } })).toEqual(EMPTY_PROGRESS);
		expect(readEnglishProgress(undefined)).toEqual(EMPTY_PROGRESS);
	});
});
