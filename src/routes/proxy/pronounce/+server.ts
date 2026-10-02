/**
 * Pronunciation Assessment Proxy — per-phoneme scoring via Azure Speech.
 *
 * This is the thing transcription cannot do. A recognizer's language model
 * repairs accent on the way through: say "Ish hi-se Afraz" and it hands back
 * "Ich heiße Afraz", because that is the most probable German sentence. The
 * error is gone before any matcher sees it. Azure's assessment endpoint
 * scores the audio AGAINST a reference text instead of decoding it freely,
 * so nothing gets repaired and every phoneme comes back with a number.
 *
 * DORMANT until AZURE_SPEECH_KEY and AZURE_SPEECH_REGION are set — the same
 * pair /proxy/tts already documents, so one account unlocks both. Without
 * them this returns 503 and the client falls back to the local diagnosis in
 * pronunciation.ts, which covers the umlaut contrasts and nothing else.
 *
 * Usage: POST /proxy/pronounce?text=<reference German>
 *        body = 16 kHz mono PCM WAV (see $utils/wav-encode)
 */

import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { createLimiter, tooMany, verifiedUser } from '$lib/server/rate-limit';

/** ~10s of 16 kHz mono PCM is ~320 KB; leave room and reject the rest. */
const MAX_AUDIO_BYTES = 2_000_000;

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

/** One phoneme and how close it landed (0–100). */
export interface PhonemeScore {
	phoneme: string;
	score: number;
}

export interface WordScore {
	word: string;
	score: number;
	/** Azure's own label: None | Mispronunciation | Omission | Insertion. */
	errorType: string;
	phonemes: PhonemeScore[];
}

export interface AssessmentResult {
	/** Azure's headline 0–100. */
	overall: number;
	accuracy: number;
	fluency: number;
	completeness: number;
	words: WordScore[];
}

interface AzureWord {
	Word?: string;
	PronunciationAssessment?: { AccuracyScore?: number; ErrorType?: string };
	Phonemes?: Array<{ Phoneme?: string; PronunciationAssessment?: { AccuracyScore?: number } }>;
}

/** Paid engines: signed-in learners only, a few requests a minute (one per spoken answer). */
const allow = createLimiter(20, 60_000);

export const POST: RequestHandler = async ({ request, url, locals }) => {
	const origin = request.headers.get('origin') || '';
	const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
		new Response(JSON.stringify(body), {
			status,
			headers: { 'Content-Type': 'application/json', ...corsHeaders(origin), ...extra }
		});

	const user = await verifiedUser(locals);
	if (!user) return json({ error: 'Sign in required' }, 401);
	if (!allow(user.id)) return tooMany();

	const key = env.AZURE_SPEECH_KEY;
	const region = env.AZURE_SPEECH_REGION;
	if (!key || !region) {
		// Not an error the learner should ever see. The client treats 503 as
		// "no remote scoring available" and keeps the local diagnosis.
		return json({ error: 'Pronunciation assessment not configured' }, 503);
	}

	const referenceText = (url.searchParams.get('text') || '').trim();
	if (!referenceText) {
		return json({ error: 'Missing reference text' }, 400);
	}

	const audio = await request.arrayBuffer();
	if (audio.byteLength < 1000) return json({ error: 'Audio too short' }, 400);
	if (audio.byteLength > MAX_AUDIO_BYTES) return json({ error: 'Audio too large' }, 413);

	// EnableMiscue makes Azure report words the learner SKIPPED or ADDED,
	// not just the ones they said badly. Without it, reading half the
	// sentence perfectly scores as a perfect read.
	const assessmentConfig = Buffer.from(
		JSON.stringify({
			ReferenceText: referenceText,
			GradingSystem: 'HundredMark',
			Granularity: 'Phoneme',
			Dimension: 'Comprehensive',
			EnableMiscue: true
		}),
		'utf-8'
	).toString('base64');

	const endpoint =
		`https://${region}.stt.speech.microsoft.com` +
		`/speech/recognition/conversation/cognitiveservices/v1?language=de-DE&format=detailed`;

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 12000);
	try {
		const response = await fetch(endpoint, {
			method: 'POST',
			headers: {
				'Ocp-Apim-Subscription-Key': key,
				'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
				'Pronunciation-Assessment': assessmentConfig,
				Accept: 'application/json'
			},
			body: audio,
			signal: controller.signal
		});
		clearTimeout(timeoutId);

		if (!response.ok) {
			console.error(`Azure pronunciation assessment failed: ${response.status}`);
			return json({ error: 'Assessment failed' }, 502);
		}

		const data = (await response.json()) as {
			RecognitionStatus?: string;
			NBest?: Array<{
				PronunciationAssessment?: Record<string, number>;
				Words?: AzureWord[];
			}>;
		};

		// Silence and unintelligible audio both come back Success-with-no-NBest
		// or an explicit non-Success status. Neither is a low score — it is an
		// absent measurement, and scoring it 0 would punish a broken mic.
		const best = data.NBest?.[0];
		if (data.RecognitionStatus !== 'Success' || !best) {
			return json({ error: 'No speech detected' }, 422);
		}

		const pa = best.PronunciationAssessment ?? {};
		const result: AssessmentResult = {
			overall: pa.PronScore ?? 0,
			accuracy: pa.AccuracyScore ?? 0,
			fluency: pa.FluencyScore ?? 0,
			completeness: pa.CompletenessScore ?? 0,
			words: (best.Words ?? []).map((w) => ({
				word: w.Word ?? '',
				score: w.PronunciationAssessment?.AccuracyScore ?? 0,
				errorType: w.PronunciationAssessment?.ErrorType ?? 'None',
				phonemes: (w.Phonemes ?? []).map((p) => ({
					phoneme: p.Phoneme ?? '',
					score: p.PronunciationAssessment?.AccuracyScore ?? 0
				}))
			}))
		};

		// Mirrors the X-TTS-Source header on /proxy/tts — when this is wired
		// up, being able to see which path served a response without adding
		// logging is worth one header.
		return json(result, 200, { 'X-Assessment-Source': 'azure' });
	} catch (err) {
		clearTimeout(timeoutId);
		console.error(`Azure pronunciation assessment error: ${(err as Error).message}`);
		return json({ error: 'Assessment failed' }, 502);
	}
};
