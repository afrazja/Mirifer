/**
 * A fake `events` table for the English AI routes' tests: answers today's counts per event name
 * (the AI allowance, the Practice budget) and the clip rows the voice budget reads, and records
 * every insert.
 */
import { vi } from 'vitest';

export interface EventCounts {
	/** english_ai_requested today (the daily lesson's allowance). */
	ai?: number;
	/** english_practice_ai today. */
	practice?: number;
	/** english_clip_transcribed today, and their total audio seconds. */
	clips?: number;
	clipSeconds?: number;
}

export function fakeEvents(counts: EventCounts = {}, onInsert?: (row: Record<string, unknown>) => void) {
	const inserted: Record<string, unknown>[] = [];
	const countFor = (name: string) => name === 'english_practice_ai' ? counts.practice ?? 0 : name === 'english_clip_transcribed' ? counts.clips ?? 0 : counts.ai ?? 0;
	const clipRows = () => {
		const n = counts.clips ?? 0, each = n ? (counts.clipSeconds ?? 0) / n : 0;
		return Array.from({ length: n }, () => ({ metadata: { audio_seconds: each } }));
	};
	const from = vi.fn(() => {
		let name = '';
		const query: Record<string, unknown> = {};
		Object.assign(query, {
			select: () => query,
			eq: (column: string, value: string) => { if (column === 'event_name') name = value; return query; },
			gte: () => query,
			limit: () => Promise.resolve({ data: clipRows(), error: null }),
			maybeSingle: () => Promise.resolve({ data: null, error: null }),
			// Awaited directly: a head count.
			then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) => Promise.resolve({ count: countFor(name), error: null }).then(resolve, reject),
			insert: (row: Record<string, unknown>) => { inserted.push(row); onInsert?.(row); return Promise.resolve({ error: null }); }
		});
		return query;
	});
	/** Inserted rows of one event name. */
	const rows = (name: string) => inserted.filter(row => row.event_name === name);
	return { from, inserted, rows };
}
