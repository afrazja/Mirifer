import { describe, it, expect, vi } from 'vitest';
vi.mock('$lib/server/admin-auth', () => ({ isAdminEmail: (email?: string | null) => email === 'owner@example.com' }));
import { canUseLab, inLearnerView, ownerToolsShown, LEARNER_VIEW_COOKIE } from './lab-access';

const owner = { email: 'owner@example.com', email_confirmed_at: '2026-01-01T00:00:00Z' } as never;
const learner = { email: 'learner@example.com', email_confirmed_at: '2026-01-01T00:00:00Z' } as never;
const jar = (value?: string) => ({ get: (name: string) => (name === LEARNER_VIEW_COOKIE ? value : undefined) });

describe('seeing the app as a learner', () => {
	it('hides the owner tools only for the owner who asked for it', () => {
		expect(ownerToolsShown(owner, jar())).toBe(true);
		expect(ownerToolsShown(owner, jar('1'))).toBe(false);
		expect(inLearnerView(owner, jar('1'))).toBe(true);
	});
	it('never gives a learner anything, cookie or not', () => {
		expect(canUseLab(learner)).toBe(false);
		expect(ownerToolsShown(learner, jar())).toBe(false);
		expect(inLearnerView(learner, jar('1'))).toBe(false);
	});
});
