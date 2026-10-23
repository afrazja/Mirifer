import type { LayoutServerLoad } from './$types';
import { inLearnerView, ownerToolsShown } from '$lib/server/lab-access';

/**
 * Whether this learner sees the owner tools (the Module lab, every day and both versions): the owner
 * only, and not while they're seeing the app as a learner (`learnerView`).
 */
export const load: LayoutServerLoad = async ({ locals, cookies }) => ({
	labAccess: ownerToolsShown(locals.user, cookies),
	learnerView: inLearnerView(locals.user, cookies)
});
