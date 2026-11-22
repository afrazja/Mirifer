/**
 * A step's first screen, shown rather than explained (CLAUDE.md, "Short, visual instructions",
 * owner, 2026-11-12): an icon per kind of step, the step's flow in three parts, and Mira's one
 * short line. Pure data, so tests can hold every module type and every note to the rule.
 */
import type { DisplayText } from './hotel';
import type { ModuleId } from './day';

/** The icons StepIcon.svelte draws. */
export const INTRO_ICONS = ['listen', 'speak', 'read', 'repeat', 'check', 'better', 'choose', 'chat', 'build', 'spot', 'tap', 'connect', 'now', 'before', 'goal', 'story', 'time'] as const;
export type IntroIcon = (typeof INTRO_ICONS)[number];

/** One part of a step's flow, or one cue chip: an icon and two or three words. */
export interface IntroChip { icon: IntroIcon; label: DisplayText }

const chip = (icon: IntroIcon, en: string, fa: string): IntroChip => ({ icon, label: { en, fa } });
const LISTEN = chip('listen', 'Listen', 'گوش بده');
const FEEDBACK = chip('check', 'Feedback', 'بازخورد');
const CHECK = chip('check', 'Check', 'بررسی');

/**
 * What each kind of step looks like, in three parts (the first is where the learner starts; the
 * last says what they get, never a filler "Done"). Shown when a step has no cues of its own.
 */
export const STEP_FLOW: Record<ModuleId, readonly [IntroChip, IntroChip, IntroChip]> = {
	'listen-act': [LISTEN, chip('tap', 'Choose', 'انتخاب کن'), chip('connect', 'Connect', 'وصل کن')],
	phrases: [LISTEN, chip('repeat', 'Repeat', 'تکرار کن'), chip('speak', 'Use it', 'به کارش ببر')],
	traps: [chip('spot', 'Spot', 'پیدا کن'), chip('better', 'Fix', 'درستش کن'), chip('speak', 'Say it', 'بگو')],
	'say-in-english': [chip('read', 'Read', 'بخوان'), chip('speak', 'Say it', 'بگو'), FEEDBACK],
	'voice-messages': [LISTEN, chip('speak', 'Reply', 'جواب بده'), CHECK],
	'listen-retell': [LISTEN, chip('speak', 'Retell', 'بازگو کن'), FEEDBACK],
	'choose-persuade': [chip('choose', 'Choose', 'انتخاب کن'), chip('speak', 'Say why', 'بگو چرا'), FEEDBACK],
	scenario: [chip('read', 'Your role', 'نقش تو'), chip('chat', 'Talk', 'حرف بزن'), FEEDBACK],
	'group-chat': [chip('read', 'Read', 'بخوان'), chip('chat', 'Reply', 'جواب بده'), CHECK],
	'quick-fire': [LISTEN, chip('speak', 'Answer', 'جواب بده'), chip('better', 'Tips', 'نکته‌ها')],
	pitch: [chip('build', 'Build', 'بساز'), chip('better', 'Improve', 'بهترش کن'), chip('speak', 'Say it', 'بگو')],
	'say-it-better': [chip('speak', 'Speak', 'بگو'), chip('better', 'Improve', 'بهترش کن'), chip('repeat', 'Again', 'دوباره')]
};

/** The icon at the head of each kind of step. */
export const MODULE_ICON: Record<ModuleId, IntroIcon> = {
	'listen-act': 'listen', phrases: 'repeat', traps: 'spot', 'say-in-english': 'read', 'voice-messages': 'chat',
	'listen-retell': 'listen', 'choose-persuade': 'choose', scenario: 'chat', 'group-chat': 'chat', 'quick-fire': 'speak',
	pitch: 'build', 'say-it-better': 'better'
};

/** Mira's note: one short sentence (owner: about 12 words or fewer). */
export const NOTE_MAX_WORDS = 12;
/** Words in an English line, counting a hyphenated or apostrophe word once. */
export const wordCount = (text: string) => text.replace(/[`“”"]/g, '').split(/\s+/).filter(word => /[\p{L}\p{N}]/u.test(word)).length;
