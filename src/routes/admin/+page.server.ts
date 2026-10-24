import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import {
	checkAdminCredentials,
	setAdminCookie,
	requireAdmin,
	clearAdminCookie,
	isAdminEmail
} from '$lib/server/admin-auth';
import { purgeUser } from '$lib/server/delete-account';

/** Matches the 6-character floor the sign-up and settings screens enforce. */
const MIN_PASSWORD_LENGTH = 6;
import { loadEnglishInsights } from '$lib/server/english-insights';
import { UUID } from '$lib/analytics/contract';
import { serviceClient } from '$lib/server/supabase-admin';

/** The admin's views of the English app. */
const TABS = ['overview', 'learners', 'lessons', 'cost', 'audience'] as const;

export const load: PageServerLoad = async ({ parent, url, locals }) => {
	const { authorized } = await parent();
	if (!authorized) return { authorized: false as const, insights: null, tab: 'overview' };
	const days = [7, 14, 30, 90].includes(Number(url.searchParams.get('days'))) ? Number(url.searchParams.get('days')) : 30;
	const includeTests = url.searchParams.get('tests') === '1';
	const asked = url.searchParams.get('tab') ?? '';
	const tab = (TABS as readonly string[]).includes(asked) ? asked : 'overview';
	return { authorized: true as const, tab, selfId: locals.user?.id ?? null, insights: await loadEnglishInsights(serviceClient(), { days, includeTests }) };
};

export const actions: Actions = {
	exclude: async ({ request, cookies, locals }) => {
		await requireAdmin(locals, cookies);
		const db = serviceClient();
		if (!db) return fail(503, { error: 'Reporting database is unavailable.' });
		const form = await request.formData();
		const userId = String(form.get('user_id') ?? '');
		if (!UUID.test(userId)) return fail(400, { error: 'Invalid learner ID.' });
		const result = form.get('exclude') === '1'
			? await db.from('analytics_exclusions').upsert({ user_id: userId }, { onConflict: 'user_id' })
			: await db.from('analytics_exclusions').delete().eq('user_id', userId);
		if (result.error) return fail(503, { error: 'Test account setting could not be saved.' });
		return { success: 'Test account setting saved.' };
	},
	/**
	 * A new password for a learner (the admin API: the learner isn't told, so tell them yourself).
	 * Moved here from the old Accounts page.
	 */
	setPassword: async ({ request, locals, cookies }) => {
		await requireAdmin(locals, cookies);
		const form = await request.formData();
		const userId = String(form.get('userId') ?? '');
		const password = String(form.get('password') ?? '');
		if (!UUID.test(userId)) return fail(400, { error: 'Missing learner.' });
		if (password.length < MIN_PASSWORD_LENGTH) return fail(400, { error: `The password needs at least ${MIN_PASSWORD_LENGTH} characters.` });
		if (password !== String(form.get('confirm') ?? '')) return fail(400, { error: 'The two passwords don’t match.' });
		const db = serviceClient();
		if (!db) return fail(503, { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' });
		const { data, error } = await db.auth.admin.updateUserById(userId, { password });
		if (error) return fail(500, { error: error.message });
		return { success: `Password updated for ${data.user?.email ?? 'the learner'}.` };
	},
	/**
	 * Deletes a learner and all their data, with the same purge as the learner's own deletion in
	 * Settings. No undo, so the email must be typed; never the owner's or your own account.
	 */
	deleteUser: async ({ request, locals, cookies }) => {
		const { selfId } = await requireAdmin(locals, cookies);
		const form = await request.formData();
		const userId = String(form.get('userId') ?? '');
		if (!UUID.test(userId)) return fail(400, { error: 'Missing learner.' });
		const db = serviceClient();
		if (!db) return fail(503, { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' });
		// The email to confirm against comes from the database, never from the form.
		const { data: target, error: lookupError } = await db.auth.admin.getUserById(userId);
		if (lookupError || !target?.user) return fail(404, { error: lookupError?.message ?? 'Learner not found.' });
		const email = target.user.email ?? '';
		if (userId === selfId) return fail(400, { error: 'You can’t delete the account you’re signed in with.' });
		if (isAdminEmail(email)) return fail(400, { error: 'This is the admin account; deleting it would lock you out.' });
		if (String(form.get('confirmEmail') ?? '').trim().toLowerCase() !== email.toLowerCase()) return fail(400, { error: 'The typed email doesn’t match this account. Nothing was deleted.' });
		const { error, orphanedStorage } = await purgeUser(db, userId);
		if (error) return fail(500, { error });
		return { success: `Deleted ${email} and all of their data.` + (orphanedStorage ? ' Their avatar file could not be removed; see the server log.' : '') };
	},
	login: async ({ request, cookies }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '');
		const password = String(form.get('password') ?? '');

		if (!checkAdminCredentials(email, password)) {
			return fail(401, { error: 'Invalid email or password.', email });
		}

		setAdminCookie(cookies);
		throw redirect(303, '/admin');
	},

	logout: async ({ cookies }) => {
		clearAdminCookie(cookies);
		throw redirect(303, '/admin');
	}
};
