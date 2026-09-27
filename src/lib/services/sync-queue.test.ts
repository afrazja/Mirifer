import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import type { SyncOperation } from './sync-queue';

// ─── Mock all external dependencies ──────────────────────────────────────────

vi.mock('$lib/supabase/client', () => ({
	getSupabaseBrowserClient: vi.fn()
}));

vi.mock('$stores/sync', () => ({
	syncStore: { set: vi.fn() }
}));

vi.mock('./auth', () => ({
	getUser: vi.fn()
}));

vi.mock('$utils/error', () => ({
	logError: vi.fn(),
	logWarn: vi.fn()
}));

// ─── Import module under test after mocks ────────────────────────────────────

import {
	enqueue,
	flushQueue,
	cloudWrite,
	getSyncStatus,
	getPendingCount,
	clearQueue
} from './sync-queue';
import { getSupabaseBrowserClient } from '$lib/supabase/client';
import { syncStore } from '$stores/sync';
import { getUser } from './auth';
import { logError, logWarn } from '$utils/error';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const QUEUE_KEY = 'mirifer_sync_queue';
const USER_ID = 'user-abc123';

/** Write raw operations into localStorage so tests can pre-seed the queue. */
function seedQueue(ops: Partial<SyncOperation>[]): void {
	const full = ops.map((op, i) => ({
		type: op.type ?? 'progress_upsert',
		key: op.key ?? `key_${i}`,
		data: op.data ?? {},
		retries: op.retries ?? 0,
		createdAt: op.createdAt ?? Date.now()
	}));
	localStorage.setItem(QUEUE_KEY, JSON.stringify(full));
}

/** Read the queue directly from localStorage. */
function readQueue(): SyncOperation[] {
	const raw = localStorage.getItem(QUEUE_KEY);
	return raw ? JSON.parse(raw) : [];
}

/**
 * Build a mock Supabase client with both upsert and update+eq chains.
 * Both resolve successfully by default; pass { fail: true } to reject.
 */
function makeSbClient({ fail = false } = {}) {
	const resolve = fail
		? Promise.reject(new Error('Supabase error'))
		: Promise.resolve({ error: null });

	const eq = vi.fn().mockReturnValue(resolve);
	const update = vi.fn().mockReturnValue({ eq });
	const upsert = vi.fn().mockReturnValue(resolve);
	const from = vi.fn().mockReturnValue({ update, upsert });

	return { from, update, upsert, eq };
}

// Fake timers prevent setTimeout in scheduleRetry from firing between tests.
vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
afterAll(() => vi.useRealTimers());

beforeEach(() => {
	vi.clearAllMocks();
	vi.clearAllTimers();
	localStorage.clear();
	// Default: authenticated user, online
	vi.mocked(getUser).mockResolvedValue({ id: USER_ID } as any);
	vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
});

// ─── enqueue ──────────────────────────────────────────────────────────────────

describe('resolved database errors', () => {
	it('keeps an unsuccessful progress write queued even when Supabase resolves the promise', async () => {
		const client = makeSbClient();
		client.upsert.mockResolvedValue({ error: { code: '42501', message: 'Permission denied' } });
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(client as any);
		await cloudWrite('progress_upsert', 'progress', { current_day: 1 });
		expect(getPendingCount()).toBe(1);
	});
});

