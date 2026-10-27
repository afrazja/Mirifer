/**
 * Speech to text for the English course (Listen & retell, Say it again,
 * better): OpenAI's transcription model, English. The audio is sent once and
 * not stored by Mirifer.
 */
import { env } from '$env/dynamic/private';

export const AUDIO_EXTENSIONS: Record<string, string> = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'mp4', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-m4a': 'm4a', 'audio/aac': 'm4a' };

export const transcriptionConfigured = () => !!env.OPENAI_API_KEY;

/** gpt-4o-transcribe bills about 1,000 audio tokens a minute ($6 per million, about $0.006 a minute). */
const AUDIO_TOKENS_PER_SECOND = 1000 / 60;
/**
 * The audio length the service billed, from the response's `usage`: seconds for models billed by
 * duration, or audio tokens for token-billed ones. Null when the response doesn't say.
 */
export function billedSeconds(usage: unknown): number | null {
	if (!usage || typeof usage !== 'object') return null;
	const u = usage as { type?: unknown; seconds?: unknown; input_token_details?: { audio_tokens?: unknown } };
	if (u.type === 'duration' && typeof u.seconds === 'number' && Number.isFinite(u.seconds)) return Math.max(0, u.seconds);
	const tokens = u.input_token_details?.audio_tokens;
	return typeof tokens === 'number' && Number.isFinite(tokens) ? Math.max(0, tokens / AUDIO_TOKENS_PER_SECOND) : null;
}

/**
 * The transcript (whitespace tidied), or null on any failure. `context` tells
 * the model what the learner is talking about, which helps a lot with accented
 * speech; it is also told to keep the learner's mistakes, not tidy them.
 */
export async function transcribe(audio: File, label: string, context?: string, options: { splitAtPauses?: boolean; /** Don't force English: a Persian answer then comes back in Persian, not translated (the level check). */ anyLanguage?: boolean; /** The billed audio length, when the service reports it. */ onUsage?: (seconds: number | null) => void } = {}): Promise<string | null> {
	const type = audio.type.split(';')[0];
	const body = new FormData();
	body.set('file', audio, `speech.${AUDIO_EXTENSIONS[type] ?? 'webm'}`);
	body.set('model', env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-transcribe');
	if (!options.anyLanguage) body.set('language', 'en');
	body.set('prompt', `${context ? `${context} ` : ''}The speaker is an adult Persian speaker learning English. Write exactly what they say, word for word, keeping their grammar mistakes; never correct or improve them.${options.anyLanguage ? ' If they speak Persian, write it in Persian script; never translate it.' : ''}`);
	body.set('response_format', 'json');
	// Speech with pauses ("Hi. … What time…?"): let the service cut it at the pauses, so nothing after the first one is dropped.
	if (options.splitAtPauses) body.set('chunking_strategy', 'auto');
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 40_000);
	try {
		const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
			method: 'POST', headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` }, body, signal: controller.signal
		});
		if (response.status === 400 && options.splitAtPauses) {
			// The service refused the pause setting: ask once more without it rather than lose the turn.
			clearTimeout(timeout);
			return transcribe(audio, label, context, { anyLanguage: options.anyLanguage, onUsage: options.onUsage });
		}
		if (!response.ok) { console.error(`${label}: transcription failed: ${response.status}`); return null; }
		const data = await response.json();
		options.onUsage?.(billedSeconds(data?.usage));
		return typeof data?.text === 'string' ? data.text.replace(/\s+/g, ' ').trim() : null;
	} catch (err) {
		console.error(`${label}: transcription: ${(err as Error).message}`);
		return null;
	} finally { clearTimeout(timeout); }
}
