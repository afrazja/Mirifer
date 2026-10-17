/**
 * "Persian-speaker traps" lab: transcribes one spoken sentence (OpenAI). It is never given the
 * sentence or its words (it would write the correct version back), and it's asked to keep any
 * grammar mistakes; the check is done on the device. The audio is not stored. Refused once the
 * day's AI allowance is used up, but it doesn't spend it.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { checkAllowance, englishLearner } from '$lib/server/english-ai';
import { transcribe, transcriptionConfigured } from '$lib/server/transcribe';
import { createLimiter, tooMany } from '$lib/server/rate-limit';
import { SAY_MAX_SECONDS } from '$lib/practice/traps';
import { canUseLab } from '$lib/server/lab-access';

const MAX_AUDIO_BYTES = 300_000;
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
	if (!Number.isFinite(seconds) || seconds < 0 || seconds > SAY_MAX_SECONDS + 5) return json({ error: 'Invalid recording' }, { status: 400 });

	const refused = await checkAllowance(locals, user);
	if (refused) return refused;
	// A neutral hint without the sentence's words; asks to keep mistakes (the check needs them).
	const transcript = await transcribe(audio, 'English traps lab', 'A learner of English is saying one short everyday sentence. Write exactly what they say, word for word, keeping any grammar mistakes; do not correct anything. Example of the style: "Yesterday I go to the market and buy apple."');
	if (transcript === null) return json({ error: 'Transcription unavailable' }, { status: 502 });
	return json({ transcript });
};
