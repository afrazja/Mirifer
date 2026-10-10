/**
 * The English Module lab (every module type, one card each) is for the owner and
 * admins only, while the types are being built and judged. Learners never see it.
 */
import type { User } from '@supabase/supabase-js';
import { isAdminEmail } from '$lib/server/admin-auth';

export async function canUseLab(locals: App.Locals, user: User | null): Promise<boolean> {
	if (!user) return false;
	if (user.email_confirmed_at && isAdminEmail(user.email)) return true;
	const { data } = await locals.supabase.from('user_profiles').select('is_admin').eq('id', user.id).maybeSingle();
	return data?.is_admin === true;
}
