/**
 * Lesson goals: what the learner will be able to do after a lesson ("Say
 * your age"), shown on the start screen, ticked off as the dialogue moves
 * past the lines that practise each one, and listed again at the end.
 */
import type { LessonGoal } from '$stores/lesson';

export interface GoalProgress {
	goal: LessonGoal;
	done: boolean;
}

/**
 * A goal is done once the learner has moved past every line that practises
 * it. `currentIndex` is the position of the line being taught now; a
 * finished lesson has every goal done, whatever the position.
 */
export function goalProgress(goals: LessonGoal[] | undefined, currentIndex: number, lessonDone: boolean): GoalProgress[] {
	return (goals ?? []).map((goal) => ({
		goal,
		done: lessonDone || goal.sentences.every((position) => position < currentIndex)
	}));
}

export const goalText = (goal: LessonGoal, language: 'en' | 'fa'): string =>
	language === 'fa' && goal.fa ? goal.fa : goal.en;

export const goalsDone = (progress: GoalProgress[]): number => progress.filter((p) => p.done).length;
