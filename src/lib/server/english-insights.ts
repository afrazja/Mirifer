/**
 * Loads the admin's English report (src/lib/analytics/english-insights.ts): every account with its
 * profile data, the English and visit events, test-account marks and sign-up sources. Needs the
 * service role (the account list and everyone's events are private).
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { StoredEvent } from '$lib/analytics/contract';
import { buildEnglishInsights, type InsightUser } from '$lib/analytics/english-insights';
import { isAdminEmail } from '$lib/server/admin-auth';
import { RESET_ENGLISH_EMAILS } from '$lib/server/test-accounts';

/** The events the report reads (visits, the lessons, and the AI the lessons use). */
const EVENT_NAMES = ['visit_started', 'lesson_started', 'lesson_progress', 'lesson_completed', 'english_clip_transcribed', 'english_ai_requested', 'english_practice_ai', 'step_rated', 'step_opened', 'english_ai_outcome', 'obstacle'];

/** Reads every page of a query (Supabase returns at most 1,000 rows at a time). */
async function readAll<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>, cap = 200_000): Promise<T[]> {
	const rows: T[] = [];
	for (let from = 0; from < cap; from += 1000) {
		const { data, error } = await query(from, from + 999);
		if (error) throw new Error('A report query failed.');
		rows.push(...(data ?? []));
		if (!data || data.length < 1000) return rows;
	}
	throw new Error('Too many rows for one report.');
}

export async function loadEnglishInsights(db: SupabaseClient | null, opts: { days: number; includeTests: boolean; now?: number }) {
	if (!db) return { status: 'unavailable' as const, reason: 'Set SUPABASE_SERVICE_ROLE_KEY in the server environment to see the report.', report: null };
	const now = opts.now ?? Date.now();
	try {
		const [profiles, exclusions, events, acquisition] = await Promise.all([
			readAll<{ id: string; is_admin: boolean }>((from, to) => db.from('user_profiles').select('id, is_admin').order('id').range(from, to)),
			readAll<{ user_id: string }>((from, to) => db.from('analytics_exclusions').select('user_id').order('user_id').range(from, to)),
			readAll<StoredEvent>((from, to) => db.from('events').select('event_id,user_id,session_id,attempt_id,event_name,day,occurred_at,created_at,schema_version,metadata').in('event_name', EVENT_NAMES).order('id').range(from, to)),
			readAll<{ user_id: string; source: string }>((from, to) => db.from('analytics_acquisition').select('user_id, source').order('user_id').range(from, to)).catch(() => [])
		]);
		const admins = new Set(profiles.filter(p => p.is_admin).map(p => p.id));
		const excluded = new Set(exclusions.map(e => e.user_id));
		const users: InsightUser[] = [];
		for (let page = 1; page <= 100; page++) {
			const result = await db.auth.admin.listUsers({ page, perPage: 1000 });
			if (result.error) throw new Error('The account list is unavailable. Check the server service role key.');
			for (const u of result.data.users) users.push({
				id: u.id, email: u.email ?? '', created_at: u.created_at, last_sign_in_at: u.last_sign_in_at ?? null,
				meta: (u.user_metadata ?? {}) as Record<string, unknown>,
				// The owner's test accounts count as test accounts without marking them by hand.
				isAdmin: isAdminEmail(u.email) || admins.has(u.id), excluded: excluded.has(u.id) || (RESET_ENGLISH_EMAILS as readonly string[]).includes((u.email ?? '').toLowerCase())
			});
			if (!result.data.nextPage || result.data.users.length < 1000) break;
		}
		return { status: 'ready' as const, reason: null, report: buildEnglishInsights({ users, events: events.map(e => ({ ...e, metadata: e.metadata ?? {} })), acquisition, days: opts.days, includeTests: opts.includeTests, now }) };
	} catch (error) {
		return { status: 'unavailable' as const, reason: error instanceof Error ? error.message : 'The report could not load.', report: null };
	}
}
