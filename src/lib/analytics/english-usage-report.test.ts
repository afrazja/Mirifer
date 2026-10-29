import { describe, it, expect } from 'vitest';
import { buildAiHealth, buildUsageReport, median, onPath } from './english-usage-report';
import type { StoredEvent } from './contract';

const DAY = 86_400_000;
const NOW = Date.parse('2026-11-20T12:00:00Z');
const PROFILE = { reason: 'everyday', comfort: 'simple', minutes: 15, skipped: false, completedAt: '2026-11-01T10:00:00.000Z' };
let n = 0;
function ev(user: string, name: string, daysAgo: number, metadata: Record<string, unknown> = {}, day = 101): StoredEvent {
	const occurred = new Date(NOW - daysAgo * DAY).toISOString();
	return { event_id: `e${++n}`, session_id: 's', attempt_id: 'a', user_id: user, event_name: name as StoredEvent['event_name'], day, occurred_at: occurred, created_at: occurred, schema_version: 2, metadata: metadata as StoredEvent['metadata'] };
}
const step = (user: string, daysAgo: number, module: string, extra: Record<string, unknown> = {}) => ev(user, 'lesson_progress', daysAgo, { course: 'en', flow: 'path', track: 'intermediate', module, index: 0, outcome: 'done', ...extra });
const opened = (user: string, daysAgo: number, module: string, extra: Record<string, unknown> = {}) => ev(user, 'step_opened', daysAgo, { course: 'en', flow: 'path', track: 'intermediate', module, index: 0, ...extra });
const user = (id: string, daysAgo: number, meta: Record<string, unknown> = { english_profile_v1: PROFILE }) => ({ id, created_at: new Date(NOW - daysAgo * DAY).toISOString(), meta });
const report = (events: StoredEvent[], users = [user('a', 20), user('b', 20), user('c', 3)], days = 30) => buildUsageReport({ events, users, since: NOW - days * DAY, now: NOW });

describe('the usage report', () => {
	it('counts only the step path’s rows, not the old daily lessons’ (same event names)', () => {
		const old = ev('a', 'lesson_progress', 25, { course: 'en', track: 'intermediate', module: 'traps', index: 2, outcome: 'done', length: 15 }, 1);
		expect(onPath(old)).toBe(false);
		expect(onPath(step('a', 1, 'traps'))).toBe(true);
		// Before the flow tag: a step event without `length` from the day the step path went live.
		expect(onPath(ev('a', 'lesson_progress', 0, { course: 'en', module: 'traps', outcome: 'done' }))).toBe(true);
		const r = report([old, step('a', 1, 'traps')]);
		expect(r.totals.stepsDone).toBe(1);
		expect(r.steps.map(s => s.day)).toEqual([101]);
	});

	it('visited is not practised: daily and weekly active count steps done', () => {
		const r = report([ev('a', 'visit_started', 1), ev('b', 'visit_started', 1), step('b', 1, 'traps'), step('a', 12, 'phrases', { outcome: 'skipped' })]);
		expect(r.totals).toMatchObject({ visited: 2, practised: 1, practisedWeek: 1, stepsDone: 1, stepsSkipped: 1 });
		expect(r.series.at(-2)).toMatchObject({ practised: 1, visited: 2, steps: 1 });
	});

	it('keeps replays apart from each step’s numbers', () => {
		const r = report([step('a', 2, 'traps', { seconds: 100 }), step('a', 1, 'traps', { replay: true, seconds: 900 }), opened('a', 1, 'traps', { replay: true })]);
		expect(r.steps[0]).toMatchObject({ done: 1, replays: 1, opened: 0, seconds: 100, timed: 1 });
		expect(r.totals.replays).toBe(1);
	});

	it('a paused step finished days later is not "left"; one never finished is', () => {
		const r = report([
			opened('a', 5, 'traps'), step('a', 2, 'traps'), // paused for 3 days, then done
			opened('b', 4, 'traps'), // never finished
			opened('a', 0.2, 'phrases') // opened today: too soon to say
		]);
		const traps = r.steps.find(s => s.module === 'traps')!, phrases = r.steps.find(s => s.module === 'phrases')!;
		expect(traps).toMatchObject({ opened: 2, done: 1, left: 1 });
		expect(phrases).toMatchObject({ opened: 1, left: 0 });
		// A result before a later opening doesn't answer it.
		const again = report([opened('a', 6, 'traps'), step('a', 5, 'traps'), opened('a', 3, 'traps')]);
		expect(again.steps[0].left).toBe(1);
	});

	it('paused now: a step under way in a saved path for over a day', () => {
		const path = (startedDaysAgo: number) => ({ english_profile_v1: PROFILE, english_path_v1: { done: {}, skipped: [], current: { step: 'everyday-1:traps', track: 'intermediate', startedAt: new Date(NOW - startedDaysAgo * DAY).toISOString(), replay: false } } });
		const r = report([], [user('a', 20, path(3)), user('b', 20, path(0.1))]);
		expect(r.totals.pausedNow).toBe(1);
		expect(r.steps[0]).toMatchObject({ module: 'traps', day: 101, paused: 1, index: 2 });
	});

	it('practice time counts steps done in one sitting, with how many had a time', () => {
		const r = report([step('a', 1, 'traps', { seconds: 120 }), step('a', 1, 'phrases'), step('b', 1, 'traps', { outcome: 'skipped', seconds: 30 })]);
		expect(r.totals).toMatchObject({ practiceMinutes: 2, timedSteps: 1, doneSteps: 2 });
		expect(r.totals.stepsPerDay).toBe(2);
	});

	it('came back: practice on another day within a week; too new to tell is counted apart', () => {
		const r = report([
			step('a', 15, 'traps'), step('a', 12, 'phrases'), // back on day 3
			step('b', 15, 'traps'), // never again, window over
			step('c', 2, 'traps') // signed up 3 days ago: too new
		]);
		expect(r.totals.cameBack).toMatchObject({ eligible: 2, returned: 1, pending: 1 });
		expect(r.totals.cameBack.learners).toEqual([{ id: 'a', back: true }, { id: 'b', back: false }]);
	});

	it('the funnel follows new accounts, and a row they are too new for counts them apart', () => {
		const users = [user('a', 20), user('b', 20, {}), user('c', 0.5)];
		const r = report([step('a', 15, 'traps'), step('a', 12, 'phrases'), ev('a', 'lesson_completed', 12, { course: 'en', flow: 'path', done: 4, skipped: 1 }), step('c', 0.2, 'traps')], users);
		expect(r.funnel.map(f => [f.count, f.tooNew])).toEqual([[3, 0], [2, 0], [2, 0], [1, 0], [1, 1], [0, 1]]);
		// A chapter "finished" by skipping its steps doesn't count.
		const skippedThrough = report([ev('a', 'lesson_completed', 2, { course: 'en', flow: 'path', done: 1, skipped: 4 })], users);
		expect(skippedThrough.funnel[3].count).toBe(0);
	});

	it('opened their first step and left: no result at all, a day later', () => {
		const r = report([opened('c', 2, 'listen-act'), opened('b', 2, 'listen-act'), step('b', 1.5, 'listen-act')]);
		expect(r.totals.leftFirstStep).toBe(1);
	});

	it('sorts the steps learners leave or skip most first, by count', () => {
		const r = report([step('a', 1, 'phrases'), step('a', 1, 'traps', { outcome: 'skipped' }), step('b', 1, 'traps', { outcome: 'skipped' }), opened('b', 3, 'say-in-english')]);
		expect(r.steps.map(s => s.module)).toEqual(['traps', 'say-in-english', 'phrases']);
	});

	it('median', () => {
		expect(median([])).toBeNull();
		expect(median([5, 1, 3])).toBe(3);
		expect(median([1, 2, 3, 10])).toBe(3);
	});
});

