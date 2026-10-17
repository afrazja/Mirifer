/**
 * Loads and runs the on-device pronunciation checker (Module lab experiment). The model downloads
 * once, only after the learner agrees, and the browser keeps it. The engine (onnxruntime-web, the
 * plain WebAssembly build, no WebGPU) is served from our own site. Audio is checked on the device
 * and never sent anywhere. Pure scoring lives in $lib/practice/pronounce-local.
 */
import {
	MODEL_BYTES, MODEL_DTYPE, MODEL_FILE, MODEL_ID, SAMPLE_RATE, SILENT_BELOW, judgePair, logSoftmax, peakLevel, resample, type PairVerdict
} from '$lib/practice/pronounce-local';
// The engine's WebAssembly file and its loader, served from our own site (not a CDN that may be blocked).
import wasmUrl from '../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm?url';
import mjsUrl from '../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs?url';

export type CheckResult = (PairVerdict & { silent: false }) | { silent: true };

interface Checker { judge(audio: Blob, words: [string, string]): Promise<CheckResult> }
let loading: Promise<Checker> | null = null;
const listeners = new Set<(fraction: number) => void>();

/** True when the model is already in the browser's cache (no download needed). */
export async function isDownloaded(): Promise<boolean> {
	try {
		if (typeof caches === 'undefined') return false;
		const cache = await caches.open('transformers-cache');
		const keys = await cache.keys();
		return keys.some(request => request.url.includes(MODEL_ID) && request.url.endsWith(MODEL_FILE));
	} catch {
		return false;
	}
}

/**
 * Downloads (first time) and starts the checker. Safe to call again: it shares one load.
 * `onProgress` gets 0..1 while files arrive.
 */
export function loadChecker(onProgress?: (fraction: number) => void): Promise<Checker> {
	if (onProgress) listeners.add(onProgress);
	if (!loading) {
		loading = start().catch(error => { loading = null; throw error; });
		void loading.finally(() => listeners.clear()).catch(() => {});
	}
	return loading;
}

async function start(): Promise<Checker> {
	// Never on the server: the SSR build drops this branch, so the server never bundles the library.
	if (import.meta.env.SSR) throw new Error('browser only');
	const lib = await import('@huggingface/transformers');
	const onnx = lib.env.backends.onnx as { wasm?: { wasmPaths?: unknown; numThreads?: number } };
	if (onnx.wasm) onnx.wasm.wasmPaths = { wasm: wasmUrl, mjs: mjsUrl };
	lib.env.allowLocalModels = false;

	const files = new Map<string, { loaded: number; total: number }>();
	const progress_callback = (info: { status: string; file?: string; loaded?: number; total?: number }) => {
		if (info.status !== 'progress' || !info.file || !info.total) return;
		files.set(info.file, { loaded: info.loaded ?? 0, total: info.total });
		let loaded = 0, total = 0;
		for (const f of files.values()) { loaded += f.loaded; total += f.total; }
		// The model's size isn't known until its download starts, so count against what we expect.
		const fraction = Math.min(1, loaded / Math.max(total, MODEL_BYTES));
		listeners.forEach(fn => fn(fraction));
	};
	const [processor, tokenizer, model] = await Promise.all([
		lib.AutoProcessor.from_pretrained(MODEL_ID, { progress_callback }),
		lib.AutoTokenizer.from_pretrained(MODEL_ID, { progress_callback }),
		lib.AutoModelForCTC.from_pretrained(MODEL_ID, { dtype: MODEL_DTYPE, device: 'wasm', progress_callback })
	]);
	listeners.forEach(fn => fn(1));
	// Ask the browser to keep the model (otherwise it may clear it and the learner downloads it again).
	try { void navigator.storage?.persist?.().catch(() => {}); } catch { /* not supported */ }

	const vocab = (tokenizer as unknown as { model: { tokens_to_ids: Map<string, number> } }).model.tokens_to_ids;
	const id = (symbol: string) => vocab.get(symbol);
	const blank = id('<pad>');
	if (blank === undefined) throw new Error('unexpected vocabulary');

	return {
		async judge(blob, words) {
			const audio = await decode(blob);
			if (peakLevel(audio) < SILENT_BELOW) return { silent: true };
			const inputs = await processor(audio);
			const { logits } = await model(inputs) as { logits: { dims: number[]; data: ArrayLike<number> } };
			const [, frames, size] = logits.dims, data = logits.data, rows: Float64Array[] = [];
			for (let t = 0; t < frames; t++) rows.push(logSoftmax(Array.prototype.slice.call(data, t * size, (t + 1) * size) as number[]));
			return { ...judgePair(rows, words, id, blank), silent: false };
		}
	};
}

/** A recording (webm/mp4) as mono 16 kHz samples. */
async function decode(blob: Blob): Promise<Float32Array> {
	const bytes = await blob.arrayBuffer();
	const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
	const context = new Ctx();
	try {
		const buffer = await context.decodeAudioData(bytes);
		const mono = new Float32Array(buffer.length);
		for (let c = 0; c < buffer.numberOfChannels; c++) {
			const channel = buffer.getChannelData(c);
			for (let i = 0; i < mono.length; i++) mono[i] += channel[i] / buffer.numberOfChannels;
		}
		return resample(mono, buffer.sampleRate, SAMPLE_RATE);
	} finally {
		void context.close().catch(() => {});
	}
}
