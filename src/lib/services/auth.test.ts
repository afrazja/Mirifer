import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/supabase/client', () => ({
	getSupabaseBrowserClient: vi.fn()
}));
// signOut dynamically imports data-layer for clearAllLocal — mock it.
const clearAllLocal = vi.fn();
vi.mock('./data-layer', () => ({ clearAllLocal }));

import {
	isConfigured,
	getUser,
	getSession,
	isAuthenticated,
	signIn,
	signUp,
	signOut,
	getTargetLanguage,
	updateLanguagePreferences
} from './auth';
import { getSupabaseBrowserClient } from '$lib/supabase/client';

/** Build a mock Supabase client with overridable auth methods. */
function mockClient(authMethods: Record<string, any> = {}) {
	const client = {
		auth: {
			getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
			getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
			signInWithPassword: vi.fn(),
			signUp: vi.fn(),
			signOut: vi.fn().mockResolvedValue({ error: null }),
			updateUser: vi.fn(),
			...authMethods
		}
	};
	vi.mocked(getSupabaseBrowserClient).mockReturnValue(client as any);
	return client;
}

/** Simulate Supabase not being configured (client constructor throws). */
function mockUnconfigured() {
	vi.mocked(getSupabaseBrowserClient).mockImplementation(() => {
		throw new Error('not configured');
	});
}

beforeEach(() => {
	vi.clearAllMocks();
});

describe('learning language preferences', () => {
	it('never reads another account’s cached language for an unconfigured account', async () => {
		localStorage.setItem('mirifer_target_language', 'de');
		mockClient({ getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'new-user', user_metadata: {} } } }) });
		expect(await getTargetLanguage()).toBeNull();
	});
	it.each(['fr'] as const)('rejects unavailable %s before any profile or auth writes', async (course) => {
		const client = mockClient({ updateUser: vi.fn() });
		expect(await updateLanguagePreferences('en', course)).toMatchObject({ error: expect.any(String) });
		expect(client.auth.updateUser).not.toHaveBeenCalled();
	});
	it('does not mark onboarding complete when the profile preference could not save', async () => {
		const client = mockClient({
			getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'new-user' } } }),
			updateUser: vi.fn()
		}) as any;
		client.from = vi.fn().mockReturnValue({ update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: 'offline' } }) }) });
		expect(await updateLanguagePreferences('en', 'de')).toEqual({ error: 'offline' });
		expect(client.auth.updateUser).not.toHaveBeenCalled();
	});
});

describe('isConfigured', () => {
	it('is true when the client is available', () => {
		mockClient();
		expect(isConfigured()).toBe(true);
	});

	it('is false when the client throws', () => {
		mockUnconfigured();
		expect(isConfigured()).toBe(false);
	});
});

describe('getUser', () => {
	it('returns the current user', async () => {
		mockClient({ getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) });
		expect(await getUser()).toEqual({ id: 'u1' });
	});

	it('returns null when not configured', async () => {
		mockUnconfigured();
		expect(await getUser()).toBeNull();
	});

	it('returns null if the auth call throws', async () => {
		mockClient({ getUser: vi.fn().mockRejectedValue(new Error('boom')) });
		expect(await getUser()).toBeNull();
	});
});

describe('getUser caching', () => {
	const session = (token: string) => ({ data: { session: { access_token: token } } });

	it('verifies once for concurrent and repeated calls in the same session', async () => {
		const getUserMock = vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } });
		mockClient({ getUser: getUserMock, getSession: vi.fn().mockResolvedValue(session('tok-a')) });
		const users = await Promise.all([getUser(), getUser(), getUser()]);
		expect(users.map((u) => u?.id)).toEqual(['u1', 'u1', 'u1']);
		expect(await getUser()).toEqual({ id: 'u1' });
		expect(getUserMock).toHaveBeenCalledTimes(1);
	});

	it('never returns a cached user for a different session', async () => {
		mockClient({
			getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'first' } } }),
			getSession: vi.fn().mockResolvedValue(session('tok-b'))
		});
		expect((await getUser())?.id).toBe('first');
		mockClient({
			getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'second' } } }),
			getSession: vi.fn().mockResolvedValue(session('tok-c'))
		});
		expect((await getUser())?.id).toBe('second');
	});

	it('does not cache a missing user', async () => {
		const getUserMock = vi.fn().mockResolvedValue({ data: { user: null } });
		mockClient({ getUser: getUserMock, getSession: vi.fn().mockResolvedValue(session('tok-d')) });
		await getUser();
		await getUser();
		expect(getUserMock).toHaveBeenCalledTimes(2);
	});
});

