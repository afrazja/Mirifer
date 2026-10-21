/**
 * fetch for the practice modules' AI and voice routes. When a route says the day's limit is used
 * up (429 "Daily … limit reached"), `dailyLimit` says which one, so the page can show a calm
 * "come back tomorrow" instead of "check your connection" and an endless retry.
 */
import { writable } from 'svelte/store';

export type DailyLimit = 'voice' | 'practice' | 'lesson';
export const dailyLimit = writable<DailyLimit | null>(null);

const LIMITS: Record<string, DailyLimit> = {
	'Daily voice limit reached': 'voice',
	'Daily practice limit reached': 'practice',
	'Daily AI limit reached': 'lesson'
};

export async function practiceFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
	const response = await fetch(input, init);
	if (response.status === 429) {
		try {
			const data = await response.clone().json() as { error?: unknown };
			const limit = typeof data?.error === 'string' ? LIMITS[data.error] : undefined;
			if (limit) dailyLimit.set(limit);
		} catch { /* not JSON: a per-minute limit; the module's own retry message applies */ }
	}
	return response;
}
