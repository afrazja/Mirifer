import { describe, it, expect, vi, afterEach } from 'vitest';
vi.mock('$env/dynamic/private', () => ({ env: { OPENAI_API_KEY: 'k' } }));
import { billedSeconds, transcribe } from './transcribe';

afterEach(() => vi.unstubAllGlobals());
const audio = () => new File([new Uint8Array([1, 2, 3])], 'a', { type: 'audio/webm' });

describe('transcribe', () => {
	it('asks the service to split at pauses when told to', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ text: ' Hi.  What time does it leave? ' })));
		vi.stubGlobal('fetch', fetchMock);
		expect(await transcribe(audio(), 't', 'ctx', { splitAtPauses: true })).toBe('Hi. What time does it leave?');
		const body = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as FormData;
		expect(body.get('chunking_strategy')).toBe('auto');
	});
	it('if the service refuses the pause setting, it asks again without it', async () => {
		const fetchMock = vi.fn()
			.mockResolvedValueOnce(new Response('bad', { status: 400 }))
			.mockResolvedValueOnce(new Response(JSON.stringify({ text: 'Which platform?' })));
		vi.stubGlobal('fetch', fetchMock);
		expect(await transcribe(audio(), 't', 'ctx', { splitAtPauses: true })).toBe('Which platform?');
		expect((fetchMock.mock.calls[1][1].body as FormData).get('chunking_strategy')).toBeNull();
	});
});

describe('the billed audio length', () => {
	it('reads seconds or audio tokens from the response, and reports it', async () => {
		expect(billedSeconds({ type: 'duration', seconds: 31.5 })).toBe(31.5);
		expect(billedSeconds({ type: 'tokens', input_tokens: 500, input_token_details: { audio_tokens: 1000, text_tokens: 0 } })).toBeCloseTo(60);
		expect(billedSeconds(undefined)).toBeNull();
		expect(billedSeconds({ type: 'tokens', input_tokens: 5 })).toBeNull();
		vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ text: 'Hi.', usage: { type: 'duration', seconds: 3 } }))));
		const onUsage = vi.fn();
		expect(await transcribe(audio(), 't', 'ctx', { onUsage })).toBe('Hi.');
		expect(onUsage).toHaveBeenCalledWith(3);
	});
});
