import { describe, it, expect, vi } from 'vitest';
vi.mock('$env/dynamic/private', () => ({ env: { ADMIN_EMAIL: 'owner@m.test' } }));
import { load, actions } from './+page.server';
import { EMPTY_PROGRESS } from '$lib/practice/english-progress';
import { chapterSteps } from '$lib/practice/path';
import { DAY_ONE } from '$lib/practice/day';

const PROFILE = { reason: 'travel', comfort: 'simple', minutes: 15, skipped: false, completedAt: '2026-10-01T10:00:00.000Z' };
function fixture(meta: Record<string, unknown> = {}, form: Record<string, string> = {}, { email = 'afraz.jva@gmail.com', query = '' } = {}) {
	const user = { id: 'u1', email, email_confirmed_at: '2026-01-01T00:00:00Z', user_metadata: { target_language: 'en', display_name: 'Sam', english_profile_v1: PROFILE, ...meta } };
	const inserted: any[] = [];
	const supabase = {
		auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }), updateUser: vi.fn().mockResolvedValue({ error: null }) },
		from: vi.fn(() => ({ insert: vi.fn(async (rows: any[]) => { inserted.push(...rows); return { error: null }; }) }))
	};
	const body = new FormData(); for (const [k, v] of Object.entries(form)) body.set(k, v);
	return { supabase, inserted, saved: () => supabase.auth.updateUser.mock.calls.at(-1)?.[0]?.data, event: () => ({ locals: { supabase }, url: new URL(`https://mirifer.test/practice/english/step${query}`), parent: async () => ({ labAccess: false }), request: new Request('https://mirifer.test/practice/english/step', { method: 'POST', body }) }) as any };
}
const intermediate = chapterSteps(DAY_ONE, 'intermediate');
const doneAll = (steps: string[], day = 1) => Object.fromEntries(steps.map(s => [s, ['i', day]]));

