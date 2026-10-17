/**
 * "Say it in English" (Module lab).
 *
 * multipart {audio, seconds, item}: transcribes one spoken try (OpenAI; the audio is not stored),
 * then one AI call checks whether the meaning came across and gives a natural way to say it.
 * Returns {transcript, feedback}. Spends one unit of allowance per try.
 *
 * Refused once the day's AI allowance is used up. Nothing the learner said is stored on our server.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { askChain, checkAllowance, englishLearner, recordAllowance } from '$lib/server/english-ai';
import { transcribe, transcriptionConfigured } from '$lib/server/transcribe';
import { createLimiter, tooMany } from '$lib/server/rate-limit';
import { ITEMS, NAMES, SAY_MAX_SECONDS } from '$lib/practice/say-in-english';
import { RawSaySchema, checkSay, sayPrompt, saySchemas, sayUser, type RawSay } from '$lib/server/say-in-english-ai';
import { canUseLab } from '$lib/server/lab-access';

export const config = { maxDuration: 30 };
const MAX_AUDIO_BYTES = 500_000;
const perMinute = createLimiter(20, 60_000);

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await englishLearner(request, locals);
	if (user instanceof Response) return user;
	// A Module lab route: the owner only.
	if (!canUseLab(user)) return json({ error: 'Not found' }, { status: 404 });
	if (!perMinute(user.id)) return tooMany();
	if (!(request.headers.get('content-type') ?? '').startsWith('multipart/form-data')) return json({ error: 'Invalid request' }, { status: 400 });
	if (!transcriptionConfigured()) return json({ error: 'Transcription unavailable' }, { status: 503 });
	if (Number(request.headers.get('content-length') ?? 0) > MAX_AUDIO_BYTES + 10_000) return json({ error: 'Recording too large' }, { status: 413 });

	let form: FormData;
	try { form = await request.formData(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
	const audio = form.get('audio'), seconds = Number(form.get('seconds'));
	const item = ITEMS.find(i => i.id === form.get('item'));
	if (!item) return json({ error: 'Invalid request' }, { status: 400 });
	if (!(audio instanceof File) || !audio.size || audio.size > MAX_AUDIO_BYTES || !audio.type.startsWith('audio/')) return json({ error: 'Invalid recording' }, { status: 400 });
	if (!Number.isFinite(seconds) || seconds < 0 || seconds > SAY_MAX_SECONDS + 5) return json({ error: 'Invalid recording' }, { status: 400 });

	const refused = await checkAllowance(locals, user);
	if (refused) return refused;
	const transcript = await transcribe(audio, 'English say-in-english', `A Persian speaker is saying one or two short sentences in English, ${item.to.en.toLowerCase()}. Names that may come up: ${NAMES}`);
	if (transcript === null) return json({ error: 'Transcription unavailable' }, { status: 502 });
	if (!transcript.trim()) return json({ error: 'Nothing heard' }, { status: 422 });

	const raw = await askChain<RawSay>({
		label: 'English say-in-english', system: sayPrompt(), user: sayUser(item, transcript),
		schema: RawSaySchema, ...saySchemas, temperature: 0.2, maxTokens: 400
	});
	if (!raw) return json({ error: 'AI unavailable', transcript }, { status: 502 });
	await recordAllowance(locals, user, 0, 'say-in-english-v1');
	return json({ transcript, feedback: checkSay(raw, item, transcript) });
};
