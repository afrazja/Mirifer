import { DAY_MS, EVENT_NAMES, OBSTACLES, SCHEMA_VERSION, UUID, safeMetadata, type StoredEvent } from './contract';
import { buildLessonReport } from './lesson-report';
import { buildEnglishLessonReport, englishLessonEvent } from './english-lessons-report';
import { buildReturnReport } from './return-report';
import type { LessonContent } from './lesson-content';
import { buildPhaseThreeReport } from './phase-three-report';
import { unavailablePhaseThree, type PhaseThreeData } from './phase-three';

export interface AnalyticsUser { id: string; created_at: string; is_admin: boolean; }
export interface ReportInput {
	users: AnalyticsUser[];
	events: StoredEvent[];
	exclusions: string[];
	selfId: string | null;
	installedAt: string;
	now: number;
	days: number;
	includeTests: boolean;
	legacyCount: number;
	catalog?: LessonContent[];
	catalogError?: string | null;
	phaseThree?: PhaseThreeData;
}
const learningNames = new Set(['answer_submitted', 'free_turn_begun', 'exam_completed']);
const time = (e: StoredEvent) => Date.parse(e.occurred_at);
const unique = <T>(values: T[]) => new Set(values).size;

/** Pure calculations shared by the dashboard and known-journey verification. */
export function buildReport(input: ReportInput) {
	const { now, days, users, includeTests } = input;
	const since = now - days * DAY_MS;
	const excluded = new Set([...input.exclusions, ...users.filter(u => u.is_admin).map(u => u.id), ...(input.selfId ? [input.selfId] : [])]);
	const ids = new Set<string>();
	let duplicates = 0, invalid = 0;
	const clean = input.events.filter(e => {
		if (e.schema_version !== SCHEMA_VERSION || !UUID.test(e.event_id) || !UUID.test(e.session_id) ||
			(e.attempt_id !== null && !UUID.test(e.attempt_id)) || !EVENT_NAMES.includes(e.event_name) ||
			!Number.isFinite(time(e)) || time(e) > now + 300_000) { invalid++; return false; }
		if (ids.has(e.event_id)) { duplicates++; return false; }
		ids.add(e.event_id); return true;
	}).map(e => ({ ...e, metadata: safeMetadata(e.metadata) })).sort((a, b) => time(a) - time(b) || Number(a.metadata.sequence ?? 0) - Number(b.metadata.sequence ?? 0) || a.event_id.localeCompare(b.event_id));
	const firstEvent = clean[0]?.occurred_at ?? null;
	const coverageStart = firstEvent ? Math.max(Date.parse(input.installedAt), Date.parse(firstEvent)) : null;
	const includedUsers = users.filter(u => includeTests || !excluded.has(u.id));
	const allowed = new Set(includedUsers.map(u => u.id));
	const userIds = new Set(users.map(u => u.id));
	const all = clean.filter(e => allowed.has(e.user_id));
	const starts = new Set(all.filter(e => e.event_name === 'visit_started').map(e => `${e.user_id}:${e.session_id}`));
	const period = all.filter(e => time(e) >= since && time(e) <= now);
	const actorIds = new Set(period.map(e => e.user_id));
	const assessmentActorIds = new Set<string>();
	for (const assessment of input.phaseThree?.assessments ?? []) {
		if (allowed.has(assessment.user_id) && [assessment.started_at, assessment.completed_at].some(t => t && Date.parse(t) >= since && Date.parse(t) <= now)) assessmentActorIds.add(assessment.user_id);
	}
	const userEvents = new Map<string, StoredEvent[]>();
	for (const e of all) { const rows = userEvents.get(e.user_id) ?? []; rows.push(e); userEvents.set(e.user_id, rows); }
	const newUsers = includedUsers.filter(u => Date.parse(u.created_at) >= since && Date.parse(u.created_at) <= now);
	// Cohorts begin only where versioned tracking exists; legacy signups are never reconstructed.
	const cohort = newUsers.filter(u => coverageStart !== null && Date.parse(u.created_at) >= coverageStart);
	const funnel = [
		{ label: 'Signed up', count: cohort.length }, { label: 'Visited app', count: 0 },
		{ label: 'Opened lesson', count: 0 }, { label: 'Pressed Start', count: 0 },
		{ label: 'Answered a sentence', count: 0 }, { label: 'Finished lesson', count: 0 }
	];
	let eventual = 0;
	for (const user of cohort) {
		const events = (userEvents.get(user.id) ?? []).filter(e => time(e) <= now);
		if (!events.length) continue;
		funnel[1].count++;
		const firstVisit = events.filter(e => e.session_id === events[0].session_id);
		// Each subsequent step belongs to the SAME attempt and happens after the previous step.
		let best = 1;
		for (let i = 0; i < firstVisit.length; i++) {
			const opened = firstVisit[i];
			if (opened.event_name !== 'lesson_started' || !opened.attempt_id) continue;
			let reached = 2;
			for (const e of firstVisit.slice(i + 1)) {
				if (e.attempt_id !== opened.attempt_id) continue;
				if (reached === 2 && e.event_name === 'lesson_begun') reached = 3;
				else if (reached === 3 && e.event_name === 'answer_submitted' && e.metadata.mode === 'lesson') reached = 4;
				else if (reached === 4 && e.event_name === 'lesson_attempt_completed') reached = 5;
			}
			best = Math.max(best, reached);
		}
		for (let i = 2; i <= best; i++) funnel[i].count++;
		if (events.some(e => e.event_name === 'lesson_attempt_completed')) eventual++;
	}
	let eligible = 0, returned = 0;
	// Return is a second learning visit 24h–7d after the first, for new tracked accounts only.
	for (const u of cohort) {
		const learn = (userEvents.get(u.id) ?? []).filter(e => learningNames.has(e.event_name));
		const first = learn[0];
		if (!first || time(first) > now - 7 * DAY_MS) continue;
		eligible++;
		if (learn.some(e => e.session_id !== first.session_id && time(e) >= time(first) + DAY_MS && time(e) <= time(first) + 7 * DAY_MS)) returned++;
	}
	const learners = includedUsers.filter(u => actorIds.has(u.id) || assessmentActorIds.has(u.id) || newUsers.some(n => n.id === u.id)).map(user => {
		const events = period.filter(e => e.user_id === user.id);
		const visits = [...new Set(events.map(e => e.session_id))].map(id => {
			const rows = events.filter(e => e.session_id === id);
			return { id, first: rows[0].occurred_at, last: rows.at(-1)!.occurred_at,
				learning: rows.some(e => learningNames.has(e.event_name)), events: rows };
		});
		return { id: user.id, label: `Learner ${user.id.slice(-8)}`, signup: user.created_at,
			excluded: excluded.has(user.id), manualExclusion: input.exclusions.includes(user.id), automaticExclusion: user.is_admin || user.id === input.selfId,
			visits, activeDays: unique(events.filter(e => learningNames.has(e.event_name)).map(e => e.occurred_at.slice(0, 10))),
			attempts: unique(events.filter(e => e.attempt_id).map(e => e.attempt_id)),
			completed: unique(events.filter(e => e.event_name === 'lesson_attempt_completed').map(e => e.attempt_id)),
			last: events.at(-1) ?? null };
	}).sort((a, b) => Date.parse(b.last?.occurred_at ?? b.signup) - Date.parse(a.last?.occurred_at ?? a.signup));
	const obstacles = Object.entries(OBSTACLES).map(([code, label]) => {
		const events = period.filter(e => e.event_name === 'obstacle' && e.metadata.code === code);
		return { code, label, count: events.length, affected: unique(events.map(e => e.user_id)), userIds: [...new Set(events.map(e => e.user_id))] };
	}).sort((a, b) => b.affected - a.affected);
	return {
		days, since: new Date(since).toISOString(), snapshot: new Date(now).toISOString(), includeTests,
		newUsers: newUsers.length, visitors: actorIds.size,
		activeLearners: unique(period.filter(e => learningNames.has(e.event_name)).map(e => e.user_id)),
		// English lesson events carry the lesson's id, not the browser visit's: not visits.
		visits: unique(period.filter(e => !englishLessonEvent(e)).map(e => `${e.user_id}:${e.session_id}`)),
		affectedUsers: unique(period.filter(e => e.event_name === 'obstacle').map(e => e.user_id)),
		funnel, eventual, eligible, returned, learners, obstacles,
		lessonAnalysis: buildLessonReport(all, input.catalog ?? [], since, now, input.catalogError ?? null),
		returnVisits: buildReturnReport(all, includedUsers, coverageStart, since, now),
		englishLessons: buildEnglishLessonReport(all, includedUsers, since, now),
		phaseThree: buildPhaseThreeReport(input.phaseThree ?? unavailablePhaseThree(), includedUsers, all.filter(e => time(e) <= now), coverageStart, since, now),
		audioFallbacks: unique(period.filter(e => e.event_name === 'audio_fallback').map(e => e.user_id)),
		incorrectAnswers: period.filter(e => e.event_name === 'answer_submitted' && e.metadata.correct === false).length,
		quality: {
			installedAt: input.installedAt, firstEvent, latestEvent: clean.at(-1)?.occurred_at ?? null,
			latestReceived: clean.length ? clean.reduce((latest, e) => e.created_at > latest ? e.created_at : latest, clean[0].created_at) : null,
			legacyCount: input.legacyCount, versionedEvents: clean.length, periodEvents: period.length,
			excludedUsers: users.filter(u => excluded.has(u.id)).length, invalid, duplicates,
			missingVisitStart: unique(period.filter(e => !englishLessonEvent(e) && !starts.has(`${e.user_id}:${e.session_id}`)).map(e => `${e.user_id}:${e.session_id}`)),
			untrackedNewUsers: newUsers.filter(u => !userEvents.has(u.id)).length,
			lateEvents: clean.filter(e => Date.parse(e.created_at) - time(e) > 5 * 60_000).length,
			unknownUsers: clean.filter(e => !userIds.has(e.user_id)).length
		}
	};
}
export type InsightsReport = ReturnType<typeof buildReport>;
