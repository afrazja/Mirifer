/**
 * The English path (docs/step-path-plan.md): the course as a line of short steps. A chapter is a day
 * (its story and its two versions); a step is one of the chapter's modules, in the chapter's order,
 * using the full five-module set. The app chooses the order; learners never pick steps.
 *
 * Saved on our server in the learner's metadata (`english_path_v1`), small and capped: it rides in
 * the session cookie. Ids, versions and day numbers only, never what the learner said.
 *
 * Older records are read on every load (`readPath`): days in `english_progress_v1.finishedDays`
 * count as five steps done, and a daily lesson under way (`english_day_v1`) carries its steps over.
 * The old fields only grow, so reading them again is safe after a rollback or from a tab on old code.
 */
import { z } from 'zod';
import { DAYS, arcOf, type ArcId, DAY_IDS, DaySessionSchema, MODULE_IDS, TRACKS, currentModule, dayById, finishedDays, modulesFor, type DayModule, type DayPack, type ModuleId, type Track } from './day';
import { RECENT_SESSIONS, readEnglishProgress, resultBand, type EnglishProgress, type FinishedModule } from './english-progress';

/** `day-2:phrases`: a chapter and one of its modules. */
export type StepId = `${(typeof DAY_IDS)[number]}:${ModuleId}`;
const STEP_PATTERN = new RegExp(`^(${DAY_IDS.join('|')}):(${MODULE_IDS.join('|')})$`);
export const isStepId = (value: unknown): value is StepId => typeof value === 'string' && STEP_PATTERN.test(value);
const StepIdSchema = z.string().regex(STEP_PATTERN) as unknown as z.ZodType<StepId>;

/** The version a step was done in, in one letter. */
const LETTER: Record<Track, 'i' | 'p'> = { intermediate: 'i', professional: 'p' };
/** Caps that keep the record small (every step of 30 chapters in both versions would be 300). */
export const MAX_DONE = 150;
export const MAX_SKIPPED = 60;

export const PathSchema = z.object({
	/** Each step done at least once: the version, and the learner's local day it was last done (replays move it; 0 = before the path). */
	done: z.partialRecord(StepIdSchema, z.tuple([z.enum(['i', 'p']), z.number().int().min(0).max(1_000_000)]))
		.refine(done => Object.keys(done).length <= MAX_DONE),
	/** Skipped and not done since. */
	skipped: z.array(StepIdSchema).max(MAX_SKIPPED),
	/** The one step under way: its start keys the answers kept in the browser and the events. */
	current: z.object({ step: StepIdSchema, track: z.enum(TRACKS), startedAt: z.string().datetime(), replay: z.boolean() }).strict().nullable()
}).strict();
export type Path = z.infer<typeof PathSchema>;

export const EMPTY_PATH: Path = { done: {}, skipped: [], current: null };

export const stepId = (day: DayPack | string, module: DayModule | ModuleId): StepId =>
	`${typeof day === 'string' ? day : day.id}:${typeof module === 'string' ? module : module.id}` as StepId;
export function splitStep(step: StepId): { day: DayPack; module: ModuleId } | null {
	const [dayId, module] = step.split(':');
	const day = dayById(dayId);
	return day ? { day, module: module as ModuleId } : null;
}

/** The learner's calendar day as a number (days since 1970-01-01 at their offset, minutes east of UTC). */
export function localDay(now: Date, utcOffsetMin: number | null = 0): number {
	const offset = typeof utcOffsetMin === 'number' && Math.abs(utcOffsetMin) <= 840 ? utcOffsetMin : 0;
	return Math.floor((now.getTime() + offset * 60_000) / 86_400_000);
}

/** A chapter's steps in one version, in order: the full five-module set. */
export const chapterModules = (day: DayPack, track: Track): DayModule[] => modulesFor(20, day, track);
export const chapterSteps = (day: DayPack, track: Track): StepId[] => chapterModules(day, track).map(module => stepId(day, module));

/** Who sees chapters before their release: the owner (all of them), the test accounts (`pilot` ones), or no one. */
export type Preview = boolean | 'pilot';

/**
 * The order of the stories for each goal (docs/goal-path-plan.md): the goal's own story first, then
 * the others. "Not sure yet" starts like Everyday; no goal (older profiles) like Travel.
 */
