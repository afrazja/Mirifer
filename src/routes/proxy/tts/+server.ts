/**
 * TTS Proxy.
 * Usage: GET /proxy/tts?q=Hallo&tl=de[&voice=a|b][&rate=0.5..1.5]
 *
 * voice=a (default) → learner-side voice; voice=b → conversation partner.
 * English also has voice=c and voice=d, for scenes that want more than two
 * speakers; German and Persian map c→a and d→b.
 * rate → the engine's native speaking speed: the voice articulates slower,
 * instead of the client time-stretching the audio (which mostly lengthens
 * the gaps between words). Clamped to what each engine supports.
 * Both params are part of the URL, so changes also bust old cached audio.
 *
 * Strategy:
 * - German (tl=de): Edge read-aloud with native German-only voices first
 *   (free, and cannot drift into English on words like "Chef" or "Gift" the
 *   way English voices reading German can), then ElevenLabs if Edge fails,
 *   then Google Translate TTS.
 * - All other languages: Google Translate TTS (avoids burning the ElevenLabs
 *   free-tier character quota on translation audio).
 *
 * Responses are cached aggressively (immutable, 1 year) — the audio for a given
 * sentence never changes, so repeat plays hit the browser/CDN cache instead of
 * re-spending ElevenLabs characters.
 */

import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

// Two-voice dialogue: voice A reads the learner's lines ("sent"), voice B the
// conversation partner's ("received"). Defaults are premade voices — the only
// kind the ElevenLabs free tier allows via API. On a paid plan, override via
// env with native German library voices (e.g. Otto FTNCalFNG5bRnkkaP5Ug /
// Mila dCnu06FiOZma2KVNUoPZ, already added to this account's My Voices).
const ELEVEN_VOICE_A = env.ELEVENLABS_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb'; // George — warm male
const ELEVEN_VOICE_B = env.ELEVENLABS_VOICE_ID_B || 'EXAVITQu4vr4xnSDxMaL'; // Sarah — reassuring female
const ELEVEN_MODEL_ID = env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

/** Long-lived immutable cache — same sentence always produces the same audio. */
const AUDIO_CACHE_CONTROL = 'public, max-age=31536000, immutable';

/**
 * Generate German audio via ElevenLabs. Returns the audio bytes, or null on any
 * failure (missing key, quota exceeded, timeout) so the caller falls back.
 */
async function tryElevenLabs(
	text: string,
	voiceId: string,
	speed: number
): Promise<ArrayBuffer | null> {
	if (!env.ELEVENLABS_API_KEY) return null;

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 8000);
	try {
		const response = await fetch(
			`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
			{
				method: 'POST',
				headers: {
					'xi-api-key': env.ELEVENLABS_API_KEY,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					text,
					model_id: ELEVEN_MODEL_ID,
					// Slightly lower stability + some style for a livelier, less
					// monotone delivery — still consistent enough for learning.
					voice_settings: {
						stability: 0.5,
						similarity_boost: 0.75,
						style: 0.3,
						use_speaker_boost: true,
						speed
					}
				}),
				signal: controller.signal
			}
		);
		clearTimeout(timeoutId);
		if (!response.ok) {
			// 401 (scope), 402 (quota/plan), 429 (rate limit) → fall back to Google.
			console.error(`ElevenLabs TTS failed: ${response.status}`);
			return null;
		}
		const audio = await response.arrayBuffer();
		return audio.byteLength > 100 ? audio : null;
	} catch (err) {
		clearTimeout(timeoutId);
		console.error(`ElevenLabs TTS error: ${(err as Error).message}`);
		return null;
	}
}

// Persian voices — Azure Speech is the only major cloud with fa-IR neural
// voices. voice=a → Dilara (female), voice=b → Farid (male). Overridable via
// env if Microsoft ships more Persian voices later.
const AZURE_VOICE_FA_A = env.AZURE_SPEECH_VOICE_FA || 'fa-IR-DilaraNeural';
const AZURE_VOICE_FA_B = env.AZURE_SPEECH_VOICE_FA_B || 'fa-IR-FaridNeural';

/** Escape text for embedding inside SSML. */
function escapeSsml(text: string): string {
	return text
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/**
 * Generate Persian audio via Azure Speech (F0 free tier: 500k chars/month).
 * Returns audio bytes, or null on any failure (missing key, quota, timeout)
 * so the caller falls back to the existing chain.
 */
async function tryAzureFa(text: string, voiceName: string, rate: number): Promise<ArrayBuffer | null> {
	if (!env.AZURE_SPEECH_KEY || !env.AZURE_SPEECH_REGION) return null;

	// Azure expects prosody rate as a percentage delta ("-20%" = slower).
	const pct = Math.round((Math.min(1.2, Math.max(0.7, rate)) - 1) * 100);
	const ssml =
		`<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="fa-IR">` +
		`<voice name="${voiceName}"><prosody rate="${pct}%">${escapeSsml(text)}</prosody></voice>` +
		`</speak>`;

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 8000);
	try {
		const response = await fetch(
			`https://${env.AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
			{
				method: 'POST',
				headers: {
					'Ocp-Apim-Subscription-Key': env.AZURE_SPEECH_KEY,
					'Content-Type': 'application/ssml+xml',
					'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
					'User-Agent': 'mirifer-tts-proxy'
				},
				body: ssml,
				signal: controller.signal
			}
		);
		clearTimeout(timeoutId);
		if (!response.ok) {
			// 401 (bad key), 403 (quota exhausted on F0), 429 (rate limit) → fall back.
			console.error(`Azure TTS failed: ${response.status}`);
			return null;
		}
		const audio = await response.arrayBuffer();
		return audio.byteLength > 100 ? audio : null;
	} catch (err) {
		clearTimeout(timeoutId);
		console.error(`Azure TTS error: ${(err as Error).message}`);
		return null;
	}
}

