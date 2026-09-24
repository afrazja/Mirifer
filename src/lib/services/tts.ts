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
import { appStore } from '$stores/app';

/** Dialogue voice: 'a' = learner side (sent), 'b' = conversation partner (received). */
export type TTSVoice = 'a' | 'b';

let currentAudio: HTMLAudioElement | null = null;
let ttsGeneration = 0; // incremented on stop — lets in-flight calls know they're stale
/** Reactive flag — true while any TTS audio is playing */
export const ttsIsPlaying = writable(false);

/** Stop ALL audio sources (browser TTS + proxy Audio element) */
export function stopAllAudio(): void {
	if (typeof window === 'undefined') return;
	ttsIsPlaying.set(false);

	ttsGeneration++; // invalidate any in-flight playback
	window.speechSynthesis?.cancel();
	if (currentAudio) {
		currentAudio.pause();
		currentAudio.removeAttribute('src');
		currentAudio.load();
		currentAudio = null;
	}
}

/**
 * Engine speed that 1.0× in the app maps to.
 *
 * The engines' own 1.0 is native conversational pace, measured on the live
 * voices at ~195 wpm for German (ElevenLabs) and ~225 wpm for English (Edge
 * multilingual voices). That is too fast for a beginner, so "normal" in the
 * app felt like a sped-up setting.
 *
 * German — the language being learned — starts slow and grows with the
 * course: 0.8 (~150 wpm) for lessons 1–5, then a little faster each lesson
 * until native pace at lesson 30. A learner meets ordinary German speed
 * gradually instead of in one jump.
 *
 * English is the learner's own language (translations, narration), so it
 * stays at 0.7 (~155 wpm) throughout. Other languages play at the engine's
 * own pace. The learner's speed setting and slow replays multiply on top.
 */
export const GERMAN_PACE = { start: 0.8, slowUntil: 5, nativeFrom: 30 } as const;
const ENGLISH_PACE = 0.7;

export function basePace(shortLang: string, lessonDay: number): number {
	if (shortLang === 'en') return ENGLISH_PACE;
	if (shortLang !== 'de') return 1;
	const { start, slowUntil, nativeFrom } = GERMAN_PACE;
	if (lessonDay <= slowUntil) return start;
	if (lessonDay >= nativeFrom) return 1;
	const t = (lessonDay - slowUntil) / (nativeFrom - slowUntil);
	// Steps of 0.05, not a new speed per lesson: the speed is part of the
	// audio URL, so every distinct value is another paid ElevenLabs render.
	return Math.round((start + (1 - start) * t) * 20) / 20;
}

/**
 * Which lesson the pace follows. Inside a lesson it is that lesson, so
 * replaying lesson 2 stays slow. Everywhere else (review, drills, Basics)
 * it is the learner's own level: the lesson after the highest one they
 * have completed.
 */
let inLesson = false;
export function setLessonActive(active: boolean): void {
	inLesson = active;
}

function learnerLevel(): number {
	try {
		const done = JSON.parse(localStorage.getItem('mirifer_completed_lessons') || '{}');
		const days = Object.keys(done).map(Number).filter((n) => Number.isFinite(n));
		return days.length ? Math.max(...days) + 1 : 1;
	} catch {
		return 1;
	}
}

function paceDay(): number {
	return inLesson ? get(appStore).currentDay : learnerLevel();
}

/**
 * Slowest native speed each engine accepts: ElevenLabs (German) stops at
 * 0.7, the Edge/Azure voices go down to 0.5. Anything slower than this is
 * made up with playbackRate, which stretches the audio instead of having
 * the voice speak slower, so it is the last resort.
 */
const ENGINE_MIN: Record<string, number> = { de: 0.7 };
const ENGINE_MIN_DEFAULT = 0.5;
const ENGINE_MAX = 1.2;

/**
 * Split an app-level rate into the speed to request from the TTS engine
 * and the playbackRate that makes up any remainder outside its range.
 */
export function engineRate(
	shortLang: string,
	rate: number,
	lessonDay: number = 1
): { engine: number; playback: number } {
	const target = rate * basePace(shortLang, lessonDay);
	const min = ENGINE_MIN[shortLang] ?? ENGINE_MIN_DEFAULT;
	const engine = Math.round(Math.min(ENGINE_MAX, Math.max(min, target)) * 100) / 100;
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
	const day = paceDay();
	// voice/rate params only apply to engine-backed languages (German →
	// ElevenLabs/Edge, Persian → Azure/Edge, English → Edge); keep other URLs
	// stable.
	let deParams = '';
	if (shortLang === 'de' || shortLang === 'fa' || shortLang === 'en') {
		// Ask the TTS engine to actually speak slower (natural slow articulation)
		// instead of time-stretching the audio client-side, which mostly widens
		// the gaps between words. See engineRate for the pace and range.
		const { engine, playback } = engineRate(shortLang, requestedRate, day);
		deParams = `&voice=${voice}&rate=${engine}`;
		safeRate = playback;
	}
	const url = `/proxy/tts?q=${encodeURIComponent(text)}&tl=${shortLang}${deParams}`;
	const myGen = ttsGeneration; // snapshot — if it changes, we were cancelled

	return new Promise((resolve) => {
		if (currentAudio) {
			currentAudio.pause();
			currentAudio = null;
		}

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
				stopTick();
				resolve();
			}
		};
		const fallback = () => {
			if (done) return;
			stopTick();
			// If cancelled while waiting, don't start browser TTS
			if (myGen !== ttsGeneration) { done = true; resolve(); return; }
			done = true;
			void trackEvent('audio_fallback', { metadata: { engine: 'proxy' } });
			// Stop proxy audio before starting browser TTS to prevent double playback
			if (currentAudio) {
				currentAudio.pause();
				currentAudio = null;
			}
			// Browser TTS does its own rate handling — give it the full
			// paced rate, not the residual left over after engine speed.
			_browserTTS(text, lang, requestedRate * basePace(shortLang, day)).then(resolve);
		};

		const audio = new Audio(url);
		audio.playbackRate = safeRate;
		currentAudio = audio;
		audio.onerror = fallback;

		// Per-frame progress loop for word highlighting (only if a hook is given).
		const tick = () => {
			if (myGen !== ttsGeneration || audio.paused || audio.ended) {
				stopTick();
				return;
			}
			if (onTime && audio.duration) onTime(audio.currentTime, audio.duration);
			rafId = requestAnimationFrame(tick);
		};

		// Timeout is for load failures only — clear it once audio starts playing
		// so slow playback (low playbackRate) doesn't trigger a false fallback
		const timeout = setTimeout(fallback, 4000);
		audio.onplay = () => {
			clearTimeout(timeout);
			if (onTime) {
				stopTick();
				rafId = requestAnimationFrame(tick);
			}
		};
		audio.onended = () => {
			clearTimeout(timeout);
			finish();
		};
		audio.play().catch(fallback);
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