describe('AI health', () => {
	it('what each route sent, who answered, why the first provider failed, clips without text, device problems', () => {
		const out = (route: string, ai_result: string, extra: Record<string, unknown> = {}) => ev('a', 'english_ai_outcome', 1, { course: 'en', route, ai_result, provider: 'openai', ms: 2000, ...extra }, 0);
		const h = buildAiHealth([
			out('chat', 'ok', { first_fail: 'http_404' }), out('chat', 'fallback'), out('chat', 'retried'), out('converse', 'failed', { provider: 'none', first_fail: 'http_5xx' }),
			ev('a', 'english_clip_transcribed', 1, { course: 'en', route: 'group-chat', audio_seconds: 4 }), ev('a', 'english_clip_transcribed', 1, { course: 'en', route: 'group-chat', audio_seconds: 4, failed: true }),
			ev('a', 'obstacle', 1, { code: 'mic_denied' }), ev('b', 'obstacle', 1, { code: 'mic_denied' }),
			out('chat', 'ok', {}) // too old? no: in the period
		].concat([ev('a', 'english_ai_outcome', 40, { course: 'en', route: 'chat', ai_result: 'failed' })]), NOW - 30 * DAY, NOW);
		expect(h.routes[0]).toEqual({ route: 'chat', calls: 4, ok: 2, retried: 1, fallback: 1, failed: 0, ms: 2000 });
		expect(h.routes[1]).toMatchObject({ route: 'converse', failed: 1 });
		expect(h.providers).toEqual([{ provider: 'openai', count: 4 }, { provider: 'none', count: 1 }]);
		expect(h.firstFails).toEqual([{ fail: 'http_404', count: 1 }, { fail: 'http_5xx', count: 1 }]);
		expect(h.clips).toEqual([{ route: 'group-chat', clips: 2, failed: 1 }]);
		expect(h.obstacles).toEqual([{ code: 'mic_denied', count: 2, learners: 2 }]);
	});
});
