/**
 * What each module shows on a given day and version. Day 1's content is the modules' own
 * (built into each module file); later days bring theirs in `days/<day>.ts`.
 */
import { PHRASES as DAY_ONE_PHRASES, type Phrase } from './phrases';
import { DAY_ONE_SET, type ConnectSet } from './listen-connect';
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