describe('enqueue', () => {
	it('adds a new operation to the localStorage queue', () => {
		enqueue({ type: 'progress_upsert', key: 'progress', data: { current_day: 2 } });

		const queue = readQueue();
		expect(queue).toHaveLength(1);
		expect(queue[0].type).toBe('progress_upsert');
		expect(queue[0].key).toBe('progress');
		expect(queue[0].data).toEqual({ current_day: 2 });
		expect(queue[0].retries).toBe(0);
	});

	it('deduplicates: same type+key replaces the existing entry', () => {
		enqueue({ type: 'profile_update', key: 'language', data: { language: 'en' } });
		enqueue({ type: 'profile_update', key: 'language', data: { language: 'fa' } });

		const queue = readQueue();
		expect(queue).toHaveLength(1);
		expect(queue[0].data).toEqual({ language: 'fa' });
	});

	it('keeps two ops with the same type but different keys', () => {
		enqueue({ type: 'profile_update', key: 'language', data: { language: 'en' } });
		enqueue({ type: 'profile_update', key: 'voice_speed', data: { voice_speed: 0.8 } });

		expect(readQueue()).toHaveLength(2);
	});

	it('resets retries to 0 when deduplicating', () => {
		seedQueue([{ type: 'progress_upsert', key: 'progress', retries: 3 }]);
		enqueue({ type: 'progress_upsert', key: 'progress', data: {} });

		expect(readQueue()[0].retries).toBe(0);
	});

	it('calls syncStore.set with pending status', () => {
		enqueue({ type: 'progress_upsert', key: 'progress', data: {} });

		expect(vi.mocked(syncStore).set).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'pending' })
		);
	});
});

// ─── getSyncStatus ────────────────────────────────────────────────────────────

describe('getSyncStatus', () => {
	it('returns "synced" when queue is empty and online', () => {
		expect(getSyncStatus()).toBe('synced');
	});

	it('returns "pending" when the queue has items', () => {
		seedQueue([{ type: 'progress_upsert', key: 'k' }]);
		expect(getSyncStatus()).toBe('pending');
	});

	it('returns "offline" when navigator.onLine is false and queue is empty', () => {
		vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
		expect(getSyncStatus()).toBe('offline');
	});
});

// ─── getPendingCount ──────────────────────────────────────────────────────────

describe('getPendingCount', () => {
	it('returns 0 for an empty queue', () => {
		expect(getPendingCount()).toBe(0);
	});

	it('returns the correct count after enqueueing', () => {
		enqueue({ type: 'progress_upsert', key: 'a', data: {} });
		enqueue({ type: 'profile_update', key: 'b', data: {} });
		expect(getPendingCount()).toBe(2);
	});
});

// ─── clearQueue ───────────────────────────────────────────────────────────────

describe('clearQueue', () => {
	it('empties the localStorage queue', () => {
		seedQueue([{ type: 'progress_upsert', key: 'k' }, { type: 'sr_single', key: 'k2' }]);
		clearQueue();
		expect(readQueue()).toHaveLength(0);
	});

	it('calls syncStore.set with synced status', () => {
		clearQueue();
		expect(vi.mocked(syncStore).set).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'synced', pendingCount: 0 })
		);
	});
});

// ─── flushQueue ───────────────────────────────────────────────────────────────

