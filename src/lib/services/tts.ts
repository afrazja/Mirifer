/**
 * TTS Service — Text-to-Speech playback with proxy + browser fallback.
 * Ported from app.js audio functions.
 *
 * Strategy:
 * - Mobile: ALL languages → /proxy/tts proxy (speechSynthesis unreliable on phones)
 * - Desktop: German/Farsi/English → proxy (neural voices); browser
 *   speechSynthesis is only the error fallback and the path for any other
 *   language.
 */

import { trackEvent, trackObstacle } from './analytics';
import { isMobile } from '$utils/device';
import { get, writable } from 'svelte/store';
import { preferencesStore } from '$stores/preferences';

/**
 * Dialogue voice: 'a' = learner side (sent), 'b' = conversation partner
 * (received). English has two more speakers, 'c' and 'd', so a scene can
 * vary who talks; other languages map them to 'a' and 'b'.
 */
export type TTSVoice = 'a' | 'b' | 'c' | 'd';

/** The English voices behind each slot (Microsoft neural voices via /proxy/tts). */
export const ENGLISH_VOICES: { id: TTSVoice; name: string; gender: 'male' | 'female' }[] = [
	{ id: 'a', name: 'Andrew', gender: 'male' },
	{ id: 'b', name: 'Ava', gender: 'female' },
	{ id: 'c', name: 'Brian', gender: 'male' },
	{ id: 'd', name: 'Emma', gender: 'female' }
];

let currentAudio: HTMLAudioElement | null = null;

/**
 * One audio element for every line, unlocked by the learner's first tap.
 *
 * Phones (iOS Safari above all) only let an audio element start playing
 * inside a tap. A lesson plays its next line on its own, after a timer or
 * the microphone, so a fresh `new Audio()` per line was refused, and the
 * lesson fell back to the phone's built-in voice. That voice speaks much
 * faster at the same rate, which is why 1× sounded too fast on phones and
 * 0.75× sounded like 1×. An element that has played once inside a tap may
 * play again later without one, so every line reuses this one.
 */
let sharedPlayer: HTMLAudioElement | null = null;
let playerUnlocked = false;
/** Resolves the promise of whatever is playing now, when it is replaced or stopped. */
let settleCurrent: (() => void) | null = null;

function player(): HTMLAudioElement {
	if (!sharedPlayer) {
		sharedPlayer = new Audio();
		sharedPlayer.preload = 'auto';
	}
	return sharedPlayer;
}

