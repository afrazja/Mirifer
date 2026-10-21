import { describe, it, expect, vi } from 'vitest';
vi.mock('$env/dynamic/private', () => ({ env: {} }));
import { load } from './+page.server';
import { RETELL_PIECES } from '$lib/practice/retell';
import { ALL_RETELL_PIECES, retellPieceFor } from '$lib/practice/day-content';

const profile = (comfort: string) => ({ reason: 'travel', comfort, minutes: 15, skipped: false, completedAt: '2026-10-01T10:00:00.000Z' });
const progress = (lastThemeId: string | null) => ({ sessionsCompleted: 1, lastCompletedAt: '2026-10-02T10:00:00.000Z', lastThemeId, lastResult: 'ok', recent: [] });
const event = (meta: Record<string, unknown>, owner = false) => ({
	locals: { supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1', user_metadata: { target_language: 'en', ...meta } } }, error: null }) } } },
	parent: async () => ({ labAccess: owner })
}) as any;
const own = RETELL_PIECES.map(piece => piece.id);

describe('Listen and retell in Practice', () => {
	it('gives learners the practice stories, and a lesson’s story only after that day, in its version', async () => {
		const dayTwo = retellPieceFor('day-2')!.id, dayThree = retellPieceFor('day-3')!.id;
		expect((await load(event({ english_profile_v1: profile('natural') })) as any).visible).toEqual(own);
		expect((await load(event({ english_profile_v1: profile('natural'), english_progress_v1: progress('day-2') })) as any).visible).toEqual([...own, dayTwo]);
		expect((await load(event({ english_profile_v1: profile('natural'), english_progress_v1: progress('day-3') })) as any).visible).toEqual([...own, dayTwo, dayThree]);
		// Intermediate never had these stories in a lesson.
		expect((await load(event({ english_profile_v1: profile('simple'), english_progress_v1: progress('day-3') })) as any).visible).toEqual(own);
	});
	it('gives the owner every story', async () => {
		expect((await load(event({}, true)) as any).visible).toEqual(ALL_RETELL_PIECES.map(piece => piece.id));
	});
});
