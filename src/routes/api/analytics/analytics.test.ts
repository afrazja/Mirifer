import { describe, it, expect, vi } from 'vitest';
import { POST } from './+server';
const uid = '00000000-0000-4000-8000-000000000001';
function event() { return { event_id: crypto.randomUUID(), session_id: crypto.randomUUID(), attempt_id: null, event_name: 'page_viewed', day: null, occurred_at: new Date().toISOString(), schema_version: 2, metadata: { page: 'home', transcript: 'PRIVATE' } }; }
function call(body: unknown, options: { user?: boolean; origin?: string; failure?: boolean } = {}) {
	const upsert = vi.fn().mockResolvedValue({ error: options.failure ? { code: '42501' } : null });
	const request = new Request('https://mirifer.test/api/analytics', { method: 'POST', headers: { Origin: options.origin ?? 'https://mirifer.test', 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
	const locals = { supabase: { auth: { getUser: async () => ({ data: { user: options.user === false ? null : { id: uid } }, error: null }) }, from: () => ({ upsert }) } };
	return { result: POST({ request, locals } as any), upsert };
}
describe('analytics ingestion boundary', () => {
	it('requires a verified account, matching owner, and same origin', async () => {
		expect((await call({ user_id: uid, events: [event()] }, { user: false }).result).status).toBe(401);
		expect((await call({ user_id: 'someone-else', events: [event()] }).result).status).toBe(400);
		expect((await call({ user_id: uid, events: [event()] }, { origin: 'https://other.test' }).result).status).toBe(403);
	});
	it('strips raw content, uses the verified identity and deduplicates by stable event ID', async () => {
		const row = event(); const { result, upsert } = call({ user_id: uid, events: [row] });
		expect((await result).status).toBe(200);
		expect(upsert).toHaveBeenCalledWith([expect.objectContaining({ user_id: uid, event_id: row.event_id, metadata: { page: 'home' } })], { onConflict: 'event_id', ignoreDuplicates: true });
	});
	it('reports resolved database failures as retryable failures', async () => {
		expect((await call({ user_id: uid, events: [event()] }, { failure: true }).result).status).toBe(503);
	});
	it('rejects unknown schemas, oversized batches and invalid timestamps', async () => {
		for (const events of [[{ ...event(), schema_version: 1 }], Array.from({ length: 51 }, event), [{ ...event(), occurred_at: 'bad' }]]) {
			const test = call({ user_id: uid, events }); expect((await test.result).status).toBe(400); expect(test.upsert).not.toHaveBeenCalled();
		}
	});
	it('drops events only the server writes, so nobody can add steps or AI use to the admin’s numbers', async () => {
		const forged = [
			{ ...event(), event_name: 'step_opened', metadata: { course: 'en', module: 'traps' } },
			{ ...event(), event_name: 'lesson_progress', metadata: { course: 'en', module: 'traps', outcome: 'done' } },
			{ ...event(), event_name: 'english_ai_outcome', metadata: { course: 'en', route: 'chat', ai_result: 'ok' } }
		];
		// The German lessons still send their own lesson events from the browser.
		const german = { ...event(), event_name: 'lesson_progress', metadata: { sequence: 3 } };
		const { result, upsert } = call({ user_id: uid, events: [...forged, german] });
		expect(await (await result).json()).toEqual({ accepted: 1 });
		expect(upsert.mock.calls[0][0]).toEqual([expect.objectContaining({ event_id: german.event_id, event_name: 'lesson_progress' })]);
		const only = call({ user_id: uid, events: forged });
		expect(await (await only.result).json()).toEqual({ accepted: 0 });
		expect(only.upsert).not.toHaveBeenCalled();
	});
});
