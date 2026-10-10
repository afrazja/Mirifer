/**
 * "Choose and persuade" (docs/english-choose-persuade-spec.md).
 *
 * - multipart {audio, seconds}: transcribes one recording (OpenAI); the audio is not
 *   stored. Refused once the day's AI allowance is used up, but it doesn't spend it.
 * - JSON {kind: 'feedback', flat, reasons, answer}: Mira's feedback. The objection is
 *   worked out again here from the reasons (never taken from the browser). Spends one
 *   unit of allowance, only when it succeeds.
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
import { REASONS_MAX, pickObjection } from '$lib/practice/persuade';
import { RawPersuadeSchema, asTranscripts, checkPersuade, persuadePrompt, persuadeSchemas, type RawPersuade } from '$lib/server/persuade-ai';

export const config = { maxDuration: 60 };
const MAX_AUDIO_BYTES = 1_500_000;
const perMinute = createLimiter(12, 60_000);
const FeedbackRequest = z.object({
	kind: z.literal('feedback'), flat: z.enum(['a', 'b']),
	reasons: z.string().trim().min(1).max(2_000), answer: z.string().trim().min(1).max(2_000)
}).strict();

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
		if (!Number.isFinite(seconds) || seconds < 0 || seconds > REASONS_MAX + 10) return json({ error: 'Invalid recording' }, { status: 400 });
		const refused = await checkAllowance(locals, user);
		if (refused) return refused;
		const transcript = await transcribe(audio, 'English persuade', 'They are explaining which of two apartments they would rent, and why.');
		if (transcript === null) return json({ error: 'Transcription unavailable' }, { status: 502 });
		return json({ transcript });
	}

	let input: unknown;
	try { input = await request.json(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
	const parsed = FeedbackRequest.safeParse(input);
	if (!parsed.success) return json({ error: 'Invalid request' }, { status: 400 });
	const refused = await checkAllowance(locals, user);
	if (refused) return refused;

	const { flat, reasons, answer } = parsed.data;
	const objection = pickObjection(flat, reasons);
	const system = persuadePrompt(levelFor(readEnglishProfile(user.user_metadata ?? {})), flat, objection.line, objection.point);
	const ask = (note = '') => askChain<RawPersuade>({ label: 'English persuade', system, user: asTranscripts(reasons, answer) + note, schema: RawPersuadeSchema, ...persuadeSchemas, temperature: 0.3, maxTokens: 1500 });
	let raw = await ask();
	let checked = raw ? checkPersuade(raw, reasons, answer, flat, objection.point) : null;
	if (!checked || checked.verdictProblem) {
		// One retry; whatever still can't be checked is left out, part by part.
		const again = await ask('\n\n(Your last answer could not be used: every "evidence" and "quote" must be the learner\'s exact words. Answer again, following every rule.)');
		const second = again ? checkPersuade(again, reasons, answer, flat, objection.point) : null;
		if (second) { raw = again; checked = second; }
	}
	if (!checked) return json({ error: 'Feedback unavailable' }, { status: 502 });
	await recordAllowance(locals, user, 0, 'choose-persuade-v1');
	return json(checked.feedback);
};
