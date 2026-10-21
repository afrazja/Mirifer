/**
 * Shared plumbing for the English course's AI routes (/api/english/converse
 * and /api/english/review): account checks, the daily allowance, and the
 * Gemini → DeepSeek → OpenAI provider chain with JSON-schema output.
 */

import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { z } from 'zod';
import type { User } from '@supabase/supabase-js';
import { isAdminEmail } from '$lib/server/admin-auth';
import { transcribe } from '$lib/server/transcribe';

/** A conversation is roughly 6–12 turns, so this allows a few full runs a day. */
export const MAX_DAILY_TURNS = 40;
export const MAX_ADMIN_DAILY_TURNS = 150;

type Locals = App.Locals;

export const aiConfigured = () => !!(env.GEMINI_API_KEY || env.DEEPSEEK_API_KEY || env.OPENAI_API_KEY);

/** The signed-in English learner, or the error response to return. */
export async function englishLearner(request: Request, locals: Locals): Promise<User | Response> {
	if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'Origin rejected' }, { status: 403 });
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	if (error || !user) return json({ error: 'Sign in required' }, { status: 401 });
	if (user.user_metadata?.target_language !== 'en') return json({ error: 'English course required' }, { status: 409 });
	if (!aiConfigured()) return json({ error: 'AI unavailable' }, { status: 503 });
	return user;
}

/** Whether the learner may make another AI request today; the error response if not. Records nothing. */
export async function checkAllowance(locals: Locals, user: User): Promise<Response | null> {
	const today = new Date(); today.setUTCHours(0, 0, 0, 0);
	const { count, error: countError } = await locals.supabase.from('events').select('id', { count: 'exact', head: true })
		.eq('user_id', user.id).eq('event_name', 'english_ai_requested').gte('created_at', today.toISOString());
	if (countError || count === null) return json({ error: 'AI temporarily unavailable' }, { status: 503 });
	if (count >= MAX_DAILY_TURNS && (count >= MAX_ADMIN_DAILY_TURNS || !(await isAdminTester(locals, user)))) {
		return json({ error: 'Daily AI limit reached' }, { status: 429 });
	}
	return null;
}

/**
 * Every recording that is turned into text counts against a daily voice budget: at most this many
 * clips, and at most this much audio. A full day's lesson uses about 30–60 clips and 5–10 minutes.
 * The audio counted is what the transcription service billed (or, if it doesn't say, the length the
 * page reported), recorded after each clip, so the budget follows what the clips really cost.
 */
export const MAX_DAILY_CLIPS = 150;
export const MAX_ADMIN_DAILY_CLIPS = 400;
export const MAX_DAILY_AUDIO_SECONDS = 60 * 60;
export const MAX_ADMIN_DAILY_AUDIO_SECONDS = 3 * 60 * 60;
const CLIP_EVENT = 'english_clip_transcribed';

async function isAdminTester(locals: Locals, user: User): Promise<boolean> {
	if (user.email_confirmed_at && isAdminEmail(user.email)) return true;
	const { data: profile } = await locals.supabase.from('user_profiles').select('is_admin').eq('id', user.id).maybeSingle();
	return profile?.is_admin === true;
}

const startOfDay = () => { const today = new Date(); today.setUTCHours(0, 0, 0, 0); return today.toISOString(); };

/** Whether today's voice budget has room for another clip; the error response if not. Records nothing. */
export async function checkClipBudget(locals: Locals, user: User): Promise<Response | null> {
	const { data, error } = await locals.supabase.from('events').select('metadata')
		.eq('user_id', user.id).eq('event_name', CLIP_EVENT).gte('created_at', startOfDay()).limit(MAX_ADMIN_DAILY_CLIPS + 1);
	if (error || !Array.isArray(data)) return json({ error: 'Transcription temporarily unavailable' }, { status: 503 });
	const count = data.length;
	const seconds = data.reduce((sum, row) => {
		const value = (row as { metadata?: { audio_seconds?: unknown } }).metadata?.audio_seconds;
		return sum + (typeof value === 'number' && Number.isFinite(value) ? value : 0);
	}, 0);
	const over = (clips: number, audio: number) => count >= clips || seconds >= audio;
	if (over(MAX_DAILY_CLIPS, MAX_DAILY_AUDIO_SECONDS) && (over(MAX_ADMIN_DAILY_CLIPS, MAX_ADMIN_DAILY_AUDIO_SECONDS) || !(await isAdminTester(locals, user)))) {
		return json({ error: 'Daily voice limit reached' }, { status: 429 });
	}
	return null;
}