const ARC_ORDER: Record<string, ArcId[]> = {
	travel: ['travel', 'everyday', 'abroad', 'work', 'exam'],
	everyday: ['everyday', 'travel', 'abroad', 'work', 'exam'],
	unsure: ['everyday', 'travel', 'abroad', 'work', 'exam'],
	abroad: ['abroad', 'everyday', 'travel', 'work', 'exam'],
	work: ['work', 'everyday', 'travel', 'abroad', 'exam'],
	exam: ['exam', 'everyday', 'travel', 'abroad', 'work']
};
export const arcOrder = (reason: string | null | undefined): ArcId[] => ARC_ORDER[reason ?? 'travel'] ?? ARC_ORDER.travel;

/**
 * The chapters a learner can open, in their journey's order: each story up to its first chapter not
 * ready (the owner, `preview`, gets them all). A story with nothing ready isn't there yet. The
 * travel story always opens with its first chapter.
 */
export function releasedChapters(preview: Preview = false, reason: string | null = null): DayPack[] {
	return arcOrder(reason).flatMap(arc => {
		const days = DAYS.filter(day => arcOf(day) === arc);
		// 'pilot': the owner's test accounts also get chapters marked `pilot`, before their release.
		const firstClosed = days.findIndex(day => !day.ready && !(preview === 'pilot' && day.pilot));
		if (preview === true || firstClosed === -1) return days;
		return days.slice(0, arc === 'travel' ? Math.max(1, firstClosed) : firstClosed);
	});
}
/** A chapter's number in this learner's journey (1 for the first story's first chapter). */
export const chapterNumber = (day: DayPack, preview: Preview = false, reason: string | null = null) => releasedChapters(preview, reason).indexOf(day) + 1 || day.number;

/** Whether a step can be opened: a released chapter, and a module of that chapter in this version. */
export function isOpenStep(step: StepId, track: Track, preview: Preview = false, reason: string | null = null): boolean {
	const parts = splitStep(step);
	return !!parts && releasedChapters(preview, reason).includes(parts.day) && chapterSteps(parts.day, track).includes(step);
}

function markDone(path: Path, step: StepId, track: Track, day: number): Path {
	const done = { ...path.done, [step]: [LETTER[track], day] as ['i' | 'p', number] };
	return { ...path, done, skipped: path.skipped.filter(item => item !== step) };
}

/**
 * The learner's path, from the saved record and the older ones: each finished day counts as its
 * five steps done (in the learner's version now), and a daily lesson under way carries over the
 * first time. A step both done and skipped counts as done. Never writes; the next save stores it.
 */
export function readPath(meta: Record<string, unknown> | null | undefined, track: Track): Path {
	const parsed = PathSchema.safeParse(meta?.english_path_v1);
	let path: Path = parsed.success ? parsed.data : EMPTY_PATH;
	for (const day of finishedDays(readEnglishProgress(meta))) {
		for (const step of chapterSteps(day, track)) if (!path.done[step]) path = markDone(path, step, track, 0);
	}
	if (!parsed.success) {
		const saved = DaySessionSchema.safeParse(meta?.english_day_v1);
		if (saved.success && saved.data.stage !== 'done') {
			const session = saved.data, sessionTrack = session.track ?? 'intermediate';
			for (const module of session.done) path = markDone(path, stepId(session.day, module), sessionTrack, 0);
			for (const module of session.skipped) {
				const step = stepId(session.day, module);
				if (!path.done[step] && !path.skipped.includes(step)) path = { ...path, skipped: [...path.skipped, step] };
			}
			const next = currentModule(session);
			// The step it stopped on keeps its start, so the answers kept in the browser still match.
			if (next) path = { ...path, current: { step: stepId(session.day, next), track: sessionTrack, startedAt: session.startedAt, replay: false } };
		}
	}
	return path;
}

const handled = (path: Path, step: StepId) => !!path.done[step] || path.skipped.includes(step);
/** A chapter is finished when every step is done or skipped and at least one is done (as a daily lesson was). */
export function chapterFinished(path: Path, day: DayPack, track: Track): boolean {
	const steps = chapterSteps(day, track);
	return steps.every(step => handled(path, step)) && steps.some(step => !!path.done[step]);
}

export interface NextStep { step: StepId; day: DayPack; module: DayModule; index: number; total: number }
function describe(day: DayPack, track: Track, step: StepId): NextStep {
	const modules = chapterModules(day, track);
	const index = modules.findIndex(module => stepId(day, module) === step);
	return { step, day, module: modules[index], index, total: modules.length };
}