/** A few milliseconds of silence, as a WAV data URI, for unlocking the player. */
function silence(): string {
	const samples = 80;
	const bytes = new Uint8Array(44 + samples * 2);
	const view = new DataView(bytes.buffer);
	const text = (at: number, value: string) => [...value].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
	text(0, 'RIFF'); view.setUint32(4, 36 + samples * 2, true); text(8, 'WAVE');
	text(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
	view.setUint32(24, 8000, true); view.setUint32(28, 16000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
	text(36, 'data'); view.setUint32(40, samples * 2, true);
	return `data:audio/wav;base64,${btoa(String.fromCharCode(...bytes))}`;
}

function unlockPlayer(): void {
	if (playerUnlocked) return;
	const audio = player();
	// Something real is already playing from this tap: that unlocks it too.
	if (!audio.paused) { playerUnlocked = true; return; }
	// A line is loading or playing: leave it alone.
	if (settleCurrent) return;
	// Drop the last line's handlers so the silence can't end or fail it.
	audio.onplay = audio.onended = audio.onerror = null;
	audio.src = silence();
	audio.play().then(() => { playerUnlocked = true; }).catch(() => {});
}

if (typeof document !== 'undefined') {
	// touchend and click are the events iOS counts as a tap for audio.
	for (const type of ['touchend', 'click', 'keydown']) {
		document.addEventListener(type, unlockPlayer, { capture: true, passive: true });
	}
}

/** Stop the shared player and settle the promise of the line it was playing. */
function releasePlayer(): void {
	const settle = settleCurrent;
	settleCurrent = null;
	sharedPlayer?.pause();
	currentAudio = null;
	settle?.();
}
let ttsGeneration = 0; // incremented on stop — lets in-flight calls know they're stale
/** Reactive flag — true while any TTS audio is playing */
export const ttsIsPlaying = writable(false);

/** Stop ALL audio sources (browser TTS + proxy Audio element) */
export function stopAllAudio(): void {
	if (typeof window === 'undefined') return;
	ttsIsPlaying.set(false);

	ttsGeneration++; // invalidate any in-flight playback
	window.speechSynthesis?.cancel();
	// Pausing is enough: removing the src would also re-lock the player on
	// some phones. The next line replaces the src anyway.
	releasePlayer();
}

/**
 * German plays at 0.9 of the voice's own speed at the 1× setting, in every
 * lesson.
 *
 * Measured on the live audio (117 lines across lessons 1-120, Edge
 * Conrad/Katja): at the voice's own speed German runs about 177 words a
 * minute counting pauses, close to native speech and fast for a learner.
 * At 0.9 it is about 160. The speed is one number for the whole course on
 * purpose: it used to speed up after lesson 5, so the same 1× got faster
 * from lesson 9 on. Word count per minute differs a little between lessons
 * because lessons differ in word length, but the voice itself does not
 * change speed. The speed setting multiplies on top of this.
 *
 * English (Edge Andrew/Ava Multilingual), the lesson translations, plays at
 * 0.8. At the voice's own speed it runs about 234 words a minute counting
 * pauses (117 translations measured across lessons 1-120), far faster than
 * the German it introduces; at 0.8 it is about 186. It was once asked for
 * at 0.7 (about 164), which learners heard as unnatural with the last word
 * held, so it stays above that. The German speed setting does not apply to
 * English, and other languages play at the voice's own speed.
 */
export const GERMAN_BASE_RATE = 0.9;
export const ENGLISH_BASE_RATE = 0.8;

/**
 * Native speed range of the Edge voices (the server's clamp). Anything
 * outside it is made up with playbackRate, which stretches the audio instead
 * of having the voice speak slower or faster, so it is the last resort.
 */
const ENGINE_MIN = 0.5;
const ENGINE_MAX = 1.5;

/** The speed a language's voice is asked for at an app-level rate of `rate`. */
export const paceFor = (shortLang: string, rate: number): number => {
	const base = shortLang === 'de' ? GERMAN_BASE_RATE : shortLang === 'en' ? ENGLISH_BASE_RATE : 1;
	return Math.round(rate * base * 100) / 100;
};

/**
 * Split an app-level rate into the speed to request from the TTS engine
 * and the playbackRate that makes up any remainder outside its range.
 */
export function engineRate(shortLang: string, rate: number): { engine: number; playback: number } {
	const target = paceFor(shortLang, rate);
	const engine = Math.round(Math.min(ENGINE_MAX, Math.max(ENGINE_MIN, target)) * 100) / 100;
	return { engine, playback: target / engine };
}

/** Browser speech synthesis fallback */
function _browserTTS(text: string, lang: string, rate?: number): Promise<void> {
	if (!window.speechSynthesis || typeof SpeechSynthesisUtterance === 'undefined') {
		trackObstacle('audio_failed', { engine: 'browser' });
		return Promise.resolve();
	}
	const generation = ttsGeneration;
	return new Promise((resolve) => {
		window.speechSynthesis.cancel();
		const u = new SpeechSynthesisUtterance(text);
		u.lang = lang === 'fa' ? 'fa-IR' : lang === 'en' ? 'en-US' : lang;
		const r = rate || 0.9;
		u.rate = isFinite(r) && r > 0 ? r : 1.0;

		let resolved = false;
		let mobileResumeTimer: ReturnType<typeof setInterval> | null = null;

		const done = () => {
			if (!resolved) {
				resolved = true;
				if (mobileResumeTimer) {
					clearInterval(mobileResumeTimer);
					mobileResumeTimer = null;
				}
				resolve();
			}
		};

		u.onend = done;
		u.onerror = (event) => {
			if (!resolved && generation === ttsGeneration && !['canceled', 'interrupted'].includes(event.error)) trackObstacle('audio_failed', { engine: 'browser' });
			done();
		};

		if (isMobile()) {
			mobileResumeTimer = setInterval(() => {
				if (!window.speechSynthesis.speaking || window.speechSynthesis.paused) {
					window.speechSynthesis.resume();
				}
			}, 5000);
		}

		// Safety timeout: never hang more than 10s
		setTimeout(done, 10000);
		window.speechSynthesis.speak(u);
	});
}

/** Play via same-origin Vercel serverless TTS proxy.
 *  `onTime` (if given) is called with (currentTime, duration) on each animation
 *  frame during playback — used to drive karaoke-style word highlighting. */
function playWebAudio(
	text: string,
	lang: string,
	rate: number = 1.0,
	onTime?: (currentTime: number, duration: number) => void,
	voice: TTSVoice = 'a'
): Promise<void> {
	const shortLang = lang.split('-')[0];
	const requestedRate = isFinite(rate) && rate > 0 ? rate : 1.0;
	let safeRate = requestedRate;
	// voice/rate params only apply to engine-backed languages (German →
	// ElevenLabs/Edge, Persian → Azure/Edge, English → Edge); keep other URLs
	// stable.
	let deParams = '';
	if (shortLang === 'de' || shortLang === 'fa' || shortLang === 'en') {
		// Ask the TTS engine to actually speak slower (natural slow articulation)
		// instead of time-stretching the audio client-side, which mostly widens
		// the gaps between words. See engineRate for the pace and range.
		const { engine, playback } = engineRate(shortLang, requestedRate);
		// `v` changes whenever the voice behind a URL changes, so audio cached
		// for a year under the old voice is not replayed. v=2: German moved
		// from ElevenLabs to Edge's German-only voices.
		deParams = `&voice=${voice}&rate=${engine}${shortLang === 'de' ? '&v=2' : ''}`;
		safeRate = playback;
	}
	const url = `/proxy/tts?q=${encodeURIComponent(text)}&tl=${shortLang}${deParams}`;
	const myGen = ttsGeneration; // snapshot — if it changes, we were cancelled

	return new Promise((resolve) => {
		releasePlayer();

		// Already stale? resolve immediately without playing
		if (myGen !== ttsGeneration) { resolve(); return; }

		let done = false;
		let rafId = 0;
		const stopTick = () => {
			if (rafId) {
				cancelAnimationFrame(rafId);
				rafId = 0;
			}
		};
		const finish = () => {
			if (!done) {
				done = true;
				clearTimeout(timeout);
				stopTick();
				resolve();
			}
		};
		const fallback = (reason: 'timeout' | 'error' | 'blocked') => {
			if (done) return;
			stopTick();
			// If cancelled while waiting, don't start browser TTS
			if (myGen !== ttsGeneration) { done = true; resolve(); return; }
			done = true;
			void trackEvent('audio_fallback', { metadata: { engine: 'proxy', reason, unlocked: playerUnlocked } });
			// Stop proxy audio before starting browser TTS to prevent double playback
			if (currentAudio === audio) {
				settleCurrent = null;
				audio.pause();
				currentAudio = null;
			}
			// Browser TTS does its own rate handling — give it the full
			// rate, not the residual left over after engine speed.
			_browserTTS(text, lang, paceFor(shortLang, requestedRate)).then(resolve);
		};

		const audio = player();
		audio.src = url;
		// Set after src: some browsers reset the rate when a new source loads.
		audio.defaultPlaybackRate = audio.playbackRate = safeRate;
		currentAudio = audio;
		settleCurrent = finish;
		audio.onerror = () => fallback('error');

		// Per-frame progress loop for word highlighting (only if a hook is given).
		const tick = () => {
			if (done || myGen !== ttsGeneration || audio.paused || audio.ended) {
				stopTick();
				return;
			}
			if (onTime && audio.duration) onTime(audio.currentTime, audio.duration);
			rafId = requestAnimationFrame(tick);
		};

		// Timeout is for load failures only — clear it once audio starts playing
		// so slow playback (low playbackRate) doesn't trigger a false fallback.
		// 8s, not 4: on a phone network the first render of a line can take a
		// few seconds, and giving up early switched to the fast phone voice.
		const timeout = setTimeout(() => fallback('timeout'), 8000);
		audio.onplay = () => {
			if (done) return;
			clearTimeout(timeout);
			if (onTime) {
				stopTick();
				rafId = requestAnimationFrame(tick);
			}
		};
		audio.onended = () => {
			if (done) return;
			clearTimeout(timeout);
			if (settleCurrent === finish) settleCurrent = null;
			finish();
		};
		audio.play().catch((error: unknown) => {
			// AbortError: a newer line or a stop replaced this one, not a failure.
			if (error instanceof DOMException && error.name === 'AbortError') return;
			fallback(error instanceof DOMException && error.name === 'NotAllowedError' ? 'blocked' : 'error');
		});
	});
}

/**
 * Play a ready-made audio URL (e.g. an expressive, pre-voiced lesson line)
 * through the same single player, so stopAllAudio() still stops it.
 * Resolves true when it played to the end, false if it could not load or
 * play, so the caller can fall back to the ordinary voice. The load timeout
 * is generous: the first play of a line may be generated on demand.
 */
export function playAudioUrl(url: string, loadTimeoutMs = 12_000): Promise<boolean> {
	const myGen = ttsGeneration;
	releasePlayer();
	return new Promise((resolve) => {
		if (myGen !== ttsGeneration) return resolve(true); // cancelled: don't fall back
		let done = false;
		const end = (ok: boolean) => {
			if (done) return;
			done = true;
			clearTimeout(timeout);
			if (currentAudio === audio && settleCurrent === cancel) settleCurrent = null;
			if (!ok && currentAudio === audio) {
				audio.pause();
				currentAudio = null;
			}
			// Cancelled mid-load counts as handled, not as a failure.
			resolve(ok || myGen !== ttsGeneration);
		};
		// Replaced or stopped before the end: handled, not a failure.
		const cancel = () => end(true);
		const audio = player();
		audio.src = url;
		audio.defaultPlaybackRate = audio.playbackRate = 1;
		currentAudio = audio;
		settleCurrent = cancel;
		ttsIsPlaying.set(true);
		const timeout = setTimeout(() => end(false), loadTimeoutMs);
		audio.onplay = () => clearTimeout(timeout);
		audio.onended = () => {
			ttsIsPlaying.set(false);
			end(true);
		};
		audio.onerror = () => end(false);
		audio.play().catch((error: unknown) => {
			if (error instanceof DOMException && error.name === 'AbortError') return;
			end(false);
		});
	});
}

/**
 * Play audio with the TTS routing strategy.
 * Returns a promise that resolves when playback finishes.
 *
 * @param text - Text to speak
 * @param rate - RELATIVE to the learner's German speed setting, not an
 *   absolute rate. Pass 1 for normal playback; the setting decides the
 *   actual speed. Only pass less than 1 when the point IS a slower read of
 *   this particular item — the pronunciation coach saying one badly-said
 *   word, for instance.
 *
 *   28 call sites used to pass 0.7-0.9 here as though it were absolute,
 *   so a learner whose toolbar read "DE 1x" was listening at 0.8x and had
 *   no way to reach 1. If a lesson feels too fast, the fix is the default
 *   in preferences.ts, never a multiplier hidden at a call site.
 * @param lang - BCP-47 language code (e.g. 'de-DE', 'en-US', 'fa-IR')
 */
export function playAudioPromise(
	text: string,
	rate: number = 1.0,
	lang: string = 'de-DE',
	onTime?: (currentTime: number, duration: number) => void,
	voice: TTSVoice = 'a'
): Promise<void> {
	ttsIsPlaying.set(true);
	const _p = new Promise<void>((resolve) => {
		// Don't call stopAllAudio here — callers manage stop/cancel themselves
		const myGen = ttsGeneration;

		// The voice-speed preference applies to GERMAN only — the study
		// language, where slower articulation aids decoding. Narration and
		// translations in the user's own language always play at natural
		// pace (slowed native-language speech just sounds broken).
		//
		// `rate` multiplies the setting rather than replacing it, so it must
		// be 1 for ordinary playback or the toolbar tells the truth about
		// nothing. See the note on the @param above.
		const prefs = get(preferencesStore);
		const effectiveRate = lang.startsWith('de') ? rate * prefs.voiceSpeed : rate;

		// On mobile: ALL languages → proxy
		if (isMobile()) {
			playWebAudio(text, lang, effectiveRate, onTime, voice).then(resolve);
			return;
		}

		// Desktop: German, Farsi & English → proxy (neural voices; the browser
		// voices for these are noticeably robotic)
		if (lang.startsWith('de') || lang.startsWith('fa') || lang.startsWith('en')) {
			playWebAudio(text, lang, effectiveRate, onTime, voice).then(resolve);
			return;
		}

		// Desktop English/other: try browser speech first
		const voices = window.speechSynthesis.getVoices();
		const hasNativeVoice = voices.some(
			(v) => v.lang === lang || v.lang.startsWith(lang.split('-')[0])
		);

		if (!hasNativeVoice) {
			playWebAudio(text, lang, effectiveRate).then(resolve);
			return;
		}

		window.speechSynthesis.cancel();
		const u = new SpeechSynthesisUtterance(text);
		u.lang = lang;
		u.rate = effectiveRate;

		u.onend = () => resolve();
		u.onerror = () => {
			// If cancelled, don't fallback — just resolve
			if (myGen !== ttsGeneration) { resolve(); return; }
			// Fallback to proxy
			playWebAudio(text, lang, effectiveRate).then(resolve);
		};

		window.speechSynthesis.speak(u);
	});
	_p.finally(() => ttsIsPlaying.set(false));
	return _p;
}

/**
 * Fire-and-forget audio playback (non-blocking).
 */
export function playAudio(text: string, rate: number = 1.0, lang: string = 'en-US'): void {
	playAudioPromise(text, rate, lang);
}
