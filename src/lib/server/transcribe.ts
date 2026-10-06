/**
 * Speech to text for the English course (Listen & retell, Say it again,
 * better): OpenAI's transcription model, English. The audio is sent once and
 * not stored by Mirifer.
 */
import { env } from '$env/dynamic/private';

export const AUDIO_EXTENSIONS: Record<string, string> = { 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'mp4', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/x-m4a': 'm4a', 'audio/aac': 'm4a' };

export const transcriptionConfigured = () => !!env.OPENAI_API_KEY;

/**
 * The transcript (whitespace tidied), or null on any failure. `context` tells
 * the model what the learner is talking about, which helps a lot with accented
 * speech; it is also told to keep the learner's mistakes, not tidy them.
 */
export async function transcribe(audio: File, label: string, context?: string): Promise<string | null> {
	const type = audio.type.split(';')[0];
	const body = new FormData();
	body.set('file', audio, `speech.${AUDIO_EXTENSIONS[type] ?? 'webm'}`);
	body.set('model', env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-transcribe');
	body.set('language', 'en');
	body.set('prompt', `${context ? `${context} ` : ''}The speaker is an adult Persian speaker learning English. Write exactly what they say, word for word, keeping their grammar mistakes; never correct or improve them.`);
	body.set('response_format', 'json');
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 40_000);
	try {
		const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
			method: 'POST', headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` }, body, signal: controller.signal
		});
		if (!response.ok) { console.error(`${label}: transcription failed: ${response.status}`); return null; }
		const data = await response.json();
		return typeof data?.text === 'string' ? data.text.replace(/\s+/g, ' ').trim() : null;
	} catch (err) {
		console.error(`${label}: transcription: ${(err as Error).message}`);
		return null;
	} finally { clearTimeout(timeout); }
}
