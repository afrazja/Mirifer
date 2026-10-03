/**
 * What the learner did in each module of today's session, kept so that going
 * Back shows it (their steps, transcript, the feedback) without redoing it.
 *
 * Kept in this browser only, never sent to our server: it can hold what the
 * learner said. It belongs to one session (`startedAt`), so starting again
 * clears it, and it is gone if site data is cleared or on another device. A
 * module that finds nothing here simply shows "nothing saved".
 */
const KEY = 'mirifer_en_day_records_v1';
const MAX_BYTES = 200_000;

interface Stored { startedAt: string; records: Record<string, unknown> }

function read(): Stored | null {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return null;
		const value = JSON.parse(raw) as Stored;
		return value && typeof value.startedAt === 'string' && value.records && typeof value.records === 'object' ? value : null;
	} catch { return null; }
}

export function loadRecord(startedAt: string, moduleId: string): unknown {
	const stored = read();
	return stored && stored.startedAt === startedAt ? stored.records[moduleId] ?? null : null;
}

export function saveRecord(startedAt: string, moduleId: string, record: unknown): void {
	try {
		const stored = read();
		const records = stored && stored.startedAt === startedAt ? stored.records : {};
		const next = JSON.stringify({ startedAt, records: { ...records, [moduleId]: record } });
		if (next.length <= MAX_BYTES) localStorage.setItem(KEY, next);
	} catch { /* private mode or full: Back then shows "nothing saved" */ }
}

export function clearRecords(): void {
	try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}
