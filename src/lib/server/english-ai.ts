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

/** Records one AI request against today's allowance, or returns the error response. */
export async function spendAllowance(locals: Locals, user: User, index: number): Promise<Response | null> {
	const today = new Date(); today.setUTCHours(0, 0, 0, 0);
	const { count, error: countError } = await locals.supabase.from('events').select('id', { count: 'exact', head: true })
		.eq('user_id', user.id).eq('event_name', 'english_ai_requested').gte('created_at', today.toISOString());
	if (countError || count === null) return json({ error: 'AI temporarily unavailable' }, { status: 503 });
	if (count >= MAX_DAILY_TURNS) {
		let adminTester = !!user.email_confirmed_at && isAdminEmail(user.email);
		if (!adminTester) {
			const { data: profile } = await locals.supabase.from('user_profiles').select('is_admin').eq('id', user.id).maybeSingle();
			adminTester = profile?.is_admin === true;
		}
		if (!adminTester || count >= MAX_ADMIN_DAILY_TURNS) return json({ error: 'Daily AI limit reached' }, { status: 429 });
	}
	const { error: insertError } = await locals.supabase.from('events').insert({
		user_id: user.id, event_id: crypto.randomUUID(), session_id: crypto.randomUUID(), attempt_id: null,
		event_name: 'english_ai_requested', day: null, occurred_at: new Date().toISOString(), schema_version: 2,
		metadata: { course: 'en', scenario: 'hotel-quiet-room-v1', mode: 'conversation', index }
	});
	return insertError ? json({ error: 'AI temporarily unavailable' }, { status: 503 }) : null;
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
