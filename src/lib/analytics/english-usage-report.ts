/**
 * The admin's usage view of the English step path (owner, 2026-10-29: the app isn't daily lessons
 * any more): who practises, how much, whether they come back, and how each step does. Built from
 * the events the step route writes (src/lib/server/step-path.ts) and the learners' saved paths;
 * only ids, counts, seconds and dates, never what a learner said. Reviewed by the system designer.
 *
 * - Step-path rows only: `flow: 'path'`, or (before that tag) a step event with no `length` from the
 *   day the step path went live. The old daily lessons used the same event names.
 * - Visited: opened the app (`visit_started`). Practised: did at least one step (done, not skipped).
 *   Daily and weekly active, steps per day and "came back" all count practice, not visits.
 * - Practice time: seconds from opening a step to its result, for steps done in one sitting (the
 *   server keeps no time beyond 30 minutes). Shown with how many steps had a time.
 * - Replays (a step done again) are counted apart and kept out of each step's numbers.
 * - Left: a step opened with no result from that learner afterwards (up to their next opening of
 *   it), at least a day ago. "Paused now" comes from the saved paths: a step under way for over a day.
 * - The funnel and "came back" follow the accounts created in the period; those too new for a
 *   row (a 7-day window, or the days a row needs) are counted apart, not as drop-offs.
 * With a handful of learners, every rate is shown with its counts.
 */
import { DAY_MS, type StoredEvent } from './contract';
import { localDay } from './english-lessons-report';
import { trackFor } from '$lib/practice/day';
import { chapterModules, readPath, splitStep } from '$lib/practice/path';
import { readEnglishProfile } from '$lib/practice/english-profile';
import { summarizeRatings } from '$lib/practice/step-feedback';

/** The step path went live for everyone. */
export const STEP_PATH_SINCE = Date.parse('2026-10-28T00:00:00Z');

export interface UsageUser { id: string; created_at: string; meta: Record<string, unknown> }
export interface UsageInput { events: StoredEvent[]; users: UsageUser[]; since: number; now: number }

/** A step opened this long ago with nothing after it was left. */
const LEFT_AFTER_MS = DAY_MS;
/** "Came back": practice on another of the learner's own days within this many days of their first. */
const RETURN_DAYS = 7;

const at = (e: StoredEvent) => Date.parse(e.occurred_at);
const en = (e: StoredEvent) => e.metadata.course === 'en';
/** One of the step path's own events (not the old daily lessons', which share the names). */
export const onPath = (e: StoredEvent) => en(e) && (e.metadata.flow === 'path' || (e.metadata.length === undefined && at(e) >= STEP_PATH_SINCE));
export const isStepResult = (e: StoredEvent) => e.event_name === 'lesson_progress' && typeof e.metadata.module === 'string' && onPath(e);
export const isStepOpened = (e: StoredEvent) => e.event_name === 'step_opened' && typeof e.metadata.module === 'string' && en(e);
const isDone = (e: StoredEvent) => isStepResult(e) && e.metadata.outcome !== 'skipped';
const isReplay = (e: StoredEvent) => e.metadata.replay === true;
const stepKey = (e: StoredEvent) => `${e.day ?? 0}|${String(e.metadata.track ?? 'intermediate')}|${String(e.metadata.module)}`;
const seconds = (e: StoredEvent) => (typeof e.metadata.seconds === 'number' ? e.metadata.seconds : null);

export function median(values: number[]): number | null {
	if (!values.length) return null;
	const sorted = [...values].sort((a, b) => a - b), mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}
const mean = (values: number[]) => (values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null);

export interface StepRow {
	day: number; track: string; module: string; index: number;
	opened: number; done: number; skipped: number; left: number;
	/** Under way for over a day right now (the saved paths). */
	paused: number;
	/** Done again (kept out of the other columns). */
	replays: number;
	/** Mean result, as a percentage (steps that give one). */
	score: number | null;
	/** Median seconds from opening to the result, and how many results had one. */
	seconds: number | null; timed: number;
	rating: number | null; ratings: number;
}