// Edge read-aloud voices per language. English: Andrew/Ava Multilingual are
// Microsoft's most natural pair (browser speechSynthesis and the Google scrape
// both sound robotic). German: Edge is the PRIMARY tier, with German-only
// voices (Conrad, Katja) rather than the Multilingual ones, which like any
// voice built to switch languages can read an English-looking word in English.
const EDGE_VOICE_EN_A = env.EDGE_TTS_VOICE_EN || 'en-US-AndrewMultilingualNeural';
const EDGE_VOICE_EN_B = env.EDGE_TTS_VOICE_EN_B || 'en-US-AvaMultilingualNeural';
// Two more English speakers, so scenes can vary who talks: a/c are men, b/d women.
const EDGE_VOICE_EN_C = env.EDGE_TTS_VOICE_EN_C || 'en-US-BrianMultilingualNeural';
const EDGE_VOICE_EN_D = env.EDGE_TTS_VOICE_EN_D || 'en-US-EmmaMultilingualNeural';
const EDGE_VOICES_EN: Record<string, string> = {
	a: EDGE_VOICE_EN_A,
	b: EDGE_VOICE_EN_B,
	c: EDGE_VOICE_EN_C,
	d: EDGE_VOICE_EN_D
};
const EDGE_VOICE_DE_A = env.EDGE_TTS_VOICE_DE || 'de-DE-ConradNeural';
const EDGE_VOICE_DE_B = env.EDGE_TTS_VOICE_DE_B || 'de-DE-KatjaNeural';

/**
 * Generate audio via Microsoft Edge's read-aloud service — the same neural
 * voices as Azure Speech, no account or key required. Unofficial endpoint
 * (same category as the Google Translate fallback below), so any failure
 * returns null and the caller falls back down the chain.
 */
async function tryEdge(text: string, voiceName: string, rate: number): Promise<ArrayBuffer | null> {
	try {
		const tts = new MsEdgeTTS();
		await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
		// Prosody rate as a multiplier (1 = normal), 0.5–1.5: wider than
		// ElevenLabs' 0.7–1.2, which the slow English pace and the faster late
		// German lessons both use. Quantized so cache variants stay bounded.
		const clamped = Math.round(Math.min(1.5, Math.max(0.5, rate)) * 100) / 100;
		const { audioStream } = tts.toStream(text, { rate: clamped });

		const audio = await new Promise<Uint8Array | null>((resolve) => {
			const chunks: Uint8Array[] = [];
			const timer = setTimeout(() => {
				tts.close();
				resolve(null);
			}, 10000);
			audioStream.on('data', (c: Uint8Array) => chunks.push(c));
			audioStream.on('end', () => {
				clearTimeout(timer);
				tts.close();
				const total = chunks.reduce((n, c) => n + c.byteLength, 0);
				const merged = new Uint8Array(total);
				let offset = 0;
				for (const c of chunks) {
					merged.set(c, offset);
					offset += c.byteLength;
				}
				resolve(merged);
			});
			audioStream.on('error', () => {
				clearTimeout(timer);
				tts.close();
				resolve(null);
			});
		});

		if (!audio || audio.byteLength < 100) return null;
		return audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength) as ArrayBuffer;
	} catch (err) {
		console.error(`Edge TTS error: ${(err as Error).message}`);
		return null;
	}
}

