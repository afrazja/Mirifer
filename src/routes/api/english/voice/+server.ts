/**
 * Jamie's voice — expressive speech for the authored English hotel lines.
 *
 * The free Edge voices read neutrally (speaking styles are rejected on that
 * route), so a receptionist sounded like an announcer. OpenAI's
 * gpt-4o-mini-tts takes a plain-language direction for how to speak, which
 * is what a role-play needs.
 *
 * Only the lesson's own receptionist lines are accepted, plus Jamie's
 * AI-written replies carrying a server signature from /api/english/interpret.
 * Any other text is refused, so this endpoint cannot be used to run up the
 * OpenAI bill. The
 * audio for a given line never changes, so responses are cached for a year
 * by browsers and Vercel's CDN; a line is generated roughly once per CDN
 * region and voice, not once per learner.
 *
 * Usage: GET /api/english/voice?text=<line>&voice=a|b|c|d[&sig=<signature>]
 * 503 without OPENAI_API_KEY, 502 on a provider error: the client then falls
 * back to the free Edge voice, so the lesson never goes silent.
 */

import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { verifyJamieLine } from '$lib/server/jamie-line';
import { STAGES, hotelChoices, startHotel, type Variant } from '$lib/practice/hotel';

const MODEL = env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';

/** Two men (a, c) and two women (b, d), matching the Edge voice slots. */
const VOICES: Record<string, string> = { a: 'ash', b: 'coral', c: 'onyx', d: 'nova' };

const DIRECTION =
	'You are Jamie, a warm and friendly hotel receptionist at the front desk in the evening, ' +
	'talking to a guest who is learning English. Sound like a real person having a conversation: ' +
	'natural intonation, genuine warmth, a little sympathy when the guest has a problem. ' +
	'Speak clearly and slightly slower than normal conversation so a learner can follow, ' +
	'but never robotic or like an announcement.';

/** Every line Jamie can say, across both scene variants. */
const ALLOWED = new Set<string>(
	(['lift', 'street'] as Variant[]).flatMap((variant) => [
		startHotel(variant).turns[0].text,
		...STAGES.flatMap((stage) => hotelChoices({ stage, variant }).map((choice) => choice.reply))
	])
);

const CACHE = 'public, max-age=31536000, s-maxage=31536000, immutable';

export const GET: RequestHandler = async ({ url }) => {
	const text = url.searchParams.get('text') ?? '';
	const voice = VOICES[url.searchParams.get('voice') ?? 'a'];
	const known = ALLOWED.has(text) || (text.length <= 300 && verifyJamieLine(text, url.searchParams.get('sig')));
	if (!voice || !known) {
		return new Response('Unknown line', { status: 400 });
	}
	if (!env.OPENAI_API_KEY) return new Response('Voice unavailable', { status: 503 });

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 15_000);
	try {
		const response = await fetch('https://api.openai.com/v1/audio/speech', {
			method: 'POST',
			headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({ model: MODEL, voice, input: text, instructions: DIRECTION, response_format: 'mp3' }),
			signal: controller.signal
		});
		if (!response.ok) {
			console.error(`English voice: OpenAI failed: ${response.status}`);
			return new Response('Voice unavailable', { status: 502 });
		}
		const audio = await response.arrayBuffer();
		return new Response(audio, {
			status: 200,
			headers: {
				'Content-Type': 'audio/mpeg',
				'Content-Length': audio.byteLength.toString(),
				'Cache-Control': CACHE,
				'X-TTS-Source': 'openai'
			}
		});
	} catch (err) {
		console.error(`English voice: ${(err as Error).message}`);
		return new Response('Voice unavailable', { status: 502 });
	} finally {
		clearTimeout(timeout);
	}
};
