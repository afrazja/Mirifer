/**
 * Turns one short spoken answer into text (src/lib/practice/voice-clip.ts): Mira's greeting, the
 * role-plays and the recap's "say it again". The audio is sent once to OpenAI and not stored; the
 * transcript is returned and not stored either.
 *
 * Refused once the day's AI allowance is used up; a clip doesn't spend it, but counts against the
 * day's clip budget (spendClip).
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkAllowance, englishLearner, spendClip } from '$lib/server/english-ai';
import { transcribe, transcriptionConfigured } from '$lib/server/transcribe';
import { createLimiter, tooMany } from '$lib/server/rate-limit';
import { CLIP_SECONDS, CLIP_USES, isClipUse, maxClipBytes, type ClipUse } from '$lib/practice/voice-clip';

// Longer than the transcriber's own 40-second wait, so a slow answer isn't cut off after it was paid for.
export const config = { maxDuration: 45 };
const MAX_AUDIO_BYTES = Math.max(...CLIP_USES.map(maxClipBytes));
const perMinute = createLimiter(20, 60_000);

/** What the transcriber is told. Never the sentence they should say: it would make the model "hear" it. */
const CONTEXT: Record<ClipUse, string> = {
	greeting: 'They are answering a friendly question from their coach, or saying one short sentence to check their microphone.',
	'role-play': 'They are a traveler in a short role-play conversation with someone who works at a hotel, an airport or a taxi company.',
	'say-again': 'They are repeating one short sentence after their coach.'
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await englishLearner(request, locals);
	if (user instanceof Response) return user;
	if (!perMinute(user.id)) return tooMany();
	if (!transcriptionConfigured()) return json({ error: 'Transcription unavailable' }, { status: 503 });
	if (Number(request.headers.get('content-length') ?? 0) > MAX_AUDIO_BYTES + 10_000) return json({ error: 'Recording too large' }, { status: 413 });
	let form: FormData;
	try { form = await request.formData(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
	const audio = form.get('audio'), seconds = Number(form.get('seconds')), use = form.get('use');
	if (!isClipUse(use)) return json({ error: 'Invalid request' }, { status: 400 });
	if (!(audio instanceof File) || !audio.size || audio.size > maxClipBytes(use) || !audio.type.startsWith('audio/')) return json({ error: 'Invalid recording' }, { status: 400 });
	if (!Number.isFinite(seconds) || seconds < 0 || seconds > CLIP_SECONDS[use] + 3) return json({ error: 'Invalid recording' }, { status: 400 });
	const refused = await checkAllowance(locals, user);
	if (refused) return refused;
	const overBudget = await spendClip(locals, user, use);
	if (overBudget) return overBudget;
	const transcript = await transcribe(audio, `English ${use}`, CONTEXT[use]);
	if (transcript === null) return json({ error: 'Transcription unavailable' }, { status: 502 });
	return json({ transcript });
};
