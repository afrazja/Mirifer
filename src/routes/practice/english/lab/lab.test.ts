import { describe, it, expect, vi } from 'vitest';
vi.mock('$env/dynamic/private', () => ({ env: { ADMIN_EMAIL: 'owner@m.test' } }));
import { load } from './+page.server';
import { load as layoutLoad } from '../+layout.server';
import { LAB_MODULES } from '$lib/practice/module-lab';
import { DAY_TWO, startSession } from '$lib/practice/day';

const locals = (user: object | null, isAdmin = false) => ({
	user, supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { is_admin: isAdmin } }) }) }) }) }
}) as any;
const learner = { id: 'u1', email: 'a@b.c', email_confirmed_at: '2026-01-01T00:00:00Z', user_metadata: { target_language: 'en' } };
const owner = { ...learner, id: 'u0', email: 'Owner@M.test' };

describe('Module lab', () => {
	it('lists the 18 module types once each', () => {
		expect(LAB_MODULES).toHaveLength(18);
		expect(new Set(LAB_MODULES.map(m => m.id)).size).toBe(18);
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

import { load as daysLoad } from '../days/+page.server';
describe('Daily lessons list', () => {
	it('is the owner’s only: learners go to today’s lesson', async () => {
		await expect(daysLoad({ locals: locals(learner), parent: async () => ({ labAccess: false }) } as any)).rejects.toMatchObject({ status: 303, location: '/practice/english/today' });
		await expect(daysLoad({ locals: locals(null), parent: async () => ({ labAccess: false }) } as any)).rejects.toMatchObject({ location: '/login' });
	});
	it('marks the owner’s next day and a session still in progress', async () => {
		const progress = { sessionsCompleted: 1, lastCompletedAt: '2026-10-01T10:00:00.000Z', lastThemeId: 'day-1', lastResult: 'ok', recent: [] };
		const fresh = { ...owner, user_metadata: { target_language: 'en' } };
		expect(await daysLoad({ locals: locals(fresh), parent: async () => ({ labAccess: true }) } as any)).toEqual({ nextDayId: 'day-1', openDayId: null });
		const moved = { ...owner, user_metadata: { target_language: 'en', english_progress_v1: progress, english_day_v1: startSession(15, new Date(), DAY_TWO) } };
		expect(await daysLoad({ locals: locals(moved), parent: async () => ({ labAccess: true }) } as any)).toEqual({ nextDayId: 'day-2', openDayId: 'day-2' });
	});
});

import { LAB_SETS, labModule, labSet } from '$lib/practice/lab-sets';
describe('Module lab day sets', () => {
	it('runs a module with any day’s content; Mira’s intro comes from that day', () => {
		expect(labSet('nope')).toBe(LAB_SETS[0]);
		const pro = labSet('day-2-professional');
		// Day 2 Professional has no Listen and connect: its intro comes from Day 2's other version, never Day 1.
		expect(labModule(pro, 'listen-act')?.intro.en).toContain('taxi');
		expect(labModule(labSet('day-1'), 'listen-act')?.intro.en).toContain('airport');
		expect(labModule(pro, 'phrases')?.intro.en).toContain('natural in a taxi');
	});
});
