import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { dayById, type Track } from '$lib/practice/day';
import { chapterModules } from '$lib/practice/path';

/** Module lab: one step of any chapter, on its own (lab access only; nothing is saved to the path). */
export const load: PageServerLoad = async ({ locals, parent, url }) => {
	if (!locals.user) redirect(303, '/login');
	if (locals.user.user_metadata?.target_language !== 'en') redirect(303, '/languages');
	const { labAccess } = await parent();
	if (!labAccess) redirect(303, '/practice/english/today');
	const day = dayById(url.searchParams.get('day'));
	const track: Track = url.searchParams.get('track') === 'professional' ? 'professional' : 'intermediate';
	const moduleId = url.searchParams.get('module');
	if (!day || !chapterModules(day, track).some(mod => mod.id === moduleId)) error(404, 'No such step');
	const name = typeof locals.user.user_metadata?.display_name === 'string' ? locals.user.user_metadata.display_name.slice(0, 40) : '';
	return { dayId: day.id, track, moduleId: moduleId!, name };
};
