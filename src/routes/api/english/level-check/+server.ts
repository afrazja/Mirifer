/**
 * The onboarding level check (docs/english-level-check-spec.md): one recording at a time, either a
 * repeated sentence or the ~30-second talk. Each is transcribed once (inside the daily voice budget)
 * and answered with a result only: whether the sentence was said, or the talk's starting band. The
 * audio and the transcript are not stored, and never sent back.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { askChain, englishLearner, meteredTranscribe, spendAllowance } from '$lib/server/english-ai';
import { transcriptionConfigured } from '$lib/server/transcribe';
import { createLimiter, tooMany } from '$lib/server/rate-limit';
import { REPEAT_MAX_SECONDS, REPEAT_PASS, REPEAT_SENTENCES, TALK_MAX_SECONDS, TALK_QUESTION, englishWords, isNoAnswer, mostlyPersian, repeatScore, talkBand } from '$lib/practice/level-check';
import { JudgementSchema, LEVEL_CHECK_PROMPT, judgementSchemas, levelCheckUser, toJudgement } from '$lib/server/level-check-ai';

export const config = { maxDuration: 45 };
const maxBytes = (seconds: number) => seconds * 16_000 + 20_000;
const perMinute = createLimiter(12, 60_000);

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await englishLearner(request, locals);
	if (user instanceof Response) return user;
	if (!perMinute(user.id)) return tooMany();
	if (!transcriptionConfigured()) return json({ error: 'Transcription unavailable' }, { status: 503 });
	if (Number(request.headers.get('content-length') ?? 0) > maxBytes(TALK_MAX_SECONDS) + 10_000) return json({ error: 'Recording too large' }, { status: 413 });
	let form: FormData;
	try { form = await request.formData(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
	const kind = form.get('kind'), audio = form.get('audio'), seconds = Number(form.get('seconds'));
	if (kind !== 'repeat' && kind !== 'talk') return json({ error: 'Invalid request' }, { status: 400 });
	const limit = kind === 'repeat' ? REPEAT_MAX_SECONDS : TALK_MAX_SECONDS;
	if (!(audio instanceof File) || !audio.size || audio.size > maxBytes(limit) || !audio.type.startsWith('audio/')) return json({ error: 'Invalid recording' }, { status: 400 });
	if (!Number.isFinite(seconds) || seconds < 0 || seconds > limit + 3) return json({ error: 'Invalid recording' }, { status: 400 });

	if (kind === 'repeat') {
		const index = Number(form.get('index'));
		const target = REPEAT_SENTENCES[index as 0 | 1];
		if (!Number.isInteger(index) || !target) return json({ error: 'Invalid request' }, { status: 400 });
		// A neutral context: naming the sentence would make the model "hear" it.
		const transcript = await meteredTranscribe(locals, user, 'level-check', audio, seconds, 'English level check', 'The speaker is repeating a short everyday sentence.');
		if (transcript instanceof Response) return transcript;
		if (isNoAnswer(transcript, seconds)) return json({ passed: null });
		return json({ passed: repeatScore(target, transcript) >= REPEAT_PASS });
	}

	const attempt = form.get('try') === '2' ? 2 : 1;
	const transcript = await meteredTranscribe(locals, user, 'level-check', audio, seconds, 'English level check', `They are answering: "${TALK_QUESTION}"`, { anyLanguage: true });
	if (transcript instanceof Response) return transcript;
	if (mostlyPersian(transcript)) return json(attempt === 1 ? { retry: 'persian' } : { band: 'hard' });
	const count = englishWords(transcript);
	if (isNoAnswer(transcript, seconds) || count < 3) return json(attempt === 1 ? { retry: 'short' } : { band: null });
	if (count < 8) return json({ band: 'hard' });
	// Over today's AI allowance (or it can't be counted): the words alone decide, never natural.
	const refused = await spendAllowance(locals, user, 0, 'level-check');
	const raw = refused ? null : await askChain({
		label: 'English level check', system: LEVEL_CHECK_PROMPT, user: levelCheckUser(transcript, count, seconds),
		schema: JudgementSchema, ...judgementSchemas, temperature: 0, maxTokens: 200
	});
	return json({ band: talkBand(toJudgement(raw), count) });
};
