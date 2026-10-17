/**
 * On-device pronunciation check (Module lab experiment, owner-approved in chat).
 *
 * A small speech model (wav2vec2-base, 66.5 MB, downloaded once and kept by the browser) turns the
 * learner's audio into letter probabilities, frame by frame, on the phone itself. It has no
 * language model, so unlike a transcriber it doesn't "repair" an accent into the likeliest word.
 * To judge a minimal pair, we ask how well the audio matches each candidate spelling (the CTC
 * score) and pick the better one. Nothing leaves the device. These are the pure parts.
 */

/** The model's own settings (Xenova/wav2vec2-base-960h). */
export const MODEL_ID = 'Xenova/wav2vec2-base-960h';
export const MODEL_DTYPE = 'q4f16';
/** The model file's name in the model's repo (the browser cache is checked for it). */
export const MODEL_FILE = 'model_q4f16.onnx';
/** Its size in bytes, for the download progress bar. */
export const MODEL_BYTES = 66_469_883;
/** What the learner downloads once, for the consent line: the model (66.5 MB) and the engine (11.1 MB). */
export const DOWNLOAD_MB = 78;
export const SAMPLE_RATE = 16000;

export function logSoftmax(row: ArrayLike<number>): Float64Array {
	let max = -Infinity;
	for (let i = 0; i < row.length; i++) max = Math.max(max, row[i]);
	let sum = 0;
	for (let i = 0; i < row.length; i++) sum += Math.exp(row[i] - max);
	const log = Math.log(sum) + max, out = new Float64Array(row.length);
	for (let i = 0; i < row.length; i++) out[i] = row[i] - log;
	return out;
}

const addLog = (a: number, b: number) => (a === -Infinity ? b : b === -Infinity ? a : Math.max(a, b) + Math.log1p(Math.exp(-Math.abs(a - b))));

/**
 * How well frame-by-frame log-probabilities match a spelling (CTC forward algorithm): the total
 * log-likelihood. Higher is better. Not divided by the word's length: that favoured the longer
 * spelling ("sink" heard as "think", "tin" as "thin"); the raw total scored 94% against 83% on
 * natural voices. `id` maps a letter (or "|" for a
 * space) to its column; `blank` is the CTC blank column.
 */
export function ctcScore(frames: Float64Array[], text: string, id: (symbol: string) => number | undefined, blank: number): number {
	const labels = [...text.toUpperCase()].map(c => id(c === ' ' ? '|' : c)).filter((x): x is number => x !== undefined);
	if (!labels.length || !frames.length) return -Infinity;
	const ext = [blank];
	for (const l of labels) ext.push(l, blank);
	let alpha = new Array<number>(ext.length).fill(-Infinity);
	alpha[0] = frames[0][ext[0]];
	alpha[1] = frames[0][ext[1]];
	for (let t = 1; t < frames.length; t++) {
		const next = new Array<number>(ext.length).fill(-Infinity);
		for (let s = 0; s < ext.length; s++) {
			let v = alpha[s];
			if (s > 0) v = addLog(v, alpha[s - 1]);
			if (s > 1 && ext[s] !== blank && ext[s] !== ext[s - 2]) v = addLog(v, alpha[s - 2]);
			next[s] = v + frames[t][ext[s]];
		}
		alpha = next;
	}
	return addLog(alpha[ext.length - 1], alpha[ext.length - 2]);
}

export interface PairVerdict {
	/** The word the audio matched better. */
	heard: string;
	/** How much better (log-likelihood); small means "hard to tell". */
	margin: number;
	/** True when the margin is too small to say. */
	unsure: boolean;
}
/** Below this, the two words are too close to call ("Hard to tell: try again"). */
export const UNSURE_BELOW = 0.5;

export function judgePair(frames: Float64Array[], words: [string, string], id: (symbol: string) => number | undefined, blank: number): PairVerdict {
	const [a, b] = words.map(w => ctcScore(frames, w, id, blank));
	const heard = a >= b ? words[0] : words[1], margin = Math.abs(a - b);
	return { heard, margin: Number.isFinite(margin) ? margin : 0, unsure: !Number.isFinite(margin) || margin < UNSURE_BELOW };
}

/** Mono audio resampled to 16 kHz (linear interpolation is enough for speech recognition). */
export function resample(input: Float32Array, fromRate: number, toRate = SAMPLE_RATE): Float32Array {
	if (fromRate === toRate) return input;
	const ratio = toRate / fromRate, out = new Float32Array(Math.floor(input.length * ratio));
	for (let i = 0; i < out.length; i++) {
		const x = i / ratio, j = Math.floor(x), f = x - j;
		out[i] = (input[j] ?? 0) * (1 - f) + (input[j + 1] ?? input[j] ?? 0) * f;
	}
	return out;
}

/** Loudest short stretch of the audio (RMS over 20 ms windows); below SILENT_BELOW nobody spoke. */
export function peakLevel(audio: Float32Array, rate = SAMPLE_RATE): number {
	const size = Math.max(1, Math.round(rate * 0.02));
	let peak = 0;
	for (let start = 0; start < audio.length; start += size) {
		let sum = 0, end = Math.min(audio.length, start + size);
		for (let i = start; i < end; i++) sum += audio[i] * audio[i];
		peak = Math.max(peak, Math.sqrt(sum / (end - start)));
	}
	return peak;
}
export const SILENT_BELOW = 0.01;
