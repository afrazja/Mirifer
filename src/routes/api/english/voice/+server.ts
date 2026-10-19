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
 * Usage: GET /api/english/voice?text=<line>&voice=a|b|c|d[&sig=<signature>][&scene=<role-play id>]
 *    or: GET /api/english/voice?piece=<listen & retell piece id>&voice=a|b|c|d
 * 503 without OPENAI_API_KEY, 502 on a provider error: the client then falls
 * back to the free Edge voice, so the lesson never goes silent.
 */

import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { verifyJamieLine } from '$lib/server/jamie-line';
import { ALL_ROLE_SCENES, roleSceneById } from '$lib/practice/day-content';
import { preparedLines } from '$lib/practice/roleplay';
import { retellPieceById as getPiece } from '$lib/practice/day-content';

const MODEL = env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';

/** Two men (a, c) and two women (b, d), matching the Edge voice slots. */
const VOICES: Record<string, string> = { a: 'ash', b: 'coral', c: 'onyx', d: 'nova' };


const NARRATION =
	'You are narrating a short story or news feature for people learning English. ' +
	'Read it like a good audiobook narrator: warm, natural and engaging, with clear pauses between sentences. ' +
	'Speak a little slower than normal so a learner can follow, but keep it natural, never robotic.';

/** A 2–3 minute piece takes longer to generate than a single line. */
export const config = { maxDuration: 60 };

/** Every role-play character's prepared lines; everything else they say is AI-written and signed. */
const ALLOWED = new Set<string>(ALL_ROLE_SCENES.flatMap(preparedLines));

const CACHE = 'public, max-age=31536000, s-maxage=31536000, immutable';

export const GET: RequestHandler = async ({ url, locals }) => {
	const piece = url.searchParams.has('piece') ? getPiece(url.searchParams.get('piece') ?? '') : null;
	if (url.searchParams.has('piece') && !piece) return new Response('Unknown piece', { status: 400 });
	// A story is about a thousand characters of narration: only for signed-in learners.
	if (piece && !locals.user) return new Response('Sign in', { status: 401 });
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
			body: JSON.stringify({ model: MODEL, voice, input: text, instructions: piece ? NARRATION : (roleSceneById(url.searchParams.get('scene')) ?? ALL_ROLE_SCENES[0]).voiceDirection, response_format: 'mp3' }),
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
