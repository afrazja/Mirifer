import { describe, expect, it } from 'vitest';
import { DAYS, DAY_ONE, DAY_TWO, DAY_THREE, DAY_FOUR, startSession, finishModule } from './day';
import { EMPTY_PROGRESS } from './english-progress';
import {
	EMPTY_PATH, MAX_DONE, PathSchema, arcOrder, chapterNumber, applyStep, chapterFinished, chapterSteps, doneOn, isOpenStep, isStepId, localDay,
	nextStep, readPath, recordStep, releasedChapters, replayPick, startStep, stepId, stepsDone, type Path, type StepId
} from './path';

const progressWith = (finished: string[]) => ({ english_progress_v1: { ...EMPTY_PROGRESS, lastThemeId: finished.at(-1) ?? null, finishedDays: finished } });
const doneAll = (path: Path, steps: StepId[], day = 1) => steps.reduce((p, step) => applyStep(p, { step, outcome: 'done' }, 'intermediate', day), path);

describe('chapters and steps', () => {
	it('gives every chapter five steps in each version', () => {
		for (const day of DAYS) for (const track of ['intermediate', 'professional'] as const) expect(chapterSteps(day, track)).toHaveLength(5);
	});
	it('opens the chapters up to the first one not ready, and all of them for the owner', () => {
		expect(releasedChapters().map(day => day.id)).toEqual(DAYS.slice(0, DAYS.findIndex(day => !day.ready)).map(day => day.id));
		expect(releasedChapters(true)).toEqual(DAYS);
	});
	it('only opens released steps of the learner’s version', () => {
		expect(isOpenStep('day-2:traps', 'intermediate')).toBe(true);
		expect(isOpenStep('day-2:traps', 'professional')).toBe(false);
		if (!DAY_FOUR.ready) {
			expect(isOpenStep('day-4:phrases', 'intermediate')).toBe(false);
			expect(isOpenStep('day-4:phrases', 'intermediate', true)).toBe(true);
		}
		expect(isStepId('day-9:phrases')).toBe(false);
		expect(isStepId('day-1:phrases')).toBe(true);
	});
	it('counts local days at the learner’s offset', () => {
		const now = new Date('2026-10-25T22:30:00Z');
		expect(localDay(now, 210) - localDay(now, 0)).toBe(1);
		expect(localDay(now, 5000)).toBe(localDay(now, 0));
	});
});

describe('next step', () => {
	it('starts a new learner at Chapter 1, step 1', () => {
		const next = nextStep(EMPTY_PATH, 'intermediate')!;
		expect(next).toMatchObject({ step: 'day-1:listen-act', index: 0, total: 5 });
		expect(next.day).toBe(DAY_ONE);
	});
	it('goes past done and skipped steps, and on to the next chapter', () => {
		let path = doneAll(EMPTY_PATH, chapterSteps(DAY_ONE, 'intermediate').slice(0, 2));
		path = applyStep(path, { step: 'day-1:traps', outcome: 'skipped' }, 'intermediate', 1);
		expect(nextStep(path, 'intermediate')!.step).toBe('day-1:say-in-english');
		path = doneAll(path, ['day-1:say-in-english', 'day-1:voice-messages']);
		expect(chapterFinished(path, DAY_ONE, 'intermediate')).toBe(true);
		expect(nextStep(path, 'intermediate')!.day).toBe(DAY_TWO);
	});
	it('brings a chapter back when every step was skipped', () => {
		const path = chapterSteps(DAY_ONE, 'intermediate').reduce((p, step) => applyStep(p, { step, outcome: 'skipped' }, 'intermediate', 1), EMPTY_PATH);
		expect(chapterFinished(path, DAY_ONE, 'intermediate')).toBe(false);
		expect(nextStep(path, 'intermediate')!.step).toBe('day-1:listen-act');
	});
	it('is null when every released chapter is finished', () => {
		const path = readPath(progressWith(releasedChapters().map(day => day.id)), 'intermediate');
		expect(nextStep(path, 'intermediate')).toBeNull();
		expect(nextStep(path, 'intermediate', true)?.day.ready).toBe(DAY_FOUR.ready ? undefined : false);
	});
});

