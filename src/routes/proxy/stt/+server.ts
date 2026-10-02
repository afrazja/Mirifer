/**
 * STT Proxy — server-side speech-to-text for browsers without the Web
 * Speech API (Firefox, many Android webviews).
 *
 * Usage: POST /proxy/stt with the raw audio blob as the body
 * (Content-Type: audio/webm | audio/mp4 | audio/mpeg | audio/wav).
 * Returns { text } — the German transcript.
 *
 * Engine: ElevenLabs Scribe (same API key as TTS). Requests are small,
 * capped, and never cached (each utterance is unique).
 */

import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { createLimiter, tooMany, verifiedUser } from '$lib/server/rate-limit';

const SCRIBE_MODEL_ID = env.ELEVENLABS_STT_MODEL_ID || 'scribe_v1';

/** ~10s of opus audio is well under this; reject anything bigger. */
const MAX_AUDIO_BYTES = 2_500_000;

const ALLOWED_ORIGINS = [
	'https://mirifer.vercel.app',
	'https://www.mirifer.com',
	'https://mirifer.com',
	'http://localhost:5173',
	'http://localhost:3000'
];

function corsHeaders(origin: string): Record<string, string> {
	return {
		'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
		Vary: 'Origin'
	};
}

export const OPTIONS: RequestHandler = async ({ request }) => {
	const origin = request.headers.get('origin') || '';
	return new Response(null, {
		status: 204,
		headers: {
			...corsHeaders(origin),
			'Access-Control-Allow-Methods': 'POST, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
};

/** Paid engines: signed-in learners only, a few requests a minute (one per spoken answer). */
const allow = createLimiter(20, 60_000);

export const POST: RequestHandler = async ({ request, locals }) => {
	const origin = request.headers.get('origin') || '';
	const json = (body: unknown, status = 200) =>
		new Response(JSON.stringify(body), {
			status,
			headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
		});

	const user = await verifiedUser(locals);
	if (!user) return json({ error: 'Sign in required' }, 401);
	if (!allow(user.id)) return tooMany();

	if (!env.ELEVENLABS_API_KEY) {
		return json({ error: 'STT not configured' }, 503);
	}

	const audio = await request.arrayBuffer();
	if (audio.byteLength < 1000) {
		return json({ error: 'Audio too short' }, 400);
	}
	if (audio.byteLength > MAX_AUDIO_BYTES) {
		return json({ error: 'Audio too large' }, 413);
	}

	const contentType = request.headers.get('content-type') || 'audio/webm';
	const ext = contentType.includes('mp4')
		? 'mp4'
		: contentType.includes('mpeg')
			? 'mp3'
			: contentType.includes('wav')
				? 'wav'
				: 'webm';

	const form = new FormData();
	form.append('model_id', SCRIBE_MODEL_ID);
	form.append('language_code', 'de');
	form.append('file', new Blob([audio], { type: contentType }), `speech.${ext}`);

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 15000);
	try {
		const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
			method: 'POST',
			headers: { 'xi-api-key': env.ELEVENLABS_API_KEY },
			body: form,
			signal: controller.signal
		});
		clearTimeout(timeoutId);

		if (!response.ok) {
			console.error(`Scribe STT failed: ${response.status}`);
			return json({ error: 'Transcription failed' }, 502);
		}

		const data = (await response.json()) as { text?: string };
		return json({ text: data.text ?? '' });
	} catch (err) {
		clearTimeout(timeoutId);
		console.error(`Scribe STT error: ${(err as Error).message}`);
		return json({ error: 'Transcription failed' }, 502);
	}
};
