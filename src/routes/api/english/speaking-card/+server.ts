/**
 * "Speaking card" (docs/english-speaking-card-spec.md).
 *
 * - multipart {audio, seconds, card}: transcribes one talk (OpenAI, split at pauses); the audio
 *   is not stored. Counts against the day's voice budget.
 * - JSON {kind: 'coverage', card, talks: [talk]}: which points the talk covered.
 * - JSON {kind: 'feedback', card, talk, covered}: how the talk was organised, the job for the
 *   phrase (the phrase itself comes from our fixed list) and a better version of the talk.
 *   Each JSON request (coverage or feedback) counts against the day's Practice budget, before it is made.
 *
 * Nothing the learner said is stored on our server.
 */
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { askChain, englishLearner, meteredTranscribe, chargePractice } from '$lib/server/english-ai';
import { transcriptionConfigured } from '$lib/server/transcribe';
import { createLimiter, tooMany } from '$lib/server/rate-limit';
import { JOB_WHY, TALK_MAX_SECONDS, betterProblem, cardById, chooseJob, choosePhrase } from '$lib/practice/speaking-card';
import {
	RawCoverageSchema, RawFeedbackSchema, asTalks, checkCoverage, checkOrganisation, coveragePrompt, coverageSchemas, feedbackPrompt, feedbackSchemas,
	type RawCardFeedback, type RawCoverage
} from '$lib/server/speaking-card-ai';
import { words } from '$lib/practice/say-better';

export const config = { maxDuration: 60 };
const MAX_AUDIO_BYTES = 2_000_000;
const perMinute = createLimiter(12, 60_000);
const TalkInput = z.object({ text: z.string().trim().min(1).max(4_000), cutOff: z.boolean() }).strict();
const Request = z.discriminatedUnion('kind', [
	z.object({ kind: z.literal('coverage'), card: z.number().int(), talks: z.array(TalkInput).length(1) }).strict(),
	z.object({ kind: z.literal('feedback'), card: z.number().int(), talk: TalkInput, covered: z.array(z.boolean()).length(4) }).strict()
]);
const PERSIAN = /[؀-ۿ]/;

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await englishLearner(request, locals);
	if (user instanceof Response) return user;
	// Open to every English learner: the Practice area (docs/landing-plan.md).
	if (!perMinute(user.id)) return tooMany();

	if ((request.headers.get('content-type') ?? '').startsWith('multipart/form-data')) {
		if (!transcriptionConfigured()) return json({ error: 'Transcription unavailable' }, { status: 503 });
		if (Number(request.headers.get('content-length') ?? 0) > MAX_AUDIO_BYTES + 10_000) return json({ error: 'Recording too large' }, { status: 413 });
		let form: FormData;
		try { form = await request.formData(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
		const audio = form.get('audio'), seconds = Number(form.get('seconds')), card = cardById(Number(form.get('card')));
		if (!(audio instanceof File) || !audio.size || audio.size > MAX_AUDIO_BYTES || !audio.type.startsWith('audio/')) return json({ error: 'Invalid recording' }, { status: 400 });
		if (!card || !Number.isFinite(seconds) || seconds < 0 || seconds > TALK_MAX_SECONDS + 10) return json({ error: 'Invalid recording' }, { status: 400 });
		const transcript = await meteredTranscribe(locals, user, 'speaking-card', audio, seconds, 'English speaking card', `They are talking for one to two minutes about this topic: "${card.title.en}" They say several sentences: write every sentence.`, { splitAtPauses: true });
		if (transcript instanceof Response) return transcript;
		return json({ transcript });
	}

	let input: unknown;
	try { input = await request.json(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
	const parsed = Request.safeParse(input);
	if (!parsed.success) return json({ error: 'Invalid request' }, { status: 400 });
	const card = cardById(parsed.data.card);
	if (!card) return json({ error: 'Invalid request' }, { status: 400 });
	// Practice: each AI request counts against the day's Practice budget, before it is made.
	const refused = await chargePractice(locals, user, 'speaking-card');
	if (refused) return refused;

	if (parsed.data.kind === 'coverage') {
		const talks = parsed.data.talks;
		const system = coveragePrompt(card, talks.map(t => t.cutOff));
		const ask = (note = '') => askChain<RawCoverage>({ label: 'English speaking card coverage', system, user: asTalks(talks) + note, schema: RawCoverageSchema, ...coverageSchemas, temperature: 0.2, maxTokens: 1500 });
		let checked = await ask().then(raw => (raw ? checkCoverage(raw, card, talks.map(t => t.text)) : null));
		if (!checked || checked.problems) {
			// One retry; whatever still can't be checked counts as not covered.
			const again = await ask('\n\n(Some quotes in your last answer were not the learner\'s exact words. Copy every "quote" exactly from that talk.)').then(raw => (raw ? checkCoverage(raw, card, talks.map(t => t.text)) : null));
			if (again && (!checked || again.problems <= checked.problems)) checked = again;
		}
		if (!checked) return json({ error: 'Coverage unavailable' }, { status: 502 });
		return json({ talks: checked.coverage });
	}

	const { talk, covered } = parsed.data;
	const system = feedbackPrompt(card, covered, talk.cutOff);
	const ask = (note = '') => askChain<RawCardFeedback>({ label: 'English speaking card feedback', system, user: asTalks([talk]) + note, schema: RawFeedbackSchema, ...feedbackSchemas, temperature: 0.3, maxTokens: 600 });
	let raw = await ask();
	const problems = (r: RawCardFeedback | null) => {
		if (!r) return { line: { problem: 'no reply' } as const, better: 'no reply' };
		return { line: checkOrganisation(r, talk.text), better: betterProblem(r.betterEn.trim(), talk.text) };
	};
	let checked = problems(raw);
	if ('problem' in checked.line || checked.better) {
		const why = 'problem' in checked.line ? checked.line.problem : checked.better;
		const again = await ask(`\n\n(Your last answer could not be used because ${why}. Answer again, following every rule.)`);
		if (again) { raw = again; checked = problems(again); }
	}
	const line = checked.line;
	if (!raw) return json({ error: 'Feedback unavailable' }, { status: 502 });
	const job = chooseJob(covered, raw.job);
	const phrase = choosePhrase(job, talk.text, card);
	const whyEn = raw.whyEn.trim(), whyFa = raw.whyFa.trim();
	const why = job === raw.job && whyEn && words(whyEn).length <= 14 && !PERSIAN.test(whyEn) ? { en: whyEn, fa: PERSIAN.test(whyFa) ? whyFa : JOB_WHY[job].fa } : JOB_WHY[phrase.job];
	// A failed organisation line is left out rather than shown unchecked.
	// A part that still fails its check is left out rather than shown unchecked.
	return json({ organisation: 'problem' in line ? null : line, phrase: phrase.id, why, better: checked.better ? null : raw.betterEn.replace(/\s+/g, ' ').trim() });
};
