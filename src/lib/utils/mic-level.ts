/**
 * How loud a recording got, and how much of it was speech. Speech-to-text models invent text
 * when they get a clip with no speech in it (a muted or wrong microphone, or a tap that stopped
 * too soon), so a near-silent recording is never sent: the learner is told they couldn't be heard.
 */
export interface MicLevel {
	/** The loudest moment (RMS, 0–1). */
	peak: () => number;
	/** Seconds that sounded like speech. */
	voiced: () => number;
	/** Seconds since the last sound like speech. */
	quietFor: () => number;
	/** Quiet gaps of at least `LONG_PAUSE` seconds between two bits of speech (not before the first word or after the last). */
	longPauses: () => number;
	/** While paused, nothing is measured. */
	setPaused: (paused: boolean) => void;
	stop: () => void;
}

/** Below this loudness (RMS) nothing was said: room noise is about 0.002–0.01, quiet speech 0.03+. */
export const SILENT_BELOW = 0.015;
/** At or above this, a moment counts as speech. */
export const SPEECH_LEVEL = 0.02;
/** A quiet gap this long, between words, counts as a long pause. */
export const LONG_PAUSE = 2;

/** Starts measuring a stream's loudness. If the browser can't measure, nothing is ever blocked. */
export function measureLevel(stream: MediaStream): MicLevel {
	const unmeasured: MicLevel = { peak: () => 1, voiced: () => Infinity, quietFor: () => 0, longPauses: () => 0, setPaused: () => {}, stop: () => {} };
	const AudioCtx = typeof window !== 'undefined' ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined;
	if (!AudioCtx) return unmeasured;
	let context: AudioContext;
	try { context = new AudioCtx(); } catch { return unmeasured; }
	// iOS can create it suspended (then it reads silence): resume it; best created inside a tap.
	void context.resume?.().catch(() => {});
	const analyser = context.createAnalyser();
	analyser.fftSize = 1024;
	context.createMediaStreamSource(stream).connect(analyser);
	const data = new Float32Array(analyser.fftSize);
	const STEP = 0.05;
	let peak = 0, voiced = 0, quiet = 0, pauses = 0, measured = false, paused = false;
	const timer = setInterval(() => {
		// A context the browser left suspended (iPhone, when it wasn't created inside a tap) reads
		// silence: don't measure it, so a recording is never wrongly judged silent.
		if (paused || context.state !== 'running') return;
		analyser.getFloatTimeDomainData(data);
		let sum = 0;
		for (const v of data) sum += v * v;
		const rms = Math.sqrt(sum / data.length);
		peak = Math.max(peak, rms);
		if (rms >= SPEECH_LEVEL) {
			// Speech again after a long quiet gap that came after earlier speech: one long pause.
			if (voiced > 0 && quiet >= LONG_PAUSE) pauses++;
			voiced += STEP; quiet = 0;
		} else quiet += STEP;
		measured = true;
	}, STEP * 1000);
	return {
		peak: () => (measured ? peak : 1),
		voiced: () => (measured ? voiced : Infinity),
		quietFor: () => quiet,
		longPauses: () => pauses,
		// Quiet while paused isn't a pause in their speech.
		setPaused: value => { paused = value; if (!value) quiet = 0; },
		stop: () => { clearInterval(timer); void context.close().catch(() => {}); }
	};
}
