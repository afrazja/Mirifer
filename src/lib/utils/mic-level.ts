/**
 * How loud a recording got. Speech-to-text models invent text when they get a clip with
 * no speech in it (a muted or wrong microphone, or a tap that stopped too soon), so a
 * near-silent recording is never sent: the learner is told they couldn't be heard.
 */
export interface MicLevel { peak: () => number; stop: () => void }

/** Starts measuring a stream's loudness (0–1). If the browser can't measure, peak() stays 1, so nothing is blocked. */
export function measureLevel(stream: MediaStream): MicLevel {
	const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined;
	if (!AudioCtx) return { peak: () => 1, stop: () => {} };
	let context: AudioContext;
	try { context = new AudioCtx(); } catch { return { peak: () => 1, stop: () => {} }; }
	const analyser = context.createAnalyser();
	analyser.fftSize = 1024;
	context.createMediaStreamSource(stream).connect(analyser);
	const data = new Float32Array(analyser.fftSize);
	let peak = 0, measured = false;
	const timer = setInterval(() => {
		analyser.getFloatTimeDomainData(data);
		let sum = 0;
		for (const v of data) sum += v * v;
		peak = Math.max(peak, Math.sqrt(sum / data.length));
		measured = true;
	}, 50);
	return {
		peak: () => (measured ? peak : 1),
		stop: () => { clearInterval(timer); void context.close().catch(() => {}); }
	};
}

/** Below this loudness (RMS) nothing was said: room noise is about 0.002–0.01, quiet speech 0.03+. */
export const SILENT_BELOW = 0.015;
