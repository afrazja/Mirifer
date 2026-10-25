/**
 * The learner's own settings through our server (/api/me): app language, voice speed, display name
 * and photo. Replaces the browser's own calls to Supabase for these, which a filtered or unstable
 * connection can lose (the page then waited for ever, or a Persian learner was shown English).
 * One read is shared by every caller for 30 s (many components ask for the language on load).
 */
export interface Me { language: string | null; voiceSpeed: number | null; displayName: string | null; avatarUrl: string | null }

const WAIT_MS = 5000;
const FRESH_MS = 30_000;
let cached: { at: number; promise: Promise<Me | null> } | null = null;

async function withTimeout<T>(promise: Promise<T>): Promise<T | null> {
	return Promise.race([promise, new Promise<null>(resolve => setTimeout(() => resolve(null), WAIT_MS))]);
}

/** The learner's settings, or null (signed out, offline, or no answer in 5 s). */
export function fetchMe(): Promise<Me | null> {
	if (typeof fetch === 'undefined' || typeof window === 'undefined') return Promise.resolve(null);
	if (cached && Date.now() - cached.at < FRESH_MS) return cached.promise;
	const promise = withTimeout(fetch('/api/me').then(r => (r.ok ? (r.json() as Promise<Me>) : null))).catch(() => null);
	cached = { at: Date.now(), promise };
	void promise.then(me => { if (!me) cached = null; });
	return promise;
}

/** Saves some of the learner's settings; throws when they couldn't be saved (the caller may retry). */
export async function patchMe(changes: Partial<Pick<Me, 'language' | 'voiceSpeed' | 'displayName'>>): Promise<void> {
	cached = null;
	const response = await withTimeout(fetch('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(changes) }));
	if (!response) throw new Error('No answer from Mirifer');
	if (!response.ok) {
		const body = await response.json().catch(() => ({}));
		throw new Error(typeof body.error === 'string' ? body.error : 'Couldn’t save');
	}
}

/** Forget the shared read (after a sign-out, or a change made elsewhere). */
export function forgetMe(): void { cached = null; }