/** Counts one clip and its audio length against today's voice budget. */
export async function recordClip(locals: Locals, user: User, route: string, audioSeconds: number): Promise<void> {
	try {
		await locals.supabase.from('events').insert({
			user_id: user.id, event_id: crypto.randomUUID(), session_id: crypto.randomUUID(), attempt_id: null,
			event_name: CLIP_EVENT, day: null, occurred_at: new Date().toISOString(), schema_version: 2,
			metadata: { course: 'en', route, audio_seconds: Math.round(Math.max(0, audioSeconds) * 10) / 10 }
		});
	} catch { /* the budget is best effort; the clip was already sent */ }
}

/**
 * Turns one recording into text, inside today's voice budget: checks the budget, transcribes, then
 * counts the clip with the audio length the service billed (or `reportedSeconds`, the length the
 * page reported). A clip that fails still counts. The transcript, or the error response.
 */
export async function meteredTranscribe(
	locals: Locals, user: User, route: string, audio: File, reportedSeconds: number,
	label: string, context?: string, options: { splitAtPauses?: boolean } = {}
): Promise<string | Response> {
	const refused = await checkClipBudget(locals, user);
	if (refused) return refused;
	let billed: number | null = null;
	const transcript = await transcribe(audio, label, context, { ...options, onUsage: seconds => { billed = seconds; } });
	await recordClip(locals, user, route, billed ?? reportedSeconds);
	return transcript === null ? json({ error: 'Transcription unavailable' }, { status: 502 }) : transcript;
}

/**
 * The Practice area's own AI budget, apart from the daily lesson's, so practicing never uses up
 * what today's lesson needs. Each AI request is counted before it is made, so a failed one counts.
 */
export const MAX_DAILY_PRACTICE = 30;
export const MAX_ADMIN_DAILY_PRACTICE = 150;
const PRACTICE_EVENT = 'english_practice_ai';

/** Counts one Practice AI request, if today's Practice budget has room; the error response if not. */
export async function chargePractice(locals: Locals, user: User, module: string): Promise<Response | null> {
	const { count, error } = await locals.supabase.from('events').select('id', { count: 'exact', head: true })
		.eq('user_id', user.id).eq('event_name', PRACTICE_EVENT).gte('created_at', startOfDay());
	if (error || count === null) return json({ error: 'AI temporarily unavailable' }, { status: 503 });
	if (count >= MAX_DAILY_PRACTICE && (count >= MAX_ADMIN_DAILY_PRACTICE || !(await isAdminTester(locals, user)))) {
		return json({ error: 'Daily practice limit reached' }, { status: 429 });
	}
	const { error: insertError } = await locals.supabase.from('events').insert({
		user_id: user.id, event_id: crypto.randomUUID(), session_id: crypto.randomUUID(), attempt_id: null,
		event_name: PRACTICE_EVENT, day: null, occurred_at: new Date().toISOString(), schema_version: 2,
		metadata: { course: 'en', module }
	});
	return insertError ? json({ error: 'AI temporarily unavailable' }, { status: 503 }) : null;
}

/** Counts one AI request against today's allowance. */
export async function recordAllowance(locals: Locals, user: User, index: number, scenario = 'hotel-quiet-room-v1'): Promise<boolean> {
	const { error } = await locals.supabase.from('events').insert({
		user_id: user.id, event_id: crypto.randomUUID(), session_id: crypto.randomUUID(), attempt_id: null,
		event_name: 'english_ai_requested', day: null, occurred_at: new Date().toISOString(), schema_version: 2,
		metadata: { course: 'en', scenario, mode: 'conversation', index }
	});
	return !error;
}

