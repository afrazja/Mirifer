import { describe, it, expect, vi, beforeEach } from 'vitest';
const { env, transcribeMock } = vi.hoisted(() => ({ env: {} as Record<string, string | undefined>, transcribeMock: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env }));
vi.mock('$lib/server/transcribe', () => ({ transcribe: transcribeMock, transcriptionConfigured: () => true }));
import { MAX_DAILY_AUDIO_SECONDS, MAX_DAILY_CLIPS, MAX_DAILY_PRACTICE, chargePractice, checkClipBudget, meteredTranscribe } from './english-ai';
import { fakeEvents } from '../../test/english-events';

const user = { id: 'u1', email: 'a@b.c', user_metadata: { target_language: 'en' } } as any;
const locals = (events: ReturnType<typeof fakeEvents>) => ({ supabase: { from: events.from } }) as any;
const audio = new File([new Uint8Array(1000)], 'a.webm', { type: 'audio/webm' });

beforeEach(() => { transcribeMock.mockReset(); });

describe('the daily voice budget', () => {
	it('counts each clip with the audio length the service billed', async () => {
		transcribeMock.mockImplementation(async (_a: File, _l: string, _c: string, options: { onUsage?: (s: number | null) => void }) => { options.onUsage?.(42.04); return 'Hello there.'; });
		const events = fakeEvents();
		expect(await meteredTranscribe(locals(events), user, 'speaking-card', audio, 5, 'label')).toBe('Hello there.');
		expect(events.rows('english_clip_transcribed')).toEqual([expect.objectContaining({ metadata: { course: 'en', route: 'speaking-card', audio_seconds: 42 } })]);
	});
	it('falls back to the length the page reported, and counts a clip that fails', async () => {
		transcribeMock.mockResolvedValue(null);
		const events = fakeEvents();
		const result = await meteredTranscribe(locals(events), user, 'quick-fire', audio, 12, 'label');
		expect((result as Response).status).toBe(502);
		expect(events.rows('english_clip_transcribed')).toEqual([expect.objectContaining({ metadata: expect.objectContaining({ audio_seconds: 12 }) })]);
	});
	it('stops at the day’s clip count or audio time, before sending anything', async () => {
		for (const counts of [{ clips: MAX_DAILY_CLIPS }, { clips: 10, clipSeconds: MAX_DAILY_AUDIO_SECONDS }]) {
			const events = fakeEvents(counts);
			const refused = await checkClipBudget(locals(events), user);
			expect(refused?.status).toBe(429);
			expect(await refused?.json()).toEqual({ error: 'Daily voice limit reached' });
			expect((await meteredTranscribe(locals(events), user, 'free-talk', audio, 5, 'label') as Response).status).toBe(429);
		}
		expect(transcribeMock).not.toHaveBeenCalled();
		expect(await checkClipBudget(locals(fakeEvents({ clips: 10, clipSeconds: 600 })), user)).toBeNull();
	});
});

describe('the Practice budget', () => {
	it('counts each request before it is made, apart from the daily lesson’s allowance', async () => {
		const events = fakeEvents({ ai: 40 });
		expect(await chargePractice(locals(events), user, 'quick-fire')).toBeNull();
		expect(events.rows('english_practice_ai')).toEqual([expect.objectContaining({ metadata: { course: 'en', module: 'quick-fire' } })]);
		expect(events.rows('english_ai_requested')).toEqual([]);
	});
	it('stops at the day’s Practice limit', async () => {
		const events = fakeEvents({ practice: MAX_DAILY_PRACTICE });
		const refused = await chargePractice(locals(events), user, 'speaking-card');
		expect(refused?.status).toBe(429);
		expect(await refused?.json()).toEqual({ error: 'Daily practice limit reached' });
		expect(events.inserted).toEqual([]);
	});
});