describe('reading older records', () => {
	it('counts each finished day as its five steps done, in the learner’s version now', () => {
		const path = readPath(progressWith(['day-1', 'day-2']), 'professional');
		expect(stepsDone(path)).toBe(10);
		expect(path.done['day-2:choose-persuade']).toEqual(['p', 0]);
		expect(nextStep(path, 'professional')!.day).toBe(DAY_THREE);
	});
	it('does not send a learner back to Chapter 1 after a version change', () => {
		// Finished in Intermediate, then switched to Professional: the finished days still count.
		const stored = doneAll(EMPTY_PATH, [...chapterSteps(DAY_ONE, 'intermediate'), ...chapterSteps(DAY_TWO, 'intermediate')]);
		const path = readPath({ ...progressWith(['day-1', 'day-2']), english_path_v1: stored }, 'professional');
		expect(nextStep(path, 'professional')!.day).toBe(DAY_THREE);
	});
	it('reads an old record that only kept the last day', () => {
		const path = readPath({ english_progress_v1: { ...EMPTY_PROGRESS, lastThemeId: 'day-2' } }, 'intermediate');
		expect(stepsDone(path)).toBe(10);
	});
	it('carries over a daily lesson under way, keeping its start', () => {
		let session = startSession(15, new Date('2026-10-20T10:00:00Z'), DAY_TWO, 'intermediate');
		session = finishModule(session, 'listen-act', 'done');
		session = finishModule(session, 'phrases', 'skipped');
		const path = readPath({ english_day_v1: session }, 'intermediate');
		expect(path.done['day-2:listen-act']).toEqual(['i', 0]);
		expect(path.skipped).toEqual(['day-2:phrases']);
		expect(path.current).toEqual({ step: 'day-2:say-in-english', track: 'intermediate', startedAt: session.startedAt, replay: false });
	});
	it('carries over a lesson at the recap with nothing under way', () => {
		let session = startSession(15, new Date(), DAY_ONE, 'intermediate');
		for (const id of ['listen-act', 'phrases', 'say-in-english', 'voice-messages'] as const) session = finishModule(session, id, 'done');
		expect(session.stage).toBe('recap');
		const path = readPath({ english_day_v1: session }, 'intermediate');
		expect(path.current).toBeNull();
		// The 15-minute set left Traps out: it is the next step.
		expect(nextStep(path, 'intermediate')!.step).toBe('day-1:traps');
	});
	it('ignores the old lesson once the path is saved, and still adds days finished on old code', () => {
		const stored = doneAll(EMPTY_PATH, ['day-1:listen-act']);
		const session = finishModule(startSession(15, new Date(), DAY_ONE, 'intermediate'), 'phrases', 'done');
		const path = readPath({ english_path_v1: stored, english_day_v1: session, ...progressWith(['day-1']) }, 'intermediate');
		expect(path.current).toBeNull();
		expect(stepsDone(path)).toBe(5);
		expect(path.done['day-1:listen-act']).toEqual(['i', 1]);
	});
	it('reads a broken record as empty', () => {
		expect(readPath({ english_path_v1: { done: 'x' } }, 'intermediate')).toEqual(EMPTY_PATH);
		expect(readPath(null, 'intermediate')).toEqual(EMPTY_PATH);
	});
});

describe('results', () => {
	it('marks a step done and clears it from under way', () => {
		let path = startStep(EMPTY_PATH, 'day-1:listen-act', 'intermediate', new Date('2026-10-25T08:00:00Z'));
		expect(path.current).toMatchObject({ step: 'day-1:listen-act', replay: false });
		path = applyStep(path, { step: 'day-1:listen-act', outcome: 'done' }, 'intermediate', 20000);
		expect(path).toEqual({ done: { 'day-1:listen-act': ['i', 20000] }, skipped: [], current: null });
		expect(doneOn(path, 20000)).toBe(true);
		expect(doneOn(path, 20001)).toBe(false);
	});
	it('keeps the start when the same step is started again', () => {
		const path = startStep(EMPTY_PATH, 'day-1:phrases', 'intermediate', new Date('2026-10-25T08:00:00Z'));
		expect(startStep(path, 'day-1:phrases', 'intermediate', new Date('2026-10-25T09:00:00Z'))).toBe(path);
	});
	it('marks a replay, which only moves the step’s day', () => {
		let path = doneAll(EMPTY_PATH, ['day-1:phrases'], 5);
		path = startStep(path, 'day-1:phrases', 'intermediate');
		expect(path.current?.replay).toBe(true);
		path = applyStep(path, { step: 'day-1:phrases', outcome: 'done' }, 'intermediate', 9);
		expect(path.done['day-1:phrases']).toEqual(['i', 9]);
		expect(stepsDone(path)).toBe(1);
	});
	it('a skip never undoes a step done, and doing a skipped step clears the skip', () => {
		let path = doneAll(EMPTY_PATH, ['day-1:phrases']);
		path = applyStep(path, { step: 'day-1:phrases', outcome: 'skipped' }, 'intermediate', 2);
		expect(path.skipped).toEqual([]);
		path = applyStep(path, { step: 'day-1:traps', outcome: 'skipped' }, 'intermediate', 2);
		path = applyStep(path, { step: 'day-1:traps', outcome: 'skipped' }, 'intermediate', 2);
		expect(path.skipped).toEqual(['day-1:traps']);
		path = applyStep(path, { step: 'day-1:traps', outcome: 'done' }, 'intermediate', 3);
		expect(path.skipped).toEqual([]);
	});
	it('merging the same result twice changes nothing (two tabs)', () => {
		const once = applyStep(EMPTY_PATH, { step: 'day-1:phrases', outcome: 'done' }, 'intermediate', 4);
		expect(applyStep(once, { step: 'day-1:phrases', outcome: 'done' }, 'intermediate', 4)).toEqual(once);
	});
	it('keeps another step under way when a different one finishes', () => {
		const path = startStep(EMPTY_PATH, 'day-1:traps', 'intermediate');
		expect(applyStep(path, { step: 'day-1:phrases', outcome: 'done' }, 'intermediate', 1).current?.step).toBe('day-1:traps');
	});
});