export function buildUsageReport(input: UsageInput) {
	const { since, now } = input;
	const known = new Set(input.users.map(u => u.id));
	const events = input.events.filter(e => known.has(e.user_id) && at(e) <= now);
	const inPeriod = (e: StoredEvent) => at(e) >= since;
	const period = events.filter(inPeriod);
	const results = period.filter(isStepResult), opens = period.filter(isStepOpened);
	const firstTime = results.filter(e => !isReplay(e));
	const done = firstTime.filter(isDone), skipped = firstTime.filter(e => e.metadata.outcome === 'skipped');

	// Visited and practised, in the period and in the last 7 days.
	const visited = new Set(period.filter(e => e.event_name === 'visit_started').map(e => e.user_id));
	const practisedBy = (list: StoredEvent[]) => new Set(list.filter(isDone).map(e => e.user_id));
	const practised = practisedBy(period);
	const practisedWeek = practisedBy(events.filter(e => at(e) >= now - 7 * DAY_MS));
	const doneAll = period.filter(isDone);
	const learnerDays = new Set(doneAll.map(e => `${e.user_id}|${localDay(e)}`));
	const timed = doneAll.map(seconds).filter((s): s is number => s !== null);

	// Each learner's days with a step done (their own calendar days), over all time.
	const practiceDays = new Map<string, number[]>();
	for (const e of events.filter(isDone)) practiceDays.set(e.user_id, [...(practiceDays.get(e.user_id) ?? []), localDay(e)]);
	const daysOf = (id: string) => new Set(practiceDays.get(id) ?? []);
	const chapterDone = new Set(events.filter(e => e.event_name === 'lesson_completed' && onPath(e) && typeof e.metadata.done === 'number' && e.metadata.done >= 3).map(e => e.user_id));

	// The funnel and "came back": the accounts created in the period. A row a learner is too new
	// for (fewer days since signing up than it needs) counts them apart.
	const cohort = input.users.filter(u => Date.parse(u.created_at) >= since);
	const age = (u: UsageUser) => Math.floor((now - Date.parse(u.created_at)) / DAY_MS);
	const row = (label: string, reached: (u: UsageUser) => boolean, minDays = 0) => {
		const old = cohort.filter(u => age(u) >= minDays);
		const count = cohort.filter(reached).length;
		return { label, count, tooNew: cohort.filter(u => age(u) < minDays && !reached(u)).length, of: old.length };
	};
	const funnel = [
		row('Signed up', () => true),
		row('Answered the onboarding questions', u => !!readEnglishProfile(u.meta)),
		row('Did a first step', u => daysOf(u.id).size > 0),
		row('Finished a chapter (3+ steps done)', u => chapterDone.has(u.id)),
		row('Practised on 2 or more days', u => daysOf(u.id).size >= 2, 1),
		row('Practised on 3 or more days', u => daysOf(u.id).size >= 3, 2)
	];
	let eligible = 0, returned = 0, pending = 0;
	const cameBackNames: { id: string; back: boolean }[] = [];
	for (const u of cohort) {
		const list = (practiceDays.get(u.id) ?? []).slice().sort((a, b) => a - b);
		if (!list.length) continue;
		const first = list[0];
		const back = list.some(day => day > first && day <= first + RETURN_DAYS);
		// Their first practice day plus 7 more must have passed (UTC is close enough for "too new").
		const windowOver = now >= (first + RETURN_DAYS + 1) * DAY_MS;
		if (back || windowOver) { eligible++; if (back) returned++; cameBackNames.push({ id: u.id, back }); } else pending++;
	}
	// Opened their very first step and left it: no result at all, a day later.
	const resultsBy = new Map<string, number[]>();
	for (const e of events.filter(isStepResult)) { const k = `${e.user_id}|${stepKey(e)}`; resultsBy.set(k, [...(resultsBy.get(k) ?? []), at(e)]); }
	const anyResult = new Set(events.filter(isStepResult).map(e => e.user_id));
	const leftFirst = cohort.filter(u => !anyResult.has(u.id) && events.some(e => e.user_id === u.id && isStepOpened(e) && now - at(e) >= LEFT_AFTER_MS)).length;

	// Each step of each chapter and version.
	const rows = new Map<string, StepRow & { scores: number[]; times: number[] }>();
	const rowOf = (key: string, e: { day: number; track: string; module: string; index: number }) => {
		const r = rows.get(key) ?? { ...e, opened: 0, done: 0, skipped: 0, left: 0, paused: 0, replays: 0, score: null, seconds: null, timed: 0, rating: null, ratings: 0, scores: [], times: [] };
		rows.set(key, r);
		return r;
	};
	const fromEvent = (e: StoredEvent) => rowOf(stepKey(e), { day: e.day ?? 0, track: String(e.metadata.track ?? 'intermediate'), module: String(e.metadata.module), index: Number(e.metadata.index ?? 0) });
	for (const e of results) {
		const r = fromEvent(e);
		if (isReplay(e)) { if (isDone(e)) r.replays++; continue; }
		if (e.metadata.outcome === 'skipped') { r.skipped++; continue; }
		r.done++;
		if (typeof e.metadata.percentage === 'number') r.scores.push(e.metadata.percentage);
		const s = seconds(e);
		if (s !== null) r.times.push(s);
	}
	// Openings (first time only), and the ones left: nothing from that learner for that step after
	// it, up to their next opening of it.
	const openings = new Map<string, number[]>();
	for (const e of events.filter(isStepOpened)) { const k = `${e.user_id}|${stepKey(e)}`; openings.set(k, [...(openings.get(k) ?? []), at(e)]); }
	for (const e of opens) {
		if (isReplay(e)) continue;
		const r = fromEvent(e);
		r.opened++;
		if (now - at(e) < LEFT_AFTER_MS) continue;
		const k = `${e.user_id}|${stepKey(e)}`;
		const nextOpen = (openings.get(k) ?? []).filter(t => t > at(e)).sort((a, b) => a - b)[0] ?? Infinity;
		if (!(resultsBy.get(k) ?? []).some(t => t >= at(e) && t < nextOpen)) r.left++;
	}
	// Paused now: a step under way in a learner's saved path, started over a day ago.
	let pausedNow = 0;
	for (const u of input.users) {
		const profile = readEnglishProfile(u.meta);
		if (!profile) continue;
		const current = readPath(u.meta, trackFor(profile)).current;
		if (!current || now - Date.parse(current.startedAt) < LEFT_AFTER_MS || current.replay) continue;
		const parts = splitStep(current.step);
		if (!parts) continue;
		pausedNow++;
		rowOf(`${parts.day.number}|${current.track}|${parts.module}`, { day: parts.day.number, track: current.track, module: parts.module, index: Math.max(0, chapterModules(parts.day, current.track).findIndex(m => m.id === parts.module)) }).paused++;
	}
	for (const rating of summarizeRatings(period.filter(e => en(e) && e.event_name === 'step_rated'))) {
		const r = rows.get(`${rating.day}|${rating.track}|${rating.module}`);
		if (r) { r.rating = rating.average; r.ratings = rating.count; }
	}
	const steps: StepRow[] = [...rows.values()].map(({ scores, times, ...r }) => ({ ...r, score: mean(scores), seconds: median(times), timed: times.length }))
		// Most left or skipped first (counts, not rates: one learner shouldn't move a step to the top), then the lowest rated.
		.sort((a, b) => (b.left + b.skipped + b.paused) - (a.left + a.skipped + a.paused) || (a.rating ?? 6) - (b.rating ?? 6) || a.day - b.day || a.index - b.index);

	// The same by step type, across chapters.
	const types = new Map<string, { module: string; opened: number; done: number; skipped: number; left: number; replays: number; times: number[] }>();
	for (const r of rows.values()) {
		const t = types.get(r.module) ?? { module: r.module, opened: 0, done: 0, skipped: 0, left: 0, replays: 0, times: [] };
		t.opened += r.opened; t.done += r.done; t.skipped += r.skipped; t.left += r.left; t.replays += r.replays; t.times.push(...r.times);
		types.set(r.module, t);
	}
	const byType = [...types.values()].map(({ times, ...t }) => ({ ...t, seconds: median(times), timed: times.length })).sort((a, b) => b.done - a.done);

	// Day by day (UTC): learners who practised, steps done, minutes.
	const series: { date: string; practised: number; visited: number; steps: number; minutes: number }[] = [];
	const days = Math.max(1, Math.round((now - since) / DAY_MS));
	for (let d = Math.min(days, 90) - 1; d >= 0; d--) series.push({ date: new Date(now - d * DAY_MS).toISOString().slice(0, 10), practised: 0, visited: 0, steps: 0, minutes: 0 });
	const slot = new Map(series.map(s => [s.date, s]));
	const sets = { practised: new Map<string, Set<string>>(), visited: new Map<string, Set<string>>() };
	const add = (map: Map<string, Set<string>>, date: string, id: string) => map.set(date, (map.get(date) ?? new Set()).add(id));
	for (const e of period) {
		const date = new Date(at(e)).toISOString().slice(0, 10), s = slot.get(date);
		if (!s) continue;
		if (e.event_name === 'visit_started') add(sets.visited, date, e.user_id);
		if (isDone(e)) { add(sets.practised, date, e.user_id); s.steps++; s.minutes += (seconds(e) ?? 0) / 60; }
	}
	for (const s of series) { s.practised = sets.practised.get(s.date)?.size ?? 0; s.visited = sets.visited.get(s.date)?.size ?? 0; s.minutes = Math.round(s.minutes * 10) / 10; }

	return {
		totals: {
			visited: visited.size,
			practised: practised.size,
			practisedWeek: practisedWeek.size,
			stepsDone: done.length,
			stepsSkipped: skipped.length,
			replays: results.filter(e => isReplay(e) && isDone(e)).length,
			/** Steps done per learner-day with at least one step done (replays too). */
			stepsPerDay: learnerDays.size ? Math.round((doneAll.length / learnerDays.size) * 10) / 10 : null,
			practiceMinutes: Math.round(timed.reduce((a, b) => a + b, 0) / 6) / 10,
			timedSteps: timed.length, doneSteps: doneAll.length,
			cameBack: { eligible, returned, pending, learners: cameBackNames },
			leftFirstStep: leftFirst,
			pausedNow
		},
		funnel, steps, byType, series
	};
}
export type UsageReport = ReturnType<typeof buildUsageReport>;

