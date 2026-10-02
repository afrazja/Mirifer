/**
 * Small in-memory sliding-window limiter for the audio proxies.
 *
 * Best effort by design: each serverless instance keeps its own counts, so
 * this stops bursts and scripts, not a patient attacker spread across
 * instances. The durable daily allowance lives in the database (see
 * `spendAllowance` in english-ai.ts).
 */
import { json } from '@sveltejs/kit';
import type { User } from '@supabase/supabase-js';

const MAX_KEYS = 5000;

export function createLimiter(max: number, windowMs: number) {
	const hits = new Map<string, number[]>();
	return (key: string, now = Date.now()): boolean => {
		const recent = (hits.get(key) ?? []).filter(time => now - time < windowMs);
		if (recent.length >= max) { hits.set(key, recent); return false; }
		recent.push(now);
		hits.delete(key); hits.set(key, recent); // keeps insertion order = recency
		if (hits.size > MAX_KEYS) { const oldest = hits.keys().next().value; if (oldest !== undefined) hits.delete(oldest); }
		return true;
	};
}

export const tooMany = () => json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '30' } });

/** The verified signed-in user (a server round trip, not the cookie alone), or null. */
export async function verifiedUser(locals: App.Locals): Promise<User | null> {
	try {
		const { data: { user }, error } = await locals.supabase.auth.getUser();
		return error ? null : user;
	} catch { return null; }
}
