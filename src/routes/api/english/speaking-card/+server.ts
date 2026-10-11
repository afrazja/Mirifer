/**
 * "Speaking card" (docs/english-speaking-card-spec.md).
 *
 * - multipart {audio, seconds, card}: transcribes one talk (OpenAI, split at pauses); the audio
 *   is not stored. Refused once the day's AI allowance is used up, but it doesn't spend it.
 * - JSON {kind: 'coverage', card, talks}: which points each talk covered, judged the same way
 *   for one talk or both (the second call judges both again).
 * - JSON {kind: 'feedback', card, talk, cutOff, covered}: how the first talk was organised,
 *   and the job for the phrase (the phrase itself comes from our fixed list). Spends one unit
 *   of allowance, only when it succeeds.
 *
 * Nothing the learner said is stored on our server.
 */
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { RequestHandler } from './$types';
import { askChain, checkAllowance, englishLearner, recordAllowance } from '$lib/server/english-ai';
import { transcribe, transcriptionConfigured } from '$lib/server/transcribe';
import { createLimiter, tooMany } from '$lib/server/rate-limit';
import { JOB_WHY, TALK_MAX_SECONDS, cardById, chooseJob, choosePhrase } from '$lib/practice/speaking-card';
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
	z.object({ kind: z.literal('coverage'), card: z.number().int(), talks: z.array(TalkInput).min(1).max(2) }).strict(),
	z.object({ kind: z.literal('feedback'), card: z.number().int(), talk: TalkInput, covered: z.array(z.boolean()).length(4) }).strict()
]);
const PERSIAN = /[؀-ۿ]/;

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await englishLearner(request, locals);
	if (user instanceof Response) return user;
	if (!perMinute(user.id)) return tooMany();

	if ((request.headers.get('content-type') ?? '').startsWith('multipart/form-data')) {
		if (!transcriptionConfigured()) return json({ error: 'Transcription unavailable' }, { status: 503 });
		if (Number(request.headers.get('content-length') ?? 0) > MAX_AUDIO_BYTES + 10_000) return json({ error: 'Recording too large' }, { status: 413 });
		let form: FormData;
		try { form = await request.formData(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
		const audio = form.get('audio'), seconds = Number(form.get('seconds')), card = cardById(Number(form.get('card')));
		if (!(audio instanceof File) || !audio.size || audio.size > MAX_AUDIO_BYTES || !audio.type.startsWith('audio/')) return json({ error: 'Invalid recording' }, { status: 400 });
		if (!card || !Number.isFinite(seconds) || seconds < 0 || seconds > TALK_MAX_SECONDS + 10) return json({ error: 'Invalid recording' }, { status: 400 });
		const refused = await checkAllowance(locals, user);
		if (refused) return refused;
		const transcript = await transcribe(audio, 'English speaking card', `They are talking for one to two minutes about this topic: "${card.title.en}" They say several sentences: write every sentence.`, { splitAtPauses: true });
		if (transcript === null) return json({ error: 'Transcription unavailable' }, { status: 502 });
		return json({ transcript });
	}

	let input: unknown;
	try { input = await request.json(); } catch { return json({ error: 'Invalid request' }, { status: 400 }); }
	const parsed = Request.safeParse(input);
	if (!parsed.success) return json({ error: 'Invalid request' }, { status: 400 });
	const card = cardById(parsed.data.card);
	if (!card) return json({ error: 'Invalid request' }, { status: 400 });
	const refused = await checkAllowance(locals, user);
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
	let line = raw ? checkOrganisation(raw, talk.text) : { problem: 'no reply' };
	if ('problem' in line) {
		raw = await ask(`\n\n(Your last answer could not be used because ${line.problem}. Answer again, following every rule.)`) ?? raw;
		line = raw ? checkOrganisation(raw, talk.text) : { problem: 'no reply' };
	}
	if (!raw) return json({ error: 'Feedback unavailable' }, { status: 502 });
	const job = chooseJob(covered, raw.job);
	const phrase = choosePhrase(job, talk.text, card);
	const whyEn = raw.whyEn.trim(), whyFa = raw.whyFa.trim();
	const why = job === raw.job && whyEn && words(whyEn).length <= 14 && !PERSIAN.test(whyEn) ? { en: whyEn, fa: PERSIAN.test(whyFa) ? whyFa : JOB_WHY[job].fa } : JOB_WHY[phrase.job];
	await recordAllowance(locals, user, 0, 'speaking-card-v1');
	// A failed organisation line is left out rather than shown unchecked.
	return json({ organisation: 'problem' in line ? null : line, phrase: phrase.id, why });
};