/**
 * The step to do next: in the first released chapter not finished, the first step neither done nor
 * skipped. A chapter with every step skipped brings its first step back. Null when every released
 * chapter is finished (then the app offers a replay).
 */
/** A step's place in its chapter, for the card that shows it. */
export function stepInfo(step: StepId, track: Track): NextStep | null {
	const parts = splitStep(step);
	if (!parts) return null;
	const modules = chapterModules(parts.day, track);
	const index = modules.findIndex(module => module.id === parts.module);
	return index < 0 ? null : { step, day: parts.day, module: modules[index], index, total: modules.length };
}

export function nextStep(path: Path, track: Track, preview: Preview = false, reason: string | null = null): NextStep | null {
	for (const day of releasedChapters(preview, reason)) {
		if (chapterFinished(path, day, track)) continue;
		const steps = chapterSteps(day, track);
		const step = steps.find(item => !handled(path, item)) ?? steps[0];
		return describe(day, track, step);
	}
	return null;
}

/**
 * The step to practise again when nothing new is left: a skipped step first, then the step done
 * longest ago (a replay moves its day, so the replays take turns). On a tie, speaking steps first.
 */
export function replayPick(path: Path, track: Track, preview: Preview = false, reason: string | null = null): NextStep | null {
	const all = releasedChapters(preview, reason).flatMap(day => chapterModules(day, track).map(module => ({ day, module, step: stepId(day, module) })));
	const skipped = all.find(item => path.skipped.includes(item.step));
	if (skipped) return describe(skipped.day, track, skipped.step);
	const done = all.filter(item => path.done[item.step]);
	if (!done.length) return null;
	const best = done.reduce((a, b) => {
		const dayA = path.done[a.step]![1], dayB = path.done[b.step]![1];
		if (dayA !== dayB) return dayA < dayB ? a : b;
		return a.module.skill !== 'speaking' && b.module.skill === 'speaking' ? b : a;
	});
	return describe(best.day, track, best.step);
}

/** Starts a step (a replay when it is done already). Starting it again keeps its start. */
export function startStep(path: Path, step: StepId, track: Track, now = new Date()): Path {
	if (path.current?.step === step) return path;
	return { ...path, current: { step, track, startedAt: now.toISOString(), replay: !!path.done[step] } };
}

export interface StepResult { step: StepId; outcome: 'done' | 'skipped' }
/**
 * One step's result, merged into the path on the server. Done: marked done (a replay only moves its
 * day). Skipped: kept as skipped unless it was done before. Either way it is no longer under way.
 */
export function applyStep(path: Path, result: StepResult, track: Track, day: number): Path {
	const current = path.current?.step === result.step ? null : path.current;
	if (result.outcome === 'done') {
		if (!path.done[result.step] && Object.keys(path.done).length >= MAX_DONE) return { ...path, current };
		return { ...markDone(path, result.step, track, day), current };
	}
	if (path.done[result.step] || path.skipped.includes(result.step)) return { ...path, current };
	return { ...path, skipped: [...path.skipped, result.step].slice(-MAX_SKIPPED), current };
}

/** Steps done, each once in any version (replays don't add). */
export const stepsDone = (path: Path) => Object.keys(path.done).length;
/** Whether a step was done on this local day (the daily goal, even if its event was lost). */
export const doneOn = (path: Path, day: number) => Object.values(path.done).some(([, last]) => last === day);

/**
 * Keeps `english_progress_v1` current, one step at a time: Mira's greeting, the coach and the course
 * list read it. A chapter goes into `finishedDays` only when it is finished.
 */
export function recordStep(progress: EnglishProgress, dayId: string, finished: FinishedModule | null, chapterDone: boolean, now = new Date()): EnglishProgress {
	const tally = { listening: { correct: 0, total: 0 }, speaking: { correct: 0, total: 0 } };
	if (finished) tally[finished.skill] = { correct: finished.correct, total: finished.total };
	const days = progress.finishedDays ?? finishedDays(progress).map(day => day.id);
	return {
		sessionsCompleted: progress.sessionsCompleted + 1,
		lastCompletedAt: now.toISOString(),
		lastThemeId: dayId,
		lastResult: finished ? resultBand(finished.correct, finished.total) : progress.lastResult,
		recent: finished && finished.total > 0 ? [...progress.recent, tally].slice(-RECENT_SESSIONS) : progress.recent,
		finishedDays: chapterDone && !days.includes(dayId) ? [...days, dayId] : days
	};
}
