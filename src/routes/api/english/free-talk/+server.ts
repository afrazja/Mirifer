/**
 * "60-second free talk" (docs/english-free-talk-spec.md): transcribes one talk (OpenAI, split at
 * pauses); the audio is not stored. There is no AI judging: words are counted on the device.
 * Counts against the day's voice budget.
 */
import { json } from '@sveltejs/kit';
import { canUseLab } from '$lib/server/lab-access';
import type { RequestHandler } from './$types';
import { englishLearner, meteredTranscribe } from '$lib/server/english-ai';
import { transcriptionConfigured } from '$lib/server/transcribe';
import { createLimiter, tooMany } from '$lib/server/rate-limit';
import { TALK_SECONDS, TOPICS } from '$lib/practice/free-talk';

export const config = { maxDuration: 60 };
const MAX_AUDIO_BYTES = 1_200_000;
const perMinute = createLimiter(8, 60_000);

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await englishLearner(request, locals);
	if (user instanceof Response) return user;
	// Practice on your own is off for learners for now (owner's decision): the owner only, through the Module lab.
	if (!canUseLab(user)) return json({ error: 'Not found' }, { status: 404 });
	// Open to every English learner: the Practice area (docs/landing-plan.md).
	if (!perMinute(user.id)) return tooMany();
	if (!transcriptionConfigured()) return json({ error: 'Transcription unavailable' }, { status: 503 });
	if (Number(request.headers.get('content-length') ?? 0) > MAX_AUDIO_BYTES + 10_000) return json({ error: 'Recording too large' }, { status: 413 });
	let form: FormData;
	try { form = await request.formData(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
	const audio = form.get('audio'), seconds = Number(form.get('seconds')), topic = TOPICS[Number(form.get('topic'))];
	if (!(audio instanceof File) || !audio.size || audio.size > MAX_AUDIO_BYTES || !audio.type.startsWith('audio/')) return json({ error: 'Invalid recording' }, { status: 400 });
	if (!topic || !Number.isFinite(seconds) || seconds < 0 || seconds > TALK_SECONDS + 10) return json({ error: 'Invalid recording' }, { status: 400 });
	const transcript = await meteredTranscribe(locals, user, 'free-talk', audio, seconds, 'English free talk', `They are talking for a minute about: "${topic.en}". They say several sentences: write every sentence.`, { splitAtPauses: true });
	if (transcript instanceof Response) return transcript;
	return json({ transcript });
};
