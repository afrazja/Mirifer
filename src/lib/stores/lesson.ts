import { writable } from 'svelte/store';

export interface Sentence {
	id: number;
	role: 'received' | 'sent';
	audioText?: string;
	targetText?: string;
	translation: string;
	translationFa?: string;
	hint?: string;
	hintFa?: string;
	difficulty?: string;
}

/** Example line in a grammar moment — German plus optional glosses. */
export interface GrammarExample {
	de: string;
	en?: string;
	fa?: string;
}

/**
 * The end-of-lesson "grammar moment": one rule, consolidated after the
 * learner has already used it in conversation. `basicsKey` deep-links into
 * a Basics category for the full reference.
 */
export interface GrammarNote {
	title: string;
	titleFa?: string;
	explanation: string;
	explanationFa?: string;
	examples?: GrammarExample[];
	basicsKey?: string;
}

/** Something the learner can do after the lesson; see LessonGoalSchema. */
export interface LessonGoal {
	id: string;
	en: string;
	fa: string;
	/** 0-based positions of the sentences that practise it. */
	sentences: number[];
}

export interface Lesson {
	title: string;
	titleFa?: string;
	sentences: Sentence[];
	/** The scenario: who the learner is talking to and what they are doing. */
	description?: string;
	descriptionFa?: string;
	/** What the learner will be able to do, in the order the dialogue teaches it. */
	goals?: LessonGoal[];
	grammarFocus?: string;
	grammarFocusFa?: string;
	grammarNote?: GrammarNote;
	/** Pre-taught vocabulary shown before the dialogue. A1 only. */
	words?: LessonChunk[];
	/** Word pairs taught as single units. Every level. */
	collocations?: LessonChunk[];
	/** Short reading texts. From A2 middle upward. */
	paragraphs?: LessonParagraph[];
	difficulty?: string;
}

export interface LessonChunk {
	de: string;
	en: string;
	fa: string;
}

export interface LessonParagraph {
	de: string;
	en: string;
	fa: string;
	questions: Array<{ q: string; options: string[]; correct: number }>;
}

export interface LessonState {
	currentLesson: Lesson | null;
	glossary: Record<string, { en: string; fa: string }>;
	isLoading: boolean;
}

const initialState: LessonState = {
	currentLesson: null,
	glossary: {},
	isLoading: false
};

export const lessonStore = writable<LessonState>(initialState);
