import type { LayoutServerLoad } from './$types';
import { canUseLab } from '$lib/server/lab-access';

/** Whether this learner sees the second part of the English section, the Module lab (the owner only). */
export const load: LayoutServerLoad = async ({ locals }) => ({ labAccess: canUseLab(locals.user) });