describe('replays', () => {
	it('offers nothing before any step is done', () => {
		expect(replayPick(EMPTY_PATH, 'intermediate')).toBeNull();
	});
	it('offers a skipped step first', () => {
		let path = doneAll(EMPTY_PATH, ['day-1:listen-act']);
		path = applyStep(path, { step: 'day-1:traps', outcome: 'skipped' }, 'intermediate', 1);
		expect(replayPick(path, 'intermediate')!.step).toBe('day-1:traps');
	});
	it('then the step done longest ago, speaking first on a tie, and takes turns', () => {
		let path = readPath(progressWith(releasedChapters().map(day => day.id)), 'intermediate');
		const first = replayPick(path, 'intermediate')!;
		expect(first.module.skill).toBe('speaking');
		path = applyStep(path, { step: first.step, outcome: 'done' }, 'intermediate', 30000);
		expect(replayPick(path, 'intermediate')!.step).not.toBe(first.step);
	});
});

describe('the old progress record', () => {
	it('counts each step for the greeting and the coach, and adds the day only when the chapter ends', () => {
		const now = new Date('2026-10-25T10:00:00Z');
		let progress = recordStep(EMPTY_PROGRESS, 'day-1', { skill: 'listening', correct: 4, total: 5 }, false, now);
		expect(progress).toMatchObject({ sessionsCompleted: 1, lastCompletedAt: now.toISOString(), lastThemeId: 'day-1', lastResult: 'strong', finishedDays: [] });
		expect(progress.recent).toEqual([{ listening: { correct: 4, total: 5 }, speaking: { correct: 0, total: 0 } }]);
		progress = recordStep(progress, 'day-1', null, true, now);
		expect(progress.finishedDays).toEqual(['day-1']);
		expect(progress.lastResult).toBe('strong');
		expect(recordStep(progress, 'day-1', null, true, now).finishedDays).toEqual(['day-1']);
	});
	it('keeps the days of a record that only kept the last one', () => {
		const progress = recordStep({ ...EMPTY_PROGRESS, lastThemeId: 'day-2' }, 'day-3', null, true);
		expect(progress.finishedDays).toEqual(['day-1', 'day-2', 'day-3']);
	});
});

describe('size', () => {
	it('stays small with every step of every chapter done in both versions', () => {
		let path = EMPTY_PATH;
		for (const day of DAYS) for (const track of ['intermediate', 'professional'] as const) for (const step of chapterSteps(day, track)) path = applyStep(path, { step, outcome: 'done' }, track, 21000);
		path = startStep(path, 'day-1:phrases', 'intermediate');
		expect(PathSchema.safeParse(path).success).toBe(true);
		expect(JSON.stringify(path).length).toBeLessThan(1500);
	});
	it('stops adding new steps at the cap', () => {
		const done = Object.fromEntries(Array.from({ length: MAX_DONE }, (_, i) => [`k${i}`, ['i', 1]]));
		const path = applyStep({ ...EMPTY_PATH, done } as Path, { step: stepId(DAY_ONE, 'phrases'), outcome: 'done' }, 'intermediate', 1);
		expect(stepsDone(path)).toBe(MAX_DONE);
	});
});

describe('the journey by goal', () => {
	it('puts the goal’s story first, then the others', () => {
		expect(arcOrder('abroad')[0]).toBe('abroad');
		expect(arcOrder('unsure')[0]).toBe('everyday');
		expect(arcOrder(null)[0]).toBe('travel');
		expect(arcOrder('nonsense')).toEqual(arcOrder('travel'));
	});
	it('only has Travel until another story is ready, whatever the goal', () => {
		for (const reason of ['travel', 'everyday', 'unsure', 'abroad', 'work', 'exam', null]) {
			expect(releasedChapters(false, reason)).toEqual(releasedChapters());
			expect(chapterNumber(DAY_TWO, false, reason)).toBe(2);
		}
	});
});