describe('step page', () => {
	it('is for every learner now, not only the test accounts', async () => {
		expect(await load(fixture({}, {}, { email: 'someone@m.test' }).event())).toMatchObject({ step: intermediate[0] });
		expect(await actions.result(fixture({}, { step: intermediate[0], outcome: 'done' }, { email: 'someone@m.test' }).event())).toMatchObject({ goalJustMet: true });
	});
	it('opens a new learner’s first step', async () => {
		expect(await load(fixture().event())).toMatchObject({ step: 'day-1:listen-act', index: 0, total: 5, replay: false, startedAt: null });
	});
	it('opens a done step again as a replay, but never one ahead', async () => {
		const meta = { english_path_v1: { done: doneAll(intermediate.slice(0, 2)), skipped: [], current: null } };
		expect(await load(fixture(meta, {}, { query: `?step=${intermediate[0]}` }).event())).toMatchObject({ step: intermediate[0], replay: true });
		expect(await load(fixture(meta, {}, { query: `?step=${intermediate[4]}` }).event())).toMatchObject({ step: intermediate[2] });
	});
	it('starts a step once, keeping its start', async () => {
		const f = fixture({}, { step: intermediate[0] });
		const first = await actions.start(f.event()) as { startedAt: string };
		expect(f.saved().english_path_v1.current).toMatchObject({ step: intermediate[0], replay: false });
		const again = fixture({ english_path_v1: f.saved().english_path_v1 }, { step: intermediate[0] });
		expect(await actions.start(again.event())).toEqual({ startedAt: first.startedAt });
		expect(again.supabase.auth.updateUser).not.toHaveBeenCalled();
		expect(await actions.start(fixture({}, { step: intermediate[3] }).event())).toMatchObject({ status: 400 });
	});
	it('counts a step opened once (for the admin’s "left" and "time in step"), never on a reload', async () => {
		const f = fixture({}, { step: intermediate[0], utcOffset: '210' });
		const { startedAt } = await actions.start(f.event()) as { startedAt: string };
		expect(f.inserted).toHaveLength(1);
		expect(f.inserted[0]).toMatchObject({ event_name: 'step_opened', day: 1, occurred_at: startedAt, user_id: 'u1' });
		expect(f.inserted[0].metadata).toEqual({ course: 'en', flow: 'path', track: 'intermediate', module: 'listen-act', index: 0, utc_offset_min: 210 });
		const again = fixture({ english_path_v1: f.saved().english_path_v1 }, { step: intermediate[0] });
		await actions.start(again.event());
		expect(again.inserted).toEqual([]);
		// A done step opened again is marked as a replay.
		const replay = fixture({ english_path_v1: { done: doneAll([intermediate[0]]), skipped: [], current: null } }, { step: intermediate[0] });
		await actions.start(replay.event());
		expect(replay.inserted[0].metadata).toMatchObject({ module: 'listen-act', replay: true });
	});
	it('keeps the seconds in a step done in one sitting, and none for a step left open for days', async () => {
		const started = new Date(Date.now() - 95_000).toISOString();
		const sitting = { english_path_v1: { done: {}, skipped: [], current: { step: intermediate[0], track: 'intermediate', startedAt: started, replay: false } } };
		const f = fixture(sitting, { step: intermediate[0], outcome: 'done' });
		await actions.result(f.event());
		const progress = f.inserted.find(row => row.event_name === 'lesson_progress');
		expect(progress.metadata.flow).toBe('path');
		expect(progress.metadata.seconds).toBeGreaterThanOrEqual(94);
		expect(progress.metadata.seconds).toBeLessThanOrEqual(100);
		const days = { english_path_v1: { ...sitting.english_path_v1, current: { ...sitting.english_path_v1.current, startedAt: new Date(Date.now() - 3 * 86_400_000).toISOString() } } };
		const g = fixture(days, { step: intermediate[0], outcome: 'done' });
		await actions.result(g.event());
		expect(g.inserted.find(row => row.event_name === 'lesson_progress').metadata.seconds).toBeUndefined();
	});
	it('saves a step done, meets the daily goal once, and keeps the old progress record current', async () => {
		const f = fixture({}, { step: intermediate[0], outcome: 'done', score: JSON.stringify({ correct: 5, total: 6 }), utcOffset: '210' });
		expect(await actions.result(f.event())).toEqual({ goalJustMet: true, chapterDone: false, skippedHere: [], next: intermediate[1], nextIsReplay: false });
		const data = f.saved();
		expect(data.english_path_v1.done[intermediate[0]][0]).toBe('i');
		expect(data.english_progress_v1).toMatchObject({ sessionsCompleted: 1, lastThemeId: 'day-1', finishedDays: [] });
		expect(f.inserted.map(row => row.event_name)).toEqual(['lesson_started', 'lesson_progress']);
		expect(f.inserted[1].metadata).toMatchObject({ course: 'en', module: 'listen-act', outcome: 'done', index: 0, utc_offset_min: 210 });
		const second = fixture({ english_path_v1: data.english_path_v1, english_progress_v1: data.english_progress_v1 }, { step: intermediate[1], outcome: 'done', utcOffset: '210' });
		expect(await actions.result(second.event())).toMatchObject({ goalJustMet: false });
	});
	it('ends the chapter, adds it to the finished days, and offers a step skipped in it', async () => {
		const meta = { english_path_v1: { done: doneAll([intermediate[0], intermediate[1], intermediate[3]]), skipped: [intermediate[2]], current: null }, english_progress_v1: EMPTY_PROGRESS };
		const f = fixture(meta, { step: intermediate[4], outcome: 'done' });
		expect(await actions.result(f.event())).toMatchObject({ chapterDone: true, skippedHere: [intermediate[2]], next: 'day-2:listen-act' });
		expect(f.saved().english_progress_v1.finishedDays).toEqual(['day-1']);
		expect(f.inserted.map(row => row.event_name)).toEqual(['lesson_progress', 'lesson_completed']);
		expect(f.inserted[1].metadata).toMatchObject({ done: 4, skipped: 1, total: 5 });
	});
	it('marks a replay, and offers the next replay when nothing new is left', async () => {
		const all = ['day-1', 'day-2', 'day-3', 'everyday-1', 'everyday-2']; // the test accounts also see the pilot Everyday chapters
		const meta = { english_progress_v1: { ...EMPTY_PROGRESS, lastThemeId: 'day-3', finishedDays: all } };
		const f = fixture(meta, { step: intermediate[1], outcome: 'done' });
		const result = await actions.result(f.event()) as any;
		expect(result).toMatchObject({ goalJustMet: true, chapterDone: false, nextIsReplay: true });
		expect(result.next).not.toBe(intermediate[1]);
		expect(f.inserted[0].metadata).toMatchObject({ replay: true });
	});
	it('saves a rating (1–5) only for a step the learner did', async () => {
		const meta = { english_path_v1: { done: doneAll([intermediate[0]]), skipped: [], current: null } };
		const f = fixture(meta, { step: intermediate[0], rating: '4' });
		expect(await actions.rate(f.event())).toEqual({ rated: 4 });
		expect(f.inserted[0]).toMatchObject({ event_name: 'step_rated', day: 1, metadata: { course: 'en', module: 'listen-act', track: 'intermediate', rating: 4 } });
		expect(await actions.rate(fixture(meta, { step: intermediate[1], rating: '4' }).event())).toMatchObject({ status: 400 });
		expect(await actions.rate(fixture(meta, { step: intermediate[0], rating: '9' }).event())).toMatchObject({ status: 400 });
	});
	it('keeps the step’s result on its event', async () => {
		const f = fixture({}, { step: intermediate[0], outcome: 'done', score: JSON.stringify({ correct: 3, total: 4 }) });
		await actions.result(f.event());
		expect(f.inserted.find(row => row.event_name === 'lesson_progress').metadata.percentage).toBe(75);
	});
	it('refuses a bad result', async () => {
		expect(await actions.result(fixture({}, { step: intermediate[0], outcome: 'maybe' }).event())).toMatchObject({ status: 400 });
		expect(await actions.result(fixture({}, { step: 'day-9:phrases', outcome: 'done' }).event())).toMatchObject({ status: 400 });
	});
});
