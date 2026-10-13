/**
 * "Quick-fire questions".
 *
 * - multipart {audio, seconds}: transcribes one short answer (OpenAI); the audio is not stored.
 * - JSON {kind: 'turn', turns, asked, last}: the next question, following on from the last answer, and
 *   the last answer said better. One small call, kept short for speed; a question that fails its
 *   checks comes back as null and the browser asks a ready-made follow-up instead. Spends one unit
 *   of allowance per round (on the last answer).
 *
 * Refused once the day's AI allowance is used up. Nothing the learner said is stored on our server.
 */
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { askChain, checkAllowance, englishLearner, recordAllowance } from '$lib/server/english-ai';
import { transcribe, transcriptionConfigured } from '$lib/server/transcribe';
import { createLimiter, tooMany } from '$lib/server/rate-limit';
import { ANSWER_MAX_SECONDS, QUESTIONS_PER_ROUND } from '$lib/practice/quick-fire';
import { RawTurnSchema, asChat, checkTurn, quickFirePrompt, turnSchemas, type RawTurn } from '$lib/server/quick-fire-ai';

export const config = { maxDuration: 30 };
const MAX_AUDIO_BYTES = 500_000;
const perMinute = createLimiter(30, 60_000);
const TurnRequest = z.object({
	kind: z.literal('turn'), last: z.boolean(),
	/** Every question asked so far, skipped ones included, so none is asked twice. */
	asked: z.array(z.string().trim().min(1).max(300)).max(QUESTIONS_PER_ROUND).optional(),
	turns: z.array(z.object({ question: z.string().trim().min(1).max(300), answer: z.string().trim().min(1).max(1_500) }).strict()).min(1).max(QUESTIONS_PER_ROUND)
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
		if (!Number.isFinite(seconds) || seconds < 0 || seconds > ANSWER_MAX_SECONDS + 5) return json({ error: 'Invalid recording' }, { status: 400 });
		const refused = await checkAllowance(locals, user);
		if (refused) return refused;
		const transcript = await transcribe(audio, 'English quick-fire', 'They are answering a short personal question in a friendly chat.');
		if (transcript === null) return json({ error: 'Transcription unavailable' }, { status: 502 });
		return json({ transcript });
	}

	let input: unknown;
	try { input = await request.json(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
	const parsed = TurnRequest.safeParse(input);
	if (!parsed.success) return json({ error: 'Invalid request' }, { status: 400 });
	const refused = await checkAllowance(locals, user);
	if (refused) return refused;
	const { turns, last } = parsed.data;
	const asked = parsed.data.asked?.length ? parsed.data.asked : turns.map(t => t.question);
	const raw = await askChain<RawTurn>({
		label: 'English quick-fire', system: quickFirePrompt(asked.length, last), user: asChat(turns),
		schema: RawTurnSchema, ...turnSchemas, temperature: 0.6, maxTokens: 220
	});
	if (!raw) return json({ next: null, better: null });
	if (last) await recordAllowance(locals, user, 0, 'quick-fire-v1');
	return json(checkTurn(raw, asked, turns[turns.length - 1].answer, last));
};