/** Records one AI request against today's allowance, or returns the error response. */
export async function spendAllowance(locals: Locals, user: User, index: number, scenario?: string): Promise<Response | null> {
	const refused = await checkAllowance(locals, user);
	if (refused) return refused;
	return (await recordAllowance(locals, user, index, scenario)) ? null : json({ error: 'AI temporarily unavailable' }, { status: 503 });
}

export interface ChainRequest<T> {
	/** Prefix for log lines, e.g. "English converse". */
	label: string;
	system: string;
	user: string;
	/** Validates the parsed JSON. */
	schema: z.ZodType<T>;
	/** JSON Schema for OpenAI structured output (strict). */
	openAiSchema: object;
	/** Gemini responseSchema. */
	geminiSchema: object;
	/** Appended to the system prompt for providers without strict schemas. */
	shape: string;
	temperature: number;
	maxTokens: number;
}

async function requestProvider<T>(req: ChainRequest<T>, name: string, url: string, headers: Record<string, string>, body: unknown, extract: (data: any) => string | undefined): Promise<T | null> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 12_000);
	try {
		const response = await fetch(url, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal });
		if (!response.ok) { console.error(`${req.label}: ${name} failed: ${response.status}`); return null; }
		const raw = extract(await response.json());
		const parsed = raw ? req.schema.safeParse(JSON.parse(raw)) : null;
		if (!parsed?.success) { console.error(`${req.label}: ${name} returned an invalid reply`); return null; }
		return parsed.data;
	} catch (err) {
		console.error(`${req.label}: ${name}: ${(err as Error).message}`);
		return null;
	} finally { clearTimeout(timeout); }
}

/** Tries each configured provider in turn; null if none returned a valid reply. */
export async function askChain<T>(req: ChainRequest<T>): Promise<T | null> {
	if (env.GEMINI_API_KEY) {
		const result = await requestProvider(req, 'Gemini', `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.GEMINI_MODEL || 'gemini-2.5-flash')}:generateContent`, { 'x-goog-api-key': env.GEMINI_API_KEY }, {
			systemInstruction: { parts: [{ text: req.system + req.shape }] }, contents: [{ role: 'user', parts: [{ text: req.user }] }],
			generationConfig: { temperature: req.temperature, maxOutputTokens: req.maxTokens, responseMimeType: 'application/json', responseSchema: req.geminiSchema, thinkingConfig: { thinkingBudget: 0 } }
		}, data => data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? '').join(''));
		if (result) return result;
	}
	if (env.DEEPSEEK_API_KEY) {
		const result = await requestProvider(req, 'DeepSeek', 'https://api.deepseek.com/chat/completions', { Authorization: `Bearer ${env.DEEPSEEK_API_KEY}` }, {
			model: env.DEEPSEEK_MODEL || 'deepseek-flash', messages: [{ role: 'system', content: req.system + req.shape }, { role: 'user', content: req.user }],
			max_tokens: req.maxTokens, temperature: req.temperature, response_format: { type: 'json_object' }
		}, data => data?.choices?.[0]?.message?.content);
		if (result) return result;
	}
	if (env.OPENAI_API_KEY) {
		return requestProvider(req, 'OpenAI', 'https://api.openai.com/v1/chat/completions', { Authorization: `Bearer ${env.OPENAI_API_KEY}` }, {
			model: env.OPENAI_MODEL || 'gpt-4o-mini', messages: [{ role: 'system', content: req.system }, { role: 'user', content: req.user }],
			max_tokens: req.maxTokens, temperature: req.temperature,
			response_format: { type: 'json_schema', json_schema: { name: 'reply', strict: true, schema: req.openAiSchema } }
		}, data => data?.choices?.[0]?.message?.content);
	}
	return null;
}
