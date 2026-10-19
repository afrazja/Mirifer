/**
 * The Module lab runs a module with any day's content: Day 1, or a later day's version. The choice
 * is remembered per module in this browser.
 */
import type { DisplayText } from './hotel';
import { DAY_ONE, dayById, modulesFor, type DayModule, type ModuleId, type Track } from './day';

export interface LabSet { id: string; day: string; track: Track; name: DisplayText }
export const LAB_SETS: LabSet[] = [
	{ id: 'day-1', day: 'day-1', track: 'intermediate', name: { en: 'Day 1', fa: 'روز ۱' } },
	{ id: 'day-2-intermediate', day: 'day-2', track: 'intermediate', name: { en: 'Day 2 · Intermediate', fa: 'روز ۲، متوسط' } },
	{ id: 'day-2-professional', day: 'day-2', track: 'professional', name: { en: 'Day 2 · Professional', fa: 'روز ۲، حرفه‌ای' } }
];
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
	return DAY_ONE.modules.find(module => module.id === id) ?? null;
}
