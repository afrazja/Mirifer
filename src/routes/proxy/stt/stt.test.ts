import { describe, it, expect, vi } from 'vitest';
vi.mock('$env/dynamic/private', () => ({ env: { ELEVENLABS_API_KEY: 'k' } }));
import { POST } from './+server';
import { POST as PRONOUNCE } from '../pronounce/+server';

const event = (user: unknown) => ({
	locals: { supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: user ? null : new Error('no') }) } } },
	request: new Request('https://mirifer.test/proxy/stt', { method: 'POST', body: new Uint8Array(10) }),
	url: new URL('https://mirifer.test/proxy/pronounce?text=Hallo')
}) as any;

describe('paid speech proxies', () => {
	it('refuse anonymous callers before doing any work', async () => {
		expect((await POST(event(null))).status).toBe(401);
		expect((await PRONOUNCE(event(null))).status).toBe(401);
	});
	it('let a signed-in learner through to the normal checks', async () => {
		expect((await POST(event({ id: 'u1' }))).status).toBe(400); // audio too short
	});
});
