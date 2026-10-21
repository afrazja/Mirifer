/**
 * "Find the missing information" (docs/english-missing-info-spec.md).
 *
 * - multipart {audio, seconds}: transcribes one question (OpenAI); the audio is not stored.
 *   Counts against the day's voice budget.
 * - JSON {kind: 'turn', turns}: Tom's reply to the latest question. The card's state is worked
 *   out again here from the conversation; every number Tom says is checked.
 * - JSON {kind: 'feedback', turns}: Mira's feedback on the questions. Spends one unit of
 *   Practice budget per request, turns included, counted before it is made.
 *
 * Nothing the learner said is stored on our server.
 */
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { askChain, englishLearner, meteredTranscribe, chargePractice } from '$lib/server/english-ai';
import { transcriptionConfigured } from '$lib/server/transcribe';
import { createLimiter, tooMany } from '$lib/server/rate-limit';
import { readEnglishProfile } from '$lib/practice/english-profile';
import { levelFor } from '$lib/server/coach-ai';
import { GAP_IDS, MAX_QUESTIONS, QUESTION_MAX_SECONDS, SAFE_LINE, deskState, type Turn } from '$lib/practice/missing-info';
import { canUseLab } from '$lib/server/lab-access';
import {
	RawQuestionsSchema, RawTomSchema, asConversation, asNumberedConversation, checkQuestions, checkTom, questionsPrompt, questionsSchemas, tomPrompt, tomSchemas,
	type RawQuestions, type RawTom
} from '$lib/server/missing-info-ai';

export const config = { maxDuration: 60 };
const MAX_AUDIO_BYTES = 400_000;
const perMinute = createLimiter(30, 60_000);
const TurnSchema = z.union([
	z.object({ who: z.literal('you'), text: z.string().trim().min(1).max(400), kind: z.enum(['question', 'answer', 'other', 'pending']), typed: z.boolean().optional() }).strict(),
	z.object({ who: z.literal('tom'), text: z.string().trim().min(1).max(600), kind: z.enum(['answer', 'askBack', 'other']), found: z.array(z.enum(GAP_IDS as [string, ...string[]])).max(4) }).strict()
]);
const Request = z.object({ kind: z.enum(['turn', 'feedback']), turns: z.array(TurnSchema).min(1).max(MAX_QUESTIONS * 3 + 6) }).strict();

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
		if (!Number.isFinite(seconds) || seconds < 0 || seconds > QUESTION_MAX_SECONDS + 5) return json({ error: 'Invalid recording' }, { status: 400 });
		const transcript = await meteredTranscribe(locals, user, 'missing-info', audio, seconds, 'English missing-info', 'Someone talking to the ticket seller at a train station. They may say several sentences: write every sentence.', { splitAtPauses: true });
		if (transcript instanceof Response) return transcript;
		return json({ transcript });
	}

	let input: unknown;
	try { input = await request.json(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
	const parsed = Request.safeParse(input);
	if (!parsed.success) return json({ error: 'Invalid request' }, { status: 400 });
	// Practice-type module: every AI request (turns included) counts against the Practice budget, before it is made.
	const refused = await chargePractice(locals, user, 'missing-info');
	if (refused) return refused;
	const turns = parsed.data.turns as Turn[];

	if (parsed.data.kind === 'turn') {
		const last = turns[turns.length - 1];
		if (last.who !== 'you') return json({ error: 'Invalid request' }, { status: 400 });
		const before = deskState(turns.slice(0, -1));
		const system = tomPrompt(before);
		const ask = (note = '') => askChain<RawTom>({ label: 'English missing-info', system, user: asConversation(turns) + note, schema: RawTomSchema, ...tomSchemas, temperature: 0.4, maxTokens: 400 });
		let raw = await ask();
		let checked = raw ? checkTom(raw, before) : { problem: 'no reply' };
		if ('problem' in checked) {
			raw = await ask(`\n\n(Your last reply could not be used because ${checked.problem}. Reply again, using only the fact sheet.)`);
			checked = raw ? checkTom(raw, before) : { problem: 'no reply' };
		}
		// Never a made-up fact: the safe line, and the turn doesn't count.
		if ('problem' in checked) return json({ reply: SAFE_LINE, kind: 'other', learner: 'other', found: [] });
		return json(checked.tom);
	}

	const system = questionsPrompt(levelFor(readEnglishProfile(user.user_metadata ?? {})));
	const ask = (note = '') => askChain<RawQuestions>({ label: 'English missing-info feedback', system, user: asNumberedConversation(turns) + note, schema: RawQuestionsSchema, ...questionsSchemas, temperature: 0.3, maxTokens: 2000 });
	let raw = await ask();
	let checked = raw ? checkQuestions(raw, turns) : { problem: 'no reply' };
	if ('problem' in checked) {
		raw = await ask(`\n\n(Your last answer could not be used because ${checked.problem}. Answer again, following every rule.)`);
		checked = raw ? checkQuestions(raw, turns) : { problem: 'no reply' };
	}
	if ('problem' in checked) return json({ error: 'Feedback unavailable' }, { status: 502 });
	return json(checked.feedback);
};