// AiVOOV (aivoov.com) — TTS aggregator reselling Google/Amazon/IBM/Microsoft
// voices behind one API. Used for Persian after Azure: it carries Microsoft's
// fa-IR voices, so Persian works without an Azure account (needs an AiVOOV
// account with character credits). Voice IDs are AiVOOV-specific UUIDs — run
// `npm run aivoov:voices` once and pin your picks via env; if unset, the first
// fa-IR voices from /voices are used (cached per instance — that endpoint
// allows only 20 calls/day, so pinning via env is the stable path).
let aivoovFaVoicesCache: { a: string; b: string } | null = null;

async function getAiVoovFaVoices(): Promise<{ a: string; b: string } | null> {
	if (env.AIVOOV_VOICE_FA) {
		return { a: env.AIVOOV_VOICE_FA, b: env.AIVOOV_VOICE_FA_B || env.AIVOOV_VOICE_FA };
	}
	if (aivoovFaVoicesCache) return aivoovFaVoicesCache;
	if (!env.AIVOOV_API_KEY) return null;

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 5000);
	try {
		const response = await fetch('https://aivoov.com/api/v8/voices?language_code=fa-IR', {
			headers: { 'X-API-KEY': env.AIVOOV_API_KEY },
			signal: controller.signal
		});
		clearTimeout(timeoutId);
		if (!response.ok) {
			console.error(`AiVOOV voices failed: ${response.status}`);
			return null;
		}
		const raw = await response.json();
		const list = (Array.isArray(raw) ? raw : raw?.data) as Array<{ voice_id: string }> | undefined;
		if (!Array.isArray(list) || list.length === 0 || !list[0]?.voice_id) return null;
		aivoovFaVoicesCache = {
			a: list[0].voice_id,
			b: list[1]?.voice_id || list[0].voice_id
		};
		return aivoovFaVoicesCache;
	} catch (err) {
		clearTimeout(timeoutId);
		console.error(`AiVOOV voices error: ${(err as Error).message}`);
		return null;
	}
}

/**
 * Generate audio via AiVOOV. Returns audio bytes, or null on any failure so
 * the caller falls back. Response audio arrives base64-encoded.
 */
async function tryAiVoov(text: string, voiceId: string, rate: number): Promise<ArrayBuffer | null> {
	if (!env.AIVOOV_API_KEY) return null;

	const body = new URLSearchParams();
	body.append('voice_id[]', voiceId);
	body.append('transcribe_text[]', text);
	body.append('transcribe_ssml_pitch_rate[]', 'default');
	// AiVOOV speaking rate is percent of normal speed in [20, 200].
	const spkRate =
		rate === 1 ? 'default' : String(Math.round(Math.min(200, Math.max(20, rate * 100))));
	body.append('transcribe_ssml_spk_rate[]', spkRate);

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 12000);
	try {
		const response = await fetch('https://aivoov.com/api/v8/create', {
			method: 'POST',
			headers: {
				'X-API-KEY': env.AIVOOV_API_KEY,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: body.toString(),
			signal: controller.signal
		});
		clearTimeout(timeoutId);
		if (!response.ok) {
			// 401 (bad key), 402/403 (no credits), 429 (rate limit) → fall back.
			console.error(`AiVOOV TTS failed: ${response.status}`);
			return null;
		}
		const json = (await response.json()) as {
			status?: boolean;
			message?: string;
			audio?: string | string[];
		};
		let b64 = Array.isArray(json.audio) ? json.audio[0] : json.audio;
		if (!json.status || typeof b64 !== 'string' || b64.length === 0) {
			console.error(`AiVOOV TTS bad response: ${json.message || 'no audio'}`);
			return null;
		}
		// Tolerate a data-URI prefix ("data:audio/mp3;base64,....")
		if (b64.startsWith('data:')) b64 = b64.slice(b64.indexOf(',') + 1);
		const bin = atob(b64.replace(/\s/g, ''));
		const bytes = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
		return bytes.byteLength > 100 ? bytes.buffer : null;
	} catch (err) {
		clearTimeout(timeoutId);
		console.error(`AiVOOV TTS error: ${(err as Error).message}`);
		return null;
	}
}

