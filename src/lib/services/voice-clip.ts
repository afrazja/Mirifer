/**
 * Records one short spoken answer in the browser and turns it into text on our server
 * (/api/english/listen). Works in every browser with a microphone (Chrome, Safari on iPhone,
 * Firefox), unlike the browser's own speech recognition.
 *
 * Recording stops when the learner taps Stop, after a quiet moment once they have spoken, or at
 * the use's time limit. A near-silent clip is never sent (the transcriber would invent words).
 */
import { measureLevel, SILENT_BELOW, type MicLevel } from '$utils/mic-level';
import { CLIP_SECONDS, type ClipUse } from '$lib/practice/voice-clip';

export interface Clip { blob: Blob; seconds: number }
/** What a recording gave: a clip, nothing heard, or nothing (cancelled). */
export type RecordingResult = Clip | 'silent' | null;
export interface Recording {
	/** Stop now and keep what was said. */
	stop(): void;
	/** Stop and throw the recording away (the page is closing). */
	cancel(): void;
	done: Promise<RecordingResult>;
}
/** Seconds of quiet, after some speech, that end the recording on their own. */
export const QUIET_STOP_SECONDS = 2;
/** Less speech than this is "nothing heard". */
const MIN_VOICED_SECONDS = 0.3;

export function canRecord(): boolean {
	return typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
}

/** Starts recording. Call it inside a tap (phones need that for the microphone). */
export async function startRecording(use: ClipUse): Promise<Recording | 'unsupported' | 'blocked'> {
	if (!canRecord()) return 'unsupported';
	let stream: MediaStream;
	try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
	catch { return 'blocked'; }
	const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
	let recorder: MediaRecorder;
	try { recorder = new MediaRecorder(stream, { ...(mimeType ? { mimeType } : {}), audioBitsPerSecond: 64_000 }); }
	catch { stream.getTracks().forEach(track => track.stop()); return 'unsupported'; }
	const level: MicLevel = measureLevel(stream);
	const chunks: Blob[] = [];
	const limit = CLIP_SECONDS[use];
	const startedAt = performance.now();
	let discard = false;
	let resolve!: (value: RecordingResult) => void;
	const done = new Promise<RecordingResult>(r => (resolve = r));
	const timer = setInterval(() => {
		const elapsed = (performance.now() - startedAt) / 1000;
		if (elapsed >= limit || (level.voiced() >= MIN_VOICED_SECONDS && level.quietFor() >= QUIET_STOP_SECONDS)) stop();
	}, 200);
	function release() { clearInterval(timer); level.stop(); stream.getTracks().forEach(track => track.stop()); }
	function stop() { if (recorder.state !== 'inactive') recorder.stop(); else release(); }
	recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
	recorder.onstop = () => {
		const seconds = Math.min(limit, Math.round((performance.now() - startedAt) / 1000));
		const silent = level.peak() < SILENT_BELOW || level.voiced() < MIN_VOICED_SECONDS;
		release();
		if (discard) resolve(null);
		else if (silent || !chunks.length) resolve('silent');
		else resolve({ blob: new Blob(chunks, { type: recorder.mimeType || chunks[0].type || 'audio/webm' }), seconds });
	};
	recorder.onerror = () => { discard = true; stop(); };
	try { recorder.start(); }
	catch { release(); return 'unsupported'; }
	return { stop, cancel: () => { discard = true; stop(); }, done };
}

/** The text of a clip, or why there is none: 'limit' (too many today) or 'failed'. */
export async function transcribeClip(clip: Clip, use: ClipUse, signal?: AbortSignal): Promise<{ transcript: string } | { error: 'limit' | 'failed' }> {
	const body = new FormData();
	body.set('audio', clip.blob, 'clip'); body.set('seconds', String(clip.seconds)); body.set('use', use);
	const controller = new AbortController();
	const onAbort = () => controller.abort();
	signal?.addEventListener('abort', onAbort);
	const wait = setTimeout(() => controller.abort(), 20_000);
	try {
		const response = await fetch('/api/english/listen', { method: 'POST', body, signal: controller.signal });
		if (response.status === 429) return { error: 'limit' };
		const data = response.ok ? await response.json() : null;
		return typeof data?.transcript === 'string' ? { transcript: data.transcript } : { error: 'failed' };
	} catch {
		return { error: 'failed' };
	} finally {
		clearTimeout(wait); signal?.removeEventListener('abort', onAbort);
	}
}
