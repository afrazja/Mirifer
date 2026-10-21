import { describe, it, expect, vi, beforeEach } from 'vitest';
const { env, transcribeMock } = vi.hoisted(() => ({ env: {} as Record<string, string | undefined>, transcribeMock: vi.fn() }));
vi.mock('$env/dynamic/private', () => ({ env }));
vi.mock('$lib/server/transcribe', () => ({ transcribe: transcribeMock, transcriptionConfigured: () => !!env.OPENAI_API_KEY }));
import { POST as speakingCard } from './speaking-card/+server';
import { POST as quickFire } from './quick-fire/+server';
import { POST as readRate } from './read-rate/+server';
import { POST as sayBetterLab } from './say-better-lab/+server';
import { POST as freeTalk } from './free-talk/+server';
import { POST as missingInfo } from './missing-info/+server';
import { fakeEvents } from '../../../test/english-events';

/** A learner who is not the owner. */
function event(fields: Record<string, string>) {
	const form = new FormData();
	form.set('audio', new File([new Uint8Array(2000)], 'a.webm', { type: 'audio/webm' }));
	form.set('seconds', '5');
	for (const [key, value] of Object.entries(fields)) form.set(key, value);
	const events = fakeEvents();
	const user = { id: 'learner', email: 'someone@m.test', email_confirmed_at: '2026-01-01T00:00:00Z', user_metadata: { target_language: 'en' } };
	const request = { url: 'https://m.test/api/english/x', headers: new Headers({ origin: 'https://m.test', 'content-type': 'multipart/form-data; boundary=x' }), formData: async () => form };
	return { events, event: { request, locals: { supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }) }, from: events.from } } } as any };
}

beforeEach(() => { for (const k of Object.keys(env)) delete env[k]; env.OPENAI_API_KEY = 'k'; env.GEMINI_API_KEY = 'g'; env.ADMIN_EMAIL = 'owner@m.test'; transcribeMock.mockReset(); transcribeMock.mockResolvedValue('I like it.'); });

describe('the Practice modules are open to every English learner', () => {
	it('transcribes for a learner, counting the clip against the voice budget', async () => {
		for (const [post, fields] of [[speakingCard, { card: '1' }], [quickFire, {}], [readRate, {}], [sayBetterLab, { question: '1' }], [freeTalk, { topic: '0' }]] as const) {
			const f = event(fields);
			const response = await post(f.event);
			expect(response.status).toBe(200);
			expect(await response.json()).toEqual({ transcript: 'I like it.' });
			expect(f.events.rows('english_clip_transcribed')).toHaveLength(1);
		}
	});
	it('keeps Find the missing information for the owner', async () => {
		expect((await missingInfo(event({}).event)).status).toBe(404);
	});
});
