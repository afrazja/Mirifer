import type { PageServerLoad } from './$types';
import { canResetEnglish } from '$lib/server/test-accounts';

/** Only whether to show the test-account reset; the reset itself checks the account again. */
export const load: PageServerLoad = async ({ locals }) => ({ canResetEnglish: canResetEnglish(locals.user) });
