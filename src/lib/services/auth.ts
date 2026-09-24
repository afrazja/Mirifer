/**
 * Auth Service — wraps Supabase Auth for use across the app.
 * Ported from supabase-client.js (window.miriferAuth IIFE).
 */

import { getSupabaseBrowserClient } from '$lib/supabase/client';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { getCourse, isAvailableCourse, type TargetLanguage } from '$lib/courses';

function sb(): SupabaseClient | null {
	try {
		return getSupabaseBrowserClient();
	} catch {
		return null;
	}
}

/** Whether Supabase is configured and available */
export function isConfigured(): boolean {
	return !!sb();
}

/**
 * The verified user, remembered briefly. Almost every data-layer call starts
 * with getUser(), which is a network round trip to Supabase Auth, and the
 * Supabase client runs those one at a time behind a lock, so a page that
 * loads six things waited on six verifications in a row before loading any
 * of them. Remembering the answer for a minute, tied to the session's access
 * token, turns that into one check. A sign-out or a different account means
 * a different token (or none), so it can never return someone else. The
 * database's row-level security still checks every query on the server.
 */
const USER_CACHE_MS = 60_000;
let userCache: { token: string; user: User; at: number } | null = null;
let userInflight: { token: string; promise: Promise<User | null> } | null = null;

/** Get current user or null */
export async function getUser(): Promise<User | null> {
	const client = sb();
	if (!client) return null;
	try {
		const token = (await client.auth.getSession()).data.session?.access_token;
		if (token) {
			if (userCache?.token === token && Date.now() - userCache.at < USER_CACHE_MS) {
				return userCache.user;
			}
			// Concurrent callers share one request instead of queueing behind it.
			if (userInflight?.token === token) return userInflight.promise;
		}
		const promise = client.auth.getUser().then(({ data: { user } }) => {
			if (token && user) userCache = { token, user, at: Date.now() };
			return user;
		});
		if (token) userInflight = { token, promise };
		try {
			return await promise;
		} finally {
			if (userInflight?.promise === promise) userInflight = null;
		}
	} catch {
		return null;
	}
}

/** Get current session or null */
export async function getSession() {
	const client = sb();
	if (!client) return null;
	try {
		const { data: { session } } = await client.auth.getSession();
		return session;
	} catch {
		return null;
	}
}

/** Whether user is logged in */
export async function isAuthenticated(): Promise<boolean> {
	const session = await getSession();
	return !!session;
}

/** Sign up with email, password, and display name */
export async function signUp(
	email: string,
	password: string,
	displayName?: string
): Promise<{ user: User | null; error: string | null }> {
	const client = sb();
	if (!client) return { user: null, error: 'Supabase not configured' };
	try {
		const { data, error } = await client.auth.signUp({
			email,
			password,
			options: {
				data: { display_name: displayName || 'Learner' },
				// Through the auth callback and into the app, not onto the
				// landing page. This used to point at '/?confirmed=true', so
				// confirming your email dropped you on the English marketing
				// page — and for someone who arrived from the Persian level
				// test, that is the wrong language AND the wrong place, with
				// no route onward except starting over.
				//
				// The callback already exchanges the code and honours `next`;
				// it is the same path Google sign-in takes.
				emailRedirectTo: window.location.origin + '/proxy/auth/callback?next=/home'
			}
		});
		if (error) return { user: null, error: error.message };
		return { user: data.user, error: null };
	} catch (e: any) {
		return { user: null, error: e.message };
	}
}

/** Sign in with email and password */
export async function signIn(
	email: string,
	password: string
): Promise<{ user: User | null; error: string | null }> {
	const client = sb();
	if (!client) return { user: null, error: 'Supabase not configured' };
	try {
		const { data, error } = await client.auth.signInWithPassword({ email, password });
		if (error) return { user: null, error: error.message };
		return { user: data.user, error: null };
	} catch (e: any) {
		return { user: null, error: e.message };
	}
}

/** Sign out current user */
export async function signOut(): Promise<{ error: string | null }> {
	const client = sb();
	if (!client) return { error: null };
	try {
		// Import data-layer dynamically to avoid circular deps
		const { clearAllLocal } = await import('./data-layer');
		clearAllLocal();

		const { error } = await client.auth.signOut();
		return { error: error ? error.message : null };
	} catch (e: any) {
		return { error: e.message };
	}
}

/** Listen for auth state changes */
export function onAuthStateChange(
	callback: (event: string, session: any) => void
): { unsubscribe: () => void } {
	const client = sb();
	if (!client) return { unsubscribe: () => {} };
	const { data: { subscription } } = client.auth.onAuthStateChange(callback);
	return subscription;
}