/**
 * AI health: what each AI route sent (`english_ai_outcome`: the model's reply, its rewrite, a
 * prepared line, or an error), which provider answered and why the first one didn't; voice clips
 * that came back without text; and the problems learners' devices reported (`obstacle`).
 */
export function buildAiHealth(events: StoredEvent[], since: number, now: number) {
	const period = events.filter(e => at(e) >= since && at(e) <= now);
	const outcomes = period.filter(e => e.event_name === 'english_ai_outcome' && en(e));
	const routes = new Map<string, { route: string; calls: number; ok: number; retried: number; fallback: number; failed: number; times: number[] }>();
	const providers = new Map<string, number>(), fails = new Map<string, number>();
	for (const e of outcomes) {
		const route = String(e.metadata.route ?? 'other');
		const r = routes.get(route) ?? { route, calls: 0, ok: 0, retried: 0, fallback: 0, failed: 0, times: [] };
		r.calls++;
		const result = String(e.metadata.ai_result);
		if (result === 'ok' || result === 'retried' || result === 'fallback' || result === 'failed') r[result]++;
		if (typeof e.metadata.ms === 'number') r.times.push(e.metadata.ms);
		routes.set(route, r);
		const provider = String(e.metadata.provider ?? 'none');
		providers.set(provider, (providers.get(provider) ?? 0) + 1);
		if (typeof e.metadata.first_fail === 'string') fails.set(e.metadata.first_fail, (fails.get(e.metadata.first_fail) ?? 0) + 1);
	}
	const clips = period.filter(e => e.event_name === 'english_clip_transcribed');
	const clipRoutes = new Map<string, { route: string; clips: number; failed: number }>();
	for (const e of clips) {
		const route = String(e.metadata.route ?? 'other');
		const r = clipRoutes.get(route) ?? { route, clips: 0, failed: 0 };
		r.clips++; if (e.metadata.failed === true) r.failed++;
		clipRoutes.set(route, r);
	}
	const obstacles = new Map<string, { code: string; count: number; learners: Set<string> }>();
	for (const e of period.filter(e => e.event_name === 'obstacle' && typeof e.metadata.code === 'string')) {
		const code = String(e.metadata.code);
		const o = obstacles.get(code) ?? { code, count: 0, learners: new Set<string>() };
		o.count++; o.learners.add(e.user_id);
		obstacles.set(code, o);
	}
	const sorted = <T>(map: Map<string, T>) => [...map.values()];
	return {
		routes: sorted(routes).map(({ times, ...r }) => ({ ...r, ms: median(times) })).sort((a, b) => b.calls - a.calls),
		providers: [...providers.entries()].map(([provider, count]) => ({ provider, count })).sort((a, b) => b.count - a.count),
		firstFails: [...fails.entries()].map(([fail, count]) => ({ fail, count })).sort((a, b) => b.count - a.count),
		clips: sorted(clipRoutes).sort((a, b) => b.clips - a.clips),
		obstacles: sorted(obstacles).map(o => ({ code: o.code, count: o.count, learners: o.learners.size })).sort((a, b) => b.count - a.count),
		/** Outcomes only exist from the day they were first kept. */
		recorded: outcomes.length
	};
}
export type AiHealth = ReturnType<typeof buildAiHealth>;
