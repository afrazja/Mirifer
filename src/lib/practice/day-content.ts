/**
 * What each module shows on a given day and version. Day 1's content is the modules' own
 * (built into each module file); later days bring theirs in `days/<day>.ts`, listed in DAY_CONTENT.
 * A day that leaves a module out falls back to Day 1's (the Module lab can still show it).
 */
import { PHRASES as DAY_ONE_PHRASES, type Phrase } from './phrases';
import { DAY_ONE_SET, type ConnectSet } from './listen-connect';
import { TRAPS as DAY_ONE_TRAPS, type Trap } from './traps';
import { ITEMS as DAY_ONE_SAY, type SayItem } from './say-in-english';
import { MESSAGES as DAY_ONE_MESSAGES, type VoiceMessage } from './voice-messages';
import { RETELL_PIECES, type RetellPiece } from './retell';
import { APARTMENTS, type PersuadeSet } from './persuade';
import { HOTEL_SCENE, type RoleScene } from './roleplay';
import type { DisplayText } from './hotel';
import * as dayOne from './days/day-1';
import * as dayTwo from './days/day-2';
import * as dayThree from './days/day-3';
import * as everydayOne from './days/everyday-1';
import * as dayFour from './days/day-4';
import type { Track } from './day';

/** One later day's content: every part optional; a version without its own set uses the other's. */
export interface DayContent {
	PHRASES?: Partial<Record<Track, Phrase[]>>;
	CONNECT?: Partial<Record<Track, ConnectSet>>;
	TRAPS?: Trap[];
	LESSON_TRAP_IDS?: string[];
	SAY?: Partial<Record<Track, SayItem[]>>;
	LESSON_SAY_IDS?: Partial<Record<Track, string[] | null>>;
	MESSAGES?: VoiceMessage[];
	LESSON_MESSAGE_IDS?: string[];
	MESSAGES_INTRO?: DisplayText;
	RETELL?: RetellPiece;
	PERSUADE?: PersuadeSet;
	CALL?: RoleScene;
	/** A role-play per version, when they differ (Everyday 1); else `CALL` for both. */
	CALLS?: Partial<Record<Track, RoleScene>>;
}

/** Every later day's content, by day id. */
export const DAY_CONTENT: Record<string, DayContent> = { 'day-1': dayOne, 'day-2': dayTwo, 'day-3': dayThree, 'day-4': dayFour, 'everyday-1': everydayOne };
const contentOf = (dayId: string): DayContent => DAY_CONTENT[dayId] ?? {};
const LATER: DayContent[] = Object.values(DAY_CONTENT);
/** This version's set, or the day's other version's. */
const either = <T>(sets: Partial<Record<Track, T>> | undefined, track: Track): T | undefined => sets?.[track] ?? sets?.intermediate ?? sets?.professional;

export function phrasesFor(dayId: string, track: Track = 'intermediate'): Phrase[] {
	return either(contentOf(dayId).PHRASES, track) ?? DAY_ONE_PHRASES;
}

export function connectSetFor(dayId: string, track: Track = 'intermediate'): ConnectSet {
	return either(contentOf(dayId).CONNECT, track) ?? DAY_ONE_SET;
}

/** Persian-speaker traps: the lesson's set, or (`all`) every one the day has, for the Module lab. */
export function trapsFor(dayId: string, all = false): Trap[] {
	const { TRAPS, LESSON_TRAP_IDS } = contentOf(dayId);
	if (!TRAPS) return DAY_ONE_TRAPS;
	return all || !LESSON_TRAP_IDS ? TRAPS : TRAPS.filter(trap => LESSON_TRAP_IDS.includes(trap.id));
}

/** Say it in English: the lesson's messages for this day and version, or (`all`) every one, for the Module lab. */
export function sayItemsFor(dayId: string, track: Track = 'intermediate', all = false): SayItem[] {
	const { SAY, LESSON_SAY_IDS } = contentOf(dayId);
	const items = either(SAY, track);
	if (!items) return DAY_ONE_SAY;
	const ids = SAY?.[track] ? LESSON_SAY_IDS?.[track] : null;
	return all || !ids ? items : items.filter(item => ids.includes(item.id));
}
/** Any day's message, by its id (ids are unique across days): what the server checks a try against. */
export function sayItemById(id: string): SayItem | null {
	return [...DAY_ONE_SAY, ...LATER.flatMap(day => Object.values(day.SAY ?? {}).flat())].find(item => item.id === id) ?? null;
}

/** Voice messages: the lesson's messages for this day, or (`all`) every one, for the Module lab. */
export function voiceMessagesFor(dayId: string, all = false): VoiceMessage[] {
	const { MESSAGES, LESSON_MESSAGE_IDS } = contentOf(dayId);
	if (!MESSAGES) return DAY_ONE_MESSAGES;
	return all || !LESSON_MESSAGE_IDS ? MESSAGES : MESSAGES.filter(message => LESSON_MESSAGE_IDS.includes(message.id));
}
/** The Module lab's introduction for a day's voice messages (null: the module's own, Day 1's). */
export const voiceMessagesIntro = (dayId: string): DisplayText | null => contentOf(dayId).MESSAGES_INTRO ?? null;
/** Any day's voice message, by its id (ids are unique across days): what the server checks a reply against. */
export function voiceMessageById(id: string): VoiceMessage | null {
	return [...DAY_ONE_MESSAGES, ...LATER.flatMap(day => day.MESSAGES ?? [])].find(message => message.id === id) ?? null;
}

/** Listen and retell: the day's story, or null when the day has none. */
export function retellPieceFor(dayId: string): RetellPiece | null {
	return contentOf(dayId).RETELL ?? null;
}
/** Every story: the Module lab's own, then the daily lessons'. */
export const ALL_RETELL_PIECES: RetellPiece[] = [...RETELL_PIECES, ...LATER.flatMap(day => (day.RETELL ? [day.RETELL] : []))];
/** Any story, by its id (ids are unique): what the server narrates and checks a retelling against. */
export function retellPieceById(id: string): RetellPiece | null {
	return ALL_RETELL_PIECES.find(piece => piece.id === id) ?? null;
}

/** Choose and persuade: the day's choice (Day 1 and the Module lab: the apartments). */
export function persuadeSetFor(dayId: string): PersuadeSet {
	return contentOf(dayId).PERSUADE ?? APARTMENTS;
}
const ALL_PERSUADE_SETS: PersuadeSet[] = [APARTMENTS, ...LATER.flatMap(day => (day.PERSUADE ? [day.PERSUADE] : []))];
/** Any day's choice, by its id: what the server objects with and checks against. */
export function persuadeSetById(id: string | null | undefined): PersuadeSet | null {
	return ALL_PERSUADE_SETS.find(set => set.id === (id ?? APARTMENTS.id)) ?? null;
}

/** Role-play with a twist: the day's scene (Day 1 and the pilot: the hotel). */
export function roleSceneFor(dayId: string, track: Track = 'intermediate'): RoleScene {
	const { CALLS, CALL } = contentOf(dayId);
	return CALLS?.[track] ?? CALL ?? HOTEL_SCENE;
}
/** Any scene, by its id (the hotel when none is given): what the routes play, voice and review. */
export const ALL_ROLE_SCENES: RoleScene[] = [HOTEL_SCENE, ...LATER.flatMap(day => [...(day.CALL ? [day.CALL] : []), ...Object.values(day.CALLS ?? {})])];
export function roleSceneById(id: string | null | undefined): RoleScene | null {
	return ALL_ROLE_SCENES.find(scene => scene.id === (id ?? HOTEL_SCENE.id)) ?? null;
}