/** Get the user's display name */
export async function getDisplayName(): Promise<string> {
	const client = sb();
	if (!client) return 'Learner';
	try {
		const user = await getUser();
		if (!user) return 'Learner';

		// Try user_profiles table first
		const { data } = await client
			.from('user_profiles')
			.select('display_name')
			.eq('id', user.id)
			.maybeSingle();

		if (data?.display_name) return data.display_name;

		// Fallback: whatever the provider gave us. Same chain as
		// ensureProfile, so a Google user is not "Learner" here and their
		// real name there.
		const metaName = nameFromMetadata(user);
		if (metaName && metaName !== 'Learner') {
			await ensureProfile(user);
			return metaName;
		}

		return user.email?.split('@')[0] || 'Learner';
	} catch {
		try {
			const user = await getUser();
			return user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Learner';
		} catch {
			return 'Learner';
		}
	}
}

/** Ensure user has profile and progress rows */
/**
 * The name a provider gave us, in the order we trust it.
 *
 * Email signup writes display_name. Google writes full_name and name and
 * has never heard of display_name — so reading only the first one meant
 * every Google user would be called "Learner".
 */
export function nameFromMetadata(user: User): string {
	const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
	const pick = (k: string) => {
		const v = meta[k];
		return typeof v === 'string' && v.trim() ? v.trim() : null;
	};
	return (
		pick('display_name') ||
		pick('full_name') ||
		pick('name') ||
		user.email?.split('@')[0] ||
		'Learner'
	);
}

export async function ensureProfile(user: User): Promise<void> {
	const client = sb();
	if (!client || !user) return;
	try {
		// Progress row is safe to upsert — it has no user-authored fields.
		await client.from('user_progress').upsert({ user_id: user.id }, { onConflict: 'user_id' });

		// The profile is NOT. This runs on every sign-in, and upserting
		// display_name unconditionally overwrote whatever the learner had
		// set in Settings with the provider's version, every single login.
		// Harmless while the provider value never changed; with Google it
		// would silently undo their choice each time they came back.
		const { data: existing } = await client
			.from('user_profiles')
			.select('display_name')
			.eq('id', user.id)
			.maybeSingle();

		if (existing?.display_name && existing.display_name !== 'Learner') return;

		await client
			.from('user_profiles')
			.upsert({ id: user.id, display_name: nameFromMetadata(user) }, { onConflict: 'id' });
	} catch (e) {
		console.error('ensureProfile error:', e);
	}
}

/**
 * Send the learner to Google, and back again.
 *
 * Returns only on failure — on success the browser navigates away, so there
 * is no user object here. The session lands at /proxy/auth/callback, which
 * already exchanges the code (it was written for email confirmation; OAuth
 * returns through the identical PKCE flow).
 *
 * `next` rides along so the callback knows where to send them. Without it a
 * Google user would be shown "Email confirmed!", which they never asked for
 * and did not do.
 */
