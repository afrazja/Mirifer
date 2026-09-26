/**
 * Jamie's voice — expressive speech for the English hotel role-play.
 *
 * The free Edge voices read neutrally (speaking styles are rejected on that
 * route), so a receptionist sounded like an announcer. OpenAI's
 * gpt-4o-mini-tts takes a plain-language direction for how to speak, which
 * is what a role-play needs.
 *
 * Only Jamie's prepared lines are accepted, plus his AI-written replies
 * carrying a server signature from /api/english/converse. Any other text is
 * refused, so this endpoint cannot be used to run up the OpenAI bill. The
 * audio for a given line never changes, so responses are cached for a year
 * by browsers and Vercel's CDN.
 *
 * Usage: GET /api/english/voice?text=<line>&voice=a|b|c|d[&sig=<signature>]
 *    or: GET /api/english/voice?piece=<listen & retell piece id>&voice=a|b|c|d
 * 503 without OPENAI_API_KEY, 502 on a provider error: the client then falls
 * back to the free Edge voice, so the lesson never goes silent.
 */

import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { verifyJamieLine } from '$lib/server/jamie-line';
import { FALLBACK_LINES, GREETING } from '$lib/practice/hotel';
import { getPiece } from '$lib/practice/retell';

const MODEL = env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';

/** Two men (a, c) and two women (b, d), matching the Edge voice slots. */
const VOICES: Record<string, string> = { a: 'ash', b: 'coral', c: 'onyx', d: 'nova' };

const DIRECTION =
	'You are Jamie, a warm and friendly hotel receptionist at the front desk in the evening, ' +
	'talking to a guest who is learning English. Sound like a real person having a conversation: ' +
	'natural intonation, genuine warmth, a little sympathy when the guest has a problem. ' +
	'Speak clearly and slightly slower than normal conversation so a learner can follow, ' +
	'but never robotic or like an announcement.';

const NARRATION =
	'You are narrating a short story or news feature for people learning English. ' +
	'Read it like a good audiobook narrator: warm, natural and engaging, with clear pauses between sentences. ' +
	'Speak a little slower than normal so a learner can follow, but keep it natural, never robotic.';

/** A 2–3 minute piece takes longer to generate than a single line. */
export const config = { maxDuration: 60 };

/** Jamie's prepared lines; everything else he says is AI-written and signed. */
const ALLOWED = new Set<string>([GREETING, ...Object.values(FALLBACK_LINES)]);

const CACHE = 'public, max-age=31536000, s-maxage=31536000, immutable';

export const GET: RequestHandler = async ({ url }) => {
	const piece = url.searchParams.has('piece') ? getPiece(url.searchParams.get('piece') ?? '') : null;
	if (url.searchParams.has('piece') && !piece) return new Response('Unknown piece', { status: 400 });
	const text = piece?.text ?? url.searchParams.get('text') ?? '';
	const voice = VOICES[url.searchParams.get('voice') ?? 'a'];
	const known = !!piece || ALLOWED.has(text) || (text.length <= 400 && verifyJamieLine(text, url.searchParams.get('sig')));
	if (!voice || !known) {
		return new Response('Unknown line', { status: 400 });
	}
	if (!env.OPENAI_API_KEY) return new Response('Voice unavailable', { status: 503 });

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), piece ? 55_000 : 15_000);
	try {
		const response = await fetch('https://api.openai.com/v1/audio/speech', {
			method: 'POST',
			headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({ model: MODEL, voice, input: text, instructions: piece ? NARRATION : DIRECTION, response_format: 'mp3' }),
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
