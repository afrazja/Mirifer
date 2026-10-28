/**
 * The Module lab runs a module with any day's content: Day 1, or a later day's version. The choice
 * is remembered per module in this browser.
 */
import type { DisplayText } from './hotel';
import { DAY_ONE, allModules, dayById, modulesFor, type DayModule, type ModuleId, type Track } from './day';

export interface LabSet { id: string; day: string; track: Track; name: DisplayText }
export const LAB_SETS: LabSet[] = [
	{ id: 'day-1', day: 'day-1', track: 'intermediate', name: { en: 'Day 1 · Intermediate', fa: 'روز ۱، متوسط' } },
	{ id: 'day-1-professional', day: 'day-1', track: 'professional', name: { en: 'Day 1 · Professional', fa: 'روز ۱، حرفه‌ای' } },
	{ id: 'day-2-intermediate', day: 'day-2', track: 'intermediate', name: { en: 'Day 2 · Intermediate', fa: 'روز ۲، متوسط' } },
	{ id: 'day-2-professional', day: 'day-2', track: 'professional', name: { en: 'Day 2 · Professional', fa: 'روز ۲، حرفه‌ای' } },
	{ id: 'day-3-intermediate', day: 'day-3', track: 'intermediate', name: { en: 'Day 3 · Intermediate', fa: 'روز ۳، متوسط' } },
	{ id: 'day-3-professional', day: 'day-3', track: 'professional', name: { en: 'Day 3 · Professional', fa: 'روز ۳، حرفه‌ای' } },
	{ id: 'day-4-intermediate', day: 'day-4', track: 'intermediate', name: { en: 'Day 4 · Intermediate', fa: 'روز ۴، متوسط' } },
	{ id: 'day-4-professional', day: 'day-4', track: 'professional', name: { en: 'Day 4 · Professional', fa: 'روز ۴، حرفه‌ای' } },
	{ id: 'everyday-1-intermediate', day: 'everyday-1', track: 'intermediate', name: { en: 'Everyday 1 · Intermediate', fa: 'روزمره ۱، متوسط' } },
	{ id: 'everyday-1-professional', day: 'everyday-1', track: 'professional', name: { en: 'Everyday 1 · Professional', fa: 'روزمره ۱، حرفه‌ای' } },
	{ id: 'everyday-2-intermediate', day: 'everyday-2', track: 'intermediate', name: { en: 'Everyday 2 · Intermediate', fa: 'روزمره ۲، متوسط' } },
	{ id: 'everyday-2-professional', day: 'everyday-2', track: 'professional', name: { en: 'Everyday 2 · Professional', fa: 'روزمره ۲، حرفه‌ای' } }
];
/** One set per chapter (for modules whose content doesn't change with the version: traps, voice messages). */
export const LAB_CHAPTER_SETS: LabSet[] = LAB_SETS.filter(set => set.track === 'intermediate' || set.id === 'day-1')
	.filter((set, i, all) => all.findIndex(other => other.day === set.day) === i)
	.map(set => ({ ...set, name: { en: set.name.en.replace(/ · .*$/, ''), fa: set.name.fa.replace(/، .*$/, '') } }));
export const labSet = (id: string | null | undefined) => LAB_SETS.find(set => set.id === id) ?? LAB_SETS[0];

const key = (module: string) => `mirifer_lab_set:${module}`;
export function savedLabSet(module: string): LabSet {
	try { return labSet(localStorage.getItem(key(module))); } catch { return LAB_SETS[0]; }
}
export function saveLabSet(module: string, id: string): void {
	try { localStorage.setItem(key(module), id); } catch { /* the choice just isn't remembered */ }
}

/** The day's module of this kind (for Mira's intro in the lab): that version's, the day's other version's, or Day 1's. */
export function labModule(set: LabSet, id: ModuleId): DayModule | null {
	const day = dayById(set.day) ?? DAY_ONE;
	const lists = day.tracks ? [day.tracks[set.track], ...Object.values(day.tracks)] : [modulesFor(15, day)];
	for (const list of lists) { const found = list.find(module => module.id === id); if (found) return found; }
	return allModules(DAY_ONE).find(module => module.id === id) ?? null;
}
