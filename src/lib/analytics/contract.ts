/** Versioned, deliberately small analytics vocabulary. Never send learner text or audio. */
export const SCHEMA_VERSION = 2;
export const VISIT_IDLE_MS = 30 * 60 * 1000;
export const DAY_MS = 86_400_000;
export const EVENT_NAMES = [
	'visit_started', 'page_viewed', 'page_hidden', 'page_returned',
	'lesson_started', 'lesson_begun', 'lesson_resumed', 'lesson_progress',
	'answer_submitted', 'step_skipped', 'lesson_attempt_completed', 'lesson_completed',
	'hint_opened', 'answer_revealed', 'audio_replayed', 'lesson_active', 'sentence_practice_opened', 'answer_timed_out',
	'mic_requested', 'mic_ready', 'obstacle', 'audio_fallback',
	'free_turn_offered', 'free_turn_begun', 'free_turn_completed',
	'exam_completed', 'review_started', 'conversation_started', 'conversation_completed', 'english_ai_requested',
	'english_clip_transcribed', 'english_practice_ai', 'step_rated', 'step_opened', 'english_ai_outcome'
] as const;
export type AnalyticsEvent = typeof EVENT_NAMES[number];
export const OBSTACLES = {
	mic_denied: 'Microphone permission denied',
	mic_unavailable: 'Microphone unavailable',
	speech_failed: 'Speech recognition failed',
	stt_failed: 'Transcription request failed',
	audio_failed: 'Audio playback failed',
	lesson_load_failed: 'Lesson could not load',
	progress_save_failed: 'Progress save or sync failed'
} as const;
export type ObstacleCode = keyof typeof OBSTACLES;
export interface AnalyticsRecord {
	event_id: string;
	session_id: string;
	attempt_id: string | null;
	event_name: AnalyticsEvent;
	day: number | null;
	occurred_at: string;
	schema_version: typeof SCHEMA_VERSION;
	metadata: Record<string, string | number | boolean>;
}
export interface StoredEvent extends AnalyticsRecord {
	user_id: string;
	created_at: string;
}
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The English AI routes the admin's AI health counts. */
export const AI_ROUTES = ['chat', 'chat-review', 'converse', 'review', 'quick-chat'] as const;
export type AiRoute = (typeof AI_ROUTES)[number];

/**
 * Events only our server writes (the step path, the AI and clip budgets): the browser's analytics
 * batches may not send them, so nobody can add steps or AI use to the admin's numbers.
 */
const SERVER_ONLY = new Set<string>(['step_opened', 'step_rated', 'english_ai_requested', 'english_clip_transcribed', 'english_practice_ai', 'english_ai_outcome']);
export const serverOnly = (e: Pick<AnalyticsRecord, 'event_name' | 'metadata'>) =>
	SERVER_ONLY.has(e.event_name) || (['lesson_started', 'lesson_progress', 'lesson_completed'].includes(e.event_name) && (e.metadata?.course === 'en' || e.metadata?.flow === 'path'));

const numericKeys = new Set(['sequence', 'index', 'total', 'sentenceCount', 'estimateMinutes', 'actualSeconds', 'secondsOnOverlay', 'score', 'percentage', 'week', 'count', 'length', 'done', 'skipped', 'audio_seconds', 'rating', 'points', 'seconds', 'ms']);
const choices: Record<string, readonly string[]> = {
	page: ['home', 'languages', 'onboarding', 'practice', 'lesson', 'review', 'basics', 'vocabulary', 'progress', 'profile', 'settings', 'exam', 'sprechen', 'hoeren', 'lesen', 'schreiben', 'other'],
	device: ['mobile', 'tablet', 'desktop'],
	browser: ['Chrome', 'Safari', 'Firefox', 'Edge', 'Other'],
	language: ['en', 'fa', 'other'],
	mode: ['lesson', 'exam', 'review', 'conversation'],
	code: Object.keys(OBSTACLES),
	entry: ['overlay', 'warmup', 'next_day', 'day_picker'],
	engine: ['web_speech', 'recorder', 'proxy', 'browser'],
	course: ['en', 'de', 'fr'], scenario: ['hotel-quiet-room-v1'],
	// The English daily lessons (src/lib/server/lesson-events.ts); a test keeps these in step with day.ts.
	track: ['intermediate', 'professional'],
	module: ['listen-act', 'scenario', 'phrases', 'say-it-better', 'say-in-english', 'traps', 'voice-messages', 'listen-retell', 'choose-persuade', 'group-chat', 'quick-fire'],
	outcome: ['done', 'skipped'],
	// The step path's own events (src/lib/server/step-path.ts), apart from the old daily lessons'.
	flow: ['path'],
	// AI health (src/lib/server/english-ai.ts, recordAiOutcome): which route, which provider answered,
	// what the route sent, and why the first provider failed.
	route: AI_ROUTES,
	provider: ['gemini', 'deepseek', 'openai', 'none'],
	ai_result: ['ok', 'retried', 'fallback', 'failed'],
	first_fail: ['http_404', 'http_4xx', 'http_5xx', 'timeout', 'invalid']
};
export function safeMetadata(input: unknown): AnalyticsRecord['metadata'] {
	const output: AnalyticsRecord['metadata'] = {};
	if (!input || typeof input !== 'object' || Array.isArray(input)) return output;
	for (const [key, value] of Object.entries(input)) {
		if (key === 'lesson_version' && typeof value === 'string' && /^d1-[a-f0-9]{16}$/.test(value)) output[key] = value;
		else if (key === 'insights_version' && value === 3) output[key] = value;
		// The learner's UTC offset in minutes (Iran: 210), so "the next day" is their own calendar day.
		else if (key === 'utc_offset_min' && typeof value === 'number' && Number.isInteger(value) && Math.abs(value) <= 840) output[key] = value;
		else if (key === 'active_ms' && typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= 15_000) output[key] = Math.round(value);
		else if (numericKeys.has(key) && typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1_000_000) output[key] = value;
		else if ((key === 'correct' || key === 'resumed' || key === 'replay' || key === 'ai_rescued' || key === 'failed') && typeof value === 'boolean') output[key] = value;
		else if (typeof value === 'string' && choices[key]?.includes(value)) output[key] = value;
	}
	return output;
}
export function parseEvent(value: unknown, now = Date.now()): AnalyticsRecord | null {
	if (!value || typeof value !== 'object') return null;
	const e = value as AnalyticsRecord;
	const time = Date.parse(e.occurred_at);
	if (e.schema_version !== SCHEMA_VERSION || !EVENT_NAMES.includes(e.event_name) ||
		!UUID.test(e.event_id) || !UUID.test(e.session_id) ||
		(e.attempt_id !== null && !UUID.test(e.attempt_id)) ||
		(e.day !== null && (!Number.isInteger(e.day) || e.day < 1 || e.day > 10000)) ||
		!Number.isFinite(time) || time > now + 5 * 60_000 || time < now - 7 * DAY_MS) return null;
	return { event_id: e.event_id, session_id: e.session_id, attempt_id: e.attempt_id,
		event_name: e.event_name, day: e.day, occurred_at: new Date(time).toISOString(),
		schema_version: SCHEMA_VERSION, metadata: safeMetadata(e.metadata) };
}
