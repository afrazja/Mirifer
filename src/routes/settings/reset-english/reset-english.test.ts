import { describe, it, expect, vi, beforeEach } from 'vitest';
const { svc, deleteEq } = vi.hoisted(() => {
	const deleteEq = vi.fn().mockResolvedValue({ error: null });
	return { deleteEq, svc: { from: vi.fn(() => ({ delete: () => ({ eq: deleteEq }) })) } };
});
vi.mock('$lib/server/supabase-admin', () => ({ serviceClient: () => svc }));
import { POST } from './+server';
import { canResetEnglish } from '$lib/server/test-accounts';
import { load } from '../+page.server';

const confirmed = '2026-01-01T00:00:00Z';
function event(email: string, body: unknown = {}, origin = 'https://m.test') {
	const user = { id: 'u1', email, email_confirmed_at: confirmed };
	const updateUser = vi.fn().mockResolvedValue({ error: null });
	const request = new Request('https://m.test/settings/reset-english', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });
	return { updateUser, e: { request, locals: { supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error: null }), updateUser } } } } as any };
}

beforeEach(() => { deleteEq.mockClear(); svc.from.mockClear(); });

describe('test-account English reset', () => {
	it('is only for the owner’s two confirmed test accounts', async () => {
		expect(canResetEnglish({ email: 'afz.javan@gmail.com', email_confirmed_at: confirmed })).toBe(true);
		expect(canResetEnglish({ email: ' Afraz.Jva@gmail.com', email_confirmed_at: confirmed })).toBe(true);
		expect(canResetEnglish({ email: 'afraz.jva@gmail.com', email_confirmed_at: undefined })).toBe(false);
		expect(canResetEnglish({ email: 'someone@gmail.com', email_confirmed_at: confirmed })).toBe(false);
		expect(canResetEnglish(null)).toBe(false);
		expect(await load({ locals: { user: { email: 'someone@gmail.com', email_confirmed_at: confirmed } } } as any)).toEqual({ canResetEnglish: false });
	});
	it('clears the English progress of the signed-in account, keeping the history unless asked', async () => {
		const { e, updateUser } = event('afraz.jva@gmail.com');
		expect(await (await POST(e)).json()).toEqual({ ok: true, historyCleared: false });
		expect(updateUser).toHaveBeenCalledWith({ data: { english_profile_v1: null, english_progress_v1: null, english_day_v1: null, english_path_v1: null } });
		expect(svc.from).not.toHaveBeenCalled();
	});
	it('also clears the activity history when asked', async () => {
		const { e } = event('afz.javan@gmail.com', { history: true });
		expect(await (await POST(e)).json()).toEqual({ ok: true, historyCleared: true });
		expect(deleteEq).toHaveBeenCalledWith('user_id', 'u1');
	});
	it('refuses other accounts and other sites', async () => {
		const other = event('someone@gmail.com');
		expect((await POST(other.e)).status).toBe(403);
		expect(other.updateUser).not.toHaveBeenCalled();
		expect((await POST(event('afz.javan@gmail.com', {}, 'https://evil.test').e)).status).toBe(403);
	});
});
