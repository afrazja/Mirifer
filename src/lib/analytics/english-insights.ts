/**
 * The admin's view of the English app (src/routes/admin): who signs up and how far they get, how
 * often each learner comes back, what happens inside the lessons, and what the AI costs. Built on
 * the server from the account list and the events table; only ids, counts and dates, never what a
 * learner said or typed.
 *
 * "Visits" are the app's own `visit_started` events: one each time a learner opens the app after
 * 30 minutes away, signed in again or not (Supabase only keeps the last sign-in, not a count).
 */
import { DAY_MS, type StoredEvent } from './contract';
import { buildEnglishLessonReport } from './english-lessons-report';
import { DaySessionSchema, caughtUp, dayById, finishedDays, furthestDayId, nextDay, sessionModules, trackFor } from '$lib/practice/day';
import { readEnglishProgress } from '$lib/practice/english-progress';
import { readEnglishProfile } from '$lib/practice/english-profile';
import { lessonDates, streak } from '$lib/practice/learner-stats';
import { summarizeRatings } from '$lib/practice/step-feedback';

/** Rough prices, for an estimate only: speech to text per minute, and one AI feedback request. */
export const COST = { transcribePerMinute: 0.006, aiRequest: 0.002 } as const;
/** The daily limits (src/lib/server/english-ai.ts), to spot who reached them. */
const LIMITS = { clips: 150, audioSeconds: 60 * 60, aiRequests: 40 } as const;

export interface InsightUser {
	id: string;
	email: string;
	created_at: string;
	last_sign_in_at: string | null;
	meta: Record<string, unknown>;
	/** The owner or another administrator. */
	isAdmin: boolean;
	/** Marked as a test account in the admin. */
	excluded: boolean;
}
export interface InsightInput {
	users: InsightUser[];
	events: StoredEvent[];
	acquisition: { user_id: string; source: string }[];
	days: number;
	includeTests: boolean;
	now: number;
}

const at = (e: { occurred_at: string }) => Date.parse(e.occurred_at);
const utcDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const isLesson = (e: StoredEvent) => e.metadata.course === 'en' && ['lesson_started', 'lesson_progress', 'lesson_completed'].includes(e.event_name);
const REASONS: Record<string, string> = { travel: 'Travel', work: 'Work and interviews', exam: 'A speaking exam', abroad: 'Living abroad', everyday: 'Everyday confidence', unsure: 'Not sure yet' };

/** Where a learner is in the course right now, in a few words. */
function status(meta: Record<string, unknown>): string {
	if (!readEnglishProfile(meta)) return 'Not onboarded';
	const progress = readEnglishProgress(meta);
	const saved = DaySessionSchema.safeParse(meta.english_day_v1);
	if (saved.success && saved.data.stage !== 'done') {
		const session = saved.data, steps = sessionModules(session).length + 1;
		const step = session.stage === 'recap' ? steps : Math.min(session.done.length + session.skipped.length + 1, steps);
		return `In Day ${dayById(session.day)?.number ?? '?'} · step ${step} of ${steps}`;
	}
	if (!finishedDays(progress).length) return saved.success ? 'Not finished a lesson' : 'Not started';
	if (caughtUp(progress)) return 'Caught up';
	return `Next: Day ${nextDay(furthestDayId(progress)).number}`;
}

