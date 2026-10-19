/**
 * What each module shows on a given day and version. Day 1's content is the modules' own
 * (built into each module file); later days bring theirs in `days/<day>.ts`.
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
import * as dayTwo from './days/day-2';
import type { Track } from './day';

export function phrasesFor(dayId: string, track: Track = 'intermediate'): Phrase[] {
	if (dayId === 'day-2') return dayTwo.PHRASES[track];
	return DAY_ONE_PHRASES;
}

export function connectSetFor(dayId: string, track: Track = 'intermediate'): ConnectSet {
	if (dayId === 'day-2') return dayTwo.CONNECT[track];
	return DAY_ONE_SET;
}

/** Persian-speaker traps: the lesson's set, or (`all`) every one the day has, for the Module lab. */
export function trapsFor(dayId: string, all = false): Trap[] {
	if (dayId === 'day-2') return all ? dayTwo.TRAPS : dayTwo.TRAPS.filter(trap => dayTwo.LESSON_TRAP_IDS.includes(trap.id));
	return DAY_ONE_TRAPS;
}

/** Say it in English: the lesson's messages for this day and version, or (`all`) every one, for the Module lab. */
export function sayItemsFor(dayId: string, track: Track = 'intermediate', all = false): SayItem[] {
	if (dayId === 'day-2') {
		const ids = dayTwo.LESSON_SAY_IDS[track];
		return all || !ids ? dayTwo.SAY[track] : dayTwo.SAY[track].filter(item => ids.includes(item.id));
	}
	return DAY_ONE_SAY;
}
/** Any day's message, by its id (ids are unique across days): what the server checks a try against. */
export function sayItemById(id: string): SayItem | null {
	return [...DAY_ONE_SAY, ...dayTwo.SAY.intermediate, ...dayTwo.SAY.professional].find(item => item.id === id) ?? null;
}

/** Voice messages: the lesson's messages for this day, or (`all`) every one, for the Module lab. */
export function voiceMessagesFor(dayId: string, all = false): VoiceMessage[] {
	if (dayId === 'day-2') return all ? dayTwo.MESSAGES : dayTwo.MESSAGES.filter(message => dayTwo.LESSON_MESSAGE_IDS.includes(message.id));
	return DAY_ONE_MESSAGES;
}
/** The Module lab's introduction for a day's voice messages (null: the module's own, Day 1's). */
export const voiceMessagesIntro = (dayId: string): DisplayText | null => (dayId === 'day-2' ? dayTwo.MESSAGES_INTRO : null);
/** Any day's voice message, by its id (ids are unique across days): what the server checks a reply against. */
export function voiceMessageById(id: string): VoiceMessage | null {
	return [...DAY_ONE_MESSAGES, ...dayTwo.MESSAGES].find(message => message.id === id) ?? null;
}

/** Listen and retell: the day's story (Day 2 Professional), or null when the day has none. */
export function retellPieceFor(dayId: string): RetellPiece | null {
	return dayId === 'day-2' ? dayTwo.RETELL : null;
}
/** Every story: the Module lab's own, then the daily lessons'. */
export const ALL_RETELL_PIECES: RetellPiece[] = [...RETELL_PIECES, dayTwo.RETELL];
/** Any story, by its id (ids are unique): what the server narrates and checks a retelling against. */
export function retellPieceById(id: string): RetellPiece | null {
	return ALL_RETELL_PIECES.find(piece => piece.id === id) ?? null;
}

/** Choose and persuade: the day's choice (Day 1 and the Module lab: the apartments). */
export function persuadeSetFor(dayId: string): PersuadeSet {
	return dayId === 'day-2' ? dayTwo.PERSUADE : APARTMENTS;
}
/** Any day's choice, by its id: what the server objects with and checks against. */
export function persuadeSetById(id: string | null | undefined): PersuadeSet | null {
	return [APARTMENTS, dayTwo.PERSUADE].find(set => set.id === (id ?? APARTMENTS.id)) ?? null;
}

/** Role-play with a twist: the day's scene (Day 1 and the pilot: the hotel). */
export function roleSceneFor(dayId: string): RoleScene {
	return dayId === 'day-2' ? dayTwo.CALL : HOTEL_SCENE;
}
/** Any scene, by its id (the hotel when none is given): what the routes play, voice and review. */
export const ALL_ROLE_SCENES: RoleScene[] = [HOTEL_SCENE, dayTwo.CALL];
export function roleSceneById(id: string | null | undefined): RoleScene | null {
	return ALL_ROLE_SCENES.find(scene => scene.id === (id ?? HOTEL_SCENE.id)) ?? null;
}