describe('flushQueue', () => {
	it('updates status to "synced" and returns without calling Supabase when queue is empty', async () => {
		const sb = makeSbClient();
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);

		await flushQueue();

		expect(sb.from).not.toHaveBeenCalled();
		expect(vi.mocked(syncStore).set).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'synced' })
		);
	});

	it('updates status to "offline" and does not call Supabase when navigator is offline', async () => {
		vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
		seedQueue([{ type: 'progress_upsert', key: 'k' }]);
		const sb = makeSbClient();
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);

		await flushQueue();

		expect(sb.from).not.toHaveBeenCalled();
		expect(vi.mocked(syncStore).set).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'offline' })
		);
	});

	it('clears the queue without calling Supabase when user is not authenticated', async () => {
		vi.mocked(getUser).mockResolvedValue(null as any);
		seedQueue([{ type: 'progress_upsert', key: 'k' }]);
		const sb = makeSbClient();
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);

		await flushQueue();

		expect(sb.from).not.toHaveBeenCalled();
		expect(readQueue()).toHaveLength(0);
	});

	it('executes profile_update via .update().eq()', async () => {
		const sb = makeSbClient();
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);
		seedQueue([{ type: 'profile_update', key: 'language', data: { language: 'en' } }]);

		await flushQueue();

		expect(sb.from).toHaveBeenCalledWith('user_profiles');
		expect(sb.update).toHaveBeenCalledWith(expect.objectContaining({ language: 'en' }));
		expect(sb.eq).toHaveBeenCalledWith('id', USER_ID);
	});

	it('executes progress_upsert via .upsert()', async () => {
		const sb = makeSbClient();
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);
		seedQueue([{ type: 'progress_upsert', key: 'progress', data: { current_day: 3 } }]);

		await flushQueue();

		expect(sb.from).toHaveBeenCalledWith('user_progress');
		expect(sb.upsert).toHaveBeenCalledWith(
			expect.objectContaining({ user_id: USER_ID, current_day: 3 }),
			expect.objectContaining({ onConflict: 'user_id' })
		);
	});

	it('executes sr_single via .upsert()', async () => {
		const sb = makeSbClient();
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);
		seedQueue([{
			type: 'sr_single',
			key: 'sr_1_1',
			data: { day: 1, sentence_id: 1, ease: 2.5, interval_days: 3, next_review: 0, attempts: 1, successes: 1 }
		}]);

		await flushQueue();

		expect(sb.from).toHaveBeenCalledWith('spaced_repetition');
		expect(sb.upsert).toHaveBeenCalledWith(
			expect.objectContaining({ user_id: USER_ID, day: 1 }),
			expect.objectContaining({ onConflict: 'user_id,day,sentence_id' })
		);
	});

	it('executes sr_upsert (bulk) via .upsert() with user_id injected into each row', async () => {
		const sb = makeSbClient();
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);
		seedQueue([{
			type: 'sr_upsert',
			key: 'sr_bulk',
			data: {
				rows: [
					{ day: 1, sentence_id: 1, ease: 2.5, interval_days: 1, next_review: 0, attempts: 1, successes: 0 },
					{ day: 1, sentence_id: 2, ease: 2.5, interval_days: 1, next_review: 0, attempts: 1, successes: 1 }
				]
			}
		}]);

		await flushQueue();

		expect(sb.from).toHaveBeenCalledWith('spaced_repetition');
		const upsertArg = vi.mocked(sb.upsert).mock.calls[0][0] as any[];
		expect(upsertArg).toHaveLength(2);
		expect(upsertArg[0].user_id).toBe(USER_ID);
		expect(upsertArg[1].user_id).toBe(USER_ID);
	});

	it('skips Supabase call for sr_upsert with empty rows', async () => {
		const sb = makeSbClient();
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);
		seedQueue([{ type: 'sr_upsert', key: 'sr_bulk', data: { rows: [] } }]);

		await flushQueue();

		expect(sb.upsert).not.toHaveBeenCalled();
	});

	it('executes exam_upsert via .upsert()', async () => {
		const sb = makeSbClient();
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);
		seedQueue([{
			type: 'exam_upsert',
			key: 'exam_week_1',
			data: { week_number: 1, score: 8, total: 10, percentage: 80, wrong_answers: [], taken_at: 1700000000 }
		}]);

		await flushQueue();

		expect(sb.from).toHaveBeenCalledWith('exam_results');
		expect(sb.upsert).toHaveBeenCalledWith(
			expect.objectContaining({ user_id: USER_ID, week_number: 1 }),
			expect.objectContaining({ onConflict: 'user_id,week_number' })
		);
	});

	it('logs a warning for an unknown operation type and removes it from the queue', async () => {
		const sb = makeSbClient();
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);
		seedQueue([{ type: 'unknown_type', key: 'k', data: {} }]);

		await flushQueue();

		expect(logWarn).toHaveBeenCalledWith(
			'sync-queue:executeCloudWrite',
			expect.stringContaining('unknown_type')
		);
		// Op is not re-queued (it's not a retryable error, just unknown)
		expect(readQueue()).toHaveLength(0);
	});

	it('increments retries and keeps the op in the queue on Supabase error', async () => {
		const sb = makeSbClient({ fail: true });
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);
		seedQueue([{ type: 'progress_upsert', key: 'progress', data: {}, retries: 0 }]);

		await flushQueue();

		const queue = readQueue();
		expect(queue).toHaveLength(1);
		expect(queue[0].retries).toBe(1);
	});

	it('drops an op after MAX_RETRIES (5) and logs an error', async () => {
		const sb = makeSbClient({ fail: true });
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);
		// retries is already at MAX_RETRIES - 1 (4); one more failure → drop
		seedQueue([{ type: 'progress_upsert', key: 'progress', data: {}, retries: 4 }]);

		await flushQueue();

		expect(readQueue()).toHaveLength(0);
		expect(logError).toHaveBeenCalledWith(
			'sync-queue:flushQueue',
			expect.stringContaining('progress_upsert')
		);
	});

	it('sets status to "synced" after all ops succeed', async () => {
		const sb = makeSbClient();
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);
		seedQueue([{ type: 'progress_upsert', key: 'progress', data: {} }]);

		await flushQueue();

		expect(vi.mocked(syncStore).set).toHaveBeenLastCalledWith(
			expect.objectContaining({ status: 'synced', pendingCount: 0 })
		);
	});

	it('sets status to "pending" when failed ops remain after flush', async () => {
		const sb = makeSbClient({ fail: true });
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);
		seedQueue([{ type: 'progress_upsert', key: 'progress', data: {}, retries: 0 }]);

		await flushQueue();

		expect(vi.mocked(syncStore).set).toHaveBeenLastCalledWith(
			expect.objectContaining({ status: 'pending' })
		);
	});

	it('processes multiple ops in a single flush', async () => {
		const sb = makeSbClient();
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);
		seedQueue([
			{ type: 'progress_upsert', key: 'progress', data: { current_day: 1 } },
			{ type: 'profile_update', key: 'language', data: { language: 'fa' } }
		]);

		await flushQueue();

		expect(sb.from).toHaveBeenCalledTimes(2);
		expect(readQueue()).toHaveLength(0);
	});
});