describe('getSession / isAuthenticated', () => {
	it('returns the session when present', async () => {
		mockClient({ getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'x' } } }) });
		expect(await getSession()).toEqual({ access_token: 'x' });
	});

	it('isAuthenticated is true with a session', async () => {
		mockClient({ getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'x' } } }) });
		expect(await isAuthenticated()).toBe(true);
	});

	it('isAuthenticated is false without a session', async () => {
		mockClient({ getSession: vi.fn().mockResolvedValue({ data: { session: null } }) });
		expect(await isAuthenticated()).toBe(false);
	});

	it('isAuthenticated is false when not configured', async () => {
		mockUnconfigured();
		expect(await isAuthenticated()).toBe(false);
	});
});

describe('signIn', () => {
	it('returns the user on success', async () => {
		const signInWithPassword = vi
			.fn()
			.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
		mockClient({ signInWithPassword });

		const result = await signIn('a@b.com', 'pw');
		expect(signInWithPassword).toHaveBeenCalledWith({ email: 'a@b.com', password: 'pw' });
		expect(result).toEqual({ user: { id: 'u1' }, error: null });
	});

	it('surfaces the error message on failure', async () => {
		mockClient({
			signInWithPassword: vi
				.fn()
				.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid login credentials' } })
		});

		const result = await signIn('a@b.com', 'wrong');
		expect(result).toEqual({ user: null, error: 'Invalid login credentials' });
	});

	it('returns a configured-error when Supabase is unavailable', async () => {
		mockUnconfigured();
		const result = await signIn('a@b.com', 'pw');
		expect(result.user).toBeNull();
		expect(result.error).toBe('Supabase not configured');
	});
});

describe('signUp', () => {
	it('returns the user on success', async () => {
		const signUpFn = vi.fn().mockResolvedValue({ data: { user: { id: 'new' } }, error: null });
		mockClient({ signUp: signUpFn });

		const result = await signUp('a@b.com', 'pw', 'Ada');
		expect(result).toEqual({ user: { id: 'new' }, error: null });
		// display name passed through to options.data
		expect(signUpFn.mock.calls[0][0].options.data.display_name).toBe('Ada');
	});

	it('defaults the display name to "Learner"', async () => {
		const signUpFn = vi.fn().mockResolvedValue({ data: { user: { id: 'new' } }, error: null });
		mockClient({ signUp: signUpFn });

		await signUp('a@b.com', 'pw');
		expect(signUpFn.mock.calls[0][0].options.data.display_name).toBe('Learner');
	});

	it('surfaces the error message on failure', async () => {
		mockClient({
			signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: { message: 'User already registered' } })
		});

		const result = await signUp('a@b.com', 'pw');
		expect(result).toEqual({ user: null, error: 'User already registered' });
	});
});

describe('signOut', () => {
	it('clears local data and revokes the session', async () => {
		const signOutFn = vi.fn().mockResolvedValue({ error: null });
		mockClient({ signOut: signOutFn });

		const result = await signOut();
		expect(clearAllLocal).toHaveBeenCalledOnce();
		expect(signOutFn).toHaveBeenCalledOnce();
		expect(result).toEqual({ error: null });
	});

	it('returns the error message if Supabase signOut fails', async () => {
		mockClient({ signOut: vi.fn().mockResolvedValue({ error: { message: 'network' } }) });

		const result = await signOut();
		expect(result).toEqual({ error: 'network' });
	});

	it('is a no-op (no error) when not configured', async () => {
		mockUnconfigured();
		const result = await signOut();
		expect(result).toEqual({ error: null });
		expect(clearAllLocal).not.toHaveBeenCalled();
	});
});
