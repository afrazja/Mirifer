/**
 * "Shadowing" lab (docs/english-shadowing-lab-spec.md): transcribes one spoken answer (OpenAI).
 * It is never given the sentence or any of its words, so it can't write the sentence back; the
 * check is done on the device. The audio is not stored. Refused once the day's AI allowance is
 * used up, but it doesn't spend it.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkAllowance, englishLearner } from '$lib/server/english-ai';
import { transcribe, transcriptionConfigured } from '$lib/server/transcribe';
import { createLimiter, tooMany } from '$lib/server/rate-limit';
import { ANSWER_MAX_SECONDS } from '$lib/practice/shadowing-lab';
import { canUseLab } from '$lib/server/lab-access';

const MAX_AUDIO_BYTES = 400_000;
const perMinute = createLimiter(20, 60_000);

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await englishLearner(request, locals);
	if (user instanceof Response) return user;
	// A Module lab route: the owner only.
	if (!canUseLab(user)) return json({ error: 'Not found' }, { status: 404 });
	if (!perMinute(user.id)) return tooMany();
	if (!transcriptionConfigured()) return json({ error: 'Transcription unavailable' }, { status: 503 });
	if (Number(request.headers.get('content-length') ?? 0) > MAX_AUDIO_BYTES + 10_000) return json({ error: 'Recording too large' }, { status: 413 });
	let form: FormData;
	try { form = await request.formData(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
	const audio = form.get('audio'), seconds = Number(form.get('seconds'));
	if (!(audio instanceof File) || !audio.size || audio.size > MAX_AUDIO_BYTES || !audio.type.startsWith('audio/')) return json({ error: 'Invalid recording' }, { status: 400 });
	if (!Number.isFinite(seconds) || seconds < 0 || seconds > ANSWER_MAX_SECONDS + 5) return json({ error: 'Invalid recording' }, { status: 400 });
	const refused = await checkAllowance(locals, user);
	if (refused) return refused;
	// A neutral hint that never contains the sentence or its words (it would write the sentence back);
	// no splitting at pauses, which hurts a short clip.
	const transcript = await transcribe(audio, 'English shadowing lab', 'They are repeating one everyday English sentence they just heard.');
	if (transcript === null) return json({ error: 'Transcription unavailable' }, { status: 502 });
	return json({ transcript });
};