// ─── cloudWrite ───────────────────────────────────────────────────────────────

describe('cloudWrite', () => {
	it('drops an older queued write for the same thing once a newer write succeeds', async () => {
		seedQueue([
			{ type: 'profile_update', key: 'language', data: { language: 'fa' } },
			{ type: 'profile_update', key: 'voice_speed', data: { voice_speed: 1 } }
		]);
		const sb = makeSbClient();
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);

		await cloudWrite('profile_update', 'language', { language: 'en' });

		expect(readQueue()).toEqual([expect.objectContaining({ key: 'voice_speed' })]);
	});

	it('calls Supabase immediately when online and authenticated', async () => {
		const sb = makeSbClient();
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);

		await cloudWrite('progress_upsert', 'progress', { current_day: 5 });

		expect(sb.from).toHaveBeenCalledWith('user_progress');
		expect(readQueue()).toHaveLength(0);
	});

	it('returns early without calling Supabase when user is not authenticated', async () => {
		vi.mocked(getUser).mockResolvedValue(null as any);
		const sb = makeSbClient();
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);

		await cloudWrite('progress_upsert', 'progress', { current_day: 5 });

		expect(sb.from).not.toHaveBeenCalled();
		expect(readQueue()).toHaveLength(0);
	});

	it('enqueues the operation instead of writing when navigator is offline', async () => {
		vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

		await cloudWrite('progress_upsert', 'progress', { current_day: 5 });

		const queue = readQueue();
		expect(queue).toHaveLength(1);
		expect(queue[0].type).toBe('progress_upsert');
		expect(queue[0].data).toEqual({ current_day: 5 });
	});

	it('enqueues the operation when the immediate Supabase write fails', async () => {
		const sb = makeSbClient({ fail: true });
		vi.mocked(getSupabaseBrowserClient).mockReturnValue(sb as any);

		await cloudWrite('progress_upsert', 'progress', { current_day: 5 });

		expect(readQueue()).toHaveLength(1);
		expect(logWarn).toHaveBeenCalledWith(
			'sync-queue:cloudWrite',
			expect.stringContaining('progress_upsert')
		);
	});
});
