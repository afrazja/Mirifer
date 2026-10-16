/**
 * The English Module lab (every module type, one card each) is for the owner only: the account
 * whose confirmed email is ADMIN_EMAIL. Other admins (user_profiles.is_admin) don't see it either.
 * Learners never see it, and the lab's own AI routes refuse them.
 */
import type { User } from '@supabase/supabase-js';
import { isAdminEmail } from '$lib/server/admin-auth';

export const canUseLab = (user: User | null | undefined): boolean => !!user?.email_confirmed_at && isAdminEmail(user.email);