export function buildEnglishInsights(input: InsightInput) {
	const { now, days } = input;
	const since = now - days * DAY_MS;
	const users = input.users.filter(u => input.includeTests || (!u.isAdmin && !u.excluded));
	const included = new Set(users.map(u => u.id));
	const events = input.events.filter(e => included.has(e.user_id) && at(e) <= now);
	const inPeriod = (e: StoredEvent) => at(e) >= since;
	const byUser = new Map<string, StoredEvent[]>();
	for (const e of events) { const list = byUser.get(e.user_id); if (list) list.push(e); else byUser.set(e.user_id, [e]); }
	const source = new Map(input.acquisition.map(a => [a.user_id, a.source]));
	const today = utcDate(now);

	// Each learner: who, where in the course, how often they come back, what their AI use costs.
	const learners = users.map(u => {
		const own = (byUser.get(u.id) ?? []).sort((a, b) => at(a) - at(b));
		const visits = own.filter(e => e.event_name === 'visit_started');
		const profile = readEnglishProfile(u.meta);
		const progress = readEnglishProgress(u.meta);
		const clips = own.filter(e => e.event_name === 'english_clip_transcribed' && inPeriod(e));
		const ai = own.filter(e => (e.event_name === 'english_ai_requested' || e.event_name === 'english_practice_ai') && inPeriod(e));
		const audioSeconds = clips.reduce((sum, e) => sum + (typeof e.metadata.audio_seconds === 'number' ? e.metadata.audio_seconds : 0), 0);
		const finishedOn = lessonDates(own.map(e => ({ event_name: e.event_name, occurred_at: e.occurred_at, metadata: e.metadata })));
		const lastActive = Math.max(own.length ? at(own[own.length - 1]) : 0, u.last_sign_in_at ? Date.parse(u.last_sign_in_at) : 0, Date.parse(u.created_at));
		return {
			id: u.id,
			name: typeof u.meta.display_name === 'string' ? u.meta.display_name.slice(0, 40) : '',
			email: u.email,
			signedUp: u.created_at,
			lastSignIn: u.last_sign_in_at,
			visits: visits.length,
			visitsInPeriod: visits.filter(inPeriod).length,
			daysActive: new Set(visits.map(e => utcDate(at(e)))).size,
			lastVisit: visits.length ? visits[visits.length - 1].occurred_at : null,
			lastActive: new Date(lastActive).toISOString(),
			level: profile ? (trackFor(profile) === 'professional' ? 'Professional' : 'Intermediate') : null,
			reason: profile?.reason ? REASONS[profile.reason] ?? profile.reason : null,
			source: source.get(u.id) ?? null,
			finished: finishedDays(progress).length,
			streak: streak(finishedOn, today),
			lastLesson: finishedOn.at(-1) ?? null,
			status: status(u.meta),
			minutes: Math.round(audioSeconds / 6) / 10,
			aiRequests: ai.length,
			cost: audioSeconds / 60 * COST.transcribePerMinute + ai.length * COST.aiRequest,
			test: u.isAdmin || u.excluded,
			admin: u.isAdmin,
			timeline: own.filter(e => e.event_name === 'visit_started' || isLesson(e)).slice(-40).reverse()
				.map(e => ({ at: e.occurred_at, name: e.event_name, day: e.day, track: e.metadata.track ?? null, module: e.metadata.module ?? null, outcome: e.metadata.outcome ?? null, done: e.metadata.done ?? null, skipped: e.metadata.skipped ?? null }))
		};
	}).sort((a, b) => Date.parse(b.lastActive) - Date.parse(a.lastActive));

	// The funnel: accounts created in the period, and how far each got.
	const cohort = users.filter(u => Date.parse(u.created_at) >= since);
	const startedLesson = (u: InsightUser) => DaySessionSchema.safeParse(u.meta.english_day_v1).success || (byUser.get(u.id) ?? []).some(e => e.event_name === 'lesson_started' && e.metadata.course === 'en') || finishedDays(readEnglishProgress(u.meta)).length > 0;
	const finishedDay = (n: number) => (u: InsightUser) => finishedDays(readEnglishProgress(u.meta)).some(day => day.number === n);
	const funnel = [
		{ label: 'Signed up', count: cohort.length },
		{ label: 'Answered the onboarding questions', count: cohort.filter(u => readEnglishProfile(u.meta)).length },
		{ label: 'Started a lesson', count: cohort.filter(startedLesson).length },
		{ label: 'Finished Day 1', count: cohort.filter(finishedDay(1)).length },
		{ label: 'Finished Day 2', count: cohort.filter(finishedDay(2)).length },
		{ label: 'Finished Day 3', count: cohort.filter(finishedDay(3)).length }
	];

	// Day by day: who opened the app, lessons started and finished (UTC days).
	const series: { date: string; active: number; started: number; finished: number; minutes: number; aiRequests: number; cost: number }[] = [];
	for (let d = Math.min(days, 90) - 1; d >= 0; d--) series.push({ date: utcDate(now - d * DAY_MS), active: 0, started: 0, finished: 0, minutes: 0, aiRequests: 0, cost: 0 });
	const slot = new Map(series.map(s => [s.date, s]));
	const activeOn = new Map<string, Set<string>>();
	for (const e of events) {
		const row = slot.get(utcDate(at(e)));
		if (!row) continue;
		if (e.event_name === 'visit_started' || isLesson(e)) activeOn.set(row.date, (activeOn.get(row.date) ?? new Set()).add(e.user_id));
		if (isLesson(e) && e.event_name === 'lesson_started') row.started++;
		if (isLesson(e) && e.event_name === 'lesson_completed') row.finished++;
		if (e.event_name === 'english_clip_transcribed') row.minutes += (typeof e.metadata.audio_seconds === 'number' ? e.metadata.audio_seconds : 0) / 60;
		if (e.event_name === 'english_ai_requested' || e.event_name === 'english_practice_ai') row.aiRequests++;
	}
	for (const row of series) {
		row.active = activeOn.get(row.date)?.size ?? 0;
		row.cost = row.minutes * COST.transcribePerMinute + row.aiRequests * COST.aiRequest;
		row.minutes = Math.round(row.minutes * 10) / 10;
	}

	// Who reached a daily limit (a learner on a UTC day).
	const usage = new Map<string, { clips: number; seconds: number; ai: number }>();
	for (const e of events.filter(inPeriod)) {
		const k = `${e.user_id}|${utcDate(at(e))}`;
		const u = usage.get(k) ?? { clips: 0, seconds: 0, ai: 0 };
		if (e.event_name === 'english_clip_transcribed') { u.clips++; u.seconds += typeof e.metadata.audio_seconds === 'number' ? e.metadata.audio_seconds : 0; }
		if (e.event_name === 'english_ai_requested') u.ai++;
		usage.set(k, u);
	}
	const limitHits = [...usage.entries()].filter(([, u]) => u.clips >= LIMITS.clips || u.seconds >= LIMITS.audioSeconds || u.ai >= LIMITS.aiRequests)
		.map(([k, u]) => { const [id, date] = k.split('|'); return { id, date, ...u }; });

	// Who the learners are (everyone onboarded) and where the period's sign-ups came from.
	const count = (values: (string | null)[]) => {
		const map = new Map<string, number>();
		for (const v of values) if (v) map.set(v, (map.get(v) ?? 0) + 1);
		return [...map.entries()].map(([label, n]) => ({ label, count: n })).sort((a, b) => b.count - a.count);
	};
	const lessons = buildEnglishLessonReport(events, users.map(u => ({ id: u.id, created_at: u.created_at, is_admin: u.isAdmin })), since, now);
	const periodLearners = learners.filter(l => l.lastActive && Date.parse(l.lastActive) >= since);
	return {
		days, now: new Date(now).toISOString(), includeTests: input.includeTests,
		totals: {
			signups: cohort.length,
			active: new Set(events.filter(e => inPeriod(e) && (e.event_name === 'visit_started' || isLesson(e))).map(e => e.user_id)).size,
			lessonsStarted: lessons.started,
			lessonsFinished: lessons.completed,
			nextDay: lessons.nextDay,
			minutes: Math.round(series.reduce((s, r) => s + r.minutes, 0) * 10) / 10,
			aiRequests: series.reduce((s, r) => s + r.aiRequests, 0),
			cost: series.reduce((s, r) => s + r.cost, 0)
		},
		funnel, series, lessons, learners, periodLearners: periodLearners.length, limitHits,
		/** How learners rate each step (latest rating per learner), lowest first. */
		ratings: summarizeRatings(events.filter(e => e.event_name === 'step_rated' && e.metadata.course === 'en' && inPeriod(e))),
		audience: { levels: count(learners.map(l => l.level)), reasons: count(learners.map(l => l.reason)) },
		sources: count(cohort.map(u => source.get(u.id) ?? 'unknown'))
	};
}
export type EnglishInsights = ReturnType<typeof buildEnglishInsights>;