export async function signInWithGoogle(next = '/home'): Promise<{ error: string | null }> {
	const client = sb();
	if (!client) return { error: 'Supabase not configured' };
	if (typeof window === 'undefined') return { error: 'Unavailable' };
	try {
		const { error } = await client.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/proxy/auth/callback?next=${encodeURIComponent(next)}`,
				// Otherwise a shared device silently reuses whichever Google
				// account signed in last, with no way to pick another.
				queryParams: { prompt: 'select_account' }
			}
		});
		return { error: error?.message ?? null };
	} catch (e) {
		return { error: (e as Error)?.message ?? 'Could not reach Google' };
	}
}

/** Update password */
/**
 * Send a password-reset link.
 *
 * There was no way to recover an account at all before this: no UI, no
 * route, and updatePassword needs a session you cannot get without the
 * password you have forgotten. The only recourse was an admin resetting it
 * by hand, which does not scale past the people who know to ask.
 *
 * Goes through the auth callback, which already exchanges the code for a
 * session — the same route email confirmation and Google sign-in take —
 * and lands on /reset-password to choose the new one.
 */
export async function sendPasswordReset(email: string): Promise<{ error: string | null }> {
	const client = sb();
	if (!client) return { error: 'Supabase not configured' };
	try {
		const { error } = await client.auth.resetPasswordForEmail(email, {
			redirectTo: window.location.origin + '/proxy/auth/callback?next=/reset-password'
		});
		if (error) return { error: error.message };
		return { error: null };
	} catch (e: any) {
		return { error: e.message };
	}
}

export async function updatePassword(newPassword: string): Promise<{ error: string | null }> {
	const client = sb();
	if (!client) return { error: 'Supabase not configured' };
	try {
		const { error } = await client.auth.updateUser({ password: newPassword });
		if (error) return { error: error.message };
		return { error: null };
	} catch (e: any) {
		return { error: e.message };
	}
}

/** Update display name in auth metadata + user_profiles */
export async function updateDisplayName(newName: string): Promise<{ error: string | null }> {
	const client = sb();
	if (!client) return { error: 'Supabase not configured' };
	try {
		const user = await getUser();
		if (!user) return { error: 'Not authenticated' };

		const { error: authError } = await client.auth.updateUser({
			data: { display_name: newName }
		});
		if (authError) return { error: authError.message };

		const { error: dbError } = await client
			.from('user_profiles')
			.update({ display_name: newName, updated_at: new Date().toISOString() })
			.eq('id', user.id);
		if (dbError) return { error: dbError.message };

		return { error: null };
	} catch (e: any) {
		return { error: e.message };
	}
}

/** Upload an avatar image (max 5MB, image only) */
export async function uploadAvatar(
	file: File
): Promise<{ url: string | null; error: string | null; warning?: string }> {
	const client = sb();
	if (!client) return { url: null, error: 'Supabase not configured' };
	try {
		const user = await getUser();
		if (!user) return { url: null, error: 'Not authenticated' };

		if (file.size > 5 * 1024 * 1024) {
			return { url: null, error: 'Image must be less than 5MB' };
		}

		const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
		if (!allowedTypes.includes(file.type)) {
			return { url: null, error: 'Only JPG, PNG, GIF, or WebP images are allowed' };
		}

		const mimeToExt: Record<string, string> = {
			'image/jpeg': 'jpg',
			'image/png': 'png',
			'image/gif': 'gif',
			'image/webp': 'webp'
		};
		const ext = mimeToExt[file.type] || 'png';
		const filePath = `${user.id}/avatar.${ext}`;

		const { error: uploadError } = await client.storage
			.from('avatars')
			.upload(filePath, file, { upsert: true });

		if (uploadError) {
			console.warn('Storage upload failed:', uploadError.message);
			const blobUrl = URL.createObjectURL(file);
			return {
				url: blobUrl,
				error: null,
				warning: 'Saved locally only. ' + uploadError.message
			};
		}

		const { data: urlData } = client.storage.from('avatars').getPublicUrl(filePath);
		const publicUrl = urlData.publicUrl + '?t=' + Date.now();

		try {
			await client
				.from('user_profiles')
				.update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
				.eq('id', user.id);
		} catch (dbErr: any) {
			console.warn('Could not save avatar_url to DB:', dbErr.message);
		}

		return { url: publicUrl, error: null };
	} catch (e: any) {
		return { url: null, error: e.message };
	}
}

/** Remove avatar from storage and clear avatar_url */
export async function removeAvatar(): Promise<{ error: string | null }> {
	const client = sb();
	if (!client) return { error: 'Supabase not configured' };
	try {
		const user = await getUser();
		if (!user) return { error: 'Not authenticated' };

		const { data: files } = await client.storage.from('avatars').list(user.id);
		if (files && files.length > 0) {
			const paths = files.map((f) => `${user.id}/${f.name}`);
			await client.storage.from('avatars').remove(paths);
		}

		const { error: dbError } = await client
			.from('user_profiles')
			.update({ avatar_url: null, updated_at: new Date().toISOString() })
			.eq('id', user.id);
		if (dbError) return { error: dbError.message };

		return { error: null };
	} catch (e: any) {
		return { error: e.message };
	}
}

/**
 * Get the learning language from the course catalogue, stored in auth metadata.
 * Returns null if not yet set (user needs onboarding).
 */
export async function getTargetLanguage(): Promise<TargetLanguage | null> {
	const user = await getUser();
	if (!user) return null;
	// A different account's browser cache must never complete onboarding.
	return getCourse(user.user_metadata?.target_language)?.code ?? null;
}

/**
 * Save both language preferences after onboarding or settings change.
 * - nativeLang: the language the user reads translations in ('en' | 'fa')
 * - targetLang: the language the user is learning
 * target_language is stored in Supabase Auth user metadata (no DB migration needed).
 */
export async function updateLanguagePreferences(
	nativeLang: 'en' | 'fa',
	targetLang: TargetLanguage
): Promise<{ error: string | null }> {
	if (!isAvailableCourse(targetLang)) return { error: 'This course is not available yet.' };
	const client = sb();
	if (!client) return { error: 'Supabase not configured' };
	try {
		const user = await getUser();
		if (!user) return { error: 'Not authenticated' };

		// Save native language in user_profiles.language
		const { error: dbError } = await client
			.from('user_profiles')
			.update({ language: nativeLang, updated_at: new Date().toISOString() })
			.eq('id', user.id);
		if (dbError) return { error: dbError.message };

		// Save the course after the profile update succeeds so a failed save
		// cannot cause the entry route to skip the learner's onboarding.
		const { error: authError } = await client.auth.updateUser({
			data: { target_language: targetLang }
		});
		if (authError) return { error: authError.message };

		// Cache both in localStorage
		try {
			localStorage.setItem('mirifer_target_language', targetLang);
			localStorage.setItem('mirifer_language', nativeLang);
		} catch {
			// ignore
		}

		return { error: null };
	} catch (e: any) {
		return { error: e.message };
	}
}

/** Get avatar URL from user_profiles */
export async function getAvatarUrl(): Promise<string | null> {
	const client = sb();
	if (!client) return null;
	try {
		const user = await getUser();
		if (!user) return null;

		const { data } = await client
			.from('user_profiles')
			.select('avatar_url')
			.eq('id', user.id)
			.maybeSingle();

		return data?.avatar_url || null;
	} catch {
		return null;
	}
}
