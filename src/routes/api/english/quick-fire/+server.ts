/**
 * "Quick-fire questions".
 *
 * - multipart {audio, seconds}: transcribes one short answer (OpenAI); the audio is not stored.
 * - JSON {kind: 'turn', turns, asked, last}: whether the last answer fits its question, the next
 *   question (following on from it), and the last answer corrected and said better. One small call, kept short for speed; a question that fails its
 *   checks comes back as null and the browser asks a ready-made follow-up instead. Spends one unit
 *   of the Practice budget per turn, before it is made.
 *
 * A recording counts against the day's voice budget. Nothing the learner said is stored on our server.
 *
 * `mode: 'path'`: a topic step's Quick chat (topics.ts) on the step path, open to every English
 * learner. It follows the topic and the learner's level, spends the lesson AI allowance (not the
 * Practice budget), and records its outcome for the admin's AI health. Its answers are turned into
 * text by /api/english/listen ('quick-chat').
 */
import { json } from '@sveltejs/kit';
import { canUseLab } from '$lib/server/lab-access';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { askChain, englishLearner, meteredTranscribe, chargePractice, recordAiOutcome, spendAllowance, type ChainOutcome } from '$lib/server/english-ai';
import { topicById, chatQuestions, type TopicLevelId } from '$lib/practice/topics';
import { transcriptionConfigured } from '$lib/server/transcribe';
import { createLimiter, tooMany } from '$lib/server/rate-limit';
import { ANSWER_MAX_SECONDS, QUESTIONS_PER_ROUND } from '$lib/practice/quick-fire';
import { RawTurnSchema, asChat, checkTurn, quickFirePrompt, turnSchemas, type RawTurn } from '$lib/server/quick-fire-ai';

export const config = { maxDuration: 30 };
const MAX_AUDIO_BYTES = 500_000;
const perMinute = createLimiter(30, 60_000);
const TurnRequest = z.object({
	kind: z.literal('turn'), last: z.boolean(),
	/** A topic step on the path: its topic and the learner's level. */
	mode: z.literal('path').optional(), topic: z.string().max(40).optional(), level: z.enum(['a2', 'b1']).optional(),
	/** Every question asked so far, skipped ones included, so none is asked twice. */
	asked: z.array(z.string().trim().min(1).max(300)).max(QUESTIONS_PER_ROUND).optional(),
	turns: z.array(z.object({ question: z.string().trim().min(1).max(300), answer: z.string().trim().min(1).max(1_500) }).strict()).min(1).max(QUESTIONS_PER_ROUND)
}).strict();

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await englishLearner(request, locals);
	if (user instanceof Response) return user;
	if (!perMinute(user.id)) return tooMany();
	const multipart = (request.headers.get('content-type') ?? '').startsWith('multipart/form-data');

	// A topic step on the path: every English learner.
	if (!multipart) {
		let body: unknown;
		try { body = await request.json(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
		const parsed = TurnRequest.safeParse(body);
		if (!parsed.success) return json({ error: 'Invalid request' }, { status: 400 });
		if (parsed.data.mode === 'path') return pathTurn(parsed.data, locals, user);
		// Practice on your own is off for learners for now (owner's decision): the owner only, through the Module lab.
		if (!canUseLab(user)) return json({ error: 'Not found' }, { status: 404 });
		return labTurn(parsed.data, locals, user);
	}
	if (!canUseLab(user)) return json({ error: 'Not found' }, { status: 404 });

	{
		if (!transcriptionConfigured()) return json({ error: 'Transcription unavailable' }, { status: 503 });
		if (Number(request.headers.get('content-length') ?? 0) > MAX_AUDIO_BYTES + 10_000) return json({ error: 'Recording too large' }, { status: 413 });
		let form: FormData;
		try { form = await request.formData(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
		const audio = form.get('audio'), seconds = Number(form.get('seconds'));
		if (!(audio instanceof File) || !audio.size || audio.size > MAX_AUDIO_BYTES || !audio.type.startsWith('audio/')) return json({ error: 'Invalid recording' }, { status: 400 });
		if (!Number.isFinite(seconds) || seconds < 0 || seconds > ANSWER_MAX_SECONDS + 5) return json({ error: 'Invalid recording' }, { status: 400 });
		const transcript = await meteredTranscribe(locals, user, 'quick-fire', audio, seconds, 'English quick-fire', 'They are answering a short personal question in a friendly chat.');
		if (transcript instanceof Response) return transcript;
		return json({ transcript });
	}

};

type Turn = z.infer<typeof TurnRequest>;
type Learner = Exclude<Awaited<ReturnType<typeof englishLearner>>, Response>;

/** The Module lab's Quick-fire: every turn counts against the day's Practice budget, before it is made. */
async function labTurn(input: Turn, locals: App.Locals, user: Learner) {
	const refused = await chargePractice(locals, user, 'quick-fire');
	if (refused) return refused;
	const { turns, last } = input;
	const asked = input.asked?.length ? input.asked : turns.map(t => t.question);
	const raw = await askChain<RawTurn>({
		label: 'English quick-fire', system: quickFirePrompt(asked.length, last), user: asChat(turns),
		schema: RawTurnSchema, ...turnSchemas, temperature: 0.6, maxTokens: 400
	});
	if (!raw) return json({ onTopic: true, next: null, fixed: null, better: null });
	return json(checkTurn(raw, asked, turns[turns.length - 1].answer, last));
}

/** A topic step's Quick chat: the topic and level in the prompt, the lesson AI allowance, and AI health. */
async function pathTurn(input: Turn, locals: App.Locals, user: Learner) {
	const topic = topicById(input.topic);
	const level: TopicLevelId = input.level ?? 'b1';
	if (!topic) return json({ error: 'Invalid request' }, { status: 400 });
	const total = chatQuestions(level);
	const { turns, last } = input;
	if (turns.length > total) return json({ error: 'Invalid request' }, { status: 400 });
	const refused = await spendAllowance(locals, user, turns.length, 'quick-chat');
	if (refused) return refused;
	const asked = input.asked?.length ? input.asked : turns.map(t => t.question);
	let outcome: ChainOutcome | null = null;
	const raw = await askChain<RawTurn>({
		label: 'English quick chat', system: quickFirePrompt(asked.length, last, { title: topic.title.en, focus: topic[level].focus, level, questions: total }),
		user: asChat(turns), schema: RawTurnSchema, ...turnSchemas, temperature: 0.6, maxTokens: 400, onOutcome: o => { outcome = o; }
	});
	if (!raw) { await recordAiOutcome(locals, user, 'quick-chat', 'failed', outcome); return json({ onTopic: true, next: null, fixed: null, better: null }); }
	// A2: 12 counted words (words() splits "What's" in two) and a short better answer.
	const reply = checkTurn(raw, asked, turns[turns.length - 1].answer, last, level === 'a2' ? 12 : 15, level === 'a2' ? 25 : 50);
	// A next question that failed its checks means a ready-made follow-up (a prepared line).
	await recordAiOutcome(locals, user, 'quick-chat', !last && !reply.next ? 'fallback' : 'ok', outcome);
	return json(reply);
}
