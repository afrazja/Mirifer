/**
 * The owner's test accounts (owner's decision, 2026-10-27): these may reset their own English
 * progress from Settings to replay the new-learner flow. Nobody else sees or can use it.
 */
import type { User } from '@supabase/supabase-js';

export const RESET_ENGLISH_EMAILS = ['afz.javan@gmail.com', 'afraz.jva@gmail.com'] as const;

export function canResetEnglish(user: Pick<User, 'email' | 'email_confirmed_at'> | null | undefined): boolean {
	const email = (user?.email ?? '').trim().toLowerCase();
	return !!user?.email_confirmed_at && (RESET_ENGLISH_EMAILS as readonly string[]).includes(email);
}

/** Everything the English course keeps in the learner's metadata; null clears it. */
export const ENGLISH_STATE_KEYS = ['english_profile_v1', 'english_progress_v1', 'english_day_v1', 'english_path_v1'] as const;
