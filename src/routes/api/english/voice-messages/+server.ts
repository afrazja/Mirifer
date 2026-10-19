/**
 * "Voice messages" (daily lesson and Module lab).
 *
 * multipart {audio, seconds, message}: transcribes one spoken reply (OpenAI; the audio is not
 * stored), then one AI call checks whether it answers what the voice message asked and gives a
 * natural reply. Returns {transcript, feedback}. Spends one unit of allowance per reply.
 *
 * Refused once the day's AI allowance is used up. Nothing the learner said is stored on our server.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { askChain, checkAllowance, englishLearner, recordAllowance } from '$lib/server/english-ai';
import { transcribe, transcriptionConfigured } from '$lib/server/transcribe';
import { createLimiter, tooMany } from '$lib/server/rate-limit';
import { NAMES, REPLY_MAX_SECONDS } from '$lib/practice/voice-messages';
import { voiceMessageById } from '$lib/practice/day-content';
import { RawReplySchema, checkReply, replyPrompt, replySchemas, replyUser, type RawReply } from '$lib/server/voice-messages-ai';

export const config = { maxDuration: 30 };
const MAX_AUDIO_BYTES = 900_000;
const perMinute = createLimiter(20, 60_000);

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await englishLearner(request, locals);
	if (user instanceof Response) return user;
	// A daily-lesson module (Day 2 on) as well as a lab one: every English learner, within the allowance.
	if (!perMinute(user.id)) return tooMany();
	if (!(request.headers.get('content-type') ?? '').startsWith('multipart/form-data')) return json({ error: 'Invalid request' }, { status: 400 });
	if (!transcriptionConfigured()) return json({ error: 'Transcription unavailable' }, { status: 503 });
	if (Number(request.headers.get('content-length') ?? 0) > MAX_AUDIO_BYTES + 10_000) return json({ error: 'Recording too large' }, { status: 413 });

	let form: FormData;
	try { form = await request.formData(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
	const audio = form.get('audio'), seconds = Number(form.get('seconds'));
	const message = voiceMessageById(String(form.get('message') ?? ''));
	if (!message) return json({ error: 'Invalid request' }, { status: 400 });
	if (!(audio instanceof File) || !audio.size || audio.size > MAX_AUDIO_BYTES || !audio.type.startsWith('audio/')) return json({ error: 'Invalid recording' }, { status: 400 });
	if (!Number.isFinite(seconds) || seconds < 0 || seconds > REPLY_MAX_SECONDS + 5) return json({ error: 'Invalid recording' }, { status: 400 });

	const refused = await checkAllowance(locals, user);
	if (refused) return refused;
	const transcript = await transcribe(audio, 'English voice-messages', `A Persian speaker is replying with a short voice message to ${message.from.name} (${message.from.who.en}). Names that may come up: ${message.names ?? NAMES}`);
	if (transcript === null) return json({ error: 'Transcription unavailable' }, { status: 502 });
	if (!transcript.trim()) return json({ error: 'Nothing heard' }, { status: 422 });

	const raw = await askChain<RawReply>({
		label: 'English voice-messages', system: replyPrompt(), user: replyUser(message, transcript),
		schema: RawReplySchema, ...replySchemas, temperature: 0.2, maxTokens: 500
	});
	if (!raw) return json({ error: 'AI unavailable', transcript }, { status: 502 });
	await recordAllowance(locals, user, 0, 'voice-messages-v1');
	return json({ transcript, feedback: checkReply(raw, message, transcript) });
};
