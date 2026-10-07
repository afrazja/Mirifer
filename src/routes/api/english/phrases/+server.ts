/**
 * "Natural phrases" (docs/english-shadowing-spec.md): transcribes one short practice
 * clip (≤ 10 s) so the page can check the chunk. The audio is sent once to OpenAI and
 * not stored; the transcript is returned and not stored either.
 *
 * Refused once the day's AI allowance is used up, but a clip never spends allowance,
 * so practice can't use up the story's feedback.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkAllowance, englishLearner } from '$lib/server/english-ai';
import { transcribe, transcriptionConfigured } from '$lib/server/transcribe';
import { createLimiter, tooMany } from '$lib/server/rate-limit';
import { MAX_CLIP_SECONDS } from '$lib/practice/phrases';

export const config = { maxDuration: 30 };
const MAX_AUDIO_BYTES = 300_000;
const perMinute = createLimiter(20, 60_000);

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await englishLearner(request, locals);
	if (user instanceof Response) return user;
	if (!perMinute(user.id)) return tooMany();
	if (!transcriptionConfigured()) return json({ error: 'Transcription unavailable' }, { status: 503 });
	if (Number(request.headers.get('content-length') ?? 0) > MAX_AUDIO_BYTES + 10_000) return json({ error: 'Recording too large' }, { status: 413 });
	let form: FormData;
	try { form = await request.formData(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
	const audio = form.get('audio'), seconds = Number(form.get('seconds'));
	if (!(audio instanceof File) || !audio.size || audio.size > MAX_AUDIO_BYTES || !audio.type.startsWith('audio/')) return json({ error: 'Invalid recording' }, { status: 400 });
	if (!Number.isFinite(seconds) || seconds < 0 || seconds > MAX_CLIP_SECONDS + 3) return json({ error: 'Invalid recording' }, { status: 400 });
	const refused = await checkAllowance(locals, user);
	if (refused) return refused;
	// Generic context only: naming the target sentence would make the model "hear" it.
	const transcript = await transcribe(audio, 'English phrases', 'They are repeating one short sentence after their coach.');
	if (transcript === null) return json({ error: 'Transcription unavailable' }, { status: 502 });
	return json({ transcript });
};
