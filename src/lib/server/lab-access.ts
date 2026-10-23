/**
 * The English Module lab (every module type, one card each) is for the owner only: the account
 * whose confirmed email is ADMIN_EMAIL. Other admins (user_profiles.is_admin) don't see it either.
 * Learners never see it, and the lab's own AI routes refuse them.
 */
import type { User } from '@supabase/supabase-js';
import { isAdminEmail } from '$lib/server/admin-auth';

export const canUseLab = (user: User | null | undefined): boolean => !!user?.email_confirmed_at && isAdminEmail(user.email);

/**
 * "See the app as a learner": the owner can hide every owner tool in the English pages (the list of
 * days, the versions, "Try Day N now") to check exactly what a learner sees. It only hides things;
 * it never gives anyone more access. Kept in a cookie on this browser.
 */
export const LEARNER_VIEW_COOKIE = 'mirifer_learner_view';
type CookieReader = { get(name: string): string | undefined };
/** The owner, seeing the app as a learner. */
export const inLearnerView = (user: User | null | undefined, cookies: CookieReader): boolean => canUseLab(user) && cookies.get(LEARNER_VIEW_COOKIE) === '1';
/** Owner tools shown: the owner, unless they chose to see the app as a learner. */
export const ownerToolsShown = (user: User | null | undefined, cookies: CookieReader): boolean => canUseLab(user) && !inLearnerView(user, cookies);
