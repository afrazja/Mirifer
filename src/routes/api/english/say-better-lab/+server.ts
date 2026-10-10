/**
 * "Say it again, better", Module lab version (docs/english-say-better-lab-spec.md).
 *
 * - multipart {audio, seconds, question}: transcribes one try (OpenAI), with the
 *   question as context; the audio is not stored. Refused once the day's AI
 *   allowance is used up, but it doesn't spend it.
 * - JSON {kind: 'feedback', question, transcript, cutOff}: Mira's feedback on the
 *   first try. The question is sent as an id and read from our own list. Spends one
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
import { LAB_MAX_SECONDS, labQuestion } from '$lib/practice/say-better-lab';
import { RawLabSchema, asAnswer, checkLabFeedback, labPrompt, labSchemas, type RawLab } from '$lib/server/say-better-lab-ai';

export const config = { maxDuration: 60 };
const MAX_AUDIO_BYTES = 1_200_000;
const perMinute = createLimiter(12, 60_000);
const FeedbackRequest = z.object({
	kind: z.literal('feedback'), question: z.number().int().min(1).max(6),
	transcript: z.string().trim().min(1).max(2_000), cutOff: z.boolean()
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
		const audio = form.get('audio'), seconds = Number(form.get('seconds')), question = labQuestion(Number(form.get('question')));
		if (!(audio instanceof File) || !audio.size || audio.size > MAX_AUDIO_BYTES || !audio.type.startsWith('audio/')) return json({ error: 'Invalid recording' }, { status: 400 });
		if (!question || !Number.isFinite(seconds) || seconds < 0 || seconds > LAB_MAX_SECONDS + 10) return json({ error: 'Invalid recording' }, { status: 400 });
		const refused = await checkAllowance(locals, user);
		if (refused) return refused;
		const transcript = await transcribe(audio, 'English say-better lab', `They are answering: "${question.text}"`);
		if (transcript === null) return json({ error: 'Transcription unavailable' }, { status: 502 });
		return json({ transcript });
	}

	let input: unknown;
	try { input = await request.json(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
	const parsed = FeedbackRequest.safeParse(input);
	if (!parsed.success) return json({ error: 'Invalid request' }, { status: 400 });
	const refused = await checkAllowance(locals, user);
	if (refused) return refused;

	const { transcript, cutOff } = parsed.data;
	const question = labQuestion(parsed.data.question)!;
	const system = labPrompt(levelFor(readEnglishProfile(user.user_metadata ?? {})), question, cutOff);
	const ask = (note = '') => askChain<RawLab>({ label: 'English say-better lab', system, user: asAnswer(transcript) + note, schema: RawLabSchema, ...labSchemas, temperature: 0.3, maxTokens: 2500 });
	let raw = await ask();
	let checked = raw ? checkLabFeedback(raw, transcript) : { problem: 'no reply' };
	if ('problem' in checked) {
		raw = await ask(`\n\n(Your last answer could not be used because ${checked.problem}. Answer again, following every rule: copy every "original" exactly from the transcript.)`);
		checked = raw ? checkLabFeedback(raw, transcript) : { problem: 'no reply' };
	}
	if ('problem' in checked) return json({ error: 'Feedback unavailable' }, { status: 502 });
	await recordAllowance(locals, user, 0, 'say-better-lab-v1');
	return json(checked.feedback);
};
