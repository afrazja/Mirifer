/**
 * "Say it again, better" (docs/english-say-it-better-spec.md).
 *
 * - multipart {audio, seconds}: transcribes one attempt (OpenAI); the audio
 *   is not stored. Rate-limited, and refused once the daily AI allowance is
 *   used up, but it doesn't spend allowance.
 * - JSON {kind: 'feedback', transcript}: Mira's feedback on the first
 *   attempt. Spends one unit of allowance, and only when it succeeds.
 *
 * Nothing the learner said is stored on our server.
 */
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { askChain, checkAllowance, englishLearner, recordAllowance } from '$lib/server/english-ai';
import { transcribe, transcriptionConfigured } from '$lib/server/transcribe';
import { createLimiter, tooMany } from '$lib/server/rate-limit';
import { readEnglishProfile } from '$lib/practice/english-profile';
import { levelFor } from '$lib/server/coach-ai';
import { MAX_SECONDS } from '$lib/practice/say-better';
import { QUESTION, RawFeedbackSchema, asAnswer, checkFeedback, feedbackPrompt, feedbackSchemas, type RawFeedback } from '$lib/server/say-better-ai';

export const config = { maxDuration: 60 };
/** A minute at 32 kbps is about 0.25 MB; this leaves room for other codecs. */
const MAX_AUDIO_BYTES = 1_500_000;
const perMinute = createLimiter(12, 60_000);
const FeedbackRequest = z.object({ kind: z.literal('feedback'), transcript: z.string().trim().min(1).max(2_000) }).strict();

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await englishLearner(request, locals);
	if (user instanceof Response) return user;
	if (!perMinute(user.id)) return tooMany();

	if ((request.headers.get('content-type') ?? '').startsWith('multipart/form-data')) {
		if (!transcriptionConfigured()) return json({ error: 'Transcription unavailable' }, { status: 503 });
		if (Number(request.headers.get('content-length') ?? 0) > MAX_AUDIO_BYTES + 10_000) return json({ error: 'Recording too large' }, { status: 413 });
		let form: FormData;
		try { form = await request.formData(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
		const audio = form.get('audio'), seconds = Number(form.get('seconds'));
		if (!(audio instanceof File) || !audio.size || audio.size > MAX_AUDIO_BYTES || !audio.type.startsWith('audio/')) return json({ error: 'Invalid recording' }, { status: 400 });
		if (!Number.isFinite(seconds) || seconds < 0 || seconds > MAX_SECONDS + 10) return json({ error: 'Invalid recording' }, { status: 400 });
		const refused = await checkAllowance(locals, user);
		if (refused) return refused;
		const transcript = await transcribe(audio, 'English say-better', `They are answering: "${QUESTION}"`);
		if (transcript === null) return json({ error: 'Transcription unavailable' }, { status: 502 });
		return json({ transcript });
	}

	let input: unknown;
	try { input = await request.json(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
	const parsed = FeedbackRequest.safeParse(input);
	if (!parsed.success) return json({ error: 'Invalid request' }, { status: 400 });
	const refused = await checkAllowance(locals, user);
	if (refused) return refused;

	const { transcript } = parsed.data;
	const system = feedbackPrompt(levelFor(readEnglishProfile(user.user_metadata ?? {})));
	const ask = (note = '') => askChain<RawFeedback>({ label: 'English say-better', system, user: asAnswer(transcript) + note, schema: RawFeedbackSchema, ...feedbackSchemas, temperature: 0.3, maxTokens: 1500 });
	let raw = await ask();
	let checked = raw ? checkFeedback(raw, transcript) : { problem: 'no reply' };
	if ('problem' in checked) {
		raw = await ask(`\n\n(Your last answer could not be used because ${checked.problem}. Answer again, following every rule.)`);
		checked = raw ? checkFeedback(raw, transcript) : { problem: 'no reply' };
	}
	if ('problem' in checked) return json({ error: 'Feedback unavailable' }, { status: 502 });
	await recordAllowance(locals, user, 0, 'say-it-better-v1');
	return json(checked.feedback);
};
