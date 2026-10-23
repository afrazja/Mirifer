import { describe, it, expect } from 'vitest';
import { buildEnglishInsights, type InsightUser } from './english-insights';
import type { StoredEvent } from './contract';
import { DAY_TWO, startSession } from '$lib/practice/day';

const now = Date.parse('2026-10-23T12:00:00Z');
const DAY = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString();
const profile = (comfort = 'simple') => ({ reason: 'travel', comfort, minutes: 15, skipped: false, completedAt: iso(now - 9 * DAY) });
const progress = (ids: string[]) => ({ sessionsCompleted: ids.length, lastCompletedAt: null, lastThemeId: ids.at(-1) ?? null, lastResult: 'ok', recent: [], finishedDays: ids });
const user = (id: string, meta: Record<string, unknown>, extra: Partial<InsightUser> = {}): InsightUser =>
	({ id, email: `${id}@m.test`, created_at: iso(now - 10 * DAY), last_sign_in_at: iso(now - 2 * DAY), meta, isAdmin: false, excluded: false, ...extra });
let n = 0;
const event = (user_id: string, event_name: string, ms: number, metadata: Record<string, unknown> = {}, day: number | null = null): StoredEvent =>
	({ event_id: String(++n), user_id, session_id: 's', attempt_id: `a-${user_id}-${day}`, event_name, day, occurred_at: iso(ms), created_at: iso(ms), schema_version: 2, metadata } as unknown as StoredEvent);

describe('the admin’s English report', () => {
	const users = [
		user('new', {}),
		user('onboarded', { english_profile_v1: profile() }),
		user('learner', { display_name: 'Sara', english_profile_v1: profile('natural'), english_progress_v1: progress(['day-1']), english_day_v1: { ...startSession(15, new Date(now), DAY_TWO, 'professional'), done: ['listen-retell'] } }),
		user('owner', { english_profile_v1: profile() }, { isAdmin: true })
	];
	const events = [
		event('learner', 'visit_started', now - 3 * DAY), event('learner', 'visit_started', now - 3 * DAY + 3_600_000), event('learner', 'visit_started', now - 1 * DAY),
		event('learner', 'lesson_started', now - 3 * DAY, { course: 'en', track: 'professional', total: 4 }, 1),
		event('learner', 'lesson_completed', now - 3 * DAY + 1_000_000, { course: 'en', track: 'professional', done: 4, skipped: 0, total: 4 }, 1),
		event('learner', 'english_clip_transcribed', now - 3 * DAY, { course: 'en', audio_seconds: 120 }),
		event('learner', 'english_ai_requested', now - 3 * DAY, { course: 'en' }),
		event('owner', 'visit_started', now - DAY)
	];
	const report = buildEnglishInsights({ users, events, acquisition: [{ user_id: 'learner', source: 'instagram' }], days: 30, includeTests: false, now });

	it('counts each learner’s visits, the days they came, and their last visit and sign-in', () => {
		const sara = report.learners.find(l => l.id === 'learner')!;
		expect(sara).toMatchObject({ name: 'Sara', visits: 3, daysActive: 2, lastVisit: iso(now - DAY), lastSignIn: iso(now - 2 * DAY), finished: 1, level: 'Professional', reason: 'Travel', source: 'instagram' });
		expect(sara.status).toBe('In Day 2 · step 2 of 5');
		expect(sara.minutes).toBe(2);
		expect(sara.cost).toBeCloseTo(2 * 0.006 + 0.002);
		expect(sara.timeline[0]).toMatchObject({ name: 'visit_started' });
	});
	it('shows where sign-ups drop off, leaving out the owner and test accounts', () => {
		expect(report.funnel.map(s => s.count)).toEqual([3, 2, 1, 1, 0, 0]);
		expect(report.learners.some(l => l.id === 'owner')).toBe(false);
		expect(report.learners.find(l => l.id === 'new')?.status).toBe('Not onboarded');
		expect(report.learners.find(l => l.id === 'onboarded')?.status).toBe('Not started');
	});
	it('adds up the period: active learners, lessons, AI use, levels and sources', () => {
		expect(report.totals).toMatchObject({ signups: 3, active: 1, lessonsStarted: 1, lessonsFinished: 1, minutes: 2, aiRequests: 1 });
		expect(report.series).toHaveLength(30);
		expect(report.series.find(s => s.date === iso(now - 3 * DAY).slice(0, 10))).toMatchObject({ active: 1, started: 1, finished: 1 });
		expect(report.audience.levels).toEqual(expect.arrayContaining([{ label: 'Intermediate', count: 1 }, { label: 'Professional', count: 1 }]));
		expect(report.sources).toEqual(expect.arrayContaining([{ label: 'instagram', count: 1 }, { label: 'unknown', count: 2 }]));
	});
	it('includes test accounts only when asked', () => {
		const all = buildEnglishInsights({ users, events, acquisition: [], days: 30, includeTests: true, now });
		expect(all.learners.find(l => l.id === 'owner')).toMatchObject({ test: true, admin: true, visits: 1 });
	});
});
