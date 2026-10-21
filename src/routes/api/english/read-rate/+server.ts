/**
 * "Read, rate, respond".
 *
 * - multipart {audio, seconds}: transcribes one spoken reply (OpenAI); the audio is not stored.
 * - JSON {kind: 'feedback', text, rating, reply}: checks the reply against the text the learner read
 *   (facts used, any wrong, a reason) and writes a better reply. One unit of the Practice budget.
 *
 * A recording counts against the day's voice budget. Nothing the learner said is stored on our server.
 */
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { askChain, englishLearner, meteredTranscribe, chargePractice } from '$lib/server/english-ai';
import { transcriptionConfigured } from '$lib/server/transcribe';
import { createLimiter, tooMany } from '$lib/server/rate-limit';
import { RESPOND_MAX_SECONDS, TEXTS, validRating } from '$lib/practice/read-rate';
import { RawFeedbackSchema, checkFeedback, feedbackSchemas, readRatePrompt, readRateUser, type RawFeedback } from '$lib/server/read-rate-ai';
import { canUseLab } from '$lib/server/lab-access';

export const config = { maxDuration: 30 };
const MAX_AUDIO_BYTES = 900_000;
const perMinute = createLimiter(20, 60_000);
const NAMES: Record<string, string> = { 'hotel-review': 'Bella Vista, Wi-Fi.', 'friend-message': 'Leila, Dubai.', 'gym-ad': 'FitZone.' };
const FeedbackRequest = z.object({
	kind: z.literal('feedback'),
	text: z.string().max(40),
	rating: z.number().int(),
	reply: z.string().trim().min(1).max(2_000)
}).strict();

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await englishLearner(request, locals);
	if (user instanceof Response) return user;
	// A Module lab route: the owner only.
	if (!canUseLab(user)) return json({ error: 'Not found' }, { status: 404 });
	if (!perMinute(user.id)) return tooMany();

	if ((request.headers.get('content-type') ?? '').startsWith('multipart/form-data')) {
		if (!transcriptionConfigured()) return json({ error: 'Transcription unavailable' }, { status: 503 });
		if (Number(request.headers.get('content-length') ?? 0) > MAX_AUDIO_BYTES + 10_000) return json({ error: 'Recording too large' }, { status: 413 });
		let form: FormData;
		try { form = await request.formData(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
		const audio = form.get('audio'), seconds = Number(form.get('seconds'));
		if (!(audio instanceof File) || !audio.size || audio.size > MAX_AUDIO_BYTES || !audio.type.startsWith('audio/')) return json({ error: 'Invalid recording' }, { status: 400 });
		if (!Number.isFinite(seconds) || seconds < 0 || seconds > RESPOND_MAX_SECONDS + 5) return json({ error: 'Invalid recording' }, { status: 400 });
		// Names from the text they read help the speech-to-text get them right.
		const read = TEXTS.find(t => t.id === form.get('text'));
		const names = read ? ` Names that may come up: ${NAMES[read.id] ?? ''}` : '';
		const transcript = await meteredTranscribe(locals, user, 'read-rate', audio, seconds, 'English read-rate', `They are giving their opinion about a short text they just read: a review, a message or an ad.${names}`);
		if (transcript instanceof Response) return transcript;
		return json({ transcript });
	}

	let input: unknown;
	try { input = await request.json(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
	const parsed = FeedbackRequest.safeParse(input);
	if (!parsed.success) return json({ error: 'Invalid request' }, { status: 400 });
	const text = TEXTS.find(t => t.id === parsed.data.text);
	if (!text || !validRating(text, parsed.data.rating)) return json({ error: 'Invalid request' }, { status: 400 });
	const refused = await chargePractice(locals, user, 'read-rate');
	if (refused) return refused;
	const raw = await askChain<RawFeedback>({
		label: 'English read-rate', system: readRatePrompt(), user: readRateUser(text, parsed.data.rating, parsed.data.reply),
		schema: RawFeedbackSchema, ...feedbackSchemas, temperature: 0.3, maxTokens: 500
	});
	if (!raw) return json({ error: 'AI unavailable' }, { status: 502 });
	return json(checkFeedback(raw, text, parsed.data.reply));
};