const ALLOWED_ORIGINS = [
	'https://mirifer.vercel.app',
	'http://localhost:5173',
	'http://localhost:3000',
	'http://localhost:5500',
	'http://127.0.0.1:5500'
];

function getCorsOrigin(requestOrigin: string): string {
	return ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0];
}

function corsHeaders(origin: string): Record<string, string> {
	return {
		'Access-Control-Allow-Origin': getCorsOrigin(origin),
		'Vary': 'Origin'
	};
}

export const OPTIONS: RequestHandler = async ({ request }) => {
	const origin = request.headers.get('origin') || '';
	return new Response(null, {
		status: 204,
		headers: {
			...corsHeaders(origin),
			'Access-Control-Allow-Methods': 'GET, OPTIONS',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
};

export const GET: RequestHandler = async ({ url, request }) => {
	const origin = request.headers.get('origin') || '';
	const text = url.searchParams.get('q');
	let lang = url.searchParams.get('tl') || 'de';

	// Strip region code (de-DE → de)
	if (lang.includes('-')) lang = lang.split('-')[0];

	if (!text) {
		return new Response(JSON.stringify({ error: 'Missing q parameter' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
		});
	}

	if (text.length > 500) {
		return new Response(JSON.stringify({ error: 'Text too long (max 500 chars)' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
		});
	}

	// German → Edge's native German voices first, ElevenLabs only as a fallback.
	if (lang === 'de') {
		const isB = ['b', 'd'].includes(url.searchParams.get('voice') ?? '');
		const rawRate = parseFloat(url.searchParams.get('rate') || '1');
		const rate = isFinite(rawRate) ? rawRate : 1;
		const edgeDe = await tryEdge(text, isB ? EDGE_VOICE_DE_B : EDGE_VOICE_DE_A, rate);
		if (edgeDe) {
			return new Response(edgeDe, {
				status: 200,
				headers: {
					'Content-Type': 'audio/mpeg',
					'Content-Length': edgeDe.byteLength.toString(),
					'Cache-Control': AUDIO_CACHE_CONTROL,
					'X-TTS-Source': 'edge',
					...corsHeaders(origin)
				}
			});
		}
		// Edge unavailable → ElevenLabs. The rate is calibrated for Edge, whose
		// German at 1.0 (~156 wpm) matches ElevenLabs at about 0.8, so scale it
		// down, then clamp to ElevenLabs' 0.7–1.2 and quantize so cache
		// variants stay bounded.
		const speed = Math.round(Math.min(1.2, Math.max(0.7, rate * 0.8)) * 100) / 100;
		const elevenAudio = await tryElevenLabs(text, isB ? ELEVEN_VOICE_B : ELEVEN_VOICE_A, speed);
		if (elevenAudio) {
			return new Response(elevenAudio, {
				status: 200,
				headers: {
					'Content-Type': 'audio/mpeg',
					'Content-Length': elevenAudio.byteLength.toString(),
					'Cache-Control': AUDIO_CACHE_CONTROL,
					'X-TTS-Source': 'elevenlabs',
					...corsHeaders(origin)
				}
			});
		}
		// else: fall through to Google
	}

	// English → Edge neural voices. Both current English paths sound robotic
	// (desktop browser speechSynthesis and the Google scrape on mobile).
	if (lang === 'en') {
		const rawRate = parseFloat(url.searchParams.get('rate') || '1');
		const rate = isFinite(rawRate) ? rawRate : 1;
		const edgeEn = await tryEdge(
			text,
			EDGE_VOICES_EN[url.searchParams.get('voice') ?? 'a'] ?? EDGE_VOICE_EN_A,
			rate
		);
		if (edgeEn) {
			return new Response(edgeEn, {
				status: 200,
				headers: {
					'Content-Type': 'audio/mpeg',
					'Content-Length': edgeEn.byteLength.toString(),
					'Cache-Control': AUDIO_CACHE_CONTROL,
					'X-TTS-Source': 'edge',
					...corsHeaders(origin)
				}
			});
		}
		// else: fall through to Google
	}

	// Persian → Azure Speech, then AiVOOV (Google Translate TTS has no Persian
	// voice at all, so without these branches fa would 502 and fall to browser
	// TTS, which almost no OS ships a Persian voice for).
	if (lang === 'fa') {
		const wantVoiceB = ['b', 'd'].includes(url.searchParams.get('voice') ?? '');
		const rawRate = parseFloat(url.searchParams.get('rate') || '1');
		const rate = isFinite(rawRate) ? rawRate : 1;

		// 1) Azure direct — free F0 tier, preferred when configured.
		const azureVoice = wantVoiceB ? AZURE_VOICE_FA_B : AZURE_VOICE_FA_A;
		const azureAudio = await tryAzureFa(text, azureVoice, rate);
		if (azureAudio) {
			return new Response(azureAudio, {
				status: 200,
				headers: {
					'Content-Type': 'audio/mpeg',
					'Content-Length': azureAudio.byteLength.toString(),
					'Cache-Control': AUDIO_CACHE_CONTROL,
					'X-TTS-Source': 'azure',
					...corsHeaders(origin)
				}
			});
		}

		// 2) Edge read-aloud — same Microsoft voices, free, no account needed.
		//    Reuses the AZURE_SPEECH_VOICE_FA* overrides since the voice names
		//    are identical.
		const edgeAudio = await tryEdge(text, azureVoice, rate);
		if (edgeAudio) {
			return new Response(edgeAudio, {
				status: 200,
				headers: {
					'Content-Type': 'audio/mpeg',
					'Content-Length': edgeAudio.byteLength.toString(),
					'Cache-Control': AUDIO_CACHE_CONTROL,
					'X-TTS-Source': 'edge',
					...corsHeaders(origin)
				}
			});
		}

		// 3) AiVOOV — spends character credits, works without an Azure account.
		const aivoovVoices = await getAiVoovFaVoices();
		if (aivoovVoices) {
			const aivoovAudio = await tryAiVoov(
				text,
				wantVoiceB ? aivoovVoices.b : aivoovVoices.a,
				rate
			);
			if (aivoovAudio) {
				return new Response(aivoovAudio, {
					status: 200,
					headers: {
						'Content-Type': 'audio/mpeg',
						'Content-Length': aivoovAudio.byteLength.toString(),
						'Cache-Control': AUDIO_CACHE_CONTROL,
						'X-TTS-Source': 'aivoov',
						...corsHeaders(origin)
					}
				});
			}
		}
		// else: fall through to Google attempts (they will fail for fa, but the
		// client then falls back to browser TTS — same behavior as today).
	}

	// Try multiple Google TTS URL patterns (they rotate blocking)
	const attempts: Array<{ url: string; headers: Record<string, string> }> = [
		{
			url: `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`,
			headers: {
				Referer: 'https://translate.google.com/',
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
			}
		},
		{
			url: `https://translate.googleapis.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=gtx`,
			headers: {
				'User-Agent':
					'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
			}
		}
	];

	for (const attempt of attempts) {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 5000);

			const response = await fetch(attempt.url, {
				headers: attempt.headers,
				signal: controller.signal
			});

			clearTimeout(timeoutId);

			if (!response.ok) continue;

			const audioData = await response.arrayBuffer();

			// Verify we got actual audio data (not an error page)
			if (audioData.byteLength < 100) continue;

			return new Response(audioData, {
				status: 200,
				headers: {
					'Content-Type': 'audio/mpeg',
					'Content-Length': audioData.byteLength.toString(),
					'Cache-Control': 'public, max-age=86400',
					'X-TTS-Source': 'google',
					...corsHeaders(origin)
				}
			});
		} catch (err) {
			console.error(`TTS attempt failed: ${(err as Error).message}`);
			continue;
		}
	}

	// All attempts failed
	return new Response(JSON.stringify({ error: 'TTS service unavailable' }), {
		status: 502,
		headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
	});
};
