import { describe, it, expect, vi } from 'vitest';
vi.mock('$env/dynamic/private', () => ({ env: { ADMIN_EMAIL: 'owner@m.test' } }));
import { load } from './+page.server';
import { load as layoutLoad } from '../+layout.server';
import { LAB_MODULES } from '$lib/practice/module-lab';

const locals = (user: object | null, isAdmin = false) => ({
	user, supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { is_admin: isAdmin } }) }) }) }) }
}) as any;
const learner = { id: 'u1', email: 'a@b.c', email_confirmed_at: '2026-01-01T00:00:00Z', user_metadata: { target_language: 'en' } };
const owner = { ...learner, id: 'u0', email: 'Owner@M.test' };

describe('Module lab', () => {
	it('lists the 17 module types once each', () => {
		expect(LAB_MODULES).toHaveLength(17);
		expect(new Set(LAB_MODULES.map(m => m.id)).size).toBe(17);
	});
	it('opens a built module from every card', () => {
		expect(LAB_MODULES.filter(m => !m.href).map(m => m.id)).toEqual([]);
	});
	it('is open to the owner only; learners and other admins go to the daily lesson', async () => {
		expect(await layoutLoad({ locals: locals(owner) } as any)).toEqual({ labAccess: true });
		expect(await layoutLoad({ locals: locals({ ...owner, email_confirmed_at: null }) } as any)).toEqual({ labAccess: false });
		expect(await layoutLoad({ locals: locals(learner, true) } as any)).toEqual({ labAccess: false });
		expect(await layoutLoad({ locals: locals(learner, false) } as any)).toEqual({ labAccess: false });
		expect(await layoutLoad({ locals: locals(null) } as any)).toEqual({ labAccess: false });
		await expect(load({ locals: locals(learner), parent: async () => ({ labAccess: false }) } as any)).rejects.toMatchObject({ status: 303, location: '/practice/english/today' });
		await expect(load({ locals: locals(learner), parent: async () => ({ labAccess: true }) } as any)).resolves.toEqual({});
		await expect(load({ locals: locals(null), parent: async () => ({ labAccess: false }) } as any)).rejects.toMatchObject({ location: '/login' });
	});
});

import { load as homeLoad } from '../home/+page.server';
describe('English start page', () => {
	it('shows the two parts to admins and sends learners straight to the daily lesson', async () => {
		await expect(homeLoad({ locals: locals(learner), parent: async () => ({ labAccess: true }) } as any)).resolves.toEqual({});
		await expect(homeLoad({ locals: locals(learner), parent: async () => ({ labAccess: false }) } as any)).rejects.toMatchObject({ status: 303, location: '/practice/english/today' });
	});
});
